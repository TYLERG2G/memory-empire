/* 記憶帝國：女傑翻牌 v3 — 靜態資料與規則表
 * 由 game.js 讀取 window.GAME_DATA；其他模組（heroine.js / story.js）可唯讀使用。
 * 內容守則：原創成年角色、典雅非暴露服裝。
 */
(function () {
  'use strict';

  var VERSION = 'v3.0';

  /* ───────── 女傑 ───────── */
  var HEROINES = [
    { id: 'verda', name: '薇爾妲·諾克特', title: '冷傲魔女軍官', color: '#9b59ff',
      skill: 'peek', skillName: '魔眼窺視', reqLv: 1, cost: 0,
      favGifts: ['book', 'moonlamp'],
      bio: '統領夜之魔導部隊的女軍官，冷峻的紫瞳能在一瞬間看穿所有偽裝。',
      lines: {
        0: ['……有事嗎？', '別浪費時間。', '帝國不容懈怠。'],
        1: ['你的記憶力……還算過得去。', '繼續精進吧。', '今晚的訓練結束了嗎？'],
        2: ['能被你選作出戰，並非偶然。', '魔眼會為你照亮牌面。', '……我偶爾也會期待下一場。'],
        3: ['與你並肩的感覺，並不壞。', '記得回來覆命。', '紫月之下，我會守著你。']
      },
      cheer: { combo: '漂亮，繼續。', skill: '魔眼，開。', lowtime: '冷靜，記住位置。', miss: '……再看清楚。' }
    },
    { id: 'karena', name: '卡蓮娜·緋焰', title: '熱血機甲騎士', color: '#ff4d3a',
      skill: 'freeze', skillName: '緋焰停滯', reqLv: 3, cost: 200,
      favGifts: ['bbq', 'ribbon'],
      bio: '駕馭紅色機甲的王牌騎士，戰場上的烈焰總讓敵人屏息。',
      lines: {
        0: ['哈！來比一場嗎？', '別站著發呆！', '機甲已就緒。'],
        1: ['不錯嘛，反應變快了。', '再燃一點！', '這股熱度我喜歡。'],
        2: ['跟你搭檔超有幹勁！', '凍結時間，衝進去！', '贏了請我吃烤肉。'],
        3: ['你是我認可的搭檔。', '緋焰永遠為你開路。', '下次也一起上吧！']
      },
      cheer: { combo: '燃起來了！', skill: '時間，停下！', lowtime: '別慌，衝啊！', miss: '沒事，下一張！' }
    },
    { id: 'elys', name: '艾莉絲·羅亞', title: '優雅外交官', color: '#4fc3f7',
      skill: 'time', skillName: '從容斡旋', reqLv: 5, cost: 400,
      favGifts: ['tea', 'flowers'],
      bio: '帝國最出色的談判家，總能在絕境中替同伴爭取到寶貴的時間。',
      lines: {
        0: ['下午好。需要協助嗎？', '請保持禮儀。', '時間很寶貴呢。'],
        1: ['你的進步我看在眼裡。', '從容，是勝利的關鍵。', '茶涼了喔。'],
        2: ['與你談話總是愉快。', '我再為你爭取一點時間。', '今晚的舞會……你會來嗎？'],
        3: ['你是我最信任的同伴。', '無論局勢如何，我站在你這邊。', '願星光指引我們。']
      },
      cheer: { combo: '真是優雅的連擊。', skill: '交給我斡旋吧。', lowtime: '深呼吸，還來得及。', miss: '無妨，從容些。' }
    },
    { id: 'selas', name: '塞拉斯·薇恩', title: '冷酷參謀官', color: '#7fd18b',
      skill: 'match', skillName: '戰術推演', reqLv: 8, cost: 700,
      favGifts: ['chess', 'book'],
      bio: '算無遺策的參謀官，一眼便能推演出棋盤上的最佳解。',
      lines: {
        0: ['報告。', '別打亂我的推演。', '下一步呢？'],
        1: ['數據顯示你在成長。', '這局可以更乾淨。', '失誤率下降了，很好。'],
        2: ['你的判斷……越來越接近最優解。', '自動配對交給我。', '偶爾休息也是戰術的一環。'],
        3: ['我把後背交給你了。', '計算之外的變數，是你。', '……謝謝。']
      },
      cheer: { combo: '符合推演。', skill: '執行配對。', lowtime: '剩餘時間不多，優先已知位置。', miss: '記錄在案。' }
    },
    { id: 'reina', name: '萊娜·克洛斯', title: '忠誠騎士團長', color: '#ffcf4a',
      skill: 'combo', skillName: '騎士誓約', reqLv: 12, cost: 1200,
      favGifts: ['ribbon', 'musicbox'],
      bio: '誓死守護帝國的騎士團長，她的誓約之劍讓每次連擊都更加輝煌。',
      lines: {
        0: ['騎士團長萊娜，報到。', '請下達指令。', '榮耀歸於帝國。'],
        1: ['你的連擊很漂亮。', '誓約之力與你同在。', '守護，是我的職責。'],
        2: ['能為你而戰，是我的榮譽。', '這柄劍，只為值得之人出鞘。', '休息時……也可以聊聊。'],
        3: ['我的誓約，獻給你。', '無論前方為何，我開路。', '與你並肩的每一戰，都銘記於心。']
      },
      cheer: { combo: '誓約之光！', skill: '騎士們，隨我來！', lowtime: '堅守陣線！', miss: '穩住，再來。' }
    }
  ];

  /* 服裝：全部為典雅非暴露款式；以 CSS 濾鏡/邊框呈現 */
  var OUTFITS = [
    { id: 'default', name: '常服', reqBond: 0 },
    { id: 'cape', name: '夜宴披風', reqBond: 2 },
    { id: 'formal', name: '帝國禮服', reqBond: 4 },
    { id: 'summer', name: '夏日洋裝', reqBond: 0, shop: 'outfit_summer', note: '長裙款連身洋裝' },
    { id: 'yukata', name: '祭典浴衣', reqBond: 0, event: 'chapter3', note: '通過第三章解鎖' }
  ];

  /* ───────── 撲克 ───────── */
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var SUITS = [
    { sym: '♠', color: 'black' },
    { sym: '♥', color: 'red' },
    { sym: '♦', color: 'red' },
    { sym: '♣', color: 'black' }
  ];

  /* ───────── 隨機（可播種） ───────── */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function shuffleInPlace(arr, rng) {
    rng = rng || Math.random;
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function allPokerFaces() {
    var out = [];
    for (var si = 0; si < SUITS.length; si++) {
      for (var ri = 0; ri < RANKS.length; ri++) {
        out.push({ id: RANKS[ri] + SUITS[si].sym, rank: RANKS[ri], suit: SUITS[si].sym, color: SUITS[si].color });
      }
    }
    return out;
  }
  /** 取 n 種不重複牌面 */
  function dealPairs(n, rng) {
    var faces = shuffleInPlace(allPokerFaces(), rng);
    return faces.slice(0, Math.min(n, faces.length));
  }
  /** 誘餌：同點數、同顏色不同花色成對出現（A♠ 與 A♣ 同場） */
  function dealDecoy(n, rng) {
    rng = rng || Math.random;
    var ranks = shuffleInPlace(RANKS.slice(), rng);
    var groups = [['♠', '♣'], ['♥', '♦']];
    var out = [];
    for (var i = 0; i < ranks.length && out.length < n; i++) {
      var g = groups[rng() < 0.5 ? 0 : 1];
      for (var k = 0; k < 2 && out.length < n; k++) {
        out.push({ id: ranks[i] + g[k], rank: ranks[i], suit: g[k], color: g === groups[1] ? 'red' : 'black' });
      }
    }
    return shuffleInPlace(out, rng);
  }

  /* ───────── 章節 ───────── */
  var STAGES_PER_CHAPTER = 10;
  var CHAPTERS = [
    { id: 1, name: '緋月序曲', sub: '帝都外環', boss: ['霧影斥候', '外環守門人'],
      intro: '緋紅之月升起的夜晚，帝都外環的哨塔一座座熄了燈。你接過蓋有皇印的密令：以記憶為劍，找回失落的徽記。女傑們在城門下等你，披風被夜風吹得獵獵作響。' },
    { id: 2, name: '鏡廳迷宮', sub: '舊王宮', boss: ['鏡中侍從', '千面女官'],
      intro: '舊王宮的鏡廳裡，每一面鏡子都映著不同的過去。牌面在鏡光中閃爍，稍一分神便會被虛像迷惑。艾莉絲輕聲提醒：「看清真實，別被倒影牽著走。」' },
    { id: 3, name: '星祭長街', sub: '港都夜市', boss: ['燈籠商人', '星祭司儀'],
      intro: '港都迎來一年一度的星祭。長街掛滿燈籠，人潮之中藏著敵國的密探。卡蓮娜興奮地拉著你穿過攤位：「打完這仗，一起去看煙火！」' },
    { id: 4, name: '霜原要塞', sub: '北境', boss: ['霜鎧衛士', '冰冠將軍'],
      intro: '北境的風雪掩去了道路。要塞城牆上的符文會在寒霧中改變位置，唯有清晰的記憶能找到正確的路徑。塞拉斯攤開地圖：「推演已完成，接下來看你的了。」' },
    { id: 5, name: '帝冠終章', sub: '王座之間', boss: ['影之宰相', '虛冠之主'],
      intro: '王座之間的穹頂下，失落的徽記靜靜懸浮。萊娜拔劍立於你身側：「這是最後一戰。我的誓約，與你同在。」燭火搖曳，最後的牌局即將開始。' }
  ];
  var CAMPAIGN_STAGES = CHAPTERS.length * STAGES_PER_CHAPTER;

  /* ───────── 頭目機制（輪替） ───────── */
  var BOSS_MECHS = [
    { id: 'joker', name: '小丑陷阱', desc: '場上混入鬼牌，翻到會扣除時間' },
    { id: 'fast', name: '疾速覆牌', desc: '翻錯時牌面迅速蓋回' },
    { id: 'fog', name: '迷霧牌面', desc: '部分牌面翻開後很快被霧氣遮蔽' },
    { id: 'triple', name: '三連誓約', desc: '需翻出三張相同的牌才算配對' },
    { id: 'decoy', name: '同點誘餌', desc: '同點數、同色不同花色的牌混雜其中' }
  ];
  function bossMech(id) {
    for (var i = 0; i < BOSS_MECHS.length; i++) if (BOSS_MECHS[i].id === id) return BOSS_MECHS[i];
    return null;
  }

  /* ───────── 盤面規格 ───────── */
  // cols × rows：4×3 → 4×4 → 5×4 → 6×4 → 6×5
  var GRIDS = [[4, 3], [4, 4], [5, 4], [6, 4], [6, 5]];
  var GRID_START = [1, 3, 7, 14, 24]; // 該盤面起始關卡

  function gridTier(n) {
    var t = 0;
    for (var i = 0; i < GRID_START.length; i++) if (n >= GRID_START[i]) t = i;
    return t;
  }

  /**
   * 產生關卡規格。opts: { boss: mechId 強制頭目, mode: 'campaign'|'daily'|'endless' }
   */
  function stageConfig(n, opts) {
    opts = opts || {};
    n = Math.max(1, n | 0);
    var isBoss = !!opts.boss || (opts.mode !== 'endless' && n % 5 === 0);
    var tier = gridTier(n);
    if (isBoss && tier < GRIDS.length - 1 && n >= 5) tier = Math.min(GRIDS.length - 1, tier + (n >= 10 ? 1 : 0));
    var cols = GRIDS[tier][0], rows = GRIDS[tier][1];
    var mech = null;
    if (isBoss) {
      mech = opts.boss || BOSS_MECHS[((Math.floor(n / 5) - 1) % BOSS_MECHS.length + BOSS_MECHS.length) % BOSS_MECHS.length].id;
    }
    var setSize = mech === 'triple' ? 3 : 2;
    if (mech === 'triple') {
      // 盤面需為 3 的倍數
      var cells = cols * rows;
      if (cells % 3 !== 0) { cols = 6; rows = cells > 18 ? 4 : 3; }
    }
    var cells2 = cols * rows;
    var jokers = mech === 'joker' ? 2 : 0;
    var sets = Math.floor((cells2 - jokers) / setSize);
    // 每組秒數隨關卡縮短
    var secPer = Math.max(2.5, 5.2 - n * 0.055);
    if (setSize === 3) secPer *= 1.35;
    var time = Math.round(sets * secPer + 6 + (isBoss ? 6 : 0));
    var missLimit = Math.max(sets, Math.round(sets * (1.9 - Math.min(n, 60) * 0.016)));
    if (isBoss) missLimit += 2;
    var preview = n <= 3 ? 2.5 : n <= 8 ? 1.8 : n <= 16 ? 1.2 : n <= 30 ? 0.9 : 0.6;
    var flipBack = n <= 10 ? 650 : n <= 30 ? 560 : 480;
    if (mech === 'fast') { preview = 0; flipBack = 300; }
    var ch = Math.min(CHAPTERS.length, Math.ceil(n / STAGES_PER_CHAPTER));
    var cidx = ((n - 1) % STAGES_PER_CHAPTER) + 1;
    var bossName = null;
    if (isBoss) {
      var chap = CHAPTERS[ch - 1];
      bossName = chap ? chap.boss[cidx === 10 ? 1 : 0] : '守關者';
    }
    return {
      n: n, chapter: ch, chapterIdx: cidx, cols: cols, rows: rows, setSize: setSize,
      sets: sets, jokers: jokers, time: time, missLimit: missLimit, preview: preview,
      flipBack: flipBack, boss: mech, bossName: bossName, fogRatio: mech === 'fog' ? 0.5 : 0,
      jokerPenalty: 5
    };
  }

  /** 每日挑戰：以日期為種子 */
  function dailyConfig(dateStr) {
    var seed = hashStr('daily:' + dateStr);
    var rng = mulberry32(seed);
    var n = 12 + Math.floor(rng() * 20);
    var mech = rng() < 0.6 ? BOSS_MECHS[Math.floor(rng() * BOSS_MECHS.length)].id : null;
    var cfg = stageConfig(n, { boss: mech, mode: 'daily' });
    if (!mech) { cfg.boss = null; cfg.bossName = null; }
    cfg.seed = seed;
    cfg.mode = 'daily';
    cfg.label = '每日挑戰 ' + dateStr;
    return cfg;
  }

  /** 無盡模式第 r 輪 */
  function endlessConfig(round) {
    var n = 2 + round * 3;
    var mech = round >= 3 && round % 3 === 0 ? BOSS_MECHS[(round / 3 - 1) % BOSS_MECHS.length].id : null;
    var cfg = stageConfig(n, { boss: mech, mode: 'endless' });
    cfg.mode = 'endless';
    cfg.round = round;
    cfg.roundBonus = Math.max(6, 16 - round);
    return cfg;
  }

  /** 1–3 星：剩餘時間比例 + 失誤 + 效率 */
  function starsFor(r) {
    var eff = r.sets / Math.max(1, r.sets + r.miss);
    var tr = r.timeLeft / Math.max(1, r.timeMax);
    var s = 1;
    if (tr >= 0.15 && eff >= 0.5) s = 2;
    if (tr >= 0.3 && eff >= 0.68) s = 3;
    return s;
  }

  /* ───────── 技能 ───────── */
  var SKILL_MAX = 10, CD_MAX = 5;
  var SKILL_CD = { peek: 28, freeze: 32, time: 36, match: 42, combo: 0 };
  function skillValue(skill, lv) {
    lv = lv || 1;
    switch (skill) {
      case 'peek': return Math.round((1.2 + (lv - 1) * 0.2) * 100) / 100;
      case 'freeze': return 4 + (lv - 1);
      case 'time': return 6 + (lv - 1) * 1.5;
      case 'match': return 1 + Math.floor((lv - 1) / 4);
      case 'combo': return Math.round((1.5 + (lv - 1) * 0.15) * 100) / 100;
    }
    return 0;
  }
  function skillCooldown(skill, cdLv) {
    var base = SKILL_CD[skill] || 0;
    return Math.round(base * (1 - 0.1 * (cdLv || 0)));
  }
  function skillDesc(skill, lv) {
    var v = skillValue(skill, lv);
    switch (skill) {
      case 'peek': return '窺視全部卡牌 ' + v + ' 秒';
      case 'freeze': return '凍結計時 ' + v + ' 秒';
      case 'time': return '戰鬥時間 +' + v + ' 秒';
      case 'match': return '自動配對 ' + v + ' 組';
      case 'combo': return '被動：連擊得分 x' + v;
    }
    return '';
  }
  function upgradeCost(lv) { return 120 * lv; }
  function cdUpgradeCost(cdLv) { return 200 * (cdLv + 1); }

  /* ───────── 商店 ───────── */
  var SHOP = {
    consumables: [
      { id: 'hourglass', icon: '⏳', name: '時之沙漏', desc: '下一場戰鬥時間 +10 秒', price: 120 },
      { id: 'scroll', icon: '📜', name: '預視卷軸', desc: '下一場開局窺視全部卡牌 1.5 秒', price: 100 },
      { id: 'charm', icon: '🧿', name: '守護符', desc: '下一場失誤上限 +3', price: 110 },
      { id: 'elixir', icon: '🧪', name: '技能秘藥', desc: '下一場技能冷卻減半', price: 140 },
      { id: 'potion', icon: '⚡', name: '體力藥水', desc: '立即回復 5 點體力', price: 90, instant: true }
    ],
    relics: [
      { id: 'lion', icon: '🦁', name: '金獅徽章', desc: '金幣收益 +15%', price: 800 },
      { id: 'mirror', icon: '🪞', name: '紫月之鏡', desc: '使用預視卷軸時窺視 +0.5 秒', price: 900 },
      { id: 'gear', icon: '⚙️', name: '時之齒輪', desc: '戰鬥時間 +6%', price: 1000 },
      { id: 'ring', icon: '💍', name: '誓約之戒', desc: '連擊得分 +20%', price: 900 },
      { id: 'compass', icon: '🧭', name: '參謀羅盤', desc: '失誤上限 +1', price: 1100 },
      { id: 'dice', icon: '🎲', name: '幸運骰', desc: '鬼牌懲罰減半', price: 700 }
    ],
    gifts: [
      { id: 'flowers', icon: '💐', name: '白薔薇花束', desc: '清雅的花束', price: 80 },
      { id: 'tea', icon: '🫖', name: '皇家紅茶', desc: '香氣醇厚的茶葉禮盒', price: 90 },
      { id: 'book', icon: '📕', name: '古典詩集', desc: '燙金封面的詩集', price: 100 },
      { id: 'ribbon', icon: '🎀', name: '絲綢緞帶', desc: '可繫於劍柄或髮間', price: 70 },
      { id: 'bbq', icon: '🍖', name: '慶功烤肉券', desc: '兩人份的慶功宴', price: 90 },
      { id: 'chess', icon: '♟️', name: '象牙棋組', desc: '精雕細琢的棋盤', price: 140 },
      { id: 'moonlamp', icon: '🏮', name: '月光提燈', desc: '散發柔光的提燈', price: 120 },
      { id: 'musicbox', icon: '🎼', name: '八音盒', desc: '演奏帝國古謠', price: 150 }
    ],
    outfits: [
      { id: 'outfit_summer', icon: '👗', name: '夏日洋裝（全員）', desc: '解鎖長裙款夏日洋裝造型', price: 1500 }
    ]
  };
  var GIFT_DAILY_CAP = 3;
  var BOND_PER_LEVEL = 20; // 好感 0–100，每 20 點一顆心

  /* ───────── 經濟 ───────── */
  var CONFIG = {
    VERSION: VERSION,
    SAVE_KEY: 'memoryRPG_v3',
    OLD_KEYS: ['memoryRPG_v2', 'memoryRPG_v1'],
    ENERGY_MAX: 10,
    ENERGY_COST: 1,
    ENDLESS_COST: 2,
    ENERGY_REGEN_MS: 3 * 60 * 1000,
    SKILL_MAX: SKILL_MAX,
    CD_MAX: CD_MAX,
    BOND_MAX: 5,            // 心數上限
    BOND_POINTS_MAX: 100,
    BOND_PER_LEVEL: BOND_PER_LEVEL,
    GIFT_DAILY_CAP: GIFT_DAILY_CAP,
    TAP_DAILY_CAP: 5,
    LEADERBOARD_SIZE: 10,
    DEFAULT_SFX_VOL: 0.45,
    DEFAULT_BGM_VOL: 0.35
  };

  function xpNeed(lv) { return 60 + lv * 35; }
  function bondLevel(points) { return Math.min(CONFIG.BOND_MAX, Math.floor((points || 0) / BOND_PER_LEVEL)); }
  function bondTier(level) {
    level = level || 0;
    if (level >= 4) return 3;
    if (level >= 2) return 2;
    if (level >= 1) return 1;
    return 0;
  }

  /* 舊介面相容 */
  function pairsFor(n) { return stageConfig(n).sets; }
  function timeFor(n) { return stageConfig(n).time; }

  /* ───────── 成就 ───────── */
  function cnt(obj) { return obj ? Object.keys(obj).length : 0; }
  function sumStars(s) { var t = 0; for (var k in (s.stars || {})) t += s.stars[k] || 0; return t; }
  function threeStars(s) { var t = 0; for (var k in (s.stars || {})) if (s.stars[k] >= 3) t++; return t; }
  function anyBondLv(s, lv) { return HEROINES.some(function (h) { return bondLevel(s.bond[h.id]) >= lv; }); }

  var ACHIEVEMENTS = [
    { id: 'first_win', icon: '🏅', name: '初戰告捷', desc: '贏得第一場戰鬥', reward: 50, check: function (s) { return s.stats.wins >= 1; } },
    { id: 'stage5', icon: '🗡️', name: '帝國先鋒', desc: '通過第 5 關', reward: 100, check: function (s) { return s.maxStage > 5; } },
    { id: 'stage10', icon: '🏰', name: '攻城名將', desc: '通過第 10 關', reward: 200, check: function (s) { return s.maxStage > 10; } },
    { id: 'stage20', icon: '🐉', name: '傳奇征服者', desc: '通過第 20 關', reward: 400, check: function (s) { return s.maxStage > 20; } },
    { id: 'stage30', icon: '❄️', name: '北境行者', desc: '通過第 30 關', reward: 600, check: function (s) { return s.maxStage > 30; } },
    { id: 'stage50', icon: '👑', name: '帝冠加冕', desc: '完成全部 50 關戰役', reward: 1500, check: function (s) { return s.maxStage > 50; } },
    { id: 'boss1', icon: '🛡️', name: '首位頭目', desc: '擊敗第一位頭目', reward: 120, check: function (s) { return s.stats.bossWins >= 1; } },
    { id: 'boss6', icon: '⚔️', name: '機制剋星', desc: '擊敗 6 位頭目', reward: 400, check: function (s) { return s.stats.bossWins >= 6; } },
    { id: 'perfect1', icon: '✨', name: '完美無瑕', desc: '零失誤通關', reward: 80, check: function (s) { return s.stats.perfects >= 1; } },
    { id: 'perfect10', icon: '🌟', name: '絕對記憶', desc: '零失誤通關 10 次', reward: 300, check: function (s) { return s.stats.perfects >= 10; } },
    { id: 'star30', icon: '⭐', name: '星光收集者', desc: '累計 30 顆星', reward: 200, check: function (s) { return sumStars(s) >= 30; } },
    { id: 'star100', icon: '🌠', name: '滿天星斗', desc: '累計 100 顆星', reward: 600, check: function (s) { return sumStars(s) >= 100; } },
    { id: 'three10', icon: '💫', name: '三星統帥', desc: '10 個關卡取得三星', reward: 300, check: function (s) { return threeStars(s) >= 10; } },
    { id: 'combo5', icon: '🔥', name: '連擊高手', desc: '達成 5 連擊', reward: 80, check: function (s) { return s.stats.maxCombo >= 5; } },
    { id: 'combo8', icon: '💥', name: '連擊之王', desc: '達成 8 連擊', reward: 200, check: function (s) { return s.stats.maxCombo >= 8; } },
    { id: 'combo12', icon: '☄️', name: '記憶風暴', desc: '達成 12 連擊', reward: 500, check: function (s) { return s.stats.maxCombo >= 12; } },
    { id: 'lv5', icon: '📈', name: '嶄露頭角', desc: '等級達到 5', reward: 100, check: function (s) { return s.lv >= 5; } },
    { id: 'lv10', icon: '🎖️', name: '帝國將星', desc: '等級達到 10', reward: 250, check: function (s) { return s.lv >= 10; } },
    { id: 'lv20', icon: '🏛️', name: '元帥之資', desc: '等級達到 20', reward: 600, check: function (s) { return s.lv >= 20; } },
    { id: 'streak5', icon: '📅', name: '日日精進', desc: '連續登入遊玩 5 天', reward: 150, check: function (s) { return s.stats.bestStreak >= 5; } },
    { id: 'daily1', icon: '🗓️', name: '今日之試', desc: '完成一次每日挑戰', reward: 100, check: function (s) { return s.stats.dailyWins >= 1; } },
    { id: 'daily7', icon: '📆', name: '七日修行', desc: '完成 7 次每日挑戰', reward: 400, check: function (s) { return s.stats.dailyWins >= 7; } },
    { id: 'endless5', icon: '♾️', name: '無盡之路', desc: '無盡模式達到第 5 輪', reward: 200, check: function (s) { return s.stats.endlessBestRound >= 5; } },
    { id: 'endless10', icon: '🌀', name: '永恆記憶', desc: '無盡模式達到第 10 輪', reward: 600, check: function (s) { return s.stats.endlessBestRound >= 10; } },
    { id: 'skill20', icon: '🔮', name: '技能大師', desc: '累計施放技能 20 次', reward: 120, check: function (s) { return s.stats.skillsUsed >= 20; } },
    { id: 'skill100', icon: '🪄', name: '秘術宗師', desc: '累計施放技能 100 次', reward: 400, check: function (s) { return s.stats.skillsUsed >= 100; } },
    { id: 'collector', icon: '👑', name: '女傑集結', desc: '解鎖全部五位女傑', reward: 500, check: function (s) { return HEROINES.every(function (h) { return s.unlocked[h.id]; }); } },
    { id: 'rich', icon: '💰', name: '帝國金庫', desc: '累計獲得 3000 金幣', reward: 300, check: function (s) { return s.stats.goldEarned >= 3000; } },
    { id: 'shopper', icon: '🛒', name: '御用商客', desc: '在商店購買 10 次', reward: 150, check: function (s) { return s.stats.purchases >= 10; } },
    { id: 'relic3', icon: '🏺', name: '遺物收藏家', desc: '擁有 3 件遺物', reward: 300, check: function (s) { return cnt(s.relics) >= 3; } },
    { id: 'gift10', icon: '🎁', name: '心意傳達', desc: '贈送 10 份禮物', reward: 150, check: function (s) { return s.stats.giftsGiven >= 10; } },
    { id: 'bond3', icon: '💝', name: '心之紐帶', desc: '任一女傑好感達到 3 心', reward: 150, check: function (s) { return anyBondLv(s, 3); } },
    { id: 'bond5', icon: '💖', name: '摯友之誓', desc: '任一女傑好感達到 5 心', reward: 400, check: function (s) { return anyBondLv(s, 5); } },
    { id: 'bondall', icon: '🌹', name: '眾望所歸', desc: '全部女傑好感達到 3 心', reward: 800, check: function (s) { return HEROINES.every(function (h) { return bondLevel(s.bond[h.id]) >= 3; }); } }
  ];

  window.GAME_DATA = {
    VERSION: VERSION,
    HEROINES: HEROINES, OUTFITS: OUTFITS, ACHIEVEMENTS: ACHIEVEMENTS, CONFIG: CONFIG,
    CHAPTERS: CHAPTERS, STAGES_PER_CHAPTER: STAGES_PER_CHAPTER, CAMPAIGN_STAGES: CAMPAIGN_STAGES,
    BOSS_MECHS: BOSS_MECHS, GRIDS: GRIDS, SHOP: SHOP,
    RANKS: RANKS, SUITS: SUITS,
    mulberry32: mulberry32, hashStr: hashStr, shuffleInPlace: shuffleInPlace,
    dealPairs: dealPairs, dealDecoy: dealDecoy,
    stageConfig: stageConfig, dailyConfig: dailyConfig, endlessConfig: endlessConfig, starsFor: starsFor,
    bossMech: bossMech,
    skillValue: skillValue, skillDesc: skillDesc, skillCooldown: skillCooldown,
    upgradeCost: upgradeCost, cdUpgradeCost: cdUpgradeCost,
    xpNeed: xpNeed, bondLevel: bondLevel, bondTier: bondTier,
    pairsFor: pairsFor, timeFor: timeFor
  };
})();
