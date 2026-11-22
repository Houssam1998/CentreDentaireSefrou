/** Petit pictogramme d'une occasion : drapeau dessiné (l'emoji 🇲🇦 s'affiche « MA » sous Windows), yaz, sinon l'emoji. */
import { OCCASIONS } from '../../templates/occasions.js';
import { flag } from '../../brand/motifs.js';

export function OccasionIcon({ occasion, size = 22 }: { occasion: string; size?: number }) {
  const o = OCCASIONS[occasion];
  if (!o) return null;
  if (o.motif === 'flag') {
    return <span className="occ-ico flag" aria-hidden="true" style={{ width: size * 1.4, height: size }} dangerouslySetInnerHTML={{ __html: flag(size * 1.4) }} />;
  }
  return <span className="occ-ico" aria-hidden="true" style={{ fontSize: size, width: size * 1.4 }}>{o.emoji}</span>;
}
