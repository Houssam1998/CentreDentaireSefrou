/**
 * Nettoie le HTML d'un texte : on ne garde que gras, accent (italique), retours à la ligne et passages arabes.
 * Protège l'éditeur contre le HTML collé depuis d'autres sites.
 */
export function sanitizeHtml(html: string): string {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const out = document.createElement('div');
  const walk = (src: Node, dst: Node) => {
    for (const n of [...src.childNodes]) {
      if (n.nodeType === Node.TEXT_NODE) { dst.appendChild(document.createTextNode(n.textContent ?? '')); continue; }
      if (!(n instanceof Element)) continue;
      const tag = n.tagName.toLowerCase();
      let el: Element | null = null;
      if (tag === 'b' || tag === 'strong') el = document.createElement('b');
      else if (tag === 'em' || tag === 'i') el = document.createElement('em');
      else if (tag === 'br') { dst.appendChild(document.createElement('br')); continue; }
      else if (tag === 'span' && n.classList.contains('ar')) { el = document.createElement('span'); el.className = 'ar'; }
      else if (tag === 'div' || tag === 'p') {
        // contenteditable crée des <div> pour les retours à la ligne
        if (dst.childNodes.length) dst.appendChild(document.createElement('br'));
        walk(n, dst);
        continue;
      }
      if (el) { walk(n, el); dst.appendChild(el); } else walk(n, dst);
    }
  };
  walk(tpl.content, out);
  return out.innerHTML.replace(/(<br>)+$/, '').replace(/&nbsp;/g, ' ');
}

/** Texte brut (pour les noms de calques et les vérifications). */
export const plainText = (html: string) => {
  const d = document.createElement('div');
  d.innerHTML = html.replace(/<br\s*\/?>/g, ' ');
  return (d.textContent ?? '').replace(/\s+/g, ' ').trim();
};
