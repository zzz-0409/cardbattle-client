(() => {
  const GAME_W = 1280;
  const GAME_H = 720;

  function viewportSize() {
    const vv = window.visualViewport;
    return {
      width: Math.max(1, vv?.width || window.innerWidth || document.documentElement.clientWidth || GAME_W),
      height: Math.max(1, vv?.height || window.innerHeight || document.documentElement.clientHeight || GAME_H)
    };
  }

  function applyFixedGameViewport() {
    const root = document.documentElement;
    const wrap = document.getElementById("game-wrapper");
    if (!wrap) return;

    root.classList.add("gilsys-fixed-game");
    root.style.setProperty("--gilsys-game-width", `${GAME_W}px`);
    root.style.setProperty("--gilsys-game-height", `${GAME_H}px`);

    const { width, height } = viewportSize();
    const scale = Math.min(width / GAME_W, height / GAME_H);
    const left = Math.max(0, (width - GAME_W * scale) / 2);
    const top = Math.max(0, (height - GAME_H * scale) / 2);

    root.style.setProperty("--gilsys-game-scale", String(scale));
    root.style.setProperty("--gilsys-game-left", `${left}px`);
    root.style.setProperty("--gilsys-game-top", `${top}px`);
    wrap.style.width = `${GAME_W}px`;
    wrap.style.height = `${GAME_H}px`;

    window.gilsysFitControlText?.(true);
  }

  window.gilsysApplyFixedGameViewport = applyFixedGameViewport;
  window.addEventListener("resize", applyFixedGameViewport, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(applyFixedGameViewport, 80), { passive: true });
  window.visualViewport?.addEventListener("resize", applyFixedGameViewport, { passive: true });
  document.addEventListener("DOMContentLoaded", applyFixedGameViewport);
  requestAnimationFrame(applyFixedGameViewport);
})();
