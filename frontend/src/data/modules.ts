export const MODULES = [
  "4-4-2",
  "4-3-3",
  "4-2-3-1",
  "3-5-2",
  "3-4-3",
  "4-5-1",
  "4-1-4-1",
  "4-3-1-2",
  "4-3-2-1",
  "4-1-3-2",
  "3-4-1-2",
  "5-3-2",
  "5-4-1",
  "4-2-4",
];

export type SlotPos = { x: number; y: number; label: string };

// Coordinates in % of the pitch (x from left, y from top). Own goal at the bottom.
export function slotsFor(module: string): SlotPos[] {
  const lines = module.split("-").map((n) => parseInt(n, 10));
  const res: SlotPos[] = [{ x: 50, y: 89, label: "POR" }];
  const n = lines.length;
  const yBottom = 70;
  const yTop = 15;
  lines.forEach((k, i) => {
    const y = n === 1 ? 45 : yBottom - (i * (yBottom - yTop)) / (n - 1);
    let label = "CEN";
    if (i === 0) label = "DIF";
    else if (i === n - 1) label = "ATT";
    else if (n >= 4 && i === n - 2 && (k === 1 || lines[n - 1] === 1)) label = "TRQ";
    else if (n >= 4 && i === 1 && k === 1) label = "MED";
    const margin = k >= 5 ? 9 : k === 4 ? 13 : k === 3 ? 22 : 32;
    for (let j = 0; j < k; j++) {
      const x = k === 1 ? 50 : margin + (j * (100 - 2 * margin)) / (k - 1);
      res.push({ x, y, label });
    }
  });
  return res;
}

export function emptySlots() {
  return Array(11).fill(null) as (string | null)[];
}
