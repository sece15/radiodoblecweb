import { Station, RadioProgram, PastBroadcast, Album, Song, Product, MusicScheduleBlock, DayOfWeekItem } from "@/types";

export const MP_ALIAS = process.env.NEXT_PUBLIC_MP_ALIAS || "";
export const MP_CVU = process.env.NEXT_PUBLIC_MP_CVU || "";

export const DEFAULT_AVATAR = "https://lh3.googleusercontent.com/aida-public/AB6AXuA6srmeb-vk1Q2DfS7yC25Domf9c0kLipds57TXJh5KR9tiwF0baTSxCYrkymfzHxHofWx2YGAQDG57_xmYQtC9MQx8VQPS6a0rLLTKzaPewxsyENt8isBr4H-DAbKm6rLb-w9dsT6EiKYAAbHSbGQA863cyUibAznEG1WcAP_Dj4yODOI3MVpRgwobV6sGpli8fKGgEMGNGPG7wXpGs26dibxLVsd1eiJZvnFe-8M6cXt8AYRNIw6JQ294dBMMJ4TD46rF6izIPJeP";
export const DEFAULT_STREAM = process.env.NEXT_PUBLIC_STREAM_URL || "";

export const DEFAULT_BANNED_WORDS = [
  "spam", "toxico", "sonico", "sonica", "hack", "virus", "puta", "puto",
  "mamahuevo", "hijoeputa", "marica", "maricon", "paja", "pajero", "culo", "coño", "verga"
];

export const INITIAL_STATIONS: Station[] = [
  {
    id: "subterraneo",
    name: "Hits and Beats",
    frequency: "Viernes 11 PM",
    description: "Un documental sonoro que descubre la vida, música, historias y legado de los bateristas que transformaron nuestra manera de escuchar.",
    imageUrl: "/hitsandbeats.jpg",
    isLiked: false,
    style: "ALL MUSIC",
  },
  {
    id: "l_mental",
    name: "L-Mental",
    frequency: "Viernes 9 PM",
    description: "Casos intrigantes, misterios y análisis psicológico con la Zona Esotérica de La Seka al ritmo de Rock, Reggae y Ska.",
    imageUrl: "/lmental.jpg",
    isLiked: true,
    style: "MISTERIO / ROCK, REGGAE & SKA",
  },
  {
    id: "conversa_time",
    name: "Conversa Time",
    frequency: "Viernes 8 PM",
    description: "Magazine musical nocturno. Primer capítulo: microinformativo playlist y reportaje de noche bohemia en la Plaza San Martín.",
    imageUrl: "/conversatime.jpeg",
    isLiked: false,
    style: "MAGAZINE MUSICAL",
  },
  {
    id: "lado_c",
    name: "Lado C",
    frequency: "Sábados 5 PM",
    description: "Programa de los sábados sobre conversación de discos, puntuaciones a discografías y concursos.",
    imageUrl: "/ladoc.jpeg",
    isLiked: false,
    style: "CONVERSACIÓN / DISCOS",
  },
];

export const INITIAL_PROGRAMS: RadioProgram[] = [
  {
    id: "subterraneo",
    title: "Hits and Beats",
    host: "JS",
    timeSlot: "VIERNES 23:00 - 00:00 (11 PM)",
    genre: "ALL MUSIC / BATERÍAS",
    imageUrl: "/hitsandbeats.jpg",
    description: "Un documental sonoro que descubre la vida, música, historias y legado de los bateristas que transformaron nuestra manera de escuchar.",
    hostRole: "BATERISTA & LOCUTOR",
    hostBio: "Músico, baterista y explorador de los grooves más profundos del funk, rock y ritmos afroperuanos. Dedicado a rescatar joyas percusivas de todas las épocas.",
    hostHobbies: ["Batería & Percusión en Vivo", "Coleccionismo de Vinilos Raros", "Fanzines & Cultura Skate", "Café de Especialidad"],
  },
  {
    id: "l_mental",
    title: "L-Mental",
    host: "La Seka",
    timeSlot: "VIERNES 21:00 - 22:00 (9 PM)",
    genre: "MISTERIO / PSICOLOGÍA / ROCK, REGGAE & SKA",
    imageUrl: "/lmental.jpg",
    description: "Un espacio donde nos encontramos con las historias más curiosas, los casos más intrigantes y los misterios que han despertado nuestra imaginación. La mente detrás de la historia.",
    slogan: "La mente detrás de la historia",
    hostRole: "INVESTIGACIÓN & ZONA ESOTÉRICA",
    hostBio: "Espacio nocturno dedicado a explorar conductas extremas, personajes controversiales y casos enigmáticos que han dejado huella en la historia. Conducido junto a 'La Seka', nuestro pitonizo de las cartas del tarot y horóscopo místico, acompañados de una selecta banda sonora de clásicos del Rock, Reggae y Ska.",
    hostHobbies: ["Casos Enigmáticos & Crónicas Históricas", "Zona Esotérica & Tarot con La Seka", "Clásicos de Rock, Reggae & Ska", "Psicología & Conducta Humana"],
    segments: [
      {
        icon: "🎙️",
        control: "Bienvenida",
        locution: "Hay historias que nos sorprenden… casos que nos desconciertan… conductas que nos hacen preguntarnos: ¿qué pasa por la mente de una persona? Bienvenidos a L-Mental, un espacio donde nos encontramos con las historias más curiosas, los casos más intrigantes y los misterios que han despertado nuestra imaginación. Aquí exploraremos casos famosos, personajes controversiales, conductas extremas y acontecimientos que han dejado huella en la historia, tratando de ir más allá de lo evidente para conocer cada comportamiento, cada decisión y cada historia. Pero esto no termina en la mente… porque cuando llega el momento de abrirle la puerta al misterio, tendremos nuestra Zona Esotérica de la mano de una invitado muy especial: 🔮 La Seka, nuestro pitonizo, llegará con las cartas y el horóscopo con ese toque de misterio que no podía faltar en L-Mental. Y por supuesto, todo acompañado de buena música: Rock, Reggae y Ska. Esto es L-Mental: La mente detrás de la historia."
      },
      {
        icon: "🎸",
        control: "Rock 1",
        locution: "Primer clásico de rock"
      },
      {
        icon: "🕵️",
        control: "Presentación del caso",
        locution: "Introducción, contexto y planteamiento del caso de la semana"
      },
      {
        icon: "🎸",
        control: "Rock 2",
        locution: "Segundo clásico de rock"
      },
      {
        icon: "🧠",
        control: "Desarrollo del caso",
        locution: "Historia, acontecimientos principales y análisis psicológico"
      },
      {
        icon: "🌴",
        control: "Reggae 1",
        locution: "Primer clásico de reggae"
      },
      {
        icon: "🔮",
        control: "Zona Esotérica — La Seka",
        locution: "“Dejamos por un momento la mente y el análisis… porque ahora abrimos las puertas de una zona donde la razón se encuentra con el misterio. Ya estoy aquí… soy La Seka.” • Breve comentario sobre el caso. • Recorrido por los signos del Zodiaco. • La carta de la Seka (se lee una carta sacada al azar para alguna persona conectada). Cierre de bloque: 'Recuerda: las cartas pueden mostrar caminos, pero tú eres quien decide cuál recorrer.'"
      },
      {
        icon: "🌴",
        control: "Reggae 2",
        locution: "Segundo clásico de reggae"
      },
      {
        icon: "🧠",
        control: "Conclusiones del caso",
        locution: "Conclusiones, reflexión e interacción con el público conectado."
      },
      {
        icon: "🎺",
        control: "Ska 1",
        locution: "Primer clásico de ska"
      },
      {
        icon: "🎙️",
        control: "Despedida + Ska 2",
        locution: "Y así llegamos al final de L-Mental. Gracias por acompañarnos en este espacio donde la curiosidad, la Psicología, las historias y el misterio se encuentran para hacernos pensar, cuestionar y mirar más allá de lo evidente. Nos vamos, pero la mente nunca deja de hacerse preguntas. Nos reencontramos en el próximo programa con nuevas historias, nuevos personajes, nueva música y nuevas cosas que descubrir. Recuerda que puedes seguirnos, compartir el programa y ser parte de L-Mental enviándonos tus comentarios y preguntas. Y ahora sí… llegó el momento de despedirnos. Esto fue L-Mental: “Gracias, mentes inquietas, por acompañarnos una vez más. Ya saben, mantengan la curiosidad despierta y la mente abierta… nos encontramos en el próximo L-Mental.” ¡Buenas noches Elementales!"
      },
      {
        icon: "🎺",
        control: "Ska 2",
        locution: "Segundo clásico de ska. Final."
      }
    ]
  },
  {
    id: "conversa_time",
    title: "Conversa Time",
    host: "Nicoll",
    timeSlot: "VIERNES 20:00 - 21:00 (8 PM - 9 PM)",
    genre: "MAGAZINE MUSICAL",
    imageUrl: "/conversatime.jpeg",
    description: "Magazine musical nocturno. Microinformativo playlist y reportajes de la noche bohemia en la Plaza San Martín.",
    hostRole: "PERIODISTA CULTURAL & LOCUTORA",
    hostBio: "Comunicadora y cronista cultural. Apasionada por documentar la movida artística de Lima, las calles históricas y las historias detrás de cada canción.",
    hostHobbies: ["Crónicas & Reportajes Nocturnos", "Plaza San Martín & Noches Bohemias", "Cine Independiente", "Exploración de Nuevas Bandas"],
  },
  {
    id: "lado_c",
    title: "Lado C",
    host: "Marx y Anthony",
    timeSlot: "SÁBADOS 17:00 - 18:30 (5 PM - 6:30 PM)",
    genre: "CONVERSACIÓN / DISCOS",
    imageUrl: "/ladoc.jpeg",
    description: "Programa de los sábados sobre conversación de discos, puntuaciones a discografías y concursos.",
    hostRole: "DÚO DE CRÍTICA & MELÓMANOS",
    hostBio: "Dúo especializado en sumergirse de lleno en la historia de los álbumes. Analizan pista por pista, debaten discografías legendarias y retan a la audiencia con trivias de archivo.",
    hostHobbies: ["Puntuación de Discografías", "Cultura Cassette & Vinilo", "Trivias de Rock & Álbumes de Culto", "Debates Musicales"],
  },
];

export const INITIAL_PAST_BROADCASTS: PastBroadcast[] = [
  { id: "hits_beats_1", programId: "subterraneo", title: "Hits and Beats Vol. 1", date: "Hace 2 días", duration: "01:00:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "l_mental_1", programId: "l_mental", title: "L-Mental Cap. 1: La Mente Detrás de la Historia & Zona Esotérica", date: "Próximamente", duration: "01:00:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "conversa_time_1", programId: "conversa_time", title: "Conversa Time Cap. 1: Noche Bohemia Plaza San Martín", date: "Próximamente", duration: "01:00:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "lado_c_1", programId: "lado_c", title: "Lado C Cap. 1: Especial Discografías y Concursos", date: "Próximamente", duration: "01:30:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: "conversa_time_album",
    name: "Conversa Time Sessions",
    artist: "Nicoll",
    imageUrl: "/conversatime.jpeg",
    releaseYear: "2026",
    genre: "Magazine Musical",
  },
  {
    id: "lado_c_album",
    name: "Lado C Vol. 1",
    artist: "Marx y Anthony",
    imageUrl: "/ladoc.jpeg",
    releaseYear: "2026",
    genre: "Conversación / Discos",
  },
  {
    id: "autodj_selection",
    name: "AutoDJ Radio Doble C 24/7",
    artist: "Doble C AutoDJ",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    releaseYear: "2026",
    genre: "Rock / Alt / Underground",
  },
];

export const INITIAL_SONGS: Song[] = [
  {
    id: "conversa_ep1",
    title: "Conversa Time Cap. 1: Microinformativo & Noche Bohemia Plaza San Martín",
    artist: "Nicoll",
    albumName: "Conversa Time Sessions",
    imageUrl: "/conversatime.jpeg",
    streamUrl: DEFAULT_STREAM,
    isFavorite: true,
    durationSeconds: 3600,
  },
  {
    id: "lado_c_ep1",
    title: "Lado C: Reseñas, Puntuación de Discografías y Concursos",
    artist: "Marx y Anthony",
    albumName: "Lado C Vol. 1",
    imageUrl: "/ladoc.jpeg",
    streamUrl: DEFAULT_STREAM,
    isFavorite: true,
    durationSeconds: 5400,
  },
  {
    id: "hits_beats_session",
    title: "Hits and Beats: Especial Fauces del Ritmo",
    artist: "JS",
    albumName: "Hits and Beats",
    imageUrl: "/hitsandbeats.jpg",
    streamUrl: DEFAULT_STREAM,
    isFavorite: false,
    durationSeconds: 3600,
  },
  {
    id: "autodj_track_1",
    title: "Selección AutoDJ 24/7: Programación Musical Continua",
    artist: "Doble C AutoDJ",
    albumName: "AutoDJ Radio Doble C 24/7",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&q=80",
    streamUrl: DEFAULT_STREAM,
    isFavorite: false,
    durationSeconds: 240,
  },
];

export const STORE_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "POLERA DOBLE C ANCHA CON GORRO (HOODIE)",
    price: "S/.129.90",
    imageUrl: "/store/polera-doblec-ancha-congorro.png",
    rotation: -2,
    description: "¡HOODIE ANCHO CON CAPUCHA DE MÁXIMA COBERTURA! Polera oversize confeccionada en felpa reactiva de alto gramaje con forro térmico y cordones ajustables. Estampado serigráfico de alta densidad con la identidad oficial de Radio Doble C que no se desgasta con las lavadas. La prenda definitiva para el invierno y sesiones de transmisión.",
    colors: ["NEGRO NOCHE", "GRIS CLÁSICO", "BICOLOR GRIS-NEGRO"],
    sizes: ["S", "M", "L", "XL"],
    variantImages: {
      "NEGRO NOCHE": "/store/polera-doblec-ancha-congorro.png",
      "GRIS CLÁSICO": "/store/polera-doblec-ancha-congorro-gris.png",
      "BICOLOR GRIS-NEGRO": "/store/polera-doblec-ancha-congorro-gris-negro.png",
    },
    badge: "🔥 MÁS BUSCADO",
    isFeatured: true,
  },
  {
    id: "2",
    name: "CAMISA OVERSIZE DOBLE C (EDICIÓN ESTUDIO)",
    price: "S/.59.90",
    imageUrl: "/store/camisadoblec.png",
    rotation: 2,
    description: "¡CORTE OVERSIZE Y ESTILO URBANO DE RADIO DOBLE C! Camisa de algodón pesado premium con botones reforzados y tipografía fanzine de autor en la espalda. Diseñada para cabina de radio, eventos en vivo y el uso diario con máxima soltura y frescura.",
    colors: ["DOBLADA", "VISTA FRONTAL"],
    sizes: ["S", "M", "L", "XL"],
    variantImages: {
      "DOBLADA": "/store/camisadoblec.png",
      "VISTA FRONTAL": "/store/camisadoblec-1.png",
    },
    badge: "⚡ EDICIÓN LIMITADA",
    isFeatured: true,
  },
  {
    id: "3",
    name: "CAMISA OVERSIZE CON BOLSILLO TÉCNICO",
    price: "S/.59.90",
    imageUrl: "/store/camisadoblec-bolsillo.png",
    rotation: -1,
    description: "¡CORTE OVERSIZE CON BOLSILLO TÉCNICO FRONTAL! La clásica camisa oversize de Radio Doble C pero con bolsillo utilitario reforzado en el pecho para accesorios de estudio, credenciales o grabadora portátil. Algodón pesado de alta durabilidad con botones reforzados.",
    colors: ["VISTA FRONTAL", "DOBLADA / BOLSILLO"],
    sizes: ["S", "M", "L", "XL"],
    variantImages: {
      "VISTA FRONTAL": "/store/camisadoblec-bolsillo.png",
      "DOBLADA / BOLSILLO": "/store/camisadoblec-bolsillo-2.png",
    },
    badge: "🌟 NUEVO INGRESO",
  },
  {
    id: "4",
    name: "POLERA DOBLE C HOODIE BICOLOR GRIS-NEGRO",
    price: "S/129.90",
    imageUrl: "/store/polera-doblec-ancha-congorro-gris-negro.png",
    rotation: 3,
    description: "¡CONTRASTE Y ACTITUD STREETWEAR EN DOS TONOS! Edición especial de polera con bloques de color en gris melange y negro profundo. Cuenta con bolsillo canguro amplio reforzado y puños acanalados elásticos para un ajuste perfecto.",
    colors: ["BICOLOR GRIS-NEGRO", "GRIS CLÁSICO", "NEGRO NOCHE"],
    sizes: ["M", "L", "XL"],
    variantImages: {
      "BICOLOR GRIS-NEGRO": "/store/polera-doblec-ancha-congorro-gris-negro.png",
      "GRIS CLÁSICO": "/store/polera-doblec-ancha-congorro-gris.png",
      "NEGRO NOCHE": "/store/polera-doblec-ancha-congorro.png",
    },
    badge: "⭐ EDICIÓN ESPECIAL",
  },
];

export const MUSIC_SCHEDULE_BLOCKS: MusicScheduleBlock[] = [
  {
    id: "block_morning",
    timeSlot: "06:00 - 09:00",
    startHour: 6,
    endHour: 9,
    name: "Despertador Mañanero / Morning Show",
    subtitle: "Energía Mañanera & Upbeat Hits",
    genres: ["Pop Actual", "Reggaetón comercial", "Latipop", "Upbeat Hits"],
    energyLevel: "Alta",
    energyDescription: "Canciones alegres, ritmos rápidos (110-128 BPM), IDs de radio frecuentes.",
    bpmInfo: "110-128 BPM",
    period: "morning",
    tagColor: "#FFDE82",
    badge: "☀️ ENERGÍA MATUTINA",
  },
  {
    id: "block_workday",
    timeSlot: "09:00 - 13:00",
    startHour: 9,
    endHour: 13,
    name: "Conexión Laboral / Workday Flow",
    subtitle: "Enfoque, Ritmo & Flow de Trabajo",
    genres: ["Pop/Rock 2000s", "Soft Pop", "Indie", "Funk Soft", "Lo-Fi Beat"],
    energyLevel: "Media",
    energyDescription: "Ritmo constante sin cambios bruscos de volumen para no interrumpir el enfoque.",
    bpmInfo: "90-115 BPM",
    period: "workday",
    tagColor: "#BEE3F8",
    badge: "💼 CONEXIÓN LABORAL",
  },
  {
    id: "block_lunch",
    timeSlot: "13:00 - 15:00",
    startHour: 13,
    endHour: 15,
    name: "Almuerzo Relajado / Lunch & Hits",
    subtitle: "Música Amigable & Clásicos de Fondo",
    genres: ["Cumbia/Salsa (Latinoamérica)", "Pop Clásico", "Baladas Modernas", "Reggae"],
    energyLevel: "Media-Baja",
    energyDescription: "Música amigable para escuchar de fondo durante la comida.",
    bpmInfo: "85-105 BPM",
    period: "lunch",
    tagColor: "#FED7D7",
    badge: "🍽️ HORA DE ALMUERZO",
  },
  {
    id: "block_afternoon",
    timeSlot: "15:00 - 18:00",
    startHour: 15,
    endHour: 18,
    name: "La Tarde en Ruta / Afternoon Boost",
    subtitle: "Impulso de la Tarde & Éxitos Virales",
    genres: ["Urban Pop", "Electropop", "Latin Hits", "Synthwave"],
    energyLevel: "Alta",
    energyDescription: "Recupera la energía de la tarde, canciones virales y listas de éxitos.",
    bpmInfo: "115-130 BPM",
    period: "afternoon",
    tagColor: "#E9D8FD",
    badge: "🚗 LA TARDE EN RUTA",
  },
  {
    id: "block_primetime",
    timeSlot: "18:00 - 22:00",
    startHour: 18,
    endHour: 22,
    name: "Horario Estelar & Fiesta / Prime Time",
    subtitle: "El Regreso, Tendencias & DJs en Vivo",
    genres: ["Reggaetón", "Dance", "EDM", "Hip-Hop", "Rock/Pop en Español"],
    energyLevel: "Muy Alta",
    energyDescription: "Temas populares, remixes, sets de DJs o interacción en vivo.",
    bpmInfo: "124-135 BPM",
    period: "primetime",
    tagColor: "#CCFF00",
    badge: "🔥 HORARIO ESTELAR & FIESTA",
  },
  {
    id: "block_chill_night",
    timeSlot: "22:00 - 01:00",
    startHour: 22,
    endHour: 1, // 01:00 AM next day
    name: "Desconexión Nocturna / Chill & Night",
    subtitle: "Relax, Estudio & Baladas Suaves",
    genres: ["Lo-Fi Hip Hop", "R&B", "Acoustic Pop", "Synth-Pop", "Smooth Jazz", "Baladas"],
    energyLevel: "Baja",
    energyDescription: "Bajan los decibelios y las pulsaciones; ideal para estudiar o descansar.",
    bpmInfo: "70-95 BPM",
    period: "night",
    tagColor: "#D6BCFA",
    badge: "🌙 DESCONEXIÓN NOCTURNA",
  },
  {
    id: "block_autodj",
    timeSlot: "01:00 - 06:00",
    startHour: 1,
    endHour: 6,
    name: "Madrugada Estelar / Auto-DJ",
    subtitle: "Música Continua 24/7 sin Interrupciones",
    genres: ["Deep House", "Chillout", "Ambient", "Retro 80s/90s", "Lo-Fi"],
    energyLevel: "Automatizada",
    energyDescription: "Playlists continuas sin pausas largas ni locuciones estruendosas.",
    bpmInfo: "Continuo & Fluido",
    period: "autodj",
    tagColor: "#CBD5E0",
    badge: "🤖 MADRUGADA ESTELAR",
  },
];

export const DAYS_OF_WEEK: DayOfWeekItem[] = [
  { id: "lun", label: "LUNES", short: "LUN", dayIndex: 1, isWeekend: false },
  { id: "mar", label: "MARTES", short: "MAR", dayIndex: 2, isWeekend: false },
  { id: "mie", label: "MIÉRCOLES", short: "MIÉ", dayIndex: 3, isWeekend: false },
  { id: "jue", label: "JUEVES", short: "JUE", dayIndex: 4, isWeekend: false },
  { id: "vie", label: "VIERNES", short: "VIE", dayIndex: 5, isWeekend: false, hasSpecialShows: true },
  { id: "sab", label: "SÁBADO", short: "SÁB", dayIndex: 6, isWeekend: true, hasSpecialShows: true },
  { id: "dom", label: "DOMINGO", short: "DOM", dayIndex: 0, isWeekend: true, hasSpecialShows: true },
];
