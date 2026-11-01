/*!
 * 記憶帝國：女傑翻牌 v3 — AudioEngine (js/audio.js)
 *
 * Web Audio API procedural synthesizer (SFX + looping Imperial Noir BGM)
 * layered with CC0 1.0 Freesound one-shot samples in assets/sfx/
 * (see assets/sfx/CREDITS.md & docs/SFX_SAMPLES.md):
 *   - plop.ogg      (Breviceps, CC0)    -> card flip / soft tap
 *   - pop.ogg       (Sadiquecat, CC0)   -> match / UI confirm / coin
 *   - mouth-pop.ogg (jcallison, CC0)    -> button tap
 *   - triangle.ogg  (cabled_mess, CC0)  -> chime / talk / bond / star
 *   - whoosh.ogg    (lucaslima, CC0)    -> skill cast / boss sweep
 *
 * Pure synthesized fallbacks always engage seamlessly if sample fetch or
 * decodeAudioData is pending or unsupported (e.g. offline / older WebKit).
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'memoryRPG_audio_v3';
  var SAVE_KEY = (global.GAME_DATA && global.GAME_DATA.CONFIG && global.GAME_DATA.CONFIG.SAVE_KEY) || 'memoryRPG_v3';
  var DEF_SFX_VOL = (global.GAME_DATA && global.GAME_DATA.CONFIG && typeof global.GAME_DATA.CONFIG.DEFAULT_SFX_VOL === 'number')
    ? global.GAME_DATA.CONFIG.DEFAULT_SFX_VOL
    : 0.45;
  var DEF_BGM_VOL = (global.GAME_DATA && global.GAME_DATA.CONFIG && typeof global.GAME_DATA.CONFIG.DEFAULT_BGM_VOL === 'number')
    ? global.GAME_DATA.CONFIG.DEFAULT_BGM_VOL
    : 0.35;

  var SAMPLE_FILES = {
    'plop': 'assets/sfx/plop.ogg',
    'pop': 'assets/sfx/pop.ogg',
    'mouth-pop': 'assets/sfx/mouth-pop.ogg',
    'triangle': 'assets/sfx/triangle.ogg',
    'whoosh': 'assets/sfx/whoosh.ogg'
  };

  function clamp(v, lo, hi) {
    v = Number(v);
    if (!isFinite(v)) return lo;
    return v < lo ? lo : v > hi ? hi : v;
  }

  function midiToFreq(m) {
    return 440 * Math.pow(2, (m - 69) / 12);
  }

  /* ───────── Persistent Audio Settings (Defaults ON, ~0.35 BGM / ~0.45 SFX) ───────── */
  var state = {
    sfxEnabled: true,
    bgmEnabled: true,
    muted: false,
    sfxVolume: DEF_SFX_VOL,
    bgmVolume: DEF_BGM_VOL
  };

  function loadInitialSettings() {
    try {
      var rawSave = global.localStorage && global.localStorage.getItem(SAVE_KEY);
      if (rawSave) {
        var parsedSave = JSON.parse(rawSave);
        var st = parsedSave && parsedSave.settings;
        if (st) {
          if (typeof st.sfx === 'boolean') state.sfxEnabled = st.sfx;
          if (typeof st.bgm === 'boolean') state.bgmEnabled = st.bgm;
          if (typeof st.sfxVol === 'number') state.sfxVolume = clamp(st.sfxVol, 0, 1);
          if (typeof st.bgmVol === 'number') state.bgmVolume = clamp(st.bgmVol, 0, 1);
          return;
        }
      }
      var rawAudio = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (rawAudio) {
        var a = JSON.parse(rawAudio);
        if (a) {
          if (typeof a.sfxEnabled === 'boolean') state.sfxEnabled = a.sfxEnabled;
          if (typeof a.bgmEnabled === 'boolean') state.bgmEnabled = a.bgmEnabled;
          if (typeof a.muted === 'boolean') state.muted = a.muted;
          if (typeof a.sfxVolume === 'number') state.sfxVolume = clamp(a.sfxVolume, 0, 1);
          if (typeof a.bgmVolume === 'number') state.bgmVolume = clamp(a.bgmVolume, 0, 1);
        }
      }
    } catch (e) {}
  }

  function persistSettings() {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {}
  }

  loadInitialSettings();

  /* ───────── WebAudio Graph & Buffers ───────── */
  var ctx = null;
  var masterGain = null;
  var compNode = null;
  var sfxBus = null;
  var bgmGain = null;
  var bgmDuckGain = null;
  var bgmEchoIn = null;
  var noiseBuf = null;
  var unlocked = false;

  var sampleBuffers = {};
  var sampleStatus = {}; // 'loading' | 'ready' | 'failed'
  var samplePreloadStarted = false;

  var duckHeld = false;
  var duckFactor = 1.0;
  var duckTimer = null;

  var starStreakCount = 0;
  var starStreakLastAt = 0;

  function setAudioSessionAmbient() {
    try {
      if (global.navigator && global.navigator.audioSession && global.navigator.audioSession.type !== 'ambient') {
        global.navigator.audioSession.type = 'ambient';
      }
    } catch (e) {}
  }

  function buildNoiseBuffer(c) {
    var sr = c.sampleRate || 44100;
    var len = Math.floor(sr * 1.2);
    var buf = c.createBuffer(1, len, sr);
    var data = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      // Gently pink-weighted noise so whooshes and brushes sound warm, never harsh
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.96300 * b1 + w * 0.2965164;
      b2 = 0.57000 * b2 + w * 1.0526913;
      data[i] = clamp((b0 + b1 + b2 + w * 0.1848) * 0.22, -1, 1);
    }
    return buf;
  }

  function ensureContext() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    setAudioSessionAmbient();
    try {
      ctx = new AC();
    } catch (e) {
      ctx = null;
      return null;
    }

    masterGain = ctx.createGain();
    masterGain.gain.value = state.muted ? 0.0001 : 1.0;

    if (ctx.createDynamicsCompressor) {
      compNode = ctx.createDynamicsCompressor();
      compNode.threshold.value = -11;
      compNode.knee.value = 16;
      compNode.ratio.value = 3.8;
      compNode.attack.value = 0.004;
      compNode.release.value = 0.2;
      compNode.connect(masterGain);
    }
    masterGain.connect(ctx.destination);
    var mixTarget = compNode || masterGain;

    sfxBus = ctx.createGain();
    sfxBus.gain.value = state.sfxEnabled ? state.sfxVolume : 0.0001;
    sfxBus.connect(mixTarget);

    bgmGain = ctx.createGain();
    bgmGain.gain.value = state.bgmEnabled ? state.bgmVolume : 0.0001;
    bgmGain.connect(mixTarget);

    bgmDuckGain = ctx.createGain();
    bgmDuckGain.gain.value = duckFactor;
    bgmDuckGain.connect(bgmGain);

    // Subtle concert-hall echo bus for imperial harp/celesta motif
    try {
      var delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.295;
      var fb = ctx.createGain();
      fb.gain.value = 0.26;
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1650;
      var wet = ctx.createGain();
      wet.gain.value = 0.24;

      bgmEchoIn = ctx.createGain();
      bgmEchoIn.gain.value = 1.0;
      bgmEchoIn.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(wet);
      wet.connect(bgmDuckGain);
    } catch (e) {
      bgmEchoIn = null;
    }

    noiseBuf = buildNoiseBuffer(ctx);
    return ctx;
  }

  function applyBusGains() {
    if (!ctx) return;
    var now = ctx.currentTime;
    var mTarget = state.muted ? 0.0001 : 1.0;
    var sTarget = (!state.muted && state.sfxEnabled && state.sfxVolume > 0.001) ? state.sfxVolume : 0.0001;
    var bTarget = (!state.muted && state.bgmEnabled && state.bgmVolume > 0.001) ? state.bgmVolume : 0.0001;
    try {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setTargetAtTime(mTarget, now, 0.02);
      sfxBus.gain.cancelScheduledValues(now);
      sfxBus.gain.setTargetAtTime(sTarget, now, 0.02);
      bgmGain.gain.cancelScheduledValues(now);
      bgmGain.gain.setTargetAtTime(bTarget, now, 0.04);
      bgmDuckGain.gain.cancelScheduledValues(now);
      bgmDuckGain.gain.setTargetAtTime(duckFactor, now, 0.06);
    } catch (e) {
      masterGain.gain.value = mTarget;
      sfxBus.gain.value = sTarget;
      bgmGain.gain.value = bTarget;
      bgmDuckGain.gain.value = duckFactor;
    }
  }

  function syncMuteIcon() {
    try {
      if (!global.document) return;
      var btn = global.document.getElementById('tb-mute');
      if (btn) {
        var anyOn = !state.muted && (state.sfxEnabled || state.bgmEnabled);
        btn.textContent = anyOn ? '🔊' : '🔇';
      }
    } catch (e) {}
  }

  /* ───────── CC0 Sample Fetch & Decode (Non-blocking with Synth Fallbacks) ───────── */
  function decodeAudioCompat(c, arrayBuf, onOk, onErr) {
    try {
      var p = c.decodeAudioData(arrayBuf, function (decoded) {
        if (onOk) onOk(decoded);
        onOk = null;
      }, function (err) {
        if (onErr) onErr(err);
        onErr = null;
      });
      if (p && typeof p.then === 'function') {
        p.then(function (decoded) {
          if (onOk) { onOk(decoded); onOk = null; }
        }).catch(function (err) {
          if (onErr) { onErr(err); onErr = null; }
        });
      }
    } catch (e) {
      if (onErr) onErr(e);
    }
  }

  function preloadSamples() {
    if (samplePreloadStarted) return;
    if (!global.fetch) return;
    var c = ensureContext();
    if (!c) return;
    samplePreloadStarted = true;

    Object.keys(SAMPLE_FILES).forEach(function (key) {
      if (sampleBuffers[key] || sampleStatus[key] === 'loading') return;
      sampleStatus[key] = 'loading';
      try {
        global.fetch(SAMPLE_FILES[key])
          .then(function (res) {
            if (!res || !res.ok) throw new Error('HTTP ' + (res ? res.status : 0));
            return res.arrayBuffer();
          })
          .then(function (ab) {
            decodeAudioCompat(c, ab, function (buf) {
              sampleBuffers[key] = buf;
              sampleStatus[key] = 'ready';
            }, function () {
              sampleStatus[key] = 'failed';
            });
          })
          .catch(function () {
            sampleStatus[key] = 'failed';
          });
      } catch (e) {
        sampleStatus[key] = 'failed';
      }
    });
  }

  function isSfxAudible() {
    return !state.muted && state.sfxEnabled && state.sfxVolume > 0.001;
  }

  function playSample(key, opts) {
    var buf = sampleBuffers[key];
    if (!ctx || !buf || !isSfxAudible()) return false;
    opts = opts || {};
    try {
      var t0 = ctx.currentTime + (opts.delay || 0);
      var src = ctx.createBufferSource();
      src.buffer = buf;
      var rate = clamp(opts.rate || 1, 0.35, 2.6);
      src.playbackRate.setValueAtTime(rate, t0);

      var g = ctx.createGain();
      var peak = clamp(typeof opts.gain === 'number' ? opts.gain : 0.55, 0.001, 1.5);
      var attack = opts.attack || 0.002;
      var naturalDur = buf.duration / rate;
      var dur = opts.maxDur ? Math.min(naturalDur, opts.maxDur) : naturalDur;

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + attack);
      if (opts.maxDur && naturalDur > opts.maxDur) {
        var fadeStart = Math.max(t0 + attack + 0.01, t0 + dur - 0.14);
        g.gain.setValueAtTime(peak, fadeStart);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      }

      if (opts.filterFreq) {
        var f = ctx.createBiquadFilter();
        f.type = opts.filterType || 'lowpass';
        f.frequency.setValueAtTime(opts.filterFreq, t0);
        if (opts.filterEndFreq) {
          f.frequency.exponentialRampToValueAtTime(Math.max(40, opts.filterEndFreq), t0 + dur);
        }
        src.connect(f);
        f.connect(g);
      } else {
        src.connect(g);
      }

      g.connect(sfxBus);
      src.start(t0, opts.offset || 0);
      if (opts.maxDur && naturalDur > opts.maxDur + 0.04) {
        src.stop(t0 + dur + 0.03);
      }
      src.onended = function () {
        try { g.disconnect(); } catch (e) {}
      };
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ───────── Core WebAudio Synth Building Blocks ───────── */
  function synthTone(opts) {
    if (!ctx) return;
    var dest = opts.bus || sfxBus;
    var t0 = (opts.at !== undefined ? opts.at : ctx.currentTime) + (opts.delay || 0);
    var dur = Math.max(0.02, opts.dur || 0.12);
    var attack = Math.min(dur * 0.45, opts.attack || 0.006);
    var peak = Math.max(0.0002, opts.gain || 0.16);
    var freq = Math.max(24, opts.freq || 440);

    try {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = opts.type || 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      if (opts.detune) osc.detune.setValueAtTime(opts.detune, t0);
      if (opts.endFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(24, opts.endFreq), t0 + (opts.glideDur || dur));
      }

      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + attack);
      if (opts.sustain && dur > attack + 0.06) {
        var holdAt = t0 + dur * 0.55;
        g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak * opts.sustain), holdAt);
      }
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      if (opts.filterFreq) {
        var flt = ctx.createBiquadFilter();
        flt.type = opts.filterType || 'lowpass';
        flt.Q.value = opts.Q || 1.0;
        flt.frequency.setValueAtTime(opts.filterFreq, t0);
        if (opts.filterEndFreq) {
          flt.frequency.exponentialRampToValueAtTime(Math.max(40, opts.filterEndFreq), t0 + dur);
        }
        osc.connect(flt);
        flt.connect(g);
      } else {
        osc.connect(g);
      }

      g.connect(dest);
      if (opts.echo && bgmEchoIn) {
        g.connect(bgmEchoIn);
      }

      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
      osc.onended = function () {
        try { g.disconnect(); } catch (e) {}
      };
    } catch (e) {}
  }

  function synthNoise(opts) {
    if (!ctx || !noiseBuf) return;
    var dest = opts.bus || sfxBus;
    var t0 = (opts.at !== undefined ? opts.at : ctx.currentTime) + (opts.delay || 0);
    var dur = Math.max(0.015, opts.dur || 0.08);
    var attack = Math.min(dur * 0.4, opts.attack || 0.004);
    var peak = Math.max(0.0002, opts.gain || 0.12);

    try {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      var flt = ctx.createBiquadFilter();
      flt.type = opts.filterType || 'bandpass';
      flt.Q.value = opts.Q || 1.4;
      flt.frequency.setValueAtTime(opts.freq || 1400, t0);
      if (opts.endFreq) {
        flt.frequency.exponentialRampToValueAtTime(Math.max(60, opts.endFreq), t0 + dur);
      }

      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      src.connect(flt);
      flt.connect(g);
      g.connect(dest);

      var maxOffset = Math.max(0, noiseBuf.duration - dur - 0.05);
      src.start(t0, maxOffset > 0 ? Math.random() * maxOffset : 0);
      src.stop(t0 + dur + 0.02);
      src.onended = function () {
        try { g.disconnect(); } catch (e) {}
      };
    } catch (e) {}
  }

  function synthBell(freq, delay, dur, gain, bus, echo) {
    synthTone({ freq: freq, delay: delay, dur: dur, gain: gain, type: 'triangle', attack: 0.005, bus: bus, echo: echo });
    synthTone({ freq: freq * 2, delay: delay, dur: dur * 0.55, gain: gain * 0.28, type: 'sine', attack: 0.003, bus: bus, echo: echo });
  }

  /* ───────── Boutique SFX Library (CC0 Samples + Layered Synth) ───────── */
  var SFX_PLAYERS = {
    // Card flip <- plop.ogg (+ crisp synthesized card-stock flick)
    flip: function () {
      var jit = 0.96 + Math.random() * 0.09;
      var hasPlop = playSample('plop', { gain: 0.62, rate: jit, maxDur: 0.24 });
      // Crisp card-edge vellum snap
      synthNoise({ freq: 2400 * jit, endFreq: 950, Q: 1.8, dur: 0.038, gain: 0.085, filterType: 'bandpass' });
      synthTone({ freq: 560 * jit, endFreq: 295 * jit, dur: 0.052, gain: 0.11, type: 'triangle', attack: 0.002 });
      if (!hasPlop) {
        // Warm woody plop body fallback when OGG not yet decoded / unsupported
        synthTone({ freq: 225 * jit, endFreq: 138 * jit, dur: 0.068, gain: 0.17, type: 'sine', attack: 0.003 });
      }
    },

    // Button / UI tap <- mouth-pop.ogg (+ gilded UI tick)
    tap: function () {
      var jit = 0.98 + Math.random() * 0.06;
      var hasPop = playSample('mouth-pop', { gain: 0.46, rate: jit, maxDur: 0.16 });
      synthTone({ freq: 760 * jit, endFreq: 1020 * jit, dur: 0.042, gain: 0.095, type: 'sine', attack: 0.002 });
      if (!hasPop) {
        synthTone({ freq: 380 * jit, endFreq: 620 * jit, dur: 0.048, gain: 0.14, type: 'triangle', attack: 0.002 });
      }
    },

    // Card pair match <- pop.ogg + triangle.ogg soft + sovereign D-major bell dyad
    match: function () {
      var hasPop = playSample('pop', { gain: 0.54, rate: 1.02, maxDur: 0.24 });
      playSample('triangle', { gain: 0.24, rate: 1.0, delay: 0.035, maxDur: 0.78 });
      if (!hasPop) {
        synthTone({ freq: 420, endFreq: 760, dur: 0.05, gain: 0.14, type: 'sine', attack: 0.002 });
      }
      // D5 -> A5 + F#5 imperial chordlet
      synthBell(587.33, 0.0, 0.19, 0.17);
      synthBell(880.00, 0.055, 0.28, 0.19);
      synthTone({ freq: 739.99, delay: 0.08, dur: 0.24, gain: 0.08, type: 'sine', attack: 0.01 });
    },

    // Rising pitch combo <- rising scale + pitch-shifted pop.ogg + triangle.ogg shimmer
    combo: function (opts) {
      var n = 2;
      if (typeof opts === 'number') n = opts;
      else if (opts && typeof opts.combo === 'number') n = opts.combo;
      else if (opts && typeof opts.count === 'number') n = opts.count;
      n = clamp(Math.round(n), 1, 20);

      // Regal D-major / Lydian ascending ladder (MIDI notes from D5 upward)
      var ladder = [74, 76, 78, 81, 83, 85, 86, 88, 90, 93, 95, 98];
      var idx = Math.min(ladder.length - 1, Math.max(0, n - 2));
      var rootMidi = ladder[idx];
      var f1 = midiToFreq(rootMidi);
      var f2 = midiToFreq(rootMidi + 4);
      var f3 = midiToFreq(rootMidi + 7);

      var sampleRate = clamp(0.98 + (n - 1) * 0.045, 0.98, 1.55);
      var hasPop = playSample('pop', { gain: 0.52, rate: sampleRate, maxDur: 0.22 });
      if (n >= 3) {
        playSample('triangle', { gain: clamp(0.2 + n * 0.02, 0.2, 0.38), rate: clamp(0.96 + (n - 2) * 0.035, 0.96, 1.4), delay: 0.03, maxDur: 0.85 });
      }
      if (!hasPop) {
        synthTone({ freq: f1 * 0.75, endFreq: f1, dur: 0.05, gain: 0.13, type: 'sine', attack: 0.002 });
      }

      synthBell(f1, 0.0, 0.18, 0.17);
      synthBell(f2, 0.045, 0.22, 0.16);
      synthBell(f3, 0.09, 0.30, 0.19);
      if (n >= 5) {
        synthTone({ freq: f3 * 2, delay: 0.12, dur: 0.26, gain: 0.075, type: 'sine', attack: 0.006 });
      }
    },

    // Mismatch <- muted low velvet double-thud (non-harsh)
    mismatch: function () {
      synthTone({
        freq: 174.61, endFreq: 146.83, dur: 0.13, gain: 0.18, type: 'sawtooth',
        filterFreq: 520, filterEndFreq: 210, attack: 0.005
      });
      synthTone({
        freq: 138.59, endFreq: 110.0, delay: 0.085, dur: 0.17, gain: 0.17, type: 'triangle',
        filterFreq: 420, filterEndFreq: 160, attack: 0.005
      });
      synthNoise({ freq: 340, endFreq: 140, Q: 1.2, dur: 0.06, gain: 0.07, filterType: 'lowpass' });
    },

    // Joker / trap card penalty <- dark mischievous tritone snap
    joker: function () {
      playSample('pop', { gain: 0.45, rate: 0.65, maxDur: 0.25 });
      synthTone({
        freq: 311.13, endFreq: 207.65, dur: 0.16, gain: 0.18, type: 'sawtooth',
        filterFreq: 950, filterEndFreq: 260, attack: 0.004
      });
      synthTone({
        freq: 220.0, endFreq: 138.59, delay: 0.09, dur: 0.24, gain: 0.19, type: 'sawtooth',
        filterFreq: 720, filterEndFreq: 190, attack: 0.005
      });
      synthNoise({ freq: 900, endFreq: 220, Q: 2.2, dur: 0.16, gain: 0.1, filterType: 'bandpass' });
    },

    // Skill cast <- whoosh.ogg + arcane rising sweep & crystalline chord
    skill: function (opts) {
      var kind = (typeof opts === 'string') ? opts : (opts && opts.skill) || '';
      var rate = kind === 'freeze' ? 1.12 : kind === 'time' ? 1.04 : 0.96;
      var hasWhoosh = playSample('whoosh', { gain: 0.66, rate: rate, maxDur: 0.72 });
      playSample('triangle', { gain: 0.24, rate: 1.08, delay: 0.14, maxDur: 0.85 });

      if (!hasWhoosh) {
        // Synthesized arcane wind whoosh fallback
        synthNoise({ freq: 320, endFreq: 2200, Q: 2.0, dur: 0.34, gain: 0.16, attack: 0.06, filterType: 'bandpass' });
        synthNoise({ freq: 1800, endFreq: 420, Q: 1.5, delay: 0.2, dur: 0.28, gain: 0.1, attack: 0.03, filterType: 'bandpass' });
      }

      // Arcane rising sweep + D Dorian / amethyst chord (D4 -> A4 -> D5 -> F5 -> A5)
      synthTone({
        freq: 220, endFreq: 880, dur: 0.28, gain: 0.12, type: 'sawtooth',
        filterFreq: 600, filterEndFreq: 2600, attack: 0.02
      });
      var notes = kind === 'freeze'
        ? [587.33, 783.99, 1046.50, 1318.51]
        : [440.00, 587.33, 698.46, 880.00, 1174.66];
      for (var i = 0; i < notes.length; i++) {
        synthBell(notes[i], 0.05 + i * 0.048, 0.32, 0.135);
      }
    },

    // Stage clear fanfare <- imperial brass/bell cadence + triangle shimmer
    clear: function () {
      temporaryDuck(0.24, 2100);
      playSample('pop', { gain: 0.45, rate: 1.08, maxDur: 0.22 });
      playSample('triangle', { gain: 0.36, rate: 1.0, delay: 0.28, maxDur: 1.3 });

      // D4 -> F#4 -> A4 -> D5 -> F#5 -> A5 triumphant cadence
      var fanfare = [
        { f: 293.66, d: 0.00, l: 0.18, g: 0.16 },
        { f: 369.99, d: 0.11, l: 0.18, g: 0.16 },
        { f: 440.00, d: 0.22, l: 0.20, g: 0.18 },
        { f: 587.33, d: 0.34, l: 0.62, g: 0.22 },
        { f: 739.99, d: 0.36, l: 0.58, g: 0.15 },
        { f: 880.00, d: 0.38, l: 0.66, g: 0.17 },
        { f: 1174.66, d: 0.46, l: 0.54, g: 0.11 }
      ];
      for (var i = 0; i < fanfare.length; i++) {
        var n = fanfare[i];
        synthBell(n.f, n.d, n.l, n.g);
        synthTone({
          freq: n.f, delay: n.d, dur: n.l, gain: n.g * 0.55, type: 'sawtooth',
          filterFreq: 1700, filterEndFreq: 680, attack: 0.012
        });
      }
    },

    // Battle fail <- solemn imperial minor descent
    fail: function () {
      temporaryDuck(0.25, 1900);
      var seq = [
        { f: 440.00, d: 0.00, l: 0.24, g: 0.16 },
        { f: 349.23, d: 0.18, l: 0.24, g: 0.16 },
        { f: 329.63, d: 0.36, l: 0.26, g: 0.15 },
        { f: 293.66, d: 0.54, l: 0.62, g: 0.19 }
      ];
      for (var i = 0; i < seq.length; i++) {
        var n = seq[i];
        synthTone({
          freq: n.f, delay: n.d, dur: n.l, gain: n.g, type: 'triangle',
          filterFreq: 950, filterEndFreq: 380, attack: 0.015
        });
      }
      // Deep D3 cello pedal
      synthTone({
        freq: 146.83, delay: 0.52, dur: 0.72, gain: 0.16, type: 'sawtooth',
        filterFreq: 380, filterEndFreq: 160, attack: 0.03
      });
    },

    // Level-up / heroine unlock / skill upgrade <- golden ascension arpeggio
    levelup: function () {
      playSample('pop', { gain: 0.44, rate: 1.15, maxDur: 0.22 });
      playSample('triangle', { gain: 0.36, rate: 1.06, delay: 0.22, maxDur: 1.15 });
      var notes = [587.33, 659.25, 739.99, 880.00, 987.77, 1174.66, 1479.98];
      for (var i = 0; i < notes.length; i++) {
        synthBell(notes[i], i * 0.052, 0.30 + (i === notes.length - 1 ? 0.28 : 0), 0.15);
      }
    },

    // Heroine talk / greeting / battle cheer chime <- triangle.ogg soft + music-box bell
    chime: function () {
      playSample('triangle', { gain: 0.30, rate: 1.12, maxDur: 0.72 });
      synthBell(880.00, 0.0, 0.22, 0.13);
      synthBell(1318.51, 0.065, 0.30, 0.14);
    },

    // Gift presentation <- pop.ogg + triangle.ogg + celesta triad
    gift: function () {
      var hasPop = playSample('pop', { gain: 0.46, rate: 1.08, maxDur: 0.22 });
      playSample('triangle', { gain: 0.32, rate: 1.05, delay: 0.06, maxDur: 0.95 });
      if (!hasPop) {
        synthTone({ freq: 520, endFreq: 840, dur: 0.045, gain: 0.12, type: 'sine', attack: 0.002 });
      }
      var notes = [783.99, 987.77, 1174.66, 1479.98];
      for (var i = 0; i < notes.length; i++) {
        synthBell(notes[i], 0.02 + i * 0.06, 0.32, 0.145);
      }
    },

    // Bond heart up <- warm harp & triangle blossom
    bond: function () {
      playSample('pop', { gain: 0.34, rate: 1.14, maxDur: 0.2 });
      playSample('triangle', { gain: 0.38, rate: 1.0, delay: 0.05, maxDur: 1.15 });
      var notes = [587.33, 739.99, 880.00, 1174.66, 1479.98];
      for (var i = 0; i < notes.length; i++) {
        synthBell(notes[i], i * 0.068, 0.38, 0.155);
      }
      synthTone({ freq: 440.00, delay: 0.04, dur: 0.48, gain: 0.08, type: 'sine', attack: 0.02 });
    },

    // Boss sting <- deep timpani strike + dark whoosh + D-Phrygian brass fifths
    boss: function () {
      var hasWhoosh = playSample('whoosh', { gain: 0.72, rate: 0.72, maxDur: 0.95 });
      if (!hasWhoosh) {
        synthNoise({ freq: 720, endFreq: 130, Q: 1.6, dur: 0.55, gain: 0.18, attack: 0.02, filterType: 'lowpass' });
      }
      // Sub timpani boom
      synthTone({ freq: 92, endFreq: 39, dur: 0.52, gain: 0.28, type: 'sine', attack: 0.005 });
      // Ominous brass fifths: D2+A2 -> Eb2+Bb2 -> D2+A2+F3
      var chords = [
        { f: [146.83, 220.00], d: 0.02, l: 0.26 },
        { f: [155.56, 233.08], d: 0.22, l: 0.24 },
        { f: [146.83, 220.00, 349.23], d: 0.42, l: 0.62 }
      ];
      for (var i = 0; i < chords.length; i++) {
        var c = chords[i];
        for (var j = 0; j < c.f.length; j++) {
          synthTone({
            freq: c.f[j], delay: c.d, dur: c.l, gain: 0.145, type: 'sawtooth',
            filterFreq: 860, filterEndFreq: 260, attack: 0.014
          });
        }
      }
    },

    // Result star tick (auto-ascends 1 -> 2 -> 3 when triggered in sequence)
    star: function (opts) {
      var nowMs = Date.now();
      if (nowMs - starStreakLastAt > 900) starStreakCount = 0;
      starStreakLastAt = nowMs;
      var idx = (opts && typeof opts.index === 'number') ? opts.index : starStreakCount;
      starStreakCount = (starStreakCount + 1) % 3;
      var pitches = [880.00, 1108.73, 1318.51];
      var f = pitches[clamp(idx, 0, 2)];
      playSample('triangle', { gain: 0.28, rate: 1.05 + idx * 0.08, maxDur: 0.65 });
      synthBell(f, 0.0, 0.28, 0.17);
      if (idx >= 2) synthBell(f * 1.5, 0.05, 0.34, 0.13);
    },

    // Shop purchase coin ring
    buy: function () {
      var hasPop = playSample('pop', { gain: 0.45, rate: 1.22, maxDur: 0.18 });
      if (!hasPop) {
        synthTone({ freq: 620, endFreq: 980, dur: 0.04, gain: 0.11, type: 'sine', attack: 0.002 });
      }
      synthBell(987.77, 0.0, 0.14, 0.15);
      synthBell(1479.98, 0.065, 0.28, 0.17);
    }
  };

  var SFX_ALIASES = {
    talk: 'chime',
    greet: 'chime',
    cheer: 'chime',
    click: 'tap',
    ui: 'tap',
    button: 'tap',
    miss: 'mismatch',
    wrong: 'mismatch',
    error: 'mismatch',
    trap: 'joker',
    win: 'clear',
    victory: 'clear',
    stageClear: 'clear',
    lose: 'fail',
    gameover: 'fail',
    timeout: 'fail',
    levelUp: 'levelup',
    'level-up': 'levelup',
    upgrade: 'levelup',
    unlock: 'levelup',
    bondUp: 'bond',
    'bond-up': 'bond',
    heart: 'bond',
    bossSting: 'boss',
    'boss-sting': 'boss',
    warning: 'boss',
    purchase: 'buy',
    coin: 'buy',
    gold: 'buy'
  };

  /* ───────── Procedural Imperial Noir BGM Sequencer ───────── */
  // 8-bar (64 eighth-note steps) progression in D Harmonic Minor / D Dorian:
  // Dm9 | Bbmaj7 | Gm7 | Asus4 -> A7 | Dm/F | C6 | Bb6 -> Edim | A7b9
  var BGM_BARS = [
    { bass: 38, pad: [50, 57, 65], arp: [62, 65, 69, 74, 72, 69, 65, 69], mel: [74,  0, 76, 77, 81,  0, 79, 77] },
    { bass: 46, pad: [46, 53, 62], arp: [58, 62, 65, 70, 69, 65, 62, 65], mel: [76,  0,  0, 74, 72,  0, 70,  0] },
    { bass: 43, pad: [43, 50, 58], arp: [55, 58, 62, 67, 65, 62, 58, 62], mel: [70,  0, 72, 74, 77,  0, 74, 70] },
    { bass: 45, pad: [45, 52, 61], arp: [57, 62, 64, 69, 61, 64, 69, 73], mel: [69,  0,  0,  0, 73,  0, 76,  0] },
    { bass: 41, pad: [41, 50, 57], arp: [62, 65, 69, 74, 76, 74, 69, 65], mel: [81,  0, 79, 77, 76,  0, 74,  0] },
    { bass: 48, pad: [48, 55, 64], arp: [60, 64, 67, 72, 74, 72, 67, 64], mel: [79,  0, 76, 74, 72,  0, 69,  0] },
    { bass: 46, pad: [46, 53, 62], arp: [58, 62, 65, 70, 55, 58, 64, 67], mel: [70,  0, 74,  0, 79,  0, 77, 76] },
    { bass: 45, pad: [45, 52, 58], arp: [57, 61, 64, 67, 69, 67, 64, 61], mel: [76,  0, 73,  0, 74,  0,  0,  0] }
  ];

  var bgm = {
    wanted: false,
    playing: false,
    track: 'main',
    step: 0,
    nextTime: 0,
    timer: null
  };

  function stepDurationForTrack(track) {
    // Eighth-note duration: main ~75 BPM, battle ~90 BPM, boss ~100 BPM
    if (track === 'boss') return 60 / 100 / 2;
    if (track === 'battle') return 60 / 90 / 2;
    return 60 / 75 / 2;
  }

  function scheduleBgmStep(stepIdx, atTime) {
    if (!ctx || !bgmDuckGain) return;
    var track = bgm.track;
    var stepDur = stepDurationForTrack(track);
    var barIdx = Math.floor(stepIdx / 8) % BGM_BARS.length;
    var sub = stepIdx % 8;
    var bar = BGM_BARS[barIdx];
    var isBoss = track === 'boss';
    var isBattle = track === 'battle' || isBoss;

    // 1. Warm Imperial Strings / Choir Pad on bar downbeat (and mid-bar swell in boss mode)
    if (sub === 0) {
      var barDur = stepDur * 8.1;
      var bassMidi = isBoss && barIdx % 2 === 1 ? bar.bass - 1 : bar.bass;
      synthTone({
        at: atTime, freq: midiToFreq(bassMidi), dur: barDur,
        gain: isBoss ? 0.14 : 0.115, type: 'triangle',
        attack: 0.25, sustain: 0.72, filterFreq: 320, bus: bgmDuckGain
      });
      for (var p = 0; p < bar.pad.length; p++) {
        var pf = midiToFreq(bar.pad[p]);
        synthTone({
          at: atTime, freq: pf, detune: p % 2 === 0 ? -5 : 5, dur: barDur,
          gain: isBoss ? 0.055 : 0.045, type: 'sawtooth',
          attack: 0.38, sustain: 0.75,
          filterFreq: isBoss ? 860 : isBattle ? 700 : 540,
          filterEndFreq: isBoss ? 520 : 380,
          bus: bgmDuckGain
        });
      }
    }

    // 2. Harp / Lute Arpeggio Figure
    var arpMidi = bar.arp[sub];
    if (arpMidi && (isBattle || sub % 2 === 0 || sub === 7)) {
      var arpFreq = midiToFreq(arpMidi);
      synthTone({
        at: atTime, freq: arpFreq, dur: stepDur * (isBattle ? 1.35 : 1.9),
        gain: isBoss ? 0.068 : 0.058, type: isBoss ? 'sawtooth' : 'triangle',
        attack: 0.008,
        filterFreq: isBoss ? 1450 : 1800,
        filterEndFreq: 520,
        bus: bgmDuckGain,
        echo: true
      });
    }

    // 3. Sovereign Celesta / Bell Motif
    var melMidi = bar.mel[sub];
    if (melMidi) {
      var mf = midiToFreq(melMidi);
      synthBell(mf, 0, stepDur * 2.3, isBoss ? 0.082 : 0.072, bgmDuckGain, true);
    }

    // 4. Soft Ceremonial Percussion (Timpani pulse + subtle brushed whisper)
    if (sub === 0 || (isBattle && sub === 4) || (isBoss && sub === 6)) {
      var accent = sub === 0 ? 1.0 : 0.65;
      synthTone({
        at: atTime, freq: isBoss ? 88 : 78, endFreq: 39,
        dur: isBoss ? 0.24 : 0.19,
        gain: (isBoss ? 0.13 : isBattle ? 0.095 : 0.065) * accent,
        type: 'sine', attack: 0.004, bus: bgmDuckGain
      });
    } else if (isBattle && sub % 2 === 1) {
      synthNoise({
        at: atTime, freq: 2600, endFreq: 1500, Q: 2.2,
        dur: 0.032, gain: isBoss ? 0.024 : 0.016,
        attack: 0.003, filterType: 'bandpass', bus: bgmDuckGain
      });
    }
  }

  function bgmSchedulerTick() {
    if (!bgm.playing || !ctx || ctx.state !== 'running') return;
    if (global.document && global.document.hidden) return;
    if (state.muted || !state.bgmEnabled) return;

    var now = ctx.currentTime;
    if (bgm.nextTime < now - 0.15) {
      bgm.nextTime = now + 0.03;
    }
    var stepDur = stepDurationForTrack(bgm.track);
    while (bgm.nextTime < now + 0.26) {
      scheduleBgmStep(bgm.step, bgm.nextTime);
      bgm.nextTime += stepDur;
      bgm.step = (bgm.step + 1) % (BGM_BARS.length * 8);
    }
  }

  function startBgmInternal(track) {
    if (track && typeof track === 'string') {
      bgm.track = track;
    }
    bgm.wanted = true;
    if (!state.bgmEnabled) return false;
    var c = ensureContext();
    if (!c) return false;

    if (!bgm.playing) {
      bgm.playing = true;
      bgm.nextTime = c.currentTime + 0.05;
    }
    if (!bgm.timer) {
      bgm.timer = global.setInterval(bgmSchedulerTick, 110);
    }
    if (c.state === 'running') {
      bgmSchedulerTick();
    }
    return true;
  }

  function stopBgmInternal() {
    bgm.wanted = false;
    bgm.playing = false;
    if (bgm.timer) {
      global.clearInterval(bgm.timer);
      bgm.timer = null;
    }
  }

  /* ───────── Ducking Control (Dialogue / Result / Fanfares) ───────── */
  function setDuckFactorSmooth(val, tc) {
    duckFactor = clamp(val, 0.05, 1.0);
    if (!ctx || !bgmDuckGain) return;
    var now = ctx.currentTime;
    try {
      bgmDuckGain.gain.cancelScheduledValues(now);
      bgmDuckGain.gain.setTargetAtTime(duckFactor, now, tc || 0.08);
    } catch (e) {
      bgmDuckGain.gain.value = duckFactor;
    }
  }

  function temporaryDuck(factor, ms) {
    if (duckHeld) return;
    if (duckTimer) global.clearTimeout(duckTimer);
    setDuckFactorSmooth(factor || 0.25, 0.05);
    duckTimer = global.setTimeout(function () {
      duckTimer = null;
      if (!duckHeld) setDuckFactorSmooth(1.0, 0.18);
    }, ms || 2000);
  }

  function duck(arg1, arg2) {
    if (arg1 === false) {
      return unduck();
    }
    if (duckTimer) {
      global.clearTimeout(duckTimer);
      duckTimer = null;
    }
    if (arg1 === true) {
      duckHeld = true;
      setDuckFactorSmooth(typeof arg2 === 'number' && arg2 <= 1 ? arg2 : 0.25, 0.07);
      return true;
    }
    if (typeof arg1 === 'number') {
      if (arg1 > 1) {
        // duck(durationMs)
        temporaryDuck(0.25, arg1);
        return true;
      }
      // duck(factor, optionalDurationMs)
      if (typeof arg2 === 'number' && arg2 > 0) {
        temporaryDuck(arg1, arg2);
      } else {
        duckHeld = true;
        setDuckFactorSmooth(arg1, 0.07);
      }
      return true;
    }
    // duck() with no args -> temporary 2.1s duck
    temporaryDuck(0.25, 2100);
    return true;
  }

  function unduck() {
    duckHeld = false;
    if (duckTimer) {
      global.clearTimeout(duckTimer);
      duckTimer = null;
    }
    setDuckFactorSmooth(1.0, 0.16);
    return true;
  }

  /* ───────── Gesture Unlock & Visibility Handling ───────── */
  function unlock() {
    var c = ensureContext();
    if (!c) return false;

    preloadSamples();

    if (c.state === 'suspended' && typeof c.resume === 'function') {
      try {
        var p = c.resume();
        if (p && typeof p.then === 'function') {
          p.then(function () {
            unlocked = true;
            applyBusGains();
            if (bgm.wanted && state.bgmEnabled) startBgmInternal(bgm.track);
          }).catch(function () {});
        }
      } catch (e) {}
    }

    // Play 1-frame silent buffer to unlock iOS Safari WebAudio hardware output
    if (!unlocked) {
      try {
        var silent = c.createBuffer(1, 1, 22050);
        var src = c.createBufferSource();
        src.buffer = silent;
        src.connect(c.destination);
        src.start(0);
        if (c.state === 'running') unlocked = true;
      } catch (e) {}
    }

    applyBusGains();
    if (bgm.wanted && state.bgmEnabled) {
      startBgmInternal(bgm.track);
    }
    return true;
  }

  function setupLifecycleListeners() {
    if (!global.document || !global.addEventListener) return;
    var events = ['pointerdown', 'touchstart', 'touchend', 'mousedown', 'keydown'];
    var onGesture = function () {
      unlock();
      if (unlocked && ctx && ctx.state === 'running') {
        for (var i = 0; i < events.length; i++) {
          global.removeEventListener(events[i], onGesture, true);
        }
      }
    };
    for (var i = 0; i < events.length; i++) {
      global.addEventListener(events[i], onGesture, true);
    }

    global.document.addEventListener('visibilitychange', function () {
      if (!ctx) return;
      if (global.document.hidden) {
        if (ctx.state === 'running' && ctx.suspend) {
          try { ctx.suspend(); } catch (e) {}
        }
      } else {
        if (ctx.state === 'suspended' && ctx.resume) {
          try {
            ctx.resume().then(function () {
              if (bgm.playing) {
                bgm.nextTime = ctx.currentTime + 0.05;
                bgmSchedulerTick();
              }
            }).catch(function () {});
          } catch (e) {}
        }
      }
    });
  }

  setupLifecycleListeners();

  /* ───────── Main SFX Dispatcher (+ Optional FX Bridge) ───────── */
  function notifyFxBridge(canonicalName, opts) {
    try {
      if (global.FX && typeof global.FX._onAudioSfx === 'function') {
        global.FX._onAudioSfx(canonicalName, opts);
      }
    } catch (e) {}
  }

  function play(name, opts) {
    if (!name) return false;
    var key = String(name);
    var canonical = SFX_ALIASES[key] || key;

    // Notify FX bridge for game events where game.js triggers audio directly
    if (canonical === 'skill' || canonical === 'boss' || canonical === 'joker' || canonical === 'levelup' || canonical === 'bond' || canonical === 'gift') {
      notifyFxBridge(canonical, opts);
    }

    if (!isSfxAudible()) return true;
    var c = ensureContext();
    if (!c) return false;
    preloadSamples();
    if (c.state === 'suspended' && c.resume) {
      try { c.resume(); } catch (e) {}
    }

    var fn = SFX_PLAYERS[canonical] || SFX_PLAYERS.tap;
    try {
      fn(opts);
    } catch (e) {}
    return true;
  }

  /* ───────── Settings & Volume Configuration API ───────── */
  function configure(cfg) {
    if (!cfg || typeof cfg !== 'object') return getState();
    if (typeof cfg.muted === 'boolean') state.muted = cfg.muted;
    if (typeof cfg.sfx === 'boolean') state.sfxEnabled = cfg.sfx;
    if (typeof cfg.sfxEnabled === 'boolean') state.sfxEnabled = cfg.sfxEnabled;
    if (typeof cfg.bgm === 'boolean') state.bgmEnabled = cfg.bgm;
    if (typeof cfg.bgmEnabled === 'boolean') state.bgmEnabled = cfg.bgmEnabled;
    if (typeof cfg.sfxVol === 'number') state.sfxVolume = clamp(cfg.sfxVol, 0, 1);
    if (typeof cfg.sfxVolume === 'number') state.sfxVolume = clamp(cfg.sfxVolume, 0, 1);
    if (typeof cfg.bgmVol === 'number') state.bgmVolume = clamp(cfg.bgmVol, 0, 1);
    if (typeof cfg.bgmVolume === 'number') state.bgmVolume = clamp(cfg.bgmVolume, 0, 1);

    if (!state.bgmEnabled && bgm.playing) {
      bgm.playing = false;
      if (bgm.timer) { global.clearInterval(bgm.timer); bgm.timer = null; }
    } else if (state.bgmEnabled && bgm.wanted && !bgm.playing && ctx) {
      startBgmInternal(bgm.track);
    }

    applyBusGains();
    persistSettings();
    syncMuteIcon();
    return getState();
  }

  function getState() {
    return {
      unlocked: unlocked || !!(ctx && ctx.state === 'running'),
      muted: state.muted,
      sfxEnabled: state.sfxEnabled,
      bgmEnabled: state.bgmEnabled,
      sfxVolume: state.sfxVolume,
      bgmVolume: state.bgmVolume,
      bgmPlaying: bgm.playing,
      bgmTrack: bgm.track,
      ducked: duckFactor < 0.99,
      samples: Object.keys(SAMPLE_FILES).reduce(function (acc, k) {
        acc[k] = sampleStatus[k] || 'idle';
        return acc;
      }, {})
    };
  }

  /* ───────── Public AudioEngine Object ───────── */
  var AudioEngine = {
    init: function (opts) {
      if (opts) configure(opts);
      syncMuteIcon();
      return AudioEngine;
    },
    unlock: unlock,
    resume: unlock,

    // Settings & Volumes
    configure: configure,
    applySettings: configure,
    setSettings: configure,
    syncState: function (saveState) {
      if (saveState && saveState.settings) configure(saveState.settings);
      else if (saveState) configure(saveState);
      return getState();
    },
    getState: getState,

    setSfxVolume: function (v) { configure({ sfxVolume: v }); return state.sfxVolume; },
    setSfxVol: function (v) { configure({ sfxVolume: v }); return state.sfxVolume; },
    getSfxVolume: function () { return state.sfxVolume; },

    setBgmVolume: function (v) { configure({ bgmVolume: v }); return state.bgmVolume; },
    setBgmVol: function (v) { configure({ bgmVolume: v }); return state.bgmVolume; },
    getBgmVolume: function () { return state.bgmVolume; },

    setVolume: function (kindOrObj, val) {
      if (kindOrObj && typeof kindOrObj === 'object') return configure(kindOrObj);
      if (kindOrObj === 'sfx') return AudioEngine.setSfxVolume(val);
      if (kindOrObj === 'bgm') return AudioEngine.setBgmVolume(val);
      if (typeof kindOrObj === 'number') return configure({ sfxVolume: kindOrObj, bgmVolume: kindOrObj });
      return getState();
    },

    setSfxEnabled: function (on) { configure({ sfxEnabled: !!on }); return state.sfxEnabled; },
    enableSfx: function (on) { configure({ sfxEnabled: on !== false }); return state.sfxEnabled; },
    toggleSfx: function () { configure({ sfxEnabled: !state.sfxEnabled }); return state.sfxEnabled; },
    isSfxEnabled: function () { return state.sfxEnabled && !state.muted; },

    setBgmEnabled: function (on) { configure({ bgmEnabled: !!on }); return state.bgmEnabled; },
    enableBgm: function (on) { configure({ bgmEnabled: on !== false }); return state.bgmEnabled; },
    toggleBgm: function () { configure({ bgmEnabled: !state.bgmEnabled }); return state.bgmEnabled; },
    isBgmEnabled: function () { return state.bgmEnabled && !state.muted; },

    setMuted: function (m) { configure({ muted: !!m }); return state.muted; },
    mute: function (m) { configure({ muted: m === undefined ? true : !!m }); return state.muted; },
    unmute: function () { configure({ muted: false }); return state.muted; },
    toggleMute: function () { configure({ muted: !state.muted }); return state.muted; },
    isMuted: function () { return state.muted; },

    // SFX Playback
    play: play,
    sfx: play,
    playSfx: play,
    preloadSamples: preloadSamples,

    // Named SFX Shorthands
    flip: function () { return play('flip'); },
    tap: function () { return play('tap'); },
    click: function () { return play('tap'); },
    match: function (o) { return play('match', o); },
    mismatch: function () { return play('mismatch'); },
    miss: function () { return play('mismatch'); },
    combo: function (n) { return play('combo', typeof n === 'number' ? { combo: n } : n); },
    skill: function (k) { return play('skill', k); },
    clear: function () { return play('clear'); },
    win: function () { return play('clear'); },
    fail: function () { return play('fail'); },
    lose: function () { return play('fail'); },
    levelup: function () { return play('levelup'); },
    levelUp: function () { return play('levelup'); },
    talk: function () { return play('chime'); },
    chime: function () { return play('chime'); },
    gift: function () { return play('gift'); },
    bond: function () { return play('bond'); },
    bondUp: function () { return play('bond'); },
    boss: function () { return play('boss'); },
    bossSting: function () { return play('boss'); },
    joker: function () { return play('joker'); },
    star: function (i) { return play('star', typeof i === 'number' ? { index: i } : i); },
    buy: function () { return play('buy'); },
    playTone: function (freq, dur, type) {
      if (!isSfxAudible()) return false;
      if (!ensureContext()) return false;
      synthTone({ freq: freq || 520, dur: dur || 0.08, type: type || 'triangle', gain: 0.14 });
      return true;
    },

    // BGM & Ducking
    playBgm: startBgmInternal,
    startBgm: startBgmInternal,
    bgm: startBgmInternal,
    stopBgm: stopBgmInternal,
    pauseBgm: stopBgmInternal,
    setMood: function (track) {
      bgm.track = track || 'main';
      return bgm.track;
    },
    duck: duck,
    duckBgm: duck,
    unduck: unduck,
    restoreBgm: unduck,

    // Diagnostic Self-Test
    test: function () {
      unlock();
      var seq = ['flip', 'match', 'combo', 'skill', 'boss', 'bond', 'levelup', 'clear'];
      seq.forEach(function (name, idx) {
        global.setTimeout(function () {
          play(name, name === 'combo' ? { combo: 4 } : {});
        }, idx * 280);
      });
      return getState();
    },
    audioTest: function () {
      return AudioEngine.test();
    }
  };

  Object.defineProperties(AudioEngine, {
    ctx: { get: function () { return ctx; } },
    unlocked: { get: function () { return unlocked || !!(ctx && ctx.state === 'running'); } },
    muted: { get: function () { return state.muted; } },
    sfxEnabled: { get: function () { return state.sfxEnabled; } },
    bgmEnabled: { get: function () { return state.bgmEnabled; } },
    sfxVolume: { get: function () { return state.sfxVolume; } },
    bgmVolume: { get: function () { return state.bgmVolume; } },
    samples: { get: function () { return sampleBuffers; } }
  });

  global.AudioEngine = AudioEngine;
})(typeof window !== 'undefined' ? window : this);
