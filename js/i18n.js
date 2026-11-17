
const DEFAULT_LANG = "en";
const SUPPORTED_LANGS = ["pl", "en"];

let currentLang = DEFAULT_LANG;
const translations = {};

async function loadLanguage(lang) {
  if (translations[lang]) return;

  const response = await fetch(`./locales/${lang}.json`);

  if (!response.ok) {
    throw new Error(`Cannot load language: ${lang}`);
  }

  translations[lang] = await response.json();
}

function t(token) {
  return (
    translations[currentLang]?.[token] ??
    translations[DEFAULT_LANG]?.[token] ??
    token
  );
}

function translatePage() {
  const attributes = {
    "data-i18n": "textContent",
    "data-i18n-placeholder": "placeholder",
    "data-i18n-aria-label": "aria-label",
    "data-i18n-alt": "alt",
    "data-i18n-content": "content"
  };

  Object.entries(attributes).forEach(([attr, target]) => {
    document.querySelectorAll(`[${attr}]`).forEach(el => {
      const value = t(el.getAttribute(attr));

      if (target === "textContent") {
        el.textContent = value;
      } else {
        el.setAttribute(target, value);
      }
    });
  });
}

async function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;

  await Promise.all([
    loadLanguage(DEFAULT_LANG),
    loadLanguage(lang)
  ]);

  currentLang = lang;
  document.documentElement.lang = lang;

  translatePage();

  localStorage.setItem("language", lang);

  document.querySelectorAll("[data-lang]").forEach(button => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.lang === lang)
    );
  });

  document.dispatchEvent(
    new CustomEvent("languagechange", {
      detail: { lang }
    })
  );
}

window.i18n = {
  t,
  setLanguage,
  translatePage
};

document.addEventListener("DOMContentLoaded", async () => {
  const savedLang = localStorage.getItem("language");
  const browserLang = navigator.language.slice(0, 2);

  const initialLang = SUPPORTED_LANGS.includes(savedLang)
    ? savedLang
    : SUPPORTED_LANGS.includes(browserLang)
      ? browserLang
      : DEFAULT_LANG;

  try {
    await setLanguage(initialLang);
  } catch (error) {
    console.error("Translation error:", error);
  }

  document.querySelectorAll("[data-lang]").forEach(button => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.lang).catch(console.error);
    });
  });
});
