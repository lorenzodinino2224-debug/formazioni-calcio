import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { storage } from "@/src/utils/storage";
import { emptySlots } from "./modules";
import { deletePhoto } from "./photos";
import { Callup, Lineup, Player, Scheme, Settings, uid } from "./types";

const KEYS = {
  players: "spoltore_players",
  lineup: "spoltore_lineup",
  schemes: "spoltore_schemes",
  callups: "spoltore_callups",
  settings: "spoltore_settings",
};

const DEFAULT_SETTINGS: Settings = {
  teamName: "Città di Spoltore",
  category: "Prima Squadra",
  season: "2026/2027",
  coach: "",
};

const DEFAULT_LINEUP: Lineup = { module: "4-4-2", slots: emptySlots(), bench: [] };

async function load<T>(key: string, fallback: T): Promise<T> {
  const raw = await storage.getItem(key, null);
  if (typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  storage.setItem(key, JSON.stringify(value));
}

type Ctx = {
  hydrated: boolean;
  players: Player[];
  lineup: Lineup;
  schemes: Scheme[];
  callups: Callup[];
  settings: Settings;
  savePlayer: (p: Player) => void;
  deletePlayer: (id: string) => void;
  setLineup: (l: Lineup) => void;
  saveScheme: (name: string) => void;
  deleteScheme: (id: string) => void;
  saveCallup: (c: Callup) => void;
  deleteCallup: (id: string) => void;
  saveSettings: (s: Settings) => void;
  playerById: (id: string | null | undefined) => Player | undefined;
};

const DataContext = createContext<Ctx | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [lineup, setLineupState] = useState<Lineup>(DEFAULT_LINEUP);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [callups, setCallups] = useState<Callup[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      const [p, l, s, c, st] = await Promise.all([
        load<Player[]>(KEYS.players, []),
        load<Lineup>(KEYS.lineup, DEFAULT_LINEUP),
        load<Scheme[]>(KEYS.schemes, []),
        load<Callup[]>(KEYS.callups, []),
        load<Settings>(KEYS.settings, DEFAULT_SETTINGS),
      ]);
      setPlayers(p);
      setLineupState(l);
      setSchemes(s);
      setCallups(c);
      setSettings({ ...DEFAULT_SETTINGS, ...st });
      setHydrated(true);
    })();
  }, []);

  const savePlayer = useCallback((p: Player) => {
    setPlayers((prev) => {
      const old = prev.find((x) => x.id === p.id);
      if (old && old.photo && old.photo !== p.photo) deletePhoto(old.photo);
      const next = old ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
      save(KEYS.players, next);
      return next;
    });
  }, []);

  const deletePlayer = useCallback((id: string) => {
    setPlayers((prev) => {
      const old = prev.find((x) => x.id === id);
      if (old) deletePhoto(old.photo);
      const next = prev.filter((x) => x.id !== id);
      save(KEYS.players, next);
      return next;
    });
    setLineupState((prev) => {
      const next = {
        ...prev,
        slots: prev.slots.map((s) => (s === id ? null : s)),
        bench: prev.bench.filter((b) => b !== id),
      };
      save(KEYS.lineup, next);
      return next;
    });
    setCallups((prev) => {
      const next = prev.map((c) => ({ ...c, playerIds: c.playerIds.filter((x) => x !== id) }));
      save(KEYS.callups, next);
      return next;
    });
  }, []);

  const setLineup = useCallback((l: Lineup) => {
    setLineupState(l);
    save(KEYS.lineup, l);
  }, []);

  const saveScheme = useCallback(
    (name: string) => {
      setSchemes((prev) => {
        const next = [
          { ...lineup, id: uid(), name, createdAt: new Date().toISOString() },
          ...prev,
        ];
        save(KEYS.schemes, next);
        return next;
      });
    },
    [lineup],
  );

  const deleteScheme = useCallback((id: string) => {
    setSchemes((prev) => {
      const next = prev.filter((s) => s.id !== id);
      save(KEYS.schemes, next);
      return next;
    });
  }, []);

  const saveCallup = useCallback((c: Callup) => {
    setCallups((prev) => {
      const exists = prev.some((x) => x.id === c.id);
      const next = exists ? prev.map((x) => (x.id === c.id ? c : x)) : [c, ...prev];
      save(KEYS.callups, next);
      return next;
    });
  }, []);

  const deleteCallup = useCallback((id: string) => {
    setCallups((prev) => {
      const next = prev.filter((x) => x.id !== id);
      save(KEYS.callups, next);
      return next;
    });
  }, []);

  const saveSettings = useCallback((s: Settings) => {
    setSettings(s);
    save(KEYS.settings, s);
  }, []);

  const playerById = useCallback(
    (id: string | null | undefined) => (id ? players.find((p) => p.id === id) : undefined),
    [players],
  );

  const value = useMemo(
    () => ({
      hydrated,
      players,
      lineup,
      schemes,
      callups,
      settings,
      savePlayer,
      deletePlayer,
      setLineup,
      saveScheme,
      deleteScheme,
      saveCallup,
      deleteCallup,
      saveSettings,
      playerById,
    }),
    [hydrated, players, lineup, schemes, callups, settings, savePlayer, deletePlayer, setLineup, saveScheme, deleteScheme, saveCallup, deleteCallup, saveSettings, playerById],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData outside DataProvider");
  return ctx;
}
