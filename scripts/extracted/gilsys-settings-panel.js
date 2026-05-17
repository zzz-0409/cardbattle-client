(function () {
  const STORAGE_KEY = "gilsys_settings_v1";
  const defaults = {
    bgmVolume: 0.55,
    seVolume: 0.82,
    turnConsumeConfirm: true,
  };

  function clamp01(value, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(0, Math.min(1, n));
  }

  function loadSettings() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return {
        bgmVolume: clamp01(raw.bgmVolume, defaults.bgmVolume),
        seVolume: clamp01(raw.seVolume, defaults.seVolume),
        turnConsumeConfirm: raw.turnConsumeConfirm !== false,
      };
    } catch (_) {
      return { ...defaults };
    }
  }

  let settings = loadSettings();

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("gilsys-settings-changed", { detail: { ...settings } }));
    renderSettingsValues();
  }

  window.gilsysGetAudioSetting = function (key, fallback = 1) {
    if (key === "bgmVolume") return clamp01(settings.bgmVolume, fallback);
    if (key === "seVolume") return clamp01(settings.seVolume, fallback);
    return fallback;
  };

  window.gilsysShouldConfirmTurnConsume = function () {
    return settings.turnConsumeConfirm !== false;
  };

  function renderSettingsValues() {
    const bgm = document.getElementById("gilsysSettingBgmVolume");
    const se = document.getElementById("gilsysSettingSeVolume");
    const confirm = document.getElementById("gilsysSettingTurnConfirm");
    const bgmValue = document.getElementById("gilsysSettingBgmValue");
    const seValue = document.getElementById("gilsysSettingSeValue");
    if (bgm) bgm.value = String(Math.round(settings.bgmVolume * 100));
    if (se) se.value = String(Math.round(settings.seVolume * 100));
    if (confirm) confirm.checked = settings.turnConsumeConfirm !== false;
    if (bgmValue) bgmValue.textContent = `${Math.round(settings.bgmVolume * 100)}%`;
    if (seValue) seValue.textContent = `${Math.round(settings.seVolume * 100)}%`;
  }

  function ensureSettingsModal() {
    let modal = document.getElementById("gilsysSettingsModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "gilsysSettingsModal";
    modal.className = "gilsys-settings-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="gilsys-settings-panel" role="dialog" aria-modal="true" aria-labelledby="gilsysSettingsTitle">
        <div class="gilsys-settings-head">
          <h2 id="gilsysSettingsTitle">設定</h2>
          <button type="button" class="gilsys-settings-close" aria-label="閉じる"></button>
        </div>
        <div class="gilsys-settings-list">
          <label class="gilsys-settings-row">
            <span><b>BGM音量</b><em id="gilsysSettingBgmValue">55%</em></span>
            <input id="gilsysSettingBgmVolume" type="range" min="0" max="100" step="1">
          </label>
          <label class="gilsys-settings-row">
            <span><b>SE音量</b><em id="gilsysSettingSeValue">82%</em></span>
            <input id="gilsysSettingSeVolume" type="range" min="0" max="100" step="1">
          </label>
          <label class="gilsys-settings-toggle">
            <input id="gilsysSettingTurnConfirm" type="checkbox">
            <span>ターン消費行動確認</span>
          </label>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      const target = event.target;
      if (target === modal || target.closest?.(".gilsys-settings-close")) closeSettings();
    });
    modal.querySelector("#gilsysSettingBgmVolume")?.addEventListener("input", event => {
      settings.bgmVolume = clamp01(Number(event.target.value) / 100, defaults.bgmVolume);
      saveSettings();
    });
    modal.querySelector("#gilsysSettingSeVolume")?.addEventListener("input", event => {
      settings.seVolume = clamp01(Number(event.target.value) / 100, defaults.seVolume);
      saveSettings();
    });
    modal.querySelector("#gilsysSettingTurnConfirm")?.addEventListener("change", event => {
      settings.turnConsumeConfirm = !!event.target.checked;
      saveSettings();
    });
    renderSettingsValues();
    return modal;
  }

  function openSettings() {
    const modal = ensureSettingsModal();
    settings = loadSettings();
    renderSettingsValues();
    modal.hidden = false;
    modal.classList.add("is-open");
  }

  function closeSettings() {
    const modal = document.getElementById("gilsysSettingsModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.hidden = true;
  }

  function ensureSettingsButton() {
    const layout = document.getElementById("phase0HomeLayout");
    if (!layout || document.getElementById("gilsysHomeSettingsBtn")) return;
    const btn = document.createElement("button");
    btn.id = "gilsysHomeSettingsBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "設定");
    btn.addEventListener("click", openSettings);
    layout.appendChild(btn);
  }

  window.gilsysOpenSettings = openSettings;

  document.addEventListener("DOMContentLoaded", () => {
    ensureSettingsButton();
    ensureSettingsModal();
  });
  window.addEventListener("load", ensureSettingsButton);
  setTimeout(ensureSettingsButton, 900);
})();
