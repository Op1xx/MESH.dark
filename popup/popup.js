/* =========================================================================
   МЭШ · Тёмная тема  —  popup/popup.js
   ========================================================================= */

(() => {
  "use strict";

  const api = globalThis.browser || globalThis.chrome;
  const DEFAULTS = { mode: "on", accent: "indigo", autofix: true, dim: false };
  const ACCENT_HEX = {
    indigo: "#7c94ff",
    blue: "#4a9eff",
    violet: "#9d84ff",
    green: "#46cf62",
    magenta: "#ff5aa8"
  };

  const $ = sel => document.querySelector(sel);

  function paint(prefs) {
    document.querySelectorAll("#mode button").forEach(b =>
      b.classList.toggle("active", b.dataset.value === prefs.mode));

    document.querySelectorAll("#accent .swatch").forEach(b =>
      b.classList.toggle("active", b.dataset.value === prefs.accent));

    const accent = ACCENT_HEX[prefs.accent] || ACCENT_HEX.indigo;
    document.documentElement.style.setProperty("--accent", accent);

    $("#autofix").checked = !!prefs.autofix;
    $("#dim").checked = !!prefs.dim;
  }

  function save(patch) {
    api.storage.local.set(patch);
  }

  async function init() {
    let prefs = DEFAULTS;
    try {
      prefs = Object.assign({}, DEFAULTS, await api.storage.local.get(DEFAULTS));
    } catch (e) { /* ignore */ }

    paint(prefs);

    $("#ver").textContent = "v" + api.runtime.getManifest().version;

    $("#mode").addEventListener("click", e => {
      const btn = e.target.closest("button[data-value]");
      if (!btn) return;
      prefs.mode = btn.dataset.value;
      paint(prefs);
      save({ mode: prefs.mode });
    });

    $("#accent").addEventListener("click", e => {
      const btn = e.target.closest("button[data-value]");
      if (!btn) return;
      prefs.accent = btn.dataset.value;
      paint(prefs);
      save({ accent: prefs.accent });
    });

    $("#autofix").addEventListener("change", e => {
      prefs.autofix = e.target.checked;
      save({ autofix: prefs.autofix });
    });

    $("#dim").addEventListener("change", e => {
      prefs.dim = e.target.checked;
      save({ dim: prefs.dim });
    });

    /* Показываем, активна ли тема на текущей вкладке */
    try {
      const [tab] = await api.tabs.query({ active: true, currentWindow: true });
      const url = tab && tab.url ? tab.url : "";
      if (url && !/^https?:\/\/school\.mos\.ru\//.test(url)) {
        const st = $("#status");
        st.textContent = "Откройте school.mos.ru";
        st.classList.add("off");
      } else if (url) {
        $("#status").textContent = "school.mos.ru · вкладка активна";
      }
    } catch (e) { /* ignore */ }
  }

  init();
})();
