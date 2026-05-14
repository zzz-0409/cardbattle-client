(() => {
  const GAME_W = 1280;
  const GAME_H = 720;
  let touchStartX = 0;
  let touchStartY = 0;

  function viewportSize() {
    const vv = window.visualViewport;
    return {
      width: Math.max(1, vv?.width || window.innerWidth || document.documentElement.clientWidth || GAME_W),
      height: Math.max(1, vv?.height || window.innerHeight || document.documentElement.clientHeight || GAME_H),
      offsetLeft: Math.max(0, vv?.offsetLeft || window.scrollX || document.documentElement.scrollLeft || 0),
      offsetTop: Math.max(0, vv?.offsetTop || window.scrollY || document.documentElement.scrollTop || 0)
    };
  }

  function applyFixedGameViewport() {
    const root = document.documentElement;
    const wrap = document.getElementById("game-wrapper");
    if (!wrap) return;
    resetOuterScroll();

    root.classList.add("gilsys-fixed-game");
    root.style.setProperty("--gilsys-game-width", `${GAME_W}px`);
    root.style.setProperty("--gilsys-game-height", `${GAME_H}px`);
    wrap.style.width = `${GAME_W}px`;
    wrap.style.height = `${GAME_H}px`;

    const { width, height, offsetLeft, offsetTop } = viewportSize();
    const scale = Math.min(width / GAME_W, height / GAME_H);
    const left = offsetLeft + Math.max(0, (width - GAME_W * scale) / 2);
    const top = offsetTop + Math.max(0, (height - GAME_H * scale) / 2);

    root.style.setProperty("--gilsys-game-scale", String(scale));
    root.style.setProperty("--gilsys-game-left", `${left}px`);
    root.style.setProperty("--gilsys-game-top", `${top}px`);

    window.gilsysFitControlText?.(true);
  }

  function resetOuterScroll() {
    const root = document.documentElement;
    const body = document.body;
    const scrolling = document.scrollingElement;
    if (window.scrollX || window.scrollY) window.scrollTo(0, 0);
    if (root) {
      root.scrollLeft = 0;
      root.scrollTop = 0;
    }
    if (body) {
      body.scrollLeft = 0;
      body.scrollTop = 0;
    }
    if (scrolling) {
      scrolling.scrollLeft = 0;
      scrolling.scrollTop = 0;
    }
  }

  function lockOuterViewport() {
    resetOuterScroll();
    applyFixedGameViewport();
  }

  function isTitleOrJobTarget(target) {
    return Boolean(target?.closest?.("#phase0, #phase1.gilsys-job-select-ui"));
  }

  function allowsHorizontalScroll(target) {
    return Boolean(target?.closest?.("#jobSelectArea"));
  }

  function preventOuterHorizontalWheel(event) {
    if (!isTitleOrJobTarget(event.target) || allowsHorizontalScroll(event.target)) return;
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    resetOuterScroll();
  }

  function rememberTouchStart(event) {
    const touch = event.touches?.[0];
    if (!touch) return;
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }

  function preventOuterHorizontalTouch(event) {
    if (!isTitleOrJobTarget(event.target) || allowsHorizontalScroll(event.target)) return;
    const touch = event.touches?.[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) <= Math.abs(dy) || Math.abs(dx) < 8) return;
    event.preventDefault();
    resetOuterScroll();
  }

  window.gilsysApplyFixedGameViewport = applyFixedGameViewport;
  window.gilsysResetOuterScroll = resetOuterScroll;
  window.gilsysLockOuterViewport = lockOuterViewport;
  window.addEventListener("resize", applyFixedGameViewport, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(applyFixedGameViewport, 80), { passive: true });
  window.visualViewport?.addEventListener("resize", applyFixedGameViewport, { passive: true });
  window.visualViewport?.addEventListener("scroll", applyFixedGameViewport, { passive: true });
  window.addEventListener("scroll", resetOuterScroll, { passive: true });
  document.addEventListener("wheel", preventOuterHorizontalWheel, { passive: false });
  document.addEventListener("touchstart", rememberTouchStart, { passive: true });
  document.addEventListener("touchmove", preventOuterHorizontalTouch, { passive: false });
  document.addEventListener("DOMContentLoaded", applyFixedGameViewport);
  requestAnimationFrame(applyFixedGameViewport);
})();
