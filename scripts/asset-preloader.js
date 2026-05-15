(() => {
  const BOOT_TIMEOUT_MS = 8000;
  const TRANSITION_TIMEOUT_MS = 5200;
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
    "Assets/dojo/enemies/ashura.png",
    "Assets/dojo/enemy-icons/slime.png",
    "Assets/dojo/enemy-icons/goblin.png",
    "Assets/dojo/enemy-icons/wolf.png",
    "Assets/dojo/enemy-icons/golem.png",
    "Assets/dojo/enemy-icons/ghost.png",
    "Assets/dojo/enemy-icons/mushroom.png",
    "Assets/dojo/enemy-icons/anubis.png",
    "Assets/dojo/enemy-icons/athena.png",
    "Assets/dojo/enemy-icons/kali.png",
    "Assets/dojo/enemy-icons/susanoo.png",
    "Assets/dojo/enemy-icons/thor.png",
    "Assets/dojo/enemy-icons/zeus.png",
    "Assets/dojo/enemy-icons/ashura.png"
  ];

  const LOADING_TOPICS = [
    ["基本ルール", "行動できるのは自分のターンだけです。攻撃、スキル、アイテム、ショップ操作のどれを選ぶかが勝負を分けます。"],
    ["ターン制", "継続効果はターンの区切りで進みます。残りターンが少ない効果は使うタイミングが大事です。"],
    ["装備", "通常装備はステータスを底上げします。特殊装備や職業専用装備とは別枠で扱われます。"],
    ["バフ", "攻撃力アップや防御力アップは重なることがあります。相手の強化状態もこまめに確認しましょう。"],
    ["ショップ", "ショップは毎ターンの選択肢です。今すぐ使うアイテムか、後半に効く装備かを見極めましょう。"],
    ["レベルアップ", "EXPが足りないときはコインで補える場合があります。始める前に強化できるか確認すると有利です。"],
    ["CPU戦", "CPU戦でも相手の職業と装備を見ながら動くと練習効率が上がります。"],
    ["達人の道", "道中の報酬は次の戦いに影響します。装備枠や持ち込み枠の強化は長期戦向きです。"],
    ["人形使い", "人形がいる間は本体とは別の耐久や装備状態も重要になります。"],
    ["弓兵", "矢は効果と残弾を見ながら使い分けると強力です。"]
  ];

  const loadedImages = new Set();
  const loadingImages = new Map();
  let transitionToken = 0;

  function normalizeAssetPath(raw) {
    if (!raw) return "";
    let value = String(raw).trim().replace(/^['"]|['"]$/g, "");
    value = value.replace(/&quot;/g, "").replace(/&amp;/g, "&");
    if (!value || value === "none" || value.startsWith("data:") || value.startsWith("blob:")) return "";
    if (/^https?:\/\//i.test(value)) {
      try {
        const url = new URL(value);
        if (url.origin !== location.origin) return "";
        value = `${url.pathname}${url.search}`;
      } catch (_) {
        return "";
      }
    }
    const assetIndex = value.indexOf("Assets/");
    if (assetIndex >= 0) value = value.slice(assetIndex);
    if (!value.startsWith("Assets/") && !value.startsWith("./Assets/")) return "";
    value = value.replace(/^\.\//, "");
    return IMAGE_EXT.test(value) ? value : "";
  }

  function addAsset(found, raw) {
    const path = normalizeAssetPath(raw);
    if (path) found.add(path);
  }

  function addUrlsFromText(found, text) {
    if (!text) return;
    const urlPattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
    const attrPattern = /\b(?:src|href|poster)\s*=\s*(['"])([^'"]+)\1/gi;
    const stringPattern = /(['"])(\.?\/?Assets\/[^'"]+\.(?:png|jpe?g|webp|gif|svg)(?:[?#][^'"]*)?)\1/gi;
    for (const pattern of [urlPattern, attrPattern, stringPattern]) {
      for (const match of String(text).matchAll(pattern)) addAsset(found, match[2]);
    }
  }

  function addSrcset(found, value) {
    String(value || "")
      .split(",")
      .map(part => part.trim().split(/\s+/)[0])
      .forEach(src => addAsset(found, src));
  }

  function collectStyleSheetAssets(found) {
    const readRules = (rules) => {
      if (!rules) return;
      for (const rule of rules) {
        addUrlsFromText(found, rule.cssText);
        if (rule.cssRules) {
          try { readRules(rule.cssRules); } catch (_) {}
        }
      }
    };

    for (const sheet of document.styleSheets) {
      try { readRules(sheet.cssRules); } catch (_) {}
    }
  }

  function collectDomAssetAttributes(found, root = document) {
    const scope = root instanceof Element || root instanceof Document ? root : document;
    scope.querySelectorAll?.("img[src], source[srcset], [src], [srcset], [poster]").forEach(el => {
      addAsset(found, el.getAttribute("src"));
      addSrcset(found, el.getAttribute("srcset"));
      addAsset(found, el.getAttribute("poster"));
    });
  }

  function collectComputedAssets(found, root) {
    if (!(root instanceof Element)) return;
    const nodes = [root, ...root.querySelectorAll("*")];
    const properties = [
      "backgroundImage",
      "borderImageSource",
      "listStyleImage",
      "maskImage",
      "webkitMaskImage",
      "content"
    ];

    for (const node of nodes) {
      for (const pseudo of [null, "::before", "::after"]) {
        let style = null;
        try { style = getComputedStyle(node, pseudo); } catch (_) {}
        if (!style) continue;
        for (const prop of properties) addUrlsFromText(found, style[prop]);
      }
    }
  }

  function collectImageAssets() {
    const found = new Set(REQUIRED_ASSETS);
    if (typeof getProfileJobs === "function" && typeof getProfileIconPortrait === "function") {
      getProfileJobs().forEach(job => addAsset(found, getProfileIconPortrait(job.id)));
    }
    addUrlsFromText(found, document.documentElement.innerHTML);
    collectStyleSheetAssets(found);
    collectDomAssetAttributes(found, document);
    return [...found];
  }

  function collectPhaseImageAssets(root) {
    const found = new Set();
    if (root instanceof Element) {
      collectDomAssetAttributes(found, root);
      collectComputedAssets(found, root);
    }
    return [...found];
  }

  function preloadImage(src) {
    const normalized = normalizeAssetPath(src);
    if (!normalized || loadedImages.has(normalized)) return Promise.resolve({ src: normalized, cached: true });
    if (loadingImages.has(normalized)) return loadingImages.get(normalized);

    const promise = new Promise(resolve => {
      const img = new Image();
      const done = (ok) => {
        loadedImages.add(normalized);
        loadingImages.delete(normalized);
        resolve({ src: normalized, ok });
      };
      img.onload = () => done(true);
      img.onerror = () => done(false);
      img.decoding = "async";
      img.src = normalized;
      if (img.complete) queueMicrotask(() => done(true));
    });

    loadingImages.set(normalized, promise);
    return promise;
  }

  function preloadAssets(assets, timeoutMs) {
    const unique = [...new Set((assets || []).map(normalizeAssetPath).filter(Boolean))]
      .filter(src => !loadedImages.has(src));
    if (!unique.length) return Promise.resolve([]);
    const timeout = new Promise(resolve => setTimeout(resolve, timeoutMs, []));
    return Promise.race([Promise.allSettled(unique.map(preloadImage)), timeout]);
  }

  function ensureLoader() {
    let loader = document.getElementById("gilsysBootLoader");
    if (!loader) {
      loader = document.createElement("div");
      loader.id = "gilsysBootLoader";
      loader.setAttribute("role", "status");
      loader.setAttribute("aria-live", "polite");
      loader.innerHTML = `
        <div class="gilsys-boot-loader-box">
          <div class="gilsys-boot-loader-ring" aria-hidden="true"></div>
          <div class="gilsys-boot-loader-text">LOADING...</div>
          <div class="gilsys-boot-loader-topic" id="gilsysBootLoaderTopic"><b>TIPS</b><span></span></div>
        </div>
      `;
      document.body.appendChild(loader);
    }

    let topic = document.getElementById("gilsysBootLoaderTopic");
    if (!topic) {
      topic = document.createElement("div");
      topic.id = "gilsysBootLoaderTopic";
      topic.className = "gilsys-boot-loader-topic";
      topic.innerHTML = "<b>TIPS</b><span></span>";
      loader.querySelector(".gilsys-boot-loader-box")?.appendChild(topic);
    }

    return loader;
  }

  function setRandomTopic(loader = ensureLoader()) {
    const topic = LOADING_TOPICS[Math.floor(Math.random() * LOADING_TOPICS.length)] || LOADING_TOPICS[0];
    const topicEl = loader?.querySelector(".gilsys-boot-loader-topic");
    if (!topicEl) return;
    topicEl.querySelector("b").textContent = topic[0];
    topicEl.querySelector("span").textContent = topic[1];
  }

  function showInitialLoadingOverlay(text = "LOADING...") {
    const loader = document.getElementById("gilsysInitialBootLoader");
    if (!loader) return;
    const label = loader.querySelector(".gilsys-boot-loader-text");
    if (label) label.textContent = text;
    setRandomTopic(loader);
    document.body.classList.add("gilsys-screen-loading");
    loader.classList.remove("is-hidden");
    loader.hidden = false;
    loader.style.display = "grid";
    window.gilsysResetOuterScroll?.();
    requestAnimationFrame(() => window.gilsysResetOuterScroll?.());
  }

  function hideInitialLoadingOverlay() {
    const loader = document.getElementById("gilsysInitialBootLoader");
    if (!loader) return;
    loader.classList.add("is-hidden");
    setTimeout(() => {
      if (loader.classList.contains("is-hidden")) loader.remove();
    }, 420);
  }

  function showLoadingOverlay(text = "LOADING...", scope = "transition") {
    const loader = ensureLoader();
    const label = loader.querySelector(".gilsys-boot-loader-text");
    if (label) label.textContent = text;
    loader.dataset.loadingScope = "transition";
    setRandomTopic(loader);
    document.body.classList.add("gilsys-screen-loading");
    loader.classList.remove("is-hidden");
    loader.hidden = false;
    loader.style.display = "grid";
    window.gilsysLockOuterViewport?.();
    requestAnimationFrame(() => window.gilsysLockOuterViewport?.());
  }

  function hideLoadingOverlay() {
    const loader = document.getElementById("gilsysBootLoader");
    document.body.classList.remove("gilsys-screen-loading");
    if (!loader || document.body.classList.contains("gilsys-assets-loading")) return;
    loader.classList.add("is-hidden");
    setTimeout(() => {
      if (loader.classList.contains("is-hidden")) {
        loader.style.display = "none";
        delete loader.dataset.loadingScope;
      }
    }, 420);
  }

  function finishLoading() {
    document.body.classList.remove("gilsys-assets-loading");
    document.body.classList.add("gilsys-assets-ready");
    requestAnimationFrame(() => window.gilsysApplyFixedGameViewport?.());
    hideInitialLoadingOverlay();
    hideLoadingOverlay();
  }

  function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function startPreload() {
    showInitialLoadingOverlay("LOADING...");
    const assets = collectImageAssets();
    await preloadAssets(assets, BOOT_TIMEOUT_MS);
    finishLoading();
  }

  window.gilsysShowLoadingOverlay = showLoadingOverlay;
  window.gilsysHideLoadingOverlay = hideLoadingOverlay;
  window.gilsysBeginScreenTransition = function beginScreenTransition() {
    transitionToken += 1;
    showLoadingOverlay("LOADING...", "transition");
    return transitionToken;
  };
  window.gilsysFinishScreenTransition = async function finishScreenTransition(root, token = transitionToken) {
    await nextFrame();
    const assets = collectPhaseImageAssets(root);
    await preloadAssets(assets, TRANSITION_TIMEOUT_MS);
    if (token === transitionToken) hideLoadingOverlay();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startPreload, { once: true });
  } else {
    startPreload();
  }
})();
