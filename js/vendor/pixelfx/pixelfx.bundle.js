var PixelFX = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // bundle-entry.mjs
  var bundle_entry_exports = {};
  __export(bundle_entry_exports, {
    FX_LIB: () => FX_LIB,
    PALETTES: () => PALETTES,
    clearFrame: () => clearFrame,
    composite: () => composite,
    createFrame: () => createFrame,
    createFx: () => createFx
  });

  // core/math.js
  var TAU = Math.PI * 2;
  var clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
  var lerp = (a, b, t) => a + (b - a) * t;
  var fract = (x) => x - Math.floor(x);
  var seg = (t, t0, t1) => clamp((t - t0) / (t1 - t0));
  var smooth = (e0, e1, x) => {
    const t = seg(x, e0, e1);
    return t * t * (3 - 2 * t);
  };
  var ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    inQuart: (t) => t * t * t * t,
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inExpo: (t) => t <= 0 ? 0 : Math.pow(2, 10 * t - 10),
    outExpo: (t) => t >= 1 ? 1 : 1 - Math.pow(2, -10 * t),
    inSine: (t) => 1 - Math.cos(t * Math.PI / 2),
    outSine: (t) => Math.sin(t * Math.PI / 2),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    inBack: (t, s = 1.70158) => t <= 0 ? 0 : t >= 1 ? 1 : (s + 1) * t * t * t - s * t * t,
    outBack: (t, s = 1.70158) => t <= 0 ? 0 : t >= 1 ? 1 : 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    outElastic: (t) => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1,
    outBounce: (t) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    }
  };
  function hash(...ns) {
    let h = 2654435769;
    for (const n of ns) {
      h = Math.imul(h ^ (n | 0), 2246822507);
      h ^= h >>> 13;
      h = Math.imul(h, 3266489909);
      h ^= h >>> 16;
    }
    return h >>> 0;
  }
  var rand = (...ns) => hash(...ns) / 4294967296;
  var Rng = class {
    constructor(seed = 1) {
      this.s = seed >>> 0 || 1;
    }
    next() {
      let t = this.s = this.s + 1831565813 >>> 0;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    range(a, b) {
      return a + (b - a) * this.next();
    }
    int(a, b) {
      return Math.floor(this.range(a, b + 1));
    }
    chance(p) {
      return this.next() < p;
    }
    sign() {
      return this.next() < 0.5 ? -1 : 1;
    }
    pick(list) {
      return list[Math.floor(this.next() * list.length)];
    }
    /** Roughly normal, mean 0, sd 1. */
    gauss() {
      return (this.next() + this.next() + this.next() + this.next() - 2) * 1.732;
    }
  };
  var rng = (...ns) => new Rng(hash(...ns));
  function noise(x, seed = 0) {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(rand(i, seed), rand(i + 1, seed), u) * 2 - 1;
  }
  function noise2(x, y, seed = 0) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = rand(ix, iy, seed), b = rand(ix + 1, iy, seed), c = rand(ix, iy + 1, seed), d = rand(ix + 1, iy + 1, seed);
    return lerp(lerp(a, b, ux), lerp(c, d, ux), uy) * 2 - 1;
  }
  function loopNoise(phase, radius = 1, seed = 0) {
    const a = phase * TAU;
    return noise2(Math.cos(a) * radius + 50, Math.sin(a) * radius + 50, seed);
  }

  // core/color.js
  var rgb = (r, g, b) => 255 << 24 | (b & 255) << 16 | (g & 255) << 8 | r & 255;
  var red = (c) => c & 255;
  var green = (c) => c >>> 8 & 255;
  var blue = (c) => c >>> 16 & 255;
  function hex(h) {
    if (typeof h === "number") return h;
    let s = h.replace("#", "");
    if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
    const v = parseInt(s.slice(0, 6), 16);
    return rgb(v >> 16 & 255, v >> 8 & 255, v & 255);
  }
  var toHex = (c) => "#" + [red(c), green(c), blue(c)].map((v) => v.toString(16).padStart(2, "0")).join("");
  function mix(a, b, t) {
    t = clamp(t);
    return rgb(red(a) + (red(b) - red(a)) * t, green(a) + (green(b) - green(a)) * t, blue(a) + (blue(b) - blue(a)) * t);
  }
  var scale = (c, k) => rgb(Math.min(255, red(c) * k), Math.min(255, green(c) * k), Math.min(255, blue(c) * k));
  var luma = (c) => (0.299 * red(c) + 0.587 * green(c) + 0.114 * blue(c)) / 255;
  var ramp = (list) => list.map(hex);
  function fit(r, n) {
    r = r.map(hex);
    if (r.length === n) return r;
    return Array.from({ length: n }, (_, i) => r[Math.round(i * (r.length - 1) / Math.max(1, n - 1))]);
  }
  var PAL = {
    fire: ["#1f0b10", "#4a1118", "#8c1d1c", "#cc3a1a", "#f2701f", "#ffae35", "#ffe27a", "#fff8d6"],
    ember: ["#1a0a0e", "#3d1012", "#701a14", "#a8301a", "#e0561e", "#ff8a2a", "#ffc46a"],
    lava: ["#14060a", "#380a10", "#6e1210", "#ac2410", "#e8501a", "#ff8c2a", "#ffd25a"],
    smoke: ["#0e0c12", "#1d1a22", "#2e2a35", "#433e4b", "#5c5664", "#7b7484", "#a39cab"],
    dust: ["#1c1610", "#33281c", "#4f3f2c", "#6e5a40", "#927a58", "#b89f78", "#dcc8a2"],
    ice: ["#0c1430", "#162c5c", "#1f4f94", "#2f7fcc", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"],
    water: ["#081830", "#0e2e5a", "#14508c", "#1c76bc", "#36a2e0", "#78ccf4", "#c4ecff", "#ffffff"],
    electric: ["#0a0f2e", "#172a78", "#2550d0", "#3f8cff", "#7cc8ff", "#c8f0ff", "#ffffff"],
    volt: ["#24160a", "#5e3a0c", "#a8680f", "#e8a218", "#ffd23c", "#fff08a", "#ffffff"],
    poison: ["#0d1a0c", "#173a14", "#265e18", "#3f8a1e", "#6cb82a", "#a8e04a", "#e0ff8a"],
    holy: ["#2a1c08", "#5a3e10", "#9a6c18", "#d8a428", "#ffd84a", "#fff09a", "#fffbe6", "#ffffff"],
    heal: ["#08201a", "#0f3f2c", "#17663e", "#24924e", "#3ec466", "#7ee88a", "#c8ffc4", "#ffffff"],
    arcane: ["#140a26", "#2b1252", "#481c88", "#6b2cc0", "#9a48ec", "#c684ff", "#ecc8ff", "#ffffff"],
    shadow: ["#050308", "#0f0a18", "#1c1230", "#2c1a4a", "#432468", "#5e3290", "#8048b8", "#a970e0"],
    blood: ["#14040a", "#3a0a14", "#6a101c", "#a01824", "#d42a30", "#ff5a50", "#ff9a8a"],
    earth: ["#140e0a", "#2a1e14", "#47321e", "#69492a", "#8e6638", "#b88a52", "#dcb47c"],
    stone: ["#0e0e12", "#1c1c24", "#2c2c38", "#42424f", "#5c5c6b", "#7d7d8c", "#a4a4b2", "#d0d0da"],
    gold: ["#1e1206", "#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4", "#ffffff"],
    leaf: ["#0c1a0e", "#163418", "#225224", "#357530", "#4f9a3a", "#7cc048", "#b4e070", "#e4ffb0"],
    wood: ["#160c06", "#2e1a0c", "#4a2c14", "#6a421e", "#8e5c2c", "#b47c40", "#d8a464"],
    metal: ["#0c0e14", "#1c2230", "#2e3648", "#4a5468", "#6e7a90", "#9aa6ba", "#d0d8e6", "#ffffff"],
    bone: ["#1a1814", "#3a352c", "#5e5648", "#8a806c", "#b8ad96", "#e4dcc8", "#fffaf0"],
    neon: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
    cyber: ["#041418", "#08303a", "#0c5260", "#108088", "#18b4b0", "#4ce8d8", "#b4fff0", "#ffffff"],
    matrix: ["#020a04", "#05200c", "#0a3c16", "#106624", "#1a9a34", "#3cd650", "#a4ffa8", "#e8ffe8"],
    candy: ["#ff4a5a", "#ff9a2a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff", "#f53cd1"],
    night: ["#07060d", "#0c0a18", "#131026", "#1b1734", "#241f44", "#2f2956"]
  };
  var RAMP = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, ramp(v)]));
  var WHITE = hex("#ffffff");
  var BLACK = hex("#000000");
  var INK = hex("#0b0a10");
  var PATCH = hex("#f53cd1");

  // core/particles.js
  function cycle(t, period, count, seed, life, fn) {
    for (let i = 0; i < count; i++) {
      const g = rng(seed, i, 911);
      const born = g.next() * period;
      const L2 = typeof life === "function" ? life(g) : life;
      let age = ((t - born) % period + period) % period;
      for (; age < L2; age += period) fn(age, L2, rng(seed, i), i);
    }
  }

  // core/shapes.js
  function bolt(r, x0, y0, x1, y1, { jag = 0.22, depth = 5 } = {}) {
    let pts = [[x0, y0], [x1, y1]];
    for (let d = 0; d < depth; d++) {
      const next = [pts[0]];
      for (let i = 1; i < pts.length; i++) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, L2 = Math.hypot(dx, dy);
        const off = (r.next() * 2 - 1) * jag * L2;
        next.push([(ax + bx) / 2 + -dy / (L2 || 1) * off, (ay + by) / 2 + dx / (L2 || 1) * off], pts[i]);
      }
      pts = next;
    }
    return pts;
  }

  // core/sim.js
  var GRAVITY = 950;
  var CROSS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  var HOT = ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"].map(hex);
  var FIRE_RAMP = ["#ffffff", "#fff3a6", "#ffe26b", "#ffc23d", "#ff8a2a", "#f2561d", "#c9281f", "#8a1f17", "#4a1712"].map(hex);
  var SMOKE_RAMP = ["#7b6f72", "#5d5660", "#433d48", "#2b2630", "#1a171e"].map(hex);
  var rampAt = (r, t) => r[Math.min(r.length - 1, Math.max(0, Math.floor(t * r.length)))];
  var P = { SPARK: 0, MOTE: 1, STREAK: 2, FLAKE: 3, VAPOUR: 4, DUST: 5, STAR: 6, EMBER: 7, SMOKE: 8, FIRE: 9, BRAND: 10, GRIT: 11 };
  var PF = { SMOKES: 1, BIG: 2, BACK: 4 };
  var SOFT = /* @__PURE__ */ new Set([P.VAPOUR, P.DUST, P.SMOKE]);
  var Particles = class {
    constructor(opts = {}) {
      this.R = opts.rng ?? new Rng(opts.seed ?? 1);
      this.list = [];
      this.t = 0;
      this.ground = opts.ground ?? (() => Infinity);
      this.sparks = (opts.sparks ?? HOT).map(hex);
      this.haze = opts.haze === void 0 ? null : hex(opts.haze);
      this.onLand = opts.onLand ?? null;
    }
    /** delay: seconds before it appears; flag: PF bits. col 0 lets FIRE and SMOKE use their own ramps. */
    spawn(k, x, y, vx, vy, life, col = WHITE, size = 1, delay = 0, flag = 0) {
      this.list.push({ k, x, y, vx, vy, life, max: life, col: col ? hex(col) : 0, size, seed: this.R.next() * 100, delay, flag });
    }
    get count() {
      return this.list.length;
    }
    update(dt) {
      this.t += dt;
      const R4 = this.R, t = this.t;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const p = this.list[i];
        if (p.delay > 0) {
          p.delay -= dt;
          continue;
        }
        if ((p.life -= dt) <= 0) {
          if (p.k === P.FIRE && p.flag & PF.SMOKES) {
            const big = p.flag & PF.BIG;
            this.spawn(P.SMOKE, p.x, p.y, p.vx * 0.6, p.vy * 0.6 - 6, big ? R4.range(1.3, 2.3) : R4.range(0.8, 1.4), 0, p.size * (big ? 0.85 : 0.7), 0, big ? PF.BIG : 0);
          }
          this.list.splice(i, 1);
          continue;
        }
        switch (p.k) {
          case P.FIRE:
            p.vy -= 95 * dt;
            p.vx += Math.sin(t * 17 + p.seed) * 30 * dt;
            p.vx -= p.vx * 5 * dt;
            p.vy -= p.vy * 3.2 * dt;
            break;
          case P.GRIT: {
            p.vy += GRAVITY * dt;
            p.vx -= p.vx * 0.8 * dt;
            const g = this.ground(p.x), ny = p.y + p.vy * dt;
            p.x += p.vx * dt;
            if (p.vy > 0 && p.y <= g && ny >= g) {
              p.y = g - 0.25;
              if (p.vy > 130 && R4.chance(0.4)) p.vy = -p.vy * 0.25, p.vx = p.vx * 0.5 + R4.range(-10, 10);
              else p.vx = p.vy = 0, p.life = Math.min(p.life, 0.5);
            } else p.y = ny;
            continue;
          }
          case P.BRAND: {
            p.vy += GRAVITY * 0.8 * dt;
            p.vx -= p.vx * 0.9 * dt;
            if (R4.chance(0.9 * Math.min(1, dt * 60))) this.spawn(P.FIRE, p.x, p.y, p.vx * 0.1 + R4.range(-7, 7), p.vy * 0.1 - 10, R4.range(0.16, 0.32), 0, R4.range(0.9, 1.7) * (0.5 + p.life / p.max * 0.6), 0, R4.chance(0.4) ? PF.SMOKES : 0);
            const g = this.ground(p.x), ny = p.y + p.vy * dt;
            p.x += p.vx * dt;
            if (p.vy > 0 && p.y <= g && ny >= g) {
              this.onLand?.(p.x, g);
              this.list.splice(i, 1);
            } else p.y = ny;
            continue;
          }
          case P.SPARK: {
            p.vy += GRAVITY * 0.45 * dt;
            p.vx -= p.vx * 2.2 * dt;
            p.vy -= p.vy * 2.2 * dt;
            const g = this.ground(p.x), ny = p.y + p.vy * dt;
            p.x += p.vx * dt;
            if (p.vy > 0 && p.y <= g && ny >= g) p.vy = -p.vy * 0.45, p.vx *= 0.7, p.y = g - 0.25;
            else p.y = ny;
            continue;
          }
          case P.STREAK:
            p.vx += p.vx * 3 * dt, p.vy += p.vy * 3 * dt;
            break;
          case P.FLAKE:
            p.vx -= p.vx * 2.2 * dt;
            p.vy -= p.vy * 2.2 * dt - 35 * dt;
            p.x += Math.sin(this.t * 2.5 + p.seed) * 7 * dt;
            break;
          case P.EMBER:
            p.vy += (-30 + Math.sin(t * 3 + p.seed) * 20) * dt;
            p.vx += Math.cos(t * 2.3 + p.seed) * 45 * dt;
            p.vx -= p.vx * 1.6 * dt;
            p.vy -= p.vy * 1.6 * dt;
            break;
          case P.SMOKE: {
            const big = p.flag & PF.BIG;
            p.vy -= (big ? 23 : 16) * dt;
            p.vx += Math.sin(t * 1.3 + p.seed) * 8 * dt;
            p.vx -= p.vx * 1.6 * dt;
            p.vy -= p.vy * 1.2 * dt;
            break;
          }
          case P.MOTE:
            p.vx -= p.vx * 0.6 * dt;
            p.vy -= p.vy * 0.6 * dt;
            break;
          default: {
            const drag = SOFT.has(p.k) ? 4 : 1.6;
            p.vx -= p.vx * drag * dt;
            p.vy -= p.vy * drag * dt + 5 * dt;
          }
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
    }
    draw(p, layer) {
      for (const q of this.list) {
        if (q.delay > 0) continue;
        if (layer && (SOFT.has(q.k) || q.flag & PF.BACK ? "back" : "front") !== layer) continue;
        const k = q.life / q.max, x = q.x, y = q.y, sp = Math.hypot(q.vx, q.vy) || 1, ux = q.vx / sp, uy = q.vy / sp;
        switch (q.k) {
          case P.SPARK: {
            const S = this.sparks, head = k > 0.6 ? S[0] : k > 0.3 ? S[1] : S[2], len2 = Math.min(9, 1 + sp * 0.022);
            p.line(x - ux * len2, y - uy * len2, x - ux * len2 * 0.4, y - uy * len2 * 0.4, k > 0.5 ? head : S[S.length - 1]);
            p.line(x - ux * len2 * 0.45, y - uy * len2 * 0.45, x, y, head);
            p.glow(x, y, 3, head, 0.45 * k);
            break;
          }
          case P.MOTE: {
            const len2 = Math.min(16, 0.5 + sp * 0.026) * q.size, a = k < 0.35 ? k / 0.35 : 1;
            p.line(x - ux * len2, y - uy * len2, x - ux * len2 * 0.35, y - uy * len2 * 0.35, scale(q.col, 0.55), a);
            p.line(x - ux * len2 * 0.4, y - uy * len2 * 0.4, x, y, q.col, a);
            p.glow(x, y, 2.5 + q.size, q.col, 0.4 * k);
            break;
          }
          case P.STREAK: {
            const L2 = clamp(sp / 30, 1, 7);
            for (let d = L2; d >= 0; d -= 0.5) p.dot(x - ux * d, y - uy * d, d < 1 ? WHITE : d < L2 * 0.5 ? q.col : scale(q.col, 0.6), d < L2 * 0.5 ? 1 : 1.2 - d / L2);
            p.glow(x, y, 4, q.col, 0.4);
            break;
          }
          case P.FLAKE: {
            const a = Math.min(1, k * 3);
            p.dot(x, y, q.col, a);
            if (q.size > 1.3) for (const [dx, dy] of CROSS) p.dot(x + dx, y + dy, scale(q.col, 0.8), a * 0.8);
            break;
          }
          case P.VAPOUR: {
            const r = q.size * (0.6 + (1 - k) * 0.9);
            p.disc(x, y, r, q.col, Math.pow(k, 1.3) * 0.45);
            if (this.haze) p.glow(x, y, r * 1.8, this.haze, 0.16 * k);
            break;
          }
          case P.DUST:
            p.disc(x, y, q.size * (0.6 + (1 - k) * 0.9), q.col, Math.pow(k, 1.3) * 0.7);
            break;
          case P.SMOKE: {
            const age = 1 - k, big = q.flag & PF.BIG;
            const r = q.size * (0.65 + Math.min(1, age * 2.5) * 0.45 + age * (big ? 0.5 : 0.4));
            const a = Math.min(1, age * 12) * Math.min(1, k * 2.4) * (big ? 0.7 : 0.58);
            const c = q.col ? mix(q.col, rampAt(SMOKE_RAMP, age), age) : rampAt(SMOKE_RAMP, age * 1.05);
            p.disc(x, y, r, c, a * 0.45);
            p.disc(x + r * 0.05, y + r * 0.06, r * 0.74, c, a * 0.62);
            if (age < 0.5) p.disc(x - r * 0.22, y - r * 0.3, r * 0.5, mix(c, WHITE, 0.12), a * 0.4 * (1 - age * 2));
            break;
          }
          case P.FIRE: {
            const age = 1 - k, heat = Math.min(0.999, Math.pow(age, 0.62) + q.seed % 1 * 0.1), F = FIRE_RAMP, n = F.length;
            const idx = Math.min(n - 2, Math.floor(heat * (n - 1)));
            const r = q.size * (0.55 + 0.45 * Math.min(1, age * 7)) * (1 - age * 0.55), c = F[idx];
            if (idx >= n - 2) p.disc(x, y, r, c, Math.min(1, k * 3) * 0.85);
            else {
              p.circle(x, y, r, F[Math.min(n - 1, idx + 2)]);
              p.circle(x - r * 0.16, y - r * 0.22, r * 0.78, c);
              if (r > 1.6) p.circle(x, y - r * 0.9, r * 0.42, c);
              if (idx <= 3 && r > 1.8) p.circle(x - r * 0.28, y - r * 0.34, r * 0.36, F[Math.max(0, idx - 1)]);
              if (idx < 6) p.glow(x, y, r * 2.4 + 2, c, 0.18 * k);
            }
            break;
          }
          case P.BRAND:
            p.circle(x, y, 1.6, HOT[3]);
            p.px(x, y, Math.sin(this.t * 40 + q.seed) > 0 ? HOT[0] : HOT[1]);
            p.px(x + 1, y, HOT[1]);
            p.glow(x, y, 7, HOT[2], 0.45);
            break;
          case P.GRIT:
            if (k > 0.25 || k * 4 > 0.5) {
              p.px(x, y, q.col);
              if (q.size >= 2) p.px(x + 1, y, q.col), p.px(x, y + 1, scale(q.col, 0.8)), p.px(x + 1, y + 1, scale(q.col, 0.7));
            }
            break;
          case P.EMBER: {
            const c = k > 0.6 ? this.sparks[0] : k > 0.3 ? this.sparks[1] : this.sparks[2];
            if (k < 0.25 && Math.sin(this.t * 40 + q.seed) < 0) break;
            p.px(x, y, c);
            if (q.size > 1.5) p.px(x, y + 1, this.sparks[this.sparks.length - 1]);
            p.glow(x, y, 3 + q.size, c, 0.35 * k);
            break;
          }
          default: {
            const tw = 0.6 + 0.4 * Math.sin(this.t * (8 + q.seed % 5) + q.seed);
            if (q.size < 1) {
              if (tw * k > 0.25) p.px(x, y, tw > 0.8 ? WHITE : q.col);
              p.glow(x, y, 3, q.col, 0.4 * k * tw);
              break;
            }
            sparkle(p, x, y, q.size * tw * Math.min(1, k * 3), q.col, scale(q.col, 0.75), 0.5 * k * tw);
          }
        }
      }
    }
  };
  var Blazes = class {
    constructor(ps) {
      this.ps = ps;
      this.list = [];
    }
    add(x, y, life, power) {
      this.list.push({ x, y, life, max: life, acc: this.ps.R.next(), power });
    }
    get count() {
      return this.list.length;
    }
    update(dt) {
      const ps = this.ps, R4 = ps.R;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const b = this.list[i];
        if ((b.life -= dt) <= 0) {
          this.list.splice(i, 1);
          continue;
        }
        const k = b.life / b.max, intensity = b.power * (k > 0.7 ? 1 : 0.35 + k / 0.7 * 0.65);
        for (b.acc += dt * (6 + 16 * intensity); b.acc > 1; b.acc--) {
          const s = R4.range(1.2, 2.8) * intensity;
          ps.spawn(P.FIRE, b.x + R4.range(-1.5, 1.5), b.y - s * 0.6, R4.range(-6, 6), R4.range(-30, -12), R4.range(0.28, 0.6), 0, s, 0, PF.BACK | (R4.chance(0.3) ? PF.SMOKES : 0));
          if (R4.chance(0.06)) ps.spawn(P.EMBER, b.x, b.y - 1.5, R4.range(-15, 15), R4.range(-45, -15), R4.range(0.6, 1.4), HOT[2], 1, 0, PF.BACK);
        }
      }
    }
    drawBack(p) {
      for (const b of this.list) {
        const k = b.life / b.max;
        p.px(b.x, b.y, k > 0.4 ? Math.sin(b.life * 31 + b.x) > 0 ? HOT[1] : HOT[2] : HOT[3]);
        p.glow(b.x, b.y, 6 + 5 * k * b.power, HOT[2], 0.3 * k * b.power);
      }
    }
  };
  var B = { SHARD: 0, CHUNK: 1, DRIP: 2 };
  var Bits = class {
    constructor(opts = {}) {
      this.list = [];
      this.ground = opts.ground ?? (() => Infinity);
    }
    add(b) {
      const life = b.life ?? 1;
      this.list.push({ kind: B.SHARD, vx: 0, vy: 0, a: 0, va: 0, s: 1, c: WHITE, g: 1, drag: 0, bounce: 0, rest: false, ...b, life, max: life });
    }
    get count() {
      return this.list.length;
    }
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const b = this.list[i];
        if ((b.life -= dt) <= 0) {
          this.list.splice(i, 1);
          continue;
        }
        if (b.rest) continue;
        b.vy += GRAVITY * b.g * dt;
        b.vx -= b.vx * b.drag * dt;
        b.vy -= b.vy * b.drag * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.a += b.va * dt;
        const floor = this.ground(b.x), sp = b.vy;
        if (b.g <= 0 || b.y < floor || sp <= 0) continue;
        b.y = floor - 0.01;
        if (b.kind === B.DRIP) b.life = 0;
        else if (b.bounce > 0 && sp > 70) b.vy = -sp * b.bounce, b.vx *= 0.7, b.va *= 0.6;
        else b.rest = true, b.vx = b.vy = 0;
      }
    }
    draw(p) {
      for (const b of this.list) {
        const a = Math.min(1, b.life / 0.4), ca = Math.cos(b.a), sa = Math.sin(b.a);
        if (b.kind === B.SHARD) {
          for (let d = -b.s / 2; d <= b.s / 2; d += 0.5) p.dot(b.x + ca * d, b.y + sa * d, d > b.s / 2 - 0.6 ? WHITE : hex(b.c), a);
        } else if (b.kind === B.DRIP) {
          p.dot(b.x, b.y, hex(b.c), a);
          p.dot(b.x, b.y - 1, hex(b.c), a * 0.5);
        } else {
          const R4 = (b.ramp ?? ["#1c2030", "#3a4a66", "#6e86a8", "#a8c0dc", "#e8f2ff"]).map(hex), n = R4.length;
          const x = Math.round(b.x), y = Math.round(b.y), r = Math.ceil(b.s) + 1;
          for (let py = -r; py <= r; py++)
            for (let px = -r; px <= r; px++) {
              const u = (px + 0.5) * ca + (py + 0.5) * sa, v = -(px + 0.5) * sa + (py + 0.5) * ca;
              const d = Math.abs(u) / b.s + Math.abs(v) / (b.s * 0.62);
              if (d > 1.3) continue;
              p.dot(x + px, y + py, d > 1 ? R4[0] : v < 0 ? u < 0 ? R4[n - 1] : R4[n - 2] : u < 0 ? R4[n - 3] : R4[Math.max(1, n - 4)], a);
            }
        }
      }
    }
  };
  var Lights = class {
    constructor() {
      this.list = [];
    }
    add(x, y, r, color, k, life) {
      this.list.push({ x, y, r, color: hex(color), k, life, max: life });
    }
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) if ((this.list[i].life -= dt) <= 0) this.list.splice(i, 1);
    }
    draw(p) {
      for (const l of this.list) {
        const k = l.life / l.max;
        p.glow(l.x, l.y, l.r * (0.55 + 0.45 * k), l.color, l.k * k * k);
      }
    }
  };
  function sparkle(p, x, y, arm, c, tip = c, k = 0.6) {
    const n = Math.round(arm);
    if (n < 1) return;
    const X = Math.floor(x), Y = Math.floor(y);
    for (let d = 1; d <= n; d++) {
      const cc = d > n * 0.6 ? tip : c;
      for (const [dx, dy] of CROSS) p.px(X + dx * d, Y + dy * d, cc);
    }
    if (n >= 3) for (const [dx, dy] of DIAG) p.px(X + dx, Y + dy, c);
    if (n >= 6) for (const [dx, dy] of DIAG) p.px(X + dx * 2, Y + dy * 2, tip);
    p.px(X, Y, WHITE);
    p.glow(x, y, 4 + n * 2, c, k);
  }
  function flare(p, x, y, L2, k, ramp2) {
    if (L2 < 1) return;
    const R4 = ramp2.map(hex), n = R4.length;
    for (let i = 0; i < 8; i++) {
      const an = i * Math.PI / 4, len2 = i % 4 === 0 ? L2 : i % 2 === 0 ? L2 * 0.6 : L2 * 0.3, ca = Math.cos(an), sa = Math.sin(an);
      for (let d = 0; d <= len2; d += 0.5) {
        const u = d / len2;
        p.dot(x + ca * d, y + sa * d, u < 0.35 ? WHITE : u < 0.7 ? R4[n - 2] : R4[n - 3], u < 0.6 ? 1 : k * 1.5 * (1 - u) + 0.2);
      }
    }
  }
  function band(p, cx, cy, r, sy, th, k, ramp2, keep = () => true, hot = false) {
    if (r <= 0 || k <= 0) return;
    const R4 = ramp2.map(hex), n = R4.length;
    for (let j = 0, m = Math.ceil(r * TAU * 1.2); j < m; j++) {
      const ang = j / m * TAU, ca = Math.cos(ang), sa = Math.sin(ang);
      if (!keep(ang)) continue;
      for (let o = th; o >= 0; o -= 0.5) {
        const u = o / th, c = u < 0.15 ? hot ? WHITE : R4[n - 1] : u < 0.4 ? R4[n - 2] : u < 0.7 ? R4[n - 3] : R4[n - 4];
        p.dot(cx + ca * (r - o), cy + sa * (r - o) * sy, c, k * (u < 0.4 ? 1.2 : 1.15 - u));
      }
    }
  }
  function crystal(p, x, base, h, w, lean, ramp2, opts = {}) {
    if (h < 1.5) return;
    const R4 = ramp2.map(hex), n = R4.length, C = (i) => R4[Math.max(0, n - 1 - i)];
    const a = opts.a ?? 1, top = base - h, ridge0 = x - w * 0.14, glint2 = opts.glint ?? -1;
    const inside = (px, py) => {
      const u = (base - (py + 0.5)) / h;
      return u >= 0 && u <= 1 && Math.abs(px + 0.5 - (x + lean * u)) <= w / 2 * (1 - u) + 0.35;
    };
    for (let py = Math.floor(top) - 1; py < Math.ceil(base); py++)
      for (let px = Math.floor(x - w / 2 - Math.abs(lean) - 2); px <= Math.ceil(x + w / 2 + Math.abs(lean) + 2); px++) {
        if (!inside(px, py)) {
          if (inside(px - 1, py) || inside(px + 1, py) || inside(px, py + 1) || inside(px, py - 1) && py < base - 1) p.dot(px, py, R4[0], a);
          continue;
        }
        if (opts.white) {
          p.dot(px, py, WHITE, a);
          continue;
        }
        const u = (base - (py + 0.5)) / h, rx = ridge0 + (x + lean - ridge0) * u, c = x + lean * u, hw = w / 2 * (1 - u) + 0.35, fx = px + 0.5;
        let col = u > 0.9 ? WHITE : Math.abs(fx - rx) < 0.55 ? C(1) : fx < rx ? fx - (c - hw) < 1 ? C(1) : (fx - (c - hw)) / Math.max(1, rx - (c - hw)) > 0.55 ? C(2) : C(3) : c + hw - fx < 1.2 ? C(Math.min(n - 2, 6)) : (fx - rx) / Math.max(1, c + hw - rx) > 0.5 ? C(5) : C(4);
        if (glint2 >= 0 && fx <= rx + 0.6) {
          const g = Math.abs(u - glint2);
          if (g < 0.05) col = WHITE;
          else if (g < 0.1) col = C(1);
        }
        p.dot(px, py, col, a);
      }
  }

  // core/font.js
  var MINI = {
    A: ".#.|#.#|###|#.#|#.#",
    B: "##.|#.#|##.|#.#|##.",
    C: ".##|#..|#..|#..|.##",
    D: "##.|#.#|#.#|#.#|##.",
    E: "###|#..|##.|#..|###",
    F: "###|#..|##.|#..|#..",
    G: ".##|#..|#.#|#.#|.##",
    H: "#.#|#.#|###|#.#|#.#",
    I: "###|.#.|.#.|.#.|###",
    J: "..#|..#|..#|#.#|.#.",
    K: "#.#|#.#|##.|#.#|#.#",
    L: "#..|#..|#..|#..|###",
    M: "#.#|###|###|#.#|#.#",
    N: "##.|#.#|#.#|#.#|#.#",
    O: ".#.|#.#|#.#|#.#|.#.",
    P: "##.|#.#|##.|#..|#..",
    Q: ".#.|#.#|#.#|##.|.##",
    R: "##.|#.#|##.|#.#|#.#",
    S: ".##|#..|.#.|..#|##.",
    T: "###|.#.|.#.|.#.|.#.",
    U: "#.#|#.#|#.#|#.#|###",
    V: "#.#|#.#|#.#|#.#|.#.",
    W: "#.#|#.#|###|###|#.#",
    X: "#.#|#.#|.#.|#.#|#.#",
    Y: "#.#|#.#|.#.|.#.|.#.",
    Z: "###|..#|.#.|#..|###",
    0: "###|#.#|#.#|#.#|###",
    1: ".#.|##.|.#.|.#.|###",
    2: "##.|..#|.#.|#..|###",
    3: "##.|..#|.#.|..#|##.",
    4: "#.#|#.#|###|..#|..#",
    5: "###|#..|##.|..#|##.",
    6: ".##|#..|###|#.#|###",
    7: "###|..#|.#.|.#.|.#.",
    8: "###|#.#|###|#.#|###",
    9: "###|#.#|###|..#|##.",
    "+": "...|.#.|###|.#.|...",
    "-": "...|...|###|...|...",
    "!": "#|#|#|.|#",
    "?": "##.|..#|.#.|...|.#.",
    ".": ".|.|.|.|#",
    ",": "..|..|..|.#|#.",
    ":": ".|#|.|#|.",
    "/": "..#|..#|.#.|#..|#..",
    "%": "#.#|..#|.#.|#..|#.#",
    x: "...|#.#|.#.|#.#|...",
    "*": "#.#|.#.|#.#|...|...",
    "'": "#|#|.|.|.",
    "(": ".#|#.|#.|#.|.#",
    ")": "#.|.#|.#|.#|#.",
    "<": "..#|.#.|#..|.#.|..#",
    ">": "#..|.#.|..#|.#.|#..",
    "=": "...|###|...|###|...",
    _: "...|...|...|...|###",
    "#": "#.#|###|#.#|###|#.#"
  };
  var BIG = {
    A: ".###.|#...#|#...#|#####|#...#|#...#|#...#",
    B: "####.|#...#|#...#|####.|#...#|#...#|####.",
    C: ".###.|#...#|#....|#....|#....|#...#|.###.",
    D: "####.|#...#|#...#|#...#|#...#|#...#|####.",
    E: "#####|#....|#....|####.|#....|#....|#####",
    F: "#####|#....|#....|####.|#....|#....|#....",
    G: ".###.|#...#|#....|#.###|#...#|#...#|.####",
    H: "#...#|#...#|#...#|#####|#...#|#...#|#...#",
    I: "###|.#.|.#.|.#.|.#.|.#.|###",
    J: "..###|...#.|...#.|...#.|...#.|#..#.|.##..",
    K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",
    L: "#....|#....|#....|#....|#....|#....|#####",
    M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",
    N: "#...#|#...#|##..#|#.#.#|#..##|#...#|#...#",
    O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
    P: "####.|#...#|#...#|####.|#....|#....|#....",
    Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",
    R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
    S: ".####|#....|#....|.###.|....#|....#|####.",
    T: "#####|..#..|..#..|..#..|..#..|..#..|..#..",
    U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
    V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..",
    W: "#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.",
    X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
    Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",
    Z: "#####|....#|...#.|..#..|.#...|#....|#####",
    0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",
    1: ".#.|##.|.#.|.#.|.#.|.#.|###",
    2: ".###.|#...#|....#|...#.|..#..|.#...|#####",
    3: "#####|...#.|..#..|...#.|....#|#...#|.###.",
    4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.",
    5: "#####|#....|####.|....#|....#|#...#|.###.",
    6: "..##.|.#...|#....|####.|#...#|#...#|.###.",
    7: "#####|....#|...#.|..#..|.#...|.#...|.#...",
    8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
    9: ".###.|#...#|#...#|.####|....#|...#.|.##..",
    "!": "#|#|#|#|#|.|#",
    "?": ".###.|#...#|....#|...#.|..#..|.....|..#..",
    "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
    "-": "....|....|....|####|....|....|....",
    ".": ".|.|.|.|.|.|#",
    ",": "..|..|..|..|..|.#|#.",
    ":": ".|.|#|.|.|#|.",
    "/": "....#|....#|...#.|..#..|.#...|#....|#....",
    "%": "##...|##..#|...#.|..#..|.#...|#..##|...##",
    x: ".....|.....|#...#|.#.#.|..#..|.#.#.|#...#",
    "*": ".....|..#..|#.#.#|.###.|#.#.#|..#..|.....",
    "'": "#|#|.|.|.|.|.",
    "<": "...#|..#.|.#..|#...|.#..|..#.|...#",
    ">": "#...|.#..|..#.|...#|..#.|.#..|#...",
    "=": "....|....|####|....|####|....|....",
    "(": "..#|.#.|#..|#..|#..|.#.|..#",
    ")": "#..|.#.|..#|..#|..#|.#.|#..",
    "#": ".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#."
  };
  function build(table, h) {
    const out = {};
    for (const [ch, src] of Object.entries(table)) {
      const rows = src.split("|");
      out[ch] = { w: rows[0].length, rows: rows.map((r) => [...r].map((c) => c === "#")) };
      if (rows.length !== h) throw new Error(`glyph ${ch} has ${rows.length} rows, expected ${h}`);
    }
    return out;
  }
  var FONTS = {
    mini: { h: 5, space: 2, gap: 1, glyphs: build(MINI, 5) },
    big: { h: 7, space: 3, gap: 1, glyphs: build(BIG, 7) }
  };
  function textWidth(str, font = "mini") {
    const F = FONTS[font];
    let w = 0;
    for (const ch of String(str)) {
      const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()];
      w += (g ? g.w : F.space) + F.gap;
    }
    return Math.max(0, w - F.gap);
  }
  function rasterText(str, font, plot2) {
    const F = FONTS[font];
    let x = 0;
    for (const ch of String(str)) {
      const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()];
      if (!g) {
        x += F.space + F.gap;
        continue;
      }
      for (let r = 0; r < F.h; r++) for (let c = 0; c < g.w; c++) if (g.rows[r][c]) plot2(x + c, r);
      x += g.w + F.gap;
    }
  }

  // core/painter.js
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  var OUT = { c: 0, a: 1, l: 0, k: 0 };
  var sprites = /* @__PURE__ */ new WeakMap();
  var call = (v, ...args) => typeof v === "function" ? v(...args) : v;
  var Painter = class {
    constructor(frame2) {
      this.frame = frame2;
      this.reset();
    }
    /** Re-read the frame and clear placement, fade and light strength. */
    reset() {
      const f = this.frame;
      this.w = f.w;
      this.h = f.h;
      this.ox = f.ox | 0;
      this.oy = f.oy | 0;
      this.C = f.color;
      this.L = f.light;
      this.tx = 0;
      this.ty = 0;
      this.fx = 1;
      this.cs = 1;
      this.sn = 0;
      this.fade = 1;
      this.lightK = 1;
      this.layer = "front";
      return this;
    }
    /** Put the effect's origin at (x, y) in frame space, mirrored if flip, rotated by angle (radians). */
    place(x, y, flip = false, angle = 0) {
      this.tx = x;
      this.ty = y;
      this.fx = flip ? -1 : 1;
      this.cs = Math.cos(angle);
      this.sn = Math.sin(angle);
      return this;
    }
    // ---- transforms: local (effect) space <-> screen (frame) space
    toX(x, y) {
      return this.tx + x * this.fx * this.cs - y * this.sn;
    }
    toY(x, y) {
      return this.ty + x * this.fx * this.sn + y * this.cs;
    }
    fromX(sx, sy) {
      const dx = sx - this.tx, dy = sy - this.ty;
      return (dx * this.cs + dy * this.sn) * this.fx;
    }
    fromY(sx, sy) {
      const dx = sx - this.tx, dy = sy - this.ty;
      return -dx * this.sn + dy * this.cs;
    }
    // the screen pixel of the local pixel cell holding (x, y): mirrors and rotations land on whole cells
    cellX(x, y) {
      return Math.floor(this.toX(Math.floor(x) + 0.5, Math.floor(y) + 0.5));
    }
    cellY(x, y) {
      return Math.floor(this.toY(Math.floor(x) + 0.5, Math.floor(y) + 0.5));
    }
    // ---- raw writes, screen space, whole pixels. Color 0 means "nothing": it never erases what's there.
    put(sx, sy, c, a = 1) {
      if (!c) return;
      a *= this.fade;
      if (a < 1 && a <= BAYER[(sy & 3) << 2 | sx & 3]) return;
      const x = sx - this.ox, y = sy - this.oy;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      this.C[y * this.w + x] = c;
    }
    add(sx, sy, c, k = 1) {
      k *= this.fade * this.lightK;
      if (k <= 4e-3) return;
      const x = sx - this.ox, y = sy - this.oy;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = y * this.w + x, d = this.L[i];
      const r = Math.min(255, (d & 255) + (c & 255) * k) | 0;
      const g = Math.min(255, (d >>> 8 & 255) + (c >>> 8 & 255) * k) | 0;
      const b = Math.min(255, (d >>> 16 & 255) + (c >>> 16 & 255) * k) | 0;
      this.L[i] = 255 << 24 | b << 16 | g << 8 | r;
    }
    /**
     * Blend a color over what's there at alpha a (0..1), keeping the result's own alpha: soft smoke, vapour and
     * mist. Use dithered dot() for hard pixel fades and blend() for translucent volumes.
     */
    blendPx(sx, sy, c, a) {
      a *= this.fade;
      if (!c || a <= 4e-3) return;
      const x = sx - this.ox, y = sy - this.oy;
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = y * this.w + x, d = this.C[i], da = (d >>> 24) / 255, oa = a + da * (1 - a), k = a / oa;
      const ch = (s) => (c >>> s & 255) * k + (d >>> s & 255) * (1 - k) & 255;
      this.C[i] = (oa * 255 & 255) << 24 | ch(16) << 16 | ch(8) << 8 | ch(0);
    }
    /** Translucent pixel at a local point. */
    blend(x, y, c, a) {
      this.blendPx(this.cellX(x, y), this.cellY(x, y), c, a);
    }
    /** A translucent disc: puffs of smoke, vapour, dust. c and a may be functions of (d: 0 center..1 rim, angle). */
    disc(cx, cy, r, c, a) {
      if (r < 0.5) return this.blend(cx, cy, call(c, 0, 0), call(a, 0, 0));
      this.each(cx - r, cy - r, cx + r, cy + r, (x, y, sx, sy) => {
        const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
        if (d2 > r * r) return;
        const d = Math.sqrt(d2) / r, ang = Math.atan2(dy, dx);
        this.blendPx(sx, sy, call(c, d, ang), call(a, d, ang));
      });
    }
    /** Read back the color under a local point (0 if empty). */
    get(x, y) {
      const sx = this.cellX(x, y) - this.ox, sy = this.cellY(x, y) - this.oy;
      return sx < 0 || sy < 0 || sx >= this.w || sy >= this.h ? 0 : this.C[sy * this.w + sx];
    }
    // ---- pixels
    /** One opaque pixel. */
    px(x, y, c) {
      this.put(this.cellX(x, y), this.cellY(x, y), c, 1);
    }
    /** One pixel at alpha a (0..1), faded by ordered dither. */
    dot(x, y, c, a = 1) {
      if (a > 0) this.put(this.cellX(x, y), this.cellY(x, y), c, a);
    }
    /** Add light to one pixel. */
    light(x, y, c, k = 1) {
      this.add(this.cellX(x, y), this.cellY(x, y), c, k);
    }
    /**
     * Visit every screen pixel whose center falls in the local box [x0, x1] x [y0, y1], with that center in
     * local space: fn(lx, ly, sx, sy). The basis of every filled shape, so shapes mirror and rotate exactly.
     */
    each(x0, y0, x1, y1, fn) {
      let ax = Infinity, bx = -Infinity, ay = Infinity, by = -Infinity;
      for (let k = 0; k < 4; k++) {
        const x = k & 1 ? x1 : x0, y = k & 2 ? y1 : y0, sx = this.toX(x, y), sy = this.toY(x, y);
        if (sx < ax) ax = sx;
        if (sx > bx) bx = sx;
        if (sy < ay) ay = sy;
        if (sy > by) by = sy;
      }
      const sx0 = Math.max(Math.floor(ax), this.ox), sx1 = Math.min(Math.ceil(bx), this.ox + this.w - 1);
      const sy0 = Math.max(Math.floor(ay), this.oy), sy1 = Math.min(Math.ceil(by), this.oy + this.h - 1);
      for (let sy = sy0; sy <= sy1; sy++)
        for (let sx = sx0; sx <= sx1; sx++) {
          const cx = sx + 0.5, cy = sy + 0.5;
          fn(this.fromX(cx, cy), this.fromY(cx, cy), sx, sy);
        }
    }
    /**
     * A pixel shader over a local box. fn(x, y, out) returns a color, or sets out.c (color), out.a (alpha),
     * out.l (light color, defaults to out.c) and out.k (light amount). Return nothing to leave the pixel alone.
     */
    shade(x0, y0, x1, y1, fn) {
      const o = OUT;
      this.each(x0, y0, x1, y1, (lx, ly, sx, sy) => {
        o.c = 0;
        o.a = 1;
        o.l = 0;
        o.k = 0;
        const c = fn(lx, ly, o) || o.c;
        if (c) this.put(sx, sy, c, o.a);
        if (o.k > 0) this.add(sx, sy, o.l || c, o.k);
      });
    }
    // ---- shapes. Colors (c) and alphas (a) can be numbers or functions of the shape's own coordinates.
    /** 1 px line. c and a may be functions of u (0 at the start, 1 at the end). */
    line(x0, y0, x1, y1, c, a = 1) {
      let sx = this.cellX(x0, y0), sy = this.cellY(x0, y0);
      const ex = this.cellX(x1, y1), ey = this.cellY(x1, y1);
      const dx = Math.abs(ex - sx), dy = -Math.abs(ey - sy), stepx = sx < ex ? 1 : -1, stepy = sy < ey ? 1 : -1;
      const n = Math.max(dx, -dy) || 1, fc = typeof c === "function", fa = typeof a === "function";
      let err = dx + dy, i = 0;
      for (; ; ) {
        const u = i++ / n;
        this.put(sx, sy, fc ? c(u) : c, fa ? a(u) : a);
        if (sx === ex && sy === ey) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          sx += stepx;
        }
        if (e2 <= dx) {
          err += dx;
          sy += stepy;
        }
      }
    }
    /** Lines through a list of points [[x, y], ...]. */
    polyline(pts, c, a = 1) {
      for (let i = 1; i < pts.length; i++) this.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], c, a);
    }
    /** Thick segment with round ends. c and a may be functions of (u along, v across: 0 center, 1 edge). */
    beam(x0, y0, x1, y1, width, c, a = 1) {
      const r = width / 2, dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1e-9;
      this.shade(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, (x, y, o) => {
        const u = clamp(((x - x0) * dx + (y - y0) * dy) / L2), px = x0 + dx * u - x, py = y0 + dy * u - y;
        const d2 = px * px + py * py;
        if (d2 > r * r) return;
        const v = Math.sqrt(d2) / r;
        o.c = call(c, u, v);
        o.a = call(a, u, v);
      });
    }
    /** Filled disc. c and a may be functions of (d: 0 center to 1 rim, angle). */
    circle(cx, cy, r, c, a = 1) {
      if (r < 0.6) return this.dot(cx, cy, call(c, 0, 0), call(a, 0, 0));
      this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
        const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
        if (d2 > r * r) return;
        const d = Math.sqrt(d2) / r, ang = Math.atan2(dy, dx);
        o.c = call(c, d, ang);
        o.a = call(a, d, ang);
      });
    }
    /** Ellipse. c and a may be functions of (d: 0 center to 1 rim, angle). */
    ellipse(cx, cy, rx, ry, c, a = 1) {
      if (rx <= 0 || ry <= 0) return;
      this.shade(cx - rx, cy - ry, cx + rx, cy + ry, (x, y, o) => {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, d2 = dx * dx + dy * dy;
        if (d2 > 1) return;
        const d = Math.sqrt(d2), ang = Math.atan2(dy, dx);
        o.c = call(c, d, ang);
        o.a = call(a, d, ang);
      });
    }
    /** Ring from radius r - w to r. c and a may be functions of (v: 0 inner to 1 outer, angle). */
    ring(cx, cy, r, w, c, a = 1) {
      const r0 = Math.max(0, r - w);
      this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
        const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
        if (d2 > r * r || d2 < r0 * r0) return;
        const v = w > 0 ? (Math.sqrt(d2) - r0) / (r - r0 || 1) : 1, ang = Math.atan2(dy, dx);
        o.c = call(c, v, ang);
        o.a = call(a, v, ang);
      });
    }
    /**
     * Band of a ring from angle a0 to a1 (radians, a1 > a0), radius r - w to r: the slash and smear shape.
     * c and a may be functions of (u: 0 at a0 to 1 at a1, v: 0 inner to 1 outer). w can be a function of u
     * for a crescent that tapers at both ends.
     */
    arc(cx, cy, r, w, a0, a1, c, a = 1) {
      const span = a1 - a0, wf = typeof w === "function";
      this.shade(cx - r, cy - r, cx + r, cy + r, (x, y, o) => {
        const dx = x - cx, dy = y - cy, d = Math.sqrt(dx * dx + dy * dy);
        if (d > r) return;
        let ang = Math.atan2(dy, dx) - a0;
        ang -= Math.floor(ang / (Math.PI * 2)) * Math.PI * 2;
        if (ang > span) return;
        const u = ang / span, ww = wf ? w(u) : w;
        if (ww <= 0 || d < r - ww) return;
        const v = (d - (r - ww)) / ww;
        o.c = call(c, u, v);
        o.a = call(a, u, v);
      });
    }
    /** Filled rectangle. */
    rect(x, y, w, h, c, a = 1) {
      if (this.sn === 0) {
        const X02 = Math.round(x), Y03 = Math.round(y), X12 = Math.round(x + w), Y12 = Math.round(y + h);
        for (let yy = Y03; yy < Y12; yy++) for (let xx = X02; xx < X12; xx++) this.put(this.cellX(xx, yy), this.cellY(xx, yy), c, a);
        return;
      }
      this.shade(x, y, x + w, y + h, (lx, ly, o) => {
        if (lx < x || ly < y || lx >= x + w || ly >= y + h) return;
        o.c = c;
        o.a = a;
      });
    }
    /** Filled polygon from points [[x, y], ...] (even-odd rule). */
    poly(pts, c, a = 1) {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [x, y] of pts) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
      const n = pts.length;
      this.shade(x0, y0, x1, y1, (x, y, o) => {
        let inside = false;
        for (let i = 0, j = n - 1; i < n; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
        }
        if (!inside) return;
        o.c = call(c, x, y);
        o.a = call(a, x, y);
      });
    }
    tri(x0, y0, x1, y1, x2, y2, c, a = 1) {
      this.poly([[x0, y0], [x1, y1], [x2, y2]], c, a);
    }
    // ---- light
    /** Radial glow into the light buffer: k at the center, falling to 0 at radius r. */
    glow(x, y, r, c, k = 0.5) {
      if (r < 1 || k <= 4e-3) return;
      const cx = this.toX(x, y), cy = this.toY(x, y);
      const x0 = Math.floor(cx - r), x1 = Math.ceil(cx + r), y0 = Math.floor(cy - r), y1 = Math.ceil(cy + r);
      for (let sy = y0; sy <= y1; sy++) {
        const dy = (sy + 0.5 - cy) / r;
        for (let sx = x0; sx <= x1; sx++) {
          const dx = (sx + 0.5 - cx) / r, d = dx * dx + dy * dy;
          if (d >= 1) continue;
          const f = 1 - Math.sqrt(d);
          this.add(sx, sy, c, f * f * k);
        }
      }
    }
    /** Glow around a segment (a soft beam of light). */
    glowLine(x0, y0, x1, y1, r, c, k = 0.5) {
      if (r < 1 || k <= 4e-3) return;
      const ax = this.toX(x0, y0), ay = this.toY(x0, y0), bx = this.toX(x1, y1), by = this.toY(x1, y1);
      const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy || 1e-9;
      const X02 = Math.floor(Math.min(ax, bx) - r), X12 = Math.ceil(Math.max(ax, bx) + r);
      const Y03 = Math.floor(Math.min(ay, by) - r), Y12 = Math.ceil(Math.max(ay, by) + r);
      for (let sy = Y03; sy <= Y12; sy++)
        for (let sx = X02; sx <= X12; sx++) {
          const px = sx + 0.5, py = sy + 0.5, u = clamp(((px - ax) * dx + (py - ay) * dy) / L2);
          const ex = ax + dx * u - px, ey = ay + dy * u - py, d = Math.sqrt(ex * ex + ey * ey) / r;
          if (d >= 1) continue;
          const f = 1 - d;
          this.add(sx, sy, c, f * f * k);
        }
    }
    /** Glow hugging a circle of radius R (a shockwave's light), falling off over width r. */
    glowRing(x, y, R4, r, c, k = 0.5) {
      if (r < 1 || k <= 4e-3) return;
      const cx = this.toX(x, y), cy = this.toY(x, y), E = R4 + r;
      for (let sy = Math.floor(cy - E); sy <= Math.ceil(cy + E); sy++)
        for (let sx = Math.floor(cx - E); sx <= Math.ceil(cx + E); sx++) {
          const d = Math.abs(Math.hypot(sx + 0.5 - cx, sy + 0.5 - cy) - R4) / r;
          if (d >= 1) continue;
          const f = 1 - d;
          this.add(sx, sy, c, f * f * k);
        }
    }
    // ---- sprites, text, masks
    /**
     * A little sprite from strings: rows like ["..##..", ".#oo#."], pal maps characters to colors
     * ({ "#": "#222034", o: 0xff... }); "." and " " are empty. Top-left at (x, y).
     * opts: { scale, a, flip (mirror left-right), flipY (upside down), tint (draw every pixel in one color) }.
     */
    sprite(rows, pal, x, y, opts = {}) {
      let s = sprites.get(rows);
      if (!s) sprites.set(rows, s = rows.map((r) => [...r]));
      const k = opts.scale ?? 1, a = opts.a ?? 1, W3 = s[0]?.length ?? 0, cache = {};
      for (let r = 0; r < s.length; r++)
        for (let q = 0; q < s[r].length; q++) {
          const ch = s[r][q];
          if (ch === "." || ch === " ") continue;
          let c = opts.tint;
          if (c === void 0) {
            c = cache[ch];
            if (c === void 0) c = cache[ch] = pal[ch] === void 0 ? 0 : hex(pal[ch]);
          }
          if (!c) continue;
          const col = opts.flip ? W3 - 1 - q : q, row = opts.flipY ? s.length - 1 - r : r;
          if (k === 1) this.dot(x + col, y + row, c, a);
          else this.rect(x + col * k, y + row * k, k, k, c, a);
        }
    }
    /**
     * Pixel text. opts: { font: "mini" (3x5) | "big" (5x7), scale, align: "left" | "center" | "right",
     * outline: color, shadow: color, a }. (x, y) is the top of the text, at the left, center or right.
     */
    text(str, x, y, c, opts = {}) {
      const font = opts.font ?? "mini", k = opts.scale ?? 1, a = opts.a ?? 1, w = textWidth(str, font) * k;
      const left = Math.round(opts.align === "center" ? x - w / 2 : opts.align === "right" ? x - w : x), top = Math.round(y);
      const ol = opts.outline, sh = opts.shadow;
      if (ol !== void 0) rasterText(str, font, (gx, gy) => this.rect(left + gx * k - 1, top + gy * k - 1, k + 2, k + 2, ol, a));
      if (sh !== void 0) rasterText(str, font, (gx, gy) => this.rect(left + gx * k + 1, top + gy * k + 1, k, k, sh, a));
      rasterText(str, font, (gx, gy) => this.rect(left + gx * k, top + gy * k, k, k, call(c, gx, gy), a));
    }
    /** Size of text in pixels: [w, h]. */
    measure(str, opts = {}) {
      const k = opts.scale ?? 1;
      return [textWidth(str, opts.font ?? "mini") * k, FONTS[opts.font ?? "mini"].h * k];
    }
    /** Fill a mask ({ w, h, data }) with its top-left at (x, y). c may be a function of (mx, my). */
    mask(m, x, y, c, a = 1) {
      for (let my = 0; my < m.h; my++)
        for (let mx = 0; mx < m.w; mx++) if (m.data[my * m.w + mx]) this.dot(x + mx, y + my, call(c, mx, my), call(a, mx, my));
    }
    /** The 1 px outline just outside a mask. */
    outline(m, x, y, c, a = 1) {
      const at2 = (mx, my) => mx >= 0 && my >= 0 && mx < m.w && my < m.h && m.data[my * m.w + mx];
      for (let my = -1; my <= m.h; my++)
        for (let mx = -1; mx <= m.w; mx++)
          if (!at2(mx, my) && (at2(mx - 1, my) || at2(mx + 1, my) || at2(mx, my - 1) || at2(mx, my + 1)))
            this.dot(x + mx, y + my, call(c, mx, my), call(a, mx, my));
    }
  };

  // core/actor.js
  var HERO = [
    "....kkkkk...",
    "..kkhhhhhk..",
    ".khhhhhhhhk.",
    ".khhhhhhhhhk",
    ".khhssssshhk",
    ".khsessesshk",
    ".khsessesshk",
    "..ksssssssk.",
    "...kkSSSkk..",
    "..kttttttk..",
    ".kttTttTttk.",
    ".ksttTTttsk.",
    ".kstttttttk.",
    "..kbbbbbbk..",
    "..kppkkppk..",
    "..kppk.kppk.",
    "..kppk.kppk.",
    "..koook.kook",
    "..kkkkk.kkkk"
  ];
  var HERO_PAL = {
    k: "#17121f",
    h: "#7a4128",
    s: "#f3c49d",
    S: "#c98b6c",
    e: "#17121f",
    t: "#5f6f94",
    T: "#46536f",
    b: "#8a5a32",
    p: "#38334a",
    o: "#6a4030",
    // the 2x character's extra detail
    H: "#a35d34",
    w: "#ffffff",
    m: "#a3564a",
    g: "#e8c060",
    L: "#7f90b6",
    O: "#8f5a3f",
    P: "#4b4560",
    // the scarf
    c: "#f53cd1",
    C: "#ff8fe6",
    D: "#a31f8a"
  };
  var DUMMY_PAL = {
    k: "#0e0c14",
    A: "#e4e6ec",
    B: "#b6b9c3",
    C: "#868995",
    D: "#5c5e6a",
    E: "#6e707c",
    F: "#4b4d58",
    G: "#34353f",
    J: "#2a2b33",
    m: "#f53cd1"
  };
  var HERO2 = [
    "...........kkk..........",
    "..........kAABk.........",
    ".........kAAABJk........",
    ".........kABBJJk........",
    ".........kBBBJCDk.......",
    ".........kBCJDDDk.......",
    ".........kkJJJDk........",
    ".......kkkkABBJCkk......",
    "......kAABCJBCCCkDk.....",
    "......kABBCJCCCmDkDk....",
    "......kBBCDDJCDDDkDk....",
    "......kABCDJDDDDDkk.....",
    ".....kAABDkDDDDJkk......",
    ".....kABCDkDDJJGkk......",
    ".....kABCkJJJGGGkk......",
    "....kJJCDkFFFGGGk.......",
    "....kAJJDkJJJGGGk.......",
    "....kJCJJkABBJGGk.......",
    ".....kJCCkBBCDJJJk......",
    ".....kCCCJBBCDJJDk......",
    ".....kCCCDJCCDkJDDk.....",
    "......kCDDJBCDkDDDk.....",
    ".......kDJJJCDkDDDkk....",
    ".......kJBCJCDkDDDkk....",
    ".......kBDJBCDkCDDkk....",
    "........kJJBCDkCDDk.....",
    "........kBBBCDkCCDDk....",
    "........kBBBCDkCCDDk....",
    ".........kBBCDkJDDDk....",
    "........kBJJJJkCJJJk....",
    "........kBBCCDkCCDDk....",
    "........kBBCDDkCDDk.....",
    "........kBBCDkCCDDk.....",
    "........kBCCDkCCDDk.....",
    "........kBCDDkCDDDk.....",
    ".......kJBCJkkkDJkkkk...",
    ".......kAJJAAAAkCCCCCk..",
    "........kkkkkkkkkkkkk..."
  ];
  function maskOf(rows, k = 1) {
    const h = rows.length * k, w = rows[0].length * k, data = new Uint8Array(w * h);
    rows.forEach((r, y) => [...r].forEach((ch, x) => {
      if (ch === ".") return;
      for (let j = 0; j < k * k; j++) data[(y * k + (j / k | 0)) * w + x * k + j % k] = 1;
    }));
    return { w, h, data };
  }
  var MASKS = { 1: maskOf(HERO, 1), 2: maskOf(HERO2, 1) };
  function pixelsOf(rows, pal) {
    const w = rows[0].length, data = new Uint32Array(w * rows.length);
    rows.forEach((r, y) => [...r].forEach((ch, x) => data[y * w + x] = ch === "." ? 0 : hex(pal[ch])));
    return data;
  }
  var PIXELS = { 1: pixelsOf(HERO, HERO_PAL), 2: pixelsOf(HERO2, DUMMY_PAL) };
  function stockActor(k = 1) {
    k = k === 2 ? 2 : 1;
    const m = MASKS[k], x = -Math.floor(m.w / 2), y = -m.h;
    return { mask: m, pixels: PIXELS[k], x, y, w: m.w, h: m.h, k, head: [0, y], chest: [0, k === 2 ? -26 : y + 11], ...k === 2 ? { eyes: [[13, 3], [15, 3]] } : {} };
  }

  // core/fx.js
  function createFrame(w, h, ox = 0, oy = 0) {
    return { w, h, ox, oy, color: new Uint32Array(w * h), light: new Uint32Array(w * h) };
  }
  function clearFrame(f) {
    f.color.fill(0);
    f.light.fill(0);
    return f;
  }
  var painters = /* @__PURE__ */ new WeakMap();
  function painterFor(frame2) {
    let p = painters.get(frame2);
    if (!p) painters.set(frame2, p = new Painter(frame2));
    return p.reset();
  }
  var FADE = 0.3;
  var isRamp = (v) => Array.isArray(v) && v.length > 0 && v.every((c) => typeof c === "number" || /^#[0-9a-f]{3,8}$/i.test(c));
  function resolveOptions(meta22, o = {}) {
    const opts = { ...meta22.options ?? {}, ...o };
    for (const [k, def] of Object.entries(meta22.options ?? {}))
      if (isRamp(def) && isRamp(o[k]) && o[k].length !== def.length) opts[k] = fit(o[k], def.length).map(toHex);
    if (meta22.actor && !opts.actor) opts.actor = stockActor(meta22.actor === 2 ? 2 : 1);
    return opts;
  }
  function createFx(mod, o = {}) {
    const meta22 = mod.meta ?? {};
    const opts = resolveOptions(meta22, o);
    const impl = mod.create ? mod.create(opts) : mod;
    const D3 = meta22.duration ?? 1;
    let t = 0, stopAt = Infinity;
    return {
      meta: meta22,
      options: opts,
      get t() {
        return t;
      },
      update(dt) {
        t += dt;
        if (!impl.update) return;
        const n = Math.max(1, Math.ceil(dt * 120 - 1e-9));
        for (let i = 0; i < n; i++) impl.update(dt / n, opts);
      },
      draw(frame2, layer) {
        const p = painterFor(frame2);
        p.place(opts.x ?? 0, opts.y ?? 0, !!opts.flip, opts.angle ?? 0);
        p.fade = stopAt === Infinity ? 1 : clamp(1 - (t - stopAt) / FADE);
        p.lightK = opts.light ?? 1;
        const tt = meta22.loop ? t % D3 : Math.min(t, D3);
        if (layer !== "front" && impl.drawBack) {
          p.layer = "back";
          impl.drawBack(p, tt, opts);
        }
        if (layer !== "back") {
          p.layer = "front";
          impl.draw(p, tt, opts);
        }
      },
      /** Let it end: loops fade out, one-shots cut short. */
      stop() {
        if (stopAt === Infinity) stopAt = t;
      },
      done() {
        return t - stopAt >= FADE || !meta22.loop && t >= D3;
      }
    };
  }
  function composite(f, out, bg = null, lightK = 1) {
    const n = f.w * f.h, C = f.color, L2 = f.light, flat = typeof bg === "number";
    for (let i = 0; i < n; i++) {
      const c = C[i], l = L2[i] & 16777215;
      let r, g, b, a;
      const ca = c >>> 24;
      if (ca === 255) {
        r = c & 255;
        g = c >>> 8 & 255;
        b = c >>> 16 & 255;
        a = 255;
      } else if (bg === null) {
        r = c & 255;
        g = c >>> 8 & 255;
        b = c >>> 16 & 255;
        a = ca;
      } else {
        const k = flat ? bg : bg[i], f2 = ca / 255;
        r = (c & 255) * f2 + (k & 255) * (1 - f2);
        g = (c >>> 8 & 255) * f2 + (k >>> 8 & 255) * (1 - f2);
        b = (c >>> 16 & 255) * f2 + (k >>> 16 & 255) * (1 - f2);
        a = 255;
      }
      if (l) {
        const lr = (l & 255) * lightK, lg = (l >>> 8 & 255) * lightK, lb = (l >>> 16 & 255) * lightK;
        if (a < 255) {
          const pa = a / 255, pr = r * pa + lr, pg = g * pa + lg, pb = b * pa + lb;
          const na = Math.min(1, Math.max(pa, Math.max(lr, lg, lb) / 255));
          if (na > 0) {
            r = Math.min(255, pr / na);
            g = Math.min(255, pg / na);
            b = Math.min(255, pb / na);
            a = na * 255;
          }
        } else {
          r = Math.min(255, r + lr);
          g = Math.min(255, g + lg);
          b = Math.min(255, b + lb);
        }
      }
      const j = i * 4;
      out[j] = r;
      out[j + 1] = g;
      out[j + 2] = b;
      out[j + 3] = a;
    }
    return out;
  }

  // core/scene.js
  var SKY = hex("#15131d");
  var SKY_TOP = hex("#0d0b14");
  var SKY_LOW = hex("#221d33");
  var FLOOR_EDGE = hex("#4a4263");
  var FLOOR = hex("#2b2639");
  var FLOOR_DARK = hex("#211d2d");
  var MORTAR = hex("#1a1724");

  // core/rig.js
  var PAL2 = Object.fromEntries(Object.entries(DUMMY_PAL).map(([k, v]) => [k, hex(v) >>> 0]));
  var INK2 = PAL2.k;
  var SEAM = PAL2.J;
  var MARK = PAL2.m;
  var SHELL = [PAL2.A, PAL2.B, PAL2.C, PAL2.D];
  var CORE = [PAL2.E, PAL2.F, PAL2.G, PAL2.G];
  var DEG = Math.PI / 180;
  var add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  var sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  var mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  var dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  var cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  var len = (a) => Math.hypot(a[0], a[1], a[2]);
  var unit = (a) => mul(a, 1 / (len(a) || 1e-6));
  var rotY = (t) => {
    const c = Math.cos(t), s = Math.sin(t);
    return [c, 0, s, 0, 1, 0, -s, 0, c];
  };
  var rotZ = (t) => {
    const c = Math.cos(t), s = Math.sin(t);
    return [c, -s, 0, s, c, 0, 0, 0, 1];
  };
  var mm = (A, B2) => {
    const o = new Array(9);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) o[r * 3 + c] = A[r * 3] * B2[c] + A[r * 3 + 1] * B2[3 + c] + A[r * 3 + 2] * B2[6 + c];
    return o;
  };
  var mv = (M2, v) => [M2[0] * v[0] + M2[1] * v[1] + M2[2] * v[2], M2[3] * v[0] + M2[4] * v[1] + M2[5] * v[2], M2[6] * v[0] + M2[7] * v[1] + M2[8] * v[2]];
  var clamp01 = (v) => Math.max(0, Math.min(1, v));
  var M = {
    pelvis: 19.7,
    spine1: 2.8,
    spine2: 4.6,
    shoulderUp: 2.5,
    shoulderOut: 5.9,
    neckUp: 4,
    headUp: 3.1,
    hipDown: 1.1,
    hipOut: 2.8,
    thigh: 8.6,
    shin: 8.3,
    upper: 7.6,
    fore: 7.4,
    turn: 36 * DEG
  };
  var STAND = { lean: 0, crouch: 0, yaw: 0, fx: -3, fy: -15, bx: 5, by: -15, ffx: -2, ffy: -4, fbx: 3, fby: -4 };
  function ik(a, target, L1, L2, pole) {
    let to = sub(target, a), d = len(to);
    const reach = L1 + L2 - 0.02;
    if (d > reach) {
      to = mul(to, reach / d);
      d = reach;
    }
    const u = unit(to), along = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - along * along));
    let v = sub(pole, mul(u, dot(pole, u)));
    v = len(v) < 1e-4 ? unit(cross(u, [0, 0, 1])) : unit(v);
    return { joint: add(a, add(mul(u, along), mul(v, h))), end: add(a, to), u, v };
  }
  function frame(t, R4) {
    return { t, R: R4 };
  }
  function boneFrame(a, b, pole) {
    const x = unit(sub(b, a));
    let y = sub(pole, mul(x, dot(pole, x)));
    y = len(y) < 1e-4 ? unit(cross(x, [0, 0, 1])) : unit(y);
    const z = cross(x, y);
    return frame(a, [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]);
  }
  var weaponOf = (name) => WEAPONS[name];
  function solve(pose) {
    const q = { ...STAND, ...pose }, lean = q.lean, W3 = q.weapon && weaponOf(q.weapon), OW = q.offWeapon && weaponOf(q.offWeapon);
    const sa = q.sa ?? 0, wl = q.wl ?? 1, axisZ = Math.sqrt(Math.max(0, 1 - wl * wl)) * (q.wz ?? 1);
    const axis = [Math.cos(sa) * wl, -Math.sin(sa) * wl, axisZ], side = [-Math.sin(sa), -Math.cos(sa), 0];
    const two = !!(q.two && W3), nearZ = q.fz ?? (two ? 3 : 4.5);
    const fwd = (q.fx - STAND.fx) / 24, farFwd = two ? 0 : (q.bx - STAND.bx) / 22;
    let turn = M.turn + (fwd >= 0 ? -44 * DEG * Math.min(1, fwd) : 28 * DEG * Math.min(1, -fwd * 1.8));
    turn += (farFwd > 0 ? 34 * DEG * Math.min(1, farFwd) : 0) + (q.twist ?? 0) * 4 * DEG;
    if (q.turn !== void 0) turn = q.turn;
    const hipTurn = M.turn + (turn - M.turn) * 0.45, tilt = Math.atan2(lean, 13);
    const Rp = mm(rotZ(-tilt * 0.25), rotY(-hipTurn)), Rc = mm(rotZ(-tilt), rotY(-turn));
    const ankleN = [q.ffx, -q.ffy - 1.8, q.fzz ?? 2.4], ankleF = [q.fbx, -q.fby - 1.8, q.bzz ?? -2.4];
    let pelvis = [lean * 0.2, M.pelvis - q.crouch, 0];
    const hipAt = (s) => add(pelvis, mv(Rp, [0, -M.hipDown, s * M.hipOut]));
    const maxLeg = (M.thigh + M.shin) * 0.995;
    for (const [s, a] of [[1, ankleN], [-1, ankleF]]) {
      const h = hipAt(s), dx = h[0] - a[0], dz = h[2] - a[2], flat = dx * dx + dz * dz;
      if (flat < maxLeg * maxLeg) {
        const top = a[1] + Math.sqrt(maxLeg * maxLeg - flat);
        if (h[1] > top) pelvis = [pelvis[0], pelvis[1] - (h[1] - top), pelvis[2]];
      }
    }
    const waist = add(pelvis, [Math.sin(tilt * 0.45) * M.spine1, Math.cos(tilt * 0.45) * M.spine1, 0]);
    const chest = add(waist, [Math.sin(tilt) * M.spine2, Math.cos(tilt) * M.spine2, 0]);
    const neck = add(chest, mv(Rc, [0, M.neckUp, 0]));
    const headTurn = M.turn * 0.9 + (turn - M.turn) * 0.35, nod = tilt * 0.35 + (q.hy ?? 0) * 7 * DEG, roll = (q.hx ?? 0) * 7 * DEG;
    const Rh = mm(rotZ(-nod - roll), rotY(-headTurn));
    const head = add(neck, mv(Rh, [0.15, M.headUp, 0]));
    const pick = (s, target) => {
      const base = add(chest, mv(Rc, [0, M.shoulderUp, s * M.shoulderOut])), to = sub(target, base), d = len(to);
      return add(base, mul(unit(to), Math.min(1.8, Math.max(0, d - 11) * 0.35)));
    };
    const nearT = [q.fx, -q.fy, nearZ];
    const farT = two ? [q.fx + axis[0] * W3.two, -q.fy + axis[1] * W3.two, nearZ + axis[2] * W3.two] : [q.bx, -q.by, q.bz ?? (q.armsFront ? 5.5 : -4.5)];
    const sN = pick(1, nearT), sF = pick(-1, farT);
    const pole = (s, T2, shoulder, hold) => {
      const up = clamp01((T2[1] - shoulder[1] + 2) / 10);
      const base = [-0.55 + up * 1.1, -1 + up * 0.9, s * (0.45 + up * 0.5)];
      if (!hold) return base;
      const u = unit(sub(T2, shoulder));
      let best = base, score = Infinity;
      for (let i = 0; i < 16; i++) {
        const a = i / 16 * Math.PI * 2, x = unit(cross(u, [0.3, 1, 0.2])), y = cross(u, x), v = add(mul(x, Math.cos(a)), mul(y, Math.sin(a)));
        const A = ik(shoulder, T2, M.upper, M.fore, v), f = unit(sub(A.end, A.joint));
        const cost = Math.abs(dot(f, hold)) * 0.7 + (1 - dot(unit(base), v)) * 0.55;
        if (cost < score) {
          score = cost;
          best = v;
        }
      }
      return best;
    };
    const holdN = W3 ? W3.across ? side : axis : null, holdF = two ? W3.across ? side : axis : OW ? [Math.cos(q.sb ?? Math.PI), -Math.sin(q.sb ?? Math.PI), 0] : null;
    const armN = ik(sN, nearT, M.upper, M.fore, pole(1, nearT, sN, holdN)), armF = ik(sF, farT, M.upper, M.fore, pole(-1, farT, sF, holdF));
    const kneePole = (s) => mv(Rp, [1, 0, s * 0.35]);
    const hipN = hipAt(1), hipF = hipAt(-1);
    const legN = ik(hipN, ankleN, M.thigh, M.shin, kneePole(1)), legF = ik(hipF, ankleF, M.thigh, M.shin, kneePole(-1));
    const footDir = (s) => {
      const t = hipTurn * 0.6 + s * 8 * DEG;
      return [Math.cos(t), 0, Math.sin(t)];
    };
    const B2 = {
      pelvis: frame(pelvis, Rp),
      waist: frame(waist, mm(rotZ(-tilt * 0.6), rotY(-(turn + hipTurn) / 2))),
      chest: frame(chest, Rc),
      head: frame(head, Rh),
      neck: frame(neck, Rh),
      upperN: boneFrame(sN, armN.joint, armN.v),
      foreN: boneFrame(armN.joint, armN.end, armN.v),
      upperF: boneFrame(sF, armF.joint, armF.v),
      foreF: boneFrame(armF.joint, armF.end, armF.v),
      thighN: boneFrame(hipN, legN.joint, legN.v),
      shinN: boneFrame(legN.joint, legN.end, legN.v),
      thighF: boneFrame(hipF, legF.joint, legF.v),
      shinF: boneFrame(legF.joint, legF.end, legF.v)
    };
    B2.footN = frame(legN.end, mm(rotY(-Math.atan2(footDir(1)[2], footDir(1)[0])), rotZ(q.toeF ? -55 * DEG : 0)));
    B2.footF = frame(legF.end, mm(rotY(-Math.atan2(footDir(-1)[2], footDir(-1)[0])), rotZ(q.toeB ? -55 * DEG : 0)));
    return { B: B2, W: W3, OW, q, axis, side, armN, armF, legN, legF, sN, sF, hipN, hipF, turn };
  }
  var BW = 300;
  var BH = 240;
  var OX = 150;
  var OY = 180;
  var Zb = new Float32Array(BW * BH);
  var Tone = new Float32Array(BW * BH);
  var Part = new Int8Array(BW * BH);
  var Mat = new Int8Array(BW * BH);
  var Fr = new Int8Array(BW * BH);
  var LX = new Float32Array(BW * BH);
  var LY = new Float32Array(BW * BH);
  var Col = new Uint32Array(BW * BH);
  var touched = [];
  var LIGHT = unit([-0.55, 0.72, 0.5]);
  var curFrameIndex = 0;
  var onlyPart = 0;
  function plot(i, z, tone, part, mat, wx, wy, color) {
    if (onlyPart && part !== onlyPart) return;
    if (Part[i] === 0) touched.push(i);
    else if (z <= Zb[i]) return;
    Zb[i] = z;
    Tone[i] = tone;
    Part[i] = part;
    Mat[i] = mat;
    Fr[i] = curFrameIndex;
    LX[i] = wx;
    LY[i] = wy;
    Col[i] = color;
  }
  var PART = { pelvis: 1, waist: 2, chest: 3, neck: 4, head: 5, face: 6, upperN: 7, elbowN: 8, foreN: 9, handN: 10, upperF: 11, elbowF: 12, foreF: 13, handF: 14, thighN: 15, kneeN: 16, shinN: 17, footN: 18, thighF: 19, kneeF: 20, shinF: 21, footF: 22, weapon: 23, offWeapon: 24 };
  var STEEL = Object.fromEntries(Object.entries({ hi: "#ffffff", a: "#e8edf6", b: "#a4afc6", d: "#68748f", gold: "#ffd84a", goldD: "#b8862a", grip: "#7a3a2a", gripD: "#4a2018", wood: "#8a5a32", woodD: "#5a3820", dark: "#3a3448", darkD: "#262033", olive: "#58663f", oliveA: "#7d8c58", oliveD: "#3a4529" }).map(([k, v]) => [k, hex(v) >>> 0]));
  function blade(T2, from, length, w) {
    for (let i = from; i <= from + length + 0.01; i += 0.4) {
      const r = i - from, wd = r > length - 5 ? Math.max(0, (length - r) / 5 * w) : w;
      for (let k = -wd; k <= wd + 0.01; k += 0.4) T2(i, k, k < -w * 0.4 ? STEEL.hi : k > w * 0.4 ? STEEL.d : STEEL.a);
    }
  }
  var haft = (T2, from, to, a, d, r = 0.8) => {
    for (let i = from; i <= to; i += 0.4) for (let k = -r; k <= r + 0.01; k += 0.4) T2(i, k, k > 0.1 ? d : a);
  };
  var WEAPONS = {
    // the fist is at i = 0; `two` is where the other hand goes; `across`: the handle lies across the weapon's length
    sword: { two: -4.4, draw(T2, q) {
      const end = q.two ? -6.5 : -2.6;
      haft(T2, end, 2.2, STEEL.grip, STEEL.gripD);
      for (let k = -1.4; k <= 1.4; k += 0.4) T2(end - 0.4, k, STEEL.gold);
      for (let k = -4.6; k <= 4.6; k += 0.4) T2(2.6, k, Math.abs(k) > 3.8 ? STEEL.goldD : STEEL.gold), T2(3, k, STEEL.goldD);
      blade(T2, 3.2, 25, 2.2);
    } },
    greatsword: { two: -4.8, draw(T2) {
      haft(T2, -7.2, 2.2, STEEL.grip, STEEL.gripD);
      for (let k = -1.8; k <= 1.8; k += 0.4) T2(-7.6, k, STEEL.gold);
      for (let k = -6.6; k <= 6.6; k += 0.4) T2(2.6, k, Math.abs(k) > 5.6 ? STEEL.goldD : STEEL.gold), T2(3, k, STEEL.goldD);
      blade(T2, 3.2, 31, 3);
      for (let i = 4; i <= 28; i += 0.4) T2(i, 0, STEEL.b);
    } },
    dagger: { draw(T2) {
      haft(T2, -2.4, 1.8, STEEL.grip, STEEL.gripD);
      for (let k = -2.6; k <= 2.6; k += 0.4) T2(2.2, k, STEEL.goldD);
      blade(T2, 2.6, 10, 1.3);
    } },
    spear: { two: -12, draw(T2) {
      haft(T2, -18, 36, STEEL.wood, STEEL.woodD, 0.5);
      blade(T2, 36, 11, 2);
      for (let k = -2.4; k <= 2.4; k += 0.4) T2(36, k, STEEL.goldD);
    } },
    hammer: { two: -7, draw(T2) {
      for (const lift of [-0.8, 0, 0.8]) for (let i = -10; i <= 18; i += 0.4) for (let k = -0.8; k <= 0.81; k += 0.4) T2(i, k, k > 0.1 ? STEEL.woodD : STEEL.wood, lift);
      for (let i = 18; i <= 28; i += 0.4) for (let k = -9; k <= 9; k += 0.4) {
        const face = Math.abs(k) > 7.4 ? k < 0 ? STEEL.a : STEEL.d : i < 20 ? STEEL.hi : i > 26.4 ? STEEL.d : Math.abs(k) < 2 ? STEEL.gold : STEEL.b;
        T2(i, k, face, 4.5);
        T2(i, k, face, -4.5);
        if (i < 18.4 || i > 27.6 || Math.abs(k) > 8.6) for (let l = -4; l <= 4; l += 0.4) T2(i, k, k < 0 ? STEEL.a : i > 27.6 ? STEEL.d : STEEL.b, l);
      }
    } },
    scythe: { two: -11, draw(T2) {
      haft(T2, -16, 31, STEEL.dark, STEEL.darkD, 0.5);
      for (let j = 0; j <= 28; j += 0.4) {
        const u = j / 28, w = 3.2 * (1 - u) + 0.3, b = 31.5 - u * u * 12;
        for (let k = -w; k <= w; k += 0.4) T2(b + k, j + 0.8, k > w * 0.3 ? STEEL.hi : k < -w * 0.4 ? STEEL.d : STEEL.b);
      }
    } },
    claw: { draw(T2) {
      for (const q0 of [-2.4, 0, 2.4])
        for (let i = 2; i <= 9.5; i += 0.4) {
          const u = (i - 2) / 7.5, k = q0 + u * u * 1.8;
          T2(i, k, u > 0.55 ? STEEL.hi : STEEL.a);
          if (u < 0.6) T2(i, k + 0.8, STEEL.d);
        }
    } },
    bow: { across: true, draw(T2, q, off) {
      for (let u = -1; u <= 1.001; u += 0.025) {
        const k = u * 17, i = 6 * (1 - u * u) - 1;
        T2(i, k, Math.abs(u) > 0.85 ? STEEL.goldD : STEEL.wood);
        T2(i + 0.8, k, STEEL.woodD);
      }
      const tipA = T2.at(-1, -17), tipB = T2.at(-1, 17), mid = q.pull ? off : T2.at(-1, 0);
      const line = (A, B2, c) => {
        const n = Math.max(2, Math.ceil(len(sub(B2, A)) / 0.4)), Z = STEEL.a;
        for (let k = 0; k <= n; k++) {
          const P2 = add(A, mul(sub(B2, A), k / n)), wx = Math.round(P2[0]), wy = Math.round(P2[1]), idx = (OY - wy) * BW + (OX + wx);
          curFrameIndex = -1;
          plot(idx, P2[2] + 0.05, 2, PART.weapon, 2, wx, wy, c ?? Z);
        }
      };
      line(tipA, mid);
      line(tipB, mid);
      if (q.nocked) {
        const nock = mid, tip = T2.at(13, 0);
        line(nock, tip, STEEL.wood);
        for (let i = 9; i <= 13; i += 0.4) for (let k = -(13 - i) * 0.45; k <= (13 - i) * 0.45; k += 0.4) T2(i, k, STEEL.hi);
      }
    } },
    pistol: { across: true, draw(T2) {
      for (let i = -1; i <= 9.5; i += 0.4) for (let k = -4.2; k <= -2.4; k += 0.4) T2(i, k, k < -3.6 ? STEEL.a : k > -2.9 ? STEEL.d : STEEL.b);
      for (let i = -1.2; i <= 1.2; i += 0.4) for (let k = -2.4; k <= 2.4; k += 0.4) T2(i, k, STEEL.gripD);
      T2(9, -4.6, STEEL.hi);
    } },
    launcher: { two: -9, draw(T2) {
      for (let i = -14; i <= 22; i += 0.4) for (let k = -6; k <= -1; k += 0.4) T2(i, k, k < -4.8 ? STEEL.oliveA : k > -2.2 ? STEEL.oliveD : Math.abs(i - 3) < 1.4 ? STEEL.gold : STEEL.olive);
      for (let k = -6.8; k <= -0.2; k += 0.4) T2(22.4, k, STEEL.b), T2(-14.4, k, STEEL.d);
    } },
    handle: { draw(T2) {
      haft(T2, -2.6, 6, STEEL.grip, STEEL.gripD);
      for (let k = -1.6; k <= 1.6; k += 0.4) T2(-3, k, STEEL.gold), T2(6.4, k, STEEL.gold);
    } }
  };
  var REST_FRAMES = null;
  REST_FRAMES = solve({}).B;

  // core/act.js
  var TW = 38;
  var TH = 52;
  var TP = Object.fromEntries(Object.entries({ ink: "#0b0a1a", wood: "#724c2e", woodL: "#a0703a", woodD: "#4e331f", straw: "#d2aa55", strawL: "#f0d98a", burlapD: "#86643a", burlap: "#b38b57", burlapL: "#c9a26c", red: "#9a2f3c", redL: "#c4434f", white: "#ffffff" }).map(([k, v]) => [k, hex(v)]));
  var DUST = ["#efe7dc", "#c9bfb8", "#8f8693", "#5a5468"].map(hex);
  var DUMMY = new Uint32Array(TW * TH);
  (function buildDummy() {
    const px = (x, y, c) => {
      if (x >= 0 && y >= 0 && x < TW && y < TH) DUMMY[y * TW + x] = c;
    };
    const R4 = (x, y, w, h, c) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px(x + i, y + j, c);
    };
    R4(15, 38, 8, 14, TP.ink);
    R4(16, 34, 6, 18, TP.wood);
    R4(16, 34, 2, 18, TP.woodL);
    R4(20, 34, 2, 18, TP.woodD);
    R4(1, 18, 36, 1, TP.ink);
    R4(1, 23, 36, 1, TP.ink);
    R4(1, 19, 36, 4, TP.wood);
    R4(1, 19, 36, 1, TP.woodL);
    R4(1, 22, 36, 1, TP.woodD);
    for (const [bx, s] of [[0, -1], [33, 1]]) {
      R4(bx, 17, 5, 8, TP.straw);
      for (const [dx, dy, c] of [[2, 16, TP.straw], [3, 15, TP.strawL], [1, 17, TP.strawL], [2, 25, TP.straw], [1, 26, TP.strawL], [3, 25, TP.burlapD], [2, 19, TP.strawL], [3, 21, TP.strawL], [1, 22, TP.burlapD], [2, 23, TP.strawL]]) px(bx + dx, dy, c);
      px(s < 0 ? bx - 1 : bx + 5, 19, TP.straw);
      px(s < 0 ? bx - 1 : bx + 5, 22, TP.strawL);
    }
    const sack = (x, y, w, h) => {
      R4(x + 1, y, w - 2, 1, TP.ink);
      R4(x + 1, y + h - 1, w - 2, 1, TP.ink);
      R4(x, y + 1, 1, h - 2, TP.ink);
      R4(x + w - 1, y + 1, 1, h - 2, TP.ink);
      R4(x + 1, y + 1, w - 2, h - 2, TP.burlap);
      R4(x + w - 4, y + 1, 3, h - 2, TP.burlapD);
      R4(x + 1, y + h - 3, w - 2, 2, TP.burlapD);
      R4(x + 1, y + 1, 1, h - 4, TP.burlapL);
      R4(x + 1, y + 1, w - 6, 1, TP.burlapL);
      for (let j = y + 2; j < y + h - 2; j += 3) for (let i = x + 3 + j % 2; i < x + w - 4; i += 4) px(i, j, TP.burlapD);
    };
    sack(9, 17, 20, 24);
    for (let y = 19; y < 36; y++) for (let x = 11; x < 27; x++) {
      const d = Math.hypot(x - 18.5, y - 27);
      if (d > 4 && d < 5.4 || d < 1.9) px(x, y, x + y < 45 ? TP.redL : TP.red);
    }
    for (let x = 10; x < 28; x++) {
      px(x, 36, x & 1 ? TP.woodL : TP.straw);
      px(x, 37, x & 1 ? TP.woodD : TP.wood);
    }
    for (const [x, y, c] of [[11, 41, TP.straw], [12, 42, TP.strawL], [14, 41, TP.strawL], [15, 42, TP.straw], [23, 41, TP.straw], [24, 42, TP.strawL], [26, 41, TP.straw], [13, 43, TP.straw], [25, 43, TP.straw]]) px(x, y, c);
    sack(10, 1, 18, 16);
    for (const ex of [14, 23]) for (let d = -2; d <= 2; d++) {
      px(ex + d, 7 + d, TP.ink);
      px(ex - d, 7 + d, TP.ink);
    }
    for (let x = 14; x < 24; x++) px(x, 12, x & 1 ? TP.ink : TP.burlapD);
    for (const x of [15, 18, 21]) {
      px(x, 11, TP.ink);
      px(x, 13, TP.ink);
    }
    for (let x = 12; x < 26; x++) {
      px(x, 16, x & 1 ? TP.woodL : TP.straw);
      px(x, 17, x & 1 ? TP.wood : TP.woodD);
    }
    for (const [x, y, c] of [[13, 0, TP.straw], [15, 0, TP.strawL], [18, 0, TP.straw], [21, 0, TP.strawL], [24, 0, TP.straw], [9, 4, TP.straw], [28, 6, TP.straw], [8, 7, TP.strawL], [29, 3, TP.strawL]]) px(x, y, c);
  })();
  var SKINS = { flash: [TP.white, 1], char: [hex("#1a0c0e"), 0.72], ice: [hex("#a8e8ff"), 0.72], shadow: [hex("#3a1a70"), 0.5], holy: [hex("#fff4c0"), 0.5], red: [hex("#ff2040"), 0.45], shock: [hex("#8fd6ff"), 0.6], poison: [hex("#58c43a"), 0.5] };
  var STRAW = [TP.strawL, TP.straw, TP.straw, TP.burlapD, TP.burlapD];
  var REST_MASK = new Uint8Array(24 * 38);
  var REST_PX = new Uint32Array(24 * 38);
  HERO2.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch !== ".") {
      REST_MASK[r * 24 + c] = 1;
      REST_PX[r * 24 + c] = hex(DUMMY_PAL[ch]);
    }
  }));
  var NEAREST = new Int16Array(24 * 38).fill(-1);
  for (let r = 0; r < 38; r++)
    for (let c = 0; c < 24; c++) {
      let best = -1, bd = 1e9;
      for (let y = Math.max(0, r - 7); y < Math.min(38, r + 8); y++)
        for (let x = Math.max(0, c - 7); x < Math.min(24, c + 8); x++) {
          const d = (x - c) * (x - c) + (y - r) * (y - r);
          if (REST_MASK[y * 24 + x] && d < bd) {
            bd = d;
            best = y * 24 + x;
          }
        }
      NEAREST[r * 24 + c] = best;
    }

  // core/poses.js
  var READY = { crouch: 3, fx: 11, fy: -21, bx: 9, by: -21, ffx: 7, fbx: -7 };

  // fx/ice/frost-nova.js
  var frost_nova_exports = {};
  __export(frost_nova_exports, {
    act: () => act,
    create: () => create,
    meta: () => meta
  });
  var meta = {
    name: "Frost nova",
    desc: "Frost spirals into a spinning snowflake, then a wave blooms three rings of ice crystals round the caster; snow drifts, frost creeps, and the ice melts back into the floor.",
    tags: ["ice", "nova", "aoe", "frost", "magic", "one-shot"],
    size: [288, 192],
    origin: [144, 150],
    duration: 3.4,
    loop: false,
    fps: 30,
    bg: "ground",
    actor: 2,
    options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], reach: 104, seed: 4 }
  };
  var HIGH = { turn: 1.15, crouch: 0, fx: -7, fy: -44, bx: 8, by: -44, ffx: -5, fbx: 6 };
  var SLAM = { turn: 1.15, crouch: 8, lean: 3, fx: -9, fy: -8, bx: 11, by: -8, ffx: -8, fbx: 9 };
  var EASE = { turn: 1, crouch: 2, fx: -8, fy: -17, bx: 9, by: -17, ffx: -4, fbx: 5 };
  var act = {
    target: { x: 76 },
    poses: [
      [-0.34, READY],
      [-0.04, { ...HIGH, crouch: 2, fy: -36, by: -36 }],
      [0.36, HIGH],
      [0.42, SLAM, "snap"],
      [0.9, { ...SLAM, crouch: 7 }],
      [1.9, { ...SLAM, crouch: 6 }],
      [2.6, EASE],
      [3.4, READY]
    ],
    hits: [
      { t: 0.42, stop: 0.1, shake: 0.26, amp: 2, target: false },
      { t: 0.66, push: 0.9, straw: 6, y: -10, skin: "ice", shiver: 1.7 },
      { t: 2.9, push: 0.2, straw: 0, flash: 0, skin: null }
    ],
    dust: [{ t: 0.42, x: 10, n: 5, dir: 1, c: "#d8f2ff" }, { t: 0.42, x: -10, n: 5, dir: -1, c: "#d8f2ff" }]
  };
  var CHARGE = 0.42;
  var SPREAD = 0.62;
  var HOLD = 1.95;
  var MELT = 0.7;
  var CORE_Y = -24;
  var RINGS = [
    { q: [0.15, 0.24], h: [24, 32], w: [10, 13], n: 2, kids: 2 },
    { q: [0.36, 0.52], h: [13, 19], w: [7, 9], n: 3, kids: 1 },
    { q: [0.62, 0.9], h: [5, 10], w: [4, 6], n: 4, kids: 0 }
  ];
  function frost(p, C, x0, x1, reach, a, edge) {
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      const d = Math.abs(x + 0.5), q = d / reach, k = clamp((a * 1.15 - q) / 0.15);
      if (k <= 0) continue;
      const h = rand(x, 17), fresh = edge > 0 && d > edge - 3, tuft = h < 0.45 ? Math.round((1 + rand(x, 5) * 3) * (1 - q * 0.6)) : 0, D3 = (4 + rand(x, 11) * 4) * (1 - q * 0.5);
      p.dot(x, 0, fresh || h < 0.25 ? WHITE : C[6], k);
      for (let j = 1; j <= tuft; j++) p.dot(x, -j, j === tuft ? WHITE : C[5], k);
      if (tuft > 1 && rand(x, 9) < 0.5) p.dot(x + (rand(x, 3) < 0.5 ? -1 : 1), -tuft + 1, C[6], k);
      for (let j = 1; j <= D3; j++) {
        const v = j / D3;
        p.dot(x, j, rand(x * 31 + j, 7) < 0.06 ? WHITE : v < 0.25 ? C[6] : v < 0.55 ? C[5] : C[4], k * (1.1 - v) * (fresh ? 1.3 : 1));
      }
    }
  }
  function snowflake(p, C, x, y, L2, spin, k) {
    if (L2 < 0.8) return;
    for (let i = 0; i < 6; i++) {
      const a = spin + i * TAU / 6, ca = Math.cos(a), sa = Math.sin(a);
      for (let d = 0; d <= L2; d += 0.5) p.dot(x + ca * d, y + sa * d, d < L2 * 0.4 ? WHITE : C[6], k + 0.2);
      if (L2 > 3)
        for (const s of [-1, 1]) {
          const bx = x + ca * L2 * 0.6, by = y + sa * L2 * 0.6, ba = a + s * 0.9;
          for (let d = 0; d <= L2 * 0.35; d += 0.5) p.dot(bx + Math.cos(ba) * d, by + Math.sin(ba) * d, C[5], k);
        }
    }
    p.px(x, y, WHITE);
    p.glow(x, y, 10 + L2 * 3, C[5], 0.35 + 0.5 * k);
  }
  function create(o) {
    const C = fit(o.palette, 8), DIM = [C[0], C[0], C[1], C[2], C[3], C[4], C[5], C[6]], REACH2 = o.reach;
    const R4 = new Rng(o.seed), floor = () => 0;
    const ps = new Particles({ rng: R4, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
    const bits = new Bits({ ground: floor }), lights = new Lights();
    const front = (t2) => t2 < CHARGE ? 0 : REACH2 * (1 - Math.pow(1 - clamp((t2 - CHARGE) / SPREAD), 3));
    const reachedAt = (d) => CHARGE + SPREAD * (1 - Math.cbrt(1 - Math.min(1, d / REACH2)));
    const sites = [];
    for (const side of [-1, 1])
      RINGS.forEach((ring2, ri) => {
        for (let i = 0; i < ring2.n; i++) {
          const q = ring2.q[0] + (ring2.q[1] - ring2.q[0]) * (i + R4.range(0.2, 0.8)) / ring2.n, h = R4.range(...ring2.h), w = R4.range(...ring2.w);
          const parts = [{ dx: 0, h, w, lean: side * h * R4.range(0.1, 0.28) }];
          for (let k = 0; k < ring2.kids; k++) {
            const s = k % 2 ? -side : side, kh = h * R4.range(0.4, 0.62);
            parts.unshift({ dx: s * R4.range(0.3, 0.5) * w, h: kh, w: w * 0.62, lean: s * kh * R4.range(0.35, 0.6) });
          }
          sites.push({ x: side * q * REACH2, d: q * REACH2, h, back: (i + ri + (side > 0 ? 1 : 0)) % 2 === 1, t0: reachedAt(q * REACH2) + R4.range(0, 0.03), up: false, parts, phase: R4.next() });
        }
      });
    let t = 0, released = false;
    const sink = (tt) => smooth(HOLD, HOLD + MELT, tt);
    const drawCrystals = (p, back) => {
      const m = sink(t);
      for (const s of sites) {
        if (!s.up || s.back !== back || m >= 1) continue;
        const g = ease.outBack(clamp((t - s.t0) / 0.1), 2.6), white = t < s.t0 + 0.03, sw = ((t - s.t0) * 0.7 + s.phase * 3) % 1.6 / 0.5;
        for (const q of s.parts)
          crystal(p, s.x + q.dx, back ? -1 : 0, q.h * g * (1 - m), q.w * (1 - m * 0.3), q.lean * g * (1 - m), back ? DIM : C, { white, glint: sw <= 1 ? sw : -1 });
      }
    };
    const ring = (p, back) => {
      if (t < CHARGE) return;
      const u = clamp((t - CHARGE) / (SPREAD + 0.15));
      if (u >= 1) return;
      band(p, 0, 0, front(t) + 2, 0.16, Math.max(2, 10 * Math.pow(1 - u, 0.7)), u < 0.75 ? 1 : (1 - u) / 0.25, C, (g) => Math.sin(g) < 0 === back, t - CHARGE < 0.1);
      if (!back) for (const s of [-1, 1]) p.glow(s * (front(t) + 2), -2, 22, C[5], 0.55 * (1 - u));
    };
    return {
      update(dt) {
        t += dt;
        if (t < CHARGE - 0.06) {
          if (R4.chance(0.9)) {
            const a = R4.range(0, TAU), D3 = R4.range(26, 58), T2 = R4.range(0.2, 0.3), v = D3 * 3 / (Math.exp(3 * T2) - 1);
            const x = Math.cos(a) * D3, y = Math.min(CORE_Y + Math.sin(a) * D3 * 0.8, -2), l = Math.hypot(x, y - CORE_Y) || 1;
            ps.spawn(P.STREAK, x, y, -x / l * v, (CORE_Y - y) / l * v, T2, R4.chance(0.5) ? C[6] : C[5]);
          }
          if (R4.chance(0.14)) {
            const s = R4.sign();
            ps.spawn(P.VAPOUR, s * R4.range(28, 60), -R4.range(0, 2), -s * R4.range(35, 70), -R4.range(0, 3), R4.range(0.35, 0.5), C[6], R4.range(2, 3));
          }
        }
        if (t >= CHARGE && !released) {
          released = true;
          lights.add(0, CORE_Y, 84, C[4], 0.8, 0.55);
          lights.add(0, CORE_Y, 45, WHITE, 0.7, 0.12);
          for (let i = 0; i < 22; i++) {
            const a = R4.range(-Math.PI, 0.25), sp = R4.range(110, 280);
            bits.add({ kind: B.SHARD, x: R4.range(-3, 3), y: CORE_Y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.7, drag: 0.6, bounce: 0.3, life: R4.range(0.9, 1.5), a: R4.range(0, TAU), va: R4.range(-20, 20), s: R4.range(1.5, 3.5), c: R4.pick([C[7], C[6], C[5]]) });
          }
          for (let i = 0; i < 14; i++) {
            const a = R4.range(-Math.PI, 0), sp = R4.range(40, 160);
            ps.spawn(P.FLAKE, 0, CORE_Y, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1.2, 1.8), R4.chance(0.6) ? WHITE : C[6], R4.range(0.5, 1.6));
          }
        }
        const fr = front(t);
        if (t > CHARGE && t < CHARGE + SPREAD)
          for (const s of [-1, 1]) {
            ps.spawn(P.VAPOUR, s * fr + R4.range(-2, 2), -R4.range(0, 5), s * R4.range(15, 75), -R4.range(2, 15), R4.range(0.6, 1), R4.chance(0.7) ? C[6] : C[5], R4.range(3, 5.5) * (1 - 0.4 * (fr / REACH2)));
            if (R4.chance(0.45)) ps.spawn(P.FLAKE, s * fr, -2, s * R4.range(10, 45), -R4.range(30, 85), R4.range(1.1, 1.9), R4.chance(0.5) ? WHITE : C[6], R4.range(0.5, 1.2));
          }
        for (const s of sites) {
          if (!s.up && t >= s.t0) {
            s.up = true;
            for (let i = 0; i < 2 + Math.round(s.h / 8); i++) {
              const a = -Math.PI / 2 + R4.range(-1.3, 1.3), sp = R4.range(60, 200) * (0.5 + s.h / 40);
              bits.add({ kind: B.SHARD, x: s.x + R4.range(-3, 3), y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 0.8, drag: 0.6, bounce: 0.3, life: R4.range(0.9, 1.6), a: R4.range(0, TAU), va: R4.range(-18, 18), s: R4.range(1.5, 3), c: R4.pick([C[7], C[6], C[5]]) });
            }
            ps.spawn(P.VAPOUR, s.x, -1, R4.range(-30, 30), -R4.range(2, 8), R4.range(0.5, 0.9), C[6], R4.range(2.5, 4));
            if (s.h > 10) ps.spawn(P.STAR, s.x + R4.range(-3, 3), -R4.range(4, s.h * 0.8), 0, -3, R4.range(0.3, 0.6), C[6], R4.range(1, 2.4));
          }
        }
        if (t > CHARGE + 0.2 && t < HOLD + 0.2) {
          if (R4.chance(0.5)) {
            const s = R4.pick(sites);
            if (s.up) ps.spawn(P.STAR, s.x + R4.range(-3, 3), -R4.range(2, s.h * 0.9), 0, -3, R4.range(0.3, 0.6), R4.chance(0.6) ? C[6] : WHITE, R4.range(0.6, 2.2));
          }
          if (t < HOLD - 0.3 && R4.chance(0.16)) ps.spawn(P.FLAKE, R4.range(-1, 1) * fr, -R4.range(40, 90), R4.range(-5, 5), R4.range(3, 10), R4.range(1.1, 1.5), R4.chance(0.5) ? WHITE : C[6], R4.range(0.5, 1.4));
        }
        if (t > HOLD && t < HOLD + MELT) {
          if (R4.chance(0.5)) {
            const s = R4.pick(sites);
            bits.add({ kind: B.DRIP, x: s.x + R4.range(-3, 3), y: -R4.range(3, s.h * 0.6 * (1 - sink(t))), vy: 10, g: 0.6, life: 1, c: C[5] });
          }
          if (R4.chance(0.25)) ps.spawn(P.VAPOUR, R4.range(-1, 1) * REACH2 * 0.8, -R4.range(0, 3), R4.range(-10, 10), -R4.range(6, 16), R4.range(0.6, 1), C[5], R4.range(3, 5));
        }
        ps.update(dt);
        bits.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        const out = 1 - smooth(HOLD + 0.2, HOLD + MELT + 0.6, t), fr = front(t);
        if (out > 0 && t > CHARGE) frost(p, C, -Math.max(12, fr + 1), Math.max(12, fr + 1), REACH2, out, fr);
        ring(p, true);
        drawCrystals(p, true);
        ps.draw(p, "back");
      },
      draw(p) {
        ring(p, false);
        drawCrystals(p, false);
        if (t < CHARGE) {
          const k = t / CHARGE, beat2 = 1 + 0.25 * Math.exp(-((t - CHARGE * 0.55) ** 2) / 2e-3) + 0.3 * Math.exp(-((t - CHARGE * 0.85) ** 2) / 2e-3);
          snowflake(p, C, 0, CORE_Y, (2 + 5.5 * k * k) * beat2, t * 4, k);
        } else if (t < CHARGE + 0.22) {
          const a = (t - CHARGE) / 0.22;
          flare(p, 0, CORE_Y, 36 * Math.pow(1 - a, 1.5), 1 - a, C);
          p.glow(0, CORE_Y, 46, WHITE, 0.6 * (1 - a));
        }
        if (t > CHARGE) {
          const k = (1 - smooth(HOLD, HOLD + MELT + 0.3, t)) * (0.85 + 0.15 * Math.sin(t * 2.4)), fr = front(t);
          for (let i = -3; i <= 3; i++) p.glow(i / 3.5 * fr, -4, 26, C[4], 0.16 * k);
        }
        bits.draw(p);
        ps.draw(p, "front");
        lights.draw(p);
      }
    };
  }

  // fx/ice/snowflake-burst.js
  var snowflake_burst_exports = {};
  __export(snowflake_burst_exports, {
    create: () => create2,
    meta: () => meta2
  });

  // fx/ice/_lib.js
  function inPoly(pts, x, y) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function centroid(pts) {
    let a = 0, cx = 0, cy = 0;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [x0, y0] = pts[j], [x1, y1] = pts[i], k = x0 * y1 - x1 * y0;
      a += k;
      cx += (x0 + x1) * k;
      cy += (y0 + y1) * k;
    }
    if (Math.abs(a) < 1e-6) {
      const n = pts.length;
      return { x: pts.reduce((s, q) => s + q[0], 0) / n, y: pts.reduce((s, q) => s + q[1], 0) / n, area: 0 };
    }
    return { x: cx / (3 * a), y: cy / (3 * a), area: Math.abs(a) / 2 };
  }
  function splitPoly(pts, x, y, a) {
    const nx = -Math.sin(a), ny = Math.cos(a), side = (q) => (q[0] - x) * nx + (q[1] - y) * ny, L2 = [], Rt = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length], sp = side(p), sq = side(q);
      (sp >= 0 ? L2 : Rt).push(p);
      if (sp >= 0 !== sq >= 0) {
        const u = sp / (sp - sq), m = [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
        L2.push(m);
        Rt.push(m);
      }
    }
    return [L2, Rt].filter((s) => s.length >= 3);
  }
  function iceOf(c, C) {
    const n = C.length, l = luma(c);
    return C[clamp(Math.round((l < 0.12 ? 2 : 2 + l * 5.2) * (n - 1) / 7), 1, n - 1)];
  }
  function glassPoly(p, pts, c, a) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of pts) x0 = Math.min(x0, x), x1 = Math.max(x1, x), y0 = Math.min(y0, y), y1 = Math.max(y1, y);
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) if (inPoly(pts, x + 0.5, y + 0.5)) p.blend(x, y, c, a);
  }
  var Panes = class {
    constructor(opts = {}) {
      this.list = [];
      this.ground = opts.ground ?? (() => Infinity);
      this.onLand = opts.onLand ?? null;
      this.onCrumble = opts.onCrumble ?? null;
      this.onSkid = opts.onSkid ?? null;
    }
    add(q) {
      const life = q.life ?? 1;
      this.list.push({ vx: 0, vy: 0, a: 0, va: 0, f: 0, vf: 0, lit: 0.6, g: 1, drag: 0.3, bounce: 0.35, rest: false, brittle: false, ...q, life, max: life });
    }
    get count() {
      return this.list.length;
    }
    /** The pane's corners as drawn: tumbled (squashed across its own width), turned and placed. */
    corners(q) {
      const ca = Math.cos(q.a), sa = Math.sin(q.a), k = Math.cos(q.f);
      return q.pts.map(([x, y]) => {
        const yy = y * k;
        return [q.x + x * ca - yy * sa, q.y + x * sa + yy * ca];
      });
    }
    seat(q) {
      let low = -Infinity;
      for (const c of this.corners(q)) low = Math.max(low, c[1]);
      return low;
    }
    update(dt) {
      for (let i = this.list.length - 1; i >= 0; i--) {
        const q = this.list[i];
        if ((q.life -= dt) <= 0) {
          this.list.splice(i, 1);
          continue;
        }
        const floor = this.ground(q.x) - 0.5;
        if (q.rest && q.crumble !== void 0 && (q.restT = (q.restT ?? 0) + dt) > q.crumble) {
          this.onCrumble?.(q);
          this.list.splice(i, 1);
          continue;
        }
        if (q.rest) {
          if (Math.abs(q.vx) > 8) this.onSkid?.(q, q.x, floor + 0.5);
          q.x += q.vx * dt;
          q.vx -= q.vx * 7 * dt;
          q.a += q.va * dt;
          q.va -= q.va * 9 * dt;
          q.vf -= q.vf * 9 * dt;
          q.f += q.vf * dt;
          q.y -= this.seat(q) - floor;
          continue;
        }
        q.vy += GRAVITY * q.g * dt;
        q.vx -= q.vx * q.drag * dt;
        q.vy -= q.vy * q.drag * dt;
        q.x += q.vx * dt;
        q.y += q.vy * dt;
        q.a += q.va * dt;
        q.f += q.vf * dt;
        const low = this.seat(q);
        if (q.g <= 0 || low < floor || q.vy <= 0) continue;
        q.y -= low - floor;
        if (q.vy > 70) q.hits = (q.hits ?? 0) + 1, this.onLand?.(q, q.x, floor + 0.5, q.vy);
        if (q.brittle && q.vy > 70 && q.hits >= q.brittle) {
          this.list.splice(i, 1);
          continue;
        }
        if (q.vy > 70 && q.bounce > 0) {
          q.vy = -q.vy * q.bounce;
          q.vx *= 0.75;
          q.va *= 0.6;
          q.vf *= 0.5;
        } else {
          q.rest = true;
          q.vy = 0;
        }
      }
    }
    draw(p, C) {
      const n = C.length;
      for (const q of this.list) {
        const a = Math.min(1, q.life / 0.35), pts = this.corners(q), k = Math.cos(q.f), face = Math.abs(k);
        const lv = q.lit * (0.35 + 0.65 * face), flash = face > 0.97 && !q.rest;
        if (face > 0.25) {
          if (q.solid && q.tone !== void 0) {
            p.poly(pts, flash ? C[n - 1] : C[clamp(Math.round(1 + q.tone * 5 * (0.6 + 0.4 * face)), 1, n - 2)], a);
          } else if (q.solid) {
            const rr = q.ridge ?? -Math.PI / 2, cr = Math.cos(rr), sr = Math.sin(rr), ca = Math.cos(q.a), sa = Math.sin(q.a);
            const rx = cr * ca - sr * k * sa, ry = cr * sa + sr * k * ca;
            let nx = -ry, ny = rx;
            if (nx * -0.55 + ny * -0.84 < 0) nx = -nx, ny = -ny;
            const lit = flash ? C[n - 1] : C[clamp(Math.round(3 + lv * 3), 3, n - 2)], deep = C[clamp(Math.round(1 + lv * 2), 1, 3)];
            p.poly(pts, (x, y) => {
              const d = (x - q.x) * nx + (y - q.y) * ny;
              return d > 0.6 ? lit : d > -0.6 ? C[n - 2] : deep;
            }, a);
          } else glassPoly(p, pts, flash ? C[n - 1] : C[clamp(Math.round(3 + lv * 3), 3, n - 2)], (0.3 + 0.35 * lv + (flash ? 0.3 : 0)) * a);
        }
        let cx = 0, cy = 0, top = 0;
        for (const [x, y] of pts) cx += x, cy += y;
        cx /= pts.length;
        cy /= pts.length;
        for (let i = 0; i < pts.length; i++) {
          const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
          let nx = y1 - y0, ny = x0 - x1;
          if (nx * ((x0 + x1) / 2 - cx) + ny * ((y0 + y1) / 2 - cy) < 0) nx = -nx, ny = -ny;
          const l = Math.hypot(nx, ny) || 1, lit = (-nx * 0.55 - ny * 0.84) / l;
          p.line(x0, y0, x1, y1, face < 0.25 || lit > 0.35 ? C[n - 1] : lit > -0.25 ? C[n - 2] : q.solid ? C[1] : C[Math.max(2, n - 4)], a);
          if (pts[i][1] < pts[top][1]) top = i;
        }
        if (face > 0.7) p.dot(pts[top][0], pts[top][1], WHITE, a);
        p.glow(cx, cy, 5, C[n - 3], (flash ? 0.5 : 0.14) * a);
      }
    }
  };
  function flakeDesign(R4) {
    const n = R4.int(1, 3), branches = [];
    for (let i = 0; i < n; i++) branches.push([0.38 + 0.4 * (i + R4.range(0.2, 0.8)) / n, R4.range(0.24, 0.36) * (1 - i * 0.15)]);
    return { branches, plate: R4.chance(0.45), fork: R4.chance(0.45) };
  }
  function snowflake2(p, x, y, r, rot, d, C, opts = {}) {
    const n = C.length, a = opts.a ?? 1, hot = opts.hot ?? 0;
    rot = Math.round(rot / (Math.PI / 18)) * (Math.PI / 18);
    if (r < 1.2) {
      p.dot(x, y, WHITE, a);
      return;
    }
    if (r < 2.6) {
      const pose = Math.floor((rot % (Math.PI / 3) + Math.PI / 3) / (Math.PI / 6)) % 2;
      const pts = pose ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 1], [-1, -1], [1, -1], [-1, 1]];
      for (const [dx, dy] of pts) p.dot(x + dx, y + dy, hot > 0.5 ? WHITE : C[n - 3], a);
      p.dot(x, y, WHITE, a);
      p.glow(x, y, 4, C[n - 3], 0.2 * a);
      return;
    }
    const arm = hot > 0.5 ? WHITE : C[n - 2], br = hot > 0.5 ? C[n - 2] : C[n - 3], big = r >= 7;
    const branches = r < 4 ? [] : big ? d.branches.slice(0, 2) : [[0.58, 0.36]];
    for (let k = 0; k < 6; k++) {
      const g = rot + k * TAU / 6, ca = Math.cos(g), sa = Math.sin(g);
      p.line(x, y, x + ca * r, y + sa * r, arm, a);
      for (const [u, l] of branches) {
        const bx = x + ca * r * u, by = y + sa * r * u, bl = Math.max(1, r * l);
        for (const s of [-1, 1]) p.line(bx, by, bx + Math.cos(g + s * Math.PI / 3) * bl, by + Math.sin(g + s * Math.PI / 3) * bl, br, a);
      }
      if (d.fork && big && !d.plate)
        for (const s of [-1, 1]) p.dot(x + ca * r + Math.cos(g + s * 0.9) * 1.2, y + sa * r + Math.sin(g + s * 0.9) * 1.2, br, a);
      p.dot(x + ca * r, y + sa * r, WHITE, a);
    }
    if (d.plate && big) {
      const q = r * 0.34;
      for (let k = 0; k < 6; k++) {
        const g0 = rot + Math.PI / 6 + k * TAU / 6, g1 = g0 + TAU / 6;
        p.line(x + Math.cos(g0) * q, y + Math.sin(g0) * q, x + Math.cos(g1) * q, y + Math.sin(g1) * q, C[n - 3], a);
      }
    }
    p.px(x, y, WHITE);
    p.glow(x, y, 3 + r * 1.2, C[n - 4], (0.14 + 0.35 * hot) * a);
    if (hot > 0.3) p.glow(x, y, 2 + r * 0.5, WHITE, 0.3 * hot * a);
  }
  function endBy(t, D3, ...systems) {
    const left = Math.max(1e-3, D3 - 0.05 - t);
    for (const sys of systems) for (const q of sys.list) if (q.life > left) q.life = left;
  }
  function fractures(R4, inside, x, y, n, opts = {}) {
    const out = [], step = opts.step ?? [1.6, 2.6], len2 = opts.len ?? 18, fork = opts.fork ?? 0.16, a0 = opts.a0 ?? R4.range(0, TAU), spread = opts.spread ?? TAU;
    const walk2 = (x2, y2, d, a, len3, depth) => {
      const pts = [[x2, y2, d]];
      for (let s = 0; s < len3; s++) {
        a += R4.range(-0.55, 0.55);
        const st = R4.range(step[0], step[1]), nx = x2 + Math.cos(a) * st, ny = y2 + Math.sin(a) * st;
        if (!inside(nx, ny)) break;
        x2 = nx, y2 = ny, d += st;
        pts.push([x2, y2, d]);
        if (depth < 2 && pts.length > 2 && R4.chance(fork)) walk2(x2, y2, d, a + R4.sign() * R4.range(0.6, 1.2), Math.ceil(len3 * 0.5), depth + 1);
      }
      if (pts.length > 1) out.push(pts);
    };
    for (let i = 0; i < n; i++) walk2(x, y, 0, a0 + i / n * spread + R4.range(-0.3, 0.3) * Math.min(1, spread / TAU), len2, 0);
    return out;
  }
  function drawFractures(p, cracks, reach, C, opts = {}) {
    const n = C.length, ox = opts.ox ?? 0, oy = opts.oy ?? 0, hot = opts.hot ?? true, a = opts.a ?? 1;
    const seg2 = (pts, i) => {
      const [x0, y0, d0] = pts[i - 1], [x1, y1, d1] = pts[i];
      if (d0 >= reach) return null;
      const u = Math.min(1, (reach - d0) / Math.max(0.01, d1 - d0));
      return [x0 + ox, y0 + oy, x0 + ox + (x1 - x0) * u, y0 + oy + (y1 - y0) * u, reach - d1 < 3];
    };
    for (const pts of cracks)
      for (let i = 1; i < pts.length; i++) {
        const s = seg2(pts, i);
        if (!s) break;
        p.line(s[0], s[1] + 1, s[2], s[3] + 1, C[Math.min(2, n - 1)], a);
      }
    for (const pts of cracks)
      for (let i = 1; i < pts.length; i++) {
        const s = seg2(pts, i);
        if (!s) break;
        const tip = hot && s[4];
        p.line(s[0], s[1], s[2], s[3], tip ? WHITE : C[n - 2], a);
        if (tip) p.glow(s[2], s[3], 5, C[n - 3], 0.5 * a);
        else if (i % 2) p.glow(s[2], s[3], 3, C[n - 3], 0.18 * a);
      }
  }

  // fx/ice/snowflake-burst.js
  var meta2 = {
    name: "Snowflake burst",
    desc: "A cold pop: frost gathers and flashes white in a ring, then crisp six-armed snowflakes spin out, slow, twinkle and drift down to settle and melt.",
    tags: ["ice", "snow", "snowflake", "burst", "magic", "one-shot"],
    size: [140, 120],
    origin: [70, 106],
    duration: 3.2,
    loop: false,
    fps: 30,
    bg: "ground",
    options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], count: 9, seed: 8 }
  };
  var POP = 0.16;
  var CY = -48;
  function create2(o) {
    const C = fit(o.palette, 8), R4 = new Rng(o.seed), floor = () => 0;
    const ps = new Particles({ rng: R4, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
    const lights = new Lights();
    const flakes = [];
    const SIZES = [2, 0, 1, 0, 2, 0, 1, 0, 1];
    for (let i = 0; i < o.count; i++) {
      const z = SIZES[i % SIZES.length], r = z === 2 ? R4.range(9.5, 11.5) : z === 1 ? R4.range(6, 7.5) : R4.range(3, 4.5);
      const a = i / o.count * TAU + R4.range(-0.3, 0.3) + 0.4, sp = R4.range(80, 120) * (1.4 - r / 14);
      flakes.push({
        x: 0,
        y: CY,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.85 - 20,
        r,
        rot: R4.range(0, TAU),
        w0: R4.sign() * R4.range(7, 12),
        w1: R4.sign() * R4.range(0.4, 1),
        d: flakeDesign(R4),
        life: R4.range(2.1, 2.8),
        age: 0,
        ph: R4.range(0, TAU),
        tw: R4.range(0.5, 0.85),
        tw0: R4.range(0.15, 0.6),
        rest: false,
        popped: false
      });
    }
    let t = 0, popped = false;
    const sz = (f) => f.r * Math.min(1, ease.outBack(clamp(f.age / 0.18), 2)) * Math.min(1, (f.life - f.age) / 0.35);
    return {
      update(dt) {
        t += dt;
        if (t < POP - 0.03 && R4.chance(0.8)) {
          const a = R4.range(0, TAU), D3 = R4.range(22, 44), T2 = R4.range(0.12, 0.16), v = D3 * 3 / (Math.exp(3 * T2) - 1);
          ps.spawn(P.STREAK, Math.cos(a) * D3, CY + Math.sin(a) * D3, -Math.cos(a) * v, -Math.sin(a) * v, T2, R4.chance(0.5) ? C[6] : C[5]);
        }
        if (!popped && t >= POP) {
          popped = true;
          lights.add(0, CY, 44, WHITE, 0.8, 0.1);
          lights.add(0, CY, 72, C[4], 0.5, 0.6);
          for (let i = 0; i < 22; i++) {
            const a = R4.range(0, TAU), sp = R4.range(80, 150);
            ps.spawn(P.MOTE, 0, CY, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.25, 0.5), R4.chance(0.5) ? C[6] : C[5], R4.range(0.6, 1));
          }
          for (let i = 0; i < 18; i++) {
            const a = R4.range(-Math.PI, 0.2), sp = R4.range(30, 110);
            ps.spawn(P.FLAKE, 0, CY, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1, 1.6), R4.chance(0.6) ? WHITE : C[6], R4.range(0.5, 1.5));
          }
          for (let i = 0; i < 12; i++) {
            const a = R4.range(0, TAU), d = R4.range(10, 44);
            ps.spawn(P.STAR, Math.cos(a) * d, CY + Math.sin(a) * d * 0.85, 0, R4.range(2, 6), R4.range(0.3, 0.6), R4.chance(0.5) ? WHITE : C[6], R4.range(0.8, 2.2), R4.range(0.08, 1.6));
          }
        }
        if (popped)
          for (const f of flakes) {
            f.age += dt;
            if (f.age >= f.life) continue;
            if (!f.rest) {
              f.vx -= f.vx * 2.8 * dt;
              f.vy -= f.vy * 2.8 * dt - 26 * dt;
              f.x += f.vx * dt + Math.sin(t * 1.8 + f.ph) * 5 * dt;
              f.y += f.vy * dt;
              f.rot += (f.w1 + (f.w0 - f.w1) * Math.exp(-f.age * 2.5)) * dt;
              if (f.y > -sz(f) * 0.3) {
                f.rest = true;
                f.y = -1;
                f.life = Math.min(f.life, f.age + 0.6);
              }
            }
            if (!f.popped && f.life - f.age < 0.1) {
              f.popped = true;
              for (let i = 0; i < 2; i++) ps.spawn(P.STAR, f.x + R4.range(-2, 2), f.y + R4.range(-2, 2), R4.range(-6, 6), -R4.range(2, 8), R4.range(0.2, 0.4), R4.chance(0.5) ? WHITE : C[6], R4.range(0.8, 1.6));
            }
          }
        ps.update(dt);
        lights.update(dt);
        endBy(t, meta2.duration, ps);
      },
      draw(p) {
        if (t < POP) {
          const k = t / POP;
          snowflake2(p, 0, CY, 1 + 3.2 * k * k, t * 20, flakes[0].d, C, { hot: k });
          p.glow(0, CY, 8 + 14 * k, C[5], 0.3 + 0.4 * k);
        }
        const q = t - POP;
        if (q >= 0 && q < 0.4) {
          if (q < 0.07) p.circle(0, CY, 6 * (1 - q / 0.07) + 1, WHITE);
          flare(p, 0, CY, 28 * Math.pow(Math.max(0, 1 - q / 0.26), 1.5), 1 - q / 0.26, C);
          const e = ease.outCubic(q / 0.4), r = 5 + 34 * e;
          p.ring(0, CY, r, Math.max(1, 2.4 * (1 - e)), q < 0.08 ? WHITE : q < 0.2 ? C[6] : C[5], 1.15 - e);
          p.glowRing(0, CY, r, 5, C[5], 0.4 * (1 - e));
        }
        if (popped) p.glow(0, CY, 46, C[4], 0.3 * (1 - smooth(POP, POP + 1.6, t)));
        for (const f of flakes) {
          if (!popped || f.age >= f.life) continue;
          const r = sz(f), tw = Math.max(0, Math.sin((f.age - f.tw0) / f.tw * TAU)) ** 8 * (f.age > f.tw0 ? 1 : 0);
          if (f.rest) {
            const L2 = Math.max(1, Math.round(r * 1.2 * ((f.life - f.age) / 0.6)));
            for (let i = -L2; i <= L2; i++) p.px(f.x + i, -1, Math.abs(i) === L2 ? C[5] : i === 0 ? WHITE : C[6]);
            p.glow(f.x, -1, 3 + L2, C[4], 0.3);
            continue;
          }
          snowflake2(p, f.x, f.y, r, f.rot, f.d, C, { hot: Math.max(tw, 1 - clamp(f.age / 0.12)) });
          p.glow(f.x, f.y, 6 + r * 1.4, C[4], 0.12);
          if (tw > 0.5) flare(p, f.x, f.y, (3 + r * 0.7) * tw, tw, C);
        }
        ps.draw(p);
        lights.draw(p);
      }
    };
  }

  // fx/ice/freeze.js
  var freeze_exports = {};
  __export(freeze_exports, {
    act: () => act2,
    create: () => create3,
    meta: () => meta3
  });
  var meta3 = {
    name: "Freeze",
    desc: "Frost races in and climbs the character, turning it to ice; a faceted block crystallizes round it pane by pane, glints, cracks and bursts, and the character thaws free.",
    tags: ["ice", "freeze", "frozen", "status", "crowd-control", "one-shot"],
    size: [176, 128],
    origin: [88, 108],
    duration: 4,
    loop: false,
    fps: 30,
    bg: "ground",
    actor: 2,
    options: { palette: ["#151a3d", "#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#a6ecff", "#dcfbff", "#ffffff"], seed: 5 }
  };
  var FEAR = { turn: 0.9, lean: -2, crouch: 2, fx: -8, fy: -31, bx: 9, by: -31, ffx: -3, fbx: 4 };
  var FREE = { turn: 1, crouch: 5, fx: -12, fy: -18, bx: 12, by: -18, ffx: -5, fbx: 6 };
  var act2 = {
    onBody: true,
    poses: [
      [-0.2, READY],
      [0.05, READY],
      [0.16, FEAR, "snap"],
      [0.3, { ...FEAR, lean: -1, fx: -10, fy: -34 }],
      [0.45, { ...FEAR, lean: -3, bx: 11, by: -34, fx: -7, fy: -29 }],
      [0.62, FEAR],
      [2.52, FEAR],
      [2.54, FREE, "snap"],
      [2.9, { ...FREE, crouch: 4 }],
      [3.1, { ...FREE, crouch: 3, lean: 1 }],
      [3.3, { ...FREE, crouch: 3, lean: -1 }],
      [4, READY]
    ],
    hits: [{ t: 0.62, stop: 0.03, shake: 0.08, amp: 1 }, { t: 2.52, stop: 0.05, shake: 0.2, amp: 2 }]
  };
  var SNAP = 0.16;
  var CLIMB = [0.14, 0.62];
  var SEAL = 0.6;
  var SWEEPS = [1.12, 1.82];
  var CRACK = 2.2;
  var CRACK2 = 2.34;
  var FLASH = 2.46;
  var BURST = 2.52;
  var THAW = 0.36;
  var MELT2 = [2.95, 3.7];
  var REACH = 38;
  var CORE2 = [0, -21];
  var V = {
    l0: [-15, 0],
    l1: [-17, -10],
    l2: [-17, -31],
    p1: [-12, -45],
    n1: [-6, -42],
    p2: [0, -52],
    n2: [6, -43],
    p3: [12, -47],
    r2: [17, -30],
    r1: [16, -9],
    r0: [14, 0],
    i0: [-6, -36],
    i1: [6, -35],
    i2: [-9, -21],
    i3: [3, -25],
    i4: [9, -13],
    i5: [-5, -8],
    i6: [2, 0],
    i7: [0, -40]
  };
  var FACETS = [
    ["l0 l1 i5 i6", 0.62, 0],
    ["i5 i4 i6", 0.42, 0.03],
    ["i4 r2 r1 r0 i6", 0.2, 0.05],
    ["l1 l2 i2 i5", 0.74, 0.08],
    ["i2 i3 i4 i5", 0.5, 0.1],
    ["i1 r2 i4 i3", 0.28, 0.13],
    ["l2 i0 i2", 0.7, 0.15],
    ["i0 i1 i3 i2", 0.58, 0.18],
    ["n1 i7 n2 i1 i0", 0.52, 0.2],
    ["i1 n2 p3 r2", 0.4, 0.23],
    ["l2 p1 n1 i0", 0.88, 0.25],
    ["p2 n2 i7", 0.66, 0.28],
    ["n1 p2 i7", 1, 0.31]
  ].map(([k, lit, at2], i) => ({ pts: k.split(" ").map((v) => V[v]), lit, at: SEAL + at2, i }));
  var OUTLINE = "l0 l1 l2 p1 n1 p2 n2 p3 r2 r1 r0".split(" ").map((v) => V[v]);
  var X0 = -18;
  var X1 = 18;
  var Y0 = -53;
  var Y1 = 0;
  var BW2 = X1 - X0;
  function floorFrost(p, C, t, out) {
    for (let x = -REACH; x <= REACH; x++) {
      const d = Math.abs(x + 0.5) / REACH, arrive = SNAP * (1 - d), age = t - arrive;
      if (age < 0) continue;
      const a = out * clamp((1.12 - d) / 0.2), g = smooth(0, 0.4, age), h = rand(x, 31), s = x < 0 ? -1 : 1;
      if (a <= 0) continue;
      p.dot(x, 0, age < 0.05 || h < 0.3 ? WHITE : C[6], a);
      if (h < 0.55) {
        const L2 = Math.round(g * (1 + rand(x, 7) * 3.4) * (1 - d * 0.55));
        for (let j = 1; j <= L2; j++) p.dot(x, -j, j === L2 ? WHITE : C[5], a);
        if (L2 >= 2) p.dot(x + s, -L2 + 1, C[6], a);
        if (L2 >= 4) p.dot(x - s, -L2 + 2, C[5], a);
      }
      const D3 = g * (2 + rand(x, 11) * 4) * (1 - d * 0.5);
      for (let j = 1; j <= D3; j++) p.dot(x, j, rand(x * 13 + j, 5) < 0.07 ? WHITE : j < 2 ? C[5] : j < 4 ? C[4] : C[3], a * (1.05 - j / (D3 + 1)));
    }
  }
  function create3(o) {
    const C = fit(o.palette, 8), R4 = new Rng(o.seed), A = o.actor, floor = () => 0;
    const ps = new Particles({ rng: R4, ground: floor, sparks: [C[7], C[6], C[5], C[4]], haze: C[5] });
    const bits = new Bits({ ground: floor }), lights = new Lights();
    const panes = new Panes({
      ground: floor,
      onLand: (q, x, y, v) => {
        for (let i = 0; i < 3; i++) bits.add({ kind: B.SHARD, x: x + R4.range(-2, 2), y: y - 1, vx: q.vx * 0.6 + R4.range(-50, 50), vy: -R4.range(30, 100), g: 0.8, drag: 0.6, bounce: 0.35, life: R4.range(0.4, 0.8), a: R4.range(0, TAU), va: R4.range(-18, 18), s: R4.range(1.2, 2.4), c: C[R4.int(5, 7)] });
        ps.spawn(P.VAPOUR, x, y - 1, R4.range(-25, 25), -R4.range(2, 10), R4.range(0.4, 0.7), C[6], R4.range(1.4, 2.4));
        if (R4.chance(0.4)) ps.spawn(P.STAR, x, y - 2, 0, -6, R4.range(0.2, 0.4), WHITE, R4.range(0.8, 1.6));
      }
    });
    const W3 = A.w, H = A.h, N3 = W3 * H, on = (x, y) => x >= 0 && y >= 0 && x < W3 && y < H && A.mask.data[y * W3 + x] > 0;
    const dist = new Float32Array(N3).fill(Infinity), ice = new Uint32Array(N3), rim = new Uint8Array(N3);
    const open = [];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W3; x++) {
        if (!on(x, y)) continue;
        const i = y * W3 + x;
        rim[i] = !on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) ? 1 : 0;
        const up = !on(x - 1, y) || !on(x, y - 1);
        ice[i] = mix(up ? C[Math.min(7, C.indexOf(iceOf(A.pixels[i], C)) + 1)] : iceOf(A.pixels[i], C), C[6], 0.2);
        if (y === H - 1 || !on(x, y + 1)) {
          if (y >= H - 4) dist[i] = R4.range(0, 1.5), open.push(i);
        }
      }
    const done = new Uint8Array(N3);
    while (open.length) {
      let bi = 0;
      for (let j = 1; j < open.length; j++) if (dist[open[j]] < dist[open[bi]]) bi = j;
      const i = open[bi];
      open[bi] = open[open.length - 1];
      open.pop();
      if (done[i]) continue;
      done[i] = 1;
      const x = i % W3, y = i / W3 | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, -1], [0, 1]]) {
        const nx = x + dx, ny = y + dy;
        if (!on(nx, ny)) continue;
        const j = ny * W3 + nx, w = (rim[j] ? 0.55 : 1) * (dy < 0 ? 1 : 1.3) + R4.range(0, 1.5);
        if (dist[i] + w < dist[j]) dist[j] = dist[i] + w, open.push(j);
      }
    }
    let maxD = 0;
    for (let i = 0; i < N3; i++) if (dist[i] < Infinity) maxD = Math.max(maxD, dist[i]);
    const reach = new Float32Array(N3), order = [];
    for (let i = 0; i < N3; i++)
      if (dist[i] < Infinity) {
        reach[i] = CLIMB[0] + (CLIMB[1] - CLIMB[0]) * Math.pow(dist[i] / maxD, 0.85);
        order.push(i);
      }
    order.sort((a, b) => reach[a] - reach[b]);
    const feathers = [];
    for (const i of order) {
      const x = i % W3, y = i / W3 | 0;
      if (!rim[i] || rand(i, o.seed, 3) > 0.42 || y > H - 3) continue;
      const dx = !on(x - 1, y) ? -1 : !on(x + 1, y) ? 1 : rand(i, 9) < 0.5 ? -1 : 1, dy = !on(x, y - 1) ? -1 : rand(i, 4) < 0.5 ? -1 : 0;
      feathers.push({ x: A.x + x + dx, y: A.y + y + dy, dx, dy, L: 1 + Math.floor(rand(i, 7) * 2.6), at: reach[i] + 0.04 });
    }
    const fid = new Int8Array(BW2 * (Y1 - Y0)).fill(-1), inBlock = (x, y) => inPoly(OUTLINE, x, y);
    for (let y = Y0; y < Y1; y++)
      for (let x = X0; x < X1; x++) {
        if (!inBlock(x + 0.5, y + 0.5)) continue;
        let f = FACETS.findIndex((F) => inPoly(F.pts, x + 0.5, y + 0.5));
        if (f < 0) f = FACETS.reduce((b, F, k) => Math.hypot(centroid(F.pts).x - x, centroid(F.pts).y - y) < Math.hypot(centroid(FACETS[b].pts).x - x, centroid(FACETS[b].pts).y - y) ? k : b, 0);
        fid[(y - Y0) * BW2 + (x - X0)] = f;
      }
    const at2 = (x, y) => x < X0 || x >= X1 || y < Y0 || y >= Y1 ? -1 : fid[(y - Y0) * BW2 + (x - X0)];
    for (const F of FACETS) {
      F.c = centroid(F.pts);
      F.tint = C[3 + Math.round(F.lit * 3)];
      F.alpha = 0.2 + 0.24 * F.lit;
      F.d = clamp((F.c.x + 0.55 * F.c.y + 36) / 46);
      F.len = F.pts.reduce((s, q, k) => s + Math.hypot(F.pts[(k + 1) % F.pts.length][0] - q[0], F.pts[(k + 1) % F.pts.length][1] - q[1]), 0);
    }
    const EDGES = [];
    for (const F of FACETS)
      F.pts.forEach((a, k) => {
        const b = F.pts[(k + 1) % F.pts.length];
        let e = EDGES.find((e2) => e2.a === a && e2.b === b || e2.a === b && e2.b === a);
        if (!e) EDGES.push(e = { a, b, fs: [] });
        e.fs.push(F);
      });
    for (const e of EDGES) {
      const [x0, y0] = e.a, [x1, y1] = e.b, c = e.fs[0].c;
      let nx = y1 - y0, ny = x0 - x1;
      if (nx * ((x0 + x1) / 2 - c.x) + ny * ((y0 + y1) / 2 - c.y) < 0) nx = -nx, ny = -ny;
      e.outer = e.fs.length === 1;
      e.lit = (-nx * 0.55 - ny * 0.84) / Math.hypot(nx, ny);
      e.floor = y0 === 0 && y1 === 0;
      e.at = Math.min(...e.fs.map((F) => F.at));
    }
    const VERTS = Object.values(V);
    const cracks = fractures(R4, (x, y) => inBlock(x, y), CORE2[0], CORE2[1], 3, { len: 9, a0: -2.2, spread: 3.6 });
    const cracks2 = fractures(R4, (x, y) => inBlock(x, y), CORE2[0] + 1, CORE2[1] - 2, 6, { len: 16, fork: 0.22 });
    let t = 0, formed = 0, sealed = false, struck = 0, burst = false, white = false;
    const jolt = () => t >= CRACK && t < CRACK + 0.06 ? 1 : t >= CRACK2 && t < FLASH ? Math.floor(t * 40) % 2 ? 1 : -1 : 0;
    const drawCharacter = (p) => {
      const thaw = t >= BURST ? ease.inQuad(seg(t, BURST, BURST + THAW)) * (H + 2) - 2 : -1;
      for (const i of order) {
        const age = t - reach[i];
        if (age < 0) break;
        const x = i % W3, y = i / W3 | 0;
        if (y < thaw) continue;
        p.px(A.x + x, A.y + y, y < thaw + 1.2 && t >= BURST ? C[7] : age < 0.016 ? WHITE : age < 0.045 ? C[6] : ice[i]);
        if (age < 0.03) p.light(A.x + x, A.y + y, C[6], 0.3);
      }
      if (t >= BURST) return;
      for (const f of feathers) {
        const g = clamp((t - f.at) / 0.08);
        if (g <= 0) continue;
        const L2 = Math.round(f.L * g);
        for (let j = 0; j < L2; j++) p.px(f.x + f.dx * j, f.y + f.dy * j, j === L2 - 1 ? WHITE : C[6]);
      }
    };
    const drawBlock = (p) => {
      if (t >= BURST || t < SEAL - 0.08) return;
      const jx = jolt(), wh = t >= FLASH;
      for (const F of FACETS) F.g = SWEEPS.reduce((g, s0) => Math.max(g, Math.sin(Math.PI * clamp((t - s0 - F.d * 0.32) / 0.13))), 0) * (0.35 + 0.65 * F.lit);
      for (let y = Y0; y < Y1; y++)
        for (let x = X0; x < X1; x++) {
          const f = at2(x, y);
          if (f < 0) continue;
          const F = FACETS[f], age = t - F.at;
          if (age < 0) continue;
          if (wh) {
            p.px(x + jx, y, WHITE);
            continue;
          }
          if (age < 0.03) {
            p.blend(x + jx, y, C[7], 0.55);
            continue;
          }
          const fresh = 1 - clamp((age - 0.03) / 0.1), g = F.g;
          p.blend(x + jx, y, fresh > 0.5 || g > 0.5 ? C[6] : F.tint, F.alpha + 0.25 * fresh + 0.15 * g);
          if (g > 0.05) p.light(x + jx, y, C[5], 0.42 * g);
        }
      for (const e of EDGES) {
        if (e.floor || t < e.at) continue;
        const [x0, y0] = e.a, [x1, y1] = e.b, fresh = e.fs.some((F) => t - F.at < 0.1 || F.g > 0.6);
        if (e.outer && e.lit < 0 && !wh) p.line(x0 + jx + 1, y0, x1 + jx + 1, y1, C[1]);
        if (e.outer) p.glowLine(x0 + jx, y0, x1 + jx, y1, 5, C[4], 0.1);
        p.line(x0 + jx, y0, x1 + jx, y1, wh ? C[6] : fresh ? WHITE : e.outer ? e.lit > 0.3 ? WHITE : e.lit > -0.2 ? C[6] : C[4] : (y0 + y1) / 2 < -30 ? C[6] : C[5]);
      }
      for (const F of FACETS) {
        const age = t - F.at;
        if (age < -0.07 || age >= 0) continue;
        let left = (age + 0.07) / 0.07 * F.len;
        for (let k = 0; k < F.pts.length && left > 0; k++) {
          const [x0, y0] = F.pts[k], [x1, y1] = F.pts[(k + 1) % F.pts.length], L2 = Math.hypot(x1 - x0, y1 - y0), v = Math.min(1, left / L2);
          left -= L2;
          p.line(x0 + jx, y0, x0 + jx + (x1 - x0) * v, y0 + (y1 - y0) * v, WHITE);
          if (v < 1) p.glow(x0 + jx + (x1 - x0) * v, y0 + (y1 - y0) * v, 6, C[6], 0.6);
        }
      }
      if (t >= CRACK && !wh) drawFractures(p, cracks, (t - CRACK) * 150, C, { ox: jx });
      if (t >= CRACK2 && !wh) drawFractures(p, cracks2, (t - CRACK2) * 190, C, { ox: jx });
    };
    return {
      update(dt) {
        t += dt;
        if (t < SNAP)
          for (const s of [-1, 1]) {
            const x = s * REACH * (1 - t / SNAP);
            if (R4.chance(0.12)) ps.spawn(P.VAPOUR, x, -R4.range(0, 2), -s * R4.range(40, 90), -R4.range(0, 5), R4.range(0.3, 0.5), C[6], R4.range(1.4, 2.4));
            if (R4.chance(0.45)) ps.spawn(P.STREAK, x + s * R4.range(0, 6), -R4.range(1, 4), -s * R4.range(50, 90), 0, R4.range(0.1, 0.16), R4.chance(0.5) ? C[6] : C[5]);
          }
        if (t > CLIMB[0] && t < CLIMB[1] + 0.03) {
          let lo = 0;
          while (lo < order.length && reach[order[lo]] < t - 0.06) lo++;
          let hi = lo;
          while (hi < order.length && reach[order[hi]] <= t) hi++;
          if (hi > lo && R4.chance(0.45)) {
            const i = order[R4.int(lo, hi - 1)];
            ps.spawn(P.STAR, A.x + i % W3 + 0.5, A.y + (i / W3 | 0), R4.range(-8, 8), -R4.range(0, 18), R4.range(0.2, 0.42), R4.chance(0.5) ? C[6] : WHITE, R4.range(0.6, 1.9));
          }
          if (hi > lo && R4.chance(0.12)) {
            const i = order[R4.int(lo, hi - 1)];
            ps.spawn(P.FLAKE, A.x + i % W3, A.y + (i / W3 | 0), R4.range(-20, 20), -R4.range(10, 30), R4.range(0.5, 0.9), C[6], R4.range(0.5, 1.2));
          }
        }
        while (formed < FACETS.length && t >= FACETS[formed].at) {
          const F = FACETS[formed++], c = centroid(F.pts);
          for (let i = 0; i < 3; i++) {
            const a = Math.atan2(c.y - CORE2[1], c.x - CORE2[0]) + R4.range(-0.7, 0.7), sp = R4.range(50, 120);
            bits.add({ kind: B.SHARD, x: c.x, y: c.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, g: 0.8, drag: 0.8, bounce: 0.3, life: R4.range(0.35, 0.7), a: R4.range(0, TAU), va: R4.range(-18, 18), s: R4.range(1, 2.2), c: C[R4.int(5, 7)] });
          }
          if (c.y > -14) ps.spawn(P.VAPOUR, c.x, -1, Math.sign(c.x || 1) * R4.range(10, 30), -R4.range(2, 8), R4.range(0.5, 0.8), C[6], R4.range(2.2, 3.4));
          ps.spawn(P.STAR, c.x + R4.range(-2, 2), c.y + R4.range(-2, 2), 0, -4, R4.range(0.25, 0.45), WHITE, R4.range(1.2, 2.2));
          lights.add(c.x, c.y, 16, C[6], 0.4, 0.12);
        }
        if (!sealed && formed === FACETS.length) {
          sealed = true;
          lights.add(0, -26, 70, C[5], 0.6, 0.4);
          for (let i = 0; i < 5; i++) ps.spawn(P.STAR, R4.range(-15, 15), -R4.range(6, 44), R4.range(-6, 6), -R4.range(0, 8), R4.range(0.3, 0.6), R4.chance(0.5) ? WHITE : C[6], R4.range(1, 2.2));
        }
        if (sealed && t < CRACK2) {
          if (R4.chance(0.035)) {
            const [x, y] = R4.pick(VERTS);
            ps.spawn(P.STAR, x + R4.range(-1, 1), y + R4.range(-1, 1), 0, -2, R4.range(0.3, 0.6), R4.chance(0.6) ? C[6] : WHITE, R4.range(0.8, 2.2));
          }
          if (R4.chance(0.025)) {
            const s = R4.sign();
            ps.spawn(P.VAPOUR, s * R4.range(12, 18), -R4.range(1, 3), s * R4.range(8, 24), -R4.range(1, 5), R4.range(0.7, 1.1), C[6], R4.range(1.8, 3));
          }
          if (R4.chance(0.012)) ps.spawn(P.FLAKE, R4.range(-30, 30), -R4.range(56, 76), R4.range(-4, 4), R4.range(4, 10), R4.range(1.2, 1.8), R4.chance(0.5) ? WHITE : C[6], R4.range(0.5, 1.4));
        }
        if (struck === 0 && t >= CRACK) {
          struck = 1;
          lights.add(CORE2[0], CORE2[1], 26, WHITE, 0.4, 0.1);
          for (let i = 0; i < 4; i++) bits.add({ kind: B.SHARD, x: R4.range(-14, 14), y: -R4.range(10, 40), vx: R4.range(-40, 40), vy: -R4.range(10, 60), g: 0.9, drag: 0.6, bounce: 0.3, life: R4.range(0.5, 0.9), a: R4.range(0, TAU), va: R4.range(-20, 20), s: R4.range(1, 2), c: C[R4.int(5, 7)] });
        }
        if (struck === 1 && t >= CRACK2) {
          struck = 2;
          lights.add(CORE2[0], CORE2[1], 40, C[6], 0.35, 0.16);
          for (let i = 0; i < 3; i++) ps.spawn(P.STAR, R4.range(-12, 12), -R4.range(8, 40), 0, -3, R4.range(0.15, 0.3), WHITE, R4.range(1, 2));
        }
        if (!white && t >= FLASH) {
          white = true;
          lights.add(CORE2[0], CORE2[1], 60, WHITE, 0.9, 0.1);
        }
        if (!burst && t >= BURST) {
          burst = true;
          lights.add(CORE2[0], CORE2[1], 64, WHITE, 0.85, 0.14);
          lights.add(CORE2[0], CORE2[1] - 4, 72, C[4], 0.55, 0.6);
          const chop = (pts, depth) => {
            const c = centroid(pts);
            return c.area < 20 || depth > 2 ? [pts] : splitPoly(pts, c.x, c.y, R4.range(0, Math.PI)).flatMap((q) => chop(q, depth + 1));
          };
          for (const F of FACETS) {
            for (const part of chop(F.pts, 0)) {
              const m = centroid(part), dx = m.x - CORE2[0], dy = m.y - CORE2[1], d = Math.hypot(dx, dy) || 1, sp = R4.range(40, 85) * (1.2 - Math.min(0.5, m.area / 120));
              panes.add({
                pts: part.map(([x, y]) => [x - m.x, y - m.y]),
                x: m.x,
                y: m.y,
                vx: dx / d * sp + R4.range(-15, 15),
                vy: dy / d * sp * 0.6 - R4.range(90, 190),
                a: 0,
                va: R4.range(-9, 9),
                f: R4.range(-0.8, 0.8),
                vf: R4.sign() * R4.range(5, 13),
                lit: F.lit,
                g: 0.85,
                drag: 0.7,
                brittle: true,
                life: R4.range(1, 1.45)
              });
            }
          }
          for (let i = 0; i < 50; i++) {
            let x = 0, y = 0;
            for (let k = 0; k < 12 && at2(x, y) < 0; k++) x = R4.int(X0, X1 - 1), y = R4.int(Y0, Y1 - 1);
            const dx = x - CORE2[0], dy = y - CORE2[1], d = Math.hypot(dx, dy) || 1, sp = R4.range(50, 130);
            bits.add({ kind: B.SHARD, x, y, vx: dx / d * sp, vy: dy / d * sp * 0.7 - R4.range(60, 170), g: 0.85, drag: 0.9, bounce: 0.3, life: R4.range(0.8, 1.4), a: R4.range(0, TAU), va: R4.range(-22, 22), s: R4.range(1.5, 3.2), c: C[R4.int(4, 7)] });
          }
          for (const f of feathers)
            if (R4.chance(0.5)) bits.add({ kind: B.SHARD, x: f.x, y: f.y, vx: f.dx * R4.range(20, 70), vy: -R4.range(20, 90), g: 0.8, drag: 0.8, bounce: 0.3, life: R4.range(0.4, 0.8), a: R4.range(0, TAU), va: R4.range(-20, 20), s: R4.range(1, 1.8), c: WHITE });
          for (let i = 0; i < 12; i++) {
            const s = R4.sign();
            ps.spawn(P.VAPOUR, s * R4.range(2, 16), -R4.range(1, 6), s * R4.range(30, 90), -R4.range(4, 16), R4.range(0.6, 1.1), C[6], R4.range(2.2, 4));
          }
          for (let i = 0; i < 8; i++) ps.spawn(P.VAPOUR, R4.range(-14, 14), -R4.range(8, 40), R4.range(-30, 30), -R4.range(10, 30), R4.range(0.6, 1), C[6], R4.range(3, 5));
          for (let i = 0; i < 18; i++) {
            const a = R4.range(-Math.PI, 0), sp = R4.range(40, 130);
            ps.spawn(P.FLAKE, R4.range(-10, 10), CORE2[1] + R4.range(-12, 12), Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1, 1.5), R4.chance(0.6) ? WHITE : C[6], R4.range(0.5, 1.6));
          }
          for (let i = 0; i < 7; i++) ps.spawn(P.STAR, R4.range(-26, 26), -R4.range(6, 52), R4.range(-12, 12), -R4.range(4, 16), R4.range(0.4, 0.8), R4.chance(0.5) ? WHITE : C[6], R4.range(1, 2.4));
        }
        if (burst && t < BURST + 0.9 && R4.chance(0.07)) {
          const b = R4.pick(bits.list.length ? bits.list : [{ x: 0, y: -10 }]);
          ps.spawn(P.STAR, b.x, b.y - 1, 0, -3, R4.range(0.2, 0.4), R4.chance(0.5) ? WHITE : C[6], R4.range(0.6, 1.6));
        }
        if (burst && t < BURST + THAW && R4.chance(0.12)) {
          const y = -H + ease.inQuad(seg(t, BURST, BURST + THAW)) * H;
          bits.add({ kind: B.DRIP, x: R4.range(-9, 9), y, vy: 10, g: 0.5, life: 0.8, c: C[5] });
        }
        ps.update(dt);
        bits.update(dt);
        panes.update(dt);
        lights.update(dt);
        endBy(t, meta3.duration, ps, bits, panes);
      },
      drawBack(p) {
        const out = 1 - smooth(MELT2[0], MELT2[1], t);
        if (out > 0) floorFrost(p, C, t, out);
        ps.draw(p, "back");
      },
      draw(p) {
        drawCharacter(p);
        drawBlock(p);
        const hold = smooth(CLIMB[0], SEAL, t) * (1 - smooth(BURST, BURST + 0.6, t)), crk = smooth(CRACK, FLASH, t);
        if (hold > 0) {
          p.glow(0, -2, 34, C[4], 0.22 * hold * (0.85 + 0.15 * Math.sin(t * 3)));
          p.glow(CORE2[0], CORE2[1] - 4, 40, C[3], (0.22 + 0.1 * crk) * hold);
        }
        if (t > CLIMB[0] && t < CLIMB[1]) p.glow(0, -38 * ease.outQuad(seg(t, CLIMB[0], CLIMB[1])), 18, C[5], 0.28);
        const top = FACETS[FACETS.length - 1].at, g = t - top;
        if (g > 0 && g < 0.3) sparkle(p, V.p2[0], V.p2[1], 8 * ease.outBack(Math.min(1, g / 0.06)) * (1 - g / 0.3), C[6], C[4], 0.6);
        if (t >= FLASH && t < BURST + 0.16) {
          const a = clamp((t - FLASH) / 0.22);
          flare(p, CORE2[0], CORE2[1], 34 * Math.pow(1 - a, 1.4), 1 - a, C);
        }
        panes.draw(p, C);
        bits.draw(p);
        ps.draw(p, "front");
        lights.draw(p);
      }
    };
  }

  // fx/arcane/magic-circle-cast.js
  var magic_circle_cast_exports = {};
  __export(magic_circle_cast_exports, {
    create: () => create4,
    meta: () => meta4
  });

  // fx/arcane/_lib.js
  var BAYER2 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  var CROSS2 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  var bayer = (x, y) => BAYER2[(Math.floor(y) & 3) << 2 | Math.floor(x) & 3];
  function mote(p, x, y, vx, vy, c, size = 1, k = 1, glow = 0.4) {
    const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, len2 = Math.min(16, 0.5 + sp * 0.026) * size, a = k < 0.35 ? k / 0.35 : 1;
    if (len2 > 1.2) p.line(x - ux * len2, y - uy * len2, x - ux * len2 * 0.35, y - uy * len2 * 0.35, scale(c, 0.55), a);
    p.line(x - ux * len2 * 0.4, y - uy * len2 * 0.4, x, y, c, a);
    if (glow > 0) p.glow(x, y, 2.5 + size, c, glow * k);
  }
  function streak(p, x, y, vx, vy, c, a = 1, maxLen = 7, glow = 0.4) {
    const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp, L2 = clamp(sp / 30, 1, maxLen);
    for (let d = L2; d >= 0; d -= 0.5) p.dot(x - ux * d, y - uy * d, d < 1 ? WHITE : d < L2 * 0.5 ? c : scale(c, 0.6), (d < L2 * 0.5 ? 1 : 1.2 - d / L2) * a);
    if (glow > 0) p.glow(x, y, 4, c, glow * a);
  }
  function arc(r, x0, y0, x1, y1, { jag = 0.3, forks = 1, forkLen = 0.5 } = {}) {
    const L2 = Math.hypot(x1 - x0, y1 - y0), depth = Math.max(1, Math.min(5, Math.round(Math.log2(L2 / 1.5)))), main = bolt(r, x0, y0, x1, y1, { jag, depth });
    const out = [{ pts: main, w: 1 }];
    for (let k = 0; k < forks && main.length > 3; k++) {
      if (r.next() > 0.7) continue;
      const i = 1 + Math.floor(r.next() * (main.length - 2)), [x, y] = main[i], [px, py] = main[i - 1];
      const a = Math.atan2(y - py, x - px) + (r.next() < 0.5 ? -1 : 1) * (0.4 + r.next() * 0.6), l = L2 * forkLen * (0.4 + 0.6 * r.next()) * (1 - i / main.length);
      if (l > 1.5) out.push({ pts: bolt(r, x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, { jag: jag * 1.1, depth: Math.max(1, depth - 2) }), w: 0.55 });
    }
    return out;
  }
  function drawArc(p, paths, cols, k = 1, glowK = 0.5) {
    const steps = (fn) => {
      for (const path of paths)
        for (let i = 0; i < path.pts.length - 1; i++) {
          const [ax, ay] = path.pts[i], [bx, by] = path.pts[i + 1], l = Math.max(1, Math.hypot(bx - ax, by - ay));
          for (let d = 0; d <= l; d += 0.5) fn(ax + (bx - ax) * d / l, ay + (by - ay) * d / l, path, i, d === 0);
        }
    };
    if (k > 0.45) steps((x, y, path) => {
      if (path.w >= 1) for (const [dx, dy] of CROSS2) p.dot(x + dx * 1.5, y + dy * 1.5, cols.halo, (k - 0.45) * 1.6);
    });
    if (k > 0.25) steps((x, y, path) => {
      if (path.w > 0.4) p.dot(x + 1, y, cols.body), p.dot(x, y + 1, cols.body);
    });
    steps((x, y, path, i, first) => {
      p.px(x, y, path.w >= 1 && k > 0.3 ? cols.core : cols.body);
      if (first && i % 3 === 0) p.glow(x, y, (path.w >= 1 ? 9 : 5) * (0.5 + k * 0.5), cols.glow, glowK * k * path.w);
    });
  }
  function floorRing(p, cx, cy, r, sy, c, a = 1, keep = null) {
    if (r < 0.5) return;
    const fc = typeof c === "function", fa = typeof a === "function", ry = r * sy;
    p.shade(cx - r - 1, cy - ry - 1, cx + r + 1, cy + ry + 1, (x, y, o) => {
      const nx = (x - cx) / r, ny = (y - cy) / Math.max(0.3, ry), d = Math.hypot(nx, ny);
      if (d < 1e-6) return;
      const g = Math.hypot(nx / r, ny / Math.max(0.3, ry)) / d;
      if (Math.abs(d - 1) / g > 0.5) return;
      const ang = Math.atan2(ny, nx);
      if (keep && !keep(ang)) return;
      o.c = fc ? c(ang) : c;
      o.a = fa ? a(ang) : a;
    });
  }
  var GLYPHS = [
    [".#.", "#.#", ".#.", ".#.", "#.#"],
    ["#.#", "#.#", ".#.", "#.#", "#.#"],
    ["##.", "#.#", "##.", "#..", "#.."],
    ["#..", "#.#", "###", "#.#", "..#"],
    [".##", "#..", ".#.", "..#", "##."],
    ["###", ".#.", "###", ".#.", ".#."],
    ["#.#", "###", "#.#", "..#", "..#"],
    [".#.", ".##", ".#.", "##.", ".#."]
  ];
  function glyph(p, i, x, y, c, a = 1, under = 0) {
    const g = GLYPHS[(i % GLYPHS.length + GLYPHS.length) % GLYPHS.length], X = Math.round(x) - 1, Y = Math.round(y) - g.length + 1;
    if (under) p.sprite(g, {}, X, Y + 1, { tint: under, a });
    p.sprite(g, {}, X, Y, { tint: c, a });
  }
  var SIGILS = [
    ["..#..", ".#.#.", "#.#.#", "..#..", ".###.", "..#..", ".#.#."],
    ["#...#", ".#.#.", "..#..", ".###.", "..#..", ".#.#.", "#...#"],
    ["#....", "##...", "#.#..", "#..#.", "#.#..", "##...", "#...."],
    ["..#..", "#.#.#", ".###.", "..#..", "..#..", ".#.#.", "#...#"],
    ["#.#.#", "#.#.#", "#####", "..#..", "..#..", "..#..", ".###."],
    ["#...#", "##.##", "#.#.#", "#...#", "#.#.#", "##.##", "#...#"],
    ["..#..", ".#.#.", "#...#", ".#.#.", "..#..", "..#..", "..#.."],
    ["#..#.", "#.#..", "##...", "#....", "##...", "#.#..", "#..#."]
  ];
  function sigil(p, i, x, y, c, a = 1, edge = 0) {
    const g = SIGILS[(i % SIGILS.length + SIGILS.length) % SIGILS.length], X = Math.round(x) - 2, Y = Math.round(y) - 3;
    if (edge) for (const [dx, dy] of CROSS2) p.sprite(g, {}, X + dx, Y + dy, { tint: edge, a });
    p.sprite(g, {}, X, Y, { tint: c, a });
  }

  // fx/arcane/magic-circle-cast.js
  var R = 40;
  var R2 = 35;
  var RI = 24;
  var RR = 30;
  var SY = 0.3;
  var TOP = 192;
  var W = 11;
  var NRUNE = 8;
  var PEN = [0.04, 0.42];
  var PEN2 = [0.1, 0.48];
  var INNER = [0.3, 0.6];
  var STAR = [0.52, 0.88];
  var RUNES = [0.9, 1.3];
  var FLASH2 = 1.52;
  var BREAK = 2.42;
  var GONE = 3.45;
  var END = 3.9;
  var meta4 = {
    name: "Magic circle cast",
    desc: "A circle draws itself on the floor, runes ignite one by one, it flashes, and a column of light fires up and breaks apart into glints.",
    tags: ["arcane", "magic", "circle", "rune", "cast", "column", "summon", "ground", "one-shot"],
    size: [200, 220],
    origin: [100, 192],
    duration: END,
    loop: false,
    fps: 30,
    bg: "ground",
    options: { palette: PAL.arcane, seed: 6 }
  };
  var wrap = (a) => (a % TAU + TAU) % TAU;
  var fromFront = (g) => Math.abs(Math.atan2(Math.sin(g - Math.PI / 2), Math.cos(g - Math.PI / 2)));
  var outerAt = (g, w) => w[0] + fromFront(g) / Math.PI * (w[1] - w[0]);
  var innerAt = (g) => INNER[0] + wrap(g + Math.PI / 2) / TAU * (INNER[1] - INNER[0]);
  var runeAngle = (k) => -Math.PI / 2 + (k + 0.5) * TAU / NRUNE;
  var runeLit = (k) => RUNES[0] + k * (RUNES[1] - RUNES[0]) / (NRUNE - 1);
  var runeOut = (k) => BREAK + 0.2 + k * 0.08;
  function level(t) {
    if (t < RUNES[0]) return 0.55;
    if (t < FLASH2) return 0.55 + 0.4 * smooth(RUNES[0], FLASH2, t);
    if (t < FLASH2 + 0.07) return 1.2;
    if (t < BREAK) return 0.92;
    return 0.92 * (1 - smooth(BREAK, GONE, t));
  }
  function create4(o) {
    const C = fit(o.palette, 8), S = o.seed, Rg = new Rng(S);
    const ps = new Particles({ rng: Rg, ground: () => 0, sparks: [WHITE, C[6], C[5], C[4]] }), lights = new Lights();
    const COL = [WHITE, C[6], C[5], C[4], C[3]];
    const strands = Array.from({ length: 9 }, () => ({ o: Rg.range(-0.85, 0.85), w: Rg.range(0.04, 0.1), f: Rg.range(1, 3) }));
    const tri = (a0) => [0, 1, 2].map((k) => a0 + k * TAU / 3).map((a) => [Math.cos(a) * RI, Math.sin(a) * RI]);
    const A = tri(-Math.PI / 2), Bt = tri(Math.PI / 2), edges2 = [];
    for (let k = 0; k < 3; k++)
      for (const T2 of [A, Bt]) edges2.push({ p0: T2[k], p1: T2[(k + 1) % 3], t0: STAR[0] + k * (STAR[1] - STAR[0]) / 3, dur: (STAR[1] - STAR[0]) / 3 });
    let t = 0, flashed = false, broke = false;
    const out = new Array(NRUNE).fill(false);
    const lineCol = (lvl, age) => age < 0.05 ? WHITE : age < 0.16 ? C[6] : lvl > 1 ? WHITE : lvl > 0.8 ? C[6] : lvl > 0.45 ? C[5] : lvl > 0.28 ? C[4] : C[3];
    const lineA = (lvl) => clamp(lvl / 0.3);
    function planeLine(p, p0, p1, t0, dur, lvl, far) {
      const s = clamp((t - t0) / dur);
      if (s <= 0) return;
      let u0 = 0, u1 = s;
      const v0 = p0[1], v1 = p1[1];
      if (v0 < 0 !== v1 < 0) {
        const uc = v0 / (v0 - v1);
        if (v0 < 0 === far) u1 = Math.min(u1, uc);
        else u0 = uc;
      } else if (v0 < 0 !== far) return;
      if (u1 <= u0) return;
      const P2 = (u) => [p0[0] + (p1[0] - p0[0]) * u, (v0 + (v1 - v0) * u) * SY];
      const [xa, ya] = P2(u0), [xb, yb] = P2(u1);
      p.line(xa, ya, xb, yb, (q) => lineCol(lvl, t - (t0 + (u0 + (u1 - u0) * q) * dur)), lineA(lvl));
    }
    function circle2(p, far) {
      if (t >= GONE) return;
      const lvl = level(t), keep = far ? (g) => Math.sin(g) < 0 : (g) => Math.sin(g) >= 0, a = lineA(lvl);
      const ring = (r, when, chase2) => floorRing(p, 0, 0, r, SY, (g) => chase2 && chase2(g) ? WHITE : lineCol(lvl, t - when(g)), (g) => t < when(g) ? 0 : a, keep);
      const run = t > RUNES[0] && t < BREAK ? (t - RUNES[0]) * 5 + (t - RUNES[0]) ** 2 * 4 : null;
      const chase = run === null ? null : (g) => [0, Math.PI].some((o2) => Math.abs(Math.atan2(Math.sin(g - run - o2), Math.cos(g - run - o2))) < 0.22);
      ring(R, (g) => outerAt(g, PEN), chase);
      ring(R2, (g) => outerAt(g, PEN2));
      ring(RI, innerAt);
      for (let j = 0; j < 32; j++) {
        const g = (j + 0.5) * TAU / 32;
        if (Math.sin(g) < 0 !== far) continue;
        const when = outerAt(g, PEN2) + 0.03;
        if (t < when) continue;
        p.line(Math.cos(g) * R2, Math.sin(g) * R2 * SY, Math.cos(g) * R, Math.sin(g) * R * SY, lineCol(lvl, t - when), a * (j % 2 ? 0.6 : 1));
      }
      for (const e of edges2) planeLine(p, e.p0, e.p1, e.t0, e.dur, lvl, far);
    }
    function runes(p, far) {
      for (let k = 0; k < NRUNE; k++) {
        const g = runeAngle(k);
        if (Math.sin(g) < 0 !== far) continue;
        const x = Math.cos(g) * RR, y0 = Math.sin(g) * RR * SY, lit = t - runeLit(k), gone = clamp((t - runeOut(k)) / 0.25);
        if (t < innerAt(g) || gone >= 1) continue;
        if (lit < 0) {
          glyph(p, k, x, y0 - 1, C[3]);
          continue;
        }
        const rise = 3 * ease.outBack(clamp(lit / 0.2), 2.4), bob = lit > 0.2 ? Math.sin(t * 5 + k) * 0.5 : 0, y = y0 - 1 - rise + bob;
        const hot = lit < 0.07 || t > FLASH2 && t < FLASH2 + 0.07, lvl = level(t);
        glyph(p, k, x, y, hot ? WHITE : lvl > 0.8 ? WHITE : C[6], 1 - gone, hot ? C[6] : C[4]);
        if (lit < 0.1) sparkle(p, x, y - 2, 4 * (1 - lit / 0.1) + 1, C[6], C[5], 0.5);
        p.glow(x, y - 2, 8, C[5], (0.3 + 0.3 * lvl) * (1 - gone));
        p.glow(x, y0, 6, C[4], 0.2 * (1 - gone));
      }
    }
    function column2(p) {
      if (t < FLASH2 - 0.22 || t > BREAK + 0.6) return;
      if (t < FLASH2) {
        const a = smooth(FLASH2 - 0.22, FLASH2 - 0.04, t), top2 = -(TOP - 10) * ease.outCubic(a);
        for (let y = -1; y >= top2; y--) p.dot(0, y, y > top2 + 6 ? C[6] : WHITE, a * (0.35 + 0.65 * (1 + y / TOP)));
        p.glow(0, top2, 9, C[6], 0.5 * a);
        p.glow(0, -6, 24, C[5], 0.4 * a);
        return;
      }
      const u = t - FLASH2, brk = clamp((t - BREAK) / 0.45), top = -TOP * ease.outExpo(clamp(u / 0.09));
      const w = t < BREAK ? W * (1 + 0.38 * Math.exp(-u * 9)) : W * (1 - ease.outCubic(brk) * 0.85);
      const fade = 1 - smooth(BREAK + 0.25, BREAK + 0.55, t), white = u < 0.067;
      if (fade <= 0) return;
      for (let y = 3; y >= Math.ceil(top); y--) {
        const h = -y, ww = w * (1 + 0.5 * Math.exp(-Math.max(0, h) / 6)), pulse2 = fract(h * 0.022 - u * 2.6) < 0.07 ? 1 : 0;
        for (let x = Math.floor(-ww * 1.3); x <= Math.ceil(ww * 1.3); x++) {
          const q = Math.abs(x + 0.5) / ww;
          if (brk > 0 && noise2(x * 0.32, h * 0.11 - (t - BREAK) * 6, S) * 0.5 + 0.5 < brk * 1.25 - 0.1) continue;
          let lv = q < 0.2 ? 0 : q < 0.42 ? 1 : q < 0.66 ? 2 : q < 0.88 ? 3 : 4;
          for (const s of strands) if (Math.abs((x + 0.5) / ww - s.o - 0.05 * Math.sin(t * s.f + s.o * 9)) < s.w) lv = Math.max(0, lv - 1);
          lv = white ? 0 : Math.max(0, lv - pulse2);
          const a = (q < 0.88 ? 1 : (1.3 - q) / 0.42) * fade;
          if (a <= bayer(x, y) * (q < 0.66 ? 0.2 : 1)) continue;
          p.px(x, y, COL[lv]);
        }
        if ((h & 7) === 0 && h < TOP - ww * 2.4 - 8) p.glow(0, y, ww * 2.4 + 6, C[5], 0.3 * fade);
      }
      for (let i = 0; i < 6; i++) {
        const k = (t - (FLASH2 + 0.08 + i * 0.16)) / 0.8;
        if (k < 0 || k > 1) continue;
        const rx = w * 1.4 * (1 + k * 0.35), ry = rx * 0.3, yc = -3 - ease.outQuad(k) * 120, n = Math.ceil(rx * 7);
        for (let j = 0; j < n; j++) {
          const g = j / n * TAU;
          p.dot(Math.cos(g) * rx, yc + Math.sin(g) * ry, k < 0.3 ? WHITE : C[6], (1 - k) * fade * (Math.sin(g) < 0 ? 0.6 : 1));
        }
      }
      p.glow(0, -4, 34, C[6], 0.45 * fade);
      p.glow(0, -60, 70, C[4], 0.25 * fade);
    }
    function shock(p, far) {
      for (const [d, r0, r1, th, dur] of [[0, R * 0.6, R * 2, 6, 0.5], [0.08, R * 0.4, R * 1.4, 3, 0.4]]) {
        const k = (t - FLASH2 - d) / dur;
        if (k < 0 || k >= 1) continue;
        band(p, 0, 0, r0 + (r1 - r0) * ease.outCubic(k), SY, Math.max(1, th * (1 - k)), 1.15 - k, [C[3], C[5], C[6], WHITE], (g) => Math.sin(g) < 0 === far, k < 0.2);
      }
    }
    return {
      update(dt) {
        t += dt;
        if (t > PEN[0] && t < STAR[1] && Rg.chance(0.5)) {
          let x, y;
          if (t < PEN[1]) {
            const g = Math.PI / 2 + Rg.sign() * ((t - PEN[0]) / (PEN[1] - PEN[0])) * Math.PI;
            x = Math.cos(g) * R, y = Math.sin(g) * R * SY;
          } else if (t < INNER[1]) {
            const g = -Math.PI / 2 + (t - INNER[0]) / (INNER[1] - INNER[0]) * TAU;
            x = Math.cos(g) * RI, y = Math.sin(g) * RI * SY;
          } else {
            const e = Rg.pick(edges2.filter((e2) => t >= e2.t0 && t < e2.t0 + e2.dur)) ?? edges2[0], s = clamp((t - e.t0) / e.dur);
            x = e.p0[0] + (e.p1[0] - e.p0[0]) * s, y = (e.p0[1] + (e.p1[1] - e.p0[1]) * s) * SY;
          }
          ps.spawn(P.EMBER, x, y - 1, Rg.range(-12, 12), Rg.range(-30, -8), Rg.range(0.25, 0.55), C[6], 1);
        }
        if (t > RUNES[1] - 0.1 && t < FLASH2 - 0.05 && Rg.chance(0.7)) {
          const g = Rg.range(0, TAU), D3 = Rg.range(R * 0.7, R * 1.1), T2 = Rg.range(0.16, 0.24), v = D3 * 3 / (Math.exp(3 * T2) - 1);
          const x = Math.cos(g) * D3, y = Math.sin(g) * D3 * SY - 1, l = Math.hypot(x, y + 2) || 1;
          ps.spawn(P.STREAK, x, y, -x / l * v, (-2 - y) / l * v, T2, Rg.chance(0.5) ? C[6] : C[5]);
        }
        if (!flashed && t >= FLASH2) {
          flashed = true;
          lights.add(0, -56, 104, C[5], 0.9, 0.6);
          lights.add(0, -5, 36, WHITE, 0.8, 0.14);
          for (let i = 0; i < 36; i++) {
            const s = Rg.sign(), sp = Rg.range(80, 175);
            ps.spawn(P.SPARK, s * Rg.range(0, R * 0.5), -1, s * sp, -Rg.range(30, 180), Rg.range(0.25, 0.7));
          }
          for (let i = 0; i < 26; i++)
            ps.spawn(P.STAR, Rg.range(-R, R), -Rg.range(1, 6), Rg.range(-20, 20), -Rg.range(40, 130), Rg.range(0.5, 1.1), Rg.pick([WHITE, C[6], C[5]]), Rg.range(0.8, 2.3));
          for (let i = 0; i < 34; i++) {
            const s = Rg.sign();
            ps.spawn(P.STAR, s * Rg.range(0, 14), -Rg.range(1, 4), s * Rg.range(50, 140), -Rg.range(10, 90), Rg.range(0.4, 0.95), Rg.pick([WHITE, C[6], C[6], C[5]]), Rg.range(0.7, 2.2));
          }
        }
        if (t > RUNES[0] && t < BREAK + 0.2 && Rg.chance(0.12)) {
          const g = Rg.range(0, TAU), r = Rg.pick([R, R2, RI]);
          ps.spawn(P.STAR, Math.cos(g) * r, Math.sin(g) * r * SY - 0.5, 0, -Rg.range(2, 8), Rg.range(0.25, 0.45), Rg.pick([WHITE, C[6]]), Rg.range(0.8, 2));
        }
        if (t > FLASH2 && t < BREAK) {
          if (Rg.chance(0.5)) ps.spawn(P.STAR, Rg.range(-1, 1) * W * 1.5, -Rg.range(0, 120), Rg.range(-10, 10), -Rg.range(30, 85), Rg.range(0.5, 1.1), Rg.pick([WHITE, C[6], C[5]]), Rg.range(0.7, 2));
          if (Rg.chance(0.35)) ps.spawn(P.MOTE, Rg.range(-1, 1) * W * 0.8, -Rg.range(0, 50), 0, -Rg.range(160, 300), Rg.range(0.2, 0.35), Rg.chance(0.5) ? WHITE : C[6], 0.8);
        }
        if (!broke && t >= BREAK) {
          broke = true;
          for (let i = 0; i < 46; i++)
            ps.spawn(P.STAR, Rg.range(-1, 1) * W * 0.9, -Rg.range(2, TOP * 0.8), Rg.range(-12, 12), -Rg.range(8, 40), Rg.range(0.5, 1.15), Rg.pick([WHITE, WHITE, C[6], C[5]]), Rg.range(0.6, 2.4));
        }
        if (t > BREAK && t < BREAK + 0.4 && Rg.chance(0.8)) {
          ps.spawn(P.STAR, Rg.range(-1, 1) * W * 0.7, -Rg.range(2, TOP * 0.78), Rg.range(-8, 8), -Rg.range(10, 50), Rg.range(0.4, 0.9), Rg.pick([WHITE, C[6], C[5]]), Rg.range(0.6, 1.8));
          if (Rg.chance(0.4)) ps.spawn(P.MOTE, Rg.range(-1, 1) * W * 0.5, -Rg.range(2, TOP * 0.7), 0, -Rg.range(60, 140), Rg.range(0.2, 0.4), C[6], 0.7);
        }
        for (let k = 0; k < NRUNE; k++)
          if (!out[k] && t >= runeOut(k)) {
            out[k] = true;
            const g = runeAngle(k), x = Math.cos(g) * RR, y = Math.sin(g) * RR * SY - 5;
            for (let i = 0; i < 4; i++) ps.spawn(P.STAR, x + Rg.range(-2, 2), y + Rg.range(-2, 2), Rg.range(-14, 14), -Rg.range(10, 40), Rg.range(0.3, 0.55), Rg.pick([WHITE, C[6]]), Rg.range(0.6, 1.6));
          }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        const lvl = level(t);
        if (t < GONE) {
          const k = lvl * smooth(PEN[0], PEN[1] + 0.2, t);
          p.glow(0, 0, R * 1.3, C[4], 0.28 * k);
          for (const s of [-1, 1]) p.glow(s * R * 0.6, 1, R * 0.7, C[5], 0.12 * k);
        }
        shock(p, true);
        circle2(p, true);
        runes(p, true);
        column2(p);
        ps.draw(p, "back");
      },
      draw(p) {
        shock(p, false);
        circle2(p, false);
        runes(p, false);
        const pen = (x, y) => {
          sparkle(p, x, y, 2, C[6], C[5], 0.5);
          p.glow(x, y, 7, C[6], 0.45);
        };
        if (t > PEN[0] && t < PEN[1]) for (const s of [-1, 1]) {
          const g = Math.PI / 2 + s * ((t - PEN[0]) / (PEN[1] - PEN[0])) * Math.PI;
          pen(Math.cos(g) * R, Math.sin(g) * R * SY);
        }
        if (t > INNER[0] && t < INNER[1]) {
          const g = -Math.PI / 2 + (t - INNER[0]) / (INNER[1] - INNER[0]) * TAU;
          pen(Math.cos(g) * RI, Math.sin(g) * RI * SY);
        }
        for (const e of edges2)
          if (t > e.t0 && t < e.t0 + e.dur) {
            const s = (t - e.t0) / e.dur;
            pen(e.p0[0] + (e.p1[0] - e.p0[0]) * s, (e.p0[1] + (e.p1[1] - e.p0[1]) * s) * SY);
          }
        if (t >= FLASH2 && t < FLASH2 + 0.24) {
          const a = (t - FLASH2) / 0.24;
          flare(p, 0, -8, 34 * Math.pow(1 - a, 1.5), 1 - a, C);
          p.glow(0, -26, 56, WHITE, 0.5 * (1 - a));
        }
        ps.draw(p, "front");
        lights.draw(p);
      }
    };
  }

  // fx/arcane/mana-burst.js
  var mana_burst_exports = {};
  __export(mana_burst_exports, {
    create: () => create5,
    meta: () => meta5
  });
  var CY2 = -28;
  var GATHER = 0.22;
  var N = 9;
  var meta5 = {
    name: "Mana burst",
    desc: "Energy rushes into a point and blows out in a white flash and rings, flinging glowing runes that flare and pop into sparks one after another.",
    tags: ["arcane", "burst", "mana", "rune", "nova", "magic", "ground", "one-shot"],
    size: [208, 150],
    origin: [104, 124],
    duration: 1.8,
    loop: false,
    fps: 30,
    bg: "ground",
    options: { palette: PAL.arcane, seed: 9 }
  };
  function create5(o) {
    const C = fit(o.palette, 8), R4 = new Rng(o.seed);
    const ps = new Particles({ rng: R4, ground: () => 0, sparks: [WHITE, C[6], C[5], C[4]] }), lights = new Lights();
    const runes = Array.from({ length: N }, (_, i) => {
      const a = i / N * TAU + R4.range(-0.25, 0.25) - Math.PI / 2, sp = R4.range(150, 210);
      return { g: i, x: 0, y: CY2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (Math.sin(a) > 0 ? 0.42 : 0.85), pop: GATHER + 0.42 + i * 0.065 + R4.range(0, 0.05), popped: false, ph: R4.range(0, TAU) };
    });
    const pops = [];
    let t = 0, released = false;
    return {
      update(dt) {
        t += dt;
        if (t < GATHER - 0.03) {
          for (let i = 0; i < 2; i++) {
            const a = R4.range(0, TAU), D3 = R4.range(24, 52), T2 = R4.range(0.12, 0.18), v = D3 * 3 / (Math.exp(3 * T2) - 1);
            const x = Math.cos(a) * D3, y = Math.min(-2, CY2 + Math.sin(a) * D3 * 0.85), l = Math.hypot(x, y - CY2) || 1;
            ps.spawn(P.STREAK, x, y, -x / l * v, (CY2 - y) / l * v, T2, R4.chance(0.5) ? C[6] : C[5]);
          }
        }
        if (t >= GATHER && !released) {
          released = true;
          lights.add(0, CY2 - 12, 96, C[5], 1, 0.5);
          lights.add(0, CY2, 40, WHITE, 0.9, 0.1);
          for (let i = 0; i < 96; i++) {
            const a = R4.range(0, TAU), sp = R4.range(100, 250), dn = Math.sin(a) > 0 ? 0.45 : 1;
            ps.spawn(R4.chance(0.65) ? P.MOTE : P.STAR, 0, CY2, Math.cos(a) * sp, Math.sin(a) * sp * dn, R4.range(0.25, 0.55), R4.pick([WHITE, C[6], C[5]]), R4.range(0.8, 1.8));
          }
          for (let i = 0; i < 20; i++) {
            const a = R4.range(0, TAU), sp = R4.range(130, 280);
            ps.spawn(P.SPARK, 0, CY2, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.2, 0.45));
          }
        }
        if (released)
          for (const r of runes) {
            if (r.popped) continue;
            r.vx -= r.vx * 4.2 * dt;
            r.vy -= r.vy * 4.2 * dt + 8 * dt;
            r.x += r.vx * dt;
            r.y += r.vy * dt;
            if (R4.chance(0.35)) ps.spawn(P.MOTE, r.x + R4.range(-1.5, 1.5), r.y, r.vx * 0.2 + R4.range(-10, 10), r.vy * 0.2 - R4.range(5, 25), R4.range(0.2, 0.4), C[5], 0.5);
            if (t >= r.pop) {
              r.popped = true;
              pops.push({ t, x: r.x, y: r.y });
              lights.add(r.x, r.y, 34, C[5], 0.9, 0.22);
              lights.add(r.x, r.y, 12, WHITE, 0.8, 0.06);
              for (let i = 0; i < 9; i++) {
                const a = R4.range(0, TAU), sp = R4.range(70, 200);
                ps.spawn(P.SPARK, r.x, r.y, Math.cos(a) * sp, Math.sin(a) * sp - 40, R4.range(0.15, 0.4));
              }
              for (let i = 0; i < 5; i++) {
                const a = R4.range(0, TAU), sp = R4.range(20, 80);
                ps.spawn(i % 2 ? P.STAR : P.MOTE, r.x, r.y, Math.cos(a) * sp, Math.sin(a) * sp - 20, R4.range(0.3, 0.6), R4.pick([WHITE, C[6]]), R4.range(0.8, 1.6));
              }
            }
          }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        const k = t < GATHER ? 0.4 * (t / GATHER) : Math.max(0, 1 - (t - GATHER) / 1.1);
        if (k > 0) p.glow(0, -1, 50, C[4], 0.3 * k);
      },
      draw(p) {
        if (t < GATHER) {
          const k = t / GATHER, r = 1 + 3.5 * k * k;
          p.circle(0, CY2, r + 1.2, C[4]);
          p.circle(0, CY2, r, C[6]);
          p.circle(0, CY2, r * 0.5, WHITE);
          p.glow(0, CY2, 10 + 20 * k, C[5], 0.4 + 0.4 * k);
          const q = clamp((t - GATHER * 0.35) / (GATHER * 0.65));
          if (q > 0 && q < 1) p.ring(0, CY2, r + 2 + 16 * (1 - ease.outCubic(q)), 1, q > 0.6 ? WHITE : C[6], 1 - q * 0.5);
        } else {
          const q = (t - GATHER) / 0.6;
          if (q < 1) {
            const e = ease.outCubic(q);
            if (q < 0.12) {
              p.circle(0, CY2, 12 * (1 - q / 0.12) + 2, C[5]);
              p.circle(0, CY2, 12 * (1 - q / 0.12), WHITE);
            }
            if (q < 0.32) flare(p, 0, CY2, 30 * (1 - q / 0.32) + 4, 1 - q / 0.32, C);
            p.ring(0, CY2, 4 + 62 * e, Math.max(1, 5 * (1 - q)), q < 0.2 ? WHITE : C[6], (v, ang) => CY2 + Math.sin(ang) * (4 + 62 * e) > 0 ? 0 : 1.2 - q);
            p.ring(0, CY2, 2 + 38 * ease.outCubic(Math.min(1, q * 1.4)), Math.max(1, 2 * (1 - q)), C[5], (v, ang) => CY2 + Math.sin(ang) * 40 > 0 ? 0 : 1 - q);
            p.glow(0, CY2, 60 * (0.4 + 0.6 * e), C[5], 0.9 * (1 - q));
          }
        }
        for (const r of runes) {
          if (!released || r.popped) continue;
          const left = r.pop - t, hot = t - GATHER < 0.08 || left < 0.06, bob = Math.sin(t * 9 + r.ph) * 0.6;
          sigil(p, r.g, r.x, r.y + bob, hot ? WHITE : C[6], 1, hot ? C[4] : C[3]);
          p.glow(r.x, r.y + bob, 10, C[5], hot ? 0.7 : 0.35);
          if (left < 0.06) sparkle(p, r.x, r.y + bob, 3 + 4 * (1 - left / 0.06), C[6], C[5], 0.5);
        }
        for (const q of pops) {
          const k = (t - q.t) / 0.32;
          if (k >= 1) continue;
          if (k < 0.35) flare(p, q.x, q.y, 11 * (1 - k / 0.35) + 2, 1 - k / 0.35, C);
          p.ring(q.x, q.y, 2 + 11 * ease.outCubic(k), Math.max(1, 2 * (1 - k)), k < 0.3 ? WHITE : C[6], 1.15 - k);
        }
        ps.draw(p);
        lights.draw(p);
      }
    };
  }

  // fx/arcane/rune-circle.js
  var rune_circle_exports = {};
  __export(rune_circle_exports, {
    draw: () => draw,
    drawBack: () => drawBack,
    meta: () => meta6
  });
  var D = 4;
  var R3 = 46;
  var RR2 = 39;
  var RI2 = 23;
  var RC = 7;
  var SY2 = 0.3;
  var NR = 12;
  var meta6 = {
    name: "Rune circle",
    desc: "A rune circle turns on the floor in perspective: a carousel of runes lit by chasing light, a turning square, ticks, motes rising off it.",
    tags: ["arcane", "rune", "circle", "magic", "aura", "ground", "loop"],
    size: [136, 100],
    origin: [68, 80],
    duration: D,
    loop: true,
    fps: 30,
    bg: "ground",
    options: { palette: PAL.arcane, seed: 8 }
  };
  var at = (g, r) => [Math.cos(g) * r, Math.sin(g) * r * SY2];
  var gap = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  function circle(p, C, t, far) {
    const ph = t / D, spin = ph * TAU / 4, keep = far ? (g) => Math.sin(g) < 0 : (g) => Math.sin(g) >= 0;
    const chase = ph * TAU * 2, lit = (g, w) => gap(g, chase) < w || gap(g, chase + Math.PI) < w;
    const tone = (g, hi, lo) => Math.sin(g) < 0 ? lo : hi;
    floorRing(p, 0, 0, R3, SY2, (g) => lit(g, 0.22) ? WHITE : lit(g, 0.5) ? C[6] : tone(g, C[6], C[5]), 1, keep);
    floorRing(p, 0, 0, RI2, SY2, (g) => tone(g, C[5], C[4]), 1, keep);
    floorRing(p, 0, 0, RC, SY2, (g) => tone(g, C[6], C[5]), 1, keep);
    for (let j = 0; j < 16; j++) {
      const g = spin + (j + 0.5) * TAU / 16;
      if (Math.sin(g) < 0 !== far) continue;
      const [x, y] = at(g, R3 + 3.5), hot = lit(g, 0.3);
      p.px(x, y, hot ? WHITE : tone(g, j % 2 ? C[5] : C[6], C[4]));
      if (j % 2 === 0) for (const [dx, dy] of [[1, 0], [-1, 0]]) p.px(x + dx, y + dy, hot ? C[6] : tone(g, C[4], C[3]));
    }
    const pts = [0, 1, 2, 3].map((k) => at(-spin + k * TAU / 4 + Math.PI / 4, RI2));
    for (let k = 0; k < 4; k++) {
      let [ax, ay] = pts[k], [bx, by] = pts[(k + 1) % 4];
      if (ay < 0 !== by < 0) {
        const u = ay / (ay - by), mx = ax + (bx - ax) * u;
        if (ay < 0 === far) bx = mx, by = 0;
        else ax = mx, ay = 0;
      } else if (ay < 0 !== far) continue;
      p.line(ax, ay, bx, by, far ? C[4] : C[5]);
    }
    const gs = [...Array(NR).keys()].map((k) => [k, spin + (k + 0.5) * TAU / NR]).filter(([, g]) => Math.sin(g) < 0 === far);
    gs.sort((a, b) => Math.sin(a[1]) - Math.sin(b[1]));
    for (const [k, g] of gs) {
      const [x, y] = at(g, RR2), hot = lit(g, 0.2), bob = Math.sin(ph * TAU * 4 + 4 * g) * 0.5;
      glyph(p, [0, 3, 5][k % 3], x, y - 1 + bob, hot ? WHITE : far ? C[5] : C[6], 1, hot ? C[5] : far ? C[2] : C[3]);
      p.glow(x, y - 3, hot ? 10 : 6, C[5], hot ? 0.5 : far ? 0.12 : 0.22);
      p.glow(x, y, 5, C[4], 0.15);
    }
  }
  function motes(p, C, t, S, far) {
    cycle(t, D, 76, S * 5 + 1, (g) => g.range(1.1, 1.9), (age, life, r) => {
      const g0 = r.range(0, TAU), r0 = r.pick([R3, R3, RR2, RR2, RI2]), q = age / life, g = g0 + q * r.range(0.6, 1.4);
      if (Math.sin(g) < 0 !== far) return;
      const rr = r0 * (1 - 0.35 * q), h = 2 + ease.outQuad(q) * r.range(26, 52), x = Math.cos(g) * rr, y = Math.sin(g) * rr * SY2 - h;
      const a = Math.min(1, q * 5) * (1 - smooth(0.65, 1, q)), big = r.chance(0.2);
      mote(p, x, y, -Math.sin(g) * rr * 0.8, -36 * (1 - q) - 10, r.chance(0.3) ? WHITE : r.chance(0.6) ? C[6] : C[5], big ? 1.1 : r.range(0.55, 0.9), a, big ? 0.5 : 0.3);
    });
    cycle(t, D, 14, S * 5 + 2, 0.45, (age, life, r) => {
      const g = r.range(0, TAU);
      if (Math.sin(g) < 0 !== far) return;
      const rr = r.range(8, R3), x = Math.cos(g) * rr, y = Math.sin(g) * rr * SY2 - r.range(6, 34), k = Math.sin(age / life * Math.PI);
      sparkle(p, x, y, 1 + 2.4 * k, C[6], C[5], 0.35 * k);
    });
  }
  function drawBack(p, t, o) {
    const C = fit(o.palette, 8), pulse2 = 0.85 + 0.15 * Math.sin(t / D * TAU * 4);
    p.glow(0, 0, R3 * 1.4, C[4], 0.24 * pulse2);
    for (const s of [-1, 1]) p.glow(s * R3 * 0.55, 1, R3 * 0.7, C[5], 0.12 * pulse2);
    for (let h = 0; h < 66; h += 6) p.glow(0, -h, 26, C[4], 0.11 * pulse2 * (1 - h / 80));
    circle(p, C, t, true);
    motes(p, C, t, o.seed, true);
  }
  function draw(p, t, o) {
    const C = fit(o.palette, 8), chase = t / D * TAU * 2;
    circle(p, C, t, false);
    motes(p, C, t, o.seed, false);
    for (const g of [chase, chase + Math.PI]) {
      const [x, y] = at(g, R3);
      sparkle(p, x, y, 2.5 + Math.sin(t * 30) * 0.8, C[6], C[5], 0.5);
      p.glow(x, y, 14, C[5], 0.4);
    }
  }

  // fx/arcane/spell-charge.js
  var spell_charge_exports = {};
  __export(spell_charge_exports, {
    act: () => act3,
    draw: () => draw2,
    meta: () => meta7
  });
  var D2 = 1.6;
  var HX = 15;
  var HY = -22;
  var RINGS2 = 4;
  var RT = 0.5;
  var meta7 = {
    name: "Spell charge",
    desc: "Energy gathers in the caster's hand: streaks and motes spiral in, rings collapse into a swelling orb that crackles with arcs, ready to fire.",
    tags: ["arcane", "charge", "spell", "orb", "cast", "magic", "loop"],
    size: [120, 86],
    origin: [44, 80],
    duration: D2,
    loop: true,
    fps: 30,
    bg: "ground",
    actor: 2,
    options: { palette: PAL.arcane, seed: 5 }
  };
  var HOLD2 = { ...READY, x: -3, crouch: 4, lean: 2, fx: 18, fy: -22, bx: 11, by: -17, ffx: 10, fbx: -8 };
  var act3 = {
    poses: [
      [-0.46, { ...READY, x: -3 }],
      [-0.12, { ...HOLD2, crouch: 3 }],
      [0, HOLD2],
      [0.4, { ...HOLD2, crouch: 5 }],
      [0.8, { ...HOLD2, lean: 3 }],
      [1.2, { ...HOLD2, crouch: 5 }],
      [1.6, HOLD2]
    ]
  };
  var landings = Array.from({ length: RINGS2 }, (_, k) => k * D2 / RINGS2 + RT);
  var sinceLast = (t) => Math.min(...landings.map((l) => ((t - l) % D2 + D2) % D2));
  function orb(p, C, x, y, r, t, ph) {
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU + ph * (TAU / 8) * 3, l = (1.5 + 4.5 * Math.abs(loopNoise(ph, 3, i * 7 + 1))) * (i % 2 ? 0.7 : 1);
      const x0 = x + Math.cos(a) * (r + 1.2), y0 = y + Math.sin(a) * (r + 1.2);
      p.line(x0, y0, x0 + Math.cos(a) * l, y0 + Math.sin(a) * l, (u) => u < 0.4 ? C[6] : i % 2 ? C[4] : C[5], (u) => u < 0.6 ? 1 : 1.6 - u);
    }
    p.circle(x, y, r + 1.3, C[4]);
    p.circle(x, y, r + 0.3, C[5]);
    p.circle(x - r * 0.12, y - r * 0.12, r * 0.8, C[6]);
    p.circle(x, y, r * 0.5, WHITE);
    const R4 = rng(Math.floor(t * 15), 77);
    for (let i = 0; i < 3; i++) {
      const a = R4.range(0, TAU), pts = arc(R4, x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.4, x + Math.cos(a + R4.range(-0.6, 0.6)) * (r + 0.6), y + Math.sin(a + R4.range(-0.6, 0.6)) * (r + 0.6), { jag: 0.45, forks: 0 })[0].pts;
      p.polyline(pts, (u) => u < 0.6 ? WHITE : C[6]);
    }
    p.px(x - r * 0.5, y - r * 0.62, WHITE);
  }
  function ringAt(p, C, x, y, rr, sy, rot, q) {
    const n = Math.ceil(rr * TAU * 1.4), c = Math.cos(rot), s = Math.sin(rot);
    const col = q > 0.85 ? WHITE : q > 0.55 ? C[6] : C[5], a = Math.min(1, q * 3);
    for (let j = 0; j < n; j++) {
      const g = j / n * TAU, lx = Math.cos(g) * rr, ly = Math.sin(g) * rr * sy, px = x + lx * c - ly * s, py = y + lx * s + ly * c;
      if (py > -0.5) continue;
      p.dot(px, py, col, a);
      if (j % 10 === 0) p.glow(px, py, 5, C[5], 0.12 * a);
    }
  }
  function draw2(p, t, o) {
    const C = fit(o.palette, 8), ph = t / D2, S = o.seed, f = Math.floor(t * 30);
    const since = sinceLast(t), swell = Math.exp(-((since / 0.07) ** 2)) + 0.5 * Math.exp(-((since / 0.18) ** 2));
    const r = 6.1 + 0.5 * Math.sin(ph * TAU * 4) + 1.4 * swell;
    const jit = swell > 0.4 ? f % 2 ? 1 : -1 : 0, x = HX + jit, y = HY;
    cycle(t, D2, 110, S * 3 + 1, (g) => g.range(0.2, 0.34), (age, life, R4) => {
      const a0 = R4.range(2.8, 5.75), d0 = R4.range(20, 52), spin = R4.range(0.6, 1.3);
      const pos = (q2) => {
        const a = a0 + spin * q2 * q2, d = d0 * (1 - q2 * q2) + r;
        return [HX + Math.cos(a) * d, HY + Math.sin(a) * d * 0.92];
      };
      const q = age / life, [px, py] = pos(q), [qx, qy] = pos(Math.min(1, q + 0.02));
      streak(p, px, py, (qx - px) / (0.02 * life), (qy - py) / (0.02 * life), R4.chance(0.55) ? C[6] : C[5], Math.min(1, q * 4) * (1 - smooth(0.9, 1, q)), 7, 0.4 * (1 - smooth(0.6, 0.9, q)));
    });
    cycle(t, D2, 56, S * 3 + 2, (g) => g.range(0.4, 0.7), (age, life, R4) => {
      const a0 = R4.range(2.6, 5.2), d0 = R4.range(12, 32), spin = R4.range(1, 2.2), size = R4.range(0.6, 1);
      const pos = (q2) => {
        const a = a0 + spin * q2, d = d0 * (1 - ease.inQuad(q2)) + r;
        return [HX + Math.cos(a) * d, HY + Math.sin(a) * d];
      };
      const q = age / life, [px, py] = pos(q), [qx, qy] = pos(Math.min(1, q + 0.02));
      mote(p, px, py, (qx - px) / (0.02 * life), (qy - py) / (0.02 * life), R4.pick([C[5], C[6], C[6], WHITE]), size, Math.min(1, q * 3) * (q > 0.9 ? (1 - q) / 0.1 : 1), 0.3 * (1 - smooth(0.55, 0.85, q)));
    });
    for (let k = 0; k < RINGS2; k++)
      for (const off of [-D2, 0]) {
        const q = (t - k * D2 / RINGS2 - off) / RT;
        if (q < 0 || q >= 1) continue;
        const rr = r + 1.5 + 22 * (1 - ease.inQuad(q)), shape = [[1, 0], [0.38, 0.55], [1, 0], [0.42, -0.7]][k];
        ringAt(p, C, x, y, rr, shape[0], shape[1], q);
      }
    orb(p, C, x, y, r, t, ph);
    const w = Math.floor(f / 2), Rw = rng(S, w, 3), n = (Rw.next() < 0.6 ? 1 : 0) + (swell > 0.3 ? 1 : 0), fresh = f % 2 === 0 ? 0.8 : 0.4;
    for (let i = 0; i < n; i++) {
      const a = Rw.range(0, TAU), L2 = Rw.range(5, 10) * (1 + swell * 0.4), a1 = a + Rw.range(-0.5, 0.5);
      const x0 = x + Math.cos(a) * (r + 0.5), y0 = y + Math.sin(a) * (r + 0.5), x1 = x0 + Math.cos(a1) * L2, y1 = Math.min(-2, y0 + Math.sin(a1) * L2);
      drawArc(p, arc(Rw, x0, y0, x1, y1, { jag: 0.35, forks: Rw.next() < 0.5 ? 1 : 0 }), { core: WHITE, body: C[5], halo: C[3], glow: C[5] }, fresh, 0.3);
    }
    cycle(t, D2, 7, S * 3 + 4, 0.22, (age, life, R4) => {
      const a = R4.range(0, TAU), d = R4.range(r + 5, r + 15), k = Math.sin(age / life * Math.PI);
      sparkle(p, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, 1 + 2.5 * k, C[6], C[4], 0.4 * k);
    });
    if (since < 0.07) sparkle(p, x, y, 4 + 6 * (1 - since / 0.07), C[6], C[5], 0.5);
    const pulse2 = 0.85 + 0.15 * Math.sin(ph * TAU * 4) + 0.2 * swell;
    p.glow(x, y, 46, C[4], 0.26 * pulse2);
    p.glowRing(x, y, r + 3, 8, C[5], 0.3 * pulse2);
    p.glow(x, y, r, C[6], 0.12);
    p.glow(HX, -1, 22, C[5], 0.16 * pulse2);
  }

  // fx/melee/sword-slash.js
  var sword_slash_exports = {};
  __export(sword_slash_exports, {
    act: () => act4,
    create: () => create6,
    meta: () => meta8
  });
  var meta8 = {
    name: "Sword slash",
    desc: "A tilted crescent whips round in two frames, cools from white to deep blue as it trails off, glints at the tip and throws sparks.",
    tags: ["melee", "slash", "sword", "combat", "directional", "one-shot"],
    size: [136, 104],
    origin: [44, 92],
    duration: 0.75,
    loop: false,
    fps: 30,
    bg: "ground",
    actor: 2,
    options: {
      palette: ["#212f6b", "#2c58aa", "#3a8bd8", "#62c8f4", "#b8c9e8", "#e8f1ff", "#ffffff"],
      sparks: ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"],
      radius: 42,
      seed: 2
    }
  };
  var GUARD = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
  var WIND = { ...GUARD, x: -8, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
  var CUT = { ...GUARD, x: 0, crouch: 2, lean: 3, fx: 16, fy: -37, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -10, ghost: 1 };
  var DOWN = { ...GUARD, x: 2, crouch: 5, lean: 5, fx: 20, fy: -21, sa: 0.62, bx: -9, by: -24, ffx: 13, fbx: -10, toeB: true };
  var act4 = {
    target: { x: 58 },
    poses: [
      [-0.55, { ...GUARD, x: -8 }],
      [-0.3, WIND],
      [-0.08, { ...WIND, crouch: 5, lean: -5 }],
      [0, CUT, "snap"],
      [0.06, DOWN, "snap"],
      [0.3, { ...DOWN, x: 3, crouch: 6 }],
      [0.58, { ...GUARD, x: 1, crouch: 3, fx: 15, fy: -21, sa: 0.1, bx: -5, by: -21, ffx: 9, fbx: -7 }],
      [0.86, { ...GUARD, x: -8 }]
    ],
    hits: [{ t: 0.06, stop: 0.14, shake: 0.18, amp: 2, push: 2.8, straw: 18 }],
    dust: [{ t: 0.06, x: 16, n: 7, dir: 1 }, { t: 0.06, x: -11, n: 4, dir: -1 }]
  };
  function onArc(s, r, a) {
    const lx = Math.cos(a) * r, ly = Math.sin(a) * r * s.sy, c = Math.cos(s.rot), n = Math.sin(s.rot);
    return [s.cx + lx * c - ly * n, s.cy + lx * n + ly * c];
  }
  function crescent(p, s, ta, L2, W3, age) {
    if (Math.abs(L2) < 0.02 || W3 < 0.3) return;
    const R4 = s.ramp, n = R4.length, dir = Math.sign(L2), span = Math.abs(L2), c = Math.cos(s.rot), sn = Math.sin(s.rot), B2 = s.R + 2;
    p.shade(s.cx - B2, s.cy - B2, s.cx + B2, s.cy + B2, (x, y, out) => {
      const dx = x - s.cx, dy = y - s.cy, lx = dx * c + dy * sn, ly = (-dx * sn + dy * c) / s.sy, r = Math.hypot(lx, ly);
      if (r > s.R + 0.5 || r < s.R - W3 - 1) return;
      let u = dir * (Math.atan2(ly, lx) - ta) % TAU;
      if (u < 0) u += TAU;
      if (u > span) return;
      const v = u / span, w = W3 * Math.pow(Math.sin(Math.PI * Math.pow(v, 2.2)), 0.6);
      if (w < 0.35) return;
      const q = (s.R - r) / w;
      if (q < 0 || q > 1) return;
      const ci = q < 0.22 && age < 0.5 ? 0 : Math.round(q * (n - 1) * 0.75 + age * 2.4 - v * 0.8 + 0.4);
      out.c = R4[n - 1 - clamp(ci, 0, n - 1)];
      out.a = Math.min(1, v / 0.4);
    });
    for (let u = 0; u <= span; u += 0.3) {
      const [x, y] = onArc(s, s.R - W3 * 0.4, ta + dir * u);
      p.glow(x, y, 5 + W3, R4[n - 3], 0.22 * (1 - age) * (u / span));
    }
  }
  function drawSlash(p, s, t) {
    const u = t - s.t0;
    if (u < 0) return;
    const span = s.a1 - s.a0, head = ease.outExpo(clamp(u / s.sweep)), tail = smooth(s.sweep + s.hold, s.sweep + s.hold + s.trail, u);
    const age = clamp(u / (s.sweep + s.hold + s.trail));
    if (tail < 1) crescent(p, s, s.a0 + span * tail, span * (head - tail), s.W * (1 - tail * 0.55), age);
    const th = 0.7 * (1 - clamp((u - s.sweep - s.hold) / (s.trail + 0.2)));
    if (tail > 0.02 && th > 0)
      for (let k = 0; k <= tail; k += 0.6 / (Math.abs(span) * s.R)) {
        const [x, y] = onArc(s, s.R - 0.5, s.a0 + span * k);
        p.dot(x, y, s.ramp[1], th * (0.4 + 0.6 * k));
      }
  }
  function tipOf(s) {
    const [x, y] = onArc(s, s.R - s.W * 0.3, s.a1), [x2, y2] = onArc(s, s.R - s.W * 0.3, s.a1 + Math.sign(s.a1 - s.a0) * 0.05);
    const l = Math.hypot(x2 - x, y2 - y) || 1;
    return { x, y, dx: (x2 - x) / l, dy: (y2 - y) / l };
  }
  function create6(o) {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks });
    const R03 = o.radius, a0 = -2.55, a1 = 0.95;
    const A = { cx: 6, cy: -26, R: R03, sy: 0.6, rot: -0.38, a0, a1, W: 12, t0: 0, sweep: 0.06, hold: 0.06, trail: 0.24, ramp: C };
    const E = { ...A, R: R03 * (33 / 42), W: R03 * (4.5 / 42), a0: a0 + (a1 - a0) * 0.1, a1: a1 - (a1 - a0) * (0.15 / 3.5), t0: 0.017, hold: 0.03, trail: 0.2, ramp: C.slice(0, 6) };
    const tip = tipOf(A);
    let t = 0, landed = false;
    return {
      update(dt) {
        t += dt;
        if (!landed && t >= A.sweep) {
          landed = true;
          for (let i = 0; i < 10; i++) {
            const a = Math.atan2(tip.dy, tip.dx) + Rg.range(-0.5, 0.5), sp = Rg.range(150, 400);
            ps.spawn(P.SPARK, tip.x, tip.y, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.12, 0.35));
          }
          for (let i = 0; i < 16; i++) {
            const a = a0 + (a1 - a0) * Rg.range(0.3, 1), [x, y] = onArc(A, A.R, a);
            const ox = x - A.cx, oy = y - A.cy, l = Math.hypot(ox, oy) || 1, sp = Rg.range(30, 100);
            ps.spawn(P.MOTE, x, y, ox / l * sp, oy / l * sp - 10, Rg.range(0.25, 0.55), C[4 + Rg.int(0, 1)], 0.6);
          }
        }
        ps.update(dt);
      },
      draw(p) {
        drawSlash(p, E, t);
        drawSlash(p, A, t);
        const g = t - A.sweep * 0.6;
        if (g > 0 && g < 0.22) sparkle(p, tip.x, tip.y, 9 * ease.outBack(Math.min(1, g / 0.05)) * (1 - g / 0.22), C[5], C[3], 0.6);
        if (t < 0.3) {
          const [x, y] = onArc(A, A.R - 4, A.a0 + (A.a1 - A.a0) * ease.outExpo(clamp(t / A.sweep)));
          p.glow(x, y, 40, C[3], 0.5 * (1 - t / 0.3));
        }
        ps.draw(p);
      }
    };
  }

  // fx/melee/double-slash.js
  var double_slash_exports = {};
  __export(double_slash_exports, {
    act: () => act5,
    create: () => create7,
    meta: () => meta9
  });

  // fx/melee/_lib.js
  var swing = (o) => ({ cx: 0, cy: 0, R: 30, sy: 1, rot: 0, a0: 0, dir: 1, k: 0, ...o });
  function through(x, y, th, dir, R4, span, at2 = 0.55, extra = {}) {
    const a = th - dir * Math.PI / 2;
    return swing({ cx: x - Math.cos(a) * R4, cy: y - Math.sin(a) * R4, R: R4, sy: 1, rot: 0, a0: a - dir * span * at2, dir, span, ...extra });
  }
  function onSwing(s, r, u) {
    const a = s.a0 + s.dir * u, lx = Math.cos(a) * r, ly = Math.sin(a) * r * s.sy - s.k * (s.R - r), c = Math.cos(s.rot), n = Math.sin(s.rot);
    return [s.cx + lx * c - ly * n, s.cy + lx * n + ly * c];
  }
  function travel(s, u) {
    const [x0, y0] = onSwing(s, s.R, u), [x1, y1] = onSwing(s, s.R, u + 0.01), l = Math.hypot(x1 - x0, y1 - y0) || 1;
    return { x: x0, y: y0, dx: (x1 - x0) / l, dy: (y1 - y0) / l, a: s.a0 + s.dir * u };
  }
  function plane(s, x, y) {
    const c = Math.cos(s.rot), n = Math.sin(s.rot), dx = x - s.cx, dy = y - s.cy, lx = dx * c + dy * n, ly = -dx * n + dy * c;
    if (!s.k) return [Math.hypot(lx, ly / s.sy), Math.atan2(ly / s.sy, lx)];
    const m = ly + s.k * s.R, A = s.sy * s.sy - s.k * s.k, B2 = 2 * m * s.k, Cc = lx * lx * s.sy * s.sy + m * m;
    const r = (-B2 + Math.sqrt(B2 * B2 + 4 * A * Cc)) / (2 * A);
    return [r, Math.atan2((m - s.k * r) / s.sy, lx)];
  }
  function smear(p, s, u0, u1, wMax, fn, half = 0, pad = 1) {
    if (u1 - u0 < 5e-3) return;
    const c = Math.cos(s.rot), n = Math.sin(s.rot), A = s.R + pad + 1, Bn = A * s.sy + s.k * (wMax + 2);
    const hx = Math.hypot(A * c, Bn * n) + 1, hy = Math.hypot(A * n, Bn * c) + 1, rIn = s.R - wMax - 1;
    const over = Math.abs(n) * A + s.k * (wMax + 2) + 2, y0 = half > 0 ? s.cy - over : s.cy - hy, y1 = half < 0 ? s.cy + over : s.cy + hy;
    p.shade(s.cx - hx, y0, s.cx + hx, y1, (x, y, out) => {
      const [r, a] = plane(s, x, y);
      if (r > s.R + pad || r < rIn) return;
      if (half && (Math.sin(a) < 0 ? -1 : 1) !== half) return;
      let u = s.dir * (a - s.a0) % TAU;
      if (u < 0) u += TAU;
      while (u < u0) u += TAU;
      if (u > u1) return;
      return fn(u, r, out, a);
    });
  }
  function trace(p, s, r, u0, u1, c, a, half = 0, step = 0.6) {
    const du = step / Math.max(4, r);
    for (let u = u0; u <= u1; u += du) {
      const g = s.a0 + s.dir * u;
      if (half && (Math.sin(g) < 0 ? -1 : 1) !== half) continue;
      const [x, y] = onSwing(s, r, u), k = typeof a === "function" ? a(u) : a;
      if (k > 0) p.dot(x, y, typeof c === "function" ? c(u) : c, k);
    }
  }
  function glowAlong(p, s, r, u0, u1, rad, c, k, half = 0, step = 0.35) {
    for (let u = u0; u <= u1; u += step) {
      const g = s.a0 + s.dir * u;
      if (half && (Math.sin(g) < 0 ? -1 : 1) !== half) continue;
      const [x, y] = onSwing(s, r, u), kk = typeof k === "function" ? k(u) : k;
      if (kk > 4e-3) p.glow(x, y, rad, c, kk);
    }
  }
  function slash(p, s, t, half = 0) {
    const u = t - s.t0;
    if (u < 0) return;
    const R4 = s.ramp, n = R4.length, life = s.sweep + s.hold + s.trail, hot = s.hot ?? 0;
    const head = ease.outExpo(clamp(u / s.sweep)), tail = smooth(s.sweep + s.hold, life, u), age = clamp(u / life);
    const U = s.span * head, T2 = s.span * tail, W3 = s.W * (1 - tail * 0.55);
    if (tail < 1 && U - T2 > 0.01) {
      smear(p, s, T2, U, W3, (uu, r, out) => {
        const v = (uu - T2) / (U - T2), w = W3 * Math.pow(Math.sin(Math.PI * Math.pow(v, s.lens ? 1 : 2.2)), s.lens ? 0.75 : 0.6);
        if (w < 0.35) return;
        const q = (s.R - r) / w;
        if (q < 0 || q > 1) return;
        const ci = q < 0.22 && age < 0.5 || q < hot * 0.7 ? 0 : Math.round(q * (n - 1) * 0.75 + age * 2.4 - v * 0.8 + 0.4 - hot * 3);
        out.c = R4[n - 1 - clamp(ci, 0, n - 1)];
        out.a = Math.min(1, v / (s.lens ? 0.1 : 0.4));
      }, half);
      glowAlong(p, s, s.R - W3 * 0.4, T2, U, 5 + W3, R4[n - 3], (uu) => (0.22 + hot * 0.3) * (1 - age) * ((uu - T2) / (U - T2)), half, 0.3);
    }
    const th = 0.7 * (1 - clamp((u - s.sweep - s.hold) / (s.trail + 0.2)));
    if (tail > 0.02 && th > 0) trace(p, s, s.R - 0.5, 0, T2, R4[2], (uu) => th * (0.4 + 0.6 * uu / s.span), half);
  }
  var slashEnd = (s) => travel({ ...s, R: s.R - s.W * 0.3 }, s.span);
  function shavings(ps, R4, s, n, colors, from = 0.3) {
    for (let i = 0; i < n; i++) {
      const [x, y] = onSwing(s, s.R, s.span * R4.range(from, 1)), ox = x - s.cx, oy = y - s.cy, l = Math.hypot(ox, oy) || 1, sp = R4.range(30, 100);
      ps.spawn(P.MOTE, x, y, ox / l * sp, Math.min(25, oy / l * sp) - 10, R4.range(0.25, 0.55), R4.pick(colors), 0.6);
    }
  }
  var OUTLINE2 = hex("#1a1422");
  function sliver(p, x, y, a, r, arc2, c, k) {
    const n = Math.ceil(r * arc2 * 2.2);
    for (let j = 0; j <= n; j++) {
      const u = j / n - 0.5, th = a + u * arc2, w = 1.4 * (1 - Math.abs(u) * 2);
      for (let o = -w * 0.5; o <= w * 0.5 + 0.01; o += 0.5) p.dot(x + Math.cos(th) * (r + o), y + Math.sin(th) * (r + o), c, k);
    }
  }

  // fx/melee/double-slash.js
  var meta9 = {
    name: "Double slash",
    desc: "A down cut, then an up cut that crosses it: the moment the X closes both strokes flash white, the crossing bursts with light and sparks, and a dotted X lingers.",
    tags: ["melee", "slash", "combo", "sword", "cross", "combat", "directional", "one-shot"],
    size: [164, 108],
    origin: [44, 92],
    duration: 0.8,
    loop: false,
    fps: 30,
    bg: "ground",
    actor: 2,
    options: {
      palette: ["#2a0a22", "#5e1238", "#a01f4e", "#e0386a", "#ff86a6", "#ffd2dd", "#ffffff"],
      sparks: ["#fff3a6", "#ffe26b", "#ff8a2a", "#f2561d"],
      seed: 6
    }
  };
  var STANCE = { ...READY, weapon: "sword", fx: 12, fy: -21, sa: -0.85 };
  var HIGH2 = { ...STANCE, x: -7, crouch: 4, lean: -4, fx: -7, fy: -35, sa: -2.65, bx: 9, by: -25, armsFront: true, ffx: 9, fbx: -8 };
  var LOW = { ...STANCE, x: 3, crouch: 6, lean: 6, fx: 22, fy: -20, sa: 0.62, bx: -8, by: -24, ffx: 13, fbx: -10, toeB: true };
  var act5 = {
    target: { x: 62 },
    poses: [
      [-0.42, { ...STANCE, x: -7 }],
      [-0.18, HIGH2],
      [-0.04, { ...HIGH2, crouch: 5 }],
      [0, { ...STANCE, x: 0, crouch: 2, lean: 3, fx: 16, fy: -37, sa: -1.45, bx: -7, by: -24, ffx: 11, fbx: -9, ghost: 1 }, "snap"],
      [0.06, LOW, "snap"],
      [0.14, { ...LOW, x: 4, crouch: 6, lean: 5, fx: 20, fy: -17, sa: 0.85, ghost: 1 }],
      [0.17, { ...LOW, x: 5, crouch: 3, lean: 5, fx: 22, fy: -28, sa: 0.1, by: -18, toeB: true, ghost: 1 }, "snap"],
      [0.21, { ...LOW, x: 6, crouch: 1, lean: 6, fx: 19, fy: -37, sa: -0.95, by: -18, ffx: 13, fby: -6 }, "snap"],
      [0.5, { ...LOW, x: 6, crouch: 3, lean: 3, fx: 18, fy: -36, sa: -1.05, by: -19, ffx: 12 }],
      [0.92, { ...STANCE, x: -7 }]
    ],
    hits: [
      { t: 0.06, stop: 0.05, shake: 0.08, amp: 1, push: 1.4, straw: 8 },
      { t: 0.16, stop: 0.14, shake: 0.2, amp: 2, push: 2.8, straw: 18, y: -28 }
    ],
    dust: [{ t: 0.06, x: 16, n: 5, dir: 1 }, { t: 0.17, x: -8, n: 4, dir: -1 }]
  };
  var UP = 0.14;
  var R0 = 62;
  var cut = (x, y, th, dir, span, extra) => through(x, y, th, dir, R0, span, 0.55, extra);
  function create7(o) {
    const C = fit(o.palette, 7), Rg = new Rng(o.seed), ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks }), lights = new Lights();
    const X = 34, Y = -23;
    const down = cut(X, Y, 0.72, 1, 0.84, { W: 10, t0: 0, sweep: 0.06, hold: 0.07, trail: 0.24, ramp: C, lens: true });
    const up = cut(X, Y, -0.66, -1, 0.84, { W: 11, t0: UP, sweep: 0.06, hold: 0.06, trail: 0.26, ramp: C, lens: true });
    const ends = [slashEnd(down), slashEnd(up)], slivers = [-2.4, -1.1, 0.2, 1.6].map((a) => ({ a: a + Rg.range(-0.2, 0.2), r: Rg.range(5, 8), v: Rg.range(70, 120), arc: Rg.range(0.4, 0.7) }));
    const CLOSE = UP + 0.012;
    let t = 0, cut1 = false, cut2 = false, closed = false;
    return {
      update(dt) {
        t += dt;
        if (!cut1 && t >= down.sweep) {
          cut1 = true;
          shavings(ps, Rg, down, 10, [C[4], C[5]]);
          for (let i = 0; i < 6; i++) {
            const a = Math.atan2(ends[0].dy, ends[0].dx) + Rg.range(-0.5, 0.5), sp = Rg.range(120, 300);
            ps.spawn(P.SPARK, ends[0].x, ends[0].y, Math.cos(a) * sp, Math.sin(a) * sp, Rg.range(0.12, 0.3));
          }
        }
        if (!closed && t >= CLOSE) {
          closed = true;
          lights.add(X, Y, 56, C[3], 0.45, 0.4);
          lights.add(X, Y, 18, WHITE, 0.6, 0.08);
          for (let i = 0; i < 18; i++) {
            const a = Rg.range(-Math.PI, Math.PI) * 0.8, sp = Rg.range(140, 360);
            ps.spawn(P.SPARK, X, Y, Math.cos(a) * sp, Math.sin(a) * sp - 40, Rg.range(0.14, 0.4));
          }
          for (let i = 0; i < 5; i++) ps.spawn(P.STAR, X + Rg.range(-14, 14), Y + Rg.range(-12, 12), 0, -4, Rg.range(0.2, 0.4), Rg.chance(0.5) ? C[5] : WHITE, Rg.range(1, 2.2), Rg.range(0.05, 0.2));
        }
        if (!cut2 && t >= UP + up.sweep) {
          cut2 = true;
          shavings(ps, Rg, up, 12, [C[4], C[5]]);
        }
        ps.update(dt);
        lights.update(dt);
      },
      draw(p) {
        const flash = t >= CLOSE && t < CLOSE + 0.07 ? 1 : 0;
        down.hot = up.hot = flash;
        slash(p, down, t);
        slash(p, up, t);
        for (const [s, e] of [[down, ends[0]], [up, ends[1]]]) {
          const g = t - s.t0 - s.sweep * 0.6;
          if (g > 0 && g < 0.2) sparkle(p, e.x, e.y, 7 * ease.outBack(Math.min(1, g / 0.05)) * (1 - g / 0.2), C[5], C[3], 0.5);
        }
        const q = t - CLOSE;
        if (q >= 0 && q < 0.26) {
          const k = q / 0.26;
          flare(p, X, Y, 22 * Math.pow(1 - k, 1.4), 1 - k, C);
          p.glow(X, Y, 34, C[4], 0.35 * (1 - k));
        }
        if (q >= 0.03 && q < 0.15) {
          const k = (q - 0.03) / 0.12;
          for (const s of slivers) sliver(p, X, Y, s.a, s.r + s.v * (q - 0.03), s.arc * (1 - 0.4 * k), k < 0.4 ? C[6] : k < 0.7 ? C[5] : C[4], 1 - k);
        }
        for (const s of [down, up]) {
          const u = t - s.t0;
          if (u <= 0 || u >= 0.25) continue;
          const e = slashEnd({ ...s, span: s.span * ease.outExpo(clamp(u / s.sweep)) });
          p.glow(e.x, e.y, 40, C[3], 0.5 * (1 - u / 0.25));
        }
        ps.draw(p);
        lights.draw(p);
      }
    };
  }

  // fx/explosions/small-explosion.js
  var small_explosion_exports = {};
  __export(small_explosion_exports, {
    create: () => create8,
    meta: () => meta10
  });
  var meta10 = {
    name: "Explosion",
    desc: "A ground blast: a white flash and shock rings, fire that cools into a rolling smoke column, sparks, burning brands that land and keep burning, tumbling rocks and a glowing scorch.",
    tags: ["explosion", "fire", "smoke", "debris", "impact", "one-shot"],
    size: [300, 240],
    origin: [150, 196],
    duration: 5.4,
    loop: false,
    fps: 30,
    bg: "ground",
    options: { palette: ["#4a1712", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"], stone: "#4a3f69", size: 1, seed: 7 }
  };
  var SOOT = hex("#0d0a12");
  var SOOT2 = hex("#17121d");
  var OUTLINE3 = hex("#1a1422");
  var WARM = rgb(255, 176, 96);
  function stone(c) {
    c = hex(c);
    return { light: mix(scale(c, 1.35), WHITE, 0.08), body: c, shade: scale(c, 0.64), dust: mix(scale(c, 1.2), rgb(150, 140, 150), 0.3) };
  }
  function scorch(p, F, t, rx0, cool, fade) {
    if (fade <= 0) return;
    const rx = rx0 * Math.min(1, t / 0.08), ry = 4, heat = [...F].reverse();
    for (let y = 0; y <= 2; y++)
      for (let x = Math.floor(-rx); x <= Math.ceil(rx); x++) {
        const dx = (x + 0.5) / rx, dy = (y + 0.5) / ry, d = Math.sqrt(dx * dx + dy * dy);
        if (d > 1) continue;
        const k = rand(x * 31 + y, 3), T2 = Math.pow(clamp(1 - t / cool), 1.4) * (1.25 - d) - k * 0.35;
        if (T2 > 0.06) {
          const c = heat[Math.min(heat.length - 1, Math.floor((1 - Math.min(1, T2)) * (heat.length - 1)))];
          p.dot(x, y, c, fade);
          if ((x & 3) === 0) p.glow(x + 0.5, y, 6, c, 0.18 * T2 * fade);
        } else p.dot(x, y, d < 0.5 ? SOOT : SOOT2, (d < 0.95 - k * 0.3 ? 1 : 1 - d) * fade);
      }
  }
  function rock(p, b, st) {
    const r = 0.6 + b.s * 0.75, fade = Math.min(1, b.life / 0.5), lx = Math.cos(b.a) * r * 0.4, ly = Math.sin(b.a) * r * 0.4;
    p.shade(b.x - r - 1, b.y - r - 1, b.x + r + 1, b.y + r + 1, (x, y, out) => {
      const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx * 1.15, dy);
      if (d > r + 0.9) return;
      const lit = dx * lx + dy * ly;
      out.c = d > r ? OUTLINE3 : lit < -0.4 ? st.light : lit > 0.6 ? st.shade : st.body;
      out.a = fade;
    });
  }
  function create8(o) {
    const F = fit(o.palette, 8), S = o.size, RAD = 18 * S, POWER = 0.9 * Math.pow(S, 0.8), EARTH = 1.6, st = stone(o.stone);
    const R4 = new Rng(o.seed), floor = () => 0;
    let blazes;
    const ps = new Particles({ rng: R4, ground: floor, sparks: [F[6], F[5], F[3], F[2]], onLand: (x, y) => blazes.add(x, y - 0.25, R4.range(0.9, 1.5), R4.range(0.55, 0.85)) });
    blazes = new Blazes(ps);
    const rocks = new Bits({ ground: floor }), lights = new Lights(), flashes = [], rings = [];
    const Y = -RAD * 0.3;
    let t = 0;
    flashes.push({ r: RAD * 1.05, life: 0.06, max: 0.06 });
    rings.push({ r0: RAD * 0.45, r1: RAD * 2.7, life: 0.34, max: 0.34, thick: 3, c: F[5] }, { r0: RAD * 0.3, r1: RAD * 1.6, life: 0.22, max: 0.22, thick: 1.8, c: F[3] });
    lights.add(0, Y, RAD * 3.4, WARM, 0.6 * POWER, 0.7);
    lights.add(0, Y, RAD * 1.6, WHITE, 0.6, 0.08);
    for (let i = 0; i < 5; i++) ps.spawn(P.FIRE, R4.range(-2.5, 2.5), Y + R4.range(-2.5, 2.5), R4.range(-20, 20), R4.range(-40, -10), R4.range(0.18, 0.3), 0, R4.range(RAD * 0.4, RAD * 0.55));
    for (let i = 0; i < Math.round(28 * POWER); i++) {
      const a = R4.range(0, TAU), d = R4.range(0, RAD * 0.55), sp = R4.range(40, 210) * POWER;
      ps.spawn(P.FIRE, Math.cos(a) * d, Y + Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp * 0.8 - 40, R4.range(0.55, 1.15), 0, R4.range(RAD * 0.22, RAD * 0.46), 0, R4.chance(0.45) ? PF.SMOKES | PF.BIG : 0);
    }
    for (let i = 0; i < 5; i++) {
      const a = R4.range(0, TAU), d = R4.range(RAD * 0.1, RAD * 0.5);
      ps.spawn(P.SMOKE, Math.cos(a) * d, Y + Math.sin(a) * d, Math.cos(a) * 30, Math.sin(a) * 20 - 30, R4.range(0.9, 1.5), rgb(34, 29, 38), R4.range(RAD * 0.15, RAD * 0.26), R4.range(0.06, 0.2), PF.BIG);
    }
    for (let i = 0; i < 5; i++) ps.spawn(P.FIRE, R4.range(-RAD * 0.25, RAD * 0.25), Y, R4.range(-12, 12), R4.range(-180, -100), R4.range(0.8, 1.3), 0, R4.range(RAD * 0.24, RAD * 0.36), R4.range(0, 0.1), R4.chance(0.6) ? PF.SMOKES | PF.BIG : 0);
    for (let i = 0; i < Math.round(10 * POWER); i++) {
      const a = R4.range(0, TAU), d = R4.range(0, RAD * 0.7), sp = R4.range(15, 100);
      ps.spawn(P.SMOKE, Math.cos(a) * d, Y + Math.sin(a) * d, Math.cos(a) * sp, Math.sin(a) * sp * 0.6 - 35, R4.range(1.8, 2.8), 0, R4.range(RAD * 0.26, RAD * 0.44), R4.range(0.12, 0.45), PF.BIG);
    }
    for (let i = 0; i < Math.round(80 * POWER); i++) {
      const a = R4.range(0, TAU), sp = R4.range(140, 380) * POWER;
      ps.spawn(P.SPARK, 0, Y, Math.cos(a) * sp, Math.sin(a) * sp - 70, R4.range(0.18, 0.6));
    }
    for (let i = 0; i < Math.round(40 * POWER); i++) {
      const a = R4.range(0, TAU), sp = R4.range(30, 150);
      ps.spawn(P.EMBER, Math.cos(a) * RAD * 0.4, Y + Math.sin(a) * RAD * 0.4, Math.cos(a) * sp, Math.sin(a) * sp - 75, R4.range(1.2, 2.6), F[3]);
    }
    for (let i = 0; i < Math.round(R4.range(9, 14) * Math.max(0, POWER - 0.55)); i++) {
      const a = -Math.PI / 2 + R4.range(-1.35, 1.35), sp = R4.range(170, 330);
      ps.spawn(P.BRAND, 0, Y, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.7, 1.3));
    }
    for (let i = 0; i < Math.round(RAD * 0.5); i++) {
      const s = R4.sign();
      ps.spawn(P.SMOKE, s * R4.range(0, RAD * 0.6), -R4.range(1, 5 + RAD * 0.04), s * R4.range(3, 9.5) * RAD, -R4.range(2, 15), R4.range(1.1, 2), st.dust, R4.range(4, 7) + RAD / 6, R4.range(0, 0.06), PF.BIG);
    }
    for (let i = 0; i < 26 * Math.min(1.5, S); i++)
      rocks.add({ kind: B.CHUNK, x: R4.range(-0.4, 0.4) * RAD, y: -3, vx: R4.range(-9, 9) * RAD * 0.25, vy: -R4.range(7, 16) * RAD * 0.9, g: 1, drag: 0.4, bounce: 0.3, life: R4.range(1.8, 2.6), a: R4.range(0, TAU), va: R4.range(-16, 16), s: R4.int(1, 3) });
    for (let i = 0; i < Math.round(EARTH * RAD * 4); i++) {
      const u = R4.range(-1, 1), a = -Math.PI / 2 + u * 0.5, sp = R4.range(5, 15) * RAD * (1 - 0.45 * Math.abs(u));
      ps.spawn(P.GRIT, u * 0.25 * RAD, -1, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(1.2, 2.2), R4.pick([st.light, st.body, st.body, st.shade]), R4.chance(0.45) ? 2 : 1);
    }
    for (let i = 0; i < Math.round(EARTH * 12); i++)
      ps.spawn(P.SMOKE, R4.range(-0.3, 0.3) * RAD, -R4.range(2, RAD * 0.6), R4.range(-15, 15), -R4.range(60, 190) * EARTH * 0.6, R4.range(1.6, 2.6), st.dust, R4.range(5, 9) * Math.sqrt(S) + RAD / 7, R4.range(0, 0.15), PF.BIG);
    return {
      update(dt) {
        t += dt;
        for (const a of [flashes, rings]) for (let i = a.length - 1; i >= 0; i--) if ((a[i].life -= dt) <= 0) a.splice(i, 1);
        rocks.update(dt);
        for (const b of rocks.list)
          if (b.rest && !b.dusted) {
            b.dusted = true;
            for (let i = 0; i < 3; i++) ps.spawn(P.DUST, b.x + R4.range(-1.5, 1.5), -0.5, R4.sign() * R4.range(10, 55) * 0.6, -R4.range(2, 22), R4.range(0.3, 0.65), st.dust, R4.range(1.3, 2.8));
          }
        blazes.update(dt);
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        scorch(p, F, t, 22 * S, 1.2 + RAD / 14, 1 - smooth(meta10.duration - 1.2, meta10.duration - 0.2, t));
        ps.draw(p, "back");
        blazes.drawBack(p);
        const k = t / 0.5;
        if (k < 1) band(p, 0, 0.5, 80 * S * ease.outCubic(k), 0.16, Math.max(1, (2 + RAD / 9) * (1 - k)), 1.15 - k, [st.body, st.light, F[3], F[6]], (g) => Math.sin(g) < 0);
      },
      draw(p) {
        const k = t / 0.5;
        if (k < 1) band(p, 0, 0.5, 80 * S * ease.outCubic(k), 0.16, Math.max(1, (2 + RAD / 9) * (1 - k)), 1.15 - k, [st.body, st.light, F[3], F[6]], (g) => Math.sin(g) >= 0);
        for (const b of rocks.list) rock(p, b, st);
        ps.draw(p, "front");
        for (const f of flashes) {
          const k2 = f.life / f.max, r = f.r * (0.8 + 0.2 * k2);
          p.circle(0, Y, r + 1.2, F[2]);
          p.circle(0, Y, r, k2 > 0.45 ? F[6] : F[5]);
          p.circle(0, Y, r * 0.6, k2 > 0.45 ? WHITE : F[6]);
        }
        for (const r of rings) {
          const k2 = r.life / r.max, e = 1 - Math.pow(k2, 3);
          p.ring(0, Y, r.r0 + (r.r1 - r.r0) * e, Math.max(1, r.thick * k2 + 0.4), r.c, Math.min(1, k2 * 1.6));
        }
        lights.draw(p);
      }
    };
  }

  // fx/explosions/firework-burst.js
  var firework_burst_exports = {};
  __export(firework_burst_exports, {
    create: () => create9,
    meta: () => meta11
  });
  var meta11 = {
    name: "Firework burst",
    desc: "A shell climbs, slows and bursts into a sphere of coloured trailing stars round a gold core; they droop, crackle into white pops and fade, leaving glitter.",
    tags: ["firework", "celebration", "sparkle", "sky", "burst", "one-shot"],
    size: [240, 248],
    origin: [120, 100],
    duration: 3.6,
    loop: false,
    fps: 30,
    bg: "sky",
    options: {
      palette: ["#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"],
      core: ["#4a2c08", "#86520c", "#c48412", "#f0b424", "#ffe066", "#fff6c4", "#ffffff"],
      seed: 9
    }
  };
  var RISE = 0.42;
  var Y02 = 72;
  var DRAG = 2.6;
  var G = 88;
  var TRAIL = 0.34;
  var TURN = 0.22;
  function create9(o) {
    const C = fit(o.palette, 7), K = fit(o.core, 7), R4 = new Rng(o.seed);
    const ps = new Particles({ rng: R4, sparks: [K[6], K[5], K[4], K[3]] }), lights = new Lights();
    const stars = [], pops = [];
    let t = 0, burst = false;
    const shell = (n, speed, ramp2, life, first) => {
      for (let i = 0; i < n; i++) {
        const z = R4.range(-1, 1), a = R4.range(0, TAU), s = Math.sqrt(1 - z * z), v = speed * R4.range(0.93, 1.05);
        stars.push({ x: 0, y: 0, vx: Math.cos(a) * s * v, vy: Math.sin(a) * s * v, life: R4.range(life[0], life[1]), age: 0, ramp: ramp2, first, big: R4.chance(0.2), pts: [], acc: R4.next(), seed: R4.range(0, 100) });
      }
    };
    return {
      update(dt) {
        t += dt;
        if (t < RISE) {
          const y = Y02 * (1 - ease.outCubic(t / RISE));
          if (R4.chance(50 * dt)) ps.spawn(P.SPARK, R4.range(-0.5, 0.5), y + 2, R4.range(-25, 25), R4.range(20, 70), R4.range(0.15, 0.35));
          if (R4.chance(14 * dt)) ps.spawn(P.VAPOUR, R4.range(-1, 1), y + 3, R4.range(-3, 3), R4.range(5, 15), R4.range(0.5, 0.8), hex("#4a4458"), R4.range(1.5, 2.5));
        }
        if (!burst && t >= RISE) {
          burst = true;
          lights.add(0, 0, 110, C[4], 0.6, 1.5);
          lights.add(0, 0, 30, WHITE, 0.5, 0.07);
          shell(66, 236, C, [1.35, 1.9], K);
          shell(26, 120, K, [1, 1.4], K);
          for (let i = 0; i < 7; i++) {
            const a = R4.range(0, TAU), d = R4.range(0, 8);
            ps.spawn(P.VAPOUR, Math.cos(a) * d, Math.sin(a) * d, Math.cos(a) * R4.range(10, 30), Math.sin(a) * R4.range(10, 30), R4.range(2.2, 3), hex("#4a4458"), R4.range(6, 11));
          }
          for (let i = 0; i < 24; i++) {
            const a = R4.range(0, TAU), sp = R4.range(40, 140);
            ps.spawn(P.SPARK, 0, 0, Math.cos(a) * sp, Math.sin(a) * sp, R4.range(0.15, 0.35));
          }
        }
        for (let i = stars.length - 1; i >= 0; i--) {
          const s = stars[i];
          s.age += dt;
          const k = s.age / s.life;
          if (k >= 1) {
            for (let j = 0; j < 2 + (s.big ? 1 : 0); j++) pops.push({ x: s.x + R4.range(-3, 3), y: s.y + R4.range(-3, 3), t0: t + R4.range(0, 0.18), life: R4.range(0.06, 0.12), c: R4.chance(0.6) ? WHITE : s.ramp[5] });
            stars.splice(i, 1);
            continue;
          }
          s.vx -= s.vx * DRAG * dt;
          s.vy -= s.vy * DRAG * dt - G * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.pts.push(s.x, s.y, t);
          while (s.pts.length > 3 && t - s.pts[2] > TRAIL) s.pts.splice(0, 3);
          for (s.acc += dt * (k < 0.25 ? 4 : 11); s.acc > 1; s.acc--) ps.spawn(P.STAR, s.x, s.y, s.vx * 0.15 + R4.range(-6, 6), s.vy * 0.15 + R4.range(0, 10), R4.range(0.35, 0.8), R4.chance(0.5) ? K[5] : WHITE, R4.chance(0.15) ? R4.range(1, 1.6) : 0.5);
        }
        for (let i = pops.length - 1; i >= 0; i--) if (t > pops[i].t0 + pops[i].life) pops.splice(i, 1);
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        ps.draw(p, "back");
      },
      draw(p) {
        if (t < RISE) {
          const u = t / RISE, y = Y02 * (1 - ease.outCubic(u));
          p.line(0, y, 0, y + 3 + 6 * (1 - u), (q) => q < 0.3 ? K[5] : K[3]);
          p.px(0, y, WHITE);
          p.glow(0, y, 7, K[4], 0.5);
        }
        for (const s of stars) {
          const k = s.age / s.life, P2 = s.pts, n = P2.length / 3;
          for (let j = n - 1; j > 0; j--) {
            const u = (t - P2[j * 3 + 2]) / TRAIL;
            if (u >= 1) break;
            const ramp3 = s.age - (t - P2[j * 3 + 2]) < TURN ? s.first : s.ramp;
            const c = u < 0.3 ? ramp3[5] : u < 0.6 ? ramp3[4] : ramp3[3];
            p.line(P2[j * 3], P2[j * 3 + 1], P2[j * 3 - 3], P2[j * 3 - 2], c, Math.pow(1 - u, 0.8) * (1.3 - k * 0.6));
          }
          if (k > 0.72 && Math.sin(t * 60 + s.seed) < -0.2) continue;
          const ramp2 = s.age < TURN ? s.first : s.ramp, head = s.age < 0.04 ? WHITE : k < 0.55 ? ramp2[s.age < TURN ? 5 : 6] : ramp2[5];
          p.px(s.x, s.y, head);
          if (s.big && k < 0.6 && s.age > 0.06) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) p.px(s.x + dx, s.y + dy, ramp2[5]);
          p.glow(s.x, s.y, s.big ? 7 : 5, ramp2[4], (s.big ? 0.7 : 0.5) * (1 - k * 0.6) * Math.min(1, s.age / 0.2));
        }
        for (const q of pops) {
          const u = (t - q.t0) / q.life;
          if (u < 0 || u > 1) continue;
          sparkle(p, q.x, q.y, 2.6 * Math.sin(Math.PI * u), q.c, mix(q.c, C[3], 0.5), 0.5);
        }
        const b = t - RISE;
        if (b >= 0 && b < 0.28) {
          const u = b / 0.28, L2 = 32 * Math.pow(1 - u, 1.3);
          flareRays(p, 0, 0, L2, u * 0.6, C, K);
          if (b < 0.07) p.circle(0, 0, 2.6 - b * 20, WHITE);
        }
        ps.draw(p, "front");
        lights.draw(p);
      }
    };
  }
  function flareRays(p, x, y, L2, ang, C, K) {
    if (L2 < 1) return;
    for (let i = 0; i < 8; i++) {
      const diag = i % 2 === 1, an = ang + i * TAU / 8, len2 = diag ? L2 * 0.42 : L2, ca = Math.cos(an), sa = Math.sin(an);
      for (let d = 0; d <= len2; d += 0.5) {
        const u = d / len2;
        p.dot(x + ca * d, y + sa * d, diag ? u < 0.5 ? K[5] : K[4] : u < 0.3 ? WHITE : u < 0.65 ? C[5] : C[4], u < 0.7 ? 1 : 1 - (u - 0.7) / 0.35);
      }
    }
    p.glow(x, y, 4 + L2 * 1.2, C[4], 0.3);
    p.glow(x, y, 2 + L2 * 0.3, WHITE, 0.25);
  }

  // fx/impacts/hit-spark.js
  var hit_spark_exports = {};
  __export(hit_spark_exports, {
    create: () => create10,
    meta: () => meta12
  });
  var meta12 = {
    name: "Hit spark",
    desc: "The everyday hit: a sharp, lopsided cross flare with one long ray along the blow round a white diamond core, then a cone of sparks and hot chips that fall and bounce.",
    tags: ["impact", "hit", "spark", "combat", "directional", "one-shot"],
    size: [136, 80],
    origin: [44, 64],
    duration: 0.5,
    loop: false,
    fps: 30,
    bg: "ground",
    options: { palette: ["#4a1712", "#c9281f", "#f2561d", "#ff8a2a", "#ffe26b", "#fff3a6", "#ffffff"], height: 20, aim: 0.1, seed: 4 }
  };
  function ray(p, x, y, a, L2, w, C, from = 0) {
    const c = Math.cos(a), s = Math.sin(a);
    for (let d = from * L2; d <= L2; d += 0.5) {
      const u = d / L2, hw = w * Math.pow(1 - u, 1.6);
      const col = u < 0.3 ? WHITE : u < 0.62 ? C[5] : u < 0.88 ? C[4] : C[3];
      p.px(x + c * d, y + s * d, col);
      if (hw > 0.45) for (let o = 0.5; o <= hw; o += 0.5) for (const e of [-o, o]) p.px(x + c * d - s * e, y + s * d + c * e, u < 0.3 && o < 1 ? C[5] : C[4]);
    }
  }
  function diamond(p, x, y, r, C) {
    for (let dy = -r - 1; dy <= r + 1; dy++)
      for (let dx = -r - 1; dx <= r + 1; dx++) {
        const m = Math.abs(dx) + Math.abs(dy);
        if (m <= r) p.px(x + dx, y + dy, WHITE);
        else if (m === r + 1) p.px(x + dx, y + dy, C[3]);
      }
  }
  function create10(o) {
    const C = fit(o.palette, 7), R4 = new Rng(o.seed), X = 0, Y = -o.height, A = o.aim, floor = () => 0;
    const ps = new Particles({ rng: R4, ground: floor, sparks: [C[6], C[5], C[4], C[2]] });
    const lights = new Lights();
    const tilt = R4.range(-0.08, 0.08);
    const rays2 = [
      { a: A + tilt, L: R4.range(33, 37), w: 2.2 },
      { a: A + Math.PI + tilt, L: R4.range(8, 10), w: 2.2 },
      { a: A - Math.PI / 2 + tilt, L: R4.range(15, 18), w: 2.6 },
      { a: A + Math.PI / 2 + tilt, L: R4.range(10, 12), w: 2.3 },
      { a: A - Math.PI / 4 + tilt, L: R4.range(5, 7), w: 1 }
    ];
    lights.add(X, Y, 38, C[4], 0.35, 0.18);
    lights.add(X + Math.cos(A) * 10, Y + Math.sin(A) * 10, 22, C[5], 0.45, 0.1);
    lights.add(X, -2, 26, C[3], 0.22, 0.22);
    for (let i = 0; i < 9; i++) {
      const a = A + R4.range(-0.6, 0.6) - 0.15, v = R4.range(170, 360);
      ps.spawn(P.SPARK, X + 1, Y, Math.cos(a) * v, Math.sin(a) * v - 40, R4.range(0.25, 0.45), WHITE, 1, i > 6 ? R4.range(0.01, 0.03) : 0);
    }
    for (let i = 0; i < 6; i++) {
      const a = A + R4.range(-1.1, 0.5) - 0.3, v = R4.range(70, 170);
      ps.spawn(P.GRIT, X + 1, Y, Math.cos(a) * v, Math.sin(a) * v - R4.range(30, 80), R4.range(0.35, 0.45), R4.pick([C[5], C[4], C[4], C[3]]), 1);
    }
    let t = 0;
    return {
      update(dt) {
        t += dt;
        ps.update(dt);
        lights.update(dt);
      },
      draw(p) {
        ps.draw(p);
        if (t < 0.025) {
          for (const r of rays2) ray(p, X, Y, r.a, r.L, r.w, C);
          diamond(p, X, Y, 4, C);
        } else if (t < 0.058) {
          for (const r of rays2) ray(p, X, Y, r.a, r.L * 1.2, r.w * 0.55, C, 0.12);
          diamond(p, X, Y, 3, C);
        } else if (t < 0.092) {
          const r = rays2[0];
          ray(p, X, Y, r.a, r.L * 1.3, 0.6, [C[0], C[1], C[2], C[3], C[3], C[4]], 0.4);
        }
        const pop = Math.exp(-t / 0.045);
        if (pop > 0.02) {
          p.glow(X, Y, 22, C[4], 0.3 * pop);
          p.glow(X, Y, 7, WHITE, 0.15 * pop);
          p.glowLine(X, Y, X + Math.cos(A) * 26, Y + Math.sin(A) * 26, 4, C[5], 0.25 * pop);
        }
        lights.draw(p);
      }
    };
  }

  // fx/impacts/crit-hit.js
  var crit_hit_exports = {};
  __export(crit_hit_exports, {
    create: () => create11,
    meta: () => meta13
  });

  // fx/impacts/_lib.js
  var SOOT3 = hex("#0d0a12");
  var OUTLINE4 = hex("#1a1422");
  var LIGHT2 = Math.atan2(-1, -1);
  function spikes(R4, n, aim, { len: len2 = [7, 10], w = [1.5, 2.1], fwd = 1.8, back = 0.6, jag = 1, jit = 0.18 } = {}) {
    return Array.from({ length: n }, (_, i) => {
      const a = aim + i / n * TAU + R4.range(-jit, jit), cb = Math.cos(a - aim);
      const L2 = R4.range(len2[0], len2[1]) * (1 + fwd * Math.pow(Math.max(0, cb), 3) + back * Math.pow(Math.max(0, -cb), 3)) * (i % 2 ? jag : 1);
      return { a, len: L2, w: R4.range(w[0], w[1]) * (i % 2 ? Math.sqrt(jag) : 1) };
    });
  }
  function star(p, x, y, list, sc, th, [rim, body, inner, core], a = 1, heart = 2.4) {
    for (let pass = 0; pass < 3; pass++)
      for (const s of list) {
        const c = Math.cos(s.a), sn = Math.sin(s.a), L2 = s.len * sc;
        for (let d = 0; d <= L2; d += 0.5) {
          if (pass === 2 && d > L2 * 0.55) break;
          const hw0 = s.w * th * (1 - d / L2) * Math.min(1, 0.5 + d / 3);
          const hw = pass === 0 ? hw0 + 0.8 : pass === 1 ? hw0 : hw0 * 0.45;
          const col = pass === 0 ? rim : pass === 1 ? d < L2 * 0.35 ? inner : body : core;
          for (let o = -hw; o <= hw; o += 0.5) p.dot(x + c * d - sn * o, y + sn * d + c * o, col, a);
        }
      }
    const r = heart * sc * Math.sqrt(th);
    p.circle(x, y, r + 0.8, inner, a);
    p.circle(x, y, r, core, a);
  }
  function brokenRing(p, x, y, r, th, segs, brk, c, c2 = c, k = 1, sy = 1, maxY = Infinity) {
    if (r <= 0 || k <= 0) return;
    const full = TAU / segs.length;
    for (const s of segs) {
      const span = full * (1 - s.gap * brk) + 0.02, rr = r * (1 + s.dr * brk), m = Math.max(4, Math.ceil(rr * span * 1.8));
      for (let j = 0; j <= m; j++) {
        const u = j / m, ang = s.a + (u - 0.5) * span, w = Math.max(0.5, th * (s.w ?? 1) * (1 - brk * Math.pow(Math.abs(2 * u - 1), 1.6)));
        const ca = Math.cos(ang), sa = Math.sin(ang);
        for (let o = -w / 2; o <= w / 2 + 0.01; o += 0.5) if (y + sa * (rr + o) * sy < maxY) p.dot(x + ca * (rr + o), y + sa * (rr + o) * sy, o > -0.26 ? c : c2, k);
      }
    }
  }

  // fx/impacts/crit-hit.js
  var meta13 = {
    name: "Critical hit",
    desc: "A critical hit: a jagged starburst slams in white and overshoots, a ring breaks into flying arcs, sparks streak off, shards tumble to the floor under a big flare.",
    tags: ["impact", "hit", "crit", "critical", "combat", "directional", "one-shot"],
    size: [216, 136],
    origin: [84, 106],
    duration: 0.9,
    loop: false,
    fps: 30,
    bg: "ground",
    options: { palette: ["#2a0510", "#5c0a1c", "#a3142a", "#e0302c", "#ff7a2a", "#ffc23d", "#fff09a", "#ffffff"], height: 26, aim: 0.12, seed: 3 }
  };
  var KEYS = [
    [0, 1, 1, 1, [6, 7, 7, 7]],
    [0.025, 1.3, 1, 1, [2, 5, 6, 7]],
    [0.058, 1.05, 0.72, 1, [2, 4, 5, 6]],
    [0.092, 1.22, 0.3, 1, [1, 2, 3, 4]],
    [0.125]
  ];
  function flare2(p, x, y, L2, k, C) {
    for (const [dx, dy, len2] of [[1, 0, L2], [0, 1, L2 * 0.45], [0.7, 0.7, L2 * 0.16], [0.7, -0.7, L2 * 0.16]])
      for (const s of [-1, 1])
        for (let d = 1; d <= len2; d++) {
          const u = d / len2, a = u < 0.7 ? 1 : k * (1.6 - u);
          p.dot(x + s * dx * d, y + s * dy * d, u < 0.35 ? WHITE : u < 0.7 ? C[6] : C[5], a);
          if (dy === 0 && u < 0.42) for (const e of [-1, 1]) p.dot(x + s * d, y + e, u < 0.2 ? C[6] : C[5], u < 0.3 ? 1 : k);
        }
    p.glowLine(x - L2, y, x + L2, y, 6, C[6], 0.5 * k);
    p.glowLine(x, y - L2 * 0.45, x, y + L2 * 0.45, 4, C[6], 0.3 * k);
  }
  function create11(o) {
    const C = fit(o.palette, 8), R4 = new Rng(o.seed), X = 0, Y = -o.height, A = o.aim, floor = () => 0;
    const ps = new Particles({ rng: R4, ground: floor, sparks: [C[7], C[6], C[5], C[3]] });
    const bits = new Bits({ ground: floor }), lights = new Lights();
    const sp = spikes(R4, 14, A, { len: [11, 15], w: [1.8, 2.5], fwd: 1.4, back: 0.6, jag: 0.5 });
    [...sp].sort((a, b) => b.len - a.len).slice(0, 2).forEach((s) => s.len *= 1.3);
    const segs = Array.from({ length: 7 }, (_, i) => {
      const a = A + i / 7 * TAU;
      return { a, gap: R4.range(0.55, 0.85), dr: R4.range(0.08, 0.4) + 0.15 * Math.max(0, Math.cos(a - A)), w: 0.7 + 0.5 * Math.max(0, Math.cos(a - A)) };
    });
    lights.add(X, Y, 84, C[5], 0.6, 0.5);
    lights.add(X, Y, 30, WHITE, 0.7, 0.1);
    lights.add(X, -4, 44, C[4], 0.3, 0.45);
    for (let i = 0; i < 36; i++) {
      const back = R4.chance(0.22), a = (back ? A + Math.PI : A) + R4.range(-1, 1) * (back ? 0.6 : 0.8), v = R4.range(170, 430) * (back ? 0.6 : 1);
      ps.spawn(P.SPARK, X, Y, Math.cos(a) * v, Math.sin(a) * v - 50, R4.range(0.15, 0.5), WHITE, 1, R4.chance(0.3) ? R4.range(0, 0.04) : 0);
    }
    for (let i = 0; i < 10; i++) {
      const a = A + R4.range(-1, 1) * 1.1 - 0.35, v = R4.range(110, 280);
      bits.add({ kind: B.SHARD, x: X, y: Y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 0.8, drag: 0.7, bounce: 0.35, life: R4.range(0.55, 0.85), a: R4.range(0, TAU), va: R4.range(-25, 25), s: R4.range(2, 4.5), c: R4.pick([C[7], C[6], C[6], C[5]]) });
    }
    for (let i = 0; i < 12; i++) {
      const a = A - Math.PI / 2 + R4.range(-1.4, 1.4), v = R4.range(35, 110);
      ps.spawn(P.MOTE, X + Math.cos(a) * 4, Y + Math.sin(a) * 4, Math.cos(a) * v, Math.sin(a) * v - 15, R4.range(0.35, 0.7), R4.pick([C[6], C[5], C[5]]), 0.6, R4.range(0, 0.05));
    }
    for (let i = 0; i < 5; i++) {
      const a = R4.range(0, TAU), d = R4.range(14, 34);
      ps.spawn(P.STAR, X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.8, 0, -4, R4.range(0.22, 0.38), R4.chance(0.5) ? C[6] : WHITE, R4.range(1.6, 3), R4.range(0.08, 0.32));
    }
    let t = 0;
    return {
      update(dt) {
        t += dt;
        ps.update(dt);
        bits.update(dt);
        lights.update(dt);
      },
      draw(p) {
        const u = clamp((t - 0.03) / 0.37);
        if (t >= 0.03 && u < 1) {
          const r = 10 + 30 * ease.outCubic(u), brk = smooth(0.12, 0.6, u), th = Math.max(1, 3.6 * Math.pow(1 - u, 1.2));
          const i = u < 0.12 ? 7 : u < 0.3 ? 6 : u < 0.5 ? 5 : u < 0.75 ? 4 : 3;
          brokenRing(p, X, Y, r, th, segs, brk, C[i], C[Math.max(2, i - 2)], u < 0.6 ? 1 : (1 - u) / 0.4, 1, 0);
          if (u < 0.6) p.glowRing(X, Y, r, 6, C[5], 0.35 * Math.pow(1 - u / 0.6, 2));
        }
        bits.draw(p);
        ps.draw(p);
        const f = (t - 0.04) / 0.28;
        if (f > 0 && f < 1) {
          flare2(p, X, Y, 64 * Math.pow(1 - f, 1.3), 1 - f, C);
          p.glow(X, Y, 56, C[5], 0.4 * (1 - f));
        }
        for (let i = 0; i < KEYS.length - 1; i++)
          if (t >= KEYS[i][0] && t < KEYS[i + 1][0]) {
            const [, sc, th, a, cols] = KEYS[i];
            star(p, X, Y, sp, sc, th, cols.map((j) => C[j]), a, 2.6);
          }
        const pop = Math.exp(-t / 0.05);
        if (pop > 0.02) {
          p.glow(X, Y, 44, C[5], 0.4 * pop);
          p.glow(X, Y, 12, WHITE, 0.6 * pop);
        }
        lights.draw(p);
      }
    };
  }

  // fx/pickups/heart-pickup.js
  var heart_pickup_exports = {};
  __export(heart_pickup_exports, {
    draw: () => draw3,
    drawBack: () => drawBack2,
    meta: () => meta14
  });

  // fx/pickups/_lib.js
  var Layer = class {
    constructor(w = 64, h = 64) {
      this.f = createFrame(w, h);
      this.q = new Painter(this.f);
      this.tmp = new Uint32Array(w * h);
    }
    /** Clear it and put its top-left at local (x0, y0). Returns the layer's painter. */
    begin(x0, y0) {
      const f = this.f;
      f.ox = Math.floor(x0);
      f.oy = Math.floor(y0);
      f.color.fill(0);
      f.light.fill(0);
      return this.q.reset().place(0, 0);
    }
    idx(x, y) {
      const f = this.f, i = Math.floor(x) - f.ox, j = Math.floor(y) - f.oy;
      return i < 0 || j < 0 || i >= f.w || j >= f.h ? -1 : j * f.w + i;
    }
    get(x, y) {
      const i = this.idx(x, y);
      return i < 0 ? 0 : this.f.color[i];
    }
    set(x, y, c) {
      const i = this.idx(x, y);
      if (i >= 0) this.f.color[i] = c;
    }
    /** Fill each pixel from fn(x, y) at the pixel's center (x + 0.5, y + 0.5): return a color or 0. */
    fill(x0, y0, x1, y1, fn) {
      for (let y = Math.floor(y0); y <= y1; y++)
        for (let x = Math.floor(x0); x <= x1; x++) {
          const c = fn(x + 0.5, y + 0.5);
          if (c) this.set(x, y, c);
        }
    }
    /** A 1 px outline around everything drawn: c is a color or fn(x, y, neighbour color). corners adds diagonals. */
    outline(c, corners = false) {
      const f = this.f, C = f.color, T2 = this.tmp, w = f.w, h = f.h;
      T2.fill(0);
      for (let j = 0; j < h; j++)
        for (let i = 0; i < w; i++) {
          const k = j * w + i;
          if (C[k]) continue;
          let n = i > 0 && C[k - 1] || i < w - 1 && C[k + 1] || j > 0 && C[k - w] || j < h - 1 && C[k + w];
          if (!n && corners) n = i > 0 && j > 0 && C[k - w - 1] || i < w - 1 && j > 0 && C[k - w + 1] || i > 0 && j < h - 1 && C[k + w - 1] || i < w - 1 && j < h - 1 && C[k + w + 1];
          if (n) T2[k] = typeof c === "function" ? c(i + f.ox, j + f.oy, n) : c;
        }
      for (let k = 0; k < w * h; k++) if (T2[k]) C[k] = T2[k];
      return this;
    }
    /** Recolor every drawn pixel: fn(x, y, c) returns the new color. */
    map(fn) {
      const f = this.f, C = f.color;
      for (let k = 0; k < C.length; k++) if (C[k]) C[k] = fn(k % f.w + f.ox, Math.floor(k / f.w) + f.oy, C[k]) || C[k];
      return this;
    }
    /** Stamp the layer onto p, offset by (dx, dy), at alpha a (dithered); clip [x0, x1] keeps x0 <= x < x1. */
    draw(p, dx = 0, dy = 0, a = 1, clip = null) {
      const f = this.f, C = f.color;
      for (let k = 0; k < C.length; k++) {
        if (!C[k]) continue;
        const x = k % f.w + f.ox + dx;
        if (clip && (x < clip[0] || x >= clip[1])) continue;
        p.dot(x, Math.floor(k / f.w) + f.oy + dy, C[k], a);
      }
      return this;
    }
  };
  var SHADOW = hex("#100e17");
  function pillow(L2, x0, y0, x1, y1, sdf, color, { bevel = 3, light = [-0.5, -0.6, 0.62], clip = null } = {}) {
    L2.fill(x0, y0, x1, y1, (x, y) => {
      const d = sdf(x, y);
      if (d > 0 || clip && clip(x, y)) return 0;
      const e = -d;
      let gx = sdf(x + 0.5, y) - sdf(x - 0.5, y), gy = sdf(x, y + 0.5) - sdf(x, y - 0.5);
      const gl = Math.hypot(gx, gy) || 1;
      gx /= gl;
      gy /= gl;
      const k = Math.max(0, 1 - e / bevel) * 1.25, sn = Math.sin(k), cs = Math.cos(k);
      return color(gx * sn * light[0] + gy * sn * light[1] + cs * light[2], e, x, y);
    });
  }
  function heartSdf(x, y, cx, cy, w, h = w) {
    const S = w / 1.14, X = (x - cx) / S, Y = -(y - cy) / (h / 1.14) + 0.12;
    const q = X * X + Y * Y - 1, f = q * q * q - X * X * Y * Y * Y;
    const gx = 6 * X * q * q - 2 * X * Y * Y * Y, gy = 6 * Y * q * q - 3 * X * X * Y * Y;
    return f / Math.max(Math.hypot(gx, gy), 0.6) * S;
  }
  var INK3 = hex("#0b0814");
  function blobShadow(p, x, rx, k = 1, y = 0) {
    if (rx < 0.8 || k <= 0) return;
    for (let i = Math.floor(x - rx); i <= Math.ceil(x + rx); i++) {
      const u = Math.abs(i + 0.5 - x) / rx;
      if (u > 1) continue;
      const a = k * (1 - u * u);
      p.dot(i, y, INK3, a * 1.1);
      if (u < 0.6) p.dot(i, y + 1, INK3, a * 0.6);
    }
  }
  function glint(p, x, y, arm, c, k = 0.4, tip = scale(c, 0.8)) {
    const n = Math.round(arm), X = Math.floor(x), Y = Math.floor(y);
    if (n < 0) return;
    for (let d = 1; d <= n; d++) {
      const cc = d === n && n > 1 ? tip : c;
      p.px(X + d, Y, cc), p.px(X - d, Y, cc), p.px(X, Y + d, cc), p.px(X, Y - d, cc);
    }
    p.px(X, Y, n > 0 ? WHITE : c);
    p.glow(X + 0.5, Y + 0.5, 3 + n * 2.5, c, k);
  }

  // fx/pickups/heart-pickup.js
  var meta14 = {
    name: "Heart pickup",
    desc: "A plump glossy heart hovering over its shadow beats lub-dub: a big squash and stretch, a smaller echo, light and a thin ring pulsing out, tiny hearts drifting off.",
    tags: ["pickup", "heart", "health", "life", "loop"],
    size: [56, 60],
    origin: [28, 52],
    duration: 1.2,
    loop: true,
    fps: 30,
    bg: "ground",
    options: { palette: ["#1a0408", "#4a0a14", "#8a1222", "#d02436", "#ff4a56", "#ff8a8e", "#ffd0cc", "#ffffff"], seed: 4 }
  };
  var L = new Layer(40, 40);
  var HOVER = 18;
  var W2 = 7.2;
  var INK4 = hex("#12060c");
  var MINI2 = [".a.a.", "abbba", ".aba.", "..a.."];
  var LUB = 0.04;
  var DUB = 0.24;
  var beat = (ph, at2, s) => {
    const u = ph - at2;
    if (u < 0 || u > 0.3) return 0;
    return s * Math.exp(-u * 16) * Math.cos(u * 34);
  };
  var pulse = (ph) => beat(ph, LUB, 1) + beat(ph, DUB, 0.55) + beat(ph + 1, LUB, 1);
  function drawBack2(p, t, o) {
    const C = fit(o.palette, 8), ph = t / meta14.duration, y = -HOVER - 1.2 * Math.sin(ph * TAU);
    blobShadow(p, 0, 8 + 1.5 * pulse(ph), 0.8);
    cycle(t, meta14.duration, 4, o.seed, 0.95, (age, life, r, i) => {
      const side = i % 2 ? 1 : -1, k = age / life;
      const x = side * (r.range(2, 5) + age * r.range(9, 15)) + Math.sin(age * 7 + r.range(0, TAU)) * 1.5, yy = y - 5 - age * r.range(14, 19);
      const a = Math.min(1, age / 0.12) * (1 - k * k);
      p.sprite(MINI2, { a: k < 0.5 ? C[5] : C[4], b: k < 0.3 ? WHITE : C[6] }, Math.round(x - 2.5), Math.round(yy - 2), { a: a * 1.3 });
      p.glow(x, yy, 5, C[4], 0.3 * a);
    });
  }
  function draw3(p, t, o) {
    const C = fit(o.palette, 8), ph = t / meta14.duration, y = -HOVER - 1.2 * Math.sin(ph * TAU), b = pulse(ph);
    const sx = 1 + 0.16 * b, sy = 1 - 0.13 * b, cy = Math.round(y);
    p.glow(0, cy, 22 + 6 * Math.max(0, b), C[4], 0.26 + 0.3 * Math.max(0, b));
    L.begin(-20, cy - 20);
    pillow(L, -12, cy - 11, 12, cy + 11, (x, yy) => heartSdf(x, yy, 0, cy, W2 * sx, W2 * sy), (lt, e) => {
      if (lt > 0.92 && e > 1.2) return WHITE;
      return lt > 0.8 ? C[6] : lt > 0.6 ? C[5] : lt > 0.38 ? C[4] : lt > 0.12 ? C[3] : C[2];
    }, { bevel: 3.6 });
    L.outline(INK4).draw(p);
    const u = ((ph - LUB) % 1 + 1) % 1;
    if (u < 0.28) {
      const k = u / 0.28, r = 9 + 8 * (1 - (1 - k) ** 3);
      p.ring(0, cy, r, 1, k < 0.2 ? C[6] : C[5], 0.85 * (1 - k));
      p.glowRing(0, cy, r, 4, C[4], 0.25 * (1 - k));
    }
    const g = ((ph - LUB - 0.08) % 0.5 + 0.5) % 0.5;
    if (g < 0.12) glint(p, -3.5, cy - 4, 2.6 * Math.sin(g / 0.12 * Math.PI), WHITE, 0.45);
  }

  // fx/pickups/collect-burst.js
  var collect_burst_exports = {};
  __export(collect_burst_exports, {
    create: () => create12,
    meta: () => meta15
  });
  var meta15 = {
    name: "Collect burst",
    desc: "The moment of pickup: a white flash and a cross of light, a thin ring snapping out ahead of a softer one, twinkles thrown wide on curving paths that brake, hang and wink out.",
    tags: ["pickup", "collect", "burst", "sparkle", "reward", "one-shot"],
    size: [112, 108],
    origin: [56, 94],
    duration: 1.35,
    loop: false,
    fps: 30,
    bg: "ground",
    options: { palette: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"], seed: 3 }
  };
  var CY3 = -30;
  function create12(o) {
    const C = fit(o.palette, 8), R4 = new Rng(o.seed), lights = new Lights();
    lights.add(0, CY3, 36, C[5], 0.85, 0.32);
    lights.add(0, CY3, 14, WHITE, 0.75, 0.08);
    const stars = Array.from({ length: 14 }, (_, i) => {
      const a = i / 14 * TAU + R4.range(-0.2, 0.2), sp = R4.range(145, 225) * (i % 3 === 0 ? 1.12 : 0.85);
      return { x: 0, y: CY3, a, sp, turn: (i % 2 ? 1 : -1) * R4.range(2.5, 5), life: R4.range(0.75, 1.15), age: 0, size: i % 3 === 0 ? 2.6 : R4.range(1.2, 2), tr: [], c: i % 4 === 0 ? WHITE : i % 2 ? C[6] : C[5], ph: R4.range(0, TAU) };
    });
    const motes2 = Array.from({ length: 7 }, () => ({ x: R4.range(-8, 8), y: CY3 + R4.range(-4, 6), vy: -R4.range(12, 30), life: R4.range(0.5, 0.9), d: R4.range(0.05, 0.25), w: R4.range(0, TAU) }));
    let t = 0;
    return {
      update(dt) {
        t += dt;
        for (const s of stars) {
          if (s.age > s.life) continue;
          s.age += dt;
          s.tr.unshift([s.x, s.y]);
          if (s.tr.length > 4) s.tr.pop();
          s.a += s.turn * dt * Math.max(0, 1 - s.age * 1.5);
          s.sp -= s.sp * 4.3 * dt;
          s.x += Math.cos(s.a) * s.sp * dt;
          s.y += Math.sin(s.a) * s.sp * dt + 6 * s.age * dt;
          if (s.y > -2) s.y = -2, s.a = -Math.abs(s.a), s.sp *= 0.5;
        }
        lights.update(dt);
      },
      draw(p) {
        if (t < 0.07) p.circle(0, CY3, 5.5 * (1 - t / 0.07) + 1, WHITE);
        if (t < 0.16) {
          const k = 1 - t / 0.16, L2 = 26 * ease.outCubic(Math.min(1, t / 0.03 + 0.4)) * k;
          for (const [dx, dy, l] of [[1, 0, 1], [-1, 0, 1], [0, 1, 0.6], [0, -1, 0.6]])
            p.line(0, CY3, dx * L2 * l, CY3 + dy * L2 * l, (u) => u < 0.3 ? WHITE : u < 0.65 ? C[6] : C[5], (u) => (u < 0.5 ? 1 : (1 - u) * 2) * (0.5 + k));
          p.glow(0, CY3, 20 * k + 4, C[5], 0.6 * k);
        }
        const u1 = t / 0.32;
        if (u1 < 1) {
          const r = 3 + 23 * ease.outExpo(u1);
          p.ring(0, CY3, r, 1, u1 < 0.3 ? WHITE : C[6], 1.3 - u1 * 1.2);
          p.glowRing(0, CY3, r, 4, C[5], 0.4 * (1 - u1));
        }
        const u2 = (t - 0.04) / 0.5;
        if (u2 > 0 && u2 < 1) {
          const r = 2 + 16 * ease.outCubic(u2);
          p.ring(0, CY3, r, Math.max(1, 2.6 * (1 - u2)), C[5], 1 - u2);
        }
        for (const s of stars) {
          if (s.age > s.life) continue;
          const k = 1 - s.age / s.life, tw = 0.65 + 0.35 * Math.sin(s.age * 26 + s.ph);
          s.tr.forEach(([x, y], i) => i > 0 && p.dot(x, y, i < 2 ? C[5] : C[4], (1 - i / 4) * k * 1.4));
          if (k < 0.3 && Math.sin(s.age * 40 + s.ph) < 0) continue;
          glint(p, s.x, s.y, Math.round(s.size * tw * Math.min(1, k * 2.5)), s.c, 0.45 * k);
        }
        for (const m of motes2) {
          const a = t - m.d;
          if (a < 0 || a > m.life) continue;
          const k = 1 - a / m.life, x = m.x + Math.sin(a * 6 + m.w) * 1.5, y = m.y + m.vy * a;
          p.dot(x, y, k > 0.5 ? C[6] : C[5], k * 1.5);
          p.glow(x + 0.5, y + 0.5, 3, C[5], 0.3 * k);
        }
        lights.draw(p);
      }
    };
  }

  // fx/ui/combo-counter.js
  var combo_counter_exports = {};
  __export(combo_counter_exports, {
    create: () => create13,
    meta: () => meta16
  });

  // fx/ui/_lib.js
  function spell(str, font = "big") {
    const F = FONTS[font], letters = [];
    let x = 0;
    for (const ch of String(str)) {
      const g = F.glyphs[ch] ?? F.glyphs[ch.toUpperCase()] ?? null;
      const w = g ? g.w : F.space;
      letters.push({ ch, g, x, w, h: F.h });
      x += w + F.gap;
    }
    return { letters, w: Math.max(0, x - F.gap), h: F.h };
  }
  var ids = new Int16Array(4096);
  var edges = new Uint8Array(4096);
  function drawWord(p, items, st) {
    if (!items.length) return;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const it of items) {
      const h = it.g.rows.length * it.sy, w = it.g.w * it.sx, sl = Math.abs(it.slant ?? 0) * it.g.rows.length;
      x0 = Math.min(x0, it.x - sl);
      x1 = Math.max(x1, it.x + w + sl);
      y0 = Math.min(y0, it.y);
      y1 = Math.max(y1, it.y + h);
    }
    const ow = st.ow ?? 1;
    x0 = Math.floor(x0) - 1 - ow;
    y0 = Math.floor(y0) - 1 - ow;
    x1 = Math.ceil(x1) + 2 + ow;
    y1 = Math.ceil(y1) + 3 + ow;
    const W3 = x1 - x0, H = y1 - y0;
    if (W3 * H > ids.length) ids = new Int16Array(W3 * H * 2), edges = new Uint8Array(W3 * H * 2);
    ids.fill(0, 0, W3 * H);
    items.forEach((it, k) => {
      const g = it.g, gh = g.rows.length, h = gh * it.sy, bot = it.y + h, sl = it.slant ?? 0;
      for (let py = Math.floor(it.y); py < Math.ceil(bot); py++) {
        const gy = Math.floor((py + 0.5 - it.y) / it.sy);
        if (gy < 0 || gy >= gh) continue;
        const shift = Math.round((bot - py - 0.5) / it.sy * sl);
        const ry = py + 0.5 - it.y - gy * it.sy, row = g.rows[gy];
        for (let px = Math.floor(it.x + shift) - 1; px <= Math.ceil(it.x + shift + g.w * it.sx); px++) {
          const fx = px + 0.5 - it.x - shift, gx = Math.floor(fx / it.sx);
          if (gx < 0 || gx >= g.w || !row[gx]) continue;
          const i = (py - y0) * W3 + (px - x0);
          if (i < 0 || i >= W3 * H) continue;
          ids[i] = k + 1;
          const rx = fx - gx * it.sx, up = gy > 0 ? g.rows[gy - 1] : null, dn = gy < gh - 1 ? g.rows[gy + 1] : null;
          const open = (r) => !r || !r[gx] && !r[gx - 1] && !r[gx + 1];
          edges[i] = (ry < 1 && open(up) ? 1 : 0) | (ry >= it.sy - 1 && open(dn) ? 2 : 0) | (rx < 1 && !(gx > 0 && row[gx - 1]) ? 4 : 0);
        }
      }
    });
    const at2 = (x, y) => x < x0 || y < y0 || x >= x1 || y >= y1 ? 0 : ids[(y - y0) * W3 + (x - x0)];
    const F = st.fill, nF = F.length, shine = st.shine, glint2 = st.glint ?? WHITE, sy0 = st.shineY ?? y0;
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++) {
        const id = at2(x, y);
        if (id) {
          const it = items[id - 1], v = (y + 0.5 - it.y) / (it.g.rows.length * it.sy);
          let i = Math.min(nF - 1, Math.max(0, Math.floor((1 - v) * nF)));
          let c = F[i];
          const e = edges[(y - y0) * W3 + (x - x0)];
          if (e & 1) c = st.edge ?? F[nF - 1];
          else if (e & 2) c = st.under ?? F[0];
          else if (e & 4 && i < nF - 1) c = F[i + 1];
          if (shine !== void 0 && shine !== null) {
            const d = Math.abs(x + 0.5 - (y + 0.5 - sy0) * 0.6 - shine);
            if (d < 1.1) c = WHITE;
            else if (d < 2.4) c = glint2;
          }
          if (it.flash > 0.6 || it.flash > 0.25 && v < 0.5) c = WHITE;
          p.dot(x, y, c, it.a ?? 1);
          continue;
        }
        let n = 0;
        for (let dy = -ow; dy <= ow && !n; dy++) for (let dx = -ow; dx <= ow && !n; dx++) if (ow < 2 || Math.abs(dx) + Math.abs(dy) < 4) n = at2(x + dx, y + dy);
        if (n) {
          p.dot(x, y, st.outline, items[n - 1].a ?? 1);
          continue;
        }
        const s = at2(x - ow, y - 1 - ow) || at2(x + 1 - ow, y - 1 - ow) || at2(x - ow, y - ow);
        if (s && st.shadow) p.dot(x, y, st.shadow, (items[s - 1].a ?? 1) * 0.9);
      }
  }
  function tintActor(p, A, k, ramp2) {
    if (!A || k <= 0.12) return;
    const m = A.mask, pix = A.pixels, cut2 = k > 0.6 ? 0 : k > 0.3 ? 0.22 : 0.5;
    for (let j = 0; j < m.h; j++)
      for (let i = 0; i < m.w; i++) {
        const q = j * m.w + i;
        if (!m.data[q]) continue;
        const l = pix ? luma(pix[q]) : 0.6;
        if (l < cut2) continue;
        p.px(A.x + i, A.y + j, l > 0.5 ? k > 0.8 ? WHITE : ramp2[2] : l > 0.22 ? ramp2[1] : ramp2[0]);
      }
  }
  function lightActor(p, A, c, k, rim = 0, t = 0) {
    if (!A || k <= 0.01 && rim <= 0.01) return;
    const m = A.mask, pix = A.pixels, has = (i, j) => i >= 0 && j >= 0 && i < m.w && j < m.h && m.data[j * m.w + i];
    for (let j = 0; j < m.h; j++)
      for (let i = 0; i < m.w; i++) {
        if (!m.data[j * m.w + i]) continue;
        if (k > 0.01) p.light(A.x + i, A.y + j, c, k * (1.1 - 0.5 * j / m.h));
        if (rim <= 0.01 || !has(i - 1, j) || !has(i + 1, j) || !has(i, j - 1)) continue;
        if (has(i - 2, j) && has(i + 2, j) && has(i, j - 2)) continue;
        const f = rim * (0.75 + 0.35 * noise(j * 0.6 - t * 8, i * 3));
        if (f > 0.25) p.px(A.x + i, A.y + j, mix(pix ? pix[j * m.w + i] || c : c, c, Math.min(0.85, f)));
      }
  }
  function haloActor(p, A, c, k, t = 0) {
    if (!A || k <= 0.02) return;
    p.outline(A.mask, A.x, A.y, c, (mx, my) => k * (0.75 + 0.45 * noise(my * 0.45 - t * 7, mx * 3)));
  }
  function shake(t, amp, t0 = 0, len2 = 0.3, seed = 1, hz = 32) {
    if (t < t0 || t > t0 + len2) return [0, 0];
    const k = 1 - (t - t0) / len2;
    return [Math.round(noise(t * hz, seed) * amp * k * 1.7), Math.round(noise(t * hz, seed + 7) * amp * k * 1.3)];
  }

  // fx/ui/combo-counter.js
  var meta16 = {
    name: "Combo counter",
    desc: "x5 COMBO rockets in on streaming speed lines, smearing, and slams to a stop: a white flash, a ring, sparks; it pulses while a timer bar drains, then whooshes out.",
    tags: ["ui", "combo", "counter", "combat", "text", "one-shot"],
    size: [208, 100],
    origin: [104, 50],
    duration: 1.45,
    loop: false,
    fps: 30,
    bg: "dark",
    options: { palette: ["#1a0516", "#3d0a33", "#701560", "#b0228f", "#f53cd1", "#ff86e6", "#ffd2f6", "#ffffff"], count: 5, label: "COMBO", seed: 6 }
  };
  var HIT = 0.1;
  var BEAT = 0.5;
  var OUT2 = 1.1;
  function speedLines(p, C, t, k, dir) {
    if (k <= 0.02) return;
    const f = Math.floor(t * 30);
    for (let i = 0; i < 18; i++) {
      if (rand(f, i, 3) > k) continue;
      const y = Math.round((rand(f, i, 1) - 0.5) * 60), L2 = 16 + rand(f, i, 2) * 50, x = (rand(f, i, 4) - 0.5) * 190;
      const x0 = Math.max(-100, x - L2 / 2), x1 = Math.min(100, x + L2 / 2);
      p.line(x0, y, x1, y, (u) => (dir > 0 ? u : 1 - u) > 0.75 ? WHITE : (dir > 0 ? u : 1 - u) > 0.35 ? C[6] : C[4], (u) => (dir > 0 ? u : 1 - u) < 0.25 ? 0.6 : 1);
    }
  }
  function create13(o) {
    const C = fit(o.palette, 8), R4 = new Rng(o.seed), SHADOW2 = scale(C[0], 0.5);
    const ps = new Particles({ rng: R4, sparks: [C[7], C[6], C[5], C[3]] }), lights = new Lights();
    const big = spell("x" + Math.round(o.count)), lab = spell(o.label);
    const BS = 4, LS = 2, W3 = big.w * BS + 4 + lab.w * LS, X02 = -W3 / 2, BASE = 12;
    const spikes2 = Array.from({ length: 10 }, (_, i) => [i / 10 * TAU + R4.range(-0.15, 0.15), R4.range(14, 24)]);
    let t = 0, hit = false, out = false;
    const xAt = (t2) => {
      t2 = Math.max(0, t2);
      if (t2 < HIT) return -32 * Math.pow(1 - t2 / HIT, 2);
      if (t2 < OUT2) return 7 * Math.exp(-(t2 - HIT) * 18) * Math.sin((t2 - HIT) * 34);
      const u = seg(t2, OUT2, OUT2 + 0.2);
      return u < 0.3 ? -4 * ease.outQuad(u / 0.3) : -4 + 24 * ease.inQuad((u - 0.3) / 0.7);
    };
    return {
      update(dt) {
        t += dt;
        if (!hit && t >= HIT) {
          hit = true;
          lights.add(0, 0, 70, C[5], 0.7, 0.4);
          lights.add(-20, 0, 34, WHITE, 0.8, 0.1);
          for (let i = 0; i < 26; i++) {
            const an = R4.range(-1.2, 1.2) + (R4.chance(0.3) ? Math.PI : 0), sp = R4.range(120, 300);
            ps.spawn(P.SPARK, R4.range(-20, 20), R4.range(-8, 8), Math.cos(an) * sp, Math.sin(an) * sp * 0.6 - 20, R4.range(0.12, 0.3));
          }
        }
        if (t > BEAT && t < OUT2 && R4.chance(0.1)) {
          const x = X02 + R4.range(0, big.w * BS), y = BASE - R4.range(0, 30);
          ps.spawn(P.STAR, x, y, R4.range(-10, 10), -R4.range(5, 20), R4.range(0.25, 0.45), R4.pick([C[7], C[6]]), R4.chance(0.3) ? 1.6 : 0.6);
        }
        if (!out && t >= OUT2 + 0.06) {
          out = true;
          for (let i = 0; i < 10; i++) ps.spawn(P.MOTE, R4.range(-50, 30), R4.range(-14, 10), R4.range(220, 320), R4.range(-10, 10), R4.range(0.06, 0.14), R4.pick([C[7], C[6]]), 1);
        }
        ps.update(dt);
        lights.update(dt);
      },
      draw(p) {
        const [sx, sy] = shake(t, 3, HIT, 0.25, o.seed);
        speedLines(p, C, t, t < HIT ? 1 : t < OUT2 ? Math.max(0, 1 - (t - HIT) / 0.35) * 0.9 : seg(t, OUT2 + 0.04, OUT2 + 0.12) * (1 - seg(t, OUT2 + 0.18, OUT2 + 0.3)), t >= OUT2 ? -1 : 1);
        const hk = t - HIT;
        if (hk >= 0 && hk < 0.07) {
          const cx = X02 + big.w * BS / 2, k = hk < 0.035 ? 1 : 1.3;
          for (const [an, L2] of spikes2) {
            const ca = Math.cos(an) * 1.4, sa = Math.sin(an);
            if (k === 1) p.beam(cx, 0, cx + ca * L2, sa * L2, 3, (u) => u < 0.5 ? WHITE : C[6]);
            else p.line(cx + ca * L2 * 0.5, sa * L2 * 0.5, cx + ca * L2 * k, sa * L2 * k, C[5]);
          }
        }
        const rk = (t - HIT) / 0.32;
        if (rk > 0 && rk < 1) {
          const r = 20 + 34 * ease.outCubic(rk);
          p.ellipse(sx, sy, r * 1.5, r * 0.75, rk < 0.3 ? WHITE : C[5], (d) => d > 1 - 1.5 / (r * 0.75) ? 1.25 - rk : 0);
        }
        ps.draw(p);
        const x = xAt(t), moving = t < HIT || t > OUT2 + 0.06, stretch = moving ? t < HIT ? 1.22 : 1.12 : 1;
        const pulse2 = Math.exp(-(((t - BEAT) / 0.05) ** 2)), flash = t >= HIT && t < HIT + 0.07 || pulse2 > 0.6 ? 1 : 0;
        const a = t > OUT2 ? 1 - seg(t, OUT2 + 0.08, OUT2 + 0.2) : t < 0.035 ? 0.5 : 1;
        const layout = (dx) => {
          const bs = BS * (1 + 0.12 * pulse2), items = [];
          const bx = X02 + dx - big.w * BS * (stretch - 1) / 2, by = BASE - 7 * bs;
          big.letters.forEach((L2) => L2.g && items.push({ g: L2.g, x: bx + L2.x * BS * stretch, y: by, sx: BS * stretch, sy: bs, slant: 1, flash, a }));
          const lx = X02 + dx + big.w * BS * stretch + 4;
          lab.letters.forEach((L2) => L2.g && items.push({ g: L2.g, x: lx + L2.x * LS * stretch, y: BASE - 7 * LS, sx: LS * stretch, sy: LS, slant: 0.5, flash, a }));
          return items;
        };
        if (moving && a > 0) {
          for (const [lag, c] of [[0.03, C[2]], [0.015, C[3]]]) {
            const items = layout(xAt(t - (t < HIT ? lag : -lag)) + sx);
            drawWord(p, items.map((it) => ({ ...it, flash: 0 })), { fill: [c], edge: c, under: c, outline: 0, shadow: 0 });
          }
        }
        if (a > 0) {
          const sh = seg(t, 0.62, 0.86), items = layout(x + sx);
          drawWord(p, items.map((it) => ({ ...it, y: it.y + sy })), { fill: [C[4], C[5], C[6], C[7]], edge: WHITE, under: C[3], outline: C[0], ow: 2, shadow: SHADOW2, shine: sh > 0 && sh < 1 ? X02 - 10 + (W3 + 24) * sh : null, shineY: BASE - 28, glint: C[6] });
          const bk = seg(t, HIT + 0.1, HIT + 0.2) * (t > OUT2 ? 0 : 1);
          if (bk > 0) {
            const bw = W3 * bk, left = 1 - seg(t, HIT + 0.2, OUT2), bx = X02 + x + sx, by = BASE + 5 + sy;
            p.rect(bx - 1, by - 1, bw + 2, 4, C[0]);
            p.rect(bx, by, bw, 2, C[1]);
            if (left > 0) p.rect(bx, by, bw * left, 2, C[5]), p.rect(bx, by, bw * left, 1, C[6]), p.px(bx + bw * left - 1, by, WHITE);
          }
        }
        p.glow(sx - 20, 0, 60, C[4], 0.2 * a + (t >= HIT && t < HIT + 0.15 ? 0.5 * (1 - (t - HIT) / 0.15) : 0) + 0.25 * pulse2);
        const g = (t - 0.86) / 0.22;
        if (g > 0 && g < 1) sparkle(p, X02 + W3 - 2, BASE - 14, 6 * Math.sin(g * Math.PI), C[7], C[5], 0.5);
        lights.draw(p);
      }
    };
  }

  // fx/ui/level-up.js
  var level_up_exports = {};
  __export(level_up_exports, {
    act: () => act6,
    create: () => create14,
    meta: () => meta17
  });
  var meta17 = {
    name: "Level up",
    desc: "Gold gathers at the feet and bursts up as a pillar of light round the hero; rings climb it, LEVEL UP! drops in letter by letter, a shine sweeps it, sparkles twinkle.",
    tags: ["ui", "level", "reward", "text", "light", "one-shot"],
    size: [176, 138],
    origin: [88, 114],
    duration: 3.2,
    loop: false,
    fps: 30,
    bg: "ground",
    actor: 2,
    options: { palette: ["#2a1405", "#5c3008", "#9a5a0e", "#d48e18", "#f5b92c", "#ffde5e", "#fff4bc", "#ffffff"], text: "LEVEL UP!", seed: 5 }
  };
  var COIL = { turn: 0.9, crouch: 7, lean: 2, fx: -6, fy: -13, bx: 7, by: -13, ffx: -5, fbx: 6 };
  var LEAP = { turn: 1.1, y: -16, crouch: -1, fx: -6, fy: -45, bx: 7, by: -44, ffx: -2, ffy: -8, fbx: 5, fby: -3, toeB: true };
  var PUMP = { turn: 0.9, crouch: 0, fx: -6, fy: -45, bx: 9, by: -15, ffx: -3, fbx: 4 };
  var act6 = {
    onBody: true,
    follow: 0,
    poses: [
      [-0.3, READY],
      [0.28, COIL],
      [0.3, LEAP, "snap"],
      [0.46, { ...LEAP, y: -19 }],
      [0.72, { ...LEAP, y: 0, ffy: -4, fby: -4 }, "in"],
      [0.74, { ...COIL, crouch: 5 }, "snap"],
      [0.95, PUMP, "out"],
      [1.2, { ...PUMP, crouch: 1, fy: -43 }],
      [1.45, PUMP],
      [2.3, { ...PUMP, fy: -41 }],
      [2.8, READY],
      [3.2, READY]
    ],
    hits: [{ t: 0.28, stop: 0.05, shake: 0.14, amp: 2 }],
    dust: [{ t: 0.3, x: 0, n: 7 }, { t: 0.74, x: 0, n: 6 }]
  };
  var REL = 0.28;
  var RET = 1.02;
  var GONE2 = 1.34;
  var TOP2 = 100;
  var TY = -68;
  var DROP = 0.5;
  var STAG = 0.05;
  var LANDED = 1.06;
  var SHINE = 1.24;
  var EXIT = 2.3;
  var STRANDS = Array.from({ length: 9 }, (_, i) => ({ x: (i / 8 - 0.5) * 1.5 + (rand(i, 1) - 0.5) * 0.16, sp: 170 + rand(i, 2) * 170, per: 10 + rand(i, 3) * 16, duty: 0.3 + rand(i, 4) * 0.35, ph: rand(i, 5), lvl: rand(i, 6) < 0.35 ? 1 : 2, end: 0.5 + rand(i, 7) * 0.42 }));
  var widthAt = (t) => t < REL ? 0 : 12 * (1 + 0.4 * Math.exp(-(t - REL) * 10)) * (1 - 0.82 * smooth(RET - 0.12, RET + 0.16, t));
  function column(p, C, t) {
    const a = t - REL;
    if (a < 0 || t > GONE2) return;
    const top = -TOP2 * ease.outExpo(clamp(a / 0.12)), bot = -TOP2 * ease.inCubic(seg(t, RET, GONE2)), W3 = widthAt(t), k = 1 - smooth(RET, GONE2, t);
    p.glowLine(0, top, 0, Math.min(bot, -34), W3 * 1.6 + 6, C[5], 0.2 * k + 0.06);
    p.glowLine(0, top, 0, Math.min(bot, -40), 5, WHITE, 0.18 * k);
    if (a < 0.04) {
      for (let y = Math.floor(top); y < bot; y++) {
        const wr = W3 * 0.55 * (1 - 0.3 * (-y / TOP2));
        for (let x = Math.floor(-wr); x <= Math.ceil(wr); x++) p.dot(x, y, Math.abs(x + 0.5) < wr - 1.5 ? WHITE : C[6], clamp((y + TOP2) / 20) * 1.5);
      }
      return;
    }
    for (let y = Math.ceil(top); y < Math.ceil(bot); y++) {
      const h = -y / TOP2, fade = clamp((y + TOP2) / 16) * (t < RET ? 1 : clamp((bot - y) / 10)), head = y - top < 3 && a < 0.16;
      const wr = W3 * (1 - 0.3 * h) + 0.9 * noise2(y * 0.2, t * 12, 3);
      for (const s of [-1, 1]) {
        const run = fract(y * 0.06 + t * 3.4 + (s > 0 ? 0.5 : 0)) < 0.78, xw = s * wr;
        p.dot(xw, y, head ? WHITE : run ? C[6] : C[5], fade * 1.4);
        p.dot(xw + s, y, C[4], fade * (run ? 0.5 : 0.25));
        if (run) p.dot(xw - s, y, C[5], fade * 1.2);
      }
      p.dot(0, y, WHITE, fade * 1.6);
      p.dot(-1, y, noise2(y * 0.3, t * 14, 5) > -0.2 ? WHITE : C[6], fade * 1.3);
      if (noise2(y * 0.25, t * 9, 8) > 0.25) p.dot(1, y, C[6], fade * 1.2);
      for (const S of STRANDS) {
        if (h > S.end) continue;
        const ph = fract((y + t * S.sp) / S.per + S.ph);
        if (ph > S.duty) continue;
        const u = ph / S.duty;
        p.px(S.x * wr, y, head || u < 0.2 ? WHITE : u < 0.65 ? C[7 - S.lvl] : C[6 - S.lvl]);
      }
    }
  }
  function plate(p, C, t, k) {
    if (k <= 0.02) return;
    const rx = 9 + 9 * k + Math.sin(t * 9), ry = 2.2;
    p.shade(-rx, -ry, rx, ry, (x, y, o) => {
      const dx = x / rx, dy = y / ry, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) return;
      const u = d / Math.max(0.05, k);
      o.c = u < 0.3 ? WHITE : u < 0.55 ? C[6] : u < 0.8 ? C[5] : C[4];
      o.a = d < 0.6 * k ? 1 : k * (1 - d) * 2.2;
    });
    p.glow(0, -1, rx * 2.2, C[4], 0.35 * k);
  }
  function rays(p, C, t, k, cx, cy) {
    if (k <= 0.02) return;
    for (let i = 0; i < 20; i++) {
      const an = i / 20 * TAU + 0.08, ca = Math.cos(an), sa = Math.sin(an), long = i % 2 === 0;
      if (Math.abs(sa) < 0.4) continue;
      const r0 = 1 / Math.sqrt((ca / 52) ** 2 + (sa / 12) ** 2) + 2 * k, len2 = (long ? 15 + 7 * rand(i, 9) : 7 + 4 * rand(i, 8)) * k;
      if (len2 < 1) continue;
      const sh = 0.75 + 0.25 * Math.sin(t * 7 + i * 2.1), x0 = cx + ca * r0, y0 = cy + sa * r0;
      p.line(x0, y0, x0 + ca * len2, y0 + sa * len2, (u) => u < 0.3 ? C[7] : u < 0.6 ? C[6] : C[5], (u) => sh * (u < 0.55 ? 1.3 : 1.3 * (1 - u) / 0.45));
    }
  }
  function create14(o) {
    const C = fit(o.palette, 8), R4 = new Rng(o.seed), A = o.actor, SHADOW2 = scale(C[0], 0.5);
    const ps = new Particles({ rng: R4, ground: () => 0, sparks: [C[7], C[6], C[5], C[3]] }), lights = new Lights();
    const spawn = (k, x, y, vx, vy, life, ...rest) => ps.spawn(k, x, y, vx, vy, Math.min(life, meta17.duration - 0.05 - t), ...rest);
    const word = spell(o.text), BASE = TY + 14, X02 = -word.w;
    const lets = word.letters.filter((L2) => L2.g).map((L2, i) => ({ g: L2.g, w: L2.w, cx: X02 + (L2.x + L2.w / 2) * 2, born: DROP + i * STAG, pop: EXIT + i * 0.04, off: -18, v: 60, sq: 0, flash: 0, on: false, landed: false, rest: false, burst: false }));
    const right = X02 + word.w * 2;
    const sats = Array.from({ length: 8 }, (_, i) => {
      const s = i % 2 ? 1 : -1, x = s * R4.range(20, 60), y = TY + 7 + (Math.abs(x) < 50 ? R4.sign() * R4.range(11, 18) : R4.range(-14, 14));
      return { x, y, t0: SHINE - 0.1 + i * 0.13 + R4.range(0, 0.05), dur: R4.range(0.32, 0.5), L: R4.range(3, 6) };
    });
    const halos = [];
    let t = 0, released = false, nextHalo = REL + 0.03, gather = 0;
    const rush = [];
    const drawRush = (p, back) => {
      for (const m of rush) {
        if (m.back !== back) continue;
        const sp = Math.hypot(m.vx, m.vy), ux = m.vx / sp, uy = m.vy / sp, L2 = m.len;
        p.line(m.x - ux * L2, m.y - uy * L2, m.x - ux * L2 * 0.4, m.y - uy * L2 * 0.4, m.c);
        p.line(m.x - ux * L2 * 0.35, m.y - uy * L2 * 0.35, m.x, m.y, WHITE);
        p.glow(m.x, m.y, 4, C[5], 0.25);
      }
    };
    return {
      update(dt) {
        t += dt;
        for (gather += t < REL ? dt * 420 : 0; gather >= 1; gather--) {
          const kind = R4.next(), sp = R4.range(140, 250) * (1 + t * 2);
          let x, y, tx, ty;
          if (kind < 0.42) {
            const an = R4.range(0, TAU), D3 = R4.range(22, 70);
            x = Math.cos(an) * D3, y = -1 - Math.abs(Math.sin(an)) * D3 * 0.1, tx = Math.cos(an) * 3, ty = -1;
          } else if (kind < 0.84) {
            const an = R4.range(0, TAU), D3 = R4.range(34, 64);
            x = Math.cos(an) * D3, y = Math.min(-3, -20 + Math.sin(an) * D3 * 0.85), tx = Math.cos(an) * 11, ty = -20 + Math.sin(an) * 14;
          } else {
            if (t < REL * 0.4) continue;
            x = R4.range(-9, 9), y = -1, tx = x * 0.7, ty = -R4.range(26, 44);
          }
          const dx = tx - x, dy = ty - y, l = Math.hypot(dx, dy) || 1;
          rush.push({ x, y, vx: dx / l * sp, vy: dy / l * sp, life: Math.min(l / sp, REL + 0.06 - t), len: R4.range(5, 9), c: R4.chance(0.45) ? C[6] : C[5], back: kind > 0.84 && R4.chance(0.5) });
        }
        for (let i = rush.length - 1; i >= 0; i--) {
          const m = rush[i];
          if ((m.life -= dt) <= 0) rush.splice(i, 1);
          else m.x += m.vx * dt, m.y += m.vy * dt;
        }
        if (t < REL && R4.chance(0.12)) spawn(P.STAR, R4.range(-30, 30), -R4.range(0, 3), 0, -R4.range(10, 30), R4.range(0.3, 0.5), C[6], 0.6);
        if (!released && t >= REL) {
          released = true;
          lights.add(0, -24, 90, C[5], 0.6, 0.7);
          lights.add(0, -8, 40, WHITE, 0.6, 0.12);
          for (let i = 0; i < 22; i++) {
            const an = i / 22 * TAU + R4.range(-0.12, 0.12), sp = R4.range(260, 460);
            const y0 = -18 + Math.sin(an) * 8, vy = Math.sin(an) * sp * 0.8, life = Math.min(R4.range(0.1, 0.2), vy > 0 ? -y0 / vy : vy < 0 ? (y0 + 104) / -vy : 1, 78 / Math.abs(Math.cos(an) * sp));
            spawn(P.MOTE, Math.cos(an) * 6, y0, Math.cos(an) * sp, vy, life, R4.chance(0.4) ? C[7] : C[6], 1, 0, an > 0.3 && an < Math.PI - 0.3 ? PF.BACK : 0);
          }
          for (let i = 0; i < 26; i++) {
            const an = -Math.PI / 2 + R4.range(-1.3, 1.3), sp = R4.range(120, 290);
            spawn(P.SPARK, R4.range(-5, 5), -2, Math.cos(an) * sp, Math.sin(an) * sp, R4.range(0.35, 0.8));
          }
          for (let i = 0; i < 16; i++)
            spawn(P.STAR, R4.range(-10, 10), R4.range(-36, -4), R4.range(-30, 30), -R4.range(15, 60), R4.range(0.6, 1.3), R4.pick([C[7], C[6], C[5]]), R4.chance(0.35) ? R4.range(1.5, 2.6) : R4.range(0.4, 0.9), 0, R4.chance(0.4) ? PF.BACK : 0);
        }
        const W3 = widthAt(t);
        if (t >= nextHalo && t < RET - 0.1) halos.push(t), nextHalo += 0.16;
        if (t > REL && t < RET + 0.1 && R4.chance(0.5)) {
          const s = R4.sign();
          const y = R4.range(-4, -60), vy = -R4.range(140, 260);
          spawn(P.MOTE, s * R4.range(0.75, 1.6) * W3, y, 0, vy, Math.min(R4.range(0.16, 0.32), (y + 96) / -vy), R4.chance(0.5) ? C[7] : C[6], R4.range(0.6, 1), 0, R4.chance(0.5) ? PF.BACK : 0);
        }
        if (t > REL && t < 2.4 && R4.chance(0.14 * (1 - seg(t, 1.6, 2.4)))) {
          spawn(P.EMBER, R4.range(-20, 20), -R4.range(1, 30), R4.range(-15, 15), -R4.range(20, 55), R4.range(0.8, 1.6), C[5], R4.range(1, 2), 0, R4.chance(0.4) ? PF.BACK : 0);
        }
        if (A && t > REL + 0.1 && t < 2.2 && R4.chance(0.09)) {
          const m = A.mask;
          for (let n = 0; n < 12; n++) {
            const i = R4.int(0, m.w - 1), j = R4.int(0, m.h - 1);
            if (!m.data[j * m.w + i]) continue;
            spawn(P.STAR, A.x + i + 0.5, A.y + j + 0.5, R4.range(-8, 8), -R4.range(14, 34), R4.range(0.6, 1.1), R4.pick([C[7], C[6], C[5]]), R4.chance(0.2) ? 1.5 : 0.6, 0, R4.chance(0.5) ? PF.BACK : 0);
            break;
          }
        }
        if (t > 1 && t < 2.5 && R4.chance(0.13)) {
          const up = R4.chance(0.6), x = up ? R4.range(-58, 58) : R4.range(-20, 20), y = up ? TY + 7 + R4.range(-16, 16) : R4.range(-44, -6);
          spawn(P.STAR, x, y, R4.range(-6, 6), -R4.range(4, 14), R4.range(0.4, 0.8), R4.pick([C[7], C[6], C[6], C[5]]), R4.chance(0.3) ? R4.range(1.5, 2.4) : 0.6, 0, R4.chance(0.3) ? PF.BACK : 0);
        }
        for (const L2 of lets) {
          if (t < L2.born) continue;
          L2.on = true;
          if (!L2.rest) {
            L2.v += 1700 * dt;
            L2.off += L2.v * dt;
            if (L2.off >= 0 && L2.v > 0) {
              L2.off = 0;
              if (L2.v > 110) {
                L2.sq = 1;
                if (!L2.landed) {
                  L2.landed = true;
                  L2.flash = 1;
                  lights.add(L2.cx, BASE - 7, 18, C[5], 0.55, 0.25);
                  for (const s of [-1, 1]) spawn(P.STAR, L2.cx + s * L2.w, BASE - R4.range(0, 3), s * R4.range(15, 40), -R4.range(5, 25), R4.range(0.25, 0.45), C[6], R4.range(0.5, 1.2));
                }
                L2.v = -L2.v * 0.3;
              } else L2.v = 0, L2.rest = true;
            }
          }
          L2.sq = Math.max(0, L2.sq - dt / 0.1);
          L2.flash = Math.max(0, L2.flash - dt / 0.12);
          if (!L2.burst && t >= L2.pop + 0.06) {
            L2.burst = true;
            for (let i = 0; i < 3; i++) {
              const an = R4.range(0, TAU), sp = R4.range(20, 55);
              spawn(P.STAR, L2.cx + R4.range(-3, 3), BASE - 7 + R4.range(-4, 4), Math.cos(an) * sp, Math.sin(an) * sp - 15, R4.range(0.3, 0.6), R4.pick([C[7], C[6]]), i ? 0.6 : R4.range(1.2, 2));
            }
          }
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        rays(p, C, t, ease.outExpo(seg(t, LANDED, LANDED + 0.2)) * (1 - ease.inQuad(seg(t, EXIT - 0.15, EXIT + 0.1))), 0, TY + 7);
        if (t < REL) {
          const k = seg(t, 0.02, REL);
          band(p, 0, 0, 4 + 52 * (1 - ease.inQuad(k)), 0.2, 1.5, k * 1.1, C, (g) => Math.sin(g) < 0);
        }
        for (const [d, r1, th] of [[0, 72, 4], [0.08, 46, 2.5]]) {
          const k = (t - REL - d) / 0.55;
          if (k > 0 && k < 1) band(p, 0, 0, 5 + r1 * ease.outCubic(k), 0.2, Math.max(1, th * (1 - k)), 1.15 - k, C, (g) => Math.sin(g) < 0, k < 0.15);
        }
        for (const h0 of halos) {
          const k = (t - h0) / 0.6;
          if (k > 0 && k < 1) band(p, 0, -2 - 72 * ease.outQuad(k), (widthAt(t) * 1.45 + 4) * (1 - 0.4 * k), 0.3, 1.5, (1 - k) * 1.4, C, (g) => Math.sin(g) < 0, k < 0.12);
        }
        column(p, C, t);
        plate(p, C, t, t < REL ? 0.55 * seg(t, 0.05, REL) : 1 - smooth(RET - 0.1, GONE2 + 0.2, t));
        ps.draw(p, "back");
        drawRush(p, true);
      },
      draw(p) {
        if (t < REL) {
          const k = seg(t, 0.02, REL);
          band(p, 0, 0, 4 + 52 * (1 - ease.inQuad(k)), 0.2, 1.5, k * 1.1, C, (g2) => Math.sin(g2) >= 0);
        }
        for (const [d, r1, th] of [[0, 72, 4], [0.08, 46, 2.5]]) {
          const k = (t - REL - d) / 0.55;
          if (k > 0 && k < 1) band(p, 0, 0, 5 + r1 * ease.outCubic(k), 0.2, Math.max(1, th * (1 - k)), 1.15 - k, C, (g2) => Math.sin(g2) >= 0, k < 0.15);
        }
        for (const h0 of halos) {
          const k = (t - h0) / 0.6;
          if (k > 0 && k < 1) band(p, 0, -2 - 72 * ease.outQuad(k), (widthAt(t) * 1.45 + 4) * (1 - 0.4 * k), 0.3, 1.5, (1 - k) * 1.4, C, (g2) => Math.sin(g2) >= 0, k < 0.12);
        }
        const lit = smooth(REL - 0.02, REL + 0.04, t) * (1 - smooth(RET, 2.5, t));
        tintActor(p, A, t < REL ? 0 : t < REL + 0.06 ? 1 : Math.exp(-(t - REL - 0.06) / 0.07), [C[4], C[5], C[6]]);
        lightActor(p, A, C[5], 0.1 * seg(t, 0.05, REL) * (1 - lit) + 0.06 * lit, 0.6 * lit, t);
        haloActor(p, A, C[5], 0.85 * lit * (1 - smooth(RET, GONE2 + 0.3, t)) + 0.3 * lit, t);
        if (t < REL) {
          const k = seg(t, 0.05, REL), beat2 = 1 + 0.4 * Math.exp(-((t - REL * 0.6) ** 2) / 1e-3);
          sparkle(p, 0, -2, (1 + 4 * k * k) * beat2, C[6], C[5], 0.3 + 0.4 * k);
        } else if (t < REL + 0.22) {
          const a = (t - REL) / 0.22;
          flare(p, 0, -4, 28 * Math.pow(1 - a, 1.5), 1 - a, C);
          p.glow(0, -16, 48, WHITE, 0.3 * (1 - a));
        }
        ps.draw(p, "front");
        drawRush(p, false);
        const items = [], done = (t - LANDED) / 0.12;
        for (const L2 of lets) {
          if (!L2.on) continue;
          let sx = 2, sy = 2, flash = L2.flash;
          if (!L2.landed && L2.v > 150) sx = 1.8, sy = 2.3;
          if (L2.sq > 0) sx = 2 * (1 + 0.22 * L2.sq), sy = 2 * (1 - 0.22 * L2.sq);
          const pu = (t - L2.pop) / 0.07, hop = seg(t, L2.pop - 0.1, L2.pop);
          if (pu >= 1) continue;
          if (hop > 0 && pu <= 0) sx = 2 * (1 - 0.1 * hop), sy = 2 * (1 + 0.15 * hop);
          if (pu > 0) sx = sy = 2 * (1 + 0.3 * pu), flash = 1;
          flash = Math.max(flash, done > 0 && done < 1 ? 1 - done : 0);
          const h = 7 * sy, w = L2.w * sx;
          items.push({ g: L2.g, x: L2.cx - w / 2, y: BASE + L2.off - h - 3 * ease.outQuad(hop), sx, sy, a: clamp((t - L2.born) / 0.05), flash });
        }
        const sh = seg(t, SHINE, SHINE + 0.34), shine = sh > 0 && sh < 1 ? X02 - 14 + (right - X02 + 30) * ease.inOutSine(sh) : null;
        drawWord(p, items, { fill: [C[3], C[4], C[5], C[6]], edge: WHITE, under: C[2], outline: C[0], shadow: SHADOW2, shine, shineY: TY, glint: C[6] });
        if (shine !== null && shine > X02 && shine < right) p.glowLine(shine, TY, shine + 8.4, BASE, 9, C[6], 0.3);
        const hold = smooth(0.9, 1.2, t) * (1 - smooth(EXIT, EXIT + 0.4, t));
        if (hold > 0) p.glow(0, TY + 7, 50, C[5], 0.22 * hold + (done > 0 && done < 1 ? 0.3 * (1 - done) : 0));
        for (const L2 of lets) {
          const u = (t - L2.pop - 0.07) / 0.16;
          if (u > 0 && u < 1) sparkle(p, L2.cx, BASE - 7, 6 * (1 - u) * (1 - u), C[6], C[5], 0.5);
        }
        const g = (t - SHINE - 0.3) / 0.26;
        if (g > 0 && g < 1) sparkle(p, right - 2, TY + 1, 7 * Math.sin(g * Math.PI), C[6], C[5], 0.6);
        for (const s of sats) {
          const u = (t - s.t0) / s.dur;
          if (u > 0 && u < 1) sparkle(p, s.x, s.y, s.L * Math.pow(Math.sin(u * Math.PI), 0.7), C[6], C[5], 0.5);
        }
        lights.draw(p);
      }
    };
  }

  // fx/ui/confetti.js
  var confetti_exports = {};
  __export(confetti_exports, {
    create: () => create15,
    meta: () => meta18
  });
  var meta18 = {
    name: "Confetti",
    desc: "Two party poppers bang one after the other: paper bits and curly streamers burst out, stall, then tumble and flutter down, flipping, and settle on the floor.",
    tags: ["ui", "celebration", "confetti", "party", "reward", "one-shot"],
    size: [200, 140],
    origin: [100, 126],
    duration: 3.4,
    loop: false,
    fps: 30,
    bg: "ground",
    options: { palette: ["#ff4a5a", "#ff9a2a", "#ffe03c", "#5ad84a", "#3cc8ff", "#7a6cff", "#f53cd1"], seed: 11 }
  };
  var POPPERS = [
    { x: -74, y: -1, a: -Math.PI / 2 + 0.62, t: 0.1 },
    { x: 74, y: -1, a: -Math.PI / 2 - 0.62, t: 0.26 }
  ];
  var INK5 = hex("#141019");
  function popper(p, x, y, a, k, C, alpha) {
    const ca = Math.cos(a), sa = Math.sin(a), bx = x - ca * k, by = y - sa * k;
    p.shade(bx - 12, by - 12, bx + 12, by + 12, (px, py, o) => {
      const dx = px - bx, dy = py - by, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
      if (u < 0 || u > 11) return;
      const hw = 0.8 + u * 0.32;
      if (Math.abs(v) > hw + 0.6) return;
      o.a = alpha;
      if (Math.abs(v) > hw - 0.4 || u > 10.2 || u < 0.8) return INK5;
      const stripe = Math.floor((u + v * 0.6) / 2.2) % 2 === 0;
      return stripe ? v < 0 ? C[2] : scale(C[2], 0.75) : v < 0 ? WHITE : hex("#c8c0d8");
    });
  }
  function create15(o) {
    const C = fit(o.palette, 7), R4 = new Rng(o.seed);
    const ps = new Particles({ rng: R4, ground: () => 0, sparks: ["#ffffff", "#fff3a6", "#ffc23d", "#ff8a2a"] }), lights = new Lights();
    const bits = [], ribbons = [], fired = [false, false], end = meta18.duration - 0.05;
    const kick = (t2, pp) => t2 < pp.t ? 0 : 3 * Math.exp(-(t2 - pp.t) * 14);
    function fire(pp) {
      const mx = pp.x + Math.cos(pp.a) * 11, my = pp.y + Math.sin(pp.a) * 11;
      lights.add(mx, my, 34, WHITE, 0.6, 0.12);
      lights.add(mx, my, 50, C[2], 0.4, 0.4);
      for (let i = 0; i < 6; i++) ps.spawn(P.SMOKE, mx, my, Math.cos(pp.a) * R4.range(20, 60) + R4.range(-10, 10), Math.sin(pp.a) * R4.range(20, 60), R4.range(0.6, 1), hex("#5d5660"), R4.range(2.5, 4));
      for (let i = 0; i < 12; i++) {
        const an = pp.a + R4.range(-0.5, 0.5), sp = R4.range(120, 260);
        ps.spawn(P.SPARK, mx, my, Math.cos(an) * sp, Math.sin(an) * sp, R4.range(0.1, 0.25));
      }
      for (let i = 0; i < 46; i++) {
        const an = pp.a + R4.range(-0.38, 0.38), sp = R4.range(200, 380);
        bits.push({ x: mx, y: my, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, c: R4.pick(C), w: R4.range(2, 3), h: R4.range(3, 4.6), ang: R4.range(0, TAU), spin: R4.range(-14, 14), flip: R4.range(0, TAU), fs: R4.range(5, 13), ph: R4.range(0, TAU), amp: R4.range(5, 12), fw: R4.range(2, 3.4), x0: 0, mode: 0, rest: 0, fall: R4.range(26, 40) });
      }
      for (let i = 0; i < 4; i++) {
        const an = pp.a + R4.range(-0.25, 0.25), sp = R4.range(220, 330), n = 11;
        ribbons.push({ pts: Array.from({ length: n }, () => [mx, my]), vx: Math.cos(an) * sp, vy: Math.sin(an) * sp, c: R4.pick(C), ph: R4.range(0, TAU), amp: R4.range(6, 12), fw: R4.range(1.5, 2.4), mode: 0, x0: 0, curl: R4.range(0.7, 1.1), fall: R4.range(22, 32) });
      }
    }
    let t = 0;
    return {
      update(dt) {
        t += dt;
        POPPERS.forEach((pp, i) => !fired[i] && t >= pp.t && (fired[i] = true, fire(pp)));
        for (const b of bits) {
          if (b.mode === 2) {
            b.rest += dt;
            continue;
          }
          b.flip += b.fs * dt;
          if (b.mode === 0) {
            b.vx -= b.vx * 3.4 * dt;
            b.vy -= b.vy * 3.4 * dt - 140 * dt;
            b.x += b.vx * dt;
            b.y += b.vy * dt;
            b.ang += b.spin * dt;
            if (Math.hypot(b.vx, b.vy) < 40) b.mode = 1, b.x0 = b.x - Math.sin(b.ph) * b.amp;
          } else {
            b.ph += b.fw * dt;
            b.x0 += b.vx * dt;
            b.vx -= b.vx * 2 * dt;
            b.x = b.x0 + Math.sin(b.ph) * b.amp;
            b.y += b.fall * (0.4 + 0.9 * Math.abs(Math.cos(b.ph))) * dt;
            b.ang = Math.cos(b.ph) * 0.9;
            if (b.y >= -1) b.y = -0.5, b.mode = 2, b.ang = R4.range(-0.3, 0.3), b.flip = 0;
          }
        }
        for (const r of ribbons) {
          const h = r.pts[0];
          if (r.mode === 0) {
            r.vx -= r.vx * 3 * dt;
            r.vy -= r.vy * 3 * dt - 120 * dt;
            h[0] += r.vx * dt;
            h[1] += r.vy * dt;
            if (Math.hypot(r.vx, r.vy) < 35) r.mode = 1, r.x0 = h[0] - Math.sin(r.ph) * r.amp;
          } else if (h[1] < -1) {
            r.ph += r.fw * dt;
            r.x0 += r.vx * dt;
            r.vx -= r.vx * 2 * dt;
            h[0] = r.x0 + Math.sin(r.ph) * r.amp;
            h[1] += r.fall * (0.5 + 0.7 * Math.abs(Math.cos(r.ph))) * dt;
          }
          for (let i = 1; i < r.pts.length; i++) {
            const a = r.pts[i - 1], b = r.pts[i];
            b[1] = Math.min(-0.5, b[1] + 20 * dt);
            const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
            if (d > 2.6) b[0] = a[0] + dx / d * 2.6, b[1] = a[1] + dy / d * 2.6;
          }
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        ps.draw(p, "back");
      },
      draw(p) {
        const fade = 1 - seg(t, end - 0.45, end - 0.05);
        for (const pp of POPPERS) {
          const k = kick(t, pp);
          popper(p, pp.x, pp.y, pp.a, k, C, 1 - seg(t, 2.5, 2.9));
          const ft = t - pp.t;
          if (ft > 0 && ft < 0.12) sparkle(p, pp.x + Math.cos(pp.a) * 13, pp.y + Math.sin(pp.a) * 13, 7 * (1 - ft / 0.12), WHITE, C[2], 0.7);
        }
        for (const r of ribbons) {
          const pts = r.pts.map(([x, y], i) => [x + Math.sin(i * r.curl + t * 9 + r.ph) * (i ? 1.6 : 0), y]);
          for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], front = Math.sin(i * r.curl + t * 9 + r.ph) > 0;
            p.line(x0, y0, x1, y1, front ? r.c : scale(r.c, 0.6), fade);
            p.line(x0 + 1, y0, x1 + 1, y1, front ? mix(r.c, WHITE, 0.35) : scale(r.c, 0.45), fade);
          }
        }
        for (const b of bits) {
          if (b.y > 1) continue;
          const fw = b.mode === 2 ? 1 : Math.cos(b.flip), w = Math.max(0.5, Math.abs(fw) * b.w), ca = Math.cos(b.ang), sa = Math.sin(b.ang);
          const c = fw >= 0 ? b.c : scale(b.c, 0.62), a = fade;
          if (b.mode === 2) {
            p.dot(b.x, b.y, scale(b.c, 0.8), a);
            p.dot(b.x + 1, b.y, scale(b.c, 0.6), a);
            continue;
          }
          p.shade(b.x - 4, b.y - 4, b.x + 4, b.y + 4, (x, y, out) => {
            const dx = x - b.x, dy = y - b.y, u = dx * ca + dy * sa, v = -dx * sa + dy * ca;
            if (Math.abs(u) > w / 2 + 0.2 || Math.abs(v) > b.h / 2) return;
            out.a = a;
            return Math.abs(fw) > 0.92 && v < -b.h / 2 + 1 ? WHITE : c;
          });
          if (Math.abs(fw) > 0.97) p.glow(b.x, b.y, 5, mix(b.c, WHITE, 0.5), 0.35 * fade);
        }
        ps.draw(p, "front");
        lights.draw(p);
      }
    };
  }

  // fx/holy/sunburst.js
  var sunburst_exports = {};
  __export(sunburst_exports, {
    draw: () => draw4,
    meta: () => meta19
  });

  // fx/holy/_lib.js
  var GOLD = ["#3b1d2a", "#7a3a2c", "#c4652e", "#f0a040", "#ffd25e", "#fff0a0", "#fffbe0", "#ffffff"];
  var SHAPES = /* @__PURE__ */ new WeakMap();
  function shapeOf(A) {
    let s = SHAPES.get(A.mask);
    if (s && s.x === A.x && s.y === A.y) return s;
    const m = A.mask, inside = (i, j) => i >= 0 && j >= 0 && i < m.w && j < m.h && m.data[j * m.w + i] > 0;
    const edge = [], out = [];
    for (let j = -1; j <= m.h; j++)
      for (let i = -1; i <= m.w; i++) {
        const nb = inside(i - 1, j) + inside(i + 1, j) + inside(i, j - 1) + inside(i, j + 1);
        if (inside(i, j)) {
          if (nb < 4) edge.push([A.x + i, A.y + j]);
        } else if (nb) out.push([A.x + i, A.y + j]);
      }
    s = { x: A.x, y: A.y, edge, out, top: A.y, bottom: A.y + m.h, at: (x, y) => inside(Math.floor(x) - A.x, Math.floor(y) - A.y) };
    SHAPES.set(A.mask, s);
    return s;
  }

  // fx/holy/sunburst.js
  var meta19 = {
    name: "Sunburst",
    desc: "A white-hot core in a gold corona; long and short rays turn slowly round it, breathing, with glints running out along them that wink at the tips.",
    tags: ["holy", "sun", "radiant", "rays", "light", "glow", "loop"],
    size: [128, 128],
    origin: [64, 64],
    duration: 4,
    loop: true,
    fps: 30,
    bg: "dark",
    options: { palette: GOLD, rays: 8, seed: 3 }
  };
  var CORE3 = 4.5;
  var RING = 7.5;
  var R02 = 9;
  var frac = (x) => x - Math.floor(x);
  function ray2(p, C, a, L2, w0, k) {
    const ca = Math.cos(a), sa = Math.sin(a), x1 = ca * (R02 + L2), y1 = sa * (R02 + L2), pad = w0 + 1;
    p.shade(Math.min(0, x1) - pad, Math.min(0, y1) - pad, Math.max(0, x1) + pad, Math.max(0, y1) + pad, (x, y, out) => {
      const along = x * ca + y * sa - R02, u = along / L2;
      if (u < 0 || u > 1) return;
      const across = Math.abs(-x * sa + y * ca), w = w0 / 2 * (1 - u * 0.85) + 0.25;
      if (across > w) return;
      const spine = across < 0.5, rim = across > w - 0.6 && w > 0.9;
      out.c = spine ? u < 0.4 ? WHITE : u < 0.75 ? C[6] : C[5] : rim && u > 0.15 ? C[3] : u < 0.3 ? C[6] : u < 0.62 ? C[5] : C[4];
      out.a = u < 0.72 ? k : k * (1 - (u - 0.72) / 0.28) * 1.2;
    });
    p.glowLine(ca * R02, sa * R02, ca * (R02 + L2 * 0.8), sa * (R02 + L2 * 0.8), 5, C[5], 0.16 * k);
  }
  function draw4(p, t, o) {
    const C = fit(o.palette, 8), N3 = o.rays * 2, T2 = meta19.duration, rot = t / T2 * (2 * TAU / N3);
    p.glow(0, 0, 62, C[4], 0.3 + 0.06 * Math.sin(t / T2 * TAU * 2));
    for (let i = 0; i < N3; i++) {
      const a = rot + (i + 0.5) * TAU / N3, L2 = 14 + 6 * Math.sin(a * 3 + t / T2 * TAU);
      p.line(Math.cos(a) * (R02 + 1), Math.sin(a) * (R02 + 1), Math.cos(a) * (R02 + L2), Math.sin(a) * (R02 + L2), (u) => u < 0.3 ? C[6] : C[5], (u) => 0.7 - u * 0.8);
    }
    for (let i = 0; i < N3; i++) {
      const a = rot + i * TAU / N3, long = i % 2 === 0, breathe = 0.86 + 0.14 * Math.sin(a * 3 - t / T2 * TAU * 2);
      const L2 = (long ? 36 : 21) * breathe;
      ray2(p, C, a, L2, long ? 4 : 2.6, 1);
      if (long) {
        const g = frac(t / T2 * 2 + a * 3 / TAU), r = R02 + g * L2;
        if (g < 0.9) {
          p.px(Math.cos(a) * r, Math.sin(a) * r, WHITE);
          p.glow(Math.cos(a) * r, Math.sin(a) * r, 5, C[6], 0.45 * (1 - g));
        } else sparkle(p, Math.cos(a) * (R02 + L2), Math.sin(a) * (R02 + L2), 1 + 3 * Math.sin((g - 0.9) / 0.1 * Math.PI), WHITE, C[6], 0.5);
      }
    }
    p.shade(-RING - 2, -RING - 2, RING + 2, RING + 2, (x, y, out) => {
      const d = Math.hypot(x, y);
      if (d > RING) return;
      const flick = 0.5 + 0.5 * Math.sin(Math.atan2(y, x) * 5 + t / T2 * TAU * 3);
      out.c = d < CORE3 ? WHITE : d < CORE3 + 1.5 ? flick > 0.6 ? WHITE : C[6] : flick > 0.5 ? C[5] : C[4];
    });
    p.glow(0, 0, 16, WHITE, 0.28);
    cycle(t, T2, 10, o.seed, (g) => g.range(0.35, 0.7), (age, life, R4) => {
      const a = R4.range(0, TAU), d = R4.range(16, 44), k = Math.sin(age / life * Math.PI);
      sparkle(p, Math.cos(a) * d, Math.sin(a) * d, 1 + 2.4 * k * R4.range(0.5, 1), WHITE, C[5], 0.4 * k);
    });
  }

  // fx/holy/blessing.js
  var blessing_exports = {};
  __export(blessing_exports, {
    act: () => act7,
    draw: () => draw5,
    drawBack: () => drawBack3,
    meta: () => meta20
  });
  var meta20 = {
    name: "Blessing",
    desc: "A soft cone of light rests on the character from above; sparkles drift down through it, twinkling, and wink out where they land on the head and shoulders.",
    tags: ["holy", "blessing", "buff", "light", "sparkle", "character", "loop"],
    size: [80, 128],
    origin: [40, 108],
    duration: 3,
    loop: true,
    fps: 30,
    bg: "ground",
    actor: 2,
    options: { palette: GOLD, seed: 7 }
  };
  var OPEN = { turn: 1.15, fx: -13, fy: -31, bx: 14, by: -31, hy: -1, ffx: -3, fbx: 4 };
  var act7 = {
    onBody: true,
    poses: [
      [0, OPEN],
      [0.75, { ...OPEN, fy: -33, by: -33 }],
      [1.5, { ...OPEN, crouch: -1, fy: -35, by: -35 }],
      [2.25, { ...OPEN, fy: -33, by: -33 }],
      [3, OPEN]
    ]
  };
  var TOP3 = -108;
  var T = 3;
  var halfW = (y) => lerp(5, 20, (y - TOP3) / -TOP3);
  var RAYS = [[-0.62, 0.16, 1, 0.3], [-0.2, 0.2, 2, 1.7], [0.22, 0.14, 1, 4.1], [0.6, 0.18, 2, 2.6]];
  var ray3 = (q, t) => {
    let I = 0.3 * Math.max(0, 1 - q * q);
    for (const [o, w, k, ph] of RAYS) I += Math.exp(-(((q - o) / w) ** 2)) * (0.55 + 0.45 * Math.sin(t / T * TAU * k + ph)) * 0.6;
    return I * smooth(1.25, 0.75, Math.abs(q));
  };
  var LANDS = /* @__PURE__ */ new Map();
  function landings2(o, S) {
    const key = `${o.seed}:${S.x}:${S.y}`;
    if (LANDS.has(key)) return LANDS.get(key);
    const out = [];
    for (let i = 0; i < 20; i++) {
      const R4 = rng(o.seed, i), q = R4.range(-0.9, 0.9), v = R4.range(22, 34), sway = R4.range(1, 3), ph = R4.range(0, TAU), size = R4.range(0.8, 2.4);
      let land = Infinity;
      for (let a = 0; a < 6; a += 0.02) {
        const y = TOP3 + 6 + v * a, x = q * halfW(y) + Math.sin(a * 2.2 + ph) * sway;
        if (y >= -1 || S.at(x, y)) {
          land = a;
          break;
        }
      }
      out.push({ q, v, sway, ph, size, land });
    }
    LANDS.set(key, out);
    return out;
  }
  function drawBack3(p, t, o) {
    const C = fit(o.palette, 8);
    p.each(-24, TOP3, 24, 0.5, (x, y, sx, sy) => {
      const I = ray3(x / halfW(y), t) * (0.6 + 0.4 * smooth(TOP3, 0, y));
      if (I < 0.02) return;
      p.blendPx(sx, sy, C[6], I * 0.13);
      p.add(sx, sy, C[4], I * 0.22);
    });
    for (const [o2, , k, ph] of [RAYS[1], RAYS[2]])
      for (let y = TOP3; y < -1; y++) {
        const pulse2 = 0.5 + 0.5 * Math.sin(y * 0.11 - t / T * TAU * 3 + ph);
        p.dot(o2 * halfW(y), y, pulse2 > 0.85 ? WHITE : C[6], (0.1 + 0.45 * pulse2) * (0.5 + 0.5 * Math.sin(t / T * TAU * k + ph)) * smooth(TOP3, TOP3 + 20, y));
      }
    p.glow(0, -4, 30, C[4], 0.22);
  }
  function draw5(p, t, o) {
    const C = fit(o.palette, 8), A = o.actor, S = A ? shapeOf(A) : null;
    if (A) {
      const m = A.mask;
      for (let i = 0; i < m.w; i++)
        for (let j = 0; j < m.h; j++) {
          const c = A.pixels[j * m.w + i];
          if (!c || luma(c) < 0.15) continue;
          p.px(A.x + i, A.y + j, mix(c, C[6], 0.35));
          break;
        }
      p.glow(0, -30, 20, C[5], 0.22);
    }
    for (let y = 0; y <= 3; y++)
      for (let x = -24; x <= 24; x++) {
        const u = Math.hypot(x / 24, y / 4);
        if (u >= 1) continue;
        p.dot(x, y, u < 0.3 ? y ? C[5] : WHITE : u < 0.6 ? C[5] : u < 0.85 ? C[4] : C[3], y === 0 ? Math.sqrt(1 - u) : (1 - u) * 0.7);
      }
    if (S) {
      const L2 = landings2(o, S);
      cycle(t, T, L2.length, o.seed, (g) => 3, (age, life, R4, i) => {
        const s = L2[i], y = TOP3 + 6 + s.v * age, x = s.q * halfW(y) + Math.sin(age * 2.2 + s.ph) * s.sway, fade = Math.min(1, age / 0.3);
        if (age > s.land) {
          const w = (age - s.land) / 0.14;
          if (w < 1) {
            const ly = TOP3 + 6 + s.v * s.land, lx = s.q * halfW(ly) + Math.sin(s.land * 2.2 + s.ph) * s.sway;
            sparkle(p, lx, ly, 3 * (1 - w) + 1, WHITE, C[6], 0.5 * (1 - w));
          }
          return;
        }
        const tw = 0.6 + 0.4 * Math.sin(age * (7 + i % 4) + s.ph);
        if (s.size > 1.2) sparkle(p, x, y, s.size * tw * fade, tw > 0.85 ? WHITE : C[6], C[5], 0.35 * fade);
        else {
          p.dot(x, y, tw > 0.8 ? WHITE : C[6], fade);
          p.glow(x, y, 3, C[5], 0.35 * fade);
        }
      });
    }
    cycle(t, T, 16, o.seed + 9, (g) => g.range(1.2, 2.4), (age, life, R4) => {
      const u = age / life, y = TOP3 + 10 + R4.range(0, 90) + u * R4.range(6, 14), q = R4.range(-1, 1), x = q * halfW(y) + Math.sin(age * 1.7 + q * 5) * 1.5, k = Math.sin(u * Math.PI) * ray3(q, t);
      if (k > 0.12) p.dot(x, y, k > 0.45 ? WHITE : C[6], Math.min(1, k * 2.2));
    });
  }

  // fx/lightning/zap-hit.js
  var zap_hit_exports = {};
  __export(zap_hit_exports, {
    create: () => create16,
    meta: () => meta21
  });

  // fx/lightning/_lib.js
  var VOLT = ["#120a33", "#2a1b78", "#4630c0", "#5a62f0", "#58a6ff", "#9ed8ff", "#e4f6ff", "#ffffff"];
  var SOOT4 = hex("#110c16");
  var SOOT22 = hex("#1c1522");
  function zigzag(R4, x0, y0, x1, y1, jag = 0.32, forks = 0.35, w = 1, depth = 0) {
    const out = { paths: [] }, L2 = Math.hypot(x1 - x0, y1 - y0);
    let pts = [[x0, y0], [x1, y1]], off = L2 * jag;
    while (pts.length < 2 + L2 / 3) {
      const nxt = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[i + 1], l = Math.hypot(bx - ax, by - ay) || 1, o = R4.range(-off, off);
        nxt.push([(ax + bx) / 2 + -(by - ay) / l * o, (ay + by) / 2 + (bx - ax) / l * o], [bx, by]);
      }
      pts = nxt;
      off *= 0.52;
    }
    out.paths.push({ pts, w });
    if (depth < 2) {
      for (let i = 2; i < pts.length - 3; i++)
        if (R4.chance(forks / (1 + depth) / Math.max(4, pts.length / 6))) {
          const [ax, ay] = pts[i], [bx, by] = pts[Math.min(pts.length - 1, i + 3)];
          const a = Math.atan2(by - ay, bx - ax) + R4.sign() * R4.range(0.35, 0.9), l = (L2 - i / pts.length * L2) * R4.range(0.25, 0.55);
          out.paths.push(...zigzag(R4, ax, ay, ax + Math.cos(a) * l, ay + Math.sin(a) * l, jag * 1.1, forks, w * 0.55, depth + 1).paths);
        }
    }
    return out;
  }
  var N2 = 1024;
  var HALF = 512;
  var GRID = new Uint8Array(N2 * N2);
  var HIT2 = [];
  function mark(x, y, lvl) {
    const X = Math.floor(x) + HALF, Y = Math.floor(y) + HALF;
    if (X < 0 || Y < 0 || X >= N2 || Y >= N2) return;
    const i = Y * N2 + X, v = GRID[i];
    if (!v) HIT2.push(i);
    if (lvl > v) GRID[i] = lvl;
  }
  function stamp(x, y, r, lvl) {
    if (r <= 0.5) return mark(Math.round(x), Math.round(y), lvl);
    const r2 = r * r;
    for (let py = Math.floor(y - r); py <= Math.ceil(y + r); py++) {
      const dy = py + 0.5 - y;
      for (let px = Math.floor(x - r); px <= Math.ceil(x + r); px++) {
        const dx = px + 0.5 - x;
        if (dx * dx + dy * dy <= r2) mark(px, py, lvl);
      }
    }
  }
  function flush(p, cols, alphas) {
    for (const i of HIT2) {
      const v = GRID[i];
      GRID[i] = 0;
      const x = i % N2 - HALF, y = (i / N2 | 0) - HALF, a = alphas ? alphas[v - 1] : 1;
      if (a >= 1) p.px(x, y, cols[v - 1]);
      else if (a > 0) p.dot(x, y, cols[v - 1], a);
    }
    HIT2.length = 0;
  }
  var walk = (pts, fn) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], l = Math.max(1, Math.hypot(bx - ax, by - ay));
      for (let d = 0; d <= l; d += 0.5) fn(ax + (bx - ax) * d / l, ay + (by - ay) * d / l, i);
    }
  };
  function stroke(p, b, k, C, s = 1, o = {}) {
    if (k <= 0.02) return;
    const lk = o.light ?? 0.5;
    for (const q of b.paths) {
      const trunk = q.w >= 1;
      if (!trunk && k < 0.5) continue;
      const rh = (trunk ? k > 0.6 ? 2.1 : 1.6 : 1.1) * s, rb = (trunk ? k > 0.6 ? 1.3 : 0.8 : 0.5) * s;
      const pts = o.upTo !== void 0 && trunk ? q.pts.slice(0, Math.max(2, Math.ceil(q.pts.length * o.upTo))) : q.pts;
      walk(pts, (x, y) => {
        stamp(x, y, rh, 1);
        stamp(x, y, rb, trunk ? 3 : 2);
        if (trunk && k > 0.3) o.core ? stamp(x, y, o.core, 4) : mark(x, y, 4);
      });
      for (let i = 0; i < pts.length - 1; i += 3) if (o.minY === void 0 || pts[i][1] > o.minY) p.glow(pts[i][0], pts[i][1], (trunk ? 14 : 7) * s, C[4], lk * k * q.w);
    }
    const a = o.a ?? 1;
    flush(p, o.hero ? [C[3], C[6], C[7], C[7]] : [C[2], C[4], C[5], C[7]], [a, a, a, a]);
  }
  function crackle(p, b, k, C, glowK = 0.5, a = 1) {
    if (k <= 0.02) return;
    for (const q of b.paths) {
      const thick = q.w >= 1;
      walk(q.pts, (x, y) => {
        if (k > 0.45 && thick) for (const [dx, dy] of CROSS3) mark(x + dx * 1.5, y + dy * 1.5, 1);
        if (k > 0.25 && (thick || q.w > 0.4)) mark(x + 1, y, 2), mark(x, y + 1, 2);
        mark(x, y, thick && k > 0.3 ? 4 : 3);
      });
      for (let i = 0; i < q.pts.length - 1; i += 3) p.glow(q.pts[i][0], q.pts[i][1], (thick ? 9 : 5) * (0.5 + k * 0.5), C[4], glowK * k * q.w);
    }
    flush(p, [C[3], C[5], C[5], C[7]], [Math.min(1, (k - 0.45) * 1.6) * a, a, a, a]);
  }
  var CROSS3 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // fx/lightning/zap-hit.js
  var meta21 = {
    name: "Zap hit",
    desc: "A contact zap: an arc snaps in from the left, the hit point overloads into a knot of tiny crackling zigzags, a fern of burn marks glows outward, sparks jink away, ozone puffs.",
    tags: ["lightning", "electric", "hit", "impact", "combat", "directional", "one-shot"],
    size: [144, 112],
    origin: [76, 56],
    duration: 0.9,
    loop: false,
    fps: 30,
    bg: "dark",
    options: { palette: VOLT, seed: 3 }
  };
  var SNAP2 = 0.05;
  var ASH = hex("#6a6680");
  function fern(R4) {
    const out = [];
    const grow = (x, y, a, len2, w, d, depth) => {
      const pts = [[x, y, d]];
      let side = R4.sign();
      for (let s = 0; s < len2; s += 1.4) {
        a += R4.range(-0.3, 0.3);
        x += Math.cos(a) * 1.4;
        y += Math.sin(a) * 1.4;
        d += 1.4;
        pts.push([x, y, d]);
        if (depth < 2 && s > 2 && R4.chance(0.24)) {
          side = -side;
          grow(x, y, a + side * R4.range(0.55, 1.05), (len2 - s) * R4.range(0.3, 0.55), w * 0.6, d, depth + 1);
        }
      }
      out.push({ pts, w });
    };
    for (let i = 0; i < 6; i++) grow(0, 0, i / 6 * TAU + R4.range(-0.35, 0.35), R4.range(18, 32), 1, 0, 0);
    return out;
  }
  function create16(o) {
    const C = fit(o.palette, 8), R4 = new Rng(o.seed), ps = new Particles({ rng: R4 }), lights = new Lights();
    const tree = fern(R4), Y03 = R4.range(-14, 6);
    const kinked = Array.from({ length: 16 }, () => {
      const a = R4.range(-1.2, 1.2) + (R4.chance(0.7) ? 0 : Math.PI), sp = R4.range(130, 250);
      return { x: 0, y: 0, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: R4.range(0.2, 0.36), age: -SNAP2, next: R4.range(0.02, 0.05), trail: [] };
    });
    let t = 0, hit = false;
    return {
      update(dt) {
        t += dt;
        if (!hit && t >= SNAP2) {
          hit = true;
          lights.add(0, 0, 60, C[4], 0.7, 0.3);
          lights.add(0, 0, 14, WHITE, 0.5, 0.07);
          for (let i = 0; i < 3; i++) ps.spawn(P.SMOKE, R4.range(-3, 5), R4.range(-4, 2), R4.range(-5, 8), -R4.range(8, 16), R4.range(0.55, 0.75), mix(ASH, C[4], 0.3), R4.range(2.5, 3.8), R4.range(0.08, 0.16));
        }
        for (const s of kinked) {
          if ((s.age += dt) < 0 || s.age >= s.life) continue;
          if ((s.next -= dt) <= 0) {
            s.next = R4.range(0.025, 0.055);
            const sp = Math.hypot(s.vx, s.vy), a = Math.atan2(s.vy, s.vx) + R4.sign() * R4.range(0.6, 1.3);
            s.vx = Math.cos(a) * sp;
            s.vy = Math.sin(a) * sp;
            s.trail.push([s.x, s.y]);
            if (s.trail.length > 4) s.trail.shift();
          }
          s.vx -= s.vx * 3 * dt;
          s.vy -= s.vy * 3 * dt - 140 * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
        }
        ps.update(dt);
        lights.update(dt);
      },
      drawBack(p) {
        if (t < SNAP2) return;
        const cool = smooth(0.45, 0.85, t), fade = 1 - smooth(0.78, 0.88, t);
        for (const br of tree)
          for (let i = 1; i < br.pts.length; i++) {
            const [x0, y0] = br.pts[i - 1], [x, y, d] = br.pts[i], age = t - SNAP2 - d / 260;
            if (age < 0) break;
            const k = Math.exp(-age / 0.22) - cool * 0.3, c = k > 0.75 ? WHITE : k > 0.45 ? C[6] : k > 0.25 ? C[5] : k > 0.1 ? C[4] : k > -0.05 ? C[2] : C[1];
            p.line(x0, y0, x, y, c, fade);
            if (br.w >= 1 && d < 9) p.line(x0 + 1, y0, x + 1, y, k > 0.45 ? C[5] : C[2], fade);
            if ((i & 3) === 0 && k > 0) p.glow(x, y, 5, C[5], 0.35 * k * fade);
          }
        ps.draw(p, "back");
      },
      draw(p) {
        const f = Math.floor(t * 30 + 1e-4);
        if (t < 0.32) {
          const r = rng(o.seed, 2, f), b = zigzag(r, -66, Y03, 0, 0, 0.22, 0.35), u = clamp(t / SNAP2);
          const k = t < SNAP2 ? 1 : t < 0.2 ? f % 2 ? 0.7 : 1 : 0.55 * (1 - (t - 0.2) / 0.12);
          stroke(p, u < 1 ? { paths: [b.paths[0]] } : b, k, C, t < SNAP2 + 0.034 ? 0.95 : 0.7, { upTo: u, hero: t >= SNAP2 && t < SNAP2 + 0.034 });
          if (u < 1) {
            const tp = b.paths[0].pts, [hx, hy] = tp[Math.floor(u * (tp.length - 1))];
            p.circle(hx, hy, 2, WHITE);
            p.glow(hx, hy, 14, C[5], 0.6);
          }
        }
        if (t >= SNAP2 && t < 0.45) {
          const a = (t - SNAP2) / 0.4, r = rng(o.seed, 5, f), R03 = 8 * (1 - a * 0.6), m = Math.round(11 * (1 - a * 0.5));
          for (let i = 0; i < m; i++) {
            const ang = r.range(0, TAU), d0 = r.range(0.5, R03 * 0.5), ang2 = ang + r.range(-1.2, 1.2), d1 = r.range(R03 * 0.55, R03);
            crackle(p, zigzag(r, Math.cos(ang) * d0, Math.sin(ang) * d0, Math.cos(ang2) * d1, Math.sin(ang2) * d1, 0.5, 0), 0.75 * (1 - a) + 0.25, C, 0.25);
          }
          p.circle(0, 0, 3 * (1 - a) + 1, C[5]);
          p.circle(0, 0, 2 * (1 - a) + 0.5, WHITE);
          p.glow(0, 0, 20, C[4], 0.55 * (1 - a));
          if (t < SNAP2 + 0.07) p.glow(0, 0, 9, WHITE, 0.4);
        }
        for (const s of kinked) {
          if (s.age < 0 || s.age >= s.life) continue;
          const k = 1 - s.age / s.life, path = [...s.trail, [s.x, s.y]];
          for (let i = 0; i < path.length - 1; i++) p.line(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1], i === path.length - 2 ? k > 0.5 ? WHITE : C[6] : k > 0.5 ? C[5] : C[4], 0.6 + 0.4 * (i / path.length));
          p.px(s.x, s.y, k > 0.4 ? WHITE : C[5]);
          p.glow(s.x, s.y, 4, C[5], 0.4 * k);
        }
        if (t >= SNAP2) p.glow(0, 0, 40 * Math.max(0, 1 - t / 0.85), C[3], 0.45 * Math.exp(-(t - SNAP2) * 5) * (f % 2 ? 0.7 : 1));
        ps.draw(p, "front");
        lights.draw(p);
      }
    };
  }

  // bundle-entry.mjs
  var FX_LIB = {
    frostNova: frost_nova_exports,
    snowflakeBurst: snowflake_burst_exports,
    freeze: freeze_exports,
    magicCircleCast: magic_circle_cast_exports,
    manaBurst: mana_burst_exports,
    runeCircle: rune_circle_exports,
    spellCharge: spell_charge_exports,
    swordSlash: sword_slash_exports,
    doubleSlash: double_slash_exports,
    smallExplosion: small_explosion_exports,
    fireworkBurst: firework_burst_exports,
    hitSpark: hit_spark_exports,
    critHit: crit_hit_exports,
    heartPickup: heart_pickup_exports,
    collectBurst: collect_burst_exports,
    comboCounter: combo_counter_exports,
    levelUp: level_up_exports,
    confetti: confetti_exports,
    sunburst: sunburst_exports,
    blessing: blessing_exports,
    zapHit: zap_hit_exports
  };
  var PALETTES = {
    imperial: { primary: "#c41e3a", secondary: "#ffd700", accent: "#9b59ff", white: "#fff4e6", dark: "#1a0a12" },
    match: { primary: "#ffd700", secondary: "#fff4e6", accent: "#c41e3a" },
    skill: { primary: "#9b59ff", secondary: "#ffd700", accent: "#c41e3a" },
    bond: { primary: "#ff6b8a", secondary: "#ffd700", accent: "#fff4e6" },
    boss: { primary: "#c41e3a", secondary: "#9b59ff", accent: "#ffd700" }
  };
  return __toCommonJS(bundle_entry_exports);
})();
