export type DrumRowKey = "kick" | "snare" | "hihat" | "clap" | "bass808";

export interface StoredSampleData {
  name: string;
  arrayBuffer: ArrayBuffer;
}

export interface SessionBeatState {
  pattern: Record<DrumRowKey, boolean[]>;
  drumVolumes: Record<DrumRowKey, number>;
  drumMuted: Record<DrumRowKey, boolean>;
  bassFreq: number;
  sidechainPump: boolean;
  beatEnabled: boolean;
}

export interface SavedDrumKit {
  id: string;
  name: string;
  updatedAt: number;
  state: SessionBeatState;
  sampleNames: Partial<Record<DrumRowKey, string>>;
}

const DB_NAME = "doble_c_drumkit_db";
const DB_VERSION = 1;
const STORE_NAME = "samples";
const SESSION_KEY = "doble_c_master_session_v1";
const KITS_KEY = "doble_c_drum_kits_v1";

const DRUM_KEYS: DrumRowKey[] = ["kick", "snare", "hihat", "clap", "bass808"];

function openDrumDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB no disponible"));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Error abriendo IndexedDB"));
  });
}

async function putSampleInDb(key: string, data: StoredSampleData): Promise<void> {
  const db = await openDrumDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ name: data.name, arrayBuffer: data.arrayBuffer.slice(0) }, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Error guardando sample en IndexedDB"));
    };
  });
}

async function getSampleFromDb(key: string): Promise<StoredSampleData | null> {
  const db = await openDrumDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => {
      db.close();
      const val = req.result as { name?: string; arrayBuffer?: ArrayBuffer } | undefined;
      if (val && typeof val.name === "string" && val.arrayBuffer instanceof ArrayBuffer) {
        resolve({ name: val.name, arrayBuffer: val.arrayBuffer.slice(0) });
      } else {
        resolve(null);
      }
    };
    req.onerror = () => {
      db.close();
      reject(req.error || new Error("Error leyendo sample de IndexedDB"));
    };
  });
}

async function deleteSampleFromDb(key: string): Promise<void> {
  const db = await openDrumDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error || new Error("Error eliminando sample de IndexedDB"));
    };
  });
}

export async function saveActiveDrumSample(
  row: DrumRowKey,
  name: string,
  arrayBuffer: ArrayBuffer
): Promise<void> {
  try {
    await putSampleInDb(`active:${row}`, { name, arrayBuffer });
  } catch {
    // Ignorar errores de almacenamiento si el navegador restringe IndexedDB
  }
}

export async function deleteActiveDrumSample(row: DrumRowKey): Promise<void> {
  try {
    await deleteSampleFromDb(`active:${row}`);
  } catch {
    // Ignorar
  }
}

export async function loadAllActiveDrumSamples(): Promise<
  Partial<Record<DrumRowKey, StoredSampleData>>
> {
  const result: Partial<Record<DrumRowKey, StoredSampleData>> = {};
  try {
    await Promise.all(
      DRUM_KEYS.map(async (row) => {
        const data = await getSampleFromDb(`active:${row}`);
        if (data) result[row] = data;
      })
    );
  } catch {
    // Ignorar
  }
  return result;
}

export function saveSessionBeatState(state: SessionBeatState): void {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // Ignorar
  }
}

export function loadSessionBeatState(): SessionBeatState | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionBeatState;
    if (!parsed || !parsed.pattern || !parsed.drumVolumes) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function listSavedDrumKits(): SavedDrumKit[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(KITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedDrumKit[]) : [];
  } catch {
    return [];
  }
}

export async function saveNamedDrumKit(
  kitName: string,
  state: SessionBeatState,
  activeSamples: Partial<Record<DrumRowKey, StoredSampleData>>
): Promise<SavedDrumKit[]> {
  const cleanName = kitName.trim() || `Kit ${new Date().toLocaleTimeString()}`;
  const existing = listSavedDrumKits();
  const sameIndex = existing.findIndex(
    (k) => k.name.toLowerCase() === cleanName.toLowerCase()
  );
  const id =
    sameIndex >= 0
      ? existing[sameIndex].id
      : `kit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const sampleNames: Partial<Record<DrumRowKey, string>> = {};
  for (const row of DRUM_KEYS) {
    const sample = activeSamples[row];
    if (sample) {
      sampleNames[row] = sample.name;
      await putSampleInDb(`kit:${id}:${row}`, sample).catch(() => {});
    } else {
      await deleteSampleFromDb(`kit:${id}:${row}`).catch(() => {});
    }
  }

  const nextKit: SavedDrumKit = {
    id,
    name: cleanName,
    updatedAt: Date.now(),
    state: JSON.parse(JSON.stringify(state)) as SessionBeatState,
    sampleNames,
  };

  const updated =
    sameIndex >= 0
      ? existing.map((k, i) => (i === sameIndex ? nextKit : k))
      : [nextKit, ...existing];

  try {
    window.localStorage.setItem(KITS_KEY, JSON.stringify(updated));
  } catch {
    // Ignorar
  }
  return updated;
}

export async function loadNamedDrumKitSamples(
  kitId: string
): Promise<Partial<Record<DrumRowKey, StoredSampleData>>> {
  const result: Partial<Record<DrumRowKey, StoredSampleData>> = {};
  try {
    await Promise.all(
      DRUM_KEYS.map(async (row) => {
        const data = await getSampleFromDb(`kit:${kitId}:${row}`);
        if (data) {
          result[row] = data;
          await putSampleInDb(`active:${row}`, data).catch(() => {});
        } else {
          await deleteSampleFromDb(`active:${row}`).catch(() => {});
        }
      })
    );
  } catch {
    // Ignorar
  }
  return result;
}

export async function deleteNamedDrumKit(kitId: string): Promise<SavedDrumKit[]> {
  const existing = listSavedDrumKits();
  const updated = existing.filter((k) => k.id !== kitId);
  try {
    window.localStorage.setItem(KITS_KEY, JSON.stringify(updated));
  } catch {
    // Ignorar
  }
  await Promise.all(
    DRUM_KEYS.map((row) => deleteSampleFromDb(`kit:${kitId}:${row}`).catch(() => {}))
  );
  return updated;
}
