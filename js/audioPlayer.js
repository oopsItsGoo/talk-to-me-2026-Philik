// audioPlayer.js
/* ==================================================================
importer avec :

  import AudioPlayer from "./audioPlayer.js";

----

Charger des audios:

  this.audioPlayer.resume(); // obligatoire après un geste utilisateur
  await this.audioPlayer.loadSounds({
    //load sounds here
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
    startup: "../sounds/UI-Startup.wav",
    profile: "../sounds/Profile-loop.wav",
    select: "../sounds/UI-Select.wav",
    card-slide: "../sounds/card-slide-higher-pitch.wav",
  });

----

Jouer "gameover" ->  "/sounds/gameover.wav"

  this.audioPlayer.play("gameover");

----

Jouer "gameover" et attendre jusqu'a que l'audio soit terminé

  this.audioPlayer.playAndWait(name).then(() => {
    // code ici est executé après la fin de l'audio
  });

================================================================== */

export default class AudioPlayer {
  constructor() {
    this.audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    this.buffers = {}; // Store loaded audio buffers
    this.loopingSources = {}; // Store looping sources
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = 1; // Master volume
  }

  // Preload audio files
  async loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.buffers[name] = audioBuffer;
      console.log(`✅ Loaded: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to load ${name}:`, error);
    }
  }

  // Load multiple sounds at once
  async loadSounds(soundMap) {
    const promises = Object.entries(soundMap).map(([name, url]) =>
      this.loadSound(name, url),
    );
    await Promise.all(promises);
  }

  // Play a sound immediately
  play(name, volume = 1.0) {
    if (!this.buffers[name]) {
      console.warn(`Sound "${name}" not loaded`);
      return;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = this.buffers[name];
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.gainNode);

    source.start(0);
  }
  // Joue un son et retourne une Promise qui resolve quand le son est terminé
  playAndWait(name, volume = 1.0) {
    return new Promise((resolve) => {
      if (!this.buffers[name]) {
        console.warn(`Sound "${name}" not loaded`);
        resolve(); // resolve quand même pour ne pas bloquer
        return;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();

      source.buffer = this.buffers[name];
      gainNode.gain.value = volume;

      source.connect(gainNode);
      gainNode.connect(this.gainNode);

      source.onended = () => resolve(); // ← resolve quand le son se termine
      source.start(0);
    });
  }

  // Start looping a sound
  startLoop(name, volume = 1.0) {
    if (!this.buffers[name]) {
      console.warn(`Sound "${name}" not loaded`);
      return;
    }

    // Stop any existing loop for this sound
    this.stopLoop(name);

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = this.buffers[name];
    source.loop = true;
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(this.gainNode);

    source.start(0);

    // Store the source so we can stop it later
    this.loopingSources[name] = source;
  }

  // Stop looping a sound
  stopLoop(name) {
    if (this.loopingSources[name]) {
      this.loopingSources[name].stop();
      delete this.loopingSources[name];
    }
  }

  // Set master volume
  setVolume(value) {
    this.gainNode.gain.value = Math.max(0, Math.min(1, value));
  }

  // Resume audio context (required for user interaction)
  resume() {
    if (this.audioContext.state === "suspended") {
      return this.audioContext.resume();
    }
  }
}
