(() => {
  const slotSelector = [
    "#phase2.gilsys-battle-ui #battleStage .equip-slot",
    "#phase2.gilsys-battle-ui #battleStage .special-equip-slot",
    "#phase2.gilsys-battle-ui .buff-slot",
    "#phaseDojoWait .dojo-trail-buff-icon"
  ].join(",");
  const tooltipSelector = ".equip-tooltip, .buff-tooltip, .dojo-trail-buff-tooltip";
  let activeSlot = null;

  const touchLike = () =>
    window.matchMedia?.("(hover: none), (pointer: coarse)")?.matches ||
    Number(navigator.maxTouchPoints || 0) > 0;

  const coarsePointer = (event) =>
    event?.pointerType === "touch" ||
    event?.pointerType === "pen" ||
    (!event?.pointerType && touchLike());

  const escapeText = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const floating = () => {
    let el = document.getElementById("gilsysFloatingTooltip");
    if (!el) {
      el = document.createElement("div");
      el.id = "gilsysFloatingTooltip";
      document.body.appendChild(el);
    }
    return el;
  };

  const tooltipHtml = (slot) => {
    const tip = slot?.querySelector?.(tooltipSelector);
    if (tip?.innerHTML?.trim()) return tip.innerHTML;
    if (slot?.dataset?.tooltipHtml) return slot.dataset.tooltipHtml;
    const title = slot?.getAttribute?.("title") || slot?.dataset?.tapTitle || "";
    return escapeText(title);
  };

  const place = (slot, el) => {
    if (!slot || !el) return;
    const rect = slot.getBoundingClientRect();
    el.style.display = "block";
    el.style.setProperty("transform", "translate3d(-9999px, -9999px, 0)", "important");
    const tipRect = el.getBoundingClientRect();
    const gap = 8;
    const pad = 8;
    const left = Math.min(
      Math.max(pad, window.innerWidth - tipRect.width - pad),
      Math.max(pad, rect.left + rect.width / 2 - tipRect.width / 2)
    );
    let top = rect.top - tipRect.height - gap;
    if (top < pad) top = rect.bottom + gap;
    top = Math.min(Math.max(pad, top), Math.max(pad, window.innerHeight - tipRect.height - pad));
    el.style.setProperty("left", `${Math.round(left)}px`, "important");
    el.style.setProperty("top", `${Math.round(top)}px`, "important");
    el.style.setProperty("transform", "translate3d(0, 0, 0)", "important");
  };

  const show = (slot) => {
    const html = tooltipHtml(slot);
    if (!html) return false;
    activeSlot = slot;
    const el = floating();
    el.innerHTML = html;
    requestAnimationFrame(() => {
      if (activeSlot === slot) place(slot, el);
    });
    return true;
  };

  const hide = () => {
    activeSlot = null;
    const el = document.getElementById("gilsysFloatingTooltip");
    if (!el) return;
    el.style.display = "none";
    el.style.setProperty("transform", "translate3d(-9999px, -9999px, 0)", "important");
    el.innerHTML = "";
  };

  const slotFromEvent = (event) => event.target?.closest?.(slotSelector);

  document.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch") return;
    const slot = slotFromEvent(event);
    if (!slot || slot.contains(event.relatedTarget)) return;
    show(slot);
  }, true);

  document.addEventListener("pointerout", (event) => {
    if (event.pointerType === "touch") return;
    const slot = slotFromEvent(event);
    if (!slot || slot.contains(event.relatedTarget)) return;
    if (slot === activeSlot) hide();
  }, true);

  document.addEventListener("pointerdown", (event) => {
    const slot = slotFromEvent(event);
    const floatTip = event.target?.closest?.("#gilsysFloatingTooltip");
    if (!slot) {
      if (!floatTip) hide();
      return;
    }
    if (!tooltipHtml(slot)) return;
    if (coarsePointer(event)) {
      const allowScrollGesture = slot.classList?.contains("dojo-trail-buff-icon");
      const shouldOpen = activeSlot !== slot;
      requestAnimationFrame(() => shouldOpen ? show(slot) : hide());
      if (!allowScrollGesture) {
        event.preventDefault();
        event.stopPropagation();
      }
    } else {
      show(slot);
    }
  }, true);

  document.addEventListener("click", (event) => {
    const slot = slotFromEvent(event);
    if (slot && tooltipHtml(slot)) {
      show(slot);
      if (touchLike() && !slot.classList?.contains("dojo-trail-buff-icon")) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    if (!event.target?.closest?.("#gilsysFloatingTooltip")) hide();
  }, true);

  window.addEventListener("scroll", () => activeSlot ? place(activeSlot, floating()) : undefined, true);
  window.addEventListener("resize", () => activeSlot ? place(activeSlot, floating()) : undefined, true);
})();
