export type Role = "POR" | "DIF" | "CEN" | "ATT";

export const ROLES: { key: Role; label: string; plural: string }[] = [
  { key: "POR", label: "Portiere", plural: "Portieri" },
  { key: "DIF", label: "Difensore", plural: "Difensori" },
  { key: "CEN", label: "Centrocampista", plural: "Centrocampisti" },
  { key: "ATT", label: "Attaccante", plural: "Attaccanti" },
];

export const FEET = ["Destro", "Sinistro", "Ambidestro"] as const;

export type Player = {
  id: string;
  firstName: string;
  lastName: string;
  number: string;
  role: Role;
  photo: string | null;
  birthDate: string;
  foot: string;
  notes: string;
};

export type Lineup = {
  module: string;
  slots: (string | null)[];
  bench: string[];
};

export type Scheme = Lineup & { id: string; name: string; createdAt: string };

export type Callup = {
  id: string;
  opponent: string;
  competition: string;
  date: string;
  time: string;
  meetTime: string;
  venue: string;
  homeAway: "Casa" | "Trasferta";
  playerIds: string[];
  notes: string;
  createdAt: string;
};

export type Settings = {
  teamName: string;
  category: string;
  season: string;
  coach: string;
};

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function fullName(p: Player) {
  return `${p.lastName} ${p.firstName}`.trim();
}

export function sortPlayers(list: Player[]) {
  const order: Record<Role, number> = { POR: 0, DIF: 1, CEN: 2, ATT: 3 };
  return [...list].sort(
    (a, b) =>
      order[a.role] - order[b.role] ||
      (parseInt(a.number, 10) || 99) - (parseInt(b.number, 10) || 99) ||
      a.lastName.localeCompare(b.lastName),
  );
}
