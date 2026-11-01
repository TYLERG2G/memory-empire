/* 記憶帝國：女傑翻牌 — 遊戲邏輯 */
(function () {
  'use strict';
  var D = window.GAME_DATA;
  if (!D) { console.error('GAME_DATA missing'); return; }
  var HEROINES = D.HEROINES, ACHIEVEMENTS = D.ACHIEVEMENTS, CONFIG = D.CONFIG;
  var pairsFor = D.pairsFor, timeFor = D.timeFor, xpNeed = D.xpNeed, upgradeCost = D.upgradeCost;
  var skillValue = D.skillValue, skillDesc = D.skillDesc;

  function $(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function defaultState() {
    return {
      lv: 1, xp: 0, gold: 0,
      energy: CONFIG.ENERGY_MAX, energyMax: CONFIG.ENERGY_MAX, lastEnergyAt: Date.now(),
      stage: 1, maxStage: 1, streak: 0, bestStreak: 0, lastPlayDate: '',
      unlocked: { verda: true },
      skills: { verda: 1, karena: 1, elys: 1, selas: 1, reina: 1 },
      selected: 'verda',
      achievements: {},
      sound: false, vibrate: true,
      stats: { wins: 0, perfects: 0, maxCombo: 0, skillsUsed: 0, goldEarned: 0, bestStreak: 0, clears: 0 }
    };
  }

  function load() {
    try {
      var raw = localStorage.getItem(CONFIG.SAVE_KEY);
      if (!raw) return defaultState();
      var s = Object.assign(defaultState(), JSON.parse(raw));
      s.unlocked = Object.assign({ verda: true }, s.unlocked || {});
      s.skills = Object.assign(defaultState().skills, s.skills || {});
      s.stats = Object.assign(defaultState().stats, s.stats || {});
      s.achievements = s.achievements || {};
      return s;
    } catch (e) { return defaultState(); }
  }
  function save() { try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(S)); } catch (e) {} }

  var S = load();
  var battle = null;
  var audioCtx = null;
  var energyTimer = null;

  function heroine(id) {
    for (var i = 0; i < HEROINES.length; i++) if (HEROINES[i].id === id) return HEROINES[i];
    return HEROINES[0];
  }

  function regenEnergy() {
    var now = Date.now();
    if (S.energy >= S.energyMax) { S.lastEnergyAt = now; return; }
    var gained = Math.floor((now - S.lastEnergyAt) / CONFIG.ENERGY_REGEN_MS);
    if (gained > 0) {
      S.energy = Math.min(S.energyMax, S.energy + gained);
      S.lastEnergyAt += gained * CONFIG.ENERGY_REGEN_MS;
      if (S.energy >= S.energyMax) S.lastEnergyAt = now;
      save();
    }
  }
  function energyEta() {
    if (S.energy >= S.energyMax) return '';
    var left = CONFIG.ENERGY_REGEN_MS - (Date.now() - S.lastEnergyAt);
    if (left < 0) left = 0;
    var s = Math.ceil(left / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function updateStreakOnPlay() {
    var t = todayStr();
    if (S.lastPlayDate === t) return;
    var y = new Date(); y.setDate(y.getDate() - 1);
    var ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    if (S.lastPlayDate === ys) S.streak += 1; else S.streak = 1;
    S.lastPlayDate = t;
    if (S.streak > S.stats.bestStreak) S.stats.bestStreak = S.streak;
  }

  function toast(msg) {
    var box = $('toasts');
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
    }, 1800);
  }

  function playTone(freq, dur, type) {
    if (!S.sound) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.04;
      o.connect(g); g.connect(audioCtx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      o.stop(audioCtx.currentTime + dur);
    } catch (e) {}
  }
  function vibe(ms) { if (S.vibrate && navigator.vibrate) navigator.vibrate(ms || 12); }

  function checkAchievements() {
    ACHIEVEMENTS.forEach(function (a) {
      if (S.achievements[a.id]) return;
      try {
        if (a.check(S)) {
          S.achievements[a.id] = true;
          S.gold += a.reward || 0;
          S.stats.goldEarned += a.reward || 0;
          toast('成就解鎖：' + a.name + ' +' + (a.reward || 0) + '金');
        }
      } catch (e) {}
    });
  }

  function addXp(n) {
    S.xp += n;
    var ups = 0;
    while (S.xp >= xpNeed(S.lv)) {
      S.xp -= xpNeed(S.lv);
      S.lv += 1;
      ups += 1;
      S.gold += 50;
      S.stats.goldEarned += 50;
    }
    return ups;
  }

  function go(name) {
    qsa('.screen').forEach(function (el) { el.classList.remove('active'); });
    var scr = $('scr-' + name);
    if (scr) scr.classList.add('active');
    qsa('#nav button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-go') === name);
    });
    var hideNav = name === 'battle' || name === 'result';
    document.body.classList.toggle('no-nav', hideNav);
    if (name === 'home') renderHome();
    if (name === 'roster') renderRoster();
    if (name === 'ach') renderAch();
    if (name === 'settings') renderSettings();
    refreshTop();
  }

  function refreshTop() {
    regenEnergy();
    $('tb-lv').textContent = S.lv;
    var need = xpNeed(S.lv);
    $('tb-xp').style.width = Math.min(100, (S.xp / need) * 100) + '%';
    $('tb-gold').textContent = S.gold;
    $('tb-energy').textContent = S.energy;
    $('tb-emax').textContent = S.energyMax;
    $('tb-etimer').textContent = energyEta() ? ('+' + energyEta()) : '';
  }

  function renderHome() {
    var h = heroine(S.selected);
    $('home-hero-img').src = 'assets/heroines/' + h.id + '.webp';
    $('home-hero-title').textContent = h.title;
    $('home-hero-name').textContent = h.name;
    var lv = S.skills[h.id] || 1;
    $('home-hero-skill').textContent = h.skillName + '：' + skillDesc(h.skill, lv);
    $('home-stage').textContent = S.stage;
    var p = pairsFor(S.stage), t = timeFor(S.stage);
    $('home-stage-detail').textContent = p + ' 組配對 · 限時 ' + t + ' 秒';
    $('home-streak').textContent = S.streak;
    $('home-best').textContent = S.maxStage;
    $('btn-fight').disabled = S.energy < CONFIG.ENERGY_COST;
  }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  function startBattle() {
    regenEnergy();
    if (S.energy < CONFIG.ENERGY_COST) { toast('體力不足，請稍候回復'); return; }
    S.energy -= CONFIG.ENERGY_COST;
    updateStreakOnPlay();
    save();

    var h = heroine(S.selected);
    var pairs = pairsFor(S.stage);
    var time = timeFor(S.stage);
    var ids = HEROINES.map(function (x) { return x.id; });
    while (ids.length < pairs) ids = ids.concat(ids);
    ids = shuffle(ids.slice(0, pairs));
    var cards = [];
    ids.forEach(function (id, idx) {
      cards.push({ key: id + '-a-' + idx, pair: id, open: false, matched: false });
      cards.push({ key: id + '-b-' + idx, pair: id, open: false, matched: false });
    });
    shuffle(cards);

    var skillLv = S.skills[h.id] || 1;
    var comboMul = h.skill === 'combo' ? skillValue('combo', skillLv) : 1;

    battle = {
      stage: S.stage, pairs: pairs, matched: 0, score: 0, combo: 0, miss: 0,
      timeMax: time, timeLeft: time, frozen: 0, skillUsed: false,
      cards: cards, lock: false, first: null, timer: null, heroine: h, skillLv: skillLv, comboMul: comboMul,
      running: true
    };

    // elys time skill is active on use; passive only for reina
    $('b-stage').textContent = battle.stage;
    $('b-score').textContent = '0';
    $('b-pairs').textContent = '0/' + pairs;
    $('b-combo').textContent = '連擊 x0';
    $('b-miss').textContent = '0';
    $('b-hero-img').src = 'assets/heroines/' + h.id + '-sm.webp';
    var skillBtn = $('btn-skill');
    if (h.skill === 'combo') {
      skillBtn.textContent = '被動：' + h.skillName + ' x' + comboMul;
      skillBtn.disabled = true;
    } else {
      skillBtn.textContent = '✦ ' + h.skillName;
      skillBtn.disabled = false;
    }
    $('b-banner').classList.add('hidden');
    renderBoard();
    go('battle');
    tickStart();
  }

  function colsFor(n) {
    if (n <= 6) return 3;
    if (n <= 12) return 4;
    return 4;
  }
  function renderBoard() {
    var board = $('board');
    board.innerHTML = '';
    board.style.gridTemplateColumns = 'repeat(' + colsFor(battle.cards.length) + ',1fr)';
    battle.cards.forEach(function (c, i) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'card' + (c.open || c.matched ? ' open' : '') + (c.matched ? ' matched' : '');
      el.setAttribute('data-i', String(i));
      el.innerHTML = '<div class="card-inner"><div class="face back"></div><div class="face front"><img alt="" src="assets/heroines/' + c.pair + '-sm.webp"></div></div>';
      el.addEventListener('click', onCard);
      board.appendChild(el);
    });
  }

  function tickStart() {
    if (battle.timer) clearInterval(battle.timer);
    battle.timer = setInterval(function () {
      if (!battle || !battle.running) return;
      if (battle.frozen > 0) {
        battle.frozen -= 0.1;
        $('timebar') && null;
        qs('.timebar').classList.add('frozen');
        updateTimeUI();
        return;
      }
      qs('.timebar').classList.remove('frozen');
      battle.timeLeft -= 0.1;
      updateTimeUI();
      if (battle.timeLeft <= 0) {
        battle.timeLeft = 0;
        endBattle(false);
      }
    }, 100);
  }
  function updateTimeUI() {
    var pct = Math.max(0, (battle.timeLeft / battle.timeMax) * 100);
    $('b-timefill').style.width = pct + '%';
    $('b-time').textContent = Math.ceil(battle.timeLeft) + 's';
    qs('.timebar').classList.toggle('low', battle.timeLeft < 8 && battle.frozen <= 0);
  }

  function onCard(ev) {
    if (!battle || !battle.running || battle.lock) return;
    var i = +ev.currentTarget.getAttribute('data-i');
    var c = battle.cards[i];
    if (!c || c.open || c.matched) return;
    c.open = true;
    ev.currentTarget.classList.add('open');
    playTone(520, 0.06);
    vibe(8);
    if (!battle.first) { battle.first = i; return; }
    if (battle.first === i) return;
    var a = battle.cards[battle.first];
    var b = c;
    battle.lock = true;
    if (a.pair === b.pair) {
      a.matched = b.matched = true;
      battle.matched += 1;
      battle.combo += 1;
      if (battle.combo > S.stats.maxCombo) S.stats.maxCombo = battle.combo;
      var gain = Math.round(100 * battle.combo * battle.comboMul);
      battle.score += gain;
      playTone(780, 0.1, 'triangle');
      $('b-score').textContent = battle.score;
      $('b-pairs').textContent = battle.matched + '/' + battle.pairs;
      var comboEl = $('b-combo');
      comboEl.textContent = '連擊 x' + battle.combo;
      comboEl.classList.remove('pop'); void comboEl.offsetWidth; comboEl.classList.add('pop');
      qsa('.card').forEach(function (el, idx) {
        if (idx === battle.first || idx === i) el.classList.add('matched');
      });
      battle.first = null;
      battle.lock = false;
      if (battle.matched >= battle.pairs) endBattle(true);
    } else {
      battle.miss += 1;
      battle.combo = 0;
      $('b-miss').textContent = battle.miss;
      $('b-combo').textContent = '連擊 x0';
      playTone(180, 0.12, 'sawtooth');
      var fi = battle.first, si = i;
      setTimeout(function () {
        a.open = false; b.open = false;
        qsa('.card').forEach(function (el, idx) {
          if (idx === fi || idx === si) {
            el.classList.remove('open');
            el.classList.add('shake');
            setTimeout(function () { el.classList.remove('shake'); }, 350);
          }
        });
        battle.first = null;
        battle.lock = false;
      }, 650);
    }
  }

  function useSkill() {
    if (!battle || !battle.running || battle.skillUsed) return;
    var h = battle.heroine;
    if (h.skill === 'combo') return;
    battle.skillUsed = true;
    $('btn-skill').disabled = true;
    S.stats.skillsUsed += 1;
    var v = skillValue(h.skill, battle.skillLv);
    playTone(660, 0.15);
    vibe(20);
    if (h.skill === 'peek') {
      banner('魔眼窺視！');
      battle.cards.forEach(function (c) { if (!c.matched) c.open = true; });
      qsa('.card').forEach(function (el, idx) {
        if (!battle.cards[idx].matched) el.classList.add('open');
      });
      battle.lock = true;
      setTimeout(function () {
        battle.cards.forEach(function (c) { if (!c.matched) c.open = false; });
        qsa('.card').forEach(function (el, idx) {
          if (!battle.cards[idx].matched) el.classList.remove('open');
        });
        battle.first = null;
        battle.lock = false;
      }, v * 1000);
    } else if (h.skill === 'freeze') {
      battle.frozen = v;
      qs('.timebar').classList.add('frozen');
      banner('時間凍結 ' + v + ' 秒！');
    } else if (h.skill === 'time') {
      battle.timeLeft += v;
      battle.timeMax += v;
      updateTimeUI();
      banner('時間 +' + v + ' 秒！');
    } else if (h.skill === 'match') {
      var need = Math.min(v, battle.pairs - battle.matched);
      var unmatched = {};
      battle.cards.forEach(function (c, idx) {
        if (c.matched || c.open) return;
        if (!unmatched[c.pair]) unmatched[c.pair] = [];
        unmatched[c.pair].push(idx);
      });
      var done = 0;
      Object.keys(unmatched).forEach(function (pair) {
        if (done >= need) return;
        if (unmatched[pair].length >= 2) {
          var i1 = unmatched[pair][0], i2 = unmatched[pair][1];
          battle.cards[i1].matched = battle.cards[i1].open = true;
          battle.cards[i2].matched = battle.cards[i2].open = true;
          qsa('.card')[i1].classList.add('flipped', 'matched');
          qsa('.card')[i2].classList.add('flipped', 'matched');
          battle.matched += 1;
          battle.combo += 1;
          battle.score += Math.round(100 * battle.combo * battle.comboMul);
          done += 1;
        }
      });
      $('b-score').textContent = battle.score;
      $('b-pairs').textContent = battle.matched + '/' + battle.pairs;
      $('b-combo').textContent = '連擊 x' + battle.combo;
      banner('自動配對 ' + done + ' 組！');
      if (battle.matched >= battle.pairs) endBattle(true);
    }
    save();
  }

  function banner(text) {
    var el = $('b-banner');
    el.textContent = text;
    el.classList.remove('hidden');
    setTimeout(function () { el.classList.add('hidden'); }, 1200);
  }

  function endBattle(win) {
    if (!battle || !battle.running) return;
    battle.running = false;
    if (battle.timer) clearInterval(battle.timer);
    var timeBonus = win ? Math.floor(battle.timeLeft) * 10 : 0;
    var perfect = win && battle.miss === 0;
    var perfectBonus = perfect ? 500 : 0;
    var total = battle.score + timeBonus + perfectBonus;
    var xpGain = win ? (40 + battle.stage * 8 + (perfect ? 30 : 0)) : 10;
    var goldGain = win ? (30 + battle.stage * 5 + Math.floor(total / 50)) : 5;
    if (win) {
      S.stats.wins += 1;
      S.stats.clears += 1;
      S.totalClears = (S.totalClears || 0) + 1;
      if (perfect) S.stats.perfects += 1;
      S.stage += 1;
      if (S.stage > S.maxStage) S.maxStage = S.stage;
      S.bestStreak = Math.max(S.bestStreak || 0, S.streak);
    }
    S.gold += goldGain;
    S.stats.goldEarned += goldGain;
    var ups = addXp(xpGain);
    checkAchievements();
    // unlock available heroines by level+gold purchase happens in roster; auto-hint
    save();
    showResult(win, {
      score: battle.score, timeBonus: timeBonus, perfectBonus: perfectBonus, total: total,
      xp: xpGain, gold: goldGain, ups: ups, perfect: perfect, miss: battle.miss, combo: S.stats.maxCombo
    });
  }

  function showResult(win, r) {
    var box = $('r-box');
    box.innerHTML =
      '<h2 class="scr-title">' + (win ? '勝利' : '時間到') + '</h2>' +
      '<div class="result-score">' + r.total + '</div>' +
      '<div class="muted center">基礎 ' + r.score + ' · 時間獎 ' + r.timeBonus + (r.perfect ? ' · 完美 +500' : '') + '</div>' +
      '<div class="overlay-msg">經驗 +' + r.xp + '　金幣 +' + r.gold +
      (r.ups ? '<br>等級提升 ×' + r.ups + '！' : '') +
      (r.perfect ? '<br>✨ 完美通關' : '') + '</div>' +
      '<div class="btn-row">' +
      '<button class="btn secondary" id="r-home">回主畫面</button>' +
      (win ? '<button class="btn btn-gold" id="r-next">下一關</button>' : '<button class="btn btn-gold" id="r-retry">再試一次</button>') +
      '</div>';
    go('result');
    $('r-home').onclick = function () { go('home'); };
    if ($('r-next')) $('r-next').onclick = function () { startBattle(); };
    if ($('r-retry')) $('r-retry').onclick = function () { startBattle(); };
  }

  function renderRoster() {
    var list = $('roster-list');
    list.innerHTML = '';
    HEROINES.forEach(function (h) {
      var unlocked = !!S.unlocked[h.id];
      var canUnlock = !unlocked && S.lv >= h.reqLv && S.gold >= h.cost;
      var lv = S.skills[h.id] || 1;
      var card = document.createElement('div');
      card.className = 'roster-card' + (unlocked ? '' : ' locked') + (S.selected === h.id ? ' selected' : '');
      card.innerHTML =
        '<img src="assets/heroines/' + h.id + '.webp" alt="">' +
        '<div class="rc-body">' +
        '<div class="rc-title">' + h.title + '</div>' +
        '<div class="rc-name">' + h.name + '</div>' +
        '<div class="muted small">' + (unlocked ? skillDesc(h.skill, lv) + '（技等 ' + lv + '）' : '解鎖：Lv' + h.reqLv + (h.cost ? ' · ' + h.cost + ' 金' : ' · 免費')) + '</div>' +
        '<div class="rc-actions"></div></div>';
      var actions = qs('.rc-actions', card);
      if (!unlocked) {
        var b = document.createElement('button');
        b.className = 'btn btn-sm btn-gold';
        b.textContent = canUnlock ? '解鎖' : '未解鎖';
        b.disabled = !canUnlock;
        b.onclick = function () {
          if (S.gold < h.cost || S.lv < h.reqLv) return;
          S.gold -= h.cost;
          S.unlocked[h.id] = true;
          checkAchievements();
          save(); toast('解鎖 ' + h.name);
          renderRoster(); refreshTop();
        };
        actions.appendChild(b);
      } else {
        var sel = document.createElement('button');
        sel.className = 'btn btn-sm' + (S.selected === h.id ? ' btn-gold' : '');
        sel.textContent = S.selected === h.id ? '出戰中' : '選為出戰';
        sel.disabled = S.selected === h.id;
        sel.onclick = function () { S.selected = h.id; save(); renderRoster(); renderHome(); toast('出戰：' + h.name); };
        actions.appendChild(sel);
        if (lv < CONFIG.SKILL_MAX) {
          var cost = upgradeCost(lv);
          var up = document.createElement('button');
          up.className = 'btn btn-sm';
          up.textContent = '強化 ' + cost + '金';
          up.disabled = S.gold < cost;
          up.onclick = function () {
            if (S.gold < cost) return;
            S.gold -= cost;
            S.skills[h.id] = lv + 1;
            save(); toast(h.skillName + ' → Lv' + (lv + 1));
            renderRoster(); refreshTop();
          };
          actions.appendChild(up);
        }
      }
      list.appendChild(card);
    });
  }

  function renderAch() {
    var got = Object.keys(S.achievements).length;
    $('ach-summary').textContent = '已解鎖 ' + got + ' / ' + ACHIEVEMENTS.length;
    var list = $('ach-list');
    list.innerHTML = '';
    ACHIEVEMENTS.forEach(function (a) {
      var ok = !!S.achievements[a.id];
      var el = document.createElement('div');
      el.className = 'ach-item' + (ok ? '' : ' locked');
      el.innerHTML = '<div class="ico">' + a.icon + '</div><div><b>' + a.name + '</b><div class="muted small">' + a.desc + (ok ? '' : ' · 獎 ' + a.reward + '金') + '</div></div>';
      list.appendChild(el);
    });
  }

  function renderSettings() {
    $('set-sound').checked = !!S.sound;
    $('set-vibrate').checked = !!S.vibrate;
    $('set-stats').textContent = '勝 ' + S.stats.wins + ' · 完美 ' + S.stats.perfects + ' · 最高連擊 ' + S.stats.maxCombo;
  }

  function showPause() {
    var modal = $('modal');
    var card = $('modal-card');
    card.innerHTML = '<h3>暫停</h3><p class="muted center">戰鬥暫停中</p>' +
      '<button class="btn btn-gold btn-row-item" id="m-resume">繼續</button>' +
      '<button class="btn secondary" id="m-quit" style="margin-top:8px;width:100%">放棄回主畫面</button>';
    modal.classList.remove('hidden');
    if (battle) battle.running = false;
    $('m-resume').onclick = function () {
      modal.classList.add('hidden');
      if (battle) { battle.running = true; }
    };
    $('m-quit').onclick = function () {
      modal.classList.add('hidden');
      if (battle && battle.timer) clearInterval(battle.timer);
      battle = null;
      go('home');
    };
  }

  function bind() {
    qsa('#nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (battle && battle.running) return;
        go(b.getAttribute('data-go'));
      });
    });
    $('btn-fight').onclick = startBattle;
    $('btn-skill').onclick = useSkill;
    $('btn-pause').onclick = showPause;
    $('set-sound').onchange = function () { S.sound = $('set-sound').checked; save(); if (S.sound) playTone(600, 0.08); };
    $('set-vibrate').onchange = function () { S.vibrate = $('set-vibrate').checked; save(); };
    $('btn-reset').onclick = function () {
      if (!confirm('確定要重置所有進度嗎？')) return;
      S = defaultState();
      save();
      toast('進度已重置');
      go('home');
    };
  }

  function ensureCssExtras() {
    // soft fallbacks if CSS missing some classes used by JS-injected UI
    if (!document.getElementById('dyn-css')) {
      var s = document.createElement('style');
      s.id = 'dyn-css';
      s.textContent = '.toast{background:#2a1018ee;border:1px solid #e8c26a;color:#ffdf8e;padding:10px 14px;border-radius:999px;margin:6px;opacity:0;transition:opacity .2s;font-size:13px}.toast.show{opacity:1}#toasts{position:fixed;left:50%;bottom:calc(70px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:80;display:flex;flex-direction:column;align-items:center}.result-score{font-size:42px;text-align:center;color:#ffdf8e;font-weight:900;margin:8px 0}.roster-card{display:grid;grid-template-columns:88px 1fr;gap:10px;background:#2b1119;border:1px solid #e8c26a44;border-radius:14px;padding:10px;margin-bottom:10px}.roster-card img{width:88px;height:118px;object-fit:cover;border-radius:10px;border:1px solid #e8c26a66}.roster-card.locked{opacity:.55;filter:grayscale(.6)}.roster-card.selected{border-color:#e8c26a}.rc-name{font-weight:800;font-size:16px}.rc-title{color:#e8c26a;font-size:12px}.rc-actions{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.ach-item{display:flex;gap:10px;align-items:center;background:#2b1119;border:1px solid #e8c26a33;border-radius:12px;padding:10px;margin-bottom:8px}.ach-item.locked{opacity:.45;filter:grayscale(1)}.set-list{display:flex;flex-direction:column;gap:10px}.set-row{display:flex;justify-content:space-between;align-items:center;background:#2b1119;border:1px solid #e8c26a33;border-radius:12px;padding:12px}.modal{position:fixed;inset:0;background:#000a;display:flex;align-items:center;justify-content:center;z-index:90;padding:20px}.modal-card{background:#2b1119;border:1px solid #e8c26a;border-radius:16px;padding:18px;width:min(360px,100%)}.modal-card h3{text-align:center;color:#ffdf8e;margin-bottom:8px}.banner{position:absolute;left:50%;top:40%;transform:translate(-50%,-50%);background:#1a0a12ee;border:1px solid #e8c26a;color:#ffdf8e;padding:10px 16px;border-radius:12px;z-index:30;font-weight:800}.card.shake{animation:shake .35s}@keyframes shake{20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}}';
      document.head.appendChild(s);
    }
  }

  function init() {
    ensureCssExtras();
    bind();
    refreshTop();
    go('home');
    energyTimer = setInterval(function () { refreshTop(); }, 1000);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
