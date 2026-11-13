/**
 * Espace d'équipe en ligne : détection (Studio publié derrière Cloudflare Access) et appels à l'API /api/*.
 * En local (npm run ig:studio), il n'y a pas d'API : le Studio enregistre dans le navigateur.
 */
import { create } from 'zustand';

export interface RemoteMeta {
  id: string; name: string; format: 'post' | 'story' | 'square'; pages: number; version: number;
  createdAt: number; createdBy: string; updatedAt: number; updatedBy: string; deletedAt: number | null; deletedBy: string | null;
}

interface CloudState {
  enabled: boolean;
  email: string;
  /** Dernier enregistrement connu de la création ouverte (pour « modifiée par … »). */
  current: RemoteMeta | null;
  /** Quelqu'un d'autre a enregistré cette création pendant que vous la modifiiez. */
  conflict: RemoteMeta | null;
  offline: boolean;
  sessionExpired: boolean;
}

export const useCloud = create<CloudState>(() => ({ enabled: false, email: '', current: null, conflict: null, offline: false, sessionExpired: false }));

export async function detectCloud() {
  // npm run ig:studio (serveur de développement Vite) : jamais d'API, mode local direct
  if (import.meta.env.DEV) return false;
  try {
    const r = await fetch('/api/me', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    if (r.ok && (r.headers.get('Content-Type') ?? '').includes('application/json')) {
      const { email } = (await r.json()) as { email: string };
      useCloud.setState({ enabled: true, email });
    }
  } catch { /* pas d'API : mode local */ }
  return useCloud.getState().enabled;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) { super(message); }
}

/** Appel à l'API ; signale une session expirée ou une coupure réseau. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api${path}`, { credentials: 'same-origin', redirect: 'manual', ...init, headers: { Accept: 'application/json', ...(init.headers ?? {}) } });
  } catch {
    useCloud.setState({ offline: true });
    throw new ApiError(0, 'Connexion internet interrompue');
  }
  useCloud.setState({ offline: false });
  // Access renvoie vers la page de connexion quand la session a expiré
  if (r.type === 'opaqueredirect' || r.status === 401 || r.status === 302) {
    useCloud.setState({ sessionExpired: true });
    throw new ApiError(401, 'Session expirée : rechargez la page pour vous reconnecter');
  }
  const body = (r.headers.get('Content-Type') ?? '').includes('json') ? await r.json() : null;
  if (!r.ok) throw new ApiError(r.status, (body as { error?: string })?.error ?? `Erreur ${r.status}`, body);
  return body as T;
}

export const logoutUrl = '/cdn-cgi/access/logout';

/** « dr.omari@gmail.com » → « dr.omari » (affichage court). */
export const who = (email?: string | null) => (email ? email.split('@')[0] : '');
