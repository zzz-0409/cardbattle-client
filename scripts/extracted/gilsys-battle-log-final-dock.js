(() => {
  function ensureBattleLogDock() {
    const phase = document.getElementById("phase2");
    const panel = phase?.querySelector(".gilsys-command-panel");
    const actionArea = document.getElementById("action-area");
    const logBlock = phase?.querySelector(".gilsys-log-block");
    if (!phase || !panel || !logBlock) return;
    logBlock.classList.add("gilsys-log-docked");
    panel.classList.add("has-battle-log-dock");
    if (logBlock.parentElement !== panel) {
      panel.insertBefore(logBlock, actionArea || panel.firstChild);
    }
  }

  window.gilsysEnsureBattleLogDock = ensureBattleLogDock;
  const runSoon = () => requestAnimationFrame(ensureBattleLogDock);
  document.addEventListener("DOMContentLoaded", runSoon);
  window.addEventListener("load", runSoon);
  window.addEventListener("resize", runSoon, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(ensureBattleLogDock, 80), { passive: true });

  const originalSetPhase = window.setPhase;
  if (typeof originalSetPhase === "function" && !originalSetPhase.__gilsysBattleLogDockWrapped) {
    window.setPhase = function(...args) {
      const result = originalSetPhase.apply(this, args);
      runSoon();
      return result;
    };
    window.setPhase.__gilsysBattleLogDockWrapped = true;
  }
  runSoon();
})();
