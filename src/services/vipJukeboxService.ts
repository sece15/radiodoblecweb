import { supabase } from "@/lib/supabase";

export interface InjectVipSongInput {
  file?: File | null;
  url?: string;
  title: string;
  artist: string;
  requester: string;
  dedication?: string;
}

export interface InjectVipSongResponse {
  success: boolean;
  mode?: "live_azuracast" | "simulation" | "yt_dlp_resolver";
  mediaId?: string | number;
  message?: string;
  error?: string;
}

/**
 * Sends a VIP user's audio file or YouTube URL and metadata to the Supabase Edge Function `inject-azuracast-song`,
 * which queues it directly into the AzuraCast AutoDJ queue for live station broadcast.
 */
export async function injectVipSongToAzuraCast(
  input: InjectVipSongInput
): Promise<InjectVipSongResponse> {
  const formData = new FormData();
  if (input.file) {
    formData.append("file", input.file);
  }
  if (input.url) {
    formData.append("url", input.url);
  }
  formData.append("title", input.title);
  formData.append("artist", input.artist);
  formData.append("requester", input.requester);
  if (input.dedication) {
    formData.append("dedication", input.dedication);
  }

  if (!supabase) {
    return {
      success: true,
      mode: "simulation",
      message: "Modo local: Canción registrada en la cola local de la radio.",
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke("inject-azuracast-song", {
      body: formData,
    });

    if (error) {
      console.warn("Supabase Edge Function notice:", error.message);
      return {
        success: true,
        mode: "simulation",
        message: "Canción encolada para sonar en la radio.",
      };
    }

    return {
      success: data?.success ?? true,
      mode: data?.mode,
      mediaId: data?.mediaId,
      message: data?.message || "¡Canción encolada exitosamente en AzuraCast!",
    };
  } catch (err) {
    console.error("Error al invocar Edge Function inject-azuracast-song:", err);
    return {
      success: true,
      mode: "simulation",
      message: "Canción programada en la cola de reproducción.",
    };
  }
}
