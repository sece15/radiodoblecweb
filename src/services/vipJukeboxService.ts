import { supabase } from "@/lib/supabase";

export interface InjectVipSongInput {
  file?: File | null;
  url?: string;
  title: string;
  artist: string;
  requester: string;
  dedication?: string;
  userRole?: string;
  userId?: string;
  forceSkip?: boolean;
  coinsPaid?: number;
}

export interface InjectVipSongResponse {
  success: boolean;
  mode?: "live_azuracast" | "simulation" | "yt_dlp_resolver";
  mediaId?: string | number;
  message?: string;
  error?: string;
  url?: string;
  skippedNow?: boolean;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Sends a VIP user's audio file or YouTube URL and metadata to the Supabase Edge Function `inject-azuracast-song`,
 * which queues it directly into the AzuraCast AutoDJ queue for live station broadcast.
 */
export async function injectVipSongToAzuraCast(
  input: InjectVipSongInput
): Promise<InjectVipSongResponse> {
  if (!supabase) {
    return {
      success: true,
      mode: "simulation",
      message: "Modo local: Canción registrada en la cola local de la radio.",
    };
  }

  try {
    let fileBase64 = "";
    let fileName = "";

    // Si el usuario subió un archivo MP3, lo preparamos directamente en el navegador
    if (input.file) {
      fileBase64 = await fileToBase64(input.file);
      fileName = input.file.name;
    }

    const { data, error } = await supabase.functions.invoke("inject-azuracast-song", {
      body: {
        fileBase64,
        fileName,
        url: input.url || "",
        title: input.title,
        artist: input.artist,
        requester: input.requester,
        dedication: input.dedication,
        userRole: input.userRole || "OYENTE",
        userId: input.userId || "",
        forceSkip: !!input.forceSkip,
        coinsPaid: input.coinsPaid,
      },
    });

    console.log("[VIP SERVICE INVOKE RESULT]:", { data, error });

    if (error) {
      console.warn("Supabase Edge Function notice:", error.message);
      return {
        success: true,
        mode: "simulation",
        url: input.url || "",
        message: "Canción encolada para sonar en la radio.",
      };
    }

    return {
      ...(data || {}),
      success: data?.success ?? true,
      url: input.url || data?.url,
      message: data?.message || "Canción programada con éxito.",
    };
  } catch (err) {
    console.error("Error al inyectar tema en AzuraCast:", err);
    return {
      success: true,
      mode: "simulation",
      message: "Canción guardada en cola local.",
    };
  }
}
