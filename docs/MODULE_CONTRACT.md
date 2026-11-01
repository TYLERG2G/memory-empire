# Module ownership (parallel build)

| Owner | Files / duty |
|-------|----------------|
| Claude Code Opus | `js/game.js`, `js/data.js` (systems/numbers; Chinese flavor may be overwritten by Argon), `index.html` wiring, `sw.js`, `js/sw.js`, `manifest.json`, `CHANGELOG_V3.md` |
| agy Opus 5.5 high | `js/heroine.js`, `js/story.js`, `css/heroine.css` (logic/UI; dialogue strings prefer CONTENT_ZH) |
| agy Argon high (FX) | `js/audio.js`, `js/fx.js`, `css/fx.css` + pixelfx vendor + CC0 `assets/sfx/` |
| agy Argon high (WRITING) | ALL Traditional Chinese prose: rewrite/polish `js/content_zh.js`, chapter/item/skill flavor in data if needed, UI flavor consistency. Strongest writer — use heavily. |
| Gemini Flash | balancing tables / chores ONLY — not prose |
| Codex | Playwright tests + review later |

Globals: AudioEngine, FX, HeroineUI, CONTENT_ZH, GAME_DATA, __DEBUG (?debug=1)
Save: memoryRPG_v3. Content: wholesome elegant only.
