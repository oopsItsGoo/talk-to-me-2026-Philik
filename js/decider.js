/**
 * Decider module - handles state-four functionality
 * press once to increase number of choices, double click to confirm and decide
 */

/**
 * Make a random decision between 1 and maxChoices (inclusive)
 * @param {number} maxChoices - The maximum number of choices
 * @returns {number} A random number between 1 and maxChoices
 */
export function makeDecision(maxChoices) {
  return Math.floor(Math.random() * maxChoices) + 1;
}

/**
 * Handle state-four (Decider) button actions
 * @param {object} machine - The DialogMachine instance
 * @param {string} eventType - The event type
 * @param {number} button - The button number
 */
export function handleDeciderState(machine, eventType, button) {
  machine.fancyLogger.logMessage("state-four");

  // Button 0 specific actions for state-four
  if (button == 0) {
    if (eventType === "released") {
      // Single click: increment number of choices
      machine.deciderChoices++;
      machine.speakNormal(machine.deciderChoices.toString());
      machine.fancyLogger.logMessage(
        `Decider choices: ${machine.deciderChoices}`,
      );
    } else if (eventType === "doubleclick") {
      // Double click: confirm and decide
      if (machine.deciderChoices > 0) {
        const decision = makeDecision(machine.deciderChoices);
        machine.deciderLastResult = decision;
        machine.speakNormal(`The decision is ${decision}`);
        machine.fancyLogger.logMessage(
          `Decided: ${decision} out of ${machine.deciderChoices} choices`,
        );
        // Reset for next use
        machine.deciderChoices = 0;
      } else {
        machine.speakNormal("No choices set. Click to add choices first.");
        machine.fancyLogger.logMessage("Decider: No choices available");
      }
    }
  }
}
