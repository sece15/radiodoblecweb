interface EmojiDefinition { id: string; label: string; unicode?: string }

const DEFINITIONS: EmojiDefinition[] = [
  {"id":"feliz","label":"C feliz"},
  {"id":"risa","label":"C riendo","unicode":"😂"},
  {"id":"amor","label":"C enamorado"},
  {"id":"musica","label":"C disfrutando música"},
  {"id":"travieso","label":"C travieso"},
  {"id":"molesto","label":"C molesto"},
  {"id":"pensando","label":"C pensando","unicode":"🤔"},
  {"id":"sorprendido","label":"C sorprendido","unicode":"😲"},
  {"id":"triste","label":"C triste","unicode":"😢"},
  {"id":"dormido","label":"C durmiendo","unicode":"😴"},
  {"id":"fuego","label":"C en llamas","unicode":"🔥"},
  {"id":"cool","label":"C con estilo","unicode":"😎"},
  {"id":"estrella-ojos","label":"C impresionado","unicode":"🤩"},
  {"id":"diablito","label":"C diablito","unicode":"😈"},
  {"id":"calavera","label":"C calavera","unicode":"💀"},
  {"id":"bomba","label":"Bomba C","unicode":"💣"},
  {"id":"hola","label":"C saludando"},
  {"id":"pulgar","label":"C me gusta","unicode":"👍"},
  {"id":"paz","label":"C paz","unicode":"✌️"},
  {"id":"rock","label":"C rockero","unicode":"🤘"},
  {"id":"manos-arriba","label":"C manos arriba","unicode":"🙌"},
  {"id":"aplausos","label":"C aplausos","unicode":"👏"},
  {"id":"carcajada","label":"C carcajada","unicode":"🤣"},
  {"id":"ojos","label":"C ojos neón","unicode":"👀"},
  {"id":"robot","label":"C robot","unicode":"🤖"},
  {"id":"alien","label":"C alien","unicode":"👽"},
  {"id":"pixel","label":"C alien pixel","unicode":"👾"},
  {"id":"corazon","label":"Corazón","unicode":"❤️"},
  {"id":"corazon-negro","label":"Corazón negro","unicode":"🖤"},
  {"id":"rosa","label":"Rosa","unicode":"🌹"},
];

export const MASCOT_EMOJIS = DEFINITIONS.map((emoji) => ({
  ...emoji,
  token: `:c-${emoji.id}:`,
  src: `/emojis/msn/c-${emoji.id}-48.png`,
  smallSrc: `/emojis/msn/c-${emoji.id}-48.png`,
}));

const byId = new Map(MASCOT_EMOJIS.map((emoji) => [emoji.id, emoji]));

export const MASCOT_REACTIONS = ["fuego", "corazon-negro", "rosa"]
  .map((id) => byId.get(id)!)
  .filter(Boolean);

export interface EmojiCategoryItem {
  id: string;
  label: string;
  token: string;
  char?: string;
  unicode?: string;
  src?: string;
  smallSrc?: string;
  isNative?: boolean;
}

export interface EmojiCategory {
  name: string;
  emojis: EmojiCategoryItem[];
}

export const NATIVE_RADIO_EMOJIS: EmojiCategoryItem[] = [
  { id: "radio", label: "Radio", char: "📻", token: "📻", isNative: true },
  { id: "microfono", label: "Micrófono", char: "🎙️", token: "🎙️", isNative: true },
  { id: "mic", label: "Micrófono de mano", char: "🎤", token: "🎤", isNative: true },
  { id: "audifonos", label: "Auriculares", char: "🎧", token: "🎧", isNative: true },
  { id: "guitarra", label: "Guitarra", char: "🎸", token: "🎸", isNative: true },
  { id: "nota", label: "Nota musical", char: "🎵", token: "🎵", isNative: true },
  { id: "notas", label: "Notas musicales", char: "🎶", token: "🎶", isNative: true },
  { id: "disco", label: "Disco", char: "💿", token: "💿", isNative: true },
  { id: "volumen", label: "Altavoz", char: "🔊", token: "🔊", isNative: true },
  { id: "teclado", label: "Teclado musical", char: "🎹", token: "🎹", isNative: true },
  { id: "trompeta", label: "Trompeta", char: "🎺", token: "🎺", isNative: true },
  { id: "bateria", label: "Batería", char: "🥁", token: "🥁", isNative: true },
  { id: "mezcladora", label: "Mesa de mezclas", char: "🎛️", token: "🎛️", isNative: true },
  { id: "saxofon", label: "Saxofón", char: "🎷", token: "🎷", isNative: true },
  { id: "partitura", label: "Partitura", char: "🎼", token: "🎼", isNative: true },
  { id: "bola-disco", label: "Bola de disco", char: "🪩", token: "🪩", isNative: true },
  { id: "violin", label: "Violín", char: "🎻", token: "🎻", isNative: true },
  { id: "megafono", label: "Megáfono", char: "📢", token: "📢", isNative: true },
];

export const NATIVE_FIESTA_EMOJIS: EmojiCategoryItem[] = [
  { id: "cervezas", label: "Cervezas", char: "🍻", token: "🍻", isNative: true },
  { id: "brindis", label: "Brindis", char: "🥂", token: "🥂", isNative: true },
  { id: "fiesta", label: "Fiesta", char: "🎉", token: "🎉", isNative: true },
  { id: "celebracion", label: "Celebración", char: "🥳", token: "🥳", isNative: true },
  { id: "champan", label: "Champán", char: "🍾", token: "🍾", isNative: true },
  { id: "pizza", label: "Pizza", char: "🍕", token: "🍕", isNative: true },
  { id: "corona", label: "Corona", char: "👑", token: "👑", isNative: true },
  { id: "diana", label: "Diana", char: "🎯", token: "🎯", isNative: true },
  { id: "trofeo", label: "Trofeo", char: "🏆", token: "🏆", isNative: true },
  { id: "arcoiris", label: "Arcoíris", char: "🌈", token: "🌈", isNative: true },
  { id: "baile", label: "Baile", char: "💃", token: "💃", isNative: true },
  { id: "disco", label: "Bailarín disco", char: "🕺", token: "🕺", isNative: true },
  { id: "coctel", label: "Cóctel", char: "🍹", token: "🍹", isNative: true },
  { id: "copa", label: "Copa cóctel", char: "🍸", token: "🍸", isNative: true },
  { id: "tarta", label: "Tarta cumpleaños", char: "🎂", token: "🎂", isNative: true },
  { id: "globo", label: "Globo", char: "🎈", token: "🎈", isNative: true },
  { id: "palomitas", label: "Palomitas", char: "🍿", token: "🍿", isNative: true },
  { id: "hamburguesa", label: "Hamburguesa", char: "🍔", token: "🍔", isNative: true },
];

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: "DOBLE-C",
    emojis: [
      "feliz",
      "risa",
      "carcajada",
      "amor",
      "musica",
      "travieso",
      "molesto",
      "pensando",
      "sorprendido",
      "triste",
      "dormido",
      "fuego",
      "cool",
      "estrella-ojos",
      "diablito",
      "calavera",
      "bomba"
    ].map((id) => byId.get(id)!).filter(Boolean),
  },
  {
    name: "RADIO",
    emojis: NATIVE_RADIO_EMOJIS,
  },
  {
    name: "GESTOS",
    emojis: [
      "hola",
      "pulgar",
      "paz",
      "rock",
      "manos-arriba",
      "aplausos",
      "ojos",
      "robot",
      "alien",
      "pixel",
      "corazon",
      "corazon-negro",
      "rosa"
    ].map((id) => byId.get(id)!).filter(Boolean),
  },
  {
    name: "FIESTA",
    emojis: NATIVE_FIESTA_EMOJIS,
  }
];

const byCode = new Map(MASCOT_EMOJIS.flatMap((emoji) => [
  [emoji.token, emoji] as const,
  ...(emoji.unicode ? [[emoji.unicode, emoji] as const, [emoji.unicode.replace(/\uFE0F/g, ""), emoji] as const] : []),
]));

export function getEmojiByTokenOrId(identifier: string) {
  const clean = identifier.trim();
  return byCode.get(clean) || byId.get(clean.replace(/^:c-|:$/g, ""));
}

const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const emojiPattern = new RegExp([...byCode.keys()].sort((a, b) => b.length - a.length).map(escapeRegex).join("|"), "gu");

export function splitMascotMessage(text: string) {
  const parts: { text: string; emoji?: typeof MASCOT_EMOJIS[number] }[] = [];
  let cursor = 0;
  for (const match of text.matchAll(emojiPattern)) {
    const index = match.index!;
    // Keep unsupported skin-tone and joined emoji sequences intact.
    const following = text.codePointAt(index + match[0].length);
    const previous = index > 0 ? text.codePointAt(index - 1) : undefined;
    if (previous === 0x200d || following === 0x200d || (following !== undefined && following >= 0x1f3fb && following <= 0x1f3ff)) continue;
    if (index > cursor) parts.push({ text: text.slice(cursor, index) });
    parts.push({ text: match[0], emoji: byCode.get(match[0]) });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });
  return parts;
}

// An insertion must fit completely; never cut a shortcode in half.
export function appendMascotEmoji(text: string, token: string, maxLength: number) {
  const needsSpace = text.length > 0 && !text.endsWith(" ");
  const withLeading = (needsSpace ? " " : "") + token;
  const withTrailing = withLeading + " ";
  if (text.length + withTrailing.length <= maxLength) {
    return text + withTrailing;
  }
  if (text.length + withLeading.length <= maxLength) {
    return text + withLeading;
  }
  return text.length + token.length <= maxLength ? text + token : text;
}
