# TrueSpin Slot Machine

A browser-based slot machine game with skill-based mechanics. Unlike traditional RNG-based slots, TrueSpin uses physics simulation for reel spinning. Reels start fast, slow down naturally with deceleration, and stop based on player timing. This adds a "true spin" element where your stop timing can influence outcomes.

## Features
- 3 reels with classic symbols (cherry, orange, banana, watermelon, triple bar, lucky seven).
- Physics-based spinning: Initial velocity with constant deceleration (no pure randomness in stops).
- Manual stop buttons for each reel, enabling skill play.
- Bet system with starting balance of 100 credits.
- Tiered payouts, including special rules for cherries (1-3 matches) and 3-of-a-kind for others.
- Smooth animations with hardware acceleration.

## Setup and How to Play
1. **Clone the Repo**:
2. **Open the Game**: 
- Navigate to the folder.
- Open `index.html` in a web browser (e.g., Chrome, Firefox).
3. **Game Controls**:
- Enter your bet (1-100 credits) in the input box.
- Click "Start" to begin spinning (reels start sequentially, 3 seconds apart).
- Use "Stop Reel 1/2/3" buttons to manually stop each reel—timing matters!
- Auto-stop after 3/6/9 seconds if not manually stopped.
- Wins are calculated on the middle payline; balance updates automatically.
4. **Images**: The "items" folder must contain PNG images for each symbol (e.g., cherry.png, orange.png). Ensure they're ~80x100px for best fit.
5. **Alternative Files**: 
- There’s also an `index2.html` file with all scripts and styles embedded. Use this if you prefer a single-file version, no need for `script.js` or `style.css`.
- Additionally, `index3.html` includes embedded sound effects for a more immersive experience.

## Technical Notes
- **Physics Implementation**: Reels use kinematic equations (distance = velocity * time + 0.5 * deceleration * time²) for realistic slowdown. See comments in `script.js` for details.
- **No Dependencies**: Vanilla JavaScript, HTML, and CSS. No libraries needed.
- **Customization**: Adjust `deceleration` (-100 px/s²) or `INITIAL_SPIN_SPEED` in `script.js` for spin feel.
