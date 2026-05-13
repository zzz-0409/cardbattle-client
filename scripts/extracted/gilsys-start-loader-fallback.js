(() => {
  function finishBootLoader() {
    document.body.classList.remove("gilsys-assets-loading");
    document.body.classList.add("gilsys-assets-ready");
    const loader = document.getElementById("gilsysBootLoader");
    if (!loader) return;
    loader.classList.add("is-hidden");
    setTimeout(() => loader.remove(), 420);
  }

  function enterHome() {
    const screen = document.getElementById("gilsysStartScreen");
    if (!screen || screen.classList.contains("is-hidden")) return;
    screen.classList.add("is-hidden");
    screen.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (screen.classList.contains("is-hidden")) screen.style.display = "none";
    }, 430);
    window.gilsysFitControlText?.(true);
  }

  function bindStartScreenFallback() {
    const screen = document.getElementById("gilsysStartScreen");
    if (!screen || screen.dataset.gilsysFallbackBound === "1") return;
    screen.dataset.gilsysFallbackBound = "1";
    screen.addEventListener("click", (event) => {
      event.preventDefault();
      enterHome();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") enterHome();
    });
  }

  function bootFallback() {
    bindStartScreenFallback();
    setTimeout(finishBootLoader, 9500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootFallback, { once: true });
  } else {
    bootFallback();
  }
  window.addEventListener("load", () => setTimeout(finishBootLoader, 9500), { once: true });
})();
