(() => {
  const safe = (value) => typeof escapeHtml === "function"
    ? escapeHtml(String(value ?? ""))
    : String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

  const categoryMeta = {
    item: { title: "持ち物：アイテム", icon: "🧪", empty: "このカテゴリのアイテムはありません。" },
    equip: { title: "持ち物：装備", icon: "⚔", empty: "このカテゴリの装備はありません。" },
    special: { title: "持ち物：特殊装備", icon: "🔮", empty: "このカテゴリの特殊装備はありません。" },
  };

  const setInventoryMode = () => {
    const panel = document.querySelector(".gilsys-command-list-panel");
    if (!panel) return;
    panel.classList.add("is-inventory-mode");
    panel.classList.remove("is-shop-mode");
  };

  const getList = () => document.getElementById("gilsysCommandList");
  const getListTitle = () => document.getElementById("gilsysCommandListTitle");

  const getDisplayUid = (item) => {
    if (Array.isArray(item?.stackUids) && item.stackUids.length) return String(item.stackUids[0] ?? "");
    return String(item?.uid ?? "");
  };

  const getStackKey = (item) => {
    const skipKeys = new Set([
      "uid",
      "price",
      "sold_out",
      "soldOut",
      "shop_sold_out",
      "stackCount",
      "stackUids",
      "is_equipped_normal",
      "is_equipped_special"
    ]);
    const normalize = (value) => {
      if (Array.isArray(value)) return value.map(normalize);
      if (value && typeof value === "object") {
        return Object.keys(value)
          .filter(key => !skipKeys.has(key))
          .sort()
          .reduce((obj, key) => {
            obj[key] = normalize(value[key]);
            return obj;
          }, {});
      }
      return value;
    };
    return JSON.stringify(normalize(item ?? {}));
  };

  const stackDisplayItems = (items, category) => {
    if (category !== "item") return items;
    const groups = new Map();
    for (const item of items) {
      const key = getStackKey(item);
      const current = groups.get(key);
      if (current) {
        current.stackCount += 1;
        current.stackUids.push(String(item?.uid ?? ""));
      } else {
        groups.set(key, {
          ...item,
          stackCount: 1,
          stackUids: [String(item?.uid ?? "")]
        });
      }
    }
    return [...groups.values()];
  };

  const getInventoryItemsForCategory = (category) => {
    const all = window.itemList || [];
    const rawItems = all
      .filter(item => item?.category === category)
      .sort((a, b) => {
        const aEquipped = ((category === "equip" && a?.is_equipped_normal) || (category === "special" && a?.is_equipped_special)) ? 1 : 0;
        const bEquipped = ((category === "equip" && b?.is_equipped_normal) || (category === "special" && b?.is_equipped_special)) ? 1 : 0;
        return bEquipped - aEquipped;
      });
    return stackDisplayItems(rawItems, category);
  };

  const getInventoryMetaText = (category) => {
    if (category === "item") {
      return `このターンあと ${Math.max(0, Number(window.itemUsesRemaining ?? 2))} 個使用できます`;
    }
    if (category === "equip") return "通常装備の装備・付け替え・合成を行えます。";
    return "職業専用装備・矢・人形衣装などを装備できます。";
  };

  const renderCategoryButtons = () => `
    <div class="gilsys-category-grid">
      <button class="gilsys-category-card" onclick="openItemCategory('item')">
        <span class="gilsys-category-icon">🧪</span>
        <span><span class="gilsys-category-name">アイテム</span><span class="gilsys-category-desc">回復・強化などの消費アイテム</span></span>
      </button>
      <button class="gilsys-category-card" onclick="openItemCategory('equip')">
        <span class="gilsys-category-icon">⚔</span>
        <span><span class="gilsys-category-name">装備</span><span class="gilsys-category-desc">通常装備・合成・付け替え</span></span>
      </button>
      <button class="gilsys-category-card" onclick="openItemCategory('special')">
        <span class="gilsys-category-icon">🔮</span>
        <span><span class="gilsys-category-name">特殊装備</span><span class="gilsys-category-desc">職業専用装備・矢・人形衣装</span></span>
      </button>
    </div>
  `;

  window.renderGilsysItemCategoryPanel = function(selectedCategory = "") {
    if (selectedCategory && selectedCategory !== "__category__") {
      openItemCategory(selectedCategory);
      return;
    }

    setInventoryMode();
    const title = getListTitle();
    const list = getList();
    if (title) title.textContent = "持ち物カテゴリ";
    if (!list) return;
    list.dataset.manual = "inventoryCategory";
    list.innerHTML = renderCategoryButtons();
    setGilsysCommandDetail(
      "持ち物",
      "カテゴリ選択",
      "左のカテゴリから確認したい持ち物を選択します。",
      "🎒",
      null
    );
  };

  const getCategoryToolsHtml = (category) => {
    const selectedCount = Array.isArray(window.equipmentCombineSelection)
      ? window.equipmentCombineSelection.length
      : (typeof equipmentCombineSelection !== "undefined" ? equipmentCombineSelection.length : 0);
    const combineMode = typeof equipmentCombineMode !== "undefined" && equipmentCombineMode;
    return `
      <div class="gilsys-panel-subtools gilsys-inventory-list-tools">
        <button onclick="returnToItemCategory()">カテゴリへ</button>
        ${category === "equip" ? `<button onclick="toggleEquipCombineMode()">${combineMode ? "合成をやめる" : "合成"}</button>` : ""}
        ${category === "equip" && combineMode ? `<button onclick="submitEquipCombine()" ${selectedCount === 2 ? "" : "disabled"}>選択した2つを合成</button>` : ""}
        ${category === "equip" && combineMode ? `<span>合成選択 ${selectedCount}/2</span>` : ""}
      </div>
    `;
  };

  const getIconCountHtml = (item, category) => {
    if (typeof isGilsysArrowItem === "function" && isGilsysArrowItem(item)) {
      const count = typeof getGilsysArrowCount === "function" ? getGilsysArrowCount(item) : Number(item?.count ?? item?.arrow_count ?? 0);
      return `<span class="gilsys-inventory-icon-count">${safe(count)}</span>`;
    }
    if (category === "item") {
      const count = Math.max(1, Number(item?.stackCount ?? 1) || 1);
      return count > 1 ? `<span class="gilsys-inventory-icon-count">${safe(count)}</span>` : "";
    }
    return "";
  };

  const renderInventoryIconGrid = (category, items, selectedUid = "") => {
    if (!items.length) {
      return `<div class="gilsys-inline-empty">${safe(categoryMeta[category]?.empty ?? "このカテゴリの持ち物はありません。")}</div>`;
    }
    const combineMode = category === "equip" && typeof equipmentCombineMode !== "undefined" && equipmentCombineMode;
    const selectedForCombine = Array.isArray(window.equipmentCombineSelection)
      ? window.equipmentCombineSelection
      : (typeof equipmentCombineSelection !== "undefined" ? equipmentCombineSelection : []);
    const buttons = items.map((item, index) => {
      const uid = getDisplayUid(item);
      const visual = typeof getShopVisualMeta === "function"
        ? getShopVisualMeta(item)
        : { icon: "◆", theme: "theme-bronze" };
      const iconHtml = typeof getShopIconMarkup === "function" ? getShopIconMarkup(visual.icon) : safe(visual.icon);
      const isSelected = selectedUid && uid === selectedUid;
      const isEquipped = item?.is_equipped_normal || item?.is_equipped_special;
      const isCombineSelected = combineMode && selectedForCombine.includes(String(item?.uid ?? ""));
      return `
        <button class="gilsys-shop-icon-btn gilsys-inventory-icon-btn ${safe(visual.theme || "")} ${isSelected ? "is-selected" : ""} ${isEquipped ? "is-equipped" : ""} ${isCombineSelected ? "is-combine-selected" : ""}"
          type="button"
          title="${safe(item?.name ?? "持ち物")}"
          onclick="renderInventoryItemDetail('${safe(category)}', ${index})">
          <span class="shop-icon">${iconHtml}</span>
          ${getIconCountHtml(item, category)}
          ${isEquipped ? `<span class="gilsys-inventory-equipped-dot">装</span>` : ""}
          ${isCombineSelected ? `<span class="gilsys-inventory-combine-dot">選</span>` : ""}
        </button>
      `;
    }).join("");
    return `<div class="gilsys-shop-icon-grid gilsys-inventory-icon-grid">${buttons}</div>`;
  };

  const renderEmptyDetail = (category) => {
    const meta = categoryMeta[category] || categoryMeta.item;
    renderGilsysDetailInventoryPanel(
      meta.title,
      getInventoryMetaText(category),
      "",
      `<div class="gilsys-inline-empty">${safe(meta.empty)}</div>`
    );
  };

  const buildInventoryDetailBody = (item, category) => {
    const name = safe(item?.name ?? "不明な持ち物");
    const rawDesc = typeof getGilsysDisplayEffectText === "function"
      ? getGilsysDisplayEffectText(item)
      : (item?.effect_text ?? item?.desc ?? "");
    const desc = safe(rawDesc || "効果説明なし");
    const stackUids = Array.isArray(item?.stackUids) ? item.stackUids.map(uid => String(uid ?? "")) : [String(item?.uid ?? "")];
    const isPending = stackUids.some(uid => window.pendingInventoryActionUids?.has?.(uid)) ?? false;
    const stackCount = Math.max(1, Number(item?.stackCount ?? 1) || 1);
    const stackCountHtml = (typeof isGilsysArrowItem === "function" && isGilsysArrowItem(item))
      ? (typeof getGilsysArrowCountBadgeHtml === "function" ? getGilsysArrowCountBadgeHtml(item) : "")
      : category === "item"
        ? `<span class="gilsys-item-stack-count">所持数${safe(stackCount)}</span>`
        : "";
    const visual = typeof getShopVisualMeta === "function"
      ? getShopVisualMeta(item)
      : { icon: "◆", badges: [], theme: "theme-bronze", metaClass: "" };
    const badgeHtml = (visual.badges || [])
      .map(b => `<span class="shop-badge kind-${safe(b.kind)}">${safe(b.label)}</span>`)
      .join("");
    const action = typeof getInventoryActionMeta === "function"
      ? getInventoryActionMeta(item, category)
      : { label: category === "item" ? "使用" : "装備", onclick: `useItem('${safe(item?.uid)}','use')` };
    const secondaryAction = typeof getInventorySecondaryActionMeta === "function"
      ? getInventorySecondaryActionMeta(item, category)
      : null;
    const combineMode = category === "equip" && typeof equipmentCombineMode !== "undefined" && equipmentCombineMode;
    const selectedForCombine = combineMode && (
      Array.isArray(window.equipmentCombineSelection)
        ? window.equipmentCombineSelection.includes(String(item?.uid ?? ""))
        : (typeof equipmentCombineSelection !== "undefined" && equipmentCombineSelection.includes(String(item?.uid ?? "")))
    );
    const actionStatus = combineMode
      ? "合成選択中"
      : (item?.is_equipped_normal || item?.is_equipped_special)
        ? "装備中"
        : category === "item"
          ? ""
          : "所持中";
    const primaryButton = combineMode
      ? `<button onclick="toggleEquipCombineSelect('${safe(item?.uid)}')">${selectedForCombine ? "選択解除" : "合成選択"}</button>`
      : `<button ${action.disabled || isPending ? "disabled" : `onclick="${action.onclick}"`}>${safe(isPending ? "反映中" : action.label)}</button>`;
    const secondaryButton = !combineMode && secondaryAction
      ? `<button class="gilsys-secondary-action" ${secondaryAction.disabled || isPending ? "disabled" : `onclick="${secondaryAction.onclick}"`}>${safe(isPending ? "反映中" : secondaryAction.label)}</button>`
      : "";

    return `
      <div class="gilsys-shop-detail-card gilsys-inventory-detail-card">
        <div class="shop-card inventory-card ${safe(visual.theme || "")} ${selectedForCombine ? "is-equip-combine-selected" : ""}">
          <div class="shop-card-main">
            <div class="shop-card-head">
              <div class="shop-icon">${typeof getShopIconMarkup === "function" ? getShopIconMarkup(visual.icon) : safe(visual.icon)}</div>
              <div class="shop-title-wrap">
                <div class="shop-item-name">${name}${stackCountHtml}</div>
                <div class="shop-meta-row ${safe(visual.metaClass ?? "")}">${badgeHtml}</div>
                <div class="shop-item-desc">${desc}</div>
              </div>
            </div>
          </div>
          <div class="shop-buy-area ${secondaryButton ? "is-multi-action" : ""}">
            ${actionStatus ? `<div class="shop-price">${safe(actionStatus)}</div>` : ""}
            ${primaryButton}
            ${secondaryButton}
          </div>
        </div>
      </div>
    `;
  };

  window.renderInventoryItemDetail = function(category, index) {
    const items = window.gilsysInventoryDisplayItems || [];
    const item = items[index];
    const meta = categoryMeta[category] || categoryMeta.item;
    if (!item) {
      renderEmptyDetail(category);
      return;
    }

    const uid = getDisplayUid(item);
    window.gilsysSelectedInventoryUidByCategory ??= {};
    window.gilsysSelectedInventoryUidByCategory[category] = uid;

    const list = getList();
    if (list) {
      list.querySelectorAll(".gilsys-inventory-icon-btn").forEach((button, buttonIndex) => {
        button.classList.toggle("is-selected", buttonIndex === Number(index));
      });
    }

    renderGilsysDetailInventoryPanel(
      meta.title,
      "持ち物詳細",
      "",
      buildInventoryDetailBody(item, category)
    );
  };

  window.openItemUI = function() {
    setInventoryMode();
    isItemUIOpen = true;
    currentItemCategory = "__category__";
    if (typeof closeItemCategory === "function") closeItemCategory();
    renderGilsysItemCategoryPanel();
  };

  window.returnToItemCategory = function() {
    if (typeof resetEquipCombineState === "function") resetEquipCombineState();
    openItemUI();
  };

  window.openItemCategory = function(category) {
    setInventoryMode();
    currentItemCategory = category;
    isItemUIOpen = true;
    if (category !== "equip" && typeof resetEquipCombineState === "function") {
      resetEquipCombineState();
    }

    const meta = categoryMeta[category] || categoryMeta.item;
    const title = getListTitle();
    const list = getList();
    if (title) title.textContent = meta.title;
    if (!list) return;

    const items = getInventoryItemsForCategory(category);
    window.gilsysInventoryDisplayItems = items;
    window.gilsysSelectedInventoryUidByCategory ??= {};
    const previousUid = window.gilsysSelectedInventoryUidByCategory[category] || "";
    const selectedIndex = Math.max(0, items.findIndex(item => getDisplayUid(item) === previousUid));
    const selectedUid = items[selectedIndex] ? getDisplayUid(items[selectedIndex]) : "";

    list.dataset.manual = `inventory:${category}`;
    list.innerHTML = getCategoryToolsHtml(category) + renderInventoryIconGrid(category, items, selectedUid);

    if (items.length) {
      renderInventoryItemDetail(category, selectedIndex);
    } else {
      renderEmptyDetail(category);
    }
  };
})();
