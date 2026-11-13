// Web (Safari PWA): all data lives in IndexedDB on this device only.
// Store "kv" holds team data as structured objects, store "photos" holds compressed image Blobs.
import { storage } from "@/src/utils/storage";
import { DATA_KEYS, KEYS } from "./keys";

const DB_NAME = "spoltore-db";
const MIGRATED = "__migrated_v1";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos");
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function run<T>(store: "kv" | "photos", mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const req = fn(tx.objectStore(store));
    tx.oncomplete = () => resolve((req ? req.result : undefined) as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  try {
    const v = await run<T | undefined>("kv", "readonly", (s) => s.get(key));
    return v === undefined ? fallback : v;
  } catch {
    return fallback;
  }
}

export async function kvSet(key: string, value: unknown) {
  await run("kv", "readwrite", (s) => s.put(value, key));
}

export async function kvClearData() {
  await run("kv", "readwrite", (s) => {
    DATA_KEYS.forEach((k) => s.delete(k));
  });
}

export async function photoPut(id: string, blob: Blob) {
  await run("photos", "readwrite", (s) => s.put(blob, id));
}

export async function photoGet(id: string): Promise<Blob | undefined> {
  return run<Blob | undefined>("photos", "readonly", (s) => s.get(id));
}

export async function photoDelete(id: string) {
  await run("photos", "readwrite", (s) => s.delete(id));
}

export async function photoClear() {
  await run("photos", "readwrite", (s) => s.clear());
}

export async function photoKeys(): Promise<string[]> {
  const keys = await run<IDBValidKey[]>("photos", "readonly", (s) => s.getAllKeys());
  return keys.map(String);
}

export function dataUriToBlob(dataUri: string): Blob {
  const [head, b64] = dataUri.split(",");
  const mime = head.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// One-time move of data saved by the previous version (localStorage) into IndexedDB.
async function migrateFromLocalStorage() {
  const done = await kvGet<boolean>(MIGRATED, false);
  if (done) return;
  for (const key of DATA_KEYS.concat([KEYS.lastBackup])) {
    const raw = await storage.getItem(key, null);
    if (typeof raw !== "string") continue;
    let value: any;
    try {
      value = JSON.parse(raw);
    } catch {
      continue;
    }
    if (key === KEYS.players && Array.isArray(value)) {
      for (const p of value) {
        if (typeof p.photo === "string" && p.photo.startsWith("data:")) {
          const id = newId();
          await photoPut(id, dataUriToBlob(p.photo));
          p.photo = `idb:${id}`;
        }
      }
    }
    await kvSet(key, value);
  }
  await kvSet(MIGRATED, true);
  for (const key of DATA_KEYS) await storage.removeItem(key);
}

export async function initDb() {
  try {
    if (navigator.storage?.persist) {
      const already = await navigator.storage.persisted?.();
      if (!already) await navigator.storage.persist();
    }
  } catch {
    // not supported
  }
  await migrateFromLocalStorage();
}
