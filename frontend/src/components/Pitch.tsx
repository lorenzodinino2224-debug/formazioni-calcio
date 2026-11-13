import React from "react";
import { Pressable, Text, View } from "react-native";

import { slotsFor } from "@/src/data/modules";
import { Player } from "@/src/data/types";
import { makeStyles } from "@/src/theme";
import { Avatar } from "./Avatar";

const SLOT_W = 72;
const SLOT_H = 70;

export function Pitch({
  module,
  slots,
  playerById,
  onSlotPress,
  width,
}: {
  module: string;
  slots: (string | null)[];
  playerById: (id: string | null) => Player | undefined;
  onSlotPress: (index: number) => void;
  width: number;
}) {
  const styles = useStyles();
  const height = width * 1.38;
  const positions = slotsFor(module);
  return (
    <View style={[styles.pitch, { width, height }]} testID="pitch">
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={[styles.stripe, { top: `${i * 12.5}%`, height: "12.5%" }, i % 2 === 0 && styles.stripeAlt]} />
      ))}
      <View style={styles.border} />
      <View style={styles.midLine} />
      <View style={[styles.circle, { width: width * 0.3, height: width * 0.3, borderRadius: width * 0.15, marginLeft: -width * 0.15, marginTop: -width * 0.15 }]} />
      <View style={[styles.box, styles.boxTop]} />
      <View style={[styles.smallBox, styles.boxTop]} />
      <View style={[styles.box, styles.boxBottom]} />
      <View style={[styles.smallBox, styles.boxBottom]} />

      {positions.map((pos, i) => {
        const p = playerById(slots[i] ?? null);
        return (
          <Pressable
            key={`${module}-${i}`}
            testID={`pitch-slot-${i}`}
            onPress={() => onSlotPress(i)}
            style={({ pressed }) => [
              styles.slot,
              { left: (pos.x / 100) * width - SLOT_W / 2, top: (pos.y / 100) * height - SLOT_H / 2 },
              pressed && { transform: [{ scale: 0.92 }] },
            ]}
          >
            {p ? (
              <View style={styles.filled}>
                <Avatar player={p} size={40} ring />
                {p.number ? (
                  <View style={styles.numBadge}>
                    <Text style={styles.numText}>{p.number}</Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.empty}>
                <Text style={styles.plus}>+</Text>
              </View>
            )}
            <View style={styles.nameTag}>
              <Text style={styles.nameText} numberOfLines={1}>
                {p ? p.lastName.toUpperCase() : pos.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  pitch: {
    backgroundColor: c.pitchGreen,
    borderRadius: 16,
    overflow: "hidden",
    alignSelf: "center",
  },
  stripe: { position: "absolute", left: 0, right: 0, backgroundColor: c.pitchGreen },
  stripeAlt: { backgroundColor: c.pitchGreenAlt },
  border: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderWidth: 2,
    borderColor: c.pitchLines,
  },
  midLine: { position: "absolute", left: 10, right: 10, top: "50%", height: 2, backgroundColor: c.pitchLines },
  circle: { position: "absolute", left: "50%", top: "50%", borderWidth: 2, borderColor: c.pitchLines },
  box: { position: "absolute", left: "22%", width: "56%", height: "15%", borderWidth: 2, borderColor: c.pitchLines },
  smallBox: { position: "absolute", left: "37%", width: "26%", height: "6%", borderWidth: 2, borderColor: c.pitchLines },
  boxTop: { top: 10 },
  boxBottom: { bottom: 10 },
  slot: { position: "absolute", width: SLOT_W, height: SLOT_H, alignItems: "center" },
  filled: { alignItems: "center" },
  empty: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: c.onBrand,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  plus: { color: c.onBrand, fontSize: 22, fontWeight: "700", marginTop: -2 },
  numBadge: {
    position: "absolute",
    right: -8,
    top: -4,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: 10,
    backgroundColor: c.brandSecondary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: c.surfaceSecondary,
  },
  numText: { color: c.onBrandSecondary, fontSize: 11, fontWeight: "800" },
  nameTag: {
    marginTop: 4,
    backgroundColor: c.brandPrimary,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: SLOT_W,
  },
  nameText: { color: c.onBrandPrimary, fontSize: 10, fontWeight: "800" },
}));
