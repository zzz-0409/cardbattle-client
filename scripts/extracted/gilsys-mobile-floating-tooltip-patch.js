(() => {
  const touchLike = () =>
    window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ||
    Number(navigator.maxTouchPoints || 0) > 0;

  const slotSelector = "#phase2.gilsys-battle-ui .equip-slot, #phase2.gilsys-battle-ui .special-equip-slot, #phase2.gilsys-battle-ui .buff-slot";
  const tooltipSelector = ".equip-tooltip, .buff-tooltip";

  const floating = () => {
    let el = document.getElementById("gilsysFloatingTooltip");
    if (!el) {
      el = document.createElement("div");
      el.id = "gilsysFloatingTooltip";
      document.body.appendChild(el);
    }
    return el;
  };

  const hide = () => {
    const el = document.getElementById("gilsysFloatingTooltip");
    if (el) {
      el.style.display = "none";
      el.innerHTML = "";
    }
  };

  const normalizeTooltipHtml = (slot) => {
    const tip = slot?.querySelector?.(tooltipSelector);
    if (tip) return tip.innerHTML;
    if (slot?.dataset?.tooltipHtml) return slot.dataset.tooltipHtml;
    const title = slot?.getAttribute?.("title") || slot?.dataset?.tapTitle || "";
    return String(title)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  document.addEventListener("pointerdown", (event) => {
    if (!touchLike()) return;
    const slot = event.target.closest?.(slotSelector);
    if (!slot) {
      hide();
      return;
    }
    const html = normalizeTooltipHtml(slot);
    if (!html) return;
    const willOpen = !slot.classList.contains("tooltip-open");
    requestAnimationFrame(() => {
      if (!willOpen) {
        hide();
        return;
      }
      const el = floating();
      el.innerHTML = html;
      el.style.display = "block";
    });
  }, true);

  document.addEventListener("click", (event) => {
    if (!touchLike()) return;
    const floatTip = event.target.closest?.("#gilsysFloatingTooltip");
    const slot = event.target.closest?.(slotSelector);
    if (!floatTip && !slot) hide();
  }, true);

  window.addEventListener("scroll", () => touchLike() && hide(), true);
window.addEventListener("resize", () => touchLike() && hide(), true);
})();
