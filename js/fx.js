/*!
 * 記憶帝國：女傑翻牌 v3 — Boutique Visual FX & PixelFX Bridge (js/fx.js)
 *
 * Uses vendored pixelfx (js/vendor/pixelfx/pixelfx.bundle.js -> global PixelFX):
 *   pixelfx v0.3.0 subset — https://github.com/patch-gg/pixelfx
 *   MIT License — Copyright (c) 2026 Patch, Copyright (c) 2026 Hugo Duprez
 *   (Includes adaptations of Sprite Fusion open-source pixel art VFX by Hugo Duprez, MIT;
 *    see js/vendor/pixelfx/LICENSE and js/vendor/pixelfx/NOTICE.md.)
 *
 * Recolored to Imperial Noir palette:
 *   - Imperial Crimson (#c41e3a)
 *   - Sovereign Gold   (#ffd700)
 *   - Arcane Purple    (#9b59ff)
 */
(function (global) {
  'use strict';

  var PIXELFX_SRC = 'js/vendor/pixelfx/pixelfx.bundle.js';
  var MAX_ACTIVE_FX = 14;

  /* ───────── Imperial Noir Color Ramps (Dark -> Bright for PixelFX fit()) ───────── */
  var RAMPS = {
    gold:     ['#1a0a12', '#471e0c', '#874810', '#c48216', '#ebb622', '#ffd700', '#fff1ab', '#ffffff'],
    crimson:  ['#14040a', '#3a0814', '#750f22', '#9e152d', '#c41e3a', '#ee4a60', '#ffa89a', '#fff4e6'],
    purple:   ['#110620', '#260d47', '#4a1b80', '#7136bf', '#9b59ff', '#c492ff', '#ebd4ff', '#fff8ff'],
    imperial: ['#1a0a12', '#520d24', '#9b59ff', '#c41e3a', '#e6782e', '#ffd700', '#fff2b2', '#ffffff'],
    levelup:  ['#24030c', '#63091d', '#a6142f', '#d4481e', '#eba018', '#ffd700', '#fff2ad', '#ffffff'],
    bond:     ['#1a0610', '#4a0c1e', '#8c1530', '#c41e3a', '#f25576', '#ff9eb5', '#ffe3a8', '#fff8f2'],
    boss:     ['#0f040b', '#2b0b2e', '#5e1446', '#9b59ff', '#c41e3a', '#f04e5e', '#ffd700', '#fff4e6'],
    confetti: ['#c41e3a', '#ffd700', '#9b59ff', '#e64866', '#ffbf3c', '#c58aff', '#fff4e6']
  };

  var SPARK_RAMPS = {
    gold:    ['#ffffff', '#fff4d2', '#ffd700', '#c41e3a'],
    purple:  ['#ffffff', '#ecd6ff', '#ffd700', '#9b59ff'],
    crimson: ['#ffffff', '#ffd700', '#ef4b5f', '#c41e3a']
  };

  // Truthy 1x1 empty actor mask prevents stock stickman silhouettes on actor-aware effects (levelUp, blessing)
  var EMPTY_ACTOR = {
    x: 0,
    y: -20,
    w: 1,
    h: 1,
    mask: { w: 1, h: 1, data: new Uint8Array(1) },
    pixels: new Uint32Array(1)
  };

  // Visual center offset (in pixel-frame units) so each PixelFX effect centers on target (x, y)
  var EFFECT_META_OFFSETS = {
    hitSpark:        { dx: 0,   dy: 20,  stopAt: 0 },
    critHit:         { dx: 0,   dy: 26,  stopAt: 0 },
    collectBurst:    { dx: 0,   dy: 30,  stopAt: 0 },
    manaBurst:       { dx: 0,   dy: 26,  stopAt: 0 },
    snowflakeBurst:  { dx: 0,   dy: 30,  stopAt: 0 },
    fireworkBurst:   { dx: 0,   dy: 0,   stopAt: 0 },
    comboCounter:    { dx: 0,   dy: 0,   stopAt: 0 },
    magicCircleCast: { dx: 0,   dy: 38,  stopAt: 0 },
    runeCircle:      { dx: 0,   dy: 14,  stopAt: 1.45 },
    spellCharge:     { dx: -15, dy: 22,  stopAt: 1.15 },
    frostNova:       { dx: 0,   dy: 22,  stopAt: 0 },
    freeze:          { dx: 0,   dy: 24,  stopAt: 0 },
    swordSlash:      { dx: -6,  dy: 26,  stopAt: 0 },
    doubleSlash:     { dx: -34, dy: 23,  stopAt: 0 },
    zapHit:          { dx: 0,   dy: 0,   stopAt: 0 },
    smallExplosion:  { dx: 0,   dy: 32,  stopAt: 0 },
    sunburst:        { dx: 0,   dy: 0,   stopAt: 1.85 },
    confetti:        { dx: 0,   dy: 44,  stopAt: 0 },
    blessing:        { dx: 0,   dy: 48,  stopAt: 1.85, emptyActor: true },
    levelUp:         { dx: 0,   dy: 46,  stopAt: 0,    emptyActor: true },
    heartPickup:     { dx: 0,   dy: 18,  stopAt: 1.38 }
  };

  var KEBAB_TO_CAMEL = {
    'frost-nova': 'frostNova',
    'snowflake-burst': 'snowflakeBurst',
    'freeze': 'freeze',
    'magic-circle-cast': 'magicCircleCast',
    'mana-burst': 'manaBurst',
    'rune-circle': 'runeCircle',
    'spell-charge': 'spellCharge',
    'sword-slash': 'swordSlash',
    'double-slash': 'doubleSlash',
    'small-explosion': 'smallExplosion',
    'firework-burst': 'fireworkBurst',
    'hit-spark': 'hitSpark',
    'crit-hit': 'critHit',
    'heart-pickup': 'heartPickup',
    'collect-burst': 'collectBurst',
    'combo-counter': 'comboCounter',
    'level-up': 'levelUp',
    'confetti': 'confetti',
    'sunburst': 'sunburst',
    'blessing': 'blessing',
    'zap-hit': 'zapHit'
  };

  /* ───────── State, Canvas & DOM Overlay Stage ───────── */
  var enabled = true;
  var shakeEnabled = true;
  var canvas = null;
  var ctx2d = null;
  var domLayer = null;
  var pixelScale = 2;
  var frame = null;
  var imgData = null;

  var activeFx = [];
  var fallbackDots = [];
  var pendingSpawns = [];
  var rafId = 0;
  var lastTickMs = 0;
  var seedCounter = 1;
  var lastEventAt = {};
  var pixelFxLoading = false;

  function isNum(v) {
    return typeof v === 'number' && isFinite(v);
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function nextSeed() {
    seedCounter = (seedCounter * 1664525 + 1013904223) >>> 0;
    return (seedCounter % 9973) + 1;
  }

  function prefersReducedMotion() {
    try {
      return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) {
      return false;
    }
  }

  function isElement(x) {
    return !!(x && typeof x === 'object' && x.nodeType === 1 && typeof x.getBoundingClientRect === 'function');
  }

  function $(id) {
    return global.document ? global.document.getElementById(id) : null;
  }

  function recentlyTriggered(tag, windowMs) {
    var now = Date.now();
    var prev = lastEventAt[tag] || 0;
    if (now - prev < (windowMs || 140)) return true;
    lastEventAt[tag] = now;
    return false;
  }

  /* ───────── Ensure PixelFX Bundle & Overlay Layers ───────── */
  function getPixelFX() {
    return (global.PixelFX && global.PixelFX.FX_LIB) ? global.PixelFX : null;
  }

  function ensurePixelFXLoaded() {
    if (getPixelFX() || pixelFxLoading || !global.document) return;
    var scripts = global.document.getElementsByTagName('script');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src') || '';
      if (src.indexOf('pixelfx.bundle.js') !== -1) {
        pixelFxLoading = true;
        scripts[i].addEventListener('load', flushPendingSpawns);
        return;
      }
    }
    pixelFxLoading = true;
    try {
      var s = global.document.createElement('script');
      s.src = PIXELFX_SRC;
      s.async = false;
      s.onload = function () {
        pixelFxLoading = false;
        flushPendingSpawns();
      };
      s.onerror = function () {
        pixelFxLoading = false;
        pendingSpawns.length = 0;
      };
      (global.document.head || global.document.documentElement).appendChild(s);
    } catch (e) {
      pixelFxLoading = false;
    }
  }

  function flushPendingSpawns() {
    if (!getPixelFX() || !pendingSpawns.length) return;
    var now = Date.now();
    var queue = pendingSpawns.splice(0, pendingSpawns.length);
    for (var i = 0; i < queue.length; i++) {
      if (now - queue[i].at <= 750) {
        spawnPixelFx(queue[i].name, queue[i].x, queue[i].y, queue[i].opts);
      }
    }
  }

  function ensureStage() {
    if (!global.document || !global.document.body) return false;
    if (!domLayer) {
      domLayer = $('fx-dom-layer');
      if (!domLayer) {
        domLayer = global.document.createElement('div');
        domLayer.id = 'fx-dom-layer';
        domLayer.className = 'fx-layer';
        domLayer.setAttribute('aria-hidden', 'true');
        global.document.body.appendChild(domLayer);
      }
    }
    if (!canvas) {
      canvas = $('fx-pixel-canvas');
      if (!canvas) {
        canvas = global.document.createElement('canvas');
        canvas.id = 'fx-pixel-canvas';
        canvas.className = 'fx-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        global.document.body.appendChild(canvas);
      }
      ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        ctx2d.imageSmoothingEnabled = false;
      }
      resizeCanvas();
    }
    return true;
  }

  function resizeCanvas() {
    if (!canvas || !ctx2d) return;
    var vw = Math.max(240, global.innerWidth || 390);
    var vh = Math.max(320, global.innerHeight || 844);
    // 2x pixel scale on phones/tablets; 3x on wide desktop monitors for crisp retro proportions & low CPU
    pixelScale = Math.max(2, Math.min(3, Math.ceil(Math.max(vw, vh) / 560)));
    var pw = Math.max(120, Math.ceil(vw / pixelScale));
    var ph = Math.max(160, Math.ceil(vh / pixelScale));
    if (canvas.width !== pw || canvas.height !== ph || !frame) {
      canvas.width = pw;
      canvas.height = ph;
      ctx2d.imageSmoothingEnabled = false;
      var P = getPixelFX();
      if (P) {
        frame = P.createFrame(pw, ph, 0, 0);
        imgData = ctx2d.createImageData(pw, ph);
      } else {
        frame = null;
        imgData = null;
      }
    }
  }

  /* ───────── Coordinate & Target Resolution ───────── */
  function viewportCenter() {
    var app = $('app');
    if (app && app.getBoundingClientRect) {
      var r = app.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return { x: r.left + r.width / 2, y: r.top + r.height * 0.46 };
      }
    }
    return { x: (global.innerWidth || 390) / 2, y: (global.innerHeight || 844) * 0.46 };
  }

  function rectCenter(el) {
    if (!isElement(el)) return null;
    var r = el.getBoundingClientRect();
    if (r.width <= 0 && r.height <= 0) return null;
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  function smartAnchor(prefer) {
    var ids = prefer || ['board', 'r-box', 'hg-art', 'home-hero-stage', 'app'];
    for (var i = 0; i < ids.length; i++) {
      var el = $(ids[i]);
      if (el && el.offsetParent !== null) {
        var c = rectCenter(el);
        if (c) return c;
      }
    }
    return viewportCenter();
  }

  function resolvePoint(a, b, preferIds) {
    if (isNum(a) && isNum(b)) {
      return { x: a, y: b };
    }
    if (isElement(a)) {
      return rectCenter(a) || smartAnchor(preferIds);
    }
    if (Array.isArray(a) && a.length) {
      var sx = 0, sy = 0, n = 0;
      for (var i = 0; i < a.length; i++) {
        var pt = resolvePoint(a[i]);
        if (pt) { sx += pt.x; sy += pt.y; n++; }
      }
      if (n > 0) return { x: sx / n, y: sy / n };
    }
    if (a && typeof a === 'object') {
      if (isNum(a.x) && isNum(a.y)) return { x: a.x, y: a.y };
      if (isNum(a.clientX) && isNum(a.clientY)) return { x: a.clientX, y: a.clientY };
      if (a.touches && a.touches[0]) {
        return { x: a.touches[0].clientX, y: a.touches[0].clientY };
      }
      if (isElement(a.el)) return rectCenter(a.el) || smartAnchor(preferIds);
      if (isElement(a.target)) return rectCenter(a.target) || smartAnchor(preferIds);
      if (isElement(a.currentTarget)) return rectCenter(a.currentTarget) || smartAnchor(preferIds);
    }
    return smartAnchor(preferIds);
  }

  /* ───────── PixelFX Animation Loop & Fallback Pixel Particles ───────── */
  function spawnFallbackPixels(x, y, ramp, count) {
    if (!ensureStage()) return;
    var cols = ramp || RAMPS.gold;
    var n = count || 14;
    var px = x / pixelScale;
    var py = y / pixelScale;
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.45;
      var spd = 28 + Math.random() * 76;
      fallbackDots.push({
        x: px,
        y: py,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 18,
        age: 0,
        life: 0.38 + Math.random() * 0.34,
        size: Math.random() < 0.35 ? 2 : 1,
        color: cols[Math.min(cols.length - 1, 3 + Math.floor(Math.random() * (cols.length - 3)))]
      });
    }
    startLoop();
  }

  function spawnPixelFx(rawName, x, y, extraOpts) {
    if (!enabled) return null;
    ensurePixelFXLoaded();
    if (!ensureStage()) return null;

    var name = KEBAB_TO_CAMEL[rawName] || rawName;
    var P = getPixelFX();
    if (!P) {
      if (pixelFxLoading) {
        pendingSpawns.push({ name: name, x: x, y: y, opts: extraOpts, at: Date.now() });
      }
      spawnFallbackPixels(x, y, (extraOpts && extraOpts.palette) || RAMPS.gold, 14);
      return null;
    }

    var mod = P.FX_LIB[name];
    if (!mod) return null;

    if (!frame || !imgData) resizeCanvas();
    if (!frame || !imgData) return null;

    var off = EFFECT_META_OFFSETS[name] || { dx: 0, dy: 0, stopAt: 0 };
    var opts = {};
    if (extraOpts) {
      for (var k in extraOpts) {
        if (Object.prototype.hasOwnProperty.call(extraOpts, k)) opts[k] = extraOpts[k];
      }
    }

    var flip = !!opts.flip;
    var dx = flip ? -off.dx : off.dx;
    opts.x = Math.round(x / pixelScale + dx);
    opts.y = Math.round(y / pixelScale + off.dy);
    if (opts.seed === undefined) opts.seed = nextSeed();
    if (off.emptyActor && !opts.actor) opts.actor = EMPTY_ACTOR;

    var delaySec = opts.delay || 0;
    var stopAtSec = opts.maxDuration !== undefined ? opts.maxDuration : off.stopAt;

    var instance;
    try {
      instance = P.createFx(mod, opts);
    } catch (e) {
      spawnFallbackPixels(x, y, opts.palette || RAMPS.gold, 12);
      return null;
    }

    if (activeFx.length >= MAX_ACTIVE_FX) {
      // Gracefully fade or drop the oldest effect so rapid combos stay at locked 60fps
      var oldest = activeFx[0];
      if (oldest && oldest.fx && !oldest.stopping) {
        oldest.fx.stop();
        oldest.stopping = true;
      } else {
        activeFx.shift();
      }
    }

    var entry = {
      name: name,
      fx: instance,
      elapsed: 0,
      delay: delaySec,
      stopAt: stopAtSec > 0 ? stopAtSec : 0,
      stopping: false
    };
    activeFx.push(entry);
    startLoop();
    return entry;
  }

  function startLoop() {
    if (rafId || !global.requestAnimationFrame) return;
    lastTickMs = (global.performance && global.performance.now) ? global.performance.now() : Date.now();
    rafId = global.requestAnimationFrame(tick);
  }

  function tick(nowMs) {
    rafId = 0;
    var cur = isNum(nowMs) ? nowMs : Date.now();
    var dt = clamp((cur - lastTickMs) / 1000, 0.001, 0.065);
    lastTickMs = cur;

    if (!canvas || !ctx2d) return;

    var P = getPixelFX();
    var hasPixelFx = P && activeFx.length > 0;
    var hasFallback = fallbackDots.length > 0;

    if (!hasPixelFx && !hasFallback) {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    if (hasPixelFx) {
      if (!frame || frame.w !== canvas.width || frame.h !== canvas.height) {
        resizeCanvas();
      }
      P.clearFrame(frame);

      // Update active instances & draw back layer
      for (var i = activeFx.length - 1; i >= 0; i--) {
        var it = activeFx[i];
        if (it.delay > 0) {
          it.delay -= dt;
          continue;
        }
        it.elapsed += dt;
        if (it.stopAt > 0 && !it.stopping && it.elapsed >= it.stopAt) {
          it.fx.stop();
          it.stopping = true;
        }
        it.fx.update(dt);
        if (it.fx.done()) {
          activeFx.splice(i, 1);
        }
      }

      for (var b = 0; b < activeFx.length; b++) {
        if (activeFx[b].delay <= 0) activeFx[b].fx.draw(frame, 'back');
      }
      for (var f = 0; f < activeFx.length; f++) {
        if (activeFx[f].delay <= 0) activeFx[f].fx.draw(frame, 'front');
      }

      P.composite(frame, imgData.data, null, 0.95);
      ctx2d.putImageData(imgData, 0, 0);
    } else {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (hasFallback) {
      for (var d = fallbackDots.length - 1; d >= 0; d--) {
        var p = fallbackDots[d];
        p.age += dt;
        if (p.age >= p.life) {
          fallbackDots.splice(d, 1);
          continue;
        }
        p.vy += 120 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        ctx2d.globalAlpha = 1 - p.age / p.life;
        ctx2d.fillStyle = p.color;
        ctx2d.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      ctx2d.globalAlpha = 1;
    }

    if (activeFx.length > 0 || fallbackDots.length > 0) {
      startLoop();
    } else {
      ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /* ───────── Transient DOM Overlay Helpers (fx.css) ───────── */
  function spawnDomNode(cls, x, y, text, ttlMs) {
    if (!ensureStage() || !domLayer) return null;
    var el = global.document.createElement('div');
    el.className = cls;
    if (isNum(x) && isNum(y)) {
      el.style.left = Math.round(x) + 'px';
      el.style.top = Math.round(y) + 'px';
    }
    if (text !== undefined && text !== null && text !== '') {
      el.textContent = String(text);
    }
    domLayer.appendChild(el);
    global.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, ttlMs || 900);
    return el;
  }

  function cardPulse(target) {
    if (!target) return false;
    var list = (Array.isArray(target) || (typeof target.length === 'number' && !isElement(target)))
      ? Array.prototype.slice.call(target)
      : [target];
    for (var i = 0; i < list.length; i++) {
      (function (el) {
        if (!isElement(el)) return;
        el.classList.remove('fx-card-pulse');
        void el.offsetWidth;
        el.classList.add('fx-card-pulse');
        global.setTimeout(function () {
          el.classList.remove('fx-card-pulse');
        }, 580);
      })(list[i]);
    }
    return true;
  }

  function vignetteFlash(tone, durMs) {
    var t = tone || 'gold';
    var el = spawnDomNode('fx-vignette-flash is-' + t, null, null, '', durMs || 480);
    if (el && durMs) {
      el.style.setProperty('--fx-flash-dur', durMs + 'ms');
    }
    return true;
  }

  function shake(arg1, arg2) {
    if (!shakeEnabled || prefersReducedMotion()) return false;
    // Also check live save state if GameAPI is present
    try {
      if (global.GameAPI && global.GameAPI.state && global.GameAPI.state.settings && global.GameAPI.state.settings.shake === false) {
        return false;
      }
    } catch (e) {}

    var el = null;
    var strength = 'sm';
    if (isElement(arg1)) {
      el = arg1;
      if (typeof arg2 === 'string' || typeof arg2 === 'number') strength = arg2;
    } else if (typeof arg1 === 'string' || typeof arg1 === 'number') {
      strength = arg1;
      if (isElement(arg2)) el = arg2;
    }
    if (!el) el = $('board') && $('board').offsetParent !== null ? $('board') : $('app');
    if (!el) return false;

    var cls = 'fx-shake-sm';
    if (strength === 'lg' || strength === 'heavy' || strength === 3) cls = 'fx-shake-lg';
    else if (strength === 'md' || strength === 'normal' || strength === 2) cls = 'fx-shake';

    el.classList.remove('fx-shake-sm', 'fx-shake', 'fx-shake-md', 'fx-shake-lg');
    void el.offsetWidth;
    el.classList.add(cls);
    global.setTimeout(function () {
      el.classList.remove(cls);
    }, 460);
    return true;
  }

  function transition(targetOrKind, dirOrKind) {
    var kind = '';
    var scrEl = null;

    if (isElement(targetOrKind)) {
      scrEl = targetOrKind;
      kind = typeof dirOrKind === 'string' ? dirOrKind : '';
    } else if (typeof targetOrKind === 'string') {
      var candidate = $('scr-' + targetOrKind) || $(targetOrKind);
      if (candidate && candidate.classList && candidate.classList.contains('screen')) {
        scrEl = candidate;
        kind = typeof dirOrKind === 'string' ? dirOrKind : '';
      } else {
        kind = targetOrKind;
      }
    }

    var veilMod = '';
    if (kind === 'boss') veilMod = ' is-boss';
    else if (kind === 'battle') veilMod = ' is-battle';
    else if (kind === 'arcane' || kind === 'story') veilMod = ' is-arcane';
    else if (kind === 'gold' || kind === 'clear') veilMod = ' is-gold';

    spawnDomNode('fx-transition-veil' + veilMod, null, null, '', 320);

    if (scrEl) {
      scrEl.classList.remove('fx-screen-enter', 'fx-screen-enter-left', 'fx-screen-enter-right', 'fx-screen-enter-zoom');
      void scrEl.offsetWidth;
      var enterCls = kind === 'left' ? 'fx-screen-enter-left'
        : kind === 'right' ? 'fx-screen-enter-right'
        : (kind === 'zoom' || kind === 'battle' || kind === 'boss') ? 'fx-screen-enter-zoom'
        : 'fx-screen-enter';
      scrEl.classList.add(enterCls);
    }
    return true;
  }

  function floatText(a, b, c, d) {
    var pt, text, tone;
    if (isNum(a) && isNum(b)) {
      // FX.floatText(x, y, text, tone) — exact game.js signature
      pt = { x: a, y: b };
      text = c;
      tone = d;
    } else if (isElement(a)) {
      // FX.floatText(el, text, tone)
      pt = resolvePoint(a);
      text = b;
      tone = c;
    } else {
      // FX.floatText(text, target, tone)
      text = a;
      pt = resolvePoint(b);
      tone = c;
    }
    if (!pt) pt = viewportCenter();
    var isHeart = tone === 'rose' || (typeof text === 'string' && text.indexOf('♥') !== -1);
    var cls = 'fx-float-text' + (tone ? ' is-' + tone : '');
    spawnDomNode(cls, pt.x, isHeart ? pt.y - 42 : pt.y, text, 880);

    // Subtle PixelFX heart bloom whenever a bond/heart floatText pops in gallery
    if (isHeart && !recentlyTriggered('bondHeart', 260)) {
      spawnPixelFx('heartPickup', pt.x, pt.y + 4, { palette: RAMPS.bond, maxDuration: 1.25 });
    }
    return true;
  }

  /* ───────── Mapped Gameplay PixelFX Choreographies ───────── */

  // 1. MATCH -> hitSpark + collectBurst / manaBurst (Gold & Crimson)
  function fxMatch(a, b, opts) {
    recentlyTriggered('match', 40);
    if (isElement(a)) cardPulse(a);
    if (isElement(b)) cardPulse(b);
    if (opts && opts.el && isElement(opts.el)) cardPulse(opts.el);

    var p1, p2;
    if (isElement(a) && isElement(b)) {
      p1 = resolvePoint(a);
      p2 = resolvePoint(b);
      spawnPixelFx('hitSpark', p1.x, p1.y, { palette: RAMPS.gold, aim: -0.35 });
      spawnPixelFx('hitSpark', p2.x, p2.y, { palette: RAMPS.crimson, flip: true, aim: -0.35 });
      spawnPixelFx('collectBurst', (p1.x + p2.x) / 2, (p1.y + p2.y) / 2, { palette: RAMPS.gold });
      return true;
    }

    var pt = resolvePoint(a, b, ['board', 'app']);
    var streak = (opts && (opts.combo || opts.streak)) || 1;
    spawnPixelFx('hitSpark', pt.x, pt.y, {
      palette: streak >= 3 ? RAMPS.crimson : RAMPS.gold,
      aim: (Math.random() - 0.5) * 0.8
    });
    if (streak >= 4) {
      spawnPixelFx('manaBurst', pt.x, pt.y, { palette: RAMPS.imperial });
    } else {
      spawnPixelFx('collectBurst', pt.x, pt.y, { palette: RAMPS.gold });
    }
    return true;
  }

  // MISMATCH -> crimson impact spark
  function fxMismatch(a, b) {
    var pt = resolvePoint(a, b, ['board', 'app']);
    spawnPixelFx('hitSpark', pt.x, pt.y, { palette: RAMPS.crimson, aim: Math.PI * 0.5 });
    return true;
  }

  // 2. COMBO / COMBO POP -> .fx-combo-pop callout + comboCounter + fireworkBurst / snowflakeBurst / critHit
  function parseComboArgs(a, b, c) {
    var count = 2;
    var pt = null;
    if (a && typeof a === 'object' && !isElement(a)) {
      count = a.combo || a.count || 2;
      pt = resolvePoint(a);
    } else if (isNum(a) && isNum(b) && isNum(c)) {
      if (a <= 50 && (b > 50 || c > 50)) {
        count = a; pt = { x: b, y: c };
      } else {
        pt = { x: a, y: b }; count = c;
      }
    } else if (isNum(a)) {
      count = a;
      if (b !== undefined) pt = resolvePoint(b, c, ['board', 'app']);
    }
    if (!pt) {
      var anchor = smartAnchor(['board', 'app']);
      pt = { x: anchor.x, y: anchor.y - 34 };
    }
    return { count: Math.max(2, Math.round(count)), pt: pt };
  }

  function triggerComboVfx(count, pt) {
    if (recentlyTriggered('comboVfx', 95)) return;
    if (count === 2) {
      spawnPixelFx('critHit', pt.x, pt.y + 24, { palette: RAMPS.crimson });
    } else if (count <= 4) {
      spawnPixelFx('snowflakeBurst', pt.x, pt.y - 26, { palette: RAMPS.purple, count: 9 });
      spawnPixelFx('comboCounter', pt.x, pt.y + 40, {
        palette: RAMPS.purple,
        count: count,
        label: 'COMBO'
      });
    } else {
      spawnPixelFx('comboCounter', pt.x, pt.y + 44, {
        palette: RAMPS.imperial,
        count: count,
        label: 'COMBO'
      });
      spawnPixelFx('fireworkBurst', pt.x, pt.y - 44, {
        palette: count >= 8 ? RAMPS.imperial : RAMPS.crimson,
        core: RAMPS.gold
      });
      if (count >= 6) vignetteFlash('gold', 380);
    }
  }

  function comboPop(a, b, c) {
    var parsed = parseComboArgs(a, b, c);
    var n = parsed.count;
    var pt = parsed.pt;
    if (!recentlyTriggered('comboDom', 95)) {
      var tier = n >= 10 ? ' tier-max' : n >= 6 ? ' tier-3' : n >= 3 ? ' tier-2' : '';
      spawnDomNode('fx-combo-pop' + tier, pt.x, pt.y - 14, n + ' 連擊！', 940);
    }
    triggerComboVfx(n, pt);
    return true;
  }

  function fxCombo(a, b, c) {
    return comboPop(a, b, c);
  }

  // 3. SKILL -> magicCircleCast / spellCharge / runeCircle (Arcane Purple / Gold / Crimson)
  function fxSkill(kindOrTarget, targetOrOpts) {
    if (recentlyTriggered('skill', 140)) return true;
    var kind = '';
    var pt = null;
    if (typeof kindOrTarget === 'string') {
      kind = kindOrTarget;
      pt = resolvePoint(targetOrOpts, undefined, ['board', 'app']);
    } else {
      pt = resolvePoint(kindOrTarget, targetOrOpts, ['board', 'app']);
      if (targetOrOpts && typeof targetOrOpts === 'string') kind = targetOrOpts;
      else if (kindOrTarget && typeof kindOrTarget === 'object' && kindOrTarget.skill) kind = kindOrTarget.skill;
    }

    // Detect active heroine's skill automatically if not specified
    if (!kind) {
      try {
        var st = global.GameAPI && global.GameAPI.state;
        var gd = global.GAME_DATA;
        if (st && gd && gd.HEROINES) {
          for (var i = 0; i < gd.HEROINES.length; i++) {
            if (gd.HEROINES[i].id === st.selected) { kind = gd.HEROINES[i].skill; break; }
          }
        }
      } catch (e) {}
    }

    if (kind === 'freeze') {
      // Karena (Crimson Flame Stasis): Crimson-Gold crystal nova + rune ring
      spawnPixelFx('frostNova', pt.x, pt.y + 18, { palette: RAMPS.crimson, reach: 88 });
      spawnPixelFx('runeCircle', pt.x, pt.y + 22, { palette: RAMPS.gold, maxDuration: 1.5 });
    } else if (kind === 'time') {
      // Elys (Golden Diplomacy): Sovereign Gold rune circle + arcane spell charge
      spawnPixelFx('runeCircle', pt.x, pt.y + 20, { palette: RAMPS.gold, maxDuration: 1.65 });
      spawnPixelFx('spellCharge', pt.x, pt.y - 6, { palette: RAMPS.purple, maxDuration: 1.25 });
    } else if (kind === 'match') {
      // Selas (Tactical Deduction): Arcane charge -> Golden mana burst
      spawnPixelFx('spellCharge', pt.x, pt.y, { palette: RAMPS.purple, maxDuration: 1.1 });
      spawnPixelFx('manaBurst', pt.x, pt.y + 8, { palette: RAMPS.gold, delay: 0.14 });
    } else {
      // Verda ('peek' Magic Eye) & default: Arcane Purple magicCircleCast + Gold runeCircle
      spawnPixelFx('magicCircleCast', pt.x, pt.y + 28, { palette: RAMPS.purple });
      spawnPixelFx('runeCircle', pt.x, pt.y + 26, { palette: RAMPS.gold, maxDuration: 1.55 });
    }
    return true;
  }

  // 4. BOSS -> frostNova / doubleSlash / swordSlash / zapHit (Crimson / Purple / Gold)
  function fxBoss(mechOrTarget, targetOrOpts) {
    if (recentlyTriggered('boss', 140)) return true;
    var mech = '';
    var pt = null;
    if (typeof mechOrTarget === 'string') {
      mech = mechOrTarget;
      pt = resolvePoint(targetOrOpts, undefined, ['board', 'app']);
    } else {
      pt = resolvePoint(mechOrTarget, targetOrOpts, ['board', 'app']);
      if (typeof targetOrOpts === 'string') mech = targetOrOpts;
      else if (mechOrTarget && typeof mechOrTarget === 'object' && mechOrTarget.mech) mech = mechOrTarget.mech;
    }

    if (mech === 'joker' || mech === 'trap' || mech === 'zap') {
      spawnPixelFx('zapHit', pt.x, pt.y, { palette: RAMPS.crimson });
      spawnPixelFx('critHit', pt.x, pt.y + 10, { palette: RAMPS.purple });
    } else if (mech === 'fast' || mech === 'triple' || mech === 'slash') {
      spawnPixelFx('doubleSlash', pt.x, pt.y, { palette: RAMPS.crimson, sparks: SPARK_RAMPS.gold });
      spawnPixelFx('swordSlash', pt.x + 12, pt.y - 6, { palette: RAMPS.purple, sparks: SPARK_RAMPS.crimson, flip: true, delay: 0.1 });
    } else if (mech === 'shuffle' || mech === 'decoy') {
      spawnPixelFx('manaBurst', pt.x, pt.y + 10, { palette: RAMPS.boss });
      spawnPixelFx('doubleSlash', pt.x, pt.y, { palette: RAMPS.crimson, sparks: SPARK_RAMPS.gold, delay: 0.08 });
    } else {
      // Boss arrival / fog / default imperial boss eruption
      spawnPixelFx('frostNova', pt.x, pt.y + 20, { palette: RAMPS.boss, reach: 92 });
      spawnPixelFx('doubleSlash', pt.x, pt.y - 8, { palette: RAMPS.crimson, sparks: SPARK_RAMPS.gold, delay: 0.14 });
      shake(null, 'md');
    }
    return true;
  }

  // 5. CLEAR (Stage Victory) -> sunburst + confetti + blessing + celebratory fireworkBurst
  function fxClear(targetOrOpts) {
    if (recentlyTriggered('clear', 180)) return true;
    var pt = resolvePoint(targetOrOpts, undefined, ['board', 'r-box', 'app']);
    spawnPixelFx('sunburst', pt.x, pt.y - 76, { palette: RAMPS.gold, rays: 8, maxDuration: 1.75 });
    spawnPixelFx('confetti', pt.x, pt.y + 34, { palette: RAMPS.confetti });
    spawnPixelFx('blessing', pt.x, pt.y + 24, { palette: RAMPS.gold, maxDuration: 1.75 });
    spawnPixelFx('fireworkBurst', pt.x, pt.y - 68, {
      palette: RAMPS.crimson,
      core: RAMPS.gold,
      delay: 0.18
    });
    return true;
  }

  // 6. LEVELUP -> levelUp crimson-outlined golden pillar & "LEVEL UP!" + collectBurst
  function fxLevelUp(targetOrOpts) {
    if (recentlyTriggered('levelup', 200)) return true;
    var pt = resolvePoint(targetOrOpts, undefined, ['r-box', 'roster-list', 'home-hero-stage', 'app']);
    spawnPixelFx('levelUp', pt.x, pt.y + 22, {
      palette: RAMPS.levelup,
      text: 'LEVEL UP!'
    });
    spawnPixelFx('collectBurst', pt.x, pt.y - 12, { palette: RAMPS.purple, delay: 0.25 });
    vignetteFlash('gold', 520);
    return true;
  }

  // 7. BOND (Heart / Gift / Heroine Affinity) -> heartPickup + collectBurst (Crimson / Rose / Gold)
  function fxBond(targetOrOpts) {
    if (recentlyTriggered('bond', 180)) return true;
    recentlyTriggered('bondHeart', 260);
    var pt = resolvePoint(targetOrOpts, undefined, ['heroine-cg-viewer', 'hg-art', 'home-hero-stage', 'r-box', 'app']);
    spawnPixelFx('heartPickup', pt.x, pt.y + 4, {
      palette: RAMPS.bond,
      maxDuration: 1.5
    });
    spawnPixelFx('collectBurst', pt.x, pt.y + 6, {
      palette: RAMPS.gold,
      delay: 0.08
    });
    return true;
  }

  // Universal burst router (matches game.js: FX.burst(x, y, { kind: 'match' | 'clear' | ... }))
  function burst(a, b, opts) {
    var pt = resolvePoint(a, b, ['board', 'app']);
    var o = (opts && typeof opts === 'object') ? opts : (typeof opts === 'string' ? { kind: opts } : {});
    var kind = o.kind || (typeof b === 'string' ? b : 'match');

    if (kind === 'clear' || kind === 'win' || kind === 'victory') return fxClear(pt);
    if (kind === 'skill') return fxSkill(o.skill || '', pt);
    if (kind === 'boss' || kind === 'joker' || kind === 'trap') return fxBoss(kind === 'boss' ? (o.mech || '') : kind, pt);
    if (kind === 'levelup' || kind === 'levelUp') return fxLevelUp(pt);
    if (kind === 'bond' || kind === 'heart' || kind === 'gift') return fxBond(pt);
    if (kind === 'combo') return fxCombo(o.combo || 3, pt.x, pt.y);
    if (kind === 'miss' || kind === 'mismatch') return fxMismatch(pt.x, pt.y);
    return fxMatch(pt.x, pt.y, o);
  }

  /* ───────── Audio & CustomEvent Co-Choreography ───────── */
  function isTitleBlocking() {
    var ts = $('title-screen');
    if (!ts) return false;
    if (ts.classList.contains('leaving') || ts.classList.contains('hidden')) return false;
    if (ts.offsetParent === null) return false;
    return true;
  }

  function onAudioSfx(canonicalName, opts) {
    if (!enabled || isTitleBlocking()) return;
    if (canonicalName === 'skill') {
      fxSkill((opts && opts.skill) || '');
    } else if (canonicalName === 'boss') {
      var mech = '';
      try {
        if (global.__DEBUG && typeof global.__DEBUG.battle === 'function') {
          var b = global.__DEBUG.battle();
          if (b && b.cfg && b.cfg.boss) mech = b.cfg.boss;
        }
      } catch (e) {}
      fxBoss(mech);
    } else if (canonicalName === 'joker') {
      fxBoss('joker');
    } else if (canonicalName === 'levelup') {
      fxLevelUp();
    } else if (canonicalName === 'bond' || canonicalName === 'gift') {
      fxBond();
    }
  }

  function bindGlobalListeners() {
    if (!global.addEventListener || !global.document) return;
    global.addEventListener('resize', resizeCanvas);

    if (global.document.readyState === 'loading') {
      global.document.addEventListener('DOMContentLoaded', function () {
        ensurePixelFXLoaded();
        ensureStage();
      });
    } else {
      ensurePixelFXLoaded();
      ensureStage();
    }

    global.document.addEventListener('game:ready', function (ev) {
      try {
        var api = ev && ev.detail && ev.detail.api;
        if (api && api.state && api.state.settings && typeof api.state.settings.shake === 'boolean') {
          shakeEnabled = api.state.settings.shake;
        }
      } catch (e) {}
    });

    global.document.addEventListener('game:state', function () {
      try {
        if (global.GameAPI && global.GameAPI.state && global.GameAPI.state.settings) {
          shakeEnabled = global.GameAPI.state.settings.shake !== false;
        }
      } catch (e) {}
    });

    global.document.addEventListener('game:bondup', function () {
      if (!isTitleBlocking()) {
        vignetteFlash('rose', 480);
        fxBond();
      }
    });
  }

  bindGlobalListeners();

  /* ───────── Public FX Object ───────── */
  var FX = {
    PALETTES: RAMPS,
    SPARKS: SPARK_RAMPS,

    init: function (opts) {
      ensurePixelFXLoaded();
      ensureStage();
      if (opts) FX.configure(opts);
      return FX;
    },

    configure: function (opts) {
      if (!opts || typeof opts !== 'object') return FX;
      if (typeof opts.enabled === 'boolean') enabled = opts.enabled;
      if (typeof opts.shake === 'boolean') shakeEnabled = opts.shake;
      if (typeof opts.shakeEnabled === 'boolean') shakeEnabled = opts.shakeEnabled;
      return FX;
    },

    syncState: function (s) {
      if (s && s.settings && typeof s.settings.shake === 'boolean') {
        shakeEnabled = s.settings.shake;
      }
      return FX;
    },

    setEnabled: function (on) { enabled = !!on; if (!enabled) FX.clearAll(); return enabled; },
    setShakeEnabled: function (on) { shakeEnabled = !!on; return shakeEnabled; },

    // Core PixelFX Mapped Gameplay Triggers
    match: fxMatch,
    onMatch: fxMatch,
    matchBurst: function (x, y, o) { return fxMatch(x, y, o); },

    mismatch: fxMismatch,
    miss: fxMismatch,

    combo: fxCombo,
    onCombo: fxCombo,
    comboPop: comboPop,
    popCombo: comboPop,

    skill: fxSkill,
    castSkill: fxSkill,
    onSkill: fxSkill,

    boss: fxBoss,
    bossIntro: fxBoss,
    bossSting: fxBoss,
    joker: function (el) { return fxBoss('joker', el); },
    trap: function (el) { return fxBoss('joker', el); },

    clear: fxClear,
    win: fxClear,
    victory: fxClear,
    stageClear: fxClear,
    confetti: function (target) {
      var pt = resolvePoint(target, undefined, ['board', 'r-box', 'app']);
      spawnPixelFx('confetti', pt.x, pt.y + 32, { palette: RAMPS.confetti });
      return true;
    },

    fail: function () {
      vignetteFlash('crimson', 560);
      shake(null, 'md');
      return true;
    },
    lose: function () { return FX.fail(); },

    levelup: fxLevelUp,
    levelUp: fxLevelUp,
    upgrade: fxLevelUp,
    unlock: fxLevelUp,

    bond: fxBond,
    bondUp: fxBond,
    heart: fxBond,
    gift: fxBond,

    tap: function (target) {
      var pt = resolvePoint(target);
      spawnPixelFx('hitSpark', pt.x, pt.y, { palette: RAMPS.gold, height: 18 });
      return true;
    },

    // Generic Burst & Direct PixelFX Spawner
    burst: burst,
    particles: burst,
    play: function (effectName, targetOrOpts, maybeOpts) {
      var o = (targetOrOpts && typeof targetOrOpts === 'object' && !isElement(targetOrOpts) && !isNum(targetOrOpts.clientX))
        ? targetOrOpts
        : (maybeOpts || {});
      var pt = (isNum(o.x) && isNum(o.y)) ? { x: o.x, y: o.y } : resolvePoint(targetOrOpts);
      var pal = o.palette;
      if (typeof pal === 'string' && RAMPS[pal]) {
        o = Object.assign({}, o, { palette: RAMPS[pal] });
      } else if (!pal) {
        o = Object.assign({}, o, { palette: RAMPS.imperial });
      }
      return spawnPixelFx(effectName, pt.x, pt.y, o);
    },
    spawn: function (effectName, x, y, opts) {
      var o = opts || {};
      if (typeof o.palette === 'string' && RAMPS[o.palette]) {
        o = Object.assign({}, o, { palette: RAMPS[o.palette] });
      }
      return spawnPixelFx(effectName, x, y, o);
    },

    // Screen Shake, Transitions, Vignette Flash, Card Pulse & Floating Text
    shake: shake,
    transition: transition,
    screenTransition: transition,
    veil: transition,
    flash: vignetteFlash,
    vignette: vignetteFlash,
    cardPulse: cardPulse,
    pulse: cardPulse,
    floatText: floatText,

    clearAll: function () {
      activeFx.length = 0;
      fallbackDots.length = 0;
      pendingSpawns.length = 0;
      if (canvas && ctx2d) ctx2d.clearRect(0, 0, canvas.width, canvas.height);
      if (domLayer) domLayer.innerHTML = '';
      return true;
    },

    _onAudioSfx: onAudioSfx
  };

  Object.defineProperties(FX, {
    ready: { get: function () { return !!getPixelFX(); } },
    activeCount: { get: function () { return activeFx.length; } },
    pixelScale: { get: function () { return pixelScale; } }
  });

  global.FX = FX;
})(typeof window !== 'undefined' ? window : this);
