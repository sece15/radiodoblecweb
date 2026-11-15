// ==========================================
// AI BEAT & MIDI GENERATOR (Text2MIDI & PyDrums Engine)
// ==========================================

import type {
  InstrumentId,
  TrackChannel,
  AiGenerationConfig,
} from "@/types/studio";

export const INITIAL_TRACKS: TrackChannel[] = [
  {
    id: "kick",
    name: "808 KICK",
    shortName: "KICK",
    category: "drum",
    color: "#FF3366",
    accentColor: "#FF003F",
    muted: false,
    solo: false,
    volume: 0.9,
    pan: 0,
    steps: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    notes: [],
  },
  {
    id: "snare",
    name: "TRAP SNARE",
    shortName: "SNARE",
    category: "drum",
    color: "#00E5FF",
    accentColor: "#00B8D4",
    muted: false,
    solo: false,
    volume: 0.85,
    pan: 0,
    steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    notes: [],
  },
  {
    id: "hihat_closed",
    name: "HI-HAT CLOSED",
    shortName: "HAT CL",
    category: "drum",
    color: "#CCFF00",
    accentColor: "#AEEA00",
    muted: false,
    solo: false,
    volume: 0.75,
    pan: -0.15,
    steps: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    notes: [],
  },
  {
    id: "hihat_open",
    name: "HI-HAT OPEN",
    shortName: "HAT OP",
    category: "drum",
    color: "#FFD600",
    accentColor: "#FFAB00",
    muted: false,
    solo: false,
    volume: 0.7,
    pan: 0.2,
    steps: [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false],
    notes: [],
  },
  {
    id: "clap",
    name: "STEREO CLAP",
    shortName: "CLAP",
    category: "drum",
    color: "#E040FB",
    accentColor: "#AA00FF",
    muted: false,
    solo: false,
    volume: 0.8,
    pan: 0.1,
    steps: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    notes: [],
  },
  {
    id: "bass808",
    name: "SUB 808 BASS",
    shortName: "808",
    category: "bass",
    color: "#FF6D00",
    accentColor: "#DD2C00",
    muted: false,
    solo: false,
    volume: 0.95,
    pan: 0,
    steps: [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false],
    notes: [
      { id: "b1", step: 0, pitch: 36, noteName: "C2", duration: 2, velocity: 1.0 },
      { id: "b2", step: 7, pitch: 36, noteName: "C2", duration: 1, velocity: 0.9 },
      { id: "b3", step: 10, pitch: 39, noteName: "D#2", duration: 2, velocity: 0.95 },
    ],
  },
  {
    id: "synth_lead",
    name: "CYBER PLUCK",
    shortName: "PLUCK",
    category: "synth",
    color: "#00E676",
    accentColor: "#00C853",
    muted: false,
    solo: false,
    volume: 0.75,
    pan: -0.2,
    steps: [false, false, true, false, false, true, false, false, false, false, true, false, false, true, false, false],
    notes: [
      { id: "s1", step: 2, pitch: 60, noteName: "C4", duration: 1, velocity: 0.8 },
      { id: "s2", step: 5, pitch: 63, noteName: "D#4", duration: 1, velocity: 0.85 },
      { id: "s3", step: 10, pitch: 67, noteName: "G4", duration: 1, velocity: 0.9 },
      { id: "s4", step: 13, pitch: 65, noteName: "F4", duration: 1, velocity: 0.8 },
    ],
  },
  {
    id: "perc",
    name: "RIMSHOT / PERC",
    shortName: "PERC",
    category: "fx",
    color: "#2979FF",
    accentColor: "#2962FF",
    muted: false,
    solo: false,
    volume: 0.7,
    pan: 0.25,
    steps: [false, false, false, false, false, false, false, false, false, false, false, true, false, false, false, false],
    notes: [],
  },
];

export class AiBeatGenerator {
  /**
   * Generates a new groove pattern based on Genre or natural language prompt (Text2MIDI / PyDrums)
   */
  public static generatePattern(config: AiGenerationConfig, currentTracks: TrackChannel[]): {
    tracks: TrackChannel[];
    recommendedBpm: number;
    recommendedSwing: number;
    summary: string;
  } {
    const prompt = (config.prompt || "").toLowerCase();
    let genre = config.genre;

    // Intelligent prompt keywords detection
    if (prompt.includes("punk") || prompt.includes("rock") || prompt.includes("guitarra") || prompt.includes("rapido")) {
      genre = "punk_rock";
    } else if (prompt.includes("dembow") || prompt.includes("reggaeton") || prompt.includes("perreo") || prompt.includes("urbano")) {
      genre = "dembow";
    } else if (prompt.includes("boombap") || prompt.includes("lofi") || prompt.includes("lo-fi") || prompt.includes("hip hop 90s") || prompt.includes("vieja escuela")) {
      genre = "boombap";
    } else if (prompt.includes("drill") || prompt.includes("cyberpunk") || prompt.includes("dnb") || prompt.includes("drum and bass")) {
      genre = "cyberpunk_drill";
    } else if (prompt.includes("synthwave") || prompt.includes("retrowave") || prompt.includes("80s") || prompt.includes("disco")) {
      genre = "synthwave";
    } else if (prompt.includes("trap") || prompt.includes("808") || prompt.includes("hihat") || prompt.includes("triplets")) {
      genre = "trap";
    }

    let recommendedBpm = config.bpm || 130;
    let recommendedSwing = 0;
    let summary = "";

    // Clone tracks deeply
    const newTracks: TrackChannel[] = currentTracks.map((t) => ({
      ...t,
      steps: new Array(16).fill(false),
      notes: [],
    }));

    const getTrack = (id: InstrumentId) => newTracks.find((t) => t.id === id);

    switch (genre) {
      case "trap": {
        recommendedBpm = 140;
        recommendedSwing = 5;
        summary = "Trap 808 Beat: Hi-hats en tresillos, bombo en síncopa y bajo 808 profundo.";

        // Kick
        const kick = getTrack("kick");
        if (kick) kick.steps = [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false];

        // Snare & Clap on 4 and 12
        const snare = getTrack("snare");
        if (snare) snare.steps = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
        const clap = getTrack("clap");
        if (clap) clap.steps = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];

        // Hi-hat rolls
        const hihat = getTrack("hihat_closed");
        if (hihat) hihat.steps = [true, true, true, false, true, true, true, true, true, false, true, true, true, true, true, true];

        // Open Hat
        const openHat = getTrack("hihat_open");
        if (openHat) openHat.steps = [false, false, true, false, false, false, false, false, false, false, true, false, false, false, false, false];

        // 808 Bass notes
        const bass = getTrack("bass808");
        if (bass && config.includeBass) {
          bass.steps = [true, false, false, false, false, false, false, true, false, false, true, false, false, false, false, false];
          bass.notes = [
            { id: "t1", step: 0, pitch: 36, noteName: "C2", duration: 2, velocity: 1.0 },
            { id: "t2", step: 7, pitch: 36, noteName: "C2", duration: 1, velocity: 0.9 },
            { id: "t3", step: 10, pitch: 39, noteName: "D#2", duration: 2, velocity: 0.95 },
          ];
        }

        // Dark Synth Pluck
        const synth = getTrack("synth_lead");
        if (synth && config.includeMelody) {
          synth.steps = [false, false, true, false, false, true, false, false, false, false, true, false, false, true, false, false];
          synth.notes = [
            { id: "s1", step: 2, pitch: 60, noteName: "C4", duration: 1, velocity: 0.8 },
            { id: "s2", step: 5, pitch: 63, noteName: "D#4", duration: 1, velocity: 0.85 },
            { id: "s3", step: 10, pitch: 67, noteName: "G4", duration: 1, velocity: 0.9 },
            { id: "s4", step: 13, pitch: 65, noteName: "F4", duration: 1, velocity: 0.8 },
          ];
        }
        break;
      }

      case "punk_rock": {
        recommendedBpm = 168;
        recommendedSwing = 0;
        summary = "Punk Rock Doble C: Bombo veloz, caja machacante y platos abiertos explosivos.";

        const kick = getTrack("kick");
        if (kick) kick.steps = [true, false, true, false, false, false, true, false, true, false, true, false, false, false, true, false];

        const snare = getTrack("snare");
        if (snare) snare.steps = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];

        const hihatOpen = getTrack("hihat_open");
        if (hihatOpen) hihatOpen.steps = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];

        const bass = getTrack("bass808");
        if (bass && config.includeBass) {
          bass.steps = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];
          bass.notes = [
            { id: "p1", step: 0, pitch: 41, noteName: "F2", duration: 1, velocity: 0.9 },
            { id: "p2", step: 2, pitch: 41, noteName: "F2", duration: 1, velocity: 0.9 },
            { id: "p3", step: 4, pitch: 41, noteName: "F2", duration: 1, velocity: 0.9 },
            { id: "p4", step: 6, pitch: 41, noteName: "F2", duration: 1, velocity: 0.9 },
            { id: "p5", step: 8, pitch: 36, noteName: "C2", duration: 1, velocity: 0.95 },
            { id: "p6", step: 10, pitch: 36, noteName: "C2", duration: 1, velocity: 0.95 },
            { id: "p7", step: 12, pitch: 38, noteName: "D2", duration: 1, velocity: 0.9 },
            { id: "p8", step: 14, pitch: 39, noteName: "D#2", duration: 1, velocity: 0.9 },
          ];
        }

        const synth = getTrack("synth_lead");
        if (synth && config.includeMelody) {
          synth.steps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
          synth.notes = [
            { id: "sy1", step: 0, pitch: 65, noteName: "F4", duration: 2, velocity: 1.0 },
            { id: "sy2", step: 4, pitch: 65, noteName: "F4", duration: 2, velocity: 1.0 },
            { id: "sy3", step: 8, pitch: 60, noteName: "C4", duration: 2, velocity: 1.0 },
            { id: "sy4", step: 12, pitch: 62, noteName: "D4", duration: 2, velocity: 1.0 },
          ];
        }
        break;
      }

      case "boombap": {
        recommendedBpm = 90;
        recommendedSwing = 45; // Classic Dilla swing
        summary = "Boom Bap 90s Lo-Fi: Swing cálido, caja gorda y percusión desfasada.";

        const kick = getTrack("kick");
        if (kick) kick.steps = [true, false, false, false, false, false, false, false, false, false, true, false, false, false, false, false];

        const snare = getTrack("snare");
        if (snare) snare.steps = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];

        const hihat = getTrack("hihat_closed");
        if (hihat) hihat.steps = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];

        const perc = getTrack("perc");
        if (perc) perc.steps = [false, false, false, true, false, false, false, false, false, false, false, false, false, false, true, false];

        const bass = getTrack("bass808");
        if (bass && config.includeBass) {
          bass.steps = [true, false, false, false, false, false, true, false, false, false, true, false, false, true, false, false];
          bass.notes = [
            { id: "bb1", step: 0, pitch: 36, noteName: "C2", duration: 2, velocity: 0.9 },
            { id: "bb2", step: 6, pitch: 38, noteName: "D2", duration: 2, velocity: 0.8 },
            { id: "bb3", step: 10, pitch: 41, noteName: "F2", duration: 2, velocity: 0.85 },
            { id: "bb4", step: 13, pitch: 43, noteName: "G2", duration: 2, velocity: 0.85 },
          ];
        }

        const synth = getTrack("synth_lead");
        if (synth && config.includeMelody) {
          synth.steps = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
          synth.notes = [
            { id: "sy1", step: 4, pitch: 63, noteName: "D#4", duration: 2, velocity: 0.7 },
            { id: "sy2", step: 12, pitch: 60, noteName: "C4", duration: 2, velocity: 0.7 },
          ];
        }
        break;
      }

      case "dembow": {
        recommendedBpm = 96;
        recommendedSwing = 0;
        summary = "Reggaeton / Dembow Clásico: Bombo constante en 4 tiempos y caja sincopada (tresillo).";

        // 4 on the floor kick
        const kick = getTrack("kick");
        if (kick) kick.steps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];

        // Syncopated Snare (3, 6, 11, 14)
        const snare = getTrack("snare");
        if (snare) snare.steps = [false, false, false, true, false, false, true, false, false, false, false, true, false, false, true, false];

        const clap = getTrack("clap");
        if (clap) clap.steps = [false, false, false, true, false, false, true, false, false, false, false, true, false, false, true, false];

        const perc = getTrack("perc");
        if (perc) perc.steps = [false, false, true, false, false, true, false, false, false, false, true, false, false, true, false, false];

        const bass = getTrack("bass808");
        if (bass && config.includeBass) {
          bass.steps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
          bass.notes = [
            { id: "d1", step: 0, pitch: 36, noteName: "C2", duration: 2, velocity: 1.0 },
            { id: "d2", step: 4, pitch: 36, noteName: "C2", duration: 2, velocity: 1.0 },
            { id: "d3", step: 8, pitch: 41, noteName: "F2", duration: 2, velocity: 1.0 },
            { id: "d4", step: 12, pitch: 43, noteName: "G2", duration: 2, velocity: 1.0 },
          ];
        }
        break;
      }

      case "cyberpunk_drill": {
        recommendedBpm = 142;
        recommendedSwing = 10;
        summary = "Cyberpunk UK Drill: Cajas fantasma en 3 y 11, bombo flotante y bajo 808 deslizante.";

        const kick = getTrack("kick");
        if (kick) kick.steps = [true, false, false, false, false, false, false, false, false, true, false, false, false, false, false, false];

        const snare = getTrack("snare");
        if (snare) snare.steps = [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false];

        const perc = getTrack("perc");
        if (perc) perc.steps = [false, false, true, false, false, false, false, false, false, false, false, false, false, false, true, false];

        const hihat = getTrack("hihat_closed");
        if (hihat) hihat.steps = [true, false, true, true, false, true, true, false, true, false, true, true, false, true, true, false];

        const bass = getTrack("bass808");
        if (bass && config.includeBass) {
          bass.steps = [true, false, false, false, false, false, true, false, false, true, false, false, false, false, false, false];
          bass.notes = [
            { id: "dr1", step: 0, pitch: 38, noteName: "D2", duration: 2, velocity: 1.0 },
            { id: "dr2", step: 6, pitch: 45, noteName: "A2", duration: 1, velocity: 0.9 },
            { id: "dr3", step: 9, pitch: 43, noteName: "G2", duration: 2, velocity: 0.95 },
          ];
        }

        const synth = getTrack("synth_lead");
        if (synth && config.includeMelody) {
          synth.steps = [false, false, true, false, false, true, false, false, false, false, true, false, false, true, false, true];
          synth.notes = [
            { id: "sy1", step: 2, pitch: 62, noteName: "D4", duration: 1, velocity: 0.8 },
            { id: "sy2", step: 5, pitch: 65, noteName: "F4", duration: 1, velocity: 0.8 },
            { id: "sy3", step: 10, pitch: 69, noteName: "A4", duration: 1, velocity: 0.9 },
            { id: "sy4", step: 13, pitch: 67, noteName: "G4", duration: 1, velocity: 0.8 },
          ];
        }
        break;
      }

      case "synthwave":
      default: {
        recommendedBpm = 118;
        recommendedSwing = 0;
        summary = "Retro Synthwave 80s: Bombo 4-on-the-floor, palmadas con reverb y arpegio continuo.";

        const kick = getTrack("kick");
        if (kick) kick.steps = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];

        const snare = getTrack("snare");
        if (snare) snare.steps = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];

        const clap = getTrack("clap");
        if (clap) clap.steps = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];

        const hihat = getTrack("hihat_closed");
        if (hihat) hihat.steps = [true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true];

        const openHat = getTrack("hihat_open");
        if (openHat) openHat.steps = [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false];

        const bass = getTrack("bass808");
        if (bass && config.includeBass) {
          bass.steps = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];
          bass.notes = [
            { id: "sw1", step: 0, pitch: 36, noteName: "C2", duration: 1, velocity: 0.9 },
            { id: "sw2", step: 2, pitch: 36, noteName: "C2", duration: 1, velocity: 0.9 },
            { id: "sw3", step: 4, pitch: 36, noteName: "C2", duration: 1, velocity: 0.9 },
            { id: "sw4", step: 6, pitch: 36, noteName: "C2", duration: 1, velocity: 0.9 },
            { id: "sw5", step: 8, pitch: 41, noteName: "F2", duration: 1, velocity: 0.9 },
            { id: "sw6", step: 10, pitch: 41, noteName: "F2", duration: 1, velocity: 0.9 },
            { id: "sw7", step: 12, pitch: 43, noteName: "G2", duration: 1, velocity: 0.9 },
            { id: "sw8", step: 14, pitch: 43, noteName: "G2", duration: 1, velocity: 0.9 },
          ];
        }

        const synth = getTrack("synth_lead");
        if (synth && config.includeMelody) {
          synth.steps = [true, false, false, true, false, false, true, false, true, false, false, true, false, false, true, false];
          synth.notes = [
            { id: "swy1", step: 0, pitch: 60, noteName: "C4", duration: 1, velocity: 0.8 },
            { id: "swy2", step: 3, pitch: 63, noteName: "D#4", duration: 1, velocity: 0.8 },
            { id: "swy3", step: 6, pitch: 67, noteName: "G4", duration: 1, velocity: 0.9 },
            { id: "swy4", step: 8, pitch: 65, noteName: "F4", duration: 1, velocity: 0.8 },
            { id: "swy5", step: 11, pitch: 67, noteName: "G4", duration: 1, velocity: 0.9 },
            { id: "swy6", step: 14, pitch: 72, noteName: "C5", duration: 1, velocity: 0.95 },
          ];
        }
        break;
      }
    }

    return {
      tracks: newTracks,
      recommendedBpm,
      recommendedSwing,
      summary,
    };
  }

  /**
   * Generates a downloadable Standard MIDI File (.mid) from current tracks & piano roll notes
   */
  public static exportToMidi(tracks: TrackChannel[], bpm: number): Blob {
    // Generate MIDI Type 0 (Single Multi-Channel Track)
    const ticksPerQuarter = 96;
    const ticksPer16th = ticksPerQuarter / 4; // 24 ticks

    const events: { tick: number; status: number; data1: number; data2: number }[] = [];

    // Map drum instruments to General MIDI drum map on Channel 10 (Channel Index 9)
    const drumPitchMap: Record<InstrumentId, number> = {
      kick: 36,         // Bass Drum 1
      snare: 38,        // Acoustic Snare
      hihat_closed: 42, // Closed Hi-Hat
      hihat_open: 46,   // Open Hi-Hat
      clap: 39,         // Hand Clap
      bass808: 35,      // Acoustic Bass Drum / 808
      synth_lead: 60,   // C4 Lead
      perc: 56,         // Cowbell / Rimshot
    };

    tracks.forEach((track) => {
      const isMelodic = track.category === "synth" || track.category === "bass";
      const channel = isMelodic ? (track.category === "bass" ? 1 : 2) : 9; // Ch 10 is 9 (drums)

      track.steps.forEach((active, step) => {
        if (!active) return;
        const tick = step * ticksPer16th;
        const pianoNote = track.notes.find((n) => n.step === step);
        const pitch = pianoNote ? pianoNote.pitch : (drumPitchMap[track.id] || 36);
        const velocity = pianoNote ? Math.round(pianoNote.velocity * 127) : 100;
        const durationTicks = (pianoNote?.duration || 1) * ticksPer16th;

        // Note On
        events.push({ tick, status: 0x90 | channel, data1: pitch, data2: velocity });
        // Note Off
        events.push({ tick: tick + durationTicks - 2, status: 0x80 | channel, data1: pitch, data2: 0 });
      });
    });

    // Sort events chronologically
    events.sort((a, b) => a.tick - b.tick);

    // Encode Variable Length Quantity (VLQ) helper
    const encodeVlq = (val: number): number[] => {
      const bytes: number[] = [];
      let buffer = val & 0x7f;
      while ((val >>= 7)) {
        buffer <<= 8;
        buffer |= (val & 0x7f) | 0x80;
      }
      while (true) {
        bytes.push(buffer & 0xff);
        if (buffer & 0x80) buffer >>= 8;
        else break;
      }
      return bytes;
    };

    // Track data stream
    const trackData: number[] = [];

    // Tempo meta event (FF 51 03 tt tt tt)
    const microsecPerQuarter = Math.round(60000000 / bpm);
    trackData.push(
      0x00, 0xff, 0x51, 0x03,
      (microsecPerQuarter >> 16) & 0xff,
      (microsecPerQuarter >> 8) & 0xff,
      microsecPerQuarter & 0xff
    );

    let lastTick = 0;
    events.forEach((ev) => {
      const delta = ev.tick - lastTick;
      lastTick = ev.tick;
      trackData.push(...encodeVlq(delta));
      trackData.push(ev.status, ev.data1, ev.data2);
    });

    // End of Track meta event (FF 2F 00)
    trackData.push(0x00, 0xff, 0x2f, 0x00);

    // MIDI File Header (MThd)
    const header: number[] = [
      0x4d, 0x54, 0x68, 0x64, // 'MThd'
      0x00, 0x00, 0x00, 0x06, // Chunk size: 6
      0x00, 0x00,             // Format 0
      0x00, 0x01,             // 1 track
      (ticksPerQuarter >> 8) & 0xff,
      ticksPerQuarter & 0xff,
    ];

    // Track chunk (MTrk)
    const trackHeader: number[] = [
      0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
      (trackData.length >> 24) & 0xff,
      (trackData.length >> 16) & 0xff,
      (trackData.length >> 8) & 0xff,
      trackData.length & 0xff,
    ];

    const finalMidiBytes = new Uint8Array([...header, ...trackHeader, ...trackData]);
    return new Blob([finalMidiBytes], { type: "audio/midi" });
  }
}

