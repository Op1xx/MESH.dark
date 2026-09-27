/* =========================================================================
   МЭШ · Тёмная тема  —  src/content.js
   Управляет режимом темы, акцентом, приглушением изображений и
   «автокоррекцией» легаси-страниц (перекраска светлых фонов без токенов).
   ========================================================================= */

(() => {
  "use strict";

  const api = globalThis.browser || globalThis.chrome;
  const CACHE_KEY = "mesh-dark-pref";
  const DEFAULTS = {
    mode: "on",        // on | auto | off
    accent: "indigo",  // indigo | blue | violet | green | magenta
    autofix: true,
    dim: false
  };

  const mql = window.matchMedia("(prefers-color-scheme: dark)");

  /* ------------------------------------------------------------------ *
   * Настройки
   * ------------------------------------------------------------------ */
  function loadCache() {
    try {
      return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    } catch (e) {
      return null;
    }
  }
  function saveCache(pref) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(pref));
    } catch (e) {
      /* приватный режим и т.п. — не критично */
    }
  }

  let prefs = Object.assign({}, DEFAULTS, loadCache() || {});

  /* ------------------------------------------------------------------ *
   * Применение темы к <html>
   * ------------------------------------------------------------------ */
  function effectiveMode() {
    if (prefs.mode === "auto") return mql.matches ? "on" : "off";
    return prefs.mode === "off" ? "off" : "on";
  }

  function applyAttrs() {
    const root = document.documentElement;
    if (!root) return false;

    root.setAttribute("data-mesh-dark", effectiveMode());

    if (prefs.accent && prefs.accent !== "indigo") {
      root.setAttribute("data-mesh-accent", prefs.accent);
    } else {
      root.removeAttribute("data-mesh-accent");
    }

    if (prefs.dim) root.setAttribute("data-mesh-dim", "");
    else root.removeAttribute("data-mesh-dim");

    return true;
  }

  /* Ждём появления <html> (на document_start его может ещё не быть) */
  function whenRoot(fn) {
    if (document.documentElement) {
      fn();
      return;
    }
    const obs = new MutationObserver(() => {
      if (document.documentElement) {
        obs.disconnect();
        fn();
      }
    });
    obs.observe(document, { childList: true, subtree: true });
    setTimeout(() => {
      if (document.documentElement) {
        obs.disconnect();
        fn();
      }
    }, 1000);
  }

  /* ------------------------------------------------------------------ *
   * Автокоррекция легаси-страниц
   * ------------------------------------------------------------------ */
  const fixed = new Map();       // element -> { bg, color }
  const LIGHT = 0.80;
  const DARK = 0.16;
  const MAX_PER_PASS = 2500;

  function parseColor(str) {
    if (!str) return null;
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map(s => parseFloat(s));
    const a = p.length > 3 ? p[3] : 1;
    if (a < 0.5) return null;
    return [p[0], p[1], p[2]];
  }
  function luminance(rgb) {
    const [r, g, b] = rgb.map(v => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const SKIP = new Set([
    "IMG", "SVG", "VIDEO", "CANVAS", "IFRAME", "OBJECT", "EMBED",
    "PATH", "CIRCLE", "RECT", "LINE", "POLYGON", "USE", "G", "DEFS"
  ]);

  function depthOf(el) {
    let d = 0, p = el.parentElement;
    while (p) {
      if (p.dataset && p.dataset.meshFixBg) d++;
      p = p.parentElement;
    }
    return d;
  }

  /* Яркость ближайшего непрозрачного фона (для решения о цвете текста) */
  function effectiveBgLum(el) {
    let p = el;
    while (p && p.nodeType === 1) {
      const cs = getComputedStyle(p);
      if (cs.backgroundImage === "none") {
        const bg = parseColor(cs.backgroundColor);
        if (bg) return luminance(bg);
      }
      p = p.parentElement;
    }
    return luminance([14, 16, 21]);
  }

  function fixElement(el) {
    if (!el || el.nodeType !== 1) return;
    if (SKIP.has(el.tagName)) return;
    if (el.dataset.meshFixed) return;

    const cs = getComputedStyle(el);

    /* фон: перекрашиваем только светлые непрозрачные заливки без картинки */
    if (cs.backgroundImage === "none") {
      const bg = parseColor(cs.backgroundColor);
      if (bg && luminance(bg) > LIGHT) {
        const surface = depthOf(el) % 2 ? "#1d222b" : "#161a21";
        fixed.set(el, Object.assign(fixed.get(el) || {}, { bg: el.style.getPropertyValue("background-color") }));
        el.style.setProperty("background-color", surface, "important");
        el.dataset.meshFixBg = "";
        el.dataset.meshFixed = "";
      }
    }

    /* текст: слишком тёмный на тёмном фоне делаем светлым */
    const fg = parseColor(cs.color);
    if (el.childNodes.length && fg && luminance(fg) < DARK && effectiveBgLum(el) < 0.3) {
      fixed.set(el, Object.assign(fixed.get(el) || {}, { color: el.style.getPropertyValue("color") }));
      el.style.setProperty("color", "#e7e9ef", "important");
      el.dataset.meshFixed = "";
    }
  }

  let fixScheduled = false;
  function scheduleFix(rootNode, immediate) {
    if (!prefs.autofix || effectiveMode() !== "on" || fixScheduled) return;
    fixScheduled = true;
    const run = () => {
      fixScheduled = false;
      if (!prefs.autofix || effectiveMode() !== "on") return;
      const nodes = [];
      if (rootNode && rootNode.nodeType === 1) {
        nodes.push(rootNode);
        rootNode.querySelectorAll("*").forEach(n => nodes.push(n));
      } else {
        document.querySelectorAll("body *").forEach(n => nodes.push(n));
      }
      let count = 0;
      for (const n of nodes) {
        if (count++ > MAX_PER_PASS) break;
        fixElement(n);
      }
    };
    /* Первый проход — до первой отрисовки, чтобы не мелькали белые блоки;
       последующие (SPA) — в простое, чтобы не блокировать интерфейс. */
    if (immediate) {
      let done = false;
      const once = () => { if (!done) { done = true; run(); } };
      if (globalThis.requestAnimationFrame) requestAnimationFrame(once);
      setTimeout(once, 0);            // страховка, если rAF недоступен/не сработал
      return;
    }
    if (globalThis.requestIdleCallback) requestIdleCallback(run, { timeout: 400 });
    else setTimeout(run, 60);
  }

  function revertFix() {
    for (const [el, orig] of fixed) {
      if (orig.bg !== undefined) {
        if (orig.bg) el.style.setProperty("background-color", orig.bg);
        else el.style.removeProperty("background-color");
      }
      if (orig.color !== undefined) {
        if (orig.color) el.style.setProperty("color", orig.color);
        else el.style.removeProperty("color");
      }
      delete el.dataset.meshFixBg;
      delete el.dataset.meshFixed;
    }
    fixed.clear();
  }

  /* ------------------------------------------------------------------ *
   * Наблюдаем за DOM, чтобы красить новые узлы SPA и не терять атрибуты
   * ------------------------------------------------------------------ */
  function observe() {
    let pending = null;
    const obs = new MutationObserver(muts => {
      /* если кто-то снял наши атрибуты — вернуть */
      if (document.documentElement &&
          document.documentElement.getAttribute("data-mesh-dark") !== effectiveMode()) {
        applyAttrs();
      }
      if (prefs.autofix && effectiveMode() === "on") {
        if (pending) return;
        pending = setTimeout(() => {
          pending = null;
          scheduleFix(document.body || document.documentElement);
        }, 250);
      }
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ *
   * Загрузка настроек из storage и реакция на изменения
   * ------------------------------------------------------------------ */
  function syncFromStorage() {
    function merge(stored) {
      prefs = Object.assign({}, DEFAULTS, stored || {});
      saveCache(prefs);
      applyAttrs();
      if (prefs.autofix && effectiveMode() === "on") scheduleFix(document.body || document.documentElement);
      else revertFix();
    }
    try {
      const p = api.storage.local.get(DEFAULTS);
      if (p && typeof p.then === "function") { p.then(merge); return; }
    } catch (e) { /* переходим к callback-варианту */ }
    try { api.storage.local.get(DEFAULTS, merge); } catch (e) { /* ignore */ }
  }

  if (api && api.storage && api.storage.onChanged) {
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      let dirty = false;
      for (const k of Object.keys(DEFAULTS)) {
        if (changes[k]) { prefs[k] = changes[k].newValue; dirty = true; }
      }
      if (!dirty) return;
      saveCache(prefs);
      applyAttrs();
      if (prefs.autofix && effectiveMode() === "on") scheduleFix(document.body || document.documentElement);
      else revertFix();
    });
  }

  mql.addEventListener("change", () => {
    if (prefs.mode === "auto") {
      applyAttrs();
      if (effectiveMode() === "on") scheduleFix(document.body || document.documentElement);
      else revertFix();
    }
  });

  /* ------------------------------------------------------------------ *
   * Старт
   * ------------------------------------------------------------------ */
  whenRoot(() => {
    applyAttrs();                       // мгновенно, из кэша — без мигания
    observe();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        scheduleFix(document.body || document.documentElement, true);
        syncFromStorage();
      }, { once: true });
    } else {
      scheduleFix(document.body || document.documentElement, true);
      syncFromStorage();
    }
  });
})();
