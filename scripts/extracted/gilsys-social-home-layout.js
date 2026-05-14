(() => {
  function cssAssetUrl(src) {
    if (typeof window.gilsysCssUrl === "function") return window.gilsysCssUrl(src);
    const raw = String(src || "").trim();
    if (!raw) return "";
    try {
      const url = /^(?:data:|blob:|https?:|file:)/i.test(raw)
        ? raw
        : new URL(raw.replace(/^\.\//, ""), document.baseURI).href;
      return `url("${String(url).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
    } catch (_) {
      return `url("${raw.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
    }
  }

  function makeButton(tab, icon, label, disabled = false) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gilsys-home-nav-btn";
    btn.dataset.homeTab = tab;
    btn.disabled = disabled;
    btn.innerHTML = `<i>${icon}</i><b>${label}</b>`;
    return btn;
  }

  function makeDisabledPanelButton(icon, label) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "gilsys-home-panel-btn";
    btn.disabled = true;
    btn.setAttribute("aria-label", `${label} 未実装`);
    btn.innerHTML = `<span class="phase0-menu-icon">${icon}</span><span class="phase0-menu-text">${label}</span>`;
    return btn;
  }

  function syncHomeUserName() {
    const nameEl = document.getElementById("gilsysHomeUserName");
    if (!nameEl) return;
    const raw = window.accountName || document.getElementById("titleAccountName")?.textContent?.replace(/^名前：/, "") || "-";
    nameEl.textContent = raw || "-";
  }

  function getHomeJobs() {
    return (typeof JOB_LIST !== "undefined" && Array.isArray(JOB_LIST)) ? JOB_LIST : [];
  }

  function getHomeJobIndex() {
    const jobs = getHomeJobs();
    if (!jobs.length) return 0;
    const stored = Number(localStorage.getItem("gilsys_home_job_id"));
    const selected = Number(typeof selectedJobId !== "undefined" ? selectedJobId : 0);
    const target = selected || stored || jobs[0]?.id;
    const found = jobs.findIndex(job => Number(job.id) === Number(target));
    return found >= 0 ? found : 0;
  }

  function applyHomeCharacter(index, animate = false) {
    const jobs = getHomeJobs();
    const hero = document.getElementById("phase0Hero");
    if (!jobs.length || !hero) return;
    const normalized = ((index % jobs.length) + jobs.length) % jobs.length;
    const job = jobs[normalized];
    const meta = typeof getJobSelectMeta === "function" ? getJobSelectMeta(job) : {};
    const portrait = meta?.portrait || "Assets/shokugyousenntaku/sennsi1_facefix_transparent.png";
    const label = document.getElementById("gilsysHomeCharacterLabelName");
    window.gilsysHomeJobIndex = normalized;
    if (typeof selectedJobId !== "undefined") selectedJobId = job.id;
    try { localStorage.setItem("gilsys_home_job_id", String(job.id)); } catch (_) {}
    const commit = () => {
      let img = document.getElementById("gilsysHomeCharacterImg");
      if (!img) {
        img = document.createElement("img");
        img.id = "gilsysHomeCharacterImg";
        img.className = "gilsys-home-character-img";
        img.alt = "";
        img.decoding = "async";
        img.loading = "eager";
        hero.prepend(img);
      }
      const assetUrl = typeof window.gilsysAssetUrl === "function" ? window.gilsysAssetUrl(portrait) : portrait;
      if (img.getAttribute("src") !== assetUrl) img.src = assetUrl || portrait;
      hero.classList.add("has-home-character-img");
      hero.style.setProperty("--gilsys-home-portrait-image", cssAssetUrl(portrait));
      hero.dataset.homeJobId = String(job.id);
      if (label) {
        label.textContent = job.name;
        label.title = job.name;
      }
    };
    if (animate) {
      hero.classList.add("is-switching");
      setTimeout(commit, 70);
      setTimeout(() => hero.classList.remove("is-switching"), 190);
    } else {
      commit();
    }
  }

  function shiftHomeCharacter(step) {
    const jobs = getHomeJobs();
    if (!jobs.length) return;
    const current = Number.isInteger(window.gilsysHomeJobIndex) ? window.gilsysHomeJobIndex : getHomeJobIndex();
    applyHomeCharacter(current + step, true);
  }

  function bindHomeCharacterSwipe() {
    const hero = document.getElementById("phase0Hero");
    if (!hero || hero.dataset.gilsysHomeSwipeBound === "1") return;
    hero.dataset.gilsysHomeSwipeBound = "1";
    let startX = 0;
    let lastX = 0;
    let dragging = false;

    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const finish = () => {
      if (!dragging) return;
      dragging = false;
      hero.classList.remove("is-dragging");
      hero.style.setProperty("--gilsys-home-drag-x", "0px");
      const delta = lastX - startX;
      if (Math.abs(delta) >= 46) shiftHomeCharacter(delta < 0 ? 1 : -1);
    };

    hero.addEventListener("pointerdown", event => {
      if (event.button !== undefined && event.button !== 0) return;
      if (event.target.closest?.(".gilsys-home-character-arrow")) return;
      dragging = true;
      startX = event.clientX;
      lastX = startX;
      hero.classList.add("is-dragging");
      hero.setPointerCapture?.(event.pointerId);
    });

    hero.addEventListener("pointermove", event => {
      if (!dragging) return;
      lastX = event.clientX;
      const delta = clamp(lastX - startX, -92, 92);
      hero.style.setProperty("--gilsys-home-drag-x", `${delta}px`);
    });

    hero.addEventListener("pointerup", finish);
    hero.addEventListener("pointercancel", finish);
    hero.addEventListener("lostpointercapture", finish);
  }

  function setHomeTab(tab = "home") {
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

  function bindHomeMenuDismiss(layout) {
    if (!layout || layout.dataset.gilsysDismissBound === "1") return;
    layout.dataset.gilsysDismissBound = "1";
    document.addEventListener("pointerdown", event => {
      const dock = document.getElementById("gilsysHomeActionDock");
      if (!dock?.classList.contains("is-open")) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!layout.contains(target)) return;
      if (target.closest("#gilsysHomeActionDock, #gilsysHomeBottomNav")) return;
      setHomeTab("home");
    });
  }

  const GILSYS_HOME_NOTICES = [
    {
      title: "ver5.15.1 アップデート内容",
      body: `ver5.15.1 アップデート内容

・新機能 / 改善
持ち物画面の表示形式を変更しました。

HPバーの表示をリニューアルしました。

人形の耐久バーを見やすくしました。

スキル封印中にスキルを使おうとした場合、使用できないことを表示するようにしました。

・達人の道
一部の軌跡効果を変更しました。
通常アイテムの効果を強化する軌跡を追加しました。

装備・特殊装備関連の軌跡内容を調整しました。
持ち込み枠、装備枠、特殊装備の報酬内容を変更しました。

新しい特殊装備「ムラサメ」を追加しました。

新しい特殊装備「デュランダル」を追加しました。

達人の道オートモード時、アイテム使用制限を超えて使用できてしまう問題を修正しました。

オートモード時にスキル4・5を使用しない問題を修正しました。

・バトル画面 / 表示改善
バトル画面のアイコンとアイコンフレームの表示を調整しました。

アイコン用画像を変更しました。

錬金術師のバトル画像を変更し、背景と同化して薄く見える問題を改善しました。

装備・特殊装備のホバー表示から不要な項目表示を削除しました。

相手の人形使いの衣装ホバー表示が出ない問題を修正しました。

・勝敗画面
勝利画面・敗北画面のレート変動表示を調整しました。
1画面に収まりやすいよう、表示サイズを調整しました。

勝利画面で自分の職業だけでなく、相手の職業も表示されるようにしました。

敗北画面用の背景を追加しました。`
    },
    {
      title: "ver5.13.22 アップデート内容",
      body: [
        "・新機能 / 改善",
        "マッチング画面をバトル画面とは別画面として扱うように変更しました。",
        "これにより、画面切り替え前にCPUが先に行動してしまう問題を防止しました。",
        "",
        "通常対戦の勝利画面をリニューアルしました。",
        "画面切り替え時、画像の読み込みが完了するまでロード画面を表示するようにしました。",
        "ロード中には、基本ルールや豆知識がランダムで表示されます。",
        "",
        "達人の道の進行状況をアカウントに保存するようにしました。",
        "更新後でも、進行状況が消えにくくなりました。",
        "",
        "戦闘ログの内容を調整しました。",
        "スキル発動、効果、ダメージなどがプレイヤーに分かりやすく表示されるよう改善しました。",
        "",
        "・バトル仕様変更",
        "ラウンド表記を廃止し、各プレイヤーごとのターン表記に変更しました。",
        "継続効果はターン単位で管理されるようになりました。",
        "",
        "デバフの継続ターンは、付与されている側のターン終了時に減少するよう変更しました。",
        "鬼火と毒のダメージは、お互いのターン終了時に発生します。",
        "",
        "・不具合修正",
        "アイテム使用時、バフ効果音が二重に鳴ることがある問題を修正しました。",
        "",
        "ホーム画面やマッチング画面で、キャラ画像やアイコン画像が表示されない問題を修正しました。",
        "",
        "バトル画面で相手の装備詳細が見られない問題を修正しました。",
        "",
        "装備のホバー表示が消える問題を修正しました。",
        "",
        "チュートリアルは現在、戦士のみ接続できるように制限しました。"
      ].join("\n")
    },
    {
      title: "ver5.13.1アップデート内容",
      body: [
        "・新機能について",
        "通常対戦の基本操作を練習できるチュートリアルを追加しました。",
        "チュートリアルでは攻撃、スキル、アイテム、装備、レベルアップ、ショップの流れを確認できます。",
        "・調整",
        "チュートリアル中の案内文、押す場所の誘導、ショップ内容を調整しました。",
        "達人への道の自動合成は、手動で切り替えたON/OFFが維持されるようにしました。",
        "達人への道の戦闘オートは、ステージクリア時にOFFへ戻るようにしました。",
        "・バグ修正",
        "チュートリアルの勝利画面が左側に寄って表示される問題を修正しました。",
        "チュートリアル中に購入後装備確認やカテゴリ選択で進行できなくなる場合がある問題を修正しました。",
        "チュートリアルのショップ詳細画像が動いてしまう問題を修正しました。"
      ].join("\n")
    },
    {
      title: "ver5.12.15アップデート内容",
      body: [
        "・新機能について",
        "達人への道を実装しました。",
        "戦士で達人への道を制覇すると、アイコンフレームがもらえるミッションを追加しました。",
        "弓兵の矢を3本セットの所持数管理に変更し、防御低下の矢を追加しました。",
        "右から4番目の軌跡効果と、新しい特殊アイテム・特殊装備を追加しました。",
        "・調整",
        "バトル画面でアイコンと称号が表示されるようにしました。",
        "同じ通常アイテムは一つにまとめ、所持数を表示するようにしました。",
        "弓兵のスキル、矢の消費、追撃演出を調整しました。",
        "僧侶のスキルとパッシブ回復量を調整しました。",
        "・バグ修正",
        "CPU戦で相手が動かなくなる場合がある問題を修正しました。",
        "バトル中のアイコン表示、ダメージ・回復・毒ポップアップ、HPバー反映タイミングを修正しました。",
        "スマホ画面でバトルログや行動選択ボタンの表示が崩れる問題を修正しました。"
      ].join("\n")
    },
    {
      title: "ver5.12.1アップデート内容",
      body: [
        "・新機能について",
        "対戦開始前にマッチした相手が分かるVS演出を追加しました。",
        "・表示調整",
        "バトル画面の相手錬金術師が薄く表示される問題を調整しました。",
        "・バグ修正",
        "マッチング後にキャラや行動ボタンが表示されず進行できない場合がある問題を修正しました。",
        "バトルステージの装備、特殊装備、人形衣装の詳細表示が出ない問題を修正しました。",
        "・演出調整",
        "マッチング時の雷演出と効果音を取り消しました。"
      ].join("\n")
    },
    {
      title: "ver5.21アップデート内容",
      body: [
        "・新機能について",
        "ミッション、称号、アイコンなどを追加しました。",
        "・バグ修正",
        "本来の想定と演出のタイミングが異なる問題修正しました。"
      ].join("\n")
    }
  ];

  function ensureNoticeModal() {
    let modal = document.getElementById("gilsysNoticeModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "gilsysNoticeModal";
    modal.className = "gilsys-notice-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="gilsys-notice-panel" role="dialog" aria-modal="true" aria-labelledby="gilsysNoticeTitle">
        <div class="gilsys-notice-head">
          <h2 id="gilsysNoticeTitle"></h2>
          <button type="button" class="gilsys-notice-close" aria-label="閉じる"></button>
        </div>
        <div id="gilsysNoticeBody" class="gilsys-notice-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const noticeBtn = target.closest("[data-notice-index]");
      if (noticeBtn) {
        openNoticeDetail(Number(noticeBtn.getAttribute("data-notice-index") || 0));
        return;
      }
      if (target === modal || target.closest(".gilsys-notice-close")) {
        modal.hidden = true;
        modal.classList.remove("is-open");
      }
    });
    return modal;
  }

  function openNoticeDetail(index = 0) {
    const notice = GILSYS_HOME_NOTICES[index] || GILSYS_HOME_NOTICES[0];
    const modal = ensureNoticeModal();
    setGilsysText("gilsysNoticeTitle", notice.title);
    const body = document.getElementById("gilsysNoticeBody");
    if (body) body.textContent = notice.body;
    modal.hidden = false;
    modal.classList.add("is-open");
  }

  function openNoticeList() {
    const modal = ensureNoticeModal();
    setGilsysText("gilsysNoticeTitle", "お知らせ一覧");
    const body = document.getElementById("gilsysNoticeBody");
    if (body) {
      body.innerHTML = `<div class="gilsys-notice-list">${
        GILSYS_HOME_NOTICES.map((notice, index) => `
          <button type="button" class="gilsys-notice-title-row" data-notice-index="${index}">
            <span>${escapeHtml(notice.title)}</span>
          </button>
        `).join("")
      }</div>`;
    }
    modal.hidden = false;
    modal.classList.add("is-open");
  }

  function openLatestNotice() {
    openNoticeDetail(0);
  }

  function ensureNoticeButton() {
    const layout = document.getElementById("phase0HomeLayout");
    if (!layout || document.getElementById("gilsysHomeNoticeBtn")) return;
    const btn = document.createElement("button");
    btn.id = "gilsysHomeNoticeBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "お知らせ");
    btn.addEventListener("click", openNoticeList);
    layout.appendChild(btn);
  }

  function updateHomeNoticeCard() {
    const card = document.querySelector("#gilsysHomeLeftHud .gilsys-home-event-card");
    if (!card) return;
    const notice = GILSYS_HOME_NOTICES[0];
    card.classList.add("gilsys-home-notice-card");
    card.innerHTML = `
      <h3>お知らせ</h3>
      <p id="gilsysLatestNoticeTitle">${notice.title}</p>
      <button type="button" class="gilsys-home-event-btn">内容を見る</button>
    `;
    card.onclick = event => {
      if (event.target instanceof Element && event.target.closest("button, p, h3, section")) {
        openLatestNotice();
      }
    };
  }

  function ensureSocialHomeLayout() {
    const layout = document.getElementById("phase0HomeLayout");
    if (!layout) return;

    if (!document.getElementById("gilsysHomeTopHud")) {
      const top = document.createElement("div");
      top.id = "gilsysHomeTopHud";
      top.innerHTML = `
        <div class="gilsys-home-currency" aria-label="ガチャ石"><span>◇</span><b id="gilsysHomeGemCount">0</b></div>
        <button type="button" class="gilsys-home-hud-btn" disabled aria-label="メニュー">☰<span>メニュー</span></button>
        <button type="button" class="gilsys-home-hud-btn" disabled aria-label="プレゼント">□<span>プレゼント</span></button>
      `;
      layout.appendChild(top);
    }
    ensureNoticeButton();

    const hero = document.getElementById("phase0Hero");
    if (hero && !document.getElementById("gilsysHomeCharacterLabel")) {
      const label = document.createElement("div");
      label.id = "gilsysHomeCharacterLabel";
      label.innerHTML = `
        <button type="button" class="gilsys-home-character-arrow" data-home-character-step="-1" aria-label="前の職業">‹</button>
        <div id="gilsysHomeCharacterLabelName">-</div>
        <button type="button" class="gilsys-home-character-arrow" data-home-character-step="1" aria-label="次の職業">›</button>
      `;
      hero.appendChild(label);
      label.addEventListener("click", event => {
        const btn = event.target.closest?.(".gilsys-home-character-arrow");
        if (!btn) return;
        shiftHomeCharacter(Number(btn.dataset.homeCharacterStep || 0));
      });
    }

    let left = document.getElementById("gilsysHomeLeftHud");
    if (!left) {
      left = document.createElement("aside");
      left.id = "gilsysHomeLeftHud";
      left.innerHTML = `
        <section class="gilsys-home-user-card">
          <div class="gilsys-home-avatar" id="gilsysHomeAvatar" aria-hidden="true"></div>
          <div class="gilsys-home-user-text">
            <span id="gilsysHomeUserTitle">見習い</span>
            <b id="gilsysHomeUserName">-</b>
          </div>
        </section>
        <section class="gilsys-home-event-card">
          <h3>お知らせ</h3>
          <p>ver5.12.15アップデート内容</p>
          <button type="button" class="gilsys-home-event-btn">内容を見る</button>
        </section>
        <section id="gilsysHomeRankingSlot" aria-label="ランキング"></section>
      `;
      layout.appendChild(left);
    }

    const userCard = document.querySelector("#gilsysHomeLeftHud .gilsys-home-user-card");
    const avatar = userCard?.querySelector(".gilsys-home-avatar");
    if (avatar && !avatar.id) avatar.id = "gilsysHomeAvatar";
    const titleLabel = userCard?.querySelector(".gilsys-home-user-text span");
    if (titleLabel && !titleLabel.id) titleLabel.id = "gilsysHomeUserTitle";
    const nameButton = document.getElementById("btnChangeName");
    if (userCard && nameButton && nameButton.parentElement !== userCard) {
      userCard.appendChild(nameButton);
    }
    updateHomeNoticeCard();

    const ranking = document.getElementById("titleRankingPanel");
    const rankingSlot = document.getElementById("gilsysHomeRankingSlot");
    if (ranking && rankingSlot && ranking.parentElement !== rankingSlot) {
      rankingSlot.appendChild(ranking);
    }

    let actionDock = document.getElementById("gilsysHomeActionDock");
    if (!actionDock) {
      actionDock = document.createElement("div");
      actionDock.id = "gilsysHomeActionDock";
      actionDock.setAttribute("aria-hidden", "true");
      actionDock.innerHTML = `
        <section id="gilsysHomeBattlePanel" class="gilsys-home-drawer" hidden>
          <div class="gilsys-home-drawer-head"><h2>対戦</h2><span>遊ぶモードを選択</span></div>
          <div id="gilsysHomeBattleBody"></div>
        </section>
        <section id="gilsysHomeGrowthPanel" class="gilsys-home-drawer" hidden>
          <div class="gilsys-home-drawer-head"><h2>育成</h2><span>強化コンテンツ</span></div>
          <div id="gilsysHomeGrowthActions"></div>
        </section>
      `;
      layout.appendChild(actionDock);
    }

    const battleBody = document.getElementById("gilsysHomeBattleBody");
    const modePanel = document.getElementById("titleModePanel");
    if (modePanel && battleBody && modePanel.parentElement !== battleBody) {
      battleBody.appendChild(modePanel);
    }

    const growthActions = document.getElementById("gilsysHomeGrowthActions");
    const dojoBtn = document.getElementById("btnDojo");
    if (dojoBtn && modePanel && dojoBtn.parentElement !== modePanel) {
      modePanel.appendChild(dojoBtn);
    }
    if (growthActions && !growthActions.querySelector(".gilsys-growth-placeholder")) {
      const train = makeDisabledPanelButton("＋", "キャラ強化");
      const equip = makeDisabledPanelButton("◆", "装備強化");
      train.classList.add("gilsys-growth-placeholder");
      growthActions.appendChild(train);
      growthActions.appendChild(equip);
    }

    if (modePanel) {
      [...modePanel.querySelectorAll(".phase0-menu-btn")].forEach(btn => {
        const keep = ["btnRandom", "btnRoom", "btnCPU", "btnDojo", "btnTutorial"].includes(btn.id);
        btn.classList.toggle("gilsys-home-legacy-hidden", !keep);
      });
    }

    if (!document.getElementById("gilsysHomeBottomNav")) {
      const nav = document.createElement("nav");
      nav.id = "gilsysHomeBottomNav";
      nav.setAttribute("aria-label", "ホームメニュー");
      nav.appendChild(makeButton("home", "⌂", "ホーム"));
      nav.appendChild(makeButton("battle", "⚔", "対戦"));
      nav.appendChild(makeButton("growth", "↑", "育成"));
      nav.appendChild(makeButton("gacha", "◇", "ガチャ", true));
      nav.appendChild(makeButton("shop", "▣", "ショップ", true));
      layout.appendChild(nav);
      nav.addEventListener("click", event => {
        const btn = event.target.closest?.(".gilsys-home-nav-btn");
        if (!btn || btn.disabled) return;
        const tab = btn.dataset.homeTab || "home";
        const dockOpen = document.getElementById("gilsysHomeActionDock")?.classList.contains("is-open");
        const closeActiveMenu = dockOpen && btn.classList.contains("is-active") && (tab === "battle" || tab === "growth");
        setHomeTab(closeActiveMenu ? "home" : tab);
      });
    }

    const titleName = document.getElementById("titleAccountName");
    if (titleName && !titleName.dataset.gilsysHomeObserved) {
      new MutationObserver(syncHomeUserName).observe(titleName, { childList: true, characterData: true, subtree: true });
      titleName.dataset.gilsysHomeObserved = "1";
    }
    syncHomeUserName();
    syncAccountProfileUI();
    applyHomeCharacter(Number.isInteger(window.gilsysHomeJobIndex) ? window.gilsysHomeJobIndex : getHomeJobIndex());
    bindHomeCharacterSwipe();
    bindHomeMenuDismiss(layout);
    setHomeTab(document.querySelector("#gilsysHomeBottomNav .is-active")?.dataset.homeTab || "home");
  }

  window.gilsysEnsureSocialHomeLayout = ensureSocialHomeLayout;
  window.gilsysSetHomeTab = setHomeTab;
  document.addEventListener("DOMContentLoaded", ensureSocialHomeLayout);
  if (document.readyState !== "loading") ensureSocialHomeLayout();
  requestAnimationFrame(ensureSocialHomeLayout);
})();
