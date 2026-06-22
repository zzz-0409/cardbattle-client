(() => {
  if (window.__gilsysCardBattleUIInstalled) return;
  window.__gilsysCardBattleUIInstalled = true;

  const labels = {
    hand: "\u624b\u672d",
    handMeta: "\u30ab\u30fc\u30c9",
    leader: "\u30ea\u30fc\u30c0\u30fc",
    level: "\u30ec\u30d9\u30eb\u30a2\u30c3\u30d7",
    shop: "\u30b7\u30e7\u30c3\u30d7",
    item: "\u30a2\u30a4\u30c6\u30e0",
    equip: "\u88c5\u5099",
    special: "\u7279\u6b8a\u88c5\u5099",
    permanent: "\u5e38\u6642",
    empty: "\u624b\u672d\u306a\u3057",
    selected: "\u9078\u629e\u4e2d",
    locked: "\u4eca\u306f\u4f7f\u3048\u307e\u305b\u3093",
    returnHand: "\u624b\u672d\u306b\u623b\u308b",
    leaderHint: "\u653b\u6483/\u30b9\u30ad\u30eb",
    leaderWait: "\u76f8\u624b\u30bf\u30fc\u30f3",
    enemyHand: "\u76f8\u624b\u306e\u624b\u672d",
    enemyEquipZone: "\u76f8\u624b\u88c5\u5099/\u7279\u6b8a",
    selfEquipZone: "\u81ea\u5206\u88c5\u5099/\u7279\u6b8a",
    enemyItemZone: "\u76f8\u624b\u30a2\u30a4\u30c6\u30e0",
    selfItemZone: "\u81ea\u5206\u30a2\u30a4\u30c6\u30e0",
    turn: "TURN",
    deck: "\u30c7\u30c3\u30ad",
    grave: "\u5893\u5730",
    menu: "\u30e1\u30cb\u30e5\u30fc",
    endTurn: "\u30bf\u30fc\u30f3\u7d42\u4e86",
    menuLater: "\u30e1\u30cb\u30e5\u30fc\u306f\u5f8c\u3067\u63a5\u7d9a\u3057\u307e\u3059\u3002",
    endTurnLater: "\u30bf\u30fc\u30f3\u7d42\u4e86\u306f\u30c7\u30c3\u30ad\u5b9f\u88c5\u6642\u306b\u63a5\u7d9a\u3057\u307e\u3059\u3002",
    useLater: "\u3053\u306e\u30ab\u30fc\u30c9\u306e\u52b9\u679c\u63a5\u7d9a\u306f\u6b21\u306b\u884c\u3044\u307e\u3059\u3002",
    playCard: "\u4f7f\u7528",
    clickAgainToPlay: "\u3082\u3046\u4e00\u5ea6\u30af\u30ea\u30c3\u30af\u3067\u4f7f\u7528",
    noConnection: "\u30b5\u30fc\u30d0\u30fc\u306b\u63a5\u7d9a\u3055\u308c\u3066\u3044\u307e\u305b\u3093\u3002",
    costShort: "\u30b3\u30b9\u30c8\u304c\u8db3\u308a\u307e\u305b\u3093\u3002",
    defaultDeck: "\u4eee\u30c7\u30c3\u30ad",
    levelEffect: "\u7d4c\u9a13\u5024\u304c\u8db3\u308a\u3066\u3044\u308c\u3070\u30ec\u30d9\u30eb\u3092\u4e0a\u3052\u308b\u3002",
    shopEffect: "\u30a2\u30a4\u30c6\u30e0\u3068\u88c5\u5099\u3092\u8cfc\u5165\u3059\u308b\u3002",
    itemEffect: "\u4f7f\u7528\u3059\u308b\u3068\u52b9\u679c\u3092\u767a\u52d5\u3059\u308b\u3002",
    equipEffect: "\u88c5\u5099\u3057\u3066\u80fd\u529b\u3092\u5909\u5316\u3055\u305b\u308b\u3002",
    specialEffect: "\u7279\u6b8a\u88c5\u5099\u3068\u3057\u3066\u52b9\u679c\u3092\u767a\u52d5\u3059\u308b\u3002",
  };

  const categoryOrder = [
    { key: "item", label: labels.item, icon: "IT" },
    { key: "equip", label: labels.equip, icon: "EQ" },
    { key: "special", label: labels.special, icon: "SP" },
  ];

  const state = {
    battleActive: false,
    battleSession: 0,
    itemSignature: "",
    selectedUid: "",
    deck: [],
    hand: [],
    grave: [],
    deckJob: "",
    deckSession: 0,
  };

  function safe(value) {
    if (typeof escapeHtml === "function") return escapeHtml(String(value ?? ""));
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function text(value, fallback = "") {
    return String(value ?? fallback ?? "");
  }

  function getPhase() {
    return document.getElementById("phase2");
  }

  function isDisplayed(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function isDojoMode() {
    const phase = getPhase();
    return window.matchMode === "dojo" || phase?.classList.contains("is-dojo-mode");
  }

  function isCardModeEligible() {
    const phase = getPhase();
    return !!phase && isDisplayed(phase) && !isDojoMode();
  }

  function isPlayerTurn() {
    try {
      if (typeof myTurn !== "undefined") return !!myTurn;
    } catch (_) {}
    return !!window.myTurn;
  }

  function sendEndTurnAction() {
    try {
      const socket = (typeof ws !== "undefined" && ws) ? ws : window.ws;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        if (typeof showCenterToast === "function") showCenterToast(labels.noConnection, 1400);
        return false;
      }
      socket.send(JSON.stringify({ type: "action", action: "end_turn" }));
      return true;
    } catch (_) {
      if (typeof showCenterToast === "function") showCenterToast("\u30bf\u30fc\u30f3\u7d42\u4e86\u306b\u5931\u6557\u3057\u307e\u3057\u305f\u3002", 1400);
      return false;
    }
  }

  function getList() {
    return document.getElementById("gilsysCommandList");
  }

  function getTitle() {
    return document.getElementById("gilsysCommandListTitle");
  }

  function getListPanel() {
    return document.querySelector("#phase2.gilsys-battle-ui .gilsys-command-list-panel");
  }

  function getDetailPanel() {
    return document.querySelector("#phase2.gilsys-battle-ui .gilsys-command-detail-panel");
  }

  function getActionButton(id) {
    return document.getElementById(id);
  }

  function getCurrentJobName() {
    const fromStatus = normalizeCardText(document.getElementById("gilsysSelfJob")?.textContent || "");
    if (fromStatus && fromStatus !== "JOB" && fromStatus !== "\u8077\u696d") return fromStatus;
    const raw = window.myJob || window.selectedJobName || "";
    return normalizeCardText(raw || "\u6226\u58eb");
  }

  function normalizeJobKey(jobName) {
    const name = String(jobName || "");
    if (name.includes("\u5f13")) return "archer";
    if (name.includes("\u9b54")) return "mage";
    return "warrior";
  }

  const jobLabelByKey = {
    all: "\u5171\u901a",
    warrior: "\u6226\u58eb",
    archer: "\u5f13\u5175",
    mage: "\u9b54\u5c0e\u58eb",
  };

  function getDeckCardStar(card) {
    const value = Math.floor(Number(card?.star ?? card?.rarity ?? 1));
    return Number.isFinite(value) ? Math.max(1, value) : 1;
  }

  function getDeckCardRarityClass(card) {
    const star = getDeckCardStar(card);
    if (star >= 4) return "rarity-rainbow";
    if (star === 3) return "rarity-gold";
    if (star === 2) return "rarity-silver";
    return "rarity-bronze";
  }

  function getDeckCardType(card) {
    return String(card?.kind || "item") === "item" ? "item" : "equip";
  }

  function getDeckCardScopeLabel(card) {
    const star = getDeckCardStar(card);
    const job = normalizeGilsysCardJobForDeck(card?.job);
    const scope = job === "all" ? "\u5171\u901a" : `${jobLabelByKey[job] || job}\u5c02\u7528`;
    const type = getDeckCardType(card) === "item" ? "\u30a2\u30a4\u30c6\u30e0" : "\u88c5\u5099";
    return `\u2606${star}${scope}${type}`;
  }

  function normalizeGilsysCardJobForDeck(value = "") {
    const raw = String(value || "");
    if (raw.includes("archer") || raw.includes("\u5f13")) return "archer";
    if (raw.includes("mage") || raw.includes("\u9b54")) return "mage";
    if (raw.includes("warrior") || raw.includes("\u6226")) return "warrior";
    return "all";
  }

  const defaultCardArtById = {
    iron_sword: "Assets/cardbattle-ui/card-art/iron_sword.png",
    iron_shield: "Assets/cardbattle-ui/card-art/iron_shield.png",
    leather_boots: "Assets/cardbattle-ui/card-art/leather_boots.png",
    potion: "Assets/cardbattle-ui/card-art/potion.png",
    guard_charm: "Assets/cardbattle-ui/card-art/guard_charm.png",
    power_draught: "Assets/cardbattle-ui/card-art/power_draught.png",
    silver_potion: "Assets/cardbattle-ui/card-art/silver_potion.png",
    warrior_axe: "Assets/cardbattle-ui/card-art/warrior_axe.png",
    warrior_guard: "Assets/cardbattle-ui/card-art/warrior_guard.png",
    warrior_banner: "Assets/cardbattle-ui/card-art/warrior_banner.png",
    archer_bow: "Assets/cardbattle-ui/card-art/archer_bow.png",
    poison_arrow: "Assets/cardbattle-ui/card-art/poison_arrow.png",
    arrow_case: "Assets/cardbattle-ui/card-art/arrow_case.png",
    mana_crystal: "Assets/cardbattle-ui/card-art/mana_crystal.png",
    fire_book: "Assets/cardbattle-ui/card-art/fire_book.png",
    mage_robe: "Assets/cardbattle-ui/card-art/mage_robe.png",
  };

  function makeDeckCard(id, name, kind, cost, desc, icon, job = "all", options = {}) {
    const card = { id, name, kind, cost, desc, icon, job, ...options };
    if (!card.image) card.image = defaultCardArtById[id] || "";
    return card;
  }

  function getDefaultDeckCards(jobName) {
    const key = normalizeJobKey(jobName);
    const generic = [
      makeDeckCard("iron_sword", "\u26061 \u653b\u6483\u529b\u88c5\u5099", "equip", 10, "\u653b\u6483\u529b+2", "\u2694", "all", { star: 1 }),
      makeDeckCard("iron_shield", "\u26061 \u9632\u5fa1\u529b\u88c5\u5099", "equip", 10, "\u9632\u5fa1\u529b+2", "\u25c6", "all", { star: 1 }),
      makeDeckCard("leather_boots", "\u26061 \u30b3\u30a4\u30f3\u88c5\u5099", "equip", 10, "\u6bce\u30bf\u30fc\u30f3\u30b3\u30a4\u30f3+2", "\u25a3", "all", { star: 1 }),
      makeDeckCard("potion", "\u26061 HP\u56de\u5fa9", "item", 15, "HP+10", "\u2726", "all", { star: 1 }),
      makeDeckCard("guard_charm", "\u26061 \u9632\u5fa1\u529bUP", "item", 8, "\u9632\u5fa1\u529b+6 / 1T", "\u25c7", "all", { star: 1 }),
      makeDeckCard("power_draught", "\u26061 \u653b\u6483\u529bUP", "item", 8, "\u653b\u6483\u529b+6 / 1T", "\u25b2", "all", { star: 1 }),
      makeDeckCard("silver_potion", "\u26062 HP\u56de\u5fa9", "item", 20, "HP+15", "\u2736", "all", { star: 2 }),
    ];
    const jobCards = {
      warrior: [
        makeDeckCard("warrior_axe", "\u6226\u58eb\u306e\u65a7", "special", 20, "\u7279\u6b8a\u88c5\u5099: \u653b\u6483\u529b+3", "\u2692", "warrior", { star: 2 }),
        makeDeckCard("warrior_guard", "\u76fe\u306e\u69cb\u3048", "item", 12, "\u9632\u5fa1\u529b+4 / 1T", "\u25a0", "warrior", { star: 2 }),
        makeDeckCard("warrior_banner", "\u9f13\u821e\u306e\u65d7", "special", 20, "\u653b\u6483\u529b+2 / 3T", "\u2691", "warrior", { star: 2 }),
      ],
      archer: [
        makeDeckCard("archer_bow", "\u9023\u5c04\u306e\u5f13", "special", 20, "\u5f13\u30b9\u30ed\u30c3\u30c8\u306b\u88c5\u5099", "\u27b6", "archer", { star: 2 }),
        makeDeckCard("poison_arrow", "\u6bd2\u306e\u77e2", "special", 20, "\u6bd2\u77e2\u3092\u88c5\u5099", "\u2197", "archer", { star: 2 }),
        makeDeckCard("arrow_case", "\u77e2\u7b52", "special", 10, "\u77e2\u3092\u88dc\u5145", "\u25eb", "archer", { star: 1 }),
      ],
      mage: [
        makeDeckCard("mana_crystal", "\u9b54\u529b\u7d50\u6676", "item", 15, "\u9b54\u529b+2", "\u2727", "mage", { star: 1 }),
        makeDeckCard("fire_book", "\u706b\u7403\u306e\u66f8", "special", 25, "\u9b54\u529b+2 / \u9b54\u6cd5\u8cab\u901a", "\u2739", "mage", { star: 3 }),
        makeDeckCard("mage_robe", "\u9b54\u5c0e\u30ed\u30fc\u30d6", "special", 10, "\u9b54\u529b+1 / \u9632\u5fa1+2", "\u25c9", "mage", { star: 1 }),
      ],
    }[key];
    const unique = [...generic, ...jobCards];
    return unique.flatMap(card => [card, { ...card, id: `${card.id}_2` }]).slice(0, 20);
  }

  function loadSelectedDeck(jobName) {
    const key = normalizeJobKey(jobName);
    const candidates = [
      window.gilsysSelectedDeckCards,
      window.gilsysDeckCardsByJob?.[key],
      window.gilsysDeckCardsByJob?.[jobName],
    ];
    try {
      const stored = localStorage.getItem(`gilsysCardDeck:${key}`) || localStorage.getItem(`gilsysCardDeck:${jobName}`);
      if (stored) candidates.push(JSON.parse(stored));
    } catch (_) {}
    const selected = candidates.find(value => Array.isArray(value) && value.length);
    if (!selected) return getDefaultDeckCards(jobName);
    return selected.map((card, index) => ({
      id: card.id || card.uid || `${card.name || "card"}_${index}`,
      name: card.name || "\u30ab\u30fc\u30c9",
      kind: card.kind || card.category || "item",
      cost: Number(card.cost ?? card.coin ?? 1),
      desc: card.desc || card.description || card.effect_text || card.effect || "",
      icon: card.icon || "\u25c6",
      job: card.job || "all",
      star: getDeckCardStar(card),
      image: card.image || card.art || "",
    })).slice(0, 20);
  }

  function shuffleCards(cards) {
    const next = [...cards];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [next[index], next[swap]] = [next[swap], next[index]];
    }
    return next;
  }

  function ensureCardDeckState(force = false) {
    const jobName = getCurrentJobName();
    if (!force && state.deckSession === state.battleSession && state.deckJob === jobName && state.hand.length) return;
    const fullDeck = shuffleCards(loadSelectedDeck(jobName));
    state.deckJob = jobName;
    state.deckSession = state.battleSession;
    state.hand = fullDeck.slice(0, 5);
    state.deck = fullDeck.slice(5);
    state.grave = [];
    window.gilsysCardDeckCount = state.deck.length;
    window.gilsysCardGraveCount = state.grave.length;
  }

  function setPanelMode(mode) {
    const phase = getPhase();
    const list = getList();
    const panel = getListPanel();
    if (phase) phase.dataset.cardView = mode || "";
    if (list) list.dataset.cardView = mode || "";
    if (panel) {
      panel.classList.toggle("is-card-hand-mode", mode === "hand");
      panel.classList.toggle("is-card-leader-mode", mode === "leader");
      panel.classList.toggle("is-card-inventory-mode", mode === "inventory");
      panel.classList.toggle("is-card-shop-mode", mode === "shop");
    }
  }

  function getInventoryItems(category) {
    const all = Array.isArray(window.itemList) ? window.itemList : [];
    return all
      .filter(item => item?.category === category)
      .sort((a, b) => {
        const aEquipped = (a?.is_equipped_normal || a?.is_equipped_special) ? 1 : 0;
        const bEquipped = (b?.is_equipped_normal || b?.is_equipped_special) ? 1 : 0;
        return bEquipped - aEquipped;
      });
  }

  function getUid(item) {
    return String(item?.uid ?? item?.id ?? item?.name ?? "");
  }

  function getItemSignature() {
    const items = Array.isArray(window.itemList) ? window.itemList : [];
    return JSON.stringify(items.map(item => [
      item?.uid,
      item?.name,
      item?.category,
      item?.count,
      item?.arrow_count,
      item?.is_equipped_normal,
      item?.is_equipped_special,
    ]));
  }

  function getDeckHandSignature() {
    return `${state.deckJob}:${state.deckSession}:${state.deck.length}:${state.grave.length}:${state.hand.map(card => card.id).join("|")}`;
  }

  function getVisualMeta(item, categoryMeta) {
    if (typeof getShopVisualMeta === "function") {
      try {
        return getShopVisualMeta(item);
      } catch (_) {}
    }
    return { icon: categoryMeta.icon, theme: "theme-bronze" };
  }

  function getIconHtml(visual, fallback) {
    if (typeof getShopIconMarkup === "function") {
      try {
        return getShopIconMarkup(visual?.icon ?? fallback);
      } catch (_) {}
    }
    return safe(visual?.icon ?? fallback);
  }

  function getItemCountText(item, category) {
    if (typeof isGilsysArrowItem === "function" && isGilsysArrowItem(item)) {
      const count = typeof getGilsysArrowCount === "function"
        ? getGilsysArrowCount(item)
        : Number(item?.count ?? item?.arrow_count ?? 0);
      return Number.isFinite(Number(count)) ? `x${count}` : "";
    }
    const stack = Number(item?.stackCount ?? item?.count ?? 1);
    if (category === "item" && Number.isFinite(stack) && stack > 1) return `x${stack}`;
    return "";
  }

  function getCardMeta(item, category) {
    if (item?.is_equipped_normal || item?.is_equipped_special) return "EQUIPPED";
    const countText = getItemCountText(item, category);
    if (countText) return countText;
    if (category === "item") return "ITEM";
    if (category === "equip") return "EQUIP";
    return "SPECIAL";
  }

  function normalizeCardText(value) {
    return text(value).replace(/\s+/g, " ").trim();
  }

  function getCardDescription(item, category) {
    let desc = "";
    if (typeof getGilsysDisplayEffectText === "function") {
      try {
        desc = getGilsysDisplayEffectText(item);
      } catch (_) {}
    }
    desc = normalizeCardText(desc || item?.effect_text || item?.effectText || item?.description || item?.desc || item?.effect || "");
    if (desc) return desc;
    if (category === "item") return labels.itemEffect;
    if (category === "equip") return labels.equipEffect;
    return labels.specialEffect;
  }

  function buildPermanentCard(kind) {
    const isLevel = kind === "level";
    const id = isLevel ? "lvupBtn" : "shopBtn";
    const button = getActionButton(id);
    const disabled = !!button?.disabled || button?.style.display === "none";
    const title = isLevel ? labels.level : labels.shop;
    const icon = isLevel ? "LV" : "SHOP";
    const meta = disabled ? labels.locked : labels.permanent;
    const desc = isLevel ? labels.levelEffect : labels.shopEffect;
    return `
      <button type="button"
        class="gilsys-hand-card is-permanent is-${safe(kind)}-card ${disabled ? "is-disabled" : ""}"
        ${disabled ? "disabled" : ""}
        data-hand-kind="${safe(kind)}"
        onclick="gilsysSelectPermanentHandCard('${safe(kind)}')">
        <span class="gilsys-hand-card-name">${safe(title)}</span>
        <span class="gilsys-hand-card-kind">${safe(meta)}</span>
        <span class="gilsys-hand-card-icon">${safe(icon)}</span>
        <span class="gilsys-hand-card-desc">${safe(desc)}</span>
        <span class="gilsys-hand-card-meta">${safe(meta)}</span>
      </button>
    `;
  }

  function buildInventoryCard(categoryMeta, item, index) {
    const category = categoryMeta.key;
    const visual = getVisualMeta(item, categoryMeta);
    const uid = getUid(item);
    const pending = window.pendingInventoryActionUids?.has?.(uid);
    const equipped = item?.is_equipped_normal || item?.is_equipped_special;
    const selected = state.selectedUid && state.selectedUid === uid;
    const iconHtml = getIconHtml(visual, categoryMeta.icon);
    const name = item?.name || categoryMeta.label;
    const meta = pending ? "PENDING" : getCardMeta(item, category);
    const desc = getCardDescription(item, category);
    return `
      <button type="button"
        class="gilsys-hand-card gilsys-card-hand-inventory ${safe(visual?.theme || "")} ${equipped ? "is-equipped" : ""} ${selected ? "is-selected" : ""}"
        data-hand-category="${safe(category)}"
        data-hand-index="${safe(index)}"
        data-hand-uid="${safe(uid)}"
        title="${safe(name)}"
        onclick="gilsysSelectHandInventoryCard('${safe(category)}', ${Number(index)})">
        <span class="gilsys-hand-card-name">${safe(name)}</span>
        <span class="gilsys-hand-card-kind">${safe(meta)}</span>
        <span class="gilsys-hand-card-icon">${iconHtml}</span>
        <span class="gilsys-hand-card-desc">${safe(desc)}</span>
        <span class="gilsys-hand-card-meta">${safe(meta)}</span>
      </button>
    `;
  }

  function getDeckCardKindLabel(kind) {
    if (kind === "equip") return labels.equip;
    if (kind === "special") return labels.special;
    return labels.item;
  }

  function buildDeckHandCard(card, index) {
    const cost = Number.isFinite(Number(card.cost)) ? Number(card.cost) : 1;
    const kind = getDeckCardKindLabel(card.kind);
    const typeClass = getDeckCardType(card) === "item" ? "type-item" : "type-equip";
    const rarityClass = getDeckCardRarityClass(card);
    const bottomLabel = getDeckCardScopeLabel(card);
    const selected = state.selectedUid && state.selectedUid === card.id;
    const image = text(card.image || "");
    const icon = image
      ? `<img src="${safe(image)}" alt="" draggable="false">`
      : `<span>${safe(card.icon || "\u25c6")}</span>`;
    return `
      <button type="button"
        class="gilsys-hand-card gilsys-deck-hand-card is-${safe(card.kind || "item")}-card ${safe(typeClass)} ${safe(rarityClass)} ${selected ? "is-selected" : ""}"
        data-hand-deck-index="${Number(index)}"
        data-hand-uid="${safe(card.id)}"
        data-card-drop-type="${safe(getDeckCardType(card))}"
        draggable="true"
        title="${safe(card.name)}"
        ondragstart="gilsysStartDeckCardDrag(event, ${Number(index)})"
        ondragend="gilsysEndDeckCardDrag(event)"
        onclick="gilsysSelectDeckHandCard(${Number(index)})">
        <span class="gilsys-card-cost">${safe(cost)}</span>
        <span class="gilsys-hand-card-name">${safe(card.name)}</span>
        <span class="gilsys-hand-card-kind">${safe(kind)}</span>
        <span class="gilsys-card-art-frame"><span class="gilsys-hand-card-icon">${icon}</span></span>
        <span class="gilsys-hand-card-desc">${safe(card.desc || labels.useLater)}</span>
        <span class="gilsys-card-play-hint">${safe(labels.playCard)}</span>
        <span class="gilsys-hand-card-meta">${safe(bottomLabel)}</span>
      </button>
    `;
  }

  function updateSelectedHandCard(uid) {
    const list = getList();
    if (!list) return;
    list.querySelectorAll(".gilsys-hand-card").forEach(button => {
      button.classList.toggle("is-selected", !!uid && button.dataset.handUid === uid);
    });
  }

  function setHandDetail() {
    if (typeof setGilsysCommandDetail === "function") {
      setGilsysCommandDetail(
        labels.hand,
        labels.handMeta,
        "",
        "\u25c6",
        null
      );
    }
    const btn = document.getElementById("gilsysConfirmBtn");
    if (btn) btn.disabled = true;
  }

  window.gilsysSelectPermanentHandCard = function(kind) {
    if (!isCardModeEligible()) return;
    const isLevel = kind === "level";
    const id = isLevel ? "lvupBtn" : "shopBtn";
    const action = isLevel ? window.tryLevelUp : window.openShop;
    const title = isLevel ? labels.level : labels.shop;
    const button = getActionButton(id);
    const disabled = !!button?.disabled || button?.style.display === "none" || typeof action !== "function";
    state.selectedUid = "";
    updateSelectedHandCard("");
    const card = getList()?.querySelector(`[data-hand-kind="${kind}"]`);
    card?.classList.add("is-selected");
    if (typeof setGilsysCommandDetail === "function") {
      setGilsysCommandDetail(title, labels.permanent, disabled ? labels.locked : "", isLevel ? "LV" : "SHOP", disabled ? null : action);
    }
    const confirm = document.getElementById("gilsysConfirmBtn");
    if (confirm) confirm.disabled = disabled;
  };

  window.gilsysSelectHandInventoryCard = function(category, index) {
    if (!isCardModeEligible()) return;
    const items = getInventoryItems(category);
    const item = items[Number(index)];
    if (!item) return;
    window.gilsysInventoryDisplayItems = items;
    state.selectedUid = getUid(item);
    if (typeof renderInventoryItemDetail === "function") {
      renderInventoryItemDetail(category, Number(index));
    } else if (typeof setGilsysCommandDetail === "function") {
      const desc = typeof getGilsysDisplayEffectText === "function" ? getGilsysDisplayEffectText(item) : (item?.desc || "");
      setGilsysCommandDetail(item?.name || labels.hand, getCardMeta(item, category), desc, "\u25c6", null);
    }
    updateSelectedHandCard(state.selectedUid);
    setPanelMode("hand");
  };

  window.gilsysSelectDeckHandCard = function(index) {
    if (!isCardModeEligible()) return;
    const card = state.hand[Number(index)];
    if (!card) return;
    if (state.selectedUid === card.id) {
      playDeckHandCard(Number(index));
      return;
    }
    hideLeaderCommandPopover();
    state.selectedUid = card.id;
    updateSelectedHandCard(card.id);
    showCardFocusZone(card, Number(index));
    if (typeof setGilsysCommandDetail === "function") {
      setGilsysCommandDetail(card.name, `${getDeckCardKindLabel(card.kind)} / ${card.cost}`, card.desc || labels.useLater, card.icon || "\u25c6", () => {
        playDeckHandCard(Number(index));
      });
    }
    const confirm = document.getElementById("gilsysConfirmBtn");
    if (confirm) confirm.disabled = false;
    showTabletopNotice(labels.clickAgainToPlay);
    setPanelMode("hand");
  };

  window.gilsysRenderCardHand = function(force = true) {
    const phase = getPhase();
    const list = getList();
    const title = getTitle();
    if (!phase || !list || !isCardModeEligible()) return;

    const currentView = list.dataset.cardView || "";
    if (!force && currentView && currentView !== "hand") return;

    setPanelMode("hand");
    ensureCardDeckState(false);
    if (title) title.textContent = labels.hand;
    list.dataset.manual = "cardHand";
    list.classList.add("is-card-hand");

    const cards = state.hand.map((card, index) => buildDeckHandCard(card, index));

    if (!cards.length) {
      cards.push(`<div class="gilsys-inline-empty">${safe(labels.empty)}</div>`);
    }

    list.innerHTML = cards.join("");
    state.itemSignature = getDeckHandSignature();
    setHandDetail();
    ensureReturnButton();
    window.gilsysFitControlText?.(true);
  };

  function ensureReturnButton() {
    const panel = getPhase()?.querySelector(".gilsys-command-panel");
    if (!panel) return;
    let button = panel.querySelector(".gilsys-card-return-hand");
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "gilsys-card-return-hand";
      button.textContent = "\u624b";
      button.title = labels.returnHand;
      button.setAttribute("aria-label", labels.returnHand);
      button.addEventListener("click", () => window.gilsysRenderCardHand?.(true));
      panel.appendChild(button);
    }
    const list = getList();
    const isDefaultHand = list?.dataset.cardView === "hand";
    button.style.display = isCardModeEligible() && !isDefaultHand ? "" : "none";
  }

  function getNumberFromText(id, fallback = "--") {
    const raw = document.getElementById(id)?.textContent || "";
    const match = raw.match(/\d+/);
    return match ? match[0] : fallback;
  }

  function showTabletopNotice(message) {
    if (typeof showCenterToast === "function") {
      showCenterToast(message, 1600);
    } else {
      console.info(`[gilsys-card-battle-ui] ${message}`);
    }
  }

  function getCurrentCostValue() {
    const raw = document.getElementById("gilsysSelfCoins")?.textContent || document.getElementById("coins")?.textContent || "0";
    const normalized = String(raw).replace(/[^\d-]/g, "");
    const value = Number(normalized);
    return Number.isFinite(value) ? value : 0;
  }

  function sendBattleSocket(payload) {
    try {
      if (typeof ws !== "undefined" && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        return true;
      }
    } catch (_) {}
    return false;
  }

  function consumeDeckHandCard(index) {
    const numericIndex = Number(index);
    const played = state.hand[numericIndex];
    if (!played) return false;
    state.hand.splice(numericIndex, 1);
    state.grave.push(played);
    if (state.deck.length) {
      state.hand.push(state.deck.shift());
    }
    state.selectedUid = "";
    window.gilsysCardDeckCount = state.deck.length;
    window.gilsysCardGraveCount = state.grave.length;
    window.gilsysRenderCardHand?.(true);
    updateTabletopControls();
    return true;
  }

  function playDeckHandCard(index) {
    if (!isCardModeEligible()) return;
    if (!isPlayerTurn()) {
      showTabletopNotice(labels.leaderWait);
      return;
    }
    const numericIndex = Number(index);
    const card = state.hand[numericIndex];
    if (!card) return;
    const cost = Math.max(0, Math.floor(Number(card.cost ?? 0)) || 0);
    if (getCurrentCostValue() < cost) {
      showTabletopNotice(labels.costShort);
      return;
    }
    const ok = sendBattleSocket({
      type: "play_card",
      card: {
        id: card.id,
        name: card.name,
        kind: card.kind,
        cost,
        desc: card.desc,
        job: card.job || "all",
        star: getDeckCardStar(card),
      }
    });
    if (!ok) {
      showTabletopNotice(labels.noConnection);
      return;
    }
    hideLeaderCommandPopover();
    hideCardFocusZone();
    consumeDeckHandCard(numericIndex);
  }

  window.gilsysPlayDeckHandCard = playDeckHandCard;

  function getDeckCardByIndex(index) {
    const numericIndex = Number(index);
    return Number.isInteger(numericIndex) ? state.hand[numericIndex] : null;
  }

  function isDeckEquipCard(card) {
    return getDeckCardType(card) === "equip";
  }

  function getDragDeckIndex(event) {
    const raw = event?.dataTransfer?.getData?.("text/gilsys-card-index") || state.dragDeckIndex;
    const index = Number(raw);
    return Number.isInteger(index) ? index : -1;
  }

  window.gilsysStartDeckCardDrag = function(event, index) {
    if (!isCardModeEligible()) return;
    const card = getDeckCardByIndex(index);
    if (!card) return;
    state.dragDeckIndex = Number(index);
    state.selectedUid = card.id;
    updateSelectedHandCard(card.id);
    showCardFocusZone(card, Number(index));
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/gilsys-card-index", String(index));
    event.dataTransfer.setData("text/plain", card.name || "");
    getPhase()?.classList.add("is-card-dragging");
  };

  window.gilsysEndDeckCardDrag = function() {
    state.dragDeckIndex = "";
    getPhase()?.classList.remove("is-card-dragging", "is-card-drop-field", "is-card-drop-equip");
    document.querySelectorAll(".gilsys-card-drop-ready").forEach(el => el.classList.remove("gilsys-card-drop-ready"));
  };

  function handleDeckCardDrop(event) {
    if (!isCardModeEligible()) return;
    const index = getDragDeckIndex(event);
    const card = getDeckCardByIndex(index);
    if (!card) return;
    const slot = event.target?.closest?.("#battleStage .side-self .equip-slot, #battleStage .side-self .special-equip-slot");
    const wantsEquip = !!slot;
    const isEquip = isDeckEquipCard(card);
    if (wantsEquip !== isEquip) {
      showTabletopNotice(isEquip ? "\u88c5\u5099\u67a0\u306b\u30c9\u30ed\u30c3\u30d7" : "\u30d5\u30a3\u30fc\u30eb\u30c9\u306b\u30c9\u30ed\u30c3\u30d7");
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    playDeckHandCard(index);
    window.gilsysEndDeckCardDrag();
  }

  function handleDeckCardDragOver(event) {
    if (!isCardModeEligible()) return;
    const index = getDragDeckIndex(event);
    const card = getDeckCardByIndex(index);
    if (!card) return;
    const slot = event.target?.closest?.("#battleStage .side-self .equip-slot, #battleStage .side-self .special-equip-slot");
    const canDrop = slot ? isDeckEquipCard(card) : !isDeckEquipCard(card);
    getPhase()?.classList.toggle("is-card-drop-field", canDrop && !slot);
    getPhase()?.classList.toggle("is-card-drop-equip", canDrop && !!slot);
    document.querySelectorAll(".gilsys-card-drop-ready").forEach(el => {
      if (el !== slot) el.classList.remove("gilsys-card-drop-ready");
    });
    if (slot) slot.classList.toggle("gilsys-card-drop-ready", canDrop);
    if (!canDrop) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function ensureCardFocusZone() {
    const stage = document.getElementById("battleStage");
    if (!stage) return null;
    let zone = stage.querySelector(".gilsys-card-focus-zone");
    if (!zone) {
      zone = document.createElement("div");
      zone.className = "gilsys-card-focus-zone";
      zone.hidden = true;
      zone.addEventListener("click", event => event.stopPropagation());
      stage.appendChild(zone);
    }
    return zone;
  }

  function showCardFocusZone(card, index) {
    const zone = ensureCardFocusZone();
    if (!zone || !card) return;
    const type = getDeckCardType(card);
    const rarity = getDeckCardRarityClass(card);
    const icon = card.image
      ? `<img src="${safe(card.image)}" alt="" draggable="false">`
      : `<span>${safe(card.icon || "\u25c6")}</span>`;
    zone.hidden = false;
    zone.innerHTML = `
      <div class="gilsys-focus-card gilsys-focus-deck-card ${safe(type === "item" ? "type-item" : "type-equip")} ${safe(rarity)}">
        <span class="gilsys-card-cost">${safe(card.cost ?? 0)}</span>
        <span class="gilsys-hand-card-name">${safe(card.name)}</span>
        <span class="gilsys-card-art-frame"><span class="gilsys-hand-card-icon">${icon}</span></span>
        <span class="gilsys-hand-card-meta">${safe(getDeckCardScopeLabel(card))}</span>
      </div>
      <div class="gilsys-focus-card-detail">
        <b>${safe(card.name)}</b>
        <span>${safe(card.desc || labels.useLater)}</span>
        <button type="button" onclick="gilsysPlayDeckHandCard(${Number(index)})">${safe(labels.playCard)}</button>
      </div>
    `;
  }

  function hideCardFocusZone() {
    const zone = document.querySelector("#battleStage .gilsys-card-focus-zone");
    if (zone) zone.hidden = true;
  }

  function ensureLeaderCommandPopover() {
    const stage = document.getElementById("battleStage");
    if (!stage) return null;
    let popover = stage.querySelector(".gilsys-leader-command-popover");
    if (!popover) {
      popover = document.createElement("div");
      popover.className = "gilsys-leader-command-popover";
      popover.hidden = true;
      stage.appendChild(popover);
    }
    return popover;
  }

  function hideLeaderCommandPopover() {
    const popover = document.querySelector("#battleStage .gilsys-leader-command-popover");
    if (popover) popover.hidden = true;
  }

  function showLeaderCommandPopoverFromList() {
    const list = getList();
    const title = getTitle();
    const popover = ensureLeaderCommandPopover();
    if (!list || !popover) return;
    popover.innerHTML = `
      <div class="gilsys-leader-command-title">${safe(title?.textContent || labels.leaderHint)}</div>
      <div class="gilsys-leader-command-list">${list.innerHTML}</div>
    `;
    popover.hidden = false;
  }

  function ensureTabletopControls() {
    const stage = document.getElementById("battleStage");
    if (stage && !stage.querySelector(".gilsys-tabletop-counters")) {
      const counters = document.createElement("div");
      counters.className = "gilsys-tabletop-counters";
      counters.innerHTML = `
        <div class="gilsys-tabletop-counter is-cost"><span>\u30b3\u30b9\u30c8</span><b data-tabletop-cost>--</b></div>
        <div class="gilsys-tabletop-counter is-turn"><span>${safe(labels.turn)}</span><b data-tabletop-turn>--</b></div>
        <div class="gilsys-tabletop-counter"><span>${safe(labels.deck)}</span><b data-tabletop-deck>--</b></div>
        <div class="gilsys-tabletop-counter"><span>${safe(labels.grave)}</span><b data-tabletop-grave>--</b></div>
      `;
      stage.appendChild(counters);
    }

    const phase = getPhase();
    if (phase) {
      let endTurn = phase.querySelector(".gilsys-tabletop-end-turn");
      if (!endTurn) {
        endTurn = document.createElement("button");
        endTurn.type = "button";
        endTurn.className = "gilsys-tabletop-end-turn";
      }
      if (endTurn.parentElement !== phase) phase.appendChild(endTurn);
      endTurn.type = "button";
      endTurn.className = "gilsys-tabletop-end-turn";
      endTurn.innerHTML = `<span>${safe(labels.endTurn)}</span>`;
      if (!endTurn.__gilsysEndTurnBound) {
        endTurn.__gilsysEndTurnBound = true;
        endTurn.addEventListener("click", () => {
          if (sendEndTurnAction()) return;
          if (!isPlayerTurn()) {
            showTabletopNotice(labels.leaderWait);
            return;
          }
          if (typeof window.gilsysCardEndTurn === "function") {
            window.gilsysCardEndTurn();
            return;
          }
          showTabletopNotice(labels.endTurnLater);
        });
      }
    }
  }

  function updateTabletopControls() {
    ensureTabletopControls();
    const stage = document.getElementById("battleStage");
    const cost = stage?.querySelector("[data-tabletop-cost]");
    const turn = stage?.querySelector("[data-tabletop-turn]");
    const deck = stage?.querySelector("[data-tabletop-deck]");
    const grave = stage?.querySelector("[data-tabletop-grave]");
    if (cost) cost.textContent = String(getCurrentCostValue());
    if (turn) turn.textContent = getNumberFromText("gilsysCenterRound", getNumberFromText("roundLabel", "0"));
    const deckCount = state.deck.length || window.gilsysCardDeckCount || window.gilsysDeckRemaining || "--";
    const graveCount = state.grave.length || window.gilsysCardGraveCount || window.gilsysGraveCount || "0";
    if (deck) deck.textContent = String(deckCount);
    if (grave) grave.textContent = String(graveCount);
    const endTurn = getPhase()?.querySelector(".gilsys-tabletop-end-turn");
    if (endTurn) endTurn.classList.toggle("is-disabled", !isPlayerTurn());
  }

  function ensureBattleBoardZones() {
    const stage = document.getElementById("battleStage");
    if (!stage) return;

    if (!stage.__gilsysCardDropBound) {
      stage.__gilsysCardDropBound = true;
      stage.addEventListener("dragover", handleDeckCardDragOver);
      stage.addEventListener("drop", handleDeckCardDrop);
      stage.addEventListener("click", event => {
        if (event.target?.closest?.(".gilsys-deck-hand-card, .gilsys-card-focus-zone, .gilsys-leader-command-popover, .gilsys-tabletop-end-turn, .side-self, .side-enemy")) return;
        hideCardFocusZone();
        state.selectedUid = "";
        updateSelectedHandCard("");
      });
    }

    ensureCardFocusZone();

    if (!stage.querySelector(".gilsys-opponent-hand-zone")) {
      const zone = document.createElement("div");
      zone.className = "gilsys-opponent-hand-zone";
      zone.innerHTML = `
        <div class="gilsys-board-zone-title">${safe(labels.enemyHand)}</div>
        <div class="gilsys-opponent-hand-cards" aria-hidden="true">
          ${Array.from({ length: 5 }, () => `<span class="gilsys-card-back"></span>`).join("")}
        </div>
      `;
      stage.appendChild(zone);
    }

    for (const side of ["enemy", "self"]) {
      if (!stage.querySelector(`.gilsys-board-zone-label[data-board-side="${side}"]`)) {
        const label = document.createElement("div");
        label.className = `gilsys-board-zone-label is-${side}`;
        label.dataset.boardSide = side;
        label.textContent = side === "enemy" ? labels.enemyEquipZone : labels.selfEquipZone;
        stage.appendChild(label);
      }

      if (!stage.querySelector(`.gilsys-board-item-zone[data-board-side="${side}"]`)) {
        const zone = document.createElement("div");
        zone.className = `gilsys-board-item-zone is-${side}`;
        zone.dataset.boardSide = side;
        zone.innerHTML = `
          <div class="gilsys-board-item-title">${safe(side === "enemy" ? labels.enemyItemZone : labels.selfItemZone)}</div>
          <div class="gilsys-board-item-slots">
            <span class="gilsys-board-item-slot" data-item-slot="0"></span>
            <span class="gilsys-board-item-slot" data-item-slot="1"></span>
          </div>
        `;
        stage.appendChild(zone);
      }
    }
  }

  function getEquipSlotCounts(side) {
    const root = document.querySelector(side === "enemy" ? "#battleStage .side-enemy" : "#battleStage .side-self");
    if (!root) return { filled: 0, total: 0 };
    const slots = [
      ...root.querySelectorAll(".equip-area .equip-slot"),
      ...root.querySelectorAll(`.special-equip-area[data-side="${side}"]:not(.doll) .special-equip-slot`),
    ];
    const filled = slots.filter(slot =>
      slot.classList.contains("filled") ||
      (slot.classList.contains("active") && !slot.classList.contains("empty") && !slot.classList.contains("locked"))
    ).length;
    return { filled, total: slots.length };
  }

  function updateItemZone(side) {
    const zone = document.querySelector(`.gilsys-board-item-zone[data-board-side="${side}"]`);
    if (!zone) return;
    const slots = [...zone.querySelectorAll(".gilsys-board-item-slot")];
    const remaining = Math.max(0, Math.min(2, Number(window.itemUsesRemaining ?? 2)));
    const used = side === "self" ? Math.max(0, 2 - remaining) : 0;
    slots.forEach((slot, index) => {
      slot.classList.toggle("is-used", side === "self" && index < used);
      slot.classList.toggle("is-hidden-card", side === "enemy");
      slot.textContent = side === "enemy" ? "?" : (index < used ? "USED" : "ITEM");
    });
  }

  function getTextById(id, fallback = "") {
    return normalizeCardText(document.getElementById(id)?.textContent || fallback);
  }

  function ensureUnitCardLayer(side) {
    const sprite = document.getElementById(side === "enemy" ? "enemySprite" : "playerSprite");
    if (!sprite) return null;
    let layer = sprite.querySelector(".gilsys-unit-card-layer");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "gilsys-unit-card-layer";
      layer.innerHTML = `
        <div class="gilsys-unit-card-kind"></div>
        <div class="gilsys-unit-card-effect"></div>
        <div class="gilsys-unit-card-stats">
          <span class="gilsys-unit-atk"></span>
          <span class="gilsys-unit-def"></span>
        </div>
      `;
      sprite.appendChild(layer);
    }
    return layer;
  }

  function updateUnitCard(side) {
    const layer = ensureUnitCardLayer(side);
    if (!layer) return;
    const prefix = side === "enemy" ? "Enemy" : "Self";
    const job = getTextById(`gilsys${prefix}Job`, "JOB");
    const hp = getTextById(`gilsys${prefix}HpText`, "HP 0 / 0");
    const atk = getTextById(`gilsys${prefix}Atk`, "0");
    const def = getTextById(`gilsys${prefix}Def`, "0");
    const specialWrap = document.getElementById(`gilsys${prefix}SpecialDefWrap`);
    const special = specialWrap && specialWrap.style.display !== "none"
      ? getTextById(`gilsys${prefix}SpecialDef`, "")
      : "";
    const effect = special ? `${hp} / SP DEF ${special}` : hp;
    const oldName = layer.querySelector(".gilsys-unit-card-name");
    if (oldName) {
      oldName.textContent = "";
      oldName.hidden = true;
    }
    layer.querySelector(".gilsys-unit-card-kind").textContent = job;
    layer.querySelector(".gilsys-unit-card-effect").textContent = effect;
    layer.querySelector(".gilsys-unit-atk").textContent = `ATK ${atk}`;
    layer.querySelector(".gilsys-unit-def").textContent = `DEF ${def}`;
  }

  function updateBattleBoardMeta() {
    ensureBattleBoardZones();
    for (const side of ["enemy", "self"]) {
      const label = document.querySelector(`.gilsys-board-zone-label[data-board-side="${side}"]`);
      const counts = getEquipSlotCounts(side);
      const total = counts.total || 5;
      const title = side === "enemy" ? labels.enemyEquipZone : labels.selfEquipZone;
      if (label) label.textContent = `${title} ${counts.filled}/${total}`;
      updateItemZone(side);
      updateUnitCard(side);
    }
  }

  function openLeaderCommands() {
    if (!isCardModeEligible()) return;
    if (!isPlayerTurn()) {
      if (typeof showCenterToast === "function") showCenterToast(labels.leaderWait, 1600);
      return;
    }
    if (typeof window.openAttackSkillPanel === "function") {
      window.openAttackSkillPanel(true);
    }
  }

  function setupLeaderCards() {
    const phase = getPhase();
    if (!phase) return;
    const self = phase.querySelector(".gilsys-top-status-self");
    const enemy = phase.querySelector(".gilsys-top-status-enemy");
    if (enemy) enemy.classList.add("gilsys-leader-card");
    if (!self) return;
    self.classList.add("gilsys-leader-card", "gilsys-leader-card-clickable");
    self.setAttribute("role", "button");
    self.setAttribute("tabindex", "0");
    self.setAttribute("aria-label", labels.leaderHint);
    self.title = labels.leaderHint;
    const sprite = document.getElementById("playerSprite");
    if (sprite) {
      sprite.classList.add("gilsys-player-card-clickable");
      sprite.setAttribute("role", "button");
      sprite.setAttribute("tabindex", "0");
      sprite.setAttribute("aria-label", labels.leaderHint);
      sprite.title = labels.leaderHint;
    }

    const bind = (el) => {
      if (!el || el.__gilsysLeaderCardBound) return;
      el.__gilsysLeaderCardBound = true;
      el.addEventListener("click", openLeaderCommands);
      el.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openLeaderCommands();
      });
    };
    bind(self);
    bind(sprite);
  }

  function syncCardMode(renderDefault = false) {
    const phase = getPhase();
    if (!phase) return;
    const eligible = isCardModeEligible();
    phase.classList.toggle("gilsys-card-battle-mode", eligible);
    phase.classList.toggle("gilsys-card-battle-disabled", !eligible);
    setupLeaderCards();
    ensureReturnButton();
    ensureBattleBoardZones();
    ensureTabletopControls();
    ensureLeaderCommandPopover();
    updateBattleBoardMeta();
    updateTabletopControls();

    if (eligible && !state.battleActive) {
      state.battleActive = true;
      state.battleSession += 1;
      ensureCardDeckState(true);
      renderDefault = true;
    } else if (!eligible && state.battleActive) {
      state.battleActive = false;
      state.selectedUid = "";
    }

    if (eligible && renderDefault) {
      window.gilsysRenderCardHand?.(true);
    }
  }

  function wrapCommandFunction(name, after) {
    const original = window[name];
    if (typeof original !== "function" || original.__gilsysCardBattleWrapped) return;
    const wrapped = function gilsysCardBattleWrapped(...args) {
      const result = original.apply(this, args);
      try {
        after?.(args, result);
      } catch (error) {
        console.warn("[gilsys-card-battle-ui]", name, error);
      }
      return result;
    };
    wrapped.__gilsysCardBattleWrapped = true;
    wrapped.__gilsysOriginal = original;
    window[name] = wrapped;
  }

  function installFunctionWraps() {
    wrapCommandFunction("openAttackSkillPanel", (args) => {
      if (!isCardModeEligible()) return;
      const markManual = args?.[0];
      if (markManual === false) {
        window.gilsysRenderCardHand?.(true);
        hideLeaderCommandPopover();
        return;
      }
      showLeaderCommandPopoverFromList();
      setPanelMode("hand");
      getList()?.classList.add("is-card-hand");
      window.gilsysRenderCardHand?.(true);
      ensureReturnButton();
      window.gilsysFitControlText?.(true);
    });
    wrapCommandFunction("openItemUI", () => {
      if (!isCardModeEligible()) return;
      setPanelMode("inventory");
      getList()?.classList.remove("is-card-hand");
      ensureReturnButton();
    });
    wrapCommandFunction("openItemCategory", () => {
      if (!isCardModeEligible()) return;
      setPanelMode("inventory");
      getList()?.classList.remove("is-card-hand");
      ensureReturnButton();
    });
    wrapCommandFunction("openShop", () => {
      if (!isCardModeEligible()) return;
      setPanelMode("shop");
      getList()?.classList.remove("is-card-hand");
      ensureReturnButton();
    });
    wrapCommandFunction("attack", () => {
      if (!isCardModeEligible()) return;
      hideLeaderCommandPopover();
      window.gilsysRenderCardHand?.(true);
    });
    wrapCommandFunction("useSkill", () => {
      if (!isCardModeEligible()) return;
      hideLeaderCommandPopover();
      window.gilsysRenderCardHand?.(true);
    });
    wrapCommandFunction("setPhase", () => {
      requestAnimationFrame(() => syncCardMode(true));
    });
  }

  function installObservers() {
    const phase = getPhase();
    if (!phase || phase.__gilsysCardBattleObserver) return;
    const observer = new MutationObserver(() => requestAnimationFrame(() => syncCardMode(false)));
    observer.observe(phase, { attributes: true, attributeFilter: ["style", "class"] });
    phase.__gilsysCardBattleObserver = observer;
  }

  function periodicSync() {
    syncCardMode(false);
    if (isCardModeEligible()) updateBattleBoardMeta();
    if (isCardModeEligible()) updateTabletopControls();
    const list = getList();
    if (isCardModeEligible() && list?.dataset.cardView === "hand") {
      const nextSignature = getDeckHandSignature();
      if (nextSignature !== state.itemSignature) {
        window.gilsysRenderCardHand?.(true);
      }
    }
  }

  function install() {
    installFunctionWraps();
    installObservers();
    syncCardMode(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  window.addEventListener("load", () => syncCardMode(true));
  window.addEventListener("resize", () => syncCardMode(false), { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(() => syncCardMode(false), 80), { passive: true });
  setTimeout(install, 0);
  setTimeout(() => syncCardMode(true), 500);
  setInterval(periodicSync, 900);
})();
