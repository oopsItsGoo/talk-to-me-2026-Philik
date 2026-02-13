/**
 * Truth or Dare functionality for state-six
 * Single click = Truth question, Double click = Dare challenge
 */

const TRUTHS = [
  "What is the most embarrassing thing you've ever done?",
  "What is your biggest fear?",
  "What is the last lie you told?",
  "Who was your first crush?",
  "What is your biggest regret?",
  "What is the most childish thing you still do?",
  "What is something you've never told anyone?",
  "What is your worst habit?",
  "What is the longest you've gone without a shower?",
  "What is the most awkward date you've been on?",
  "What is your guilty pleasure?",
  "Have you ever cheated on a test?",
  "What is the worst gift you've ever received?",
  "What is the meanest thing you've ever said to someone?",
  "What is something you're glad your parents don't know about you?",
  "What is the most trouble you've been in?",
  "What is your biggest insecurity?",
  "Have you ever had a crush on a friend's partner?",
  "What is the last thing you searched on your phone?",
  "What is something you've done that you'd never admit to anyone?",
];

const DARES = [
  "Do your best impression of the player next to you.",
  "Speak in an accent for the next three rounds.",
  "Let another player post anything on your social media.",
  "Do 20 pushups.",
  "Eat a spoonful of a condiment of the group's choice.",
  "Dance with no music for one minute.",
  "Let the group go through your phone for one minute.",
  "Post an embarrassing selfie on social media.",
  "Talk without closing your mouth.",
  "Sing everything you say for the next 10 minutes.",
  "Do your best celebrity impression.",
  "Wear your clothes inside out for the rest of the game.",
  "Let someone draw on your face with a pen.",
  "Call a random contact and sing them a song.",
  "Do the macarena.",
  "Speak in rhymes for the next three rounds.",
  "Let another player redo your hairstyle.",
  "Eat a raw piece of garlic.",
  "Do your best runway walk across the room.",
  "Let the group give you a new nickname and use it for the rest of the game.",
];

/**
 * Get a random truth question
 * @param {Object} machine - The DialogMachine instance
 */
function getTruth(machine) {
  const question = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
  machine.fancyLogger.logMessage(`Truth: ${question}`);
  machine.audioPlayer.play("card-slide");
  machine.speakNormal(`Truth. ${question}`);
}

/**
 * Get a random dare challenge
 * @param {Object} machine - The DialogMachine instance
 */
function getDare(machine) {
  const challenge = DARES[Math.floor(Math.random() * DARES.length)];
  machine.fancyLogger.logMessage(`Dare: ${challenge}`);
  machine.audioPlayer.play("card-slide");
  machine.speakNormal(`Dare. ${challenge}`);
}

/**
 * Handle truth or dare state logic
 * @param {Object} machine - The DialogMachine instance
 * @param {string} eventType - The event type ('released', 'doubleclick', etc.)
 * @param {number} button - The button number
 */
export function handleTruthOrDareState(machine, eventType, button) {
  machine.fancyLogger.logMessage("state-six");

  // Button 0 specific actions for state-six
  if (button == 0) {
    if (eventType === "released") {
      // Single click: get a truth question
      getTruth(machine);
    } else if (eventType === "doubleclick") {
      // Double click: get a dare challenge
      getDare(machine);
    }
  }
}
