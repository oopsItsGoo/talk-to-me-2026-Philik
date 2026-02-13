/**
 * Never Have I Ever functionality for state-eight
 * Players select a category, then hear random statements from that category
 */

const EVERYDAY = [
  "Never have I ever sent a message to the wrong person.",
  "Never have I ever talked in a meeting or call while muted.",
  "Never have I ever pretended to understand something at work or school.",
  "Never have I ever blamed technology for my own mistake.",
  "Never have I ever googled how to do a basic adult task like taxes, insurance, or bills.",
  "Never have I ever waved back at someone who wasn't waving at me.",
  "Never have I ever laughed at a joke I didn't get.",
  "Never have I ever had a terrible haircut I regret.",
  "Never have I ever fallen asleep during a movie.",
  "Never have I ever practiced a conversation in my head first.",
  "Never have I ever said you too at the wrong time.",
  "Never have I ever forgotten someone's name right after being introduced.",
  "Never have I ever done something last minute that took 5 minutes.",
  "Never have I ever cried at a movie or series.",
  "Never have I ever lied about liking a gift.",
];

const PARTY_CHAOS = [
  "Never have I ever done karaoke.",
  "Never have I ever crashed a party.",
  "Never have I ever lost something important on a night out.",
  "Never have I ever left a party without saying goodbye to anyone.",
  "Never have I ever mixed drinks and regretted it.",
  "Never have I ever spilled a drink on someone.",
  "Never have I ever danced on a table or equally unhinged surface.",
  "Never have I ever gone to an afterparty with strangers.",
  "Never have I ever had a drink I did not like but finished anyway.",
  "Never have I ever been kicked out of a bar or club.",
  "Never have I ever sent a risky text late at night.",
  "Never have I ever woken up and checked my phone in fear.",
  "Never have I ever lost my voice from shouting or singing.",
  "Never have I ever done a dare that backfired.",
  "Never have I ever forgotten parts of the night.",
];

const TRAVEL_OUTDOORS = [
  "Never have I ever missed a flight, train, or bus because I was late.",
  "Never have I ever slept in an airport or station.",
  "Never have I ever lost my luggage.",
  "Never have I ever forgotten an essential item on a trip like a charger, passport, or meds.",
  "Never have I ever gotten badly sunburned on vacation.",
  "Never have I ever gotten lost with Google Maps while traveling.",
  "Never have I ever had a trip go wrong on day one.",
  "Never have I ever been stranded somewhere with no signal.",
  "Never have I ever eaten something questionable and paid for it later.",
  "Never have I ever stayed in a place that looked nothing like the photos.",
  "Never have I ever taken the wrong train or bus in the wrong direction.",
  "Never have I ever been scammed while traveling.",
  "Never have I ever done a hike I was not prepared for.",
  "Never have I ever swum somewhere and later thought that was dumb.",
  "Never have I ever had a border or security moment that was way too stressful.",
];

const KINKY = [
  "Never have I ever made out in a semi public place.",
  "Never have I ever been caught making out.",
  "Never have I ever had a secret crush on someone off limits.",
  "Never have I ever had a friends to something else moment.",
  "Never have I ever been in a situationship.",
  "Never have I ever had a one night stand.",
  "Never have I ever sent a flirty message to the wrong person.",
  "Never have I ever had a we're not telling anyone story.",
  "Never have I ever used a dating app while bored and not serious.",
  "Never have I ever had a crush on someone much older or younger than me.",
  "Never have I ever kissed someone I just met.",
  "Never have I ever been attracted to someone because of their voice.",
  "Never have I ever had a hate to admit it but type of turn on.",
  "Never have I ever owned something that could be called spicy.",
  "Never have I ever had a date that escalated faster than expected.",
];

const CATEGORIES = [
  "Everyday",
  "Party and Chaos",
  "Travel and Outdoors",
  "Kinky",
  "Mixed",
];

/**
 * Get a random statement from the selected category
 * @param {number} categoryIndex - The category index (0-4)
 * @returns {string} A random statement
 */
function getRandomStatement(categoryIndex) {
  if (categoryIndex === 4) {
    // Mixed mode - combine all categories
    const allStatements = [
      ...EVERYDAY,
      ...PARTY_CHAOS,
      ...TRAVEL_OUTDOORS,
      ...KINKY,
    ];
    return allStatements[Math.floor(Math.random() * allStatements.length)];
  }

  const categories = [EVERYDAY, PARTY_CHAOS, TRAVEL_OUTDOORS, KINKY];
  const category = categories[categoryIndex];
  return category[Math.floor(Math.random() * category.length)];
}

/**
 * Handle never have I ever state logic
 * @param {Object} machine - The DialogMachine instance
 * @param {string} eventType - The event type ('released', 'doubleclick', etc.)
 * @param {number} button - The button number
 */
export function handleNeverHaveIEverState(machine, eventType, button) {
  machine.fancyLogger.logMessage("state-eight");

  // Button 0 specific actions for state-eight
  if (button == 0) {
    if (eventType === "released") {
      if (!machine.neverHaveIEverCategoryConfirmed) {
        // Cycle through categories
        machine.neverHaveIEverCategoryIndex =
          (machine.neverHaveIEverCategoryIndex + 1) % 5;
        const categoryName = CATEGORIES[machine.neverHaveIEverCategoryIndex];
        machine.fancyLogger.logMessage(`Category selected: ${categoryName}`);
        machine.speakNormal(categoryName);
      } else {
        // Read a random statement
        const statement = getRandomStatement(
          machine.neverHaveIEverCategoryIndex,
        );
        machine.fancyLogger.logMessage(`Statement: ${statement}`);
        machine.speakNormal(statement);
      }
    } else if (eventType === "doubleclick") {
      if (!machine.neverHaveIEverCategoryConfirmed) {
        // Confirm the category
        machine.neverHaveIEverCategoryConfirmed = true;
        const categoryName = CATEGORIES[machine.neverHaveIEverCategoryIndex];
        machine.fancyLogger.logMessage(`Category confirmed: ${categoryName}`);
        machine.speakNormal(
          `${categoryName} confirmed. Press button to hear statements.`,
        );
      }
    }
  }
}
