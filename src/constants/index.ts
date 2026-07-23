import { Station, RadioProgram, PastBroadcast, Album, Song, Product } from "@/types";

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
    description: "Un programa bateristico donde JS entrara a las fauces del ritmo entre discos de todos los tiempos.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEwx7PRgZwc3Fq5lf-LteMcltfrm-d19hJSZ5AGRSGyOZ7oZxj7sHycotYD7EDmkliWOl0WXEO2kOzVE1mDXM00Uig4z44AZHZoxYfHKE8vfVxzFpkpIW7vdQFGA9piEEDHfoqNYJoOywV4f5QFWHZSs9EvvT3yt9zl_sb4tCcgjY-2PWAOBxxXp_gwAHJvuV6NbXax2Rk49MbXIaFBgKFcgNL9C9xFp8kH_h5qWJJ4GCWcqmJ2Dvb8-TQ9fpEZFNcUiYImzJUOQSH",
    isLiked: false,
    style: "ALL MUSIC",
  },
  {
    id: "neonpop",
    name: "El Espacio del Koyote Proximamente",
    frequency: "Viernes 9 PM",
    description: "El programa se trata de pedidos musicales, conversación con invitados.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHgkKkWI_L4cptOscww4Dqg9x_1l7Emt7I7f7cP8GxYKYJzFfwnp8agBIhRPcjZJzeTgH-zj8nOeiRn7iwvHmoEpiRlSp1Kjb5TTmrMRR_oAUbZKBCZY4iDX3OZoIVLWsBpfKMB4fbJ4WN66-s_w6SyWu1T0VwPmyENDkyz3VVWSRm2UBEuqa-pewg9z6FZLUb-gOuZUtWz13j1vBrHEHV2UoAfLcYLgMRYvBzFCKJ-fFwRueGTkM-KTLbprP3-qLFhpJIIjdgRMKg",
    isLiked: true,
    style: "PEDIDOS / INVITADOS /ALL MUSIC",
  },
  {
    id: "conversa_time",
    name: "Conversa Time",
    frequency: "Viernes 8 PM",
    description: "Magazine musical nocturno. Primer capítulo: microinformativo playlist y reportaje de noche bohemia en la Plaza San Martín.",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    isLiked: false,
    style: "MAGAZINE MUSICAL",
  },
  {
    id: "entre_discos",
    name: "Entre discos",
    frequency: "Sábados 5 PM",
    description: "Programa de los sábados sobre conversación de discos, puntuaciones a discografías y concursos.",
    imageUrl: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=600&q=80",
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
    genre: "ALL MUSIC",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEwx7PRgZwc3Fq5lf-LteMcltfrm-d19hJSZ5AGRSGyOZ7oZxj7sHycotYD7EDmkliWOl0WXEO2kOzVE1mDXM00Uig4z44AZHZoxYfHKE8vfVxzFpkpIW7vdQFGA9piEEDHfoqNYJoOywV4f5QFWHZSs9EvvT3yt9zl_sb4tCcgjY-2PWAOBxxXp_gwAHJvuV6NbXax2Rk49MbXIaFBgKFcgNL9C9xFp8kH_h5qWJJ4GCWcqmJ2Dvb8-TQ9fpEZFNcUiYImzJUOQSH",
    description: "Un programa bateristico donde JS entrara a las fauces del ritmo entre discos de todos los tiempos.",
  },
  {
    id: "neonpop",
    title: "El Espacio del Koyote Proximamente",
    host: "El Koyote",
    timeSlot: "VIERNES 21:00 - 22:00 (9 PM)",
    genre: "PEDIDOS / INVITADOS / ALL MUSIC",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHgkKkWI_L4cptOscww4Dqg9x_1l7Emt7I7f7cP8GxYKYJzFfwnp8agBIhRPcjZJzeTgH-zj8nOeiRn7iwvHmoEpiRlSp1Kjb5TTmrMRR_oAUbZKBCZY4iDX3OZoIVLWsBpfKMB4fbJ4WN66-s_w6SyWu1T0VwPmyENDkyz3VVWSRm2UBEuqa-pewg9z6FZLUb-gOuZUtWz13j1vBrHEHV2UoAfLcYLgMRYvBzFCKJ-fFwRueGTkM-KTLbprP3-qLFhpJIIjdgRMKg",
    description: "El programa se trata de pedidos musicales, conversación con invitados.",
  },
  {
    id: "conversa_time",
    title: "Conversa Time",
    host: "Nicoll",
    timeSlot: "VIERNES 20:00 - 21:00 (8 PM - 9 PM)",
    genre: "MAGAZINE MUSICAL",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    description: "Magazine musical nocturno. Primer capítulo: microinformativo playlist y reportaje de noche bohemia en la Plaza San Martín.",
  },
  {
    id: "entre_discos",
    title: "Entre discos",
    host: "Marx, Kenny y Anthony",
    timeSlot: "SÁBADOS 17:00 - 18:30 (5 PM - 6:30 PM)",
    genre: "CONVERSACIÓN / DISCOS",
    imageUrl: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=600&q=80",
    description: "Programa de los sábados de 5 a 6:30 PM sobre conversación de discos, puntuaciones a discografías y concursos.",
  },
];

export const INITIAL_PAST_BROADCASTS: PastBroadcast[] = [
  { id: "hits_beats_1", programId: "subterraneo", title: "Hits and Beats Vol. 1", date: "Hace 2 días", duration: "01:00:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "koyote_1", programId: "neonpop", title: "El Espacio del Koyote: Intro", date: "Hace 1 semana", duration: "01:00:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "conversa_time_1", programId: "conversa_time", title: "Conversa Time Cap. 1: Noche Bohemia Plaza San Martín", date: "Próximamente", duration: "01:00:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "entre_discos_1", programId: "entre_discos", title: "Entre Discos Cap. 1: Especial Discografías y Concursos", date: "Próximamente", duration: "01:30:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: "conversa_time_album",
    name: "Conversa Time Sessions",
    artist: "Nicoll",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    releaseYear: "2026",
    genre: "Magazine Musical",
  },
  {
    id: "entre_discos_album",
    name: "Entre Discos Vol. 1",
    artist: "Marx, Kenny y Anthony",
    imageUrl: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=600&q=80",
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
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
    streamUrl: DEFAULT_STREAM,
    isFavorite: true,
    durationSeconds: 3600,
  },
  {
    id: "entre_discos_ep1",
    title: "Entre Discos: Reseñas, Puntuación de Discografías y Concursos",
    artist: "Marx, Kenny y Anthony",
    albumName: "Entre Discos Vol. 1",
    imageUrl: "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=600&q=80",
    streamUrl: DEFAULT_STREAM,
    isFavorite: true,
    durationSeconds: 5400,
  },
  {
    id: "hits_beats_session",
    title: "Hits and Beats: Especial Fauces del Ritmo",
    artist: "JS",
    albumName: "Hits and Beats",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
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
    name: "POLO CLÁSICO DOBLE C",
    price: "$25.00",
    imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
    rotation: -2,
    description: "¡EL CLÁSICO INMORTAL DE LA RADIO! Algodón pesado de 240g curtido para aguantar pogos salvajes y el uso diario. Estampado a mano en serigrafía pura con tinta de alta densidad. Llévalo y demuestra que sintonizas la única radio libre.",
    colors: ["NEGRO CARBON", "CREMA FANZINE", "LIMA PUNK"],
    sizes: ["S", "M", "L", "XL"],
    variantImages: {
      "NEGRO CARBON": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80",
      "CREMA FANZINE": "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=80",
      "LIMA PUNK": "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=600&q=80",
    },
    badge: "🔥 MÁS BUSCADO",
    isFeatured: true,
  },
  {
    id: "2",
    name: "POLERA UNDERGROUND",
    price: "$45.00",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&q=80",
    rotation: 3,
    description: "¡PUNK DE INVIERNO! Hoodie de felpa pesada ultra premium con capucha ajustable. Estampado con collage fanzine gigante en la espalda que detona rebeldía. Hecho en tiraje ultra limitado. No te quedes afuera en el frío.",
    colors: ["NEGRO CARBON", "ROJO CYBER"],
    sizes: ["M", "L", "XL"],
    variantImages: {
      "NEGRO CARBON": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80",
      "ROJO CYBER": "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&q=80",
    },
    badge: "⚡ EDICIÓN LIMITADA",
  },
  {
    id: "3",
    name: "SHORTS DE VERANO",
    price: "$30.00",
    imageUrl: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&q=80",
    rotation: -1,
    description: "¡COMODIDAD ANTIRASGADURAS! Shorts de gabardina ripstop ultra-resistentes para tus sesiones de skate o festivales bajo el sol. Con bolsillos utilitarios reforzados para guardar tus casetes.",
    colors: ["CARBON GRIS", "LIMA PUNK"],
    sizes: ["S", "M", "L"],
    variantImages: {
      "CARBON GRIS": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80",
      "LIMA PUNK": "https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?w=600&q=80",
    },
    badge: "🌟 NUEVO INGRESO",
  },
  {
    id: "4",
    name: "STICKER PACK RADIO",
    price: "$5.00",
    imageUrl: "https://images.unsplash.com/photo-1582298538104-fe2e74c878f1?w=500&q=80",
    rotation: 2,
    description: "¡DECORA TU MUNDO CON ACTITUD! Pack de 6 calcomanías de vinilo mate premium troqueladas de alta adherencia. Aguantan lluvias, sol e incluso el raspón del skate. Diseños fanzine auténticos de la radio.",
    colors: ["EDICIÓN LIMITADA"],
    sizes: ["PACK ÚNICO"],
    variantImages: {
      "EDICIÓN LIMITADA": "https://images.unsplash.com/photo-1582298538104-fe2e74c878f1?w=600&q=80",
    },
    badge: "⭐ IMPRESCINDIBLE",
  },
];
