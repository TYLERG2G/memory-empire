# 記憶帝國・女傑翻牌 — V3 Boutique + Dating-Sim Overhaul

You are Claude Code (Opus 5.5). Implement an end-to-end upgrade of this PWA in `/workspace/memory-rpg`. Work in this directory. Use sub-agents if helpful. Do NOT push to git yourself — leave commits ready for the parent (or commit locally only if useful; parent will push). Prefer editing existing files and adding modular JS/CSS; keep Traditional Chinese UI (`zh-Hant-TW`).

## Current state (important)
- Working PWA: poker-card match memory RPG + heroine roster/gallery/bond.
- Live deploy target: GitHub Pages `TYLERG2G/memory-empire` (parent pushes).
- Bug: match index-0 falsy was fixed (use strict null checks — keep that).
- Sound exists but `S.sound` defaults to **false** — players hear nothing. Fix: default sound ON (or unlock on first tap + clear mute toggles), real SFX+BGM.
- Difficulty is far too easy (`pairsFor` caps at 8, generous timers, tiny boards).
- Save key `memoryRPG_v2` — migrate forward to `memoryRPG_v3` with migration from v2/v1.
- Content rule (STRICT, non-negotiable): original adult characters only; elegant non-explicit outfits. NO nudity, lingerie, swimwear, sexualized poses, or skin-reveal unlocks. Seasonal/summer variants OK only as sundress / yukata / casual summer / elegant gown (still modest). Prefer CSS/filters/frames for outfit variants if no new art; if generating art locally, follow this rule.

## Product vision
Polished indie **boutique-quality** memory RPG + light dating-sim. Juicy feel, cohesive imperial-noir art direction, deep heroine interaction, genuine memory training difficulty.

---

## 1. Audio (must ship)
Web Audio API synthesized (no copyrighted music/assets):
- SFX: flip, match, mismatch, combo (rising pitch), skill cast, level clear fanfare, fail, level-up, button tap, heroine talk chime, gift, bond-up, boss sting.
- Looping procedural imperial/orchestral-ish BGM (pad + motif + soft percussion); duck on battle end / dialogue.
- Settings: separate BGM / SFX mute + volume sliders; persist.
- iOS: unlock AudioContext on first user gesture; resume on visibility; respect silent-mode friendliness (don't force loud default volume; start ~0.35).
- Default: SFX on, BGM on (or BGM on after first tap). Remove the current "sound off by default" trap.

## 2. Difficulty & game depth (must ship)
Real progression that trains memory:
- Grid growth: 4×3 → 4×4 → 5×4 → 6×4 → 6×5 … with pair counts matching even grids.
- Tighter timers; limited mistakes (stars 1–3 by efficiency: time leftover + miss count + move efficiency).
- Boss every 5 stages with mechanics rotating among: shuffle-on-mismatch, Joker/trap cards (time penalty), faster flip-back, fog/blur cards, chain-of-3 match variant, same-rank different-suit decoys.
- Chapter / world map (e.g. 4–5 chapters × stages).
- Daily challenge (seeded by date), Endless mode with local leaderboard.
- Heroine skills with cooldowns + upgrade trees; gold economy + shop (consumables, relics/passives, gifts).
- Achievements expanded.
- Preview window short on higher stages.
- Debug hook for verification: `window.__DEBUG = { skipToStage(n), forceBoss(), winLevel(), unlockAll(), setBond(id,n), audioTest() }` (only when `?debug=1` or localStorage flag).

## 3. Boutique polish (must ship)
- Title / splash screen with start CTA.
- Screen transitions (fade/slide), card flip polish (3D, shadow, match burst).
- Particles on match/combo/clear; combo pop text; screen shake lightly on miss (optional setting).
- Cohesive UI: imperial crimson/gold/void palette, better typography hierarchy, button press feedback.
- Haptic: vibrate patterns for match/miss/skill (respect setting).
- Story chapter intros (short Traditional Chinese prose + continue).

## 4. Dating-sim heroine system (must ship, wholesome only)
Keep gallery; deepen interaction:
- Idle “Live2D-like” feel via CSS/canvas: subtle breathing scale, blink overlay or eye opacity pulse, gentle parallax on pointer/tilt.
- Tap reaction zones (head / shoulder / hand) — wholesome only: head-pat, encourage, salute; reactions + small bond chance with daily caps.
- Dialogue scenes with **choices** that change bond (branching short scripts per heroine, ≥3 scenes each).
- Shop gifts → give in gallery; favorites per heroine.
- Birthday / date events (calendar hooks; if no real birthday set, use chapter milestones as “date events”).
- Bond-story chapters unlocking CG-style scenes (can be full-bleed heroine art + vignette + text; CSS frames OK — no NSFW).
- Battle cheer bubbles from selected heroine on combo/skill/low-time.
- Home greeting by time of day (晨/午/晚/夜 lines).
- Outfit variants: unlock via bond/shop/events; CSS treatment + labels; summer/seasonal only if non-revealing as above.

## 5. PWA
- Keep iOS add-to-home-screen: manifest, apple meta, icons.
- Bump SW cache to `MEMORY_RPG_v3` (and update `js/sw.js` if duplicate).
- Offline shell still works.
- Version string in settings → `v3.0`.

## 6. Architecture guidance
Suggested modules (adapt as needed):
- `js/audio.js` — AudioEngine
- `js/fx.js` — particles, shake, transitions
- `js/battle.js` or keep in game.js but structured — board, bosses, scoring
- `js/heroine.js` — gallery, dialogue, gifts, idle anim
- `js/meta.js` — map, daily, endless, shop, save migrate
- Expand `js/data.js` — stages, chapters, dialogues, shop, relics
- CSS: split or grow `css/style.css` with clear sections; animations in CSS where possible

Keep code ES5-friendly or modern-but-iOS15+ safe (no optional chaining if you can avoid; Safari iOS OK with modern syntax is fine if tested carefully — prefer broad compatibility).

## 7. Acceptance checklist (you should self-verify in code)
- [ ] First tap unlocks audio; flip/match/mismatch audible when SFX on
- [ ] BGM loops; mute toggles work & persist
- [ ] Stage 1 playable; a boss stage has a special mechanic
- [ ] Map / chapters navigable
- [ ] Gallery: idle anim, tap zones, dialogue choices, gift
- [ ] Save migrates from memoryRPG_v2
- [ ] SW cache name v3
- [ ] No NSFW content
- [ ] `__DEBUG` available with `?debug=1`
- [ ] No console errors on load

## 8. Deliverable note
When done, write a short `CHANGELOG_V3.md` listing files touched and features. Do not delete heroine webp assets.

Start by reading current `index.html`, `js/*.js`, `css/style.css`, `sw.js`, then implement systematically. Prefer a working polished vertical slice over half-finished sprawl — but aim to cover all must-ship sections.
