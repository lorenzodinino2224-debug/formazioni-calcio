import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { LOGO_BASE64 } from "./logoBase64";
import { slotsFor } from "./data/modules";
import { photoToDataUri } from "./data/photos";
import { Callup, Lineup, Player, ROLES, Settings, fullName, sortPlayers } from "./data/types";

const MAROON = "#7A1E2E";
const BLUE = "#1F5FAE";

const esc = (s: string) =>
  (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function page(title: string, settings: Settings, body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
@page { size: A4; margin: 14mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1A1918; margin: 0; }
.head { display:flex; align-items:center; gap:16px; border-bottom: 4px solid ${MAROON}; padding-bottom: 10px; }
.head img { width: 64px; }
.head .t1 { font-size: 22px; font-weight: 800; color: ${MAROON}; letter-spacing: .5px; }
.head .t2 { font-size: 12px; color: ${BLUE}; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
.doc { margin-left:auto; text-align:right; }
.doc .d1 { font-size: 18px; font-weight: 800; text-transform: uppercase; }
.doc .d2 { font-size: 12px; color: #75736F; }
table { width:100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
th { background: ${MAROON}; color: #fff; text-align:left; padding: 6px 8px; font-size: 11px; text-transform: uppercase; }
td { border-bottom: 1px solid #E6E2D8; padding: 6px 8px; vertical-align: middle; }
tr:nth-child(even) td { background: #F9F8F6; }
.num { font-weight: 800; color: ${BLUE}; width: 36px; text-align:center; }
.ph { width: 30px; height: 30px; border-radius: 15px; object-fit: cover; background:#F2E8EA; display:inline-block; }
.info { display:grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; margin-top: 14px; font-size: 13px; }
.info b { color: ${MAROON}; }
.sign { margin-top: 36px; display:flex; justify-content: space-between; font-size: 12px; }
.sign div { width: 45%; border-top: 1px solid #1A1918; padding-top: 4px; text-align:center; }
.foot { margin-top: 18px; font-size: 10px; color: #75736F; text-align:center; }
.sec { margin-top: 16px; font-size: 13px; font-weight: 800; color: ${MAROON}; text-transform: uppercase; letter-spacing: 1px; }
</style></head><body>
<div class="head"><img src="${LOGO_BASE64}"/>
<div><div class="t1">${esc(settings.teamName)}</div><div class="t2">${esc(settings.category)} · Stagione ${esc(settings.season)}</div></div>
<div class="doc"><div class="d1">${esc(title)}</div><div class="d2">Generato il ${new Date().toLocaleDateString("it-IT")}</div></div>
</div>
${body}
<div class="foot">${esc(settings.teamName)} — Gestionale Tecnico</div>
</body></html>`;
}

async function photosMap(players: Player[]) {
  const map: Record<string, string | null> = {};
  for (const p of players) map[p.id] = await photoToDataUri(p.photo);
  return map;
}

const photoCell = (src: string | null | undefined) =>
  src ? `<img class="ph" src="${src}"/>` : `<span class="ph"></span>`;

export async function rosaHtml(players: Player[], settings: Settings) {
  const sorted = sortPlayers(players);
  const photos = await photosMap(sorted);
  let body = "";
  for (const r of ROLES) {
    const list = sorted.filter((p) => p.role === r.key);
    if (!list.length) continue;
    body += `<div class="sec">${r.plural} (${list.length})</div><table><tr><th>N°</th><th></th><th>Cognome e Nome</th><th>Data di nascita</th><th>Piede</th><th>Note</th></tr>`;
    body += list
      .map(
        (p) =>
          `<tr><td class="num">${esc(p.number)}</td><td style="width:40px">${photoCell(photos[p.id])}</td><td><b>${esc(p.lastName)}</b> ${esc(p.firstName)}</td><td>${esc(p.birthDate)}</td><td>${esc(p.foot)}</td><td>${esc(p.notes)}</td></tr>`,
      )
      .join("");
    body += `</table>`;
  }
  if (!sorted.length) body = `<p>Nessun giocatore in rosa.</p>`;
  body += `<div class="info"><div><b>Totale giocatori:</b> ${sorted.length}</div><div><b>Allenatore:</b> ${esc(settings.coach)}</div></div>`;
  return page("Rosa completa", settings, body);
}

export async function convocatiHtml(callup: Callup, players: Player[], settings: Settings) {
  const list = sortPlayers(players.filter((p) => callup.playerIds.includes(p.id)));
  const photos = await photosMap(list);
  const match =
    callup.homeAway === "Casa"
      ? `${settings.teamName} - ${callup.opponent}`
      : `${callup.opponent} - ${settings.teamName}`;
  let body = `<div class="info">
<div><b>Gara:</b> ${esc(match)}</div><div><b>Competizione:</b> ${esc(callup.competition)}</div>
<div><b>Data:</b> ${esc(callup.date)} ${callup.time ? "ore " + esc(callup.time) : ""}</div><div><b>Campo:</b> ${esc(callup.venue)}</div>
<div><b>Ritrovo:</b> ${esc(callup.meetTime)}</div><div><b>Convocati:</b> ${list.length}</div>
</div>`;
  body += `<table><tr><th>#</th><th>N°</th><th></th><th>Cognome e Nome</th><th>Ruolo</th></tr>`;
  body += list
    .map(
      (p, i) =>
        `<tr><td style="width:28px">${i + 1}</td><td class="num">${esc(p.number)}</td><td style="width:40px">${photoCell(photos[p.id])}</td><td><b>${esc(p.lastName)}</b> ${esc(p.firstName)}</td><td>${ROLES.find((r) => r.key === p.role)?.label ?? ""}</td></tr>`,
    )
    .join("");
  body += `</table>`;
  if (callup.notes) body += `<div class="sec">Note</div><p style="font-size:13px">${esc(callup.notes)}</p>`;
  body += `<div class="sign"><div>L'allenatore ${esc(settings.coach)}</div><div>Il dirigente</div></div>`;
  return page("Distinta convocati", settings, body);
}

export async function formazioneHtml(lineup: Lineup, players: Player[], settings: Settings) {
  const byId = (id: string | null) => players.find((p) => p.id === id);
  const positions = slotsFor(lineup.module);
  const used = [...lineup.slots.filter(Boolean), ...lineup.bench] as string[];
  const photos = await photosMap(players.filter((p) => used.includes(p.id)));
  const W = 440;
  const H = 600;
  const marks = positions
    .map((pos, i) => {
      const p = byId(lineup.slots[i] ?? null);
      const img = p && photos[p.id]
        ? `<img src="${photos[p.id]}" style="width:44px;height:44px;border-radius:22px;object-fit:cover;border:2px solid #fff"/>`
        : `<div style="width:44px;height:44px;border-radius:22px;background:${p ? MAROON : "rgba(255,255,255,.2)"};border:2px solid #fff;color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:16px">${p ? esc(p.number) : ""}</div>`;
      return `<div style="position:absolute;left:${(pos.x / 100) * W - 45}px;top:${(pos.y / 100) * H - 30}px;width:90px;text-align:center">
${img}<div style="margin-top:3px;background:${MAROON};color:#fff;font-size:10px;font-weight:800;padding:2px 4px;border-radius:4px;display:inline-block;max-width:90px;overflow:hidden;white-space:nowrap">${p ? `${esc(p.number)} ${esc(p.lastName.toUpperCase())}` : pos.label}</div></div>`;
    })
    .join("");
  const line = "rgba(255,255,255,.8)";
  const pitch = `<div style="position:relative;width:${W}px;height:${H}px;background:repeating-linear-gradient(180deg,#4A7A3B 0 75px,#548743 75px 150px);border-radius:10px;margin:16px auto 0;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact">
<div style="position:absolute;inset:10px;border:2px solid ${line}"></div>
<div style="position:absolute;left:10px;right:10px;top:${H / 2}px;border-top:2px solid ${line}"></div>
<div style="position:absolute;left:${W / 2 - 60}px;top:${H / 2 - 60}px;width:120px;height:120px;border:2px solid ${line};border-radius:60px"></div>
<div style="position:absolute;left:22%;width:56%;top:10px;height:15%;border:2px solid ${line}"></div>
<div style="position:absolute;left:22%;width:56%;bottom:10px;height:15%;border:2px solid ${line}"></div>
${marks}</div>`;
  const titolari = lineup.slots
    .map((id, i) => ({ p: byId(id), label: positions[i]?.label }))
    .filter((x) => x.p);
  const bench = sortPlayers(lineup.bench.map((id) => byId(id)).filter(Boolean) as Player[]);
  let body = `<div class="info"><div><b>Modulo:</b> ${esc(lineup.module)}</div><div><b>Allenatore:</b> ${esc(settings.coach)}</div></div>${pitch}`;
  body += `<div style="display:flex;gap:16px"><div style="flex:1"><div class="sec">Titolari</div><table><tr><th>N°</th><th>Giocatore</th><th>Pos.</th></tr>${titolari
    .map((x) => `<tr><td class="num">${esc(x.p!.number)}</td><td>${esc(fullName(x.p!))}</td><td>${x.label}</td></tr>`)
    .join("")}</table></div>
<div style="flex:1"><div class="sec">Panchina</div><table><tr><th>N°</th><th>Giocatore</th></tr>${bench
    .map((p) => `<tr><td class="num">${esc(p.number)}</td><td>${esc(fullName(p))}</td></tr>`)
    .join("") || `<tr><td colspan="2">—</td></tr>`}</table></div></div>`;
  return page("Formazione in campo", settings, body);
}

export async function sharePdf(html: string, title: string) {
  if (Platform.OS === "web") {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: title });
  } else {
    await Print.printAsync({ uri });
  }
}

export async function printPdf(html: string) {
  await Print.printAsync({ html });
}
