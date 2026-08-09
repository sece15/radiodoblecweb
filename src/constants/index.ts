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
    imageUrl: "/hitsandbeats.jpg",
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
    genre: "ALL MUSIC",
    imageUrl: "/hitsandbeats.jpg",
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
    imageUrl: "/conversatime.jpeg",
    description: "Magazine musical nocturno. Primer capítulo: microinformativo playlist y reportaje de noche bohemia en la Plaza San Martín.",
  },
  {
    id: "lado_c",
    title: "Lado C",
    host: "Marx, Kenny y Anthony",
    timeSlot: "SÁBADOS 17:00 - 18:30 (5 PM - 6:30 PM)",
    genre: "CONVERSACIÓN / DISCOS",
    imageUrl: "/ladoc.jpeg",
    description: "Programa de los sábados de 5 a 6:30 PM sobre conversación de discos, puntuaciones a discografías y concursos.",
  },
];

export const INITIAL_PAST_BROADCASTS: PastBroadcast[] = [
  { id: "hits_beats_1", programId: "subterraneo", title: "Hits and Beats Vol. 1", date: "Hace 2 días", duration: "01:00:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "koyote_1", programId: "neonpop", title: "El Espacio del Koyote: Intro", date: "Hace 1 semana", duration: "01:00:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
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
    artist: "Marx, Kenny y Anthony",
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
    artist: "Marx, Kenny y Anthony",
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
