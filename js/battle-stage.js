/*! 記憶帝國・像素戰鬥舞台 (BattleStage)
 * 演出層：配對→攻擊、失誤→反擊、技能斜線、勝敗姿勢。
 * HP 綁 pairsTotal；錯誤一律吞掉（wrap + game.js safeRun）。
 */
(function (global) {
  'use strict';

  var CLASS_OF = {
    verda: 'mage', karena: 'vanguard', elys: 'support', selas: 'assassin', reina: 'paladin'
  };
  /* CSS 契約：投射物 k-bolt/k-dagger/k-beam；斬擊 k-rush/k-slash */
  var CLASS_PROJ = {
    mage: { proj: 'k-bolt', slash: null, color: '#b07cff' },
    vanguard: { proj: null, slash: 'k-rush', color: '#ff4a4a' },
    support: { proj: 'k-beam', slash: null, color: '#4fe3ff' },
    assassin: { proj: 'k-dagger', slash: null, color: '#5be38a' },
    paladin: { proj: null, slash: 'k-slash', color: '#ffd34a' }
  };

  var root = null, screenEl = null, els = {};
  var state = null, timers = [], idleToggle = false, idleTimer = null;
  var mounted = false, reduceMotion = false, matchSeq = 0;

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
    var t = setTimeout(function () {
      try { fn(); } catch (e) { if (global.console) console.warn('[BattleStage] later', e); }
    }, ms);
    timers.push(t);
    return t;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
  }
  function stopIdle() {
    if (idleTimer) { clearInterval(idleTimer); idleTimer = null; }
  }

  /** 替換女傑圖：url 或 {idle0,idle1,attack,hit,victory} 對應 URL；亦可 sprite sheet {sheet,fw,fh,frames} */
  function setHeroArt(spec) {
    if (!state) state = state || {};
    state.heroArt = spec || null;
    applyHeroFrame(els.heroSprite && els.heroSprite.getAttribute('data-pose') || 'idle');
  }
  function setFoeArt(spec) {
    if (!state) return;
    state.foeArt = spec || null;
    applyFoeArt();
  }
  function applyFoeArt() {
    if (!els.foeSprite) return;
    var art = state && state.foeArt;
    if (!art) return;
    if (typeof art === 'string') {
      els.foeSprite.style.backgroundImage = 'url("' + art + '")';
      els.foeSprite.style.backgroundPosition = 'center';
      els.foeSprite.style.backgroundSize = 'contain';
      return;
    }
    if (art.url) {
      els.foeSprite.style.backgroundImage = 'url("' + art.url + '")';
      els.foeSprite.style.backgroundSize = art.size || 'contain';
      els.foeSprite.style.backgroundPosition = art.pos || 'center bottom';
    }
  }
  function applyHeroFrame(pose) {
    var node = els.heroSprite;
    if (!node) return;
    var art = state && state.heroArt;
    var id = node.getAttribute('data-id') || (state && state.heroineId) || 'verda';
    pose = pose || 'idle';
    if (art && typeof art === 'object' && art.sheet) {
      var fw = art.fw || 32, fh = art.fh || 32;
      var frames = art.frames || ['idle0','idle1','attack','hit','victory'];
      var frame = pose === 'idle' ? (idleToggle ? 'idle1' : 'idle0') : pose;
      if (pose === 'down') frame = 'hit';
      var idx = frames.indexOf(frame); if (idx < 0) idx = 0;
      node.style.backgroundImage = 'url("' + art.sheet + '")';
      node.style.backgroundSize = (fw * frames.length) + 'px ' + fh + 'px';
      node.style.backgroundPosition = (-idx * fw) + 'px 0';
      node.style.imageRendering = 'pixelated';
      return;
    }
    if (art && typeof art === 'object') {
      var frame2 = pose === 'idle' ? (idleToggle ? 'idle1' : 'idle0') : (pose === 'down' ? 'hit' : pose);
      var url = art[frame2] || art[pose] || art.idle0 || art.idle;
      if (url) {
        node.style.backgroundImage = 'url("' + url + '")';
        node.style.backgroundSize = 'contain';
        node.style.backgroundPosition = 'center bottom';
        return;
      }
    }
    if (typeof art === 'string') {
      node.style.backgroundImage = 'url("' + art + '")';
      node.style.backgroundSize = 'contain';
      node.style.backgroundPosition = 'center bottom';
      return;
    }
    // 預設路徑：assets/battle/heroines/{id}_{frame}.png
    var fr = pose === 'idle' ? (idleToggle ? 'idle1' : 'idle0') : (pose === 'down' ? 'hit' : pose);
    node.style.backgroundImage = 'url("assets/battle/heroines/' + id + '_' + fr + '.png")';
    node.style.backgroundSize = 'contain';
    node.style.backgroundPosition = 'center bottom';
  }

  /** 左下斜切頭像：assets/battle/ui/{id}_portrait.png，缺圖退回 assets/heroines/{id}-sm.webp */
  function setPortrait(id) {
    var img = screenEl && $('.bs-portrait', screenEl);
    if (!img) return;
    img.onerror = function () {
      img.onerror = null;
      img.src = 'assets/heroines/' + id + '-sm.webp';
    };
    img.src = 'assets/battle/ui/' + id + '_portrait.png';
  }
  /** 怪物受擊換幀（有 hitUrl 且未被 setFoeArt 覆寫時） */
  function foeHitFrame(ms) {
    var n = els.foeSprite;
    if (!n || !state || state.foeArt || !state.foeHitUrl) return;
    var st = state;
    n.style.backgroundImage = 'url("' + st.foeHitUrl + '")';
    later(function () {
      if (state !== st || !els.foeSprite || st.hp <= 0) return; // 擊倒時保留受擊幀直到淡出
      els.foeSprite.style.backgroundImage = 'url("' + st.foeUrl + '")';
    }, ms);
  }

  function setHeroPose(pose) {
    var node = els.heroSprite;
    if (!node) return;
    node.setAttribute('data-pose', pose || 'idle');
    node.classList.toggle('is-down', pose === 'hit' || pose === 'down');
    applyHeroFrame(pose || 'idle');
  }
  function clearFoeAnim() {
    var n = els.foeSprite;
    if (!n) return;
    n.classList.remove('is-hit', 'is-hit-lg', 'is-attack', 'is-dead', 'is-intro');
  }
  function setFoeAnim(cls, ms) {
    var n = els.foeSprite;
    if (!n) return;
    clearFoeAnim();
    if (cls) n.classList.add(cls);
    if (ms && cls !== 'is-dead') {
      later(function () { if (n) n.classList.remove(cls); }, ms);
    }
  }
  function heroClass() {
    return CLASS_OF[(state && state.heroineId) || 'verda'] || 'mage';
  }
  function monsterKey(chapter, boss, stageN) {
    var ch = Math.max(1, Math.min(5, chapter || 1));
    if (boss) return 'ch' + ch + '_boss';
    return 'ch' + ch + '_mob_' + (((stageN || 1) % 2 === 0) ? 'b' : 'a');
  }
  function foeLabel(boss, bossName, chapter) {
    if (boss && bossName) return bossName;
    var names = {
      1: ['霧影小妖', '外環遊魂'], 2: ['鏡影侍從', '裂面使者'],
      3: ['星屑精靈', '燈籠妖'], 4: ['霜晶魂', '寒鐵兵'], 5: ['影侍衛', '虛冠爪牙']
    };
    var arr = names[chapter] || ['帝國餘孽', '無名之敵'];
    return arr[(state && state.stageN || 1) % 2];
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
        '<div class="bs-sprite bs-foe-sprite" data-kind="mob" role="img" aria-label="敵方"></div>' +
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
    var pct = state.hpMax <= 0 ? 0 : Math.max(0, Math.min(100, (state.hp / state.hpMax) * 100));
    els.foeHpFill.style.width = pct + '%';
    if (els.foeHp) els.foeHp.classList.toggle('low', pct > 0 && pct <= 28);
  }

  function spawnFX(cls, strong) {
    if (!els.fx || reduceMotion) return;
    var pack = CLASS_PROJ[cls] || CLASS_PROJ.mage;
    root.style.setProperty('--k', pack.color);
    if (pack.proj) {
      var p = document.createElement('div');
      p.className = 'bs-proj ' + pack.proj + (strong ? ' strong' : '');
      els.fx.appendChild(p);
      later(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 320);
    }
    if (pack.slash) {
      var s = document.createElement('div');
      s.className = 'bs-slash ' + pack.slash + (strong ? ' strong' : '');
      els.fx.appendChild(s);
      later(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 300);
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
    if (reduceMotion || !root) return;
    root.classList.add('is-hitstop');
    later(function () { root.classList.remove('is-hitstop'); }, ms || 50);
  }

  function shake(lg) {
    if (!shakeAllowed() || !root) return;
    root.classList.remove('is-shake', 'is-shake-lg');
    void root.offsetWidth;
    root.classList.add(lg ? 'is-shake-lg' : 'is-shake');
    later(function () { root.classList.remove('is-shake', 'is-shake-lg'); }, lg ? 340 : 260);
  }

  function tryFx(names, args) {
    var FX = global.FX;
    if (!FX) return;
    for (var i = 0; i < names.length; i++) {
      if (typeof FX[names[i]] === 'function') {
        try { FX[names[i]].apply(FX, args || []); return; } catch (e) {}
      }
    }
  }

  function startIdle() {
    stopIdle();
    idleToggle = false;
    idleTimer = setInterval(function () {
      if (!state || state.busy || state.ended) return;
      idleToggle = !idleToggle;
      if (els.heroSprite && els.heroSprite.getAttribute('data-pose') === 'idle') setHeroPose('idle');
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
    matchSeq = 0;
    var h = opts.heroine || {};
    var hid = h.id || 'verda';
    var chapter = opts.chapter || 1;
    var boss = !!opts.boss;
    var pairs = Math.max(1, opts.pairsTotal || 1);
    state = {
      heroineId: hid, heroine: h, chapter: chapter, boss: boss,
      bossName: opts.bossName || '', stageN: opts.stageN || 1,
      hpMax: pairs, hp: pairs, busy: false, ended: false
    };
    root.classList.toggle('is-boss', boss);
    root.classList.remove('is-intro', 'is-shake', 'is-shake-lg', 'is-hitstop');
    if (els.bg) {
      els.bg.setAttribute('data-ch', String(Math.max(1, Math.min(5, chapter))));
    }
    if (els.heroSprite) {
      els.heroSprite.setAttribute('data-id', hid);
      setHeroPose('idle');
    }
    if (els.heroName) els.heroName.textContent = h.name || hid;
    setPortrait(hid);
    var mk = monsterKey(chapter, boss, state.stageN);
    if (els.foeSprite) {
      var url = 'assets/battle/monsters/' + mk + '.png';
      state.foeUrl = url;
      state.foeHitUrl = null;
      // 受擊幀（目前僅 chN_mob_a 有 chN_mob_hit.png）；預載成功才啟用
      if (/_mob_a$/.test(mk)) {
        var hitUrl = 'assets/battle/monsters/' + mk.replace(/_mob_a$/, '_mob_hit') + '.png';
        var st = state, himg = new Image();
        himg.onload = function () { if (state === st) st.foeHitUrl = hitUrl; };
        himg.src = hitUrl;
      }
      els.foeSprite.style.backgroundImage = 'url("' + url + '")';
      els.foeSprite.setAttribute('data-kind', boss ? 'boss' : 'mob');
      clearFoeAnim();
      if (boss) {
        var hi = 'assets/battle/monsters/' + mk + '@1.5x.png';
        var img = new Image();
        img.onload = function () { if (els.foeSprite) els.foeSprite.style.backgroundImage = 'url("' + hi + '")'; };
        img.src = hi;
      }
    }
    if (els.foeName) els.foeName.textContent = foeLabel(boss, state.bossName, chapter);
    if (els.foeHpFill) els.foeHpFill.style.width = '100%';
    updateHp();
    if (boss) {
      root.classList.add('is-intro');
      setFoeAnim('is-intro', 650);
      tryFx(['flash'], ['crimson']);
      later(function () { root.classList.remove('is-intro'); }, 650);
    }
    startIdle();
  }

  function onMatch(info) {
    info = info || {};
    if (!state || !root || state.ended) return;
    var combo = info.combo || 1;
    var dmg;
    if (typeof info.remainingPairs === 'number') {
      var targetHp = Math.max(0, info.remainingPairs);
      dmg = Math.max(1, state.hp - targetHp);
      if (dmg > state.hp) dmg = state.hp;
    } else {
      dmg = 1 + Math.floor(Math.max(0, combo - 1) / 2);
      if (dmg > state.hp) dmg = state.hp;
      if (dmg < 1 && state.hp > 0) dmg = 1;
    }
    state.busy = true;
    var seq = ++matchSeq;
    var cls = heroClass();
    var strong = combo >= 3;
    setHeroPose('attack');
    spawnFX(cls, strong);
    later(function () {
      if (!state || seq !== matchSeq) return;
      setFoeAnim(strong ? 'is-hit-lg' : 'is-hit', strong ? 320 : 240);
      state.hp = Math.max(0, state.hp - dmg);
      foeHitFrame(strong ? 320 : 240);
      updateHp();
      spawnDmg(dmg, strong);
      if (strong) hitstop(combo >= 5 ? 70 : 45);
      later(function () {
        if (!state || seq !== matchSeq) return;
        if (state.hp <= 0) setFoeAnim('is-dead');
        if (!state.ended) {
          setHeroPose('idle');
          state.busy = false;
        }
      }, 240);
    }, reduceMotion ? 40 : 160);
  }

  function onMiss() {
    if (!state || !root || state.ended) return;
    state.busy = true;
    setFoeAnim('is-attack', 340);
    later(function () {
      setHeroPose('hit');
      shake(false);
      tryFx(['flash'], ['crimson']);
      later(function () {
        if (state && !state.ended) {
          setHeroPose('idle');
          state.busy = false;
        }
      }, 260);
    }, reduceMotion ? 40 : 140);
  }

  function onSkill() {
    if (!els.fx || !state) return;
    els.fx.classList.remove('is-skill');
    void els.fx.offsetWidth;
    els.fx.classList.add('is-skill');
    root.style.setProperty('--k', (CLASS_PROJ[heroClass()] || CLASS_PROJ.mage).color);
    setHeroPose('attack');
    tryFx(['flash'], ['arcane']);
    later(function () {
      if (els.fx) els.fx.classList.remove('is-skill');
      if (state && !state.ended) setHeroPose('idle');
    }, 600);
  }

  function onWin() {
    if (!state) return;
    state.ended = true;
    state.busy = false;
    matchSeq++; // cancel pending match callbacks that would reset pose
    stopIdle();
    state.hp = 0; updateHp();
    setFoeAnim('is-dead');
    setHeroPose('victory');
  }

  function onLose() {
    if (!state) return;
    state.ended = true;
    state.busy = false;
    matchSeq++;
    stopIdle();
    setHeroPose('hit');
    if (els.heroSprite) els.heroSprite.classList.add('is-down');
    setFoeAnim('is-attack', 400);
    shake(true);
  }

  function destroy() {
    clearTimers();
    state = null;
    if (root) {
      root.innerHTML = '';
      root.setAttribute('aria-hidden', 'true');
      root.classList.remove('is-boss', 'is-intro', 'is-shake', 'is-shake-lg', 'is-hitstop');
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
    setHeroArt: wrap(setHeroArt),
    setFoeArt: wrap(setFoeArt),
    _state: function () { return state; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { mount(); });
  } else {
    mount();
  }
})(typeof window !== 'undefined' ? window : this);
