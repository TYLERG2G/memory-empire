/* 記憶帝國：女傑翻牌 — 靜態資料 */
(function () {
  'use strict';

  var HEROINES = [
    { id: 'verda', name: '薇爾妲·諾克特', title: '冷傲魔女軍官', color: '#9b59ff',
      skill: 'peek', skillName: '魔眼窺視', reqLv: 1, cost: 0,
      bio: '統領夜之魔導部隊的女軍官，冷峻的紫瞳能在一瞬間看穿所有偽裝。' },
    { id: 'karena', name: '卡蓮娜·緋焰', title: '熱血機甲騎士', color: '#ff4d3a',
      skill: 'freeze', skillName: '緋焰停滯', reqLv: 3, cost: 200,
      bio: '駕馭紅色機甲的王牌騎士，戰場上的烈焰總讓敵人屏息。' },
    { id: 'elys', name: '艾莉絲·羅亞', title: '優雅外交官', color: '#4fc3f7',
      skill: 'time', skillName: '從容斡旋', reqLv: 5, cost: 400,
      bio: '帝國最出色的談判家，總能在絕境中替同伴爭取到寶貴的時間。' },
    { id: 'selas', name: '塞拉斯·薇恩', title: '冷酷參謀官', color: '#7fd18b',
      skill: 'match', skillName: '戰術推演', reqLv: 8, cost: 700,
      bio: '算無遺策的參謀官，一眼便能推演出棋盤上的最佳解。' },
    { id: 'reina', name: '萊娜·克洛斯', title: '忠誠騎士團長', color: '#ffcf4a',
      skill: 'combo', skillName: '騎士誓約', reqLv: 12, cost: 1200,
      bio: '誓死守護帝國的騎士團長，她的誓約之劍讓每次連擊都更加輝煌。' }
  ];

  var SKILL_MAX = 10;

  // 技能數值隨技能等級成長
  function skillValue(skill, lv) {
    lv = lv || 1;
    switch (skill) {
      case 'peek': return 1.5 + (lv - 1) * 0.25;         // 秒
      case 'freeze': return 5 + (lv - 1) * 1;            // 秒
      case 'time': return 8 + (lv - 1) * 2;              // 秒
      case 'match': return 1 + Math.floor((lv - 1) / 4); // 組數
      case 'combo': return Math.round((2 + (lv - 1) * 0.2) * 10) / 10; // 倍率
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

  var SYMBOLS = ['⚔️', '🛡️', '👑', '💎', '🔮', '🌹', '🗝️', '🦅', '📜', '🍷', '🌙', '🔥'];

  var CONFIG = {
    SAVE_KEY: 'memoryRPG_v1',
    ENERGY_MAX: 10,
    ENERGY_COST: 1,
    ENERGY_REGEN_MS: 3 * 60 * 1000,
    SKILL_MAX: SKILL_MAX
  };

  function pairsFor(n) { return Math.min(3 + Math.floor((n - 1) / 2), 8); }
  function timeFor(n) { var p = pairsFor(n); return Math.max(25, 45 + p * 5 - Math.floor((n - 1) / 3) * 2); }
  function xpNeed(lv) { return 50 + lv * 30; }
  function upgradeCost(lv) { return 100 * lv; }

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
    { id: 'rich', icon: '💰', name: '帝國金庫', desc: '累計獲得 3000 金幣', reward: 300, check: function (s) { return s.stats.goldEarned >= 3000; } }
  ];

  window.GAME_DATA = {
    HEROINES: HEROINES, ACHIEVEMENTS: ACHIEVEMENTS, SYMBOLS: SYMBOLS, CONFIG: CONFIG,
    skillValue: skillValue, skillDesc: skillDesc,
    pairsFor: pairsFor, timeFor: timeFor, xpNeed: xpNeed, upgradeCost: upgradeCost
  };
})();
