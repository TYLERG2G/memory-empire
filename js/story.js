/* ==========================================================================
   記憶帝國：女傑翻牌 — V3 劇情劇場、CONTENT_ZH 選項對話引擎與羈絆繪卷系統
   File: js/story.js
   Exports: window.Story, window.StoryUI
   內容守則：典雅溫馨、戰友羈絆與宮廷敘事，絕無任何暴露或不當內容。
   相容性：ES5 語法（iOS 15+ PWA 安全，不使用 optional chaining）。
   ========================================================================== */
(function () {
  'use strict';

  var CHOICE_NUMS = ['壹', '貳', '參', '肆'];
  var CHAPTER_HERO = { 1: 'verda', 2: 'karena', 3: 'elys', 4: 'selas', 5: 'reina' };

  function $(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function getData() { return window.GAME_DATA || null; }
  function getCZ() { return window.CONTENT_ZH || null; }
  function getAPI(opts) { return (opts && opts.api) || window.GameAPI || null; }

  function heroineInfo(id) {
    var D = getData();
    var list = (D && D.HEROINES) || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return list[0] || { id: id || 'verda', name: '薇爾妲·諾克特', title: '冷傲魔女軍官' };
  }

  function playSfx(api, name) {
    if (api && typeof api.sfx === 'function') { api.sfx(name); return; }
    var ae = window.AudioEngine;
    if (ae && typeof ae.play === 'function') { try { ae.play(name); } catch (e) {} }
  }

  function appRoot() { return $('app') || document.body; }

  /* ════════════════════════════════════════════════════════════════════════
     1. 羈絆繪卷（Bond CG Vignettes）與章節紀念事件（全原創典雅溫馨劇本）
     每位女傑於 1♥ / 3♥ / 5♥ 各解鎖一幅全幅繪卷，通關章節另解鎖紀念繪卷
     ════════════════════════════════════════════════════════════════════════ */
  var BOND_VIGNETTES = {
    verda: [
      {
        id: 'cg_verda_1', heroineId: 'verda', reqHearts: 1,
        kicker: '羈絆繪卷・壹（1♥）', title: '紫晶燈下的古卷微光',
        mood: 'amethyst', outfit: 'default',
        beats: [
          '深夜的魔導檔案室萬籟俱寂，唯有紫晶桌燈映照著翻開的星軌古卷。薇爾妲將披風搭在椅背，修長的指尖正停在一行古老的記憶術銘文上。',
          '察覺你的腳步聲，她並未抬頭，只是將桌上那盞溫熱的黑茶往你手邊推了半寸。',
          '「……坐吧。這頁殘卷的最後一道牌陣，我想聽聽你的解法。」'
        ]
      },
      {
        id: 'cg_verda_2', heroineId: 'verda', reqHearts: 3,
        kicker: '羈絆繪卷・貳（3♥）', title: '緋月露台的無聲守望',
        mood: 'amethyst', outfit: 'cape',
        beats: [
          '宮廷夜宴的樂聲遠在迴廊另一端。薇爾妲披著深紫絲絨夜宴披風立於露台石欄前，清冷的月華灑落在她銀紫色的長髮間。',
          '夜風微起時，她自然地側過半步，與你並肩俯瞰帝都萬家燈火，眼底的魔導光紋柔和如星。',
          '「喧囂屬於旁人，這片夜色屬於我們。只要你在身側，黑夜便格外安寧。」'
        ]
      },
      {
        id: 'cg_verda_3', heroineId: 'verda', reqHearts: 5,
        kicker: '羈絆繪卷・參（5♥）', title: '魔眼映照的破曉誓言',
        mood: 'dawn', outfit: 'formal',
        beats: [
          '漫長戰役後的黎明，第一縷金紅晨曦穿透黑曜尖塔的雲層。盛裝出席授勳儀式的薇爾妲停在長階之上，回首望向你。',
          '那雙曾令無數敵軍畏懼的魔眼，此刻毫無保留地映出你的身影，唇角揚起一抹清淺而真摯的笑意。',
          '「世間萬象皆有虛妄，唯有與你並肩的記憶，是我永不褪色的真實。」'
        ]
      }
    ],
    karena: [
      {
        id: 'cg_karena_1', heroineId: 'karena', reqHearts: 1,
        kicker: '羈絆繪卷・壹（1♥）', title: '夕照格納庫的冰汽水',
        mood: 'ember', outfit: 'default',
        beats: [
          '傍晚的斜陽從格納庫高窗傾瀉而下，將赤紅機甲的裝甲板染上一層耀眼的金紅。卡蓮娜坐在檢修梯上，爽朗地朝你揮了揮手。',
          '她拋來一罐冒著水珠的冰鎮檸檬汽水，拉環彈開的清脆聲響在寬闊的機庫裡迴盪。',
          '「敬我們今天的完美連擊！乾杯——明天也要一口氣衝破最前線！」'
        ]
      },
      {
        id: 'cg_karena_2', heroineId: 'karena', reqHearts: 3,
        kicker: '羈絆繪卷・貳（3♥）', title: '星祭夜空的流光花火',
        mood: 'lantern', outfit: 'yukata',
        beats: [
          '港都星祭的長街燈火通明，換上端莊靛藍祭典浴衣的卡蓮娜難得放慢了平日風風火火的步伐，手裡捧著兩串剛出爐的蜜糖蘋果。',
          '當第一發金色煙火在夜空綻放時，她轉過頭看著你，翠綠的眼眸裡盛滿了璀璨星火。',
          '「平時總是在戰場上衝鋒……偶爾像這樣並肩看場煙火，感覺能記上一輩子呢！」'
        ]
      },
      {
        id: 'cg_karena_3', heroineId: 'karena', reqHearts: 5,
        kicker: '羈絆繪卷・參（5♥）', title: '蒼穹機翼上的約定',
        mood: 'dawn', outfit: 'formal',
        beats: [
          '雲海之上的破曉時分，赤紅機甲靜靜停駐於山巔瞭望台。身披帝國禮裝的卡蓮娜迎著晨風伸出手，笑容比初升的朝陽更加耀眼。',
          '金色的徽章在她肩頭閃爍，那是無數次生死牌局共同鑄就的王牌榮耀。',
          '「不管未來的天空有多遼闊，我的副座與後背，永遠只留給你一個人！」'
        ]
      }
    ],
    elys: [
      {
        id: 'cg_elys_1', heroineId: 'elys', reqHearts: 1,
        kicker: '羈絆繪卷・壹（1♥）', title: '白山茶溫室的茶香午後',
        mood: 'starlight', outfit: 'default',
        beats: [
          '玻璃花房外細雨初歇，盛放的白山茶花瓣上凝著晶瑩水珠。艾莉絲優雅地提起銀壺，琥珀色的大吉嶺茶湯在白瓷盞中漾開清香。',
          '她將點綴著橙花的茶點推至你面前，柔和的目光彷彿能撫平一切征戰的疲憊。',
          '「在棋盤之外，請容我為您守護這一方無須設防的午後時光。」'
        ]
      },
      {
        id: 'cg_elys_2', heroineId: 'elys', reqHearts: 3,
        kicker: '羈絆繪卷・貳（3♥）', title: '晴空海岸的長裙微風',
        mood: 'dawn', outfit: 'summer',
        beats: [
          '外交休會的假日，艾莉絲換上素雅端莊的象牙白長裙洋裝，與你漫步在港都的臨海石階。海風輕拂過她髮間的金葉髮飾。',
          '她微微按住帽簷回眸淺笑，平日談判桌上的謹慎假面早已卸下，只餘純粹的欣喜。',
          '「原來不帶任何使命的散步，風的聲音竟是如此溫柔動聽。」'
        ]
      },
      {
        id: 'cg_elys_3', heroineId: 'elys', reqHearts: 5,
        kicker: '羈絆繪卷・參（5♥）', title: '星光圓舞的首席舞卡',
        mood: 'starlight', outfit: 'formal',
        beats: [
          '慶功夜宴的水晶穹頂之下，悠揚的圓舞曲緩緩流淌。身著帝國禮服的艾莉絲穿過眾人讚嘆的目光，將燙金舞卡輕輕放入你的掌心。',
          '舞卡之上沒有多餘的辭令，只端正地寫著唯一的名字——那是她跨越無數斡旋後最篤定的選擇。',
          '「今夜與此後的每一支樂章，艾莉絲皆願與您共步同行。」'
        ]
      }
    ],
    selas: [
      {
        id: 'cg_selas_1', heroineId: 'selas', reqHearts: 1,
        kicker: '羈絆繪卷・壹（1♥）', title: '星軌沙盤的靜夜覆盤',
        mood: 'frost', outfit: 'default',
        beats: [
          '參謀本部的光學星圖在穹頂緩緩運轉，映亮塞拉斯冷靜專注的側顏。黑曜石棋子在她指間輕巧落定，發出清脆的微響。',
          '她推了推金絲眼鏡，將寫滿最優路徑的推演筆記轉向你，語氣裡藏著一絲難得的認可。',
          '「你的直覺補足了算式的最後一環……這局覆盤，我記為雙人最優解。」'
        ]
      },
      {
        id: 'cg_selas_2', heroineId: 'selas', reqHearts: 3,
        kicker: '羈絆繪卷・貳（3♥）', title: '霜夜行軍的暖洋甘菊',
        mood: 'frost', outfit: 'cape',
        beats: [
          '北境要塞的雪夜寒風呼嘯，披著厚實夜宴披風的塞拉斯站在觀測窗前，雙手捧著你剛遞過去的溫熱洋甘菊茶。',
          '裊裊熱氣模糊了她的鏡片，她摘下眼鏡輕輕呼氣，平日冷峻的眉眼在燭火下顯得格外柔和。',
          '「非理性的關懷卻能令專注度回升22%……看來我的模型需要為你重寫了。」'
        ]
      },
      {
        id: 'cg_selas_3', heroineId: 'selas', reqHearts: 5,
        kicker: '羈絆繪卷・參（5♥）', title: '千億算式中的唯一奇蹟',
        mood: 'dawn', outfit: 'formal',
        beats: [
          '破曉的光輝灑滿寂靜的演算大廳，所有戰術終端皆已顯示「全勝收束」。換上筆挺帝國禮裝的塞拉斯合上懷錶，走向並肩而立的你。',
          '沒有繁複的數據報告，她只是安靜地伸出手，與你十指輕觸，目光澄澈而堅定。',
          '「在無數種未來推演裡，唯有與你同行，是我不願更改的必然常數。」'
        ]
      }
    ],
    reina: [
      {
        id: 'cg_reina_1', heroineId: 'reina', reqHearts: 1,
        kicker: '羈絆繪卷・壹（1♥）', title: '晨霧校場的誓劍清音',
        mood: 'dawn', outfit: 'default',
        beats: [
          '破曉前的薄霧籠罩著皇家校場，萊娜一絲不苟地以白布拭去長劍上的朝露。金獅披風隨著她俐落收劍入鞘的動作颯然揚起。',
          '見你走近，這位威嚴的騎士團長立刻挺直脊背撫胸行禮，琥珀色的雙眸清亮如星。',
          '「晨練完畢！只要指揮官一聲令下，金獅之刃隨時為您開闢勝局！」'
        ]
      },
      {
        id: 'cg_reina_2', heroineId: 'reina', reqHearts: 3,
        kicker: '羈絆繪卷・貳（3♥）', title: '鐘樓暮色與八音古謠',
        mood: 'ember', outfit: 'cape',
        beats: [
          '夕陽染紅王都鐘樓的石階，卸下重鎧、披上典雅披風的萊娜坐在長椅旁，小心翼翼地旋開一只精緻的八音盒。',
          '悠揚的帝國古謠在晚風中流淌，剛毅的女騎士神情恬靜，輕聲跟著旋律哼唱。',
          '「守護帝國不是為了勳章，而是為了讓這樣安穩的黃昏，能一直延續下去。」'
        ]
      },
      {
        id: 'cg_reina_3', heroineId: 'reina', reqHearts: 5,
        kicker: '羈絆繪卷・參（5♥）', title: '聖堂彩窗下的終身騎士禮',
        mood: 'dawn', outfit: 'formal',
        beats: [
          '大聖堂的彩繪玻璃將日光化作萬道金紗。身著純白金紋帝國禮裝的萊娜雙手捧起佩劍，在神聖長階前向你鄭重單膝致禮。',
          '劍柄上的絲綢緞帶在光影中輕揚，她抬起頭，威嚴的面容綻放出最真摯動人的微笑。',
          '「吾劍、吾心與畢生榮耀，自今日起與您同在——直至記憶的盡頭。」'
        ]
      }
    ]
  };

  /* 章節通關紀念繪卷（Date / Milestone Events） */
  var CHAPTER_DATES = {
    1: {
      id: 'date_ch1', chapter: 1, kicker: '第一章紀念繪卷', title: '緋月城門的凱旋夜巡',
      mood: 'amethyst', outfit: 'default',
      beats: [
        '帝都外環的烽火終於平息，哨塔重新點亮了溫暖的燈火。出戰的女傑與你並肩走在靜謐的城牆步道上，夜風帶來遠方花樹的清香。',
        '「第一枚失落的徽記已經找回——這趟漫長的征途，幸好有你執掌棋局。」'
      ]
    },
    2: {
      id: 'date_ch2', chapter: 2, kicker: '第二章紀念繪卷', title: '鏡廳露台的星夜茶敘',
      mood: 'starlight', outfit: 'cape',
      beats: [
        '舊王宮鏡廳的虛像迷霧盡數散去，唯有清澈的星光映在潔淨如洗的落地長鏡中。你們在宮廷露台小憩，分享一壺溫熱的香料紅茶。',
        '「鏡子只能映出過去，而我們正在一起寫下全新的記憶。」'
      ]
    },
    3: {
      id: 'date_ch3', chapter: 3, kicker: '第三章紀念繪卷・星祭特典', title: '星祭長街的燈籠之約',
      mood: 'lantern', outfit: 'yukata',
      beats: [
        '港都星祭迎來最高潮，千盞祈願天燈緩緩升入靛藍夜空。商會特別獻上了端莊雅緻的「祭典浴衣」，在燈火映照下更顯溫婉颯爽。',
        '「願今夜的星火照亮前路——明年的星祭，我們也要像這樣一起來逛夜市！」'
      ]
    },
    4: {
      id: 'date_ch4', chapter: 4, kicker: '第四章紀念繪卷', title: '霜原要塞的爐火暖宵',
      mood: 'frost', outfit: 'cape',
      beats: [
        '北境的暴風雪被擋在堅實的要塞石牆之外，壁爐裡的松木柴火劈啪作響。女傑替你披上一件厚實的斗篷，兩人圍爐覆盤今日的精妙牌局。',
        '「再凜冽的寒冬也凍不住清晰的記憶。下一站，就是王座之間了。」'
      ]
    },
    5: {
      id: 'date_ch5', chapter: 5, kicker: '終章加冕紀念繪卷', title: '破曉帝冠與永恆誓約',
      mood: 'dawn', outfit: 'formal',
      beats: [
        '失落的帝國記憶全數歸位，王座之間的穹頂灑落萬丈晨光。五位女傑身著最莊重的帝國禮服列隊於長階兩側，為你的加冕獻上崇高敬禮。',
        '「以記憶為劍，以羈絆為冠——屬於我們的和平歲月，自今日正式啟程！」'
      ]
    }
  };

  /* ════════════════════════════════════════════════════════════════════════
     2. 對話場景讀取與解鎖邏輯（優先讀取 window.CONTENT_ZH.dialogues）
     ════════════════════════════════════════════════════════════════════════ */
  var FALLBACK_DIALOGUES = {
    verda: [{
      id: 'verda_fb_1', title: '紫月下的覆盤', reqBond: 0, speaker: '薇爾妲·諾克特',
      intro: '夜色深沉，薇爾妲在沙盤旁合上古卷，紫眸靜靜望向你。',
      line: '「今日的翻牌節奏尚可。下一步戰術，你打算如何部署？」',
      choices: [
        { text: '「穩紮穩打，與妳的魔眼窺視配合推進。」', response: '「明智的判斷。有我在，沒有看漏的牌面。」', bondDelta: 3, note: '她讚許地微微頷首。' },
        { text: '「先請長官喝杯熱黑茶休息片刻。」', response: '「……算你有心。正好我也想歇口氣。」', bondDelta: 2, note: '冷峻的神情柔和了幾分。' }
      ]
    }]
  };

  function getDialogues(heroineId) {
    var cz = getCZ();
    var list = cz && cz.dialogues && cz.dialogues[heroineId];
    if (Array.isArray(list) && list.length) return list;
    return FALLBACK_DIALOGUES[heroineId] || FALLBACK_DIALOGUES.verda;
  }

  /**
   * 計算場景解鎖所需心數：
   * 首幕（index 0）一律 0♥ 可直接體驗選項對話；後續依 reqBond 平滑解鎖（1♥ / 2♥ / 3♥）
   */
  function getSceneReqHearts(scene, index, list) {
    if (!scene) return 0;
    if (index === 0) return 0;
    var firstReq = (list && list[0] && typeof list[0].reqBond === 'number') ? list[0].reqBond : 1;
    var raw = typeof scene.reqBond === 'number' ? scene.reqBond : index + 1;
    return Math.max(1, firstReq >= 1 ? raw - 1 : raw);
  }

  function getNextScene(heroineId, bondHearts, seenMap) {
    var list = getDialogues(heroineId);
    seenMap = seenMap || {};
    for (var i = 0; i < list.length; i++) {
      var sc = list[i];
      var req = getSceneReqHearts(sc, i, list);
      if (sc && !seenMap[sc.id] && bondHearts >= req) return sc;
    }
    return null;
  }

  /* ════════════════════════════════════════════════════════════════════════
     3. 視覺小說選項對話舞台 (#story-dialogue-overlay)
     ════════════════════════════════════════════════════════════════════════ */
  function ensureOverlay(id, extraClass) {
    var el = $(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'heroine-overlay hidden' + (extraClass ? ' ' + extraClass : '');
      appRoot().appendChild(el);
    }
    return el;
  }

  function playDialogue(heroineId, scene, opts) {
    opts = opts || {};
    var api = getAPI(opts);
    var h = heroineInfo(heroineId);
    var sc = scene;
    if (!sc) return false;

    var st = api && api.getState ? api.getState() : null;
    var outfit = (st && st.outfit && st.outfit[h.id]) || 'default';
    var alreadySeen = api && api.sceneSeen ? api.sceneSeen(sc.id) : !!(st && st.scenesSeen && st.scenesSeen[sc.id]);
    var overlay = ensureOverlay('story-dialogue-overlay');
    overlay.setAttribute('data-hero', h.id);

    var choices = Array.isArray(sc.choices) && sc.choices.length ? sc.choices : [
      { text: '「我明白了，今後也請多多指教。」', response: '「嗯，我們繼續並肩前行吧。」', bondDelta: 2, note: '' }
    ];

    var choicesHtml = choices.map(function (c, idx) {
      return '<button type="button" class="vn-choice-btn" data-ch="' + idx + '">' +
        '<span class="vn-choice-num">' + (CHOICE_NUMS[idx] || (idx + 1)) + '</span>' +
        '<span>' + esc(c.text) + '</span></button>';
    }).join('');

    overlay.innerHTML =
      '<div class="ho-card" role="dialog" aria-modal="true">' +
        '<button type="button" class="ho-close" id="vn-close-btn" aria-label="關閉">✕</button>' +
        '<div class="vn-header">' +
          '<img class="vn-avatar outfit-' + esc(outfit) + '" src="assets/heroines/' + esc(h.id) + '-sm.webp" alt="">' +
          '<div>' +
            '<div class="vn-kicker">✦ 羈絆對話' + (alreadySeen ? '（回憶重溫）' : '') + '</div>' +
            '<div class="vn-title">' + esc(sc.title || h.name) + '</div>' +
          '</div>' +
        '</div>' +
        (sc.intro ? '<div class="vn-intro">' + esc(sc.intro) + '</div>' : '') +
        '<div class="vn-speech">' +
          '<span class="vn-speaker">' + esc(sc.speaker || h.name) + '</span>' +
          esc(sc.line || '') +
        '</div>' +
        '<div class="vn-choices">' + choicesHtml + '</div>' +
      '</div>';

    overlay.classList.remove('hidden');
    playSfx(api, 'chime');

    var closeOverlay = function (result) {
      overlay.classList.add('hidden');
      if (typeof opts.onComplete === 'function') opts.onComplete(result || null);
    };

    var closeBtn = $('vn-close-btn');
    if (closeBtn) closeBtn.onclick = function () { playSfx(api, 'tap'); closeOverlay(null); };
    overlay.onclick = function (e) { if (e.target === overlay) { playSfx(api, 'tap'); closeOverlay(null); } };

    qsa('[data-ch]', overlay).forEach(function (btn) {
      btn.onclick = function () {
        var idx = parseInt(btn.getAttribute('data-ch'), 10);
        var chosen = choices[idx] || choices[0];
        var gain = 0;
        if (!alreadySeen) {
          if (api && typeof api.markScene === 'function') api.markScene(sc.id);
          else if (st && st.scenesSeen) { st.scenesSeen[sc.id] = true; if (api && api.save) api.save(); }
          var pts = Math.max(4, (chosen.bondDelta || 1) * 5);
          if (api && typeof api.addBond === 'function') gain = api.addBond(h.id, pts);
        }
        playSfx(api, gain > 0 ? 'gift' : 'chime');
        if (api && typeof api.vibe === 'function') api.vibe(14);

        var bubble = $('hg-bubble');
        if (bubble && chosen.response) bubble.textContent = chosen.response;

        var card = qs('.ho-card', overlay);
        if (card) {
          card.innerHTML =
            '<div class="vn-header">' +
              '<img class="vn-avatar outfit-' + esc(outfit) + '" src="assets/heroines/' + esc(h.id) + '-sm.webp" alt="">' +
              '<div>' +
                '<div class="vn-kicker">✦ 心意迴響</div>' +
                '<div class="vn-title">' + esc(sc.title || h.name) + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="vn-speech">' +
              '<span class="vn-speaker">' + esc(sc.speaker || h.name) + '</span>' +
              esc(chosen.response || '') +
            '</div>' +
            (chosen.note ? '<div class="vn-intro">' + esc(chosen.note) + '</div>' : '') +
            '<div class="vn-reward-pill">' +
              (gain > 0 ? '💗 羈絆好感 +' + gain : (alreadySeen ? '📖 已重溫這段珍貴回憶' : '✦ 羈絆已達滿值')) +
            '</div>' +
            '<button type="button" class="btn btn-gold" id="vn-done-btn" style="width:100%">✦ 繼續</button>';
          var doneBtn = $('vn-done-btn');
          if (doneBtn) {
            doneBtn.onclick = function () {
              playSfx(api, 'tap');
              closeOverlay({ scene: sc, choice: chosen, gain: gain, replay: alreadySeen });
            };
          }
        }
      };
    });

    return true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     4. 章節序章與終章劇場 (showChapterIntro / showChapterEpilogue)
     ════════════════════════════════════════════════════════════════════════ */
  function findChapterContent(chId) {
    var cz = getCZ();
    var arr = cz && cz.chapters;
    if (Array.isArray(arr)) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] && (arr[i].chapter === chId || arr[i].id === 'chapter_' + chId)) return arr[i];
      }
    }
    return null;
  }

  function showChapterIntro(chId, done, opts) {
    opts = opts || {};
    var api = getAPI(opts);
    var D = getData();
    var ch = (opts && opts.chapter) || (D && D.CHAPTERS && D.CHAPTERS[chId - 1]);
    if (!ch) { if (typeof done === 'function') done(); return false; }

    var p = findChapterContent(chId);
    var heroId = CHAPTER_HERO[chId] || 'verda';
    var title = (p && p.title) || ('第' + chId + '章：' + ch.name);
    var subtitle = (p && p.subtitle) || (ch.sub || '帝國征途');
    var paragraphs = (p && Array.isArray(p.prose) && p.prose.length) ? p.prose : [ (p && p.prose) || ch.intro || '' ];
    var quote = (p && p.quote) || '';

    var overlay = ensureOverlay('story-overlay');
    overlay.setAttribute('data-hero', heroId);
    overlay.innerHTML =
      '<div class="ho-card" role="dialog" aria-modal="true">' +
        '<div class="st-banner">' +
          '<img src="assets/heroines/' + esc(heroId) + '.webp" alt="">' +
          '<div class="st-banner-veil">' +
            '<div class="st-kicker">' + esc(subtitle) + '</div>' +
            '<div class="st-title">' + esc(title) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="st-prose">' +
          paragraphs.map(function (para) { return '<p>' + esc(para) + '</p>'; }).join('') +
        '</div>' +
        (quote ? '<div class="st-quote">' + esc(quote) + '</div>' : '') +
        '<button type="button" class="btn btn-gold" id="story-intro-ok" style="width:100%">踏入征途</button>' +
      '</div>';

    overlay.classList.remove('hidden');
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      overlay.classList.add('hidden');
      if (typeof done === 'function') done();
    };
    var okBtn = $('story-intro-ok');
    if (okBtn) okBtn.onclick = function () { playSfx(api, 'tap'); finish(); };
    overlay.onclick = function (e) { if (e.target === overlay) { playSfx(api, 'tap'); finish(); } };
    return true;
  }

  function showChapterEpilogue(chId, done, opts) {
    opts = opts || {};
    var api = getAPI(opts);
    var D = getData();
    var ch = (opts && opts.chapter) || (D && D.CHAPTERS && D.CHAPTERS[chId - 1]);
    var p = findChapterContent(chId);
    var heroId = CHAPTER_HERO[chId] || 'verda';
    var epilogueText = (p && p.epilogue) || ('第' + chId + '章・' + (ch ? ch.name : '') + ' 戰役圓滿告捷。');
    var unlockNote = chId === 3 ? '👘 紀念解鎖：全員「祭典浴衣」造型已收錄至鑑賞室！' : '💌 章節紀念繪卷已收錄至女傑鑑賞室！';

    var overlay = ensureOverlay('story-overlay');
    overlay.setAttribute('data-hero', heroId);
    overlay.innerHTML =
      '<div class="ho-card" role="dialog" aria-modal="true">' +
        '<div class="st-banner">' +
          '<img src="assets/heroines/' + esc(heroId) + '.webp" alt="">' +
          '<div class="st-banner-veil">' +
            '<div class="st-kicker">🏵️ 章節凱旋・第 ' + chId + ' 章</div>' +
            '<div class="st-title">' + esc((ch && ch.name) || '征途凱歌') + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="st-prose"><p>' + esc(epilogueText) + '</p></div>' +
        '<div class="st-quote">' + esc(unlockNote) + '</div>' +
        '<button type="button" class="btn btn-gold" id="story-epi-ok" style="width:100%">✦ 繼續前行</button>' +
      '</div>';

    overlay.classList.remove('hidden');
    var finished = false;
    var finish = function () {
      if (finished) return;
      finished = true;
      overlay.classList.add('hidden');
      if (typeof done === 'function') done();
    };
    var okBtn = $('story-epi-ok');
    if (okBtn) okBtn.onclick = function () { playSfx(api, 'tap'); finish(); };
    overlay.onclick = function (e) { if (e.target === overlay) { playSfx(api, 'tap'); finish(); } };
    return true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     5. 全幅羈絆繪卷檢視器 (#heroine-cg-viewer)
     ════════════════════════════════════════════════════════════════════════ */
  function getVignettes(heroineId, bondHearts, eventsMap) {
    var base = (BOND_VIGNETTES[heroineId] || BOND_VIGNETTES.verda).map(function (v) {
      return {
        id: v.id,
        heroineId: heroineId,
        reqHearts: v.reqHearts,
        unlocked: (bondHearts || 0) >= v.reqHearts,
        lockLabel: v.reqHearts + '♥',
        kicker: v.kicker,
        title: v.title,
        mood: v.mood,
        outfit: v.outfit,
        beats: v.beats
      };
    });
    eventsMap = eventsMap || {};
    // 若此女傑對應之代表章節已通關，附上章節紀念繪卷
    for (var ch = 1; ch <= 5; ch++) {
      if (CHAPTER_HERO[ch] === heroineId && CHAPTER_DATES[ch]) {
        var d = CHAPTER_DATES[ch];
        base.push({
          id: d.id + '_' + heroineId,
          heroineId: heroineId,
          reqChapter: ch,
          unlocked: !!eventsMap['chapter' + ch],
          lockLabel: '第' + ch + '章',
          kicker: d.kicker,
          title: d.title,
          mood: d.mood,
          outfit: d.outfit,
          beats: d.beats,
          isDate: true
        });
      }
    }
    return base;
  }

  function getChapterDateVignette(chapterId, heroineId) {
    var d = CHAPTER_DATES[chapterId];
    if (!d) return null;
    var hid = heroineId || CHAPTER_HERO[chapterId] || 'verda';
    return {
      id: d.id + '_' + hid,
      heroineId: hid,
      unlocked: true,
      kicker: d.kicker,
      title: d.title,
      mood: d.mood,
      outfit: d.outfit,
      beats: d.beats,
      isDate: true
    };
  }

  function openVignette(vignette, opts) {
    if (!vignette) return false;
    opts = opts || {};
    var api = getAPI(opts);
    var h = heroineInfo(vignette.heroineId);
    var st = api && api.getState ? api.getState() : null;
    var currentOutfit = (st && st.outfit && st.outfit[h.id]) || 'default';
    var artOutfit = vignette.outfit || currentOutfit;
    if (api && typeof api.outfitStatus === 'function' && api.outfitStatus(h.id, artOutfit) !== true) {
      artOutfit = currentOutfit;
    }

    var viewer = $('heroine-cg-viewer');
    if (!viewer) {
      viewer = document.createElement('div');
      viewer.id = 'heroine-cg-viewer';
      viewer.className = 'hidden';
      appRoot().appendChild(viewer);
    }

    var beats = Array.isArray(vignette.beats) && vignette.beats.length ? vignette.beats : ['靜謐的時光裡，彼此的羈絆悄然加深。'];
    var beatIdx = 0;

    viewer.setAttribute('data-hero', h.id);
    viewer.setAttribute('data-mood', vignette.mood || 'amethyst');
    viewer.classList.remove('is-clean');

    viewer.innerHTML =
      '<div class="cg-art-stage">' +
        '<img class="cg-art-img outfit-' + esc(artOutfit) + '" src="assets/heroines/' + esc(h.id) + '.webp" alt="' + esc(h.name) + '">' +
        '<div class="cg-mood-veil"></div>' +
      '</div>' +
      '<div class="cg-filigree"></div>' +
      '<div class="cg-top-bar">' +
        '<button type="button" class="cg-pill-btn" id="cg-clean-btn">👁️ 純立繪</button>' +
        '<button type="button" class="cg-pill-btn" id="cg-close-btn">✕ 收起</button>' +
      '</div>' +
      '<div class="cg-caption-box" id="cg-caption-box">' +
        '<div class="cg-chapter-tag">' + esc(vignette.kicker || '羈絆繪卷') + ' · ' + esc(h.name) + '</div>' +
        '<div class="cg-scene-title">' + esc(vignette.title || '') + '</div>' +
        '<div class="cg-beat-text" id="cg-beat-text"></div>' +
        '<div class="cg-foot">' +
          '<div class="cg-dots" id="cg-dots"></div>' +
          '<button type="button" class="btn btn-sm btn-gold" id="cg-next-btn">下一頁 ›</button>' +
        '</div>' +
      '</div>';

    var renderBeat = function () {
      var bt = $('cg-beat-text');
      if (bt) bt.textContent = beats[beatIdx] || '';
      var dots = $('cg-dots');
      if (dots) {
        var dh = '';
        for (var i = 0; i < beats.length; i++) dh += '<span class="cg-dot' + (i === beatIdx ? ' on' : '') + '"></span>';
        dots.innerHTML = dh;
      }
      var nb = $('cg-next-btn');
      if (nb) nb.textContent = beatIdx < beats.length - 1 ? '下一頁 ›' : '✦ 珍藏於心';
    };

    var closeViewer = function () {
      viewer.classList.add('hidden');
      if (typeof opts.onClose === 'function') opts.onClose();
    };

    renderBeat();
    viewer.classList.remove('hidden');
    playSfx(api, 'bond');

    var cleanBtn = $('cg-clean-btn');
    if (cleanBtn) {
      cleanBtn.onclick = function (e) {
        e.stopPropagation();
        playSfx(api, 'tap');
        var clean = viewer.classList.toggle('is-clean');
        cleanBtn.textContent = clean ? '📜 顯示文字' : '👁️ 純立繪';
      };
    }
    var closeBtn = $('cg-close-btn');
    if (closeBtn) closeBtn.onclick = function (e) { e.stopPropagation(); playSfx(api, 'tap'); closeViewer(); };

    var nextBtn = $('cg-next-btn');
    if (nextBtn) {
      nextBtn.onclick = function (e) {
        e.stopPropagation();
        playSfx(api, 'tap');
        if (beatIdx < beats.length - 1) {
          beatIdx += 1;
          renderBeat();
        } else {
          closeViewer();
        }
      };
    }

    viewer.onclick = function () {
      if (viewer.classList.contains('is-clean')) {
        viewer.classList.remove('is-clean');
        if (cleanBtn) cleanBtn.textContent = '👁️ 純立繪';
      }
    };

    return true;
  }

  var StoryModule = {
    showChapterIntro: showChapterIntro,
    chapterIntro: showChapterIntro,
    playChapter: showChapterIntro,
    showChapterEpilogue: showChapterEpilogue,
    chapterEpilogue: showChapterEpilogue,
    getDialogues: getDialogues,
    getSceneReqHearts: getSceneReqHearts,
    getNextScene: getNextScene,
    playDialogue: playDialogue,
    getVignettes: getVignettes,
    getChapterDateVignette: getChapterDateVignette,
    openVignette: openVignette
  };

  window.Story = StoryModule;
  window.StoryUI = StoryModule;
})();
