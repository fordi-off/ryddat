/**
 * Ryddat i18n runtime.
 *
 * How to add a language:
 *   1. Copy i18n/en.json to i18n/xx.json and translate the values.
 *   2. Add "xx" to SUPPORTED_LOCALES below with its native display name.
 *   3. Add a <li><button data-locale-option="xx">Name</button></li> to every
 *      .lang-menu in the site's HTML (header markup is identical on every page).
 * No other code changes are needed — every element already wired up with
 * data-i18n / data-i18n-html picks up the new language automatically.
 */
(function () {
  "use strict";

  var SUPPORTED_LOCALES = {
    en: "English",
    no: "Norsk"
  };
  var DEFAULT_LOCALE = "en";
  var STORAGE_KEY = "ryddat-locale";
  var cache = {};

  function resolvePath(base) {
    // i18n.js and index.html/privacy.html/terms.html all live at the site root,
    // so translations are always at ./i18n/<locale>.json relative to the page.
    return "i18n/" + base + ".json";
  }

  function get(dict, path) {
    var parts = path.split(".");
    var node = dict;
    for (var i = 0; i < parts.length; i++) {
      if (node == null) return undefined;
      node = node[parts[i]];
    }
    return node;
  }

  function loadLocale(locale) {
    if (cache[locale]) return Promise.resolve(cache[locale]);
    return fetch(resolvePath(locale))
      .then(function (res) {
        if (!res.ok) throw new Error("i18n: failed to load " + locale);
        return res.json();
      })
      .then(function (dict) {
        cache[locale] = dict;
        return dict;
      });
  }

  function detectLocale() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED_LOCALES[stored]) return stored;
    } catch (e) {
      /* localStorage unavailable (private mode etc.) — fall through */
    }
    var nav = (navigator.language || navigator.userLanguage || DEFAULT_LOCALE)
      .slice(0, 2)
      .toLowerCase();
    // Norwegian has two written forms (nb/nn); either maps to our single "no".
    if (nav === "nb" || nav === "nn") nav = "no";
    return SUPPORTED_LOCALES[nav] ? nav : DEFAULT_LOCALE;
  }

  function applyLocale(dict, locale) {
    document.documentElement.lang = locale;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var val = get(dict, el.getAttribute("data-i18n"));
      if (typeof val === "string") el.textContent = val;
    });

    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var val = get(dict, el.getAttribute("data-i18n-html"));
      if (typeof val === "string") el.innerHTML = val;
    });

    // data-i18n-attr="attr1:key.path1;attr2:key.path2"
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr")
        .split(";")
        .forEach(function (pair) {
          var idx = pair.indexOf(":");
          if (idx === -1) return;
          var attr = pair.slice(0, idx).trim();
          var key = pair.slice(idx + 1).trim();
          var val = get(dict, key);
          if (typeof val === "string") el.setAttribute(attr, val);
        });
    });

    // <title> and <meta name="description"> use the same generic
    // data-i18n / data-i18n-attr mechanism as everything else (see the two
    // sweeps above), each page pointing at its own meta.* or legal.*MetaTitle
    // key — so this file never has to know which page it's running on.

    document.querySelectorAll("[data-locale-option]").forEach(function (btn) {
      var isActive = btn.getAttribute("data-locale-option") === locale;
      btn.setAttribute("aria-selected", String(isActive));
    });
    document.querySelectorAll(".lang-current").forEach(function (el) {
      el.textContent = locale.toUpperCase();
    });

    document.dispatchEvent(
      new CustomEvent("ryddat:locale-changed", { detail: { locale: locale, dict: dict } })
    );
  }

  function setLocale(locale) {
    if (!SUPPORTED_LOCALES[locale]) locale = DEFAULT_LOCALE;
    return loadLocale(locale)
      .then(function (dict) {
        applyLocale(dict, locale);
        try {
          window.localStorage.setItem(STORAGE_KEY, locale);
        } catch (e) {
          /* ignore */
        }
        document.documentElement.classList.remove("i18n-loading");
      })
      .catch(function (err) {
        // Fail safe: never leave the page blank because a translation 404s.
        console.error(err);
        document.documentElement.classList.remove("i18n-loading");
      });
  }

  window.RyddatI18n = {
    locales: SUPPORTED_LOCALES,
    get: get,
    setLocale: setLocale,
    currentDict: function () {
      var locale = document.documentElement.lang || DEFAULT_LOCALE;
      return cache[locale];
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    setLocale(detectLocale());

    document.querySelectorAll("[data-locale-option]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setLocale(btn.getAttribute("data-locale-option"));
        var menu = btn.closest(".lang-switcher");
        if (menu) menu.classList.remove("open");
      });
    });

    document.querySelectorAll(".lang-trigger").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var switcher = trigger.closest(".lang-switcher");
        var isOpen = switcher.classList.toggle("open");
        trigger.setAttribute("aria-expanded", String(isOpen));
      });
    });

    document.addEventListener("click", function (e) {
      document.querySelectorAll(".lang-switcher.open").forEach(function (switcher) {
        if (!switcher.contains(e.target)) {
          switcher.classList.remove("open");
          var trigger = switcher.querySelector(".lang-trigger");
          if (trigger) trigger.setAttribute("aria-expanded", "false");
        }
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        document.querySelectorAll(".lang-switcher.open").forEach(function (switcher) {
          switcher.classList.remove("open");
        });
      }
    });
  });
})();
