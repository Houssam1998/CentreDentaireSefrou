/**
 * Appointment form without a backend: validates the fields, then opens WhatsApp
 * (or the mail client) with a pre-filled message built from the answers.
 * Labels for the message come from data attributes so the form works in both languages.
 */
export function buildMessage(form: HTMLFormElement) {
  const data = new FormData(form);
  const intro = form.dataset.intro ?? '';
  const lines = [intro, ''];
  form.querySelectorAll<HTMLElement>('[data-field-label]').forEach((el) => {
    const name = el.getAttribute('name')!;
    const value = String(data.get(name) ?? '').trim();
    if (value) lines.push(`${el.dataset.fieldLabel} : ${value}`);
  });
  return lines.join('\n').trim();
}

export function initContactForm() {
  document.querySelectorAll<HTMLFormElement>('form[data-contact-form]').forEach((form) => {
    const status = form.querySelector<HTMLElement>('[data-form-status]');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      // Native validation already ran (the browser blocks submit on invalid fields)
      const channel = (e.submitter as HTMLElement | null)?.dataset.channel === 'email' ? 'email' : 'whatsapp';
      const message = buildMessage(form);
      const url =
        channel === 'whatsapp'
          ? `https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(message)}`
          : `mailto:${form.dataset.email}?subject=${encodeURIComponent(form.dataset.subject ?? '')}&body=${encodeURIComponent(message)}`;

      if (channel === 'whatsapp') window.open(url, '_blank', 'noopener');
      else window.location.href = url;

      if (status) {
        status.textContent = form.dataset.success ?? '';
        status.hidden = false;
      }
    });
  });
}
