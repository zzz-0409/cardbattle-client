(() => {
  const NEED_FALLBACK = 15;
  const safe = (value) => typeof escapeHtml === "function"
    ? escapeHtml(String(value ?? ""))
    : String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#39;");
  const isDollJob = () => String(window.myJob ?? (typeof myJob !== "undefined" ? myJob : "")) === "人形使い" || String(window.myJob ?? "") === "9";
  const isMageStatus = (status) => status && status.mana != null && status.mana_max != null && Number.isFinite(Number(status.mana)) && Number.isFinite(Number(status.mana_max));
  const getSelfDoll = () => window.gilsysLatestSelfStatus?.doll ?? null;
  const chargeNeed = (doll) => Math.max(1, Number(doll?.charge_need ?? NEED_FALLBACK));

  function updateDollDurabilityMeter(doll, side = "self") {
    const isEnemy = side === "enemy";
    const anchor = document.querySelector(isEnemy ? "#gilsysEnemyHpFill" : "#gilsysSelfHpFill")?.closest(".gilsys-bar")
      ?? document.getElementById(isEnemy ? "gilsysBuffStripEnemy" : "gilsysBuffStripSelf");
    const meterId = isEnemy ? "gilsysEnemyDollDurabilityMeter" : "gilsysDollDurabilityMeter";
    let meter = document.getElementById(meterId);
    if (!anchor || (!isEnemy && !isDollJob()) || !doll) {
      if (meter) meter.remove();
      return;
    }
    if (!meter) {
      meter = document.createElement("div");
      meter.id = meterId;
    }
    meter.className = `gilsys-doll-durability-meter ${isEnemy ? "is-enemy" : "is-self"} ${doll?.is_broken ? "is-broken" : ""}`;
    if (meter.previousElementSibling !== anchor) anchor.insertAdjacentElement("afterend", meter);
    const durability = Math.max(0, Number(doll?.durability ?? 0));
    const maxDurability = Math.max(1, Number(doll?.max_durability ?? doll?.durability ?? 1));
    const rate = Math.max(0, Math.min(100, durability / maxDurability * 100));
    meter.innerHTML = `
      <div class="gilsys-doll-durability-head"><span>人形耐久</span><span>${safe(durability)} / ${safe(maxDurability)}${doll?.is_broken ? " 破壊" : ""}</span></div>
      <div class="gilsys-doll-durability-bar"><div class="gilsys-doll-durability-fill" style="width:${rate}%"></div></div>
    `;
  }

  function updateDollChargeMeter(doll, side = "self") {
    const isEnemy = side === "enemy";
    const durabilityMeter = document.getElementById(isEnemy ? "gilsysEnemyDollDurabilityMeter" : "gilsysDollDurabilityMeter");
    const anchor = durabilityMeter
      ?? document.querySelector(isEnemy ? "#gilsysEnemyHpFill" : "#gilsysSelfHpFill")?.closest(".gilsys-bar")
      ?? document.getElementById(isEnemy ? "gilsysBuffStripEnemy" : "gilsysBuffStripSelf");
    if (!anchor) return;
    const meterId = isEnemy ? "gilsysEnemyDollChargeMeter" : "gilsysDollChargeMeter";
    let meter = document.getElementById(meterId);
    if ((!isEnemy && !isDollJob()) || !doll) {
      if (meter) meter.remove();
      return;
    }
    if (!meter) {
      meter = document.createElement("div");
      meter.id = meterId;
    }
    meter.className = `gilsys-doll-charge-meter ${isEnemy ? "is-enemy" : "is-self"}`;
    if (meter.previousElementSibling !== anchor) anchor.insertAdjacentElement("afterend", meter);
    const now = Math.max(0, Number(doll.charge ?? 0));
    const need = chargeNeed(doll);
    const rate = Math.max(0, Math.min(100, now / need * 100));
    const ready = now >= need || !!doll.pending_charge_ready;
    meter.classList.toggle("is-ready", ready);
    meter.innerHTML = `
      <div class="gilsys-doll-charge-head"><span>チャージ</span><span>${safe(now)} / ${safe(need)}</span></div>
      <div class="gilsys-doll-charge-bar"><div class="gilsys-doll-charge-fill" style="width:${rate}%"></div></div>
    `;
  }

  function updateMageManaMeter(status, side = "self") {
    const isEnemy = side === "enemy";
    const anchor = document.querySelector(isEnemy ? "#gilsysEnemyHpFill" : "#gilsysSelfHpFill")?.closest(".gilsys-bar")
      ?? document.getElementById(isEnemy ? "gilsysBuffStripEnemy" : "gilsysBuffStripSelf");
    const meterId = isEnemy ? "gilsysEnemyMageManaMeter" : "gilsysMageManaMeter";
    let meter = document.getElementById(meterId);
    if (!anchor || !isMageStatus(status)) {
      if (meter) meter.remove();
      return;
    }
    if (!meter) {
      meter = document.createElement("div");
      meter.id = meterId;
    }
    meter.className = `gilsys-mage-mana-meter ${isEnemy ? "is-enemy" : "is-self"}`;
    if (meter.previousElementSibling !== anchor) anchor.insertAdjacentElement("afterend", meter);
    const mana = Math.max(0, Number(status.mana ?? 0));
    const manaMax = Math.max(1, Number(status.mana_max ?? 1));
    const rate = Math.max(0, Math.min(100, mana / manaMax * 100));
    meter.innerHTML = `
      <div class="gilsys-mage-mana-head"><span>魔力</span><span>${safe(mana)} / ${safe(manaMax)}</span></div>
      <div class="gilsys-mage-mana-bar"><div class="gilsys-mage-mana-fill" style="width:${rate}%"></div></div>
    `;
  }

  function updateDollBuffButton() {
    const btn = document.getElementById("dollBuffBtn");
    if (!btn) return;
    const doll = getSelfDoll();
    const show = isDollJob() && !!doll;
    btn.style.display = show ? "" : "none";
    if (!show) return;
    const now = Math.max(0, Number(doll.charge ?? 0));
    const need = chargeNeed(doll);
    const ready = now >= need || !!doll.pending_charge_ready;
    const turnActive = typeof myTurn !== "undefined" ? !!myTurn : !!window.myTurn;
    btn.disabled = !turnActive || !ready;
    btn.classList.toggle("is-ready", ready);
    btn.title = ready ? "チャージ効果を選択" : `チャージ ${now} / ${need}`;
    btn.innerHTML = `<span>◆</span>バフ選択`;
  }

  window.refreshGilsysDollChargeUI = function(status = window.gilsysLatestSelfStatus) {
    updateDollDurabilityMeter(status?.doll ?? null, "self");
    updateDollDurabilityMeter(window.gilsysLatestEnemyStatus?.doll ?? null, "enemy");
    updateDollChargeMeter(status?.doll ?? null, "self");
    updateDollChargeMeter(window.gilsysLatestEnemyStatus?.doll ?? null, "enemy");
    updateMageManaMeter(status, "self");
    updateMageManaMeter(window.gilsysLatestEnemyStatus, "enemy");
    updateDollBuffButton();
    const doll = status?.doll ?? getSelfDoll();
    const now = Math.max(0, Number(doll?.charge ?? 0));
    const need = chargeNeed(doll);
    const list = document.getElementById("gilsysCommandList");
    if (list?.dataset?.manual === "dollBuff" && now < need && !doll?.pending_charge_ready) {
      if (typeof openAttackSkillPanel === "function") openAttackSkillPanel(false);
    }
  };

  window.openDollBuffSelectUI = function() {
    const doll = getSelfDoll();
    if (!isDollJob() || !doll) return showCenterToast("人形使い専用です", 1800);
    const now = Math.max(0, Number(doll.charge ?? 0));
    const need = chargeNeed(doll);
    const ready = now >= need || !!doll.pending_charge_ready;
    if (!ready) return showCenterToast(`チャージが足りません（${now} / ${need}）`, 1800);
    if (typeof setGilsysCommandDetail === "function") {
      setGilsysCommandDetail("バフ選択", `チャージ ${now} / ${need}`, "選択肢を取得しています。", "◆", null);
    }
    ws.send(JSON.stringify({ type: "request_doll_charge" }));
  };

  window.openGilsysDollBuffPanel = function(data) {
    const choices = Array.isArray(data?.choices) ? data.choices : [];
    const dollState = getSelfDoll();
    if (dollState) dollState.pending_charge_ready = true;
    const charge = Number(data?.charge ?? dollState?.charge ?? 0);
    const need = chargeNeed(dollState ?? getSelfDoll());
    const list = document.getElementById("gilsysCommandList");
    const title = document.getElementById("gilsysCommandListTitle");
    if (!list) return;
    const panel = document.querySelector(".gilsys-command-list-panel");
    if (panel) {
      panel.classList.remove("is-inventory-mode", "is-shop-mode");
    }
    if (title) title.textContent = "人形バフ選択";
    list.dataset.manual = "dollBuff";
    list.innerHTML = choices.length ? "" : `<div class="gilsys-empty-row">選択できるバフがありません</div>`;
    choices.forEach((choice, index) => {
      const row = document.createElement("button");
      row.className = `gilsys-list-row ${index === 0 ? "is-selected" : ""}`;
      row.innerHTML = `
        <span class="gilsys-row-icon">◆</span>
        <span class="gilsys-charge-choice-card">
          <b>${safe(choice.title ?? "チャージ効果")}</b>
        </span>`;
      const choose = () => {
        ws.send(JSON.stringify({ type: "select_doll_charge", key: choice.key }));
        const doll = getSelfDoll();
        if (doll) {
          doll.charge = Math.max(0, Number(doll.charge ?? 0) - chargeNeed(doll));
          doll.pending_charge_ready = false;
        }
        window.refreshGilsysDollChargeUI();
        if (typeof openAttackSkillPanel === "function") openAttackSkillPanel(false);
      };
      row.onclick = () => {
        [...list.querySelectorAll(".gilsys-list-row")].forEach(el => el.classList.remove("is-selected"));
        row.classList.add("is-selected");
        if (typeof setGilsysCommandDetail === "function") {
          setGilsysCommandDetail(choice.title ?? "バフ選択", `チャージ ${charge} / ${need}`, `${choice.desc ?? ""}`, "◆", choose);
        }
      };
      list.appendChild(row);
    });
    const first = list.querySelector(".gilsys-list-row");
    if (first) first.click();
  };

  const oldHud = window.updateGilsysBattleHud;
  if (typeof oldHud === "function") {
    window.updateGilsysBattleHud = function(data) {
      oldHud(data);
      if (data?.side === "self") window.refreshGilsysDollChargeUI(data);
      else window.refreshGilsysDollChargeUI(window.gilsysLatestSelfStatus);
    };
  }
  document.addEventListener("DOMContentLoaded", () => window.refreshGilsysDollChargeUI());
})();
