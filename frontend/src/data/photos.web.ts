// Web: photos are compressed and stored as Blobs in IndexedDB. Players keep a "idb:<id>" reference.
import { blobToDataUri, photoDelete, photoGet, photoPut } from "./db.web";

const cache = new Map<string, string>();
const MAX = 640;

async function compress(blob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, MAX / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.82));
    return out ?? blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const idOf = (ref: string) => ref.slice(4);

export async function persistPhoto(uri: string, _base64?: string | null): Promise<string> {
  const raw = await (await fetch(uri)).blob();
  const blob = await compress(raw);
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  await photoPut(id, blob);
  const ref = `idb:${id}`;
  cache.set(ref, URL.createObjectURL(blob));
  return ref;
}

export function deletePhoto(ref: string | null) {
  if (!ref || !ref.startsWith("idb:")) return;
  photoDelete(idOf(ref)).catch(() => {});
  const url = cache.get(ref);
  if (url) URL.revokeObjectURL(url);
  cache.delete(ref);
}

export function resolvePhotoUrl(ref: string | null | undefined): string | null {
  if (!ref) return null;
  if (ref.startsWith("idb:")) return cache.get(ref) ?? null;
  return ref;
}

export async function preloadPhotos(refs: (string | null)[]) {
  for (const ref of refs) {
    if (!ref || !ref.startsWith("idb:") || cache.has(ref)) continue;
    const blob = await photoGet(idOf(ref)).catch(() => undefined);
    if (blob) cache.set(ref, URL.createObjectURL(blob));
  }
}

export function clearPhotoCache() {
  cache.forEach((u) => URL.revokeObjectURL(u));
  cache.clear();
}

export async function photoToDataUri(ref: string | null): Promise<string | null> {
  if (!ref) return null;
  if (ref.startsWith("data:")) return ref;
  if (!ref.startsWith("idb:")) return null;
  const blob = await photoGet(idOf(ref)).catch(() => undefined);
  return blob ? blobToDataUri(blob) : null;
}
