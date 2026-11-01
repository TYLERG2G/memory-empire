/* ==========================================================================
   記憶帝國：女傑翻牌 — V3 女傑互動介面 (window.HeroineUI)
   File: js/heroine.js
   內容守則：全原創成年女傑、典雅端莊禮裝與戰友羈絆互動，絕無任何暴露或不當內容。
   相容性：ES5 語法（iOS 15+ PWA 安全，不使用 optional chaining）。
   ========================================================================== */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pick(arr, avoid) {
    if (!arr || !arr.length) return null;
    if (arr.length === 1) return arr[0];
    var c = arr[Math.floor(Math.random() * arr.length)];
    return (avoid && c === avoid) ? arr[(arr.indexOf(c) + 1) % arr.length] : c;
  }

  var ZONES = ['head', 'shoulder', 'hand'];
  var ZONE_LABELS = { head: '✨ 輕撫髮絲', shoulder: '🤝 拍肩鼓勵', hand: '⚔️ 擊掌致意' };
  var NUMS = ['壹', '貳', '參', '肆', '伍'];
  var SLOT_TAGS = { morning: '晨', afternoon: '午', evening: '晚', night: '夜' };

  /* 五位女傑 1:1 立繪原圖眼部歸一化座標（供眨眼與眼眸微光精準投射） */
  var EYE_COORDS = {
    verda:  [[0.453, 0.167], [0.526, 0.158]],
    karena: [[0.392, 0.306], [0.518, 0.254]],
    elys:   [[0.420, 0.282], [0.528, 0.256]],
    selas:  [[0.395, 0.244], [0.480, 0.224]],
    reina:  [[0.464, 0.204], [0.552, 0.193]]
  };

  /* 溫馨部位觸碰台詞（依女傑性格與低／高羈絆區分，100% 端莊溫馨） */
  var WHOLESOME_TAPS = {
    verda: {
      head: {
        low: ['「……放肆。敢碰魔導軍官的髮絲，全軍上下你還是頭一個。」', '「（微微偏頭理好銀紫長髮）下回再這麼冒失，就罰你多覆盤三局。」'],
        high: ['「……力道還算溫柔。只准在沒有部下看見的時候這樣。」', '「（微闔紫眸並未躲開）真是拿你沒轍……別弄亂髮尾就好。」']
      },
      shoulder: {
        low: ['「不必替我分擔，夜之魔導部隊早已習慣獨當一面。」', '「（輕拂披風肩章）我狀態很好，專注於你的棋局吧。」'],
        high: ['「有你在身側守望，這副軍官披風似乎也沒那麼沉重了。」', '「（輕輕回拍你的手背）放心，我的魔眼隨時為你護航。」']
      },
      hand: {
        low: ['「（俐落地回以標準軍禮）牌局之上，別讓我失望。」', '「（隔著黑手套輕觸致意）戰術同步完畢，隨時可以出擊。」'],
        high: ['「（指尖輕輕回握）魔眼已看清前路——下一戰我們一起拿下。」', '「（唇角微揚與你擊掌）這份默契，確實無可挑剔。」']
      }
    },
    karena: {
      head: {
        low: ['「喂喂！別像摸小孩子一樣揉我的頭髮啦，髮型都要亂了！」', '「唔！突然摸頭是犯規的吧！我可是帝國王牌騎士耶！」'],
        high: ['「嘿嘿……被搭檔拍頭獎勵的感覺，居然還挺不賴的嘛！」', '「（不好意思地抓抓紅髮）再誇我兩句，我還能連贏十場！」']
      },
      shoulder: {
        low: ['「放心交給我！這點戰場壓力連暖機熱身都算不上！」', '「（拍得肩甲噹噹響）緋焰機甲裝甲滿格，隨時衝第一！」'],
        high: ['「（爽朗地反手拍回你的肩）有搭檔這句話，我全身幹勁都燒起來了！」', '「不管前面有什麼頭目機關，我們兩個並肩就絕對不會輸！」']
      },
      hand: {
        low: ['「啪！（清脆響亮地擊掌）好！這股氣勢直接衝破敵陣！」', '「（熱血碰拳）來吧搭檔，讓他們見識我們的連擊速度！」'],
        high: ['「（用力與你擊掌相視大笑）王牌搭檔的默契，全帝國無人能敵！」', '「約好了，打贏下一場再來擊掌慶功，然後去吃烤肉！」']
      }
    },
    elys: {
      head: {
        low: ['「哎呀……髮髻上的金葉髮飾可不能歪了呢，閣下真是愛捉弄人。」', '「（以指尖優雅地撫平髮絲）請保持禮儀喔，雖然我並不討厭就是了。」'],
        high: ['「（微闔雙眸淺笑）您的手心總是這般溫暖，教人捨不得退開呢。」', '「只在您面前，艾莉絲才能卸下外交官的矜持，稍微撒個嬌呢。」']
      },
      shoulder: {
        low: ['「感謝您的體貼。保持從容微笑，正是外交官引以為傲的職責。」', '「（溫婉頷首致謝）有您這份關懷，疲憊都消散大半了。」'],
        high: ['「只要感受到您在身後的支持，無論多艱難的局勢我都能從容斡旋。」', '「（輕輕側首微笑）您也是，請別把所有重擔都一個人扛著喔。」']
      },
      hand: {
        low: ['「（隔著白手套優雅行禮）願今日的勝利與星光亦垂青於我們。」', '「（輕巧地與你擊掌）呵呵，這種率真的致意方式也很新鮮呢。」'],
        high: ['「（輕輕執起你的手致意）與您並肩的每一步，皆如圓舞曲般安心。」', '「無論牌局如何變幻，這雙手都會為您爭取最從容的勝機。」']
      }
    },
    selas: {
      head: {
        low: ['「請勿觸碰頭部。眼鏡視角偏移0.3度會影響沙盤觀測……下不為例。」', '「（冷靜地推正金絲眼鏡）此舉並無戰術意義，請專注於記憶訓練。」'],
        high: ['「……心率上升了8%。這種非理性的安撫動作，意外地能舒緩神經。」', '「（微微低頭沒有閃避）……只給你十秒鐘，別把馬尾弄散了。」']
      },
      shoulder: {
        low: ['「參謀部的抗壓指數仍在安全綠區，無須額外激勵。」', '「我沒事。比起擔心我，先確認下一關的失誤上限吧。」'],
        high: ['「（輕輕推了推眼鏡）……謝謝。有你分擔演算壓力，勝率已趨近極值。」', '「雙人協同的穩定度達到歷史新高……我也會全力掩護你的。」']
      },
      hand: {
        low: ['「（端正地回以握手）戰術目標一致，開始執行最優解。」', '「（精準地與你擊掌）信號確認，隨時可以啟動推演配對。」'],
        high: ['「（與你默契擊掌）計算完畢——我們就是彼此無可替代的最佳拍檔。」', '「把後背交給我吧。算式之外的奇蹟，我們一起完成。」']
      }
    },
    reina: {
      head: {
        low: ['「指、指揮官？！在營中撫摸騎士團長頭頂，有違軍紀威儀……！」', '「（慌忙挺直腰桿）屬、屬下並未立下大功，怎敢受此親暱褒獎！」'],
        high: ['「（耳根微紅地微微低頭）若是您的褒獎……萊娜謹領這份榮耀。」', '「在您面前，我似乎總會忘記團長的威嚴……謝謝您的溫柔。」']
      },
      shoulder: {
        low: ['「肩負帝國安危乃騎士天職！屬下絕不辜負指揮官的期許！」', '「（右手撫胸鏗鏘行禮）這副肩甲，必為守護您而屹立不搖！」'],
        high: ['「您的鼓勵比任何皇室勳章都更珍貴，萊娜必堅守陣線至最後一刻！」', '「（溫暖地微笑頷首）請放心將前鋒交給我，我永遠是您的堅盾。」']
      },
      hand: {
        low: ['「（撫胸行莊嚴騎士禮）金獅長劍，時刻聽候指揮官號令！」', '「（鏗鏘有力地與你擊掌）誓約之光與我們同在，出擊！」'],
        high: ['「（雙手鄭重與你交握致意）以騎士誓約之名，此生與您榮辱與共！」', '「只要與您擊掌立誓，萊娜手中的利刃便所向披靡！」']
      }
    }
  };

  /* 商會贈禮與 CONTENT_ZH.gifts 對應表及專屬謝詞 */
  var GIFT_CZ_MAP = {
    book: 'ancient_grimoire', moonlamp: 'night_crystal_prism', bbq: 'spicy_jerky_box',
    tea: 'royal_earl_grey', flowers: 'camellia_hairpin', chess: 'obsidian_chess'
  };
  var GIFT_FAV_LINES = {
    verda: {
      book: '「燙金封面的古典詩集……連失傳的夜之詩篇都收錄其中？你的眼光比魔眼還精準，我會放在枕畔細讀。」',
      moonlamp: '「這盞月光提燈的柔光恰到好處，深夜批閱軍卷時再適合不過……這份心意，我很喜歡。」'
    },
    karena: {
      bbq: '「哇！！雙人份特級慶功烤肉券！你果然最懂我！走走走，今晚格納庫收工我們立刻去大快朵頤！」',
      ribbon: '「好結實又漂亮的緋紅絲綢緞帶！拿來束起頭髮坐進駕駛艙一定超颯爽，謝謝搭檔！」'
    },
    elys: {
      tea: '「啊……如此醇厚清雅的皇家初採紅茶！今午請務必留步，容艾莉絲親自為您沖泡這壺好茶。」',
      flowers: '「清雅脫俗的白薔薇花束，花瓣上還帶著朝露呢……謝謝您，連心緒都被這抹芬芳點亮了。」'
    },
    selas: {
      chess: '「精雕細琢的象牙棋組，重心誤差趨近於零！今晚來參謀室對弈一局吧，我破例讓你執先手。」',
      book: '「這本古典詩集的韻律結構竟暗合高階記憶宮殿法……極具收藏價值，謝謝你的細心。」'
    },
    reina: {
      ribbon: '「將這條絲綢緞帶繫於誓約之劍的劍柄上，每次拔劍都能感受到您的祝福……萊娜必定珍視一生！」',
      musicbox: '「這首八音盒演奏的帝國古謠，是我幼年立志成為騎士時最愛的旋律……指揮官，謝謝您！」'
    }
  };

  /* 內部狀態 */
  var apiRef = null;
  var activeId = null;
  var inited = false;
  var blinkTimer = 0;
  var cheerTimer = 0;
  var heroPulseTimer = 0;
  var lastTalkLine = '';
  var stages = [];

  function getAPI() { return apiRef || window.GameAPI || null; }
  function getData() { return (apiRef && apiRef.data) || window.GAME_DATA || null; }
  function getStory() { return window.StoryUI || window.Story || null; }
  function getCZ() {
    var a = getAPI();
    return (a && typeof a.content === 'function' ? a.content() : null) || window.CONTENT_ZH || null;
  }
  function getState() {
    var a = getAPI();
    if (a && typeof a.getState === 'function') return a.getState();
    return (a && a.state) || null;
  }
  function heroIds() {
    var D = getData();
    return (D && D.HEROINES) ? D.HEROINES.map(function (h) { return h.id; }) : ['verda', 'karena', 'elys', 'selas', 'reina'];
  }
  function heroineById(id) {
    var a = getAPI();
    if (a && typeof a.heroine === 'function') return a.heroine(id);
    var D = getData(), list = (D && D.HEROINES) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0] || { id: id || 'verda', name: '薇爾妲·諾克特', title: '冷傲魔女軍官', favGifts: [] };
  }
  function selectedHeroId() {
    var st = getState();
    return (st && st.selected) || 'verda';
  }
  function bondHearts(id) {
    var a = getAPI(), D = getData(), st = getState();
    if (a && typeof a.bondLevel === 'function') return a.bondLevel(id);
    if (D && typeof D.bondLevel === 'function' && st && st.bond) return D.bondLevel(st.bond[id] || 0);
    return 0;
  }
  function bondPoints(id) {
    var st = getState();
    return (st && st.bond && typeof st.bond[id] === 'number') ? st.bond[id] : 0;
  }
  function getOutfitId(id) {
    var st = getState();
    return (st && st.outfit && st.outfit[id]) || 'default';
  }
  function getOutfitClass(id) { return 'outfit-' + getOutfitId(id); }
  function getOutfitName(outfitId) {
    var D = getData(), list = (D && D.OUTFITS) || [];
    for (var i = 0; i < list.length; i++) if (list[i].id === outfitId) return list[i].name;
    var seasonal = { spring: '春櫻禮裝', autumn: '秋楓大衣', winter: '冬雪披肩' };
    return seasonal[outfitId] || '常服';
  }

  function playSfx(name, opts) {
    var a = getAPI();
    if (a && typeof a.sfx === 'function') { a.sfx(name, opts); return; }
    var ae = window.AudioEngine;
    if (ae && typeof ae.play === 'function') { try { ae.play(name, opts); } catch (e) {} }
  }
  function doVibe(pat) { var a = getAPI(); if (a && typeof a.vibe === 'function') a.vibe(pat); }
  function showToast(msg) { var a = getAPI(); if (a && typeof a.toast === 'function') a.toast(msg); }
  function floatText(el, text, tone) {
    var a = getAPI();
    if (a && a.fx && typeof a.fx.floatText === 'function') { a.fx.floatText(el, text, tone); return; }
    if (window.FX && typeof window.FX.floatText === 'function') {
      try { window.FX.floatText(el, undefined, text, tone); } catch (e) {}
    }
  }
  function burstBondFx(el) {
    if (window.FX && typeof window.FX.bond === 'function') {
      try { window.FX.bond(el); return; } catch (e) {}
    }
    var a = getAPI();
    if (a && a.fx && typeof a.fx.burst === 'function') a.fx.burst(el, 'match');
  }

  /* ════════════════════════════════════════════════════════════════════════
     1. 時段問候語 (晨 / 午 / 晚 / 夜) — homeGreeting / getGreeting
     ════════════════════════════════════════════════════════════════════════ */
  function getTimeSlot(hourOrDate) {
    var h = typeof hourOrDate === 'number' ? hourOrDate :
      (hourOrDate instanceof Date ? hourOrDate.getHours() : new Date().getHours());
    if (h >= 5 && h < 11) return 'morning';
    if (h >= 11 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    return 'night';
  }

  function getGreeting(heroineId, hourOrDate, avoidLine) {
    var id = heroineId || selectedHeroId();
    var slot = getTimeSlot(hourOrDate);
    var tag = SLOT_TAGS[slot] || '晨';
    var cz = getCZ();
    var pool = cz && cz.greetings && cz.greetings[id] && cz.greetings[id][slot];
    var rawAvoid = avoidLine ? String(avoidLine).replace(/^〔.〕/, '') : '';
    var line = pick(pool, rawAvoid);
    if (!line) {
      var D = getData(), h = heroineById(id);
      var tier = (D && D.bondTier) ? D.bondTier(bondHearts(id)) : 0;
      line = pick(h.lines && h.lines[tier], rawAvoid) || '願今日的記憶牌局旗開得勝。';
    }
    return '〔' + tag + '〕' + line;
  }

  function homeGreeting(heroineId, optsOrHour) {
    var isObj = optsOrHour && typeof optsOrHour === 'object' && !(optsOrHour instanceof Date);
    var hourArg = isObj ? optsOrHour.hour : optsOrHour;
    var forceNew = isObj ? optsOrHour.forceNew !== false : (typeof optsOrHour === 'boolean' ? optsOrHour : false);
    var updateDom = isObj ? optsOrHour.dom !== false : true;

    var selId = selectedHeroId();
    var id = heroineId || selId;
    var g = $('home-greet');
    var curSlot = getTimeSlot(hourArg);
    var text = getGreeting(id, hourArg, g ? g.textContent : '');

    if (updateDom && id === selId) {
      var outfit = getOutfitId(selId);
      var homeStage = $('home-hero-stage'), homeImg = $('home-hero-img');
      if (homeStage) {
        homeStage.setAttribute('data-hero', selId);
        homeStage.setAttribute('data-outfit', outfit);
      }
      if (homeImg) {
        homeImg.className = 'breathe outfit-' + outfit;
        projectEyes(homeStage, homeImg, selId);
      }
      if (g) {
        var changed = forceNew || !g.textContent || g.getAttribute('data-hero') !== selId || g.getAttribute('data-slot') !== curSlot;
        if (changed) {
          g.textContent = text;
          g.setAttribute('data-hero', selId);
          g.setAttribute('data-slot', curSlot);
          g.classList.remove('is-pop');
          void g.offsetWidth;
          g.classList.add('is-pop');
        } else {
          text = g.textContent;
        }
      }
    }
    return text;
  }

  function refreshHome(forceNewGreet) {
    return homeGreeting(null, { forceNew: !!forceNewGreet, dom: true });
  }

  /* ════════════════════════════════════════════════════════════════════════
     2. Live2D 風待機舞台 (呼吸、精準眼部眨眼、三層視差、浮游光塵) — idleStart
     ════════════════════════════════════════════════════════════════════════ */
  function decorateStage(stageEl, imgEl) {
    if (!stageEl || !imgEl || stageEl._heroRigged) return;
    stageEl._heroRigged = true;

    // 確保既有疊層（主城名牌、鑑賞畫框）高於 z-index:1 立繪
    var plate = qs('.hero-plate', stageEl);
    if (plate) { plate.style.zIndex = '3'; plate.style.pointerEvents = 'none'; }
    var orn = qs('.hg-frame-ornament', stageEl);
    if (orn) orn.style.zIndex = '2';

    var aura = document.createElement('div');
    aura.className = 'hero-aura-layer';
    stageEl.insertBefore(aura, imgEl);

    var blink = document.createElement('div');
    blink.className = 'hero-blink-layer';
    blink.innerHTML = '<span class="hero-eye-node"></span><span class="hero-eye-node"></span>';
    stageEl.appendChild(blink);

    var motes = document.createElement('div');
    motes.className = 'hero-motes-layer';
    var specs = [
      ['16%', '18%', '6.2s', '0s', '10px'], ['34%', '12%', '7.4s', '1.3s', '-12px'],
      ['58%', '22%', '5.8s', '2.1s', '14px'], ['76%', '15%', '6.9s', '0.7s', '-9px'],
      ['86%', '28%', '7.8s', '3.0s', '-14px']
    ];
    motes.innerHTML = specs.map(function (m) {
      return '<span class="hero-mote" style="left:' + m[0] + ';bottom:' + m[1] +
        ';--mote-dur:' + m[2] + ';--mote-delay:' + m[3] + ';--mote-drift:' + m[4] + '"></span>';
    }).join('');
    stageEl.appendChild(motes);

    stageEl.addEventListener('pointermove', function (e) {
      if (stageEl.classList.contains('hg-art-wrap')) e.stopImmediatePropagation();
      if (imgEl.classList.contains('zoomed')) return;
      var r = stageEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var nx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
      var ny = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1, 1);
      setParallax(stageEl, nx, ny);
      if (imgEl.style && imgEl.style.translate) imgEl.style.translate = '';
    }, true);

    stageEl.addEventListener('pointerleave', function () {
      setParallax(stageEl, 0, 0);
      if (imgEl.style && imgEl.style.translate) imgEl.style.translate = '';
    });
    stageEl.addEventListener('touchend', function () { setParallax(stageEl, 0, 0); }, { passive: true });
    imgEl.addEventListener('load', function () {
      projectEyes(stageEl, imgEl, stageEl.getAttribute('data-hero') || selectedHeroId());
    });

    stages.push({ stage: stageEl, img: imgEl });
  }

  function setParallax(stageEl, nx, ny) {
    if (!stageEl) return;
    nx = clamp(+nx || 0, -1, 1);
    ny = clamp(+ny || 0, -1, 1);
    stageEl.style.setProperty('--hx', (-nx * 6.5).toFixed(2) + 'px');
    stageEl.style.setProperty('--hy', (-ny * 4.8).toFixed(2) + 'px');
    stageEl.style.setProperty('--hrx', (ny * 2.2).toFixed(2) + 'deg');
    stageEl.style.setProperty('--hry', (-nx * 2.8).toFixed(2) + 'deg');
  }

  function projectEyes(stageEl, imgEl, heroineId) {
    if (!stageEl || !imgEl) return;
    var pair = EYE_COORDS[heroineId] || EYE_COORDS.verda;
    var nodes = qsa('.hero-eye-node', stageEl);
    if (nodes.length < 2) return;
    var cw = stageEl.clientWidth || 300, ch = stageEl.clientHeight || 400;
    var iw = imgEl.naturalWidth || 512, ih = imgEl.naturalHeight || 512;
    var scale = Math.max(cw / iw, ch / ih);
    var dispW = iw * scale, dispH = ih * scale;
    var offX = (cw - dispW) * 0.5;
    for (var i = 0; i < 2; i++) {
      nodes[i].style.left = (offX + pair[i][0] * dispW).toFixed(1) + 'px';
      nodes[i].style.top = (pair[i][1] * dispH).toFixed(1) + 'px';
    }
  }

  function triggerBlink() {
    if (document.hidden) return;
    stages.forEach(function (item) {
      if (!item.stage || !item.stage.offsetParent) return;
      projectEyes(item.stage, item.img, item.stage.getAttribute('data-hero') || selectedHeroId());
      item.stage.classList.add('is-blinking');
      setTimeout(function () {
        item.stage.classList.remove('is-blinking');
        if (Math.random() < 0.24) {
          setTimeout(function () {
            item.stage.classList.add('is-blinking');
            setTimeout(function () { item.stage.classList.remove('is-blinking'); }, 130);
          }, 125);
        }
      }, 145);
    });
  }

  function scheduleBlink() {
    if (blinkTimer) clearTimeout(blinkTimer);
    blinkTimer = setTimeout(function () {
      triggerBlink();
      scheduleBlink();
    }, 2700 + Math.floor(Math.random() * 2900));
  }

  function idleStart(stageOrId, maybeImg) {
    var homeStage = $('home-hero-stage'), homeImg = $('home-hero-img');
    if (homeStage && homeImg) decorateStage(homeStage, homeImg);
    var galWrap = qs('#hero-gallery .hg-art-wrap'), galImg = $('hg-art');
    if (galWrap && galImg) decorateStage(galWrap, galImg);

    if (stageOrId && typeof stageOrId === 'object' && stageOrId.nodeType === 1) {
      var img = maybeImg || qs('img', stageOrId);
      if (img) {
        decorateStage(stageOrId, img);
        projectEyes(stageOrId, img, stageOrId.getAttribute('data-hero') || selectedHeroId());
      }
    } else if (typeof stageOrId === 'string') {
      var targetEl = $(stageOrId) || (stageOrId.charAt(0) === '#' || stageOrId.charAt(0) === '.' ? qs(stageOrId) : null);
      if (targetEl) {
        var tImg = maybeImg || qs('img', targetEl);
        if (tImg) decorateStage(targetEl, tImg);
      } else if (heroIds().indexOf(stageOrId) !== -1) {
        if (homeStage && homeImg) {
          homeStage.setAttribute('data-hero', stageOrId);
          projectEyes(homeStage, homeImg, stageOrId);
        }
      }
    }
    scheduleBlink();
    return true;
  }

  function idleStop() {
    if (blinkTimer) { clearTimeout(blinkTimer); blinkTimer = 0; }
    return true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     3. 鑑賞室 #hero-gallery DOM 裝配與事件綁定
     ════════════════════════════════════════════════════════════════════════ */
  function toggleFav() {
    if (!activeId) return;
    var st = getState(), a = getAPI();
    if (!st) return;
    st.fav = st.fav || {};
    st.fav[activeId] = !st.fav[activeId];
    if (a && a.save) a.save();
    playSfx('tap');
    showToast(st.fav[activeId] ? '★ 已將' + heroineById(activeId).name + '設為最愛' : '已取消最愛標記');
    render(false);
  }

  function enhanceGalleryDOM() {
    idleStart();
    var gal = $('hero-gallery');
    if (!gal || gal._heroEnhanced) return;
    gal._heroEnhanced = true;

    var artWrap = qs('.hg-art-wrap', gal), artImg = $('hg-art');
    if (artWrap && artImg) {
      var zoomBtn = document.createElement('button');
      zoomBtn.type = 'button';
      zoomBtn.id = 'hg-zoom-btn';
      zoomBtn.className = 'hg-zoom-btn';
      zoomBtn.setAttribute('aria-label', '放大鑑賞');
      zoomBtn.textContent = '🔍';
      zoomBtn.onclick = function (e) {
        e.stopPropagation();
        playSfx('tap');
        var z = artImg.classList.toggle('zoomed');
        var zones = $('hg-zones');
        if (zones) zones.classList.toggle('is-disabled', z);
        zoomBtn.textContent = z ? '↩' : '🔍';
      };
      artWrap.appendChild(zoomBtn);

      var outfitBadge = document.createElement('div');
      outfitBadge.id = 'hg-outfit-badge';
      outfitBadge.className = 'hg-outfit-badge';
      outfitBadge.textContent = '✦ 常服';
      artWrap.appendChild(outfitBadge);
    }

    var titleEl = $('hg-title');
    if (titleEl && titleEl.parentNode && !qs('.hg-head-bar', gal)) {
      var bar = document.createElement('div');
      bar.className = 'hg-head-bar';
      titleEl.parentNode.insertBefore(bar, titleEl);
      bar.appendChild(titleEl);
      titleEl.style.cursor = 'pointer';
      titleEl.addEventListener('click', function (e) {
        if (!activeId) return;
        e.stopImmediatePropagation();
        toggleFav();
      }, true);

      var favBtn = document.createElement('button');
      favBtn.type = 'button';
      favBtn.id = 'hg-fav-btn';
      favBtn.className = 'hg-fav-btn';
      favBtn.textContent = '☆ 最愛';
      favBtn.onclick = function (e) { e.stopPropagation(); toggleFav(); };
      bar.appendChild(favBtn);
    }

    var bondRow = qs('.hg-bond-row', gal);
    if (bondRow && !$('hg-bond-fill')) {
      var meter = document.createElement('div');
      meter.className = 'hg-bond-meter';
      meter.innerHTML = '<div id="hg-bond-fill" class="hg-bond-fill"></div>';
      bondRow.appendChild(meter);
    }

    var outfitLbl = qs('.hg-outfit-label', gal);
    if (outfitLbl && outfitLbl.parentNode && !$('hg-archive-sec')) {
      var sec = document.createElement('div');
      sec.id = 'hg-archive-sec';
      sec.className = 'hg-archive-sec';
      sec.innerHTML =
        '<div class="hg-sec-head"><span>羈絆劇情 ＆ 繪卷</span><small id="hg-archive-count"></small></div>' +
        '<div id="hg-story-strip" class="hg-chip-row"></div>';
      outfitLbl.parentNode.insertBefore(sec, outfitLbl);
    }

    var hintP = qs('.hg-meta > p.muted.small.center', gal);
    if (hintP) { hintP.id = 'hg-tap-hint'; hintP.className = 'hg-tap-hint'; }

    qsa('#hg-zones button', gal).forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        if (!activeId) return;
        e.preventDefault(); e.stopImmediatePropagation();
        tap(btn.getAttribute('data-zone') || 'head', activeId, e);
      }, true);
    });

    var talkBtn = $('hg-talk');
    if (talkBtn) {
      talkBtn.addEventListener('click', function (e) {
        if (!activeId) return;
        e.preventDefault(); e.stopImmediatePropagation();
        dialogue(activeId);
      }, true);
    }

    var giftBtn = $('hg-gift');
    if (giftBtn) {
      giftBtn.addEventListener('click', function (e) {
        if (!activeId) return;
        e.preventDefault(); e.stopImmediatePropagation();
        playSfx('tap');
        openGifts(activeId);
      }, true);
    }

    var selBtn = $('hg-select');
    if (selBtn) {
      selBtn.addEventListener('click', function (e) {
        if (!activeId) return;
        e.preventDefault(); e.stopImmediatePropagation();
        var a = getAPI();
        playSfx('tap');
        if (a && typeof a.selectHeroine === 'function' && a.selectHeroine(activeId)) {
          showToast('⚔️ 出戰女傑：' + heroineById(activeId).name);
          refreshHome(true);
          render(false);
        }
      }, true);
    }

    var closeBtn = $('hg-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        activeId = null;
        closeSubOverlays();
        refreshHome(false);
      });
    }
    gal.addEventListener('click', function (e) {
      if (e.target === gal) { playSfx('tap'); close(); }
    });

    var homeGreet = $('home-greet');
    if (homeGreet && !homeGreet._heroBound) {
      homeGreet._heroBound = true;
      homeGreet.addEventListener('click', function (e) {
        e.stopImmediatePropagation();
        homeGreeting(null, { forceNew: true, dom: true });
        playSfx('chime');
      }, true);
    }
  }

  function closeSubOverlays() {
    ['heroine-gift-overlay', 'story-dialogue-overlay', 'heroine-cg-viewer'].forEach(function (oid) {
      var el = $(oid);
      if (el) el.classList.add('hidden');
    });
  }

  /* ════════════════════════════════════════════════════════════════════════
     4. 開啟／關閉／渲染女傑鑑賞室 — open / close / render
     ════════════════════════════════════════════════════════════════════════ */
  function open(heroineId, maybeApi) {
    if (maybeApi && typeof maybeApi === 'object') apiRef = maybeApi;
    if (!inited) init(apiRef);
    enhanceGalleryDOM();

    var st = getState(), h = heroineById(heroineId);
    if (st && st.unlocked && !st.unlocked[h.id]) {
      showToast('尚未解鎖此女傑');
      return false;
    }
    var gal = $('hero-gallery');
    if (!gal) return false;

    activeId = h.id;
    var artImg = $('hg-art'), zones = $('hg-zones'), zoomBtn = $('hg-zoom-btn');
    if (artImg) artImg.classList.remove('zoomed');
    if (zones) zones.classList.remove('is-disabled');
    if (zoomBtn) zoomBtn.textContent = '🔍';

    gal.setAttribute('data-hero', h.id);
    gal.classList.remove('hidden');

    var a = getAPI();
    if (a && typeof a.duck === 'function') a.duck(true);

    render(true);
    setTimeout(function () { projectEyes(qs('.hg-art-wrap', gal), $('hg-art'), h.id); }, 30);
    return true;
  }

  function close() {
    activeId = null;
    closeSubOverlays();
    var a = getAPI();
    if (a && typeof a.closeGallery === 'function') {
      a.closeGallery();
    } else {
      var gal = $('hero-gallery');
      if (gal) gal.classList.add('hidden');
      if (a && typeof a.duck === 'function') a.duck(false);
    }
    refreshHome(false);
    return true;
  }

  function heartsHTML(lv, maxLv) {
    var html = '';
    for (var i = 1; i <= maxLv; i++) html += '<span class="bond-heart' + (i <= lv ? ' on' : '') + '">♥</span>';
    return html;
  }

  function getScenesList(heroineId) {
    var S = getStory();
    if (S && typeof S.getDialogues === 'function') return S.getDialogues(heroineId);
    var cz = getCZ();
    return (cz && cz.dialogues && cz.dialogues[heroineId]) || [];
  }

  function sceneReqHearts(sc, idx, list) {
    var S = getStory();
    if (S && typeof S.getSceneReqHearts === 'function') return S.getSceneReqHearts(sc, idx, list);
    if (!sc || idx === 0) return 0;
    var firstReq = (list && list[0] && typeof list[0].reqBond === 'number') ? list[0].reqBond : 1;
    var raw = typeof sc.reqBond === 'number' ? sc.reqBond : idx + 1;
    return Math.max(1, firstReq >= 1 ? raw - 1 : raw);
  }

  function findNextUnseenScene(heroineId, lv, seenMap) {
    var S = getStory();
    if (S && typeof S.getNextScene === 'function') return S.getNextScene(heroineId, lv, seenMap);
    var list = getScenesList(heroineId);
    seenMap = seenMap || {};
    for (var i = 0; i < list.length; i++) {
      if (list[i] && !seenMap[list[i].id] && lv >= sceneReqHearts(list[i], i, list)) return list[i];
    }
    return null;
  }

  function render(fresh) {
    var gal = $('hero-gallery');
    if (!activeId || !gal || gal.classList.contains('hidden')) {
      refreshHome(false);
      return;
    }
    var D = getData(), a = getAPI(), st = getState();
    var h = heroineById(activeId);
    var pts = bondPoints(h.id), lv = bondHearts(h.id);
    var maxPts = (D && D.CONFIG && D.CONFIG.BOND_POINTS_MAX) || 100;
    var maxHearts = (D && D.CONFIG && D.CONFIG.BOND_MAX) || 5;
    var outfit = getOutfitId(h.id);

    gal.setAttribute('data-hero', h.id);
    var wrap = qs('.hg-art-wrap', gal);
    if (wrap) { wrap.setAttribute('data-hero', h.id); wrap.setAttribute('data-outfit', outfit); }

    var art = $('hg-art');
    if (art) {
      var wantSrc = 'assets/heroines/' + h.id + '.webp';
      if (art.getAttribute('src') !== wantSrc) art.setAttribute('src', wantSrc);
      var zoomed = art.classList.contains('zoomed');
      art.className = 'hg-art breathe outfit-' + outfit + (zoomed ? ' zoomed' : '');
      projectEyes(wrap, art, h.id);
    }

    var badge = $('hg-outfit-badge');
    if (badge) badge.textContent = '✦ ' + getOutfitName(outfit);

    var isFav = !!(st && st.fav && st.fav[h.id]);
    var titleEl = $('hg-title'); if (titleEl) titleEl.textContent = h.title + (isFav ? ' ★' : '');
    var favBtn = $('hg-fav-btn');
    if (favBtn) { favBtn.classList.toggle('is-fav', isFav); favBtn.textContent = isFav ? '★ 最愛' : '☆ 最愛'; }

    var nameEl = $('hg-name'); if (nameEl) nameEl.textContent = h.name;
    var bioEl = $('hg-bio'); if (bioEl) bioEl.textContent = h.bio || '';
    var heartsEl = $('hg-hearts'); if (heartsEl) heartsEl.innerHTML = heartsHTML(lv, maxHearts);
    var bondNum = $('hg-bond-num'); if (bondNum) bondNum.textContent = pts + ' / ' + maxPts;
    var bondFill = $('hg-bond-fill'); if (bondFill) bondFill.style.width = clamp((pts / maxPts) * 100, 0, 100) + '%';

    var bubble = $('hg-bubble');
    if (fresh && bubble) bubble.textContent = getGreeting(h.id);

    renderArchiveStrip(h, lv, st);
    renderOutfitsStrip(h, outfit, D, a);

    var seenMap = (st && st.scenesSeen) || {};
    var nextSc = findNextUnseenScene(h.id, lv, seenMap);
    var dc = (a && typeof a.dayCounters === 'function') ? a.dayCounters() : { talk: {}, tap: {}, gift: {} };
    var talksToday = (dc.talk && dc.talk[h.id]) || 0;
    var talkBtn = $('hg-talk');
    if (talkBtn) {
      talkBtn.disabled = !nextSc && talksToday >= 3;
      talkBtn.textContent = nextSc ? ('💬 劇情：' + (nextSc.title || '交談')) :
        (talksToday >= 3 ? '💬 今日已暢談' : '💬 交談 (' + (3 - talksToday) + ')');
    }

    var giftBtn = $('hg-gift');
    if (giftBtn) {
      var giftCap = (D && D.CONFIG && D.CONFIG.GIFT_DAILY_CAP) || 3;
      var giftsUsed = (dc.gift && dc.gift[h.id]) || 0;
      giftBtn.textContent = '贈禮 (' + Math.max(0, giftCap - giftsUsed) + '/' + giftCap + ')';
    }

    var selBtn = $('hg-select');
    if (selBtn) {
      var isSel = !!(st && st.selected === h.id);
      selBtn.disabled = isSel;
      selBtn.textContent = isSel ? '✦ 出戰中' : '選為出戰';
    }

    var tapCap = (D && D.CONFIG && D.CONFIG.TAP_DAILY_CAP) || 5;
    var tapsUsed = Math.min(tapCap, (dc.tap && dc.tap[h.id]) || 0);
    var tapHint = $('hg-tap-hint');
    if (tapHint) tapHint.textContent = '輕觸立繪的頭・肩・手可溫馨互動（今日心意 ' + tapsUsed + '/' + tapCap + '）';

    refreshHome(false);
  }

  function renderArchiveStrip(h, lv, st) {
    var strip = $('hg-story-strip');
    if (!strip) return;
    strip.innerHTML = '';
    var S = getStory();
    var seenMap = (st && st.scenesSeen) || {};
    var eventsMap = (st && st.events) || {};
    var dialogues = getScenesList(h.id);
    var vignettes = (S && S.getVignettes) ? S.getVignettes(h.id, lv, eventsMap) : [];
    var unlockedTotal = 0;

    dialogues.forEach(function (sc, idx) {
      var req = sceneReqHearts(sc, idx, dialogues);
      var ok = lv >= req, seen = !!seenMap[sc.id];
      if (ok) unlockedTotal += 1;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'hg-story-chip' + (ok ? (seen ? '' : ' is-new') : ' locked');
      chip.disabled = !ok;
      chip.innerHTML = (ok && !seen ? '<span class="chip-dot"></span>' : '') +
        esc(ok ? ('💬 劇情' + (NUMS[idx] || (idx + 1)) + (seen ? ' ✓' : '')) : ('🔒 劇情' + (NUMS[idx] || (idx + 1)) + ' (' + req + '♥)'));
      chip.title = ok ? (sc.title || '') : ('好感達 ' + req + '♥ 解鎖');
      chip.onclick = function () { if (ok) playScene(h.id, sc); };
      strip.appendChild(chip);
    });

    vignettes.forEach(function (vg, idx) {
      if (vg.unlocked) unlockedTotal += 1;
      var chip = document.createElement('button');
      chip.type = 'button';
      var label = vg.isDate ? '🏮 紀念繪卷' : ('🖼️ 繪卷' + (NUMS[idx] || (idx + 1)));
      chip.className = 'hg-story-chip is-cg' + (vg.unlocked ? '' : ' locked');
      chip.disabled = !vg.unlocked;
      chip.textContent = vg.unlocked ? label : ('🔒 ' + label + ' (' + vg.lockLabel + ')');
      chip.title = vg.unlocked ? vg.title : ('需 ' + vg.lockLabel + ' 解鎖');
      chip.onclick = function () { if (vg.unlocked && S && S.openVignette) S.openVignette(vg, { api: getAPI() }); };
      strip.appendChild(chip);
    });

    var cntEl = $('hg-archive-count');
    if (cntEl) cntEl.textContent = '已解鎖 ' + unlockedTotal + ' / ' + (dialogues.length + vignettes.length);
  }

  function renderOutfitsStrip(h, currentOutfit, D, a) {
    var box = $('hg-outfits');
    if (!box || !D || !D.OUTFITS) return;
    box.innerHTML = '';
    D.OUTFITS.forEach(function (o) {
      var st = (a && typeof a.outfitStatus === 'function') ? a.outfitStatus(h.id, o.id) :
        (bondHearts(h.id) >= (o.reqBond || 0) ? true : ('好感 ' + o.reqBond + '♥'));
      var ok = st === true, active = currentOutfit === o.id;
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'outfit-chip' + (ok ? '' : ' locked') + (active ? ' active' : '');
      chip.textContent = ok ? o.name : ('🔒 ' + o.name + '（' + st + '）');
      if (o.note) chip.title = o.note;
      chip.disabled = !ok;
      chip.onclick = function () { if (ok) setOutfit(h.id, o.id); };
      box.appendChild(chip);
    });
  }

  function setOutfit(heroineId, outfitId) {
    var a = getAPI(), ok = false;
    if (a && typeof a.setOutfit === 'function') ok = a.setOutfit(heroineId, outfitId);
    if (!ok && ['spring', 'autumn', 'winter'].indexOf(outfitId) !== -1) {
      var st = getState();
      if (st && st.outfit) { st.outfit[heroineId] = outfitId; ok = true; }
    }
    if (!ok) return false;
    playSfx('tap');
    showToast('👗 換裝完成：' + getOutfitName(outfitId));
    render(false);
    refreshHome(false);
    return true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     5. 溫馨部位觸碰互動 (head / shoulder / hand) — tap
     ════════════════════════════════════════════════════════════════════════ */
  function pickTapLine(heroineId, zone) {
    var cz = getCZ();
    var czPool = cz && cz.taps && cz.taps[heroineId] && cz.taps[heroineId][zone];
    if (Array.isArray(czPool) && czPool.length) return pick(czPool, lastTalkLine);
    var heroSet = WHOLESOME_TAPS[heroineId] || WHOLESOME_TAPS.verda;
    var zoneSet = heroSet[zone] || heroSet.head;
    var pool = bondHearts(heroineId) >= 3 ? zoneSet.high : zoneSet.low;
    return pick(pool, lastTalkLine) || '「嗯，我們一起加油吧。」';
  }

  function tap(arg1, arg2, ev) {
    var ids = heroIds();
    var zone = 'head', id = activeId || selectedHeroId();

    // 支援 ('head', 'verda') 與 ('verda', 'head') 與 ('verda', 'cheer') 等呼叫順序
    if (arg1 === 'cheer' || arg2 === 'cheer') {
      var chId = ids.indexOf(arg1) !== -1 ? arg1 : (ids.indexOf(arg2) !== -1 ? arg2 : id);
      return onBattleEvent(chId, 'combo');
    }
    if (ZONES.indexOf(arg1) !== -1) {
      zone = arg1;
      if (typeof arg2 === 'string' && arg2) id = arg2;
    } else if (ZONES.indexOf(arg2) !== -1) {
      zone = arg2;
      if (typeof arg1 === 'string' && arg1) id = arg1;
    } else if (typeof arg1 === 'string' && ids.indexOf(arg1) !== -1) {
      id = arg1;
    }

    var a = getAPI(), D = getData();
    var dc = (a && typeof a.dayCounters === 'function') ? a.dayCounters() : { tap: {} };
    dc.tap[id] = (dc.tap[id] || 0) + 1;
    var count = dc.tap[id];
    var cap = (D && D.CONFIG && D.CONFIG.TAP_DAILY_CAP) || 5;

    var line = pickTapLine(id, zone);
    lastTalkLine = line;

    var gal = $('hero-gallery');
    var galOpen = activeId === id && gal && !gal.classList.contains('hidden');
    if (galOpen) {
      var bubble = $('hg-bubble');
      if (bubble) {
        bubble.textContent = line;
        bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      }
      var art = $('hg-art'), wrap = qs('.hg-art-wrap', gal);
      if (art && !art.classList.contains('zoomed')) {
        art.classList.remove('is-react-head', 'is-react-shoulder', 'is-react-hand', 'is-react-joy');
        void art.offsetWidth;
        art.classList.add('is-react-' + zone);
      }
      if (wrap) {
        var badge = document.createElement('div');
        badge.className = 'hg-tap-ripple';
        badge.textContent = ZONE_LABELS[zone] || ZONE_LABELS.head;
        var r = wrap.getBoundingClientRect();
        var xPct = 50, yPct = zone === 'head' ? 22 : zone === 'shoulder' ? 46 : 74;
        if (ev && ev.clientX && r.width) {
          xPct = clamp(((ev.clientX - r.left) / r.width) * 100, 18, 82);
          yPct = clamp(((ev.clientY - r.top) / r.height) * 100, 14, 86);
        }
        badge.style.left = xPct + '%';
        badge.style.top = yPct + '%';
        wrap.appendChild(badge);
        setTimeout(function () { if (badge.parentNode) badge.parentNode.removeChild(badge); }, 900);
      }
    }

    playSfx('chime');
    doVibe(10);

    var gain = 0;
    if (count <= cap && a && typeof a.addBond === 'function') {
      if (count === 1 || Math.random() < 0.65) gain = a.addBond(id, count === 1 ? 2 : 1);
    }
    if (gain > 0 && galOpen && $('hg-art')) floatText($('hg-art'), '♥ +' + gain, 'rose');
    if (a && a.save) a.save();
    if (galOpen) render(false);

    return { ok: true, heroineId: id, zone: zone, line: line, gain: gain, count: count };
  }

  /* ════════════════════════════════════════════════════════════════════════
     6. 分歧劇情對話與日常暢談 — dialogue / talk
     ════════════════════════════════════════════════════════════════════════ */
  function playScene(heroineId, scene, opts) {
    if (!scene) return false;
    opts = opts || {};
    var userComplete = opts.onComplete;
    var S = getStory();
    if (S && typeof S.playDialogue === 'function') {
      return S.playDialogue(heroineId, scene, {
        api: getAPI(),
        onComplete: function (res) {
          render(false);
          if (typeof userComplete === 'function') userComplete(res);
        }
      });
    }
    // StoryUI 缺席時之內建視覺小說對話備援
    var a = getAPI(), st = getState(), h = heroineById(heroineId);
    var already = (a && a.sceneSeen) ? a.sceneSeen(scene.id) : !!(st && st.scenesSeen && st.scenesSeen[scene.id]);
    var overlay = $('story-dialogue-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'story-dialogue-overlay';
      overlay.className = 'heroine-overlay hidden';
      ($('app') || document.body).appendChild(overlay);
    }
    var choices = Array.isArray(scene.choices) && scene.choices.length ? scene.choices :
      [{ text: '「今後也請多多指教。」', response: '「嗯，我們繼續並肩前行。」', bondDelta: 2 }];
    overlay.innerHTML = '<div class="ho-card" role="dialog" aria-modal="true">' +
      '<button type="button" class="ho-close" id="vn-fb-close">✕</button>' +
      '<div class="vn-title">' + esc(scene.title || h.name) + '</div>' +
      (scene.intro ? '<div class="vn-intro">' + esc(scene.intro) + '</div>' : '') +
      '<div class="vn-speech"><span class="vn-speaker">' + esc(scene.speaker || h.name) + '</span>' + esc(scene.line || '') + '</div>' +
      '<div class="vn-choices">' + choices.map(function (c, i) {
        return '<button type="button" class="vn-choice-btn" data-ch="' + i + '"><span class="vn-choice-num">' + (NUMS[i] || (i + 1)) + '</span><span>' + esc(c.text) + '</span></button>';
      }).join('') + '</div></div>';
    overlay.classList.remove('hidden');
    playSfx('chime');
    var done = function (res) {
      overlay.classList.add('hidden');
      render(false);
      if (typeof userComplete === 'function') userComplete(res || null);
    };
    if ($('vn-fb-close')) $('vn-fb-close').onclick = function () { playSfx('tap'); done(null); };
    qsa('[data-ch]', overlay).forEach(function (b) {
      b.onclick = function () {
        var c = choices[parseInt(b.getAttribute('data-ch'), 10)] || choices[0];
        var gain = 0;
        if (!already) {
          if (a && a.markScene) a.markScene(scene.id);
          if (a && a.addBond) gain = a.addBond(h.id, Math.max(4, (c.bondDelta || 1) * 5));
        }
        playSfx(gain > 0 ? 'gift' : 'chime');
        if ($('hg-bubble') && c.response) $('hg-bubble').textContent = c.response;
        done({ scene: scene, choice: c, gain: gain, replay: already });
      };
    });
    return true;
  }

  function dialogue(heroineId, sceneOrId, opts) {
    var id = heroineId || activeId || selectedHeroId();
    var list = getScenesList(id);

    if (sceneOrId !== undefined && sceneOrId !== null) {
      var target = null;
      if (typeof sceneOrId === 'object') target = sceneOrId;
      else if (typeof sceneOrId === 'number') target = list[sceneOrId] || null;
      else if (typeof sceneOrId === 'string') {
        for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === sceneOrId) target = list[i];
      }
      if (target) return playScene(id, target, opts);
    }

    var st = getState(), lv = bondHearts(id);
    var nextSc = findNextUnseenScene(id, lv, (st && st.scenesSeen) || {});
    if (nextSc) return playScene(id, nextSc, opts);

    // 日常暢談（每日最多 3 次好感提升）
    var a = getAPI(), D = getData();
    var dc = (a && typeof a.dayCounters === 'function') ? a.dayCounters() : { talk: {} };
    dc.talk[id] = (dc.talk[id] || 0) + 1;
    var h = heroineById(id);
    var tier = (D && D.bondTier) ? D.bondTier(lv) : 0;
    var pool = ((h.lines && h.lines[tier]) || []).slice();
    var cz = getCZ(), greets = cz && cz.greetings && cz.greetings[id] && cz.greetings[id][getTimeSlot()];
    if (Array.isArray(greets)) pool = pool.concat(greets);

    var line = pick(pool, lastTalkLine) || getGreeting(id);
    lastTalkLine = line;
    var bubble = $('hg-bubble');
    if (bubble && activeId === id) {
      bubble.textContent = line;
      bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    }
    playSfx('chime');
    doVibe(10);

    var gain = 0;
    if (dc.talk[id] <= 3 && a && typeof a.addBond === 'function') {
      gain = a.addBond(id, 3);
      if (gain > 0 && activeId === id && $('hg-art')) floatText($('hg-art'), '♥ +' + gain, 'rose');
    }
    if (a && a.save) a.save();
    render(false);
    return { ok: true, heroineId: id, line: line, gain: gain };
  }

  /* ════════════════════════════════════════════════════════════════════════
     7. 精品贈禮抽屜與喜好雙倍回饋 — gift / openGifts / giveGift
     ════════════════════════════════════════════════════════════════════════ */
  function itemIcoLocal(it, cls) {
    var GD = getData() || window.GAME_DATA || {};
    var fn = GD.itemIconHTML;
    return fn ? fn(it, cls) : (it && it.icon ? ('<i>' + it.icon + '</i>') : '');
  }
  function lookupGiftReaction(heroineId, giftId, isFav) {
    if (isFav && GIFT_FAV_LINES[heroineId] && GIFT_FAV_LINES[heroineId][giftId]) {
      return GIFT_FAV_LINES[heroineId][giftId];
    }
    var cz = getCZ(), czGifts = (cz && cz.gifts) || [];
    var mappedId = GIFT_CZ_MAP[giftId] || giftId;
    for (var i = 0; i < czGifts.length; i++) {
      var cg = czGifts[i];
      if (cg && (cg.id === giftId || cg.id === mappedId)) {
        if ((isFav || cg.favoriteHeroine === heroineId) && cg.favoriteReaction) return cg.favoriteReaction;
        if (cg.commonReaction) return cg.commonReaction;
      }
    }
    return isFav
      ? '「（眼睛頓時亮了起來）這正是我一直心心念念的禮物！謝謝你記得我的喜好！」'
      : '「好雅緻的禮物，這份心意我會好好珍藏的，多謝你。」';
  }

  function openGifts(heroineId) {
    var id = heroineId || activeId || selectedHeroId();
    var D = getData(), a = getAPI(), st = getState();
    var h = heroineById(id);
    var shopGifts = (D && D.SHOP && D.SHOP.gifts) ? D.SHOP.gifts.slice() : [];
    var inv = (a && typeof a.inventory === 'function') ? a.inventory() : ((st && st.inv) || {});
    var dc = (a && typeof a.dayCounters === 'function') ? a.dayCounters() : { gift: {} };
    var used = (dc.gift && dc.gift[id]) || 0;
    var cap = (D && D.CONFIG && D.CONFIG.GIFT_DAILY_CAP) || 3;
    var gold = (st && typeof st.gold === 'number') ? st.gold : 0;

    shopGifts.sort(function (x, y) {
      var ox = (inv[x.id] || 0) > 0 ? 1 : 0, oy = (inv[y.id] || 0) > 0 ? 1 : 0;
      if (ox !== oy) return oy - ox;
      var fx = (h.favGifts || []).indexOf(x.id) !== -1 ? 1 : 0;
      var fy = (h.favGifts || []).indexOf(y.id) !== -1 ? 1 : 0;
      return fy - fx;
    });

    var favNames = (h.favGifts || []).map(function (gid) {
      for (var i = 0; i < shopGifts.length; i++) if (shopGifts[i].id === gid) {
        return '<span class="fav-gift-chip">' + itemIcoLocal(shopGifts[i], 'item-ico-xs') + '<span>' + esc(shopGifts[i].name) + '</span></span>';
      }
      return '';
    }).filter(Boolean).join('');

    var overlay = $('heroine-gift-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'heroine-gift-overlay';
      overlay.className = 'heroine-overlay hidden';
      ($('app') || document.body).appendChild(overlay);
    }
    overlay.setAttribute('data-hero', h.id);

    var cardsHtml = shopGifts.map(function (g) {
      var count = inv[g.id] || 0;
      var isFav = (h.favGifts || []).indexOf(g.id) !== -1;
      var disabled = used >= cap || (count <= 0 && gold < g.price);
      return '<button type="button" class="gift-card' + (count > 0 ? ' is-owned' : '') + (isFav ? ' is-fav' : '') +
        '" data-gift="' + esc(g.id) + '"' + (disabled ? ' disabled' : '') + '>' +
        (isFav ? '<span class="gift-fav-tag">喜愛</span>' : '') +
        itemIcoLocal(g, 'item-ico-md') + '<b>' + esc(g.name) + '</b>' +
        '<span class="gift-meta">' + (count > 0 ? ('持有 ×' + count + '（直接贈送）') : (g.price + '金 購贈')) + '</span></button>';
    }).join('');

    overlay.innerHTML =
      '<div class="ho-card" role="dialog" aria-modal="true">' +
        '<button type="button" class="ho-close" id="hg-gift-close" aria-label="關閉">✕</button>' +
        '<h3 style="color:var(--h-gold-bright);margin-bottom:4px">致贈心意予 ' + esc(h.name) + '</h3>' +
        '<p class="muted small">今日已贈 <b>' + used + '/' + cap + '</b> · 持有金幣 <b style="color:var(--h-gold-bright)">' + gold + ' 金</b>' +
          (favNames ? '<br>鍾愛之物：<span class="fav-gift-row">' + favNames + '</span>' : '') + '</p>' +
        '<div class="gift-grid">' + cardsHtml + '</div>' +
        '<div class="btn-row" style="margin-top:8px">' +
          '<button type="button" class="btn secondary btn-sm" id="hg-goto-shop">前往帝國商會</button>' +
          '<button type="button" class="btn btn-sm" id="hg-gift-cancel">返回鑑賞</button>' +
        '</div>' +
      '</div>';

    overlay.classList.remove('hidden');
    var hide = function () { overlay.classList.add('hidden'); };
    if ($('hg-gift-close')) $('hg-gift-close').onclick = function () { playSfx('tap'); hide(); };
    if ($('hg-gift-cancel')) $('hg-gift-cancel').onclick = function () { playSfx('tap'); hide(); };
    overlay.onclick = function (e) { if (e.target === overlay) { playSfx('tap'); hide(); } };

    if ($('hg-goto-shop')) {
      $('hg-goto-shop').onclick = function () {
        playSfx('tap'); hide(); close();
        var a2 = getAPI();
        if (a2 && typeof a2.go === 'function') a2.go('shop');
        var giftTab = qs('#shop-tabs button[data-tab="gifts"]');
        if (giftTab) giftTab.click();
      };
    }

    qsa('[data-gift]', overlay).forEach(function (btn) {
      btn.onclick = function () {
        var res = giveGift(h.id, btn.getAttribute('data-gift'), true);
        if (res && res.ok) hide();
      };
    });
    return true;
  }

  function giveGift(heroineId, giftId, allowQuickBuy) {
    var id = heroineId || activeId || selectedHeroId();
    var D = getData(), a = getAPI(), st = getState();
    var h = heroineById(id);
    var shopGifts = (D && D.SHOP && D.SHOP.gifts) || [];
    var item = null;
    for (var i = 0; i < shopGifts.length; i++) if (shopGifts[i].id === giftId) item = shopGifts[i];

    var dc = (a && typeof a.dayCounters === 'function') ? a.dayCounters() : { gift: {} };
    var cap = (D && D.CONFIG && D.CONFIG.GIFT_DAILY_CAP) || 3;
    if ((dc.gift[id] || 0) >= cap) {
      showToast('今日贈禮心意已滿（' + cap + '/' + cap + '），明日再來吧');
      return { ok: false, reason: 'cap' };
    }

    var inv = (a && typeof a.inventory === 'function') ? a.inventory() : ((st && st.inv) || {});
    if ((inv[giftId] || 0) <= 0) {
      if (allowQuickBuy && item && a && typeof a.spendGold === 'function') {
        if (!a.spendGold(item.price)) {
          showToast('金幣不足，無法採購此禮品');
          playSfx('mismatch');
          return { ok: false, reason: 'gold' };
        }
        inv[giftId] = (inv[giftId] || 0) + 1;
        if (st && st.stats) st.stats.purchases = (st.stats.purchases || 0) + 1;
      } else {
        showToast('背包中尚未持有此禮物，請先至商會選購');
        return { ok: false, reason: 'none' };
      }
    }

    var res = (a && typeof a.giveGift === 'function') ? a.giveGift(id, giftId) : null;
    if (!res) {
      inv[giftId] -= 1;
      dc.gift[id] = (dc.gift[id] || 0) + 1;
      var fav0 = (h.favGifts || []).indexOf(giftId) !== -1;
      var gain0 = (a && a.addBond) ? a.addBond(id, fav0 ? 16 : 8) : 0;
      playSfx('gift');
      res = { ok: true, gain: gain0, fav: fav0 };
    }
    if (!res.ok) return res;

    var isFav = !!res.fav;
    var reaction = lookupGiftReaction(id, giftId, isFav);
    lastTalkLine = reaction;

    var gal = $('hero-gallery');
    if (activeId === id && gal && !gal.classList.contains('hidden')) {
      var bubble = $('hg-bubble');
      if (bubble) {
        bubble.textContent = (item ? item.icon + ' ' : '') + reaction;
        bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
      }
      var art = $('hg-art');
      if (art) {
        if (!art.classList.contains('zoomed')) {
          art.classList.remove('is-react-joy'); void art.offsetWidth; art.classList.add('is-react-joy');
        }
        floatText(art, (isFav ? '💖 +' : '♥ +') + res.gain, 'rose');
        burstBondFx(art);
      }
    }
    render(false);
    return { ok: true, gain: res.gain, fav: isFav, line: reaction };
  }

  function gift(heroOrGift, maybeGiftId, allowQuickBuy) {
    if (typeof maybeGiftId === 'string' && maybeGiftId) {
      return giveGift(heroOrGift, maybeGiftId, allowQuickBuy !== false);
    }
    if (typeof heroOrGift === 'string' && heroIds().indexOf(heroOrGift) === -1) {
      return giveGift(activeId || selectedHeroId(), heroOrGift, allowQuickBuy !== false);
    }
    return openGifts(heroOrGift || activeId || selectedHeroId());
  }

  /* ════════════════════════════════════════════════════════════════════════
     8. 羈絆繪卷檢視與章節紀念事件 — openCG / dateEvent
     ════════════════════════════════════════════════════════════════════════ */
  function openCG(heroineId, indexOrId) {
    var S = getStory();
    if (!S || !S.getVignettes || !S.openVignette) return false;
    var st = getState(), id = heroineId || activeId || selectedHeroId();
    var list = S.getVignettes(id, bondHearts(id), (st && st.events) || {});
    var target = null;
    if (typeof indexOrId === 'number') target = list[indexOrId] || list[0];
    else if (typeof indexOrId === 'string') {
      for (var i = 0; i < list.length; i++) if (list[i].id === indexOrId) target = list[i];
    } else {
      for (var j = list.length - 1; j >= 0; j--) if (list[j].unlocked) { target = list[j]; break; }
    }
    if (!target || !target.unlocked) {
      showToast('此羈絆繪卷尚未解鎖');
      return false;
    }
    return S.openVignette(target, { api: getAPI() });
  }

  function dateEvent(chapterId, heroineId) {
    var S = getStory();
    if (!S || !S.getChapterDateVignette) return false;
    var vg = S.getChapterDateVignette(chapterId, heroineId || selectedHeroId());
    if (!vg) return false;
    setTimeout(function () {
      var homeScr = $('scr-home'), modal = $('modal'), storyOv = $('story-overlay');
      var onCleanHome = homeScr && homeScr.classList.contains('active') &&
        (!modal || modal.classList.contains('hidden')) &&
        (!storyOv || storyOv.classList.contains('hidden'));
      if (onCleanHome) S.openVignette(vg, { api: getAPI() });
      else showToast('💌 已解鎖「' + vg.title + '」，可於女傑鑑賞室隨時觀賞');
    }, 80);
    return true;
  }

  /* ════════════════════════════════════════════════════════════════════════
     9. 戰鬥助威系統 — onBattleEvent / cheer
     ════════════════════════════════════════════════════════════════════════ */
  function resolveCheerLine(heroineId, kind) {
    var cz = getCZ(), h = heroineById(heroineId);
    var pool = cz && cz.battleCheer && cz.battleCheer[h.id] && cz.battleCheer[h.id][kind];
    var line = pick(pool);
    if (!line && h.cheer && h.cheer[kind]) line = h.cheer[kind];
    if (!line && kind === 'start') {
      line = (h.cheer && h.cheer.start) || pick(cz && cz.battleCheer && cz.battleCheer.general && cz.battleCheer.general.start);
    }
    if (!line) line = pick(cz && cz.battleCheer && cz.battleCheer.general && cz.battleCheer.general[kind]);
    if (!line && kind === 'start') line = '「集中精神，我們開始吧。」';
    return line || '「保持專注，勝利就在眼前！」';
  }

  function cheer(heroineId, kind, preselectedLine) {
    var id = heroineId || selectedHeroId();
    kind = kind || 'combo';
    var line = preselectedLine || resolveCheerLine(id, kind);
    var el = $('b-cheer');
    if (!el) return false;

    el.textContent = line;
    el.className = 'b-cheer tone-' + kind + ' show';

    var avatar = $('b-hero-img');
    if (avatar) {
      avatar.setAttribute('data-hero', id);
      avatar.classList.add('is-cheering');
      if (heroPulseTimer) clearTimeout(heroPulseTimer);
      heroPulseTimer = setTimeout(function () { avatar.classList.remove('is-cheering'); }, 650);
    }

    if (kind !== 'start' && kind !== 'win' && kind !== 'lose') playSfx('chime');
    if (cheerTimer) clearTimeout(cheerTimer);
    cheerTimer = setTimeout(function () { el.classList.remove('show'); }, 2350);
    return true;
  }

  function onBattleEvent(eventOrHero, payload, maybeLine) {
    var ids = heroIds(), hid = selectedHeroId(), kind = 'combo', line = null;
    if (eventOrHero && typeof eventOrHero === 'object') {
      kind = eventOrHero.type || eventOrHero.kind || eventOrHero.event || 'combo';
      hid = eventOrHero.heroineId || eventOrHero.heroine || eventOrHero.id || hid;
      line = eventOrHero.line || null;
    } else if (typeof eventOrHero === 'string' && ids.indexOf(eventOrHero) !== -1 && typeof payload === 'string') {
      hid = eventOrHero; kind = payload; line = maybeLine || null;
    } else if (typeof eventOrHero === 'string') {
      kind = eventOrHero;
      if (typeof payload === 'string' && ids.indexOf(payload) !== -1) hid = payload;
      else if (payload && typeof payload === 'object') {
        hid = payload.heroineId || payload.heroine || payload.id || hid;
        line = payload.line || null;
      }
    }
    var resolved = line || resolveCheerLine(hid, kind);
    cheer(hid, kind, resolved);
    return { ok: true, heroineId: hid, kind: kind, line: resolved };
  }

  /* ════════════════════════════════════════════════════════════════════════
     10. 初始化與全域事件同步
     ════════════════════════════════════════════════════════════════════════ */
  function init(maybeApi) {
    if (maybeApi && typeof maybeApi === 'object') apiRef = maybeApi;
    else if (!apiRef && window.GameAPI) apiRef = window.GameAPI;

    enhanceGalleryDOM();
    refreshHome(false);
    if (inited) return HeroineUI;
    inited = true;

    window.addEventListener('resize', function () {
      stages.forEach(function (item) {
        projectEyes(item.stage, item.img, item.stage.getAttribute('data-hero') || selectedHeroId());
      });
    });

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', function (e) {
        if (e.gamma === null || e.beta === null || document.hidden) return;
        var nx = clamp(e.gamma / 28, -0.75, 0.75), ny = clamp((e.beta - 42) / 28, -0.75, 0.75);
        stages.forEach(function (item) {
          if (item.stage && item.stage.offsetParent && !item.img.classList.contains('zoomed')) setParallax(item.stage, nx, ny);
        });
      }, { passive: true });
    }

    document.addEventListener('game:ready', function (e) {
      if (e && e.detail && e.detail.api) apiRef = e.detail.api;
      enhanceGalleryDOM();
      refreshHome(true);
    });

    document.addEventListener('game:screen', function (e) {
      var gal = $('hero-gallery');
      if (gal && gal.classList.contains('hidden') && activeId) {
        activeId = null;
        closeSubOverlays();
      }
      if (e && e.detail && e.detail.name === 'home') refreshHome(false);
    });

    document.addEventListener('game:state', function () {
      if (activeId) render(false);
      else refreshHome(false);
    });

    document.addEventListener('game:bondup', function (e) {
      var lv = e && e.detail && e.detail.level;
      if (lv === 1 || lv === 3 || lv === 5) showToast('🖼️ 新羈絆繪卷解鎖！（' + lv + '♥）');
      if (activeId) render(false);
    });

    return HeroineUI;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(window.GameAPI || null); });
  } else {
    setTimeout(function () { init(window.GameAPI || null); }, 0);
  }

  var HeroineUI = {
    init: init,
    open: open,
    openGallery: open,
    show: open,
    close: close,
    closeGallery: close,
    hide: close,
    idleStart: idleStart,
    startIdle: idleStart,
    idleStop: idleStop,
    tap: tap,
    onTap: tap,
    onTapZone: tap,
    react: tap,
    onBattleEvent: onBattleEvent,
    cheer: cheer,
    battleCheer: cheer,
    homeGreeting: homeGreeting,
    getGreeting: getGreeting,
    greeting: getGreeting,
    timeGreeting: getGreeting,
    getTimeSlot: getTimeSlot,
    refreshHome: refreshHome,
    gift: gift,
    openGifts: openGifts,
    giveGift: giveGift,
    dialogue: dialogue,
    talk: dialogue,
    startDialogue: dialogue,
    playDialogue: playScene,
    openCG: openCG,
    openVignette: openCG,
    showVignette: openCG,
    dateEvent: dateEvent,
    onChapterClear: dateEvent,
    render: render,
    refresh: render,
    setOutfit: setOutfit,
    getOutfitClass: getOutfitClass,
    setParallax: setParallax
  };

  window.HeroineUI = HeroineUI;
})();
