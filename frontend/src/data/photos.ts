// Native: keep player photos inside the app's private document folder on the phone.
import { File, Paths } from "expo-file-system";

export async function persistPhoto(uri: string, _base64?: string | null): Promise<string> {
  const src = new File(uri);
  const dest = new File(Paths.document, `player_${Date.now()}.jpg`);
  await src.copy(dest);
  return dest.uri;
}

export function deletePhoto(uri: string | null) {
  if (!uri) return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // ignore
  }
}

export async function photoToDataUri(uri: string | null): Promise<string | null> {
  if (!uri) return null;
  if (uri.startsWith("data:")) return uri;
  try {
    const b64 = await new File(uri).base64();
    return `data:image/jpeg;base64,${b64}`;
  } catch {
    return null;
  }
}
