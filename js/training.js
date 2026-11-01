/* 記憶帝國 — 工作記憶訓練模組
 * 指標／自適應階梯／每日紀錄。由 game.js 掛載；可經 window.Training 讀取。
 * 設計要點：以「配對位置已知」為回憶判定；輔助場不進階梯與 span。
 */
(function () {
  'use strict';

  var LOAD_LEVELS = [
    { cols: 4, rows: 3, flipBack: 700, fogBoost: 0 },
    { cols: 4, rows: 4, flipBack: 650, fogBoost: 0 },
    { cols: 5, rows: 4, flipBack: 600, fogBoost: 0 },
    { cols: 6, rows: 4, flipBack: 560, fogBoost: 0.1 },
    { cols: 6, rows: 5, flipBack: 520, fogBoost: 0.2 },
    { cols: 6, rows: 6, flipBack: 480, fogBoost: 0.3 },
    { cols: 7, rows: 6, flipBack: 450, fogBoost: 0.4 }
  ];
  var MAX_LOAD = LOAD_LEVELS.length - 1;
  var MIN_EVENTS = 4; // 回憶機會不足時不調難度
  var HISTORY_KEY = 'memoryRPG_trainHist';
  var DAY_KEEP = 28;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function dateStr(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function loadLevelSpec(lv) {
    lv = clamp(lv | 0, 0, MAX_LOAD);
    var s = LOAD_LEVELS[lv];
    var cells = s.cols * s.rows;
    return {
      load: lv, cols: s.cols, rows: s.rows,
      sets: Math.floor(cells / 2),
      flipBack: s.flipBack, fogBoost: s.fogBoost
    };
  }

  /** 戰役關卡：盤面取自適應，但夾在 stageTier± 範圍 */
  function resolveBoard(stageTier, load, opts) {
    opts = opts || {};
    var lo = clamp((stageTier | 0) - 1, 0, MAX_LOAD);
    var hi = clamp((stageTier | 0) + 2, 0, MAX_LOAD);
    var lv = clamp(load | 0, lo, hi);
    if (opts.forceLoad != null) lv = clamp(opts.forceLoad | 0, 0, MAX_LOAD);
    return loadLevelSpec(lv);
  }

  /* ───────── 單場追蹤器 ───────── */
  function createTracker(meta) {
    meta = meta || {};
    return {
      assisted: !!meta.assisted,       // 硬輔助：預視卷軸等
      softAssisted: !!meta.softAssisted, // 軟輔助：戰術回顧
      peekChallenge: null,             // { targets: [i,j], until: ts, done: bool }
      seen: {},                        // index → true
      pairLocs: {},                    // pairId → {i:true, ...}
      recallHit: 0,
      knownErrors: 0,
      exploreMismatch: 0,
      firstFlip: 0,
      firstFlipOk: 0,
      spanMax: 0,
      spanSamples: [],
      moves: 0,
      reviewArmed: 0                   // 戰術回顧後剩餘豁免次數
    };
  }

  function markSeen(tr, idx, pairId) {
    if (idx == null || pairId == null) return;
    tr.seen[idx] = true;
    if (!tr.pairLocs[pairId]) tr.pairLocs[pairId] = {};
    tr.pairLocs[pairId][idx] = true;
  }

  function partnerKnown(tr, pairId, selfIdx) {
    var loc = tr.pairLocs[pairId];
    if (!loc) return false;
    for (var k in loc) if (Object.prototype.hasOwnProperty.call(loc, k)) {
      if (+k !== selfIdx) return true;
    }
    return false;
  }

  function seenUnmatchedCount(tr, cards) {
    var n = 0;
    for (var i = 0; i < cards.length; i++) {
      var c = cards[i];
      if (!c || c.joker || c.matched) continue;
      if (tr.seen[i]) n++;
    }
    return n;
  }

  /** 翻開一張牌時呼叫（joker 除外） */
  function onReveal(tr, idx, pairId) {
    var firstTime = !tr.seen[idx];
    markSeen(tr, idx, pairId);
    return firstTime;
  }

  /**
   * 一次完整選牌結束。
   * known：翻開第一張時、onReveal 之前，配對位置是否已在其他索引出現過。
   * （必須由呼叫端傳入，避免第二張 onReveal 污染 pairLocs。）
   */
  function onResolve(tr, idxs, cards, matched, known) {
    if (!tr || !idxs || idxs.length < 2) return;
    tr.moves += 1;
    var first = idxs[0];
    var c0 = cards[first];
    if (!c0 || c0.joker) return;

    if (typeof known !== 'boolean') {
      // 後備：排除本輪選中的其他牌後，是否仍有已知位置
      known = false;
      var loc = tr.pairLocs[c0.pair] || {};
      for (var k in loc) if (Object.prototype.hasOwnProperty.call(loc, k)) {
        if (idxs.indexOf(+k) === -1) { known = true; break; }
      }
    }

    var exempt = tr.reviewArmed > 0;
    if (exempt) tr.reviewArmed -= 1;

    if (known) {
      if (!exempt && !tr.assisted) {
        if (matched) {
          tr.recallHit += 1;
          var held = seenUnmatchedCount(tr, cards);
          tr.spanSamples.push(held);
          if (held > tr.spanMax) tr.spanMax = held;
        } else {
          tr.knownErrors += 1;
        }
      }
    } else {
      if (!matched) tr.exploreMismatch += 1;
    }

    for (var i = 0; i < idxs.length; i++) {
      var c = cards[idxs[i]];
      if (c && !c.joker) markSeen(tr, idxs[i], c.pair);
    }
  }

  function armReview(tr, flips) {
    tr.softAssisted = true;
    tr.reviewArmed = Math.max(tr.reviewArmed, flips | 0 || 3);
  }

  function markHardAssist(tr) { tr.assisted = true; }

  function setPeekChallenge(tr, targets, ms) {
    tr.peekChallenge = {
      targets: (targets || []).slice(),
      until: Date.now() + (ms || 8000),
      done: false,
      claimed: false
    };
  }

  function checkPeekChallenge(tr, matchedIdxs) {
    var ch = tr.peekChallenge;
    if (!ch || ch.claimed || ch.done) return false;
    if (Date.now() > ch.until) { ch.done = true; return false; }
    var set = {};
    matchedIdxs.forEach(function (i) { set[i] = true; });
    var ok = ch.targets.length > 0 && ch.targets.every(function (i) { return set[i]; });
    if (ok) { ch.claimed = true; ch.done = true; return true; }
    return false;
  }

  function finalize(tr) {
    var events = tr.recallHit + tr.knownErrors;
    var acc = events > 0 ? tr.recallHit / events : null;
    var spanOk = !tr.assisted && !tr.softAssisted && tr.recallHit >= 3;
    return {
      recallHit: tr.recallHit,
      knownErrors: tr.knownErrors,
      exploreMismatch: tr.exploreMismatch,
      recallAcc: acc,
      recallEvents: events,
      span: spanOk ? tr.spanMax : null,
      spanSamples: tr.spanSamples.slice(),
      assisted: tr.assisted,
      softAssisted: tr.softAssisted,
      moves: tr.moves
    };
  }

  /* ───────── 自適應 ───────── */
  function defaultTrainState() {
    return {
      load: 0,
      goodStreak: 0,
      badStreak: 0,
      sessionsToday: 0,
      trainDate: '',
      trainStreak: 0,
      lastTrainDate: '',
      history: [] // { date, recallAcc, span, load, win, assisted, softAssisted, knownErrors, n }
    };
  }

  function ensureTrain(S) {
    if (!S.training || typeof S.training !== 'object') S.training = defaultTrainState();
    var t = S.training;
    if (!isNum(t.load)) t.load = 0;
    t.load = clamp(t.load | 0, 0, MAX_LOAD);
    if (!isNum(t.goodStreak)) t.goodStreak = 0;
    if (!isNum(t.badStreak)) t.badStreak = 0;
    if (!Array.isArray(t.history)) t.history = [];
    return t;
  }

  function applyStaircase(S, metrics, win, reason) {
    var t = ensureTrain(S);
    // 硬／軟輔助都不進階梯
    if (metrics.assisted || metrics.softAssisted) {
      return { changed: false, reason: 'assisted', load: t.load };
    }
    var events = metrics.recallEvents | 0;
    var acc = metrics.recallAcc;
    var quit = reason === 'quit';
    var failed = !win;
    var disaster = isNum(acc) && events >= MIN_EVENTS && acc < 0.5;
    var poor = failed || (isNum(acc) && events >= MIN_EVENTS && acc < 0.65);
    var great = win && isNum(acc) && events >= MIN_EVENTS && acc >= 0.85;

    var prev = t.load;
    var note = 'hold';

    if (disaster || quit) {
      t.badStreak += 1;
      t.goodStreak = 0;
      t.load = clamp(t.load - 1, 0, MAX_LOAD);
      t.badStreak = 0;
      note = disaster ? 'disaster' : 'quit';
    } else if (poor) {
      t.badStreak += 1;
      t.goodStreak = 0;
      if (t.badStreak >= 2) {
        t.load = clamp(t.load - 1, 0, MAX_LOAD);
        t.badStreak = 0;
        note = 'poor2';
      } else note = 'poor1';
    } else if (great) {
      t.goodStreak += 1;
      t.badStreak = 0;
      if (t.goodStreak >= 2) {
        t.load = clamp(t.load + 1, 0, MAX_LOAD);
        t.goodStreak = 0;
        note = 'great2';
      } else note = 'great1';
    } else if (events < MIN_EVENTS) {
      note = 'insufficient';
      // 資料不足不改 streak（避免摸牌刷）
    } else {
      // 普通場：重置雙向 streak 的「連」但不調級
      t.goodStreak = 0;
      t.badStreak = 0;
      note = 'mid';
    }

    return { changed: t.load !== prev, reason: note, load: t.load, prev: prev };
  }

  function recordSession(S, entry) {
    var t = ensureTrain(S);
    var today = dateStr();
    if (t.trainDate !== today) {
      t.trainDate = today;
      t.sessionsToday = 0;
    }
    t.sessionsToday += 1;

    // 訓練連續日（有完成一場非輔助即可）
    if (!entry.assisted) {
      if (t.lastTrainDate !== today) {
        var y = new Date(); y.setDate(y.getDate() - 1);
        if (t.lastTrainDate === dateStr(y)) t.trainStreak = (t.trainStreak | 0) + 1;
        else t.trainStreak = 1;
        t.lastTrainDate = today;
      }
    }

    t.history.push({
      date: today,
      ts: Date.now(),
      recallAcc: entry.recallAcc,
      span: entry.span,
      load: entry.load,
      win: !!entry.win,
      assisted: !!entry.assisted,
      softAssisted: !!entry.softAssisted,
      knownErrors: entry.knownErrors | 0,
      recallHit: entry.recallHit | 0,
      n: entry.n | 0,
      mode: entry.mode || 'campaign'
    });
    if (t.history.length > 200) t.history = t.history.slice(-200);

    // 同步精簡日彙總到獨立 key，供主畫面重設計讀取
    try {
      var raw = localStorage.getItem(HISTORY_KEY);
      var days = raw ? JSON.parse(raw) : {};
      if (!days || typeof days !== 'object') days = {};
      var d = days[today] || { sessions: 0, spans: [], accs: [], load: entry.load };
      d.sessions += 1;
      if (isNum(entry.span)) d.spans.push(entry.span);
      if (isNum(entry.recallAcc) && !entry.assisted && !entry.softAssisted) d.accs.push(entry.recallAcc);
      d.load = entry.load;
      days[today] = d;
      // 清掉過舊
      var keys = Object.keys(days).sort();
      while (keys.length > DAY_KEEP) { delete days[keys.shift()]; keys = Object.keys(days).sort(); }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(days));
    } catch (e) {}

    return t;
  }

  function avg(arr) {
    if (!arr || !arr.length) return null;
    var s = 0, n = 0;
    for (var i = 0; i < arr.length; i++) if (isNum(arr[i])) { s += arr[i]; n++; }
    return n ? s / n : null;
  }

  function summary(S) {
    var t = ensureTrain(S || {});
    var today = dateStr();
    var hist = (t.history || []).filter(function (h) { return !h.assisted && !h.softAssisted; });
    var cutoff = Date.now() - 7 * 86400000;
    var last7 = hist.filter(function (h) { return (h.ts || 0) >= cutoff; });
    var spanTrend = [];
    try {
      var days = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
      Object.keys(days).sort().forEach(function (d) {
        var sp = avg(days[d].spans);
        spanTrend.push({ date: d, span: sp, sessions: days[d].sessions, load: days[d].load });
      });
    } catch (e) {}
    return {
      load: t.load,
      loadSpec: loadLevelSpec(t.load),
      sessionsToday: t.trainDate === today ? (t.sessionsToday | 0) : 0,
      streak: t.trainStreak | 0,
      avgRecall7: avg(last7.map(function (h) { return h.recallAcc; })),
      avgSpan7: avg(last7.map(function (h) { return h.span; })),
      avgKnownErr7: avg(last7.map(function (h) { return h.knownErrors; })),
      spanTrend: spanTrend,
      recent: hist.slice(-10)
    };
  }

  function deltaVs7Day(S, metrics) {
    var sum = summary(S);
    return {
      recallAcc: isNum(metrics.recallAcc) && isNum(sum.avgRecall7) ? metrics.recallAcc - sum.avgRecall7 : null,
      span: isNum(metrics.span) && isNum(sum.avgSpan7) ? metrics.span - sum.avgSpan7 : null,
      avgRecall7: sum.avgRecall7,
      avgSpan7: sum.avgSpan7
    };
  }

  /** 星等：回憶正確率為主，時間為輔 */
  function starsForTrain(r) {
    var acc = r.recallAcc;
    if (!isNum(acc)) {
      // 無回憶樣本：退回效率
      acc = r.sets / Math.max(1, r.sets + (r.miss || 0));
    }
    var tr = (r.timeLeft || 0) / Math.max(1, r.timeMax || 1);
    var s = 1;
    if (acc >= 0.70) s = 2;
    if (acc >= 0.88 && (tr >= 0.08 || (r.knownErrors | 0) === 0)) s = 3;
    if (acc >= 0.95 && (r.knownErrors | 0) === 0) s = 3;
    return s;
  }

  window.Training = {
    LOAD_LEVELS: LOAD_LEVELS,
    MAX_LOAD: MAX_LOAD,
    MIN_EVENTS: MIN_EVENTS,
    loadLevelSpec: loadLevelSpec,
    resolveBoard: resolveBoard,
    createTracker: createTracker,
    onReveal: onReveal,
    partnerKnown: partnerKnown,
    onResolve: onResolve,
    armReview: armReview,
    markHardAssist: markHardAssist,
    setPeekChallenge: setPeekChallenge,
    checkPeekChallenge: checkPeekChallenge,
    finalize: finalize,
    ensureTrain: ensureTrain,
    applyStaircase: applyStaircase,
    recordSession: recordSession,
    summary: summary,
    deltaVs7Day: deltaVs7Day,
    starsForTrain: starsForTrain,
    defaultTrainState: defaultTrainState
  };
})();
