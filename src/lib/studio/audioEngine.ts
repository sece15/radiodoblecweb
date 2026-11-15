// ==========================================
// WEB AUDIO API REAL-TIME SYNTHESIS & SCHEDULER
// ==========================================
// Ultra low-latency sample-accurate scheduling for Web DAW

import type { InstrumentId, TrackChannel } from "@/types/studio";

class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private currentStep: number = 0;
  private nextNoteTime: number = 0;
  private timerId: number | null = null;
  private bpm: number = 130;
  private swing: number = 0; // 0 to 100%
  private stepsCount: number = 16;
  private metronomeEnabled: boolean = false;
  private masterGain: GainNode | null = null;
  private tracks: TrackChannel[] = [];
  private onStepCallback: ((step: number) => void) | null = null;

  // Master volume
  private volume: number = 0.85;

  // Serato Vinyl / Tape Scrubbing Nodes
  private scrubOsc: OscillatorNode | null = null;
  private scrubGain: GainNode | null = null;
  private scrubFilter: BiquadFilterNode | null = null;
  private lastScrubGrainTime: number = 0;

  // Active Sampler Playback nodes (for immediate choke & Gate / Hold release)
  private activeSamplerSource: AudioBufferSourceNode | null = null;
  private activeSamplerGain: GainNode | null = null;

  private lookaheadMs: number = 25.0; // Check every 25ms
  private scheduleAheadSec: number = 0.1; // Schedule notes up to 100ms in advance

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setTracks(tracks: TrackChannel[]) {
    this.tracks = tracks;
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(240, bpm));
  }

  public setSwing(swing: number) {
    this.swing = Math.max(0, Math.min(100, swing));
  }

  public setMetronome(enabled: boolean) {
    this.metronomeEnabled = enabled;
  }

  public setMasterVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  public start(onStep: (step: number) => void) {
    if (this.isRunning) return;
    const ctx = this.getAudioContext();
    this.isRunning = true;
    this.currentStep = 0;
    this.nextNoteTime = ctx.currentTime + 0.05;
    this.onStepCallback = onStep;

    this.schedulerLoop();
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.currentStep = 0;
    if (this.onStepCallback) {
      this.onStepCallback(-1);
    }
  }

  public isPlaybackRunning(): boolean {
    return this.isRunning;
  }

  private schedulerLoop = () => {
    if (!this.isRunning || !this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadSec) {
      this.scheduleStep(this.currentStep, this.nextNoteTime);
      this.advanceStep();
    }

    this.timerId = window.setTimeout(this.schedulerLoop, this.lookaheadMs);
  };

  private advanceStep() {
    // 16th note duration in seconds: (60 / bpm) / 4
    const secondsPer16th = 60.0 / this.bpm / 4.0;

    // FL Studio Swing formula: delay odd steps (1, 3, 5...) by a percentage of the 16th note
    let stepDuration = secondsPer16th;
    const isOddStep = this.currentStep % 2 === 1;
    if (this.swing > 0) {
      const swingRatio = (this.swing / 100) * 0.35; // Max 35% delay
      stepDuration = isOddStep
        ? secondsPer16th * (1 + swingRatio)
        : secondsPer16th * (1 - swingRatio);
    }

    this.nextNoteTime += stepDuration;
    this.currentStep = (this.currentStep + 1) % this.stepsCount;
  }

  private scheduleStep(step: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Dispatch UI highlight callback aligned with audio time
    if (this.onStepCallback) {
      const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
      window.setTimeout(() => {
        if (this.isRunning && this.onStepCallback) {
          this.onStepCallback(step);
        }
      }, delayMs);
    }

    // Metronome tick
    if (this.metronomeEnabled && step % 4 === 0) {
      const isBarDownbeat = step === 0;
      this.playMetronomeTick(this.ctx, this.masterGain, time, isBarDownbeat);
    }

    // Check if any solo tracks exist
    const hasSolo = this.tracks.some((t) => t.solo);

    // Trigger scheduled channels
    for (const track of this.tracks) {
      if (track.muted) continue;
      if (hasSolo && !track.solo) continue;

      // 1. Step sequencer trigger
      const hasStepActive = track.steps[step];

      // 2. Piano roll note trigger (if applicable for bass / synth)
      const pianoNote = track.notes?.find((n) => n.step === step);

      if (hasStepActive || pianoNote) {
        const pitch = pianoNote ? pianoNote.pitch : (track.id === "bass808" ? 36 : 60);
        const vel = pianoNote ? pianoNote.velocity : 0.9;
        this.synthesizeSound(
          this.ctx,
          this.masterGain,
          track.id,
          time,
          track.volume * vel,
          track.pan,
          pitch
        );
      }
    }
  }

  // Audition preview trigger for UI clicking on pads or channel names
  public triggerManual(
    instrumentId: InstrumentId,
    volume: number = 0.9,
    pan: number = 0,
    pitchMidi: number = 60
  ) {
    const ctx = this.getAudioContext();
    if (!this.masterGain) return;
    this.synthesizeSound(ctx, this.masterGain, instrumentId, ctx.currentTime, volume, pan, pitchMidi);
  }

  // ==========================================
  // REAL-TIME SYNTHESIS ENGINE (ZERO ASSET DEPENDENCY)
  // ==========================================
  private synthesizeSound(
    ctx: BaseAudioContext,
    destination: AudioNode,
    id: InstrumentId,
    time: number,
    vol: number,
    pan: number,
    pitchMidi: number
  ) {
    const channelGain = ctx.createGain();
    channelGain.gain.setValueAtTime(vol, time);

    // Stereo Panning (using StereoPannerNode where supported)
    if ("createStereoPanner" in ctx) {
      const panner = (ctx as AudioContext).createStereoPanner();
      panner.pan.setValueAtTime(pan, time);
      channelGain.connect(panner);
      panner.connect(destination);
    } else {
      channelGain.connect(destination);
    }

    switch (id) {
      case "kick":
        this.synthKick(ctx, channelGain, time);
        break;
      case "snare":
        this.synthSnare(ctx, channelGain, time);
        break;
      case "hihat_closed":
        this.synthHiHatClosed(ctx, channelGain, time);
        break;
      case "hihat_open":
        this.synthHiHatOpen(ctx, channelGain, time);
        break;
      case "clap":
        this.synthClap(ctx, channelGain, time);
        break;
      case "bass808":
        this.synth808(ctx, channelGain, time, pitchMidi);
        break;
      case "synth_lead":
        this.synthLead(ctx, channelGain, time, pitchMidi);
        break;
      case "perc":
        this.synthPerc(ctx, channelGain, time);
        break;
    }
  }

  // 1. PUNCHY 808 SUB KICK
  private synthKick(ctx: BaseAudioContext, dest: AudioNode, time: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Exponential pitch drop from 160Hz to 38Hz (Classic punch)
    osc.frequency.setValueAtTime(160, time);
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.12);

    // Gain envelope
    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    // Click transient layer
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.frequency.setValueAtTime(450, time);
    clickOsc.frequency.exponentialRampToValueAtTime(50, time + 0.02);
    clickGain.gain.setValueAtTime(0.8, time);
    clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);
    clickOsc.start(time);
    clickOsc.stop(time + 0.03);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(time);
    osc.stop(time + 0.46);
  }

  // 2. CRISP TRAP / ROCK SNARE
  private synthSnare(ctx: BaseAudioContext, dest: AudioNode, time: number) {
    // Noise buffer
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.setValueAtTime(1400, time);
    noiseFilter.Q.setValueAtTime(1.2, time);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(dest);

    // Body Tone
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.frequency.setValueAtTime(240, time);
    osc.frequency.exponentialRampToValueAtTime(110, time + 0.09);
    oscGain.gain.setValueAtTime(0.7, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

    osc.connect(oscGain);
    oscGain.connect(dest);

    noiseSource.start(time);
    noiseSource.stop(time + 0.23);
    osc.start(time);
    osc.stop(time + 0.13);
  }

  // 3. CLOSED HI-HAT
  private synthHiHatClosed(ctx: BaseAudioContext, dest: AudioNode, time: number) {
    const bufferSize = ctx.sampleRate * 0.06;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(8000, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    source.start(time);
    source.stop(time + 0.05);
  }

  // 4. OPEN HI-HAT / CRASH
  private synthHiHatOpen(ctx: BaseAudioContext, dest: AudioNode, time: number) {
    const bufferSize = ctx.sampleRate * 0.45;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(6500, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.38);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    source.start(time);
    source.stop(time + 0.4);
  }

  // 5. LAYERED STEREO CLAP
  private synthClap(ctx: BaseAudioContext, dest: AudioNode, time: number) {
    const bufferSize = ctx.sampleRate * 0.3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1100, time);
    filter.Q.setValueAtTime(1.8, time);

    const gain = ctx.createGain();
    // 3 micro bursts (0ms, 12ms, 24ms)
    gain.gain.setValueAtTime(0.7, time);
    gain.gain.exponentialRampToValueAtTime(0.1, time + 0.01);
    gain.gain.setValueAtTime(0.7, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.1, time + 0.022);
    gain.gain.setValueAtTime(0.9, time + 0.024);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    source.start(time);
    source.stop(time + 0.3);
  }

  // 6. TUNED 808 SUB BASS
  private synth808(ctx: BaseAudioContext, dest: AudioNode, time: number, pitchMidi: number = 36) {
    const freq = this.midiToFreq(pitchMidi || 36);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    // Pitch envelope: subtle slide into note
    osc.frequency.setValueAtTime(freq * 1.5, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.04);

    // Warm low-pass
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, time);

    // Long sustain envelope
    gain.gain.setValueAtTime(0.9, time);
    gain.gain.exponentialRampToValueAtTime(0.7, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.7);
  }

  // 7. SYNTH LEAD / PLUCK
  private synthLead(ctx: BaseAudioContext, dest: AudioNode, time: number, pitchMidi: number = 60) {
    const freq = this.midiToFreq(pitchMidi || 60);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "square";

    osc1.frequency.setValueAtTime(freq, time);
    osc2.frequency.setValueAtTime(freq * 1.004, time); // Subtle detune for lush thickness

    // Filter sweep envelope
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2600, time);
    filter.frequency.exponentialRampToValueAtTime(450, time + 0.28);
    filter.Q.setValueAtTime(4.0, time);

    gain.gain.setValueAtTime(0.65, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.38);
    osc2.stop(time + 0.38);
  }

  // 8. PERC / RIMSHOT
  private synthPerc(ctx: BaseAudioContext, dest: AudioNode, time: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(750, time);
    osc.frequency.exponentialRampToValueAtTime(140, time + 0.05);

    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.07);
  }

  // Metronome tick
  private playMetronomeTick(ctx: BaseAudioContext, dest: AudioNode, time: number, isDownbeat: boolean) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(isDownbeat ? 1400 : 900, time);

    gain.gain.setValueAtTime(0.4, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(time);
    osc.stop(time + 0.04);
  }

  // Helper: MIDI note to Hz
  public midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // ==========================================
  // EXPORT WAV LOOP VIA OfflineAudioContext
  // ==========================================
  public async exportWav(tracks: TrackChannel[], bpm: number, barsCount: number = 2): Promise<Blob> {
    const sampleRate = 44100;
    const totalSteps = this.stepsCount * barsCount;
    const secondsPer16th = 60.0 / bpm / 4.0;
    const durationSec = totalSteps * secondsPer16th + 0.8; // Include decay tail

    const OfflineCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    const offlineCtx = new OfflineCtx(2, Math.ceil(sampleRate * durationSec), sampleRate);

    const masterGain = offlineCtx.createGain();
    masterGain.gain.value = this.volume;
    masterGain.connect(offlineCtx.destination);

    for (let stepIndex = 0; stepIndex < totalSteps; stepIndex++) {
      const patternStep = stepIndex % this.stepsCount;
      const stepTime = stepIndex * secondsPer16th;

      for (const track of tracks) {
        if (track.muted) continue;
        const hasStep = track.steps[patternStep];
        const pianoNote = track.notes?.find((n) => n.step === patternStep);

        if (hasStep || pianoNote) {
          const pitch = pianoNote ? pianoNote.pitch : (track.id === "bass808" ? 36 : 60);
          const vel = pianoNote ? pianoNote.velocity : 0.9;
          this.synthesizeSound(
            offlineCtx,
            masterGain,
            track.id,
            stepTime,
            track.volume * vel,
            track.pan,
            pitch
          );
        }
      }
    }

    const renderedBuffer = await offlineCtx.startRendering();
    return this.audioBufferToWav(renderedBuffer);
  }

  // ==========================================
  // C-BASS IA SYNTHESIS ENGINE
  // ==========================================
  public playBassModel(
    params: {
      type: "sub_808" | "acid_303" | "reese_dnb" | "punk_dist" | "slap_funk" | "rolling_synthwave";
      cutoff: number;
      resonance: number;
      drive: number;
      glide: number;
      subOctave: number;
      decay: number;
      volume: number;
    },
    pitchMidi: number = 36
  ) {
    const ctx = this.getAudioContext();
    if (!this.masterGain) return;
    const time = ctx.currentTime;
    const freq = this.midiToFreq(pitchMidi);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(params.volume * 0.9, time);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(params.cutoff, time);
    filter.Q.setValueAtTime(params.resonance, time);

    // Waveshaper Distortion Drive
    if (params.drive > 5) {
      const shaper = ctx.createWaveShaper();
      shaper.oversample = "2x";
      filter.connect(shaper);
      shaper.connect(gain);
    } else {
      filter.connect(gain);
    }
    gain.connect(this.masterGain);

    const decayDuration = Math.max(0.1, params.decay);

    switch (params.type) {
      case "sub_808": {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        const glideSec = params.glide / 1000;
        osc.frequency.setValueAtTime(freq * 1.5, time);
        osc.frequency.exponentialRampToValueAtTime(freq, time + Math.max(0.02, glideSec));

        gain.gain.setValueAtTime(params.volume * 0.95, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decayDuration);

        osc.connect(filter);
        osc.start(time);
        osc.stop(time + decayDuration + 0.05);
        break;
      }
      case "acid_303": {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, time);

        // Acid Filter Sweep
        filter.frequency.setValueAtTime(params.cutoff * 3.5, time);
        filter.frequency.exponentialRampToValueAtTime(params.cutoff, time + decayDuration * 0.4);

        gain.gain.setValueAtTime(params.volume * 0.85, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decayDuration);

        osc.connect(filter);
        osc.start(time);
        osc.stop(time + decayDuration + 0.05);
        break;
      }
      case "reese_dnb": {
        // Dual detuned sawtooths
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = "sawtooth";
        osc2.type = "sawtooth";
        osc1.frequency.setValueAtTime(freq, time);
        osc2.frequency.setValueAtTime(freq * 1.012, time);

        gain.gain.setValueAtTime(params.volume * 0.75, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decayDuration);

        osc1.connect(filter);
        osc2.connect(filter);
        osc1.start(time);
        osc2.start(time);
        osc1.stop(time + decayDuration + 0.05);
        osc2.stop(time + decayDuration + 0.05);
        break;
      }
      case "punk_dist": {
        const osc = ctx.createOscillator();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(params.volume * 0.85, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decayDuration);

        osc.connect(filter);
        osc.start(time);
        osc.stop(time + decayDuration + 0.05);
        break;
      }
      case "slap_funk": {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, time);

        // Click transient
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.frequency.setValueAtTime(600, time);
        clickOsc.frequency.exponentialRampToValueAtTime(80, time + 0.03);
        clickGain.gain.setValueAtTime(0.7, time);
        clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        clickOsc.connect(clickGain);
        clickGain.connect(gain);
        clickOsc.start(time);
        clickOsc.stop(time + 0.04);

        gain.gain.setValueAtTime(params.volume * 0.9, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decayDuration * 0.6);

        osc.connect(filter);
        osc.start(time);
        osc.stop(time + decayDuration + 0.05);
        break;
      }
      case "rolling_synthwave":
      default: {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, time);

        filter.frequency.setValueAtTime(params.cutoff * 2.5, time);
        filter.frequency.exponentialRampToValueAtTime(params.cutoff * 0.8, time + 0.18);

        gain.gain.setValueAtTime(params.volume * 0.8, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + decayDuration * 0.5);

        osc.connect(filter);
        osc.start(time);
        osc.stop(time + decayDuration + 0.05);
        break;
      }
    }
  }

  // ==========================================
  // C-DRUMS IA SYNTHESIS ENGINE
  // ==========================================
  public playDrumPad(
    padId: InstrumentId,
    params: {
      kit: "trap_808" | "punk_raw" | "boombap_vinyl" | "uk_drill" | "dembow_latin" | "retrowave_80s";
      tuning: number;
      snappiness: number;
      punch: number;
      reverb: number;
      humanize: number;
      volume: number;
    }
  ) {
    const ctx = this.getAudioContext();
    if (!this.masterGain) return;
    const time = ctx.currentTime;
    const tuningRatio = Math.pow(2, params.tuning / 12);
    const vol = params.volume * 0.9;

    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(vol, time);
    padGain.connect(this.masterGain);

    if (padId === "kick") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const baseFreq = 160 * tuningRatio;
      osc.frequency.setValueAtTime(baseFreq, time);
      osc.frequency.exponentialRampToValueAtTime(36 * tuningRatio, time + (0.12 * (params.punch / 50)));

      gain.gain.setValueAtTime(1.0, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

      osc.connect(gain);
      gain.connect(padGain);
      osc.start(time);
      osc.stop(time + 0.46);
    } else if (padId === "snare") {
      this.synthSnare(ctx, padGain, time);
    } else if (padId === "hihat_closed") {
      this.synthHiHatClosed(ctx, padGain, time);
    } else if (padId === "hihat_open") {
      this.synthHiHatOpen(ctx, padGain, time);
    } else if (padId === "clap") {
      this.synthClap(ctx, padGain, time);
    } else if (padId === "perc") {
      this.synthPerc(ctx, padGain, time);
    } else {
      this.triggerManual(padId, vol);
    }
  }

  // ==========================================
  // C-SAMPLER ENGINE (SERATO SAMPLER & AKAI 16 LEVELS REPLICA)
  // ==========================================
  public playSamplerSlice(
    cueOrIndex: number | { startSec: number; duration?: number },
    pitchOrOptions: number | { pitchSemi?: number; velocity?: number; filterCutoff?: number; duration?: number } = 0,
    customBuffer?: AudioBuffer | null
  ) {
    const options =
      typeof pitchOrOptions === "number"
        ? { pitchSemi: pitchOrOptions }
        : pitchOrOptions;

    const pitchSemi = options.pitchSemi ?? 0;
    const velocity = options.velocity !== undefined ? Math.max(0.05, Math.min(1.0, options.velocity)) : 1.0;
    const filterCutoff = options.filterCutoff;
    const customDuration = options.duration;

    const ctx = this.getAudioContext();
    if (!this.masterGain) return;
    const time = ctx.currentTime;

    // Monophonic voice choke: silencia suavemente la voz previa en 8ms para evitar clics
    if (this.activeSamplerGain) {
      try {
        this.activeSamplerGain.gain.cancelScheduledValues(time);
        this.activeSamplerGain.gain.linearRampToValueAtTime(0.0001, time + 0.008);
      } catch {}
    }
    if (this.activeSamplerSource) {
      const prevSrc = this.activeSamplerSource;
      window.setTimeout(() => {
        try {
          prevSrc.stop();
          prevSrc.disconnect();
        } catch {}
      }, 15);
    }

    if (customBuffer) {
      // Varispeed Resampling auténtico estilo MPC / Serato
      const source = ctx.createBufferSource();
      source.buffer = customBuffer;
      const rate = Math.pow(2, pitchSemi / 12);
      source.playbackRate.setValueAtTime(rate, time);

      const sliceDur = customBuffer.duration / 8;
      const startOffset =
        typeof cueOrIndex === "object"
          ? Math.max(0, Math.min(customBuffer.duration - 0.1, cueOrIndex.startSec))
          : (cueOrIndex % 8) * sliceDur;
      const duration =
        customDuration !== undefined
          ? customDuration
          : typeof cueOrIndex === "object" && cueOrIndex.duration !== undefined
          ? cueOrIndex.duration
          : undefined;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(this.volume * 0.95 * velocity, time);

      // Si se especificó Filter Cutoff (Akai 16 Levels Filter mode)
      if (filterCutoff && filterCutoff < 17000) {
        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(filterCutoff, time);
        filter.Q.setValueAtTime(2.2, time);
        source.connect(filter);
        filter.connect(gain);
      } else {
        source.connect(gain);
      }

      gain.connect(this.masterGain);

      this.activeSamplerSource = source;
      this.activeSamplerGain = gain;

      if (duration !== undefined) {
        source.start(time, startOffset, duration);
      } else {
        source.start(time, startOffset);
      }
      return;
    }

    const sliceIdx = typeof cueOrIndex === "object" ? 0 : cueOrIndex;
    // Built-in Radio Doble C Synthesized Cue Banks (zero asset dependency)
    const playbackPitch = Math.pow(2, pitchSemi / 12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.95 * velocity, time);

    let routeNode: AudioNode = gain;
    if (filterCutoff && filterCutoff < 17000) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(filterCutoff, time);
      filter.Q.setValueAtTime(2.2, time);
      gain.connect(filter);
      routeNode = filter;
    }
    routeNode.connect(this.masterGain);

    switch (sliceIdx % 8) {
      case 0: { // 📻 "Radio Doble C" FM Voice ID
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220 * playbackPitch, time);
        osc.frequency.linearRampToValueAtTime(440 * playbackPitch, time + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.36);
        break;
      }
      case 1: { // 🎚️ Vinyl Scratch / Backspin FX
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600 * playbackPitch, time);
        osc.frequency.exponentialRampToValueAtTime(120 * playbackPitch, time + 0.08);
        osc.frequency.linearRampToValueAtTime(800 * playbackPitch, time + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.23);
        break;
      }
      case 2: { // 💥 Amen Break Snare
        this.synthSnare(ctx, gain, time);
        break;
      }
      case 3: { // 🚨 Soundclash Airhorn
        [440, 554, 659].forEach((f) => {
          const horn = ctx.createOscillator();
          horn.type = "sawtooth";
          horn.frequency.setValueAtTime(f * playbackPitch, time);
          horn.frequency.linearRampToValueAtTime(f * 1.05 * playbackPitch, time + 0.1);
          horn.connect(gain);
          horn.start(time);
          horn.stop(time + 0.28);
        });
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
        break;
      }
      case 4: { // 💣 808 Sub Boom
        this.synthKick(ctx, gain, time);
        break;
      }
      case 5: { // 🎹 Lofi Rhodes Chord
        [261.63, 329.63, 392.0, 493.88].forEach((f) => {
          const chord = ctx.createOscillator();
          chord.type = "sine";
          chord.frequency.setValueAtTime(f * playbackPitch, time);
          chord.connect(gain);
          chord.start(time);
          chord.stop(time + 0.5);
        });
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.55);
        break;
      }
      case 6: { // 🗣️ Vocal Drop ("Yeah!")
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(320 * playbackPitch, time);
        osc.frequency.exponentialRampToValueAtTime(180 * playbackPitch, time + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
        osc.connect(gain);
        osc.start(time);
        osc.stop(time + 0.26);
        break;
      }
      case 7: { // 🥁 Retro 90s Breakbeat Roll
        this.synthPerc(ctx, gain, time);
        break;
      }
    }
  }

  // Pitch Harmonic Enhancer: capa armónica sutil cuando se altera el tono de un sample (Soporta Velocity y Filter)
  public playPitchHarmonic(
    pitchSemi: number,
    key: string = "A",
    velocity: number = 1.0,
    filterCutoff?: number
  ) {
    if (pitchSemi === 0) return;
    const ctx = this.getAudioContext();
    if (!this.masterGain) return;
    const time = ctx.currentTime;

    const baseFreqMap: Record<string, number> = {
      C: 261.63, "C#": 277.18, D: 293.66, "D#": 311.13, E: 329.63, F: 349.23,
      "F#": 369.99, G: 392.00, "G#": 415.30, A: 440.00, "A#": 466.16, B: 493.88,
    };
    const cleanKey = key.replace(/m|maj|min/gi, "").trim();
    const baseFreq = baseFreqMap[cleanKey] || 440;
    const targetFreq = baseFreq * Math.pow(2, pitchSemi / 12);

    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.type = pitchSemi > 0 ? "triangle" : "sine";
    osc.frequency.setValueAtTime(targetFreq, time);

    const effectiveFilter = filterCutoff && filterCutoff < 17000 ? filterCutoff : pitchSemi > 0 ? 700 : 450;
    filter.type = filterCutoff ? "lowpass" : pitchSemi > 0 ? "highpass" : "lowpass";
    filter.frequency.setValueAtTime(effectiveFilter, time);

    const amp = Math.min(0.18, Math.abs(pitchSemi) * 0.015) * Math.max(0.1, velocity);
    gain.gain.setValueAtTime(amp * this.volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(time);
    osc.stop(time + 0.46);
  }

  // ==========================================
  // SERATO RGB 3-BAND WAVEFORM PEAKS EXTRACTOR
  // ==========================================
  // Extrae picos reales de alta fidelidad desde un AudioBuffer para renderizar
  // la forma de onda en Canvas con código de colores Serato (Rojo = Graves, Verde = Medios, Azul = Agudos)
  public extractWaveformPeaks(
    buffer: AudioBuffer,
    totalBars: number = 140
  ): {
    peaks: number[];
    colors: string[];
  } {
    const channelData = buffer.getChannelData(0);
    const totalSamples = channelData.length;
    const samplesPerBar = Math.floor(totalSamples / totalBars);

    const peaks: number[] = new Array(totalBars);
    const colors: string[] = new Array(totalBars);

    for (let bar = 0; bar < totalBars; bar++) {
      const startIdx = bar * samplesPerBar;
      const endIdx = Math.min(totalSamples, startIdx + samplesPerBar);

      let maxAmp = 0;
      let zeroCrossings = 0;
      let prevVal = channelData[startIdx] || 0;

      for (let i = startIdx; i < endIdx; i++) {
        const val = Math.abs(channelData[i]);
        if (val > maxAmp) maxAmp = val;

        if ((channelData[i] >= 0 && prevVal < 0) || (channelData[i] < 0 && prevVal >= 0)) {
          zeroCrossings++;
        }
        prevVal = channelData[i];
      }

      peaks[bar] = Math.max(0.08, Math.min(1.0, maxAmp * 1.4));

      // Análisis de frecuencia por ratio de cruces por cero (Zero-crossing rate)
      const samplesInChunk = Math.max(1, endIdx - startIdx);
      const zcRate = zeroCrossings / samplesInChunk;

      if (zcRate < 0.04) {
        // Dominancia de bajos / bombos / 808 -> Rojo / Naranja Serato
        colors[bar] = "#FF4422";
      } else if (zcRate < 0.14) {
        // Dominancia de medios / voces / snares -> Verde Neón / Lima Serato
        colors[bar] = "#CCFF00";
      } else {
        // Dominancia de agudos / hi-hats / platillos -> Cyan / Azul Eléctrico Serato
        colors[bar] = "#00E5FF";
      }
    }

    return { peaks, colors };
  }

  // Corta inmediatamente el audio del sampler (Modo Gate / Hold)
  public stopSamplerAudio() {
    if (this.activeSamplerGain && this.ctx) {
      const time = this.ctx.currentTime;
      this.activeSamplerGain.gain.cancelScheduledValues(time);
      this.activeSamplerGain.gain.linearRampToValueAtTime(0.0001, time + 0.015);
    }
    const prevSrc = this.activeSamplerSource;
    this.activeSamplerSource = null;
    this.activeSamplerGain = null;
    if (prevSrc) {
      window.setTimeout(() => {
        try {
          prevSrc.stop();
          prevSrc.disconnect();
        } catch {}
      }, 20);
    }
  }

  // ==========================================
  // SERATO TAPE & VINYL AUDIO SCRUBBING ENGINE
  // ==========================================
  public scrubVinyl(
    direction: "forward" | "backward",
    velocity: number,
    currentSec: number,
    customBuffer?: AudioBuffer | null
  ) {
    const ctx = this.getAudioContext();
    if (!this.masterGain) return;
    const time = ctx.currentTime;
    const normalizedVel = Math.min(1.0, Math.max(0.06, velocity / 24));

    // 1. If custom audio buffer is loaded, play low-latency granular slices
    if (customBuffer && time - this.lastScrubGrainTime > 0.045) {
      this.lastScrubGrainTime = time;
      try {
        const grainSource = ctx.createBufferSource();
        grainSource.buffer = customBuffer;
        const grainDuration = 0.07;
        const rate =
          direction === "forward"
            ? 1.0 + normalizedVel * 1.6
            : Math.max(0.35, 0.9 - normalizedVel * 0.55);
        grainSource.playbackRate.setValueAtTime(rate, time);

        const grainFilter = ctx.createBiquadFilter();
        grainFilter.type = "bandpass";
        grainFilter.frequency.setValueAtTime(direction === "forward" ? 1700 : 650, time);
        grainFilter.Q.setValueAtTime(2.2, time);

        const grainGain = ctx.createGain();
        grainGain.gain.setValueAtTime(0, time);
        grainGain.gain.linearRampToValueAtTime(this.volume * 0.75 * normalizedVel, time + 0.01);
        grainGain.gain.exponentialRampToValueAtTime(0.001, time + grainDuration);

        grainSource.connect(grainFilter);
        grainFilter.connect(grainGain);
        grainGain.connect(this.masterGain);

        const offset = Math.max(0, Math.min(customBuffer.duration - grainDuration, currentSec));
        grainSource.start(time, offset, grainDuration);
      } catch {}
    }

    // 2. Continuous Analog Tape / Vinyl Shuttle Pitch Sweeper (Serato Style)
    if (!this.scrubOsc || !this.scrubGain || !this.scrubFilter) {
      this.scrubOsc = ctx.createOscillator();
      this.scrubOsc.type = "sawtooth";

      this.scrubFilter = ctx.createBiquadFilter();
      this.scrubFilter.type = "bandpass";
      this.scrubFilter.Q.setValueAtTime(3.2, time);

      this.scrubGain = ctx.createGain();
      this.scrubGain.gain.setValueAtTime(0.001, time);

      this.scrubOsc.connect(this.scrubFilter);
      this.scrubFilter.connect(this.scrubGain);
      this.scrubGain.connect(this.masterGain);
      this.scrubOsc.start(time);
    }

    // Forward: Pitch sweeps UP (Fast-forward shuttle chirp)
    // Backward: Pitch sweeps DOWN (Rewind back-cue shuttle growl)
    const targetFreq =
      direction === "forward"
        ? 420 + normalizedVel * 1150
        : Math.max(105, 820 - normalizedVel * 560);

    const filterFreq =
      direction === "forward"
        ? 1150 + normalizedVel * 1650
        : Math.max(280, 1050 - normalizedVel * 620);

    this.scrubOsc.frequency.cancelScheduledValues(time);
    this.scrubOsc.frequency.linearRampToValueAtTime(targetFreq, time + 0.04);

    this.scrubFilter.frequency.cancelScheduledValues(time);
    this.scrubFilter.frequency.linearRampToValueAtTime(filterFreq, time + 0.04);

    this.scrubGain.gain.cancelScheduledValues(time);
    const targetGain = this.volume * 0.36 * Math.min(1.0, normalizedVel * 1.5);
    this.scrubGain.gain.linearRampToValueAtTime(targetGain, time + 0.02);
  }

  public stopScrub() {
    if (!this.ctx || !this.scrubGain) return;
    const time = this.ctx.currentTime;
    this.scrubGain.gain.cancelScheduledValues(time);
    this.scrubGain.gain.linearRampToValueAtTime(0.0001, time + 0.04);
    const prevOsc = this.scrubOsc;
    const prevGain = this.scrubGain;
    const prevFilter = this.scrubFilter;
    this.scrubOsc = null;
    this.scrubGain = null;
    this.scrubFilter = null;
    window.setTimeout(() => {
      if (prevOsc) {
        try {
          prevOsc.stop();
          prevOsc.disconnect();
          prevGain?.disconnect();
          prevFilter?.disconnect();
        } catch {}
      }
    }, 50);
  }

  public createDistortionCurve(amount: number): Float32Array {
    const k = amount;
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // PCM WAV encoder
  public exportBufferToWavBlob(buffer: AudioBuffer): Blob {
    return this.audioBufferToWav(buffer);
  }

  // Generates an authentic vinyl sample audio buffer for crate digging (Samplette flow)
  public async createDiggerSampleBuffer(
    bpm: number = 95,
    key: string = "Am",
    genre: string = "funk"
  ): Promise<AudioBuffer> {
    const sampleRate = 44100;
    const duration = Math.max(8.0, (60 / Math.max(60, bpm)) * 16); // 16 beats (4 bars) based on track BPM
    const offlineCtx = new OfflineAudioContext(2, Math.floor(sampleRate * duration), sampleRate);

    // Root note calculation from musical key
    const keyMap: Record<string, number> = {
      C: 48, "C#": 49, D: 50, "D#": 51, E: 52, F: 53, "F#": 54, G: 55, "G#": 56, A: 57, "A#": 58, B: 59,
      Cm: 48, "C#m": 49, Dm: 50, "D#m": 51, Em: 40, Fm: 41, "F#m": 42, Gm: 43, "G#m": 44, Am: 45, "A#m": 46, Bm: 47,
    };
    const root = keyMap[key] || 45; // Default Am (A2)
    const isMinor = key.toLowerCase().includes("m");

    // Add subtle vinyl crackle & dust texture
    const crackleLen = Math.floor(sampleRate * duration);
    const crackleBuffer = offlineCtx.createBuffer(1, crackleLen, sampleRate);
    const cData = crackleBuffer.getChannelData(0);
    for (let i = 0; i < crackleLen; i++) {
      if (Math.random() < 0.00035) {
        cData[i] = (Math.random() * 2 - 1) * 0.35;
      } else {
        cData[i] = (Math.random() * 2 - 1) * 0.012;
      }
    }
    const crackleSource = offlineCtx.createBufferSource();
    crackleSource.buffer = crackleBuffer;
    const crackleFilter = offlineCtx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.value = 3200;
    crackleFilter.Q.value = 1.2;
    const crackleGain = offlineCtx.createGain();
    crackleGain.gain.value = 0.22;
    crackleSource.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(offlineCtx.destination);
    crackleSource.start(0);

    // Musical progression across 8 slices (1.5 seconds per cue chop)
    const sliceLen = duration / 8;
    const intervals = isMinor ? [0, 3, 7, 10, 12, 15, 14, 7] : [0, 4, 7, 11, 12, 16, 14, 7];

    for (let slice = 0; slice < 8; slice++) {
      const sliceTime = slice * sliceLen;
      const notePitch = root + intervals[slice % intervals.length];
      const freq = 440 * Math.pow(2, (notePitch - 69) / 12);

      // Chords (Rhodes / Guitar / Synth stab depending on genre)
      const chordNotes = isMinor
        ? [notePitch, notePitch + 3, notePitch + 7]
        : [notePitch, notePitch + 4, notePitch + 7];

      chordNotes.forEach((cN, cIdx) => {
        const cFreq = 440 * Math.pow(2, (cN - 69) / 12);
        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();

        // Wave shape selection
        const lowerGenre = genre.toLowerCase();
        if (lowerGenre.includes("chicha") || lowerGenre.includes("cumbia")) {
          osc.type = "sawtooth"; // Electric psychedelic guitar
        } else if (lowerGenre.includes("city pop") || lowerGenre.includes("synth")) {
          osc.type = "square";
        } else {
          osc.type = "triangle"; // Warm vintage rhodes / soul keys
        }

        osc.frequency.setValueAtTime(cFreq, sliceTime);

        // Lowpass filter for vintage analog warmth
        const filter = offlineCtx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(lowerGenre.includes("chicha") ? 2400 : 1300, sliceTime);

        gain.gain.setValueAtTime(0, sliceTime);
        gain.gain.linearRampToValueAtTime(0.24 / (cIdx + 1), sliceTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, sliceTime + sliceLen * 0.92);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(sliceTime);
        osc.stop(sliceTime + sliceLen);
      });

      // Bassline note
      const bassOsc = offlineCtx.createOscillator();
      const bassGain = offlineCtx.createGain();
      bassOsc.type = "sine";
      bassOsc.frequency.setValueAtTime(freq / 2, sliceTime);
      bassGain.gain.setValueAtTime(0, sliceTime);
      bassGain.gain.linearRampToValueAtTime(0.32, sliceTime + 0.03);
      bassGain.gain.exponentialRampToValueAtTime(0.001, sliceTime + sliceLen * 0.82);

      bassOsc.connect(bassGain);
      bassGain.connect(offlineCtx.destination);
      bassOsc.start(sliceTime);
      bassOsc.stop(sliceTime + sliceLen);
    }

    return await offlineCtx.startRendering();
  }

  // PCM WAV encoder
  private audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    const channelData: Float32Array[] = [];
    for (let i = 0; i < numChannels; i++) {
      channelData.push(buffer.getChannelData(i));
    }

    const length = buffer.length * numChannels * 2;
    const bufferArray = new ArrayBuffer(44 + length);
    const view = new DataView(bufferArray);

    const writeString = (view: DataView, offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // RIFF chunk descriptor
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + length, true);
    writeString(view, 8, "WAVE");

    // FMT sub-chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);

    // DATA sub-chunk
    writeString(view, 36, "data");
    view.setUint32(40, length, true);

    // Interleave samples
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = channelData[ch][i];
        sample = Math.max(-1, Math.min(1, sample));
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      }
    }

    return new Blob([bufferArray], { type: "audio/wav" });
  }
}

export const studioAudio = new StudioAudioEngine();

