# CHANGELOG — v3.0「記憶帝國・女傑翻牌」

## Files touched (lead / Claude Code)

| File | Change |
|------|--------|
| `js/game.js` | **Full rewrite.** Consumes `GAME_DATA` (`stageConfig` / `dailyConfig` / `endlessConfig` / `starsFor` / `SHOP` / `CHAPTERS` / `BOSS_MECHS`) and the v3 `index.html` shell. |
| `sw.js`, `js/sw.js` | Cache `MEMORY_RPG_v3`. The core shell is precached strictly. The v3 modules and assets (`audio.js`, `fx.js`, `story.js`, `heroine.js`, `content_zh.js`, `css/fx.css`, `css/heroine.css`, `pixelfx.bundle.js`, `assets/sfx/*.ogg`, heroine webp) are cached **one by one, and a missing file is skipped**. While other modules are still in progress, the SW install no longer fails because of one missing file. Offline navigation falls back to `index.html`. |
| `CHANGELOG_V3.md` | This file. |
| `js/data.js`, `index.html` | Done earlier this round (chapters, bosses, stageConfig, v3 save key, UI shell). This rewrite does not change them. |

Not modified: `js/content_zh.js`, `js/audio.js`, `js/fx.js`, `js/heroine.js`, `js/story.js`, `css/*`.

## Features (game.js)

### Save
- `memoryRPG_v3`. When there is no v3 save, it migrates from `memoryRPG_v2` / `memoryRPG_v1`:
  - Bond goes from 0–5 hearts to 0–100 points (×20). Skills, outfits, unlocks, stats and achievements carry over. Unknown achievement ids are dropped.
  - **Sound defaults to ON (SFX + BGM).** The old v2 trap where `sound:false` was the default is gone. Default volume: SFX 0.45 / BGM 0.35.
  - After migrating, the player sees a toast after the title screen.
- Settings: separate SFX/BGM switches and volume sliders, haptics, and screen shake on miss. All persist. The topbar 🔊 is a master mute.

### Battle (harder)
- Board, time limit, miss limit and preview time all come from `stageConfig`. Boards grow 4×3 → 4×4 → 5×4 → 6×4 → 6×5. Cards are capped by available height, so 6×5 doesn't overflow.
- Exceeding the miss limit loses the battle. Results give 1–3 stars (`starsFor`), the best per stage is kept, and stars animate in on the result screen.
- Boss every 5 stages, with the mechanic rotating: **shuffle** (mismatched cards swap positions), **joker** (traps that cost time; the 🎲 relic halves the penalty), **fast** (no preview, cards flip back quickly), **fog** (some faces blur after being flipped), **triple** (sets of three), **decoy** (same rank, same color, different suit). The boss gets an entry banner and sound.
- Index safety: selections are an index array checked with `indexOf(i) !== -1` and `isNum`. Index 0 is never treated as falsy.
- Skills have cooldowns (`skillCooldown`) and upgrade on two tracks (power ◆ / cooldown ◆). Reina's skill is a passive combo multiplier.
- Consumables: an optional loadout screen before battle (hourglass / preview scroll / ward charm / skill elixir). Relics apply passively (gold / preview / time / combo / miss limit / joker).
- Battle cheer bubbles at start, combo, skill, low time, miss, win and lose. Text comes from `CONTENT_ZH.battleCheer`, falling back to `heroine.cheer`.
- The game auto-pauses when the app goes to the background. Retreating counts as a loss.

### Modes and meta
- **Campaign map**: 5 chapters × 10 stages, boss nodes ♛, stars shown per node, any cleared stage can be replayed (replays pay 60% gold).
- **Chapter intros**: these play the first time you enter a chapter, and can be replayed from the map. Chapter epilogues play on first clear. The fallback modal uses `CONTENT_ZH.chapters[].prose/quote/epilogue`.
- **Daily challenge**: seeded by date (`dailyConfig`). The first clear pays 🪙+150 / XP +60.
- **Endless**: rounds get progressively harder, half the leftover time carries into the next round (max 15 s), and a local top-10 leaderboard is kept.
- **Shop**: consumables / relics / gifts / outfits (summer dress). The ⚡ potion takes effect immediately.
- Achievements: uses the 34 entries in `data.js` and pays out gold rewards automatically.
- Time-of-day home greeting (morning/afternoon/evening/night) from `CONTENT_ZH.greetings`. Tap the bubble for a new line.

### Fallback heroine UI (used only when HeroineUI is absent)
- Story dialogue with choices (`CONTENT_ZH.dialogues`, `reqBond` ≤ heart level, `bondDelta`×4 points), plain chat (daily cap), tap zones on head/shoulder/hand (daily cap `TAP_DAILY_CAP`, 50% chance of +1), gifts (daily cap 3, favorite gift gives double), favorite ★ (tap the title), outfits (unlocked by bond / bought in shop / chapter 3 event → yukata), and pointer parallax.

### Title / debug
- Title screen `#title-screen`: the first tap unlocks audio, starts BGM, then fades out. New saves then auto-play the chapter 1 intro.
- `?debug=1` or `localStorage.memoryRPG_debug = '1'` enables
  `window.__DEBUG = { skipToStage(n), forceBoss(mech?), winLevel(), loseLevel(), unlockAll(), setBond(id, n), audioTest(), reveal(), state(), battle(), migrateFrom(json) }`.
  `setBond`: n ≤ 5 is treated as hearts, otherwise as points.

## Module contract (implemented defensively in game.js; every call is optional and wrapped in try/catch)

**`window.AudioEngine`** (each method name is tried in order)
- Settings: `applySettings|configure|setSettings({sfx,bgm,sfxVol,bgmVol,…})`, otherwise `setSfxEnabled/setBgmEnabled/setSfxVolume/setBgmVolume`
- `unlock|resume|init()` (called on the first gesture and when visibility returns)
- `play|sfx|playSfx(name, {combo})`. Names: `flip tap match mismatch combo skill clear fail levelup chime gift bond boss star buy joker`
- `playBgm|startBgm|bgm(track)` (`main` / `battle` / `boss`), `stopBgm()`, `duck(true)` / `unduck()|duck(false)`
- When absent: the built-in WebAudio synth plays SFX and a simple BGM, and no AudioContext is created before a user gesture.

**`window.FX`**: `burst|matchBurst|particles(x,y,{kind,el})`, `cardPulse|pulse(el)`, `shake(el,'sm')`, `comboPop|combo(n)`, `floatText(x,y,text,tone)`, `flash|vignette(tone)`, `transition|veil(kind)`. When absent, the `css/fx.css` classes are used (`fx-combo-pop`, `fx-float-text`, `fx-vignette-flash`, `fx-transition-veil`, `fx-card-pulse`, `fx-screen-enter-*`).

**`window.HeroineUI`**: `init(GameAPI)` (once), `open|openGallery|show(id, GameAPI)` (if it returns `false`, the built-in gallery is used instead), optional `cheer(id, kind, line)` (return `true` to take over the battle bubble), and `dateEvent|onChapterClear(chapter, selectedId)`.

**`window.StoryUI` / `window.Story`**: `showChapterIntro|chapterIntro|playChapter(ch, done, {chapter, api})`, `showChapterEpilogue|chapterEpilogue(ch, done, …)`. These **must call `done`**. Returning `false` means "not handled".

**`window.GameAPI`** (for heroine.js / story.js): `state`, `getState()`, `save()`, `data`, `heroine(id)`, `bondLevel(id)`, `addBond(id, pts)`, `giveGift(id, giftId)`, `addGold/spendGold`, `inventory()`, `dayCounters()`, `toast`, `sfx`, `duck`, `vibe`, `fx`, `content()`, `greeting(id)`, `selectHeroine`, `setOutfit/outfitStatus`, `markScene/sceneSeen`, `refresh`, `go`, `openGallery/closeGallery`, `openModal/closeModal`.
DOM events: `game:ready`, `game:state`, `game:screen`, `game:bond`, `game:bondup`, `game:event`.

## Verification (headless Chrome via CDP, ?debug=1)
- Title → chapter 1 intro → stage 1 (4×3, 12 cards) → match / mismatch / win → 3 stars, maxStage 2, achievements paid out.
- v2 save (`sound:false`, 3 hearts) → v3: bond 60, SFX/BGM on, unknown achievement removed.
- All six boss mechanics: board size, jokers deduct 5 s, triples match, shuffle swaps and the DOM stays in sync, fog cards get `fogged`, exceeding the miss limit → "失誤過多" (too many misses).
- Map (50 nodes), shop purchase, roster, fallback gallery (dialogue choice +12, favorite gift +16, tap zones), endless round 2 + leaderboard, daily modal, settings and master mute persistence.
- No JS exceptions on load. The only console errors are 404s for modules that don't exist yet (audio/fx/story/heroine.js, heroine.css).
- Known (not caused by this change; the v2 commit renders the same way): in headless Chrome, face-down card backs (`.face.back` in `style.css`) render as a thin line, while face-up cards render normally. Please confirm on a real device / Playwright.


## v3.1 land (2026-11-01 Asia/Taipei)

Modules now on disk and wired:
- `js/audio.js` — AudioEngine (SFX/BGM, unlock-on-tap, duck)
- `js/fx.js` + `css/fx.css` + `js/vendor/pixelfx/` — PixelFX juice
- `js/story.js` — chapter/date vignettes
- `js/heroine.js` + `css/heroine.css` — HeroineUI (idle blink/breathe, tap zones, gifts, dialogue, battle cheer)
- `js/content_zh.js` — zh-Hant-TW dialogues/greetings/cheers; gift ids aligned to `SHOP.gifts`
- `review.html` — hidden QA contact sheet (canonical asset paths only; not in nav)
- SW cache bumped to `MEMORY_RPG_v3b`

QA: Playwright iPhone 13 smoke — HeroineUI/AudioEngine/FX/CONTENT_ZH present; level-1 debug clear wins; review sheet 0 broken images / 0 asset 404s. Shots in `/workspace/me-shots/v3-*.png`.
