import Ionicons from "@react-native-vector-icons/ionicons";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, Text, View } from "react-native";

import { BackupFile, backupSupported, deliverBackup, isStandalone, pickBackupFile, prepareBackup, restoreBackup, storageInfo } from "@/src/backup";
import { useToast } from "@/src/components/Toast";
import { KEYS } from "@/src/data/keys";
import { backupOverdue, useData } from "@/src/data/store";
import { makeStyles, useTheme } from "@/src/theme";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export function BackupSection() {
  const styles = useStyles();
  const { colors } = useTheme();
  const toast = useToast();
  const { players, callups, schemes, lastBackup, markBackup, reload } = useData();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<"prepare" | "share" | "import" | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [info, setInfo] = useState<{ usage: number | null; persisted: boolean | null }>({ usage: null, persisted: null });

  const refreshInfo = useCallback(() => {
    storageInfo().then(setInfo);
  }, []);
  useEffect(refreshInfo, [refreshInfo, players, callups, schemes]);

  if (!backupSupported) return null;

  const overdue = backupOverdue(lastBackup, players.length > 0);

  const onPrepare = async () => {
    setBusy("prepare");
    try {
      setFile(await prepareBackup());
    } catch {
      toast("Impossibile creare il backup", "error");
    } finally {
      setBusy(null);
    }
  };

  // Called straight from the tap: Safari needs the gesture to open the share sheet.
  const onShare = () => {
    if (!file) return;
    setBusy("share");
    deliverBackup(file)
      .then((how) => {
        markBackup();
        setFile(null);
        toast(how === "shared" ? "Backup pronto: salvalo in File o iCloud Drive" : "Backup scaricato");
      })
      .catch((e) => {
        if (e?.name !== "AbortError") toast("Condivisione non riuscita", "error");
      })
      .finally(() => setBusy(null));
  };

  const onPick = () => {
    pickBackupFile()
      .then((b) => b && setPending(b))
      .catch(() => toast("File di backup non valido", "error"));
  };

  const onConfirmImport = async () => {
    if (!pending) return;
    setBusy("import");
    try {
      await restoreBackup(pending);
      await reload();
      setPending(null);
      refreshInfo();
      toast("Dati ripristinati dal backup");
    } catch {
      toast("Ripristino non riuscito", "error");
    } finally {
      setBusy(null);
    }
  };

  const pendingPlayers = Array.isArray(pending?.data?.[KEYS.players]) ? (pending!.data[KEYS.players] as unknown[]).length : 0;
  const pendingCallups = Array.isArray(pending?.data?.[KEYS.callups]) ? (pending!.data[KEYS.callups] as unknown[]).length : 0;
  const standalone = isStandalone();

  return (
    <View testID="backup-section">
      {!standalone && (
        <>
          <Text style={styles.sectionTitle}>INSTALLA SULL&apos;IPHONE</Text>
          <View style={styles.card} testID="install-guide-card">
            <View style={styles.stepRow}>
              <View style={styles.step}><Text style={styles.stepText}>1</Text></View>
              <Text style={styles.stepLabel}>Apri questa pagina in Safari</Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.step}><Text style={styles.stepText}>2</Text></View>
              <Text style={styles.stepLabel}>
                Tocca <Ionicons name="share-outline" size={15} color={colors.brandSecondary} /> Condividi
              </Text>
            </View>
            <View style={styles.stepRow}>
              <View style={styles.step}><Text style={styles.stepText}>3</Text></View>
              <Text style={styles.stepLabel}>Scegli &quot;Aggiungi alla schermata Home&quot;</Text>
            </View>
            <Text style={styles.muted}>Così l&apos;app si apre a schermo intero, anche offline, e Safari conserva i dati in modo permanente.</Text>
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>BACKUP DEI DATI</Text>
      <View style={styles.card}>
        <View style={styles.localRow}>
          <Ionicons name="phone-portrait-outline" size={22} color={colors.brandPrimary} />
          <Text style={styles.localText}>
            I dati sono salvati solo su questo dispositivo. Nessun dato viene inviato a server o cloud.
          </Text>
        </View>

        {overdue && (
          <View style={styles.warnBox} testID="backup-overdue-warning">
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <Text style={styles.warnText}>
              {lastBackup ? "Ultimo backup più vecchio di 30 giorni." : "Non hai ancora fatto un backup."} Esportalo ora per non perdere i dati.
            </Text>
          </View>
        )}

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Ultimo backup</Text>
            <Text style={styles.statValue} testID="backup-last-date">{lastBackup ? fmtDate(lastBackup) : "Mai"}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Spazio usato</Text>
            <Text style={styles.statValue} testID="backup-storage-usage">
              {info.usage !== null ? `${(info.usage / 1024 / 1024).toFixed(1)} MB` : "—"}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Memoria permanente</Text>
            <Text style={styles.statValue} testID="backup-persisted">{info.persisted === null ? "—" : info.persisted ? "Sì" : standalone ? "No" : "Installa l'app"}</Text>
          </View>
        </View>

        {file ? (
          <Pressable style={[styles.primaryBtn, { backgroundColor: colors.success }]} onPress={onShare} disabled={busy === "share"} testID="backup-share-button">
            {busy === "share" ? (
              <ActivityIndicator color={colors.onSuccess} />
            ) : (
              <>
                <Ionicons name="share-outline" size={18} color={colors.onSuccess} />
                <Text style={styles.primaryText}>Salva file backup ({(file.size / 1024 / 1024).toFixed(1)} MB)</Text>
              </>
            )}
          </Pressable>
        ) : (
          <Pressable style={styles.primaryBtn} onPress={onPrepare} disabled={!!busy} testID="backup-export-button">
            {busy === "prepare" ? (
              <ActivityIndicator color={colors.onBrandPrimary} />
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={18} color={colors.onBrandPrimary} />
                <Text style={styles.primaryText}>Esporta backup</Text>
              </>
            )}
          </Pressable>
        )}
        <Pressable style={styles.secondaryBtn} onPress={onPick} disabled={!!busy} testID="backup-import-button">
          <Ionicons name="folder-open-outline" size={18} color={colors.brandSecondary} />
          <Text style={styles.secondaryText}>Importa backup</Text>
        </Pressable>
        <Text style={styles.muted}>
          Il backup contiene giocatori, foto, formazione, schemi, convocazioni e dati società. Salvalo in File, iCloud Drive, AirDrop o email.
        </Text>
      </View>

      <Modal visible={!!pending} transparent animationType="fade" onRequestClose={() => setPending(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog} testID="import-confirm-dialog">
            <Ionicons name="alert-circle" size={36} color={colors.warning} />
            <Text style={styles.dialogTitle}>Sostituire i dati attuali?</Text>
            <Text style={styles.dialogText}>
              Backup del {pending ? fmtDate(pending.exportedAt) : ""}: {pendingPlayers} giocatori, {pendingCallups} convocazioni, {Object.keys(pending?.photos ?? {}).length} foto.
            </Text>
            <Text style={styles.dialogText}>Tutti i dati ora presenti su questo dispositivo verranno sostituiti.</Text>
            <View style={styles.dialogRow}>
              <Pressable style={styles.ghostBtn} onPress={() => setPending(null)} disabled={busy === "import"} testID="import-cancel-button">
                <Text style={styles.ghostText}>Annulla</Text>
              </Pressable>
              <Pressable style={[styles.primaryBtn, styles.dangerBtn]} onPress={onConfirmImport} disabled={busy === "import"} testID="import-confirm-button">
                {busy === "import" ? <ActivityIndicator color={colors.onError} /> : <Text style={styles.primaryText}>Sostituisci dati</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  sectionTitle: { fontSize: 12, fontWeight: "800", color: c.brandSecondary, letterSpacing: 1, marginTop: 12, marginBottom: 8 },
  card: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: c.border, gap: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  step: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  stepText: { color: c.onBrandPrimary, fontWeight: "800" },
  stepLabel: { flex: 1, fontSize: 15, color: c.onSurface, fontWeight: "600" },
  muted: { fontSize: 12, color: c.muted },
  localRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  localText: { flex: 1, fontSize: 13, color: c.onSurfaceSecondary, fontWeight: "600" },
  warnBox: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: c.surfaceTertiary, borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: c.warning },
  warnText: { flex: 1, fontSize: 13, color: c.onSurfaceTertiary },
  stats: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, backgroundColor: c.surfaceTertiary, borderRadius: 12, padding: 10 },
  statLabel: { fontSize: 11, color: c.muted, fontWeight: "700" },
  statValue: { fontSize: 13, color: c.onSurface, fontWeight: "800", marginTop: 2 },
  primaryBtn: { height: 48, borderRadius: 999, backgroundColor: c.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingHorizontal: 16 },
  primaryText: { color: c.onBrandPrimary, fontWeight: "800", fontSize: 15 },
  dangerBtn: { backgroundColor: c.error },
  secondaryBtn: { height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: c.brandSecondary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  secondaryText: { color: c.brandSecondary, fontWeight: "800", fontSize: 15 },
  overlay: { flex: 1, backgroundColor: c.overlay, justifyContent: "center", padding: 24 },
  dialog: { backgroundColor: c.surfaceSecondary, borderRadius: 20, padding: 20, gap: 10, alignItems: "center" },
  dialogTitle: { fontSize: 19, fontWeight: "800", color: c.onSurface, textAlign: "center" },
  dialogText: { fontSize: 14, color: c.onSurfaceTertiary, textAlign: "center" },
  dialogRow: { flexDirection: "row", gap: 8, marginTop: 8, ...(Platform.OS === "web" ? {} : {}) },
  ghostBtn: { height: 48, paddingHorizontal: 16, justifyContent: "center" },
  ghostText: { color: c.muted, fontWeight: "700", fontSize: 15 },
}));
