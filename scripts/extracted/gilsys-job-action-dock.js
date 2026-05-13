(() => {
  function dockJobAction() {
    const phase = document.getElementById("phase1");
    const btn = document.getElementById("btnConnectPhase1");
    if (!phase || !btn) return;
    let dock = document.getElementById("gilsysJobActionDock");
    if (!dock) {
      dock = document.createElement("div");
      dock.id = "gilsysJobActionDock";
      phase.appendChild(dock);
    }
    const roomArea = document.getElementById("roomCodeArea");
    if (roomArea && roomArea.parentElement !== dock) dock.appendChild(roomArea);
    if (btn.parentElement !== dock) dock.appendChild(btn);
    const status = document.getElementById("connectStatus");
    if (status && status.parentElement !== dock) dock.appendChild(status);
    window.gilsysFitControlText?.(true);
  }

  window.gilsysDockJobAction = dockJobAction;
  document.addEventListener("DOMContentLoaded", dockJobAction);
  requestAnimationFrame(dockJobAction);
})();
