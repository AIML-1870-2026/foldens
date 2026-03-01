# Spike Runner — Game Specification

## Table of Contents

1. Overview
2. Visual Identity
3. Player Character
4. Core Mechanics
5. Phase Shift System
6. Movement & Physics
7. Pattern Library
8. Procedural Theming & Zone Progression
9. Juice & Game Feel
10. HUD & UI
11. Audio Design
12. Scoring & Progression
13. Technical Structure
14. Appendix: Visual Reference Notes

---

## 1. Overview

**Spike Runner** is a pixel-art cyberpunk endless runner built for the browser. The player sprints across a neon-drenched cityscape, dodging obstacles by jumping and phase-shifting between two parallel layers of the environment — the **Street** (foreground) and the **Rooftop** (background). As the run progresses, the city itself transforms through distinct visual zones, shifting palettes and atmospheres to reward survival with an ever-evolving world.

The game is controlled with two inputs: **Jump** and **Phase Shift**. The design philosophy prioritizes three pillars:

- **Visual richness**: Pixel art with real depth — proper shading, highlights, color grading, and bloom. The screen should feel alive and full without overwhelming the player's ability to read the gameplay space.
- **Satisfying movement**: Jumps must feel weighty, responsive, and believable. Every gap is designed around what the player can actually reach. The character has momentum, gravity, and subtle animation that sells physicality.
- **Controlled variety**: A curated pattern library ensures fairness while procedural zone theming keeps the experience fresh across long runs.

**Target Platform**: Modern browsers (desktop and mobile). Keyboard and touch input.

**Controls**:
- **Jump**: Spacebar / Up Arrow / Tap left side of screen
- **Phase Shift**: D key / Shift / Tap right side of screen

---

## 2. Visual Identity

### Style

The game uses a **high-fidelity pixel art** style. This is not minimalist retro — sprites and tiles should exhibit proper shading with light sources, dithering for gradients, distinct highlight and shadow colors, and care given to sub-pixel animation where appropriate. Think of the visual quality seen in games like Katana Zero, The Last Night, or Dead Cells.

### Color Philosophy

Each zone (see Section 8) uses a **limited, curated palette of 10–14 colors**. Palettes are designed with:

- A dominant hue for atmosphere (e.g., cyan/magenta for Neon District, amber/rust for Industrial Zone)
- A neutral dark tone for grounding (deep navy, charcoal, near-black — never pure #000000)
- 2–3 accent colors for interactive elements, hazards, and collectibles
- A dedicated highlight color for the player character to ensure they always pop against any background

### Bloom & Glow

A post-processing bloom/glow layer sits on top of the pixel art to sell the neon cyberpunk atmosphere. This is applied selectively — not everything glows. Sources of bloom include:

- Neon signage and environmental light fixtures
- The player's phase-shift trail
- Collectible items
- Hazard telegraph flashes
- UI score counter

The bloom should be soft and atmospheric, not blown-out. It enhances the pixel art rather than obscuring it.

### Color Grading

A subtle full-screen color grade is applied per zone to unify the palette and push atmosphere. This may include slight tonal shifts (e.g., pushing shadows toward blue in the Neon District, toward green in the Underground), vignetting at screen edges, and gentle contrast curves. The grade transitions smoothly between zones.

### Screen Composition

The screen should feel **full but readable**. This is achieved through layered parallax backgrounds (3–4 layers of city detail at varying scroll speeds), environmental particle effects (rain, steam, embers — context-dependent per zone), and foreground detail elements that frame the play area without obscuring it. Despite this visual density, the **gameplay lane** — the space where the player runs, jumps, and encounters obstacles — must always be immediately clear. Obstacles and the player character sit on the sharpest, highest-contrast layer. Background layers are progressively more desaturated and blurred to push them back.

### Parallax Layers (Back to Front)

1. **Sky / Deep Background**: Distant city skyline, clouds, stars, or atmospheric haze. Slowest scroll speed (approximately 10–15% of ground speed). Most desaturated.
2. **Mid-City**: Buildings, bridges, infrastructure at medium distance. Moderate scroll speed (approximately 30–40%). Moderate detail.
3. **Near Background**: The inactive phase layer. Scrolls at approximately 70–80% speed. Semi-transparent or slightly dimmed when not active.
4. **Gameplay Layer**: The active phase layer. Full scroll speed (1:1 with player). Sharpest detail, highest contrast. This is where the player, ground, and obstacles exist.
5. **Foreground Framing**: Occasional foreground elements (railing, overhanging pipes, signage edges) that scroll faster than the gameplay layer (approximately 110–120%). These frame the scene but never overlap the gameplay lane.

---

## 3. Player Character

### Design

A small, expressive sprite — approximately 16×24 pixels in the base frame. The character wears a hooded jacket or runner's vest with a glowing visor/eyes. The silhouette must be instantly readable: a human figure in motion, distinct from all environmental elements. The glow on the visor serves as both a style choice and a gameplay readability tool — the player can always find their character.

### Animation Frames

- **Run Cycle**: 6–8 frames. Arms pump, legs cycle, slight forward lean. The hoodie/jacket has secondary motion (trailing edge bounces). Foot contacts produce small dust/spark particles.
- **Jump Rise**: 2–3 frames. Character tucks legs, arms pull upward. Slight vertical stretch (squash & stretch principle).
- **Jump Apex**: 1–2 frames. Hang pose — legs extended, arms wide or trailing. A brief moment of stillness.
- **Jump Fall**: 2–3 frames. Arms move upward relative to body, legs extend downward anticipating landing. Slight vertical stretch.
- **Landing**: 2 frames. Character compresses vertically (squash) by approximately 20%, then springs back. Dust burst particle effect.
- **Phase Shift**: 3–4 frames of a glitch/dissolve animation. The character briefly becomes semi-transparent with chromatic offset (RGB split), then solidifies in the new layer. The entire transition is fast — 150–200ms.
- **Death**: Character shatters into pixel fragments that scatter outward with physics. The fragments inherit the character's glow color. A brief flash and screen shake accompany this.

### Player Trail

A subtle afterimage trail follows the player during normal running — 2–3 ghost frames that fade in opacity. During phase shift, the trail momentarily intensifies and takes on a distinct color (cyan when shifting to Street, magenta when shifting to Rooftop).

---

## 4. Core Mechanics

### Running

The player runs automatically from left to right at a base speed that increases gradually over time. The camera follows the player with a slight lead — the character is positioned at roughly the left third of the screen, giving the player more visible space ahead than behind.

### Jumping

Jumping is the primary obstacle avoidance mechanic. The player presses the jump input to leap. The jump arc is fixed in height but the horizontal distance covered depends on current run speed (faster = longer jumps). See Section 6 for detailed physics.

**Coyote Time**: The player can still jump for a brief window (approximately 80–100ms) after walking off a platform edge. This is invisible to the player but makes the game feel forgiving and responsive.

**Jump Buffering**: If the player presses jump slightly before landing (approximately 100ms window), the jump executes immediately upon touchdown. This prevents the frustrating feeling of "I pressed it but nothing happened."

### Phase Shifting

The player can shift between two parallel layers of the environment: the **Street** (foreground) and the **Rooftop** (background). See Section 5 for full details.

### Death

The player dies upon colliding with any hazard or falling into a pit. Death triggers immediately — there is no health system. One hit ends the run.

---

## 5. Phase Shift System

### Concept

The city exists on two planes. The **Street** layer represents ground-level — roads, sidewalks, storefronts. The **Rooftop** layer represents the upper level — rooftops, catwalks, antenna arrays. Both layers scroll simultaneously and occupy the same horizontal space, but contain different obstacles and platforms.

At any time, the player exists on exactly one layer. The other layer is visible but dimmed and slightly translucent, appearing as a ghostly backdrop. Pressing the Phase Shift input instantly moves the player to the other layer.

### Visual Treatment

- **Active Layer**: Full brightness, full opacity, sharp pixel edges. Obstacles are vivid and clearly readable.
- **Inactive Layer**: Reduced to approximately 30–40% opacity. A slight desaturation is applied. Obstacles appear as faded silhouettes — visible enough for the player to plan ahead, but visually recessed so they don't compete with the active layer.
- **Transition Effect**: When the player shifts, a brief (100–150ms) visual glitch occurs — horizontal scanlines flicker, a chromatic aberration burst (RGB channels offset by 2–3 pixels) pulses outward from the player, and the two layers crossfade. The transition is fast and punchy, never sluggish.

### Obstacle Layer Rules

Obstacles belong to one of three categories:

- **Street-Only**: Exist only on the Street layer. Examples include ground-level barriers, neon fences, parked vehicles. Displayed at full opacity when Street is active; faded ghost when Rooftop is active.
- **Rooftop-Only**: Exist only on the Rooftop layer. Examples include hovering drones, antenna arrays, satellite dishes. Same visibility rules apply inversely.
- **Both-Layer (Universal)**: Exist on both layers simultaneously and cannot be avoided by shifting. These hazards must be jumped over or ducked under. They are displayed at full opacity regardless of which layer is active and are visually distinct (e.g., a different border glow or a "hardened" appearance) so the player immediately recognizes them as unavoidable via shifting.

### Cooldown

After a phase shift, a brief cooldown of approximately 400ms prevents the player from immediately shifting back. This prevents trivial spam-shifting and makes each shift a deliberate decision. A small visual indicator on or near the character shows when shift is available again (e.g., the visor glow dims during cooldown and re-ignites when ready).

---

## 6. Movement & Physics

This section defines the feel of the game. Every value here should be tuned iteratively during development, but the following targets establish the intended feel.

### Ground Movement

The player accelerates to run speed over approximately 0.3 seconds at the start of a run (ease-in). Base run speed increases logarithmically over time — fast early gains that plateau, ensuring the game gets harder but never becomes impossibly fast. A suggested curve: speed starts at 100% and caps at approximately 200% of base after 5+ minutes of play. The speed increase should be imperceptible moment-to-moment but clearly noticeable when comparing the first 30 seconds to the 3-minute mark.

### Jump Arc

The jump uses a **tuned gravity model** — not a simple parabola. Specifically:

- **Rising phase**: Lower gravity multiplier (approximately 0.8× base gravity). This gives the jump a slightly floaty, hang-time feel at the peak. The character rises quickly, then slows near the apex.
- **Falling phase**: Higher gravity multiplier (approximately 1.5–2× base gravity). The character falls faster than they rose, creating a snappy, weighty descent. This makes landings feel impactful and gives the player more precise control over where they land.
- **Apex hang**: At the very top of the arc (when vertical velocity is near zero), gravity is further reduced for 2–3 frames. This creates a brief "float" that feels satisfying and gives the player a split-second to make decisions.

The result is an asymmetric arc: quick rise, brief hang, fast fall. This is the gold standard for platformer jump feel.

### Jump Height & Distance

The jump must be tuned so that the maximum jump arc comfortably clears the widest gap in the pattern library with a small margin of error. The player should never feel like they barely made a jump that was designed to be clearable — there should always be a visible cushion. Conversely, gaps designed to be dangerous should be clearly wider than the comfortable range.

At base run speed, the jump should cover approximately 4–5 tile widths horizontally and 3–4 tile heights vertically. These values scale with run speed (faster run = longer horizontal distance, same height).

### Landing

Upon landing, the character's vertical velocity is absorbed over 2–3 frames with a squash animation. There is no bounce. A small dust/spark particle burst occurs. If the player is holding the jump button on landing (jump buffering), the next jump initiates immediately from the squash pose, creating a fluid chain-jump feel.

### Edge Cases

- **Coyote Time**: 80–100ms grace period after leaving a platform edge during which the player can still initiate a jump.
- **Jump Buffer**: 100ms input buffer — if jump is pressed just before landing, it fires on contact.
- **Collision**: The player's hitbox is slightly smaller than their visual sprite (approximately 80% width, 90% height). This makes near-misses feel fair rather than frustrating. The sprite visually clips the obstacle but the player survives — this is intentional and feels like a "close call."

---

## 7. Pattern Library

The level is constructed by randomly selecting and sequencing pre-designed **chunks** (also called segments or patterns). Each chunk is a self-contained section of terrain and obstacles that is guaranteed to be completable at the speed range it is designed for. Chunks connect seamlessly — the exit state of one chunk (ground height, active layer) matches the entry state of the next.

### Difficulty Tiers

Each chunk is tagged with a difficulty tier. The game's chunk selection is weighted by distance:

- **Easy** (0–1000m): Only Easy chunks. Introduces one concept at a time.
- **Medium** (1000–3000m): Mix of Easy and Medium chunks. Combines mechanics.
- **Hard** (3000m+): All tiers available. Complex combinations, tighter timing.

### Chunk Definitions

Each chunk below describes a gameplay section lasting approximately 3–5 seconds at base speed.

**Chunk 1 — Street Gap (Easy)**
A straightforward pit in the Street layer. The gap is moderate — clearable with a standard jump at base speed with comfortable margin. No phase shifting required. This is the "tutorial" chunk that teaches jumping.
- Entry: Street layer, flat ground
- Hazard: Single pit, approximately 3 tiles wide
- Exit: Street layer, flat ground

**Chunk 2 — Neon Fence (Easy)**
A tall barrier blocks the Street layer. It does not exist on the Rooftop layer. The player must shift to Rooftop to pass through, then can shift back (or stay on Rooftop for the next chunk).
- Entry: Street layer, flat ground
- Hazard: Street-only vertical barrier
- Exit: Either layer, flat ground
- Teaches: Phase shifting as obstacle avoidance

**Chunk 3 — Drone Patrol (Easy)**
A hovering drone occupies the Rooftop layer at jump height. If the player is on the Rooftop, they must shift to Street. If already on Street, they can simply run under it. The drone has a subtle bob animation and a visible red scanning light as a telegraph.
- Entry: Either layer, flat ground
- Hazard: Rooftop-only drone at mid-height
- Exit: Same layer as entry, flat ground
- Teaches: Layer awareness and reading upcoming hazards

**Chunk 4 — Double Barrier (Medium)**
A Street-only low barrier is immediately followed by a Rooftop-only high barrier. The player must shift to Rooftop to avoid the first, then quickly shift back to Street to avoid the second. The timing window is comfortable but requires two deliberate shifts.
- Entry: Street layer, flat ground
- Hazard: Street barrier → Rooftop barrier in sequence (spaced approximately 2 seconds apart at base speed)
- Exit: Street layer, flat ground
- Teaches: Rapid sequential shifting with planning

**Chunk 5 — Flickering Platform (Medium)**
A gap is bridged by a platform that alternates between layers on a visible timer (approximately 1.5-second cycle). The platform flickers with a warning animation before switching. The player must time their crossing to be on the correct layer when the platform is active.
- Entry: Either layer, flat ground
- Hazard: Gap with layer-alternating platform, approximately 4 tiles wide
- Exit: Either layer, flat ground
- Teaches: Timing-based shifting and reading visual telegraphs

**Chunk 6 — Laser Grid (Medium)**
A Universal (both-layer) hazard spans the middle of the play area. There is a gap in the grid at a specific height — the player must jump to pass through the opening. Shifting does not help because the lasers exist on both layers.
- Entry: Either layer, flat ground
- Hazard: Full-width laser wall with a jumpable gap
- Exit: Same layer, flat ground
- Teaches: Universal hazards cannot be shifted through; precision jumping

**Chunk 7 — Phase Corridor (Hard)**
A rapid sequence of alternating Street and Rooftop barriers in a narrow corridor. The player must shift back and forth 4–6 times in quick succession. Each barrier is telegraphed with a brief glow on the appropriate layer. The rhythm is steady and learnable.
- Entry: Street layer, flat ground
- Hazard: Alternating single-layer barriers, tightly spaced
- Exit: Either layer, flat ground
- Teaches: Rhythmic shifting under pressure

**Chunk 8 — Collapsing Billboard (Medium)**
A large billboard in the Rooftop layer begins to topple forward as the player approaches (triggered by proximity). It falls and briefly blocks the Street layer as well, creating a temporary Universal hazard. The player must either outrun it or shift to Rooftop before it finishes falling.
- Entry: Either layer, flat ground
- Hazard: Dynamic environmental hazard with a 1–2 second telegraph (cracking animation, dust particles)
- Exit: Either layer, flat ground
- Teaches: Reacting to environmental changes, dynamic hazards

**Chunk 9 — EMP Zone (Hard)**
The player enters a zone marked by crackling static and a visual distortion border. Inside this zone (lasting approximately 3–4 seconds of running), phase shifting is disabled. The player must rely purely on jumping to avoid obstacles. Obstacles in this zone are designed for single-layer platforming.
- Entry: Locked to Street layer upon entering
- Hazard: 2–3 jumpable obstacles (pits and low barriers), no shifting allowed
- Exit: Street layer, shift re-enabled
- Teaches: Platforming fundamentals without the shift crutch; creates tension

**Chunk 10 — Vent Launch (Hard)**
A steam vent on the Street layer launches the player high into the air. At the apex, the player must choose which layer to land on — one has a safe platform, the other has a hazard. The correct layer is telegraphed by a visual cue (a glowing marker on the safe platform).
- Entry: Street layer, flat ground
- Hazard: Forced vertical launch → layer choice at apex → hazard on wrong layer
- Exit: The chosen layer, elevated platform that ramps back to ground level
- Teaches: Decision-making under pressure, reading telegraphs at speed

### Chunk Transition Rules

- Every chunk has a defined entry state (which layer, ground height) and exit state.
- The sequencer only connects chunks whose entry state matches the previous chunk's exit state.
- At least one Easy chunk must appear between consecutive Hard chunks (no back-to-back Hard chunks until 5000m+).
- A "flat ground bridge" of 1–2 tiles is inserted between chunks to give the player a micro-breather and ensure seamless visual tiling.

---

## 8. Procedural Theming & Zone Progression

As the player survives longer, the city transforms around them. Each zone lasts approximately 1000m and transitions smoothly into the next over a 200m crossfade. The transitions affect palette, background art, particle effects, and ambient sound — but never alter the core mechanics or hitboxes.

### Zone 1 — Neon District (0–1000m)

The starting zone. Rain falls steadily. Neon signs flicker in pinks, cyans, and magentas against deep blue-black buildings. Puddles on the ground reflect neon light. The atmosphere is dense and moody.
- Dominant Palette: Cyan, magenta, deep navy, hot pink accents
- Particles: Rain (falling diagonal), puddle splashes on player footsteps, neon sign flicker
- Background Details: Holographic advertisements, kanji/glitch text signage, steam rising from vents
- Mood: Blade Runner alleyway — intimate, close, wet

### Zone 2 — Industrial Sector (1000–2000m)

The city opens up into factories and shipping infrastructure. The rain stops. Warm amber light from furnaces and sparks replaces cool neon. Metallic surfaces, pipes, and smokestacks dominate. The air is hazy with smog.
- Dominant Palette: Amber, rust orange, dark brown, steel gray, yellow-white sparks
- Particles: Floating embers, steam bursts, metal sparks from grinding machinery
- Background Details: Conveyor belts, crane silhouettes, smokestack plumes, warning lights
- Mood: Hot, heavy, industrial — the belly of the machine

### Zone 3 — Corporate Skyline (2000–3000m)

The environment shifts to clean, angular glass-and-steel towers. Cool blue-white light dominates. Holographic data streams flow along building facades. The aesthetic is sterile and precise.
- Dominant Palette: Ice blue, white, chrome silver, teal accents, dark charcoal
- Particles: Data motes (small glowing squares drifting upward), lens flare from glass reflections
- Background Details: Skyscraper facades with scrolling data, sky bridges, corporate logos
- Mood: Cold, clinical, imposing — the seat of power

### Zone 4 — Underground (3000–4000m)

The run descends into tunnels and subterranean passages. Light is scarce — bioluminescent growths and flickering utility lights provide visibility. Water drips from ceilings. The space feels tight.
- Dominant Palette: Deep purple, toxic green, dark teal, murky brown, bioluminescent cyan
- Particles: Dripping water, floating spores, flickering light (intermittent darkness pulses)
- Background Details: Exposed pipes, root-like growths, graffiti, abandoned infrastructure
- Mood: Claustrophobic, eerie, organic-meets-industrial

### Zone 5 — Skyline Rooftops (4000–5000m)

The player emerges onto the highest rooftops. The sky dominates — deep purple fading to orange at the horizon (perpetual dusk). The city sprawls below as a sea of tiny lights. Wind is a factor visually (particle streaks, flag/banner animation on rooftop elements).
- Dominant Palette: Deep violet, burnt orange, warm gold, silhouette black, pale yellow
- Particles: Wind streaks (horizontal speed lines), flag flutter, distant city light twinkle
- Background Details: Antenna forests, water towers, the distant skyline as a glowing carpet
- Mood: Exposed, vast, triumphant — you've reached the top

### Zone 6 — Glitch Zone (5000m+)

The city itself begins to break down. Visual corruption creeps in — tiles misalign, palettes from previous zones bleed into each other randomly, static flashes interrupt the screen, and geometry occasionally warps. This is the "endgame" zone that escalates indefinitely.
- Dominant Palette: Unstable — randomly samples and distorts colors from all previous zones
- Particles: Static bursts, pixel scatter, scanline tears, data corruption artifacts
- Background Details: Fragmented buildings, tiling errors (intentional), overlapping zone elements
- Mood: Unstable, surreal, hostile — the world is failing

### Transition Behavior

Over the 200m crossfade between zones, the following happens simultaneously:

- Background palette lerps (linear interpolation) from the current zone's colors to the next
- Particle systems crossfade (old particles stop spawning, new ones begin; existing particles finish their lifecycle)
- Background detail elements fade out and new ones fade in
- The color grade shifts gradually
- No gameplay changes occur during transition — only visuals and atmosphere

---

## 9. Juice & Game Feel

Every interaction in Spike Runner should produce satisfying feedback. The following effects work together to make the game feel alive.

### Squash & Stretch

- **Landing**: The character sprite compresses vertically by approximately 20% and expands horizontally by approximately 10% for 3–4 frames, then springs back. This sells the impact of landing.
- **Jump Launch**: The character stretches vertically by approximately 15% during the first 2–3 frames of ascent.
- **Near Miss**: When the player passes within a few pixels of an obstacle without dying, the obstacle itself briefly squishes inward (approximately 5–10%) as if reacting to the player's passage. This rewards close calls with a visible "whew" moment.

### Screen Shake

Screen shake is applied in tiers and should always be brief (never lingering):

- **Landing** (from a high jump): Very subtle shake, 2–3 pixels offset for 3 frames
- **Phase Shift**: Quick horizontal jitter, 1–2 pixels for 2 frames (reinforces the "glitch" feel)
- **Death**: Strong shake, 4–6 pixels offset for 8–10 frames, decaying

### Particles

Particles are context-sensitive and layer onto the zone-specific ambient particles:

- **Foot Dust/Sparks**: Small puffs at each foot contact during the run cycle. Color matches the ground surface of the current zone (dust in Underground, sparks in Industrial, water splashes in Neon District).
- **Jump Dust**: A burst of 5–8 particles on jump launch, expanding outward from the character's feet.
- **Landing Burst**: A wider burst of 8–12 particles on landing, with slight upward trajectory.
- **Phase Shift**: A ring of glitch particles (small squares and scanline fragments) expands outward from the character during the shift animation.
- **Death Shatter**: The character breaks into 20–30 pixel fragments that scatter with physics (gravity, slight randomized velocity). Fragments inherit the character's glow color and fade over 1–2 seconds.
- **Near-Miss Sparks**: A small trail of 3–5 bright particles emits from the edge of the obstacle closest to the player on a near miss.
- **Speed Lines**: At higher run speeds (approximately 150%+ of base), faint horizontal lines streak across the screen to emphasize velocity.
- **Collectible Pickup**: A starburst of 6–8 particles in the collectible's color, with a quick scale-up-and-fade ring.

### Easing

All motion in the game uses easing functions rather than linear interpolation:

- **Jump Rise**: Cubic ease-out (fast start, gentle slowdown near apex)
- **Jump Fall**: Cubic ease-in (slow start from apex, accelerating into landing)
- **Camera Lead**: Smooth ease when the camera adjusts to speed changes
- **UI Elements**: Elastic ease-out when score numbers update, HUD elements slide in
- **Zone Transitions**: Linear lerp for palettes (to avoid jarring midpoint shifts)

### Freeze Frames

Brief pauses in the game loop that emphasize key moments:

- **Death**: 60–80ms freeze before the shatter animation plays. The screen tints slightly red or white during the freeze. This gives the player a split-second to register what happened.
- **Near Miss**: 15–20ms micro-freeze (nearly imperceptible consciously, but felt subconsciously). Combined with the near-miss squish and sparks, this creates a satisfying "barely made it" sensation.
- **Milestone (every 1000m)**: 30–40ms freeze with a flash as the zone transition begins. Communicates "something just changed" and punctuates the run.

### Anticipation

- **Jump**: The character dips into a slight crouch (1–2 frame anticipation pose) before the jump launches. This happens fast enough to not delay the action but slow enough to be subconsciously registered. If the player is chain-jumping (jump buffer), the crouch is skipped for immediacy.
- **Phase Shift**: The character's visor glow flickers rapidly for 1–2 frames before the shift executes, accompanied by a brief audio cue.
- **Hazard Telegraph**: Obstacles that activate or move (falling billboards, flickering platforms, EMP zones) always have a visible warning — a glow, a wobble, a cracking animation — for at least 0.5–1 second before becoming dangerous.

### Screen Effects

Post-processing effects layered on the entire frame:

- **Bloom**: Soft glow on emissive elements (neon, player visor, collectibles). Intensity varies slightly per zone. See Section 2.
- **Chromatic Aberration**: A brief RGB-split pulse on phase shift (expanding outward from player position) and a constant subtle edge aberration that intensifies at higher speeds.
- **Vignette**: Subtle darkening at screen edges. Tightens slightly as speed increases, creating a "tunnel vision" effect that subconsciously communicates acceleration.
- **Scanlines**: A very faint CRT scanline overlay (optional, toggleable). Should be barely perceptible — a texture, not a filter. Enhances the retro-future aesthetic without degrading readability.

---

## 10. HUD & UI

### In-Game HUD

The HUD is minimal and non-intrusive. All HUD elements use a pixel font consistent with the game's art style.

- **Distance Counter**: Top-left. Displays current run distance in meters. The number ticks up smoothly (not jumping in large increments). On milestone crossings (every 1000m), the counter briefly flashes and scales up before settling back.
- **Score / Multiplier**: Below the distance counter. Shows current score and active multiplier. The multiplier indicator pulses gently when active.
- **Phase Shift Indicator**: Positioned near the player character (not in a HUD corner). A small glowing ring or icon that dims during cooldown and re-ignites when shift is available. Must be readable at a glance without taking eyes off the gameplay lane.
- **Zone Name**: Briefly displays the zone name (e.g., "NEON DISTRICT") in a stylized pixel font when entering a new zone. Fades in over 0.5 seconds, holds for 2 seconds, fades out over 0.5 seconds. Positioned center-top, above the gameplay lane.

### Title Screen

A visually striking title screen that showcases the game's art quality. The background is an animated scene from the Neon District (rain, neon signs, parallax city) with the player character running in a loop.

- Game title "SPIKE RUNNER" in a large, stylized pixel font with neon glow
- "TAP TO START" or "PRESS SPACE" prompt, pulsing gently
- High score display
- A simple settings icon (gear) for toggling sound and optional visual effects (scanlines)

### Death / Game Over Screen

On death, the screen pauses (freeze frame), the shatter animation plays, and the game over overlay slides in from the top with an elastic ease.

- "GAME OVER" header
- Final distance, score, and high score (with "NEW!" indicator if beaten)
- Zone reached (e.g., "Reached: Corporate Skyline")
- "TAP TO RETRY" / "PRESS SPACE" prompt
- The background remains visible (frozen, with a slight dark overlay) to maintain visual context

---

## 11. Audio Design

Audio is essential to game feel. All sounds should be synthesized or chip-tune-style to match the pixel art aesthetic.

### Music

A looping synthwave / chiptune track that evolves with the zones. The base track has a steady, driving rhythm that matches comfortable running pace. As zones transition, the musical layers shift — different synth patches, filter sweeps, key changes — to match the zone's mood. The tempo remains constant to avoid disrupting the player's rhythm.

### Sound Effects

- **Footsteps**: Rapid, light taps that vary slightly per zone surface (wet splashes in Neon District, metallic clinks in Industrial, clean taps in Corporate)
- **Jump**: A short upward pitch sweep — bright and satisfying
- **Landing**: A soft thud with a bass component, combined with the dust/spark sound
- **Phase Shift**: A glitchy digital "warp" sound — a quick bitcrushed sweep or buffer-glitch effect. Distinct and immediately recognizable.
- **Cooldown Ready**: A subtle "ping" when phase shift becomes available again
- **Near Miss**: A quick, high-pitched "whoosh" — the sound of narrowly avoiding danger
- **Death**: A digital shatter/crash — bitcrushed impact followed by tinkling pixel debris
- **Collectible Pickup**: A bright, ascending chime (3–4 note arpeggio)
- **Milestone**: A triumphant synth stab or chord hit that punctuates the zone transition
- **EMP Zone Entry/Exit**: A low rumble on entry (shift disabled), a release "power-up" sound on exit

---

## 12. Scoring & Progression

### Distance Score

The primary score is based on distance survived, displayed in meters. Score increments continuously as the player runs. Higher speed = faster score accumulation.

### Multiplier

A score multiplier builds over time and increases when the player performs skillful actions:

- **Near Miss**: +0.1× multiplier per near miss
- **Phase Shift Dodge**: +0.05× multiplier when shifting through an obstacle that would have killed the player on the previous layer
- **Chain Jumps**: Landing and immediately jumping without running on ground for 3+ consecutive jumps adds a small multiplier bonus

The multiplier resets to 1.0× on death. The current multiplier is displayed on the HUD.

### Collectibles

Small glowing tokens are placed throughout chunks (not in every chunk, but frequently enough to be a regular reward). Collecting them adds a flat score bonus. They are placed in slightly risky positions — near obstacles, on the opposite layer from the safe path — rewarding skilled play.

### High Score

The player's best distance and best score are persisted locally. The game over screen shows whether the player achieved a new personal best.

### Milestone Markers

Every 1000m, a visual and audio milestone occurs (zone transition). This serves as implicit progression feedback — the player can gauge their improvement by which zone they consistently reach.

---

## 13. Technical Structure

### File Organization

The game should be split into three files:

- **index.html**: The page structure, canvas element, and script/style includes. Minimal markup.
- **style.css**: All visual styling for non-canvas elements (title screen, HUD overlays, game over screen, buttons, fonts). Canvas rendering is handled in JavaScript.
- **game.js**: All game logic, rendering, physics, input handling, pattern sequencing, and audio.

### Rendering

The game renders to an HTML5 Canvas element. The internal resolution should be low (matching the pixel art scale — e.g., 384×216 or similar 16:9 pixel resolution) and scaled up to fill the browser window with nearest-neighbor interpolation to preserve crisp pixel edges. Post-processing effects (bloom, chromatic aberration, vignette) can be applied via a secondary canvas or WebGL layer composited on top.

### Input

The game must support both keyboard and touch input simultaneously. Input events should be processed at the start of each game frame and converted into a simple action state (isJumpPressed, isShiftPressed). Input latency must be minimal — any perceptible delay between pressing a button and seeing the character react will undermine the movement feel.

### Performance

The game should target a consistent 60fps on mid-range hardware. Particle count, parallax layer complexity, and post-processing intensity should be budgeted accordingly. If frame drops occur, particle count should be the first thing reduced.

---

## 14. Appendix: Visual Reference Notes

These notes are for the implementer to understand the intended visual quality bar.

### What "Good Pixel Art" Means Here

- **Shading is not optional.** Every surface has a light direction. Sprites have highlight edges and shadow edges. Flat, single-color fills are unacceptable for any element larger than 4×4 pixels.
- **Dithering is used intentionally.** For gradients in skies, atmospheric haze, and lighting falloff, dithering (checkerboard or ordered patterns) creates smooth-looking transitions within the limited palette. It should not be applied everywhere — only where smooth gradients are needed.
- **Sub-pixel animation** is encouraged for the player character. Subtle color shifts between frames can create the illusion of movement finer than the pixel grid allows.
- **Environmental tiles have variation.** The ground is not one repeated tile. There should be 3–4 variants that are randomly selected to avoid visible repetition. Edge tiles where ground meets sky/pit have specific shaped pieces, not hard-cut squares.
- **Background layers tell a story.** The parallax backgrounds are not abstract gradients — they depict a city. Buildings have windows (some lit), rooftops have silhouettes of antennas and vents, the sky has atmospheric depth. Even though these layers are distant and low-detail, they must feel like a coherent environment.
- **Color counts are deliberate.** Each zone's palette is chosen as a unit — colors are selected to harmonize. No zone should look like random colors were thrown together. Reference established pixel art palettes (e.g., ENDESGA-32, Resurrect-64) as starting points, then customize for each zone's mood.

### Screen Composition Target

At any given frame, the player should see:

- The gameplay lane (active layer) front and center, crisp and clear
- The inactive layer visible but recessed behind
- 2–3 parallax background layers adding depth
- Ambient particles appropriate to the zone
- The player character, highly visible, with trail
- HUD elements that do not intrude on the play space
- Occasional foreground framing elements

The result should look like a single, cohesive scene — not layered cutouts. Every element's brightness, saturation, and detail level is calibrated to its depth in the scene. Close things are bright and detailed. Far things are dim and simple. The player's eye is naturally drawn to the gameplay lane.
