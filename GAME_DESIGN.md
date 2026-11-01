# 記憶帝國・女傑翻牌 — GAME_DESIGN.md (single source of truth)

**Version:** v3.0 · **UI locale:** zh-Hant-TW · **Save:** `memoryRPG_v3` (migrate v2/v1)  
**Live:** https://tylerg2g.github.io/memory-empire/ · **Repo:** TYLERG2G/memory-empire  
**Rule:** every tool/model has one job; implement against this doc; update this doc when systems change.

---

## 1. Pitch & pillars
Boutique indie memory-card RPG + light dating-sim. Imperial noir / elegant anime heroines (original adults).  
Pillars: (1) genuine memory training difficulty (2) juicy boutique feel (3) wholesome bond / gallery depth (4) iOS PWA.

**Content (STRICT):** elegant outfits only. NO nudity, lingerie, swimwear, sexualized poses, skin-reveal unlocks. Seasonal OK: sundress / yukata / casual summer / gown (modest).

---

## 2. Modes
| Mode | Entry | Notes |
|------|-------|-------|
| Campaign | 繼續征途 | 5 chapters × 10 stages = 50; boss every 5 |
| Map | 征途地圖 | pick cleared/next stage |
| Daily | 每日挑戰 | seeded by date (`dailyConfig`) |
| Endless | 無盡 | local leaderboard; bosses every 3 rounds from r3 |
| Shop / Roster / Achievements / Settings | nav | |

Energy: max 10, fight costs 1 (endless 2). Regen 3 min/point.

---

## 3. Progression & difficulty (`js/data.js`)
**Grids:** 4×3 → 4×4 → 5×4 → 6×4 → 6×5 at stages 1 / 3 / 7 / 14 / 24.  
**Boss:** every 5 stages; may bump grid tier.  
**Timers:** `secPer = max(2.5, 5.2 - n*0.055)`; missLimit shrinks with n; preview shrinks 2.5→0.6s; flipBack 650→480ms.  
**Stars 1–3:** timeLeft ratio + efficiency (`starsFor`).  
**Poker faces:** exact rank+suit match (except decoy/triple bosses). **Never treat index 0 as falsy.**

### Boss mechanics (rotate)
| id | Name | Behavior |
|----|------|----------|
| shuffle | 錯位洗牌 | mismatch swaps positions |
| joker | 小丑陷阱 | 2 jokers; flip costs time (−5s) |
| fast | 疾速覆牌 | no preview; flipBack 300ms |
| fog | 迷霧牌面 | ~50% faces fog soon after open |
| triple | 三連誓約 | match 3-of-a-kind; grid multiple of 3 |
| decoy | 同點誘餌 | same-rank same-color different-suit decoys |

### Chapters
1 緋月序曲 · 2 鏡廳迷宮 · 3 星祭長街 · 4 霜原要塞 · 5 帝冠終章 (intros in data + CONTENT_ZH).

### Economy / meta
Shop: consumables, relics, gifts, outfit unlocks (`SHOP` in data).  
Skills: peek/freeze/time/match/combo — level + CD upgrades.  
Bond: 0–100, heart every 20 (`BOND_PER_LEVEL`). Gift daily cap 3.

---

## 4. Heroines (ids)
| id | Name | Skill |
|----|------|-------|
| verda | 薇爾妲·諾克特 | peek 魔眼窺視 |
| karena | 卡蓮娜·緋焰 | freeze 緋焰停滯 |
| elys | 艾莉絲·羅亞 | time 從容斡旋 |
| selas | 塞拉斯·薇恩 | match 戰術推演 |
| reina | 萊娜·克洛斯 | combo 騎士誓約 |

### Bond / dating-sim (`js/heroine.js`, `js/story.js`, `css/heroine.css`)
- Idle: breathing, blink, parallax (CSS/canvas Live2D-like)
- Tap zones: head / shoulder / hand — wholesome only; daily caps
- Dialogue choices from `CONTENT_ZH.dialogues` (≥3 scenes each)
- Gifts from shop → gallery; favorites
- Bond CG vignette scenes; time-of-day home greetings; battle cheers
- Outfits: default/cape/formal + seasonal CSS classes

---

## 5. Audio (`js/audio.js`)
WebAudio synth + optional CC0 samples in `assets/sfx/` (CREDITS.md):
plop→flip, pop→match/UI, mouth-pop→tap, triangle→chime/bond, whoosh→skill.  
SFX: flip, match, mismatch, combo↑, skill, clear, fail, levelup, tap, talk, gift, bond, boss.  
BGM: looping procedural imperial; duck on result/dialogue.  
Defaults ON; separate BGM/SFX mute+volume; unlock AudioContext on first gesture; ~0.35 default.

---

## 6. FX / juice (`js/fx.js`, `css/fx.css`)
Vendored **pixelfx** MIT subset: `js/vendor/pixelfx/` (+ `pixelfx.bundle.js` → `PixelFX`).  
Map: match→hitSpark/manaBurst/collectBurst; combo→comboCounter+firework/snowflake; skill→magicCircle/spellCharge/rune; boss→frostNova/slash/zap; clear→sunburst/confetti/blessing; levelup→levelUp; bond→heartPickup.  
Recolor crimson `#c41e3a` / gold `#ffd700` / purple `#9b59ff`.  
Also: shake, screen transitions, combo pop, card pulse. Pixel canvas overlay `image-rendering:pixelated`.

QA polish: `docs/QA_POLISH.md` (teardown review-loop — screenshot sheets + checklist). Trailer optional `/workspace/me-shots/trailer.mp4`.

---

## 7. Art direction
Palette: void `#1a0a12`, crimson `#a3122a/#d4243e`, gold `#e8c26a/#ffdf8e`, amethyst accents.  
Typography hierarchy; title splash; silk screen transitions; imperial ornaments. Poker card faces. Heroine webp assets kept.

---

## 8. Module ownership (one job each)
| Model | Job | Owns |
|-------|-----|------|
| **Claude Code Opus 5.5** | Lead systems | `js/game.js`, integrate `js/data.js`, `index.html` wiring, `sw.js`/`js/sw.js` → `MEMORY_RPG_v3`, `CHANGELOG_V3.md`, `__DEBUG` |
| **agy Opus 5.5 high** | Heroine logic/UI | `js/heroine.js`, `js/story.js`, `css/heroine.css` |
| **agy Argon high (FX)** | Audio + juice | `js/audio.js`, `js/fx.js`, `css/fx.css`, pixelfx + sfx samples |
| **agy Argon high (WRITING)** | All zh-Hant prose | polish `js/content_zh.js` (+ flavor strings); strongest writer — use heavily |
| **agy Flash medium** | Chores / balance tables only | numbers tweaks, not prose |
| **Codex (default, never ASTRA)** | Tests + review | `tests/`, Playwright, cross-review |

**Globals:** `GAME_DATA`, `CONTENT_ZH`, `AudioEngine`, `FX`, `HeroineUI`, `__DEBUG` (`?debug=1`).  
**Scripts order:** content_zh → data → audio → fx → story → heroine → game; CSS: style → fx → heroine; load pixelfx.bundle before fx.js.

---

## 9. Acceptance
- [ ] First tap unlocks audio; SFX hearable; BGM loops; mutes persist  
- [ ] Stage 1 + a boss mechanic work; map/daily/endless reachable  
- [ ] Gallery idle/tap/dialogue/gift; no NSFW  
- [ ] Save migrates v2; SW v3; iOS PWA meta/icons  
- [ ] No console errors; Playwright iPhone viewport smoke  
- [ ] Push main → live 200  

---

## 10. Status snapshot (keep updated)
| Artifact | Status |
|----------|--------|
| BRIEF_V3.md / MODULE_CONTRACT.md | present |
| js/data.js v3 systems | done (Claude) |
| index.html shell v3 | done (Claude) |
| css/fx.css | present (Argon) |
| js/content_zh.js | present (Flash draft) → **Argon rewriting** |
| js/vendor/pixelfx + bundle | vendored |
| assets/sfx CC0 | vendored |
| js/game.js v3 | **written (Claude Code, verify)** |
| review.html | **present (coordinator + Flash chore)** |
| js/audio.js / fx.js | **in progress (Argon FX)** |
| js/heroine.js / story.js / heroine.css | **in progress (agy Opus)** |
| CHANGELOG_V3.md / SW bump / Playwright / deploy | pending |

*Last updated: 2026-11-01 (Asia/Taipei) by build coordinator.*

## 11. Runtime notes
- 2026-11-01 Asia/Taipei: agy Claude Opus pool RESOURCE_EXHAUSTED (~4h49m). Heroine → gemini-4-argon-high. Hidden `review.html` for FX/anim contact sheets (not in nav).
