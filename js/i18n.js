// Teksty statyczne są tłumaczone podczas builda.
// Ten moduł obsługuje tłumaczenia w JS oraz nowych elementów dodanych do DOM.
(() => {
  const lang = document.documentElement.lang || 'en';
  const dictionaryElement = document.getElementById('i18n-dictionary');
  let translations = {};

  try {
    translations = JSON.parse(dictionaryElement?.textContent || '{}');
  } catch (err) {
    console.error('Nie można odczytać tłumaczeń:', err);
  }

  function t(token) {
    if (!Object.hasOwn(translations, token)) {
      console.warn(`Brak tłumaczenia ${lang}: ${token}`);
      return token;
    }
    return translations[token];
  }

  function translatePage(root = document) {
    // Zastępowanie {{token}} w tekstach, bez niszczenia dzieci elementu.
    const textNodes = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = textNodes.nextNode())) {
      if (node.parentElement?.closest('script, style, template, noscript')) continue;
      if (!node.nodeValue.includes('{{')) continue;
      node.nodeValue = node.nodeValue.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => t(key));
    }

    // Atrybuty (placeholder, title, alt, aria-label itd.).
    const elements = root.nodeType === Node.ELEMENT_NODE
      ? [root, ...root.querySelectorAll('*')]
      : [...root.querySelectorAll('*')];

    for (const el of elements) {
      if (el.matches('script, style, template, noscript')) continue;
      for (const attr of el.attributes) {
        if (!attr.value.includes('{{')) continue;
        el.setAttribute(attr.name, attr.value.replace(
          /\{\{\s*([\w.-]+)\s*\}\}/g,
          (_, key) => t(key)
        ));
      }
    }
  }

  // Linki przełączają adres URL; zachowujemy hash bieżącej sekcji.
  document.querySelectorAll('[data-lang-link]').forEach((link) => {
    link.setAttribute('aria-current', link.dataset.langLink === lang ? 'true' : 'false');
    link.addEventListener('click', () => {
      try { localStorage.setItem('basic-materials-language', link.dataset.langLink); } catch (_) {}
      link.href = link.pathname + location.hash;
    });
  });

  window.i18n = { lang, t, translatePage };
  translatePage();

  // Jeśli products.js lub legal.js doda HTML z {{token}}, również go przetłumacz.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) translatePage(node);
        else if (node.nodeType === Node.TEXT_NODE && node.nodeValue.includes('{{')) {
          node.nodeValue = node.nodeValue.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => t(key));
        }
      }
    }
  });
  if (document.body) observer.observe(document.body, { childList: true, subtree: true });
})();
