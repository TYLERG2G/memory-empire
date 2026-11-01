# BattleStage 素材契約（可替換）

模組：`js/battle-stage.js` → `window.BattleStage`

## 預設路徑（不呼叫 set* 時）

### 女傑分幀 PNG
- 路徑：`assets/battle/heroines/{id}_{frame}.png`
- `{id}`：`verda` | `karena` | `elys` | `selas` | `reina`
- `{frame}`：`idle0` | `idle1` | `attack` | `hit` | `victory`
- 建議畫布：正方形，**64–256px**（會以 `background-size:contain` 縮到約 48–64 CSS px）
- 透明底；`image-rendering` 可由 CSS 控制（像素風用 pixelated，HD chibi 建議覆寫為 auto）

### 怪物
- 一般：`assets/battle/monsters/ch{1-5}_mob_a.png` / `_b.png`
- Boss：`assets/battle/monsters/ch{1-5}_boss.png`（可選 `chN_boss@1.5x.png`）
- 建議：64–96px 透明底

### 章節背景
- `assets/battle/bg/ch{1-5}.png`（CSS 亦可帶 `@3x`）

## 執行期替換 API（HD chibi 用這個）

```js
BattleStage.setHeroArt({
  idle0: 'url...', idle1: 'url...', attack: 'url...', hit: 'url...', victory: 'url...'
});
// 或單張靜態
BattleStage.setHeroArt('assets/.../hero.png');
// 或 sprite sheet
BattleStage.setHeroArt({
  sheet: 'assets/.../hero_sheet.png',
  fw: 128, fh: 128,
  frames: ['idle0','idle1','attack','hit','victory']
});

BattleStage.setFoeArt('assets/.../monster.png');
// 或 { url, size:'contain', pos:'center bottom' }
```

呼叫時機：`BattleStage.start(...)` 之後（或下一次 start 前設好 state.heroArt）。
