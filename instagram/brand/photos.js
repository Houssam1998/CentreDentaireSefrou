/**
 * Photothèque : toutes les images de src/assets/media (photos réelles du cabinet dans clinic/).
 * Dans une publication, on écrit la clé, par ex. 'clinic/doctor-standing'.
 * Une photo importée dans le Studio est stockée directement (data:…).
 */
// Toutes les personnes photographiées (équipe et patients) ont donné leur accord (novembre 2026).
const files = import.meta.glob('../../src/assets/media/**/*.{jpg,jpeg,png,webp}', { eager: true, query: '?url', import: 'default' });

export const photos = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.replace('../../src/assets/media/', '').replace(/\.\w+$/, ''), url]),
);

export const photoUrl = (key) => {
  if (!key) return '';
  if (/^(data:|blob:|https?:|\/)/.test(key)) return key;
  return photos[key] ?? '';
};
