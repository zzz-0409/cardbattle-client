(() => {
  const TIMEOUT_MS = 8000;
  const IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|svg)(?:[?#][^"'()\s<>]*)?$/i;
  const REQUIRED_ASSETS = [
    "Assets/haikei/7cc56fd2-92f8-44c9-a2b9-b8e605d1affd.png",
    "Assets/home/gilsys-home-notice-button.png",
    "Assets/home/gilsys-home-mission-document.png",
    "Assets/dojo/enemies/slime.png",
    "Assets/dojo/enemies/goblin.png",
    "Assets/dojo/enemies/wolf.png",
    "Assets/dojo/enemies/golem.png",
    "Assets/dojo/enemies/ghost.png",
    "Assets/dojo/enemies/mushroom.png",
    "Assets/dojo/enemies/anubis.png",
    "Assets/dojo/enemies/athena.png",
    "Assets/dojo/enemies/kali.png",
    "Assets/dojo/enemies/susanoo.png",
    "Assets/dojo/enemies/thor.png",
    "Assets/dojo/enemies/zeus.png",
    "Assets/dojo/enemies/ashura.png"
  ];

  function normalizeAssetPath(raw) {
    if (!raw) return "";
    let value = String(raw).trim().replace(/^['"]|['"]$/g, "");
    value = value.replace(/&quot;/g, "").replace(/&amp;/g, "&");
    if (!value || value.startsWith("data:") || value.startsWith("blob:")) return "";
    if (/^https?:\/\//i.test(value)) return "";
    const assetIndex = value.indexOf("Assets/");
    if (assetIndex >= 0) value = value.slice(assetIndex);
    if (!value.startsWith("Assets/") && !value.startsWith("./Assets/")) return "";
    value = value.replace(/^\.\//, "");
    return IMAGE_EXT.test(value) ? value : "";
  }

  function collectImageAssets() {
    const found = new Set(REQUIRED_ASSETS);
    if (typeof getProfileJobs === "function" && typeof getProfileIconPortrait === "function") {
      getProfileJobs().forEach(job => {
        const path = normalizeAssetPath(getProfileIconPortrait(job.id));
        if (path) found.add(path);
      });
    }
    const html = document.documentElement.innerHTML;
    const urlPattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
    const attrPattern = /\b(?:src|href)\s*=\s*(['"])([^'"]+)\1/gi;
    const stringPattern = /(['"])(\.?\/?Assets\/[^'"]+\.(?:png|jpe?g|webp|gif|svg)(?:[?#][^'"]*)?)\1/gi;
    for (const pattern of [urlPattern, attrPattern, stringPattern]) {
      for (const match of html.matchAll(pattern)) {
        const path = normalizeAssetPath(match[2]);
        if (path) found.add(path);
      }
    }
    return [...found];
  }

  function preloadImage(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({ src, ok: true });
      img.onerror = () => resolve({ src, ok: false });
      img.src = src;
    });
  }

  function finishLoading() {
    document.body.classList.remove("gilsys-assets-loading");
    document.body.classList.add("gilsys-assets-ready");
    const loader = document.getElementById("gilsysBootLoader");
    if (loader) {
      loader.classList.add("is-hidden");
      setTimeout(() => loader.remove(), 420);
    }
  }

  async function startPreload() {
    const assets = collectImageAssets();
    if (!assets.length) {
      finishLoading();
      return;
    }
    const timeout = new Promise(resolve => setTimeout(resolve, TIMEOUT_MS));
    await Promise.race([Promise.allSettled(assets.map(preloadImage)), timeout]);
    finishLoading();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startPreload, { once: true });
  } else {
    startPreload();
  }
})();
