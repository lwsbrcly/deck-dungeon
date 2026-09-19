<script>
  let audioContext;
  let themeNodes = [];

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

      // Low thump
      const thump = context.createOscillator();
      const thumpGain = context.createGain();

      thump.type = "sine";
      thump.frequency.setValueAtTime(130, now);
      thump.frequency.exponentialRampToValueAtTime(45, now + 0.12);

      thumpGain.gain.setValueAtTime(0.8, now);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      thump.connect(thumpGain);
      thumpGain.connect(context.destination);

      thump.start(now);
      thump.stop(now + 0.16);

      // Sharp impact noise
      const noise = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const noiseGain = context.createGain();

      noise.buffer = makeNoiseBuffer(context, 0.12);

      filter.type = "highpass";
      filter.frequency.value = 400;

      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(context.destination);

      noise.start(now);
      noise.stop(now + 0.15);
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

    function deckDungeonTheme() {
      const context = getAudioContext();
      const now = context.currentTime;

      const beat = 0.42;

      const noteFrequencies = {
        "A1": 55.00,
        "Bb1": 58.27,
        "C2": 65.41,
        "D2": 73.42,
        "A2": 110.00,

        "A3": 220.00,
        "D4": 293.66,
        "E4": 329.63,
        "F4": 349.23,
        "G4": 392.00,
        "A4": 440.00,
        "C5": 523.25,
        "D5": 587.33,
        "F5": 698.46
      };

      // D minor-ish melody
      const mainTheme = [
        ["D4", 0, 1],
        ["F4", 1, 0.5],
        ["A4", 1.5, 0.5],
        ["G4", 2, 1],
        ["F4", 3, 0.5],
        ["E4", 3.5, 0.5],

        ["D4", 4, 1],
        ["A3", 5, 0.5],
        ["D4", 5.5, 0.5],
        ["F4", 6, 1],
        ["G4", 7, 0.5],
        ["A4", 7.5, 0.5],

        ["C5", 8, 1],
        ["A4", 9, 0.5],
        ["G4", 9.5, 0.5],
        ["F4", 10, 1],
        ["E4", 11, 0.5],
        ["D4", 11.5, 0.5],

        ["A4", 12, 1],
        ["C5", 13, 0.5],
        ["D5", 13.5, 0.5],
        ["F5", 14, 1.5],
        ["D5", 15.5, 0.5],

        ["A4", 16, 0.5],
        ["C5", 16.5, 0.5],
        ["D5", 17, 6]
      ];

      const variation = [
        ["D4", 0, 0.5],
        ["F4", 0.5, 0.5],
        ["A4", 1, 1],
        ["G4", 2.5, 0.5],
        ["F4", 3, 0.5],
        ["E4", 3.5, 0.5],

        ["D4", 4, 1],
        ["A3", 5, 0.5],
        ["D4", 5.5, 0.5],
        ["F4", 6, 0.5],
        ["G4", 6.5, 0.5],
        ["A4", 7, 1],

        ["C5", 8, 0.5],
        ["D4", 8.5, 0.5],
        ["C5", 9, 0.5],
        ["A4", 9.5, 0.5],
        ["G4", 10, 1],
        ["F4", 11, 0.5],
        ["E4", 11.5, 0.5],

        ["A4", 12, 0.5],
        ["C5", 12.5, 0.5],
        ["D5", 13, 1],
        ["F4", 14, 1],
        ["E4", 15, 0.5],
        ["D4", 15.5, 0.5],

        ["A4", 16, 0.5],
        ["C5", 16.5, 0.5],
        ["D5", 17, 3]
      ];

      // Low medieval-sounding bass notes
      const bass = [
        ["D2", 0, 2],
        ["A2", 2, 2],
        ["Bb1", 4, 2],
        ["A1", 6, 2],

        ["D2", 8, 2],
        ["C2", 10, 2],
        ["Bb1", 12, 2],
        ["A1", 14, 2],

        ["D2", 16, 2]
      ];

      function playNote(noteName, startBeat, length, type, volume) {
        const frequency = noteFrequencies[noteName];
        const start = now + startBeat * beat;
        const end = start + length * beat;

        const oscillator = context.createOscillator();
        const filter = context.createBiquadFilter();
        const gain = context.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        filter.type = "lowpass";
        filter.frequency.value = type === "sawtooth" ? 1500 : 2400;

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
        gain.gain.setValueAtTime(volume * 0.75, end - 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        oscillator.connect(filter);
        filter.connect(gain);
        gain.connect(context.destination);

        oscillator.start(start);
        oscillator.stop(end + 0.03);
      }

      function playDrum(start) {
        const drum = context.createOscillator();
        const gain = context.createGain();

        drum.type = "sine";

        drum.frequency.setValueAtTime(105, start);
        drum.frequency.exponentialRampToValueAtTime(42, start + 0.2);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.24, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);

        drum.connect(gain);
        gain.connect(context.destination);

        drum.start(start);
        drum.stop(start + 0.27);
      }

      const passLength = 16; // beats per complete theme pass
      const totalPasses = 4;

      // Pass 1: original
      mainTheme.forEach(([note, start, length]) => {
        playNote(note, start, length, "triangle", 0.14);
      });

      // Pass 2: original
      mainTheme.forEach(([note, start, length]) => {
        playNote(note, start + passLength, length, "triangle", 0.14);
      });

      // Pass 3: variation
      variation.forEach(([note, start, length]) => {
        playNote(note, start + passLength * 2, length, "triangle", 0.16);
      });

      // Pass 4: original, slightly stronger
      mainTheme.forEach(([note, start, length]) => {
        playNote(note, start + passLength * 3, length, "triangle", 0.18);
      });

      // Bass under all four passes
      for (let pass = 0; pass < totalPasses; pass++) {
        bass.forEach(([note, start, length]) => {
          playNote(
            note,
            start + pass * passLength,
            length,
            "sawtooth",
            0.10
          );
        });
      }

      // Drum pulse under all four passes
      for (let pass = 0; pass < totalPasses; pass++) {
        [0, 4, 8, 12, 16].forEach((beatNumber) => {
          playDrum(now + (pass * passLength + beatNumber) * beat);
        });
      }
    }

    function stopDeckDungeonTheme() {
      if (!themeNodes.length || !audioContext) return;
      const now = audioContext.currentTime;
      themeNodes.forEach(function(node) {
        try { node.stop(now); } catch (e) {}
      });
      themeNodes = [];
    }
</script>
