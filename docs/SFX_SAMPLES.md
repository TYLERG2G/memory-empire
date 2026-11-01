CC0 samples in assets/sfx/ (see CREDITS.md). Prefer layering these under synthesized SFX in AudioEngine:
- flip ← plop.ogg (+ synth click)
- match ← pop.ogg + triangle.ogg soft
- tap ← mouth-pop.ogg
- skill ← whoosh.ogg + synth
Keep synth fallbacks if decode fails. Do not block on samples.
