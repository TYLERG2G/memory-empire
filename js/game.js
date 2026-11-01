/* 記憶帝國：女傑翻牌 v3 — 主程式（狀態、存檔遷移、戰鬥、地圖、模式、商店、設定、模組橋接）
 *
 * 外部模組皆為「選用」，缺席或拋錯時自動退回內建備用實作：
 *   window.AudioEngine  音效／音樂     （js/audio.js）
 *   window.FX           特效／轉場     （js/fx.js）
 *   window.HeroineUI    女傑互動介面   （js/heroine.js）
 *   window.StoryUI / window.Story  章節劇情（js/story.js）
 *   window.CONTENT_ZH   繁中長文本     （js/content_zh.js）
 * 本檔對外提供 window.GameAPI（給 heroine.js / story.js 使用）與 ?debug=1 時的 window.__DEBUG。
 * 相容性：ES5 風格，不使用 optional chaining。
 */
(function () {
  'use strict';
  var D = window.GAME_DATA;
  if (!D) { if (window.console) console.error('[game] GAME_DATA missing'); return; }

  var HEROINES = D.HEROINES, ACHIEVEMENTS = D.ACHIEVEMENTS, CONFIG = D.CONFIG, SHOP = D.SHOP;
  var CHAPTERS = D.CHAPTERS, SPC = D.STAGES_PER_CHAPTER, CAMPAIGN_STAGES = D.CAMPAIGN_STAGES;
  var BOND_PTS_MAX = CONFIG.BOND_POINTS_MAX || 100, BOND_PER = CONFIG.BOND_PER_LEVEL || 20;
  var HIDS = HEROINES.map(function (h) { return h.id; });

  /* ════════════════ 小工具 ════════════════ */
  function $(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dateStr(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function todayStr() { return dateStr(new Date()); }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pick(arr) { return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }
  function setText(id, t) { var el = $(id); if (el) el.textContent = t; }
  function warn() { if (window.console && console.warn) console.warn.apply(console, arguments); }
  function hasFn(obj, name) { try { return !!obj && typeof obj[name] === 'function'; } catch (e) { return false; } }
  /** 依序嘗試 obj 上的方法名稱；成功回傳 {v}，全部不存在或拋錯回傳 null */
  function tryCall(obj, names, args) {
    if (!obj) return null;
    for (var i = 0; i < names.length; i++) {
      if (hasFn(obj, names[i])) {
        try { return { v: obj[names[i]].apply(obj, args || []) }; }
        catch (e) { warn('[game] ' + names[i] + ' failed', e); return null; }
      }
    }
    return null;
  }
  function CZ() { return window.CONTENT_ZH || null; }
  function czGet(path) {
    var o = CZ();
    for (var i = 0; o && i < path.length; i++) o = o[path[i]];
    return o === undefined ? null : o;
  }

  /* ════════════════ 存檔：預設、遷移、正規化 ════════════════ */
  function idMap(val) { var o = {}; HIDS.forEach(function (id) { o[id] = typeof val === 'function' ? val(id) : val; }); return o; }

  function defaultState() {
    return {
      v: 3,
      lv: 1, xp: 0, gold: 0,
      energy: CONFIG.ENERGY_MAX, energyMax: CONFIG.ENERGY_MAX, lastEnergyAt: Date.now(),
      stage: 1, maxStage: 1, stars: {},
      streak: 0, lastPlayDate: '',
      unlocked: { verda: true }, selected: 'verda',
      skills: idMap(1), skillCd: idMap(0),
      bond: idMap(0),                 // 好感點數 0–100
      outfit: idMap('default'), outfitsOwned: {}, fav: {},
      inv: {}, relics: {}, events: {}, seenIntro: {}, scenesSeen: {},
      daily: { date: '', done: false, best: 0 }, dayCounters: { date: '', talk: {}, tap: {}, gift: {} },
      leaderboard: [],
      achievements: {},
      settings: { sfx: true, bgm: true, sfxVol: CONFIG.DEFAULT_SFX_VOL, bgmVol: CONFIG.DEFAULT_BGM_VOL, vibrate: true, shake: true },
      stats: { wins: 0, losses: 0, plays: 0, perfects: 0, maxCombo: 0, skillsUsed: 0, goldEarned: 0, bestStreak: 0,
        clears: 0, bossWins: 0, dailyWins: 0, endlessBestRound: 0, endlessBest: 0, purchases: 0, giftsGiven: 0 },
      training: (window.Training && Training.defaultTrainState) ? Training.defaultTrainState() : { load: 0, goodStreak: 0, badStreak: 0, sessionsToday: 0, trainDate: '', trainStreak: 0, lastTrainDate: '', history: [] },
      potionBuff: false
    };
  }

  function mergeMap(base, src, validate) {
    if (!src || typeof src !== 'object') return base;
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) {
      if (!validate || validate(k, src[k])) base[k] = src[k];
    }
    return base;
  }
  function outfitExists(id) { return D.OUTFITS.some(function (o) { return o.id === id; }); }

  /** 舊版（v1/v2）存檔 → v3 */
  function migrate(old) {
    var s = defaultState();
    ['lv', 'xp', 'gold', 'energy', 'energyMax', 'lastEnergyAt', 'stage', 'maxStage', 'streak'].forEach(function (k) {
      if (isNum(old[k])) s[k] = old[k];
    });
    if (typeof old.lastPlayDate === 'string') s.lastPlayDate = old.lastPlayDate;
    if (typeof old.selected === 'string' && HIDS.indexOf(old.selected) !== -1) s.selected = old.selected;
    mergeMap(s.unlocked, old.unlocked, function (k) { return HIDS.indexOf(k) !== -1; });
    mergeMap(s.skills, old.skills, function (k, v) { return HIDS.indexOf(k) !== -1 && isNum(v); });
    mergeMap(s.outfit, old.outfit, function (k, v) { return HIDS.indexOf(k) !== -1 && outfitExists(v); });
    // v2 好感為 0–5 心 → v3 點數
    HIDS.forEach(function (id) {
      var b = old.bond ? old.bond[id] : 0;
      if (isNum(b)) s.bond[id] = b <= CONFIG.BOND_MAX ? b * BOND_PER : b;
    });
    mergeMap(s.achievements, old.achievements, function (k) { return ACHIEVEMENTS.some(function (a) { return a.id === k; }); });
    mergeMap(s.stats, old.stats, function (k, v) { return isNum(v); });
    if (isNum(old.bestStreak)) s.stats.bestStreak = Math.max(s.stats.bestStreak, old.bestStreak);
    s.settings.vibrate = old.vibrate !== false;
    // v2 預設靜音的陷阱：遷移後一律開啟 SFX + BGM
    s.settings.sfx = true; s.settings.bgm = true;
    s.migratedFrom = old.v || 'v2';
    return s;
  }

  function normalize(raw) {
    var s = defaultState();
    for (var k in raw) if (Object.prototype.hasOwnProperty.call(raw, k)) {
      var dv = s[k], rv = raw[k];
      if (dv && typeof dv === 'object' && !Array.isArray(dv) && rv && typeof rv === 'object' && !Array.isArray(rv)) s[k] = mergeMap(dv, rv);
      else if (rv !== undefined && rv !== null) s[k] = rv;
    }
    s.v = 3;
    s.unlocked.verda = true;
    if (HIDS.indexOf(s.selected) === -1 || !s.unlocked[s.selected]) s.selected = 'verda';
    if (!Array.isArray(s.leaderboard)) s.leaderboard = [];
    s.maxStage = clamp(s.maxStage | 0 || 1, 1, CAMPAIGN_STAGES + 1);
    s.stage = clamp(s.stage | 0 || 1, 1, Math.min(s.maxStage, CAMPAIGN_STAGES));
    s.energy = clamp(isNum(s.energy) ? s.energy : CONFIG.ENERGY_MAX, 0, 999);
    HIDS.forEach(function (id) {
      s.bond[id] = clamp(+s.bond[id] || 0, 0, BOND_PTS_MAX);
      s.skills[id] = clamp(s.skills[id] | 0 || 1, 1, CONFIG.SKILL_MAX);
      s.skillCd[id] = clamp(s.skillCd[id] | 0, 0, CONFIG.CD_MAX);
    });
    ['sfxVol', 'bgmVol'].forEach(function (k) { if (!isNum(s.settings[k])) s.settings[k] = defaultState().settings[k]; s.settings[k] = clamp(s.settings[k], 0, 1); });
    if (window.Training && Training.ensureTrain) Training.ensureTrain(s);
    if (typeof s.potionBuff !== 'boolean') s.potionBuff = false;
    return s;
  }

  function load() {
    var raw = null;
    try { raw = localStorage.getItem(CONFIG.SAVE_KEY); } catch (e) { return defaultState(); }
    if (raw) {
      try { return normalize(JSON.parse(raw)); } catch (e) { warn('[game] v3 save corrupt', e); }
    }
    var olds = CONFIG.OLD_KEYS || ['memoryRPG_v2', 'memoryRPG_v1'];
    for (var i = 0; i < olds.length; i++) {
      try {
        var o = localStorage.getItem(olds[i]);
        if (o) { var m = normalize(migrate(JSON.parse(o))); m.migratedFrom = olds[i]; return m; }
      } catch (e) { warn('[game] migrate failed ' + olds[i], e); }
    }
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(S)); } catch (e) {}
    emit('game:state', null);
  }
  function emit(name, detail) {
    try { document.dispatchEvent(new CustomEvent(name, { detail: detail })); } catch (e) {}
  }

  var S = load();
  if (S.migratedFrom) { try { localStorage.setItem(CONFIG.SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
  var battle = null;
  function BS() { return window.BattleStage || null; }
  function bsCall(name, arg) {
    var b = BS();
    if (!b || typeof b[name] !== 'function') return;
    try { b[name](arg); } catch (err) { if (window.console) console.warn('[BattleStage]', name, err); }
  }

  var galleryId = null;
  var currentScreen = 'home';
  var started = false;

  function heroine(id) {
    for (var i = 0; i < HEROINES.length; i++) if (HEROINES[i].id === id) return HEROINES[i];
    return HEROINES[0];
  }
  function bondLv(id) { return D.bondLevel(S.bond[id] || 0); }

  /** 每日計數器（交談／觸碰／贈禮上限）跨日重置 */
  function day() {
    var t = todayStr();
    if (S.dayCounters.date !== t) S.dayCounters = { date: t, talk: {}, tap: {}, gift: {} };
    return S.dayCounters;
  }

  /* ════════════════ 音效橋接 ════════════════ */
  var fbAudio = { ctx: null, bgmTimer: null, step: 0, gesture: false };
  function AE() { return window.AudioEngine || null; }
  function fbCtx() {
    if (fbAudio.ctx) return fbAudio.ctx;
    if (!fbAudio.gesture) return null; // 未有使用者手勢前不建立 AudioContext（iOS / Chrome 自動播放政策）
    var C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    try { fbAudio.ctx = new C(); } catch (e) { return null; }
    return fbAudio.ctx;
  }
  var FB_TONES = {
    flip: [[520, 0.05, 'triangle']], tap: [[700, 0.04, 'sine']],
    match: [[660, 0.08, 'triangle'], [990, 0.12, 'triangle', 0.07]],
    mismatch: [[200, 0.14, 'sawtooth']], fail: [[300, 0.2, 'sawtooth'], [220, 0.3, 'sawtooth', 0.18]],
    skill: [[440, 0.1, 'sine'], [880, 0.2, 'sine', 0.08]], combo: [[880, 0.08, 'square']],
    clear: [[523, 0.12, 'triangle'], [659, 0.12, 'triangle', 0.12], [784, 0.3, 'triangle', 0.24]],
    levelup: [[784, 0.1, 'triangle'], [1047, 0.25, 'triangle', 0.1]],
    chime: [[1175, 0.2, 'sine']], gift: [[880, 0.1, 'sine'], [1320, 0.2, 'sine', 0.1]],
    bond: [[660, 0.12, 'sine'], [880, 0.2, 'sine', 0.12]], boss: [[110, 0.5, 'sawtooth'], [104, 0.6, 'sawtooth', 0.1]],
    star: [[1320, 0.1, 'triangle']], buy: [[990, 0.08, 'square']], joker: [[150, 0.3, 'square']]
  };
  function fbTone(freq, dur, type, delay, vol) {
    var ctx = fbCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime + (delay || 0);
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function fbSfx(name, opts) {
    var list = FB_TONES[name] || FB_TONES.tap;
    var vol = 0.12 * S.settings.sfxVol;
    var mul = name === 'combo' && opts && isNum(opts.combo) ? Math.pow(1.06, Math.min(opts.combo, 16)) : 1;
    list.forEach(function (t) { fbTone(t[0] * mul, t[1], t[2], t[3] || 0, vol); });
  }
  var FB_BGM = [220, 261.6, 329.6, 293.7, 196, 246.9, 293.7, 261.6];
  function fbBgmStart() {
    if (fbAudio.bgmTimer || !fbCtx()) return;
    fbAudio.bgmTimer = setInterval(function () {
      if (!S.settings.bgm) return;
      var f = FB_BGM[fbAudio.step++ % FB_BGM.length];
      var v = 0.035 * S.settings.bgmVol * (fbAudio.ducked ? 0.35 : 1);
      fbTone(f, 1.6, 'sine', 0, v); fbTone(f / 2, 1.8, 'triangle', 0, v * 0.6);
    }, 900);
  }
  function fbBgmStop() { if (fbAudio.bgmTimer) { clearInterval(fbAudio.bgmTimer); fbAudio.bgmTimer = null; } }

  var Snd = {
    applySettings: function () {
      var st = S.settings, e = AE();
      if (!e) return;
      var r = tryCall(e, ['applySettings', 'configure', 'setSettings'], [{ sfx: st.sfx, bgm: st.bgm, sfxVol: st.sfxVol, bgmVol: st.bgmVol, sfxEnabled: st.sfx, bgmEnabled: st.bgm, sfxVolume: st.sfxVol, bgmVolume: st.bgmVol }]);
      if (r) return;
      tryCall(e, ['setSfxEnabled', 'enableSfx'], [st.sfx]);
      tryCall(e, ['setBgmEnabled', 'enableBgm'], [st.bgm]);
      tryCall(e, ['setSfxVolume'], [st.sfxVol]);
      tryCall(e, ['setBgmVolume'], [st.bgmVol]);
    },
    unlock: function () {
      fbAudio.gesture = true;
      var e = AE();
      if (e) tryCall(e, ['unlock', 'resume', 'init'], []);
      var c = fbAudio.ctx;
      if (c && c.state === 'suspended' && c.resume) { try { c.resume(); } catch (err) {} }
    },
    play: function (name, opts) {
      if (!S.settings.sfx) return;
      var e = AE();
      if (e && tryCall(e, ['play', 'sfx', 'playSfx'], [name, opts || {}])) return;
      fbSfx(name, opts);
    },
    bgm: function (track) {
      if (!S.settings.bgm) { Snd.stopBgm(); return; }
      var e = AE();
      if (e && tryCall(e, ['playBgm', 'startBgm', 'bgm'], [track || 'main'])) return;
      if (!e) fbBgmStart();
    },
    stopBgm: function () {
      var e = AE();
      if (e) tryCall(e, ['stopBgm'], []);
      fbBgmStop();
    },
    duck: function (on) {
      fbAudio.ducked = !!on;
      var e = AE();
      if (e) tryCall(e, on ? ['duck'] : ['unduck', 'duck'], on ? [true] : [false]);
    },
    test: function () {
      var names = Object.keys(FB_TONES), i = 0;
      var t = setInterval(function () { if (i >= names.length) { clearInterval(t); return; } Snd.play(names[i++], { combo: i }); }, 350);
      return names;
    }
  };
  function vibe(pattern) {
    if (!S.settings.vibrate || !navigator.vibrate || !fbAudio.gesture) return;
    try { navigator.vibrate(pattern); } catch (e) {}
  }

  /* ════════════════ 特效橋接（FX 缺席時使用 fx.css 類別） ════════════════ */
  function fxLayer() {
    var l = $('fx-layer-fallback');
    if (!l) { l = document.createElement('div'); l.id = 'fx-layer-fallback'; l.className = 'fx-layer'; document.body.appendChild(l); }
    return l;
  }
  function centerOf(el) {
    if (!el || !el.getBoundingClientRect) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    var r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function transient(cls, x, y, html, ms) {
    var el = document.createElement('div');
    el.className = cls;
    if (isNum(x)) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
    if (html !== null && html !== undefined) el.innerHTML = html;
    fxLayer().appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, ms || 900);
    return el;
  }
  var Fx = {
    burst: function (el, kind) {
      var p = centerOf(el);
      if (tryCall(window.FX, ['burst', 'matchBurst', 'particles'], [p.x, p.y, { kind: kind || 'match', el: el }])) return;
      var n = kind === 'clear' ? 22 : 10;
      for (var i = 0; i < n; i++) {
        (function () {
          var d = document.createElement('div');
          d.className = 'v3-particle';
          d.style.position = 'fixed';
          d.style.left = p.x + 'px'; d.style.top = p.y + 'px';
          if (kind === 'miss') d.style.background = '#ff3a5a';
          fxLayer().appendChild(d);
          var a = Math.random() * Math.PI * 2, r = 30 + Math.random() * (kind === 'clear' ? 140 : 60);
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              d.style.transform = 'translate(' + Math.cos(a) * r + 'px,' + Math.sin(a) * r + 'px) scale(.3)';
              d.style.opacity = '0';
            });
          });
          setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 800);
        })();
      }
    },
    pulse: function (el) {
      if (!el) return;
      if (tryCall(window.FX, ['cardPulse', 'pulse'], [el])) return;
      el.classList.remove('fx-card-pulse'); void el.offsetWidth; el.classList.add('fx-card-pulse');
      setTimeout(function () { el.classList.remove('fx-card-pulse'); }, 600);
    },
    shake: function (el, strength) {
      if (!S.settings.shake) return;
      el = el || $('app');
      if (tryCall(window.FX, ['shake'], [el, strength || 'sm'])) return;
      el.classList.remove('v3-shake'); void el.offsetWidth; el.classList.add('v3-shake');
      setTimeout(function () { el.classList.remove('v3-shake'); }, 380);
    },
    combo: function (n) {
      if (tryCall(window.FX, ['comboPop', 'combo'], [n])) return;
      var tier = n >= 10 ? 'tier-max' : n >= 6 ? 'tier-3' : n >= 3 ? 'tier-2' : '';
      transient('fx-combo-pop ' + tier, window.innerWidth / 2, window.innerHeight * 0.38, esc(n + ' 連擊！'), 900);
    },
    floatText: function (el, text, tone) {
      var p = centerOf(el);
      if (tryCall(window.FX, ['floatText'], [p.x, p.y, text, tone])) return;
      transient('fx-float-text' + (tone ? ' is-' + tone : ''), p.x, p.y, esc(text), 900);
    },
    flash: function (tone) {
      if (tryCall(window.FX, ['flash', 'vignette'], [tone || 'gold'])) return;
      transient('fx-vignette-flash is-' + (tone || 'gold'), null, null, '', 600);
    },
    transition: function (kind) {
      if (tryCall(window.FX, ['transition', 'veil'], [kind || ''])) return;
      transient('fx-transition-veil' + (kind ? ' is-' + kind : ''), null, null, '', 400);
    }
  };

  /* ════════════════ 共用 UI ════════════════ */
  /* ════════════════ Toast 佇列（UI v4：一次 1 則） ════════════════ */
  var ICON_PREFIX = [
    // [emoji 前綴, icon id, 樣式 class]
    ['🏆', 'trophy', 't-ach'], ['💗', 'heart', 't-bond'], ['💖', 'heart', 't-bond'],
    ['🎁', 'gift', 't-bond'], ['👘', 'gallery', 't-unlock'], ['👑', 'roster', 't-unlock'],
    ['★', 'star', ''], ['⚡', 'energy', 't-warn'], ['🪙', 'gold', '']
  ];
  var TOAST_CFG = { dur: 2200, durLong: 3000, shortenTo: 600, gap: 120, max: 5, mergeMs: 1500 };
  var toastQ = [];          // 待顯示：{ msg, icon, cls, prio, dur, n }
  var toastCur = null;      // 顯示中：{ item, el, timer, endAt, shownAt, remain }

  function icoHTML(id, cls) {
    return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#ico-' + id + '"></use></svg>';
  }
  function itemIco(it, cls) {
    var fn = (D && D.itemIconHTML) || (window.GAME_DATA && window.GAME_DATA.itemIconHTML);
    return fn ? fn(it, cls) : (it && it.icon ? it.icon : '');
  }

  function toastNormalize(msg, opts) {
    msg = String(msg == null ? '' : msg);
    opts = opts || {};
    var icon = opts.icon || null, cls = opts.cls || '';
    for (var i = 0; i < ICON_PREFIX.length; i++) {
      var p = ICON_PREFIX[i];
      if (msg.indexOf(p[0]) === 0) {
        msg = msg.slice(p[0].length).replace(/^[\s️]+/, '');
        icon = icon || p[1]; cls = cls || p[2];
        break;
      }
    }
    var prio = opts.prio || (cls === 't-ach' || cls === 't-unlock' ? 'high' : 'normal');
    var dur = opts.dur || (msg.length > 18 || prio === 'high' ? TOAST_CFG.durLong : TOAST_CFG.dur);
    return { msg: msg, icon: icon, cls: cls, prio: prio, dur: dur, n: 1 };
  }

  function toast(msg, opts) {
    var item = toastNormalize(msg, opts);
    if (!item.msg) return;
    var now = Date.now();
    // 1) 與顯示中的那則相同：合併並延長
    if (toastCur && !toastCur.leaving && toastCur.item.msg === item.msg && now - toastCur.shownAt < TOAST_CFG.mergeMs) {
      toastCur.item.n++; toastPaintCount(toastCur);
      toastArm(toastCur, Math.max(toastCur.endAt - now, 900));
      return;
    }
    // 2) 與佇列中某則相同：合併
    for (var i = 0; i < toastQ.length; i++) {
      if (toastQ[i].msg === item.msg) { toastQ[i].n++; return; }
    }
    // 3) 入列（high 插到所有 high 之後、normal 之前）
    if (item.prio === 'high') {
      var at = 0; while (at < toastQ.length && toastQ[at].prio === 'high') at++;
      toastQ.splice(at, 0, item);
    } else toastQ.push(item);
    // 4) 超過上限時丟掉最舊的非 high
    while (toastQ.length > TOAST_CFG.max) {
      var drop = -1;
      for (var j = 0; j < toastQ.length; j++) if (toastQ[j].prio !== 'high') { drop = j; break; }
      toastQ.splice(drop === -1 ? toastQ.length - 1 : drop, 1);
    }
    // 5) 有 high 在排隊時，縮短目前這則（不打斷）
    if (toastCur && !toastCur.leaving && item.prio === 'high' && toastCur.item.prio !== 'high') {
      toastArm(toastCur, Math.min(toastCur.endAt - now, TOAST_CFG.shortenTo));
    }
    toastPump();
  }

  function toastPump() {
    if (toastCur || !toastQ.length) return;
    var box = $('toasts'); if (!box) { toastQ.length = 0; return; }
    var item = toastQ.shift();
    var el = document.createElement('div');
    el.className = 'toast' + (item.cls ? ' ' + item.cls : '');
    el.style.pointerEvents = 'auto';
    var txt = document.createElement('span');
    txt.className = 't-msg'; txt.textContent = item.msg;          // 文字一律 textContent，避免 XSS
    if (item.icon) el.insertAdjacentHTML('afterbegin', icoHTML(item.icon));
    el.appendChild(txt);
    box.appendChild(el);
    var cur = toastCur = { item: item, el: el, timer: 0, endAt: 0, shownAt: Date.now(), remain: 0 };
    toastPaintCount(cur);
    el.addEventListener('click', function () { if (toastCur === cur) toastDismiss(cur); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
    if (document.hidden) cur.remain = item.dur;                     // 背景中：回前景再開始計時
    else toastArm(cur, item.dur);
  }

  function toastArm(cur, ms) {
    clearTimeout(cur.timer);
    ms = Math.max(0, ms | 0);
    if (document.hidden) {
      cur.remain = ms;
      cur.endAt = Date.now() + ms;
      cur.timer = 0;
      return;
    }
    cur.remain = 0;
    cur.endAt = Date.now() + ms;
    cur.timer = setTimeout(function () { toastDismiss(cur); }, ms);
  }

  function toastPaintCount(cur) {
    var b = cur.el.querySelector('.t-more');
    if (cur.item.n < 2) { if (b) b.parentNode.removeChild(b); return; }
    if (!b) { b = document.createElement('span'); b.className = 't-more'; cur.el.appendChild(b); }
    b.textContent = '×' + cur.item.n;
  }

  function toastDismiss(cur) {
    if (!cur || cur.leaving) return;
    cur.leaving = true;
    clearTimeout(cur.timer);
    cur.el.classList.remove('show'); cur.el.classList.add('leave');
    var done = false;
    function fin() {
      if (done) return; done = true;
      if (cur.el.parentNode) cur.el.parentNode.removeChild(cur.el);
      if (toastCur === cur) toastCur = null;
      setTimeout(toastPump, TOAST_CFG.gap);
    }
    cur.el.addEventListener('transitionend', fin, { once: true });
    setTimeout(fin, 320);   // reduced-motion 或 transitionend 未觸發時的保險
  }

  function toastClear() {   // 例如重置進度時呼叫
    toastQ.length = 0;
    if (toastCur) toastDismiss(toastCur);
  }

  document.addEventListener('visibilitychange', function () {
    var cur = toastCur; if (!cur || cur.leaving) return;
    if (document.hidden) {
      if (cur.endAt) cur.remain = Math.max(0, cur.endAt - Date.now());
      clearTimeout(cur.timer);
    } else toastArm(cur, Math.max(cur.remain || 0, 1200));
  });
  var modalOnClose = null;
  function openModal(html, onClose) {
    $('modal-card').innerHTML = html;
    $('modal').classList.remove('hidden');
    modalOnClose = onClose || null;
  }
  function closeModal() {
    $('modal').classList.add('hidden');
    var cb = modalOnClose; modalOnClose = null;
    if (cb) cb();
  }
  function bindModalBtn(id, fn) { var b = $(id); if (b) b.onclick = function () { Snd.play('tap'); fn(); }; }

  function heartsHTML(points) {
    var lv = D.bondLevel(points), html = '';
    for (var i = 1; i <= CONFIG.BOND_MAX; i++) html += '<span class="bond-heart' + (i <= lv ? ' on' : '') + '">♥</span>';
    return html;
  }
  function starsText(n) { var s = ''; for (var i = 0; i < 3; i++) s += i < n ? '★' : '☆'; return s; }
  function outfitClass(id) { return 'outfit-' + (S.outfit[id] || 'default'); }

  /* ════════════════ 體力、經驗、成就、好感 ════════════════ */
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
    var left = Math.max(0, CONFIG.ENERGY_REGEN_MS - (Date.now() - S.lastEnergyAt));
    var s = Math.ceil(left / 1000);
    return Math.floor(s / 60) + ':' + pad2(s % 60);
  }
  function spendEnergy(n) {
    /* 工作記憶訓練：體力不再阻擋出戰 */
    regenEnergy();
    return true;
  }
  function updateStreakOnPlay() {
    var t = todayStr();
    if (S.lastPlayDate === t) return;
    var y = new Date(); y.setDate(y.getDate() - 1);
    S.streak = S.lastPlayDate === dateStr(y) ? S.streak + 1 : 1;
    S.lastPlayDate = t;
    if (S.streak > S.stats.bestStreak) S.stats.bestStreak = S.streak;
  }
  function addGold(n) {
    n = Math.max(0, Math.round(n));
    S.gold += n; S.stats.goldEarned += n;
    return n;
  }
  function addXp(n) {
    S.xp += n;
    var ups = 0;
    while (S.xp >= D.xpNeed(S.lv)) {
      S.xp -= D.xpNeed(S.lv);
      S.lv += 1; ups += 1;
      addGold(50);
      if (S.lv % 5 === 0) { S.energyMax = Math.min(20, S.energyMax + 1); }
    }
    if (ups) { S.energy = Math.max(S.energy, S.energyMax); Snd.play('levelup'); }
    return ups;
  }
  function checkAchievements() {
    ACHIEVEMENTS.forEach(function (a) {
      if (S.achievements[a.id]) return;
      var ok = false;
      try { ok = !!a.check(S); } catch (e) {}
      if (ok) {
        S.achievements[a.id] = true;
        addGold(a.reward || 0);
        toast('🏆 成就解鎖：' + a.name + ' +' + (a.reward || 0) + ' 金');
      }
    });
  }
  /** 增加好感點數；回傳實際增加量。升心時播音效與提示。 */
  function addBond(id, pts, silent) {
    if (HIDS.indexOf(id) === -1) return 0;
    var before = S.bond[id] || 0;
    var after = clamp(before + (pts || 0), 0, BOND_PTS_MAX);
    if (after === before) return 0;
    var lv0 = D.bondLevel(before);
    S.bond[id] = after;
    var lv1 = D.bondLevel(after);
    if (lv1 > lv0) {
      Snd.play('bond'); vibe([20, 40, 20]);
      if (!silent) toast('💗 ' + heroine(id).name + ' 好感提升至 ' + lv1 + ' 心');
      emit('game:bondup', { id: id, level: lv1 });
    }
    checkAchievements();
    save();
    emit('game:bond', { id: id, points: after, delta: after - before });
    return after - before;
  }

  /* ════════════════ 導覽 ════════════════ */
  var NAV_SCREENS = ['home', 'map', 'roster', 'shop', 'ach'];
  function go(name, opts) {
    opts = opts || {};
    var scr = $('scr-' + name);
    if (!scr) { warn('[game] no screen ' + name); return; }
    var prev = currentScreen;
    qsa('.screen').forEach(function (el) { el.classList.remove('active', 'fx-screen-enter', 'fx-screen-enter-right', 'fx-screen-enter-left', 'fx-screen-enter-zoom'); });
    scr.classList.add('active');
    var pi = NAV_SCREENS.indexOf(prev), ni = NAV_SCREENS.indexOf(name);
    var enter = name === 'battle' || name === 'result' ? 'fx-screen-enter-zoom' : (pi !== -1 && ni !== -1 && ni !== pi ? (ni > pi ? 'fx-screen-enter-right' : 'fx-screen-enter-left') : 'fx-screen-enter');
    void scr.offsetWidth; scr.classList.add(enter);
    if (opts.veil) Fx.transition(opts.veil);
    currentScreen = name;
    qsa('#nav button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-go') === name); });
    document.body.classList.toggle('no-nav', name === 'battle' || name === 'result');
    if (name === 'home') renderHome();
    else if (name === 'map') renderMap();
    else if (name === 'roster') renderRoster();
    else if (name === 'shop') renderShop();
    else if (name === 'ach') renderAch();
    else if (name === 'settings') renderSettings();
    refreshTop();
    emit('game:screen', { name: name });
  }

  function refreshTop() {
    regenEnergy();
    setText('tb-lv', S.lv);
    var need = D.xpNeed(S.lv);
    var xp = $('tb-xp'); if (xp) xp.style.width = Math.min(100, (S.xp / need) * 100) + '%';
    setText('tb-gold', S.gold);
    setText('tb-energy', S.energy);
    setText('tb-emax', S.energyMax);
    var energyEl = qs('.res-energy');
    if (energyEl) energyEl.classList.add('is-hidden'); // 訓練模式隱藏體力
    var eta = energyEta();
    setText('tb-etimer', eta ? ' +' + eta : '');
    var m = $('tb-mute');
    if (m) {
      var soundOn = !!(S.settings.sfx || S.settings.bgm);
      var u = m.querySelector('use');
      if (u) u.setAttribute('href', soundOn ? '#ico-sound-on' : '#ico-sound-off');   // 勿用 textContent，會清掉 svg
      else m.textContent = soundOn ? '🔊' : '🔇';   // sprite 缺席時的後備
      m.classList.toggle('is-off', !soundOn);
    }
  }

  /* ════════════════ 主城 ════════════════ */
  function timeSlot() {
    var h = new Date().getHours();
    return h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'afternoon' : h >= 17 && h < 21 ? 'evening' : 'night';
  }
  var SLOT_LABEL = { morning: '晨', afternoon: '午', evening: '晚', night: '夜' };
  function greetingFor(id) {
    var slot = timeSlot();
    var line = pick(czGet(['greetings', id, slot]));
    if (!line) line = pick((heroine(id).lines || {})[D.bondTier(bondLv(id))]) || '……';
    return '〔' + SLOT_LABEL[slot] + '〕' + line;
  }
  function stageLabel(n) {
    var c = D.stageConfig(n);
    var ch = CHAPTERS[c.chapter - 1];
    return { cfg: c, chapter: ch, text: (ch ? '第' + ch.id + '章・' + ch.name : '') };
  }
  function renderHome() {
    var h = heroine(S.selected);
    var img = $('home-hero-img');
    if (img) {
      img.src = 'assets/heroines/' + h.id + '.webp';
      img.className = 'breathe ' + outfitClass(h.id);
    }
    setText('home-hero-title', h.title);
    setText('home-hero-name', h.name);
    var lv = S.skills[h.id] || 1;
    setText('home-hero-skill', h.skillName + '：' + D.skillDesc(h.skill, lv) + ' · 好感 ' + bondLv(h.id) + '/' + CONFIG.BOND_MAX + '♥');
    var g = $('home-greet');
    if (g && (!g.textContent || g.getAttribute('data-hero') !== h.id)) { g.textContent = greetingFor(h.id); g.setAttribute('data-hero', h.id); }
    var done = S.maxStage > CAMPAIGN_STAGES;
    var n = Math.min(S.stage, CAMPAIGN_STAGES);
    var L = stageLabel(n), c = L.cfg;
    setText('home-chapter', L.text);
    setText('home-stage', n);
    var boardPrev = adaptiveBoardFor(n);
    var cShow = boardPrev ? D.stageConfig(n, { board: boardPrev }) : c;
    setText('home-stage-detail', cShow.cols + '×' + cShow.rows + ' · ' + cShow.sets + ' 組' + (cShow.setSize === 3 ? '（三張一組）' : '') + ' · 限時 ' + cShow.time + ' 秒 · 失誤上限 ' + cShow.missLimit +
      ' · 負荷 Lv.' + ((S.training && S.training.load) || 0) +
      (cShow.boss ? ' · ♛ 頭目：' + (cShow.bossName || '') + '（' + (D.bossMech(cShow.boss) || {}).name + '）' : '') + (done ? ' · 戰役已全破' : ''));
    setText('home-streak', S.streak);
    setText('home-stars', totalStars());
    var fight = $('btn-fight');
    if (fight) fight.disabled = false;
    var d = S.daily.date === todayStr() && S.daily.done;
    var load = (S.training && S.training.load) || 0;
    setText('daily-sub', d ? '今日已完成' : '今日未完成 · 訓練負荷 ' + load);
    setText('endless-sub', '訓練負荷 ' + load + ' · 最佳第 ' + (S.stats.endlessBestRound || 0) + ' 輪');
    renderTrainHome();
  }
  function renderTrainHome() {
    var panel = $('home-train-panel');
    if (!panel) return;
    var sum = null;
    try {
      if (window.Training && typeof Training.summary === 'function') sum = Training.summary(S);
      else if (window.GameAPI && typeof GameAPI.trainingSummary === 'function') sum = GameAPI.trainingSummary();
    } catch (e) { sum = null; }
    if (!sum) { panel.hidden = true; return; }
    panel.hidden = false;
    setText('train-streak', sum.streak || 0);
    setText('train-load', sum.load || 0);
    var sub = $('train-cta-sub');
    if (sub) {
      var sess = sum.sessionsToday || 0;
      var span = (sum.avgSpan7 != null && isFinite(sum.avgSpan7)) ? ('跨度 ' + (Math.round(sum.avgSpan7 * 10) / 10)) : '建立你的記憶基線';
      sub.textContent = '今日 ' + sess + ' 場 · 負荷 Lv.' + (sum.load || 0) + ' · ' + span;
    }
    var svg = $('train-span-svg');
    if (svg) {
      var trend = (sum.spanTrend || []).filter(function (p) { return p && p.span != null && isFinite(p.span); }).slice(-7);
      if (trend.length < 2) {
        svg.innerHTML = '<polyline fill="none" stroke="#c9b8d8" stroke-width="2" points="4,28 116,28" /><circle cx="60" cy="28" r="3" fill="#9a6fc4" />';
      } else {
        var vals = trend.map(function (p) { return +p.span; });
        var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
        if (hi <= lo) { hi = lo + 1; }
        var pts = vals.map(function (v, i) {
          var x = 4 + i * (112 / Math.max(1, vals.length - 1));
          var y = 32 - ((v - lo) / (hi - lo)) * 26;
          return x.toFixed(1) + ',' + y.toFixed(1);
        }).join(' ');
        svg.innerHTML = '<polyline fill="none" stroke="#9a6fc4" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="' + pts + '" />';
      }
    }
  }
  function totalStars() { var t = 0; for (var k in S.stars) t += S.stars[k] || 0; return t; }

  /* ════════════════ 地圖 ════════════════ */
  function renderMap() {
    var list = $('map-list'); if (!list) return;
    var html = '';
    CHAPTERS.forEach(function (ch, ci) {
      var first = ci * SPC + 1;
      var locked = first > S.maxStage;
      var got = 0;
      for (var i = 0; i < SPC; i++) got += S.stars[first + i] || 0;
      html += '<div class="chapter' + (locked ? ' locked' : '') + '"><div class="chapter-head"><b>第' + ch.id + '章・' + esc(ch.name) + '</b><small>' + esc(ch.sub) + ' · ★' + got + '/' + SPC * 3 +
        (locked ? '' : ' · <a href="#" data-intro="' + ch.id + '" style="color:var(--gold)">序章</a>') + '</small></div><div class="nodes">';
      for (var j = 0; j < SPC; j++) {
        var n = first + j;
        var boss = n % 5 === 0;
        var st = n < S.maxStage ? 'cleared' : n === S.maxStage ? 'current' : 'locked';
        html += '<button type="button" class="node ' + st + (boss ? ' boss' : '') + '" data-n="' + n + '"' + (st === 'locked' ? ' disabled' : '') + '>' + n +
          '<span class="nstars">' + (S.stars[n] ? starsText(S.stars[n]) : '') + '</span></button>';
      }
      html += '</div></div>';
    });
    list.innerHTML = html;
    qsa('.node', list).forEach(function (b) {
      b.onclick = function () {
        var n = +b.getAttribute('data-n');
        if (!isNum(n) || n > S.maxStage) return;
        Snd.play('tap');
        stagePreviewModal(n);
      };
    });
    qsa('[data-intro]', list).forEach(function (a) {
      a.onclick = function (e) { e.preventDefault(); showChapterIntro(+a.getAttribute('data-intro'), null, true); };
    });
  }
  function stagePreviewModal(n) {
    var c = D.stageConfig(n, { board: adaptiveBoardFor(n) }), mech = c.boss ? D.bossMech(c.boss) : null;
    openModal('<h3>第 ' + n + ' 關' + (c.boss ? '<span class="boss-tag">♛ 頭目</span>' : '') + '</h3>' +
      (mech ? '<p><b style="color:var(--red2)">' + esc(c.bossName) + '</b> — ' + esc(mech.name) + '<br><span class="muted small">' + esc(mech.desc) + '</span></p>' : '') +
      '<p class="muted">' + c.cols + '×' + c.rows + ' 盤面 · ' + c.sets + ' 組 · 限時 ' + c.time + ' 秒<br>失誤上限 ' + c.missLimit + '</p>' +
      '<p class="stars" style="font-size:24px">' + starsText(S.stars[n] || 0) + '</p>' +
      '<div class="btn-row"><button class="btn secondary" id="m-cancel">返回</button><button class="btn btn-gold" id="m-go">出戰</button></div>');
    bindModalBtn('m-cancel', closeModal);
    bindModalBtn('m-go', function () { closeModal(); S.stage = n; save(); beginCampaign(n); });
  }

  /* ════════════════ 章節劇情 ════════════════ */
  function chapterProse(chId) {
    var arr = czGet(['chapters']);
    if (Array.isArray(arr)) {
      for (var i = 0; i < arr.length; i++) if (arr[i] && arr[i].chapter === chId) return arr[i];
    }
    return null;
  }
  function storyMod() { return window.StoryUI || window.Story || null; }
  /** 顯示章節序章；done 於關閉後呼叫 */
  function showChapterIntro(chId, done, replay) {
    var ch = CHAPTERS[chId - 1];
    if (!ch) { if (done) done(); return; }
    if (!replay) { S.seenIntro[chId] = true; save(); }
    Snd.duck(true);
    var finish = function () { Snd.duck(false); if (done) done(); };
    var r = tryCall(storyMod(), ['showChapterIntro', 'chapterIntro', 'playChapter'], [chId, finish, { chapter: ch, api: GameAPI }]);
    if (r && r.v !== false) return;
    var p = chapterProse(chId);
    var title = p && p.title ? p.title : '第' + ch.id + '章・' + ch.name;
    var body = p && p.prose ? (Array.isArray(p.prose) ? p.prose.join('\n\n') : p.prose) : ch.intro;
    openModal('<h3>' + esc(title) + '</h3>' + (p && p.subtitle ? '<p class="muted small">' + esc(p.subtitle) + '</p>' : '') +
      '<div class="story-text">' + esc(body) + '</div>' + (p && p.quote ? '<p class="muted center" style="margin-top:10px">' + esc(p.quote) + '</p>' : '') +
      '<button class="btn btn-gold" id="m-cont" style="width:100%;margin-top:12px">繼續</button>', finish);
    bindModalBtn('m-cont', closeModal);
  }
  function showChapterEpilogue(chId, done) {
    var ch = CHAPTERS[chId - 1];
    var r = tryCall(storyMod(), ['showChapterEpilogue', 'chapterEpilogue'], [chId, done, { chapter: ch, api: GameAPI }]);
    if (r && r.v !== false) return;
    var p = chapterProse(chId);
    var text = p && p.epilogue ? p.epilogue : '第' + chId + '章・' + (ch ? ch.name : '') + ' 已完成。';
    openModal('<h3>🏵️ 章節完成</h3><div class="story-text">' + esc(text) + '</div><button class="btn btn-gold" id="m-cont" style="width:100%;margin-top:12px">繼續</button>', done);
    bindModalBtn('m-cont', closeModal);
  }

  /* ════════════════ 戰鬥：開始 ════════════════ */
  function relicOn(id) { return !!S.relics[id]; }

  /** 出戰前：若持有消耗品，讓玩家勾選使用 */
  function prepThen(cb) {
    var owned = SHOP.consumables.filter(function (c) { return !c.instant && (S.inv[c.id] || 0) > 0; });
    if (!owned.length) { cb({}); return; }
    var rows = owned.map(function (c) {
      return '<label class="prep-row"><span class="prep-ico">' + itemIco(c, 'item-ico-sm') + '</span><span>' + esc(c.name) + ' <small class="muted">×' + S.inv[c.id] + ' · ' + esc(c.desc) + '</small></span><input type="checkbox" class="switch" data-use="' + c.id + '"></label>';
    }).join('');
    openModal('<h3>出戰準備</h3>' + rows + '<div class="btn-row" style="margin-top:12px"><button class="btn secondary" id="m-cancel">取消</button><button class="btn btn-gold" id="m-go">出發</button></div>');
    bindModalBtn('m-cancel', closeModal);
    bindModalBtn('m-go', function () {
      var use = {};
      qsa('[data-use]', $('modal-card')).forEach(function (cb2) { if (cb2.checked) use[cb2.getAttribute('data-use')] = true; });
      closeModal();
      cb(use);
    });
  }

  function adaptiveBoardFor(n) {
    if (!window.Training) return null;
    Training.ensureTrain(S);
    var tier = D.gridTier ? D.gridTier(n) : 0;
    return Training.resolveBoard(tier, S.training.load);
  }

  function beginCampaign(n) {
    n = clamp(n | 0 || S.stage, 1, Math.min(S.maxStage, CAMPAIGN_STAGES));
    var cfg = D.stageConfig(n, { board: adaptiveBoardFor(n) });
    cfg.mode = 'campaign';
    var go2 = function () {
      prepThen(function (use) {
        if (!spendEnergy(CONFIG.ENERGY_COST)) return;
        startBattle(cfg, use);
      });
    };
    if (cfg.chapterIdx === 1 && !S.seenIntro[cfg.chapter]) showChapterIntro(cfg.chapter, go2);
    else go2();
  }
  function beginDaily() {
    var t = todayStr();
    if (S.daily.date !== t) S.daily = { date: t, done: false, best: 0 };
    var cfg = D.dailyConfig(t);
    if (window.Training) {
      var b = adaptiveBoardFor(cfg.n || 12);
      if (b) { cfg.cols = b.cols; cfg.rows = b.rows; cfg.sets = b.sets - (cfg.jokers ? Math.floor(cfg.jokers / (cfg.setSize || 2)) : 0); cfg.flipBack = b.flipBack; cfg.load = b.load;
        // 重新用 board 建一份，保留每日 mech
        var rebuilt = D.stageConfig(cfg.n, { board: b, boss: cfg.boss || undefined, mode: 'daily' });
        rebuilt.mode = 'daily'; rebuilt.seed = cfg.seed; rebuilt.label = cfg.label;
        if (!cfg.boss) { rebuilt.boss = null; rebuilt.bossName = null; }
        cfg = rebuilt;
      }
    }
    prepThen(function (use) {
      if (!spendEnergy(CONFIG.ENERGY_COST)) return;
      startBattle(cfg, use);
    });
  }
  function beginEndless(round, carry) {
    var cfg = D.endlessConfig(round || 1);
    if (window.Training) {
      var b = adaptiveBoardFor(cfg.n || (2 + (round || 1) * 3));
      if (b) {
        var rebuilt = D.stageConfig(cfg.n, { board: b, boss: cfg.boss || undefined, mode: 'endless' });
        rebuilt.mode = 'endless'; rebuilt.round = cfg.round; rebuilt.roundBonus = cfg.roundBonus;
        cfg = rebuilt;
      }
    }
    if (!carry) {
      prepThen(function (use) {
        if (!spendEnergy(CONFIG.ENDLESS_COST)) return;
        startBattle(cfg, use, { total: 0 });
      });
    } else startBattle(cfg, {}, carry);
  }

  function buildCards(cfg) {
    var rng = isNum(cfg.seed) ? D.mulberry32(cfg.seed) : Math.random;
    var faces = cfg.boss === 'decoy' ? D.dealDecoy(cfg.sets, rng) : D.dealPairs(cfg.sets, rng);
    var cards = [];
    faces.forEach(function (face, fi) {
      for (var k = 0; k < cfg.setSize; k++) cards.push({ key: face.id + '-' + fi + '-' + k, pair: face.id, face: face, open: false, matched: false, joker: false, fog: false });
    });
    for (var j = 0; j < cfg.jokers; j++) cards.push({ key: 'joker-' + j, pair: null, face: null, open: false, matched: false, joker: true, fog: false });
    D.shuffleInPlace(cards, rng);
    if (cfg.fogRatio > 0) cards.forEach(function (c) { if (!c.joker && rng() < cfg.fogRatio) c.fog = true; });
    return cards;
  }

  function startBattle(cfg, use, carry) {
    use = use || {};
    Object.keys(use).forEach(function (id) { if (S.inv[id] > 0) S.inv[id] -= 1; });
    updateStreakOnPlay();
    S.stats.plays += 1;
    save();

    var h = heroine(S.selected);
    var skillLv = S.skills[h.id] || 1;
    var time = cfg.time * (relicOn('gear') ? 1.06 : 1) + (use.hourglass ? 10 : 0);
    if (cfg.mode === 'endless' && carry && isNum(carry.bank)) time += carry.bank;
    var cd = D.skillCooldown(h.skill, S.skillCd[h.id] || 0);
    if (use.elixir) cd = Math.round(cd / 2);
    var previewSec = use.scroll ? 1.5 + (relicOn('mirror') ? 0.5 : 0) : 0; // 開局不預覽，只有預視卷軸
    var hardAssist = !!use.scroll; // 預視卷軸／鏡子 → 硬輔助
    battle = {
      cfg: cfg, mode: cfg.mode || 'campaign', n: cfg.n, heroine: h, skillLv: skillLv,
      cards: buildCards(cfg), sel: [], lock: true, running: false, paused: false, over: false,
      matched: 0, score: 0, combo: 0, bestCombo: 0, miss: 0, moves: 0,
      missLimit: cfg.missLimit + (use.charm ? 3 : 0) + (relicOn('compass') ? 1 : 0),
      timeMax: Math.round(time), timeLeft: Math.round(time), frozen: 0,
      preview: previewSec,
      comboMul: (h.skill === 'combo' ? D.skillValue('combo', skillLv) : 1) * (relicOn('ring') ? 1.2 : 1),
      cd: cd, cdLeft: 0, skillCasts: 0, jokerPenalty: (cfg.jokerPenalty || 5) * (relicOn('dice') ? 0.5 : 1),
      carry: carry || null, lowWarned: false, lastTick: 0, raf: 0, timers: [],
      train: (window.Training ? Training.createTracker({ assisted: hardAssist }) : null),
      selKnown: false,
      potionBuff: !!S.potionBuff
    };
    if (S.potionBuff) S.potionBuff = false; // 消耗
    var b = battle;
    var title = b.mode === 'daily' ? '每日挑戰' : b.mode === 'endless' ? '無盡・第 ' + cfg.round + ' 輪' : '第 ' + cfg.n + ' 關';
    setText('b-stage', title);
    var bt = $('b-boss');
    if (bt) {
      if (cfg.boss) { bt.textContent = '♛ ' + (cfg.bossName || '') + '・' + ((D.bossMech(cfg.boss) || {}).name || ''); bt.classList.remove('hidden'); }
      else bt.classList.add('hidden');
    }
    var hi = $('b-hero-img'); if (hi) { hi.src = 'assets/heroines/' + h.id + '-sm.webp'; hi.className = 'b-hero ' + outfitClass(h.id); }
    $('b-banner').classList.add('hidden');
    updateBattleHUD();
    renderBoard();
    updateTimeUI();
    updateSkillBtn();
    go('battle', { veil: cfg.boss ? 'boss' : 'battle' });
    bsCall('start', {
      heroine: h,
      chapter: cfg.chapter || 1,
      boss: !!cfg.boss,
      bossName: cfg.bossName || '',
      pairsTotal: cfg.sets,
      stageN: cfg.n || 1
    });
    Snd.bgm(cfg.boss ? 'boss' : 'battle');
    if (cfg.boss) {
      Snd.play('boss'); vibe([40, 60, 40]); Fx.flash('crimson');
      var mech = D.bossMech(cfg.boss);
      banner('♛ ' + (cfg.bossName || '頭目') + '\n' + (mech ? mech.name + '：' + mech.desc : ''), 2200);
      later(runPreview, 2000);
    } else runPreview();
  }

  function later(fn, ms) {
    var b = battle;
    var t = setTimeout(function () { if (battle === b && !b.over) fn(); }, ms);
    if (b) b.timers.push(t);
    return t;
  }

  function runPreview() {
    var b = battle; if (!b) return;
    var board = $('board');
    if (b.preview > 0) {
      board.classList.add('previewing');
      banner('記住牌面！', Math.max(700, b.preview * 1000 - 100));
      later(function () {
        board.classList.remove('previewing');
        later(beginTimer, 380);
      }, Math.round(b.preview * 1000));
    } else beginTimer();
  }
  function beginTimer() {
    var b = battle; if (!b || b.over) return;
    b.lock = false; b.running = true;
    b.lastTick = performance.now();
    updateSkillBtn();
    cheer('start');
    loop();
  }
  function loop() {
    var b = battle; if (!b || b.over) return;
    b.raf = requestAnimationFrame(loop);
    var now = performance.now();
    var dt = Math.min(0.25, (now - b.lastTick) / 1000);
    b.lastTick = now;
    if (!b.running || b.paused) return;
    if (b.cdLeft > 0) { b.cdLeft = Math.max(0, b.cdLeft - dt); updateSkillBtn(); }
    if (b.frozen > 0) { b.frozen = Math.max(0, b.frozen - dt); }
    else b.timeLeft -= dt;
    if (!b.lowWarned && b.timeLeft < Math.max(6, b.timeMax * 0.2)) { b.lowWarned = true; cheer('lowtime'); vibe([15, 30, 15]); }
    if (b.timeLeft <= 0) { b.timeLeft = 0; updateTimeUI(); endBattle(false, 'time'); return; }
    updateTimeUI();
  }
  function updateTimeUI() {
    var b = battle; if (!b) return;
    var pct = Math.max(0, Math.min(100, (b.timeLeft / b.timeMax) * 100));
    $('b-timefill').style.width = pct + '%';
    setText('b-time', Math.ceil(b.timeLeft) + 's' + (b.frozen > 0 ? ' ❄' : ''));
    var tb = qs('.timebar');
    if (tb) { tb.classList.toggle('frozen', b.frozen > 0); tb.classList.toggle('low', b.timeLeft < 8 && b.frozen <= 0); }
  }
  function updateBattleHUD() {
    var b = battle; if (!b) return;
    setText('b-score', b.score);
    setText('b-pairs', b.matched + '/' + b.cfg.sets);
    setText('b-miss', b.miss);
    setText('b-misslimit', b.missLimit);
    setText('b-combo', '連擊 x' + b.combo);
    var ce0 = $('b-combo'); if (ce0) { if (b.combo > 0) ce0.classList.remove('is-zero'); else ce0.classList.add('is-zero'); }
  }
  function updateSkillBtn() {
    var b = battle, btn = $('btn-skill'); if (!b || !btn) return;
    var h = b.heroine, fill = $('b-cdfill');
    if (h.skill === 'combo') {
      setText('b-skill-lbl', '被動：' + h.skillName + ' x' + (Math.round(b.comboMul * 100) / 100));
      btn.disabled = true; if (fill) fill.style.width = '0%';
      return;
    }
    var ready = b.cdLeft <= 0;
    setText('b-skill-lbl', '✦ ' + h.skillName + (ready ? '' : ' ' + Math.ceil(b.cdLeft) + 's'));
    btn.disabled = !ready || !b.running || b.over;
    if (fill) fill.style.width = (b.cd > 0 ? (b.cdLeft / b.cd) * 100 : 0) + '%';
  }

  /* ════════════════ 戰鬥：盤面 ════════════════ */
  /* 牌面視覺：保留 rank/suit/color／id 語意，只換 HYKE 粉彩像素紋章 */
  var FACE_SUIT_KEY = { '\u2660': 'spade', '\u2665': 'heart', '\u2666': 'diamond', '\u2663': 'club' };
  function faceAsset(face) {
    var sk = FACE_SUIT_KEY[face.suit] || 'spade';
    var rank = face.rank || 'A';
    var base = 'assets/battle/faces/' + sk + '_' + rank;
    return { sk: sk, rank: rank, src: base + '.png', src2: base + '@2x.png' };
  }
  function pokerFaceHTML(face) {
    var a = faceAsset(face);
    var color = face.color === 'red' ? 'red' : 'black';
    return '<div class="me-face poker-face ' + color + ' suit-' + a.sk + '" data-id="' + esc(face.id) + '" data-rank="' + esc(face.rank) + '" data-suit="' + esc(face.suit) + '">' +
      '<img class="me-emblem" alt="" draggable="false" src="' + a.src + '" srcset="' + a.src + ' 1x, ' + a.src2 + ' 2x" />' +
      '</div>';
  }
  function cardClass(c) {
    return 'card' + (c.open || c.matched ? ' open' : '') + (c.matched ? ' matched' : '') + (c.fog ? ' fog-mark' : '') + (c.joker && c.matched ? ' joker-spent' : '');
  }
  // 依 board 實際剩餘高度放大牌盤（維持 3:4、不溢出底欄）
  function fitBoard() {
    var board = $('board');
    if (!battle || !battle.cfg || !board || !board.offsetParent) return;
    var cols = battle.cfg.cols, rows = battle.cfg.rows;
    var cs = getComputedStyle(board);
    var gap = parseFloat(cs.rowGap) || 0, pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    var h = board.clientHeight - pad;
    if (h <= 0) return;
    var cardH = (h - gap * (rows - 1)) / rows;
    var w = Math.floor(cardH * 3 / 4 * cols + (parseFloat(cs.columnGap) || 0) * (cols - 1));
    board.style.maxWidth = 'min(100%, ' + w + 'px)';
  }
  window.addEventListener('resize', function () { requestAnimationFrame(fitBoard); });
  function renderBoard() {
    var b = battle, board = $('board');
    board.innerHTML = '';
    board.className = 'board';
    var cols = b.cfg.cols, rows = b.cfg.rows;
    board.style.gridTemplateColumns = 'repeat(' + cols + ',1fr)';
    // 依可用高度限制寬度，避免 6×5 溢出
    board.style.maxWidth = 'min(100%, calc((100vh - 290px) * ' + (cols * 3 / (rows * 4)).toFixed(3) + '))'; // 初值，fitBoard 依實高覆寫
    requestAnimationFrame(fitBoard);
    board.style.margin = '0 auto';
    board.style.width = '100%';
    board.style.alignItems = 'start'; // 讓 .card 的 aspect-ratio 生效（stretch 會把列高壓成 0）
    b.cards.forEach(function (c, i) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = cardClass(c);
      el.setAttribute('data-i', String(i));
      el.setAttribute('aria-label', '卡牌 ' + (i + 1));
      el.innerHTML = '<div class="card-inner"><div class="face back"><div class="back-crest">✦</div></div><div class="face front">' +
        (c.joker ? '<div class="joker-face me-joker"><img alt="JOKER" draggable="false" src="assets/battle/faces/joker.png" srcset="assets/battle/faces/joker.png 1x, assets/battle/faces/joker@2x.png 2x"/><small>JOKER</small></div>' : pokerFaceHTML(c.face)) + '</div></div>';
      el.addEventListener('click', onCard);
      board.appendChild(el);
    });
  }
  function cardEl(i) { return qs('#board .card[data-i="' + i + '"]'); }
  function syncCard(i) {
    var el = cardEl(i), c = battle && battle.cards[i];
    if (!el || !c) return;
    var fogged = el.classList.contains('fogged');
    el.className = cardClass(c) + (fogged && c.open && !c.matched ? ' fogged' : '');
  }

  function onCard(ev) {
    var b = battle;
    if (!b || !b.running || b.paused || b.lock || b.over) return;
    var i = parseInt(ev.currentTarget.getAttribute('data-i'), 10);
    if (!isNum(i) || i < 0 || i >= b.cards.length) return;
    var c = b.cards[i];
    if (c === null || c === undefined || c.open || c.matched) return;
    if (b.sel.indexOf(i) !== -1) return;
    c.open = true;
    syncCard(i);
    Snd.play('flip'); vibe(8);
    if (b.train && !c.joker) {
      // 第一張選牌：在 onReveal 前記下「配對位置是否已知」
      if (b.sel.length === 0) b.selKnown = Training.partnerKnown(b.train, c.pair, i);
      Training.onReveal(b.train, i, c.pair);
    }

    if (c.joker) { hitJoker(i); return; }
    if (c.fog) {
      later(function () { var el = cardEl(i); if (el && c.open && !c.matched) el.classList.add('fogged'); }, 380);
    }
    b.sel.push(i);
    var first = b.sel[0];
    if (first !== i && b.cards[first].pair !== c.pair) { mismatch(); return; }
    if (b.sel.length >= b.cfg.setSize) matchSet();
  }

  function hitJoker(i) {
    var b = battle, c = b.cards[i];
    b.lock = true;
    Snd.play('joker'); vibe([30, 40, 30]);
    b.timeLeft = Math.max(0.1, b.timeLeft - b.jokerPenalty);
    Fx.floatText(cardEl(i), '-' + b.jokerPenalty + 's', 'crimson');
    Fx.flash('crimson'); Fx.shake($('board'));
    b.combo = 0;
    updateBattleHUD(); updateTimeUI();
    later(function () {
      c.matched = true; // 鬼牌只觸發一次，之後保持翻開
      syncCard(i);
      b.lock = false;
    }, 500);
  }

  function matchSet() {
    var b = battle, idxs = b.sel.slice();
    b.sel = [];
    b.moves += 1;
    if (b.train) Training.onResolve(b.train, idxs, b.cards, true, !!b.selKnown);
    idxs.forEach(function (k) { b.cards[k].matched = true; syncCard(k); });
    b.matched += 1;
    b.combo += 1;
    if (b.combo > b.bestCombo) b.bestCombo = b.combo;
    if (b.combo > S.stats.maxCombo) S.stats.maxCombo = b.combo;
    var gain = Math.round(100 * b.combo * b.comboMul * (b.cfg.setSize === 3 ? 1.5 : 1));
    // 魔眼試煉獎勵
    if (b.train && Training.checkPeekChallenge(b.train, idxs)) {
      var bonus = 180 + (b.skillLv || 1) * 20;
      gain += bonus;
      banner('試煉達成 +' + bonus, 900);
    }
    b.score += gain;
    var lastEl = cardEl(idxs[idxs.length - 1]);
    idxs.forEach(function (k) { Fx.pulse(cardEl(k)); });
    Fx.burst(lastEl, 'match');
    Fx.floatText(lastEl, '+' + gain);
    if (b.combo >= 2) {
      Snd.play('combo', { combo: b.combo });
      Fx.combo(b.combo);
      if (b.combo === 3 || b.combo % 5 === 0) cheer('combo');
    } else Snd.play('match');
    vibe(18);
    var ce = $('b-combo'); if (ce) { ce.classList.remove('pop'); void ce.offsetWidth; ce.classList.add('pop'); }
    bsCall('onMatch', { combo: b.combo, gain: gain, remainingPairs: Math.max(0, b.cfg.sets - b.matched) });
    updateBattleHUD();
    if (b.matched >= b.cfg.sets) later(function () { endBattle(true); }, 450);
  }

  function mismatch() {
    var b = battle, idxs = b.sel.slice();
    b.sel = [];
    b.lock = true;
    b.moves += 1;
    if (b.train) Training.onResolve(b.train, idxs, b.cards, false, !!b.selKnown);
    b.miss += 1;
    b.combo = 0;
    updateBattleHUD();
    Snd.play('mismatch'); vibe([25, 30, 25]);
    if (b.miss === 1 || b.miss % 4 === 0) cheer('miss');
    Fx.shake($('board'));
    bsCall('onMiss', { miss: b.miss, missLimit: b.missLimit });
    var missAnchor = $('board') || qs('.bs-hero-sprite') || $('b-miss');
    if (missAnchor) Fx.floatText(missAnchor, '失誤', 'crimson');
    /* 翻開期間標紅，讓錯配牌面可讀（safeRun 路徑不變） */
    idxs.forEach(function (k) {
      safeRun(function () { var el = cardEl(k); if (el) el.classList.add('is-mismatch'); });
    });
    var delay = b.cfg.flipBack || 600;
    later(function () {
      idxs.forEach(function (k) {
        var c = b.cards[k];
        safeRun(function () {
          if (c && !c.matched) {
            c.open = false;
            var el = cardEl(k);
            if (el) {
              el.classList.remove('fogged');
              el.classList.remove('is-mismatch');
              el.classList.add('shake');
            }
            syncCard(k);
          }
        });
      });
      // 錯位洗牌機制已停用（太難）
      b.lock = false;
      if (b.miss >= b.missLimit) endBattle(false, 'miss');
    }, delay);
  }

  /** 頭目「錯位洗牌」：翻錯的牌各自與一張未配對的蓋牌交換位置 */
  function shuffleAfterMiss(idxs) {
    var b = battle;
    var pool = [];
    b.cards.forEach(function (c, k) { if (!c.matched && !c.open && idxs.indexOf(k) === -1) pool.push(k); });
    if (!pool.length) return;
    idxs.forEach(function (k) {
      if (!pool.length) return;
      var j = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      var t = b.cards[k]; b.cards[k] = b.cards[j]; b.cards[j] = t;
      [k, j].forEach(function (x) {
        var el = cardEl(x); if (!el) return;
        var c = b.cards[x];
        qs('.front', el).innerHTML = c.joker ? '<div class="joker-face me-joker"><img alt="JOKER" draggable="false" src="assets/battle/faces/joker.png" srcset="assets/battle/faces/joker.png 1x, assets/battle/faces/joker@2x.png 2x"/><small>JOKER</small></div>' : pokerFaceHTML(c.face);
        syncCard(x);
        el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
      });
    });
    banner('牌陣錯位！', 700);
  }

  /* ════════════════ 戰鬥：技能、助威 ════════════════ */
  function useSkill() {
    var b = battle;
    if (!b || !b.running || b.paused || b.over || b.cdLeft > 0) return;
    var h = b.heroine;
    if (h.skill === 'combo') return;
    var v = D.skillValue(h.skill, b.skillLv);
    b.cdLeft = b.cd;
    b.skillCasts += 1;
    S.stats.skillsUsed += 1;
    Snd.play('skill'); vibe([10, 20, 40]); Fx.flash('arcane');
    cheer('skill');
    bsCall('onSkill', { skill: h.skill, heroine: h });
    if (h.skill === 'peek') {
      // 魔眼試煉：從「已見過且未配對」的牌中標出目標，限時配對加分（非全場窺視）
      b.sel.forEach(function (k) { b.cards[k].open = false; syncCard(k); });
      b.sel = [];
      var seenPool = [];
      if (b.train) {
        b.cards.forEach(function (c, k) {
          if (c && !c.joker && !c.matched && b.train.seen[k]) seenPool.push(k);
        });
      }
      var need = Math.min(v, seenPool.length);
      if (need < 2) {
        banner('魔眼：先探索更多牌面', 1000);
      } else {
        // 洗牌取 need 張
        for (var i = seenPool.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var tmp = seenPool[i]; seenPool[i] = seenPool[j]; seenPool[j] = tmp;
        }
        var targets = seenPool.slice(0, need);
        targets.forEach(function (k) {
          var el = cardEl(k); if (el) { el.classList.add('train-target'); Fx.pulse(el); }
        });
        if (b.train) Training.setPeekChallenge(b.train, targets, 8000 + b.skillLv * 500);
        banner('魔眼試煉！限時配對標示牌', 1200);
        later(function () {
          targets.forEach(function (k) { var el = cardEl(k); if (el) el.classList.remove('train-target'); });
        }, 1800);
      }
    } else if (h.skill === 'freeze') {
      b.frozen += v; banner('時間凍結 ' + v + ' 秒！');
    } else if (h.skill === 'time') {
      b.timeLeft += v; b.timeMax = Math.max(b.timeMax, b.timeLeft); banner('時間 +' + v + ' 秒！');
      Fx.floatText($('b-time'), '+' + v + 's');
    } else if (h.skill === 'match') {
      // 戰術回顧：脈衝已見過未配對的牌（軟輔助，之後 v 次翻牌不計指標）
      b.sel.forEach(function (k) { b.cards[k].open = false; syncCard(k); });
      b.sel = [];
      var reviewed = 0;
      b.cards.forEach(function (c, k) {
        if (!c || c.joker || c.matched) return;
        if (b.train && b.train.seen[k]) {
          var el = cardEl(k);
          if (el) { el.classList.add('train-review'); Fx.pulse(el); }
          reviewed += 1;
        }
      });
      if (b.train) Training.armReview(b.train, v);
      banner(reviewed ? ('戰術回顧 ' + reviewed + ' 張') : '尚無已知牌可回顧', 1100);
      later(function () {
        qsa('#board .card.train-review').forEach(function (el) { el.classList.remove('train-review'); });
      }, 1600);
      updateBattleHUD();
    }
    updateSkillBtn(); updateTimeUI();
  }

  var cheerTimer = null;
  function cheer(kind) {
    var b = battle; if (!b) return;
    var h = b.heroine;
    var line = pick(czGet(['battleCheer', h.id, kind]));
    if (!line && h.cheer && h.cheer[kind]) line = h.cheer[kind];
    if (!line && kind === 'start') line = (h.cheer && h.cheer.start) || pick(czGet(['battleCheer', 'general', 'start']));
    if (!line) line = pick(czGet(['battleCheer', 'general', kind]));
    if (!line && kind === 'start') line = '「集中精神，我們開始吧。」';
    if (!line) return;
    var r = tryCall(window.HeroineUI, ['cheer', 'battleCheer'], [h.id, kind, line]);
    if (r && r.v === true) return;
    var el = $('b-cheer'); if (!el) return;
    el.textContent = line;
    el.classList.add('show');
    if (kind !== 'start') Snd.play('chime');
    if (cheerTimer) clearTimeout(cheerTimer);
    cheerTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function banner(text, ms) {
    var el = $('b-banner'); if (!el) return;
    el.textContent = text;
    el.style.whiteSpace = 'pre-line';
    el.classList.remove('hidden');
    if (el._t) clearTimeout(el._t);
    el._t = setTimeout(function () { el.classList.add('hidden'); }, ms || 1200);
  }

  function clearBattleTimers() {
    var b = battle; if (!b) return;
    if (b.raf) cancelAnimationFrame(b.raf);
    b.timers.forEach(clearTimeout);
    b.timers = [];
  }

  /* ════════════════ 戰鬥：結算 ════════════════ */
  function endBattle(win, reason) {
    var b = battle;
    if (!b || b.over) return;
    b.over = true; b.running = false; b.lock = true;
    clearBattleTimers();
    var cfg = b.cfg, mode = b.mode, hid = b.heroine.id;
    var metrics = b.train && window.Training ? Training.finalize(b.train) : { recallAcc: null, knownErrors: 0, recallHit: 0, span: null, assisted: false, softAssisted: false, recallEvents: 0 };
    var stars = win ? D.starsFor({ sets: cfg.sets, miss: b.miss, timeLeft: b.timeLeft, timeMax: b.timeMax, recallAcc: metrics.recallAcc, knownErrors: metrics.knownErrors }) : 0;
    var perfect = win && b.miss === 0;
    // 時間獎權重降低（記憶為主）
    var timeBonus = win ? Math.floor(b.timeLeft) * 4 : 0;
    var total = b.score + timeBonus + (perfect ? 500 : 0) + (win && cfg.boss ? 300 : 0);
    var loadMul = 1 + 0.08 * ((cfg.load != null ? cfg.load : (S.training && S.training.load)) || 0);
    var lion = (relicOn('lion') ? 1.15 : 1) * loadMul;
    if (b.potionBuff && win && isNum(metrics.recallAcc) && metrics.recallAcc >= 0.8) lion *= 1.15;
    var r = { win: win, reason: reason, stars: stars, perfect: perfect, timeBonus: timeBonus, base: b.score, total: total,
      miss: b.miss, combo: b.bestCombo, gold: 0, xp: 0, ups: 0, firstClear: false, chapterDone: 0, mode: mode, n: cfg.n, boss: !!cfg.boss,
      metrics: metrics, load: cfg.load != null ? cfg.load : (S.training && S.training.load) || 0 };

    if (win) {
      S.stats.wins += 1; S.stats.clears += 1;
      if (perfect) S.stats.perfects += 1;
      if (cfg.boss) S.stats.bossWins += 1;
      r.xp = 30 + cfg.n * 6 + stars * 10 + (perfect ? 25 : 0) + (cfg.boss ? 40 : 0);
      r.gold = (25 + cfg.n * 4 + stars * 12 + Math.floor(total / 60) + (cfg.boss ? 80 : 0)) * lion;
      var bondGain = 2 + stars + (perfect ? 2 : 0);
      if (mode === 'campaign') {
        var prevStars = S.stars[cfg.n] || 0;
        if (stars > prevStars) S.stars[cfg.n] = stars;
        if (cfg.n >= S.maxStage) {
          r.firstClear = true;
          S.maxStage = Math.min(CAMPAIGN_STAGES + 1, cfg.n + 1);
          r.gold += 40;
          if (cfg.chapterIdx === SPC) {
            r.chapterDone = cfg.chapter;
            S.events['chapter' + cfg.chapter] = true;
            bondGain += 6;
          }
        } else r.gold *= 0.6; // 重刷收益降低
        S.stage = Math.min(CAMPAIGN_STAGES, Math.max(S.stage, cfg.n + 1));
        if (S.stage > S.maxStage) S.stage = S.maxStage;
      } else if (mode === 'daily') {
        var first = !S.daily.done;
        S.daily.done = true; S.daily.best = Math.max(S.daily.best || 0, total);
        if (first) { S.stats.dailyWins += 1; r.gold += 150; r.xp += 60; r.dailyFirst = true; }
        else r.gold *= 0.3;
      } else if (mode === 'endless') {
        var carry = b.carry || { total: 0 };
        carry.total = (carry.total || 0) + total;
        carry.bank = Math.min(15, Math.floor(b.timeLeft * 0.5));
        r.endlessTotal = carry.total; r.round = cfg.round;
        S.stats.endlessBestRound = Math.max(S.stats.endlessBestRound, cfg.round);
        r.gold *= 0.5;
        r.nextCarry = carry;
      }
      r.bond = addBond(hid, bondGain, true);
    } else {
      S.stats.losses += 1;
      r.xp = 8;
      r.gold = mode === 'endless' ? 0 : 5;
      if (mode === 'endless') {
        var c2 = b.carry || { total: 0 };
        r.endlessTotal = (c2.total || 0) + b.score;
        r.round = cfg.round;
        recordEndless(r.endlessTotal, cfg.round - 1);
      }
    }
    // 訓練紀錄／自適應（輔助場不進階梯）
    safeRun(function () {
      if (!window.Training) return;
      Training.ensureTrain(S);
      var stair = Training.applyStaircase(S, metrics, win, reason || (win ? 'win' : 'lose'));
      r.stair = stair;
      Training.recordSession(S, {
        recallAcc: metrics.recallAcc, span: metrics.span, load: S.training.load,
        win: win, assisted: metrics.assisted, softAssisted: metrics.softAssisted,
        knownErrors: metrics.knownErrors, recallHit: metrics.recallHit, n: cfg.n, mode: mode
      });
      r.delta = Training.deltaVs7Day(S, metrics);
      r.assisted = metrics.assisted;
      r.softAssisted = metrics.softAssisted;
    });

    // 先排定結算畫面，再跑音效／特效：任何特效在 iOS Safari 拋錯都不能讓畫面卡死在戰鬥中
    var resultShown = false;
    var toResult = function () { if (resultShown) return; resultShown = true; showResult(r); };
    setTimeout(toResult, win ? 650 : 500);
    setTimeout(toResult, 2500); // 保險：主計時器若被吃掉，2.5 秒後一定進結算
    safeRun(function () { r.gold = addGold(r.gold); });
    safeRun(function () { r.ups = addXp(r.xp); });
    safeRun(checkAchievements);
    safeRun(save);
    safeRun(function () { Snd.duck(true); });
    if (win) {
      safeRun(function () { Snd.play('clear'); });
      safeRun(function () { vibe([20, 40, 20, 40, 60]); });
      safeRun(function () { Fx.burst($('board'), 'clear'); Fx.flash('gold'); });
      safeRun(function () { cheer('win'); });
      safeRun(function () { bsCall('onWin'); });
    } else {
      safeRun(function () { Snd.play('fail'); });
      safeRun(function () { vibe([80]); });
      safeRun(function () { Fx.flash('crimson'); });
      safeRun(function () { cheer('lose'); });
      safeRun(function () { bsCall('onLose', reason); });
    }
  }

  function safeRun(fn) {
    try { return fn(); } catch (e) { if (window.console) console.error('[game] 非致命錯誤', e); }
  }

  function recordEndless(score, rounds) {
    S.stats.endlessBest = Math.max(S.stats.endlessBest || 0, score);
    S.leaderboard.push({ score: score, round: Math.max(0, rounds), hero: S.selected, date: todayStr() });
    S.leaderboard.sort(function (a, b) { return b.score - a.score; });
    S.leaderboard = S.leaderboard.slice(0, CONFIG.LEADERBOARD_SIZE || 10);
  }

  function showResult(r) {
    try { showResultInner(r); }
    catch (e) {
      if (window.console) console.error('[game] 結算畫面錯誤，改用簡易結算', e);
      safeRun(function () {
        $('r-box').innerHTML = '<h2 class="scr-title">' + (r.win ? '勝利' : (r.reason === 'miss' ? '失誤過多' : '時間到')) + '</h2>' +
          '<div class="overlay-msg">經驗 +' + r.xp + '　金幣 +' + r.gold + '</div>' +
          '<div class="btn-row"><button class="btn btn-gold" id="r-home">回主城</button></div>';
      });
      go('result');
      var hb = $('r-home');
      if (hb) hb.onclick = function () { battle = null; safeRun(function () { Snd.duck(false); Snd.bgm('main'); }); go('home'); };
    }
  }

  function showResultInner(r) {
    var b = battle;
    var h = b ? b.heroine : heroine(S.selected);
    var head = r.win ? (r.mode === 'endless' ? '第 ' + r.round + ' 輪突破' : r.boss ? '頭目擊破！' : '勝利') :
      (r.reason === 'miss' ? '失誤過多' : r.reason === 'quit' ? '撤退' : '時間到');
    var winLine = pick(czGet(['battleCheer', h.id, r.win ? 'win' : 'lose'])) || '';
    var portraitSrc = 'assets/battle/ui/' + (h && h.id ? h.id : 'verda') + '_portrait.png';
    var html = '<div class="r-layout' + (r.win ? ' is-win' : ' is-lose') + '">';
    html += '<div class="r-cutin"><img src="' + portraitSrc + '" alt="" onerror="this.style.display=\'none\'"/></div>';
    html += '<div class="r-body">';
    html += '<h2 class="scr-title">' + head + '</h2>';
    if (r.assisted || r.softAssisted) html += '<div class="r-assist-tag">' + (r.assisted ? '輔助' : '回顧') + '</div>';
    if (r.win && r.mode !== 'endless') html += '<div class="stars" id="r-stars"><span>★</span><span>★</span><span>★</span></div>';
    html += '<div class="result-score">' + (r.mode === 'endless' ? r.endlessTotal : r.total) + '</div>';
    html += '<div class="muted center small">基礎 ' + r.base + ' · 時間獎 ' + r.timeBonus + (r.perfect ? ' · 完美 +500' : '') + (r.win && r.boss ? ' · 頭目 +300' : '') +
      ' · 失誤 ' + r.miss + ' · 最高連擊 ' + r.combo + '</div>';
    var m = r.metrics || {};
    var accPct = (typeof m.recallAcc === 'number') ? Math.round(m.recallAcc * 100) : null;
    var dlt = r.delta || {};
    function dltTxt(v, suffix) {
      if (typeof v !== 'number') return '';
      var n = suffix === '%' ? Math.round(v * 100) : (Math.round(v * 10) / 10);
      return ' <span class="r-delta ' + (n >= 0 ? 'up' : 'down') + '">(' + (n >= 0 ? '+' : '') + n + suffix + ' vs 7日)</span>';
    }
    html += '<div class="r-train">';
    html += '<div class="r-train-row"><span>回憶正確率</span><b>' + (accPct == null ? '—' : (accPct + '%')) + '</b>' + dltTxt(dlt.recallAcc, '%') + '</div>';
    html += '<div class="r-train-row"><span>已知牌失誤</span><b>' + (m.knownErrors == null ? '—' : m.knownErrors) + '</b></div>';
    html += '<div class="r-train-row"><span>記憶廣度</span><b>' + (m.span == null ? '—' : m.span) + '</b>' + dltTxt(dlt.span, '') + '</div>';
    html += '<div class="r-train-row"><span>訓練負荷</span><b>Lv.' + (r.load != null ? r.load : 0) + '</b>' +
      (r.stair && r.stair.changed ? (' <span class="r-delta ' + (r.stair.load > r.stair.prev ? 'up' : 'down') + '">→ Lv.' + r.stair.load + '</span>') : '') + '</div>';
    html += '</div>';
    html += '<div class="overlay-msg">經驗 +' + r.xp + '　金幣 +' + r.gold + (r.bond ? '　好感 +' + r.bond : '') +
      (r.ups ? '<br>⬆️ 等級提升 ×' + r.ups + '！' : '') + (r.firstClear ? '<br>🗝️ 首次通關' : '') + (r.dailyFirst ? '<br>🗓️ 每日挑戰完成獎勵 +150' : '') +
      (r.mode === 'endless' && !r.win ? '<br>♾️ 已記錄至排行榜' : '') + '</div>';
    if (winLine) html += '<p class="greet-bubble r-line">' + esc(h.name) + '：' + esc(winLine) + '</p>';
    html += '<div class="btn-row"><button class="btn secondary" id="r-home">回主城</button>';
    if (r.mode === 'campaign') {
      if (r.win && r.n < CAMPAIGN_STAGES) html += '<button class="btn btn-gold" id="r-next">下一關</button>';
      else if (!r.win) html += '<button class="btn btn-gold" id="r-retry">再試一次</button>';
    } else if (r.mode === 'endless' && r.win) {
      html += '<button class="btn btn-gold" id="r-endless">下一輪 →</button>';
    } else if (r.mode === 'endless') {
      html += '<button class="btn btn-gold" id="r-retry">再挑戰</button>';
    } else if (r.mode === 'daily' && !r.win) {
      html += '<button class="btn btn-gold" id="r-retry">再試一次</button>';
    }
    html += '</div>';
    if (r.mode === 'endless' && r.win) html += '<button class="btn secondary" id="r-cashout" style="width:100%;margin-top:8px">收手並記錄成績</button>';
    html += '</div></div>'; /* .r-body .r-layout */
    $('r-box').innerHTML = html;
    go('result');
    if (r.win && r.stars) {
      qsa('#r-stars span').forEach(function (s, k) {
        if (k < r.stars) setTimeout(function () { s.classList.add('on'); Snd.play('star'); vibe(10); }, 250 + k * 280);
      });
    }
    var leave = function () { battle = null; safeRun(function () { Snd.duck(false); Snd.bgm('main'); }); };
    var homeBtn = $('r-home');
    if (homeBtn) homeBtn.onclick = function () {
      Snd.play('tap');
      if (r.mode === 'endless' && r.win && r.nextCarry) { recordEndless(r.nextCarry.total, r.round); save(); }
      leave();
      afterResult(r, function () { go('home'); });
    };
    var next = $('r-next');
    if (next) next.onclick = function () { Snd.play('tap'); leave(); afterResult(r, function () { beginCampaign(Math.min(S.maxStage, r.n + 1)); }); };
    var retry = $('r-retry');
    if (retry) retry.onclick = function () {
      Snd.play('tap'); leave();
      if (r.mode === 'campaign') beginCampaign(r.n);
      else if (r.mode === 'daily') beginDaily();
      else beginEndless(1);
    };
    var en = $('r-endless');
    if (en) en.onclick = function () { Snd.play('tap'); var c = r.nextCarry; battle = null; Snd.duck(false); beginEndless(r.round + 1, c); };
    var co = $('r-cashout');
    if (co) co.onclick = function () { Snd.play('tap'); recordEndless(r.nextCarry.total, r.round); save(); leave(); go('home'); showLeaderboard(); };
  }

  /** 結算後的章節收尾／事件（日期事件、浴衣解鎖） */
  function afterResult(r, cont) {
    if (!r.chapterDone) { cont(); return; }
    var ch = r.chapterDone;
    var unlocks = D.OUTFITS.filter(function (o) { return o.event === 'chapter' + ch; });
    showChapterEpilogue(ch, function () {
      if (unlocks.length) toast('👘 服裝解鎖：' + unlocks.map(function (o) { return o.name; }).join('、'));
      emit('game:event', { type: 'chapter', chapter: ch });
      var r2 = tryCall(window.HeroineUI, ['dateEvent', 'onChapterClear'], [ch, S.selected]);
      if (r2 && r2.v === true) { cont(); return; }
      cont();
    });
  }

  /* ════════════════ 暫停 ════════════════ */
  function showPause() {
    var b = battle;
    if (!b || b.over) return;
    b.paused = true;
    Snd.duck(true);
    var mech = b.cfg.boss ? D.bossMech(b.cfg.boss) : null;
    openModal('<h3>暫停</h3>' + (mech ? '<p class="muted small">♛ ' + esc(mech.name) + '：' + esc(mech.desc) + '</p>' : '<p class="muted center">戰鬥暫停中</p>') +
      '<button class="btn btn-gold" id="m-resume" style="width:100%">繼續</button>' +
      '<button class="btn secondary" id="m-quit" style="margin-top:8px;width:100%">撤退（判定失敗）</button>', function () {
      if (battle === b && !b.over) { b.paused = false; b.lastTick = performance.now(); Snd.duck(false); }
    });
    bindModalBtn('m-resume', closeModal);
    bindModalBtn('m-quit', function () { modalOnClose = null; closeModal(); endBattle(false, 'quit'); });
  }

  /* ════════════════ 名冊（技能樹、解鎖） ════════════════ */
  function renderRoster() {
    var list = $('roster-list'); if (!list) return;
    list.innerHTML = '';
    HEROINES.forEach(function (h) {
      var unlocked = !!S.unlocked[h.id];
      var canUnlock = !unlocked && S.lv >= h.reqLv && S.gold >= h.cost;
      var lv = S.skills[h.id] || 1, cdLv = S.skillCd[h.id] || 0;
      var card = document.createElement('div');
      card.className = 'roster-card' + (unlocked ? '' : ' locked') + (S.selected === h.id ? ' selected' : '');
      var cdText = h.skill === 'combo' ? '被動技能' : '冷卻 ' + D.skillCooldown(h.skill, cdLv) + ' 秒';
      card.innerHTML =
        '<button type="button" class="rc-img-btn"><img class="' + outfitClass(h.id) + '" src="assets/heroines/' + h.id + '.webp" alt=""><span class="rc-view-hint">' + (unlocked ? '互動' : '🔒') + '</span></button>' +
        '<div class="rc-body"><div class="rc-title">' + esc(h.title) + (S.fav[h.id] ? ' ★' : '') + '</div><div class="rc-name">' + esc(h.name) + '</div>' +
        '<div class="rc-hearts">' + (unlocked ? heartsHTML(S.bond[h.id] || 0) + ' <small class="muted">' + (S.bond[h.id] || 0) + '/' + BOND_PTS_MAX + '</small>' : '') + '</div>' +
        '<div class="muted small">' + (unlocked ? esc(h.skillName) + '：' + esc(D.skillDesc(h.skill, lv)) + '<br>' + cdText +
          '<div class="pips">威力 ' + pips(lv, CONFIG.SKILL_MAX) + (h.skill === 'combo' ? '' : '<br>冷卻 ' + pips(cdLv, CONFIG.CD_MAX)) + '</div>' :
          '解鎖：Lv' + h.reqLv + (h.cost ? ' · ' + h.cost + ' 金' : ' · 免費')) + '</div>' +
        '<div class="rc-actions tree"></div></div>';
      var actions = qs('.rc-actions', card);
      qs('.rc-img-btn', card).onclick = function () { if (unlocked) openGallery(h.id); else toast('尚未解鎖'); };
      if (!unlocked) {
        actions.appendChild(mkBtn(canUnlock ? '解鎖' : '未達條件', 'btn btn-sm btn-gold', !canUnlock, function () {
          if (S.gold < h.cost || S.lv < h.reqLv) return;
          S.gold -= h.cost; S.unlocked[h.id] = true;
          Snd.play('levelup'); checkAchievements(); save();
          toast('👑 ' + h.name + ' 加入麾下');
          renderRoster(); refreshTop();
        }));
      } else {
        actions.appendChild(mkBtn(S.selected === h.id ? '出戰中' : '選為出戰', 'btn btn-sm' + (S.selected === h.id ? ' btn-gold' : ''), S.selected === h.id, function () {
          S.selected = h.id; save(); renderRoster(); toast('出戰：' + h.name);
        }));
        actions.appendChild(mkBtn('互動', 'btn btn-sm', false, function () { openGallery(h.id); }));
        if (lv < CONFIG.SKILL_MAX) {
          var cost = D.upgradeCost(lv);
          actions.appendChild(mkBtn('威力↑ ' + cost + '金', 'btn btn-sm', S.gold < cost, function () {
            if (S.gold < cost) return;
            S.gold -= cost; S.skills[h.id] = lv + 1; Snd.play('levelup'); save();
            toast(h.skillName + ' → Lv' + (lv + 1)); renderRoster(); refreshTop();
          }));
        }
        if (h.skill !== 'combo' && cdLv < CONFIG.CD_MAX) {
          var c2 = D.cdUpgradeCost(cdLv);
          actions.appendChild(mkBtn('冷卻↓ ' + c2 + '金', 'btn btn-sm', S.gold < c2, function () {
            if (S.gold < c2) return;
            S.gold -= c2; S.skillCd[h.id] = cdLv + 1; Snd.play('levelup'); save();
            toast(h.skillName + ' 冷卻縮短'); renderRoster(); refreshTop();
          }));
        }
      }
      list.appendChild(card);
    });
  }
  function pips(n, max) { var s = ''; for (var i = 0; i < max; i++) s += i < n ? '◆' : '◇'; return s; }
  function mkBtn(text, cls, disabled, fn) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.textContent = text; b.disabled = !!disabled;
    b.onclick = function () { Snd.play('tap'); fn(); };
    return b;
  }

  /* ════════════════ 女傑互動（HeroineUI 優先；否則內建備用） ════════════════ */
  var heroineInited = false;
  function heroineModule() {
    var H = window.HeroineUI;
    if (!H) return null;
    if (!heroineInited) { heroineInited = true; tryCall(H, ['init'], [GameAPI]); }
    return H;
  }
  function openGallery(id) {
    if (!S.unlocked[id]) { toast('尚未解鎖'); return; }
    Snd.play('chime');
    var H = heroineModule();
    if (H) {
      var r = tryCall(H, ['open', 'openGallery', 'show'], [id, GameAPI]);
      if (r && r.v !== false) return;
    }
    galleryId = id;
    $('hero-gallery').classList.remove('hidden');
    Snd.duck(true);
    renderGallery(true);
  }
  function closeGallery() {
    var g = $('hero-gallery');
    if (g && !g.classList.contains('hidden')) { g.classList.add('hidden'); Snd.duck(false); }
    galleryId = null;
    var art = $('hg-art'); if (art) art.classList.remove('zoomed');
    if (currentScreen === 'home') renderHome();
    if (currentScreen === 'roster') renderRoster();
  }
  function outfitStatus(o, id) {
    if (o.shop) return S.outfitsOwned[o.id] ? true : '商會購買';
    if (o.event) return S.events[o.event] ? true : (o.note || '活動解鎖');
    return bondLv(id) >= o.reqBond ? true : '好感 ' + o.reqBond + '♥';
  }
  function renderGallery(fresh) {
    if (!galleryId) return;
    var h = heroine(galleryId), pts = S.bond[h.id] || 0;
    var art = $('hg-art');
    art.src = 'assets/heroines/' + h.id + '.webp';
    art.className = 'hg-art breathe ' + outfitClass(h.id);
    setText('hg-title', h.title + (S.fav[h.id] ? ' ★' : ''));
    setText('hg-name', h.name);
    setText('hg-bio', h.bio);
    $('hg-hearts').innerHTML = heartsHTML(pts);
    setText('hg-bond-num', pts + ' / ' + BOND_PTS_MAX);
    if (fresh) setText('hg-bubble', greetingFor(h.id));
    var outfits = $('hg-outfits');
    outfits.innerHTML = '';
    D.OUTFITS.forEach(function (o) {
      var st = outfitStatus(o, h.id), ok = st === true;
      var active = (S.outfit[h.id] || 'default') === o.id;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'outfit-chip' + (ok ? '' : ' locked') + (active ? ' active' : '');
      chip.textContent = ok ? o.name : '🔒 ' + o.name + '（' + st + '）';
      chip.disabled = !ok;
      chip.onclick = function () {
        S.outfit[h.id] = o.id; save(); Snd.play('tap');
        toast('換裝：' + o.name); renderGallery();
      };
      outfits.appendChild(chip);
    });
    var talkBtn = $('hg-talk');
    var scene = nextScene(h.id);
    var talks = day().talk[h.id] || 0;
    talkBtn.disabled = !scene && talks >= 3;
    talkBtn.textContent = scene ? '💬 劇情：' + (scene.title || '交談') : talks >= 3 ? '今日已暢談' : '💬 交談';
    var sel = $('hg-select');
    sel.disabled = S.selected === h.id;
    sel.textContent = S.selected === h.id ? '出戰中' : '選為出戰';
  }
  function nextScene(id) {
    var list = czGet(['dialogues', id]);
    if (!Array.isArray(list)) return null;
    var lv = bondLv(id);
    for (var i = 0; i < list.length; i++) {
      var sc = list[i];
      if (sc && !S.scenesSeen[sc.id] && (sc.reqBond || 0) <= lv) return sc;
    }
    return null;
  }
  function talkHeroine() {
    if (!galleryId) return;
    var h = heroine(galleryId);
    var sc = nextScene(h.id);
    if (sc) { playScene(h.id, sc); return; }
    var dc = day();
    dc.talk[h.id] = (dc.talk[h.id] || 0) + 1;
    var bubble = $('hg-bubble');
    bubble.textContent = pick((h.lines || {})[D.bondTier(bondLv(h.id))]) || greetingFor(h.id);
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    Snd.play('chime'); vibe(10);
    if (dc.talk[h.id] <= 3) addBond(h.id, 2);
    save(); renderGallery();
  }
  function playScene(id, sc) {
    var choices = sc.choices || [];
    var html = '<h3>' + esc(sc.title || '') + '</h3><div class="story-text">' + esc(sc.intro || '') + '\n\n' + esc(sc.line || '') + '</div>' +
      choices.map(function (c, k) { return '<button class="btn" data-ch="' + k + '" style="width:100%;margin-top:8px;text-align:left;font-size:13px">' + esc(c.text) + '</button>'; }).join('');
    openModal(html);
    qsa('[data-ch]', $('modal-card')).forEach(function (btn) {
      btn.onclick = function () {
        var k = parseInt(btn.getAttribute('data-ch'), 10);
        var c = choices[k]; if (!c) return;
        S.scenesSeen[sc.id] = true;
        var gain = addBond(id, (c.bondDelta || 1) * 4);
        Snd.play(gain > 0 ? 'gift' : 'chime');
        openModal('<h3>' + esc(sc.title || '') + '</h3><div class="story-text">' + esc(c.response || '') + (c.note ? '\n\n' + esc(c.note) : '') + '</div>' +
          '<p class="center" style="color:var(--gold2)">好感 +' + gain + '</p><button class="btn btn-gold" id="m-cont" style="width:100%">繼續</button>', function () { renderGallery(); });
        bindModalBtn('m-cont', closeModal);
      };
    });
  }
  var TAP_LINES = {
    head: ['（她微微一怔，隨即別過臉）……下次先說一聲。', '（輕輕整理被你撥亂的髮絲）真拿你沒辦法。'],
    shoulder: ['（拍了拍你的肩回禮）一起加油吧。', '嗯，我會撐住的。你也是。'],
    hand: ['（擊掌！）漂亮，搭檔。', '（行了一個利落的軍禮）隨時聽候差遣。']
  };
  function tapZone(zone) {
    if (!galleryId) return;
    var id = galleryId, dc = day();
    var key = id;
    dc.tap[key] = (dc.tap[key] || 0) + 1;
    var line = pick(czGet(['taps', id, zone])) || pick(TAP_LINES[zone]) || '……';
    var bubble = $('hg-bubble');
    bubble.textContent = line;
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    Snd.play('chime'); vibe(12);
    var art = $('hg-art'); Fx.pulse(art && art.parentNode);
    if (dc.tap[key] <= (CONFIG.TAP_DAILY_CAP || 5) && Math.random() < 0.5) {
      var g = addBond(id, 1);
      if (g) Fx.floatText(art, '♥ +' + g, 'rose');
    }
    save(); renderGallery();
  }
  function giftFlow() {
    if (!galleryId) return;
    var h = heroine(galleryId), dc = day();
    var used = dc.gift[h.id] || 0;
    var owned = SHOP.gifts.filter(function (g) { return (S.inv[g.id] || 0) > 0; });
    var html = '<h3>贈禮給 ' + esc(h.name) + '</h3><p class="muted small">今日已贈 ' + used + '/' + CONFIG.GIFT_DAILY_CAP + ' · 喜好：' +
      (h.favGifts || []).map(function (gid) { var g = findItem('gifts', gid); return g ? ('<span class="fav-gift-chip">' + itemIco(g, 'item-ico-xs') + '<span>' + esc(g.name) + '</span></span>') : ''; }).join('') + '</p>';
    if (!owned.length) html += '<p class="muted">背包中沒有禮物，請至帝國商會購買。</p>';
    else html += '<div class="gift-grid">' + owned.map(function (g) { return '<button data-gift="' + g.id + '"' + (used >= CONFIG.GIFT_DAILY_CAP ? ' disabled' : '') + '>' + itemIco(g, 'item-ico-md') + '<span>' + esc(g.name) + ' ×' + S.inv[g.id] + '</span></button>'; }).join('') + '</div>';
    html += '<button class="btn secondary" id="m-cancel" style="width:100%;margin-top:10px">關閉</button>';
    openModal(html);
    bindModalBtn('m-cancel', closeModal);
    qsa('[data-gift]', $('modal-card')).forEach(function (btn) {
      btn.onclick = function () { giveGift(h.id, btn.getAttribute('data-gift')); };
    });
  }
  /** 贈禮（也提供給 HeroineUI 使用）。回傳 {ok, gain, fav, line} */
  function giveGift(id, giftId) {
    var h = heroine(id), dc = day();
    if ((S.inv[giftId] || 0) <= 0) return { ok: false, reason: 'none' };
    if ((dc.gift[id] || 0) >= CONFIG.GIFT_DAILY_CAP) { toast('今天已經送很多了，明天再來吧'); return { ok: false, reason: 'cap' }; }
    S.inv[giftId] -= 1;
    dc.gift[id] = (dc.gift[id] || 0) + 1;
    S.stats.giftsGiven += 1;
    var fav = (h.favGifts || []).indexOf(giftId) !== -1;
    var gain = addBond(id, fav ? 16 : 8);
    var g = findItem('gifts', giftId);
    var line = fav ? '（眼睛一亮）這是……我最喜歡的！謝謝你。' : '謝謝，我會好好珍惜的。';
    Snd.play('gift'); vibe([15, 30, 15]);
    save();
    if (galleryId === id) {
      closeModal();
      setText('hg-bubble', (g ? g.icon + ' ' : '') + line);
      Fx.floatText($('hg-art'), '♥ +' + gain, 'rose');
      renderGallery();
    }
    toast((fav ? '💖 正中喜好！' : '🎁 ') + '好感 +' + gain);
    return { ok: true, gain: gain, fav: fav, line: line };
  }

  /* ════════════════ 商店 ════════════════ */
  var shopTab = 'consumables';
  function findItem(tab, id) {
    var arr = SHOP[tab] || [];
    for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i];
    return null;
  }
  function renderShop() {
    qsa('#shop-tabs button').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === shopTab); });
    var list = $('shop-list'); if (!list) return;
    var cat = czGet(['shop', 'categories', shopTab]);
    var html = cat && cat.desc ? '<p class="muted small center" style="margin-bottom:8px">' + esc(cat.desc) + '</p>' : '';
    (SHOP[shopTab] || []).forEach(function (it) {
      var owned = shopTab === 'relics' ? !!S.relics[it.id] : shopTab === 'outfits' ? !!S.outfitsOwned[outfitIdForShop(it.id)] : 0;
      var count = S.inv[it.id] || 0;
      html += '<div class="shop-item"><div class="si-ico">' + itemIco(it, 'item-ico-lg') + '</div><div class="si-body"><b>' + esc(it.name) + '</b><div class="muted small">' + esc(it.desc) + '</div>' +
        (shopTab === 'consumables' || shopTab === 'gifts' ? (count ? '<div class="owned">持有 ×' + count + '</div>' : '') : (owned ? '<div class="owned">已擁有</div>' : '')) + '</div>' +
        '<button class="btn btn-sm btn-gold" data-buy="' + it.id + '"' + (owned || S.gold < it.price ? ' disabled' : '') + '>' + (owned ? '✓' : it.price + '金') + '</button></div>';
    });
    list.innerHTML = html;
    qsa('[data-buy]', list).forEach(function (b) { b.onclick = function () { buy(shopTab, b.getAttribute('data-buy')); }; });
  }
  function outfitIdForShop(shopId) {
    for (var i = 0; i < D.OUTFITS.length; i++) if (D.OUTFITS[i].shop === shopId) return D.OUTFITS[i].id;
    return shopId;
  }
  function buy(tab, id) {
    var it = findItem(tab, id);
    if (!it) return false;
    if (S.gold < it.price) { toast(pick(czGet(['shop', 'responses', 'notEnoughGold'])) || '金幣不足'); Snd.play('mismatch'); return false; }
    if (tab === 'relics' && S.relics[id]) return false;
    if (tab === 'outfits' && S.outfitsOwned[outfitIdForShop(id)]) return false;
    S.gold -= it.price;
    S.stats.purchases += 1;
    if (tab === 'relics') S.relics[id] = true;
    else if (tab === 'outfits') S.outfitsOwned[outfitIdForShop(id)] = true;
    else if (id === 'potion') { S.potionBuff = true; toast('記憶藥水已備妥：下一場達標金幣 +15%'); }
    else S.inv[id] = (S.inv[id] || 0) + 1;
    Snd.play('buy'); vibe(12);
    toast(pick(czGet(['shop', 'responses', 'buySuccess'])) || ('購入：' + it.name));
    checkAchievements(); save();
    renderShop(); refreshTop();
    return true;
  }

  /* ════════════════ 成就、排行、設定 ════════════════ */
  // UI v4：成就 id → 自製圖示（取代 data.js 的 emoji；data.js 不動）
  function achIco(id) {
    id = String(id || '');
    if (id === 'stage50' || /^lv\d/.test(id)) return 'crown';
    if (/^stage\d/.test(id)) return 'map';
    if (/^(perfect|star|three)/.test(id)) return 'star';
    if (/^combo/.test(id)) return 'battle';
    if (/^skill/.test(id)) return 'skill';
    if (/^(streak|daily)/.test(id)) return 'daily';
    if (/^endless/.test(id)) return 'endless';
    return 'trophy';   // first_win、boss* 及其他
  }
  function renderAch() {
    var got = Object.keys(S.achievements).length;
    setText('ach-summary', '已解鎖 ' + got + ' / ' + ACHIEVEMENTS.length);
    var list = $('ach-list'); if (!list) return;
    list.innerHTML = ACHIEVEMENTS.map(function (a) {
      var ok = !!S.achievements[a.id];
      return '<div class="ach-item' + (ok ? '' : ' locked') + '"><div class="ach-ico">' + itemIco(a, 'item-ico-md') + '</div><div><b>' + esc(a.name) + '</b><div class="muted small">' + esc(a.desc) + (ok ? ' <span class="ach-ok">' + icoHTML('check') + '</span>' : ' · 獎 ' + a.reward + ' 金') + '</div></div></div>';
    }).join('');
  }
  function showLeaderboard() {
    var rows = S.leaderboard.length ? S.leaderboard.map(function (e, k) {
      return '<div class="lb-row"><b>' + (k + 1) + '</b><span>' + esc(heroine(e.hero).name) + ' · 第 ' + e.round + ' 輪<br><small class="muted">' + esc(e.date) + '</small></span><b>' + e.score + '</b></div>';
    }).join('') : '<p class="muted">尚無紀錄。挑戰無盡模式吧！</p>';
    openModal('<h3>🏆 無盡排行榜</h3>' + rows + '<p class="muted small" style="margin-top:8px">最佳輪數：' + (S.stats.endlessBestRound || 0) + '</p><button class="btn btn-gold" id="m-cancel" style="width:100%;margin-top:8px">關閉</button>');
    bindModalBtn('m-cancel', closeModal);
  }
  function renderSettings() {
    var st = S.settings;
    var set = function (id, prop, val) { var el = $(id); if (el) el[prop] = val; };
    set('set-sfx', 'checked', !!st.sfx); set('set-bgm', 'checked', !!st.bgm);
    set('set-sfx-vol', 'value', st.sfxVol); set('set-bgm-vol', 'value', st.bgmVol);
    set('set-vibrate', 'checked', !!st.vibrate); set('set-shake', 'checked', !!st.shake);
    setText('set-stats', '勝 ' + S.stats.wins + ' · 敗 ' + S.stats.losses + ' · 完美 ' + S.stats.perfects + ' · 最高連擊 ' + S.stats.maxCombo + ' · 頭目 ' + S.stats.bossWins + ' · ★' + totalStars());
    setText('set-version', '記憶帝國：女傑翻牌 ' + (D.VERSION || 'v3.0'));
  }
  function setAudio(patch) {
    for (var k in patch) S.settings[k] = patch[k];
    Snd.applySettings();
    if (S.settings.bgm) Snd.bgm(currentScreen === 'battle' && battle && battle.cfg.boss ? 'boss' : currentScreen === 'battle' ? 'battle' : 'main');
    else Snd.stopBgm();
    save(); refreshTop();
  }

  /* ════════════════ 綁定 ════════════════ */
  function on(id, ev, fn) { var el = $(id); if (el) el.addEventListener(ev, fn); }
  function bind() {
    qsa('#nav button').forEach(function (b) {
      b.addEventListener('click', function () {
        if (battle && !battle.over) return;
        Snd.play('tap');
        closeGallery();
        go(b.getAttribute('data-go'));
      });
    });
    on('btn-fight', 'click', function () {
      Snd.play('tap');
      if (S.maxStage > CAMPAIGN_STAGES && S.stage >= CAMPAIGN_STAGES) { go('map'); toast('戰役已全破！可於地圖重刷關卡衝三星'); return; }
      beginCampaign(S.stage);
    });
    on('btn-train-cta', 'click', function () {
      Snd.play('tap');
      if (S.maxStage > CAMPAIGN_STAGES && S.stage >= CAMPAIGN_STAGES) { go('map'); toast('戰役已全破！可於地圖重刷關卡衝三星'); return; }
      beginCampaign(S.stage);
    });
    on('btn-daily', 'click', function () {
      Snd.play('tap');
      var c = D.dailyConfig(todayStr()), mech = c.boss ? D.bossMech(c.boss) : null;
      var done = S.daily.date === todayStr() && S.daily.done;
      openModal('<h3>🗓️ ' + esc(c.label) + '</h3><p class="muted">同一天所有玩家的牌局相同。<br>' + c.cols + '×' + c.rows + ' · ' + c.sets + ' 組 · 限時 ' + c.time + ' 秒 · 失誤上限 ' + c.missLimit +
        (mech ? '<br>♛ 特殊規則：' + esc(mech.name) + '（' + esc(mech.desc) + '）' : '') + '</p><p>' + (done ? '今日已完成 ✓ 最佳 ' + S.daily.best + '（再挑戰獎勵降低）' : '首次通關：🪙+150、經驗+60') + '</p>' +
        '<div class="btn-row"><button class="btn secondary" id="m-cancel">返回</button><button class="btn btn-gold" id="m-go">開始挑戰</button></div>');
      bindModalBtn('m-cancel', closeModal);
      bindModalBtn('m-go', function () { closeModal(); beginDaily(); });
    });
    on('btn-endless', 'click', function () {
      Snd.play('tap');
      openModal('<h3>♾️ 無盡模式</h3><p class="muted">連續挑戰逐漸變難的牌局，每 3 輪出現頭目機制。剩餘時間的一半會帶入下一輪（最多 15 秒）。失敗或收手時記錄總分。</p>' +
        '<p>最佳：第 ' + (S.stats.endlessBestRound || 0) + ' 輪 · ' + (S.stats.endlessBest || 0) + ' 分</p>' +
        '<div class="btn-row"><button class="btn secondary" id="m-cancel">返回</button><button class="btn btn-gold" id="m-go">開始</button></div>');
      bindModalBtn('m-cancel', closeModal);
      bindModalBtn('m-go', function () { closeModal(); beginEndless(1); });
    });
    on('btn-map', 'click', function () { Snd.play('tap'); go('map'); });
    on('btn-board', 'click', function () { Snd.play('tap'); showLeaderboard(); });
    on('btn-skill', 'click', useSkill);
    on('btn-pause', 'click', function () { Snd.play('tap'); showPause(); });
    on('home-hero-img', 'click', function () { openGallery(S.selected); });
    on('home-greet', 'click', function () { var g = $('home-greet'); g.textContent = greetingFor(S.selected); Snd.play('chime'); });
    on('tb-settings', 'click', function () {
      if (battle && !battle.over) { showPause(); return; }
      Snd.play('tap'); closeGallery(); go(currentScreen === 'settings' ? 'home' : 'settings');
    });
    on('tb-mute', 'click', function () {
      var anyOn = S.settings.sfx || S.settings.bgm;
      setAudio({ sfx: !anyOn, bgm: !anyOn });
      if (!anyOn) Snd.play('tap');
      toast(anyOn ? '已靜音' : '已開啟聲音');
      if (currentScreen === 'settings') renderSettings();
    });
    // 設定
    on('set-sfx', 'change', function () { setAudio({ sfx: $('set-sfx').checked }); Snd.play('tap'); });
    on('set-bgm', 'change', function () { setAudio({ bgm: $('set-bgm').checked }); });
    on('set-sfx-vol', 'input', function () { S.settings.sfxVol = clamp(parseFloat($('set-sfx-vol').value) || 0, 0, 1); Snd.applySettings(); });
    on('set-sfx-vol', 'change', function () { save(); Snd.play('flip'); });
    on('set-bgm-vol', 'input', function () { S.settings.bgmVol = clamp(parseFloat($('set-bgm-vol').value) || 0, 0, 1); Snd.applySettings(); });
    on('set-bgm-vol', 'change', save);
    on('set-vibrate', 'change', function () { S.settings.vibrate = $('set-vibrate').checked; save(); vibe(20); });
    on('set-shake', 'change', function () { S.settings.shake = $('set-shake').checked; save(); Fx.shake(); });
    on('btn-reset', 'click', function () {
      if (!window.confirm('確定要重置所有進度嗎？此操作無法復原。')) return;
      S = defaultState(); GameAPI.state = S; save();
      toast('進度已重置'); go('home');
    });
    // 商店分頁
    qsa('#shop-tabs button').forEach(function (b) {
      b.addEventListener('click', function () { shopTab = b.getAttribute('data-tab'); Snd.play('tap'); renderShop(); });
    });
    // 備用女傑介面
    on('hg-close', 'click', function () { Snd.play('tap'); closeGallery(); });
    on('hg-talk', 'click', talkHeroine);
    on('hg-gift', 'click', function () { Snd.play('tap'); giftFlow(); });
    on('hg-select', 'click', function () {
      if (!galleryId || !S.unlocked[galleryId]) return;
      S.selected = galleryId; save(); Snd.play('tap');
      toast('出戰：' + heroine(galleryId).name); renderGallery();
    });
    on('hg-title', 'click', function () {
      if (!galleryId) return;
      S.fav[galleryId] = !S.fav[galleryId]; save(); renderGallery();
      toast(S.fav[galleryId] ? '★ 已設為最愛' : '已取消最愛');
    });
    qsa('#hg-zones button').forEach(function (b) {
      b.addEventListener('click', function (e) { e.stopPropagation(); tapZone(b.getAttribute('data-zone')); });
    });
    // 立繪視差
    var wrap = qs('.hg-art-wrap');
    if (wrap) wrap.addEventListener('pointermove', function (e) {
      var r = wrap.getBoundingClientRect(), art = $('hg-art');
      if (!art || art.classList.contains('zoomed')) return;
      var dx = ((e.clientX - r.left) / r.width - 0.5) * 8, dy = ((e.clientY - r.top) / r.height - 0.5) * 6;
      art.style.translate = (-dx).toFixed(1) + 'px ' + (-dy).toFixed(1) + 'px';
    });
    // 點擊遮罩關閉（戰鬥暫停時除外，避免誤觸）
    on('modal', 'click', function (e) { if (e.target === $('modal') && !(battle && !battle.over)) closeModal(); });
    // 背景／前景
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        if (battle && battle.running && !battle.over && !battle.paused) showPause();
      } else { Snd.unlock(); refreshTop(); }
    });
    // 第一次互動解鎖音訊（iOS）
    var unlockOnce = function () {
      Snd.unlock(); Snd.applySettings();
      if (started) Snd.bgm(currentScreen === 'battle' ? 'battle' : 'main');
      document.removeEventListener('pointerdown', unlockOnce, true);
      document.removeEventListener('touchend', unlockOnce, true);
      document.removeEventListener('keydown', unlockOnce, true);
    };
    document.addEventListener('pointerdown', unlockOnce, true);
    document.addEventListener('touchend', unlockOnce, true);
    document.addEventListener('keydown', unlockOnce, true);
  }

  /* ════════════════ 標題畫面 ════════════════ */
  function setupTitle() {
    var ts = $('title-screen');
    setText('ts-ver', 'v3.1-ui');   // UI v4 殼層版本標記
    if (!ts) { started = true; return; }
    var art = qs('.ts-art', ts);
    if (art) art.style.backgroundImage = "url('assets/heroines/" + heroine(S.selected).id + ".webp')";
    var startFn = function () {
      if (started) return;
      started = true;
      Snd.unlock(); Snd.applySettings();
      Snd.play('chime');
      Snd.bgm('main');
      ts.classList.add('leaving');
      setTimeout(function () { ts.style.display = 'none'; }, 650);
      if (S.migratedFrom) { toast('已從舊版存檔遷移進度（' + S.migratedFrom + '）'); delete S.migratedFrom; save(); }
      var g = $('home-greet'); if (g) { g.textContent = greetingFor(S.selected); g.setAttribute('data-hero', S.selected); }
      if (!S.seenIntro[1] && S.maxStage <= 1) setTimeout(function () { if (currentScreen === 'home' && !battle && $('modal').classList.contains('hidden') && !S.seenIntro[1]) showChapterIntro(1, null); }, 700);
    };
    on('ts-start', 'click', startFn);
    ts.addEventListener('click', function (e) { if (e.target !== $('ts-start')) startFn(); });
  }

  /* ════════════════ 對外 API（heroine.js / story.js 使用） ════════════════ */
  var GameAPI = {
    version: D.VERSION,
    state: S,
    getState: function () { return S; },
    save: save,
    data: D,
    heroine: heroine,
    bondLevel: bondLv,
    addBond: addBond,
    giveGift: giveGift,
    addGold: function (n) { var g = addGold(n); save(); refreshTop(); return g; },
    spendGold: function (n) { if (S.gold < n) return false; S.gold -= n; save(); refreshTop(); return true; },
    inventory: function () { return S.inv; },
    dayCounters: day,
    toast: toast,
    toastClear: toastClear,
    sfx: function (n, o) { Snd.play(n, o); },
    duck: function (v) { Snd.duck(v); },
    vibe: vibe,
    fx: Fx,
    content: CZ,
    greeting: greetingFor,
    selectHeroine: function (id) { if (!S.unlocked[id]) return false; S.selected = id; save(); renderHome(); return true; },
    setOutfit: function (id, outfitId) { var o = null; D.OUTFITS.forEach(function (x) { if (x.id === outfitId) o = x; }); if (!o || outfitStatus(o, id) !== true) return false; S.outfit[id] = outfitId; save(); return true; },
    outfitStatus: function (id, outfitId) { var o = null; D.OUTFITS.forEach(function (x) { if (x.id === outfitId) o = x; }); return o ? outfitStatus(o, id) : false; },
    markScene: function (sceneId) { S.scenesSeen[sceneId] = true; save(); },
    sceneSeen: function (sceneId) { return !!S.scenesSeen[sceneId]; },
    refresh: function () { refreshTop(); if (currentScreen === 'home') renderHome(); if (currentScreen === 'roster') renderRoster(); },
    go: go,
    openGallery: openGallery,
    closeGallery: closeGallery,
    openModal: openModal,
    closeModal: closeModal,
    trainingSummary: function () { return window.Training ? Training.summary(S) : null; }
  };
  window.GameAPI = GameAPI;
  window.Training = window.Training || null;

  /* ════════════════ 除錯（?debug=1 或 localStorage.memoryRPG_debug=1） ════════════════ */
  function debugEnabled() {
    try { if (/[?&]debug=1\b/.test(location.search)) return true; } catch (e) {}
    try { return localStorage.getItem('memoryRPG_debug') === '1'; } catch (e) { return false; }
  }
  function setupDebug() {
    if (!debugEnabled()) return;
    window.__DEBUG = {
      state: function () { return S; },
      skipToStage: function (n) {
        n = clamp(n | 0, 1, CAMPAIGN_STAGES);
        if (S.maxStage < n) S.maxStage = n;
        S.stage = n; S.energy = Math.max(S.energy, S.energyMax);
        save(); go('home'); return D.stageConfig(n);
      },
      forceBoss: function (mech) {
        var ids = D.BOSS_MECHS.map(function (m) { return m.id; });
        if (ids.indexOf(mech) === -1) mech = pick(ids);
        var cfg = D.stageConfig(Math.max(5, S.stage), { boss: mech });
        cfg.mode = 'campaign';
        S.energy = Math.max(S.energy, 1);
        if (battle) { clearBattleTimers(); battle = null; }
        startBattle(cfg, {});
        return cfg;
      },
      winLevel: function () {
        if (!battle || battle.over) return false;
        battle.matched = battle.cfg.sets;
        battle.cards.forEach(function (c, k) { if (!c.joker) { c.matched = true; c.open = true; syncCard(k); } });
        endBattle(true); return true;
      },
      loseLevel: function () { if (battle && !battle.over) endBattle(false, 'time'); },
      unlockAll: function () {
        HIDS.forEach(function (id) { S.unlocked[id] = true; });
        S.gold += 99999; S.energy = 99; S.maxStage = CAMPAIGN_STAGES + 1;
        D.OUTFITS.forEach(function (o) { S.outfitsOwned[o.id] = true; if (o.event) S.events[o.event] = true; });
        save(); go(currentScreen === 'battle' ? 'home' : currentScreen); return true;
      },
      setBond: function (id, n) {
        if (HIDS.indexOf(id) === -1) return false;
        // n ≤ 5 視為心數，否則視為點數
        S.bond[id] = clamp(n <= CONFIG.BOND_MAX ? n * BOND_PER : n, 0, BOND_PTS_MAX);
        save(); GameAPI.refresh(); if (galleryId === id) renderGallery(); return S.bond[id];
      },
      audioTest: function () { Snd.unlock(); return Snd.test(); },
      reveal: function () { if (battle) $('board').classList.toggle('previewing'); },
      battle: function () { return battle; },
      migrateFrom: function (json) { S = normalize(migrate(typeof json === 'string' ? JSON.parse(json) : json)); GameAPI.state = S; save(); go('home'); return S; }
    };
    if (window.console) console.info('[game] __DEBUG enabled', Object.keys(window.__DEBUG));
  }

  /* ════════════════ 啟動 ════════════════ */
  function init() {
    try { bind(); } catch (e) { warn('[game] bind error', e); }
    Snd.applySettings();
    setupTitle();
    setupDebug();
    go('home');
    setInterval(refreshTop, 1000);
    heroineModule();
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
    emit('game:ready', { api: GameAPI });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
