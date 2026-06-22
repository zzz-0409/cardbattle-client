(() => {
  if (window.__gilsysDeckEditorScreenInstalled) return;
  window.__gilsysDeckEditorScreenInstalled = true;

  const DECK_SIZE = 20;
  const SAME_CARD_LIMIT = 2;

  const jobs = [
    { key: "warrior", label: "戦士", note: "装備で攻防を伸ばす基本職", icon: "剣" },
    { key: "archer", label: "弓兵", note: "弓スロットと矢で戦う職業", icon: "弓" },
    { key: "mage", label: "魔導士", note: "魔力を使うカードを扱う職業", icon: "魔" },
  ];

  const jobLabelByKey = {
    all: "共通",
    warrior: "戦士",
    archer: "弓兵",
    mage: "魔導士",
  };

  const cardPool = [
    card("iron_sword", "☆1 攻撃力装備", "equip", 10, "攻撃力+2", "剣", "all", 1),
    card("iron_shield", "☆1 防御力装備", "equip", 10, "防御力+2", "盾", "all", 1),
    card("leather_boots", "☆1 コイン装備", "equip", 10, "毎ターンコイン+2", "靴", "all", 1),
    card("potion", "☆1 HP回復", "item", 15, "HP+10", "薬", "all", 1),
    card("guard_charm", "☆1 防御力UP", "item", 8, "防御力+6 / 1T", "守", "all", 1),
    card("power_draught", "☆1 攻撃力UP", "item", 8, "攻撃力+6 / 1T", "力", "all", 1),
    card("silver_potion", "☆2 HP回復", "item", 20, "HP+15", "癒", "all", 2),

    card("warrior_axe", "戦士の斧", "special", 20, "特殊装備: 攻撃力+3", "斧", "warrior", 2),
    card("warrior_guard", "盾の構え", "item", 12, "防御力+4 / 1T", "構", "warrior", 2),
    card("warrior_banner", "鼓舞の旗", "special", 20, "攻撃力+2 / 3T", "旗", "warrior", 2),

    card("archer_bow", "連射の弓", "special", 20, "弓スロットに装備", "弓", "archer", 2),
    card("poison_arrow", "毒の矢", "special", 20, "毒矢を装備", "矢", "archer", 2),
    card("arrow_case", "矢筒", "special", 10, "矢を補充", "筒", "archer", 1),

    card("mana_crystal", "魔力結晶", "item", 15, "魔力+2", "晶", "mage", 1),
    card("fire_book", "火球の書", "special", 25, "魔力+2 / 魔法貫通", "書", "mage", 3),
    card("mage_robe", "魔導ローブ", "special", 10, "魔力+1 / 防御+2", "衣", "mage", 1),
  ];

  const state = {
    job: localStorage.getItem("gilsysDeckEditorJob") || "warrior",
    mode: "edit",
    filter: "usable",
    selectedBaseId: "",
    decks: {},
  };

  function card(id, name, kind, cost, desc, icon, job, star) {
    return { id, baseId: id, name, kind, cost, desc, icon, job, star };
  }

  function safe(value) {
    if (typeof escapeHtml === "function") return escapeHtml(String(value ?? ""));
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeJob(value) {
    const raw = String(value || "");
    if (raw.includes("archer") || raw.includes("弓")) return "archer";
    if (raw.includes("mage") || raw.includes("魔")) return "mage";
    if (raw.includes("warrior") || raw.includes("戦")) return "warrior";
    if (raw === "all" || raw.includes("共通")) return "all";
    return raw || "all";
  }

  function getJobLabel(key) {
    return jobLabelByKey[normalizeJob(key)] || String(key || "");
  }

  function getCardType(cardData) {
    return String(cardData?.kind || "item") === "item" ? "item" : "equip";
  }

  function getTypeLabel(cardData) {
    if (cardData.kind === "special") return "特殊装備";
    return cardData.kind === "equip" ? "装備" : "アイテム";
  }

  function getRarityClass(cardData) {
    const star = Number(cardData?.star || 1);
    if (star >= 4) return "rarity-rainbow";
    if (star === 3) return "rarity-gold";
    if (star === 2) return "rarity-silver";
    return "rarity-bronze";
  }

  function getScopeLabel(cardData) {
    const job = normalizeJob(cardData.job);
    const scope = job === "all" ? "共通" : `${getJobLabel(job)}専用`;
    const type = getCardType(cardData) === "item" ? "アイテム" : "装備";
    return `☆${cardData.star || 1}${scope}${type}`;
  }

  function canUseCard(cardData, jobKey = state.job) {
    const cardJob = normalizeJob(cardData.job);
    return cardJob === "all" || cardJob === normalizeJob(jobKey);
  }

  function getUsableCards(jobKey = state.job) {
    return cardPool.filter(cardData => canUseCard(cardData, jobKey));
  }

  function getDefaultDeck(jobKey = state.job) {
    return getUsableCards(jobKey)
      .flatMap(cardData => [makeDeckCopy(cardData, 1), makeDeckCopy(cardData, 2)])
      .slice(0, DECK_SIZE);
  }

  function makeDeckCopy(cardData, copyNumber) {
    return {
      ...cardData,
      id: copyNumber > 1 ? `${cardData.baseId}_${copyNumber}` : cardData.baseId,
      baseId: cardData.baseId,
    };
  }

  function storageKey(jobKey = state.job) {
    return `gilsysCardDeck:${normalizeJob(jobKey)}`;
  }

  function loadDeck(jobKey = state.job) {
    const key = normalizeJob(jobKey);
    if (state.decks[key]) return state.decks[key];
    try {
      const stored = localStorage.getItem(storageKey(key));
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length) {
          state.decks[key] = sanitizeDeck(parsed, key);
          return state.decks[key];
        }
      }
    } catch (_) {}
    state.decks[key] = getDefaultDeck(key);
    return state.decks[key];
  }

  function sanitizeDeck(deck, jobKey = state.job) {
    const counts = new Map();
    const result = [];
    deck.forEach((raw) => {
      if (result.length >= DECK_SIZE) return;
      const baseId = raw.baseId || String(raw.id || "").replace(/_\d+$/, "");
      const source = cardPool.find(cardData => cardData.baseId === baseId) || raw;
      if (!canUseCard(source, jobKey)) return;
      const count = counts.get(baseId) || 0;
      if (count >= SAME_CARD_LIMIT) return;
      counts.set(baseId, count + 1);
      result.push(makeDeckCopy({ ...source, baseId }, count + 1));
    });
    return result;
  }

  function saveDeck(jobKey = state.job) {
    const key = normalizeJob(jobKey);
    const deck = sanitizeDeck(loadDeck(key), key);
    state.decks[key] = deck;
    localStorage.setItem(storageKey(key), JSON.stringify(deck));
    localStorage.setItem("gilsysDeckEditorJob", key);
    window.gilsysDeckCardsByJob = window.gilsysDeckCardsByJob || {};
    window.gilsysDeckCardsByJob[key] = deck;
    showToast(`${getJobLabel(key)}デッキを保存しました`);
    window.gilsysRenderCardHand?.(true);
    render();
  }

  function setJob(jobKey) {
    state.job = normalizeJob(jobKey);
    state.selectedBaseId = "";
    localStorage.setItem("gilsysDeckEditorJob", state.job);
    loadDeck(state.job);
    render();
  }

  function setFilter(filter) {
    state.filter = filter || "usable";
    render();
  }

  function addCard(baseId) {
    const source = cardPool.find(cardData => cardData.baseId === baseId);
    if (!source || !canUseCard(source)) {
      showToast("この職業では使えないカードです");
      return;
    }
    const deck = loadDeck();
    if (deck.length >= DECK_SIZE) {
      showToast("デッキは20枚までです");
      return;
    }
    const sameCount = deck.filter(cardData => cardData.baseId === baseId).length;
    if (sameCount >= SAME_CARD_LIMIT) {
      showToast("同名カードは2枚までです");
      return;
    }
    deck.push(makeDeckCopy(source, sameCount + 1));
    state.selectedBaseId = baseId;
    render();
  }

  function removeCard(index) {
    const deck = loadDeck();
    const removed = deck.splice(Number(index), 1)[0];
    if (removed) state.selectedBaseId = removed.baseId;
    state.decks[state.job] = sanitizeDeck(deck);
    render();
  }

  function resetDeck() {
    state.decks[state.job] = getDefaultDeck(state.job);
    showToast(`${getJobLabel(state.job)}デッキを初期構成に戻しました`);
    render();
  }

  function fillDefaultIfNeeded() {
    const deck = loadDeck();
    if (deck.length >= DECK_SIZE) return;
    const counts = new Map(deck.map(cardData => [cardData.baseId, 0]));
    deck.forEach(cardData => counts.set(cardData.baseId, (counts.get(cardData.baseId) || 0) + 1));
    getUsableCards().forEach(cardData => {
      while (deck.length < DECK_SIZE && (counts.get(cardData.baseId) || 0) < SAME_CARD_LIMIT) {
        const nextCount = (counts.get(cardData.baseId) || 0) + 1;
        counts.set(cardData.baseId, nextCount);
        deck.push(makeDeckCopy(cardData, nextCount));
      }
    });
    render();
  }

  function getVisiblePool() {
    if (state.filter === "all") return cardPool;
    if (state.filter === "job") return cardPool.filter(cardData => normalizeJob(cardData.job) === state.job);
    if (state.filter === "common") return cardPool.filter(cardData => normalizeJob(cardData.job) === "all");
    return cardPool.filter(cardData => canUseCard(cardData));
  }

  function getCardCount(baseId) {
    return loadDeck().filter(cardData => cardData.baseId === baseId).length;
  }

  function ensureScreen() {
    let screen = document.getElementById("gilsysDeckEditorScreen");
    if (screen) return screen;
    screen = document.createElement("section");
    screen.id = "gilsysDeckEditorScreen";
    screen.className = "gilsys-deck-editor-screen";
    screen.hidden = true;
    screen.setAttribute("aria-hidden", "true");
    screen.innerHTML = `
      <div class="gilsys-deck-editor-shell">
        <header class="gilsys-deck-editor-header">
          <div>
            <p class="gilsys-deck-editor-kicker">Deck Builder</p>
            <h2>デッキ編集</h2>
          </div>
          <div class="gilsys-deck-editor-header-actions">
            <button type="button" data-deck-action="list">カード一覧</button>
            <button type="button" data-deck-action="edit">デッキ編集</button>
            <button type="button" class="gilsys-deck-close" data-deck-action="close">閉じる</button>
          </div>
        </header>
        <div class="gilsys-deck-editor-body">
          <aside class="gilsys-deck-job-panel">
            <div class="gilsys-deck-section-title">職業選択</div>
            <div id="gilsysDeckJobList" class="gilsys-deck-job-list"></div>
          </aside>
          <main class="gilsys-deck-pool-panel">
            <div class="gilsys-deck-pool-head">
              <div>
                <div class="gilsys-deck-section-title">カード選択</div>
                <p id="gilsysDeckPoolHint"></p>
              </div>
              <div class="gilsys-deck-filter-row">
                <button type="button" data-deck-filter="usable">使用可能</button>
                <button type="button" data-deck-filter="common">共通</button>
                <button type="button" data-deck-filter="job">職業専用</button>
                <button type="button" data-deck-filter="all">全表示</button>
              </div>
            </div>
            <div id="gilsysDeckCardPool" class="gilsys-deck-card-pool"></div>
          </main>
          <aside class="gilsys-deck-list-panel">
            <div class="gilsys-deck-count-box">
              <span>デッキ</span>
              <b id="gilsysDeckCountText">0 / 20</b>
            </div>
            <div id="gilsysDeckList" class="gilsys-deck-list"></div>
            <div class="gilsys-deck-editor-footer">
              <button type="button" data-deck-action="fill">20枚まで補充</button>
              <button type="button" data-deck-action="reset">初期デッキ</button>
              <button type="button" class="primary" data-deck-action="save">保存</button>
            </div>
          </aside>
        </div>
      </div>
      <div id="gilsysDeckEditorToast" class="gilsys-deck-editor-toast" aria-live="polite"></div>
    `;
    document.body.appendChild(screen);
    screen.addEventListener("click", handleScreenClick);
    return screen;
  }

  function renderJobs() {
    const root = document.getElementById("gilsysDeckJobList");
    if (!root) return;
    root.innerHTML = jobs.map(job => {
      const deck = loadDeck(job.key);
      return `
        <button type="button" class="gilsys-deck-job-btn ${job.key === state.job ? "is-active" : ""}" data-deck-job="${safe(job.key)}">
          <span>${safe(job.icon)}</span>
          <b>${safe(job.label)}</b>
          <small>${safe(deck.length)} / ${DECK_SIZE}</small>
          <em>${safe(job.note)}</em>
        </button>
      `;
    }).join("");
  }

  function renderPool() {
    const root = document.getElementById("gilsysDeckCardPool");
    const hint = document.getElementById("gilsysDeckPoolHint");
    if (!root) return;
    if (hint) {
      hint.textContent = state.mode === "list"
        ? "全カードの確認用です。職業が違うカードはロック表示になります。"
        : "カードを選ぶと右のデッキに入ります。同名カードは2枚までです。";
    }
    document.querySelectorAll("[data-deck-filter]").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.deckFilter === state.filter);
    });
    root.innerHTML = getVisiblePool().map(cardData => renderPoolCard(cardData)).join("");
  }

  function renderPoolCard(cardData) {
    const count = getCardCount(cardData.baseId);
    const usable = canUseCard(cardData);
    const full = loadDeck().length >= DECK_SIZE;
    const capped = count >= SAME_CARD_LIMIT;
    const disabled = state.mode === "list" || !usable || full || capped;
    const classes = [
      "gilsys-deck-edit-card",
      getCardType(cardData) === "item" ? "type-item" : "type-equip",
      getRarityClass(cardData),
      state.selectedBaseId === cardData.baseId ? "is-selected" : "",
      !usable ? "is-locked" : "",
    ].filter(Boolean).join(" ");
    return `
      <button type="button" class="${classes}" data-deck-add="${safe(cardData.baseId)}" ${disabled ? "disabled" : ""}>
        <span class="gilsys-deck-card-cost">${safe(cardData.cost)}</span>
        <span class="gilsys-deck-card-name">${safe(cardData.name)}</span>
        <span class="gilsys-deck-card-art">${safe(cardData.icon)}</span>
        <span class="gilsys-deck-card-desc">${safe(cardData.desc)}</span>
        <span class="gilsys-deck-card-meta">${safe(getScopeLabel(cardData))}</span>
        <span class="gilsys-deck-card-count">${safe(count)} / ${SAME_CARD_LIMIT}</span>
        ${!usable ? `<span class="gilsys-deck-card-lock">${safe(getJobLabel(cardData.job))}限定</span>` : ""}
      </button>
    `;
  }

  function renderDeckList() {
    const root = document.getElementById("gilsysDeckList");
    const count = document.getElementById("gilsysDeckCountText");
    const deck = loadDeck();
    if (count) count.textContent = `${deck.length} / ${DECK_SIZE}`;
    if (!root) return;
    if (!deck.length) {
      root.innerHTML = `<div class="gilsys-deck-empty">カードを選んでデッキに入れてください。</div>`;
      return;
    }
    root.innerHTML = deck.map((cardData, index) => `
      <button type="button" class="gilsys-deck-list-row ${state.selectedBaseId === cardData.baseId ? "is-selected" : ""}" data-deck-remove="${index}">
        <span class="gilsys-deck-list-cost">${safe(cardData.cost)}</span>
        <b>${safe(cardData.name)}</b>
        <small>${safe(getTypeLabel(cardData))}</small>
        <em>${safe(getScopeLabel(cardData))}</em>
      </button>
    `).join("");
  }

  function renderHomeDetail() {
    const detail = document.getElementById("gilsysHomeDeckDetail");
    if (!detail) return;
    const deck = loadDeck(state.job);
    detail.innerHTML = `
      <h3>${safe(getJobLabel(state.job))}デッキ</h3>
      <p>${safe(deck.length)} / ${DECK_SIZE}枚。デッキ編集を押すと、職業選択からカードを入れ替えできます。</p>
    `;
  }

  function render() {
    renderJobs();
    renderPool();
    renderDeckList();
    renderHomeDetail();
    const screen = document.getElementById("gilsysDeckEditorScreen");
    if (screen) screen.dataset.mode = state.mode;
  }

  function showToast(message) {
    const toast = document.getElementById("gilsysDeckEditorToast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("is-visible"), 1600);
  }

  function openDeckEditor(mode = "edit") {
    state.mode = mode === "list" ? "list" : "edit";
    const screen = ensureScreen();
    screen.hidden = false;
    screen.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("gilsys-deck-editor-open");
    loadDeck(state.job);
    render();
  }

  function closeDeckEditor() {
    const screen = document.getElementById("gilsysDeckEditorScreen");
    if (!screen) return;
    screen.hidden = true;
    screen.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("gilsys-deck-editor-open");
  }

  function handleScreenClick(event) {
    const jobBtn = event.target.closest("[data-deck-job]");
    if (jobBtn) {
      setJob(jobBtn.dataset.deckJob);
      return;
    }
    const filterBtn = event.target.closest("[data-deck-filter]");
    if (filterBtn) {
      setFilter(filterBtn.dataset.deckFilter);
      return;
    }
    const addBtn = event.target.closest("[data-deck-add]");
    if (addBtn) {
      addCard(addBtn.dataset.deckAdd);
      return;
    }
    const removeBtn = event.target.closest("[data-deck-remove]");
    if (removeBtn) {
      removeCard(removeBtn.dataset.deckRemove);
      return;
    }
    const actionBtn = event.target.closest("[data-deck-action]");
    if (!actionBtn) return;
    const action = actionBtn.dataset.deckAction;
    if (action === "close") closeDeckEditor();
    if (action === "edit") {
      state.mode = "edit";
      render();
    }
    if (action === "list") {
      state.mode = "list";
      render();
    }
    if (action === "fill") fillDefaultIfNeeded();
    if (action === "reset") resetDeck();
    if (action === "save") saveDeck();
  }

  function bindHomeDeckButtons() {
    document.addEventListener("click", event => {
      const button = event.target.closest?.("#gilsysHomeGrowthActions .gilsys-deck-home-actions .gilsys-home-panel-btn");
      if (!button) return;
      const buttons = [...button.parentElement.querySelectorAll(".gilsys-home-panel-btn")];
      const index = buttons.indexOf(button);
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openDeckEditor(index === 1 ? "list" : "edit");
    }, true);
  }

  window.gilsysOpenDeckEditor = openDeckEditor;
  window.gilsysGetDeckEditorCards = () => cardPool.slice();
  window.gilsysGetDeckEditorDeck = (jobKey = state.job) => loadDeck(jobKey).slice();
  window.gilsysSaveDeckEditorDeck = saveDeck;

  bindHomeDeckButtons();
  document.addEventListener("DOMContentLoaded", () => {
    jobs.forEach(job => loadDeck(job.key));
    renderHomeDetail();
  });
  if (document.readyState !== "loading") {
    jobs.forEach(job => loadDeck(job.key));
    renderHomeDetail();
  }
})();
