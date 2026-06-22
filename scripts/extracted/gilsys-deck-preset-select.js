(() => {
  if (window.__gilsysDeckPresetSelectInstalled) return;
  window.__gilsysDeckPresetSelectInstalled = true;

  const presets = [
    { key: "warrior", jobId: 1, name: "戦士デッキ", job: "戦士", icon: "剣", desc: "攻撃力と防御力を伸ばして正面から戦う基本デッキ。" },
    { key: "archer", jobId: 8, name: "弓兵デッキ", job: "弓兵", icon: "弓", desc: "弓スロットと矢カードを使って攻めるデッキ。" },
    { key: "mage", jobId: 5, name: "魔導士デッキ", job: "魔導士", icon: "魔", desc: "魔力カードを使い、魔法で突破するデッキ。" },
  ];

  const deckSize = 20;
  let selectedPresetKey = localStorage.getItem("gilsysSelectedBattleDeckPreset") || "warrior";

  function safe(value) {
    if (typeof escapeHtml === "function") return escapeHtml(String(value ?? ""));
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getPreset(key = selectedPresetKey) {
    return presets.find(preset => preset.key === key) || presets[0];
  }

  function getStoredDeck(key) {
    try {
      const raw = localStorage.getItem(`gilsysCardDeck:${key}`);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) return { cards: parsed, saved: true };
    } catch (_) {}
    const fallback = typeof window.gilsysGetDeckEditorDeck === "function"
      ? window.gilsysGetDeckEditorDeck(key)
      : [];
    return { cards: Array.isArray(fallback) ? fallback : [], saved: false };
  }

  function applyPreset(key) {
    const preset = getPreset(key);
    selectedPresetKey = preset.key;
    localStorage.setItem("gilsysSelectedBattleDeckPreset", preset.key);
    window.gilsysSelectedDeckPreset = preset;
    window.gilsysDeckCardsByJob = window.gilsysDeckCardsByJob || {};
    const deck = getStoredDeck(preset.key).cards;
    if (deck.length) window.gilsysDeckCardsByJob[preset.key] = deck;
    if (typeof selectedJobId !== "undefined") selectedJobId = preset.jobId;
    window.selectedJobName = preset.job;
    try {
      if (typeof selectJob === "function") selectJob(preset.jobId);
      else if (typeof renderJobCards === "function") renderJobCards();
    } catch (_) {}
    renderPresetSelection();
  }

  function ensurePresetSelection() {
    const phase = document.getElementById("phase1");
    if (!phase) return null;
    let panel = document.getElementById("gilsysDeckPresetSelection");
    if (panel) return panel;
    panel = document.createElement("section");
    panel.id = "gilsysDeckPresetSelection";
    panel.className = "gilsys-deck-preset-selection";
    const jobArea = document.getElementById("jobSelectArea");
    if (jobArea?.parentElement) {
      jobArea.parentElement.insertBefore(panel, jobArea);
    } else {
      phase.appendChild(panel);
    }
    panel.addEventListener("click", event => {
      const edit = event.target.closest?.("[data-preset-edit]");
      if (edit) {
        event.preventDefault();
        const key = edit.dataset.presetEdit;
        applyPreset(key);
        window.gilsysOpenDeckEditor?.("edit");
        return;
      }
      const button = event.target.closest?.("[data-preset-key]");
      if (!button) return;
      event.preventDefault();
      applyPreset(button.dataset.presetKey);
    });
    return panel;
  }

  function renderPresetSelection() {
    const panel = ensurePresetSelection();
    if (!panel) return;
    const current = getPreset();
    panel.innerHTML = `
      <div class="gilsys-deck-preset-head">
        <div>
          <p>Deck Preset</p>
          <h3>デッキを選択</h3>
        </div>
        <span>${safe(current.name)} 選択中</span>
      </div>
      <div class="gilsys-deck-preset-grid">
        ${presets.map(renderPresetCard).join("")}
      </div>
    `;
    document.querySelectorAll("#gilsysDeckPresetSelection [data-preset-key]").forEach(button => {
      button.classList.toggle("is-selected", button.dataset.presetKey === selectedPresetKey);
    });
    const connect = document.getElementById("btnConnectPhase1");
    if (connect && !window.isConnecting) connect.disabled = false;
  }

  function renderPresetCard(preset) {
    const deckInfo = getStoredDeck(preset.key);
    const cards = deckInfo.cards;
    const count = cards.length || 0;
    const specialCount = cards.filter(card => String(card.job || "").includes(preset.key) || String(card.job || "").includes(preset.job)).length;
    const status = deckInfo.saved ? "保存済み" : "初期プリセット";
    return `
      <article class="gilsys-deck-preset-card ${preset.key === selectedPresetKey ? "is-selected" : ""}">
        <button type="button" data-preset-key="${safe(preset.key)}">
          <span class="gilsys-deck-preset-icon">${safe(preset.icon)}</span>
          <b>${safe(preset.name)}</b>
          <small>${safe(preset.job)}</small>
          <em>${safe(preset.desc)}</em>
          <i>${count} / ${deckSize}枚　専用${specialCount}枚　${safe(status)}</i>
        </button>
        <button type="button" class="gilsys-deck-preset-edit" data-preset-edit="${safe(preset.key)}">編集</button>
      </article>
    `;
  }

  function setPresetModeEnabled(enabled) {
    const phase = document.getElementById("phase1");
    if (!phase) return;
    phase.classList.toggle("gilsys-deck-preset-mode", !!enabled);
    const panel = ensurePresetSelection();
    if (panel) {
      panel.hidden = !enabled;
      panel.setAttribute("aria-hidden", enabled ? "false" : "true");
    }
  }

  function prepareNormalDeckMatch(mode) {
    cleanupSocket?.();
    if (typeof isConnecting !== "undefined") isConnecting = false;
    window.isCpuMode = false;
    window.matchMode = mode || "random";
    if (typeof setPhase === "function") setPhase(PHASE.RANDOM_READY);
    setPresetModeEnabled(true);
    applyPreset(selectedPresetKey);
    const title = document.getElementById("phase1Title");
    if (title) title.textContent = mode === "room" ? "ルーム戦デッキ選択" : "ランク戦デッキ選択";
    const roomArea = document.getElementById("roomCodeArea");
    if (roomArea) {
      roomArea.style.display = "block";
      roomArea.style.visibility = mode === "room" ? "visible" : "hidden";
    }
    const cpuJobArea = document.getElementById("cpuJobArea");
    if (cpuJobArea) cpuJobArea.style.display = "none";
    const status = document.getElementById("connectStatus");
    if (status) status.textContent = "使うデッキを選んでから接続してください。";
    const connectBtn = document.getElementById("btnConnectPhase1");
    if (connectBtn) {
      connectBtn.textContent = mode === "room" ? "ルーム接続" : "対戦開始";
      connectBtn.disabled = false;
    }
    renderPresetSelection();
  }

  function installPresetButtons() {
    const random = document.getElementById("btnRandom");
    if (random && !random.dataset.gilsysDeckPresetBound) {
      random.dataset.gilsysDeckPresetBound = "1";
      random.onclick = () => prepareNormalDeckMatch("random");
    }
    const room = document.getElementById("btnRoom");
    if (room && !room.dataset.gilsysDeckPresetBound) {
      room.dataset.gilsysDeckPresetBound = "1";
      room.onclick = () => prepareNormalDeckMatch("room");
    }
  }

  document.addEventListener("click", event => {
    const otherModeButton = event.target.closest?.("#btnCPU,#btnTutorial,#btnDojo,#btnCancelRandom,#btnBackToMenu");
    if (!otherModeButton) return;
    setTimeout(() => setPresetModeEnabled(false), 0);
  }, true);

  window.gilsysCardEndTurn = function gilsysCardEndTurn() {
    try {
      if (typeof myTurn !== "undefined" && !myTurn) {
        showCenterToast?.("相手ターンです", 1200);
        return false;
      }
      if (typeof ws === "undefined" || !ws || ws.readyState !== WebSocket.OPEN) {
        showCenterToast?.("サーバーに接続されていません。", 1400);
        return false;
      }
      ws.send(JSON.stringify({ type: "action", action: "ターン終了" }));
      return true;
    } catch (_) {
      showCenterToast?.("ターン終了に失敗しました。", 1400);
      return false;
    }
  };

  const originalSetPhase = window.setPhase;
  if (typeof originalSetPhase === "function" && !originalSetPhase.__gilsysDeckPresetWrapped) {
    const wrapped = function wrappedSetPhase(phase) {
      const result = originalSetPhase.apply(this, arguments);
      if (phase !== PHASE?.RANDOM_READY) setPresetModeEnabled(false);
      else if (window.matchMode === "random" || window.matchMode === "room") {
        setPresetModeEnabled(true);
        renderPresetSelection();
      }
      return result;
    };
    wrapped.__gilsysDeckPresetWrapped = true;
    window.setPhase = wrapped;
  }

  document.addEventListener("DOMContentLoaded", () => {
    installPresetButtons();
    ensurePresetSelection();
    applyPreset(selectedPresetKey);
    setPresetModeEnabled(false);
  });
  if (document.readyState !== "loading") {
    installPresetButtons();
    ensurePresetSelection();
    applyPreset(selectedPresetKey);
    setPresetModeEnabled(false);
  }
  requestAnimationFrame(installPresetButtons);
})();
