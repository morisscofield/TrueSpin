// Reel configurations based on the specification
const REEL_CONFIGS = {
  reel1: [
    "cherry",
    "banana",
    "cherry",
    "orange",
    "orange",
    "orange",
    "lucky_seven",
    "banana",
    "watermelon",
    "watermelon",
    "tripple_bar",
    "tripple_bar",
    "tripple_bar",
    "cherry",
    "cherry",
    "watermelon",
    "banana",
    "banana",
    "banana",
    "orange",
    "orange",
  ],
  reel2: [
    "orange",
    "orange",
    "orange",
    "lucky_seven",
    "cherry",
    "banana",
    "cherry",
    "orange",
    "orange",
    "lucky_seven",
    "watermelon",
    "watermelon",
    "banana",
    "tripple_bar",
    "tripple_bar",
    "orange",
    "cherry",
    "cherry",
    "banana",
    "banana",
    "banana",
  ],
  reel3: [
    "tripple_bar",
    "banana",
    "banana",
    "orange",
    "orange",
    "orange",
    "cherry",
    "banana",
    "cherry",
    "tripple_bar",
    "orange",
    "orange",
    "watermelon",
    "banana",
    "banana",
    "orange",
    "watermelon",
    "tripple_bar",
    "cherry",
    "lucky_seven",
    "cherry",
  ],
};

// Timing configuration
const REEL_STOP_INTERVAL = 3000; // 3 seconds between reel stops
const REEL_STOP_TIMES = [3000, 6000, 9000]; // Auto-stop times for each reel
const SPIN_SPEED = 25; // Constant spin speed
const SNAP_DURATION = 200; // Snap animation duration in ms
const INITIAL_SPIN_SPEED = 25; // Initial spin speed

/**
 * Win payout table
 */
const PAYOUTS = {
  cherry: { 1: 2, 2: 5, 3: 7 },
  banana: { 3: 10 },
  watermelon: { 3: 20 },
  tripple_bar: { 3: 40 },
  lucky_seven: { 3: 100 },
  other: { 3: 5 },
};

var cols;
var stopButtons = [];
var gameState = {
  balance: 100,
  isSpinning: false,
  spinStartTime: 0,
  reels: [],
};
var animationId = null;

window.addEventListener("DOMContentLoaded", function (event) {
  cols = document.querySelectorAll(".col");

  // Initialize physics state for each reel
  for (let i = 0; i < cols.length; i++) {
    gameState.reels.push({
      position: 0,
      stopped: false,
      stopTime: null, // When this reel should stop
      isSnapping: false,
      element: cols[i], // Cache the DOM element
      canBeStoppedManually: false,
      reel_speed: INITIAL_SPIN_SPEED + 0.1 * INITIAL_SPIN_SPEED,
    });
  }

  setInitialItems();
  initalizeStopButtons();
  updateBalance();

  // Add CSS optimization
  cols.forEach((col) => {
    col.style.transition = "none";
    col.style.willChange = "transform";
  });
});

function setInitialItems() {
  for (let i = 0; i < cols.length; ++i) {
    const col = cols[i];
    const reelConfig = REEL_CONFIGS[`reel${i + 1}`];
    let elms = "";

    // Create 4 repetitions for smooth wrapping
    for (let rep = 0; rep < 4; rep++) {
      for (let x = 0; x < reelConfig.length; x++) {
        const icon = reelConfig[x];
        const item =
          '<div class="icon" data-item="' +
          icon +
          '"><img src="items/' +
          icon +
          '.png"></div>';
        elms += item;
      }
    }

    col.innerHTML = elms;
    gameState.reels[i].position = reelConfig.length * 100 * 2; // Start in middle section
  }

  updateReelPositions();
}

/**
 * Start spinning with predictable timing
 */
function spin(elem) {
  if (gameState.isSpinning) return;

  // Check bet amount
  const betAmount = parseInt(document.getElementById("betAmount").value);
  if (betAmount > gameState.balance || betAmount < 1) {
    alert("Invalid bet amount!");
    return;
  }

  // Deduct bet
  gameState.balance -= betAmount;
  updateBalance();

  // Disable spin button
  elem.setAttribute("disabled", true);
  gameState.isSpinning = true;
  gameState.spinStartTime = performance.now();

  // Reset all reels
  gameState.reels.forEach((reel, i) => {
    reel.stopped = false;
    reel.stopTime = null;
    reel.isSnapping = false;
    reel.canBeStoppedManually = i === 0; // Only first reel can be stopped initially
    reel.element.style.transition = "none";
  });

  // Set auto-stop times
  gameState.reels[0].stopTime = gameState.spinStartTime + REEL_STOP_TIMES[0];
  gameState.reels[1].stopTime = gameState.spinStartTime + REEL_STOP_TIMES[1];
  gameState.reels[2].stopTime = gameState.spinStartTime + REEL_STOP_TIMES[2];

  updateStopButtonStates();

  // Start animation
  animationId = requestAnimationFrame(animateReels);
}

/**
 * Main animation loop with predictable timing
 */
function animateReels() {
  const now = performance.now();
  let allStopped = true;

  for (let i = 0; i < gameState.reels.length; i++) {
    const reel = gameState.reels[i];

    if (!reel.stopped && !reel.isSnapping) {
      allStopped = false;

      // Check if it's time to stop this reel
      if (now >= reel.stopTime) {
        stopReelSmooth(i);
      } else {
        // Calculate current speed using gradual deceleration
        const totalTime = REEL_STOP_TIMES[i]; // Total time for this reel
        const elapsedTime = now - gameState.spinStartTime;
        const timeLeft = totalTime - elapsedTime;

        // Apply your equation: v_initial * (time_left / total_time)
        const currentSpeed = reel.reel_speed;

        reel.position -= currentSpeed;
      }
    }
  }

  updateReelPositions();

  if (allStopped) {
    // Game finished
    gameState.isSpinning = false;
    document.querySelector(".start-button").removeAttribute("disabled");

    // Reset all stop buttons
    stopButtons.forEach((btn) => {
      btn.removeAttribute("disabled");
      btn.classList.remove("disabled-button");
    });

    setTimeout(() => {
      checkWinConditions();
    }, 200);
  } else {
    animationId = requestAnimationFrame(animateReels);
  }
}

/**
 * Smoothly stop a reel with snap-to-symbol
 */
function stopReelSmooth(reelIndex) {
  const reel = gameState.reels[reelIndex];
  if (reel.stopped || reel.isSnapping) return;

  reel.isSnapping = true;

  // Disable THIS reel's button immediately since it's stopping
  reel.canBeStoppedManually = false;

  // Enable next reel's stop button immediately (no delay!)
  if (reelIndex < gameState.reels.length - 1) {
    gameState.reels[reelIndex + 1].canBeStoppedManually = true;
  }

  // Update button states for both changes
  updateStopButtonStates();

  // Find nearest symbol position
  const reelConfig = REEL_CONFIGS[`reel${reelIndex + 1}`];
  const itemHeight = 100;
  const symbolIndex = Math.round(reel.position / itemHeight);
  const targetPosition = symbolIndex * itemHeight;

  // Smooth snap animation
  const startPos = reel.position;
  const distance = targetPosition - startPos;
  const startTime = performance.now();

  function snapAnimation(time) {
    let progress = Math.min(1, (time - startTime) / SNAP_DURATION);
    // Smooth easing out
    progress = 1 - Math.pow(1 - progress, 3);

    reel.position = startPos + distance * progress;
    updateSingleReelPosition(reelIndex);

    if (progress < 1) {
      requestAnimationFrame(snapAnimation);
    } else {
      // Reel fully stopped
      reel.stopped = true;
      reel.isSnapping = false;
    }
  }

  requestAnimationFrame(snapAnimation);
}

/**
 * Update stop button states based on game rules
 */
function updateStopButtonStates() {
  stopButtons.forEach((button, i) => {
    if (
      gameState.reels[i].canBeStoppedManually &&
      !gameState.reels[i].stopped
    ) {
      button.removeAttribute("disabled");
      button.classList.remove("disabled-button");
    } else {
      button.setAttribute("disabled", true);
      button.classList.add("disabled-button");
    }
  });
}

/**
 * Manual stop function - called when user presses stop button
 */
function stopReel(reelIndex) {
  if (
    !gameState.isSpinning ||
    gameState.reels[reelIndex].stopped ||
    !gameState.reels[reelIndex].canBeStoppedManually
  ) {
    return;
  }

  const now = performance.now();

  // Stop this reel immediately
  gameState.reels[reelIndex].stopTime = now;

  // Update stop times for remaining reels (3 seconds from now)
  for (let i = reelIndex + 1; i < gameState.reels.length; i++) {
    if (!gameState.reels[i].stopped) {
      gameState.reels[i].stopTime = now + REEL_STOP_INTERVAL * (i - reelIndex);
    }
  }

  // Disable this button immediately
  gameState.reels[reelIndex].canBeStoppedManually = false;
  updateStopButtonStates();
}

/**
 * Hardware-accelerated position updates
 */
function updateReelPositions() {
  for (let i = 0; i < cols.length; i++) {
    updateSingleReelPosition(i);
  }
}

function updateSingleReelPosition(i) {
  const reel = gameState.reels[i];
  const reelConfig = REEL_CONFIGS[`reel${i + 1}`];
  const sectionHeight = reelConfig.length * 100;

  let position = reel.position;

  // Handle smooth wrapping
  position = position % (sectionHeight * 4);
  if (position < 0) position += sectionHeight * 4;

  // Keep in visible range
  if (position < sectionHeight) {
    position += sectionHeight * 2;
    reel.position = position;
  } else if (position >= sectionHeight * 3) {
    position -= sectionHeight * 2;
    reel.position = position;
  }

  const translateY = -position + 2 * 100;
  reel.element.style.transform = `translate3d(0, ${translateY}px, 0)`;
}

/**
 * Get symbols on payline
 */
function getCurrentPaylineSymbols() {
  const symbols = [];

  for (let i = 0; i < 3; i++) {
    const reel = gameState.reels[i];
    const reelConfig = REEL_CONFIGS[`reel${i + 1}`];

    const sectionHeight = reelConfig.length * 100;
    const normalizedPosition =
      ((reel.position % sectionHeight) + sectionHeight) % sectionHeight;
    const middleIndex = Math.round(normalizedPosition / 100);

    const actualIndex =
      (middleIndex - 1 + reelConfig.length) % reelConfig.length;
    const symbolName = reelConfig[actualIndex];
    symbols.push(symbolName);
  }

  return symbols;
}

/**
 * Check win conditions and update balance
 */
function checkWinConditions() {
  const symbols = getCurrentPaylineSymbols();
  const betAmount = parseInt(document.getElementById("betAmount").value);
  let winAmount = 0;
  let winMessage = "";

  // Count cherries anywhere
  const cherryCount = symbols.filter((s) => s === "cherry").length;

  // Check for cherry wins
  if (cherryCount > 0) {
    winAmount = PAYOUTS.cherry[cherryCount] || PAYOUTS.cherry[3];
    winMessage = `${cherryCount} Cherry${
      cherryCount > 1 ? "ies" : ""
    } - You win ${winAmount} credits!`;
  }

  // Check for three of a kind
  if (symbols[0] === symbols[1] && symbols[1] === symbols[2]) {
    const symbol = symbols[0];
    if (symbol === "cherry") {
      // Already handled above
    } else if (symbol === "orange") {
      winAmount = 5;
      winMessage = "3 Oranges - You win 5 credits!";
    } else if (symbol === "banana") {
      winAmount = 10;
      winMessage = "3 Bananas - You win 10 credits!";
    } else if (symbol === "watermelon") {
      winAmount = 20;
      winMessage = "3 Watermelons - You win 20 credits!";
    } else if (symbol === "tripple_bar") {
      winAmount = 40;
      winMessage = "3 Triple Bars - You win 40 credits!";
    } else if (symbol === "lucky_seven") {
      winAmount = 100;
      winMessage = "3 Sevens - You win 100 credits!";
    }
  }

  winAmount = Math.floor(winAmount * (betAmount / 5));

  if (winAmount > 0) {
    gameState.balance += winAmount;
    updateBalance();
    showWinMessage(winMessage);
  }
}

function updateBalance() {
  document.getElementById("balance").textContent = gameState.balance;
}

function showWinMessage(message) {
  const winMessageElement = document.getElementById("winMessage");
  if (winMessageElement) {
    winMessageElement.textContent = message;
    winMessageElement.style.display = "block";

    setTimeout(() => {
      winMessageElement.style.display = "none";
    }, 1500);
  }
}

function initalizeStopButtons() {
  for (let i = 1; i <= cols.length; i++) {
    const button = document.getElementById("sp" + i);
    stopButtons.push(button);

    button.addEventListener(
      "click",
      (function (reelIndex) {
        return function () {
          stopReel(reelIndex);
        };
      })(i - 1)
    );
  }
}
