import { useState, useEffect, useMemo } from "react";
import { MUSIC_SCHEDULE_BLOCKS, DAYS_OF_WEEK } from "@/constants";
import { MusicScheduleBlock, HourlyMusicItem, SpecialProgramSchedule } from "@/types";

export type ScheduleViewMode = "grid" | "list";

export interface EnergyBadgeInfo {
  bg: string;
  color: string;
  label: string;
}

export const useSchedule = () => {
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  // Current time states
  const [currentHour, setCurrentHour] = useState<number>(() => new Date().getHours());
  const [currentMinute, setCurrentMinute] = useState<number>(() => new Date().getMinutes());
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(() => new Date().getDay());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setCurrentMinute(now.getMinutes());
      setCurrentDayIndex(now.getDay());
    };
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  const isBlockActiveNow = (block: MusicScheduleBlock) => {
    if (block.startHour > block.endHour) {
      return currentHour >= block.startHour || currentHour < block.endHour;
    }
    return currentHour >= block.startHour && currentHour < block.endHour;
  };

  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return MUSIC_SCHEDULE_BLOCKS;
    const q = searchQuery.toLowerCase().trim();
    return MUSIC_SCHEDULE_BLOCKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.timeSlot.toLowerCase().includes(q) ||
        b.energyLevel.toLowerCase().includes(q) ||
        b.energyDescription.toLowerCase().includes(q) ||
        b.genres.some((g) => g.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  // Special programs schedule mapping for Friday, Saturday & Sunday
  const getSpecialProgramsForSlot = (timeSlotId: string, dayId: string): SpecialProgramSchedule[] | null => {
    if (dayId === "vie") {
      if (timeSlotId === "block_primetime") {
        return [
          {
            id: "conversa_time",
            title: "Conversa Time",
            host: "Nicoll",
            timeText: "20:00 - 21:00",
            genre: "Magazine Musical",
            isLiveRightNow: currentDayIndex === 5 && currentHour >= 20 && currentHour < 21,
          },
          {
            id: "l_mental",
            title: "L-Mental",
            host: "La Seka",
            timeText: "21:00 - 22:00",
            genre: "Misterio / Rock, Reggae & Ska",
            isLiveRightNow: currentDayIndex === 5 && currentHour >= 21 && currentHour < 22,
          },
        ];
      }
      if (timeSlotId === "block_chill_night") {
        return [
          {
            id: "subterraneo",
            title: "Hits and Beats",
            host: "JS",
            timeText: "23:00 - 00:00",
            genre: "All Music / Baterías",
            isLiveRightNow: currentDayIndex === 5 && currentHour >= 23,
          },
        ];
      }
    }

    if (dayId === "sab") {
      if (timeSlotId === "block_afternoon") {
        return [
          {
            id: "lado_c",
            title: "Lado C",
            host: "Marx y Anthony",
            timeText: "17:00 - 18:30",
            genre: "Discos / Concursos",
            isLiveRightNow:
              currentDayIndex === 6 &&
              (currentHour === 17 || (currentHour === 18 && currentMinute <= 30)),
          },
        ];
      }
    }

    if (dayId === "dom") {
      if (timeSlotId === "block_primetime" || timeSlotId === "block_afternoon") {
        return [
          {
            id: "zona_anime",
            title: "Zona Anime & J-Music",
            host: "Especial Otaku",
            timeText: "16:00 - 20:00",
            genre: "Anime Openings, J-Rock, Vocaloid, J-Pop & OSTs",
            isLiveRightNow: currentDayIndex === 0 && currentHour >= 16 && currentHour < 20,
          },
        ];
      }
    }

    return null;
  };

  const getHourlyBreakdown = (blockId: string, dayId: string): HourlyMusicItem[] => {
    switch (blockId) {
      case "block_morning":
        return [
          {
            timeText: "06:00 - 07:00",
            title: "Despertar Pop & Latipop",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Pop Actual, Latipop (110-118 BPM)",
            description: "Canciones alegres y motivadoras para iniciar la mañana con buena onda.",
            badgeText: "☀️ ARRANQUE",
          },
          {
            timeText: "07:00 - 08:00",
            title: "Upbeat Hits & Tendencias",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Upbeat Hits, Pop Comercial (120-128 BPM)",
            description: "El peak matutino de ritmo y energía para salir a la calle.",
            badgeText: "⚡ RITMO",
          },
          {
            timeText: "08:00 - 09:00",
            title: "Reggaetón Comercial & Éxitos de Cabina",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Reggaetón comercial, Latin Pop (115-125 BPM)",
            description: "Éxitos radiales y ritmos urbanos para entrar en calor.",
            badgeText: "🔥 HITS",
          },
        ];

      case "block_workday":
        return [
          {
            timeText: "09:00 - 10:30",
            title: "Pop/Rock 2000s & Clásicos del Milenio",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Pop/Rock 2000s, Soft Pop (95-110 BPM)",
            description: "Ritmo constante y nostálgico ideal para la primera mitad de la jornada laboral.",
            badgeText: "💼 LABORAL",
          },
          {
            timeText: "10:30 - 12:00",
            title: "Indie & Funk Soft en Modo Enfoque",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Indie Rock, Funk Soft, Grooves (90-105 BPM)",
            description: "Vibras indie y funk suave sin cortes bruscos para mantener la concentración.",
            badgeText: "🎧 ENFOQUE",
          },
          {
            timeText: "12:00 - 13:00",
            title: "Lo-Fi Beats & Transición al Almuerzo",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Lo-Fi Beat, Soft Pop, Chill Beats (90-100 BPM)",
            description: "Texturas lo-fi y armonías relajantes para cerrar la mañana.",
            badgeText: "☕ CHILL",
          },
        ];

      case "block_lunch":
        return [
          {
            timeText: "13:00 - 14:00",
            title: "Almuerzo Criollo, Salsa & Ritmo Latino",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Cumbia, Salsa Clásica, Pop Latino (85-100 BPM)",
            description: "Música alegre y sabrosa de fondo para acompañar la hora del almuerzo.",
            badgeText: "🍽️ ALMUERZO",
          },
          {
            timeText: "14:00 - 15:00",
            title: "Sobremesa: Baladas Modernas & Reggae",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Baladas Modernas, Reggae Suave, Latin Soul (85-95 BPM)",
            description: "Ambiente cálido y amigable para el café y la sobremesa de la tarde.",
            badgeText: "🍹 SOBREMESA",
          },
        ];

      case "block_afternoon": {
        const items: HourlyMusicItem[] = [
          {
            timeText: "15:00 - 16:30",
            title: "Urban Pop & Electropop Boost",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Urban Pop, Electropop (115-125 BPM)",
            description: "Subidón de energía para vencer el cansancio de media tarde.",
            badgeText: "⚡ IMPULSO",
          },
        ];

        if (dayId === "sab" || dayId === "all") {
          items.push({
            timeText: "17:00 - 18:30",
            title: "Lado C",
            daysText: "Todos los Sábados",
            genres: "Discos, Coleccionismo & Concursos de Vinilo",
            description: "Debate melómano, curiosidades discográficas y unboxing con Marx y Anthony.",
            host: "Marx y Anthony",
            isSpecialShow: true,
            badgeText: "🎙️ EN VIVO SÁB",
          });
        }

        if (dayId === "dom" || dayId === "all") {
          items.push({
            timeText: "16:00 - 18:00",
            title: "Zona Anime & J-Music (Parte I)",
            daysText: "Todos los Domingos",
            genres: "Anime Openings, J-Rock, Vocaloid & OSTs",
            description: "Especial temático otaku con los mejores temas de anime y rock japonés.",
            host: "Anthony",
            isSpecialShow: true,
            badgeText: "🎌 DOMINGO ANIME",
          });
        }

        if (dayId !== "sab" && dayId !== "dom") {
          items.push({
            timeText: "16:30 - 18:00",
            title: "Latin Hits & Synthwave en Ruta",
            daysText: "Lunes a Viernes",
            genres: "Latin Hits, Synthwave, Retro Vibes (120-130 BPM)",
            description: "Banda sonora urbana para el tráfico y el regreso a casa.",
            badgeText: "🚗 EN RUTA",
          });
        }

        return items;
      }

      case "block_primetime": {
        const items: HourlyMusicItem[] = [];

        if (dayId === "dom" || dayId === "all") {
          items.push({
            timeText: "18:00 - 20:00",
            title: "Zona Anime & J-Music (Parte II - Clásicos)",
            daysText: "Todos los Domingos",
            genres: "J-Pop, Openings Clásicos, OSTs",
            description: "Segunda parte del maratón dominical con clásicos y pedidos de oyentes.",
            host: "Anthony",
            isSpecialShow: true,
            badgeText: "🎌 DOMINGO ANIME",
          });
        } else {
          items.push({
            timeText: "18:00 - 20:00",
            title: "EDM, Dance & Rock/Pop en Español",
            daysText: "Lunes a Sábado",
            genres: "EDM, Dancefloor, Rock en Español (124-135 BPM)",
            description: "El peak de energía al terminar la jornada con las mejores mezclas radiales.",
            badgeText: "🔥 PRIME TIME",
          });
        }

        if (dayId === "vie" || dayId === "all") {
          items.push({
            timeText: "20:00 - 21:00",
            title: "Conversa Time",
            daysText: "Todos los Viernes",
            genres: "Magazine Musical & Entrevistas en Cabina",
            description: "Entrevistas en cabina a bandas locales y movida bohemia con Nicoll.",
            host: "Nicoll",
            isSpecialShow: true,
            badgeText: "🎙️ EN VIVO VIE",
          });
          items.push({
            timeText: "21:00 - 22:00",
            title: "L-Mental: La Mente Detrás de la Historia",
            daysText: "Todos los Viernes",
            genres: "Misterio, Casos Psicológicos, Zona Esotérica, Rock, Reggae & Ska",
            description: "Historias intrigantes, análisis psicológico y Zona Esotérica con La Seka al ritmo de Rock, Reggae y Ska.",
            host: "La Seka",
            isSpecialShow: true,
            badgeText: "🎙️ EN VIVO VIE",
          });
        } else {
          items.push({
            timeText: "20:00 - 22:00",
            title: "Reggaetón, Trap & Tendencias Urbanas",
            daysText: "Lunes a Jueves / Sábados / Domingos",
            genres: "Reggaetón, Trap, Hip-Hop, Dance Remixes (120-130 BPM)",
            description: "Sesión caliente de ritmos urbanos y remixes exclusivos de DJ.",
            badgeText: "🎉 FIESTA",
          });
        }

        return items;
      }

      case "block_chill_night": {
        const items: HourlyMusicItem[] = [
          {
            timeText: "22:00 - 23:00",
            title: "Lo-Fi Hip Hop & R&B de Medianoche",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Lo-Fi Hip Hop, R&B, Neo-Soul (75-90 BPM)",
            description: "Descenso de pulsaciones para relajar el cuerpo y la mente.",
            badgeText: "🌙 NOCHE",
          },
        ];

        if (dayId === "vie" || dayId === "all") {
          items.push({
            timeText: "23:00 - 00:00",
            title: "Hits and Beats",
            daysText: "Todos los Viernes",
            genres: "All Music, Baterías & Grooves Legendarios",
            description: "Análisis y viaje sonoro por bateristas y grooves históricos con JS.",
            host: "JS",
            isSpecialShow: true,
            badgeText: "🎙️ EN VIVO VIE",
          });
        } else {
          items.push({
            timeText: "23:00 - 00:00",
            title: "Acoustic Pop & Synth-Pop Nocturno",
            daysText: "Lunes a Jueves / Sábados / Domingos",
            genres: "Acoustic Pop, Synth-Pop, Dream Pop (70-85 BPM)",
            description: "Baladas acústicas y sintetizadores atmosféricos de medianoche.",
            badgeText: "✨ SUAVE",
          });
        }

        items.push({
          timeText: "00:00 - 01:00",
          title: "Smooth Jazz & Baladas de Desconexión",
          daysText: "Lunes a Domingo (7 Días)",
          genres: "Smooth Jazz, Baladas, Ambient Soft (70-80 BPM)",
          description: "La hora más tranquila del dial para conciliar el descanso.",
          badgeText: "🛌 DESCANSO",
        });

        return items;
      }

      case "block_autodj":
        return [
          {
            timeText: "01:00 - 03:30",
            title: "Deep House & Chillout Non-Stop",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Deep House, Chillout, Ambient Flow (110-120 BPM)",
            description: "Programación automatizada 24/7 sin pausas ni interrupciones comerciales.",
            badgeText: "🤖 AUTO-DJ",
          },
          {
            timeText: "03:30 - 06:00",
            title: "Retro 80s/90s & Madrugada Lo-Fi",
            daysText: "Lunes a Domingo (7 Días)",
            genres: "Retro 80s/90s, Synthwave, Lo-Fi Nocturno (90-110 BPM)",
            description: "Gemas nostálgicas para los noctámbulos y trabajadores de turno noche.",
            badgeText: "📻 24/7",
          },
        ];

      default:
        return [];
    }
  };

  return {
    selectedDayFilter,
    setSelectedDayFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    currentHour,
    currentMinute,
    currentDayIndex,
    daysOfWeek: DAYS_OF_WEEK,
    filteredBlocks,
    isBlockActiveNow,
    getSpecialProgramsForSlot,
    getHourlyBreakdown,
  };
};
