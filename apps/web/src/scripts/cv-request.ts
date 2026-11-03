// "Request CV" link: jump to the form with the CV option pre-selected.
document.querySelectorAll<HTMLAnchorElement>('[data-cv-request]').forEach((a) => {
  a.addEventListener('click', () => {
    const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
    if (!form) return;
    const select = form.querySelector<HTMLSelectElement>('select[name=type]');
    const message = form.querySelector<HTMLTextAreaElement>('textarea[name=message]');
    if (select) select.value = 'cv';
    if (message) message.placeholder = form.dataset.cvPlaceholder ?? message.placeholder;
    setTimeout(() => form.querySelector<HTMLInputElement>('input[name=name]')?.focus({ preventScroll: true }), 300);
  });
});
