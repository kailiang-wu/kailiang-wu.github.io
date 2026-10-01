// Offer a return control only on the long, year-by-year bibliography.
(function () {
  const heading = document.querySelector('#list-of-publications-by-year > h1');
  if (!heading) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'back-to-top';
  button.hidden = true;
  const arrow = document.createElement('span');
  arrow.textContent = '↑';
  arrow.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.textContent = 'Back to top';
  button.append(arrow, label);
  document.body.append(button);
  heading.tabIndex = -1;

  function updateVisibility() {
    button.hidden = window.scrollY < 480;
  }
  window.addEventListener('scroll', updateVisibility, {passive: true});
  window.addEventListener('pageshow', updateVisibility);
  button.addEventListener('click', function () {
    heading.focus({preventScroll: true});
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
    });
  });
  updateVisibility();
})();

// Keep a pinned topic heading in view when its long paper list is collapsed.
document.addEventListener('click', function (event) {
  const summary = event.target.closest('.topic-disclosure > summary');
  if (!summary || event.defaultPrevented) return;
  const topic = summary.parentElement;
  if (!topic.open) return;
  const previousTop = summary.getBoundingClientRect().top;
  if (previousTop <= topic.getBoundingClientRect().top + 1) return;

  event.preventDefault();
  topic.open = false;
  window.scrollBy({
    top: summary.getBoundingClientRect().top - previousTop,
    behavior: 'instant'
  });
});

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
