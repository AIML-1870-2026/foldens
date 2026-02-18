# Snake: Dungeon Edition
## Complete Design Specification

**Document Purpose:** This specification captures all design decisions for "Snake: Dungeon Edition" - a strategic dungeon-crawler twist on the classic Snake game. Hand this document to Claude Code for implementation.

**Tech Stack:** Single HTML file with embedded CSS and JavaScript. No external dependencies except Google Fonts.

---

# Table of Contents

1. [Game Identity](#1-game-identity)
2. [Visual Design](#2-visual-design)
3. [Animation & Polish](#3-animation--polish)
4. [Core Mechanics](#4-core-mechanics)
5. [Power-up System](#5-power-up-system)
6. [Hazard System](#6-hazard-system)
7. [Environment Features](#7-environment-features)
8. [Scoring & Feedback](#8-scoring--feedback)
9. [Game Modes](#9-game-modes)
10. [Progression & Replayability](#10-progression--replayability)
11. [Audio Design](#11-audio-design)
12. [Controls & Input](#12-controls--input)
13. [User Interface](#13-user-interface)
14. [Accessibility](#14-accessibility)
15. [Technical Requirements](#15-technical-requirements)

---

# 1. Game Identity

## 1.1 Core Concept

A dungeon-crawling snake game where players navigate through atmospheric dungeon rooms, collecting treasure while avoiding increasingly dangerous hazards. Combines classic snake mechanics with roguelike dungeon exploration and puzzle elements.

## 1.2 Target Experience

| Aspect | Design Choice |
|--------|---------------|
| **Primary Mood** | Strategic & thoughtful |
| **Secondary Mood** | Chaotic fun |
| **Session Length** | 5-10 minutes (focused engagement) |
| **Difficulty Curve** | Gradual escalation within each run |

## 1.3 Target Audience

- Competitive players chasing high scores
- Achievement hunters who love unlocking content
- Personal enjoyment / hobby project showcase

## 1.4 Unique Selling Points

1. **Room-based exploration** - Navigate between dungeon rooms through doors and tunnels
2. **Limited visibility** - Flashlight mechanic creates tension and atmosphere
3. **Strategic power-ups** - Meaningful choices that affect survival
4. **Dual game modes** - Survival for endless challenge, Puzzle for curated experiences

---

# 2. Visual Design

## 2.1 Aesthetic Direction

**Primary Theme:** Pixel-art dungeon with hand-drawn organic charm

The visual style blends multiple aesthetics into a cohesive dungeon experience:

| Influence | How It Manifests |
|-----------|------------------|
| **Retro Pixel Art** | Chunky, deliberate pixels; limited color palette per element |
| **Organic Nature** | Moss on stone walls, vines creeping through cracks, earthy textures |
| **Hand-drawn Sketch** | Slightly imperfect lines, warmth in details, charming imperfections |
| **Atmospheric Dungeon** | Torchlight glow, ancient stone, mysterious shadows |

## 2.2 Color Palette

### Primary Dungeon Colors
- **Stone Dark:** Deep blue-gray for shadows and depth
- **Stone Mid:** Medium gray with slight purple undertone for walls
- **Stone Light:** Lighter gray for highlighted stone surfaces

### Organic Accent Colors
- **Moss Green:** Muted forest green for vegetation
- **Vine Green:** Brighter green for living vines
- **Moss Dark:** Deep green for shadowed moss

### Light and Fire
- **Torch Orange:** Warm amber for primary light
- **Torch Yellow:** Bright yellow for flame cores
- **Torch Glow:** Semi-transparent orange for light halos

### Snake Energy Colors
- **Snake Primary:** Soft cyan-blue
- **Snake Glow:** Lighter cyan for energy effects
- **Snake Energy:** Near-white cyan for brightest points

### Treasure and Pickups
- **Gold:** Classic gold for coins and valuable items
- **Gem Red:** Ruby red
- **Gem Blue:** Sapphire blue
- **Gem Green:** Emerald green
- **Gem Purple:** Amethyst purple

### Hazard Colors
- **Poison Purple:** Deep violet for poisonous elements
- **Bomb Red:** Dark crimson for explosives
- **Danger Orange:** Warning orange for hazard indicators

### UI Colors
- **UI Background:** Near-black with high transparency
- **UI Border:** Muted purple-gray
- **UI Text:** Off-white with slight warmth
- **UI Accent:** Matches snake primary color

### Background
- **Void Black:** Pure darkness for unexplored areas
- **Floor Dark:** Very dark blue-gray for dungeon floor
- **Floor Pattern:** Slightly lighter for floor tile patterns

## 2.3 Typography

| Use Case | Font Choice | Style Notes |
|----------|-------------|-------------|
| **Titles & Headers** | "Press Start 2P" | Classic pixel font, all caps |
| **Scores & Numbers** | "Press Start 2P" | Prominent display |
| **Body Text & UI** | "VT323" | Readable pixel font, good for menus |
| **Tooltips** | "VT323" | Smaller size, high readability |

Both fonts available via Google Fonts.

## 2.4 Snake Appearance

### Structure
- **Movement Style:** Grid-locked snapping for gameplay logic
- **Visual Style:** Smooth with segment wobble physics for rendering
- **Head:** Slightly larger than body segments, two small pixel eyes
- **Body:** Classic segmented blocks with color gradient (brighter near head, fading toward tail)
- **Energy Trail:** Glowing particle effect trailing behind the snake

### Wobble Physics
Each body segment has slight lag following the one ahead, creating a natural slithering motion. Segments wobble perpendicular to movement direction with sinusoidal offset.

## 2.5 Dungeon Tiles

### Floor Tiles
- Dark stone base color
- Subtle crack patterns (hand-drawn feel)
- Occasional moss patches in corners
- Very slight color variation between tiles

### Wall Tiles
- Thicker, more prominent than floor
- Pixel shading to suggest 3D depth
- Occasional moss/vine growth
- Torch sconces at intervals (animated flicker)

### Door/Tunnel Tiles
- Visible gaps in walls
- Darker interior suggesting passage
- Subtle archway framing
- May have torch nearby for visibility

### Decorative Elements
- Scattered bones on floor (small, unobtrusive)
- Small rocks and rubble
- Cobwebs in corners
- Dripping water stains near some walls

## 2.6 Food & Collectibles

Four distinct collectible types with clear visual hierarchy:

| Type | Appearance | Rarity | Visual Effect |
|------|------------|--------|---------------|
| **Fruit** | Glowing apple/berry shape | Common | Gentle pulse animation |
| **Gems** | Faceted crystal (various colors) | Uncommon | Sparkle particles |
| **Energy Orb** | Floating sphere, matches snake color | Uncommon | Rotating glow |
| **Golden Skull** | Small skull with gold tint | Rare | Special golden glow, slow rotation |

All collectibles should have:
- Clear silhouette distinct from hazards
- Pulsing/breathing animation
- Subtle glow effect
- Particle trail when collected

## 2.7 Atmospheric Effects

### Ambient Particles
- Dust motes floating slowly across screen
- Occasional ember/spark near torches
- Dripping water particles near walls (rare)

### Lighting Effects
- Torches on walls with animated flicker
- Light radius around torches affects nearby tiles
- Snake head emits subtle glow

### Vignette
- Screen edges darkened
- Creates focus on center of action
- Intensifies during low health or danger

---

# 3. Animation & Polish

## 3.1 Snake Movement Animation

| Aspect | Implementation |
|--------|----------------|
| **Grid Movement** | Gameplay uses discrete grid positions |
| **Visual Interpolation** | Rendering smoothly transitions between positions |
| **Segment Following** | Each segment follows previous with slight delay |
| **Wobble Effect** | Sinusoidal offset perpendicular to movement |
| **Head Anticipation** | Head slightly "leans" into turns |

## 3.2 Visual Effects Checklist

All of the following effects should be implemented:

### Impact Effects
- ✅ **Screen Shake** - On death, bomb explosions, major impacts
- ✅ **Particle Bursts** - When eating food, collecting power-ups
- ✅ **Score Popups** - "+10" floating numbers when scoring
- ✅ **Flash Effects** - Brief white flash on item collection

### Ambient Effects
- ✅ **Pulsing Food** - Items glow/breathe to attract attention
- ✅ **Energy Trail** - Fading particles behind snake
- ✅ **Combo Meter** - Visual indicator of current multiplier
- ✅ **Reactive Background** - Subtle response to gameplay events

### NOT included (to keep scope manageable)
- ❌ Head "leans" into turns (anticipation)
- ❌ Trail/afterimage effect (using particles instead)

## 3.3 Death Animation Sequence

Death should feel dramatic and memorable. Use a combination approach:

1. **Slow-Motion Trigger** - Time slows to 25% speed for ~0.5 seconds
2. **Screen Shake** - Medium intensity shake begins
3. **Explosion** - Snake fragments into particles
4. **Particle Scatter** - Segments break apart and fade
5. **Screen Flash** - Brief white flash
6. **Fade to Game Over** - Smooth transition

Total death sequence: ~1.5 seconds

## 3.4 Post-Processing Effects

| Effect | Purpose | Intensity |
|--------|---------|-----------|
| **Bloom/Glow** | Make light sources and energy pop | Moderate |
| **Vignette** | Focus attention, add atmosphere | Subtle to moderate |
| **CRT Scanlines** | NOT included (decided against) | - |
| **Chromatic Aberration** | NOT included (decided against) | - |

---

# 4. Core Mechanics

## 4.1 Movement System

### Grid-Based Logic
- Game world is a grid of cells
- Snake occupies discrete cell positions
- Movement happens in cardinal directions only (up, down, left, right)
- One cell per game tick

### Visual Smoothing
- Rendering interpolates between grid positions
- Creates illusion of smooth movement
- Body segments have wobble physics

### Input Handling
- Support both Arrow Keys and WASD
- Buffer up to 2 inputs ahead for responsive turning
- Prevent 180-degree instant reversals

### Tick Rate
- Base tick rate: ~150ms between moves
- Increases (faster) as difficulty progresses
- Power-ups can modify tick rate

## 4.2 Arena Boundaries

### Wall Behavior
- Standard dungeon walls kill on contact (unless ghost mode active)
- Walls form the dungeon room structure

### Room Transitions (Doors/Tunnels)
- Gaps in walls serve as doors
- Moving through a door transitions to opposite side of room
- Creates wrap-around effect through specific passages
- NOT general wrap-around (only through designated doors)

### Door Placement
- Multiple doors per room (typically 2-4)
- Doors on opposite walls connect to each other
- Visually distinct from solid walls (darker gap, archway frame)

## 4.3 Collision Rules

### Lethal Collisions (cause death)
- Solid walls (unless ghost mode)
- Snake's own body (unless ghost mode)
- Static obstacles
- Moving obstacles
- Bomb explosions (radius damage)
- Lava/danger terrain

### Non-Lethal Collisions
- Food (triggers collection)
- Power-ups (triggers collection)
- Poison food (triggers negative effect, doesn't kill)
- Doors (triggers room transition)

### Shield Interaction
- Shield absorbs ONE lethal collision
- Visual/audio feedback when shield breaks
- Snake continues after shield hit

### Ghost Mode Interaction
- Pass through walls freely
- Pass through own body
- Still collect food and power-ups
- WARNING: If ghost ends while inside wall = death

## 4.4 Growth Mechanics

### On Eating Food
1. Snake grows longer (adds segments to tail)
2. Score increases (based on food type and combo)
3. Satisfying visual effect (particles, flash)
4. Sound effect plays
5. Combo multiplier updates
6. Ability meter fills

### Growth Amount
- Standard fruit: +1 segment
- Gems: +1 segment
- Energy orbs: +2 segments
- Golden skull: +3 segments

---

# 5. Power-up System

## 5.1 Overview

Power-ups spawn periodically on the dungeon floor. Maximum 2 uncollected power-ups at a time. Power-ups have distinct visual appearance and pulse/glow to attract attention.

## 5.2 Power-up Roster

### 🐢 Slow Motion
| Property | Value |
|----------|-------|
| **Effect** | Everything moves at half speed |
| **Duration** | 5 seconds |
| **Visual** | Blue tint, time distortion effect |
| **Strategic Use** | Navigate tight spaces, react to hazards |

### 👻 Ghost Mode
| Property | Value |
|----------|-------|
| **Effect** | Pass through walls and self |
| **Duration** | 4 seconds |
| **Visual** | Snake becomes translucent, spectral particles |
| **Strategic Use** | Escape traps, shortcuts through maze |
| **Warning** | Death if inside wall when effect ends |

### 🛡️ Shield
| Property | Value |
|----------|-------|
| **Effect** | Survive one collision |
| **Duration** | Until hit |
| **Visual** | Golden aura around snake head |
| **Strategic Use** | Insurance for risky maneuvers |

### ⏱️ Time Freeze
| Property | Value |
|----------|-------|
| **Effect** | All hazards stop moving |
| **Duration** | 3 seconds |
| **Visual** | Hazards get blue tint, frozen particles |
| **Strategic Use** | Navigate past moving obstacles |

### ✂️ Trim
| Property | Value |
|----------|-------|
| **Effect** | Remove 3 tail segments instantly |
| **Duration** | Instant |
| **Visual** | Sparkle effect at cut point |
| **Strategic Use** | Emergency length reduction, tight spaces |
| **Note** | Minimum snake length: 3 segments |

## 5.3 Power-up Spawning

- **Spawn Interval:** Every 15 seconds
- **Max on Field:** 2 power-ups
- **Spawn Location:** Random floor tile, minimum distance from snake
- **Despawn:** Power-ups remain until collected (no timeout)

## 5.4 Power-up Visuals

Each power-up should have:
- Distinct color matching its theme
- Emoji icon displayed on pickup
- Circular background with glow
- Pulsing animation (scale oscillation)
- Particle effect when collected
- HUD indicator when active (with timer if applicable)

---

# 6. Hazard System

## 6.1 Overview

Hazards create danger and strategic challenge. In Survival mode, hazards spawn with increasing frequency. In Puzzle mode, hazards are pre-placed.

## 6.2 Hazard Roster

### 💀 Poison Food
| Property | Value |
|----------|-------|
| **Appearance** | Similar to regular food but purple tint, skull icon |
| **Behavior** | Static, waits to be eaten |
| **On Contact** | Reverses player controls for 3 seconds |
| **Lethal** | No |
| **Strategic Element** | Punishes rushed/careless eating |

### 💣 Bomb
| Property | Value |
|----------|-------|
| **Appearance** | Classic bomb shape, countdown number visible |
| **Behavior** | Countdown from 5 seconds, then explodes |
| **Explosion Radius** | 2 cells in all directions |
| **On Contact (before explosion)** | Instant death |
| **On Explosion (in radius)** | Instant death |
| **Lethal** | Yes |
| **Strategic Element** | Area denial, time pressure |

### 🧱 Static Obstacle
| Property | Value |
|----------|-------|
| **Appearance** | Stone pillar, slightly different from walls |
| **Behavior** | Stationary, permanent |
| **On Contact** | Instant death |
| **Lethal** | Yes |
| **Strategic Element** | Navigation challenge, reduces safe space |

### 🚧 Moving Obstacle
| Property | Value |
|----------|-------|
| **Appearance** | Rolling boulder or patrolling enemy |
| **Behavior** | Moves along set path (horizontal or vertical) |
| **Movement Pattern** | Back and forth within range |
| **Move Speed** | One cell per 500ms |
| **On Contact** | Instant death |
| **Lethal** | Yes |
| **Strategic Element** | Timing challenge, dynamic danger |
| **Time Freeze Interaction** | Stops moving during freeze |

## 6.3 Hazard Spawning (Survival Mode)

### Spawn Frequency Progression

| Time Elapsed | Spawn Interval |
|--------------|----------------|
| 0-30 seconds | Every 10 seconds |
| 30-60 seconds | Every 8 seconds |
| 60-90 seconds | Every 6 seconds |
| 90-120 seconds | Every 5 seconds |
| 120-180 seconds | Every 4 seconds |
| 180+ seconds | Every 3 seconds |

### Spawn Weights

| Hazard Type | Relative Weight |
|-------------|-----------------|
| Poison Food | 30% |
| Bomb | 25% |
| Static Obstacle | 25% |
| Moving Obstacle | 20% |

## 6.4 Hazard Visuals

Each hazard should have:
- Clearly dangerous appearance (distinct from collectibles)
- Warning colors (purple, red, orange)
- Animation appropriate to type
- Clear hitbox indication
- Bomb should show countdown number

---

# 7. Environment Features

## 7.1 Maze Walls

### Behavior
- Additional walls spawn progressively during Survival mode
- Create corridors and reduce safe navigation space
- Pre-designed in Puzzle mode levels

### Spawn Pattern
- Small wall sections (2-4 blocks)
- L-shaped, T-shaped, or straight lines
- Random rotation
- Minimum distance from snake when spawning
- Never block all paths (always leave escape routes)

### Progression

| Time Elapsed | Wall Spawn Chance |
|--------------|-------------------|
| 0-30 seconds | 0% |
| 30-60 seconds | 10% per spawn tick |
| 60-90 seconds | 20% per spawn tick |
| 90-120 seconds | 30% per spawn tick |
| 120+ seconds | 40% per spawn tick |

## 7.2 Limited Visibility (Flashlight)

### Core Mechanic
- Player can only see area around snake's head
- Rest of dungeon is obscured by darkness
- Creates tension and surprise

### Visibility Radius
- **Base Radius:** 6 grid cells from snake head
- **Falloff:** Gradual fade at edges (not hard cutoff)
- **Light Quality:** Warm torchlight tint

### Visual Implementation
- Dark overlay covers entire screen
- Circular gradient cutout centered on snake head
- Slight flicker effect (simulating torchlight)
- Edge of visibility has soft gradient

### What's Visible
- Everything within radius is fully lit
- Items just outside radius are dimly visible
- Far areas completely black
- Collected items "ping" with light even in darkness

## 7.3 Terrain Zones

### Zone Types

#### Mud Zone
| Property | Value |
|----------|-------|
| **Visual** | Brown/tan overlay on floor tiles |
| **Effect** | Snake moves at 50% speed |
| **Strategic Use** | Can be helpful for control, or trap |

#### Ice Zone
| Property | Value |
|----------|-------|
| **Visual** | Light blue/white overlay, sparkle effect |
| **Effect** | Snake moves at 150% speed |
| **Secondary Effect** | Momentum - harder to turn |
| **Strategic Use** | Fast travel, but dangerous |

#### Danger Zone (Lava Edge)
| Property | Value |
|----------|-------|
| **Visual** | Red/orange glow, ember particles |
| **Effect** | Instant death on contact |
| **Strategic Use** | High-risk boundaries |

### Zone Spawning
- Zones are rectangular areas (various sizes)
- Spawn at random in Survival mode (rare)
- Pre-placed in Puzzle mode
- Never cover doors or essential paths

## 7.4 Bonus Rooms

### Trigger
- Random chance after 60 seconds in Survival mode
- Portal appears on dungeon floor

### Mechanics
1. Portal spawns at random location
2. Snake enters portal
3. Transported to small bonus room
4. Bonus room filled with extra treasure
5. 10-second timer to collect
6. Auto-return to main dungeon when timer expires

### Bonus Room Contents
- 5-10 food items
- 1-2 gems
- No hazards
- Small room size (easy collection)

### Visual Distinction
- Portal: Swirling purple/gold energy
- Bonus room: Golden-tinted lighting
- Timer display: Prominent countdown

---

# 8. Scoring & Feedback

## 8.1 Scoring System

### Base Points

| Collectible | Base Points |
|-------------|-------------|
| Fruit | 10 |
| Gem | 50 |
| Energy Orb | 25 |
| Golden Skull | 100 |

### Combo Multiplier

Combo builds when eating food in quick succession:

| Combo Level | Multiplier | Requirement |
|-------------|------------|-------------|
| None | 1.0x | Default |
| x2 | 2.0x | 2 items within 3 seconds |
| x3 | 3.0x | 3 items within 3 seconds |
| x4 | 4.0x | 4 items within 3 seconds |
| x5 (MAX) | 5.0x | 5+ items within 3 seconds |

Combo resets if no food eaten for 3 seconds.

### Time Bonus (Survival Mode)
- +1 point per second survived
- Displayed separately as "Time Bonus"

### Final Score Calculation
```
Final Score = (Food Points × Combo) + Time Bonus + Achievement Bonuses
```

## 8.2 Score Display

### During Gameplay (HUD)

Position: Top-left corner, always visible

Display elements:
- **Current Score:** Large, prominent
- **High Score:** Smaller, below current score
- **Snake Length:** Icon + number
- **Current Speed/Level:** Difficulty indicator
- **Power-up Timers:** Icons with countdown bars

### Score Popup Animation
- When points earned, "+XX" floats upward from collection point
- Combo multiplier shown: "+50 x3!"
- Gold color for standard, special color for combos
- Fade out over 1 second while rising

## 8.3 Combo Feedback

### Visual
- Combo meter bar fills as combo builds
- Meter pulses when at max
- Color intensifies with higher combo
- Screen edge glow at high combos

### Audio
- Escalating pitch for consecutive collections
- Special sound at max combo
- "Ding" sounds increase in excitement

---

# 9. Game Modes

## 9.1 Mode Overview

Two distinct game modes with different goals and mechanics:

| Mode | Primary Goal | Hazard Behavior | Best For |
|------|--------------|-----------------|----------|
| **Survival** | Survive as long as possible | Spawn increasingly | Score chasing, replayability |
| **Puzzle** | Complete all level objectives | Pre-placed, static | Strategic thinking, progression |

## 9.2 Survival Mode

### Core Loop
1. Start in dungeon room
2. Collect food to grow and score
3. Avoid hazards (spawn over time)
4. Navigate maze walls (appear over time)
5. Use power-ups strategically
6. Survive as long as possible

### Features Active
- ✅ Limited visibility (flashlight)
- ✅ Increasing hazard spawns
- ✅ Progressive maze walls
- ✅ Terrain zones (random spawns)
- ✅ Bonus rooms (chance after 60s)
- ✅ All power-ups available
- ✅ Combo scoring

### Difficulty Progression

| Time | Tick Rate | Hazard Interval | Wall Chance |
|------|-----------|-----------------|-------------|
| 0s | 150ms | 10s | 0% |
| 30s | 140ms | 8s | 10% |
| 60s | 130ms | 6s | 20% |
| 90s | 120ms | 5s | 30% |
| 120s | 110ms | 4s | 40% |
| 180s | 100ms | 3s | 50% |
| 240s | 90ms | 2.5s | 60% |

### Win/Lose Conditions
- **Lose:** Any lethal collision
- **Win:** N/A (endless, score-based)

## 9.3 Puzzle Mode

### Core Loop
1. Load pre-designed level
2. Study the layout
3. Collect all required items
4. Avoid pre-placed hazards
5. Complete within par time/moves for bonus
6. Advance to next level

### Level Structure

Each puzzle level defines:
- Fixed dungeon layout (walls, doors)
- Snake starting position and direction
- Food/gem placement
- Hazard placement
- Collection goals (e.g., "Collect 5 fruits and 2 gems")
- Optional: Time limit
- Optional: Move limit
- Par time (for bonus scoring)
- Par moves (for bonus scoring)

### Features Active
- ✅ Pre-designed layouts
- ✅ Limited visibility (optional per level)
- ✅ Static hazards only
- ✅ Terrain zones (pre-placed)
- ❌ Hazard spawning (disabled)
- ❌ Wall spawning (disabled)
- ❌ Bonus rooms (disabled)
- ⚠️ Power-ups (pre-placed only)

### Level Progression
- Start with simple levels (few hazards, open space)
- Gradually introduce mechanics
- Later levels combine multiple challenges
- ~15-20 levels for initial release

### Win/Lose Conditions
- **Win:** Collect all required items
- **Lose:** Any lethal collision OR time/move limit exceeded

### Scoring (Puzzle Mode)
- Base completion points per level
- Time bonus if under par time
- Move bonus if under par moves
- Perfect bonus if no mistakes
- Star rating (1-3 stars based on performance)

---

# 10. Progression & Replayability

## 10.1 Achievement System

### Achievement Categories

#### Survival Achievements
| Name | Requirement | Reward |
|------|-------------|--------|
| First Blood | Die for the first time | - |
| Survivor | Survive 60 seconds | Badge |
| Veteran | Survive 120 seconds | Badge + Skin |
| Legend | Survive 180 seconds | Badge + Theme |
| Untouchable | Survive 60s without using shield | Badge |
| Combo Master | Reach 5x combo | Badge |
| Combo Streak | Maintain 5x for 10 seconds | Badge |
| Ghost Walker | Use Ghost to pass through 5 walls | Badge |
| Treasure Hunter | Collect 50 items in one run | Badge |
| Golden Hoard | Collect 5 Golden Skulls in one run | Badge |

#### Puzzle Achievements
| Name | Requirement | Reward |
|------|-------------|--------|
| Puzzle Novice | Complete 5 puzzle levels | Badge |
| Puzzle Expert | Complete all puzzle levels | Badge + Skin |
| Speed Demon | Beat all par times | Badge |
| Efficiency Expert | Beat all par moves | Badge |
| Perfectionist | 3-star all levels | Badge + Theme |

#### General Achievements
| Name | Requirement | Reward |
|------|-------------|--------|
| Dedicated | Play 50 total games | Badge |
| Long Snake | Reach length 30 | Badge |
| Longer Snake | Reach length 50 | Badge + Skin |
| Score Seeker | Reach 1000 points | Badge |
| High Roller | Reach 5000 points | Badge |
| Score Master | Reach 10000 points | Badge + Theme |

## 10.2 Statistics Tracking

### Tracked Statistics
- Total games played
- Total time played
- Total food eaten (by type)
- Total score earned (cumulative)
- Highest score (single game)
- Longest snake (single game)
- Longest survival time
- Total deaths (by cause)
- Power-ups collected (by type)
- Puzzle levels completed
- Perfect puzzle completions

### Display
- Statistics screen accessible from main menu
- Clean layout with categories
- Progress bars for achievement-related stats

## 10.3 Unlockable Content

### Snake Skins
| Skin | How to Unlock |
|------|---------------|
| Default | Start |
| Emerald | Survive 120 seconds |
| Golden | Reach length 50 |
| Phantom | Use Ghost 20 times total |
| Inferno | Complete all Puzzle levels |

### Themes/Backgrounds
| Theme | How to Unlock |
|-------|---------------|
| Classic Dungeon | Start |
| Overgrown Ruins | Survive 180 seconds |
| Ice Cavern | Complete 10 puzzles |
| Volcanic Depths | Reach 10000 points |

### Game Mode Unlocks
- Survival Mode: Available from start
- Puzzle Mode: Available from start
- (Both modes available immediately for accessibility)

## 10.4 High Score System

### Leaderboard Structure
- **Survival Mode:** Top 10 scores
- **Puzzle Mode:** Best time/moves per level
- Per-mode tracking

### Entry Format
```
Rank | Initials | Score | Length | Time | Date
1    | AAA      | 12450 | 47     | 3:42 | 2024-01-15
```

### Ghost Replay
- When setting new high score, run is saved
- Ghost replay shows semi-transparent playback
- Can race against your own best run
- Optional toggle on/off

## 10.5 Game Over Screen

### Elements to Display
1. **Final Score** (large, prominent)
2. **Score vs High Score** comparison
3. **New High Score** celebration (if applicable)
4. **Run Statistics:**
   - Time survived
   - Length reached
   - Food eaten
   - Combo high
   - Power-ups used
5. **Achievements Unlocked** (if any)
6. **Tip/Encouragement** (random helpful tip)
7. **Quick Restart** button
8. **Return to Menu** button

### New High Score Celebration
- Special animation (particles, glow)
- Fanfare sound
- "NEW HIGH SCORE!" banner
- Initials entry prompt

---

# 11. Audio Design

## 11.1 Music Style

### Overall Direction
Blend of multiple styles for dynamic atmosphere:

| Style | When Used |
|-------|-----------|
| **Ambient/Atmospheric** | Base layer, always present |
| **Chiptune/8-bit** | Melodic elements, action moments |
| **Synthwave** | Intensity peaks, high danger |

### Dynamic Music System
- Music intensity scales with gameplay danger
- Low danger: Ambient, minimal percussion
- Medium danger: Add melodic elements
- High danger: Full intensity, driving beat
- Death: Music stops, dramatic sting

### Intensity Triggers
- Time survived
- Current combo level
- Nearby hazards
- Low health/close calls

## 11.2 Sound Effects Priority

All of the following sound effects should be implemented:

### High Priority (Must Have)
| Sound | Trigger | Style |
|-------|---------|-------|
| **Eating** | Collect food | Satisfying crunch/pop |
| **Power-up** | Collect power-up | Magical shimmer |
| **Death** | Any death | Dramatic crash |
| **UI Click** | Menu interaction | Crisp click |

### Medium Priority (Should Have)
| Sound | Trigger | Style |
|-------|---------|-------|
| **Ambient** | Background | Dripping water, distant rumble |
| **Combo Escalation** | Combo increase | Rising pitch sequence |
| **Achievement** | Unlock achievement | Triumphant fanfare |

### Lower Priority (Nice to Have)
| Sound | Trigger | Style |
|-------|---------|-------|
| **Movement** | Snake moving | Subtle swoosh (optional) |
| **Bomb Countdown** | Bomb ticking | Escalating beeps |
| **Shield Break** | Shield absorbed hit | Glass shatter |
| **Ghost Activate** | Enter ghost mode | Ethereal whoosh |
| **Portal Enter** | Enter bonus room | Mystical transition |

## 11.3 Audio Settings

- Master Volume slider
- Music Volume slider
- SFX Volume slider
- Mute toggle

---

# 12. Controls & Input

## 12.1 Keyboard Controls

### Movement
| Action | Primary | Alternate |
|--------|---------|-----------|
| Move Up | Arrow Up | W |
| Move Down | Arrow Down | S |
| Move Left | Arrow Left | A |
| Move Right | Arrow Right | D |

### System
| Action | Key |
|--------|-----|
| Pause | Escape or Space |
| Confirm (menus) | Enter or Space |
| Back (menus) | Escape |

## 12.2 Input Behavior

### Input Buffering
- Buffer up to 2 directional inputs
- Allows quick turn sequences
- Makes controls feel responsive

### Direction Validation
- Cannot reverse 180 degrees instantly
- Pressing opposite direction is ignored
- Must turn 90 degrees first

### Pause Behavior
- Game pauses instantly
- Input buffer cleared on pause
- Resume from exact state

## 12.3 Mobile Support

**Mobile is NOT supported for initial release**
- Desktop only
- Keyboard controls only
- May add touch controls in future update

---

# 13. User Interface

## 13.1 Start Screen

### Elements
1. **Animated Logo** - "Snake: Dungeon Edition" with snake animation
2. **Decorative Background** - Dungeon scene, atmospheric
3. **High Score Display** - Current best prominently shown
4. **Menu Options:**
   - Survival Mode
   - Puzzle Mode
   - Statistics
   - Achievements
   - Settings
   - Credits

### Animation
- Snake slithers through/around logo
- Torches flicker
- Dust particles float
- Subtle ambient movement

## 13.2 Gameplay HUD

### Layout (Minimal, Non-Intrusive)

```
┌─────────────────────────────────────────┐
│ Score: 1250      [👻 3s] [🛡️]    Hi: 2400│
│ Length: 12       [====] x3              │
│                                         │
│                                         │
│            GAME AREA                    │
│                                         │
│                                         │
│                                         │
│                                  Lv: 3  │
└─────────────────────────────────────────┘
```

### Elements
- **Top Left:** Current score, snake length
- **Top Right:** High score, active power-up indicators
- **Bottom Right:** Current difficulty level
- **Center:** Combo meter (when active)

### Power-up Indicators
- Icon + remaining time
- Countdown bar depletes
- Flashes when about to expire

## 13.3 Pause Menu

### Appearance
- Game darkens/blurs in background
- Centered modal panel
- Dungeon-styled border/frame

### Options
1. Resume
2. Restart
3. Settings
4. Quit to Menu

### Settings Accessible
- Volume controls
- Reduced motion toggle
- (No need for full settings, subset)

## 13.4 Game Over Screen

See Section 10.5 for detailed breakdown.

### Visual Style
- Dramatic presentation
- Score prominently displayed
- Statistics clearly laid out
- Achievement unlocks highlighted
- Quick restart easily accessible

## 13.5 Settings Screen

### Categories

#### Audio
- Master Volume (slider)
- Music Volume (slider)
- SFX Volume (slider)

#### Gameplay
- Reduced Motion (toggle)

#### Display
- (Reserved for future options)

## 13.6 UI Visual Style

### Overall Aesthetic
- Match dungeon theme
- Stone-textured panels
- Decorative borders (pixel art style)
- Consistent with game visuals

### Typography
- Headers: "Press Start 2P"
- Body/options: "VT323"
- Clear hierarchy

### Colors
- Background: Dark, semi-transparent
- Text: Off-white
- Accents: Snake blue, gold highlights
- Buttons: Stone texture with hover states

### Transitions
- Smooth fade between screens
- Slide animations for panels
- No jarring cuts

---

# 14. Accessibility

## 14.1 Implemented Features

### Reduced Motion Option
- Toggle in settings
- When enabled:
  - Disable screen shake
  - Reduce particle effects
  - Simplify death animation
  - Tone down pulsing/breathing animations
  - Keep gameplay readable

### Pause Anytime
- Instant pause with no penalty
- Clear resume option
- No time pressure in menus

### Clear Visual Design
- High contrast between elements
- Distinct silhouettes for all objects
- Color not sole indicator (shapes differ too)
- Readable font sizes

## 14.2 Not Implemented (Future Consideration)

These were not prioritized for initial release:
- ❌ Colorblind palette options
- ❌ Full high contrast mode
- ❌ Adjustable game speed (beyond power-ups)
- ❌ Screen reader support

---

# 15. Technical Requirements

## 15.1 Technology Stack

| Component | Technology |
|-----------|------------|
| **Structure** | Single HTML file |
| **Styling** | Embedded CSS |
| **Logic** | Embedded JavaScript (vanilla) |
| **Rendering** | HTML5 Canvas |
| **Audio** | Web Audio API |
| **Storage** | LocalStorage |
| **Fonts** | Google Fonts (Press Start 2P, VT323) |

## 15.2 Browser Support

Target modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

No IE11 support required.

## 15.3 Performance Targets

| Metric | Target |
|--------|--------|
| **Frame Rate** | 60 FPS |
| **Game Tick** | 150ms base (configurable) |
| **Load Time** | < 3 seconds |
| **File Size** | < 500KB total |

## 15.4 Data Persistence

### Stored in LocalStorage
- High scores (top 10)
- Achievements unlocked
- Statistics
- Settings preferences
- Unlocked content flags
- Ghost replay data (most recent high score run)

### Data Format
JSON structure, versioned for future updates.

## 15.5 Code Organization

### Suggested Structure (within single file)
1. **Constants** - Configuration values
2. **Utility Functions** - Helpers, math, randomization
3. **Audio Manager** - Sound loading and playback
4. **Particle System** - Visual effects
5. **Input Manager** - Keyboard handling
6. **Dungeon/Map System** - Level generation and management
7. **Entity Classes** - Snake, Food, PowerUps, Hazards
8. **Game State Manager** - Modes, transitions
9. **UI/Menu System** - Screens, HUD
10. **Renderer** - Canvas drawing
11. **Main Game Loop** - Core update/render cycle
12. **Initialization** - Setup and start

## 15.6 Canvas Setup

- Fixed aspect ratio (adjust to container)
- Suggested base resolution: 600x500 pixels
- Grid: 30 cells wide × 25 cells tall
- Cell size: 20 pixels

---

# Appendix A: Quick Reference Card

## Power-ups at a Glance
| Icon | Name | Duration | Effect |
|------|------|----------|--------|
| 🐢 | Slow-Mo | 5s | Half speed |
| 👻 | Ghost | 4s | Phase through |
| 🛡️ | Shield | Until hit | Absorb 1 hit |
| ⏱️ | Freeze | 3s | Stop hazards |
| ✂️ | Trim | Instant | -3 length |

## Hazards at a Glance
| Icon | Name | Lethal | Behavior |
|------|------|--------|----------|
| 💀 | Poison | No | Reverse controls 3s |
| 💣 | Bomb | Yes | 5s countdown, radius 2 |
| 🧱 | Pillar | Yes | Static obstacle |
| 🚧 | Boulder | Yes | Moves on path |

## Scoring Quick Reference
- Fruit: 10 pts
- Gem: 50 pts
- Energy Orb: 25 pts
- Golden Skull: 100 pts
- Combo: up to 5x multiplier
- Time: +1 pt/second survived

---

# Appendix B: Puzzle Level Ideas

## Level 1: "First Steps"
- Open room, few walls
- 5 fruits to collect
- No hazards
- Teaches basic movement

## Level 2: "The Corridor"
- Long narrow passages
- Fruits placed along path
- No hazards
- Teaches careful navigation

## Level 3: "Crossroads"
- Plus-shaped room
- Gems at each end
- 1 static pillar in center
- Teaches obstacle awareness

## Level 4: "The Patrol"
- Open room
- 1 moving boulder
- Fruits scattered
- Teaches timing

## Level 5: "Dark Passage"
- Limited visibility enabled
- Winding corridor
- Fruits hidden in darkness
- Teaches flashlight mechanic

*(Continue with 10-15 more levels of increasing complexity)*

---

# Appendix C: Future Expansion Ideas

These are NOT in scope for initial release but could be added later:

1. **Additional Game Modes**
   - Timed Mode
   - Two Player (split keyboard)
   - Daily Challenge

2. **More Power-ups**
   - Magnet (attract food)
   - Dash (quick forward lunge)
   - Split (control two snakes)

3. **More Hazards**
   - Enemy AI snake
   - Spike traps
   - Teleporting enemies

4. **Online Features**
   - Global leaderboards
   - Daily challenges
   - Share replay clips

5. **Mobile Support**
   - Touch controls
   - Responsive layout

---

# Document End

**Version:** 1.0
**Last Updated:** [Current Date]
**Status:** Ready for Implementation

Hand this document to Claude Code with the instruction:
> "Build Snake: Dungeon Edition according to this specification. Single HTML file with embedded CSS and JavaScript. Start with the core game loop and Survival mode, then add features progressively."
