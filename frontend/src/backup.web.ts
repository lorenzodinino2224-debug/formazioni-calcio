// Web backup: one JSON file with all team data + all photos (as data URIs).
// The file is saved by the user via the iPhone share sheet (Files, iCloud Drive, AirDrop, email).
import { blobToDataUri, dataUriToBlob, kvClearData, kvGet, kvSet, photoClear, photoGet, photoKeys, photoPut } from "./data/db.web";
import { DATA_KEYS } from "./data/keys";
import { clearPhotoCache } from "./data/photos.web";

export type BackupFile = {
  app: string;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
  photos: Record<string, string>;
};

const APP_ID = "spoltore-gestionale";
export const backupSupported = true;

export async function prepareBackup(): Promise<File> {
  const data: Record<string, unknown> = {};
  for (const k of DATA_KEYS) data[k] = await kvGet<unknown>(k, null);
  const photos: Record<string, string> = {};
  for (const id of await photoKeys()) {
    const blob = await photoGet(id);
    if (blob) photos[`idb:${id}`] = await blobToDataUri(blob);
  }
  const payload: BackupFile = { app: APP_ID, version: 1, exportedAt: new Date().toISOString(), data, photos };
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return new File([JSON.stringify(payload)], `spoltore-backup-${stamp}.json`, { type: "application/json" });
}

// Must be called directly from a tap (Safari requires a user gesture for sharing).
export async function deliverBackup(file: File): Promise<"shared" | "downloaded"> {
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    await nav.share({ files: [file], title: "Backup Spoltore" });
    return "shared";
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return "downloaded";
}

export function pickBackupFile(): Promise<BackupFile | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.style.display = "none";
    document.body.appendChild(input);
    input.onchange = async () => {
      const f = input.files?.[0];
      input.remove();
      if (!f) return resolve(null);
      try {
        const parsed = JSON.parse(await f.text()) as BackupFile;
        if (parsed.app !== APP_ID || typeof parsed.data !== "object") throw new Error("invalid");
        resolve(parsed);
      } catch (e) {
        reject(e);
      }
    };
    input.click();
  });
}

export async function restoreBackup(b: BackupFile) {
  await photoClear();
  clearPhotoCache();
  for (const [ref, uri] of Object.entries(b.photos || {})) {
    await photoPut(ref.replace(/^idb:/, ""), dataUriToBlob(uri));
  }
  await kvClearData();
  for (const k of DATA_KEYS) {
    if (b.data[k] !== undefined && b.data[k] !== null) await kvSet(k, b.data[k]);
  }
}

export async function storageInfo(): Promise<{ usage: number | null; persisted: boolean | null }> {
  try {
    const est = await navigator.storage?.estimate?.();
    const persisted = (await navigator.storage?.persisted?.()) ?? null;
    return { usage: est?.usage ?? null, persisted };
  } catch {
    return { usage: null, persisted: null };
  }
}

export function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}
