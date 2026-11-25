// Runs before first paint so the layout does not jump when the window state is restored.
// Kept as a plain external file: the production CSP allows no inline scripts.
(function () {
  var mode = 'open';
  try {
    var stored = localStorage.getItem('brx-term');
    if (stored === 'min' || stored === 'closed') mode = stored;
  } catch (e) {
    // Storage blocked: first-visit behaviour.
  }
  document.documentElement.dataset.term = mode;
})();
