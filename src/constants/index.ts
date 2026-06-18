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
    name: "Subterraneo Rock",
    frequency: "99.1 FM",
    description: "Solo lo que las disqueras odian. 24/7 de distorsión pura.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEwx7PRgZwc3Fq5lf-LteMcltfrm-d19hJSZ5AGRSGyOZ7oZxj7sHycotYD7EDmkliWOl0WXEO2kOzVE1mDXM00Uig4z44AZHZoxYfHKE8vfVxzFpkpIW7vdQFGA9piEEDHfoqNYJoOywV4f5QFWHZSs9EvvT3yt9zl_sb4tCcgjY-2PWAOBxxXp_gwAHJvuV6NbXax2Rk49MbXIaFBgKFcgNL9C9xFp8kH_h5qWJJ4GCWcqmJ2Dvb8-TQ9fpEZFNcUiYImzJUOQSH",
    isLiked: false,
    style: "ROCK N' ROLL",
  },
  {
    id: "neonpop",
    name: "Neon Pop",
    frequency: "102.5 FM",
    description: "Burbujas, brillo y sintetizadores que te harán vibrar el cráneo.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHgkKkWI_L4cptOscww4Dqg9x_1l7Emt7I7f7cP8GxYKYJzFfwnp8agBIhRPcjZJzeTgH-zj8nOeiRn7iwvHmoEpiRlSp1Kjb5TTmrMRR_oAUbZKBCZY4iDX3OZoIVLWsBpfKMB4fbJ4WN66-s_w6SyWu1T0VwPmyENDkyz3VVWSRm2UBEuqa-pewg9z6FZLUb-gOuZUtWz13j1vBrHEHV2UoAfLcYLgMRYvBzFCKJ-fFwRueGTkM-KTLbprP3-qLFhpJIIjdgRMKg",
    isLiked: true,
    style: "POP TRASH",
  },
  {
    id: "berlin",
    name: "Berlin Brutal",
    frequency: "88.8 FM",
    description: "Ritmos industriales grabados en sótanos abandonados.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    isLiked: false,
    style: "TECHNO CORE",
  },
];

export const INITIAL_PROGRAMS: RadioProgram[] = [
  {
    id: "callejon",
    title: "El Callejón del Ritmo",
    host: "DJ Flaco",
    timeSlot: "SÁBADOS 22:00 - 00:00",
    genre: "HIP HOP UNDERGROUND",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAEwx7PRgZwc3Fq5lf-LteMcltfrm-d19hJSZ5AGRSGyOZ7oZxj7sHycotYD7EDmkliWOl0WXEO2kOzVE1mDXM00Uig4z44AZHZoxYfHKE8vfVxzFpkpIW7vdQFGA9piEEDHfoqNYJoOywV4f5QFWHZSs9EvvT3yt9zl_sb4tCcgjY-2PWAOBxxXp_gwAHJvuV6NbXax2Rk49MbXIaFBgKFcgNL9C9xFp8kH_h5qWJJ4GCWcqmJ2Dvb8-TQ9fpEZFNcUiYImzJUOQSH",
    description: "El callejón con los beats analógicos más crudos de la estación. Frecuencia real urbana.",
  },
  {
    id: "berlin_ind",
    title: "Berlín Industrial",
    host: "Eva Schatten",
    timeSlot: "VIERNES 23:00 - 02:00",
    genre: "HEAVY TECHNO CORE",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    description: "Sets directos grabados en sótanos oscuros y búnkeres abandonados. Distorsión maquinal.",
  },
  {
    id: "distorsion_punk",
    title: "Distorsión Punk",
    host: "Capitán Doble C",
    timeSlot: "SÁBADOS 20:00 - 22:00",
    genre: "ELECTRO PUNK / GARAGE",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
    description: "Espacio pirata con fanzine sonoro y los ritmos punk sintéticos más rebeldes.",
  },
  {
    id: "cosmico",
    title: "Sintético Cósmico",
    host: "Lyra Volt",
    timeSlot: "JUEVES 21:00 - 23:00",
    genre: "COSMIC AMBIENT",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHgkKkWI_L4cptOscww4Dqg9x_1l7Emt7I7f7cP8GxYKYJzFfwnp8agBIhRPcjZJzeTgH-zj8nOeiRn7iwvHmoEpiRlSp1Kjb5TTmrMRR_oAUbZKBCZY4iDX3OZoIVLWsBpfKMB4fbJ4WN66-s_w6SyWu1T0VwPmyENDkyz3VVWSRm2UBEuqa-pewg9z6FZLUb-gOuZUtWz13j1vBrHEHV2UoAfLcYLgMRYvBzFCKJ-fFwRueGTkM-KTLbprP3-qLFhpJIIjdgRMKg",
    description: "Viaje mental guiado por sintetizadores y ondas analógicas espaciales.",
  },
];

export const INITIAL_PAST_BROADCASTS: PastBroadcast[] = [
  { id: "callejon_1", programId: "callejon", title: "El Callejón: Beats de Asfalto", date: "Ayer", duration: "01:24:10", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "callejon_2", programId: "callejon", title: "El Callejón: Scratching analógico", date: "Hace 3 días", duration: "01:10:45", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: "berlin_1", programId: "berlin_ind", title: "Berlín Ind: Búnker Subterráneo", date: "Hace 2 días", duration: "01:45:00", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: "berlin_2", programId: "berlin_ind", title: "Berlín Ind: Ruido Industrial", date: "Hace 5 days", duration: "01:30:15", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: "punk_1", programId: "distorsion_punk", title: "Punk: Fanzine Sonoro", date: "Hace 4 días", duration: "00:58:30", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: "cosmico_1", programId: "cosmico", title: "Cósmico: Sintetizadores del Vacío", date: "Hace 1 semana", duration: "02:00:15", audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
];

export const INITIAL_ALBUMS: Album[] = [
  {
    id: "berlin_set",
    name: "Berlín Underground",
    artist: "Schatten DJ",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    releaseYear: "2025",
    genre: "Industrial Techno",
  },
  {
    id: "fanzine_4",
    name: "Fanzine Vol. 4",
    artist: "La Banda Rebel",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
    releaseYear: "2026",
    genre: "Electro Punk",
  },
];

export const INITIAL_SONGS: Song[] = [
  {
    id: "heartbeat",
    title: "Cybernetic Heartbeat",
    artist: "Schatten DJ",
    albumName: "Berlín Underground",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    streamUrl: "https://stream.zeno.fm/4sqc41bg84zuv",
    isFavorite: true,
    durationSeconds: 184,
  },
  {
    id: "reverb",
    title: "Rhythm & Reverb",
    artist: "La Banda Rebel",
    albumName: "Fanzine Vol. 4",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDapmQW3vhLP9WO0dJXf731iBQP4L3vryyue8qjAHbCCdhZx42hiiWA6GcJKGLpebk7kEW0UuBIXJBoJ7Gd69h_p_gQU8gFIBBJJ5slsyjibwjdml7p2PlIyNc6WtPMe2et-yhWUwWor8PnILszsb7shglb9mqqyBe3cZ6J2QVn3HEuvjR3ulGpfmvlp1AxMNeDiKyFm0JMnrTTnJj5uRvPH5wr6wg0RIkqJ5t9-rdqEHB7C1vDmpnhx_6SIT3Ta-gWEMigNGCQk9pR",
    streamUrl: "https://stream.zeno.fm/4sqc41bg84zuv",
    isFavorite: false,
    durationSeconds: 212,
  },
  {
    id: "acid_dance",
    title: "Neon Acid Dance",
    artist: "Schatten DJ",
    albumName: "Berlín Underground",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDP5uqy10MAsI_x_MDmv3GUkMl0tbrhB4Ec956sMPCsxdGlc08vXZjcHtzIALHzom5LlwJFu9uaZyI4MDwKrnpzWl-t9Og2VRWKuJqEMWxwOSjXF0jStgRCxict6yaAbmMtaUC_Yh0c_FRU4i9SBx6FiBBN_-QB_f5kAALQEsGI9a7aG9md2Iuugg2BWCVDTSGKaAhJzV7uXZYOlff2WNDjpjVK9XCYM-CIV_zDTNGZiYHu5M7u7L4T6FS2AYz3h5EcCYnBy7m9tI2m",
    streamUrl: "https://stream.zeno.fm/4sqc41bg84zuv",
    isFavorite: false,
    durationSeconds: 156,
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
