(() => {
  const safe = (value) => typeof escapeHtml === "function"
    ? escapeHtml(String(value ?? ""))
    : String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
  const list = () => document.getElementById("gilsysCommandList");
  const title = () => document.getElementById("gilsysCommandListTitle");
  const listPanel = () => document.querySelector(".gilsys-command-list-panel");

  const setMode = (mode) => {
    const panel = listPanel();
    if (!panel) return;
    panel.classList.toggle("is-inventory-mode", mode === "inventory");
    panel.classList.toggle("is-shop-mode", mode === "shop");
  };

  const labels = () => {
    const btn = document.getElementById("atkBtn");
    if (btn) btn.innerHTML = "<span>⚔</span>攻撃/スキル";
  };

  const stat = (side, key, fallback = 0) => Number((side === "enemy" ? window.gilsysLatestEnemyStatus : window.gilsysLatestSelfStatus)?.[key] ?? fallback);
  const enemyPreviewDefense = () => {
    const enemy = window.gilsysLatestEnemyStatus || {};
    if (enemy.doll && !enemy.doll.is_broken) {
      return Number(enemy.doll.defense ?? enemy.defense ?? 0);
    }
    return stat("enemy", "defense", 0);
  };
  const enemyPreviewSpecialDefense = () =>
    Math.max(0, Number((window.gilsysLatestEnemyStatus || {}).special_defense ?? (window.gilsysLatestEnemyStatus || {}).specialDefense ?? 0));
  const finalDamage = (raw, ignoreDefense = false) => {
    const normalDefense = ignoreDefense ? 0 : enemyPreviewDefense();
    return Math.max(0, Math.floor(Number(raw ?? 0) - normalDefense - enemyPreviewSpecialDefense()));
  };
  const jobId = () => {
    const raw = window.myJob ?? (typeof myJob !== "undefined" ? myJob : null);
    return (typeof JOB_ID_MAP !== "undefined" && JOB_ID_MAP?.[raw]) ?? raw;
  };
  const dojoSkillDamageBonus = (status = window.gilsysLatestSelfStatus || {}) =>
    Math.max(0, Number(status?.dojo_skill_damage_bonus ?? status?.dojoSkillDamageBonus ?? 0));
  function attackUpBuffTypeCount(status = window.gilsysLatestSelfStatus || {}) {
    const buffs = Array.isArray(status?.buffs_ui) ? status.buffs_ui : [];
    const keys = new Set();
    for (const buff of buffs) {
      if (buff?.kind !== "atk_up") continue;
      if (buff?.passive || buff?.unremovable) continue;
      if (Number(buff?.power ?? 0) <= 0) continue;
      keys.add(String(buff?.source ?? buff?.text ?? buff?.power ?? "攻撃力"));
    }
    return keys.size;
  }

  function hasDojoPierceWeapon(status = window.gilsysLatestSelfStatus || {}) {
    const items = [];
    if (status?.special_equipment) items.push(status.special_equipment);
    if (Array.isArray(status?.extra_special_equipments)) items.push(...status.extra_special_equipments);
    const slots = Array.isArray(status?.special_equip?.slots) ? status.special_equip.slots : [];
    for (const slot of slots) {
      if (slot?.item) items.push(slot.item);
    }
    return items.some(it => it?.dojo_special_effect === "pierce_weapon");
  }

  function getEquippedArrowItems(status = window.gilsysLatestSelfStatus || {}) {
    const hasArrowAmmo = (it) => Number(it?.arrows_remaining ?? it?.arrow_count ?? 1) > 0;
    const slots = Array.isArray(status?.special_equip?.slots) ? status.special_equip.slots : [];
    const fromSlots = slots
      .map(slot => slot?.item)
      .filter(it => it && hasArrowAmmo(it) && (it.is_arrow || it.equip_type === "arrow" || String(it.name ?? "").includes("矢")));
    if (fromSlots.length) return fromSlots;
    return (window.itemList || []).filter(it =>
      it &&
      it.is_equipped_special &&
      hasArrowAmmo(it) &&
      (it.is_arrow || it.equip_type === "arrow" || String(it.name ?? "").includes("矢"))
    );
  }

  function getArcherArrowPreview(atk, skillNo = 0) {
    const selfStatus = window.gilsysLatestSelfStatus || {};
    const arrows = getEquippedArrowItems(selfStatus);
    if (!arrows.length) return { damage: 0, hits: 0, note: "矢なし" };

    const currentExtra = Number(selfStatus.archer_buff?.rounds ?? 0) > 0
      ? Math.max(1, Number(selfStatus.archer_buff?.extra ?? 1))
      : 0;
    const extra = (skillNo === 1 || skillNo === 2) ? Math.max(currentExtra, 1) : currentExtra;
    const repeat = 1 + extra;
    const forcePierce = Number(selfStatus.archer_pierce_rounds ?? 0) > 0;
    const pierceWeapon = hasDojoPierceWeapon(selfStatus);
    const noConsume = !!selfStatus.archer_no_consume_permanent || Number(selfStatus.archer_no_consume_rounds ?? 0) > 0;
    const counterBonus = Math.floor(Number(selfStatus.damage_taken_last_turn ?? selfStatus.damage_taken_last_round ?? 0) / 2);

    let total = 0;
    let hits = 0;
    for (let r = 0; r < repeat; r++) {
      for (const arrow of arrows) {
        const effect = arrow?.effect ?? "";
        const raw = effect === "normal"
          ? Number(atk ?? 0)
          : Number(arrow?.power ?? 0) + (effect === "counter" ? counterBonus : 0);
        const pierce = !!arrow?.pierce || forcePierce || pierceWeapon;
        total += finalDamage(raw, pierce);
        hits += 1;
      }
    }

    const pierceNote = (forcePierce || pierceWeapon) ? "防御貫通" : `相手防御 ${enemyPreviewDefense()} を矢ごとに反映`;
    const counterNote = arrows.some(a => a?.effect === "counter") ? ` / 反撃+${counterBonus}` : "";
    const consumeNote = noConsume ? " / 矢消費なし" : "";
    return { damage: total, hits, note: `矢攻撃${hits}Hit ${pierceNote}${counterNote}${consumeNote}` };
  }

  function getDamagePreview(skillNo = 0) {
    const id = String(jobId());
    const selfStatus = window.gilsysLatestSelfStatus || {};
    let atk = stat("self", "attack", 0);
    if (id === "9" && selfStatus.doll && !selfStatus.doll.is_broken) {
      atk = Number(selfStatus.doll.attack ?? atk);
    }
    const def = enemyPreviewDefense();
    const specialDef = enemyPreviewSpecialDefense();
    const pierceWeapon = hasDojoPierceWeapon(selfStatus);
    const selfDef = stat("self", "defense", 0);
    const mana = Number(window.gilsysLatestSelfStatus?.mana ?? 0);
    const itemCount = (window.itemList || []).filter(it => it?.category === "item").length;
    const mad = !!window.gilsysLatestSelfStatus?.mad_state?.is_mad;
    const skillBonus = id === "1" && skillNo ? dojoSkillDamageBonus(selfStatus) : 0;
    let bonusNote = skillBonus > 0 ? ` / 軌跡+${skillBonus}` : "";

    if (id === "8") {
      const arrows = getArcherArrowPreview(atk, skillNo);
      if (!skillNo) {
        const baseNote = skillNo ? "スキル後の矢攻撃" : "矢攻撃のみ";
        return { damage: arrows.damage, note: `${baseNote}：${arrows.note}` };
      }
      if (skillNo === 1 || skillNo === 2) {
        return { damage: arrows.damage, note: `スキル後の通常攻撃：${arrows.note}` };
      }
      if (skillNo === 3) {
        return { damage: 0, note: "以後、矢を消費せずに攻撃できる" };
      }
    }

    if (!skillNo) {
      const note = pierceWeapon
        ? `防御貫通（特殊防御 ${specialDef} 反映）`
        : `相手防御 ${def}${specialDef > 0 ? ` + 特殊防御 ${specialDef}` : ""} 反映`;
      return { damage: finalDamage(atk, pierceWeapon), note };
    }

    let raw = null;
    let ignore = false;
    if (id === "1") {
      if (skillNo === 1) {
        ignore = true;
        raw = 20 + skillBonus;
      } else if (skillNo === 2) {
        ignore = true;
        raw = 30 + skillBonus;
      } else if (skillNo === 3) {
        ignore = true;
        raw = 10 + atk + skillBonus;
      } else if (skillNo === 4) {
        ignore = false;
        raw = atk + 20 + skillBonus;
        bonusNote = `${bonusNote} / 攻撃力+20後`;
      } else if (skillNo === 5) {
        const buffBonus = attackUpBuffTypeCount(selfStatus) * 10;
        ignore = true;
        raw = atk + skillBonus + buffBonus;
        if (buffBonus > 0) bonusNote = `${bonusNote} / 攻撃バフ+${buffBonus}`;
      }
    } else if (id === "2") {
      raw = skillNo === 1 ? 20 : skillNo === 2 ? 15 : skillNo === 3 ? 25 + selfDef : null;
    } else if (id === "3") {
      ignore = skillNo === 3;
      raw = skillNo === 3 ? Math.floor(Number(selfStatus.hp ?? 0) / 10) + Number(selfStatus.blessing_count ?? 0) : null;
    } else if (id === "4") {
      raw = skillNo === 1 ? 25 : skillNo === 2 ? 25 + itemCount * 2 : null;
    } else if (id === "5") {
      raw = skillNo === 2 ? 30 : skillNo === 3 ? Math.max(0, mana - 30) : null;
      ignore = skillNo === 3;
    } else if (id === "10" && skillNo === 1 && mad) {
      ignore = true;
      raw = 30;
    }

    if (raw == null) return null;
    const ignoreWithWeapon = ignore || pierceWeapon;
    const defenseNote = ignoreWithWeapon
      ? `防御無視${specialDef > 0 ? `（特殊防御 ${specialDef} 反映）` : ""}`
      : `相手防御 ${def}${specialDef > 0 ? ` + 特殊防御 ${specialDef}` : ""} 反映`;
    return { damage: finalDamage(raw, ignoreWithWeapon), note: `${defenseNote}${bonusNote}` };
  }
  function detailMeta(defaultMeta, preview) {
    return preview ? `<span class="gilsys-damage-preview">予想ダメージ ${safe(preview.damage)}</span>` : safe(defaultMeta ?? "");
  }

  function setDetail(titleText, metaText, descText, iconText, handler, preview) {
    if (typeof restoreGilsysCommandDetailPanel === "function") restoreGilsysCommandDetailPanel();
    setGilsysText("gilsysDetailTitle", titleText || "コマンド");
    const metaEl = document.getElementById("gilsysDetailMeta");
    if (metaEl) metaEl.innerHTML = detailMeta(metaText, preview);
    const extra = preview ? `\n\n予想ダメージ: ${preview.damage}（${preview.note}）` : "";
    setGilsysText("gilsysDetailDescription", `${descText || "説明なし"}${extra}`);
    setGilsysText("gilsysDetailIcon", iconText || "◆");
    const btn = document.getElementById("gilsysConfirmBtn");
    if (btn) btn.onclick = handler || null;
  }

  const skillHandler = (skillNo) => {
    const currentJob = String(window.myJob ?? (typeof myJob !== "undefined" ? myJob : ""));
    if (currentJob === "人形使い" || currentJob === "9") {
      if (skillNo === 1 && typeof useDollSkill1 === "function") return useDollSkill1;
      if (skillNo === 2 && typeof useDollSkill2Prompt === "function") return useDollSkill2Prompt;
      if (skillNo === 3 && typeof useDollSkill3 === "function") return useDollSkill3;
    }
    return () => useSkill(skillNo);
  };

  window.openAttackSkillPanel = function(markManual = true) {
    labels();
    setMode("attack");
    const l = list();
    const t = title();
    if (!l) return;
    if (t) t.textContent = "攻撃/スキル";
    l.dataset.manual = markManual ? "attackSkill" : "default";
    l.innerHTML = "";

    const selfStatus = window.gilsysLatestSelfStatus || {};
    let atk = stat("self", "attack", 0);
    if (String(jobId()) === "9" && selfStatus.doll && !selfStatus.doll.is_broken) {
      atk = Number(selfStatus.doll.attack ?? atk);
    }
    const attackPreview = getDamagePreview(0);
    const attackRow = document.createElement("button");
    attackRow.className = "gilsys-list-row is-selected";
    attackRow.innerHTML = `<span class="gilsys-row-icon">⚔</span><span>通常攻撃</span><b>予想 ${safe(attackPreview.damage)}</b>`;
    attackRow.onclick = () => {
      [...l.querySelectorAll(".gilsys-list-row")].forEach(el => el.classList.remove("is-selected"));
      attackRow.classList.add("is-selected");
      setDetail("通常攻撃", `攻撃力 ${atk}`, "敵単体に通常ダメージを与える。ターンを消費します。", "⚔", attack, attackPreview);
    };
    l.appendChild(attackRow);

    const allSkills = (typeof SKILLS !== "undefined" ? SKILLS : window.SKILLS) || {};
    const skills = allSkills?.[jobId()] || [];
    if (!skills.length) {
      const empty = document.createElement("div");
      empty.className = "gilsys-empty-row";
      empty.textContent = `現在の職業「${safe(window.myJob ?? (typeof myJob !== "undefined" ? myJob : "不明"))}」に対応するスキルが見つかりません`;
      l.appendChild(empty);
    }

    skills.forEach((skill, index) => {
      const no = index + 1;
      if (!isDojoOnlySkillVisible(no)) return;
      const need = Number(skill?.level ?? no);
      const level = Number(typeof myLevel !== "undefined" ? myLevel : 1);
      const remain = Number(window.skillRemaining?.[no] ?? 1);
      const preview = getDamagePreview(no);
      const icon = typeof gilsysSkillIcon === "function" ? gilsysSkillIcon(index, skill?.name) : "✦";
      const meta = remain < 0 ? "軌跡で解放" : remain <= 0 ? "使用回数 0" : level < need ? `Lv${need}で解放` : preview ? `予想 ${preview.damage}` : `スキル${no}`;
      const row = document.createElement("button");
      row.className = "gilsys-list-row";
      row.innerHTML = `<span class="gilsys-row-icon">${safe(icon)}</span><span>${safe(skill?.name ?? `スキル${no}`)}</span><b>${safe(meta)}</b>`;
      row.onclick = () => {
        [...l.querySelectorAll(".gilsys-list-row")].forEach(el => el.classList.remove("is-selected"));
        row.classList.add("is-selected");
        setDetail(skill?.name ?? `スキル${no}`, meta, skill?.desc ?? "職業スキルを発動します。", icon, () => {
          if (remain < 0) return showCenterToast("右端の大軌跡で解放されます", 2500);
          if (remain <= 0) return showCenterToast("スキルの使用回数がなくなりました", 2500);
          if (level < need) return showCenterToast(`Lv${need}で解放されます`, 2200);
          skillHandler(no)();
        }, preview);
      };
      l.appendChild(row);
    });

    attackRow.click();
  };
})();
