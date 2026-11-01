export { createFrame, clearFrame, createFx, composite } from './core/index.js';
import * as frostNova from './fx/ice/frost-nova.js';
import * as snowflakeBurst from './fx/ice/snowflake-burst.js';
import * as freeze from './fx/ice/freeze.js';
import * as magicCircleCast from './fx/arcane/magic-circle-cast.js';
import * as manaBurst from './fx/arcane/mana-burst.js';
import * as runeCircle from './fx/arcane/rune-circle.js';
import * as spellCharge from './fx/arcane/spell-charge.js';
import * as swordSlash from './fx/melee/sword-slash.js';
import * as doubleSlash from './fx/melee/double-slash.js';
import * as smallExplosion from './fx/explosions/small-explosion.js';
import * as fireworkBurst from './fx/explosions/firework-burst.js';
import * as hitSpark from './fx/impacts/hit-spark.js';
import * as critHit from './fx/impacts/crit-hit.js';
import * as heartPickup from './fx/pickups/heart-pickup.js';
import * as collectBurst from './fx/pickups/collect-burst.js';
import * as comboCounter from './fx/ui/combo-counter.js';
import * as levelUp from './fx/ui/level-up.js';
import * as confetti from './fx/ui/confetti.js';
import * as sunburst from './fx/holy/sunburst.js';
import * as blessing from './fx/holy/blessing.js';
import * as zapHit from './fx/lightning/zap-hit.js';

export const FX_LIB = {
  frostNova, snowflakeBurst, freeze, magicCircleCast, manaBurst, runeCircle, spellCharge,
  swordSlash, doubleSlash, smallExplosion, fireworkBurst, hitSpark, critHit,
  heartPickup, collectBurst, comboCounter, levelUp, confetti, sunburst, blessing, zapHit
};

// Imperial palette helpers (crimson / gold / purple)
export const PALETTES = {
  imperial: { primary: '#c41e3a', secondary: '#ffd700', accent: '#9b59ff', white: '#fff4e6', dark: '#1a0a12' },
  match: { primary: '#ffd700', secondary: '#fff4e6', accent: '#c41e3a' },
  skill: { primary: '#9b59ff', secondary: '#ffd700', accent: '#c41e3a' },
  bond: { primary: '#ff6b8a', secondary: '#ffd700', accent: '#fff4e6' },
  boss: { primary: '#c41e3a', secondary: '#9b59ff', accent: '#ffd700' }
};
