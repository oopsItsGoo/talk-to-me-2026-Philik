/**
 * Coinflip module - handles state-one functionality
 * press once to flip a coin, double click to repeat last result
 */

/**
 * Flip a coin and return the result
 * @param {object} machine - The DialogMachine instance
 * @returns {string} "heads" or "tails"
 */
export function coinFlip(machine) {
  const result = Math.random() < 0.5 ? "heads" : "tails";
  machine.lastCoinFlip = result;
  return result;
}

/**
 * Handle state-one (Coinflip) button actions
 * @param {object} machine - The DialogMachine instance
 * @param {string} eventType - The event type
 * @param {number} button - The button number
 */
export function handleCoinflipState(machine, eventType, button) {
  machine.fancyLogger.logMessage("state-one");

  // Button 0 specific actions for state-one
  if (button == 0) {
    if (eventType === "released") {
      // Single click: flip coin
      const result = coinFlip(machine);
      machine.audioPlayer.playAndWait("coinflip").then(() => {
        machine.speakNormal(result);
        machine.fancyLogger.logMessage(`Coin flip: ${result}`);
      });
    } else if (eventType === "doubleclick") {
      // Double click: repeat last result
      if (machine.lastCoinFlip) {
        machine.speakNormal(`Last result was ${machine.lastCoinFlip}`);
        machine.fancyLogger.logMessage(
          `Last coin flip: ${machine.lastCoinFlip}`,
        );
      } else {
        machine.speakNormal("No previous flip");
        machine.fancyLogger.logMessage("No previous coin flip");
      }
    }
  }
}
