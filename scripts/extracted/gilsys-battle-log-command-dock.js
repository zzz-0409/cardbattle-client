(() => {
  function dockBattleLog() {
    const phase = document.getElementById("phase2");
    const panel = phase?.querySelector(".gilsys-command-panel");
    const actionArea = document.getElementById("action-area");
    const logBlock = phase?.querySelector(".gilsys-log-block");
    if (!phase || !panel || !actionArea || !logBlock) return;

    logBlock.classList.add("gilsys-log-docked");
    panel.classList.add("has-battle-log-dock");
    if (logBlock.parentElement !== panel) {
      panel.insertBefore(logBlock, actionArea);
    }
    window.gilsysFitControlText?.(true);
  }

  window.gilsysDockBattleLog = dockBattleLog;
  document.addEventListener("DOMContentLoaded", dockBattleLog);
  requestAnimationFrame(dockBattleLog);
  window.addEventListener("load", dockBattleLog);
  window.addEventListener("resize", dockBattleLog);
  window.addEventListener("orientationchange", () => setTimeout(dockBattleLog, 80));
})();
