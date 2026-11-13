import Ionicons from "@react-native-vector-icons/ionicons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/src/components/Avatar";
import { useToast } from "@/src/components/Toast";
import { persistPhoto } from "@/src/data/photos";
import { useData } from "@/src/data/store";
import { FEET, Player, ROLES, uid } from "@/src/data/types";
import { makeStyles, useTheme } from "@/src/theme";

export default function PlayerForm() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { playerById, savePlayer, deletePlayer } = useData();
  const existing = id !== "new" ? playerById(id) : undefined;

  const [p, setP] = useState<Player>(
    existing ?? { id: uid(), firstName: "", lastName: "", number: "", role: "CEN", photo: null, birthDate: "", foot: "Destro", notes: "" },
  );
  const [photoBusy, setPhotoBusy] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = (k: keyof Player, v: string) => setP((prev) => ({ ...prev, [k]: v }));

  const handleResult = async (res: ImagePicker.ImagePickerResult) => {
    if (res.canceled || !res.assets?.[0]) return;
    setPhotoBusy(true);
    try {
      const a = res.assets[0];
      const uri = await persistPhoto(a.uri, a.base64);
      setP((prev) => ({ ...prev, photo: uri }));
    } catch {
      toast("Impossibile salvare la foto", "error");
    } finally {
      setPhotoBusy(false);
    }
  };

  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  };

  const pickGallery = async () => handleResult(await ImagePicker.launchImageLibraryAsync(opts));

  const takePhoto = async () => {
    let perm = await ImagePicker.getCameraPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setCameraBlocked(!perm.canAskAgain);
      toast("Serve l'accesso alla fotocamera per scattare la foto", "error");
      return;
    }
    setCameraBlocked(false);
    handleResult(await ImagePicker.launchCameraAsync(opts));
  };

  const onSave = () => {
    if (!p.firstName.trim() || !p.lastName.trim()) {
      toast("Inserisci nome e cognome", "error");
      return;
    }
    savePlayer({ ...p, firstName: p.firstName.trim(), lastName: p.lastName.trim(), number: p.number.trim() });
    toast(existing ? "Giocatore aggiornato" : "Giocatore aggiunto");
    router.back();
  };

  const onDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deletePlayer(p.id);
    toast("Giocatore eliminato", "info");
    router.back();
  };

  const input = (k: keyof Player, label: string, extra: object = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={String(p[k] ?? "")}
        onChangeText={(v) => set(k, v)}
        placeholderTextColor={colors.muted}
        style={styles.input}
        testID={`player-${k}-input`}
        {...extra}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? 16 : insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.headBtn} testID="player-cancel-button">
          <Text style={styles.headBtnText}>Annulla</Text>
        </Pressable>
        <Text style={styles.headTitle}>{existing ? "Modifica giocatore" : "Nuovo giocatore"}</Text>
        <Pressable onPress={onSave} style={styles.headBtn} testID="player-save-button">
          <Text style={[styles.headBtnText, { fontWeight: "800" }]}>Salva</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView bottomOffset={24} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
        <View style={styles.photoRow}>
          <View>
            <Avatar player={p} size={104} />
            {photoBusy && (
              <View style={styles.photoBusy}>
                <ActivityIndicator color={colors.onBrandPrimary} />
              </View>
            )}
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Pressable style={styles.photoBtn} onPress={pickGallery} testID="player-photo-gallery-button">
              <Ionicons name="images-outline" size={18} color={colors.brandSecondary} />
              <Text style={styles.photoBtnText}>{Platform.OS === "web" ? "Scegli o scatta foto" : "Dalla galleria"}</Text>
            </Pressable>
            {Platform.OS !== "web" && (
              <Pressable style={styles.photoBtn} onPress={takePhoto} testID="player-photo-camera-button">
                <Ionicons name="camera-outline" size={18} color={colors.brandSecondary} />
                <Text style={styles.photoBtnText}>Scatta foto</Text>
              </Pressable>
            )}
            {p.photo ? (
              <Pressable onPress={() => setP({ ...p, photo: null })} testID="player-photo-remove-button" style={styles.linkBtn}>
                <Text style={styles.removeText}>Rimuovi foto</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
        {cameraBlocked && (
          <View style={styles.permBox} testID="camera-permission-blocked">
            <Text style={styles.permText}>Accesso alla fotocamera negato. Attivalo dalle impostazioni per scattare le foto dei giocatori.</Text>
            <Pressable style={styles.permBtn} onPress={() => Linking.openSettings()} testID="open-settings-button">
              <Text style={styles.permBtnText}>Apri Impostazioni</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.row2}>
          <View style={{ flex: 1 }}>{input("firstName", "Nome", { placeholder: "Mario", autoCapitalize: "words" })}</View>
          <View style={{ flex: 1 }}>{input("lastName", "Cognome", { placeholder: "Rossi", autoCapitalize: "words" })}</View>
        </View>
        <View style={styles.row2}>
          <View style={{ width: 110 }}>{input("number", "N° maglia", { placeholder: "10", keyboardType: "number-pad", maxLength: 3 })}</View>
          <View style={{ flex: 1 }}>{input("birthDate", "Data di nascita", { placeholder: "gg/mm/aaaa" })}</View>
        </View>

        <Text style={styles.label}>Ruolo</Text>
        <View style={styles.segment}>
          {ROLES.map((r) => (
            <Pressable
              key={r.key}
              onPress={() => setP({ ...p, role: r.key })}
              style={[styles.segItem, p.role === r.key && styles.segActive]}
              testID={`player-role-${r.key}`}
            >
              <Text style={[styles.segText, p.role === r.key && styles.segTextActive]}>{r.key}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Piede</Text>
        <View style={styles.segment}>
          {FEET.map((f) => (
            <Pressable
              key={f}
              onPress={() => setP({ ...p, foot: f })}
              style={[styles.segItem, p.foot === f && styles.segActive]}
              testID={`player-foot-${f}`}
            >
              <Text style={[styles.segText, p.foot === f && styles.segTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </View>

        {input("notes", "Note", { placeholder: "Caratteristiche, infortuni…", multiline: true, style: [styles.input, styles.textarea] })}

        {existing && (
          <Pressable style={[styles.deleteBtn, confirmDelete && styles.deleteConfirm]} onPress={onDelete} testID="player-delete-button">
            <Ionicons name="trash-outline" size={18} color={confirmDelete ? colors.onError : colors.error} />
            <Text style={[styles.deleteText, confirmDelete && { color: colors.onError }]}>
              {confirmDelete ? "Tocca di nuovo per confermare" : "Elimina giocatore"}
            </Text>
          </Pressable>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: {
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  headBtn: { minHeight: 44, minWidth: 64, justifyContent: "center", paddingHorizontal: 8 },
  headBtnText: { color: c.onBrandPrimary, fontSize: 16 },
  headTitle: { color: c.onBrandPrimary, fontSize: 17, fontWeight: "800" },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16 },
  photoBusy: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 52, backgroundColor: c.overlay, alignItems: "center", justifyContent: "center" },
  photoBtn: { flexDirection: "row", alignItems: "center", gap: 8, height: 44, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, paddingHorizontal: 12 },
  photoBtnText: { color: c.brandSecondary, fontWeight: "700", fontSize: 14 },
  linkBtn: { minHeight: 32, justifyContent: "center" },
  removeText: { color: c.error, fontWeight: "700", fontSize: 13 },
  permBox: { backgroundColor: c.brandTertiary, borderRadius: 12, padding: 12, gap: 8, marginBottom: 16 },
  permText: { color: c.onBrandTertiary, fontSize: 13 },
  permBtn: { alignSelf: "flex-start", backgroundColor: c.brandPrimary, borderRadius: 999, paddingHorizontal: 16, height: 40, justifyContent: "center" },
  permBtnText: { color: c.onBrandPrimary, fontWeight: "800" },
  row2: { flexDirection: "row", gap: 12 },
  field: { gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: c.onSurfaceTertiary, marginBottom: 6 },
  input: { height: 48, borderRadius: 12, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, paddingHorizontal: 14, fontSize: 16, color: c.onSurface },
  textarea: { height: 96, paddingTop: 12, textAlignVertical: "top" },
  segment: { flexDirection: "row", backgroundColor: c.surfaceTertiary, borderRadius: 12, padding: 4, marginBottom: 16 },
  segItem: { flex: 1, height: 40, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  segActive: { backgroundColor: c.brandPrimary },
  segText: { fontWeight: "800", color: c.onSurfaceTertiary, fontSize: 14 },
  segTextActive: { color: c.onBrandPrimary },
  deleteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, borderRadius: 999, borderWidth: 1.5, borderColor: c.error, marginTop: 8 },
  deleteConfirm: { backgroundColor: c.error },
  deleteText: { color: c.error, fontWeight: "800", fontSize: 15 },
}));
