// Clipboard enhancement; citation text and .bib downloads work without JavaScript.
document.addEventListener('click', async function (event) {
  const button = event.target.closest('.copy-bibtex');
  if (!button) return;
  const panel = button.closest('.bibtex-panel');
  const code = panel.querySelector('code');
  const status = panel.querySelector('.bibtex-copy-status');
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(code.textContent);
    status.textContent = window.siteI18n ? window.siteI18n.t('Copied') : 'Copied';
  } catch (_) {
    const range = document.createRange();
    range.selectNodeContents(code);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    const message = 'Text selected — press Ctrl+C or ⌘C to copy.';
    status.textContent = window.siteI18n ? window.siteI18n.t(message) : message;
  }
});
