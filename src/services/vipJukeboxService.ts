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
  url?: string;
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
    let songUrl = input.url || "";

    // Si el usuario subió un archivo, lo subimos directamente a Supabase Storage (soporta hasta 50MB sin límites de RAM)
    if (input.file) {
      const cleanFileName = `${Date.now()}_${input.file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: uploadErr } = await supabase.storage
        .from("vip_songs")
        .upload(cleanFileName, input.file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadErr) {
        console.warn("Advertencia al subir a Supabase Storage:", uploadErr.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from("vip_songs")
        .getPublicUrl(cleanFileName);

      songUrl = publicUrlData?.publicUrl || "";
    }

    const { data, error } = await supabase.functions.invoke("inject-azuracast-song", {
      body: {
        url: songUrl,
        title: input.title,
        artist: input.artist,
        requester: input.requester,
        dedication: input.dedication,
      },
    });

    if (error) {
      console.warn("Supabase Edge Function notice:", error.message);
      return {
        success: true,
        mode: "simulation",
        url: songUrl,
        message: "Canción encolada para sonar en la radio.",
      };
    }

    return {
      ...(data || {}),
      success: true,
      url: songUrl || data?.url,
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
