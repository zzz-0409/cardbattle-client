(() => {
  window.__gilsysFloatingTooltipFinalActive = true;

  const slotSelector = "#phase2.gilsys-battle-ui .equip-slot, #phase2.gilsys-battle-ui .special-equip-slot, #phase2.gilsys-battle-ui .buff-slot";
  const tooltipSelector = ".equip-tooltip, .buff-tooltip";
  let activeSlot = null;

  const touchLike = () =>
    window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ||
    Number(navigator.maxTouchPoints || 0) > 0;

  const floating = () => {
    let el = document.getElementById("gilsysFloatingTooltip");
    if (!el) {
      el = document.createElement("div");
      el.id = "gilsysFloatingTooltip";
      document.body.appendChild(el);
    }
    return el;
  };

  const escapeText = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const tooltipHtml = (slot) => {
    const tip = slot?.querySelector?.(tooltipSelector);
    if (tip?.innerHTML?.trim()) return tip.innerHTML;
    if (slot?.dataset?.tooltipHtml) return slot.dataset.tooltipHtml;
    const title = slot?.getAttribute?.("title") || slot?.dataset?.tapTitle || "";
    return escapeText(title);
  };

  const place = (slot, el) => {
    const rect = slot.getBoundingClientRect();
    el.style.display = "block";
    el.style.setProperty("transform", "translate3d(-9999px, -9999px, 0)", "important");
    const tipRect = el.getBoundingClientRect();
    const gap = 8;
    const pad = 7;
    const maxLeft = Math.max(pad, window.innerWidth - tipRect.width - pad);
    const left = Math.min(maxLeft, Math.max(pad, rect.left + rect.width / 2 - tipRect.width / 2));
    let top = rect.top - tipRect.height - gap;
    if (top < pad) top = Math.min(window.innerHeight - tipRect.height - pad, rect.bottom + gap);
    top = Math.max(pad, top);
    el.style.setProperty("left", `${Math.round(left)}px`, "important");
    el.style.setProperty("top", `${Math.round(top)}px`, "important");
    el.style.setProperty("transform", "translate3d(0, 0, 0)", "important");
  };

  const show = (slot) => {
    const html = tooltipHtml(slot);
    if (!html) return;
    activeSlot = slot;
    const el = floating();
    el.innerHTML = html;
    requestAnimationFrame(() => {
      if (activeSlot === slot) place(slot, el);
    });
  };

  const hide = () => {
    activeSlot = null;
    const el = document.getElementById("gilsysFloatingTooltip");
    if (!el) return;
    el.style.display = "none";
    el.style.setProperty("transform", "translate3d(-9999px, -9999px, 0)", "important");
    el.innerHTML = "";
  };

  document.addEventListener("pointerover", (event) => {
    if (touchLike()) return;
    const slot = event.target.closest?.(slotSelector);
    if (slot && slot.contains(event.relatedTarget)) return;
    if (slot) show(slot);
  }, true);

  document.addEventListener("pointerout", (event) => {
    if (touchLike()) return;
    const slot = event.target.closest?.(slotSelector);
    if (slot && slot.contains(event.relatedTarget)) return;
    if (slot && slot === activeSlot) hide();
  }, true);

  document.addEventListener("focusin", (event) => {
    if (touchLike()) return;
    const slot = event.target.closest?.(slotSelector);
    if (slot) show(slot);
  }, true);

  document.addEventListener("focusout", (event) => {
    if (touchLike()) return;
    const slot = event.target.closest?.(slotSelector);
    if (slot && slot === activeSlot) hide();
  }, true);

  document.addEventListener("pointerdown", (event) => {
    if (!touchLike()) return;
    const slot = event.target.closest?.(slotSelector);
    const floatTip = event.target.closest?.("#gilsysFloatingTooltip");
    if (!slot) {
      if (!floatTip) hide();
      return;
    }
    const shouldOpen = slot.classList.contains("tooltip-open") || activeSlot !== slot;
    requestAnimationFrame(() => {
      if (shouldOpen) show(slot);
      else hide();
    });
  }, true);

  window.addEventListener("scroll", () => activeSlot ? place(activeSlot, floating()) : undefined, true);
  window.addEventListener("resize", () => activeSlot ? place(activeSlot, floating()) : undefined, true);
})();
