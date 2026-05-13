(() => {
  const TARGET_SELECTOR = [
    "button",
    "button *",
    ".phase0-menu-text",
    ".phase0-menu-note",
    ".phase0-menu-btn",
    ".phase0-menu-btn *",
    ".gilsys-action-btn",
    ".gilsys-action-btn *",
    ".gilsys-confirm-btn",
    ".gilsys-confirm-btn *",
    ".gilsys-mini-btn",
    ".gilsys-mini-btn *",
    ".shop-buy-area button",
    ".shop-buy-area button *",
    ".gilsys-detail-inventory-tools button",
    ".gilsys-detail-inventory-tools button *",
    ".gilsys-panel-subtools button",
    ".gilsys-panel-subtools button *",
    ".gilsys-list-row > span:not(.gilsys-row-icon)",
    ".gilsys-list-row > b",
    ".gilsys-panel-title",
    ".gilsys-status-name",
    ".gilsys-status-rank",
    ".gilsys-category-name",
    ".gilsys-category-desc",
    ".job-card-name-top",
    ".job-card-name-bottom",
    ".gilsys-job-class-name",
    ".gilsys-job-passive-name",
    ".dojo-path-label",
    ".dojo-result-reward-label",
    ".dojo-trail-legend",
    ".dojo-trail-cost",
    ".dojo-trail-count",
    ".dojo-trail-node"
  ].join(",");

  const ALLOW_SCROLL_SELECTOR = [
    ".gilsys-detail-body",
    ".gilsys-detail-text",
    ".shop-item-desc",
    ".dojo-shop-detail-card",
    ".dojo-trail-detail",
    ".dojo-trail-effect-box",
    ".gilsys-job-detail-text",
    ".gilsys-job-passive-tooltip",
    ".log-box",
    "#battleBox",
    "textarea"
  ].join(",");

  function isVisible(el) {
    if (!el || !el.isConnected) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 2 && rect.height > 2;
  }

  function restoreFont(el, reset) {
    if (!Object.prototype.hasOwnProperty.call(el.dataset, "fitInlineFontSize")) {
      el.dataset.fitInlineFontSize = el.style.fontSize || "";
    }
    if (reset) el.style.fontSize = el.dataset.fitInlineFontSize;
  }

  function fitElement(el, reset) {
    if (!(el instanceof HTMLElement)) return;
    if (el.closest(ALLOW_SCROLL_SELECTOR)) return;
    if (!isVisible(el)) return;

    restoreFont(el, reset);
    const base = parseFloat(getComputedStyle(el).fontSize);
    if (!Number.isFinite(base) || base <= 0) return;

    let size = base;
    const compactScreen = window.matchMedia?.("(max-width: 760px), (max-height: 520px)")?.matches;
    const isButtonLike = el.matches("button, button *, .phase0-menu-btn, .phase0-menu-btn *, .phase0-menu-text, .phase0-menu-note, .gilsys-action-btn, .gilsys-action-btn *, .gilsys-confirm-btn, .gilsys-confirm-btn *, .gilsys-category-card, .gilsys-category-card *");
    const minSize = compactScreen ? (isButtonLike ? 5.5 : 6.5) : (isButtonLike ? 7 : 8);
    let guard = 0;
    while (
      guard < 28 &&
      size > minSize &&
      (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
    ) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
      guard += 1;
    }
  }

  let queued = false;
  let needsReset = false;
  function fitControls(reset = false) {
    needsReset = needsReset || reset;
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      const resetNow = needsReset;
      needsReset = false;
      document.querySelectorAll(TARGET_SELECTOR).forEach(el => fitElement(el, resetNow));
    });
  }

  window.gilsysFitControlText = fitControls;
  window.addEventListener("load", () => fitControls(true));
  window.addEventListener("resize", () => fitControls(true));
  document.addEventListener("DOMContentLoaded", () => fitControls(true));

  new MutationObserver(() => fitControls(false)).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style", "disabled"]
  });
})();
