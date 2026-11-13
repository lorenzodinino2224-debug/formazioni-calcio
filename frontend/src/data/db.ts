// Native key-value store (phone storage). Web uses db.web.ts (IndexedDB).
import { storage } from "@/src/utils/storage";

export async function initDb() {}

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem(key, null);
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function kvSet(key: string, value: unknown) {
  await storage.setItem(key, JSON.stringify(value));
}
