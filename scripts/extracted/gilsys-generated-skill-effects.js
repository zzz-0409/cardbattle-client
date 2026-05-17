(function () {
  "use strict";

  const BASE = "Assets/effect/generated";
  const manifest = {
    warrior_4_self: { src: `${BASE}/warrior_4_self.png`, template: "self", duration: 1450 },
    warrior_4_target: { src: `${BASE}/warrior_4_target.png`, template: "pass", duration: 1450 },
    warrior_5_target: { src: `${BASE}/warrior_5_target.png`, template: "drop", duration: 1550 },

    knight_1_self: {
      template: "self",
      duration: 1650,
      layers: [
        { src: `${BASE}/knight_1_wave.png`, className: "knight-layer-wave" },
        { src: `${BASE}/knight_1_core.png`, className: "knight-layer-core" },
      ],
    },
    knight_1_target: {
      template: "target",
      duration: 1500,
      layers: [
        { src: `${BASE}/knight_1_target.png`, className: "knight-target-glow knight-1-target-glow" },
        { src: `${BASE}/knight_1_target.png`, className: "knight-target-core knight-1-target-core" },
      ],
    },
    knight_2_self: {
      template: "self",
      duration: 1750,
      layers: [
        { src: `${BASE}/knight_2_sphere.png`, className: "knight-layer-sphere" },
        { src: `${BASE}/knight_2_core.png`, className: "knight-layer-core" },
      ],
    },
    knight_2_target: {
      template: "pass",
      duration: 1500,
      layers: [
        { src: `${BASE}/knight_2_target.png`, className: "knight-target-glow knight-2-target-glow" },
        { src: `${BASE}/knight_2_target.png`, className: "knight-target-core knight-2-target-core" },
      ],
    },
    knight_3_target: {
      template: "drop",
      duration: 2150,
      layers: [
        { src: `${BASE}/knight_3_omen.png`, className: "knight-3-omen" },
        { src: `${BASE}/knight_3_burst.png`, className: "knight-3-burst" },
        { src: `${BASE}/knight_3_target.png`, className: "knight-target-core knight-3-target-core" },
        { src: `${BASE}/knight_3_particles.png`, className: "knight-3-particles" },
      ],
    },

    priest_1_self: { src: `${BASE}/priest_1_self.png`, template: "self", duration: 1450 },
    priest_2_self: { src: `${BASE}/priest_2_self.png`, template: "self", duration: 1450 },
    priest_3_target: { src: `${BASE}/priest_3_target.png`, template: "target", duration: 1500 },

    thief_1_target: { src: `${BASE}/thief_1_target.png`, template: "pass", duration: 1400 },
    thief_2_target: { src: `${BASE}/thief_2_target.png`, template: "pass", duration: 1400 },
    thief_3_self: { src: `${BASE}/thief_3_self.png`, template: "self", duration: 1450 },
    thief_3_target: { src: `${BASE}/thief_3_target.png`, template: "pass", duration: 1450 },

    mage_1_self: { src: `${BASE}/mage_1_self.png`, template: "self", duration: 1450 },
    mage_2_target: { src: `${BASE}/mage_2_target.png`, template: "target", duration: 1500 },
    mage_3_target: { src: `${BASE}/mage_3_target.png`, template: "drop", duration: 1600 },

    onmyoji_1_self: { src: `${BASE}/onmyoji_1_self.png`, template: "self", duration: 1450 },
    onmyoji_2_self: { src: `${BASE}/onmyoji_2_self.png`, template: "self", duration: 1450 },
    onmyoji_3_self: { src: `${BASE}/onmyoji_3_self.png`, template: "self", duration: 1500 },

    alchemist_1_self: { src: `${BASE}/alchemist_1_self.png`, template: "self", duration: 1450 },
    alchemist_2_self: { src: `${BASE}/alchemist_2_self.png`, template: "self", duration: 1450 },
    alchemist_3_self: { src: `${BASE}/alchemist_3_self.png`, template: "self", duration: 1500 },

    archer_1_self: { src: `${BASE}/archer_1_self.png`, template: "self", duration: 1450 },
    archer_2_self: { src: `${BASE}/archer_2_self.png`, template: "self", duration: 1450 },
    archer_3_self: { src: `${BASE}/archer_3_self.png`, template: "self", duration: 1450 },

    doll_1_self: { src: `${BASE}/doll_1_self.png`, template: "self", duration: 1450 },
    doll_2_self: { src: `${BASE}/doll_2_self.png`, template: "self", duration: 1450 },
    doll_3_self: { src: `${BASE}/doll_3_self.png`, template: "self", duration: 1500 },

    mad_1_self: { src: `${BASE}/mad_1_self.png`, template: "self", duration: 1450 },
    mad_1_target: { src: `${BASE}/mad_1_target.png`, template: "target", duration: 1450 },
    mad_2_self: { src: `${BASE}/mad_2_self.png`, template: "self", duration: 1450 },
    mad_3_self: { src: `${BASE}/mad_3_self.png`, template: "self", duration: 1500 },
  };

  function preload(entry) {
    const sources = Array.isArray(entry.layers)
      ? entry.layers.map(layer => layer.src)
      : [entry.src];
    entry.pending = sources.length;
    sources.forEach(src => {
      const img = new Image();
      img.onload = () => {
        entry.pending -= 1;
        if (entry.pending <= 0) entry.ready = true;
      };
      img.onerror = () => { entry.failed = true; };
      img.src = src;
    });
  }

  Object.values(manifest).forEach(entry => preload(entry));

  window.renderGeneratedSkillEffect = function renderGeneratedSkillEffect({ effectName, targetSprite, targetSide }) {
    const entry = manifest[effectName];
    if (!entry || !targetSprite || !entry.ready || entry.failed) return false;

    const el = document.createElement("div");
    el.className = `gilsys-generated-skill-effect template-${entry.template || "target"} is-${targetSide} ${effectName}`;

    const layers = Array.isArray(entry.layers) ? entry.layers : [{ src: entry.src }];
    layers.forEach(layer => {
      const img = document.createElement("img");
      img.src = layer.src;
      img.alt = "";
      img.draggable = false;
      if (layer.className) img.className = `gilsys-generated-layer ${layer.className}`;
      el.appendChild(img);
    });
    targetSprite.appendChild(el);
    setTimeout(() => el.remove(), Number(entry.duration ?? 1500));
    return true;
  };
})();
