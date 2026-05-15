(() => {
  const MODE_TO_BUTTON = {
    attack: "atkBtn",
    inventory: "itemBtn",
    shop: "shopBtn",
    doll: "dollBuffBtn",
  };

  const BUTTON_IDS = ["atkBtn", "itemBtn", "shopBtn", "dollBuffBtn", "lvupBtn"];
  let observer = null;

  function setActionSelection(mode) {
    const activeId = MODE_TO_BUTTON[mode] || "";
    for (const id of BUTTON_IDS) {
      const button = document.getElementById(id);
      if (!button) continue;
      const selected = id === activeId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    }
    const phase = document.getElementById("phase2");
    if (phase) phase.dataset.commandAction = mode || "";
  }

  function modeFromManual(manual) {
    const value = String(manual || "");
    if (value === "shop") return "shop";
    if (value === "inventoryCategory" || value.startsWith("inventory:")) return "inventory";
    if (value === "attackSkill" || value === "default" || value === "attack") return "attack";
    return "";
  }

  function syncFromList() {
    const list = document.getElementById("gilsysCommandList");
    const mode = modeFromManual(list?.dataset?.manual);
    if (!mode) return false;
    setActionSelection(mode);
    return true;
  }

  function wrapCommandFunction(name, fallbackMode) {
    const original = window[name];
    if (typeof original !== "function" || original.__gilsysActionSelectionWrapped) return;

    const wrapped = function wrappedCommandSelection(...args) {
      const result = original.apply(this, args);
      if (!syncFromList() && fallbackMode) setActionSelection(fallbackMode);
      return result;
    };
    wrapped.__gilsysActionSelectionWrapped = true;
    wrapped.__gilsysOriginal = original;
    window[name] = wrapped;
  }

  function observeCommandList() {
    const list = document.getElementById("gilsysCommandList");
    if (!list || observer) return;
    observer = new MutationObserver(() => syncFromList());
    observer.observe(list, { attributes: true, attributeFilter: ["data-manual"] });
  }

  function install() {
    wrapCommandFunction("openAttackSkillPanel", "attack");
    wrapCommandFunction("openItemUI", "inventory");
    wrapCommandFunction("renderGilsysItemCategoryPanel", "inventory");
    wrapCommandFunction("openItemCategory", "inventory");
    wrapCommandFunction("returnToItemCategory", "inventory");
    wrapCommandFunction("openShop", "shop");
    wrapCommandFunction("renderShop", "shop");
    wrapCommandFunction("openDollBuffSelectUI", "doll");
    observeCommandList();
    syncFromList();
  }

  window.gilsysSetActionCommandSelection = setActionSelection;
  window.gilsysSyncActionCommandSelection = syncFromList;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }

  setTimeout(install, 0);
  setTimeout(install, 500);
})();
