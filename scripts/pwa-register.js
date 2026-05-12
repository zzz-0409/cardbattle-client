(() => {
  if (location.protocol === "http:" || location.protocol === "https:") {
    window.addEventListener("load", () => {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("./service-worker.js").catch(() => {});
      }
    });
  }
})();
