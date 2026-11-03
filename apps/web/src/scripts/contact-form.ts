declare global {
  interface Window {
    turnstile?: { reset: (el?: Element) => void };
  }
}

const form = document.querySelector<HTMLFormElement>('[data-contact-form]');

if (form) {
  const status = form.querySelector<HTMLElement>('[data-form-status]');
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]');
  const show = (text: string, ok: boolean) => {
    if (!status) return;
    status.textContent = text;
    status.hidden = false;
    status.classList.toggle('text-accent-light', ok);
    status.classList.toggle('text-pink', !ok);
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    if (button) button.disabled = true;
    show(form.dataset.sending ?? '', true);
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      show(form.dataset.success ?? '', true);
      form.reset();
      const message = form.querySelector<HTMLTextAreaElement>('textarea[name=message]');
      if (message) message.placeholder = form.dataset.msgPlaceholder ?? '';
    } catch {
      show(form.dataset.error ?? '', false);
    } finally {
      if (button) button.disabled = false;
      window.turnstile?.reset(form.querySelector('.cf-turnstile') ?? undefined);
    }
  });
}

export {};
