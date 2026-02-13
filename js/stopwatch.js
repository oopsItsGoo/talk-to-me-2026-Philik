/**
 * Stopwatch module - handles state-three functionality
 * press once to start/record lap, double click to stop and announce results or repeat last results
 */

/**
 * Start the stopwatch
 * @param {object} machine - The DialogMachine instance
 */
export function startStopwatch(machine) {
  machine.stopwatchStartTime = Date.now();
  machine.stopwatchLastLapTime = machine.stopwatchStartTime;
  machine.stopwatchLapTimes = [];
  machine.stopwatchIsRunning = true;
  machine.audioPlayer.startLoop("stopwatch");
}

/**
 * Record a lap time
 * @param {object} machine - The DialogMachine instance
 * @returns {number} The lap time in milliseconds
 */
export function recordLap(machine) {
  const now = Date.now();
  const lapTime = now - machine.stopwatchLastLapTime;
  machine.stopwatchLapTimes.push(lapTime);
  machine.stopwatchLastLapTime = now;
  return lapTime;
}

/**
 * Stop the stopwatch and return total time
 * @param {object} machine - The DialogMachine instance
 * @returns {number} The total time in milliseconds
 */
export function stopStopwatch(machine) {
  const now = Date.now();
  const totalTime = now - machine.stopwatchStartTime;
  machine.stopwatchIsRunning = false;
  machine.audioPlayer.stopLoop("stopwatch");
  return totalTime;
}

/**
 * Handle state-three (Stopwatch) button actions
 * @param {object} machine - The DialogMachine instance
 * @param {string} eventType - The event type
 * @param {number} button - The button number
 */
export function handleStopwatchState(machine, eventType, button) {
  machine.fancyLogger.logMessage("state-three");

  // Button 0 specific actions for state-three
  if (button == 0) {
    if (eventType === "released") {
      // Single click: start stopwatch or record lap
      if (!machine.stopwatchIsRunning) {
        startStopwatch(machine);
        //machine.speakNormal("Stopwatch started");
        machine.fancyLogger.logMessage("Stopwatch started");
      } else {
        const lapTime = recordLap(machine);
        const lapNumber = machine.stopwatchLapTimes.length;
        const lapSeconds = (lapTime / 1000).toFixed(2);
        machine.speakNormal(`Lap ${lapNumber}: ${lapSeconds} seconds`);
        machine.fancyLogger.logMessage(`Lap ${lapNumber}: ${lapSeconds}s`);
      }
    } else if (eventType === "doubleclick") {
      // Double click: stop and announce results, or repeat last results
      if (machine.stopwatchIsRunning) {
        // If we have at least one lap, record the final lap
        if (machine.stopwatchLapTimes.length > 0) {
          recordLap(machine);
        }

        const totalTime = stopStopwatch(machine);
        const totalSeconds = (totalTime / 1000).toFixed(2);
        let message = `Total time: ${totalSeconds} seconds. `;

        if (machine.stopwatchLapTimes.length > 0) {
          message += `Laps: `;
          machine.stopwatchLapTimes.forEach((lap, index) => {
            const lapSeconds = (lap / 1000).toFixed(2);
            message += `${index + 1}: ${lapSeconds}, `;
          });
        }

        // Save the message for later repetition
        machine.stopwatchLastMessage = message;

        machine.speakNormal(message);
        machine.fancyLogger.logMessage(
          `Stopwatch stopped - Total: ${totalSeconds}s`,
        );
        machine.stopwatchLapTimes.forEach((lap, index) => {
          machine.fancyLogger.logMessage(
            `  Lap ${index + 1}: ${(lap / 1000).toFixed(2)}s`,
          );
        });
      } else {
        // Stopwatch is not running - repeat last message
        if (machine.stopwatchLastMessage) {
          machine.speakNormal(machine.stopwatchLastMessage);
          machine.fancyLogger.logMessage("Repeating last stopwatch results");
        } else {
          machine.speakNormal("No stopwatch results to repeat");
          machine.fancyLogger.logMessage("No stopwatch results available");
        }
      }
    }
  }
}
