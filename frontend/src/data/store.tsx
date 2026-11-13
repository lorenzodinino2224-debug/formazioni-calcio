import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { initDb, kvGet, kvSet } from "./db";
import { KEYS } from "./keys";
import { emptySlots } from "./modules";
import { deletePhoto, preloadPhotos } from "./photos";
import { Callup, Lineup, Player, Scheme, Settings, uid } from "./types";

const DEFAULT_SETTINGS: Settings = {
  teamName: "Città di Spoltore",
  category: "Prima Squadra",
  season: "2026/2027",
  coach: "",
};

const DEFAULT_LINEUP: Lineup = { module: "4-4-2", slots: emptySlots(), bench: [] };

function save(key: string, value: unknown) {
  kvSet(key, value).catch(() => {});
}

type Ctx = {
  hydrated: boolean;
  players: Player[];
  lineup: Lineup;
  schemes: Scheme[];
  callups: Callup[];
  settings: Settings;
  lastBackup: string | null;
  installDismissed: boolean;
  savePlayer: (p: Player) => void;
  deletePlayer: (id: string) => void;
  setLineup: (l: Lineup) => void;
  saveScheme: (name: string) => void;
  deleteScheme: (id: string) => void;
  saveCallup: (c: Callup) => void;
  deleteCallup: (id: string) => void;
  saveSettings: (s: Settings) => void;
  markBackup: () => void;
  dismissInstall: () => void;
  reload: () => Promise<void>;
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
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);

  const reload = useCallback(async () => {
    const [p, l, s, c, st, lb, inst] = await Promise.all([
      kvGet<Player[]>(KEYS.players, []),
      kvGet<Lineup>(KEYS.lineup, DEFAULT_LINEUP),
      kvGet<Scheme[]>(KEYS.schemes, []),
      kvGet<Callup[]>(KEYS.callups, []),
      kvGet<Settings>(KEYS.settings, DEFAULT_SETTINGS),
      kvGet<string | null>(KEYS.lastBackup, null),
      kvGet<boolean>(KEYS.installDismissed, false),
    ]);
    await preloadPhotos(p.map((x) => x.photo));
    setPlayers(p);
    setLineupState(l);
    setSchemes(s);
    setCallups(c);
    setSettings({ ...DEFAULT_SETTINGS, ...st });
    setLastBackup(lb);
    setInstallDismissed(inst);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await initDb();
        await reload();
      } finally {
        setHydrated(true);
      }
    })();
  }, [reload]);

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
        const next = [{ ...lineup, id: uid(), name, createdAt: new Date().toISOString() }, ...prev];
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

  const markBackup = useCallback(() => {
    const now = new Date().toISOString();
    setLastBackup(now);
    save(KEYS.lastBackup, now);
  }, []);

  const dismissInstall = useCallback(() => {
    setInstallDismissed(true);
    save(KEYS.installDismissed, true);
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
      lastBackup,
      installDismissed,
      savePlayer,
      deletePlayer,
      setLineup,
      saveScheme,
      deleteScheme,
      saveCallup,
      deleteCallup,
      saveSettings,
      markBackup,
      dismissInstall,
      reload,
      playerById,
    }),
    [hydrated, players, lineup, schemes, callups, settings, lastBackup, installDismissed, savePlayer, deletePlayer, setLineup, saveScheme, deleteScheme, saveCallup, deleteCallup, saveSettings, markBackup, dismissInstall, reload, playerById],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData outside DataProvider");
  return ctx;
}

export function backupOverdue(lastBackup: string | null, hasData: boolean) {
  if (!hasData) return false;
  if (!lastBackup) return true;
  return Date.now() - new Date(lastBackup).getTime() > 30 * 24 * 3600 * 1000;
}
