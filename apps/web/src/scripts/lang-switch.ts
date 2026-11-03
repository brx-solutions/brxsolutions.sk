// Keep the current #section when switching language on the home page.
document.querySelectorAll<HTMLAnchorElement>('[data-lang-switch]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const hash = location.hash;
    const isHome = /^\/(en\/)?$/.test(location.pathname);
    if (!hash || !isHome) return;
    e.preventDefault();
    location.href = a.getAttribute('href') + hash;
  });
});
