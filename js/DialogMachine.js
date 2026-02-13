import TalkMachine from "../talk-to-me-core/js/TalkMachine.js";
import AudioPlayer from "./audioPlayer.js";
import { handleCoinflipState } from "./coinflip.js";
import { handleCounterState } from "./counter.js";
import { handleDeciderState } from "./decider.js";
import { handleStopwatchState } from "./stopwatch.js";
import { handleDiceState } from "./Dice.js";
import { handleTruthOrDareState } from "./TruthOrDare.js";
import { handlePopTheBalloonState } from "./popTheBalloon.js";
import { handleNeverHaveIEverState } from "./neverHaveIEver.js";

export default class DialogMachine extends TalkMachine {
  constructor() {
    super();
    this.initDialogMachine();
  }

  initDialogMachine() {
    this.dialogStarted = false;
    this.lastState = "";
    this.nextState = "";
    this.waitingForUserInput = true;
    this.stateDisplay = document.querySelector("#state-display");
    this.shouldContinue = false;

    // initialiser les éléments de la machine de dialogue
    this.maxLeds = 4; //TODO how many LEDs do we use ?
    this.ui.initLEDUI();

    // Initialize audio player
    this.audioPlayer = new AudioPlayer();

    // Registre des états des boutons - simple array: 0 = released, 1 = pressed
    this.buttonStates = [0, 0, 0, 0, 0];
    this.alternativeButtons = false; // bascule entre les ensembles de boutons pour le routage

    // Coin flip variable
    this.lastCoinFlip = null;

    // Counter variable
    this.counterValue = 0;

    // Dice variable
    this.lastDiceRoll = null;

    // Stopwatch variables
    this.stopwatchStartTime = 0;
    this.stopwatchLapTimes = [];
    this.stopwatchIsRunning = false;
    this.stopwatchLastLapTime = 0;
    this.stopwatchLastMessage = "";

    // Decider variables
    this.deciderChoices = 0;
    this.deciderLastResult = 0;

    // Pop the Balloon variables
    this.balloonTarget = 0;
    this.balloonCounter = 0;
    this.balloonGameActive = false;

    // Never Have I Ever variables
    this.neverHaveIEverCategoryIndex = 4;
    this.neverHaveIEverCategoryConfirmed = false;

    // Active LED color (RGB)
    this.activeLedColor = { r: 255, g: 251, b: 0 }; // White by default

    // Double-click detection
    this.lastClickTime = [0, 0, 0, 0, 0]; // Timestamp of last click for each button
    this.clickTimers = [null, null, null, null, null]; // Timers for delayed single-click
    this.doubleClickThreshold = 300; // milliseconds

    // All buttons pressed detection
    this.allButtonsPressedTimer = null;
    this.allButtonsPressedTriggered = false;
  }

  /* CONTRÔLE DU DIALOGUE */
  async startDialog() {
    this.dialogStarted = true;
    this.waitingForUserInput = true;
    // éteindre toutes les LEDs
    this.ledsAllOff();
    // effacer la console
    this.fancyLogger.clearConsole();
    // ----- initialiser les variables spécifiques au dialogue -----
    this.nextState = "initialisation";
    this.buttonPressCounter = 0;
    // Préréglages de voix [index de voix, pitch, vitesse]
    //this.preset_voice_normal = ["en-GB", 1, 0.8]; // [voice index, pitch, rate]
    //this.preset_voice_normal = [95, 1, 0.8]; // [voice index, pitch, rate]
    this.preset_voice_normal = [131, 1, 0.9]; // [voice index, pitch, rate]
    //this.preset_voice_normal = [165, 1, 1]; // [voice index, pitch, rate]
    //this.preset_voice_normal = [181, 1, 1]; // [voice index, pitch, rate]
    //this.preset_voice_normal = [182, 1, 0.9]; // [voice index, pitch, rate]
    //this.preset_voice_normal = [183, 1, 1]; // [voice index, pitch, rate]
    //this.preset_voice_normal = [12, 1, 0.8]; // [voice index, pitch, rate]
    // ----- charger les sons audio -----
    this.audioPlayer.resume();
    await this.audioPlayer.loadSounds({
      startup: "../sounds/UI_Startup.wav",
      "profile-loop": "../sounds/Profile-loop.wav",
      select: "../sounds/UI-Select.wav",
      coinflip: "../sounds/coinflip-stylyzed.wav",
      stopwatch: "../sounds/stopwatch-loop.wav",
      "ballon-blow-1": "../sounds/ballon-blow-1.wav",
      "ballon-blow-2": "../sounds/ballon-blow-2.wav",
      "ballon-blow-3": "../sounds/ballon-blow-3.wav",
      "ballon-tripple-blow": "../sounds/balloon-tripple-blow-v2.wav",
      "ballon-pop": "../sounds/Ballon-pop.wav",
      "diceroll-1": "../sounds/Diceroll-1.wav",
      "diceroll-2": "../sounds/Diceroll-2.wav",
      "diceroll-3": "../sounds/Diceroll-3.wav",
      "card-slide": "../sounds/card-slide-higher-pitch.wav",
    });
    // ----- démarrer la machine avec le premier état -----
    this.dialogFlow();
  }

  /* FLUX DU DIALOGUE */
  /**
   * Fonction principale du flux de dialogue
   * @param {string} eventType - Type d'événement ('default', 'pressed', 'released', 'longpress', 'doubleclick')
   * @param {number} button - Numéro du bouton (0-9)
   * @private
   */
  dialogFlow(eventType = "default", button = -1) {
    if (!this.performPreliminaryTests()) {
      // premiers tests avant de continuer vers les règles
      return;
    }
    this.stateUpdate();

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * Flow du DIALOGUE - Guide visuel du flux de conversation
     * ═══════════════════════════════════════════════════════════════════════════
     *
     * initialisation → welcome → choose-color ─┬→ choose-blue → can-speak → count-press → toomuch → enough-pressed
     *                                           │
     *                                           └→ choose-yellow ──┘ (boucle vers choose-color)
     *
     * CONCEPTS CLÉS DE DIALOGUE DÉMONTRÉS:
     * ✓ Progression linéaire: États qui s'enchaînent (initialisation → welcome)
     * ✓ Embranchement: Le choix de l'utilisateur crée différents chemins (choose-color se divise selon le bouton)
     * ✓ Boucles: La conversation peut retourner à des états précédents (choose-yellow boucle)
     * ✓ Mémoire d'état: Le système se souvient des interactions précédentes (buttonPressCounter)
     * ✓ Initiative système: La machine parle sans attendre d'entrée (can-speak)
     *
     * MODIFIEZ LE DIALOGUE CI-DESSOUS - Ajoutez de nouveaux états dans le switch/case
     * ═══════════════════════════════════════════════════════════════════════════
     */

    // Button routing: buttons 1-4 change states OR select profile
    if (eventType === "released" && button >= 1 && button <= 4) {
      // Check if we are in profile selection mode
      if (this.nextState === "change-profile") {
        this.selectProfile(button);
        return;
      }

      // Reset all state variables when changing states
      this.resetStateVariables();

      if (this.alternativeButtons) {
        this.nextState = `state-${["five", "six", "seven", "eight"][button - 1]}`;
      } else {
        this.nextState = `state-${["one", "two", "three", "four"][button - 1]}`;
      }

      // Update LEDs based on the new state
      this.updateStateLEDs(this.nextState);

      // Play select sound and announce the state name with instructions
      const stateName = this.getStateFriendlyName(this.nextState);
      const instructions = this.getStateInstructions(this.nextState);
      this.audioPlayer.playAndWait("select").then(() => {
        this.speakNormal(`${stateName}. ${instructions}`);
      });

      this.goToNextState();
      return;
    }

    switch (this.nextState) {
      case "initialisation":
        // CONCEPT DE DIALOGUE: État de configuration - prépare le système avant l'interaction
        this.ledsAllOff();
        this.nextState = "change-profile";
        this.fancyLogger.logMessage("initialisation done");
        this.audioPlayer.playAndWait("startup").then(() => {
          this.goToNextState();
        });
        break;

      case "state-one": //Coinflip
        handleCoinflipState(this, eventType, button);
        break;

      case "state-two": //Counter
        handleCounterState(this, eventType, button);
        break;

      case "state-three": //Stopwatch
        handleStopwatchState(this, eventType, button);
        break;

      case "state-four": //Decider
        handleDeciderState(this, eventType, button);
        break;

      case "state-five": //Dice
        handleDiceState(this, eventType, button);
        break;

      case "state-six": //Truth or Dare
        handleTruthOrDareState(this, eventType, button);
        break;

      case "state-seven": //pop the balloon
        handlePopTheBalloonState(this, eventType, button);
        break;

      case "state-eight": //never have I ever
        handleNeverHaveIEverState(this, eventType, button);
        break;
      case "change-profile":
        // Profile selection mode
        this.fancyLogger.logMessage("change-profile");

        // Make all LEDs pulse
        for (let i = 0; i < this.maxLeds; i++) {
          this.ledChangeColor(i, "yellow", 2);
        }

        this.audioPlayer.startLoop("profile-loop");
        this.speakNormal("Choose profile");
        break;

      default:
        this.fancyLogger.logWarning(
          `Sorry but State: "${this.nextState}" has no case defined`,
        );
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * Autres fonctions
   * ═══════════════════════════════════════════════════════════════════════════
   */

  /**
   * Reset all state-specific variables when changing states
   */
  resetStateVariables() {
    // Reset counter
    this.counterValue = 0;

    // Reset coinflip
    this.lastCoinFlip = null;

    // Reset stopwatch
    this.stopwatchStartTime = 0;
    this.stopwatchLapTimes = [];
    this.stopwatchIsRunning = false;
    this.stopwatchLastLapTime = 0;
    this.stopwatchLastMessage = "";
    this.audioPlayer.stopLoop("stopwatch");

    // Stop profile loop if playing
    this.audioPlayer.stopLoop("profile-loop");

    // Reset decider
    this.deciderChoices = 0;
    this.deciderLastResult = 0;

    // Reset dice
    this.lastDiceRoll = null;

    // Reset pop the balloon
    this.balloonTarget = 0;
    this.balloonCounter = 0;
    this.balloonGameActive = false;

    // Reset never have I ever
    this.neverHaveIEverCategoryIndex = 4;
    this.neverHaveIEverCategoryConfirmed = false;

    this.fancyLogger.logMessage("State variables reset");
  }

  /**
   * Get the friendly name for a given state
   * @param {string} stateName - The state name
   * @returns {string} The friendly name
   */
  getStateFriendlyName(stateName) {
    const nameMap = {
      "state-one": "Coinflip",
      "state-two": "Counter",
      "state-three": "Stopwatch",
      "state-four": "Decider",
      "state-five": "Dice",
      "state-six": "Truth or Dare",
      "state-seven": "Pop the balloon",
      "state-eight": "Never have I ever",
    };
    return nameMap[stateName] || stateName;
  }

  /**
   * Get usage instructions for a given state
   * @param {string} stateName - The state name
   * @returns {string} The usage instructions
   */
  getStateInstructions(stateName) {
    const instructionsMap = {
      "state-one":
        "Press middle button once to flip, double click to repeat last result.",
      "state-two":
        "Press middle button once to increase, double click to decrease.",
      "state-three":
        "Press middle button to start and record laps, double click to stop and hear results.",
      "state-four":
        "Press middle button to add choices, then double click to decide.",
      "state-five":
        "Press middle button once to roll the dice, double click to repeat last roll.",
      "state-six":
        "Press middle button once to choose truth, double click to choose dare.",
      "state-seven":
        "Press middle button once to increase the balloon by one, double click to increase it by three.",
      "state-eight":
        "Press middle button to select a never have i ever category, double click to confirm, then press to hear statements.",
    };
    return instructionsMap[stateName] || "";
  }

  /**
   * Get the LED index for a given state
   * @param {string} stateName - The state name
   * @returns {number} The LED index (0-3)
   */
  getStateLEDIndex(stateName) {
    const ledMap = {
      "state-one": 0,
      "state-five": 0,
      "state-two": 1,
      "state-six": 1,
      "state-three": 2,
      "state-seven": 2,
      "state-four": 3,
      "state-eight": 3,
    };
    return ledMap[stateName] !== undefined ? ledMap[stateName] : 0;
  }

  /**
   * Update LEDs based on the current state
   * @param {string} stateName - The state name
   */
  updateStateLEDs(stateName) {
    // Turn off all LEDs first
    this.ledsAllOff();

    // Get the LED index for this state
    const ledIndex = this.getStateLEDIndex(stateName);

    // Turn on only the corresponding LED with the active color
    this.ledChangeRGB(
      ledIndex,
      this.activeLedColor.r,
      this.activeLedColor.g,
      this.activeLedColor.b,
    );

    this.fancyLogger.logMessage(`LED ${ledIndex} activated for ${stateName}`);
  }

  /**
   * Check if at least 2 buttons (1-4) are currently pressed
   * @returns {boolean} True if at least 2 buttons from 1-4 are pressed
   */
  areAllButtonsPressed() {
    const pressedCount = [1, 2, 3, 4].filter(btn => this.buttonStates[btn] === 1).length;
    return pressedCount >= 2;
  }

  /**
   * Start the timer for 2+ buttons pressed detection
   */
  startAllButtonsPressedTimer() {
    // Clear any existing timer
    if (this.allButtonsPressedTimer) {
      clearTimeout(this.allButtonsPressedTimer);
    }

    // Reset the triggered flag
    this.allButtonsPressedTriggered = false;

    // Start a new timer for 1000ms
    this.allButtonsPressedTimer = setTimeout(() => {
      if (this.areAllButtonsPressed() && !this.allButtonsPressedTriggered) {
        this.allButtonsPressedTriggered = true;
        this.onAllButtonsPressed();
      }
    }, 1000);

    this.fancyLogger.logMessage("2+ buttons pressed - timer started");
  }

  /**
   * Cancel the 2+ buttons pressed timer
   */
  cancelAllButtonsPressedTimer() {
    if (this.allButtonsPressedTimer) {
      clearTimeout(this.allButtonsPressedTimer);
      this.allButtonsPressedTimer = null;
      this.allButtonsPressedTriggered = false;
    }
  }

  /**
   * Action to perform when 2 or more buttons have been pressed for 1000ms
   */
  onAllButtonsPressed() {
    this.fancyLogger.logMessage(
      "2+ buttons held for 1000ms - entering profile selection",
    );
    this.nextState = "change-profile";
    this.goToNextState();
  }

  /**
   * Select a profile based on button press
   * @param {number} button - Button number (1-4)
   */
  selectProfile(button) {
    this.fancyLogger.logMessage(`Profile selection - button ${button} pressed`);

    // Stop profile loop and play select sound
    this.audioPlayer.stopLoop("profile-loop");
    
    // Button 1 selects profile 1, buttons 2-4 select profile 2
    const selectedProfile = button == 1 ? 1 : 2;

    this.audioPlayer.playAndWait("select").then(() => {
      this.fancyLogger.logMessage(`Profile ${selectedProfile} selected`);
      this.speakNormal(`Profile ${selectedProfile} selected`);
      
      // Reinitialize system with selected profile
      this.reinitializeSystem(selectedProfile);
    });
  }

  /**
   * Reinitialize the entire system after profile selection
   * @param {number} profile - Profile number (1 or 2)
   */
  reinitializeSystem(profile) {
    // Stop LEDs pulsing and turn them off
    this.ledsAllOff();

    // Reset all state variables
    this.resetStateVariables();

    // Reset button states
    this.buttonStates = [0, 0, 0, 0, 0];

    // Cancel all buttons pressed timer
    this.cancelAllButtonsPressedTimer();

    // Clear all double-click timers
    this.clickTimers.forEach((timer) => {
      if (timer) clearTimeout(timer);
    });
    this.clickTimers = [null, null, null, null, null];
    this.lastClickTime = [0, 0, 0, 0, 0];

    // Set alternativeButtons based on profile
    if (profile === 1) {
      this.alternativeButtons = false;
      this.nextState = "state-one";
    } else {
      this.alternativeButtons = true;
      this.nextState = "state-five";
    }

    // Update LEDs and go to first state of profile
    this.updateStateLEDs(this.nextState);
    this.goToNextState();

    this.fancyLogger.logMessage(`System reinitialized for profile ${profile}`);
  }

  /**
   *  fonction shorthand pour dire un texte avec la voix prédéfinie
   *  @param {string} _text le texte à dire
   */
  speakNormal(_text) {
    // appelé pour dire un texte
    this.speechText(_text, this.preset_voice_normal);
  }

  /**
   *  fonction shorthand pour forcer la transition vers l'état suivant dans le flux de dialogue
   *  @param {number} delay - le délai optionnel en millisecondes
   * @private
   */
  goToNextState(delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        this.dialogFlow();
      }, delay);
    } else {
      this.dialogFlow();
    }
  }

  /**
   * Effectuer des tests préliminaires avant de continuer avec le flux de dialogue
   * @returns {boolean} true si tous les tests passent, false sinon
   * @private
   */
  performPreliminaryTests() {
    if (this.dialogStarted === false) {
      this.fancyLogger.logWarning("not started yet, press Start Machine");
      return false;
    }
    if (this.waitingForUserInput === false) {
      this._handleUserInputError();
      return false;
    }
    if (
      this.nextState === "" ||
      this.nextState === null ||
      this.nextState === undefined
    ) {
      this.fancyLogger.logWarning("nextState is empty or undefined");
      return false;
    }

    return true;
  }

  stateUpdate() {
    this.lastState = this.nextState;
    // Mettre à jour l'affichage de l'état
    if (this.stateDisplay) {
      this.stateDisplay.textContent = this.nextState;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * Overrides de TalkMachine
   * ═══════════════════════════════════════════════════════════════════════════
   */
  /**
   * override de _handleButtonPressed de TalkMachine
   * @override
   * @protected
   */
  _handleButtonPressed(button, simulated = false) {
    this.buttonStates[button] = 1;

    // Check if 2+ buttons (1-4) are now pressed
    if (this.areAllButtonsPressed()) {
      this.startAllButtonsPressedTimer();
    }

    if (this.waitingForUserInput) {
      // this.dialogFlow('pressed', button);
    }
  }

  /**
   * override de _handleButtonReleased de TalkMachine
   * @override
   * @protected
   */
  _handleButtonReleased(button, simulated = false) {
    this.buttonStates[button] = 0;

    // Cancel the all buttons timer if any button is released
    this.cancelAllButtonsPressedTimer();

    if (this.waitingForUserInput) {
      this.handleClickWithDoubleDetection(button);
    }
  }

  /**
   * Handle button click with double-click detection
   * @param {number} button - Button number
   * @private
   */
  handleClickWithDoubleDetection(button) {
    // Stop speech if currently speaking
    if (this.speechIsSpeaking === true) {
      this.speechCancel();
    }

    const now = Date.now();
    const timeSinceLastClick = now - this.lastClickTime[button];

    // Clear any pending single-click timer
    if (this.clickTimers[button]) {
      clearTimeout(this.clickTimers[button]);
      this.clickTimers[button] = null;
    }

    // Check if this is a double-click
    if (timeSinceLastClick < this.doubleClickThreshold) {
      // Double-click detected
      this.lastClickTime[button] = 0; // Reset to prevent triple-click
      this.dialogFlow("doubleclick", button);
    } else {
      // Potential single-click - wait to see if another click comes
      this.lastClickTime[button] = now;
      this.clickTimers[button] = setTimeout(() => {
        this.clickTimers[button] = null;
        this.dialogFlow("released", button);
      }, this.doubleClickThreshold);
    }
  }

  /**
   * override de _handleButtonLongPressed de TalkMachine
   * @override
   * @protected
   */
  _handleButtonLongPressed(button, simulated = false) {
    if (this.waitingForUserInput) {
      //this.dialogFlow('longpress', button);
    }
  }

  /**
   * override de _handleTextToSpeechEnded de TalkMachine
   * @override
   * @protected
   */
  _handleTextToSpeechEnded() {
    this.fancyLogger.logSpeech("speech ended");
    if (this.shouldContinue) {
      // aller à l'état suivant après la fin de la parole
      this.shouldContinue = false;
      this.goToNextState();
    }
  }

  /**
   * Gérer l'erreur d'input utilisateur
   * @protected
   */
  _handleUserInputError() {
    this.fancyLogger.logWarning("user input is not allowed at this time");
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * Fonctions pour le simulateur
   * ═══════════════════════════════════════════════════════════════════════════
   */

  /**
   * Gérer les boutons test UI du simulateur
   * @param {number} button - index du bouton
   * @override
   * @protected
   */
  _handleTesterButtons(button) {
    switch (button) {
      case 1:
        this.ledsAllChangeColor("yellow");
        break;
      case 2:
        this.ledsAllChangeColor("green", 1);
        break;
      case 3:
        this.ledsAllChangeColor("pink", 2);
        break;
      case 4:
        this.ledChangeRGB(0, 255, 100, 100);
        this.ledChangeRGB(1, 0, 100, 170);
        this.ledChangeRGB(2, 0, 0, 170);
        this.ledChangeRGB(3, 150, 170, 70);
        this.ledChangeRGB(4, 200, 160, 0);
        break;

      default:
        this.fancyLogger.logWarning("no action defined for button " + button);
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const dialogMachine = new DialogMachine();
});
