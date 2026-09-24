// Switch the static site in place. Keep publication data and disclosure state intact.
(function () {
  'use strict';
  const catalog = window.KW_TRANSLATIONS;
  if (!catalog) return;
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const ignored = 'script, style, code, pre, noscript, [data-no-translate], #title-block-header, .publication-title, .publication-authors, .publication-journal, .bibtex-copy-status';
  const blockRecords = [];
  const blockElements = new Set();
  const originalTitle = document.title;
  let language = 'en';

  function insideBlock(element) {
    for (let current = element; current; current = current.parentElement) {
      if (blockElements.has(current)) return true;
    }
    return false;
  }

  // Complete paragraphs allow natural Chinese word order without losing links.
  for (const element of document.querySelectorAll('p, li')) {
    if (element.closest(ignored) || insideBlock(element)) continue;
    if (element.tagName === 'LI' && element.querySelector('p')) continue;
    const chinese = catalog.blocks[normalize(element.textContent)];
    if (!chinese) continue;
    const template = document.createElement('template');
    template.innerHTML = chinese;
    // News paragraphs share the verified name translations with the team roster.
    for (const name of template.content.querySelectorAll('strong')) {
      const translated = catalog.text[normalize(name.textContent)];
      if (translated !== undefined) name.textContent = translated;
    }
    const links = element.querySelectorAll('a');
    for (const anchor of template.content.querySelectorAll('a[data-link]')) {
      const original = links[Number(anchor.dataset.link)];
      if (!original) throw new Error('Missing original link in translation');
      anchor.removeAttribute('data-link');
      for (const attribute of original.attributes) anchor.setAttribute(attribute.name, attribute.value);
    }
    blockRecords.push({element, en: element.innerHTML, zh: template.innerHTML});
    blockElements.add(element);
  }

  const textRecords = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || parent.closest(ignored) || insideBlock(parent)) continue;
    const original = node.nodeValue;
    const key = normalize(original);
    const translated = catalog.text[key];
    if (translated === undefined) continue;
    const leading = original.match(/^\s*/)[0];
    const trailing = original.match(/\s*$/)[0];
    textRecords.push({node, en: original, zh: leading + translated + trailing});
  }

  const monthNumbers = {Jan:1, Feb:2, Mar:3, Apr:4, May:5, June:6, July:7, Aug:8, Sept:9, Oct:10, Nov:11, Dec:12};
  function translateAttribute(value) {
    if (catalog.text[value]) return catalog.text[value];
    const date = value.match(/^(\w+) (\d{4})$/);
    if (date && monthNumbers[date[1]]) return date[2] + '年' + monthNumbers[date[1]] + '月';
    return value;
  }
  const attributeRecords = [];
  for (const element of document.querySelectorAll('[aria-label], [title], [alt]')) {
    if (element.closest(ignored) || insideBlock(element)) continue;
    for (const name of ['aria-label', 'title', 'alt']) {
      if (!element.hasAttribute(name)) continue;
      const original = element.getAttribute(name);
      const translated = translateAttribute(original);
      if (translated !== original) attributeRecords.push({element, name, en: original, zh: translated});
    }
  }

  function remember(value) {
    try { localStorage.setItem('kw-site-language', value); } catch (_) { /* Offline/private browsing still works. */ }
  }
  function preferredLanguage() {
    const parameter = new URL(location.href).searchParams.get('lang');
    if (parameter === 'en' || parameter === 'zh') return parameter;
    try { return localStorage.getItem('kw-site-language') === 'zh' ? 'zh' : 'en'; } catch (_) { return 'en'; }
  }
  function updateInternalLinks() {
    for (const anchor of document.querySelectorAll('a[href]')) {
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || anchor.hasAttribute('download')) continue;
      const target = new URL(href, document.baseURI);
      if (target.origin !== location.origin || target.protocol !== location.protocol) continue;
      if (!target.pathname.endsWith('.html') && !target.pathname.endsWith('/')) continue;
      target.searchParams.set('lang', language);
      anchor.href = target.href;
    }
  }
  function applyLanguage(value, updateUrl) {
    language = value === 'zh' ? 'zh' : 'en';
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    for (const record of blockRecords) record.element.innerHTML = record[language];
    for (const record of textRecords) record.node.nodeValue = record[language];
    for (const record of attributeRecords) record.element.setAttribute(record.name, record[language]);
    for (const button of document.querySelectorAll('[data-language]')) {
      button.setAttribute('aria-pressed', String(button.dataset.language === language));
    }
    document.querySelector('.language-switch').setAttribute('aria-label', language === 'zh' ? '语言' : 'Language');
    for (const status of document.querySelectorAll('.bibtex-copy-status')) status.textContent = '';
    const heading = document.querySelector('main > section > h1');
    document.title = language === 'zh' ? (heading ? heading.textContent : '学术主页') + ' | 吴开亮' : originalTitle;
    remember(language);
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('lang', language);
      try { history.replaceState(history.state, '', url); } catch (_) { /* File previews can restrict History API. */ }
    }
    updateInternalLinks();
    document.dispatchEvent(new CustomEvent('site-language-change', {detail: {language}}));
  }
  window.siteI18n = {t: value => language === 'zh' ? (catalog.text[value] || value) : value};
  document.querySelector('.language-switch').addEventListener('click', function (event) {
    const button = event.target.closest('button[data-language]');
    if (button) applyLanguage(button.dataset.language, true);
  });
  applyLanguage(preferredLanguage(), false);
})();
