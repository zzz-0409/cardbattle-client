(() => {
  const safe = (value) => typeof escapeHtml === "function"
    ? escapeHtml(String(value ?? ""))
    : String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

  const jsArg = (value) => JSON.stringify(String(value ?? ""));
  const attrCode = (code) => safe(code);

  const categoryMeta = {
    items: { label: "アイテム", icon: "🧪", empty: "このカテゴリのアイテムはありません。" },
    equipment: { label: "装備", icon: "⚔", empty: "このカテゴリの装備はありません。" },
    special: { label: "特殊装備", icon: "🔮", empty: "このカテゴリの特殊装備はありません。" },
  };

  const getPopupParts = () => ({
    popup: document.getElementById("shopPopup"),
    list: document.getElementById("shopList"),
    title: document.querySelector("#shopPopup h3"),
    rerollBtn: document.querySelector('#shopPopup button[onclick="rerollShop()"]') || document.querySelector("#shopPopup .popup-inner > div button"),
  });

  const setChrome = (mode) => {
    const { popup, list, title, rerollBtn } = getPopupParts();
    const isInventory = mode === "inventory";
    if (popup) popup.dataset.dojoPrepPanel = isInventory ? "inventory" : "shop";
    if (list) list.dataset.dojoPrepPanel = isInventory ? "inventory" : "shop";
    if (title) title.textContent = isInventory ? "持ち物一覧" : "ショップ";
    if (rerollBtn) {
      rerollBtn.textContent = "ショップ更新(5コイン)";
      rerollBtn.style.display = isInventory ? "none" : "";
    }
  };

  window.setDojoPrepPopupChrome = setChrome;

  const getVisual = (item, fallbackIcon = "◆") => {
    if (typeof getShopVisualMeta === "function") {
      const meta = getShopVisualMeta(item);
      return {
        icon: meta.icon ?? fallbackIcon,
        badges: Array.isArray(meta.badges) ? meta.badges : [],
        theme: meta.theme || "theme-bronze",
        metaClass: meta.metaClass || "",
      };
    }
    return { icon: fallbackIcon, badges: [], theme: "theme-bronze", metaClass: "" };
  };

  const getIconHtml = (icon) => typeof getShopIconMarkup === "function"
    ? getShopIconMarkup(icon)
    : safe(icon);

  const getArrowBadge = (item, context = "") => typeof getGilsysArrowCountBadgeHtml === "function"
    ? getGilsysArrowCountBadgeHtml(item, context)
    : "";

  const getDesc = (item, fallback = "効果説明はありません。") => typeof getGilsysDisplayEffectText === "function"
    ? getGilsysDisplayEffectText(item, fallback)
    : (item?.effect_text ?? item?.desc ?? item?.description ?? fallback);

  const itemSoldOut = (item) => typeof isShopItemSoldOut === "function"
    ? isShopItemSoldOut(item)
    : !!(item?.sold_out || item?.soldOut || item?.shop_sold_out);

  const setDetail = (html) => {
    const detail = document.getElementById("dojoPrepDetailPanel");
    if (detail) detail.innerHTML = html;
  };

  const emptyDetail = (title, message) => `
    <div class="gilsys-dojo-prep-empty-detail">
      <b>${safe(title)}</b>
      <span>${safe(message)}</span>
    </div>
  `;

  const badgeHtml = (badges) => (badges || [])
    .map((badge) => `<span class="shop-badge kind-${safe(badge.kind)}">${safe(badge.label)}</span>`)
    .join("");

  const buildShopDetailCard = (item, index) => {
    const visual = getVisual(item, "🛒");
    const soldOut = itemSoldOut(item);
    const badges = soldOut ? [...visual.badges, { label: "売り切れ", kind: "rank" }] : visual.badges;
    const desc = safe(getDesc(item));
    const buyCode = `buyDojoPrepItem(${Number(index)})`;
    return `
      <div class="gilsys-shop-detail-card dojo-shop-detail-card gilsys-dojo-prep-detail-card">
        <div class="shop-card ${safe(visual.theme)} ${soldOut ? "is-shop-sold-out" : ""}">
          <div class="shop-card-main">
            <div class="shop-card-head">
              <div class="shop-icon">${getIconHtml(visual.icon)}</div>
              <div class="shop-title-wrap">
                <div class="shop-item-name">${safe(item?.name ?? "商品")}${getArrowBadge(item, "shop")}</div>
                <div class="shop-meta-row ${safe(visual.metaClass)}">${badgeHtml(badges)}</div>
                <div class="shop-item-desc">${desc || "効果説明はありません。"}</div>
              </div>
            </div>
          </div>
          <div class="shop-buy-area">
            <div class="shop-price">${soldOut ? "売り切れ" : `${Number(item?.price ?? 0)} コイン`}</div>
            <button ${soldOut ? "disabled" : `onclick="${attrCode(buyCode)}"`}>${soldOut ? "売り切れ" : "購入"}</button>
          </div>
        </div>
      </div>
    `;
  };

  const renderShopIcons = (items, selectedIndex) => items.map((item, index) => {
    const visual = getVisual(item, "🛒");
    const soldOut = itemSoldOut(item);
    return `
      <button class="gilsys-shop-icon-btn gilsys-dojo-prep-icon-btn ${safe(visual.theme)} ${index === selectedIndex ? "is-selected" : ""} ${soldOut ? "is-shop-sold-out" : ""}"
        type="button"
        data-dojo-prep-shop-index="${index}"
        title="${safe(item?.name ?? "商品")}${soldOut ? "（売り切れ）" : ""}"
        onclick="${attrCode(`renderDojoPrepShopDetail(${Number(index)})`)}">
        <span class="shop-icon">${getIconHtml(visual.icon)}</span>
      </button>
    `;
  }).join("");

  window.renderDojoPrepShop = function(items = []) {
    const { popup, list } = getPopupParts();
    if (!popup || !list) return;
    setChrome("shop");
    window.gilsysLatestDojoShopItems = Array.isArray(items) ? items : [];
    const selectedIndex = Math.max(0, Math.min(
      Number(window.gilsysSelectedDojoPrepShopIndex ?? 0) || 0,
      Math.max(0, window.gilsysLatestDojoShopItems.length - 1)
    ));

    list.innerHTML = `
      <div class="gilsys-dojo-prep-split is-shop">
        <section class="gilsys-dojo-prep-left">
          <div class="gilsys-dojo-prep-panel-title">商品一覧</div>
          ${window.gilsysLatestDojoShopItems.length
            ? `<div class="gilsys-shop-icon-grid gilsys-dojo-prep-icon-grid">${renderShopIcons(window.gilsysLatestDojoShopItems, selectedIndex)}</div>`
            : `<div class="gilsys-inline-empty">現在購入できる商品はありません。</div>`}
        </section>
        <section class="gilsys-dojo-prep-right" id="dojoPrepDetailPanel"></section>
      </div>
    `;
    popup.style.display = "flex";
    renderDojoPrepShopDetail(selectedIndex);
  };

  window.renderDojoPrepShopDetail = function(index = 0) {
    const items = window.gilsysLatestDojoShopItems || [];
    const item = items[Number(index)];
    window.gilsysSelectedDojoPrepShopIndex = Number(index) || 0;
    document.querySelectorAll("#shopList .gilsys-dojo-prep-icon-btn[data-dojo-prep-shop-index]").forEach((button) => {
      button.classList.toggle("is-selected", Number(button.dataset.dojoPrepShopIndex) === Number(index));
    });
    if (!item) {
      setDetail(emptyDetail("商品詳細", "左の一覧から商品を選択してください。"));
      return;
    }
    setDetail(buildShopDetailCard(item, Number(index)));
  };

  const normalizeCategory = (category) => categoryMeta[category] ? category : "items";

  const getRun = () => window.gilsysDojoRunView || {};

  const getCategoryItems = (category) => {
    const run = getRun();
    if (category === "equipment") return Array.isArray(run.equipment) ? run.equipment : [];
    if (category === "special") return Array.isArray(run.special) ? run.special : [];
    return Array.isArray(run.items) ? run.items : [];
  };

  const getLoadoutSet = (category) => {
    const selected = getRun().loadout?.[category] || [];
    return new Set((Array.isArray(selected) ? selected : []).map(String));
  };

  const getSlotCount = (category) => {
    const slots = getRun().carrySlots || {};
    return Math.min(5, Math.max(1, Number(slots[category] ?? 1)));
  };

  const getSelectedCount = (category) => Math.min(getLoadoutSet(category).size, getSlotCount(category));

  const getInventoryIconCountHtml = (item, category) => {
    if (typeof isGilsysArrowItem === "function" && isGilsysArrowItem(item)) {
      const count = typeof getGilsysArrowCount === "function"
        ? getGilsysArrowCount(item)
        : Number(item?.count ?? item?.arrow_count ?? 0);
      return `<span class="gilsys-inventory-icon-count">${safe(count)}</span>`;
    }
    const count = Math.max(1, Number(item?.stackCount ?? item?.count ?? 1) || 1);
    return category === "items" && count > 1
      ? `<span class="gilsys-inventory-icon-count">${safe(count)}</span>`
      : "";
  };

  const renderInventoryCategoryTabs = (activeCategory) => Object.entries(categoryMeta).map(([category, meta]) => {
    const isActive = category === activeCategory;
    return `
      <button type="button" class="gilsys-dojo-prep-tab ${isActive ? "is-active" : ""}"
        onclick="${attrCode(`renderDojoPrepInventoryCategory(${jsArg(category)})`)}">
        <span>${safe(meta.icon)}</span>
        <b>${safe(meta.label)}</b>
        <i>${getSelectedCount(category)}/${getSlotCount(category)}</i>
      </button>
    `;
  }).join("");

  const renderInventoryTools = (category) => {
    if (category !== "equipment") return "";
    return `
      <div class="gilsys-panel-subtools dojo-inventory-tools gilsys-dojo-prep-tools">
        <button onclick="${attrCode("toggleDojoEquipCombineMode()")}">${dojoEquipCombineMode ? "合成をやめる" : "装備を合成"}</button>
        <button class="dojo-auto-combine-toggle ${dojoAutoCombineEnabled ? "is-on" : ""}" onclick="${attrCode("toggleDojoAutoCombine()")}">${dojoAutoCombineEnabled ? "自動合成ON" : "自動合成OFF"}</button>
        ${dojoEquipCombineMode ? `<button onclick="${attrCode("submitDojoEquipCombine()")}" ${dojoEquipCombineSelection.length === 2 ? "" : "disabled"}>選択した2つを合成</button>` : ""}
        ${dojoEquipCombineMode ? `<span>合成選択 ${dojoEquipCombineSelection.length}/2</span>` : ""}
      </div>
    `;
  };

  const renderInventoryIcons = (category, items, selectedIndex) => {
    const selected = getLoadoutSet(category);
    const combineActive = category === "equipment" && dojoEquipCombineMode;
    if (!items.length) {
      return `<div class="gilsys-inline-empty">${safe(categoryMeta[category]?.empty ?? "持ち物はありません。")}</div>`;
    }
    return `
      <div class="gilsys-shop-icon-grid gilsys-dojo-prep-icon-grid gilsys-dojo-prep-inventory-icons">
        ${items.map((item, index) => {
          const uid = String(item?.uid ?? "");
          const visual = getVisual(item, categoryMeta[category]?.icon ?? "◆");
          const active = selected.has(uid);
          const selectedForCombine = combineActive && dojoEquipCombineSelection.includes(uid);
          return `
            <button class="gilsys-shop-icon-btn gilsys-inventory-icon-btn gilsys-dojo-prep-icon-btn ${safe(visual.theme)} ${index === selectedIndex ? "is-selected" : ""} ${active ? "is-equipped is-dojo-loadout-selected" : ""} ${selectedForCombine ? "is-combine-selected" : ""}"
              type="button"
              data-dojo-prep-inventory-index="${index}"
              title="${safe(item?.name ?? categoryMeta[category]?.label ?? "持ち物")}"
              onclick="${attrCode(`renderDojoPrepInventoryDetail(${jsArg(category)}, ${Number(index)})`)}">
              <span class="shop-icon">${getIconHtml(visual.icon)}</span>
              ${getInventoryIconCountHtml(item, category)}
              ${active ? `<span class="gilsys-inventory-equipped-dot">持</span>` : ""}
              ${selectedForCombine ? `<span class="gilsys-inventory-combine-dot">選</span>` : ""}
            </button>
          `;
        }).join("")}
      </div>
    `;
  };

  const buildInventoryDetailCard = (category, item, index) => {
    const uid = String(item?.uid ?? "");
    const selected = getLoadoutSet(category);
    const active = selected.has(uid);
    const combineActive = category === "equipment" && dojoEquipCombineMode;
    const selectedForCombine = combineActive && dojoEquipCombineSelection.includes(uid);
    const visual = getVisual(item, categoryMeta[category]?.icon ?? "◆");
    const desc = safe(getDesc(item, "詳細情報はありません。"));
    const status = selectedForCombine
      ? "合成選択中"
      : active
        ? "持込中"
        : `枠 ${getSelectedCount(category)}/${getSlotCount(category)}`;
    const actionCode = combineActive
      ? `toggleDojoEquipCombineSelect(${jsArg(uid)})`
      : `toggleDojoLoadout(${jsArg(category)}, ${jsArg(uid)})`;
    const actionLabel = combineActive
      ? (selectedForCombine ? "選択解除" : "合成選択")
      : (active ? "外す" : "持ち込む");

    return `
      <div class="gilsys-shop-detail-card dojo-shop-detail-card gilsys-dojo-prep-detail-card">
        <div class="shop-card inventory-card ${safe(visual.theme)} ${active ? "is-dojo-loadout-selected" : ""} ${selectedForCombine ? "is-equip-combine-selected" : ""}">
          <div class="shop-card-main">
            <div class="shop-card-head">
              <div class="shop-icon">${getIconHtml(visual.icon)}</div>
              <div class="shop-title-wrap">
                <div class="shop-item-name">${safe(item?.name ?? "持ち物")}${getArrowBadge(item)}</div>
                <div class="shop-meta-row ${safe(visual.metaClass)}">${badgeHtml(visual.badges)}</div>
                <div class="shop-item-desc">${desc || "詳細情報はありません。"}</div>
              </div>
            </div>
          </div>
          <div class="shop-buy-area">
            <div class="shop-price">${safe(status)}</div>
            <button onclick="${attrCode(actionCode)}">${safe(actionLabel)}</button>
          </div>
        </div>
      </div>
    `;
  };

  const getSelectedInventoryIndex = (category, items) => {
    const selectedByCategory = window.gilsysDojoPrepSelectedInventoryUidByCategory || {};
    const previousUid = selectedByCategory[category] || "";
    const previousIndex = items.findIndex((item) => String(item?.uid ?? "") === previousUid);
    if (previousIndex >= 0) return previousIndex;
    const selected = getLoadoutSet(category);
    const loadoutIndex = items.findIndex((item) => selected.has(String(item?.uid ?? "")));
    return Math.max(0, loadoutIndex);
  };

  window.renderDojoPrepInventory = function() {
    const { popup, list } = getPopupParts();
    if (!popup || !list) return;
    setChrome("inventory");
    const category = normalizeCategory(window.gilsysDojoPrepInventoryCategory || "items");
    const items = getCategoryItems(category);
    const selectedIndex = getSelectedInventoryIndex(category, items);

    list.innerHTML = `
      <div class="gilsys-dojo-prep-split is-inventory">
        <section class="gilsys-dojo-prep-left">
          <div class="gilsys-dojo-prep-tabs">${renderInventoryCategoryTabs(category)}</div>
          ${renderInventoryTools(category)}
          ${renderInventoryIcons(category, items, selectedIndex)}
        </section>
        <section class="gilsys-dojo-prep-right" id="dojoPrepDetailPanel"></section>
      </div>
    `;
    popup.style.display = "flex";
    renderDojoPrepInventoryDetail(category, selectedIndex);
    if (typeof scheduleDojoAutoCombine === "function") scheduleDojoAutoCombine();
  };

  window.renderDojoPrepInventoryCategory = function(category) {
    window.gilsysDojoPrepInventoryCategory = normalizeCategory(category);
    renderDojoPrepInventory();
  };

  window.renderDojoPrepInventoryDetail = function(category, index = 0) {
    const normalized = normalizeCategory(category);
    const items = getCategoryItems(normalized);
    const item = items[Number(index)];
    document.querySelectorAll("#shopList .gilsys-dojo-prep-icon-btn[data-dojo-prep-inventory-index]").forEach((button) => {
      button.classList.toggle("is-selected", Number(button.dataset.dojoPrepInventoryIndex) === Number(index));
    });
    if (!item) {
      setDetail(emptyDetail(categoryMeta[normalized]?.label ?? "持ち物詳細", categoryMeta[normalized]?.empty ?? "左の一覧から持ち物を選択してください。"));
      return;
    }
    window.gilsysDojoPrepSelectedInventoryUidByCategory ??= {};
    window.gilsysDojoPrepSelectedInventoryUidByCategory[normalized] = String(item?.uid ?? "");
    setDetail(buildInventoryDetailCard(normalized, item, Number(index)));
  };
})();
