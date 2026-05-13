(() => {
  const HOME_TABS = [
    ["home", "⌂", "ホーム", false],
    ["battle", "⚔", "対戦", false],
    ["growth", "↑", "育成", false],
    ["gacha", "◇", "ガチャ", true],
    ["shop", "▣", "ショップ", true]
  ];

  function makeNavButton(tab, icon, label, disabled) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gilsys-home-nav-btn";
    btn.dataset.homeTab = tab;
    btn.disabled = !!disabled;
    btn.innerHTML = `<i>${icon}</i><b>${label}</b>`;
    return btn;
  }

  function setHomeTabFallback(tab = "home") {
    const dock = document.getElementById("gilsysHomeActionDock");
    const battle = document.getElementById("gilsysHomeBattlePanel");
    const growth = document.getElementById("gilsysHomeGrowthPanel");
    document.querySelectorAll("#gilsysHomeBottomNav .gilsys-home-nav-btn").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.homeTab === tab);
    });
    if (!dock || !battle || !growth) return;
    const open = tab === "battle" || tab === "growth";
    dock.classList.toggle("is-open", open);
    dock.setAttribute("aria-hidden", open ? "false" : "true");
    battle.hidden = tab !== "battle";
    growth.hidden = tab !== "growth";
    window.gilsysFitControlText?.(true);
  }

  function handleHomeNavClick(event) {
    const btn = event.target.closest?.(".gilsys-home-nav-btn");
    if (!btn || btn.disabled) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const tab = btn.dataset.homeTab || "home";
    const dockOpen = document.getElementById("gilsysHomeActionDock")?.classList.contains("is-open");
    const closeActiveMenu = dockOpen && btn.classList.contains("is-active") && (tab === "battle" || tab === "growth");
    const nextTab = closeActiveMenu ? "home" : tab;
    (window.gilsysSetHomeTab || setHomeTabFallback)(nextTab);
  }

  function ensureHomeControlFallback() {
    const layout = document.getElementById("phase0HomeLayout");
    if (!layout) return;

    let dock = document.getElementById("gilsysHomeActionDock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "gilsysHomeActionDock";
      dock.setAttribute("aria-hidden", "true");
      layout.appendChild(dock);
    }

    let battle = document.getElementById("gilsysHomeBattlePanel");
    if (!battle) {
      battle = document.createElement("section");
      battle.id = "gilsysHomeBattlePanel";
      battle.className = "gilsys-home-drawer";
      battle.hidden = true;
      battle.innerHTML = `<div class="gilsys-home-drawer-head"><h2>対戦</h2><span>モード選択</span></div><div id="gilsysHomeBattleBody"></div>`;
      dock.appendChild(battle);
    }

    let growth = document.getElementById("gilsysHomeGrowthPanel");
    if (!growth) {
      growth = document.createElement("section");
      growth.id = "gilsysHomeGrowthPanel";
      growth.className = "gilsys-home-drawer";
      growth.hidden = true;
      growth.innerHTML = `<div class="gilsys-home-drawer-head"><h2>育成</h2><span>準備中</span></div><div id="gilsysHomeGrowthActions"></div>`;
      dock.appendChild(growth);
    }

    const battleBody = document.getElementById("gilsysHomeBattleBody");
    const modePanel = document.getElementById("titleModePanel");
    if (battleBody && modePanel && modePanel.parentElement !== battleBody) {
      battleBody.appendChild(modePanel);
    }

    let nav = document.getElementById("gilsysHomeBottomNav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "gilsysHomeBottomNav";
      nav.setAttribute("aria-label", "ホームメニュー");
      layout.appendChild(nav);
    }

    for (const [tab, icon, label, disabled] of HOME_TABS) {
      if (!nav.querySelector(`[data-home-tab="${tab}"]`)) {
        nav.appendChild(makeNavButton(tab, icon, label, disabled));
      }
    }

    nav.onclick = null;
    if (nav.dataset.gilsysFallbackClickBound !== "1") {
      nav.dataset.gilsysFallbackClickBound = "1";
      nav.addEventListener("click", handleHomeNavClick, true);
    }

    if (!nav.querySelector(".is-active")) setHomeTabFallback("home");
  }

  window.gilsysEnsureHomeControlFallback = ensureHomeControlFallback;
  document.addEventListener("DOMContentLoaded", ensureHomeControlFallback, { once: true });
  if (document.readyState !== "loading") ensureHomeControlFallback();
  setTimeout(ensureHomeControlFallback, 0);
  setTimeout(ensureHomeControlFallback, 700);
})();
