/**
 * Counter module - handles state-two functionality
 * press once to increase counter, double click to decrease counter
 */

/**
 * Modify the counter value and return the new value
 * @param {object} machine - The DialogMachine instance
 * @param {boolean} decrease - If true, decrease the counter; if false, increase it
 * @returns {number} The new counter value
 */
export function modifyCounter(machine, decrease = false) {
  if (decrease) {
    machine.counterValue--;
  } else {
    machine.counterValue++;
  }
  return machine.counterValue;
}

/**
 * Handle state-two (Counter) button actions
 * @param {object} machine - The DialogMachine instance
 * @param {string} eventType - The event type
 * @param {number} button - The button number
 */
export function handleCounterState(machine, eventType, button) {
  machine.fancyLogger.logMessage("state-two");

  // Button 0 specific actions for state-two
  if (button == 0) {
    if (eventType === "released") {
      // Single click: increment counter
      const count = modifyCounter(machine, false);
      machine.speakNormal(count.toString());
      machine.fancyLogger.logMessage(`Counter: ${count}`);
    } else if (eventType === "doubleclick") {
      // Double click: decrement counter
      const count = modifyCounter(machine, true);
      machine.speakNormal(count.toString());
      machine.fancyLogger.logMessage(`Counter decreased: ${count}`);
    }
  }
}
