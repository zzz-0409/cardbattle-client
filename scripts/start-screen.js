(() => {
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

  function bindStartScreen() {
    const screen = document.getElementById("gilsysStartScreen");
    const button = document.getElementById("gilsysStartButton");
    if (!screen) return;
    button?.addEventListener("click", enterHome);
    screen.addEventListener("click", (event) => {
      event.preventDefault();
      enterHome();
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") enterHome();
    });
  }

  document.addEventListener("DOMContentLoaded", bindStartScreen);
  if (document.readyState !== "loading") bindStartScreen();
})();
