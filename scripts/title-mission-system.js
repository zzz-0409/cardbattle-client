(() => {
  const missionRanks = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const warriorDojoFrameId = "warrior_dojo_master";
  const warriorDojoFrameMissionKey = "icon-frame:warrior-dojo-master";

  function safeHtml(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value ?? "").replace(/[&<>"']/g, ch => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    }[ch]));
  }

  function getJobRank(job) {
    const rec = window.jobRecord?.[job.name] ?? {};
    return getRankByWins(Number(rec.wins ?? 0));
  }

  function getVisibleTitleMissions() {
    const claimed = new Set(getClaimedMissionTitleKeys());
    const jobs = getProfileJobs();
    return jobs.map(job => {
      const rank = missionRanks.find(r => !claimed.has(makeMissionTitleKey(job.id, r)) && (r === 2 || claimed.has(makeMissionTitleKey(job.id, r - 1))));
      if (!rank) return null;
      const currentRank = getJobRank(job);
      const ready = currentRank >= rank;
      const rewardText = getMissionTitleText(job.id, rank);
      return {
        type: "title",
        key: makeMissionTitleKey(job.id, rank),
        order: 100 + Number(job.id) * 10 + rank,
        ready,
        rewardTag: "称号",
        rewardText,
        objective: `${job.name}のランクを${rank}にする`,
        progress: `現在 R${currentRank} / 必要 R${rank}`,
      };
    }).filter(Boolean);
  }

  function getWarriorDojoFrameMission() {
    if (getClaimedIconFrameIds().includes(warriorDojoFrameId)) return null;
    const warrior = getProfileJobs().find(job => job.name === "戦士") || getProfileJobs()[0] || null;
    const progress = window.dojoProgress?.[warrior?.name || "戦士"] || window.dojoProgress?.["戦士"] || {};
    const highest = Math.max(0, Number(progress.highestStage ?? 0) || 0);
    const cleared = Boolean(progress.cleared) || Number(progress.clearCount ?? 0) > 0 || highest >= 30;
    return {
      type: "frame",
      key: warriorDojoFrameMissionKey,
      order: 10,
      ready: cleared,
      rewardTag: "フレーム",
      rewardText: "戦士の達人フレーム",
      objective: "戦士で達人への道30層を制覇する",
      progress: `最高 ${Math.min(30, cleared ? 30 : highest)} / 30層`,
    };
  }

  function getVisibleMissions() {
    return [getWarriorDojoFrameMission(), ...getVisibleTitleMissions()]
      .filter(Boolean)
      .sort((a, b) => Number(b.ready) - Number(a.ready) || a.order - b.order);
  }

  function hasReadyMission() {
    return getVisibleMissions().some(m => m.ready);
  }

  function refreshMissionButtonBadge() {
    const btn = document.getElementById("gilsysHomeMissionBtn");
    if (btn) btn.classList.toggle("has-ready", hasReadyMission());
  }

  function claimTitleMission(key) {
    const mission = getVisibleTitleMissions().find(m => m.key === key && m.ready);
    if (!mission) return;
    const claimed = getClaimedMissionTitleKeys();
    setClaimedMissionTitleKeys([...claimed, key]);
    localStorage.setItem(LS_PROFILE_TITLE_JOB_ID, key);
    syncAccountProfileUI();
    renderMissionList();
    refreshMissionButtonBadge();
    window.showCenterToast?.(`${mission.rewardText} を獲得しました`, 2200);
  }

  function claimFrameMission(key) {
    const mission = getWarriorDojoFrameMission();
    if (!mission || mission.key !== key || !mission.ready) return;
    if (unlockProfileIconFrame(warriorDojoFrameId)) {
      localStorage.setItem(LS_PROFILE_FRAME_ID, warriorDojoFrameId);
    }
    syncAccountProfileUI();
    renderMissionList();
    refreshMissionButtonBadge();
    window.showCenterToast?.(`${mission.rewardText} を獲得しました`, 2200);
  }

  function ensureMissionModal() {
    let modal = document.getElementById("gilsysMissionModal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "gilsysMissionModal";
    modal.className = "gilsys-mission-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="gilsys-mission-panel" role="dialog" aria-modal="true" aria-labelledby="gilsysMissionTitle">
        <div class="gilsys-mission-head">
          <h2 id="gilsysMissionTitle">ミッション</h2>
          <button type="button" class="gilsys-mission-close" aria-label="閉じる"></button>
        </div>
        <div id="gilsysMissionList" class="gilsys-mission-list"></div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.addEventListener("click", event => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target === modal || target.closest(".gilsys-mission-close")) closeMissionList();
      const titleBtn = target.closest("[data-claim-title-mission]");
      if (titleBtn) claimTitleMission(titleBtn.getAttribute("data-claim-title-mission"));
      const frameBtn = target.closest("[data-claim-frame-mission]");
      if (frameBtn) claimFrameMission(frameBtn.getAttribute("data-claim-frame-mission"));
    });
    return modal;
  }

  function renderMissionList() {
    const list = document.getElementById("gilsysMissionList");
    if (!list) return;
    const missions = getVisibleMissions();
    list.innerHTML = missions.length ? missions.map(m => `
      <article class="gilsys-mission-card ${m.ready ? "is-ready" : ""}">
        <div class="gilsys-mission-card-main">
          <b><span class="gilsys-mission-reward-tag">${safeHtml(m.rewardTag)}</span>${safeHtml(m.rewardText)}</b>
          <span>${safeHtml(m.objective)}</span>
          <em>${safeHtml(m.progress)}</em>
        </div>
        ${m.ready
          ? `<button type="button" ${m.type === "frame" ? `data-claim-frame-mission="${safeHtml(m.key)}"` : `data-claim-title-mission="${safeHtml(m.key)}"`}>受け取り</button>`
          : `<button type="button" disabled>未達成</button>`}
      </article>
    `).join("") : `<div class="gilsys-mission-empty">表示できるミッションはありません</div>`;
  }

  function openMissionList() {
    const modal = ensureMissionModal();
    renderMissionList();
    modal.hidden = false;
    modal.classList.add("is-open");
  }

  function closeMissionList() {
    const modal = document.getElementById("gilsysMissionModal");
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.hidden = true;
  }

  function ensureMissionButton() {
    const layout = document.getElementById("phase0HomeLayout");
    if (!layout || document.getElementById("gilsysHomeMissionBtn")) return;
    const btn = document.createElement("button");
    btn.id = "gilsysHomeMissionBtn";
    btn.type = "button";
    btn.setAttribute("aria-label", "ミッション");
    btn.addEventListener("click", openMissionList);
    layout.appendChild(btn);
    refreshMissionButtonBadge();
  }

  window.gilsysRefreshMissionButton = refreshMissionButtonBadge;
  window.gilsysOpenMissionList = openMissionList;
  document.addEventListener("DOMContentLoaded", () => {
    ensureMissionButton();
    refreshMissionButtonBadge();
  });
  requestAnimationFrame(() => {
    ensureMissionButton();
    refreshMissionButtonBadge();
  });
  window.addEventListener("load", () => {
    ensureMissionButton();
    refreshMissionButtonBadge();
    setTimeout(refreshMissionButtonBadge, 900);
    setTimeout(refreshMissionButtonBadge, 2400);
  });
  setTimeout(() => {
    ensureMissionButton();
    refreshMissionButtonBadge();
  }, 300);
  setInterval(refreshMissionButtonBadge, 5000);
})();
