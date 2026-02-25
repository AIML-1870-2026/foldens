# Blackjack — Full Project Specification
**Intended for: Claude Code**

---

## Project Overview

A fully-featured, single-page Blackjack web application built in React. The aesthetic is **Classic Vegas**: deep casino-felt green, warm gold trim, cream card faces, and rich shadows that feel like a real table. Every feature in this document must be implemented.

---

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | React + Vite |
| Styling | CSS Modules (one `.module.css` per component) |
| Audio | Web Audio API — synthesized sounds, zero external audio files |
| Persistence | `localStorage` for stats, history, and user preferences |
| Fonts | Google Fonts: `Playfair Display` (headings/display) + `EB Garamond` (body/UI) |
| No external game libraries | All game logic hand-written |

---

## Visual Theme — "Classic Vegas"

### Color Palette (CSS custom properties on `:root`)

```css
--felt-dark:      #1a3d2b;   /* table background */
--felt-mid:       #1e4d35;   /* card area, panels */
--felt-light:     #225c3f;   /* hover states */
--gold:           #c9a84c;   /* primary accent */
--gold-light:     #e2c97e;   /* highlight / shimmer */
--gold-dark:      #8f6e28;   /* borders, shadows */
--cream:          #fdf6e3;   /* card face background */
--card-shadow:    rgba(0,0,0,0.55);
--chip-red:       #c0392b;
--chip-blue:      #2471a3;
--chip-green:     #1e8449;
--chip-black:     #1c1c1c;
--chip-purple:    #6c3483;
--text-primary:   #fdf6e3;
--text-muted:     #a8c4a0;
--win-green:      #2ecc71;
--loss-red:       #e74c3c;
--push-gray:      #95a5a6;
```

### Felt Texture
Apply a subtle grain/noise texture over the table background using a CSS `background-image` with an SVG noise filter or a repeating radial-gradient dot pattern. It should read as "fabric" not "flat color".

### Card Design
- Face: `--cream` background, 8px border-radius, `1px solid #d4c5a0`, strong drop shadow
- Back: Dark green with a repeating diamond pattern in gold (CSS-drawn), gold border
- Suit colors: ♥ ♦ = `#c0392b`, ♠ ♣ = `#1a1a1a`
- Corner indices: rank + suit in top-left and bottom-right (rotated 180°)
- Center pip(s) or face illustration: use large centered suit symbol for number cards; text abbreviation for face cards (J / Q / K) in a decorative style

### Buttons
- Gold border (`2px solid --gold`), dark background, gold text
- Hover: brighter gold border + subtle gold glow (`box-shadow`)
- Disabled: muted, no glow, `cursor: not-allowed`

### Chip Design
Circular tokens with denomination text. Colors:
- $5 → red, $25 → green, $50 → blue, $100 → black, $500 → purple

### Decorative Details
- Gold divider lines between major UI sections
- Corner ornaments (CSS `::before`/`::after` with border tricks) on the main table frame
- Table oval shape suggested with a subtle inner border/shadow on the felt area

---

## File Structure

```
blackjack/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.module.css
│   ├── hooks/
│   │   ├── useBlackjack.js       # core game state & logic
│   │   ├── useAudio.js           # Web Audio API sounds
│   │   ├── useStats.js           # persistent statistics
│   │   └── useKeyboard.js        # keyboard shortcut bindings
│   ├── components/
│   │   ├── Table/
│   │   │   ├── Table.jsx
│   │   │   └── Table.module.css
│   │   ├── Card/
│   │   │   ├── Card.jsx          # single card with flip animation
│   │   │   └── Card.module.css
│   │   ├── Hand/
│   │   │   ├── Hand.jsx          # renders a set of cards + score
│   │   │   └── Hand.module.css
│   │   ├── Chip/
│   │   │   ├── Chip.jsx
│   │   │   └── Chip.module.css
│   │   ├── BettingPanel/
│   │   │   ├── BettingPanel.jsx
│   │   │   └── BettingPanel.module.css
│   │   ├── ActionButtons/
│   │   │   ├── ActionButtons.jsx
│   │   │   └── ActionButtons.module.css
│   │   ├── StatsPanel/
│   │   │   ├── StatsPanel.jsx
│   │   │   └── StatsPanel.module.css
│   │   ├── HistoryPanel/
│   │   │   ├── HistoryPanel.jsx
│   │   │   └── HistoryPanel.module.css
│   │   ├── CountDisplay/
│   │   │   ├── CountDisplay.jsx
│   │   │   └── CountDisplay.module.css
│   │   ├── StrategyHint/
│   │   │   ├── StrategyHint.jsx
│   │   │   └── StrategyHint.module.css
│   │   ├── DealerTell/
│   │   │   ├── DealerTell.jsx
│   │   │   └── DealerTell.module.css
│   │   ├── Header/
│   │   │   ├── Header.jsx
│   │   │   └── Header.module.css
│   │   ├── SettingsPanel/
│   │   │   ├── SettingsPanel.jsx
│   │   │   └── SettingsPanel.module.css
│   │   └── KeyboardLegend/
│   │       ├── KeyboardLegend.jsx
│   │       └── KeyboardLegend.module.css
│   ├── logic/
│   │   ├── deck.js               # deck creation, shuffle, deal
│   │   ├── scoring.js            # hand value calculation
│   │   ├── basicStrategy.js      # full basic strategy lookup table
│   │   └── hiLo.js               # Hi-Lo card counting
│   └── constants/
│       ├── themes.js             # CSS variable sets per theme
│       └── sounds.js             # sound parameter definitions
```

---

## Game Logic (`src/logic/`)

### `deck.js`
- `createDeck()` — returns 52 card objects: `{ suit, rank, value, id }`
  - Suits: `'♠' '♥' '♦' '♣'`
  - Ranks: `'2'–'10', 'J', 'Q', 'K', 'A'`
  - Value: number cards = face value; J/Q/K = 10; A = 11 (adjustable)
- `shuffleDeck(deck)` — Fisher-Yates shuffle, returns new array
- `dealCard(deck)` — returns `{ card, remaining }`, mutates deck reference

### `scoring.js`
- `calculateHandValue(cards)` — returns `{ value, isSoft, isBust, isBlackjack }`
  - Ace logic: start at 11, drop to 1 if bust
  - Blackjack = exactly 2 cards with value 21
- `getHandLabel(handResult)` — returns display string: `"21"`, `"Soft 17"`, `"BUST"`, `"BLACKJACK"`

### `basicStrategy.js`
Full lookup table implementing the canonical single-deck Basic Strategy chart. Covers:
- **Hard totals** (8–17+) vs dealer upcard (2–A) → Hit / Stand / Double / Split
- **Soft totals** (soft 13–soft 20) vs dealer upcard → H / S / D
- **Pairs** (2-2 through A-A) vs dealer upcard → Split / No Split / H / D

Export: `getBasicStrategyHint(playerCards, dealerUpcard)` → returns `{ action, label }` where action is `'hit' | 'stand' | 'double' | 'split'` and label is a human-readable string like `"Basic Strategy: Double Down"`.

### `hiLo.js`
- `getHiLoValue(card)` — returns +1 (2–6), 0 (7–9), -1 (10/J/Q/K/A)
- Running count maintained in `useBlackjack` hook, reset on deck shuffle

---

## Core Game Hook (`src/hooks/useBlackjack.js`)

Manages all game state. Returns an object with:

### State
```js
{
  deck,              // remaining cards
  playerHands,       // array of hands (supports split): [{ cards, bet, done }]
  activeHandIndex,   // which hand is being played (for splits)
  dealerHand,        // { cards, holeCardHidden: bool }
  balance,           // current chip balance
  currentBet,        // bet being built
  gamePhase,         // 'betting' | 'playerTurn' | 'dealerTurn' | 'roundOver'
  roundResult,       // null | 'win' | 'loss' | 'push' | 'blackjack' | 'bust'
  runningCount,      // Hi-Lo count
  message,           // display message: "Dealer busts!", "You win!", etc.
}
```

### Actions
```js
{
  addChipToBet(amount),
  clearBet(),
  deal(),
  hit(),
  stand(),
  doubleDown(),
  split(),
  newRound(),
}
```

### Rules
- Starting balance: **$1,000**
- Shuffle a fresh deck at start and whenever < 15 cards remain
- Blackjack pays 3:2 (e.g., $100 bet → $150 profit)
- Push returns bet exactly
- Dealer must hit until ≥ 17 (stands on soft 17)
- Double Down: available on first two cards only; doubles current bet, deals exactly one card, then auto-stands
- Split: available when first two cards have same rank; splits into two separate hands, each with original bet amount deducted from balance; player plays each hand in sequence

---

## Audio (`src/hooks/useAudio.js`)

All sounds synthesized with Web Audio API. No audio files. Implement a `createAudioContext()` on first user interaction (to comply with browser autoplay policy).

### Sound Definitions

| Sound key | Implementation |
|---|---|
| `cardDeal` | White noise burst, 80ms, bandpass filter 800–2000Hz, fast decay |
| `cardFlip` | Same as deal but 130ms, slight pitch drop via frequency ramp |
| `chipPlace` | Sine wave, 1200Hz → 900Hz, 60ms, sharp attack/decay |
| `win` | Three sine tones in sequence: C5 (261Hz), E5 (329Hz), G5 (392Hz), 120ms each, slight reverb |
| `blackjack` | Five-note ascending fanfare: C5-E5-G5-C6-E6, 100ms each |
| `lose` | Two tones: A4 (440Hz) → F4 (349Hz), 200ms each, slight distortion |
| `push` | Two neutral tones: G4-G4, 80ms each |
| `bust` | Rapid descending noise burst, 300ms, low-pass filter sweeping down |

Return a `playSound(key)` function. Respect a `soundEnabled` boolean from settings.

---

## Features

### Feature 1 — Card Flip Animations

Every card component manages its own flip state:

```css
.cardWrapper {
  perspective: 1000px;
}
.cardInner {
  transform-style: preserve-3d;
  transition: transform 0.4s ease-out;
}
.cardInner.flipped {
  transform: rotateY(180deg);
}
.cardFront { backface-visibility: hidden; }
.cardBack  { backface-visibility: hidden; transform: rotateY(180deg); }
```

- Cards deal face-down, then flip to face-up after a staggered delay (0ms, 150ms, 300ms, etc.)
- Player cards flip immediately on deal; dealer hole card stays face-down until reveal
- Hole card flip triggers `cardFlip` sound
- Cards "slide in" from a deck position using a `translateX`/`translateY` + opacity entrance animation

### Feature 2 — Betting History

Panel showing last **20 rounds**. Stored in `localStorage` as a JSON array.

Each entry:
```js
{
  round: 42,
  bet: 100,
  result: 'win',          // 'win' | 'loss' | 'push' | 'blackjack' | 'bust'
  netChange: +150,        // signed dollar amount
  balanceAfter: 1250,
  timestamp: Date.now(),
}
```

Display: scrollable list, newest at top. Each row:
- Round # (small, muted)
- Result badge (colored: green WIN, red LOSS, gray PUSH, gold BJ)
- Bet amount
- Net change (+ green / − red)
- Running balance after round

### Feature 3 — Statistics Panel

Persistent stats in `localStorage`. Display:

| Stat | Description |
|---|---|
| Rounds Played | Total rounds completed |
| Wins / Losses / Pushes | Counts |
| Win Rate | `wins / (wins + losses)` as % (excludes pushes) |
| Blackjacks | Count of natural blackjacks |
| Biggest Win | Largest single net gain |
| Current Streak | e.g. "🔥 W4" or "❄️ L2" |
| Net P&L | Total profit/loss since stats were last reset |

"Reset Stats" button: shows a confirmation dialog before clearing.

### Feature 4 — Theme Options

Three themes. Switching applies new CSS custom property values to `:root`. Preference stored in `localStorage`.

**Classic Vegas** (default): as described above.

**Midnight**:
```
--felt-dark:   #0d1b2a
--felt-mid:    #112233
--felt-light:  #1a3050
--gold:        #a0a0b0   (silver)
--gold-light:  #d0d0e0
--gold-dark:   #606070
--cream:       #e8eaf0
```

**Crimson**:
```
--felt-dark:   #2d0a0f
--felt-mid:    #3d1018
--felt-light:  #4f1a24
--gold:        #c9848c   (rose gold)
--gold-light:  #e8b4bc
--gold-dark:   #8f4848
--cream:       #fdf0f0
```

### Feature 5 — Keyboard Shortcuts (`src/hooks/useKeyboard.js`)

Listen for `keydown` events. Only fire actions when valid in current game phase.

| Key | Action | Valid Phase |
|---|---|---|
| `D` | Deal / New Round | `betting` or `roundOver` |
| `H` | Hit | `playerTurn` |
| `S` | Stand | `playerTurn` |
| `X` | Double Down | `playerTurn` (first two cards) |
| `P` | Split | `playerTurn` (matching pair, first two cards) |
| `1` | Add $5 chip | `betting` |
| `2` | Add $25 chip | `betting` |
| `3` | Add $50 chip | `betting` |
| `4` | Add $100 chip | `betting` |
| `5` | Add $500 chip | `betting` |
| `C` | Clear bet | `betting` |
| `Escape` | Close settings panel | always |

### Feature 6 — Responsive Design

**Desktop (≥ 1024px)**:
```
[Stats Panel] | [Table / Felt] | [History Panel]
   220px       flex-grow: 1       260px
```

**Tablet (768–1023px)**:
- Table takes full width
- Stats + History collapse into a tabbed panel below the table (toggle between "Stats" / "History" tabs)

**Mobile (< 768px)**:
- Fully stacked: header → table → action buttons → tab panel
- Cards scale down; use `font-size` scaling on card indices
- Action buttons: large, full-width, easy tap targets (min height 52px)
- Chip selector: horizontal scroll row
- Settings: bottom sheet / drawer instead of sidebar

---

## Advanced Features

### Advanced Feature 1 — Card Counting Display (`CountDisplay`)

Shows the real-time **Hi-Lo running count**:
- Value updates after each card is dealt (including dealer upcard, but NOT the hidden hole card until it's revealed)
- Color: count > 0 → `--win-green`; count < 0 → `--loss-red`; count = 0 → `--text-muted`
- Small info `ℹ️` icon: hover/click shows tooltip explaining Hi-Lo (+1 for low cards 2–6, 0 for neutral 7–9, -1 for high cards 10–A)
- Resets to 0 when deck is reshuffled (show a brief "Deck Shuffled" flash)
- Controlled by "Show Count" toggle in Settings

### Advanced Feature 2 — Strategy Hints (`StrategyHint`)

After the player receives their first two cards, display a hint banner:

```
┌─────────────────────────────────────┐
│ 🃏 Basic Strategy:  Double Down     │
└─────────────────────────────────────┘
```

- Updates whenever player's hand changes (new card dealt, or active hand changes on split)
- Subtle styling — not a full modal, just a small banner below action buttons
- Controlled by "Show Hints" toggle in Settings
- Uses the full basic strategy table from `basicStrategy.js`

### Advanced Feature 3 — Dealer Tells (`DealerTell`)

Displayed in the dealer area after dealer's first card is shown. Clearly labeled "Just for fun — tells are random!"

A pool of at least 12 tells, randomly selected each round:

```js
const DEALER_TELLS = [
  { emoji: '👀', text: 'The dealer glances to the left...' },
  { emoji: '🎩', text: 'The dealer adjusts their hat.' },
  { emoji: '💧', text: 'A bead of sweat forms on their brow...' },
  { emoji: '😏', text: 'The dealer smirks ever so slightly.' },
  { emoji: '🤌', text: 'The dealer cracks their knuckles.' },
  { emoji: '🧤', text: 'The dealer tugs at their gloves.' },
  { emoji: '💨', text: 'The dealer exhales slowly.' },
  { emoji: '🪙', text: 'The dealer fingers their chip rack.' },
  { emoji: '🌝', text: 'The dealer\'s left eye twitches.' },
  { emoji: '🦷', text: 'The dealer bites their lip.' },
  { emoji: '📿', text: 'The dealer touches their cufflinks.' },
  { emoji: '🎭', text: 'The dealer\'s expression goes carefully blank.' },
];
```

- Appears with a fade-in after the dealer's upcard is shown
- Stays visible through the player's turn; disappears on round over
- Controlled by "Dealer Tells" toggle in Settings

---

## Settings Panel

Slide-in panel (from right) triggered by a ⚙️ settings button in the header.

Settings:
- **Sound**: toggle on/off (🔊 / 🔇) — also mirrored in header
- **Show Card Count**: toggle
- **Show Strategy Hints**: toggle
- **Dealer Tells**: toggle
- **Theme**: three themed buttons (Classic Vegas / Midnight / Crimson)

All settings persist to `localStorage` under a `blackjack_settings` key.

---

## Keyboard Legend

A small persistent legend at the bottom of the screen (desktop only). Shows a compact key→action grid. Muted styling, does not obstruct gameplay.

```
[D] Deal   [H] Hit   [S] Stand   [X] Double   [P] Split   [C] Clear   [1-5] Chips
```

Keys that are currently unavailable should appear slightly dimmed.

---

## Result Overlay

When a round ends, display a centered overlay message on the felt (not a modal — drawn on the table):

| Result | Message | Color |
|---|---|---|
| Win | "You Win! +$150" | Gold / green |
| Blackjack | "Blackjack! +$150" | Gold, larger font, sparkle animation |
| Loss | "Dealer Wins. −$100" | Red-tinted |
| Push | "Push — Bet Returned" | Gray/neutral |
| Bust | "Bust! −$100" | Red |
| Dealer bust | "Dealer Busts! You Win!" | Green |

Overlay fades out after 2 seconds, or immediately on clicking "New Round" / pressing `D`.

---

## localStorage Schema

```js
// Settings
'blackjack_settings': {
  soundEnabled: true,
  showCount: true,
  showHints: true,
  showTells: true,
  theme: 'classic',       // 'classic' | 'midnight' | 'crimson'
}

// Statistics
'blackjack_stats': {
  roundsPlayed: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  blackjacks: 0,
  biggestWin: 0,
  currentStreak: 0,        // positive = win streak, negative = loss streak
  netPnL: 0,
}

// History (array, max 20 entries, newest first)
'blackjack_history': [ ...RoundEntry ]

// Balance
'blackjack_balance': 1000
```

---

## Game Phase Flow

```
        ┌─────────────┐
        │   BETTING   │ ← Player adds chips, clicks "Deal" (or presses D)
        └──────┬──────┘
               │ deal()
        ┌──────▼──────┐
        │ PLAYER TURN │ ← Hit / Stand / Double / Split
        └──────┬──────┘
               │ stand() or auto-stand after double
        ┌──────▼──────┐
        │ DEALER TURN │ ← Hole card flips, dealer hits until ≥17
        └──────┬──────┘
               │ dealer done
        ┌──────▼──────┐
        │ ROUND OVER  │ ← Result shown, stats/history updated, balance adjusted
        └──────┬──────┘
               │ newRound() or press D
        back to BETTING
```

---

## Implementation Notes for Claude Code

1. **Start with `useBlackjack.js`** — get all game logic working with console logs before building UI
2. **Card component next** — get flip animation working in isolation before integrating
3. **Audio last** — Web Audio context requires user gesture; wrap in try/catch
4. **No prop drilling** — use React Context or pass the hook return value down as a single `game` prop
5. **Accessibility**: all interactive elements have `aria-label`; keyboard shortcuts do not conflict with browser defaults
6. **Split hand UI**: when split is active, render two `<Hand>` components side by side; highlight the active one
7. **Dealer turn**: implement as an async loop with `setTimeout` delays (600ms between dealer hits) so the player can watch cards being dealt; do not calculate all at once
8. **Balance protection**: never let balance go below $0; disable Deal button if balance < $5

---

## Deliverables

- Complete working React app runnable with `npm install && npm run dev`
- All features from this spec implemented
- No placeholder/stub functions — every listed feature must function
- Mobile-responsive at 375px, 768px, and 1280px breakpoints

