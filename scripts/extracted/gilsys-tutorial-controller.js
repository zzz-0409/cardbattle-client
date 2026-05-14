(() => {
  const state = {
    active: false,
    index: 0,
    waiting: "",
    targetEl: null,
    refreshTimers: []
  };

  const byId = (id) => document.getElementById(id);
  const q = (selector) => selector ? document.querySelector(selector) : null;
  const commandRows = () => [...document.querySelectorAll("#gilsysCommandList .gilsys-list-row")];
  const isVisibleElement = (el) => {
    const rect = el?.getBoundingClientRect?.();
    return !!rect && rect.width > 1 && rect.height > 1;
  };
  const shopIconButtons = () => [...document.querySelectorAll("#gilsysCommandList .gilsys-shop-icon-btn")].filter(isVisibleElement);
  const isTutorialShopSold = (item) => {
    if (!item) return true;
    if (typeof isShopItemSoldOut === "function" && isShopItemSoldOut(item)) return true;
    return !!(item.sold_out || item.soldOut || item.shop_sold_out);
  };
  const shopButtons = () => {
    const items = Array.isArray(window.gilsysLatestShopItems) ? window.gilsysLatestShopItems : [];
    return shopIconButtons().filter((btn, idx) => !btn.classList.contains("is-shop-sold-out") && !isTutorialShopSold(items[idx]));
  };
  const shopButtonForKind = (kind) => {
    const items = Array.isArray(window.gilsysLatestShopItems) ? window.gilsysLatestShopItems : [];
    const targetIdx = items.findIndex(item => item?.tutorial_shop_target === kind && !isTutorialShopSold(item));
    const idx = targetIdx >= 0 ? targetIdx : items.findIndex(item => {
      if (!item || isTutorialShopSold(item)) return false;
      if (kind === "item") return !item.is_equip && item.equip_type !== "normal";
      if (kind === "equip") return !!item.is_equip && item.equip_type === "normal";
      return false;
    });
    const icons = shopIconButtons();
    return idx >= 0 ? (icons[idx] || null) : (shopButtons()[0] || null);
  };
  const inventoryIconButtons = () => [...document.querySelectorAll([
    "#gilsysCommandList .gilsys-inventory-icon-btn"
  ].join(","))].filter(isVisibleElement);
  const inventoryActionButtons = () => [...document.querySelectorAll([
    "#gilsysCommandList .shop-card.inventory-card .shop-buy-area button:not(:disabled)",
    ".gilsys-detail-inventory-list .shop-card.inventory-card .shop-buy-area button:not(:disabled)",
    "#gilsysSideCommandDetail .shop-card.inventory-card .shop-buy-area button:not(:disabled)"
  ].join(","))].filter(isVisibleElement);
  const categoryButtons = () => {
    const list = byId("gilsysCommandList");
    const manual = String(list?.dataset?.manual ?? "");
    const rowButtons = list ? [...list.querySelectorAll(".gilsys-list-row")] : [];
    if ((manual === "items" || manual === "inventoryCategory") && rowButtons.length) {
      return rowButtons.filter(isVisibleElement);
    }
    return [...document.querySelectorAll([
      "#gilsysCommandList .gilsys-category-card",
      "#gilsysSideCommandDetail .gilsys-category-card",
      ".gilsys-detail-inventory-list .gilsys-category-card"
    ].join(","))].filter(isVisibleElement);
  };

  const steps = [
    {
      kind: "message",
      title: "基本ルール",
      text: "相手のHPを0にすると勝利です。チュートリアルでは戦士を使って、通常対戦で使う基本ボタンを順番に練習します。"
    },
    {
      kind: "click",
      title: "攻撃",
      text: "攻撃/スキルボタンでは、通常攻撃と職業スキルを選べます。まずはここを押してください。",
      target: "#atkBtn",
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "通常攻撃",
      text: "通常攻撃が選ばれています。決定を押すと行動確認が出ます。",
      target: "#gilsysConfirmBtn",
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "行動確認",
      text: "実行するを押すと攻撃してターンを使います。行動後はEXPが5増え、次の自分のターン開始時に10コインを獲得します。",
      target: "#confirmPopupOkBtn",
      wait: "your_turn"
    },
    {
      kind: "click",
      title: "スキル",
      text: "次はスキルです。攻撃/スキルボタンから、職業ごとのスキルを選べます。",
      target: "#atkBtn",
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "スキル選択",
      text: "スキル1を選んでください。スキルはレベルや使用回数の条件を満たすと使えます。",
      target: () => commandRows()[1] || null,
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "スキル発動",
      text: "決定を押すと行動確認が出ます。",
      target: "#gilsysConfirmBtn",
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "スキル発動",
      text: "実行するを押すとスキルを発動します。スキルも基本的にはターンを使う行動です。",
      target: "#confirmPopupOkBtn",
      wait: "your_turn"
    },
    {
      kind: "click",
      title: "ショップ",
      text: "ショップではコインでアイテムや装備を購入できます。コインは毎ターン10ずつ増えます。",
      target: "#shopBtn",
      wait: "shop_list"
    },
    {
      kind: "click",
      title: "アイテム購入",
      text: "最初の商品を選んでください。今回は回復アイテムを買います。",
      target: () => shopButtonForKind("item"),
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "購入",
      text: "購入ボタンで持ち物に入ります。",
      target: ".gilsys-shop-detail-card .shop-buy-area button:not(:disabled)",
      wait: "purchased_item"
    },
    {
      kind: "click",
      title: "装備購入",
      text: "次に装備を買います。装備は持ち物から装備するとステータスを強化できます。",
      target: () => shopButtonForKind("equip"),
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "購入",
      text: "この装備も購入してください。",
      target: ".gilsys-shop-detail-card .shop-buy-area button:not(:disabled)",
      wait: "purchased_item"
    },
    {
      kind: "click",
      title: "アイテム",
      text: "持ち物ボタンでは、アイテム、装備、特殊装備をカテゴリごとに確認できます。",
      target: "#itemBtn",
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "アイテムカテゴリ",
      text: "アイテムカテゴリを開きます。持ち物は左にアイコン一覧、右に選択中の詳細が表示されます。",
      target: () => categoryButtons()[0] || null,
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "アイテム選択",
      text: "左の持ち物一覧から、さっき買った回復アイテムのアイコンを押してください。右側に詳細が表示されます。",
      target: () => inventoryIconButtons()[0] || null,
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "アイテム使用",
      text: "右側の詳細パネルにある使用ボタンを押してください。アイテムは所持数を消費して効果を発動します。",
      target: () => inventoryActionButtons()[0] || null,
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "装備",
      text: "次は装備です。もう一度、持ち物ボタンを押してください。",
      target: "#itemBtn",
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "装備カテゴリ",
      text: "装備カテゴリを開きます。装備も左の一覧から選ぶと、右に詳細と操作ボタンが出ます。",
      target: () => categoryButtons()[1] || null,
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "装備選択",
      text: "左の装備一覧から、購入した装備のアイコンを押してください。",
      target: () => inventoryIconButtons()[0] || null,
      nextAfterClick: true
    },
    {
      kind: "click",
      title: "装備する",
      text: "右側の詳細パネルにある装備ボタンを押してください。",
      target: () => inventoryActionButtons()[0] || null,
      nextAfterClick: true
    },
    {
      kind: "message",
      title: "装備合成",
      text: "同じ通常装備を複数持っているときは、装備画面の合成から強化できます。装備が増えたらここで整理していきます。"
    },
    {
      kind: "click",
      title: "レベルアップ",
      text: "レベルアップではEXPを使って強くなれます。EXPは毎ターン行動後に5ずつ入ります。足りない分はコインで補うこともできます。",
      target: "#lvupBtn",
      wait: "level_up_check"
    },
    {
      kind: "click",
      title: "レベルアップ確認",
      text: "確認でOKを押すとレベルアップします。",
      target: "#confirmPopupOkBtn",
      wait: "level_info"
    },
    {
      kind: "message",
      title: "練習完了",
      text: "これで通常対戦の基本操作は完了です。あとは自由に攻撃やスキルを使って、訓練用の相手を倒してみてください。",
      freeAfter: true
    }
  ];

  function ensureOverlay() {
    let root = byId("gilsysTutorialOverlay");
    const host = byId("game-wrapper") || document.body;
    if (root) {
      if (root.parentElement !== host) host.appendChild(root);
      return root;
    }
    root = document.createElement("div");
    root.id = "gilsysTutorialOverlay";
    root.className = "gilsys-tutorial-overlay";
    root.hidden = true;
    root.innerHTML = `
      <div class="gilsys-tutorial-card" role="dialog" aria-live="polite">
        <div class="gilsys-tutorial-title" id="gilsysTutorialTitle"></div>
        <div class="gilsys-tutorial-text" id="gilsysTutorialText"></div>
        <div class="gilsys-tutorial-hint" id="gilsysTutorialHint"></div>
      </div>
    `;
    host.appendChild(root);
    return root;
  }

  function currentStep() {
    return steps[state.index] || null;
  }

  function resolveTarget(step = currentStep()) {
    if (!step?.target) return null;
    return typeof step.target === "function" ? step.target() : q(step.target);
  }

  function clearTarget() {
    if (state.targetEl) state.targetEl.classList.remove("gilsys-tutorial-target");
    state.targetEl = null;
    for (const timer of state.refreshTimers) clearTimeout(timer);
    state.refreshTimers = [];
  }

  function getScrollableAncestor(el) {
    let node = el?.parentElement || null;
    while (node && node !== document.body && node !== document.documentElement) {
      const style = getComputedStyle(node);
      const scrollY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 2;
      const scrollX = /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 2;
      if (scrollY || scrollX) return { node, scrollY, scrollX };
      node = node.parentElement;
    }
    return null;
  }

  function scrollTargetIntoLocalView(el) {
    const scrollable = getScrollableAncestor(el);
    if (!scrollable) {
      window.gilsysResetOuterScroll?.();
      return;
    }
    const { node, scrollY, scrollX } = scrollable;
    const pad = 12;
    const targetRect = el.getBoundingClientRect();
    const boxRect = node.getBoundingClientRect();
    if (scrollY) {
      if (targetRect.top < boxRect.top + pad) {
        node.scrollTop -= (boxRect.top + pad) - targetRect.top;
      } else if (targetRect.bottom > boxRect.bottom - pad) {
        node.scrollTop += targetRect.bottom - (boxRect.bottom - pad);
      }
    }
    if (scrollX) {
      if (targetRect.left < boxRect.left + pad) {
        node.scrollLeft -= (boxRect.left + pad) - targetRect.left;
      } else if (targetRect.right > boxRect.right - pad) {
        node.scrollLeft += targetRect.right - (boxRect.right - pad);
      }
    }
    window.gilsysResetOuterScroll?.();
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rectsOverlap(a, b, pad = 0) {
    return !(
      a.right <= b.left - pad ||
      a.left >= b.right + pad ||
      a.bottom <= b.top - pad ||
      a.top >= b.bottom + pad
    );
  }

  function overlapArea(a, b) {
    const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return x * y;
  }

  function getOverlayMetrics(root) {
    const rect = root.getBoundingClientRect();
    return {
      rect,
      width: root.clientWidth || 1280,
      height: root.clientHeight || 720,
      scaleX: rect.width ? (root.clientWidth || rect.width) / rect.width : 1,
      scaleY: rect.height ? (root.clientHeight || rect.height) / rect.height : 1
    };
  }

  function toLocalRect(el, metrics) {
    const rect = el.getBoundingClientRect();
    const left = (rect.left - metrics.rect.left) * metrics.scaleX;
    const top = (rect.top - metrics.rect.top) * metrics.scaleY;
    const width = rect.width * metrics.scaleX;
    const height = rect.height * metrics.scaleY;
    return {
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height
    };
  }

  function placeTutorialCard(targetEl = null) {
    const root = ensureOverlay();
    const card = root.querySelector(".gilsys-tutorial-card");
    if (!card) return;
    card.classList.toggle("is-near-target", !!(targetEl && isVisibleElement(targetEl)));
    card.style.left = "";
    card.style.top = "";
    card.style.bottom = "";
    card.style.transform = "";
  }

  function refreshTarget() {
    if (!state.active) return;
    const step = currentStep();
    if (step?.kind !== "click") {
      clearTarget();
      placeTutorialCard(null);
      return;
    }
    const nextTarget = resolveTarget(step);
    if (state.targetEl && state.targetEl !== nextTarget) {
      state.targetEl.classList.remove("gilsys-tutorial-target");
    }
    const changed = state.targetEl !== nextTarget;
    state.targetEl = nextTarget || null;
    if (state.targetEl) {
      state.targetEl.classList.add("gilsys-tutorial-target");
      if (changed) scrollTargetIntoLocalView(state.targetEl);
    }
    placeTutorialCard(state.targetEl);
  }

  function scheduleTargetRefresh() {
    clearTarget();
    for (let i = 0; i < 24; i += 1) {
      state.refreshTimers.push(setTimeout(refreshTarget, i * 120));
    }
  }

  function renderStep() {
    const step = currentStep();
    if (!step) {
      finish(false);
      return;
    }

    const root = ensureOverlay();
    root.hidden = false;
    document.body.classList.add("gilsys-tutorial-active");
    byId("gilsysTutorialTitle").textContent = step.title || "チュートリアル";
    byId("gilsysTutorialText").textContent = step.text || "";
    byId("gilsysTutorialHint").textContent =
      step.kind === "message"
        ? "説明をタップして次へ"
        : state.waiting
          ? "処理が終わるまで待ってください"
          : "光っている場所を押してください";
    placeTutorialCard(null);
    scheduleTargetRefresh();
  }

  function finish(keepTutorialFlag) {
    state.active = false;
    state.waiting = "";
    clearTarget();
    const root = byId("gilsysTutorialOverlay");
    if (root) root.hidden = true;
    document.body.classList.remove("gilsys-tutorial-active");
    if (!keepTutorialFlag) {
      window.gilsysTutorialBattleActive = false;
      document.body.classList.remove("gilsys-tutorial-battle");
    }
  }

  function nextStep() {
    const step = currentStep();
    if (step?.freeAfter) {
      finish(true);
      return;
    }
    state.index += 1;
    state.waiting = "";
    renderStep();
  }

  function waitMatches(wait, data) {
    if (!wait || !data) return false;
    if (wait === "your_turn") return data.type === "your_turn";
    if (wait === "shop_list") return data.type === "shop_list";
    if (wait === "purchased_item") return data.type === "purchased_item";
    if (wait === "level_up_check") return data.type === "level_up_check";
    if (wait === "level_info") return data.type === "level_info" && Number(data.level ?? 0) >= 2;
    return data.type === wait;
  }

  function startTutorial() {
    if (state.active) return;
    state.active = true;
    state.index = 0;
    state.waiting = "";
    renderStep();
  }

  document.addEventListener("click", (event) => {
    if (!state.active) return;
    const step = currentStep();
    if (!step) return;
    if (step.kind === "message") {
      event.preventDefault();
      event.stopImmediatePropagation();
      nextStep();
      return;
    }

    const target = resolveTarget(step);
    const hitTarget = target && target.contains(event.target);
    if (!hitTarget) {
      event.preventDefault();
      event.stopImmediatePropagation();
      byId("gilsysTutorialHint").textContent = "まず光っている場所を押してください";
      refreshTarget();
      return;
    }

    if (step.wait) {
      state.waiting = step.wait;
      renderStep();
    }
    if (step.nextAfterClick) {
      setTimeout(nextStep, step.delay ?? 140);
    }
  }, true);

  window.handleTutorialWsEvent = function(data) {
    if (data?.type === "match_start" && (data.mode === "tutorial" || data.tutorial || window.matchMode === "tutorial")) {
      window.gilsysTutorialBattleActive = true;
      window.gilsysTutorialStarted = false;
      document.body.classList.add("gilsys-tutorial-battle");
    }

    if (data?.type === "purchased_item" && window.gilsysTutorialBattleActive) {
      const confirmPopup = byId("itemConfirmPopup");
      if (confirmPopup && confirmPopup.style.display !== "none") confirmPopup.style.display = "none";
    }

    if (data?.type === "battle_end" && window.gilsysTutorialBattleActive) {
      finish(false);
      if (typeof showCenterToast === "function") showCenterToast("チュートリアル完了！", 2200);
      return;
    }

    if (!state.active || !state.waiting || !waitMatches(state.waiting, data)) return;
    const delay = state.waiting === "your_turn" ? 360 : 120;
    setTimeout(nextStep, delay);
  };

  window.gilsysStartTutorialIfNeeded = function() {
    if (!window.gilsysTutorialBattleActive || window.gilsysTutorialStarted) return;
    window.gilsysTutorialStarted = true;
    startTutorial();
  };
})();
