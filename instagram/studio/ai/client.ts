/**
 * Assistant IA : conversation et boucle d'outils, côté navigateur.
 *
 * À chaque message : on ajoute l'état du Studio, on demande un tour au modèle (POST /api/ai, réponse en flux),
 * on exécute les outils qu'il appelle, on lui renvoie les résultats… jusqu'à sa réponse finale (8 tours au plus).
 * La conversation n'est jamais réécrite, seulement complétée (le modèle en a besoin pour garder le fil).
 * Tout ce que l'IA modifie pendant une demande forme une seule étape « Annuler ».
 */
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { BetaContentBlock, BetaMessageParam, BetaToolResultBlockParam, BetaToolUseBlock, BetaStopReason } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import { useEditor, undo } from '../store/editor';
import type { Project } from '../model/types';
import { stateBlock } from './snapshot';
import { runTool, READ_ONLY } from './tools';

const MAX_TURNS = 8;
const MAX_CONVERSATION = 3_500_000; // caractères (limite du Worker : 4 Mo)

export interface Bubble { id: string; role: 'user' | 'assistant' | 'tool' | 'error' | 'info'; text: string }

interface AssistantState {
  status: 'unknown' | 'off' | 'ready';
  statusText: string;
  model: string;
  used: number;
  limit: number;
  messages: BetaMessageParam[];
  bubbles: Bubble[];
  busy: boolean;
  /** Création telle que l'IA l'a laissée : « Annuler ce que l'IA a fait » tant que rien n'a changé depuis. */
  lastResult: Project | null;
}

export const useAssistant = create<AssistantState>(() => ({
  status: 'unknown', statusText: '', model: '', used: 0, limit: 0, messages: [], bubbles: [], busy: false, lastResult: null,
}));

const set = useAssistant.setState;
const get = useAssistant.getState;
const bubble = (role: Bubble['role'], text: string) => {
  const b = { id: nanoid(6), role, text };
  set((s) => ({ bubbles: [...s.bubbles, b] }));
  return b.id;
};
const appendTo = (id: string, text: string) => set((s) => ({ bubbles: s.bubbles.map((b) => (b.id === id ? { ...b, text: b.text + text } : b)) }));
const dropIfEmpty = (id: string) => set((s) => ({ bubbles: s.bubbles.filter((b) => b.id !== id || b.text.trim()) }));

const TOOL_LABELS: Record<string, string> = {
  get_page: 'Je lis la page…', view_design: 'Je regarde le visuel…', get_template: 'Je consulte le modèle…', create_post: 'Je crée la page…',
  edit_elements: 'Je retouche les éléments…', add_element: 'J’ajoute un élément…', remove_elements: 'Je supprime des éléments…',
  set_page_style: 'Je change l’ambiance…', set_caption: 'J’écris la légende…', go_to_page: 'Je change de page…', run_checks: 'Je vérifie la publication…',
};

/* ---------- Disponibilité ---------- */

export async function checkStatus() {
  try {
    const r = await fetch('/api/ai', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!r.ok || !(r.headers.get('Content-Type') ?? '').includes('json')) throw new Error();
    const s = (await r.json()) as { enabled: boolean; model: string; used: number; limit: number };
    set({
      status: s.enabled ? 'ready' : 'off',
      statusText: s.enabled ? '' : 'L’assistant IA n’est pas encore configuré : il manque la clé API Claude (voir instagram/README.md).',
      model: s.model, used: s.used, limit: s.limit,
    });
  } catch {
    set({ status: 'off', statusText: 'L’assistant IA fonctionne dans le Studio en ligne (ou en local avec « npm run ig:cloud »).' });
  }
}

/* ---------- Un tour du modèle (flux NDJSON du Worker) ---------- */

interface TurnMessage { content: BetaContentBlock[]; stop_reason: BetaStopReason | null; model: string }
class TurnError extends Error { constructor(message: string, public retry = false) { super(message); } }

async function callTurn(messages: BetaMessageParam[], onText: (t: string) => void): Promise<TurnMessage> {
  let r: Response;
  try {
    r = await fetch('/api/ai', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages }) });
  } catch {
    throw new TurnError('Connexion internet interrompue.', true);
  }
  if (!r.ok || !r.body) {
    const body = (r.headers.get('Content-Type') ?? '').includes('json') ? ((await r.json()) as { error?: string }) : null;
    throw new TurnError(r.status === 401 ? 'Session expirée : rechargez la page pour vous reconnecter.' : body?.error ?? `Erreur ${r.status}`);
  }
  const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buf += value;
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      const ev = JSON.parse(line) as { t: string; v?: string; message?: TurnMessage; error?: string; retry?: boolean };
      if (ev.t === 'text' && ev.v) onText(ev.v);
      else if (ev.t === 'done' && ev.message) return ev.message;
      else if (ev.t === 'error') throw new TurnError(ev.error ?? 'Erreur du service IA', !!ev.retry);
    }
    if (done) throw new TurnError('Réponse interrompue.', true);
  }
}

/**
 * Contenu à renvoyer au modèle. Si le service a basculé sur un autre modèle en cours de réponse
 * (bloc « fallback »), les blocs internes et les appels d'outils d'avant la bascule ne sont pas renvoyés.
 */
export function echoContent(content: BetaContentBlock[]): BetaContentBlock[] {
  const cut = content.map((b) => b.type).lastIndexOf('fallback' as BetaContentBlock['type']);
  if (cut < 0) return content;
  const internal = new Set(['thinking', 'redacted_thinking', 'tool_use', 'server_tool_use']);
  return content.filter((b, i) => i >= cut || !internal.has(b.type));
}
/** Appels d'outils à exécuter (ceux d'après une éventuelle bascule). */
export function toolCalls(content: BetaContentBlock[]): BetaToolUseBlock[] {
  const cut = content.map((b) => b.type).lastIndexOf('fallback' as BetaContentBlock['type']);
  return content.filter((b, i): b is BetaToolUseBlock => b.type === 'tool_use' && i > cut);
}

/* ---------- Une demande de l'utilisateur ---------- */

function beginBatch() {
  const t = useEditor.temporal.getState();
  const before = useEditor.getState().project;
  const batch = { past: t.pastStates, before, projectId: before.id };
  t.pause();
  return batch;
}
function endBatch(b: ReturnType<typeof beginBatch>) {
  const t = useEditor.temporal.getState();
  t.resume();
  const after = useEditor.getState().project;
  // Création changée entre-temps (Mes créations) : son historique lui appartient, on n'y touche pas
  if (after === b.before || after.id !== b.projectId) return null;
  // Une seule étape d'historique pour toute la demande
  useEditor.temporal.setState({ pastStates: [...b.past, { project: b.before }].slice(-100), futureStates: [] });
  return after;
}

export async function send(text: string) {
  const prompt = text.trim();
  if (!prompt || get().busy || get().status !== 'ready') return;
  if (JSON.stringify(get().messages).length > MAX_CONVERSATION) {
    bubble('info', 'Cette conversation est devenue trop longue. Cliquez sur « Nouvelle conversation » pour continuer.');
    return;
  }
  bubble('user', prompt);
  const messages: BetaMessageParam[] = [...get().messages, { role: 'user', content: [{ type: 'text', text: prompt }, { type: 'text', text: stateBlock() }] }];
  set({ messages, busy: true, lastResult: null });
  const batch = beginBatch();
  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const out = bubble('assistant', '');
      let msg: TurnMessage | null = null;
      for (let attempt = 0; !msg; attempt++) {
        try {
          msg = await callTurn(get().messages, (t) => appendTo(out, t));
        } catch (e) {
          const err = e as TurnError;
          if (err.retry && attempt < 2) { set((s) => ({ bubbles: s.bubbles.map((b) => (b.id === out ? { ...b, text: '' } : b)) })); continue; }
          dropIfEmpty(out);
          bubble('error', err.message);
          return;
        }
      }
      set((s) => ({ used: s.used + 1 }));
      dropIfEmpty(out);
      const calls = toolCalls(msg.content);
      // Réponse refusée ou coupée au milieu d'un appel d'outil : on ne la garde pas dans la conversation
      if (msg.stop_reason === 'refusal') { bubble('error', 'Le service IA a refusé cette demande. Reformulez-la autrement.'); return; }
      if (msg.stop_reason === 'max_tokens' && calls.length) { bubble('error', 'La réponse a été coupée avant la fin. Essayez une demande plus courte.'); return; }
      set((s) => ({ messages: [...s.messages, { role: 'assistant', content: echoContent(msg!.content) }] }));
      if (!calls.length) return;

      const results: BetaToolResultBlockParam[] = [];
      let switched = false;
      for (const call of calls) {
        // Une autre création a été ouverte : on n'agit plus (mais chaque appel reçoit sa réponse)
        if (switched || useEditor.getState().project.id !== batch.projectId) {
          switched = true;
          results.push({ type: 'tool_result', tool_use_id: call.id, content: 'Action annulée : l’utilisateur a ouvert une autre création.', is_error: true });
          continue;
        }
        bubble('tool', TOOL_LABELS[call.name] ?? call.name);
        const r = await runTool(call.name, call.input);
        if (r.isError) console.warn('Outil', call.name, r.content);
        results.push({ type: 'tool_result', tool_use_id: call.id, content: r.content, ...(r.isError ? { is_error: true } : {}) });
        if (!READ_ONLY.has(call.name)) await new Promise((ok) => setTimeout(ok, 60)); // laisse l'éditeur mesurer les textes
      }
      set((s) => ({ messages: [...s.messages, { role: 'user', content: results }] }));
      if (switched) { bubble('info', 'Une autre création a été ouverte : j’ai arrêté.'); return; }
      if (turn === MAX_TURNS - 1) bubble('info', 'J’ai atteint le nombre d’étapes prévu pour une demande. Dites-moi si je dois continuer.');
    }
  } finally {
    const after = endBatch(batch);
    set({ busy: false, lastResult: after });
  }
}

/** Annule d'un coup tout ce que l'IA a fait lors de la dernière demande. */
export function undoAssistant() {
  if (get().lastResult && useEditor.getState().project === get().lastResult) {
    undo();
    set({ lastResult: null });
    bubble('info', 'Modifications de l’assistant annulées.');
  }
}

export function newConversation() {
  if (get().busy) return;
  set({ messages: [], bubbles: [], lastResult: null });
}
