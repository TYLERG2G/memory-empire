/*! 記憶帝國・像素戰鬥舞台 (BattleStage)
 * 演出層：配對→攻擊、失誤→反擊、技能斜線、勝敗姿勢。
 * 真相仍由 game.js 的配對數／時間決定；HP 綁 pairsTotal。
 */
(function (global) {
  'use strict';

  var CLASS_OF = {
    verda: 'mage', karena: 'vanguard', elys: 'support', selas: 'assassin', reina: 'paladin'
  };
  var CLASS_FX = {
    mage: 'mage', vanguard: 'vanguard', support: 'support', assassin: 'assassin', paladin: 'paladin'
  };

  var root = null, screenEl = null;
  var els = {};
  var state = null;
  var timers = [];
  var idleToggle = false;
  var idleTimer = null;
  var mounted = false;
  var reduceMotion = false;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function prefersReduce() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }
  function shakeAllowed() {
    try {
      var s = global.GameAPI && global.GameAPI.state && global.GameAPI.state.settings;
      if (s && s.shake === false) return false;
    } catch (e) {}
    return !reduceMotion;
  }
  function later(fn, ms) {
    var t = setTimeout(fn, ms);
    timers.push(t);
    return t;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
  }
  function setPose(node, pose) {
    if (!node) return;
    node.setAttribute('data-pose', pose || 'idle');
    var id = node.getAttribute('data-id');
    if (id && node.classList.contains('bs-hero-sprite')) {
      var frame = pose === 'idle' ? (idleToggle ? 'idle1' : 'idle0') : pose;
      node.style.backgroundImage = 'url("assets/battle/heroines/' + id + '_' + frame + '.png")';
    }
  }
  function setFoePose(pose) {
    var n = els.foeSprite;
    if (!n) return;
    n.setAttribute('data-pose', pose || 'idle');
  }
  function heroClass(h) {
    var id = (h && h.id) || (state && state.heroineId) || 'verda';
    return CLASS_OF[id] || 'mage';
  }
  function monsterKey(chapter, boss, stageN) {
    var ch = Math.max(1, Math.min(5, chapter || 1));
    if (boss) return 'ch' + ch + '_boss';
    var alt = ((stageN || 1) % 2 === 0) ? 'b' : 'a';
    return 'ch' + ch + '_mob_' + alt;
  }
  function foeLabel(boss, bossName, chapter) {
    if (boss && bossName) return bossName;
    var names = {
      1: ['霧影小妖', '外環遊魂'],
      2: ['鏡影侍從', '裂面使者'],
      3: ['星屑精靈', '燈籠妖'],
      4: ['霜晶魂', '寒鐵兵'],
      5: ['影侍衛', '虛冠爪牙']
    };
    var arr = names[chapter] || ['帝國餘孽', '無名之敵'];
    return boss ? (bossName || '守關者') : arr[(state && state.stageN || 1) % 2];
  }

  function buildDOM(stage) {
    stage.innerHTML =
      '<div class="bs-bg" data-ch="1" aria-hidden="true"></div>' +
      '<div class="bs-side bs-hero">' +
        '<div class="bs-sprite bs-hero-sprite" data-id="verda" data-pose="idle" role="img" aria-label="出戰女傑"></div>' +
        '<div class="bs-name"></div>' +
      '</div>' +
      '<div class="bs-fx" aria-hidden="true"></div>' +
      '<div class="bs-side bs-foe">' +
        '<div class="foe-meta"><span class="foe-name"></span><div class="foe-hp" aria-hidden="true"><i></i></div></div>' +
        '<div class="bs-sprite bs-foe-sprite" data-kind="mob" data-pose="idle" role="img" aria-label="敵方"></div>' +
      '</div>';
    els = {
      bg: $('.bs-bg', stage),
      heroSprite: $('.bs-hero-sprite', stage),
      heroName: $('.bs-name', stage),
      fx: $('.bs-fx', stage),
      foeName: $('.foe-name', stage),
      foeHp: $('.foe-hp', stage),
      foeHpFill: $('.foe-hp i', stage),
      foeSprite: $('.bs-foe-sprite', stage)
    };
  }

  function updateHp() {
    if (!state || !els.foeHpFill) return;
    var pct = state.hpMax <= 0 ? 0 : Math.max(0, Math.min(1, state.hp / state.hpMax));
    els.foeHpFill.style.transform = 'scaleX(' + pct + ')';
    if (els.foeHp) els.foeHp.classList.toggle('low', pct > 0 && pct <= 0.28);
  }

  function spawnProj(cls) {
    if (!els.fx || reduceMotion) return;
    var p = document.createElement('div');
    p.className = 'bs-proj ' + (CLASS_FX[cls] || 'mage');
    els.fx.appendChild(p);
    later(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 320);
    if (cls === 'paladin' || cls === 'vanguard') {
      var s = document.createElement('div');
      s.className = 'bs-slash';
      els.fx.appendChild(s);
      later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 260);
    }
  }

  function spawnDmg(n, big) {
    if (!els.fx) return;
    var d = document.createElement('div');
    d.className = 'bs-dmg' + (big ? ' big' : '');
    d.textContent = '-' + n;
    els.fx.appendChild(d);
    later(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 750);
  }

  function hitstop(ms) {
    if (reduceMotion || !screenEl) return;
    screenEl.classList.add('bs-hitstop');
    later(function () { screenEl.classList.remove('bs-hitstop'); }, ms || 50);
  }

  function shake() {
    if (!shakeAllowed() || !screenEl) return;
    screenEl.classList.remove('bs-shake');
    void screenEl.offsetWidth;
    screenEl.classList.add('bs-shake');
    later(function () { screenEl.classList.remove('bs-shake'); }, 300);
  }

  function tryFx(names, args) {
    var FX = global.FX;
    if (!FX) return;
    for (var i = 0; i < names.length; i++) {
      var fn = FX[names[i]];
      if (typeof fn === 'function') {
        try { fn.apply(FX, args || []); return; } catch (e) {}
      }
    }
  }

  function startIdle() {
    if (idleTimer) clearInterval(idleTimer);
    idleToggle = false;
    idleTimer = setInterval(function () {
      if (!state || state.busy) return;
      idleToggle = !idleToggle;
      if (els.heroSprite && els.heroSprite.getAttribute('data-pose') === 'idle') {
        setPose(els.heroSprite, 'idle');
      }
    }, reduceMotion ? 2000 : 480);
  }

  function mount(el) {
    reduceMotion = prefersReduce();
    root = el || $('.battle-stage', $('#scr-battle') || document);
    screenEl = $('#scr-battle') || (root && root.closest('#scr-battle'));
    if (!root) return false;
    buildDOM(root);
    root.setAttribute('aria-hidden', 'false');
    mounted = true;
    return true;
  }

  function start(opts) {
    opts = opts || {};
    if (!mounted) mount();
    if (!root) return;
    clearTimers();
    var h = opts.heroine || {};
    var hid = h.id || 'verda';
    var chapter = opts.chapter || 1;
    var boss = !!opts.boss;
    var pairs = Math.max(1, opts.pairsTotal || 1);
    state = {
      heroineId: hid,
      heroine: h,
      chapter: chapter,
      boss: boss,
      bossName: opts.bossName || '',
      stageN: opts.stageN || 1,
      hpMax: pairs,
      hp: pairs,
      busy: false
    };
    root.classList.toggle('is-boss', boss);
    root.classList.remove('is-intro');
    if (els.bg) {
      els.bg.setAttribute('data-ch', String(chapter));
      els.bg.style.backgroundImage = 'url("assets/battle/bg/ch' + chapter + '.png")';
    }
    if (els.heroSprite) {
      els.heroSprite.setAttribute('data-id', hid);
      setPose(els.heroSprite, 'idle');
    }
    if (els.heroName) els.heroName.textContent = h.name || hid;
    var mk = monsterKey(chapter, boss, state.stageN);
    if (els.foeSprite) {
      var url = 'assets/battle/monsters/' + mk + '.png';
      if (boss) {
        var hi = 'assets/battle/monsters/' + mk + '@1.5x.png';
        var img = new Image();
        img.onload = function () { if (els.foeSprite) els.foeSprite.style.backgroundImage = 'url("' + hi + '")'; };
        img.onerror = function () { if (els.foeSprite) els.foeSprite.style.backgroundImage = 'url("' + url + '")'; };
        img.src = hi;
        els.foeSprite.style.backgroundImage = 'url("' + url + '")';
      } else {
        els.foeSprite.style.backgroundImage = 'url("' + url + '")';
      }
      els.foeSprite.setAttribute('data-kind', boss ? 'boss' : 'mob');
      setFoePose('idle');
    }
    if (els.foeName) els.foeName.textContent = foeLabel(boss, state.bossName, chapter);
    updateHp();
    if (boss) {
      root.classList.add('is-intro');
      tryFx(['flash'], ['crimson']);
      later(function () { root.classList.remove('is-intro'); }, 650);
    }
    startIdle();
  }

  function onMatch(info) {
    info = info || {};
    if (!state || !root) return;
    var combo = info.combo || 1;
    var dmg;
    if (typeof info.remainingPairs === 'number') {
      // 以剩餘配對為準，保證最後一配斬殺
      var targetHp = Math.max(0, info.remainingPairs);
      dmg = Math.max(0, state.hp - targetHp);
      if (dmg < 1 && state.hp > 0 && targetHp < state.hp) dmg = state.hp - targetHp;
      if (dmg < 1 && state.hp > 0) dmg = 1;
    } else {
      dmg = 1 + Math.floor(Math.max(0, combo - 1) / 2);
      if (dmg > state.hp) dmg = state.hp;
      if (dmg < 1 && state.hp > 0) dmg = 1;
    }
    state.busy = true;
    var cls = heroClass(state.heroine);
    setPose(els.heroSprite, 'attack');
    spawnProj(cls);
    later(function () {
      setFoePose('hit');
      state.hp = Math.max(0, state.hp - dmg);
      updateHp();
      spawnDmg(dmg, combo >= 3);
      if (combo >= 3) hitstop(combo >= 5 ? 70 : 45);
      tryFx(['burst', 'hitSpark'], [els.foeSprite, combo >= 3 ? 'crit' : 'match']);
      later(function () {
        setFoePose(state.hp <= 0 ? 'dead' : 'idle');
        setPose(els.heroSprite, 'idle');
        state.busy = false;
      }, 220);
    }, reduceMotion ? 40 : 160);
  }

  function onMiss() {
    if (!state || !root) return;
    state.busy = true;
    setFoePose('attack');
    later(function () {
      setPose(els.heroSprite, 'hit');
      shake();
      tryFx(['flash'], ['crimson']);
      later(function () {
        setPose(els.heroSprite, 'idle');
        setFoePose('idle');
        state.busy = false;
      }, 240);
    }, reduceMotion ? 40 : 140);
  }

  function onSkill(info) {
    info = info || {};
    if (!els.fx) return;
    var flash = document.createElement('div');
    flash.className = 'bs-skill-flash';
    els.fx.appendChild(flash);
    later(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 480);
    setPose(els.heroSprite, 'attack');
    tryFx(['flash'], ['arcane']);
    later(function () { setPose(els.heroSprite, 'idle'); }, 360);
  }

  function onWin() {
    if (!state) return;
    state.hp = 0; updateHp();
    setFoePose('dead');
    setPose(els.heroSprite, 'victory');
    tryFx(['burst'], [els.heroSprite, 'clear']);
  }

  function onLose() {
    if (!state) return;
    setPose(els.heroSprite, 'hit');
    setFoePose('attack');
    shake();
  }

  function destroy() {
    clearTimers();
    state = null;
    if (root) {
      root.innerHTML = '';
      root.setAttribute('aria-hidden', 'true');
    }
    mounted = false;
    els = {};
  }

  function wrap(fn) {
    return function () {
      try { return fn.apply(null, arguments); }
      catch (e) { if (global.console) console.warn('[BattleStage]', e); }
    };
  }
  global.BattleStage = {
    mount: wrap(mount),
    start: wrap(start),
    onMatch: wrap(onMatch),
    onMiss: wrap(onMiss),
    onSkill: wrap(onSkill),
    onWin: wrap(onWin),
    onLose: wrap(onLose),
    destroy: wrap(destroy),
    _state: function () { return state; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mount(); });
  } else {
    mount();
  }
})(typeof window !== 'undefined' ? window : this);
