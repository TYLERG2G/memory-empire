/* 記憶帝國：女傑翻牌 — 靜態資料 */
(function () {
  'use strict';

  var HEROINES = [
    { id: 'verda', name: '薇爾妲·諾克特', title: '冷傲魔女軍官', color: '#9b59ff',
      skill: 'peek', skillName: '魔眼窺視', reqLv: 1, cost: 0,
      bio: '統領夜之魔導部隊的女軍官，冷峻的紫瞳能在一瞬間看穿所有偽裝。',
      lines: {
        0: ['……有事嗎？', '別浪費時間。', '帝國不容懈怠。'],
        1: ['你的記憶力……還算過得去。', '繼續精進吧。', '今晚的訓練結束了嗎？'],
        2: ['能被你選作出戰，並非偶然。', '魔眼會為你照亮牌面。', '……我偶爾也會期待下一場。'],
        3: ['與你並肩的感覺，並不壞。', '記得回來覆命。', '紫月之下，我會守著你。']
      },
      outfits: [
        { id: 'default', name: '軍官常服', reqBond: 0 },
        { id: 'cape', name: '夜宴披風', reqBond: 2 },
        { id: 'formal', name: '帝國禮服', reqBond: 4 }
      ]
    },
    { id: 'karena', name: '卡蓮娜·緋焰', title: '熱血機甲騎士', color: '#ff4d3a',
      skill: 'freeze', skillName: '緋焰停滯', reqLv: 3, cost: 200,
      bio: '駕馭紅色機甲的王牌騎士，戰場上的烈焰總讓敵人屏息。',
      lines: {
        0: ['哈！來比一場嗎？', '別站著發呆！', '機甲已就緒。'],
        1: ['不錯嘛，反應變快了。', '再燃一點！', '這股熱度我喜歡。'],
        2: ['跟你搭檔超有幹勁！', '凍結時間，衝進去！', '贏了請我吃烤肉。'],
        3: ['你是我認可的搭檔。', '緋焰永遠為你開路。', '下次也一起上吧！']
      },
      outfits: [
        { id: 'default', name: '騎士戰裝', reqBond: 0 },
        { id: 'cape', name: '緋紅披風', reqBond: 2 },
        { id: 'formal', name: '閱兵大禮服', reqBond: 4 }
      ]
    },
    { id: 'elys', name: '艾莉絲·羅亞', title: '優雅外交官', color: '#4fc3f7',
      skill: 'time', skillName: '從容斡旋', reqLv: 5, cost: 400,
      bio: '帝國最出色的談判家，總能在絕境中替同伴爭取到寶貴的時間。',
      lines: {
        0: ['下午好。需要協助嗎？', '請保持禮儀。', '時間很寶貴呢。'],
        1: ['你的進步我看在眼裡。', '從容，是勝利的關鍵。', '茶涼了喔。'],
        2: ['與你談話總是愉快。', '我再為你爭取一點時間。', '今晚的舞會……你會來嗎？'],
        3: ['你是我最信任的同伴。', '無論局勢如何，我站在你這邊。', '願星光指引我們。']
      },
      outfits: [
        { id: 'default', name: '外交套裝', reqBond: 0 },
        { id: 'cape', name: '星夜披肩', reqBond: 2 },
        { id: 'formal', name: '宮廷晚禮服', reqBond: 4 }
      ]
    },
    { id: 'selas', name: '塞拉斯·薇恩', title: '冷酷參謀官', color: '#7fd18b',
      skill: 'match', skillName: '戰術推演', reqLv: 8, cost: 700,
      bio: '算無遺策的參謀官，一眼便能推演出棋盤上的最佳解。',
      lines: {
        0: ['報告。', '別打亂我的推演。', '下一步呢？'],
        1: ['數據顯示你在成長。', '這局可以更乾淨。', '失誤率下降了，很好。'],
        2: ['你的判斷……越來越接近最優解。', '自動配對交給我。', '偶爾休息也是戰術的一環。'],
        3: ['我把後背交給你了。', '計算之外的變數，是你。', '……謝謝。']
      },
      outfits: [
        { id: 'default', name: '參謀制服', reqBond: 0 },
        { id: 'cape', name: '戰術外套', reqBond: 2 },
        { id: 'formal', name: '參謀禮裝', reqBond: 4 }
      ]
    },
    { id: 'reina', name: '萊娜·克洛斯', title: '忠誠騎士團長', color: '#ffcf4a',
      skill: 'combo', skillName: '騎士誓約', reqLv: 12, cost: 1200,
      bio: '誓死守護帝國的騎士團長，她的誓約之劍讓每次連擊都更加輝煌。',
      lines: {
        0: ['騎士團長萊娜，報到。', '請下達指令。', '榮耀歸於帝國。'],
        1: ['你的連擊很漂亮。', '誓約之力與你同在。', '守護，是我的職責。'],
        2: ['能為你而戰，是我的榮譽。', '這柄劍，只為值得之人出鞘。', '休息時……也可以聊聊。'],
        3: ['我的誓約，獻給你。', '無論前方為何，我開路。', '與你並肩的每一戰，都銘記於心。']
      },
      outfits: [
        { id: 'default', name: '團長鎧甲', reqBond: 0 },
        { id: 'cape', name: '金獅披風', reqBond: 2 },
        { id: 'formal', name: '授勳禮裝', reqBond: 4 }
      ]
    }
  ];

  var SKILL_MAX = 10;
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var SUITS = [
    { sym: '♠', color: 'black' },
    { sym: '♥', color: 'red' },
    { sym: '♦', color: 'red' },
    { sym: '♣', color: 'black' }
  ];

  function skillValue(skill, lv) {
    lv = lv || 1;
    switch (skill) {
      case 'peek': return Math.round((1.5 + (lv - 1) * 0.25) * 100) / 100;
      case 'freeze': return 5 + (lv - 1) * 1;
      case 'time': return 8 + (lv - 1) * 2;
      case 'match': return 1 + Math.floor((lv - 1) / 4);
      case 'combo': return Math.round((2 + (lv - 1) * 0.2) * 10) / 10;
    }
    return 0;
  }

  function skillDesc(skill, lv) {
    var v = skillValue(skill, lv);
    switch (skill) {
      case 'peek': return '窺視全部卡牌 ' + v + ' 秒';
      case 'freeze': return '凍結計時 ' + v + ' 秒';
      case 'time': return '戰鬥時間 +' + v + ' 秒';
      case 'match': return '自動配對 ' + v + ' 組';
      case 'combo': return '被動：本關連擊得分 x' + v;
    }
    return '';
  }

  function allPokerFaces() {
    var out = [];
    for (var si = 0; si < SUITS.length; si++) {
      for (var ri = 0; ri < RANKS.length; ri++) {
        out.push({
          id: RANKS[ri] + SUITS[si].sym,
          rank: RANKS[ri],
          suit: SUITS[si].sym,
          color: SUITS[si].color
        });
      }
    }
    return out;
  }

  function shuffleInPlace(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /** 取 n 組不重複撲克牌面（每組兩張相同） */
  function dealPairs(n) {
    var faces = shuffleInPlace(allPokerFaces().slice());
    return faces.slice(0, Math.min(n, faces.length));
  }

  var CONFIG = {
    SAVE_KEY: 'memoryRPG_v2',
    ENERGY_MAX: 10,
    ENERGY_COST: 1,
    ENERGY_REGEN_MS: 3 * 60 * 1000,
    SKILL_MAX: SKILL_MAX,
    BOND_MAX: 5
  };

  function pairsFor(n) { return Math.min(3 + Math.floor((n - 1) / 2), 8); }
  function timeFor(n) { var p = pairsFor(n); return Math.max(25, 45 + p * 5 - Math.floor((n - 1) / 3) * 2); }
  function xpNeed(lv) { return 50 + lv * 30; }
  function upgradeCost(lv) { return 100 * lv; }
  function bondTier(bond) {
    bond = bond || 0;
    if (bond >= 4) return 3;
    if (bond >= 2) return 2;
    if (bond >= 1) return 1;
    return 0;
  }

  var ACHIEVEMENTS = [
    { id: 'first_win', icon: '🏅', name: '初戰告捷', desc: '贏得第一場戰鬥', reward: 50, check: function (s) { return s.stats.wins >= 1; } },
    { id: 'stage5', icon: '🗡️', name: '帝國先鋒', desc: '通過第 5 關', reward: 100, check: function (s) { return s.maxStage > 5; } },
    { id: 'stage10', icon: '🏰', name: '攻城名將', desc: '通過第 10 關', reward: 200, check: function (s) { return s.maxStage > 10; } },
    { id: 'stage20', icon: '🐉', name: '傳奇征服者', desc: '通過第 20 關', reward: 500, check: function (s) { return s.maxStage > 20; } },
    { id: 'perfect1', icon: '✨', name: '完美無瑕', desc: '一次失誤都沒有地通關', reward: 80, check: function (s) { return s.stats.perfects >= 1; } },
    { id: 'perfect10', icon: '🌟', name: '絕對記憶', desc: '完美通關 10 次', reward: 300, check: function (s) { return s.stats.perfects >= 10; } },
    { id: 'combo5', icon: '🔥', name: '連擊高手', desc: '達成 5 連擊', reward: 80, check: function (s) { return s.stats.maxCombo >= 5; } },
    { id: 'combo8', icon: '💥', name: '連擊之王', desc: '達成 8 連擊', reward: 200, check: function (s) { return s.stats.maxCombo >= 8; } },
    { id: 'lv5', icon: '📈', name: '嶄露頭角', desc: '等級達到 5', reward: 100, check: function (s) { return s.lv >= 5; } },
    { id: 'lv10', icon: '🎖️', name: '帝國將星', desc: '等級達到 10', reward: 250, check: function (s) { return s.lv >= 10; } },
    { id: 'streak5', icon: '⚡', name: '勢如破竹', desc: '連勝 5 場', reward: 150, check: function (s) { return s.stats.bestStreak >= 5; } },
    { id: 'skill20', icon: '🔮', name: '技能大師', desc: '累計施放技能 20 次', reward: 120, check: function (s) { return s.stats.skillsUsed >= 20; } },
    { id: 'collector', icon: '👑', name: '女傑集結', desc: '解鎖全部五位女傑', reward: 500, check: function (s) { return HEROINES.every(function (h) { return s.unlocked[h.id]; }); } },
    { id: 'rich', icon: '💰', name: '帝國金庫', desc: '累計獲得 3000 金幣', reward: 300, check: function (s) { return s.stats.goldEarned >= 3000; } },
    { id: 'bond3', icon: '💝', name: '心之紐帶', desc: '任一名女傑好感達到 3', reward: 150, check: function (s) {
      return HEROINES.some(function (h) { return (s.bond && s.bond[h.id] || 0) >= 3; });
    } }
  ];

  window.GAME_DATA = {
    HEROINES: HEROINES, ACHIEVEMENTS: ACHIEVEMENTS, CONFIG: CONFIG,
    RANKS: RANKS, SUITS: SUITS,
    skillValue: skillValue, skillDesc: skillDesc, dealPairs: dealPairs,
    pairsFor: pairsFor, timeFor: timeFor, xpNeed: xpNeed, upgradeCost: upgradeCost,
    bondTier: bondTier, shuffleInPlace: shuffleInPlace
  };
})();
