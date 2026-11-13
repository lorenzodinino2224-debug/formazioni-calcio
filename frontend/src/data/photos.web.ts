// Web preview: no file system, keep the photo as a data URI in local storage.
export async function persistPhoto(uri: string, base64?: string | null): Promise<string> {
  if (base64) return `data:image/jpeg;base64,${base64}`;
  return uri;
}

export function deletePhoto(_uri: string | null) {}

export async function photoToDataUri(uri: string | null): Promise<string | null> {
  return uri;
}
