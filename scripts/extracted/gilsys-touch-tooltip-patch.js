(() => {
  window.__gilsysTouchTooltipPatchActive = true;

  const touchLike = () =>
    window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ||
    Number(navigator.maxTouchPoints || 0) > 0;

  const coarsePointer = (event) =>
    event?.pointerType === "touch" ||
    event?.pointerType === "pen" ||
    (!event?.pointerType && touchLike());

  const slotSelector = "#phase2.gilsys-battle-ui .equip-slot, #phase2.gilsys-battle-ui .special-equip-slot, #phase2.gilsys-battle-ui .buff-slot";
  const tooltipSelector = ".equip-tooltip, .buff-tooltip";

  const closeAll = (except = null) => {
    document.querySelectorAll("#phase2.gilsys-battle-ui .tooltip-open").forEach(el => {
      if (except && (el === except || el.contains(except) || except.contains(el))) return;
      el.classList.remove("tooltip-open");
    });
  };

  const escapeText = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const ensureTooltip = (slot) => {
    if (!slot || slot.querySelector(tooltipSelector)) return !!slot?.querySelector(tooltipSelector);
    const title = slot.getAttribute("title");
    if (!title) return false;
    slot.dataset.tapTitle = title;
    slot.removeAttribute("title");
    const tip = document.createElement("div");
    tip.className = slot.classList.contains("buff-slot") ? "buff-tooltip" : "equip-tooltip";
    tip.innerHTML = escapeText(title);
    slot.appendChild(tip);
    return true;
  };

  document.addEventListener("pointerdown", (event) => {
    if (!touchLike()) return;
    const target = event.target;
    const slot = target.closest?.(slotSelector);
    if (!slot) {
      closeAll();
      return;
    }
    if (!ensureTooltip(slot)) return;
    if (target.closest?.(tooltipSelector) && slot.classList.contains("tooltip-open")) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const willOpen = !slot.classList.contains("tooltip-open");
    closeAll(slot);
    slot.classList.toggle("tooltip-open", willOpen);
    event.preventDefault();
    event.stopPropagation();
  }, true);

  document.addEventListener("click", (event) => {
    if (!touchLike()) return;
    const slot = event.target.closest?.(slotSelector);
    if (slot?.classList.contains("tooltip-open")) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  window.addEventListener("scroll", () => touchLike() && closeAll(), true);
  window.addEventListener("resize", () => touchLike() && closeAll(), true);
})();
