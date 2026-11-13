// Native build: backup is available in the web app (Safari) only.
export type BackupFile = {
  app: string;
  version: number;
  exportedAt: string;
  data: Record<string, unknown>;
  photos: Record<string, string>;
};

export const backupSupported = false;

export async function prepareBackup(): Promise<File> {
  throw new Error("unsupported");
}

export async function deliverBackup(_file: File): Promise<"shared" | "downloaded"> {
  throw new Error("unsupported");
}

export function pickBackupFile(): Promise<BackupFile | null> {
  return Promise.resolve(null);
}

export async function restoreBackup(_b: BackupFile) {}

export async function storageInfo(): Promise<{ usage: number | null; persisted: boolean | null }> {
  return { usage: null, persisted: null };
}

export function isStandalone() {
  return true;
}
