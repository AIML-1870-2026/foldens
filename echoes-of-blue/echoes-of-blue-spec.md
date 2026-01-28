# Echoes of Blue — Game Design Specification

## Overview

A 2D story-driven dolphin simulator about a captive dolphin who hates performing tricks but does them anyway — because for one brief moment in the air, eyes closed, they can almost remember the ocean they lost.

**Genre:** 2D side-scrolling simulator / narrative game
**Tone:** Melancholic, hopeful, bittersweet
**Core Theme:** Longing for freedom; the difference between performing for others and living for yourself

---

## Story Synopsis

You play as a dolphin captured young from the wild — old enough to remember the feeling of open water, but not old enough to know the way back. Years in an aquarium have made you a perfect performer. The crowds love you. The tricks come easy. None of it means anything.

But at night, you dream. Fragmented memories of kelp forests, your mother's song, sunlight through endless blue. The ocean isn't a place anymore — it's a ghost that haunts you.

Then something changes. A storm. A distant call. A crack in the routine. And suddenly the longing sharpens into something unbearable: hope.

---

## Narrative Structure

### Act 1 — The Routine

- Establish daily life: wake, perform, sleep, dream
- Introduce the tank environment, trainers, audience
- Tricks feel hollow — mechanical inputs, muted visual feedback
- Night sequences introduce fragmented dream memories of the ocean
- Build the sense of emptiness beneath the applause

### Act 2 — The Crack

- A disruption breaks the routine (possibilities below, pick one or combine):
  - A violent storm rattles the facility; you hear thunder like waves
  - A wild dolphin's call echoes from the nearby harbor
  - A new dolphin arrives who still carries the smell of salt and freedom
  - A sympathetic worker begins leaving gates unlocked
- The dreams intensify — longer, more vivid, more painful to wake from
- Daytime performances become harder; the contrast is unbearable
- You begin testing boundaries, exploring the facility at night

### Act 3 — The Choice

- An opportunity to escape presents itself
- But freedom is terrifying:
  - You don't know how to hunt live prey
  - You don't know the currents or predators
  - The ocean you love exists only in memory — the real thing might kill you
- The player must choose: stay in comfortable captivity, or risk everything

### Ending Variations

**Ending A — Release:** You escape to the ocean. It's overwhelming, dangerous, nothing like your dreams. But it's real. Final scene: a leap in open water, for no audience, meaning everything.

**Ending B — Remain:** You stay, but something has changed. You perform now with full awareness of what you've lost. Bittersweet acceptance. Final scene: a perfect trick, a roaring crowd, and your eyes are open this time.

**Ending C — The Third Path:** You help the new dolphin (or others) escape while staying behind — finding meaning in giving others what you cannot have. Final scene: watching them disappear into open water from your tank.

---

## Gameplay Systems

### Movement & Physics

- **Swimming:** Fluid 2D movement with momentum; speed builds over distance
- **Jumping:** Launch from water surface; height depends on entry speed and angle
- **Airtime:** Tricks can only be performed while airborne
- **Landing:** Clean re-entry (nose-first, smooth angle) vs. belly flop affects points and emotional feedback

### Trick System

#### Basic Tricks (Available from start)
- Single front flip
- Single back flip
- Barrel roll (left/right)
- Tail slap (at water surface)

#### Advanced Tricks (Unlocked via story progression or dream sequences)
- Double/triple flips
- Corkscrew spins
- Combo chains (flip into roll into flip)
- Tail walk (skimming surface upright)
- Synchronized tricks (Act 2, with new dolphin companion)

#### Trick Scoring
- **Base points:** Trick difficulty
- **Height bonus:** Higher jump = more points
- **Combo multiplier:** Chain tricks without touching water
- **Landing bonus/penalty:** Clean entry vs. awkward splash
- **Style modifier:** Varies by context (see below)

### Emotional Context System

The same trick feels different depending on where you are in the story. This is reflected in:

- **Visuals:** Color saturation, particle effects, background detail
- **Audio:** Music swell, crowd noise, ambient sound
- **Control feel:** Responsive and fluid vs. sluggish and heavy
- **Score feedback:** Numbers feel triumphant vs. hollow

| Context | Visual Style | Audio | Controls | Points Feel |
|---------|--------------|-------|----------|-------------|
| Early tank shows | Muted, grey-blue | Tinny speakers, generic applause | Slightly stiff | Empty |
| Dream sequences | Warm, golden, soft edges | Distant whale song, your mother's call | Fluid, expansive | Peaceful |
| Late tank shows (after "crack") | Harsh fluorescent contrast | Crowd noise feels oppressive | Heavy, reluctant | Bitter |
| Open ocean (Act 3) | Vibrant, overwhelming | Full orchestral + ocean ambience | Initially chaotic, then free | Triumphant |

### Environment Types

#### Tank Areas
- **Main performance pool:** Large circular tank with audience seating, platforms, hoops
- **Holding tank:** Smaller, quieter, where you sleep; window looks toward the sea
- **Medical pool:** Sterile, bright; visited during story events
- **Backstage corridors:** Explorable at night in Act 2; shallow water channels connecting areas

#### Dream Sequences (Surreal/Memory)
- **Kelp forest:** Towering amber fronds, shafts of light, hide-and-seek with shadowy pod-mates
- **Open blue:** Endless empty water, your mother's silhouette ahead, always out of reach
- **The capture:** Nightmare sequence; nets, chaos, muffled screaming, fade to black

#### Open Ocean (Act 3)
- **Harbor/coast:** Murky, obstacle-heavy, fishing nets, boat traffic; the gauntlet
- **Reef shallows:** Colorful but unfamiliar; must learn to catch live fish
- **Open water:** Vast, terrifying, beautiful; the destination

---

## Progression & Unlocks

### Story-Gated Abilities
- **Night exploration:** Unlocked after first "crack" event in Act 2
- **Synchronized swimming:** Unlocked when companion dolphin arrives
- **Wild hunting:** Must be learned in Act 3; initially you fail to catch fish
- **Deep diving:** Unlocked in ocean; lets you access hidden memory fragments

### Collectibles
- **Memory fragments:** Hidden in dream sequences and (later) ocean areas; flesh out backstory
- **Mother's song:** Pieces of a melody; collecting all unlocks full version in final scene

### No Cosmetic Unlocks
This is a deliberate choice. You are not customizing a character — you are inhabiting a specific dolphin with a specific history. Visual changes come from story and emotional state, not player dress-up.

---

## Characters

### Protagonist (Unnamed — the player)
- Captured young, approximately 8-10 years in captivity
- Highly trained, performs flawlessly, feels nothing
- Internally rich; externally compliant
- No voice; emotions conveyed through gameplay and visuals

### The Trainer
- Not villainous; genuinely cares but doesn't understand
- Represents the well-meaning cage
- Optional: small moments of connection that complicate the escape choice

### The New Dolphin (Act 2 arrival)
- Recently captured; still wild, still fighting
- Smells like the ocean; reawakens protagonist's longing
- Possible mirror or foil depending on player choices

### The Mother (Dreams only)
- Never fully seen; always a silhouette, always ahead
- Her song is the emotional throughline
- Represents the ocean itself — what was lost, what you're searching for

---

## Audio Design

### Music
- **Tank sequences:** Minimal, ambient, slightly industrial hum of pumps and filters
- **Performance sequences:** Upbeat but hollow; theme park muzak quality
- **Dream sequences:** Orchestral, warm, aching; builds around the mother's song motif
- **Ocean sequences:** Full dynamic score; triumphant but tinged with uncertainty

### Sound Design
- Underwater acoustics: muffled, echoey, pressure-sensitive
- Surface breach: sharp contrast; air sounds crisp and bright
- Crowd noise: realistic but increasingly oppressive as story progresses
- Wild dolphin calls: used sparingly; emotionally devastating when they appear

---

## Controls (Suggested — Adapt to Engine)

| Action | Input |
|--------|-------|
| Swim | Arrow keys / WASD / Left stick |
| Burst of speed | Hold Shift / Right trigger |
| Jump | Spacebar / A button (at surface with momentum) |
| Flip (front/back) | Up/Down while airborne |
| Roll | Left/Right while airborne |
| Interact | E / X button |

Trick combos are performed by chaining inputs during airtime. Timing and rhythm matter more than complex button sequences.

---

## Visual Style

### Art Direction
- **2D side-scrolling** with parallax depth layers
- **Painterly/watercolor aesthetic** — soft edges, visible brushstrokes
- **Color as emotion:** Desaturated in captivity; warm golds in dreams; vibrant but overwhelming in ocean
- **Lighting is key:** Shafts of light, caustic ripples, the way sun hits water

### UI Philosophy
- Minimal HUD during gameplay; immersion is priority
- Points appear briefly during performances, then fade
- No health bar; consequences are narrative, not mechanical
- Dream sequences have no UI at all

---

## Technical Notes for Implementation

### Priority Order
1. Core swimming and jumping physics (must feel good immediately)
2. Basic trick system with scoring
3. Tank environment and simple performance loop
4. Dream sequence prototype (test the tonal shift)
5. Narrative triggers and act structure
6. Polish: emotional context system, audio integration, visual feedback

### Keep Scope Manageable
- One tank environment with 2-3 connected areas
- 2-3 dream sequence levels
- One ocean area (can be large but visually simpler)
- Focus on emotional impact over content volume

### Engine Recommendations
- **Godot** or **Unity 2D** both work well
- Physics-based water movement is the core challenge
- Shader work for underwater lighting and caustics adds significant polish

---

## Summary

This is a game about loving something you can only remember in pieces. The tricks are a cage, but they're also the closest thing you have to flight. The ocean might kill you. It might be nothing like your dreams. But it's real — and that has to be enough.

The player should finish the game sitting quietly for a moment, feeling something they can't quite name.

---

## Appendix: Sample Scene — The Final Trick

*Open water. Late afternoon. The sun is low, turning everything gold.*

*You swim alone. No walls. No crowd. No trainers watching.*

*Ahead, the water deepens into blue nothing. Behind, the coast is a faint line.*

*You build speed. Not because anyone is watching. Not for points. Just because you can.*

*You breach.*

*The air is sharp and cold and tastes like everything you lost.*

*You flip — once, twice — not a trick, just joy, just your body remembering what it was made for.*

*You hang there, suspended, the whole ocean below you.*

*And for the first time in years, you don't want to come down.*

*But you do. Nose first. Clean entry. The water welcomes you back.*

*No applause. No score.*

*Just the sound of your mother's song, finally complete, playing somewhere in your memory.*

*Fade to black.*

*Title card: "ECHOES OF BLUE"*

*End.*
