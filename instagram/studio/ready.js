/** Attend les polices et les images d'un élément avant capture. */
export async function whenReady(el) {
  await document.fonts.ready;
  // Force le chargement des polices arabes / italiques utilisées (chargées à la demande)
  const families = ['600 20px "Noto Kufi Arabic"', '700 20px "Noto Kufi Arabic"', '500 20px "Noto Naskh Arabic"', '600 20px "Noto Naskh Arabic"', '400 20px "Aref Ruqaa"', '700 20px "Aref Ruqaa"', 'italic 600 20px "Cormorant Garamond"', 'italic 500 20px "Cormorant Garamond"', '600 20px "Cormorant Garamond"'];
  await Promise.all(families.map((f) => document.fonts.load(f, 'abc مرحبا').catch(() => {})));
  await Promise.all(
    [...el.querySelectorAll('img')].map((img) => (img.complete ? img.decode?.().catch(() => {}) : new Promise((r) => { img.onload = img.onerror = r; }))),
  );
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}
