/**
 * Pop the Balloon functionality for state-seven
 * A random target number (1-30) is selected. Players take turns pressing buttons.
 * Single click: +1 to counter, Double click: +3 to counter
 * The player who reaches or exceeds the target number loses (pops the balloon).
 */

/**
 * Initialize a new balloon game
 * @param {Object} machine - The DialogMachine instance
 */
function initializeBalloonGame(machine) {
  machine.balloonTarget = Math.floor(Math.random() * 30) + 1;
  machine.balloonCounter = 0;
  machine.balloonGameActive = true;

  machine.fancyLogger.logMessage(
    `Balloon game started. Target: ${machine.balloonTarget}`,
  );
}

/**
 * Increase the balloon counter
 * @param {Object} machine - The DialogMachine instance
 * @param {number} increment - Amount to increase by
 * @param {string} soundName - Sound to play (or null for no sound)
 */
async function increaseBalloonCounter(machine, increment, soundName = null) {
  machine.balloonCounter += increment;

  machine.fancyLogger.logMessage(
    `Balloon counter: ${machine.balloonCounter} / ${machine.balloonTarget}`,
  );

  // Check if balloon popped
  if (machine.balloonCounter >= machine.balloonTarget) {
    machine.balloonGameActive = false;
    await machine.audioPlayer.playAndWait("ballon-pop");
    machine.fancyLogger.logMessage(
      `Game over! Balloon popped at ${machine.balloonCounter}`,
    );
  } else if (soundName) {
    await machine.audioPlayer.playAndWait(soundName);
  }
}

/**
 * Handle pop the balloon state logic
 * @param {Object} machine - The DialogMachine instance
 * @param {string} eventType - The event type ('released', 'doubleclick', etc.)
 * @param {number} button - The button number
 */
export function handlePopTheBalloonState(machine, eventType, button) {
  machine.fancyLogger.logMessage("state-seven");

  // Initialize game if not active
  if (!machine.balloonGameActive) {
    initializeBalloonGame(machine);
    return;
  }

  // Button 0 specific actions for state-seven
  if (button == 0) {
    if (eventType === "released") {
      // Single click: +1 with random blow sound
      const randomBlow = Math.floor(Math.random() * 3) + 1;
      increaseBalloonCounter(machine, 1, `ballon-blow-${randomBlow}`);
    } else if (eventType === "doubleclick") {
      // Double click: +3 with triple blow sound
      increaseBalloonCounter(machine, 3, "ballon-tripple-blow");
    }
  }
}
