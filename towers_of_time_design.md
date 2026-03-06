# Towers of Time — Game Design Document
**Last Updated:** March 2026

---

## OVERVIEW & CORE PHILOSOPHY

Towers of Time is a top-down tower defense game spanning 5 historical eras. The player builds
towers along a set enemy path and manages a population and supply chain to keep those towers
operational.

The Town sits at the END of the enemy path and is the primary objective — if enemies reach it,
they deal damage to it directly. Losing the Town ends the game. There is no separate gate
mechanic — the Town itself is the health object enemies attack.

The map is PERSISTENT across eras. Old towers are never wiped between eras — they can be
individually demolished by the player if desired, but otherwise remain and continue to function.
Earlier era towers remain buildable in later eras as cheaper, weaker options that keep all
construction materials perpetually relevant.

Combat feel: balanced but a STRUGGLE. Towers feel underpowered until population and supply
are built up. An unstaffed tower is completely dormant. A fully staffed and supplied tower is
strong but not invincible. Both population and supply management are central to survival.

---

## MAP LAYOUT

The map is divided into two zones by a vertical wall at the center of the screen:

### Defense Zone (Left Side)
- Contains the enemy path, tower placement grid, and barricade placement
- Enemies spawn at the left edge and travel along a fixed S-curve path toward the Town
- Towers can be placed anywhere on the grid ADJACENT to the path (not on it)
- Barricades can be placed directly ON the path cells to slow or block enemies
- All placement is grid-based (40x40px cells, 48x27 grid total)

### Settlement Zone (Right Side)
- Contains the Town Hall
- Town buildings are NOT physically placed on the map — they are managed entirely
  through the supply overlay's left panel (idle game style)
- The Town Hall is pre-placed and fixed — it is the node enemies are trying to reach

---

## ECONOMY LOOP

  Kill enemies → Earn Gold → Build housing + Buy Town buildings → People arrive each wave →
  Accept or turn away arrivals up to housing cap → Assign people to towers →
  Town buildings produce construction resources + Ammo/Power →
  Spend construction resources to build towers →
  Connect towers to supply lines for Ammo/Power →
  Survive waves → Advance era → Repeat

Core tensions each wave:
- Build more housing to accept more people, or spend resources on towers?
- Assign people to new towers, or keep them on proven ones?
- Spend gold on Town buildings for more resources, or hold it for housing?

---

## PEOPLE SYSTEM

People are not a flowing resource — they are individual population units that arrive at your
Town each wave and must be manually assigned to towers. An unassigned tower is completely
dormant and does not fire.

### Arrival
- A batch of people arrive at the start of each wave
- Arrival counts scale up across waves and eras with variation within set bounds:

| Era | People Per Wave (range) |
|---|---|
| 1 | 2–4 |
| 2 | 3–6 |
| 3 | 4–7 |
| 4 | 5–9 |
| 5 | 7–12 |

- People you turn away are lost permanently — they do not return next wave
- You cannot accept more people than your current housing capacity

### Housing
Housing determines the hard cap on your total population. You must build housing before
you can accept new arrivals. Houses cost both Gold AND construction resources.

| Era | Housing Type | Capacity | Gold Cost | Construction Cost |
|---|---|---|---|---|
| 1 | Hut | 2 people | 20 | 6 Bone, 4 Wood |
| 2 | Cottage | 4 people | 35 | 8 Stone, 6 Iron |
| 3 | Lodging House | 6 people | 55 | 10 Timber, 6 Gunpowder |
| 4 | Barracks Block | 8 people | 80 | 14 Steel, 8 Oil |
| 5 | Habitat Module | 12 people | 110 | 18 Alloy, 12 Plasma |

Earlier era housing remains buildable in later eras at its original cost and capacity.

### Assignment
- Open the assignment panel to drag people from your unassigned pool onto towers
- People stay assigned to their tower permanently until you manually reassign them
- Reassignment is available at any time including mid-wave
- A tower with no person assigned is DORMANT — it does not fire at all
- More advanced towers require more than one person to operate at full capacity:

| Tower Tier | People Required |
|---|---|
| Era 1 towers | 1 person |
| Era 2 towers | 1 person |
| Era 3 towers | 2 people |
| Era 4 towers | 2–3 people (see tower stats) |
| Era 5 towers | 3 people |

A tower with fewer people than its requirement fires at reduced capacity proportional
to staffing level (e.g. a 2-person tower with 1 person fires at 50% effectiveness).

---

## RESOURCES

Resources are split into two categories:

### Construction Resources (One-Time Cost)
Spent once when placing a tower or purchasing housing. Once consumed they are gone.
Earlier era construction materials never become useless because earlier era towers and
housing remain buildable throughout the entire game.

| Era | Material 1 | Material 2 |
|---|---|---|
| 1 | Bone | Wood |
| 2 | Stone | Iron |
| 3 | Timber | Gunpowder |
| 4 | Steel | Oil |
| 5 | Alloy | Plasma |

### Operational Resources (Continuous Supply)
These flow constantly from the Town through supply lines to active towers. Managed via
the supply overlay. People are NO LONGER an operational resource — they are handled
through the population system above.

| Era | Operational Resources |
|---|---|
| 1 | None — Era 1 towers only need people |
| 2 | None — Era 2 towers only need people |
| 3 | Ammo |
| 4 | Ammo, Power |
| 5 | Ammo, Power |

Era 1 and 2 have no supply lines at all — the supply overlay is not needed until Era 3.
This keeps early game simple and introduces supply complexity gradually.

### Gold
Earned from killing enemies. Goes ONLY to the Town economy — cannot be spent on towers
directly. Spent on Town buildings and housing.

| Enemy Tier | Gold Reward |
|---|---|
| Standard enemy | 8–12 gold |
| Tanky enemy | 18–22 gold |

Players should afford roughly 1–2 Town buildings or 1 housing unit per wave if playing
well — a steady but never comfortable pace.

---

## TOWN BUILDINGS — COMPLETE LIST

Buildings are purchased with Gold and managed through the overlay left panel. No physical
placement required. Multiple copies stack. All previous era buildings remain available.

### Era 1 — No operational resources yet, construction only
| Building | Produces | Type | Rate | Gold Cost |
|---|---|---|---|---|
| Bone Yard | Bone | Construction | 2/s | 30 |
| Lumber Camp | Wood | Construction | 2/s | 30 |

### Era 2 — Still no operational resources
| Building | Produces | Type | Rate | Gold Cost |
|---|---|---|---|---|
| Quarry | Stone | Construction | 2/s | 40 |
| Forge | Iron | Construction | 2/s | 40 |

### Era 3 — Ammo unlocks
| Building | Produces | Type | Rate | Gold Cost |
|---|---|---|---|---|
| Sawmill | Timber | Construction | 2/s | 50 |
| Powder Mill | Gunpowder + Ammo | Construction + Operational | 1.5/s each | 80 |

*Powder Mill is the only building producing both types — Gunpowder to build Era 3 towers
and Ammo to supply them. Multiple Powder Mills stack both outputs.

### Era 4 — Power unlocks
| Building | Produces | Type | Rate | Gold Cost |
|---|---|---|---|---|
| Steel Mill | Steel | Construction | 2/s | 70 |
| Refinery | Oil | Construction | 2/s | 70 |
| Munitions Factory | Ammo | Operational | 2.5/s | 90 |
| Fuel Depot | Power | Operational | 2/s | 90 |

### Era 5
| Building | Produces | Type | Rate | Gold Cost |
|---|---|---|---|---|
| Fabricator | Alloy | Construction | 2/s | 100 |
| Plasma Core | Plasma | Construction | 2/s | 100 |
| Replicator | Ammo | Operational | 3/s | 120 |
| Reactor | Power | Operational | 3/s | 120 |

---

## THE SUPPLY OVERLAY

Accessible at any time via button or hotkey. Does NOT pause the game.
Only relevant from Era 3 onward — Eras 1 and 2 have no operational resources to manage.
The overlay fills the entire screen with two zones:

### Left Panel — Town Buildings (Idle Game Style)
- Lists all available buildings for the current era plus all previous era buildings
- Shows current production rate per resource type
- Shows Gold balance and building costs
- Click to purchase a building instantly
- No placement, no grid — just a running list of what you own and what it produces

### Main Screen — Supply Network
- Town Hall node displayed prominently
- All built towers shown as nodes across the screen
- Drag from Town Hall to a tower to create a supply connection (Ammo/Power only)
- Click an existing line to sever the connection
- Towers with no supply connection receive no Ammo/Power (fires at degraded capacity)
- Each tower displays its current Supply Health as a colored ring
- Current total operational output vs total draw shown at the top

When total resource draw exceeds total production, supply is divided proportionally —
all connected towers degrade rather than one cutting off abruptly.

### Priority System
Each supply connection can be set to Low / Medium / High priority with a single click.
When over production cap, High priority towers are satisfied first, then Medium, then Low.

### Tower Supply States (Era 3+ only)
| Supply Health | Ring Color | Effect |
|---|---|---|
| 75–100% | Green | Fires at full speed and damage |
| 30–74% | Yellow | 0.6x damage, +0.5s attack speed penalty |
| 1–29% | Red | 0.25x damage, +1.5s attack speed penalty |
| 0% | Grey (Dormant) | Does not fire |

Note: A tower can be fully supplied but still dormant if it has no person assigned.
Both staffing AND supply are required for a tower to fire.

### Low-Supply Warning
A flashing indicator appears on the main game screen when any tower drops below ~30%
Supply Health, even when the overlay is closed.

---

## TOWER & BARRICADE PLACEMENT

### Towers
- Placed anywhere on the grid ADJACENT to the path in the defense zone
- Cost construction resources only — not gold
- Require people to be manually assigned before they will fire
- Remain on the map permanently until manually demolished
- Earlier era towers remain buildable at original costs throughout the game

### Barricades
- Placed directly ON path cells in the defense zone
- Grid-based placement, same 40x40px cell system
- Slow or block enemies depending on type
- Cost construction resources to place
- Can be destroyed by enemies

---

## SPEED REFERENCE
| Label | Tiles per second |
|---|---|
| Very Slow | 0.5 |
| Slow | 1.0 |
| Medium | 1.8 |
| Fast | 2.8 |
| Very Fast | 4.0 |

---

## ERA 1 — PREHISTORIC

### Wave Structure
| Wave | Enemies | Spawn Counts |
|---|---|---|
| 1 | Boars only | 90 Boars |
| 2 | Sabre-Tooth Tigers only | 90 Tigers |
| 3 | Mastodons only | 42 Mastodons |
| 4 | Boars + Sabre-Tooth Tigers | 128 Boars, 85 Tigers |
| 5 (Horde) | All types | 90 Boars, 79 Tigers, 56 Mastodons |

### Enemies
| Enemy | Health | Speed | Notes |
|---|---|---|---|
| Boar | 50 | Fast | Small, hard to hit in groups |
| Sabre-Tooth Tiger | 80 | Very Fast | Highest speed in era |
| Mastodon | 280 | Slow | Tanky, soaks a lot of hits |

### Towers
| Tower | Damage/Hit | Attack Speed | Target | Range | People Needed |
|---|---|---|---|---|---|
| Club | 20 | 1.0s | Single | Short (2 tiles) | 1 |
| Rock Thrower | 14 | 2.2s | Single | Medium (4 tiles) | 1 |
| Spear | 30 | 2.8s | Single | Long (6 tiles) | 1 |

### Tower Construction Costs
| Tower | Bone | Wood |
|---|---|---|
| Club | 5 | 3 |
| Rock Thrower | 3 | 6 |
| Spear | 7 | 5 |

### Barricade
| Barricade | Effect | Construction Cost |
|---|---|---|
| Boulder | Slows enemies 40% in 2 tile radius | 8 Bone, 6 Wood |

### Cooldown Ability
| Ability | Effect | Charge Cost |
|---|---|---|
| Fire Rain | 60 damage to all enemies on screen | 20 people-waves accumulated |

---

## ERA 2 — MEDIEVAL

### Wave Structure
| Wave | Enemies | Spawn Counts |
|---|---|---|
| 1 | Witches only | 66 Witches |
| 2 | Vampires only | 102 Vampires |
| 3 | Ghosts only | 162 Ghosts |
| 4 | Witches + Vampires | 94 Witches, 94 Vampires |
| 5 (Horde) | All types | 96 Witches, 96 Vampires, 83 Ghosts |

### Enemies
| Enemy | Health | Speed | Notes |
|---|---|---|---|
| Witch | 90 | Medium | Standard threat |
| Vampire | 130 | Fast | High speed, lower health for era |
| Ghost | 160 | Slow | High health, drifts slowly |

### Towers
| Tower | Damage/Hit | Attack Speed | Target | Range | People Needed |
|---|---|---|---|---|---|
| Swordsman | 35 | 1.1s | Single | Short (2 tiles) | 1 |
| Archer | 22 | 1.6s | Single | Long (7 tiles) | 1 |
| Cavalry | 55 | 2.0s | AoE (1.5 tile radius) | Medium (4 tiles) | 2 |

### Tower Construction Costs
| Tower | Stone | Iron |
|---|---|---|
| Swordsman | 6 | 4 |
| Archer | 4 | 6 |
| Cavalry | 10 | 8 |

### Barricade
| Barricade | Effect | Construction Cost |
|---|---|---|
| Wooden Wall | Blocks path, enemies must destroy it (HP: 300) | 10 Stone, 6 Iron |

### Cooldown Ability
| Ability | Effect | Charge Cost |
|---|---|---|
| Trebuchet | 120 damage AoE (3 tile radius) at target point | 35 people-waves accumulated |

---

## ERA 3 — PIRATE

### Wave Structure
| Wave | Enemies | Spawn Counts |
|---|---|---|
| 1 | Sword Pirates only | 71 Sword Pirates |
| 2 | Rifle Pirates only | 109 Rifle Pirates |
| 3 | Mixed Pirates | 152 mixed |
| 4 | All pirate types | 81 Sword, 71 Rifle, 50 Bomb |
| 5 (Horde) | All types | 103 Sword, 103 Rifle, 88 Bomb |

### Enemies
| Enemy | Health | Speed | Notes |
|---|---|---|---|
| Pirate (Sword) | 140 | Medium | Standard melee |
| Pirate (Rifle) | 100 | Slow | Slow but comes in large numbers |
| Pirate (Bomb) | 180 | Medium | Tanky, dangerous if reaching town |

### Towers
| Tower | Damage/Hit | Attack Speed | Target | Range | People Needed | Ammo Drain/s |
|---|---|---|---|---|---|---|
| Cutlass | 45 | 1.0s | Single | Short (2 tiles) | 2 | 0 |
| Blunderbuss | 38 | 2.0s | AoE (1 tile radius) | Medium (5 tiles) | 2 | 0.5 |
| Crossbow | 30 | 1.4s | Single | Long (8 tiles) | 2 | 0.4 |

### Tower Construction Costs
| Tower | Timber | Gunpowder |
|---|---|---|
| Cutlass | 8 | 3 |
| Blunderbuss | 6 | 9 |
| Crossbow | 7 | 5 |

### Barricade
| Barricade | Effect | Construction Cost |
|---|---|---|
| Stone Wall | Blocks path, enemies must destroy it (HP: 600) | 12 Timber, 8 Gunpowder |

### Cooldown Ability
| Ability | Effect | Charge Cost |
|---|---|---|
| Cannon | 200 damage single target + 80 splash (2 tile radius) | 30 people-waves + 25 Ammo accumulated |

---

## ERA 4 — WW2

### Wave Structure
| Wave | Enemies | Spawn Counts |
|---|---|---|
| 1 | Grunt Zombies only | 97 Grunts |
| 2 | Vombies only | 150 Vombies |
| 3 | Grunts + Vombies | 208 mixed |
| 4 | All zombie types | 125 Grunts, 97 Vombies, 55 Necros |
| 5 (Horde) | All types | 182 Grunts, 121 Vombies, 101 Necros |

### Enemies
| Enemy | Health | Speed | Notes |
|---|---|---|---|
| Grunt Zombie | 180 | Medium | Standard, comes in large groups |
| Vombie | 220 | Slow | Slow but soaks hits |
| Necro Zombie | 300 | Slow | Tanky, spawns 2 Grunts on death |

### Towers
| Tower | Damage/Hit | Attack Speed | Target | Range | People Needed | Ammo/s | Power/s |
|---|---|---|---|---|---|---|---|
| Ghillie Knife | 60 | 0.8s | Single | Short (2 tiles) | 2 | 0 | 0 |
| Machine Gunner | 28 | 0.4s | Single | Long (8 tiles) | 2 | 0.8 | 0.3 |
| Turret | 50 | 1.2s | AoE (2 tile radius) | Medium (5 tiles) | 3 | 0.7 | 0.5 |

### Tower Construction Costs
| Tower | Steel | Oil |
|---|---|---|
| Ghillie Knife | 10 | 4 |
| Machine Gunner | 14 | 10 |
| Turret | 18 | 14 |

### Barricade
| Barricade | Effect | Construction Cost |
|---|---|---|
| Barbed Wire | Slows enemies 60%, deals 5 damage/s while in range | 16 Steel, 10 Oil |

### Cooldown Ability
| Ability | Effect | Charge Cost |
|---|---|---|
| Fighter Jets | 350 damage in a line across entire map | 40 people-waves + 35 Ammo + 20 Power accumulated |

---

## ERA 5 — SCI-FI

### Wave Structure
| Wave | Enemies | Spawn Counts |
|---|---|---|
| 1 | Laser Aliens only | 101 Aliens |
| 2 | Flying Saucers only | 155 Saucers |
| 3 | Aliens + Fortnite Bart Simpsons | 216 mixed |
| 4 | All types mixed | 115 Aliens, 101 FBS, 72 Saucers |
| 5 (Horde) | All types — maximum density | 189 Aliens, 142 FBS, 142 Saucers |

### Enemies
| Enemy | Health | Speed | Notes |
|---|---|---|---|
| Laser Alien | 280 | Fast | Fast and numerous |
| Fortnite Bart Simpson | 350 | Medium | Tanky, unpredictable pathing |
| Flying Saucer | 220 | Very Fast | Fastest enemy in era |

### Towers
| Tower | Damage/Hit | Attack Speed | Target | Range | People Needed | Ammo/s | Power/s |
|---|---|---|---|---|---|---|---|
| Lightsaber | 80 | 0.7s | AoE (1 tile radius) | Short (2 tiles) | 3 | 0 | 0.4 |
| Railgun | 120 | 1.8s | Single (pierces line) | Very Long (10 tiles) | 3 | 0.6 | 0.7 |
| Orbital Laser | 90 | 1.0s | Single | Full map | 3 | 0.5 | 1.0 |

### Tower Construction Costs
| Tower | Alloy | Plasma |
|---|---|---|
| Lightsaber | 16 | 10 |
| Railgun | 20 | 16 |
| Orbital Laser | 28 | 24 |

### Barricade
| Barricade | Effect | Construction Cost |
|---|---|---|
| Force Field | Blocks all enemies, regenerates HP (HP: 1,200, Regen: 20 HP/s) | 22 Alloy, 18 Plasma |

### Cooldown Ability
| Ability | Effect | Charge Cost |
|---|---|---|
| Nuclear Bomb | 800 damage to ALL enemies on map | 50 people-waves + 50 Ammo + 50 Power accumulated |

---

## BALANCING REFERENCE

### Tower Effectiveness Requirements
For a tower to fire at full capacity it needs BOTH:
1. Enough people assigned (meets staffing requirement)
2. Sufficient supply of Ammo/Power if Era 3+ (meets supply requirement)

Partial staffing reduces effectiveness proportionally. Partial supply uses the supply
health table below. Zero staffing = dormant regardless of supply.

### Supply Health Effect (Era 3+ only)
| Supply Health | Ring Color | Damage Multiplier | Attack Speed Penalty |
|---|---|---|---|
| 75–100% | Green | 1.0x | None |
| 30–74% | Yellow | 0.6x | +0.5s per attack |
| 1–29% | Red | 0.25x | +1.5s per attack |
| 0% | Grey | 0 | Does not fire |

### Wave Balancing Notes
- Wave length target: 3–5 minutes
- Each era has 5 waves before advancing
- Waves escalate: early waves are single enemy type, later waves mix
- Wave 5 of each era is a horde wave — all enemy types at maximum density
- Spawn counts assume enemies trickle in over the wave, not all at once
- Recommended spawn interval: 1 enemy every 1–2 seconds
- All spawn counts are starting values — adjust after playtesting

### Map Spec Compatibility Notes
- Tower range in tiles converts to pixels using 40px per tile (e.g. 6 tiles = 240px)
- Barricades replace the auto-placed barricade system from the map spec — all
  barricades are player-placed on path cells
- The Town Hall in the map spec is the Town described in this document — same object,
  enemies attack it directly for game over
- Town buildings are NOT physically placed in the settlement zone — managed via overlay
  panel only. The settlement zone grid can be reserved for future use.

---

## GAME FLOW

### Starting a Wave
- Waves do NOT auto-start — the player manually clicks a "Start Wave" button
- There is no timer between waves — the player has unlimited prep time to:
  - Build/demolish towers and barricades
  - Assign or reassign people
  - Purchase Town buildings
  - Repair Town health
  - Open the supply overlay to adjust connections
- Once the wave starts the Start Wave button is hidden until all enemies are cleared

### Wave Completion
- Wave ends when all enemies in that wave are dead or have reached the Town
- Returns to prep phase automatically — Start Wave button reappears
- No scoring screen between waves

### Era Advancement
- After Wave 5 of each era completes, the game automatically advances to the next era
- No player confirmation required
- On advancement:
  - Town health resets to full (new era base value)
  - New buildings, towers, barricades, and housing unlock
  - Existing towers, barricades, and buildings remain on the map
  - Supply overlay updates to show new resource types if unlocked

### Game Over
- Occurs when Town health reaches 0
- Returns the player to the home page (existing integration)

### Win Condition
- Surviving all 5 waves of Era 5 completes the game
- Returns player to home page

---

## TOWN HEALTH

The Town is the end-of-path target. Enemies that reach it deal damage based on their
strength. Town health persists across waves within an era but resets to full at the
start of each new era.

### Base Town Health Per Era
| Era | Base Town Health |
|---|---|
| 1 | 500 |
| 2 | 750 |
| 3 | 1,000 |
| 4 | 1,400 |
| 5 | 2,000 |

### Town Health Upgrades
Town health can be upgraded during prep phase using construction resources.
Each upgrade adds a fixed amount of health up to a maximum per era.

| Era | Health Per Upgrade | Upgrade Cost | Max Upgrades |
|---|---|---|---|
| 1 | +100 | 10 Bone, 8 Wood | 3 |
| 2 | +150 | 12 Stone, 10 Iron | 3 |
| 3 | +200 | 14 Timber, 10 Gunpowder | 3 |
| 4 | +250 | 18 Steel, 12 Oil | 3 |
| 5 | +400 | 22 Alloy, 16 Plasma | 3 |

### Town Repair
Town health can be repaired during prep phase (between waves) using construction
resources. Repair is NOT available mid-wave. Town health cannot exceed its current
maximum (base + upgrades purchased this era).

| Era | Health Restored | Repair Cost |
|---|---|---|
| 1 | +80 | 6 Bone, 4 Wood |
| 2 | +120 | 8 Stone, 6 Iron |
| 3 | +160 | 10 Timber, 8 Gunpowder |
| 4 | +200 | 12 Steel, 10 Oil |
| 5 | +300 | 16 Alloy, 12 Plasma |

### Enemy Damage to Town
Damage scales with enemy strength. When an enemy reaches the Town it deals:

| Enemy | Town Damage |
|---|---|
| Boar | 15 |
| Sabre-Tooth Tiger | 25 |
| Mastodon | 80 |
| Witch | 20 |
| Vampire | 35 |
| Ghost | 50 |
| Pirate (Sword) | 40 |
| Pirate (Rifle) | 30 |
| Pirate (Bomb) | 70 |
| Grunt Zombie | 45 |
| Vombie | 65 |
| Necro Zombie | 90 |
| Laser Alien | 70 |
| Fortnite Bart Simpson | 100 |
| Flying Saucer | 55 |

---

## COOLDOWN ABILITY SYSTEM

Each era has one powerful ability that charges automatically during a wave and must
be manually activated by the player when ready. The ability is designed to be
deployable 2–3 times per wave as a high-impact intervention, not a constant tool.

### How It Works
- The ability charges passively as the wave progresses
- When fully charged a visual indicator pulses on the HUD (glowing button or icon)
- The player clicks to activate it at the moment of their choosing
- After activation the charge resets and begins building again immediately
- Charge rate is tuned so the ability is available roughly every 60–90 seconds
  of active wave time, allowing 2–3 uses in a typical 3–5 minute wave

### Charge Costs (revised from people-waves — now time-based)
| Era | Ability | Charge Time | Effect |
|---|---|---|---|
| 1 | Fire Rain | 75s | 60 damage to ALL enemies on screen |
| 2 | Trebuchet | 70s | 120 damage AoE (3 tile radius) at target point |
| 3 | Cannon | 65s | 200 damage single target + 80 splash (2 tile radius) |
| 4 | Fighter Jets | 60s | 350 damage in a line across entire map |
| 5 | Nuclear Bomb | 55s | 800 damage to ALL enemies on map |

Charge times decrease slightly each era as the abilities get more powerful —
rewarding the player for surviving longer eras with more frequent use.

---

## HUD & UI

### Always Visible During a Wave
- **Town Health Bar** — top center, prominent
- **Gold Counter** — top left
- **Population Counter** — current assigned / total population (e.g. 6/10)
- **Resource Stockpiles** — current amounts of each construction + operational resource
- **Cooldown Ability Button** — bottom center, shows charge progress bar, pulses when ready
- **Start Wave Button** — bottom right, only visible during prep phase
- **Supply Overlay Button** — top right, opens overlay (Era 3+ only, greyed out before)
- **Low-Supply Warning** — flashing indicator on any tower below 30% supply health

### Tower Selection Panel
When the player clicks a tower on the map a panel appears showing:
- Tower name and era
- Current staffing: **[ − ] 2 / 2 people [ + ]** (minus and plus buttons to reassign)
- Supply Health ring + percentage (Era 3+ only)
- Current damage output based on staffing + supply
- **Demolish** button — removes tower permanently — no resources returned

### People Assignment
- Click a tower to open its selection panel
- Use [ + ] to assign one person from the unassigned pool to this tower
- Use [ − ] to remove one person from this tower back to the unassigned pool
- If unassigned pool is empty [ + ] is greyed out
- If tower has no people assigned [ − ] is greyed out
- Changes take effect immediately, including mid-wave

### Prep Phase UI Additions
During prep phase only:
- **Build Mode** button — click then click a grid cell to place a tower or barricade
- **Town Upgrade** button — opens Town health upgrade/repair panel
- **Wave incoming preview** — shows what enemy types are in the next wave

---

## ASSETS

All sprites, textures, and audio files will be pre-loaded from the project assets folder.
The rendering system should reference assets by era and type using a consistent naming
convention. Asset integration is handled separately from this design document.

---

## STARTING CONDITIONS

The player begins Era 1 Wave 1 with:
- **Gold:** 120
- **People:** 3 (pre-assigned to nothing, ready to staff towers)
- **Housing:** 1 Hut (capacity 2) already built — player can immediately accept up to 2 more people
- **Town Buildings:** 1 Lumber Camp, 1 Bone Yard already active (producing from the start)
- **Construction Resources:** 20 Wood, 15 Bone (enough to place a couple of towers immediately)
- **Town Health:** 500 (Era 1 base)

This gives the player enough to place 2–3 towers, staff them, and survive Wave 1 without
feeling helpless, but not enough to feel comfortable.

---

## ERA ADVANCEMENT

When Wave 5 of an era completes the game automatically advances. The following carries over:
- All towers on the map (staffed and unstaffed)
- All barricades still standing
- All Town buildings and their production rates
- All supply line connections
- All housing and current population
- All construction resource stockpiles
- Gold balance

On advancement:
- Town health resets to the new era's base value (full health)
- New towers, barricades, housing types, and Town buildings unlock
- Supply overlay updates to reflect any new operational resource types
- A **celebratory era advancement overlay** briefly appears showing:
  - The new era name and theme
  - A list of what just unlocked (new towers, buildings, etc.)
  - A "Continue" button to dismiss and return to prep phase

---

## PEOPLE ARRIVAL POPUP

At the end of each wave (after all enemies are cleared, before prep phase resumes)
a popup appears showing incoming people who want to join the Town.

### Popup Contents
- Header: "New arrivals — [X] people want to join your Town"
- Current housing: "Housing capacity: [used] / [total]"
- Available slots: "[N] slots available"
- For each arriving person: a simple icon with an Accept / Turn Away button
- If housing is full all Accept buttons are greyed out with tooltip "Build more housing"
- A "Done" button dismisses the popup and begins prep phase

### Behavior
- Accepted people are added to the unassigned population pool immediately
- Turned away people are gone permanently
- The popup can only be dismissed via the Done button — not by clicking outside
- If all slots are filled or all arrivals are resolved the Done button activates
- Popup appears AFTER era advancement overlay if both happen simultaneously
  (era overlay first, then people arrival popup)

---

## BARRICADE DESTRUCTION & REBUILDING

- Barricades have a health pool and take damage from enemies passing through or
  attacking them
- When health reaches 0 the barricade is destroyed and removed from the map
- Destroyed barricades leave the path cell empty and buildable again
- The player can place a new barricade on that cell during prep phase at full cost
- There is no repair mechanic — barricades are either intact or destroyed
- Barricade health per era:

| Barricade | Health |
|---|---|
| Boulder (Era 1) | 200 |
| Wooden Wall (Era 2) | 300 |
| Stone Wall (Era 3) | 600 |
| Barbed Wire (Era 4) | 400 |
| Force Field (Era 5) | 1,200 (regenerates 20 HP/s) |

---

## TOWER RANGE & OVERLAP

- Multiple towers can have overlapping ranges — no restrictions
- There is NO friendly fire — AoE abilities and AoE towers never damage barricades,
  other towers, or the Town
- AoE only affects enemies

---

## HOME PAGE INTEGRATION

The game launches from and returns to an existing home page. Claude Code should handle
the specific integration. Key handoff points:
- Game over → return to home page
- Win (complete Era 5 Wave 5) → return to home page
- No scoring data needs to be passed back currently
# Towers of Time — Build Plan
**Last Updated:** March 2026

Read this file AND towers_of_time_design.md before starting any step.
Commit to the repo after every completed step.

---

## HOW TO HAND OFF BETWEEN SESSIONS

Paste this at the start of every new Claude Code session:

"We are building Towers of Time. Read towers_of_time_design.md for the full game spec
and build_steps.md for the build plan. Steps 1 through [X] are complete and committed.
Please verify step [X] acceptance criteria pass, then continue with step [X+1]."

---

## FILE STRUCTURE

Never consolidate files. Every system lives in its own file.

```
/
├── index.html                 (home page — already exists)
├── game.html                  (main game page)
├── css/
│   ├── base.css               (reset, fonts, CSS variables, era color themes)
│   ├── hud.css                (HUD bars, counters, wave button, warnings)
│   ├── map.css                (grid, zones, path visuals)
│   └── overlay.css            (supply overlay, popups, tower selection panel)
├── js/
│   ├── events.js              (event bus only — no game logic)
│   ├── main.js                (game loop, phase + era + wave state machine)
│   ├── map.js                 (grid, zones, cell types, placement validation)
│   ├── path.js                (spline path, waypoints, position along path)
│   ├── renderer.js            (all canvas draw calls, sprite loading)
│   ├── enemies.js             (enemy classes and movement, all eras)
│   ├── waves.js               (wave definitions, spawn counts, spawn timing)
│   ├── towers.js              (tower classes, placement, combat, all eras)
│   ├── barricades.js          (barricade classes, placement, HP, slow effect)
│   ├── resources.js           (gold, construction stockpiles, production ticks)
│   ├── people.js              (population pool, housing, tower assignment)
│   ├── supply.js              (Ammo/Power flow, supply health, priority system)
│   ├── town.js                (Town HP, damage, upgrades, repair, game over)
│   ├── abilities.js           (cooldown charging, activation, effects per era)
│   ├── ui.js                  (HUD rendering, build mode, tower selection panel)
│   ├── overlay.js             (supply overlay UI, town buildings panel)
│   └── popups.js              (people arrival popup, era advancement overlay)
└── assets/
    ├── sprites/               (pre-supplied)
    └── audio/                 (pre-supplied)
```

---

## STEP 1 — Project Scaffold
**Creates:** game.html, css/base.css, css/hud.css, js/events.js, js/main.js
**Modifies:** index.html

- game.html: full-screen canvas at 1920x1080, imports all CSS and JS in order
- base.css: CSS reset, font import, CSS variables for all 5 era color palettes
- events.js: pub/sub event bus — emit(event, data), on(event, cb), off(event, cb), no game logic
- main.js: requestAnimationFrame loop with delta time, state variables
  (currentEra=1, currentWave=1, phase='prep'), empty init() function
- index.html: add Play button that navigates to game.html

**Acceptance:** game.html loads with no console errors, canvas is full screen,
event bus emit/on tested and working via console.

---

## STEP 2 — Grid & Map Rendering
**Creates:** js/map.js, js/renderer.js, css/map.css

- map.js: 48x27 grid, each cell has state ('open'|'path'|'wall'|'blocked'),
  gridToPixel(x,y) and pixelToGrid(x,y) conversion functions, zone constants
- renderer.js: drawGrid(), drawZones(), drawWall() — defense zone left of x=960,
  settlement zone right, wall at center
- map.css: zone background colors, wall style
- gridToPixel(0,0) must return {x:20, y:20}
- gridToPixel(47,26) must return {x:1900, y:1060}

**Acceptance:** Grid renders at 40x40px cells, wall visible at center,
left/right zones visually distinct, conversion functions return correct values.

---

## STEP 3 — Enemy Path
**Creates:** js/path.js
**Modifies:** js/renderer.js, js/map.js

- path.js: Catmull-Rom spline through the 5 base waypoints from design doc,
  getPositionAtDistance(d) returns {x,y}, getTangentAtDistance(d) returns direction
  vector, calculateTotalLength(), markPathCells() marks all cells within 2 tiles of
  center line as state='path' in the grid
- Renderer draws path as 160px wide corridor with dirt texture for Era 1
- Path terminates at the wall around row 13

**Acceptance:** Smooth S-curve visible through defense zone, 4 cells wide,
all path cells non-buildable, path ends at wall.

---

## STEP 4 — Enemies & Movement
**Creates:** js/enemies.js, js/waves.js
**Modifies:** js/renderer.js, js/main.js

- enemies.js: base Enemy class (health, speed, townDamage, spriteKey),
  updatePosition(dt) moves along spline with lateral wobble clamped to ±60px,
  Era 1 subclasses: Boar (50hp, 2.8/s, 15 town dmg), SabreTooth (80hp, 4.0/s,
  25 town dmg), Mastodon (280hp, 1.0/s, 80 town dmg)
- waves.js: all wave definitions for all 5 eras using spawn counts from design doc,
  WaveSpawner releases 1 enemy every 1.5s, emits 'wave:complete' when all enemies
  spawned and cleared
- Enemies despawn silently on reaching Town end (town damage in Step 6)
- Renderer draws enemy sprites facing direction of travel

**Acceptance:** Era 1 Wave 1 — 90 Boars spawn, walk full path, despawn at Town end,
'wave:complete' event fires after last enemy clears.

---

## STEP 5 — Wave & Phase Flow
**Creates:** css/hud.css (initial)
**Modifies:** js/main.js, js/ui.js, js/waves.js

- ui.js: renderHUD() stub, renderStartWaveButton() visible only in prep phase
- Clicking Start Wave sets phase='wave', hides button, begins wave spawning
- On 'wave:complete' set phase='prep', show button, increment wave counter
- After Wave 5 emit 'era:advance' (log only for now)
- HUD shows era and wave number (e.g. "Era 1 — Wave 3")

**Acceptance:** Button only visible in prep, clicking spawns enemies, after all
clear button reappears, counter increments, after Wave 5 logs era advance.

---

## STEP 6 — Town Health & Game Over
**Creates:** js/town.js
**Modifies:** js/enemies.js, js/ui.js, js/main.js

- town.js: Town class, health per era (Era 1=500), takeDamage(n), isDestroyed(),
  reset() for era change
- Enemy reaching path end calls town.takeDamage(enemy.townDamage) then despawns
- HUD renders Town health bar top center with current/max
- town.isDestroyed() triggers 'game:over' → redirect to index.html
- Stub upgrade/repair buttons in prep phase (visible, no function yet)

**Acceptance:** Mastodon deals 80 damage to Town, health bar updates in real time,
0 HP redirects to home page.

---

## STEP 7 — Tower Placement
**Creates:** (none new)
**Modifies:** js/towers.js, js/map.js, js/ui.js, js/renderer.js

- towers.js: base Tower class, Era 1 subclasses: Club (20dmg, 1.0s, 2 tile range),
  RockThrower (14dmg, 2.2s, 4 tile range), Spear (30dmg, 2.8s, 6 tile range)
- Build Mode button in prep phase HUD — toggles build mode on/off
- In build mode: hover valid cell = green highlight, invalid = red highlight
- Valid: defense zone, adjacent to path, not on path, not occupied
- Click valid cell places selected tower type (no cost check yet)
- Towers render on map with correct sprite

**Acceptance:** All 3 Era 1 tower types placeable on valid cells,
invalid placements blocked, towers render correctly.

---

## STEP 8 — Tower Combat
**Modifies:** js/towers.js, js/enemies.js, js/renderer.js

- Tower.update(dt, enemies): finds nearest enemy in range, fires when attackTimer ready
- Single target: damage to nearest enemy in range
- AoE: damage to all enemies within radius (prepare interface even if no AoE in Era 1)
- Range check uses pixel distance from tower center to enemy position
- Enemy.takeDamage(n): reduces HP, calls die() at 0
- Enemy.die(): removes from enemies array, emits 'enemy:killed' with goldReward value
- All placed towers fire automatically (no staffing requirement yet)

**Acceptance:** Club kills Boar in 3 hits (50hp/20dmg=2.5, ceiling=3),
Spear kills Mastodon in 10 hits (280/30=9.3, ceiling=10),
dead enemies removed cleanly.

---

## STEP 9 — Gold, Resources & Tower Costs
**Creates:** js/resources.js
**Modifies:** js/towers.js, js/ui.js, js/main.js

- resources.js: ResourceManager, gold balance, stockpiles {bone, wood, stone, iron,
  timber, gunpowder, steel, oil, alloy, plasma}, addGold(n), spendGold(n),
  addResource(type, n), spendResources(costs) returns bool, canAfford(costs) returns bool
- On 'enemy:killed' add gold — standard enemies 8–12, tanky 18–22 (random in range)
- Starting state: gold=120, bone=15, wood=20
- Tower placement calls canAfford() before placing, spendResources() on success
- Insufficient resources: red flash on resource counter, placement blocked
- HUD renders gold and all current stockpile amounts

**Acceptance:** Boar kill adds 8–12 gold, placing Club deducts 5 Bone + 3 Wood,
cannot place without sufficient resources, starting values correct.

---

## STEP 10 — Town Buildings & Production
**Modifies:** js/resources.js, js/overlay.js, css/overlay.css

- overlay.js: TownBuildingsPanel — opens via button (not the supply overlay yet),
  lists Era 1 buildings: Bone Yard (30g → 2 Bone/s), Lumber Camp (30g → 2 Wood/s)
- Each entry: name, produces, rate, gold cost, Buy button
- Buying: deducts gold, adds to ownedBuildings, starts producing immediately
- Multiple copies of same building stack additively
- ResourceManager.update(dt) adds production × dt to stockpiles each frame
- Panel opens/closes via button, does not pause the game

**Acceptance:** Buying Lumber Camp costs 30 gold, Wood stockpile increases at 2/s,
two Lumber Camps produce 4/s, gold correctly deducted.

---

## STEP 11 — People & Housing
**Creates:** js/people.js
**Modifies:** js/ui.js, js/popups.js, css/overlay.css

- people.js: PeopleManager, totalCapacity, unassignedPool count,
  assignedMap (towerId → count), addHousing(slots), acceptPerson(),
  assignToTower(towerId), removeFromTower(towerId), getUnassigned()
- Housing purchase in prep phase: Era 1 Hut (20g + 6 Bone + 4 Wood, +2 capacity)
- popups.js: PeopleArrivalPopup after every wave:
  - Shows N arrivals (random within era range from design doc)
  - Accept / Turn Away per person, Accept greyed if housing full
  - Done button required to dismiss — no clicking outside
- HUD: population counter showing unassigned/total (e.g. 2/8)
- Starting: 3 people in unassigned pool, 1 Hut already built (capacity 2,
  note: 3 people with capacity 2 means player needs to build housing immediately
  to accept more — correct starting tension)

**Acceptance:** Popup appears after every wave, accepting fills pool,
housing cap enforced, turned away people do not return.

---

## STEP 12 — People Assignment to Towers
**Modifies:** js/people.js, js/towers.js, js/ui.js, css/overlay.css

- Clicking a tower opens selection panel:
  - Tower name and era
  - [ − ] X / Y people [ + ] (X = assigned, Y = required)
  - Demolish button — removes tower, no resources returned, closes panel
  - Close button
- [ + ] moves one person from unassigned pool to tower (greyed if pool empty)
- [ − ] moves one person back to unassigned pool (greyed if tower at 0)
- Tower.staffingRatio = assigned / required (0.0 to 1.0)
- staffingRatio = 0: tower is dormant, does not fire
- staffingRatio < 1: tower fires at staffingRatio × effectiveness
- Required people per era: Era 1–2 = 1, Era 3 = 2, Era 4 Ghillie/MG = 2,
  Era 4 Turret = 3, Era 5 = 3

**Acceptance:** Assigning 1 person to Club makes it fire, removing makes it dormant,
partial staffing reduces damage, demolish removes tower with no refund.

---

## STEP 13 — Barricades
**Modifies:** js/barricades.js, js/map.js, js/renderer.js, js/ui.js

- barricades.js: base Barricade class (health, slowPercent, slowRadius, spriteKey),
  takeDamage(n), isDestroyed()
- All era barricades defined with stats from design doc
- Era 1 Boulder: 200hp, 40% slow, 2 tile radius, costs 8 Bone + 6 Wood
- Placeable ON path cells in build mode during prep phase
- Enemies within slow radius: speed × (1 - slowPercent)
- Wall-type barricades (Wooden Wall+): enemies deal 10 damage/s on contact
- Boulder: slows only, takes no contact damage
- HP reaches 0: barricade destroyed, cell returns to open path state
- Health bar visible when selected or HP below 50%

**Acceptance:** Boulder placed on path slows enemies, Wooden Wall blocks and
takes 10 dmg/s contact, destroyed barricade cell becomes buildable.

---

## STEP 14 — Supply Overlay
**Modifies:** js/supply.js, js/overlay.js, css/overlay.css

- supply.js: SupplyManager, connections Map(towerId → {priority, supplyHealth}),
  per-tick distribution: satisfy High first, then Medium, then Low,
  proportional split within each tier if over cap
- overlay.js: SupplyOverlay — full screen, two zones:
  - Left panel: Town buildings list (replaces standalone panel from Step 10)
  - Main area: Town Hall node + all tower nodes, drag to connect, click to sever,
    click line to cycle priority Low/Med/High, total production vs draw shown at top
- Supply overlay button on HUD: greyed in Era 1–2, active from Era 3
- Each tower node shows its supply health as colored ring

**Acceptance:** Can connect/disconnect towers, priority cycling works, High towers
satisfied before Low when over cap, production/draw totals correct.

---

## STEP 15 — Supply Health Effects
**Modifies:** js/supply.js, js/towers.js, js/ui.js

- Apply supply multipliers to tower stats each combat tick:
  75–100% = full, 30–74% = 0.6x dmg +0.5s speed, 1–29% = 0.25x dmg +1.5s speed,
  0% = dormant
- Tower selection panel shows supply ring + percentage (Era 3+ only)
- Low supply warning: flashing indicator on HUD for any tower below 30%
- Tower requires BOTH people assigned AND sufficient supply to fire at full power
- Zero people = dormant regardless of supply

**Acceptance:** Degraded supply reduces tower output correctly, warning flashes
at sub-30%, fully unsupplied tower stops firing.

---

## STEP 16 — Cooldown Abilities
**Creates:** js/abilities.js
**Modifies:** js/ui.js, css/hud.css

- abilities.js: AbilityManager, chargeTimer counts up during wave phase only,
  isReady() when timer >= chargeTime, activate() fires effect and resets timer
- All 5 era abilities with charge times and effects from design doc
- HUD: ability button bottom center with charge progress bar, pulses when ready
- Player clicks to activate when ready — cannot activate while charging
- Era 1 Fire Rain: 60 damage to all enemies on screen (75s charge)
- Era 2 Trebuchet: 120 AoE at click target, 3 tile radius (70s charge)
- Era 3 Cannon: 200 single + 80 splash 2 tile radius (65s charge)
- Era 4 Fighter Jets: 350 damage line across full map (60s charge)
- Era 5 Nuclear Bomb: 800 damage all enemies on screen (55s charge)
- Charge pauses during prep phase, resumes on wave start

**Acceptance:** Fire Rain charges in 75s, button pulses when ready, activates on
click, deals correct damage, recharge begins immediately after activation.

---

## STEP 17 — Town Upgrades, Repair & Era Advancement
**Modifies:** js/town.js, js/popups.js, js/main.js, js/resources.js

- town.js: upgrade(era) adds health up to max 3 upgrades per era (costs from design doc),
  repair(era) restores health in prep phase only (costs from design doc),
  cannot exceed current max health
- Upgrade/repair panel opens from HUD button during prep phase
- Era advancement on Wave 5 complete:
  - town.reset() sets health to new era base value
  - New towers/buildings/barricades/housing unlock (add to available lists)
  - All carry-over: towers, barricades, buildings, supply lines, people, resources, gold
  - popups.js: EraAdvancementOverlay shows new era name + unlocks list + Continue button
  - After Continue dismissed: people arrival popup shows as normal

**Acceptance:** Upgrade adds correct HP at correct cost, repair works prep-only,
era advancement overlay appears with correct unlocks, all state carries over cleanly.

---

## STEP 18 — All Eras, Polish & Integration
**Modifies:** All files as needed

Final step — complete all 5 eras and integrate everything end to end.

- Add all Era 2–5 enemy subclasses to enemies.js with correct stats
- Add all Era 2–5 tower subclasses to towers.js with correct stats
- Add all Era 2–5 barricades to barricades.js
- Add all Era 2–5 town buildings to overlay.js
- Add all Era 2–5 housing types to people.js
- Add all Era 2–5 wave definitions to waves.js (already stubbed, fill in)
- Wire up home page integration: game over and win both redirect to index.html
- Era-appropriate path textures, wall textures update on era change (renderer.js)
- People arrival popup arrival ranges correct per era (design doc table)
- Town health values correct per era, enemy town damage values correct per era
- Full playthrough test: Era 1 Wave 1 through Era 5 Wave 5 reachable without crashes
- No friendly fire: AoE towers never damage barricades, other towers, or Town
- Overlapping tower ranges allowed with no issues

**Acceptance:** Full game playable start to finish across all 5 eras, all stats
match design doc, no console errors, home page integration works on both
game over and win conditions.
