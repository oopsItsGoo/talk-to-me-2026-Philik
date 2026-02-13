/**
 * Dice functionality for state-five
 * press once to roll a dice, double click to repeat last result
 */

/**
 * Roll the dice
 * @param {Object} machine - The DialogMachine instance
 * @returns {number} The dice result (1-6)
 */
async function rollDice(machine) {
  const result = Math.floor(Math.random() * 6) + 1;
  machine.lastDiceRoll = result;
  machine.fancyLogger.logMessage(`Dice rolled: ${result}`);

  // Play random dice roll sound (1-3)
  const randomDiceSound = Math.floor(Math.random() * 3) + 1;
  await machine.audioPlayer.playAndWait(`diceroll-${randomDiceSound}`);

  machine.speakNormal(`${result}`);
  return result;
}

/**
 * Handle dice state logic
 * @param {Object} machine - The DialogMachine instance
 * @param {string} eventType - The event type ('released', 'doubleclick', etc.)
 * @param {number} button - The button number
 */
export function handleDiceState(machine, eventType, button) {
  if (button == 0) {
    if (eventType === "released") {
      // Single click: roll the dice
      rollDice(machine);
    } else if (eventType === "doubleclick") {
      // Double click: repeat last result
      if (machine.lastDiceRoll !== null && machine.lastDiceRoll !== undefined) {
        machine.fancyLogger.logMessage(
          `Repeating last dice roll: ${machine.lastDiceRoll}`,
        );
        machine.speakNormal(`Last roll was ${machine.lastDiceRoll}`);
      } else {
        machine.fancyLogger.logMessage("No previous dice roll to repeat");
        machine.speakNormal("No previous roll");
      }
    }
  }
}
