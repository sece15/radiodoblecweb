// =======================================================================
// C-DIGGER CURATOR CHANNELS REGISTRY (src/lib/studio/curatorChannels.ts)
// Canales Archivistas y Coleccionistas de Vinilos en YouTube (Samplette-style)
// =======================================================================

import type { CuratorChannel } from "@/types/studio";

export const CURATOR_CHANNELS: CuratorChannel[] = [
  {
    id: "maj",
    name: "My Analog Journal",
    handle: "@MyAnalogJournal",
    channelId: "UC_D45P2F4WwWp25h06mQxbg",
    genre: "Jazz Fusion & Rhodes 70s",
    country: "Mundial 🌐",
    description: "El canal de vinilos más influyente del mundo. Sets grabados en tornamesas analógicas Technics 1200 por selectores internacionales.",
    verified: true,
    featuredTrackIds: ["6GwdWSx8v0c", "I56NSBduc9Q", "7tOmZd2cgIg"],
  },
  {
    id: "infopesa",
    name: "INFOPESA (Perú)",
    handle: "@INFOPESAvideos",
    channelId: "UCkP1J27F4V9l26m7x_c7W5g",
    genre: "Chicha & Cumbia Psicodélica",
    country: "Perú 🇵🇪",
    description: "El sello discográfico histórico de Lima y la Amazonía peruana. Cintas máster y vinilos originales de Los Mirlos, Juaneco y Los Destellos.",
    verified: true,
    featuredTrackIds: ["2oKXHWGulk0", "kAap4MCq6WY", "bI9asWE-zlA"],
  },
  {
    id: "wir",
    name: "WIR:concept (Tokio)",
    handle: "@wirconcept",
    genre: "City Pop & Funk Japonés",
    country: "Japón 🇯🇵",
    description: "Los mayores archivistas de singles de 7\" y LPs de vinilo de Tokio (1978-1988). Slap bass, sintetizadores analógicos y funk nocturno.",
    verified: true,
    featuredTrackIds: ["cLrCPq7BmTQ", "sl9LzFGPOEc"],
  },
  {
    id: "terminal-passage",
    name: "Terminal Passage",
    handle: "@TerminalPassage",
    genre: "Jazz Fusion & Rhodes 70s",
    country: "USA 🇺🇸",
    description: "Archivo de culto especializado en álbumes completos de Jazz Fusion, Krautrock, Soviet Synth y Library Music de los 70s.",
    verified: true,
    featuredTrackIds: ["Nwhg7Fdn8Qo", "cfOLz36ah_E"],
  },
  {
    id: "discogs-brazil",
    name: "Discogs Brazil",
    handle: "@discogsbrazil",
    genre: "Bossa Nova & MPB",
    country: "Brasil 🇧🇷",
    description: "Digitalizaciones analógicas de 'compactos' (singles de vinilo de 7 pulgadas) de sellos históricos como Odeon Brasil, Som Livre y Philips.",
    verified: true,
    featuredTrackIds: ["i8gC6I6vR_g", "ImAarpAZoTw", "5UlcqYZ2Qrs"],
  },
  {
    id: "munster-vampisoul",
    name: "Munster Records & Vampi Soul",
    handle: "@MunsterRecordsSpain",
    genre: "Afrobeat & Highlife",
    country: "Ghana 🇬🇭",
    description: "Arqueología musical dedicada a rescatar grabaciones perdidas de África Occidental, cumbia psicodélica y boogaloo latino.",
    verified: true,
    featuredTrackIds: ["Tx-4xfcQUcc", "D7M8WicYKxk", "lDCTduReKRk"],
  },
  {
    id: "funky-moose",
    name: "The Funky Moose",
    handle: "@TheFunkyMoose",
    genre: "Soul & Rare Groove 70s",
    country: "USA 🇺🇸",
    description: "B-sides olvidados de 45 RPM, rare groove y drum breaks limpios listos para MPC y beatmaking de hip-hop clásico.",
    verified: true,
    featuredTrackIds: ["0TxxeFwrJeM", "HpFzVOcsDLk", "qT4IsfR2suY"],
  },
  {
    id: "selector-kriz",
    name: "Selector Kriz (Perú 45s)",
    handle: "@SelectorKriz",
    genre: "Chicha & Cumbia Psicodélica",
    country: "Perú 🇵🇪",
    description: "DJ y coleccionista peruano de singles de 45 RPM en sellos Dinsa, Odeon del Perú e Infopesa. Guitarras fuzz selváticas directas de tornamesa.",
    verified: true,
    featuredTrackIds: ["678b-pZOZOU", "xiWuTYaPtdI", "2SsolOTSxo8"],
  },
  {
    id: "dorian-vinyl",
    name: "Dorian Vinyl (City Pop)",
    handle: "@DorianVinyl",
    genre: "City Pop & Funk Japonés",
    country: "Japón 🇯🇵",
    description: "Sesiones en directo de vinilos de City Pop, Boogie y Disco japonés con aguja analógica y cálida presencia sonora.",
    verified: true,
    featuredTrackIds: ["iMNnZcz9pGA", "w8TAxuXSh_0", "aduFn-jtanY"],
  },
  {
    id: "day-by-day",
    name: "DAY BY DAY (Solar Brazil)",
    handle: "@DAYBYDAYMUSIC",
    genre: "Bossa Nova & MPB",
    country: "Brasil 🇧🇷",
    description: "Sonidos solares brasileños de los 70s. Bossa nova orquestal, samba soul bailable y guitarras de nylon de Río de Janeiro.",
    verified: true,
    featuredTrackIds: ["eaXAQyvB3BQ", "5w5RruI0lEo", "urwodTmD0F8"],
  },
];

export function getCuratorChannel(idOrSlug: string): CuratorChannel | undefined {
  return CURATOR_CHANNELS.find(
    (c) => c.id === idOrSlug || c.name.toLowerCase().includes(idOrSlug.toLowerCase())
  );
}

export function getAllCuratorNames(): string[] {
  return CURATOR_CHANNELS.map((c) => c.name);
}

