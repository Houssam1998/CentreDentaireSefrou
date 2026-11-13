/** Glisser-déposer depuis les panneaux : identifiants des éléments proposés → éléments à créer. */
import type { NewEl, Tone } from '../model/types';
import { TEXT_PRESETS, SHAPE_PRESETS, MOTIF_PRESETS, COMPONENT_ITEMS, componentPreset } from '../model/presets';

export type Payload = { kind: 'preset'; id: string } | { kind: 'photo'; src: string };

export const dragData = (p: Payload) => JSON.stringify(p);
export function dropPayload(s: string): Payload | null {
  try { return s ? (JSON.parse(s) as Payload) : null; } catch { return null; }
}

/** 'text:title', 'shape:card', 'motif:waves', 'comp:footer', 'icon:tooth', 'icon-disc:tooth' */
export function presetById(id: string, tone: Tone): NewEl[] | null {
  const [kind, key] = id.split(':');
  if (kind === 'text') return TEXT_PRESETS.find((p) => p.id === key)?.make() ?? null;
  if (kind === 'shape') return SHAPE_PRESETS.find((p) => p.id === key)?.make() ?? null;
  if (kind === 'motif') return MOTIF_PRESETS.find((p) => p.id === key)?.make() ?? null;
  if (kind === 'comp') {
    const c = COMPONENT_ITEMS.find((x) => x.id === key);
    return c ? [componentPreset(c.name, c.props, tone, c.scale)] : null;
  }
  if (kind === 'icon') return [{ type: 'icon', name: key, w: 140, h: 140, color: 'gold', disc: false }];
  if (kind === 'icon-disc') return [{ type: 'icon', name: key, w: 110, h: 110, color: 'gold', disc: true }];
  return null;
}
