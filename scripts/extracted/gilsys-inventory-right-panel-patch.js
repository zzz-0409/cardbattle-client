(() => {
  const setInventoryMode = () => {
    const panel = document.querySelector(".gilsys-command-list-panel");
    if (!panel) return;
    panel.classList.add("is-inventory-mode");
    panel.classList.remove("is-shop-mode");
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

  window.openItemCategory = function(category) {
    setInventoryMode();
    currentItemCategory = category;
    isItemUIOpen = true;
    if (category !== "equip" && typeof resetEquipCombineState === "function") {
      resetEquipCombineState();
    }

    const titleMap = {
      item: "アイテム",
      equip: "装備",
      special: "特殊装備",
    };
    const all = window.itemList || [];
    const rawItems = all
      .filter(it => it?.category === category)
      .sort((a, b) => {
        const ae = ((category === "equip" && a?.is_equipped_normal) || (category === "special" && a?.is_equipped_special)) ? 1 : 0;
        const be = ((category === "equip" && b?.is_equipped_normal) || (category === "special" && b?.is_equipped_special)) ? 1 : 0;
        return be - ae;
      });
    const items = stackDisplayItems(rawItems, category);

    renderGilsysItemCategoryPanel(category);
    const list = document.getElementById("gilsysCommandList");
    if (list) list.dataset.manual = `items-${category}`;

    const selectedCount = Array.isArray(window.equipmentCombineSelection)
      ? window.equipmentCombineSelection.length
      : (typeof equipmentCombineSelection !== "undefined" ? equipmentCombineSelection.length : 0);
    const remaining = Math.max(0, Number(window.itemUsesRemaining ?? 2));
    const tools = `
      ${category === "equip" ? `<button onclick="toggleEquipCombineMode()">${typeof equipmentCombineMode !== "undefined" && equipmentCombineMode ? "合成選択をやめる" : "装備を合成"}</button>` : ""}
      ${category === "equip" && typeof equipmentCombineMode !== "undefined" && equipmentCombineMode ? `<button onclick="submitEquipCombine()" ${selectedCount === 2 ? "" : "disabled"}>選択した2つを合成</button>` : ""}
    `;
    const body = items.length
      ? items.map(it => typeof renderInventoryCard === "function" ? renderInventoryCard(it, category) : `<div class="gilsys-inline-empty">${escapeHtml(it?.name ?? "アイテム")}</div>`).join("")
      : `<div class="gilsys-inline-empty">${escapeHtml(titleMap[category] ?? "持ち物")}はありません</div>`;
    const meta = category === "item"
      ? `このターンあと ${remaining} 個使用できます`
      : "カード内のボタンから操作できます";

    renderGilsysDetailInventoryPanel(titleMap[category] ?? "持ち物", meta, tools, body);
  };
})();
