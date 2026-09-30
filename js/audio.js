let audioContext;
let themeNodes = [];
let themeLoopTimer = null;
let themeLoopToken = 0;

  function getAudioContext() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    return audioContext;
  }

  function makeNoiseBuffer(context, duration) {
    const buffer = context.createBuffer(
      1,
      context.sampleRate * duration,
      context.sampleRate
    );

    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    return buffer;
  }

  function loseGameSound() {
    const context = getAudioContext();
    const now = context.currentTime;

    // The classic "wah wah waaah"
    const notes = [
      { frequency: 310, start: 0.00, duration: 0.4 },
      { frequency: 240, start: 0.35, duration: 0.4 },
      { frequency: 185, start: 0.70, duration: 0.5 },
      { frequency: 142, start: 1.05, duration: 0.7 },
    ];

    for (const note of notes) {
      const start = now + note.start;
      const end = start + note.duration;

      const oscillator = context.createOscillator();
      const detuned = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();

      oscillator.type = "sawtooth";
      detuned.type = "triangle";

      oscillator.frequency.setValueAtTime(note.frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(
        note.frequency * 0.82,
        end
      );

      detuned.frequency.setValueAtTime(note.frequency * 0.99, start);
      detuned.frequency.exponentialRampToValueAtTime(
        note.frequency * 0.81,
        end
      );

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(700, start);
      filter.frequency.exponentialRampToValueAtTime(180, end);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.035);
      gain.gain.setValueAtTime(0.22, end - 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, end);

      oscillator.connect(filter);
      detuned.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      detuned.start(start);

      oscillator.stop(end + 0.02);
      detuned.stop(end + 0.02);
    }
  }

  function winGameSound() {
    const context = getAudioContext();
    const now = context.currentTime;

    // C major fanfare: C, E, G, high C
    const notes = [
      { frequency: 523, start: 0.00, duration: 0.18 },
      { frequency: 659, start: 0.16, duration: 0.18 },
      { frequency: 784, start: 0.32, duration: 0.18 },
      { frequency: 1047, start: 0.48, duration: 0.65 }
    ];

    for (const note of notes) {
      const start = now + note.start;
      const end = start + note.duration;

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.value = note.frequency;

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.22, start + 0.025);
      gain.gain.setValueAtTime(0.22, end - 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, end);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      oscillator.stop(end + 0.02);
    }

    // Final bright sparkle
    [1047, 1319, 1568].forEach((frequency, index) => {
      const sparkle = context.createOscillator();
      const gain = context.createGain();
      const start = now + 0.72 + index * 0.07;

      sparkle.type = "sine";
      sparkle.frequency.value = frequency;

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      sparkle.connect(gain);
      gain.connect(context.destination);

      sparkle.start(start);
      sparkle.stop(start + 0.22);
    });
  }


  function punchSound() {
    const context = getAudioContext();
    const now = context.currentTime;

    // The hit is deliberately stylised rather than realistic:
    // a sharp "D" followed by an extended, descending, fuzzy UGH tail.
    const main = context.createOscillator();
    const second = context.createOscillator();
    const distortion = context.createWaveShaper();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    main.type = "sawtooth";
    second.type = "triangle";

    main.frequency.setValueAtTime(220, now);
    main.frequency.exponentialRampToValueAtTime(58, now + 0.72);

    second.frequency.setValueAtTime(115, now);
    second.frequency.exponentialRampToValueAtTime(38, now + 0.72);

    // Slightly stronger than UGH so the initial D has some definition.
    distortion.curve = makeDistortionCurve(240);
    distortion.oversample = "2x";

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.72);

    // Very quick synthetic attack = the "D".
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.48, now + 0.025);

    // Hold the body, then let the whole thing sink away into the low end.
    gain.gain.setValueAtTime(0.42, now + 0.16);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.82);

    main.connect(distortion);
    second.connect(distortion);
    distortion.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    main.start(now);
    second.start(now);

    main.stop(now + 0.84);
    second.stop(now + 0.84);
  }

  function ughSound() {
    const context = getAudioContext();
    const now = context.currentTime;

    // Two oscillators make it sound less like a pure beep
    const main = context.createOscillator();
    const second = context.createOscillator();

    const distortion = context.createWaveShaper();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();

    main.type = "sawtooth";
    second.type = "triangle";

    main.frequency.setValueAtTime(180, now);
    main.frequency.exponentialRampToValueAtTime(75, now + 0.55);

    second.frequency.setValueAtTime(92, now);
    second.frequency.exponentialRampToValueAtTime(48, now + 0.55);

    // Mild distortion
    distortion.curve = makeDistortionCurve(180);
    distortion.oversample = "2x";

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(260, now + 0.55);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
    gain.gain.setValueAtTime(0.35, now + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    main.connect(distortion);
    second.connect(distortion);
    distortion.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);

    main.start(now);
    second.start(now);

    main.stop(now + 0.66);
    second.stop(now + 0.66);
  }


  function rangedAttackSound() {
    const context = getAudioContext();
    const now = context.currentTime;

    // Fast projectile pass: a dry "TSH" launch, rising "EE", then a
    // descending "OO" tail. This is intentionally not an impact sound.
    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();

    noise.buffer = makeNoiseBuffer(context, 0.075);
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1300, now + 0.055);
    noiseFilter.Q.value = 1.25;

    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.20, now + 0.006);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(context.destination);
    noise.start(now);
    noise.stop(now + 0.08);

    // Rising "EE" — narrow, bright and slightly nasal.
    const rise = context.createOscillator();
    const riseFilter = context.createBiquadFilter();
    const riseGain = context.createGain();

    rise.type = "triangle";
    rise.frequency.setValueAtTime(612.5, now + 0.018);
    rise.frequency.exponentialRampToValueAtTime(1025, now + 0.115);

    riseFilter.type = "bandpass";
    riseFilter.frequency.setValueAtTime(750, now + 0.018);
    riseFilter.frequency.exponentialRampToValueAtTime(1075, now + 0.115);
    riseFilter.Q.value = 2.2;

    riseGain.gain.setValueAtTime(0.001, now + 0.018);
    riseGain.gain.exponentialRampToValueAtTime(0.12, now + 0.035);
    riseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.125);

    rise.connect(riseFilter);
    riseFilter.connect(riseGain);
    riseGain.connect(context.destination);
    rise.start(now + 0.018);
    rise.stop(now + 0.14);

    // Falling "OO" — a smooth pitch glide that gives the projectile its
    // trailing, passing-through-the-air character.
    const tail = context.createOscillator();
    const tailFilter = context.createBiquadFilter();
    const tailGain = context.createGain();

    tail.type = "sine";
    // Whole sound shifted down one octave, keeping the same contour.
    tail.frequency.setValueAtTime(875, now + 0.075);
    tail.frequency.exponentialRampToValueAtTime(437.5, now + 0.31);

    tailFilter.type = "lowpass";
    tailFilter.frequency.setValueAtTime(900, now + 0.075);
    tailFilter.frequency.exponentialRampToValueAtTime(450, now + 0.31);

    tailGain.gain.setValueAtTime(0.001, now + 0.075);
    tailGain.gain.exponentialRampToValueAtTime(0.095, now + 0.095);
    tailGain.gain.setValueAtTime(0.075, now + 0.17);
    tailGain.gain.exponentialRampToValueAtTime(0.001, now + 0.33);

    tail.connect(tailFilter);
    tailFilter.connect(tailGain);
    tailGain.connect(context.destination);
    tail.start(now + 0.075);
    tail.stop(now + 0.35);
  }

  function thrownAttackSound() {
    const context = getAudioContext();
    const now = context.currentTime;

    // Short physical "SH" — the weapon leaving the hand.
    const sh = context.createBufferSource();
    const shFilter = context.createBiquadFilter();
    const shGain = context.createGain();

    sh.buffer = makeNoiseBuffer(context, 0.065);
    shFilter.type = "bandpass";
    shFilter.frequency.setValueAtTime(900, now);
    shFilter.frequency.exponentialRampToValueAtTime(2200, now + 0.055);
    shFilter.Q.value = 0.9;

    shGain.gain.setValueAtTime(0.001, now);
    shGain.gain.exponentialRampToValueAtTime(0.16, now + 0.008);
    shGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

    sh.connect(shFilter);
    shFilter.connect(shGain);
    shGain.connect(context.destination);
    sh.start(now);
    sh.stop(now + 0.07);

    // Rising "WEE" — brighter and more solid than the ranged projectile sound.
    const wee = context.createOscillator();
    const weeFilter = context.createBiquadFilter();
    const weeGain = context.createGain();

    wee.type = "triangle";
    wee.frequency.setValueAtTime(620, now + 0.018);
    wee.frequency.exponentialRampToValueAtTime(2650, now + 0.25);

    weeFilter.type = "bandpass";
    weeFilter.frequency.setValueAtTime(1000, now + 0.018);
    weeFilter.frequency.exponentialRampToValueAtTime(3000, now + 0.25);
    weeFilter.Q.value = 1.4;

    weeGain.gain.setValueAtTime(0.001, now + 0.018);
    weeGain.gain.exponentialRampToValueAtTime(0.13, now + 0.045);
    weeGain.gain.setValueAtTime(0.10, now + 0.16);
    weeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.29);

    wee.connect(weeFilter);
    weeFilter.connect(weeGain);
    weeGain.connect(context.destination);
    wee.start(now + 0.018);
    wee.stop(now + 0.31);
  }


  function weaponEquipSound() {
    const context = getAudioContext();
    const now = context.currentTime;

    // Rising metallic "shing"
    const shing = context.createOscillator();
    const shingGain = context.createGain();
    const shingFilter = context.createBiquadFilter();

    shing.type = "triangle";
    shing.frequency.setValueAtTime(280, now);
    shing.frequency.exponentialRampToValueAtTime(1700, now + 0.22);

    shingFilter.type = "highpass";
    shingFilter.frequency.value = 500;

    shingGain.gain.setValueAtTime(0.001, now);
    shingGain.gain.exponentialRampToValueAtTime(0.35, now + 0.015);
    shingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    shing.connect(shingFilter);
    shingFilter.connect(shingGain);
    shingGain.connect(context.destination);

    shing.start(now);
    shing.stop(now + 0.3);

    // Bright "cling" after the weapon is drawn
    const cling = context.createOscillator();
    const clingGain = context.createGain();

    cling.type = "sine";
    cling.frequency.setValueAtTime(1800, now + 0.18);
    cling.frequency.exponentialRampToValueAtTime(1100, now + 0.65);

    clingGain.gain.setValueAtTime(0.001, now + 0.18);
    clingGain.gain.exponentialRampToValueAtTime(0.3, now + 0.2);
    clingGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    cling.connect(clingGain);
    clingGain.connect(context.destination);

    cling.start(now + 0.18);
    cling.stop(now + 0.6);

    // Quiet metallic overtone
    const overtone = context.createOscillator();
    const overtoneGain = context.createGain();

    overtone.type = "square";
    overtone.frequency.value = 2750;

    overtoneGain.gain.setValueAtTime(0.001, now + 0.18);
    overtoneGain.gain.exponentialRampToValueAtTime(0.08, now + 0.2);
    overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    overtone.connect(overtoneGain);
    overtoneGain.connect(context.destination);

    overtone.start(now + 0.18);
    overtone.stop(now + 0.6);
  }

  function discardSound() {
      const context = getAudioContext();
      const now = context.currentTime;

      // Descending "falling away" tone
      const fall = context.createOscillator();
      const fallGain = context.createGain();
      const fallFilter = context.createBiquadFilter();

      fall.type = "sine";
      fall.frequency.setValueAtTime(700, now);
      fall.frequency.exponentialRampToValueAtTime(55, now + 0.8);

      fallFilter.type = "lowpass";
      fallFilter.frequency.setValueAtTime(1800, now);
      fallFilter.frequency.exponentialRampToValueAtTime(180, now + 0.8);

      fallGain.gain.setValueAtTime(0.001, now);
      fallGain.gain.exponentialRampToValueAtTime(0.25, now + 0.03);
      fallGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      fall.connect(fallFilter);
      fallFilter.connect(fallGain);
      fallGain.connect(context.destination);

      fall.start(now);
      fall.stop(now + 0.9);

      // Wind noise fading into the distance
      const wind = context.createBufferSource();
      const windFilter = context.createBiquadFilter();
      const windGain = context.createGain();

      wind.buffer = makeNoiseBuffer(context, 0.9);

      windFilter.type = "bandpass";
      windFilter.frequency.setValueAtTime(1000, now);
      windFilter.frequency.exponentialRampToValueAtTime(180, now + 0.8);
      windFilter.Q.value = 0.7;

      windGain.gain.setValueAtTime(0.001, now);
      windGain.gain.exponentialRampToValueAtTime(0.18, now + 0.08);
      windGain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(context.destination);

      wind.start(now);
      wind.stop(now + 0.7);

      // Distant impact at the bottom
      //const impact = context.createOscillator();
      //const impactGain = context.createGain();

      //impact.type = "sine";
      //impact.frequency.setValueAtTime(90, now + 0.82);
      //impact.frequency.exponentialRampToValueAtTime(35, now + 1.05);

      //impactGain.gain.setValueAtTime(0.001, now + 0.82);
      //impactGain.gain.exponentialRampToValueAtTime(0.3, now + 0.84);
      //impactGain.gain.exponentialRampToValueAtTime(0.001, now + 1.1);

      //impact.connect(impactGain);
      //impactGain.connect(context.destination);

      //impact.start(now + 0.82);
      //impact.stop(now + 1.15);
  }

  function eatFoodSound() {
      const context = getAudioContext();
      const now = context.currentTime;

      function makeCrunch(start, duration, centerFrequency, volume) {
        // Main crunchy texture
        const noise = context.createBufferSource();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();

        noise.buffer = makeNoiseBuffer(context, duration);

        filter.type = "bandpass";
        filter.frequency.setValueAtTime(centerFrequency * 0.65, start);
        filter.frequency.exponentialRampToValueAtTime(
          centerFrequency * 1.1,
          start + duration
        );
        filter.Q.value = 0.45;

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.035);
        gain.gain.setValueAtTime(volume * 0.8, start + duration * 0.45);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          start + duration
        );

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);

        noise.start(start);
        noise.stop(start + duration + 0.01);

        // Low "CHOCK" body
        const thump = context.createOscillator();
        const thumpGain = context.createGain();

        thump.type = "triangle";
        thump.frequency.setValueAtTime(115, start);
        thump.frequency.exponentialRampToValueAtTime(58, start + 0.22);

        thumpGain.gain.setValueAtTime(0.001, start);
        thumpGain.gain.exponentialRampToValueAtTime(0.55, start + 0.018);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

        thump.connect(thumpGain);
        thumpGain.connect(context.destination);

        thump.start(start);
        thump.stop(start + 0.28);

        // Short low-mid knock for the hard bite
        const knock = context.createOscillator();
        const knockGain = context.createGain();

        knock.type = "square";
        knock.frequency.setValueAtTime(180, start);
        knock.frequency.exponentialRampToValueAtTime(85, start + 0.12);

        knockGain.gain.setValueAtTime(0.001, start);
        knockGain.gain.exponentialRampToValueAtTime(0.12, start + 0.01);
        knockGain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

        knock.connect(knockGain);
        knockGain.connect(context.destination);

        knock.start(start);
        knock.stop(start + 0.17);

        // Fewer, quieter crackles so it is not too rustly
        for (let i = 0; i < 10; i++) {
          const crackStart =
            start + 0.025 + Math.random() * (duration - 0.04);
          const crackDuration = 0.018 + Math.random() * 0.035;

          const crack = context.createBufferSource();
          const crackFilter = context.createBiquadFilter();
          const crackGain = context.createGain();

          crack.buffer = makeNoiseBuffer(context, crackDuration);

          crackFilter.type = "highpass";
          crackFilter.frequency.value = 1800 + Math.random() * 1400;

          crackGain.gain.setValueAtTime(0.001, crackStart);
          crackGain.gain.exponentialRampToValueAtTime(
            0.018 + Math.random() * 0.025,
            crackStart + 0.003
          );
          crackGain.gain.exponentialRampToValueAtTime(
            0.001,
            crackStart + crackDuration
          );

          crack.connect(crackFilter);
          crackFilter.connect(crackGain);
          crackGain.connect(context.destination);

          crack.start(crackStart);
          crack.stop(crackStart + crackDuration + 0.005);
        }
      }


      // Crunch crunch
      makeCrunch(now,        0.36, 700, 0.25);
      makeCrunch(now + 0.28, 0.36, 850, 0.23);

      // Healing sparkle
      const sparkleNotes = [
          { frequency: 1047,  delay: 0.48 },
          { frequency: 1319,  delay: 0.55 },
          { frequency: 1568, delay: 0.62 }
      ];

      for (const note of sparkleNotes) {
          const sparkle = context.createOscillator();
          const gain = context.createGain();
          const start = now + note.delay;

          sparkle.type = "sine";
          sparkle.frequency.value = note.frequency;

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.exponentialRampToValueAtTime(0.14, start + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

          sparkle.connect(gain);
          gain.connect(context.destination);

          sparkle.start(start);
          sparkle.stop(start + 0.28);
      }
  }

  function drinkSound() {
    const context = getAudioContext();
    const now = context.currentTime;

    function makeGulp(start, pitch, volume) {
      // Brighter, more audible gulp: a rounded tone with a small wet/noisy edge.
      const tone = context.createOscillator();
      const toneFilter = context.createBiquadFilter();
      const toneGain = context.createGain();

      tone.type = "triangle";
      tone.frequency.setValueAtTime(pitch, start);
      tone.frequency.exponentialRampToValueAtTime(pitch * 0.64, start + 0.13);

      toneFilter.type = "lowpass";
      toneFilter.frequency.setValueAtTime(1150, start);
      toneFilter.frequency.exponentialRampToValueAtTime(520, start + 0.13);

      toneGain.gain.setValueAtTime(0.001, start);
      toneGain.gain.exponentialRampToValueAtTime(volume, start + 0.010);
      toneGain.gain.exponentialRampToValueAtTime(0.001, start + 0.145);

      tone.connect(toneFilter);
      toneFilter.connect(toneGain);
      toneGain.connect(context.destination);
      tone.start(start);
      tone.stop(start + 0.16);

      const noise = context.createBufferSource();
      const noiseFilter = context.createBiquadFilter();
      const noiseGain = context.createGain();

      noise.buffer = makeNoiseBuffer(context, 0.045);
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(700, start);
      noiseFilter.frequency.exponentialRampToValueAtTime(1250, start + 0.045);
      noiseFilter.Q.value = 0.7;

      noiseGain.gain.setValueAtTime(0.001, start);
      noiseGain.gain.exponentialRampToValueAtTime(volume * 0.36, start + 0.007);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(context.destination);
      noise.start(start);
      noise.stop(start + 0.055);
    }

    // Three quick swallows across the same ~0.28s window as the two crunches.
    makeGulp(now,        275, 0.29);
    makeGulp(now + 0.13, 250, 0.28);
    makeGulp(now + 0.26, 225, 0.27);

    // Same healing ping as eating, deliberately unchanged.
    const sparkleNotes = [
      { frequency: 1047, delay: 0.48 },
      { frequency: 1319, delay: 0.55 },
      { frequency: 1568, delay: 0.62 }
    ];

    for (const note of sparkleNotes) {
      const sparkle = context.createOscillator();
      const gain = context.createGain();
      const start = now + note.delay;

      sparkle.type = "sine";
      sparkle.frequency.value = note.frequency;

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.14, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);

      sparkle.connect(gain);
      gain.connect(context.destination);
      sparkle.start(start);
      sparkle.stop(start + 0.28);
    }
  }

  function fleeSound() {
      const context = getAudioContext();
      const now = context.currentTime;

      const notes = [
          { frequency: 480, start: 0.00, duration: 0.24 },
          { frequency: 320, start: 0.38, duration: 0.42 }
      ];

      for (const note of notes) {
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          const filter = context.createBiquadFilter();

          oscillator.type = "triangle";

          // Slight downward pitch movement makes it feel more vocal
          oscillator.frequency.setValueAtTime(note.frequency, now + note.start);
          oscillator.frequency.exponentialRampToValueAtTime(
          note.frequency * 0.88,
          now + note.start + note.duration
          );

          filter.type = "lowpass";
          filter.frequency.value = 1200;

          const start = now + note.start;
          const end = start + note.duration;

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.exponentialRampToValueAtTime(0.28, start + 0.025);
          gain.gain.setValueAtTime(0.28, end - 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, end);

          oscillator.connect(filter);
          filter.connect(gain);
          gain.connect(context.destination);

          oscillator.start(start);
          oscillator.stop(end + 0.02);
      }
  }

  function dealCardsSound(cardCount = 3) {
      const context = getAudioContext();
      const now = context.currentTime;

      for (let i = 0; i < cardCount; i++) {
          const start = now + i * 0.09;
          const duration = 0.075;

          const whoosh = context.createBufferSource();
          const filter = context.createBiquadFilter();
          const gain = context.createGain();

          whoosh.buffer = makeNoiseBuffer(context, duration);

          filter.type = "bandpass";
          filter.frequency.setValueAtTime(
          900 + Math.random() * 500,
          start
          );
          filter.frequency.exponentialRampToValueAtTime(
          2400 + Math.random() * 700,
          start + duration
          );
          filter.Q.value = 1.1;

          gain.gain.setValueAtTime(0.001, start);
          gain.gain.exponentialRampToValueAtTime(0.22, start + 0.008);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

          whoosh.connect(filter);
          filter.connect(gain);
          gain.connect(context.destination);

          whoosh.start(start);
          whoosh.stop(start + duration + 0.01);
      }
  }

  function makeDistortionCurve(amount) {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const k = amount;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] =
        ((3 + k) * x * 20 * Math.PI / 180) /
        (Math.PI + k * Math.abs(x));
    }

    return curve;
  }

  function stopDeckDungeonTheme() {
    // Invalidate any already-queued loop callback before stopping the
    // currently playing nodes, so an old loop cannot restart later.
    themeLoopToken += 1;

    if (themeLoopTimer) {
      clearTimeout(themeLoopTimer);
      themeLoopTimer = null;
    }

    if (!themeNodes.length || !audioContext) return;

    const now = audioContext.currentTime;
    themeNodes.forEach(function(node) {
      try { node.stop(now); } catch (e) {}
    });
    themeNodes = [];
  }

  const THEME_TUNE = {
    beat: 0.42,

    notes: {
      A1: 55.00, Bb1: 58.27, C2: 65.41, D2: 73.42, A2: 110.00,
      A3: 220.00, D4: 293.66, E4: 329.63, F4: 349.23,
      G4: 392.00, A4: 440.00, C5: 523.25, D5: 587.33, F5: 698.46
    },

    melody: [
      ["D4", 0, 1], ["F4", 1, 0.5], ["A4", 1.5, 0.5],
      ["G4", 2, 1], ["F4", 3, 0.5], ["E4", 3.5, 0.5],
      ["D4", 4, 1], ["A3", 5, 0.5], ["D4", 5.5, 0.5],
      ["F4", 6, 1], ["G4", 7, 0.5], ["A4", 7.5, 0.5],
      ["C5", 8, 1], ["A4", 9, 0.5], ["G4", 9.5, 0.5],
      ["F4", 10, 1], ["E4", 11, 0.5], ["D4", 11.5, 0.5],
      ["A4", 12, 1], ["C5", 13, 0.5], ["D5", 13.5, 0.5],
      ["F5", 14, 1.5], ["D5", 15.5, 0.5],
      ["A4", 16, 0.5], ["C5", 16.5, 0.5], ["D5", 17, 6]
    ],

    variation: [
      ["D4", 0, 0.5], ["F4", 0.5, 0.5], ["A4", 1, 1],
      ["G4", 2.5, 0.5], ["F4", 3, 0.5], ["E4", 3.5, 0.5],
      ["D4", 4, 1], ["A3", 5, 0.5], ["D4", 5.5, 0.5],
      ["F4", 6, 0.5], ["G4", 6.5, 0.5], ["A4", 7, 1],
      ["C5", 8, 0.5], ["D4", 8.5, 0.5], ["C5", 9, 0.5],
      ["A4", 9.5, 0.5], ["G4", 10, 1], ["F4", 11, 0.5],
      ["E4", 11.5, 0.5], ["A4", 12, 0.5], ["C5", 12.5, 0.5],
      ["D5", 13, 1], ["F4", 14, 1], ["E4", 15, 0.5],
      ["D4", 15.5, 0.5], ["A4", 16, 0.5], ["C5", 16.5, 0.5],
      ["D5", 17, 3]
    ],

    bass: [
      ["D2", 0, 2], ["A2", 2, 2], ["Bb1", 4, 2], ["A1", 6, 2],
      ["D2", 8, 2], ["C2", 10, 2], ["Bb1", 12, 2], ["A1", 14, 2],
      ["D2", 16, 2]
    ]
  };

  const THEME_INSTRUMENTS = {
    dungeon: {
      melody: { type: "triangle", filter: 2400, volume: 0.14 },
      bass: { type: "sawtooth", filter: 1500, volume: 0.10 },
      drum: { type: "sine", start: 105, end: 42, volume: 0.24 }
    },

    shaun: {
      melody: {
        type: "sawtooth",
        filter: 2600,
        volume: 0.052,
        distortion: 3,
        detune: 8,
        secondVolume: 0.38,
        attack: 0.012,
        release: 0.065
      },
      bass: { type: "triangle", filter: 700, volume: 0.075 },
      drum: { type: "triangle", start: 125, end: 55, volume: 0.20 }
    },

    space: {
      melody: { type: "sine", filter: 3200, volume: 0.12 },
      bass: { type: "sawtooth", filter: 700, volume: 0.09 },
      drum: { type: "sine", start: 80, end: 28, volume: 0.20 }
    },

    pirate: {
      melody: { type: "sawtooth", filter: 1200, volume: 0.08 },
      bass: { type: "triangle", filter: 900, volume: 0.14 },
      drum: { type: "square", start: 115, end: 48, volume: 0.16 }
    },

    ninja: {
      melody: { type: "triangle", filter: 3600, volume: 0.11 },
      bass: { type: "sine", filter: 850, volume: 0.11 },
      drum: { type: "sine", start: 150, end: 35, volume: 0.17 }
    }
  };

  function deckDungeonTheme(themeKey) {
    const context = getAudioContext();
    const now = context.currentTime;
    const beat = THEME_TUNE.beat;
    const preset = THEME_INSTRUMENTS[themeKey] || THEME_INSTRUMENTS.dungeon;

    function playNote(noteName, startBeat, length, instrument) {
      const frequency = THEME_TUNE.notes[noteName];
      const start = now + startBeat * beat;
      const end = start + length * beat;
      const oscillator = context.createOscillator();
      const secondOscillator = instrument.detune
        ? context.createOscillator()
        : null;
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      let output = filter;

      oscillator.type = instrument.type;
      oscillator.frequency.value = frequency;

      if (secondOscillator) {
        secondOscillator.type = instrument.type;
        secondOscillator.frequency.value = frequency;
        secondOscillator.detune.value = instrument.detune;
      }

      filter.type = "lowpass";
      filter.frequency.value = instrument.filter;

      if (instrument.distortion) {
        const distortion = context.createWaveShaper();
        distortion.curve = makeDistortionCurve(instrument.distortion);
        distortion.oversample = "2x";
        filter.connect(distortion);
        output = distortion;
      }

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(
        instrument.volume,
        start + (instrument.attack || 0.025)
      );
      gain.gain.setValueAtTime(
        instrument.volume * 0.72,
        Math.max(start + 0.01, end - (instrument.release || 0.08))
      );
      gain.gain.exponentialRampToValueAtTime(0.001, end);

      oscillator.connect(filter);

      if (secondOscillator) {
        const secondGain = context.createGain();
        secondGain.gain.value = instrument.secondVolume || 0.35;
        secondOscillator.connect(secondGain);
        secondGain.connect(filter);
      }

      output.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      oscillator.stop(end + 0.03);
      themeNodes.push(oscillator);

      if (secondOscillator) {
        secondOscillator.start(start);
        secondOscillator.stop(end + 0.03);
        themeNodes.push(secondOscillator);
      }
    }

    function playDrum(start) {
      const instrument = preset.drum;
      const drum = context.createOscillator();
      const gain = context.createGain();

      drum.type = instrument.type;
      drum.frequency.setValueAtTime(instrument.start, start);
      drum.frequency.exponentialRampToValueAtTime(instrument.end, start + 0.2);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(instrument.volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

      drum.connect(gain);
      gain.connect(context.destination);
      drum.start(start);
      drum.stop(start + 0.27);
      themeNodes.push(drum);
    }

    const passLength = 16;
    const totalPasses = 4;

    THEME_TUNE.melody.forEach(([note, start, length]) =>
      playNote(note, start, length, preset.melody)
    );

    THEME_TUNE.melody.forEach(([note, start, length]) =>
      playNote(note, start + passLength, length, preset.melody)
    );

    THEME_TUNE.variation.forEach(([note, start, length]) =>
      playNote(note, start + passLength * 2, length, preset.melody)
    );

    THEME_TUNE.melody.forEach(([note, start, length]) =>
      playNote(note, start + passLength * 3, length, {
        type: preset.melody.type,
        filter: preset.melody.filter,
        volume: preset.melody.volume * 1.28
      })
    );

    for (let pass = 0; pass < totalPasses; pass++) {
      THEME_TUNE.bass.forEach(([note, start, length]) =>
        playNote(note, start + pass * passLength, length, preset.bass)
      );

      [0, 4, 8, 12, 16].forEach(beatNumber =>
        playDrum(now + (pass * passLength + beatNumber) * beat)
      );
    }
  }

  function playDeckDungeonThemeLoop() {
    stopDeckDungeonTheme();

    const loopToken = themeLoopToken;

    function playLoop() {
      if (loopToken !== themeLoopToken) return;

      deckDungeonTheme(window.selectedTheme || 'dungeon');

      // The four-pass arrangement occupies 16 beats per pass.
      // Restart slightly before the final scheduled notes have finished so
      // the tune can continue without an audible gap.
      const loopDuration = 71 * 0.42 * 1000;
      themeLoopTimer = setTimeout(function() {
        if (loopToken !== themeLoopToken) return;
        playLoop();
      }, loopDuration);
    }

    playLoop();
  }

  window.drinkSound = drinkSound;
  window.thrownAttackSound = thrownAttackSound;
  window.rangedAttackSound = rangedAttackSound;
  window.playDeckDungeonThemeLoop = playDeckDungeonThemeLoop;
  window.stopDeckDungeonTheme = stopDeckDungeonTheme;
