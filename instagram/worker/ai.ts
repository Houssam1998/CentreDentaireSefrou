/**
 * Assistant IA du Studio : relais vers l'API Claude (Anthropic).
 *
 * Le navigateur pilote la conversation et exécute les outils (ils modifient l'éditeur) ;
 * ce Worker ajoute ce que le navigateur ne doit pas contrôler : la clé API, les consignes (aiPrompt.ts),
 * la liste des outils, le modèle, et un quota quotidien par personne (table D1 ai_usage).
 *
 * GET  /api/ai → { enabled, model, used, limit }
 * POST /api/ai { messages } → un tour du modèle, en flux NDJSON :
 *   {"t":"text","v":"…"}  morceau de réponse
 *   {"t":"done","message":{content, stop_reason, stop_details, model}}
 *   {"t":"error","error":"…","retry":true|false}
 */
import Anthropic from '@anthropic-ai/sdk';
import type { BetaMessageParam, BetaUsage } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { AI_TOOLS } from '../studio/ai/toolDefs';
import { SYSTEM_PROMPT } from './aiPrompt';

export interface AiEnv {
  DB: D1Database;
  /** Secret : npx wrangler secret put ANTHROPIC_API_KEY --config instagram/wrangler.jsonc */
  ANTHROPIC_API_KEY?: string;
  /** Modèle (défaut claude-opus-5-5 ; moins cher : claude-sonnet-5-5 ou claude-haiku-5-5). */
  AI_MODEL?: string;
  /** Nombre d'échanges avec le modèle par personne et par jour (défaut 200). */
  AI_DAILY_LIMIT?: string;
}

export const DEFAULT_MODEL = 'claude-opus-5-5';
const MAX_BODY = 4_000_000; // octets : une conversation avec quelques aperçus d'images
const MAX_MESSAGES = 160;

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });

const today = () => new Date().toISOString().slice(0, 10);
const limitOf = (env: AiEnv) => Math.max(1, Number(env.AI_DAILY_LIMIT) || 200);
const modelOf = (env: AiEnv) => env.AI_MODEL?.trim() || DEFAULT_MODEL;

async function usedToday(env: AiEnv, email: string) {
  const row = await env.DB.prepare('SELECT requests FROM ai_usage WHERE email = ? AND day = ?').bind(email, today()).first<{ requests: number }>();
  return row?.requests ?? 0;
}

export async function aiStatus(env: AiEnv, email: string) {
  return json({ enabled: !!env.ANTHROPIC_API_KEY, model: modelOf(env), used: await usedToday(env, email), limit: limitOf(env) });
}

/** Vérifie la forme de la conversation envoyée par le navigateur (le contenu détaillé est validé par l'API). */
export function checkMessages(body: unknown): BetaMessageParam[] | string {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || !messages.length) return 'Conversation vide';
  if (messages.length > MAX_MESSAGES) return 'Conversation trop longue : commencez-en une nouvelle';
  for (const m of messages) {
    if (!m || typeof m !== 'object') return 'Message invalide';
    const { role, content } = m as { role?: unknown; content?: unknown };
    if (role !== 'user' && role !== 'assistant') return 'Rôle de message invalide';
    if (typeof content !== 'string' && !Array.isArray(content)) return 'Contenu de message invalide';
  }
  if ((messages[0] as { role: string }).role !== 'user') return 'La conversation doit commencer par un message de l’utilisateur';
  return messages as BetaMessageParam[];
}

/** Message d'erreur compréhensible pour l'équipe ; retry = le navigateur peut relancer ce tour tel quel. */
export function friendlyError(err: unknown): { error: string; retry: boolean } {
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) return { error: 'La clé API Claude est refusée : vérifiez ANTHROPIC_API_KEY.', retry: false };
  if (err instanceof Anthropic.RateLimitError) return { error: 'Trop de demandes en même temps : réessayez dans une minute.', retry: false };
  if (err instanceof Anthropic.BadRequestError) return { error: `Demande refusée par le service IA : ${err.message.slice(0, 300)}`, retry: false };
  if (err instanceof Anthropic.InternalServerError) return { error: 'Le service IA est surchargé : réessayez dans un instant.', retry: false };
  if (err instanceof Anthropic.APIConnectionError) return { error: 'Le service IA est injoignable : réessayez dans un instant.', retry: true };
  if (err instanceof Anthropic.APIError) return { error: `Erreur du service IA (${err.status ?? '?'}).`, retry: false };
  // Réponse d'outil illisible (flux interrompu) : on peut relancer le même tour
  return { error: 'Réponse interrompue.', retry: true };
}

async function addUsage(env: AiEnv, email: string, u: BetaUsage | undefined) {
  if (!u) return;
  await env.DB.prepare(
    'UPDATE ai_usage SET input_tokens = input_tokens + ?, output_tokens = output_tokens + ?, cache_read_tokens = cache_read_tokens + ?, cache_write_tokens = cache_write_tokens + ? WHERE email = ? AND day = ?',
  )
    .bind(u.input_tokens ?? 0, u.output_tokens ?? 0, u.cache_read_input_tokens ?? 0, u.cache_creation_input_tokens ?? 0, email, today())
    .run();
}

/** Refus de sécurité : le service bascule tout seul sur un autre modèle (selon le modèle choisi). */
const supportsFallbacks = (model: string) => /^claude-(opus-5|sonnet-5-5|fable-5)/.test(model);

export async function aiTurn(req: Request, env: AiEnv, email: string, ctx?: Pick<ExecutionContext, 'waitUntil'>): Promise<Response> {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'Assistant IA non configuré : ajoutez la clé ANTHROPIC_API_KEY.' }, 503);
  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: 'Conversation trop lourde : commencez-en une nouvelle.' }, 413);
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Requête illisible' }, 400); }
  const messages = checkMessages(body);
  if (typeof messages === 'string') return json({ error: messages }, 400);

  // Quota : on réserve l'échange avant d'appeler le modèle
  const limit = limitOf(env);
  if ((await usedToday(env, email)) >= limit) return json({ error: `Limite quotidienne atteinte (${limit} échanges). Réessayez demain.` }, 429);
  await env.DB.prepare('INSERT INTO ai_usage (email, day, requests) VALUES (?, ?, 1) ON CONFLICT (email, day) DO UPDATE SET requests = requests + 1')
    .bind(email, today())
    .run();

  const model = modelOf(env);
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2 });
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  let open = true;
  let stream: ReturnType<typeof client.beta.messages.stream> | null = null;
  // Navigateur parti (onglet fermé) : on arrête la génération pour ne pas payer une réponse que personne ne lit
  const stop = () => { open = false; stream?.abort(); };
  req.signal?.addEventListener('abort', stop);
  const send = async (event: unknown) => {
    if (!open) return;
    try { await writer.write(enc.encode(`${JSON.stringify(event)}\n`)); } catch { stop(); }
  };

  const run = async () => {
    const s = client.beta.messages.stream({
      model,
      max_tokens: 32000,
      system: [{ type: 'text', text: SYSTEM_PROMPT }],
      tools: AI_TOOLS,
      messages,
      output_config: { effort: 'medium' },
      // Mise en cache automatique : consignes, outils et début de conversation ne sont facturés qu'une fois
      cache_control: { type: 'ephemeral' },
      ...(supportsFallbacks(model) ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    });
    stream = s;
    s.on('text', (delta) => { void send({ t: 'text', v: delta }); });
    try {
      const message = await s.finalMessage();
      await addUsage(env, email, message.usage);
      await send({ t: 'done', message: { content: message.content, stop_reason: message.stop_reason, stop_details: message.stop_details ?? null, model: message.model } });
    } catch (err) {
      if (!open) return; // arrêt volontaire : le navigateur est parti
      console.error('IA :', err);
      await send({ t: 'error', ...friendlyError(err) });
    } finally {
      open = false;
      await writer.close().catch(() => {});
    }
  };
  // Le flux reste ouvert tant que le navigateur lit la réponse ; waitUntil garantit la fin du travail
  // (dont l'enregistrement de la consommation) même si la connexion se ferme.
  const job = run();
  ctx?.waitUntil(job);
  return new Response(readable, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
