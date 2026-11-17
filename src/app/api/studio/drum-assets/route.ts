import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

type DrumRowKey = "kick" | "snare" | "hihat" | "clap" | "bass808";

interface DrumAssetItem {
  name: string;
  label: string;
  url: string;
}

const DRUM_KEYS: DrumRowKey[] = ["kick", "snare", "hihat", "clap", "bass808"];
const AUDIO_EXT_REGEX = /\.(wav|mp3|ogg|flac|m4a|aac)$/i;

function formatAssetLabel(filename: string): string {
  return filename
    .replace(AUDIO_EXT_REGEX, "")
    .replace(/[_-]+/g, " ")
    .trim();
}

export async function GET() {
  const baseDir = path.join(process.cwd(), "public", "assets", "drumkits");
  const assets: Record<DrumRowKey, DrumAssetItem[]> = {
    kick: [],
    snare: [],
    hihat: [],
    clap: [],
    bass808: [],
  };

  await Promise.all(
    DRUM_KEYS.map(async (row) => {
      const rowDir = path.join(baseDir, row);
      try {
        const entries = await fs.readdir(rowDir, { withFileTypes: true });
        assets[row] = entries
          .filter((entry) => entry.isFile() && AUDIO_EXT_REGEX.test(entry.name))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((entry) => ({
            name: entry.name,
            label: formatAssetLabel(entry.name),
            url: `/assets/drumkits/${row}/${encodeURIComponent(entry.name)}`,
          }));
      } catch {
        assets[row] = [];
      }
    })
  );

  return NextResponse.json({ assets });
}
