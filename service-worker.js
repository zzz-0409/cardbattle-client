const CACHE_NAME = "gilsys-pwa-v87";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./scripts/start-screen.js",
  "./scripts/pwa-register.js",
  "./scripts/asset-preloader.js",
  "./scripts/title-mission-system.js",
  "./scripts/extracted/gilsys-command-action-selection-state.js",
  "./styles/title-screen.css",
  "./styles/boot-loader.css",
  "./styles/title-mission.css",
  "./styles/close-buttons.css",
  "./styles/profile-title.css",
  "./Assets/Battlehaikei.png",
  "./Assets/fe-zu0and1haikei.png",
  "./Assets/battle/gilsys-battle-button-bg.png",
  "./Assets/item_cards/item-card-bronze.png",
  "./Assets/item_cards/item-card-silver.png",
  "./Assets/item_cards/item-card-gold.png",
  "./Assets/item_cards/item-card-rainbow.png",
  "./Assets/item_cards/item-card-redblack.png",
  "./Assets/haikei/7cc56fd2-92f8-44c9-a2b9-b8e605d1affd.png",
  "./Assets/home/gilsys-home-button-plate.png",
  "./Assets/home/gilsys-home-panel-frame.png",
  "./Assets/home/gilsys-home-nav-home.png",
  "./Assets/home/gilsys-home-nav-battle.png",
  "./Assets/home/gilsys-home-nav-growth.png",
  "./Assets/home/gilsys-home-nav-gacha.png",
  "./Assets/home/gilsys-home-nav-shop.png",
  "./Assets/home/gilsys-battle-mode-rank.png",
  "./Assets/home/gilsys-battle-mode-room.png",
  "./Assets/home/gilsys-battle-mode-cpu.png",
  "./Assets/home/gilsys-battle-mode-dojo.png",
  "./Assets/kyara/rennkinnjyutusi_solid.png",
  "./Assets/kyara/rennkinnjyutusi_solid_flipped.png",
  "./Assets/kyara/rennkinnjyutusi_battle_v2.png",
  "./Assets/kyara/rennkinnjyutusi_battle_v2_flipped.png",
  "./Assets/kyara/rennkinnjyutusi_side_solid.png",
  "./Assets/kyara/rennkinnjyutusi_side_solid_flipped.png",
  "./Assets/kyara/rennkinnjyutusi_battle_generated_self.png",
  "./Assets/kyara/rennkinnjyutusi_battle_generated_enemy.png",
  "./Assets/profile/icons/warrior-face.png",
  "./Assets/profile/icons/knight-face.png",
  "./Assets/profile/icons/priest-face.png",
  "./Assets/profile/icons/thief-face.png",
  "./Assets/profile/icons/mage-face.png",
  "./Assets/profile/icons/onmyoji-face.png",
  "./Assets/profile/icons/alchemist-face.png",
  "./Assets/profile/icons/archer-face.png",
  "./Assets/profile/icons/dollmaster-face.png",
  "./Assets/profile/icons/madman-face.png",
  "./Assets/profile/frames/warrior_dojo_master_frame.png",
  "./Assets/dojo/trail-icons/durandal-special.png",
  "./Assets/dojo/trail-icons/muramasa-special.png",
  "./Assets/result/normal-victory-bg.png",
  "./Assets/result/normal-defeat-bg.png",
  "./Assets/result/result-button-home.png",
  "./Assets/result/result-button-job.png",
  "./styles/extracted/gilsys-command-panel-no-popup-patch-style.css",
  "./scripts/extracted/gilsys-command-panel-no-popup-patch.js",
  "./scripts/extracted/gilsys-inventory-right-panel-patch.js",
  "./scripts/extracted/gilsys-damage-preview-patch.js",
  "./scripts/extracted/gilsys-doll-charge-command-patch.js",
  "./styles/extracted/gilsys-priest-blessing-count-style.css",
  "./styles/extracted/gilsys-mobile-hide-top-status-style.css",
  "./scripts/extracted/gilsys-touch-tooltip-patch.js",
  "./scripts/extracted/gilsys-mobile-floating-tooltip-patch.js",
  "./scripts/extracted/gilsys-universal-floating-tooltip-final-patch.js",
  "./styles/extracted/gilsys-mobile-doll-status-visible-final-style.css",
  "./styles/extracted/gilsys-status-exp-hp-name-cleanup-final-style.css",
  "./styles/extracted/gilsys-inventory-card-match-shop-style.css",
  "./styles/extracted/gilsys-mobile-hide-enemy-simple-status-style.css",
  "./styles/extracted/gilsys-all-device-responsive-final-style.css",
  "./scripts/extracted/gilsys-fit-control-text.js",
  "./styles/extracted/gilsys-fixed-game-viewport-style.css",
  "./scripts/extracted/gilsys-fixed-game-viewport.js",
  "./styles/extracted/gilsys-gacha-home-style.css",
  "./styles/extracted/gilsys-eye-friendly-home-job-style.css",
  "./styles/extracted/gilsys-cyber-job-battle-theme-style.css",
  "./styles/extracted/gilsys-cyber-vivid-hotfix-style.css",
  "./styles/extracted/gilsys-cyber-clear-button-character-fix.css",
  "./styles/extracted/gilsys-decorated-button-frame-style.css",
  "./styles/extracted/gilsys-battle-wide-clean-layout-style.css",
  "./styles/extracted/gilsys-battle-log-command-dock-style.css",
  "./styles/extracted/gilsys-button-frame-transparent-outside-style.css",
  "./styles/extracted/gilsys-length-aware-button-frame-style.css",
  "./styles/extracted/gilsys-connect-button-center-final-style.css",
  "./styles/extracted/gilsys-mobile-log-and-text-fit-final-style.css",
  "./styles/extracted/gilsys-job-select-info-visibility-fix-style.css",
  "./styles/extracted/gilsys-social-home-layout-style.css",
  "./scripts/extracted/gilsys-battle-log-command-dock.js",
  "./scripts/extracted/gilsys-job-action-dock.js",
  "./scripts/extracted/gilsys-social-home-layout.js",
  "./scripts/extracted/gilsys-home-controls-fallback.js",
  "./styles/extracted/gilsys-normal-result-screen-style.css",
  "./styles/extracted/gilsys-cyber-dojo-prep-result-redesign.css",
  "./styles/extracted/gilsys-classic-job-battle-theme-override.css",
  "./styles/extracted/gilsys-classic-job-battle-theme-popup-override.css",
  "./styles/extracted/gilsys-square-button-border-override.css",
  "./styles/extracted/gilsys-all-button-image-final-override.css",
  "./styles/extracted/gilsys-nine-slice-button-frame-final-override.css",
  "./styles/extracted/gilsys-dojo-trail-node-borderless-override.css",
  "./styles/extracted/gilsys-home-bottom-nav-image-buttons-final-override.css",
  "./styles/extracted/gilsys-home-battle-mode-image-buttons-final-override.css",
  "./styles/extracted/gilsys-battle-mode-alignment-and-start-cleanup-final.css",
  "./styles/extracted/gilsys-dojo-trail-detail-restore-final.css",
  "./styles/extracted/gilsys-dojo-trail-unified-drawer-final.css",
  "./styles/extracted/gilsys-dojo-trail-pc-drawer-final.css",
  "./scripts/extracted/gilsys-start-loader-fallback.js",
  "./styles/extracted/gilsys-vs-intro-style.css",
  "./styles/extracted/gilsys-mobile-battle-log-readable-final.css",
  "./styles/extracted/gilsys-alchemist-battle-opacity-fix.css",
  "./styles/extracted/gilsys-battle-equip-tooltip-hit-fix.css",
  "./scripts/extracted/gilsys-battle-equip-tooltip-hit-fix-script.js",
  "./scripts/extracted/gilsys-battle-log-final-dock.js",
  "./styles/extracted/gilsys-tutorial-style.css",
  "./scripts/extracted/gilsys-tutorial-controller.js",
  "./styles/extracted/gilsys-victory-result-generated-assets-style.css",
  "./styles/extracted/gilsys-victory-result-data-trigger-style.css",
  "./styles/extracted/gilsys-result-rate-compact-final.css",
  "./styles/extracted/gilsys-defeat-result-generated-assets-style.css",
  "./styles/extracted/gilsys-battle-generated-button-bg.css",
  "./styles/extracted/gilsys-item-card-generated-backgrounds.css?v=6",
  "./styles/extracted/gilsys-dojo-prep-two-panel.css",
  "./styles/extracted/gilsys-enemy-turn-command-panel.css",
  "./scripts/extracted/gilsys-dojo-prep-two-panel.js",
  "./styles/extracted/gilsys-home-control-fallback-style.css",
  "./styles/extracted/gilsys-profile-icon-face-final.css",
  "./styles/extracted/gilsys-inventory-icon-detail-final.css",
  "./styles/extracted/gilsys-title-job-scroll-lock-and-alchemist-final.css"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isDocumentRequest =
    request.mode === "navigate" ||
    request.destination === "document" ||
    url.pathname.endsWith("/") ||
    url.pathname.endsWith(".html");

  if (isDocumentRequest) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match("./index.html")))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
