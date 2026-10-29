// Mister 14 · Fitness Quest widget · v13.16 (glow B default · quest panel = one balanced block: tiles + verse tied with a fixed gap, verse grows into the spare room, group centred so top clearance = bottom clearance · verse edges on the tile edges) · v13.15 (quest star off by default · galaxy done-glow questGlow A-E, default A nebula · questIcon default S solid glyphs) · v13.14 (quest panel: no "today's quest" header or x/2 counter, a star instead (1/2 sparkle, 2/2 radiant) · grid P = J + optical polish (default) · questFont F/R/V/U · questIcon A/B/R/S · grids L/M/N) · v13.13 (quest tiles J: a 2x2 grid · word over its icon, streak number over its flame · new default · K = number column on the tile's right edge) · v13.12 (F/G: both quest tiles share one geometry: same icon box, column x, word baseline and flame row; the pot + steam fit the dumbbell's box) · v13.11 (stacked tiles F: icon left spanning both lines, word over flame + number left-aligned to one x · new default · G = same, centred column) · v13.10 (stacked tiles D: label alone on top, [icon] [flame] [number] side by side below · new default) · v13.9 (quest tiles stacked + centred: label on top, a much bigger flame + streak below · questStack A/B/C) · v13.8 (galaxy flows across the whole medium widget behind the quest panel, galaxyFlow 1/2/3, stars dimmed behind text) · v13.7 (gold-lit done tiles, richer glow, flames 1.5x, header lifted so top = bottom clearance, new icon art A/B/C via questArt, 57 sombre verses removed → 1,252) · v13.6 (quest tiles: status words removed, centred [icon] Label [flame N] row, bigger; done tile lights up, not-done dim; questTiles 1 glow (default) | 2 underline | 3 tint) · v13.5 (borderless TODAY'S QUEST / RESTRICTED panel: frame and glass box removed, soft fading haze behind the text; panelFrame "soft" | "faint" | "glass") · v13.4 (galaxy balanced for 1,555: 16 superior star slots, GAL_GROW_K 280; verse fills the panel under the tiles, fit-to-box 13 → 7pt, up to 5 lines, reference 6pt) · v13.3 (1309 verses: sombre/half-negative ones removed) · v13.2 (verse text 9.5pt max, 6.2pt floor, up to 4 lines, reference 5.4; 1553 standalone verses incl. Joshua 1:9 / Isaiah 40:31 / Micah 6:8) · v13.1 (bigger verse text) · v13 (Bible verses (KJV) replace the quotes, a new one every hour; compact right panel A/B with the streaks folded in; ring-text options) · v12 (icy blue-white Milky Way band; medium: bigger centred XP ring, streak cells moved into the right panel, bigger quote; aligned stat cells: flame + number + label on one axis; real widget size + inset quest panel, clear star tiers; badges + medals build the Milky Way, 8 realistic astrophotography star designs per tier + realistic chaos looks, random-but-stable, twinkle + milestone flare: no medals = dark sky; Train | Cook bar, chaos blood theme)
// Scriptable · small + medium · built-in galaxy background drawn live (no setup needed)
//
// SETUP: run this script once in the Scriptable app, then add a small Scriptable widget to your
// home screen and choose this script. Pick a font look with FONT_SET (1-6) below.
// Want the see-through wallpaper look instead? Set BG_MODE = "wallpaper": take a screenshot of an
// empty home-screen page, run the script and follow the prompts (pick where the widget will sit).
// Tap the widget to open the Fitness Quest Tracker in the Google Sheets app.
//
// HOSTED VERSION: this file lives in a PUBLIC GitHub repo and is started by fitness-widget-loader.js
// on the phone. Personal values (your sheet id and the published Widget-tab CSV link) are NOT in this
// file: the loader passes them in as FITNESS_CONFIG = { sheetId, dataUrl }. Keep them in the loader only.
//
// LIVE DATA: the tracker is private, so the widget can't read it directly; it reads a small
// "Publish to web" CSV of the Widget tab (dataUrl). If dataUrl is empty or the fetch fails, the widget
// shows the last stats it fetched, then the SNAPSHOT below.

// ===================== CONFIG =====================
const XP_STYLE = "orbit"                          // XP ring look: "orbit" comet on an orbit (recommended) · "planet" ringed planet + tenth marks · "bar" slim horizontal comet bar
const XP_RING = "halo"                           // XP ring look: "halo" (Galactic halo, G 14's pick) · "comet" (the earlier Comet Orbit)
const STYLE = "ring"                              // "ring" · ring2 Orbit · ring3 Twin · ring4 Dial · ring5 Halo · ring6 Minimal · ring7 Filigree · ring8 Level Core · "crest" · "sword"
const BG_MODE = "galaxy"                          // "galaxy" = built-in deep-space background, no setup · "wallpaper" = see-through look cropped from a home-screen screenshot
const FONT_SET = 3                                // 1 Classic · 2 Avenir · 3 Futura · 4 Copperplate · 5 Optima & Bodoni · 6 Script & Mono
const GALAXY_SEED = 7071                          // change for a different (but still fixed) star field
const CFG = (typeof FITNESS_CONFIG !== "undefined" && FITNESS_CONFIG) ? FITNESS_CONFIG : {}   // set by the loader (phone-only)
const SHEET_ID = CFG.sheetId || ""
const TAP_URL = CFG.tapUrl || (SHEET_ID ? `googlesheets://https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit` : "")
// if the app doesn't open, the loader can pass tapUrl instead: https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
// Live stats link (File → Share → Publish to web → "Widget" tab only → CSV). Passed in by the loader as dataUrl.
const DATA_URL = CFG.dataUrl || ""
const FETCH_MINUTES = 30                          // fetch at most this often (keeps it light on the phone)
const RANK_EMOJI = true                           // crest style: show the rank emoji (🐯) inside the shield
const STAR_SEED = 1414                            // fixed seed: base stars never move
const CROP_NUDGE = { x: 0, y: 0 }                 // px; fine-tune the background crop if it looks offset
// offline fallback stats, used only if live data has never loaded (Widget tab · 29 Oct 2026)
const SNAPSHOT = {
  xp: 16145, rank: "Black Dragon", rankIcon: "🖤", level: 9,
  next: "Gold Tiger King", xpIn: 3145, xpNeed: 5000,
  exercise: 7, cooking: 7, savings: 0.01,
  badges: 47, prismatic: 1, diamond: 0, gold: 0,
  trainToday: 0, cookToday: 0,                                  // today's quest (Widget tab)
  chaosState: "clear", chaosCover: 0, chaosNames: "",           // chaos lock: worst uncleansed medal type, tiers restricted (0-5), their names
  chaosTierNames: "LIFE360|DISCORD|5555 Number|YOUTRIP|All Messaging Platforms", cleansedMedals: 0,
}
// ==================================================

const GOLD = "#E9C877"
const GOLD_BRIGHT = "#FFD774"
const GOLD_SOFT = "#F4E2B0"
const SILVER = "#DDE2EC"
const EMBER = "#FF9A5A"
// font sets: hero = big XP number, level = "Level N", cap = tiny caps labels; k = size tweak so each family fits the same space
const mono = (s) => Font.lightMonospacedSystemFont ? Font.lightMonospacedSystemFont(s) : new Font("Menlo-Regular", s)
const FONT_SETS = {
  1: { name: "Classic", hero: (s) => Font.lightSystemFont(s), heroK: 1, level: (s) => new Font("Didot-Bold", s), levelK: 1, cap: (s) => Font.semiboldSystemFont(s), capK: 1 },
  2: { name: "Avenir", hero: (s) => new Font("AvenirNext-UltraLight", s), heroK: 1.06, level: (s) => new Font("AvenirNext-DemiBold", s), levelK: 0.95, cap: (s) => new Font("AvenirNext-DemiBold", s), capK: 1 },
  3: { name: "Futura", hero: (s) => new Font("Futura-Medium", s), heroK: 0.9, level: (s) => new Font("Futura-Bold", s), levelK: 0.92, cap: (s) => new Font("Futura-Medium", s), capK: 1 },
  4: { name: "Copperplate", hero: (s) => new Font("Copperplate-Light", s), heroK: 0.92, level: (s) => new Font("Copperplate-Bold", s), levelK: 0.92, cap: (s) => new Font("Copperplate", s), capK: 1.08 },
  5: { name: "Optima & Bodoni", hero: (s) => new Font("Optima-Regular", s), heroK: 0.95, level: (s) => new Font("BodoniSvtyTwoITCTT-Bold", s), levelK: 1.05, cap: (s) => new Font("Optima-Bold", s), capK: 1 },
  6: { name: "Script & Mono", hero: mono, heroK: 0.8, level: (s) => new Font("SnellRoundhand-Black", s), levelK: 1.3, cap: (s) => Font.semiboldSystemFont(s), capK: 1 },
}
const FS = FONT_SETS[FONT_SET] || FONT_SETS[1]

const fm = FileManager.local()
const bgPath = (fam) => fm.joinPath(fm.documentsDirectory(), `grok-fitness-bg-${fam}.png`)
const cachePath = fm.joinPath(fm.documentsDirectory(), "grok-fitness-stats.json")
const now = new Date()
// live render state, filled from the Widget-tab stats in buildWidget() (replaces the preview-only mocks)
let __EMBER_TOP = null                                   // v13.9: optional ceiling for rising embers (px), set around stacked quest flames
let __BAND = null, __STAR_DRAW = null                   // galaxy band geometry + the deferred medal-star pass (set per render)
const LIVE = { flare: 0, chaos: null, sky: {}, quest: { train: false, cook: false }, reason: { xp: 0, cleansed: 0 } }

// ---------------- helpers ----------------
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)) }
function smooth(t) { return t * t * (3 - 2 * t) }
function rgb(hex) { return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) }
function mixHex(a, b, t) {
  const A = rgb(a), B = rgb(b)
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")
}
// chaos "blood moon" theme: while a chaos lock is on, EVERY colour (stars, band, ring, glass, text, flames) is pulled onto a blood-red ramp
// by its brightness, so light stays light (text keeps its contrast) and dark stays dark. Strength: gold .40 < diamond .69 < prismatic 1 (fully blood red)
let __BLOOD = 0
const BLOOD_RAMP = [[0, [0, 0, 0]], [0.2, [70, 3, 12]], [0.48, [196, 18, 36]], [0.76, [255, 112, 104]], [1, [255, 226, 220]]]
const BLOOD_K = { gold: 0.4, diamond: 0.69, prismatic: 1 }
const __bloodCache = new Map()
function bloodHex(hex, k) {
  const key = hex + k; let v = __bloodCache.get(key); if (v) return v
  const c = rgb(hex), L = Math.min(1, (0.5 * Math.max(...c) + 0.5 * (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2])) / 255)
  let i = 1; while (i < BLOOD_RAMP.length - 1 && BLOOD_RAMP[i][0] < L) i++
  const [l0, A] = BLOOD_RAMP[i - 1], [l1, B] = BLOOD_RAMP[i], t = (L - l0) / (l1 - l0)
  v = "#" + c.map((x, j) => Math.round(x + (A[j] + (B[j] - A[j]) * t - x) * k).toString(16).padStart(2, "0")).join("")
  __bloodCache.set(key, v); return v
}
function col(hex, a) { return new Color(__BLOOD > 0 && typeof hex === "string" && /^#[0-9A-Fa-f]{6}$/.test(hex) ? bloodHex(hex, __BLOOD) : hex, a) }
function rng(seed) { // mulberry32
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const track = (s) => s.split("").join("\u200A") // hair-space letter-spacing

function dot(ctx, x, y, r, hex, a) {
  ctx.setFillColor(col(hex, a))
  ctx.fillEllipse(new Rect(x - r, y - r, r * 2, r * 2))
}
function seg(ctx, x1, y1, x2, y2, hex, a, w) {
  const p = new Path()
  p.move(new Point(x1, y1))
  p.addLine(new Point(x2, y2))
  ctx.addPath(p)
  ctx.setStrokeColor(col(hex, a))
  ctx.setLineWidth(w)
  ctx.strokePath()
}
// text centred (or left-aligned) on a y line; size ≈ font size in pt
function text(ctx, str, font, size, hex, a, x, y, align, w) {
  ctx.setFont(font)
  ctx.setTextColor(col(hex, a))
  if (align === "left") ctx.setTextAlignedLeft()
  else ctx.setTextAlignedCenter()
  const width = w || 400
  const left = align === "left" ? x : x - width / 2
  ctx.drawTextInRect(str, new Rect(left, y - size * 0.62, width, size * 1.5))
}

const STARLIGHT = [            // champagne → pearl silver → ice-blue → soft violet → champagne gold
  [0.00, "#EDCF8E"], [0.24, "#F4E6C4"], [0.44, "#F3F4FA"], [0.62, "#CFE0FA"], [0.78, "#D9CCF5"], [1.00, "#E9C77C"],
]
function starlightAt(t, pal = STARLIGHT) {
  for (let i = 1; i < pal.length; i++) {
    const [t1, c1] = pal[i], [t0, c0] = pal[i - 1]
    if (t <= t1) return mixHex(c0, c1, smooth((t - t0) / (t1 - t0)))
  }
  return pal[pal.length - 1][1]
}
// ---- ring colour by level: 19 levels (Lv 1 Bronze Recruit → Lv 19 Eternal Legend, from the Rules tab) ----
const even = (...hs) => hs.map((h, i) => [i / (hs.length - 1), h])
const LEVEL_TIERS = [       // from = first level of the tier; tip = twinkle tint; text = "Level N" tint; glow = ring glow alpha
  { from: 0,  name: "Silver",          pal: even("#AEB6C4", "#DDE2EC", "#F3F4FA", "#C9D0DC", "#B4BCCA"), tip: "#F3F4FA", text: "#E3E7EF", glow: 0.05 },
  { from: 3,  name: "Silver-pearl",    pal: STARLIGHT,                                                    tip: "#FFFFFF", text: GOLD_SOFT, glow: 0.06 },
  { from: 6,  name: "Gold",            pal: even("#C99A45", "#E9C877", "#FFD774", "#FFF0C2", "#E9C877"), tip: "#FFF0C2", text: "#F7DD9A", glow: 0.07 },
  { from: 9,  name: "Rose gold",       pal: even("#C98A7A", "#E8B4A0", "#F6D2C4", "#FBE6DA", "#E3A894"), tip: "#FFE6DC", text: "#F4CDBE", glow: 0.07 },
  { from: 12, name: "Sapphire",        pal: even("#3F6FD8", "#5AA8FF", "#8CC4FF", "#CFE6FF", "#5A86E8"), tip: "#DCEBFF", text: "#C8DCFF", glow: 0.08 },
  { from: 14, name: "Amethyst",        pal: even("#7A52E0", "#9B6BFF", "#C3A6FF", "#E2D4FF", "#8A5CE8"), tip: "#EEE6FF", text: "#DCCBFF", glow: 0.08 },
  { from: 16, name: "White-gold glow", pal: even("#E9C877", "#FFF0C2", "#FFFFFF", "#FFF6DA", "#FFD774"), tip: "#FFFFFF", text: "#FFF0C2", glow: 0.11 },
  { from: 19, name: "Prismatic",       pal: even("#FFB0B8", "#FFD774", "#B8F0C8", "#9CC8FF", "#C3A6FF", "#FFB8E8", "#FFD774"), tip: "#FFFFFF", text: GOLD_BRIGHT, glow: 0.11 },
]
const levelTier = (lv) => { let t = LEVEL_TIERS[0]; for (const x of LEVEL_TIERS) if (lv >= x.from) t = x; return t }
function twinkle(ctx, x, y, l, a, hex = "#FFFFFF") {          // 4-point star
  dot(ctx, x, y, l * 0.7, hex, 0.07 * a)
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const p = new Path()
    p.move(new Point(x - dx * l, y - dy * l)); p.addLine(new Point(x + dy * l * 0.11, y + dx * l * 0.11))
    p.addLine(new Point(x + dx * l, y + dy * l)); p.addLine(new Point(x - dy * l * 0.11, y - dx * l * 0.11)); p.closeSubpath()
    fillPath(ctx, p, hex, 0.85 * a)
  }
  dot(ctx, x, y, l * 0.16, "#FFFFFF", a)
}

function glowText(ctx, str, font, size, hex, x, y, align, strength) {
  // soft glow: faint copies on two rings, then the crisp text on top
  for (const [rad, a] of [[0.07, 0.018], [0.035, 0.03]]) {
    for (let i = 0; i < 8; i++) {
      const t = (i / 8) * Math.PI * 2
      text(ctx, str, font, size, hex, a * strength, x + Math.cos(t) * size * rad, y + Math.sin(t) * size * rad, align)
    }
  }
  text(ctx, str, font, size, hex, 1, x, y, align)
}

function fillPath(ctx, p, hex, a) { ctx.addPath(p); ctx.setFillColor(col(hex, a)); ctx.fillPath() }

// ---------------- live data ----------------
// two formats: (a) a "key,value" table (xp, rank, level, next, xpIn, xpNeed, exercise, cooking,
// savings, badges, prismatic, diamond, gold), or (b) the Dashboard tab itself, read by its labels.
function parseCSV(t) {
  const rows = []; let row = [], cell = "", q = false
  for (let i = 0; i < t.length; i++) {
    const ch = t[i]
    if (q) { if (ch === '"' && t[i + 1] === '"') { cell += '"'; i++ } else if (ch === '"') q = false; else cell += ch }
    else if (ch === '"') q = true
    else if (ch === ",") { row.push(cell); cell = "" }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = "" }
    else cell += ch
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  return rows
}
const num = (v) => { const n = parseFloat(String(v).replace(/[^\d.\-]/g, "")); return isFinite(n) ? n : undefined }
function splitRank(s) {
  const m = String(s).trim().match(/^([^\p{L}\p{N}\s]+)\s*(.+)$/u)
  return m ? { rankIcon: m[1], rank: m[2].trim() } : { rank: String(s).trim() }
}
function parseStats(text) {
  if (!text || /<html/i.test(text)) return null
  const rows = parseCSV(text), out = {}
  const KEYS = { xp: "xp", totalxp: "xp", rank: "rank", rankicon: "rankIcon", level: "level", lv: "level", next: "next", nextrank: "next",
    xpin: "xpIn", xpneed: "xpNeed", exercise: "exercise", cooking: "cooking", savings: "savings", badges: "badges",
    traintoday: "trainToday", cooktoday: "cookToday", chaosstate: "chaosState", chaoscover: "chaosCover", chaosnames: "chaosNames",
    chaostiernames: "chaosTierNames", cleansedmedals: "cleansedMedals",
    medals: "badges", medalstotal: "medalsTotal", prismatic: "prismatic", diamond: "diamond", gold: "gold" }
  for (const r of rows) {
    const k = KEYS[String(r[0] || "").toLowerCase().replace(/[^a-z]/g, "")]
    if (k && r[1] !== undefined && r[1] !== "" && !/^#[A-Z]/.test(r[1])) out[k] = r[1]   // skip sheet errors like #N/A
  }
  if (Object.keys(out).length < 3) {                      // (b) Dashboard layout: value sits under its label
    const below = (re) => { for (let i = 0; i < rows.length; i++) for (let j = 0; j < rows[i].length; j++)
      if (re.test(rows[i][j])) return rows[i + 1] && rows[i + 1][j] ? [rows[i + 1][j], rows[i + 2] && rows[i + 2][j]] : null
      return null }
    const any = (re) => { for (const r of rows) for (const c of r) { const m = String(c).match(re); if (m) return m } return null }
    const xp = below(/TOTAL XP/i); if (xp) out.xp = xp[0]
    const rk = below(/CURRENT RANK/i)
    if (rk) { Object.assign(out, splitRank(rk[0])); const lv = String(rk[1] || "").match(/Lv\s*(\d+)/); if (lv) out.level = lv[1] }
    const pr = any(/([\d,]+)\s*\/\s*([\d,]+)\s*XP to\s*(.+?)\s*\(\d+%\)/)
    if (pr) { out.xpIn = pr[1]; out.xpNeed = pr[2]; out.next = splitRank(pr[3]).rank }
    const ex = below(/EXERCISE STREAK/i); if (ex) out.exercise = ex[0]
    const ck = below(/COOKING STREAK/i); if (ck) out.cooking = ck[0]
    const sv = below(/TOTAL SAVINGS RATE/i); if (sv) out.savings = sv[0]
    const bd = any(/badges\s*(\d+)/i); if (bd) out.badges = bd[1]
    for (const [k, e] of [["prismatic", "🌈"], ["diamond", "💎"], ["gold", "🥇"]]) { const m = any(new RegExp(e + "\\s*(\\d+)", "u")); if (m) out[k] = m[1] }
  }
  if (out.rank && !out.rankIcon) Object.assign(out, splitRank(out.rank))
  for (const k of ["xp", "level", "xpIn", "xpNeed", "exercise", "cooking", "savings", "badges", "medalsTotal", "prismatic", "diamond", "gold", "trainToday", "cookToday", "chaosCover", "cleansedMedals"])
    if (out[k] !== undefined) { const n = num(out[k]); if (n === undefined) delete out[k]; else out[k] = n }
  return out.xp !== undefined ? out : null
}
async function loadStats() {
  let cached = null
  try { if (fm.fileExists(cachePath)) cached = JSON.parse(fm.readString(cachePath)) } catch (e) {}
  const fresh = cached && now.getTime() - cached.at < FETCH_MINUTES * 60000
  if (DATA_URL && !fresh) {
    try {
      const req = new Request(DATA_URL)
      req.timeoutInterval = 8
      const s = parseStats(await req.loadString())
      if (s) { cached = { at: now.getTime(), s }; fm.writeString(cachePath, JSON.stringify(cached)); return { s: { ...SNAPSHOT, ...s }, source: "live" } }
    } catch (e) {}
  }
  if (DATA_URL && cached) return { s: { ...SNAPSHOT, ...cached.s }, source: fresh ? "live" : "cache" }
  return { s: { ...SNAPSHOT }, source: "snapshot" }
}

// ---------------- art ----------------
function drawStars(ctx, W, H, count, avoid) {
  const r = rng(STAR_SEED)
  const tints = ["#FFFFFF", "#FFFFFF", "#F3F5FF", "#FFE9CC", "#D6E2FF"]
  for (let i = 0; i < count; i++) {
    const x = r() * W, y = r() * H, s = r(), tint = tints[Math.floor(r() * tints.length)]
    let a = 0.12 + r() * 0.4
    const rad = 0.25 + Math.pow(s, 3) * 0.9
    const dm = Math.hypot(x - avoid.x, y - avoid.y)
    if (dm < avoid.R * 1.05) continue
    if (dm < avoid.R * 2.6) a *= 0.55 + Math.random() * 0.9  // twinkle near the ring
    if (rad > 0.75) dot(ctx, x, y, rad * 2.6, tint, a * 0.12)
    dot(ctx, x, y, rad, tint, clamp(a, 0, 0.85))
  }
}
// avoid: circles {x, y, r} and boxes {x0, y0, x1, y1}; the head and the whole tail must miss them all
function shootingStar(ctx, W, H, avoid) {
  let x, y, ang, len, ok = false
  const hits = (px, py) => avoid.some((a) => a.r !== undefined ? Math.hypot(px - a.x, py - a.y) < a.r
    : px > a.x0 && px < a.x1 && py > a.y0 && py < a.y1)
  for (let tries = 0; tries < 40 && !ok; tries++) {
    x = W * (0.1 + Math.random() * 0.82); y = H * (0.06 + Math.random() * 0.4)
    ang = Math.PI * (1.08 + Math.random() * 0.14)        // heading down-left
    len = 16 + Math.random() * 14
    ok = true
    for (let t = 0; t <= 1 && ok; t += 0.25) {
      const px = x - Math.cos(ang) * len * t, py = y + Math.sin(ang) * len * t
      if (px < 4 || px > W - 4 || py < 4 || hits(px, py)) ok = false
    }
  }
  if (!ok) return                                     // no clean spot: skip it this refresh
  const n = 12
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n
    seg(ctx, x - Math.cos(ang) * len * (1 - t0), y + Math.sin(ang) * len * (1 - t0),
      x - Math.cos(ang) * len * (1 - t1), y + Math.sin(ang) * len * (1 - t1),
      "#FFFFFF", 0.3 * t1 * t1, 0.25 + 0.45 * t1)
  }
  dot(ctx, x, y, 1.8, "#FFFFFF", 0.08)
  dot(ctx, x, y, 0.6, "#FFFFFF", 0.55)
}

// prismatic stroke along a list of points (one segment per step, colour walking the starlight ramp)
function prismLine(ctx, pts, w, t0, t1, a, pal) {
  for (let i = 1; i < pts.length; i++) {
    const t = t0 + (t1 - t0) * (i / (pts.length - 1))
    seg(ctx, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], starlightAt(t, pal), a, w)
  }
}
function arcPts(cx, cy, r, a0, a1, n) {
  return Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] })
}
// ---- badge medals: 9 tiers by badge count (555 = all badges) ----
const MEDAL_TIERS = [0, 10, 25, 50, 100, 200, 300, 400, 555]
const medalTier = (n) => { let t = 0; MEDAL_TIERS.forEach((d, i) => { if (n >= d) t = i }); return t }
const MEDAL_H = [10.5, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 16]
function medal(ctx, x, y, h) {                       // classic medal (kept for reference / other uses)
  const r = h * 0.3, cy = y + h * 0.16
  seg(ctx, x - r * 0.9, y - h * 0.5, x - r * 0.2, cy - r * 0.8, "#9CC8FF", 0.9, h * 0.13)
  seg(ctx, x + r * 0.9, y - h * 0.5, x + r * 0.2, cy - r * 0.8, "#C3A6FF", 0.9, h * 0.13)
  dot(ctx, x, cy, r * 2.2, GOLD, 0.08)
  dot(ctx, x, cy, r, GOLD, 1)
  ctx.setStrokeColor(col("#FFF4D6", 0.7)); ctx.setLineWidth(0.5)
  ctx.strokeEllipse(new Rect(x - r * 0.62, cy - r * 0.62, r * 1.24, r * 1.24))
}
function ring(ctx, x, y, r, hex, a, w) { ctx.setStrokeColor(col(hex, a)); ctx.setLineWidth(w); ctx.strokeEllipse(new Rect(x - r, y - r, r * 2, r * 2)) }
function starPath(x, y, ro, ri, n) {
  const p = new Path()
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + i * Math.PI / n, r = i % 2 ? ri : ro, pt = new Point(x + Math.cos(a) * r, y + Math.sin(a) * r)
    if (i) p.addLine(pt); else p.move(pt)
  }
  p.closeSubpath(); return p
}
function laurel(ctx, x, y, r, hex, a) {             // 4 leaves each side, hugging the lower disc
  for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
    const ang = Math.PI / 2 + side * (0.55 + i * 0.42), lx = x + Math.cos(ang) * r * 1.32, ly = y + Math.sin(ang) * r * 1.32
    lozenge(ctx, lx, ly, r * 0.16, r * 0.28, hex, a)
  }
}
function ribbon(ctx, x, top, cy, r, h, c1, c2) {
  seg(ctx, x - r * 0.9, top, x - r * 0.2, cy - r * 0.8, c1, 0.92, h * 0.13)
  seg(ctx, x + r * 0.9, top, x + r * 0.2, cy - r * 0.8, c2, 0.92, h * 0.13)
}
function badgeMedal(ctx, x, y, u, n) {
  const t = medalTier(n), h = MEDAL_H[t] * u, base = y + 5.5 * u, top = base - h
  const r = h * 0.3, cy = base - r
  switch (t) {
    case 0:                                                          // plain bronze
      seg(ctx, x, top + h * 0.1, x, cy - r * 0.8, "#6B5A4A", 0.85, h * 0.1)
      dot(ctx, x, cy, r, "#A86A3C", 0.9)
      ring(ctx, x, cy, r * 0.62, "#D9A57A", 0.5, 0.4)
      break
    case 1:                                                          // bright bronze + ribbon
      ribbon(ctx, x, top, cy, r, h, "#C8503A", "#E07A4A")
      dot(ctx, x, cy, r * 1.8, "#D08A4E", 0.07)
      dot(ctx, x, cy, r, "#D08A4E", 1)
      ring(ctx, x, cy, r * 0.62, "#F3C9A0", 0.7, 0.5)
      break
    case 2:                                                          // silver
      ribbon(ctx, x, top, cy, r, h, "#4F6FB8", "#8FA8D8")
      dot(ctx, x, cy, r * 1.9, SILVER, 0.08)
      dot(ctx, x, cy, r, "#C9D1DE", 1)
      ring(ctx, x, cy, r * 0.62, "#FFFFFF", 0.75, 0.5)
      dot(ctx, x - r * 0.35, cy - r * 0.35, r * 0.16, "#FFFFFF", 0.8)
      break
    case 3:                                                          // gold with shine
      ribbon(ctx, x, top, cy, r, h, "#9CC8FF", "#C3A6FF")
      dot(ctx, x, cy, r * 2, GOLD, 0.09)
      dot(ctx, x, cy, r, GOLD, 1)
      ring(ctx, x, cy, r * 0.62, "#FFF4D6", 0.7, 0.5)
      twinkle(ctx, x + r * 0.55, cy - r * 0.55, r * 0.75, 0.95)
      break
    case 4:                                                          // gold + laurel wreath
      ribbon(ctx, x, top, cy, r, h, "#9CC8FF", "#C3A6FF")
      dot(ctx, x, cy, r * 2, GOLD, 0.09)
      laurel(ctx, x, cy, r, "#D9B860", 0.95)
      dot(ctx, x, cy, r, GOLD_BRIGHT, 1)
      ring(ctx, x, cy, r * 0.62, "#FFF4D6", 0.75, 0.5)
      twinkle(ctx, x + r * 0.55, cy - r * 0.55, r * 0.75, 0.95)
      break
    case 5:                                                          // sapphire gem
      ribbon(ctx, x, top, cy, r, h, "#3F6FD8", "#8CC4FF")
      dot(ctx, x, cy, r * 2.1, "#5AA8FF", 0.1)
      laurel(ctx, x, cy, r, "#D9B860", 0.9)
      dot(ctx, x, cy, r, GOLD, 1)
      dot(ctx, x, cy, r * 0.8, "#2F5FD0", 1)
      lozenge(ctx, x, cy, r * 0.42, r * 0.58, "#8CC4FF", 1)
      lozenge(ctx, x - r * 0.1, cy - r * 0.15, r * 0.14, r * 0.22, "#E9F4FF", 0.95)
      twinkle(ctx, x - r * 1.5, cy - r * 1.1, r * 0.55, 0.9); twinkle(ctx, x + r * 1.45, cy - r * 0.2, r * 0.45, 0.85)
      break
    case 6:                                                          // violet crystal + glow
      ribbon(ctx, x, top, cy, r, h, "#7A52E0", "#C3A6FF")
      for (let i = 0; i < 3; i++) dot(ctx, x, cy, r * (1.5 + 0.45 * i), "#9B6BFF", 0.07)
      laurel(ctx, x, cy, r, "#E9C877", 0.9)
      dot(ctx, x, cy, r, GOLD_SOFT, 1)
      dot(ctx, x, cy, r * 0.8, "#6A44D0", 1)
      lozenge(ctx, x, cy, r * 0.36, r * 0.72, "#D9CCF5", 1)
      lozenge(ctx, x - r * 0.08, cy - r * 0.22, r * 0.12, r * 0.28, "#FFFFFF", 0.95)
      twinkle(ctx, x - r * 1.5, cy - r * 1.1, r * 0.55, 0.9); twinkle(ctx, x + r * 1.45, cy - r * 0.2, r * 0.45, 0.85)
      break
    case 7:                                                          // white-gold star with rays
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2, r0 = r * 1.15, r1 = r * (i % 2 ? 1.6 : 1.95)
        seg(ctx, x + Math.cos(a) * r0, cy + Math.sin(a) * r0, x + Math.cos(a) * r1, cy + Math.sin(a) * r1, GOLD_SOFT, 0.75, 0.5)
      }
      ribbon(ctx, x, top, cy, r, h, "#F4E2B0", "#FFFFFF")
      for (let i = 0; i < 3; i++) dot(ctx, x, cy, r * (1.4 + 0.35 * i), GOLD, 0.06)
      dot(ctx, x, cy, r, "#FFF0C2", 1)
      ring(ctx, x, cy, r * 0.88, GOLD, 0.9, 0.5)
      fillPath(ctx, starPath(x, cy, r * 0.62, r * 0.27, 5), GOLD_BRIGHT, 1)
      twinkle(ctx, x + r * 1.5, cy - r * 1.2, r * 0.55, 0.95)
      break
    default: {                                                       // 555: prismatic crown
      for (let i = 0; i < 3; i++) dot(ctx, x, cy, r * (1.5 + 0.45 * i), i % 2 ? "#C3A6FF" : GOLD, 0.07)
      ctx.setStrokeColor(col(GOLD_SOFT, 0.8)); ctx.setLineWidth(0.6)            // gold halo
      ctx.strokeEllipse(new Rect(x - r * 1.3, top - r * 0.45, r * 2.6, r * 0.7))
      ribbon(ctx, x, top + h * 0.12, cy, r, h, "#9CC8FF", "#C3A6FF")
      laurel(ctx, x, cy, r, GOLD_BRIGHT, 0.95)
      dot(ctx, x, cy, r, "#9CC8FF", 1)
      dot(ctx, x, cy, r * 0.8, "#C3A6FF", 1)
      dot(ctx, x, cy, r * 0.6, GOLD_BRIGHT, 1)
      fillPath(ctx, starPath(x, cy, r * 0.44, r * 0.19, 5), "#FFFFFF", 1)
      const ct = cy - r * 1.02, cw = r * 0.85, crown = new Path()                // crown on the rim
      crown.move(new Point(x - cw, ct)); crown.addLine(new Point(x - cw, ct - r * 0.5)); crown.addLine(new Point(x - cw * 0.5, ct - r * 0.22))
      crown.addLine(new Point(x, ct - r * 0.7)); crown.addLine(new Point(x + cw * 0.5, ct - r * 0.22)); crown.addLine(new Point(x + cw, ct - r * 0.5))
      crown.addLine(new Point(x + cw, ct)); crown.closeSubpath(); fillPath(ctx, crown, GOLD_BRIGHT, 1)
      dot(ctx, x, ct - r * 0.7, r * 0.1, "#FFFFFF", 1)
      twinkle(ctx, x - r * 1.6, cy - r * 1.3, r * 0.65, 1); twinkle(ctx, x + r * 1.55, cy - r * 0.4, r * 0.5, 0.95)
      lozenge(ctx, x + r * 1.3, top + r * 0.2, r * 0.13, r * 0.26, "#F3F4FA", 0.95)
    }
  }
  return h
}
function shield(ctx, x, y, h, emoji) {                      // knight's crest, prismatic outline
  const w = h * 0.82, top = y - h / 2
  const pts = []
  pts.push([x, top + h * 0.04])
  for (let i = 0; i <= 6; i++) pts.push([x + (w / 2) * (i / 6), top + h * 0.04 + h * 0.06 * Math.sin(Math.PI * i / 6) * 0 + (i === 6 ? h * 0.1 : h * 0.1 * (i / 6) * (i / 6))])
  for (let i = 1; i <= 10; i++) { const t = i / 10; pts.push([x + (w / 2) * Math.cos(t * Math.PI / 2) ** 0.9, top + h * 0.1 + (h * 0.9) * Math.sin(t * Math.PI / 2) ** 1.3]) }
  const full = pts.concat(pts.slice(0, -1).reverse().map(([px, py]) => [2 * x - px, py]))
  const p = new Path(); p.move(new Point(full[0][0], full[0][1])); full.slice(1).forEach(([px, py]) => p.addLine(new Point(px, py))); p.closeSubpath()
  fillPath(ctx, p, "#0B0D1A", 0.55)
  prismLine(ctx, full, h * 0.07 + 1.2, 0, 1, 0.12)
  prismLine(ctx, full, h * 0.035, 0, 1, 0.95)
  if (emoji) text(ctx, emoji, Font.systemFont(h * 0.42), h * 0.42, "#FFFFFF", 1, x, y + h * 0.02, "center")
  else twinkle(ctx, x, y + h * 0.02, h * 0.3, 0.95)
}
// ---- streak flames: 9 tiers that grow with the streak (anything past 888 keeps the 888 look) ----
const FLAME_TIERS = [0, 10, 20, 50, 100, 150, 200, 250, 300, 365, 400, 450, 500, 555, 600, 666, 700, 777, 888]   // G 14: each number is where a tier STARTS (700-776 = 700 design, 888+ = final); 1-9 days = base design 0; the shown streak keeps counting
const flameTier = (days) => { let t = 0; FLAME_TIERS.forEach((d, i) => { if (days >= d) t = i }); return t }
const FLAME_H = [8.5, 11, 12, 12.5, 13, 13.5, 14, 14.5, 16]          // icon height per tier, in widget points (× u)
function flameLayer(ctx, x, y, h, hex, a) {          // one teardrop; y = vertical centre
  const p = new Path()
  p.move(new Point(x, y + h * 0.5))
  p.addCurve(new Point(x + h * 0.04, y - h * 0.5), new Point(x - h * 0.46, y + h * 0.42), new Point(x - h * 0.26, y - h * 0.12))
  p.addCurve(new Point(x, y + h * 0.5), new Point(x + h * 0.3, y - h * 0.18), new Point(x + h * 0.46, y + h * 0.42))
  p.closeSubpath(); fillPath(ctx, p, hex, a)
}
function flame(ctx, x, y, h, hex, inner) {           // classic two-layer flame
  dot(ctx, x, y + h * 0.12, h * 0.75, hex, 0.07)
  flameLayer(ctx, x, y, h, hex, 0.95)
  flameLayer(ctx, x, y + h * 0.2, h * 0.52, inner, 0.95)
}
function sparks(ctx, x, y, h, hex, n, seed) {
  const r = rng(seed)
  for (let i = 0; i < n; i++) dot(ctx, x + (r() - 0.5) * h * 0.9, y - h * (0.45 + r() * 0.35), h * (0.035 + r() * 0.035), hex, 0.7 + r() * 0.3)
}
// ---- realistic fire: layered teardrop tongues, white-yellow core → orange → red edge, soft glow, embers, haze ----
// palette order: outer edge → … → core.  TRAIN = hotter orange-red · COOK = warmer gold-amber
// streak flames: 19 designs = base (1-9 days) + the 18 tiers in FLAME_TIERS. Palette outer edge -> core.
const FLAME_NAMES = ["Kindling", "Ember", "Spark", "Flame", "Blaze", "Furnace", "Blue Fire", "Cobalt", "Violet", "Solstice", "Solar", "Radiant", "Prism", "Aurora", "Nova", "Nebula", "Pulsar", "Ascendant", "Celestial Inferno"]
const FP_TRAIN = [["#7A0B10", "#CF2414", "#FF4F18", "#FF8A26", "#FFC14A", "#FFF3B8"], ["#780A12", "#D42014", "#FF4A14", "#FF8A22", "#FFCB55", "#FFF6C8"], ["#6E0912", "#D81C14", "#FF4412", "#FF8F20", "#FFD060", "#FFFBE0"], ["#8A1010", "#E83A14", "#FF6A1A", "#FFA030", "#FFE08A", "#FFFFFF"]]
const FP_COOK = [["#7C4A12", "#BE7219", "#E99A27", "#FFBE40", "#FFE08A", "#FFF8DA"], ["#7C4A12", "#C47A1A", "#EBA02A", "#FFC444", "#FFE49A", "#FFFAE0"], ["#7A4A10", "#C98418", "#F0AA28", "#FFCB48", "#FFEBA8", "#FFFDF0"], ["#8A5A12", "#D49020", "#F6B632", "#FFD25A", "#FFF0B8", "#FFFFFF"]]
const FP_HI = [   // shared from Blue Fire up; the two outer layers take a family rim (train crimson / cook amber)
  ["#2338B8", "#3F7CFF", "#8CC4FF", "#DCEEFF", "#FFFFFF"],      // 6 blue
  ["#1A2A9A", "#2F5CE8", "#6AA8FF", "#CFE6FF", "#FFFFFF"],      // 7 cobalt
  ["#5A2CC8", "#9468FF", "#C3A6FF", "#EADFFF", "#FFFFFF"],      // 8 violet
  ["#7A4CE0", "#A07CFF", "#E2D4FF", "#FFF0C2", "#FFFFFF"],      // 9 solstice (violet + gold core)
  ["#E8944A", "#FFC05A", "#FFE2A0", "#FFF4D8", "#FFFFFF"],      // 10 solar white-gold
  ["#F0A850", "#FFD070", "#FFEBB8", "#FFF8E8", "#FFFFFF"],      // 11 radiant
  ["#EE8A5A", "#F6C46A", "#B8E8C0", "#CFE0FF", "#FFFFFF"],      // 12 prism (iridescent)
  ["#3CC8A0", "#5AA8FF", "#A07CFF", "#F7A8D8", "#FFE9C8"],      // 13 aurora
  ["#C23CA8", "#FF7AA0", "#FFC27A", "#FFF0C8", "#FFFFFF"],      // 14 nova
  ["#5A6AF0", "#A77CFF", "#F4A8E0", "#F4E2B0", "#FFFFFF"],      // 15 nebula
  ["#3AB8F0", "#9CE0FF", "#D8C8FF", "#FFF0D8", "#FFFFFF"],      // 16 pulsar
  ["#E0B050", "#FFE08A", "#FFF0C8", "#E8F0FF", "#FFFFFF"],      // 17 ascendant
  ["#7A5AF0", "#C3A6FF", "#9CC8FF", "#F4E2B0", "#FFFFFF"]]      // 18 celestial inferno
const RIM = { train: ["#6A1030", "#B0204A"], cook: ["#6A4C10", "#B07A18"] }
const firePal = (kind, T) => {
  if (T < 6) return (kind === "cook" ? FP_COOK : FP_TRAIN)[T <= 1 ? 0 : T === 2 ? 1 : T === 3 ? 1 : T === 4 ? 2 : 3]
  const h = FP_HI[T - 6], rim = RIM[kind] || RIM.train
  return [rim[0], mixHex(rim[1], h[0], T >= 12 ? 0.55 : 0.35), h[0], h[1], h[3], h[4]]
}
const MAINS = {
  1: [[0, 1, 0]],
  2: [[-0.13, 0.84, -0.12], [0.1, 1, 0.1]],
  3: [[-0.21, 0.76, -0.2], [0.21, 0.7, 0.2], [0, 1, 0]],
  3.5: [[-0.22, 0.86, -0.12], [0.22, 0.86, 0.12], [0, 1.06, 0]],
  5: [[-0.42, 0.6, -0.22], [-0.23, 0.86, -0.12], [0.23, 0.86, 0.12], [0.42, 0.6, 0.22], [0, 1.12, 0]],
  7: [[-0.62, 0.46, -0.28], [-0.42, 0.66, -0.2], [-0.21, 0.9, -0.1], [0.21, 0.9, 0.1], [0.42, 0.66, 0.2], [0.62, 0.46, 0.28], [0, 1.16, 0]],
}
// per-design: m = main flames, side = small tongues, spark = embers, glow, halo (1 ring, 2 prismatic ring, 3 double ring), rays, aura, crown = circlet flames
const FIRE_SPEC = [
  { m: 1, side: 0, spark: 1, glow: 0.8, hs: 0.84 },                                   // 0   1-9 days Kindling
  { m: 1, side: 1, spark: 2, glow: 0.95 },                                            // 1   10 Ember
  { m: 1, side: 2, spark: 3, glow: 1.05 },                                            // 2   20 Spark
  { m: 2, side: 2, spark: 3, glow: 1.15 },                                            // 3   50 Flame (twin)
  { m: 3, side: 2, spark: 5, glow: 1.3 },                                             // 4   100 Blaze
  { m: 3, side: 3, spark: 6, glow: 1.45 },                                            // 5   150 Furnace
  { m: 3, side: 2, spark: 5, glow: 1.4 },                                             // 6   200 Blue Fire
  { m: 3.5, side: 3, spark: 6, glow: 1.5, halo: 1 },                                  // 7   250 Cobalt
  { m: 3.5, side: 3, spark: 6, glow: 1.5, halo: 1 },                                  // 8   300 Violet
  { m: 3.5, side: 4, spark: 7, glow: 1.55, halo: 1, rays: 4 },                        // 9   365 Solstice
  { m: 3.5, side: 4, spark: 6, glow: 1.6, halo: 1, rays: 4 },                         // 10  400 Solar
  { m: 5, side: 4, spark: 8, glow: 1.6, halo: 1, rays: 6 },                           // 11  450 Radiant
  { m: 3.5, side: 4, spark: 8, glow: 1.6, halo: 2, rays: 6 },                         // 12  500 Prism
  { m: 5, side: 4, spark: 10, glow: 1.7, halo: 2, rays: 6 },                          // 13  555 Aurora
  { m: 5, side: 4, spark: 10, glow: 1.8, halo: 2, rays: 8, aura: 1 },                 // 14  600 Nova
  { m: 5, side: 4, spark: 12, glow: 1.9, halo: 2, rays: 8, aura: 1 },                 // 15  666 Nebula
  { m: 5, side: 4, spark: 12, glow: 1.9, halo: 3, rays: 8, aura: 1 },                 // 16  700 Pulsar
  { m: 7, side: 4, spark: 14, glow: 2.0, halo: 3, rays: 8, aura: 1, crown: 3 },       // 17  777 Ascendant
  { m: 7, side: 4, spark: 18, glow: 2.2, halo: 3, rays: 10, aura: 2, crown: 5 },      // 18  888 Celestial Inferno
]
const FIRE_HUES = ["#FF8FA8", "#FFC27A", "#FFE9A8", "#B8F0C8", "#9CC8FF", "#C3A6FF"]
const fireSeed = () => (Math.floor(now.getTime() / 600000))
function tonguePath(x, b, h, w, lean, kink) {       // teardrop standing on y = b: round belly, S-curved tip at b - h, bending sideways by lean × h
  const p = new Path(), tx = x + lean * h
  p.move(new Point(x, b + h * 0.035))
  p.addCurve(new Point(tx, b - h), new Point(x - w * 1.45, b + h * 0.03), new Point(x - w * 0.55 + lean * h * 0.15, b - h * (0.56 + kink)))
  p.addCurve(new Point(x, b + h * 0.035), new Point(x + w * 0.45 + lean * h * 0.85, b - h * (0.44 - kink)), new Point(x + w * 1.45, b + h * 0.03))
  p.closeSubpath(); return p
}
function mainFlame(ctx, x, b, h, w, lean, pal, pre) {
  const sc = [1, 0.85, 0.69, 0.53, 0.37, 0.21]
  fillPath(ctx, tonguePath(x, b, h * 1.07, w * 1.2, lean, 0.05), pal[0], 0.2)
  sc.forEach((k, i) => fillPath(ctx, tonguePath(x, b - h * 0.03 * i, h * k, w * (0.25 + 0.75 * k), lean * (1 - i * 0.16), 0.05), pal[i], i < 2 ? 0.97 : 1))
}
function fire(ctx, x, b, h, kind, tier, seed, lit) {
  const T = Math.max(0, Math.min(18, tier)), pal = firePal(kind || "train", T), sp = FIRE_SPEC[T], mains = MAINS[h < 24 ? Math.min(sp.m, 3.5) : sp.m].map(([dx, hs, ln]) => [dx, hs * (sp.hs || 1), ln]), r = rng(seed * 97 + 13)
  if (!lit) {                                                      // unlit: cold outline + one dim ember at the base
    strokeP(ctx, tonguePath(x, b, h * 0.9, h * 0.25, 0.04, 0.02), SILVER, 0.3, Math.max(0.6, h * 0.045))
    dot(ctx, x, b - h * 0.1, h * 0.22, pal[1], 0.06); dot(ctx, x, b - h * 0.1, h * 0.085, pal[2], 0.5); dot(ctx, x, b - h * 0.1, h * 0.04, pal[4], 0.9)
    return
  }
  const big = h >= 24, cy = b - h * 0.45, w = h * 0.31
  // aura + glow (many faint rings, so no banding)
  if (sp.aura) for (let i = 0; i < 8; i++) dot(ctx, x, cy, h * (1.7 - i * 0.14) * (sp.aura > 1 ? 1.15 : 1), pal[1], (0.016 + i * 0.004) * sp.aura)
  for (let i = 0; i < 10; i++) dot(ctx, x, b - h * 0.42, h * (1.1 - i * 0.085) * (0.8 + sp.glow * 0.25), pal[2], (0.012 + i * 0.0035) * Math.min(1.6, sp.glow))
  dot(ctx, x, b - h * 0.25, h * 0.36, pal[3], 0.05)
  // light spokes behind the flame
  if (sp.rays && big) for (let k = 0; k < sp.rays; k++) {
    const an = -Math.PI / 2 + (k - (sp.rays - 1) / 2) * (Math.PI * 1.55 / sp.rays) + 0.1, r0 = h * 0.62, r1 = h * (k % 2 ? 0.92 : 1.12)
    seg(ctx, x + Math.cos(an) * r0, cy + Math.sin(an) * r0, x + Math.cos(an) * r1, cy + Math.sin(an) * r1, pal[4], 0.3, Math.max(0.6, h * 0.018))
  }
  // halo ring(s)
  if (sp.halo) {
    const rr = h * (big ? 0.92 : 0.54), segs = sp.halo >= 2 ? 36 : 1
    if (segs === 1) arcStroke(ctx, x, cy, rr, 0, Math.PI * 2, pal[3], 0.34, Math.max(0.5, h * 0.02))
    else for (let k = 0; k < segs; k++) {
      const a0 = k / segs * Math.PI * 2, a1 = (k + 1.15) / segs * Math.PI * 2
      arcStroke(ctx, x, cy, rr, a0, a1, mixHex(FIRE_HUES[Math.floor(k / segs * 6)], FIRE_HUES[(Math.floor(k / segs * 6) + 1) % 6], (k / segs * 6) % 1), 0.55, Math.max(0.6, h * 0.026))
    }
    if (sp.halo >= 3) arcStroke(ctx, x, cy, rr * 1.12, 0, Math.PI * 2, pal[4], 0.16, Math.max(0.4, h * 0.012))
  }
  // heat haze
  if (big) for (let k = 0; k < 2; k++) {
    const hx = x + (k ? 1 : -1) * h * 0.14, y0 = b - h * 1.0, pts = []
    for (let j = 0; j <= 12; j++) pts.push([hx + Math.sin(j * 0.62 + k * 2.2 + r() * 0.5) * h * 0.07, y0 - j * h * 0.04])
    for (let j = 1; j < pts.length; j++) seg(ctx, pts[j - 1][0], pts[j - 1][1], pts[j][0], pts[j][1], pal[3], 0.02 * (1 - j / 13), Math.max(0.8, h * 0.16))
  }
  // side tongues
  const sideAll = [[-0.2, 0.74, -0.16 - r() * 0.08], [0.22, 0.6, 0.17 + r() * 0.08], [-0.34, 0.5, -0.24], [0.36, 0.44, 0.24]].slice(0, sp.side)
  for (const [dx, hs, ln] of sideAll) {
    const tx = x + dx * h, th = h * hs
    fillPath(ctx, tonguePath(tx, b, th, w * 0.8, ln, 0.04), pal[0], 0.92)
    fillPath(ctx, tonguePath(tx, b - th * 0.02, th * 0.8, w * 0.62, ln * 0.85, 0.04), pal[1], 0.96)
    fillPath(ctx, tonguePath(tx, b - th * 0.04, th * 0.56, w * 0.4, ln * 0.7, 0.03), pal[2], 0.96)
  }
  // main flames: outermost first, tallest (centre) on top
  const order = mains.map((m, i) => [m, i]).sort((p, q) => Math.abs(q[0][0]) - Math.abs(p[0][0]))
  for (const [[dx, hs, ln]] of order) mainFlame(ctx, x + dx * h, b, h * hs, w * (hs > 0.9 ? 1 : 0.88), ln + (r() - 0.5) * 0.05, pal)
  // crown at the top tier: a small circlet of flames riding the halo
  if (sp.crown && big) for (let k = -(sp.crown >> 1); k <= (sp.crown >> 1); k++) {
    const an = -Math.PI / 2 + k * 0.42, rr = h * 0.92 * 1.12, cx0 = x + Math.cos(an) * rr, cy0 = cy + Math.sin(an) * rr, ch = h * (k === 0 ? 0.2 : 0.14 - Math.abs(k) * 0.012)
    fillPath(ctx, tonguePath(cx0, cy0 + ch * 0.2, ch, ch * 0.32, k * 0.1, 0.03), "#F4C75A", 0.95)
    fillPath(ctx, tonguePath(cx0, cy0 + ch * 0.25, ch * 0.55, ch * 0.2, k * 0.08, 0.03), "#FFF6DA", 1)
  }
  // rising embers
  const cap = big ? sp.spark : Math.min(sp.spark, 2 + Math.floor(T / 4)), n = cap
  const pc = T >= 12 ? FIRE_HUES : null
  for (let i = 0; i < n; i++) {
    let f = (i + 0.5 + r() * 0.5) / n, ex = x + (r() - 0.5) * h * (0.7 + mains.length * 0.12), ey = b - h * (1.08 + f * (big ? 0.5 : 0.17)) - r() * h * 0.05, sz = h * (0.026 + r() * 0.026) * (1 - f * 0.4)
    if (__EMBER_TOP != null && ey < __EMBER_TOP) ey = __EMBER_TOP - r() * h * 0.03                // v13.9: stacked tiles keep the embers clear of the label above
    const c = pc ? pc[i % 6] : (i % 2 ? pal[4] : pal[3])
    dot(ctx, ex, ey, sz * 2.6, c, 0.07 * (1 - f * 0.5)); dot(ctx, ex, ey, sz, c, 0.95 - f * 0.4)
  }
  if (T >= 10 && big) twinkle(ctx, x + h * 0.62, b - h * 0.95, h * 0.16, 0.9, pal[4])
  if (T >= 17) { twinkle(ctx, x - h * 0.58, b - h * 1.1, h * 0.14, 0.8); twinkle(ctx, x, b - h * 1.5, h * 0.2, 0.95, "#FFF3C8") }
}
const FLAME_H2 = [11, 11.8, 12.4, 13, 13.8, 14.4, 15, 15.4, 15.8, 16.2, 16.5, 16.8, 17.1, 17.4, 17.7, 18, 18.3, 18.7, 19.5]
function streakFlame(ctx, x, y, u, days, kind) {         // x = icon centre, y = number's centre line → every flame stands on y + 6.8u
  const t = flameTier(days), h = FLAME_H2[t] * u
  fire(ctx, x, y + 6.8 * u, h, kind, t, (days * 7 + (kind === "train" ? 1 : 2)) + fireSeed(), days > 0)
  return h
}
// stat numbers: gold from tier 3, glowing from tier 6, bright glow at the top tier
function tierNumber(ctx, str, t, x, y, u) {
  const f = FUT(false, 11.5 * u)
  if (t >= 8) glowText(ctx, str, FUT(true, 11.5 * u), 11.5 * u, GOLD_BRIGHT, x, y, "left", 1.6)
  else if (t >= 6) glowText(ctx, str, f, 11.5 * u, GOLD_BRIGHT, x, y, "left", 1)
  else text(ctx, str, f, 11.5 * u, t >= 3 ? GOLD : GOLD_SOFT, 0.97, x, y, "left", 40 * u)
}
function streakNumber(ctx, v, x, y, u) { const t = flameTier(v); tierNumber(ctx, String(v), t >= 18 ? 8 : t >= 10 ? 6 : t >= 4 ? 3 : 0, x, y, u) }   // number styling: gold from 100 days, glow from 400, bright at 888
function badgeNumber(ctx, v, x, y, u) { tierNumber(ctx, String(v), medalTier(v), x, y, u) }
// v13.5 borderless panel: a soft dark haze behind the text only, built from stacked rounded layers so it fades out with no visible edge
function softBackdrop(ctx, x, y, w, h, u, tint) {
  const N = 14, pad = 6 * u, step = 1.7 * u
  for (let k = 0; k < N; k++) {
    const d = -pad + k * step, xx = x + d, yy = y + d, ww = w - 2 * d, hh = h - 2 * d
    if (ww <= 0 || hh <= 0) break
    fillPath(ctx, rrPath(xx, yy, ww, hh, Math.min(ww, hh) * 0.28), "#000000", 0.024)
    if (tint && k > 3) fillPath(ctx, rrPath(xx, yy, ww, hh, Math.min(ww, hh) * 0.28), tint, 0.006)
  }
}
// frosted-glass panel: faint fill, hairline border, a bright top edge that fades out, soft inner shade at the bottom
function glass(ctx, x, y, w, h, r, hex, a) {
  fillPath(ctx, rrPath(x, y, w, h, r), "#FFFFFF", 0.03 * (a || 1))
  fillPath(ctx, rrPath(x + 0.5, y + h * 0.55, w - 1, h * 0.45 - 0.5, r), "#000000", 0.12)
  strokeP(ctx, rrPath(x, y, w, h, r), hex || "#FFFFFF", 0.15 * (a || 1), 0.55)
  for (let i = 0; i < 12; i++) { const f = i / 12; seg(ctx, x + r + (w - 2 * r) * (0.5 - 0.5 * (1 - f)), y + 0.45, x + r + (w - 2 * r) * (0.5 + 0.5 * (1 - f)), y + 0.45, "#FFFFFF", 0.022 + 0.01 * f, 0.7) }
}
function statPanel(ctx, cx, gap, y0, y1, u) {           // one glass bar under the ring: 2 equal cells (train | cook) centred on the ring's axis
  glass(ctx, cx - gap * 1.5, y0, gap * 3, y1 - y0, 9 * u)
  const a0 = y0 + 4 * u, a1 = y0 + 24 * u, n = 10           // subtle centre divider beside the numbers only: a hairline that fades out at both ends
  for (let i = 0; i < n; i++) { const f = 1 - Math.abs((i + 0.5) / n * 2 - 1); seg(ctx, cx, a0 + (a1 - a0) * i / n, cx, a0 + (a1 - a0) * (i + 1) / n, "#FFFFFF", 0.03 + 0.11 * f, 0.5) }
}
// v11 aligned stat cells. Every cell has ONE centre axis (cx ± 0.75·gap, mirrored around the divider):
//   row 1 = [flame][3.5pt][number]   centred by measured width; flame visible height ≈ number cap height, both centred on the cap line
//   row 2 = [badge][label]            centred by measured width; the trailing ✓ / dot hangs outside the centring
// Futura metrics (checked on the phone screenshot): cap height 0.69em, cap centre 0.25em above the text() y line; digits are drawn in
// fixed 0.56em slots (tabular) so 1-, 2- and 3-digit streaks stay centred. Labels: tracked caps ≈ 0.6em per letter (TRAIN 3.0em, COOK 3.0em).
const RING_MED = { x: 92, y: 85, r: 52, k: 52 / 41 }          // v12 medium ring: centred in the left area (0-184u), 27% bigger
const NUM = { fz: 11.5, cap: 0.69, capOff: 0.245, slot: 0.56, ink: 0.47 }
const LABEL_EM = { TRAIN: 3.0, COOK: 3.0 }
// measured flame ink (in units of fire()'s h): visible top above the base, and visible width, per flame tier
const FL_TOP = (t) => t <= 3 ? 0.78 : t <= 16 ? 1.2 : 1.55
const FL_W = (t) => t <= 2 ? 0.32 : t === 3 ? 0.5 : t <= 9 ? 0.68 : t <= 11 ? 0.84 : 1.13
function digitsAt(ctx, str, t, x0, yc, u) {                     // draw str left-to-right in tabular slots; x0 = left ink edge, yc = cap centre
  const Q = typeof __QNF === "undefined" ? null : __QNF, fz = NUM.fz * u, sl = (Q ? Q.slot : NUM.slot) * fz, y = yc + (Q ? Q.off : NUM.capOff) * fz   // v13.14: questFont digits, still tabular
  const f = Q ? Q.num(t >= 3, fz) : t >= 8 ? FUT(true, fz) : FUT(false, fz), hex = t >= 6 ? GOLD_BRIGHT : t >= 3 ? GOLD : GOLD_SOFT
  str.split("").forEach((ch, i) => {
    const x = x0 + (Q ? Q.ink : NUM.ink) * fz / 2 + i * sl
    if (t >= 6) glowText(ctx, ch, f, fz, hex, x, y, "center", t >= 8 ? 1.6 : 1)
    else text(ctx, ch, f, fz, hex, 0.97, x, y, "center", 40 * u)
  })
}
const numInkW = (str, u) => { const Q = typeof __QNF === "undefined" ? null : __QNF; return ((str.length - 1) * (Q ? Q.slot : NUM.slot) + (Q ? Q.ink : NUM.ink)) * NUM.fz * u }
function statRow(ctx, s, cx, y, gap, u, plain) {
  const yc = y - 1.5 * u, capH = NUM.cap * NUM.fz * u, ly = yc + 11.5 * u   // number cap centre, label cap centre
  const items = [["train", s.exercise, "TRAIN"], ["cook", s.cooking, "COOK"]]
  const q = LIVE.quest ? questState() : null
  items.forEach(([kind, v, label], i) => {
    const x = cx + (i ? 0.75 : -0.75) * gap, T = flameTier(v), str = String(v)
    const top = FL_TOP(T), vis = capH * (1 + 0.025 * Math.min(T, 14)), h = vis / top, fw = FL_W(T) * h, gp = 3.5 * u
    const left = x - (fw + gp + numInkW(str, u)) / 2
    fire(ctx, left + fw / 2, yc + vis / 2, h, kind, T, (v * 7 + (kind === "train" ? 1 : 2)) + fireSeed(), v > 0)
    digitsAt(ctx, str, T >= 18 ? 8 : T >= 10 ? 6 : T >= 4 ? 3 : 0, left + fw + gp, yc, u)
    if (q && !plain) questLabel(ctx, kind, label, x, ly, u, q.a[i], QPAL(q.n))
    else text(ctx, track(label), FUT(false, 5.2 * u), 5.2 * u, SILVER, 0.5, x, ly + 0.245 * 5.2 * u, "center", 60 * u)
  })
}
// savings rate as "+2.50% P.A." (2 decimals, 3 only when the value needs them)
function fmtSavings(v) {
  v = Number(v) || 0
  const d = Math.abs(v * 100 - Math.round(v * 100)) > 1e-6 ? 3 : 2
  return `${v < 0 ? "−" : "+"}${Math.abs(v).toFixed(d)}% P.A.`
}
const fmtNum = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
function statusDot(ctx, W, u, source) {
  const hex = source === "live" ? GOLD_BRIGHT : source === "cache" ? SILVER : "#8A90A0"
  dot(ctx, W - 13 * u, 13 * u, 3 * u, hex, 0.12); dot(ctx, W - 13 * u, 13 * u, 1.1 * u, hex, source === "snapshot" ? 0.45 : 0.9)
}

// ---------------- ring variants (STYLE "ring2" … "ring8") ----------------
const STREAK_GOAL = 10                            // ring3: a full inner arc = this many days (the sheet's next streak bonus)
function lozenge(ctx, x, y, w, h, hex, a) {
  const p = new Path()
  p.move(new Point(x, y - h)); p.addLine(new Point(x + w, y)); p.addLine(new Point(x, y + h)); p.addLine(new Point(x - w, y)); p.closeSubpath()
  fillPath(ctx, p, hex, a)
}
function arcStroke(ctx, cx, cy, r, a0, a1, hex, a, w) {
  const n = Math.max(2, Math.ceil(Math.abs(a1 - a0) / (Math.PI * 2) * 72))
  const pts = arcPts(cx, cy, r, a0, a1, n)
  for (let i = 1; i < pts.length; i++) seg(ctx, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], hex, a, w)
}
function planet(ctx, x, y, r) {                     // small gold world, lit from the upper left, with a thin ring
  dot(ctx, x, y, r * 3, GOLD, 0.07); dot(ctx, x, y, r * 1.8, GOLD, 0.1)
  dot(ctx, x, y, r, "#9C7A3A", 1)
  for (let i = 0; i < 6; i++) dot(ctx, x - r * 0.07 * i, y - r * 0.07 * i, r * (0.92 - i * 0.13), mixHex(GOLD, "#FFF6DA", i / 5), 0.55)
  ctx.setStrokeColor(col(GOLD_SOFT, 0.75)); ctx.setLineWidth(0.6)
  ctx.strokeEllipse(new Rect(x - r * 1.7, y - r * 0.42, r * 3.4, r * 0.84))
  dot(ctx, x - r * 0.2, y - r * 0.05, r * 0.55, mixHex(GOLD, "#FFF6DA", 0.6), 0.5)        // re-cover the ring's back half
}
function centreXP(ctx, s, cx, cy, u, pct, size, top, font) {
  if (top) text(ctx, track(top), Font.semiboldSystemFont(6.4 * u), 6.4 * u, GOLD_SOFT, 0.75, cx, cy - size * (font ? 0.85 : 0.68), "center")
  glowText(ctx, fmtNum(s.xp), font || FS.hero(size * FS.heroK), size, GOLD, cx, cy + 1 * u, "center", 1.2)
  text(ctx, track(`XP · ${Math.round(pct * 100)}%`), Font.semiboldSystemFont(6.4 * u), 6.4 * u, SILVER, 0.55, cx, cy + size * 0.75, "center")
}
function levelLine(ctx, s, cx, y, u) { glowText(ctx, `Level ${s.level}`, FS.level(13 * u * FS.levelK), 13 * u, GOLD_SOFT, cx, y, "center", 1) }

function ringVariant(ctx, W, H, bg, s, u, pct) {
  const cx = W / 2, cy = 66 * u, R = 41 * u, top = -Math.PI / 2, a1 = top + Math.PI * 2 * pct
  const head = (r) => [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r]
  drawStars(ctx, W, H, bg ? 18 : 50, { x: cx, y: cy, R: R * 1.2 })

  if (STYLE === "ring2") {                                         // Orbit
    ctx.setStrokeColor(col(SILVER, 0.2)); ctx.setLineWidth(0.6)
    ctx.strokeEllipse(new Rect(cx - R, cy - R, 2 * R, 2 * R))
    for (let i = 0; i < 48; i++) {                                // travelled path: gold dashes
      const t0 = i / 48, t1 = (i + 0.55) / 48
      if (t1 > pct) break
      arcStroke(ctx, cx, cy, R, top + Math.PI * 2 * t0, top + Math.PI * 2 * t1, mixHex(GOLD, GOLD_SOFT, t0), 0.9, 1.4 * u)
    }
    dot(ctx, cx, cy - R, 1.6 * u, SILVER, 0.8)                      // launch point
    for (const q of [0.25, 0.5, 0.75]) { const a = top + Math.PI * 2 * q; dot(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0.9 * u, SILVER, 0.4) }
    const [px, py] = head(R)
    planet(ctx, px, py, 5.2 * u)
    centreXP(ctx, s, cx, cy, u, pct, 24 * u, "TOTAL")
    levelLine(ctx, s, cx, 122 * u, u)
    statRow(ctx, s, cx, 146 * u, 50 * u, u)

  } else if (STYLE === "ring3") {                                  // Twin
    const Ro = 43 * u, Ri = 35 * u
    arcStroke(ctx, cx, cy, Ro, 0, Math.PI * 2, SILVER, 0.1, 2.6 * u)
    prismLine(ctx, arcPts(cx, cy, Ro, top, a1, Math.max(2, Math.ceil(72 * pct))), 7 * u, 0, pct, 0.06)
    prismLine(ctx, arcPts(cx, cy, Ro, top, a1, Math.max(2, Math.ceil(72 * pct))), 2.6 * u, 0, pct, 1)
    twinkle(ctx, cx + Math.cos(a1) * Ro, cy + Math.sin(a1) * Ro, 6 * u, 1)
    // inner arcs grow from the bottom: TRAIN up the left, COOK up the right
    const bot = Math.PI / 2, gap = 0.12, half = Math.PI - 2 * gap
    const ft = clamp(s.exercise / STREAK_GOAL, 0, 1), fc = clamp(s.cooking / STREAK_GOAL, 0, 1)
    arcStroke(ctx, cx, cy, Ri, bot + gap, bot + gap + half, EMBER, 0.13, 2 * u)
    arcStroke(ctx, cx, cy, Ri, bot - gap, bot - gap - half, GOLD, 0.13, 2 * u)
    if (ft > 0) { arcStroke(ctx, cx, cy, Ri, bot + gap, bot + gap + half * ft, EMBER, 0.95, 2 * u); const a = bot + gap + half * ft; dot(ctx, cx + Math.cos(a) * Ri, cy + Math.sin(a) * Ri, 1.6 * u, "#FFE3A3", 1) }
    if (fc > 0) { arcStroke(ctx, cx, cy, Ri, bot - gap, bot - gap - half * fc, GOLD, 0.95, 2 * u); const a = bot - gap - half * fc; dot(ctx, cx + Math.cos(a) * Ri, cy + Math.sin(a) * Ri, 1.6 * u, "#FFF6DA", 1) }
    centreXP(ctx, s, cx, cy, u, pct, 22 * u, "TOTAL")
    levelLine(ctx, s, cx, 122 * u, u)
    statRow(ctx, s, cx, 146 * u, 50 * u, u)

  } else if (STYLE === "ring4") {                                  // Dial
    const segs = 12, g = 0.09, lit = pct * segs
    for (let i = 0; i < segs; i++) {
      const s0 = top + (i / segs) * Math.PI * 2 + g / 2, s1 = top + ((i + 1) / segs) * Math.PI * 2 - g / 2
      arcStroke(ctx, cx, cy, R, s0, s1, SILVER, 0.12, 4 * u)
      const f = clamp(lit - i, 0, 1)
      if (f > 0) {
        const e = s0 + (s1 - s0) * f, hex = starlightAt(i / segs)
        arcStroke(ctx, cx, cy, R, s0, e, hex, 0.08, 8 * u)
        arcStroke(ctx, cx, cy, R, s0, e, hex, 1, 4 * u)
      }
      const a = top + (i / segs) * Math.PI * 2                      // hour ticks outside
      seg(ctx, cx + Math.cos(a) * (R + 4.5 * u), cy + Math.sin(a) * (R + 4.5 * u), cx + Math.cos(a) * (R + (i % 3 ? 6 : 8) * u), cy + Math.sin(a) * (R + (i % 3 ? 6 : 8) * u), i % 3 ? SILVER : GOLD, i % 3 ? 0.3 : 0.7, 0.6)
    }
    centreXP(ctx, s, cx, cy, u, pct, 24 * u, "TOTAL")
    levelLine(ctx, s, cx, 122 * u, u)
    statRow(ctx, s, cx, 146 * u, 50 * u, u)

  } else if (STYLE === "ring5") {                                  // Halo
    const halo = ["#9CC8FF", "#C3A6FF", "#F4E2B0", "#9CC8FF", "#C3A6FF"]
    halo.forEach((h, i) => arcStroke(ctx, cx, cy, R - 3 * u + i * 1.6 * u, 0, Math.PI * 2, h, 0.07, 1.2 * u))
    const n = Math.max(2, Math.ceil(72 * pct))
    prismLine(ctx, arcPts(cx, cy, R, top, a1, n), 10 * u, 0.3, 0.9, 0.05)
    prismLine(ctx, arcPts(cx, cy, R, top, a1, n), 2.2 * u, 0.3, 0.9, 1)
    const r = rng(STAR_SEED + 7)                                     // crystals scattered along the lit arc, denser near the head
    for (let i = 0; i < 9; i++) {
      const t = 1 - Math.pow(r(), 1.8), a = top + Math.PI * 2 * pct * t, rr = R + (r() - 0.5) * 9 * u
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr, k = (0.6 + 0.8 * r()) * u
      if (i % 3 === 0) twinkle(ctx, x, y, 3.5 * k, 0.8); else lozenge(ctx, x, y, 1.3 * k, 2.4 * k, i % 2 ? "#CFE0FA" : "#D9CCF5", 0.85)
    }
    const [hx, hy] = head(R)
    lozenge(ctx, hx, hy, 2.6 * u, 4.6 * u, "#F3F4FA", 1); lozenge(ctx, hx, hy, 1.2 * u, 2.2 * u, "#FFFFFF", 1)
    twinkle(ctx, hx, hy, 9 * u, 1)
    centreXP(ctx, s, cx, cy, u, pct, 24 * u, "TOTAL")
    levelLine(ctx, s, cx, 122 * u, u)
    statRow(ctx, s, cx, 146 * u, 50 * u, u)

  } else if (STYLE === "ring6") {                                  // Minimal
    const Rm = 47 * u, cm = 70 * u
    arcStroke(ctx, cx, cm, Rm, 0, Math.PI * 2, SILVER, 0.16, 0.6)
    const e = top + Math.PI * 2 * pct
    arcStroke(ctx, cx, cm, Rm, top, e, GOLD, 1, 1.3 * u)
    dot(ctx, cx + Math.cos(e) * Rm, cm + Math.sin(e) * Rm, 2.2 * u, GOLD_SOFT, 1)
    glowText(ctx, fmtNum(s.xp), Font.thinSystemFont(28 * u), 28 * u, GOLD, cx, cm - 2 * u, "center", 0.8)
    text(ctx, track(`LEVEL ${s.level}`), Font.mediumSystemFont(6.6 * u), 6.6 * u, SILVER, 0.6, cx, cm + 18 * u, "center")
    const line = `TRAIN ${s.exercise}   ·   COOK ${s.cooking}   ·   ${s.badges} BADGES`
    text(ctx, track(line), Font.mediumSystemFont(6.6 * u), 6.6 * u, GOLD_SOFT, 0.75, cx, 140 * u, "center", W)

  } else if (STYLE === "ring7") {                                  // Filigree
    const Ra = R - 3.2 * u, Rb = R + 3.2 * u
    arcStroke(ctx, cx, cy, Ra, 0, Math.PI * 2, GOLD, 0.55, 0.5)
    arcStroke(ctx, cx, cy, Rb, 0, Math.PI * 2, GOLD, 0.55, 0.5)
    const n = Math.max(2, Math.ceil(72 * pct))
    prismLine(ctx, arcPts(cx, cy, R, top, a1, n), 3.4 * u, 0, pct, 1)
    for (let i = 0; i < 8; i++) {                                    // scrollwork between the cardinals
      const a = top + (i + 0.5) / 8 * Math.PI * 2, ox = cx + Math.cos(a) * (Rb + 3.2 * u), oy = cy + Math.sin(a) * (Rb + 3.2 * u)
      arcStroke(ctx, ox, oy, 2.4 * u, a + Math.PI * 0.55, a + Math.PI * 1.45, GOLD, 0.6, 0.5)
    }
    for (let i = 0; i < 4; i++) {                                    // lozenges at the cardinals, fleur at the top
      const a = top + i / 4 * Math.PI * 2, x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R
      lozenge(ctx, x, y, 2.6 * u, 2.6 * u, "#0B0D1A", 1); lozenge(ctx, x, y, 2 * u, 2 * u, GOLD, 1)
    }
    const fy = cy - Rb - 4.5 * u
    lozenge(ctx, cx, fy, 1.8 * u, 3.6 * u, GOLD_SOFT, 1); dot(ctx, cx - 3.4 * u, fy + 1.2 * u, 1 * u, GOLD, 1); dot(ctx, cx + 3.4 * u, fy + 1.2 * u, 1 * u, GOLD, 1)
    const [hx, hy] = head(R); twinkle(ctx, hx, hy, 6.5 * u, 1)
    centreXP(ctx, s, cx, cy, u, pct, 21 * u, "TOTAL", new Font("Didot-Bold", 20 * u))
    levelLine(ctx, s, cx, 124 * u, u)
    statRow(ctx, s, cx, 147 * u, 50 * u, u)

  } else {                                                         // ring8 · Level Core
    arcStroke(ctx, cx, cy, R, 0, Math.PI * 2, SILVER, 0.1, 3 * u)
    const n = Math.max(2, Math.ceil(72 * pct))
    prismLine(ctx, arcPts(cx, cy, R, top, a1, n), 8 * u, 0, pct, 0.06)
    prismLine(ctx, arcPts(cx, cy, R, top, a1, n), 3 * u, 0, pct, 1)
    const [hx, hy] = head(R); twinkle(ctx, hx, hy, 6.5 * u, 1)
    const [lx, ly] = head(R + 12.5 * u)
    text(ctx, `${Math.round(pct * 100)}%`, Font.semiboldSystemFont(7 * u), 7 * u, GOLD_SOFT, 0.85, lx, ly, "center", 30 * u)
    text(ctx, track("LEVEL"), Font.semiboldSystemFont(6.4 * u), 6.4 * u, SILVER, 0.6, cx, cy - 29 * u, "center")
    glowText(ctx, String(s.level), new Font("Didot-Bold", 38 * u), 38 * u, GOLD, cx, cy - 1 * u, "center", 1.3)
    text(ctx, track(`${s.xpNeed - s.xpIn} XP TO GO`), Font.semiboldSystemFont(5.8 * u), 5.8 * u, SILVER, 0.55, cx, cy + 22 * u, "center")
    glowText(ctx, `${fmtNum(s.xp)} XP`, Font.lightSystemFont(17 * u), 17 * u, GOLD_SOFT, cx, 123 * u, "center", 1)
    statRow(ctx, s, cx, 147 * u, 50 * u, u)
  }
}

// ============ XP ORBIT: comet / planet riding an orbit, teal → gold trail, star dust, constellation milestones ============
// New Widget-tab keys: none. Uses xp, xpIn, xpNeed, level, next (next rank name). "% to next level" = xpIn / xpNeed.
const XP_PAL = even("#1FA89A", "#5FD0C2", "#BFE3B0", "#F2D58F", "#FFD774")
const XP_PAL_RED = even("#7A0A16", "#C4202E", "#FF5A4A", "#FFB0A0", "#FFE0D8")
const xpCol = (f, red) => starlightAt(clamp(f, 0, 1), red ? XP_PAL_RED : XP_PAL)
const XPS = () => XP_STYLE
function xpNode(ctx, x, y, u, lit, big, red, comp) {   // a milestone star; comp = two tiny companion stars joined by hairlines (a mini asterism)
  const c = lit ? (red ? "#FFC9B8" : "#FFE3A3") : SILVER, k = big ? 1.3 : 1
  if (comp) for (const [cx2, cy2] of comp) seg(ctx, x, y, cx2, cy2, c, lit ? 0.4 : 0.16, 0.4)
  if (comp) for (const [cx2, cy2] of comp) { dot(ctx, cx2, cy2, 0.9 * u, c, lit ? 0.85 : 0.3) }
  if (lit) { dot(ctx, x, y, 4.4 * u * k, c, 0.1); twinkle(ctx, x, y, 3.3 * u * k, 0.95, c) }
  else { strokeEll(ctx, x, y, 1.5 * u * k, SILVER, 0.5, 0.5); dot(ctx, x, y, 0.45 * u, SILVER, 0.5) }
}
function xpOrbit(ctx, cx, cy, R, u, pct, red, variant) {
  const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * pct, P = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]
  const planetV = variant === "planet"
  arcStroke(ctx, cx, cy, R, 0, Math.PI * 2, SILVER, planetV ? 0.16 : 0.1, planetV ? 0.7 : 2.6 * u)     // the orbit
  if (planetV) for (let i = 1; i < 10; i++) if (i % 5) { const [x, y] = P(a0 + i / 10 * Math.PI * 2, R); dot(ctx, x, y, 0.75 * u, pct >= i / 10 ? xpCol(i / 10 / Math.max(pct, 0.01), red) : SILVER, pct >= i / 10 ? 0.9 : 0.35) }
  // the trail: tapered, teal at the tail → gold at the head
  const n = Math.max(3, Math.ceil(160 * pct)), bw = (planetV ? 2.1 : 3.4) * u
  for (let i = 0; i < n; i++) {
    if (planetV && i % 4 === 3) continue
    const f0 = i / n, f1 = (i + 1) / n, fm = (f0 + f1) / 2, w = bw * (0.28 + 0.72 * Math.pow(fm, 0.9)), c = xpCol(fm, red)
    const p0 = P(a0 + (a1 - a0) * f0, R), p1 = P(a0 + (a1 - a0) * f1 + 0.004, R)
    seg(ctx, p0[0], p0[1], p1[0], p1[1], c, 0.03 + 0.05 * fm, w * 4.2)
    seg(ctx, p0[0], p0[1], p1[0], p1[1], c, 0.12 + 0.1 * fm, w * 2.2)
    seg(ctx, p0[0], p0[1], p1[0], p1[1], c, 1, w)
    if (!planetV) seg(ctx, p0[0], p0[1], p1[0], p1[1], "#FFFFFF", 0.3 * fm, w * 0.3)
  }
  // star dust drifting along the filled part, thicker toward the head
  const dq = rng(STAR_SEED + 31)
  for (let i = 0, nd = Math.round(10 + 46 * pct); i < nd; i++) {
    const f = Math.pow(dq(), 0.7), a = a0 + (a1 - a0) * f, rr = R + (dq() - 0.42) * (3 + 7 * f) * u, [x, y] = P(a, rr), c = xpCol(f, red), z = (0.26 + 0.5 * dq()) * u
    if (Math.abs(rr - R) < bw * 0.5 * (0.3 + f) && dq() < 0.7) continue          // keep the core of the trail clean
    if (i % 9 === 0) twinkle(ctx, x, y, 1.9 * u, 0.7, c); else { dot(ctx, x, y, z * 2.4, c, 0.06); dot(ctx, x, y, z, c, 0.5 + 0.45 * dq()) }
  }
  // milestones: 25 / 50 / 75 % as constellation nodes, the top star is the next level
  for (let i = 0; i < 4; i++) {
    const a = a0 + i * Math.PI / 2, [x, y] = P(a, R), lit = i > 0 && pct >= i / 4 - 0.002
    const t = [Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)], rd = [Math.cos(a), Math.sin(a)]
    const comp = [[x + rd[0] * 5.2 * u - t[0] * 3.6 * u, y + rd[1] * 5.2 * u - t[1] * 3.6 * u], [x + rd[0] * 3.0 * u + t[0] * 4.6 * u, y + rd[1] * 3.0 * u + t[1] * 4.6 * u]]
    if (i === 0) { twinkle(ctx, x, y, 4.6 * u, 0.55, red ? "#FFC9B8" : GOLD_SOFT); strokeEll(ctx, x, y, 2.1 * u, red ? "#FFC9B8" : GOLD_SOFT, 0.6, 0.55) }
    else xpNode(ctx, x, y, u, lit, false, red, comp)
  }
  // head: comet (coma + spark) or ringed planet
  const [hx, hy] = P(a1, R)
  if (planetV) { planet(ctx, hx, hy, 4.7 * u); twinkle(ctx, hx - 4.4 * u, hy - 4.4 * u, 3.2 * u, 0.7, "#FFF6DA") }
  else {
    for (let i = 0; i < 6; i++) dot(ctx, hx, hy, (10 - i * 1.5) * u, red ? "#FF9A8A" : "#FFD774", 0.035 + i * 0.012)
    dot(ctx, hx, hy, 2.9 * u, "#FFF3C8", 0.9); dot(ctx, hx, hy, 1.7 * u, "#FFFFFF", 1)
    twinkle(ctx, hx, hy, 7.6 * u, 0.95, "#FFF3C8")
  }
}
// ---- XP ring: Galactic halo ----
function ringStroke(ctx, cx, cy, r, hex, a, w) { ctx.setStrokeColor(col(hex, a)); ctx.setLineWidth(w); ctx.strokeEllipse(new Rect(cx - r, cy - r, r * 2, r * 2)) }   // one stroke, no overlap beads
function ringHalo(ctx, cx, cy, R, u, pct, red) {        // a ring of fine stars and dust that fills with progress; comet head at the tip
  const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * pct, P = (a, r) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r], q = rng(STAR_SEED + 77)
  ringStroke(ctx, cx, cy, R, "#02030A", 0.55, 5.2 * u)                     // empty part: a faint dark track
  ringStroke(ctx, cx, cy, R, SILVER, 0.07, 3.4 * u)
  ringStroke(ctx, cx, cy, R + 2.6 * u, SILVER, 0.08, 0.35); ringStroke(ctx, cx, cy, R - 2.6 * u, SILVER, 0.06, 0.35)
  for (let i = 0; i < 70; i++) { const f = q(), [x, y] = P(f * Math.PI * 2, R + (q() - 0.5) * 4 * u); dot(ctx, x, y, 0.22 * u, SILVER, 0.12 + 0.12 * q()) }   // unlit dust in the track
  for (let i = 0, n = Math.round(90 * pct); i < n; i++) {                                    // soft dust glow under the stars
    const f = (i + 0.5) / n, [x, y] = P(a0 + (a1 - a0) * f, R + (q() - 0.5) * 1.6 * u), c = xpCol(f, red)
    dot(ctx, x, y, (2.4 + 1.6 * f) * u, c, 0.03 + 0.03 * f)
  }
  for (let i = 0, n = Math.round(900 * pct); i < n; i++) {                                   // thousands of fine stars, denser and brighter toward the head
    const f = Math.pow(q(), 0.8), g = (q() + q() + q() - 1.5) / 0.5, rr = R + g * (1.1 + 1.2 * f) * u, [x, y] = P(a0 + (a1 - a0) * f, rr)
    const m = Math.pow(q(), 6), c = mixHex(xpCol(f, red), "#FFFFFF", 0.25 + 0.4 * q())
    if (m > 0.35) dot(ctx, x, y, (0.6 + m) * u, c, 0.08)
    dot(ctx, x, y, (0.16 + 0.42 * m) * u, c, clamp(0.3 + 0.55 * f + 0.3 * m - 0.25 * Math.abs(g), 0.1, 1))
  }
  const [hx, hy] = P(a1, R)
  for (let i = 0; i < 14; i++) { const [x, y] = P(a1 - i * 0.018, R); dot(ctx, x, y, (4.2 - i * 0.22) * u, red ? "#FF9A8A" : "#FFE6B0", 0.035) }   // coma trailing back along the ring
  for (let i = 0; i < 6; i++) dot(ctx, hx, hy, (7.5 - i * 1.1) * u, red ? "#FF9A8A" : "#FFE2A8", 0.03 + i * 0.016)
  dot(ctx, hx, hy, 1.9 * u, "#FFF6E0", 0.95); dot(ctx, hx, hy, 1 * u, "#FFFFFF", 1)
  for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2, [x, y] = P(a, R + 5.2 * u), lit = pct >= i / 4; dot(ctx, x, y, 0.5 * u, lit ? GOLD_SOFT : SILVER, lit ? 0.8 : 0.3) }
}
function xpChip(ctx, x, y, str, u, red) {              // glass pill: "64%"
  const w = 17 * u, h = 8.6 * u
  fillPath(ctx, rrPath(x - w / 2, y - h / 2, w, h, h / 2), "#05060C", 0.78); strokeP(ctx, rrPath(x - w / 2, y - h / 2, w, h, h / 2), red ? "#FF9A8A" : GOLD, 0.55, 0.5)
  text(ctx, str, FUT(true, 6.2 * u), 6.2 * u, red ? "#FFD0C4" : GOLD_BRIGHT, 1, x, y + 0.2 * u, "center", w)
}
// p.a. rate from the Widget-tab `savings` key (= Dashboard!B17 TOTAL SAVINGS RATE, already a percent); null when missing or paused → line hidden
function paText(v) {
  if (v == null || String(v).trim() === "") return null
  const n = Number(String(v).replace(/[^\d.\-]/g, "")); if (!isFinite(n)) return null
  return `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(3)}% p.a.`
}
function xpLabels(ctx, s, cx, cy, u, pct, CMP, red, LT) {
  if (!CMP && RING_TEXT) return xpLabelsV(ctx, s, cx, cy, u, pct, red, LT, RING_TEXT)   // centre of the ring: total XP (large) · LEVEL N · "64% to Lvl 10" · "+0.010% p.a." (the ring is the progress)
  const g = red ? "#FFC9B8" : GOLD, lc = (LT && LT.text) || "#E3E7EF", nd = String(s.level).length
  const L = CMP ? { xs: 16.5, xy: -9, lz: 8.2, lt: 5, ly: 3.2, pz: 4.9, py: 10.6, az: 4.3, ay: 16.6 } : { xs: 21, xy: -10.5, lz: 9.8, lt: 5.9, ly: 4.4, pz: 5.6, py: 13, az: 5, ay: 20.4 }
  glowText(ctx, fmtNum(s.xp), FS.hero(L.xs * u * FS.heroK), L.xs * u, g, cx, cy + L.xy * u, "center", 1.2)
  const lw = L.lt * 3.9 * u, gw = lw + nd * L.lz * 0.62 * u, lx = cx - gw / 2, ly = cy + L.ly * u
  text(ctx, track("LEVEL"), FUT(false, L.lt * u), L.lt * u, lc, 0.85, lx, ly + 0.12 * L.lz * u, "left", 30 * u)
  glowText(ctx, String(s.level), FUT(true, L.lz * u), L.lz * u, lc, lx + lw + nd * L.lz * 0.31 * u, ly, "center", 0.8)
  text(ctx, `${Math.round(pct * 100)}% to Lvl ${s.level + 1}`, FUT(false, L.pz * u), L.pz * u, red ? "#FFC9B8" : "#7FD6CC", 0.95, cx, cy + L.py * u, "center", 60 * u)
  const pa = paText(s.savings)
  if (pa) text(ctx, pa, FUT(false, L.az * u), L.az * u, red ? "#FFB0A0" : GOLD_SOFT, 0.72, cx, cy + L.ay * u, "center", 60 * u)
}
function xpNextRow(ctx, s, cx, y, u, W) {              // under the level: next rank on the left, savings on the right
  text(ctx, track("NEXT"), FUT(false, 4.8 * u), 4.8 * u, "#7FD6CC", 0.85, cx - 73 * u, y - 0.2 * u, "left", 30 * u)
  text(ctx, tr(s.next), FUT(true, 5.2 * u), 5.2 * u, GOLD_SOFT, 0.85, cx - 73 * u + 16 * u, y, "left", 80 * u)
  textR(ctx, track(fmtSavings(s.savings)), FUT(false, 5.2 * u), 5.2 * u, GOLD_SOFT, 0.62, cx + 73 * u, y, 60 * u)
}
function xpBar(ctx, W, H, u, s, pct, red, CMP) {        // slim horizontal comet bar (medium / small alternative)
  const x0 = 15 * u, x1 = 155 * u, cx = 85 * u, y = (CMP ? 66 : 84) * u, dy = (CMP ? -13 : 0) * u, g = red ? "#FFC9B8" : GOLD
  text(ctx, track("TOTAL"), FUT(false, 6.2 * u), 6.2 * u, red ? "#FFB0A0" : GOLD_SOFT, 0.75, cx, (CMP ? 17 : 32) * u, "center")
  glowText(ctx, fmtNum(s.xp), FS.hero(26 * u * FS.heroK), (CMP ? 22 : 28) * u, g, cx, (CMP ? 35 : 52) * u, "center", 1.2)
  const hx = x0 + (x1 - x0) * pct
  text(ctx, `${fmtNum(s.xpIn)} / ${fmtNum(s.xpNeed)} XP`, FUT(true, 6.2 * u), 6.2 * u, SILVER, 0.85, x0, y - 9 * u, "left", 80 * u)
  textR(ctx, `${Math.round(pct * 100)}%`, FUT(true, 8.4 * u), 8.4 * u, red ? "#FFD0C4" : GOLD_BRIGHT, 1, x1, y - 9.4 * u, 40 * u)
  seg(ctx, x0, y, x1, y, SILVER, 0.12, 2.8 * u)
  const n = Math.max(4, Math.ceil(120 * pct)), bw = 3.4 * u
  for (let i = 0; i < n; i++) {
    const f0 = i / n, f1 = (i + 1) / n, fm = (f0 + f1) / 2, w = bw * (0.28 + 0.72 * Math.pow(fm, 0.9)), c = xpCol(fm, red)
    const xa = x0 + (hx - x0) * f0, xb = x0 + (hx - x0) * f1 + 0.2
    seg(ctx, xa, y, xb, y, c, 0.03 + 0.05 * fm, w * 4.2); seg(ctx, xa, y, xb, y, c, 0.12 + 0.1 * fm, w * 2.2); seg(ctx, xa, y, xb, y, c, 1, w)
    seg(ctx, xa, y - w * 0.18, xb, y - w * 0.18, "#FFFFFF", 0.3 * fm, w * 0.28)
  }
  const dq = rng(STAR_SEED + 33)
  for (let i = 0, nd = Math.round(8 + 40 * pct); i < nd; i++) {
    const f = Math.pow(dq(), 0.7), x = x0 + (hx - x0) * f, yy = y + (dq() - 0.45) * (3 + 7 * f) * u, c = xpCol(f, red)
    if (Math.abs(yy - y) < bw * 0.5 * (0.3 + f) && dq() < 0.7) continue
    if (i % 9 === 0) twinkle(ctx, x, yy, 1.9 * u, 0.7, c); else { dot(ctx, x, yy, 0.6 * u, c, 0.06); dot(ctx, x, yy, (0.26 + 0.5 * dq()) * u, c, 0.5 + 0.45 * dq()) }
  }
  for (let i = 1; i <= 4; i++) {                        // milestones 25/50/75, finish star at 100
    const x = x0 + (x1 - x0) * i / 4, lit = pct >= i / 4 - 0.002, sd = i % 2 ? -1 : 1
    if (i === 4) { twinkle(ctx, x, y, 4.6 * u, 0.55, red ? "#FFC9B8" : GOLD_SOFT); strokeEll(ctx, x, y, 2.1 * u, red ? "#FFC9B8" : GOLD_SOFT, 0.6, 0.55) }
    else xpNode(ctx, x, y, u, lit, false, red, [[x - 3.4 * u, y + sd * 5.4 * u], [x + 4.6 * u, y + sd * 3.1 * u]])
  }
  for (let i = 0; i < 6; i++) dot(ctx, hx, y, (10 - i * 1.5) * u, red ? "#FF9A8A" : "#FFD774", 0.035 + i * 0.012)
  dot(ctx, hx, y, 2.9 * u, "#FFF3C8", 0.9); dot(ctx, hx, y, 1.7 * u, "#FFFFFF", 1); twinkle(ctx, hx, y, 7.6 * u, 0.95, "#FFF3C8")
  const ly = y + 12 * u
  text(ctx, track("LEVEL"), FUT(false, 5.6 * u), 5.6 * u, "#E3E7EF", 0.8, x0, ly, "left", 30 * u); glowText(ctx, String(s.level), FUT(true, 9.5 * u), 9.5 * u, GOLD_SOFT, x0 + 21 * u, ly - 0.3 * u, "left", 0.8)
  textR(ctx, track(`LV ${s.level + 1}`), FUT(true, 6.4 * u), 6.4 * u, "#7FD6CC", 0.95, x1, ly, 40 * u)
  text(ctx, tr("Next · " + s.next), FUT(true, 5.4 * u), 5.4 * u, GOLD_SOFT, 0.85, cx, ly + 10 * u, "center", 150 * u)
}

function render(W, H, bg, s, source) {
  const CH = LIVE.chaos || null, MED = !!(CH && CH.family === "medium"), CMP = !!(CH && !MED)
  __BLOOD = SKY() && CH ? (BLOOD_K[CH.state] || 0) : 0                      // blood-moon theme strength for this render
  const ctx = new DrawContext()
  ctx.size = new Size(W, H)
  ctx.opaque = true
  ctx.respectScreenScale = true
  if (bg) ctx.drawImageInRect(bg, new Rect(0, 0, W, H))
  else {
    ctx.setFillColor(col(SKY() ? "#03030A" : "#05050B", 1)); ctx.fillRect(new Rect(0, 0, W, H))
    if (!SKY()) for (let i = 0; i < 10; i++) dot(ctx, W * 0.7, H * 0.3, W * (0.9 - i * 0.07), i % 2 ? "#3A2A6A" : "#1B2A55", 0.035)   // faint nebula
  }
  if (SKY()) drawMilkyWay(ctx, W, H, nightP(skyHour()), skyPal(), s)
  if (SKY() && REASON()) reasonsBand(ctx, W, H, skyPal())
  chaosTint(ctx, W, H)
  if (SKY() && __STAR_DRAW) { __STAR_DRAW(); __STAR_DRAW = null }   // after the eclipse and the chaos tint: red-bled, never hidden
  if (SKY()) skyVignette(ctx, W, H)
  const u = H / 170
  const pct = clamp(s.xpNeed > 0 ? s.xpIn / s.xpNeed : 0, 0, 1)
  const heroF = FS.hero(24 * u * FS.heroK)
  const tiny = FS.cap(6.4 * u * FS.capK)
  const rankF = FS.level(13 * u * FS.levelK)
  const shine = 0.08 + 0.84 * pct

  if (/^ring[2-8]$/.test(STYLE)) ringVariant(ctx, W, H, bg, s, u, pct)
  else if (STYLE === "crest") {
    drawStars(ctx, W, H, bg ? 18 : 50, { x: W * 0.2, y: H * 0.2, R: 18 * u })
    shield(ctx, 26 * u, 30 * u, 28 * u, RANK_EMOJI ? s.rankIcon : "")
    glowText(ctx, s.rank, rankF, 13 * u, GOLD_SOFT, 46 * u, 25 * u, "left", 1)
    text(ctx, track(`LV ${s.level}`), tiny, 6.4 * u, SILVER, 0.55, 47 * u, 39 * u, "left")
    const hx = 15 * u, hy = 80 * u
    text(ctx, track("TOTAL XP"), tiny, 6.4 * u, GOLD_SOFT, 0.65, hx + 1, 58 * u, "left")
    glowText(ctx, fmtNum(s.xp), Font.lightSystemFont(34 * u), 34 * u, GOLD, hx, hy, "left", 1.2)
    const bx0 = 15 * u, bx1 = W - 15 * u, by = 102 * u, bx = bx0 + (bx1 - bx0) * pct
    seg(ctx, bx0, by, bx1, by, SILVER, 0.13, 2 * u)
    seg(ctx, bx0, by, bx, by, GOLD, 0.1, 5 * u)
    prismLine(ctx, Array.from({ length: 25 }, (_, i) => [bx0 + (bx - bx0) * i / 24, by]), 2 * u, 0, pct, 1)
    twinkle(ctx, bx, by, 5 * u, 0.9)
    text(ctx, `${s.xpNeed - s.xpIn} XP to ${s.next}`, Font.regularSystemFont(7 * u), 7 * u, SILVER, 0.6, bx0, by + 9 * u, "left", W)
    text(ctx, `${Math.round(pct * 100)}%`, tiny, 6.4 * u, GOLD_SOFT, 0.8, bx1 - 14 * u, by - 8 * u, "center", 30 * u)
    statRow(ctx, s, W / 2, 136 * u, 48 * u, u)
  } else if (STYLE === "sword") {
    const sx = 30 * u, tip = 16 * u, guard = 116 * u, bw = 5.2 * u
    drawStars(ctx, W, H, bg ? 18 : 50, { x: sx, y: 80 * u, R: 16 * u })
    // blade outline + fill rising from the guard
    const fillTop = guard - (guard - tip - 8 * u) * pct
    const blade = new Path()
    blade.move(new Point(sx, tip)); blade.addLine(new Point(sx + bw / 2, tip + 9 * u)); blade.addLine(new Point(sx + bw / 2, guard))
    blade.addLine(new Point(sx - bw / 2, guard)); blade.addLine(new Point(sx - bw / 2, tip + 9 * u)); blade.closeSubpath()
    fillPath(ctx, blade, "#0B0D1A", 0.5)
    ctx.addPath(blade); ctx.setStrokeColor(col(SILVER, 0.35)); ctx.setLineWidth(0.6); ctx.strokePath()
    for (let i = 0; i < 30; i++) {
      const y0 = guard - (guard - fillTop) * i / 30, y1 = guard - (guard - fillTop) * (i + 1) / 30
      seg(ctx, sx, y0, sx, y1, starlightAt(i / 30 * pct), 1, bw * 0.62)
    }
    seg(ctx, sx, guard, sx, fillTop, GOLD, 0.07, bw * 2.6)
    twinkle(ctx, sx, fillTop, 7 * u, 1)
    seg(ctx, sx - 13 * u, guard + 1.5 * u, sx + 13 * u, guard + 1.5 * u, GOLD, 1, 2.6 * u)     // cross-guard
    dot(ctx, sx - 13 * u, guard + 1.5 * u, 1.8 * u, GOLD_SOFT, 1); dot(ctx, sx + 13 * u, guard + 1.5 * u, 1.8 * u, GOLD_SOFT, 1)
    seg(ctx, sx, guard + 3 * u, sx, guard + 17 * u, "#8E7A55", 1, 2.6 * u)                     // grip
    dot(ctx, sx, guard + 20 * u, 6 * u, "#C3A6FF", 0.12); dot(ctx, sx, guard + 20 * u, 3 * u, GOLD, 1); dot(ctx, sx, guard + 20 * u, 1.4 * u, "#E9F1FF", 0.95)
    const tx = 54 * u
    glowText(ctx, s.rank, rankF, 13 * u, GOLD_SOFT, tx, 26 * u, "left", 1)
    text(ctx, track(`LV ${s.level} · ${Math.round(pct * 100)}%`), tiny, 6.4 * u, SILVER, 0.55, tx + 1, 40 * u, "left")
    glowText(ctx, fmtNum(s.xp), Font.lightSystemFont(31 * u), 31 * u, GOLD, tx - 1, 68 * u, "left", 1.2)
    text(ctx, track("TOTAL XP"), tiny, 6.4 * u, GOLD_SOFT, 0.65, tx + 1, 89 * u, "left")
    text(ctx, `${s.xpNeed - s.xpIn} to ${s.next}`, Font.regularSystemFont(7 * u), 7 * u, SILVER, 0.55, tx + 1, 99 * u, "left", W)
    statRow(ctx, s, tx + 50 * u, 132 * u, 38 * u, u)
  } else { // ring
    const uR = MED ? u * RING_MED.k : u                                // v12 medium: ring + centre text scale up into the freed space
    const cx = MED ? RING_MED.x * u : W / 2, cy = (MED ? RING_MED.y : CMP ? 50 : 66) * u, R = (MED ? RING_MED.r : CMP ? 32 : 41) * u
    drawStars(ctx, W, H, SKY() ? 0 : bg ? 18 : 50, { x: cx, y: cy, R: R * 1.15 })
    let LT = levelTier(s.level); if (CH && CH.state === "prismatic") LT = { ...LT, pal: even("#7A0A16", "#C4202E", "#FF5A4A", "#E8A090", "#9A1020"), tip: "#FFB0A0", text: "#FF9A8A", glow: 0.12 }
    const RED = !!(CH && CH.state === "prismatic"), top = LT === LEVEL_TIERS[LEVEL_TIERS.length - 1], XS = XPS()
    if (XS === "bar") {
      xpBar(ctx, W, H, u, s, pct, RED, CMP)
      if (!CMP) text(ctx, track(fmtSavings(s.savings)), FUT(false, 5.6 * u), 5.6 * u, GOLD_SOFT, 0.62, cx, 128 * u, "center", W)
      else text(ctx, track(fmtSavings(s.savings)), FUT(false, 5.6 * u), 5.6 * u, GOLD_SOFT, 0.62, cx, 106 * u, "center", W)
    } else {
    if (XP_RING === "comet") for (let i = 0; i < 36; i++) {                                   // faint tick marks, like a star dial
      const a = i / 36 * Math.PI * 2, r0 = R + 4.5 * uR, r1 = R + (i % 9 === 0 ? 7.5 : 5.8) * uR
      seg(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, i % 9 === 0 ? GOLD : SILVER, i % 9 === 0 ? 0.45 : 0.16, 0.5)
    }
    if (top) {                                                       // max level: gold halo + crystal sparkles
      arcStroke(ctx, cx, cy, R + 10 * uR, Math.PI * 0.72, Math.PI * 2.28, GOLD_SOFT, 0.4, 0.6)   // open at the bottom, clear of "Level N"
    }
    for (let i = 1; i <= 5; i++) (XP_RING === "comet" ? (r, h, al, w) => arcStroke(ctx, cx, cy, r, 0, Math.PI * 2, h, al, w) : (r, h, al, w) => ringStroke(ctx, cx, cy, r, h, al, w))(R - (2.6 + i * 1.5) * uR, "#000000", 0.13 * (1 - i / 6), 1.7 * uR)   // soft inner shadow
    if (XP_RING === "comet") arcStroke(ctx, cx, cy, R + 3.4 * uR, 0, Math.PI * 2, "#FFFFFF", 0.07, 0.45)                  // hairline outer ring
    if (XP_RING === "comet") for (let i = 0; i < 60; i++) {                                    // tiny inner tick marks
      const a = i / 60 * Math.PI * 2, r0 = R - 5.4 * uR, r1 = R - (i % 5 ? 6.5 : 7.6) * uR
      seg(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, "#FFFFFF", i % 5 ? 0.09 : 0.2, 0.4)
    }
    const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * pct
    if (XP_RING === "halo") ringHalo(ctx, cx, cy, R, uR, pct, RED)
    else xpOrbit(ctx, cx, cy, R, uR, pct, RED, XS)
    if (top) {
      const cr = ["#CFE0FA", "#D9CCF5", "#F3F4FA", "#FFE3A3"]
      ;[-60, 0, 35, 145, 180, 240].forEach((deg, i) => {
        const a = deg * Math.PI / 180, rr = R + 10 * uR
        lozenge(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.3 * uR, 2.6 * uR, cr[i % 4], 0.95)
      })
      twinkle(ctx, cx - R * 0.95, cy - R * 0.95, 4.5 * uR, 0.9); twinkle(ctx, cx + R * 1.0, cy + R * 0.9, 3.5 * uR, 0.8)
    }
    if (XS === "planet") { const hr = R + 15 * uR, hxx = cx + Math.cos(a1) * hr, hyy = cy + Math.sin(a1) * hr; xpChip(ctx, hxx, hyy, `${Math.round(pct * 100)}%`, uR, RED) }
    xpLabels(ctx, s, cx, cy, uR, pct, CMP, RED, LT)
    if (false) {   // v3: the level now sits inside the ring
      const ly = (CMP ? 97 : 120) * uR, nd = String(s.level).length, gw = 22 * uR + 4.5 * uR + nd * 8.6 * uR, lx = cx - gw / 2
      text(ctx, track("LEVEL"), FUT(false, 6.6 * uR), 6.6 * uR, LT.text, 0.8, lx, ly + 2.6 * uR, "left", 40 * uR)
      glowText(ctx, String(s.level), FUT(true, 14.5 * uR), 14.5 * uR, LT.text, lx + 26.5 * uR + nd * 4.3 * uR, ly, "center", top ? 1.4 : 0.8)
    }
    // v3: no next-rank row; the p.a. rate now sits inside the ring
    }
    const sgap = (MED ? 46 : 50) * u
    if (MED) LIVE.streaks = s                                        // v12 medium: the streak cells live in the right-hand panel (chaosPanel)
    else {
      statPanel(ctx, cx, sgap, (CMP ? 112.5 : 137.5) * u, H - 4 * u, u)
      statRow(ctx, s, cx, (CMP ? (CH.lock ? 123 : LIVE.quest ? 127 : 123) : 147.5) * u, sgap, u)
    }
  }
  chaosPanel(ctx, W, H, s)
  statusDot(ctx, W, u, source)
  return ctx.getImage()
}

// ---------------- CHAOS (live: LIVE.chaos = {state, family, variant, lock} from chaosState / chaosCover / chaosTierNames) ----------------
let CHAOS_TIERS = ["LIFE360", "DISCORD", "5555 Number", "YOUTRIP", "All Messaging Platforms"]
const CPAL = {
  prismatic: { acc: "#FF4D5E", glow: "#FF1F3A", name: "#FFE6E0", lock: 5 },
  diamond:   { acc: "#B59CFF", glow: "#7A4DFF", name: "#EFEAFF", lock: 3 },
  gold:      { acc: "#EBB055", glow: "#E08A1E", name: "#FFF1D6", lock: 1 },
  clear:     { acc: "#7FD6CC", glow: "#2BB8A8", name: "#E6F7F5", lock: 0 },
}
const FUT = (bold, z) => new Font(bold ? "Futura-Bold" : "Futura-Medium", z)
const P_ = (x, y) => new Point(x, y)
function rrPath(x, y, w, h, r) {
  const p = new Path()
  p.move(P_(x + r, y)); p.addLine(P_(x + w - r, y)); p.addQuadCurve(P_(x + w, y + r), P_(x + w, y))
  p.addLine(P_(x + w, y + h - r)); p.addQuadCurve(P_(x + w - r, y + h), P_(x + w, y + h))
  p.addLine(P_(x + r, y + h)); p.addQuadCurve(P_(x, y + h - r), P_(x, y + h))
  p.addLine(P_(x, y + r)); p.addQuadCurve(P_(x + r, y), P_(x, y)); p.closeSubpath()
  return p
}
function strokeP(ctx, p, hex, a, w) { ctx.addPath(p); ctx.setStrokeColor(col(hex, a)); ctx.setLineWidth(w); ctx.strokePath() }
function glowRR(ctx, x, y, w, h, r, hex, a, spread) {         // soft outer glow = widening faint strokes
  for (let i = 4; i >= 1; i--) strokeP(ctx, rrPath(x, y, w, h, r), hex, a * 0.28 / i * 1.6, spread * i / 4 * 2)
}
function textR(ctx, str, font, size, hex, a, xr, y, w) {
  ctx.setFont(font); ctx.setTextColor(col(hex, a)); ctx.setTextAlignedRight()
  ctx.drawTextInRect(str, new Rect(xr - w, y - size * 0.62, w, size * 1.5))
}
const tr = (s) => track(s.toUpperCase())
// vector padlock, centred on (x, y); s = body width
function lockIcon(ctx, x, y, s, hex, a, open) {
  const bw = s, bh = s * 0.78, bx = x - bw / 2, by = y - bh * 0.28
  const sx = open ? x + s * 0.22 : x
  arcStroke(ctx, sx, by, s * 0.3, Math.PI, Math.PI * (open ? 1.85 : 2), hex, a, s * 0.16)
  seg(ctx, sx - s * 0.3, by, sx - s * 0.3, by + s * 0.1, hex, a, s * 0.16)
  if (!open) seg(ctx, sx + s * 0.3, by, sx + s * 0.3, by + s * 0.1, hex, a, s * 0.16)
  fillPath(ctx, rrPath(bx, by, bw, bh, s * 0.16), hex, a)
  dot(ctx, x, by + bh * 0.42, s * 0.1, "#12060A", Math.min(1, a))
  seg(ctx, x, by + bh * 0.42, x, by + bh * 0.72, "#12060A", Math.min(1, a), s * 0.12)
}
function chaosTint(ctx, W, H) {
  const C = LIVE.chaos; if (!C) return
  const u = H / 170, st = C.state, pal = CPAL[st] || CPAL.clear
  if (SKY() && st === "clear") return
  const t = SKY() ? { gold: [0.08, "#120800"], diamond: [0.14, "#070318"], prismatic: [0.36, "#10000A"] }[st] : { gold: [0.05, "#2A1500"], diamond: [0.16, "#150A30"], prismatic: [0.36, "#380007"], clear: [0.1, "#001818"] }[st]
  if (!t) return
  ctx.setFillColor(col(t[1], t[0])); ctx.fillRect(new Rect(0, 0, W, H))
  const hz = { prismatic: ["#B0001A", 0.075], diamond: ["#6A2CC8", 0.032], gold: ["#8A5A10", 0.02], clear: ["#1FA89A", 0.026] }[st]
  const pts = st === "prismatic" ? [[0, H], [W, H], [W / 2, H + 12 * u], [0, 0], [W, 0], [W * 0.62, H * 0.5]] : [[0, H], [W, H], [W * 0.7, H * 0.6]]
  for (const [vx, vy] of pts) for (let i = 0; i < 18; i++) dot(ctx, vx, vy, (80 - i * 4.2) * u, hz[0], hz[1] * 0.42 * (SKY() ? 0.55 : 1))
  if (st === "prismatic") embers(ctx, W, H, u)
}
function embers(ctx, W, H, u) {                  // prismatic only: drifting embers + hairline cracks
  const r = rng(909), x0 = (C_MED() ? 190 : 6) * u
  for (let i = 0; i < (C_MED() ? 26 : 14); i++) {
    const x = x0 + r() * (W - x0 - 6 * u), y = H * (0.35 + 0.62 * Math.pow(r(), 0.6)), k = 0.4 + r() * 0.9
    dot(ctx, x, y, 3.2 * k * u, "#FF5A2A", 0.05); dot(ctx, x, y, 0.8 * k * u, i % 3 ? "#FF8A3A" : "#FFD08A", 0.55 + r() * 0.35)
  }
  const crack = (sx, sy, dx, dy, n, seed) => {
    const q = rng(seed); let x = sx, y = sy
    for (let i = 0; i < n; i++) {
      const nx = x + dx * (5 + q() * 6) * u + (q() - 0.5) * 7 * u, ny = y + dy * (5 + q() * 6) * u + (q() - 0.5) * 7 * u
      seg(ctx, x, y, nx, ny, "#FF3A3A", 0.1, 2.4 * u); seg(ctx, x, y, nx, ny, "#FF9A7A", 0.3, 0.55 * u)
      if (i === 2) crack(nx, ny, -dy, dx * 0.6, 2, seed + 7)
      x = nx; y = ny
    }
  }
  if (C_MED()) { crack(W - 4 * u, H - 2 * u, -1, -0.5, 6, 11); crack(W * 0.5 + 10 * u, 0, 0.5, 1, 4, 23) }
  else { crack(W - 2 * u, H - 2 * u, -1, -0.3, 5, 11) }
}
const C_MED = () => !!(LIVE.chaos && LIVE.chaos.family === "medium")
// chaos look = variant A: no moon ever, the whole sky and UI turn blood red
function chaosPanel(ctx, W, H, s) {
  const C = LIVE.chaos; if (!C) return
  const st = C.state === "cleansed" ? "clear" : C.state, pal = CPAL[st], LK = C.lock != null ? C.lock : pal.lock, v = C.variant || 1
  const u = H / 170
  if (C.family === "medium" && (v === 1 || (!LK && LIVE.quest))) {
    if (PANEL_FRAME === "GLASS") {                          // v13.4 look: framed glass box
      glass(ctx, 184 * u, 12 * u, W - 196 * u, 154 * u, 12 * u, LK ? pal.acc : "#FFFFFF", 1)
      if (LK) glowRR(ctx, 184 * u, 12 * u, W - 196 * u, 154 * u, 12 * u, pal.glow, 0.05, 6 * u)
    } else if (PANEL_FRAME === "FAINT") {                   // v13.5 (a): no border, just a very faint fill
      fillPath(ctx, rrPath(184 * u, 12 * u, W - 196 * u, 154 * u, 12 * u), LK ? pal.glow : "#FFFFFF", LK ? 0.045 : 0.03)
    } else softBackdrop(ctx, 184 * u, 12 * u, W - 196 * u, 154 * u, u, LK ? pal.glow : null)   // v13.5 (b, default): no frame at all
    if (GAL_FLOW === 2 && SKY() && !LK) for (let k = 0; k < 10; k++) { const d = k * 1.6 * u; fillPath(ctx, rrPath(190 * u + d, 60 * u + d, W - 206 * u - 2 * d, 104 * u - 2 * d, 14 * u), "#02020A", 0.035) }   // v13.8 (2): text-safe dark lane behind the verse
  }
  if (!LK && LIVE.quest) { (C.family === "medium" ? panelQuest : stripQuest)(ctx, W, H, u); return }
  if (LK && C.family === "medium") { panelRestricted(ctx, W, H, u, pal, LK, st); return }   // chaos: the quest panel becomes the list of what is restricted
  const f = { 1: [panelLadder, strip1], 2: [panelCards, strip2], 3: [panelMeter, strip3] }[v]
  ;(C.family === "medium" ? f[0] : f[1])(ctx, W, H, u, pal, LK, st)
}
// ---- chaos · medium side panel: "Today's quest" is replaced by the restricted list — only the tiers locked right now, in the blood theme ----
function panelRestricted(ctx, W, H, u, pal, LK, st) {
  if (PANEL === "A") return panelRestrictedA(ctx, W, H, u, pal, LK, st)
  if (PANEL === "B") return panelRestrictedB(ctx, W, H, u, pal, LK, st)
  const x0 = 196 * u, x1 = W - 22 * u, rh = 15.5 * u, y0 = 44 * u        // v12: compact rows so the streak cells fit below
  text(ctx, tr("restricted"), FUT(true, 8.6 * u), 8.6 * u, pal.acc, 1, x0, 23 * u, "left", 120 * u)
  textR(ctx, `${LK} / 5`, FUT(true, 8.6 * u), 8.6 * u, pal.name, 1, x1, 23 * u, 60 * u)
  text(ctx, tr(`${st} chaos · ${LK > 1 ? `tiers 1–${LK}` : "tier 1"} locked`), FUT(false, 4.9 * u), 4.9 * u, SILVER, 0.62, x0, 33 * u, "left", 140 * u)
  for (let i = 0; i < LK; i++) {
    const y = y0 + i * rh
    fillPath(ctx, rrPath(x0 - 4 * u, y - 6.5 * u, x1 - x0 + 8 * u, 13 * u, 6.5 * u), pal.glow, 0.13)
    strokeP(ctx, rrPath(x0 - 4 * u, y - 6.5 * u, x1 - x0 + 8 * u, 13 * u, 6.5 * u), pal.acc, 0.4, 0.6 * u)
    dot(ctx, x0 + 5 * u, y, 6 * u, pal.glow, 0.18); lockIcon(ctx, x0 + 5 * u, y, 5 * u, pal.name, 1, false)
    text(ctx, CHAOS_TIERS[i], FUT(true, 7.6 * u), 7.6 * u, pal.name, 1, x0 + 15 * u, y + 0.4 * u, "left", 130 * u)
    textR(ctx, tr(`t${i + 1}`), FUT(true, 4.8 * u), 4.8 * u, pal.acc, 0.85, x1, y + 0.4 * u, 20 * u)
  }
  if (LK < 5) {                                                         // the tiers still free, faint, one per line
    let y = y0 + LK * rh - 1 * u
    text(ctx, tr("still free"), FUT(false, 4.4 * u), 4.4 * u, SILVER, 0.42, x0, y, "left", 80 * u)
    for (let i = LK; i < 5 && (y += 9.5 * u) < 110 * u; i++) {
      lockIcon(ctx, x0 + 5 * u, y, 3.8 * u, SILVER, 0.3, true)
      text(ctx, CHAOS_TIERS[i], FUT(false, 6.2 * u), 6.2 * u, SILVER, 0.42, x0 + 15 * u, y + 0.3 * u, "left", 130 * u)
    }
  }
  panelStreaks(ctx, x0, x1, 126 * u, u)
  seg(ctx, x0, 144.5 * u, x1, 144.5 * u, "#FFFFFF", 0.07, 0.5)
  quoteLine(ctx, x0, x1, 155.5 * u, u, pal.name, 0.82, pal.acc)
}
const headText = (st, LK) => LK ? "CHAOS" : "CLEAR WALL"
// ---- variant 1 · ladder: tier 5 at the top, tier 1 at the bottom, a red charge climbs the line ----
function panelLadder(ctx, W, H, u, pal, LK, st) {
  const x0 = 198 * u, x1 = W - 24 * u, nx = 208 * u
  text(ctx, tr(headText(st, LK)), FUT(true, 8.6 * u), 8.6 * u, pal.acc, 1, x0, 23 * u, "left", 120 * u)
  textR(ctx, LK ? `${LK} / 5` : "0 / 5", FUT(true, 8.6 * u), 8.6 * u, LK ? pal.name : SILVER, LK ? 1 : 0.5, x1, 23 * u, 60 * u)
  text(ctx, tr(LK ? "tiers locked" : "no tiers locked"), FUT(false, 4.9 * u), 4.9 * u, SILVER, 0.5, x0, 33 * u, "left", 120 * u)
  const ys = [0, 1, 2, 3, 4].map((i) => (136 - i * 21) * u)            // index = tier-1; tier 5 on top (room kept below for the quote)
  seg(ctx, nx, ys[4], nx, ys[0], SILVER, 0.14, 1 * u)                  // free rail
  if (LK > 0) {
    seg(ctx, nx, ys[LK - 1], nx, ys[0], pal.glow, 0.16, 7 * u); seg(ctx, nx, ys[LK - 1], nx, ys[0], pal.acc, 0.9, 1.6 * u)
  }
  for (let i = 0; i < 5; i++) {
    const y = ys[i], on = i < LK
    if (on) { dot(ctx, nx, y, 12 * u, pal.glow, 0.1); dot(ctx, nx, y, 8.6 * u, pal.glow, 0.2); dot(ctx, nx, y, 6.6 * u, "#16060B", 1); strokeEll(ctx, nx, y, 6.6 * u, pal.acc, 1, 1.1 * u); lockIcon(ctx, nx, y, 6 * u, pal.name, 1, false) }
    else { dot(ctx, nx, y, 5.4 * u, "#0A0A12", 0.9); strokeEll(ctx, nx, y, 5.4 * u, st === "clear" ? pal.acc : SILVER, st === "clear" ? 0.45 : 0.3, 0.8 * u); lockIcon(ctx, nx, y, 4.6 * u, st === "clear" ? pal.acc : SILVER, st === "clear" ? 0.55 : 0.32, true) }
    text(ctx, tr(`tier ${i + 1}`), FUT(false, 4.7 * u), 4.7 * u, on ? pal.acc : SILVER, on ? 0.9 : 0.35, 224 * u, y - 5.2 * u, "left", 80 * u)
    text(ctx, CHAOS_TIERS[i], FUT(false, 8.9 * u), 8.9 * u, on ? pal.name : SILVER, on ? 1 : 0.42, 224 * u, y + 2.6 * u, "left", 130 * u)
  }
  seg(ctx, x0, 148 * u, x1, 148 * u, "#FFFFFF", 0.07, 0.5)
  quoteLine(ctx, x0, x1, 156 * u, u, LK ? pal.name : SILVER, LK ? 0.82 : 0.78, LK ? pal.acc : SILVER)
}
function strokeEll(ctx, x, y, r, hex, a, w) { ctx.setStrokeColor(col(hex, a)); ctx.setLineWidth(w); ctx.strokeEllipse(new Rect(x - r, y - r, r * 2, r * 2)) }
function strip1(ctx, W, H, u, pal, LK, st) {          // small: header + node row
  const x0 = 14 * u, x1 = W - 14 * u
  seg(ctx, 18 * u, 140 * u, W - 18 * u, 140 * u, pal.acc, LK ? 0.35 : 0.18, 0.6)
  text(ctx, tr(headText(st, LK)), FUT(true, 6.6 * u), 6.6 * u, pal.acc, 1, x0, 147 * u, "left", 90 * u)
  textR(ctx, LK ? `UP TO · ${CHAOS_TIERS[LK - 1]}` : "NO TIERS LOCKED", FUT(false, 5.6 * u), 5.6 * u, LK ? pal.name : SILVER, LK ? 0.95 : 0.5, x1, 147 * u, 110 * u)
  const xs = [0, 1, 2, 3, 4].map((i) => (24 + i * 30.5) * u), y = 158 * u
  seg(ctx, xs[0], y, xs[4], y, SILVER, 0.14, 0.9 * u)
  if (LK > 1) { seg(ctx, xs[0], y, xs[LK - 1], y, pal.glow, 0.18, 6 * u); seg(ctx, xs[0], y, xs[LK - 1], y, pal.acc, 0.9, 1.4 * u) }
  xs.forEach((x, i) => {
    if (i < LK) { dot(ctx, x, y, 8.4 * u, pal.glow, 0.16); dot(ctx, x, y, 5.6 * u, "#16060B", 1); strokeEll(ctx, x, y, 5.6 * u, pal.acc, 1, 1 * u); lockIcon(ctx, x, y, 5 * u, pal.name, 1, false) }
    else { dot(ctx, x, y, 4.8 * u, "#0A0A12", 0.9); strokeEll(ctx, x, y, 4.8 * u, st === "clear" ? pal.acc : SILVER, st === "clear" ? 0.45 : 0.3, 0.7 * u); lockIcon(ctx, x, y, 4 * u, st === "clear" ? pal.acc : SILVER, st === "clear" ? 0.55 : 0.32, true) }
  })
}
// ---- variant 2 · glass cards ----
function panelCards(ctx, W, H, u, pal, LK, st) {
  const x0 = 190 * u, x1 = W - 14 * u, cw = x1 - x0, ch = 19 * u, gap = 3.6 * u, y0 = 40 * u
  text(ctx, tr(headText(st, LK)), FUT(true, 8.6 * u), 8.6 * u, pal.acc, 1, x0 + 2 * u, 23 * u, "left", 120 * u)
  const chip = LK ? `${LK}/5 LOCKED` : "ALL FREE"
  strokeP(ctx, rrPath(x1 - 58 * u, 16.5 * u, 58 * u, 13 * u, 6.5 * u), pal.acc, LK ? 0.7 : 0.4, 0.8 * u)
  fillPath(ctx, rrPath(x1 - 58 * u, 16.5 * u, 58 * u, 13 * u, 6.5 * u), pal.glow, LK ? 0.18 : 0.08)
  text(ctx, tr(chip), FUT(true, 5.2 * u), 5.2 * u, LK ? pal.name : SILVER, LK ? 1 : 0.6, x1 - 29 * u, 23 * u, "center", 58 * u)
  for (let i = 0; i < 5; i++) {
    const y = y0 + i * (ch + gap), on = i < LK, ac = st === "clear" ? pal.acc : SILVER
    if (on) {
      glowRR(ctx, x0, y, cw, ch, 7 * u, pal.glow, 0.55, 3.2 * u)
      fillPath(ctx, rrPath(x0, y, cw, ch, 7 * u), "#1A0509", 0.55); fillPath(ctx, rrPath(x0, y, cw, ch, 7 * u), pal.glow, 0.2)
      seg(ctx, x0 + 7 * u, y + 0.9 * u, x0 + cw - 7 * u, y + 0.9 * u, "#FFFFFF", 0.16, 0.7 * u)        // glass sheen
      strokeP(ctx, rrPath(x0, y, cw, ch, 7 * u), pal.acc, 0.85, 0.8 * u)
      dot(ctx, x0 + 11 * u, y + ch / 2, 6 * u, pal.glow, 0.3); lockIcon(ctx, x0 + 11 * u, y + ch / 2, 6.2 * u, pal.name, 1, false)
    } else {
      strokeP(ctx, rrPath(x0, y, cw, ch, 7 * u), ac, st === "clear" ? 0.32 : 0.18, 0.7 * u)
      lockIcon(ctx, x0 + 11 * u, y + ch / 2, 5.2 * u, ac, st === "clear" ? 0.5 : 0.3, true)
    }
    text(ctx, CHAOS_TIERS[i], FUT(false, 8.6 * u), 8.6 * u, on ? pal.name : SILVER, on ? 1 : 0.42, x0 + 23 * u, y + ch / 2 + 0.6 * u, "left", 120 * u)
    textR(ctx, tr(`t${i + 1}`), FUT(true, 5.2 * u), 5.2 * u, on ? pal.acc : SILVER, on ? 0.95 : 0.3, x0 + cw - 8 * u, y + ch / 2 + 0.4 * u, 24 * u)
  }
}
function strip2(ctx, W, H, u, pal, LK, st) {
  const x0 = 14 * u, x1 = W - 14 * u
  text(ctx, tr(headText(st, LK)), FUT(true, 6.6 * u), 6.6 * u, pal.acc, 1, x0, 146 * u, "left", 90 * u)
  textR(ctx, LK ? `${LK}/5 LOCKED` : "ALL FREE", FUT(true, 5.6 * u), 5.6 * u, LK ? pal.name : SILVER, LK ? 1 : 0.5, x1, 146 * u, 80 * u)
  const pw = 26 * u, g = 4.5 * u, sx = (W - (5 * pw + 4 * g)) / 2, py = 152 * u, ph = 12 * u
  for (let i = 0; i < 5; i++) {
    const x = sx + i * (pw + g), on = i < LK, ac = st === "clear" ? pal.acc : SILVER
    if (on) { glowRR(ctx, x, py, pw, ph, 6 * u, pal.glow, 0.55, 2.6 * u); fillPath(ctx, rrPath(x, py, pw, ph, 6 * u), "#1A0509", 0.55); fillPath(ctx, rrPath(x, py, pw, ph, 6 * u), pal.glow, 0.22); strokeP(ctx, rrPath(x, py, pw, ph, 6 * u), pal.acc, 0.85, 0.7 * u); lockIcon(ctx, x + 8 * u, py + ph / 2, 5 * u, pal.name, 1, false) }
    else { strokeP(ctx, rrPath(x, py, pw, ph, 6 * u), ac, st === "clear" ? 0.32 : 0.18, 0.6 * u); lockIcon(ctx, x + 8 * u, py + ph / 2, 4.2 * u, ac, st === "clear" ? 0.5 : 0.3, true) }
    text(ctx, `${i + 1}`, FUT(true, 6.4 * u), 6.4 * u, on ? pal.name : SILVER, on ? 1 : 0.4, x + 18.5 * u, py + ph / 2 + 0.4 * u, "center", 12 * u)
  }
}
// ---- variant 3 · big count + segmented meter + 2-column name grid ----
function panelMeter(ctx, W, H, u, pal, LK, st) {
  const x0 = 196 * u, x1 = W - 16 * u
  text(ctx, tr(headText(st, LK)), FUT(true, 7.4 * u), 7.4 * u, pal.acc, 1, x0, 22 * u, "left", 120 * u)
  glowText(ctx, `${LK}`, FUT(false, 40 * u), 40 * u, LK ? pal.name : SILVER, x0, 52 * u, "left", 1.4)
  text(ctx, "/5", FUT(false, 14 * u), 14 * u, pal.acc, 0.9, x0 + (LK >= 10 ? 46 : 27) * u, 57 * u, "left", 40 * u)
  text(ctx, tr(LK ? "tiers locked" : "all tiers free"), FUT(false, 5.2 * u), 5.2 * u, SILVER, 0.55, x0 + 66 * u, 46 * u, "left", 90 * u)
  text(ctx, tr(LK ? `up to tier ${LK}` : "wall is clear"), FUT(false, 5.2 * u), 5.2 * u, pal.acc, 0.85, x0 + 66 * u, 56 * u, "left", 90 * u)
  const mw = (x1 - x0 - 4 * 3 * u) / 5, my = 74 * u
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * (mw + 3 * u), on = i < LK
    if (on) { glowRR(ctx, x, my, mw, 7 * u, 3.5 * u, pal.glow, 0.7, 3 * u); fillPath(ctx, rrPath(x, my, mw, 7 * u, 3.5 * u), pal.acc, 0.95) }
    else fillPath(ctx, rrPath(x, my, mw, 7 * u, 3.5 * u), st === "clear" ? pal.acc : SILVER, st === "clear" ? 0.22 : 0.12)
    text(ctx, `${i + 1}`, FUT(true, 5 * u), 5 * u, on ? pal.name : SILVER, on ? 0.9 : 0.35, x + mw / 2, my + 14 * u, "center", 20 * u)
  }
  seg(ctx, x0, 96 * u, x1, 96 * u, pal.acc, 0.25, 0.5)
  const cols = [x0, x0 + 80 * u], rows = [111, 128, 145]
  CHAOS_TIERS.forEach((nm, i) => {
    const x = cols[i % 2], y = rows[Math.floor(i / 2)] * u, on = i < LK, ac = st === "clear" ? pal.acc : SILVER
    lockIcon(ctx, x + 3.4 * u, y, 5.6 * u, on ? pal.acc : ac, on ? 1 : (st === "clear" ? 0.5 : 0.3), !on)
    text(ctx, nm, FUT(false, 8.2 * u), 8.2 * u, on ? pal.name : SILVER, on ? 1 : 0.42, x + 10 * u, y + 0.6 * u, "left", 100 * u)
  })
}
function strip3(ctx, W, H, u, pal, LK, st) {
  const x0 = 14 * u
  seg(ctx, 18 * u, 140 * u, W - 18 * u, 140 * u, pal.acc, LK ? 0.35 : 0.18, 0.6)
  glowText(ctx, `${LK}`, FUT(false, 22 * u), 22 * u, LK ? pal.name : SILVER, x0 + 2 * u, 156 * u, "left", 1.2)
  text(ctx, "/5", FUT(false, 9 * u), 9 * u, pal.acc, 0.9, x0 + 18 * u, 158 * u, "left", 30 * u)
  text(ctx, tr(headText(st, LK)), FUT(true, 5.8 * u), 5.8 * u, pal.acc, 1, 68 * u, 146 * u, "left", 100 * u)
  const mx = 68 * u, mw = (W - 14 * u - mx - 4 * 2.6 * u) / 5, my = 150 * u
  for (let i = 0; i < 5; i++) {
    const x = mx + i * (mw + 2.6 * u), on = i < LK
    if (on) { glowRR(ctx, x, my, mw, 5 * u, 2.5 * u, pal.glow, 0.7, 2.4 * u); fillPath(ctx, rrPath(x, my, mw, 5 * u, 2.5 * u), pal.acc, 0.95) }
    else fillPath(ctx, rrPath(x, my, mw, 5 * u, 2.5 * u), st === "clear" ? pal.acc : SILVER, st === "clear" ? 0.22 : 0.12)
  }
  text(ctx, LK ? CHAOS_TIERS[LK - 1].toUpperCase() : "NO TIERS LOCKED", FUT(false, 5.4 * u), 5.4 * u, LK ? pal.name : SILVER, LK ? 0.9 : 0.5, mx, 161 * u, "left", 100 * u)
}


// ---------------- SKY + QUEST (live: clock time, LIVE.quest from trainToday / cookToday) ----------------
const SKY = () => LIVE.sky
function skyHour() { const S = SKY(); if (S && S.hour != null) return S.hour; return now.getHours() + now.getMinutes() / 60 }
function skyDate() { const S = SKY(); return S && S.date ? new Date(S.date) : now }
function nightP(h) { return h >= 18 ? (h - 18) / 12 : h < 6 ? (h + 6) / 12 : (h < 12 ? 1 : 0) }   // 18:00 → 0 · midnight → 0.5 · 06:00 → 1

const SKYPAL = {      // I = how sinister (0 calm · gold 0.35 · diamond 0.6 · prismatic 1): scales dust lanes, embers, band glow, red stars
  clear:     { I: 0,    haze: ["#4A6AA8", "#5E9AB8", "#DCE8FF"], star: ["#FFFFFF", "#F3F5FF", "#FFE9CC", "#D6E2FF"], ember: [], glow: "#7FD6CC", band: 1 },
  gold:      { I: 0.35, haze: ["#6A4A14", "#B8791E", "#FFE2A8"], star: ["#FFF1D6", "#FFFFFF", "#FFE0A8", "#FFD58A"], ember: ["#FFB347", "#FFD58A"], glow: "#E08A1E", band: 0.85 },
  diamond:   { I: 0.6,  haze: ["#3A1C9A", "#6A44E8", "#C8B8FF"], star: ["#EFEAFF", "#FFFFFF", "#C9BBFF", "#D6E2FF"], ember: ["#B59CFF", "#E4DAFF", "#8A64FF"], glow: "#7A4DFF", band: 0.95 },
  prismatic: { I: 1,    haze: ["#7A0618", "#D0182E", "#FF9A90"], star: ["#FFD0C8", "#FFFFFF", "#FFA8A0", "#FF8A7A"], ember: ["#FF5A2A", "#FF8A3A", "#FFD08A"], glow: "#FF1F3A", band: 1.7 },
}
const skyPal = () => SKYPAL[(LIVE.chaos && LIVE.chaos.state) || "clear"] || SKYPAL.clear
const SINISTER = "#FF1426"          // lit stars bleed to this while a chaos lock is active; strength scales with the tier (gold .40 · diamond .69 · prismatic 1)
const redStar = (c, I, amt) => I > 0 ? mixHex(c, SINISTER, clamp(I * 1.15 * (amt == null ? 1 : amt), 0, 1)) : c
const ell = (ctx, x, y, rx, ry, hex, a) => { ctx.setFillColor(col(hex, a)); ctx.fillEllipse(new Rect(x - rx, y - ry, rx * 2, ry * 2)) }

// Milky Way (realistic): layered value-noise fields along a diagonal band, built from soft stacked dots (Scriptable has no gradients or pixel ops).
// warm dusty bulge (gold / rose) fading to cool blue-violet arms · a Great Rift of irregular dust + filaments · faint emission/reflection patches ·
// thousands of stars with a magnitude power law, colour temperature and clustering. The band slowly turns over the night.
const MWH = (ix, iy, s) => { let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(s, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
function vnoise(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const a = MWH(ix, iy, s), b = MWH(ix + 1, iy, s), c = MWH(ix, iy + 1, s), d = MWH(ix + 1, iy + 1, s)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}
function fbm(x, y, s, o) { let v = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < o; i++) { v += a * vnoise(x * f, y * f, s + i * 17); n += a; a *= 0.5; f *= 2.03 } return v / n }
const MWPAL = {      // warm bulge · rose dust-glow · mid arms · cool outer arms
  clear:     { warm: "#EDE6D6", rose: "#C4D4EA", mid: "#94AED6", cool: "#4E74B8" },   // v12: icy blue-white (was gold / rose / violet)
  gold:      { warm: "#FFD27A", rose: "#E8A050", mid: "#B8791E", cool: "#7A5418" },
  diamond:   { warm: "#CDB6FF", rose: "#9A7AF0", mid: "#6A44E8", cool: "#3A22A8" },
  prismatic: { warm: "#FF9A80", rose: "#E0203A", mid: "#A01020", cool: "#7A0618" },
}
const STAR_TEMP = [[0.1, "#D2DCF2"], [0.34, "#E8ECF6"], [0.66, "#FFFFFF"], [0.84, "#FFF0CE"], [0.95, "#FFC890"], [1, "#FF9E7A"]]

// ---- 55 galaxy patterns: every parameter is a golden-ratio fraction of the index, so no two patterns share a tilt, spine curve, width or core position ----
const GAL_N = 55
const frac = (x) => x - Math.floor(x)
function galaxyPattern(k) {
  k = ((k % GAL_N) + GAL_N) % GAL_N
  return { k, a: frac(k * 0.6180339887 + 0.07), b: frac(k * 0.4142135624 + 0.31), c: frac(k * 0.7320508076 + 0.52), d: frac(k * 0.2360679775 + 0.11), e: frac(k * 0.6457513111 + 0.83), f: frac(k * 0.3819660113 + 0.43), ox: k * 13.7 + 5.1, oy: k * 7.3 + 2.9 }
}
const dayNumber = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
const galaxyIndex = (d) => Math.floor((d || skyDate()).getTime() / 3600000) % GAL_N      // a new pattern every hour (55 h to go round); the band also drifts with the clock, medal stars ride their slots
// ---- medal stars: coin-like denominations of the total medal count (Gold + Diamond + Prismatic, never chaos / N/A), greedy, merging as medals grow ----
// 100 = 1 SUPERIOR star + 20 specks · 10 = 1 BIG star + 10 specks · 1 = 1 SMALL star + 5 specks
const MEDAL_DENOMS = [100, 10, 1]
const MEDAL_SLOTS = { 100: 16, 10: 9, 1: 9 }            // v13.4: 16 superiors + 9 + 9 covers 0..1,699 exactly (1,555 badges + medals planned)
const MEDAL_SPECKS = { 100: 20, 10: 10, 1: 5 }
function medalCoins(n) {                                // 133 -> {100:1, 10:3, 1:3}; past 1,699 the superiors stay at 16 (cap) and the tens/ones show the remainder
  n = Math.max(0, Math.floor(Number(n) || 0))
  return { 100: Math.min(MEDAL_SLOTS[100], Math.floor(n / 100)), 10: Math.floor((n % 100) / 10), 1: n % 10 }
}
// how much Milky Way the medals have built: 0 → plain dark sky, 33 → a band forming, ~130-200 → the full galaxy
const GAL_GROW_K = 280                                   // v13.4: was 70 (72% full at 90); now ~28% at 90, 66% at 300, 93% at 800, 99.6% at 1,555
const galaxyGrowth = (n) => n > 0 ? 1 - Math.exp(-n / GAL_GROW_K) : 0
// the galaxy counts ALL badges + medals (chaos and N/A medals are excluded by the sheet): badges key + (optional medalsTotal, else gold + diamond + prismatic)
const nz = (v) => { const n = Number(v); return isFinite(n) && n > 0 ? Math.floor(n) : 0 }
function medalTotal(s) {
  if (!s) return 0
  const medals = s.medalsTotal != null ? nz(s.medalsTotal) : nz(s.gold) + nz(s.diamond) + nz(s.prismatic)
  return nz(s.badges) + medals
}
// v9 medal stars, drawn like real astrophotography (not geometry): every star is a hot white core with colour only in its soft Gaussian glow,
// real telescope diffraction spikes (thin, tapering, faint, scaled by brightness, ONE fixed angle for every star like one telescope: big = 4
// Newtonian spikes · superior = JWST-style 6 + 2 short struts, with a faint bloom, airy ring and nebulosity · small = no spikes), and its
// 5 / 10 / 20 specks are real field stars: power-law brightness (a few brighter, many faint), jittered positions, slight colour variation,
// soft glows. 8 natural DESIGNS per tier (open cluster, globular cluster, association, unequal binary, trapezium, reflection nebula, dust lanes,
// cloud edge, field-star stream ...) in four calm colours — white · ice blue-white · soft gold · lavender — plus 5 realistic CHAOS looks per tier.
// I = chaos blood-red bleed (every colour goes through redStar) · pd = dim factor
const SC = {                                                    // the normal palette: [core, glow, outer bloom]
  white: ["#FFFFFF", "#F1F3FD", "#DCE2F6"], ice: ["#FFFFFF", "#CFDDFF", "#93B2F0"],
  gold: ["#FFFDF4", "#FFEBC0", "#EED39A"], lav: ["#FFFFFF", "#E2DAFF", "#B2A2EE"],
}
const SPECK_TINTS = ["#FFFFFF", "#F3F5FF", "#D3E2FF", "#FFEDBA", "#E4DCFF", "#C8D8FF"]
const design = (name, c, o = {}) => ({ name, core: SC[c][0], halo: SC[c][1], bloom: SC[c][2], m: 1, ...o })
const NB = { blue: ["#7E9EF0", "#A9C0FF"], lav: ["#9C88E8", "#C4B4FF"], warm: ["#E8CFA0", "#C9B8F0"], ice: ["#B9CCFF", "#E2E8FF"] }
const neb = (c, at, r, a, o = {}) => ({ c, at, r, a, ...o })                       // a nebula: colours · offset (in star radii) · size · strength
const lane = (at, len, w, ang, a) => ({ at, len, w, ang, a })                        // a dark dust lane drawn in front
// form = how the field stars sit: open (Pleiades-like) · glob (dense core thinning out) · assoc (loose association) · stream (faint field
// stream) · trap (trapezium-like knot) · field (scattered) · edge (embedded along a cloud edge) · dust (dimmed behind dust)
// comp = companions [dx, dy, brightness, colour] (unequal brightness) · neb = nebulae · dust = lanes in front
const STAR_LOOKS = {
  1: [
    design("Lone field star", "white", { form: "stream" }),
    design("Unequal binary", "gold", { form: "field", comp: [[0.36, 0.14, 0.42, "ice"]] }),
    design("Wide pair", "ice", { form: "assoc", comp: [[-1.0, 0.42, 0.55, "white"]] }),
    design("Trapezium knot", "white", { form: "trap", m: 0.8, neb: [neb(NB.lav, [0.05, 0.05], 0.7, 0.13)] }),
    design("Reflection wisp", "ice", { form: "field", neb: [neb(NB.blue, [0.55, -0.3], 0.75, 0.2, { ex: 1.7, ang: 0.5 })] }),
    design("Dust-veiled star", "gold", { form: "dust", m: 0.85, neb: [neb(NB.warm, [0, 0.1], 0.8, 0.2)], dust: [lane([0.1, 0.36], 2.2, 0.3, 0.4, 0.55)] }),
    design("Tiny open cluster", "lav", { form: "open", m: 0.7, sm: 1.9, neb: [neb(NB.blue, [0.2, 0.1], 0.9, 0.14)] }),
    design("Cloud-edge star", "white", { form: "edge", neb: [neb(NB.lav, [-0.85, 0.15], 0.95, 0.22, { ex: 0.7 })] }),
  ],
  10: [
    design("Pleiades-like cluster", "ice", { form: "open", neb: [neb(NB.blue, [0.15, 0.1], 1.0, 0.14, { ex: 1.4, ang: 0.3 })] }),
    design("Unequal binary", "gold", { form: "assoc", comp: [[0.42, -0.22, 0.45, "ice"]] }),
    design("Trapezium group", "white", { form: "trap", m: 0.85, neb: [neb(NB.lav, [0, 0.05], 0.9, 0.16), neb(NB.ice, [0.25, -0.2], 0.5, 0.1)] }),
    design("Dust-lane star", "gold", { form: "dust", neb: [neb(NB.warm, [0, 0], 0.85, 0.12)], dust: [lane([0.05, 0.36], 2.6, 0.26, 0.35, 0.45), lane([-0.25, -0.5], 1.6, 0.18, 0.15, 0.32)] }),
    design("Reflection nebula", "ice", { form: "field", neb: [neb(NB.blue, [0.65, 0.35], 0.95, 0.24, { ex: 1.6, ang: 0.6 })] }),
    design("Field-star stream", "white", { form: "stream" }),
    design("Gas-cloud edge", "lav", { form: "edge", neb: [neb(NB.lav, [-0.95, 0.1], 1.15, 0.24, { ex: 0.65 })], dust: [lane([-0.45, 0.1], 1.9, 0.16, 1.45, 0.35)] }),
    design("Wide triple", "white", { form: "field", comp: [[0.9, -0.42, 0.48, "gold"], [-1.05, 0.62, 0.3, "ice"]] }),
  ],
  100: [
    design("Globular cluster", "gold", { form: "glob", glow: 0.16 }),
    design("Blue supergiant in reflection nebula", "ice", { form: "field", neb: [neb(NB.blue, [0.2, 0.1], 1.3, 0.2, { ex: 1.5, ang: 0.4, n: 24 })] }),
    design("Star in dust lanes", "gold", { form: "dust", neb: [neb(NB.warm, [0, 0], 1.1, 0.16, { n: 20 })], dust: [lane([0, 0.38], 3, 0.26, 0.3, 0.45), lane([-0.15, -0.52], 2.2, 0.18, 0.1, 0.34), lane([0.45, 0.8], 1.6, 0.14, 0.5, 0.3)] }),
    design("Young open cluster", "white", { form: "open", neb: [neb(NB.blue, [0.3, 0.15], 1.1, 0.1, { ex: 1.8, ang: -0.3 })] }),
    design("Trapezium nursery", "lav", { form: "trap", neb: [neb(NB.lav, [0, 0], 1.25, 0.2, { n: 24 }), neb(NB.warm, [0.4, -0.3], 0.6, 0.1)], dust: [lane([-0.55, 0.45], 1.8, 0.22, 0.8, 0.35)] }),
    design("Binary supergiants", "white", { form: "assoc", comp: [[0.55, 0.28, 0.72, "gold"]] }),
    design("Pillar-edge star", "ice", { form: "edge", neb: [neb(["#8FA8E8", "#C2CCF4"], [-0.9, 0.1], 1.2, 0.14, { ex: 0.7, n: 22 }), neb(NB.lav, [-1.1, -0.4], 0.7, 0.14)], dust: [lane([-0.85, 0.08], 1.1, 0.24, 0.05, 0.55)] }),
    design("Stellar stream", "white", { form: "stream", sm: 1.2 }),
  ],
}
// chaos looks (reds allowed): dying, dusty, swallowed stars — also drawn realistically
const RED = ["#FFB8A0", "#FF8A6A", "#FF6A5A", "#E8A080", "#FFD0B8", "#D06070"]
const NR = { red: ["#B0202C", "#FF5A48"], ember: ["#C0401E", "#FF9A5A"], blood: ["#7A0618", "#D0303A"], ash: ["#6A3A40", "#B88A8E"] }
const chaosLook = (name, core, halo, bloom, o = {}) => ({ name, core, halo, bloom, m: 1, tints: RED, band: "#6A2830", ...o })
const CHAOS_LOOKS = {
  1: [
    chaosLook("Ember", "#FFE2C0", "#FF8A4A", "#E0461E", { form: "field", m: 0.85, neb: [neb(NR.ember, [0.3, 0], 0.6, 0.12)] }),
    chaosLook("Dying red dwarf", "#FFB0A0", "#E0505A", "#A01020", { form: "assoc", m: 0.75, comp: [[0.4, -0.2, 0.3, null]] }),
    chaosLook("Blood point", "#FFE0E0", "#FF2A3A", "#C0101E", { form: "dust", dust: [lane([0.15, 0], 2.2, 0.3, 1.1, 0.4)] }),
    chaosLook("Smoulder haze", "#FFC8B8", "#D04050", "#902030", { form: "edge", neb: [neb(NR.red, [-0.6, 0.1], 1.0, 0.22)] }),
    chaosLook("Ash ghost", "#E8D0D0", "#B88A8E", "#5A2228", { form: "field", m: 0.55, fx: "pn" }),
  ],
  10: [
    chaosLook("Dying red giant", "#FFD0B8", "#FF6A4A", "#B01818", { form: "field", m: 1.1, neb: [neb(NR.red, [0.7, 0.15], 1.0, 0.22, { ex: 2, ang: 0.2 })], dust: [lane([0.9, 0.3], 1.2, 0.2, 0.4, 0.3)] }),
    chaosLook("Bok globule", "#FFE6D8", "#FF5A48", "#B02030", { form: "field", m: 0.7, fx: "globule", g: [0.25, 0.05, 0.6] }),
    chaosLook("Supernova filament", "#FFE0E0", "#FF4A5A", "#A01828", { form: "field", m: 0.7, fx: "filament", fr: 0.95 }),
    chaosLook("Ember star", "#FFE8C8", "#FF9A50", "#D04A1A", { form: "stream", neb: [neb(NR.ember, [-0.9, 0.2], 0.8, 0.18, { ex: 2.4, ang: 0.15 })] }),
    chaosLook("Blood eclipse", "#FFD8D0", "#FF3040", "#901020", { form: "dust", m: 0.6, fx: "lobes" }),
  ],
  100: [
    chaosLook("Black hole", "#FFC8A0", "#C0303A", "#70101A", { form: "assoc", fx: "blackhole", nostar: true }),
    chaosLook("Supernova remnant", "#FFE0D8", "#FF5A60", "#B01828", { form: "field", m: 0.75, fx: "filament", fr: 1.25 }),
    chaosLook("Blood eclipse sun", "#FFD8C8", "#FF3A3A", "#A01018", { form: "edge", fx: "globule", g: [0.38, 0.05, 0.62] }),
    chaosLook("Shredded star", "#FFE8DC", "#FF6A5A", "#B02838", { form: "stream", m: 0.8, fx: "tde" }),
    chaosLook("Red hypergiant", "#FFD8C0", "#FF5A3A", "#A01418", { form: "field", m: 1.15, neb: [neb(NR.red, [0.1, 0], 1.2, 0.2, { n: 26 }), neb(NR.blood, [0.5, -0.4], 0.8, 0.2)], dust: [lane([0.3, 0.35], 1.5, 0.2, 0.7, 0.3), lane([-0.4, -0.2], 1.1, 0.16, -0.4, 0.28)] }),
  ],
}
// random-but-stable assignment: each tier deals its looks from a seeded shuffled deck (every look once before any repeats, and never the same
// look twice in a row across decks), so star i of a tier keeps its look forever, a new star gets the next card, and nothing reshuffles per
// refresh or per hour. STAR_LOOK_SEED fixes the deal.
const STAR_LOOK_SEED = 20261029
function lookAt(list, d, i, salt) {
  const r = rng(STAR_LOOK_SEED + d * 131 + salt), n = list.length, seq = []
  while (seq.length <= i) {
    const deck = list.map((_, k) => k)
    for (let k = n - 1; k > 0; k--) { const j = Math.floor(r() * (k + 1)); [deck[k], deck[j]] = [deck[j], deck[k]] }
    if (seq.length && deck[0] === seq[seq.length - 1]) [deck[0], deck[n - 1]] = [deck[n - 1], deck[0]]
    seq.push(...deck)
  }
  return list[seq[i]]
}
const starVariant = (d, i) => lookAt(STAR_LOOKS[d], d, i, 0)
const chaosVariant = (d, i) => lookAt(CHAOS_LOOKS[d], d, i, 7)
const chaosRank = (d, i) => MWH(STAR_LOOK_SEED % 99991, d * 31 + i, 91)          // fixed conversion order: the lowest ranks turn first
function psf(ctx, x, y, sg, hex, peak, layers = 8) {        // stacked translucent discs: radii at Gaussian iso-levels, so the summed light falls off like exp(-r²/2σ²)
  const a = 1 - Math.pow(1 - clamp(peak, 0, 0.99), 1 / layers)
  for (let k = 1; k <= layers; k++) dot(ctx, x, y, sg * Math.sqrt(-2 * Math.log(k / (layers + 1))), hex, a)
}
function spikeAt(ctx, x, y, th, len, w, hex, a) {           // one thin diffraction spike pair along angle th, fading along its length (layered tapering slivers)
  const dx = Math.cos(th), dy = Math.sin(th)
  for (let k = 0; k < 4; k++) {
    const l = len * (0.35 + 0.22 * k), ww = w * (1 - k * 0.18), p = new Path()
    p.move(new Point(x - dx * l, y - dy * l)); p.addLine(new Point(x - dy * ww, y + dx * ww))
    p.addLine(new Point(x + dx * l, y + dy * l)); p.addLine(new Point(x + dy * ww, y - dx * ww)); p.closeSubpath()
    fillPath(ctx, p, hex, a * (0.5 - k * 0.1))
  }
}
function softRing(ctx, x, y, r, hex, a, w) {                 // a faint ring with soft edges: three nested strokes (one each, no overlap beads)
  for (const [k, aa] of [[2.6, 0.3], [1.6, 0.55], [0.8, 1]]) { ctx.setStrokeColor(col(hex, a * aa)); ctx.setLineWidth(w * k); ctx.strokeEllipse(new Rect(x - r, y - r, r * 2, r * 2)) }
}
function tiltRing(ctx, x, y, rx, ry, th, hex, a, w) {         // a tilted thin ellipse (a disc or ring seen at an angle), soft-edged
  const c = Math.cos(th), s = Math.sin(th), p = new Path()
  for (let j = 0; j <= 48; j++) { const t = j / 48 * 6.2832, ex = Math.cos(t) * rx, ey = Math.sin(t) * ry, pt = new Point(x + ex * c - ey * s, y + ex * s + ey * c); if (j) p.addLine(pt); else p.move(pt) }
  for (const [k, aa] of [[2.4, 0.3], [1, 1]]) { ctx.addPath(p); ctx.setStrokeColor(col(hex, a * aa)); ctx.setLineWidth(w * k); ctx.strokePath() }
}
function sliver(ctx, x, y, a, r0, r1, w, hex, al) {          // a short tapering radial streak (corona streamers, sparks, cracks)
  const c = Math.cos(a), s = Math.sin(a), p = new Path()
  p.move(new Point(x + c * r0 - s * w, y + s * r0 + c * w)); p.addLine(new Point(x + c * r1, y + s * r1)); p.addLine(new Point(x + c * r0 + s * w, y + s * r0 - c * w)); p.closeSubpath()
  fillPath(ctx, p, hex, al)
}
// ---- v9 realistic drawing ----
const SPIKE_A = 0.21                                                       // one spike angle for every star (one telescope)
const gauss = (q) => (q() + q() + q() - 1.5) * 1.15
const powM = (q, lo, hi) => lo + hi * Math.pow(q(), 3.2)                   // power-law brightness: a few bright, many faint
// v10 tier hierarchy, in points at 1x (p = 1pt): small = faint pinpoint, big = 2x core + 4 spikes, superior = 3-4x core, big bloom, 6+2 JWST spikes
// brightness ~ 10% : 40% : 100%, glow radius ~ 1 : 2.5 : 6; everything in the Milky Way stays below the small tier
const TIER_STAR = {
  1:   { core: 0.5, cpsf: 0.36, ca: 0.4, glow: 0.5, ga: 0.1, bloom: 0, ba: 0, spike: 0 },
  10:  { core: 1.0, cpsf: 0.8, ca: 0.78, glow: 1.25, ga: 0.3, bloom: 2.6, ba: 0.05, spike: 7 },
  100: { core: 1.75, cpsf: 1.3, ca: 0.97, glow: 3.0, ga: 0.6, bloom: 6.5, ba: 0.15, spike: 17 },
}
function spikes(ctx, x, y, p, len, hex, tier, pd) {                       // real diffraction spikes: thin, tapering; len = pt from the centre
  const L = len * p, w = (tier === 100 ? 0.34 : 0.28) * p, a = (tier === 100 ? 0.4 : 0.38) * pd
  const angs = tier === 100 ? [0, Math.PI / 3, -Math.PI / 3] : [0, Math.PI / 2]
  for (const t of angs) spikeAt(ctx, x, y, SPIKE_A + Math.PI / 2 + t, L, w, hex, a)
  if (tier === 100) spikeAt(ctx, x, y, SPIKE_A, L * 0.4, w * 0.75, hex, a * 0.55)   // JWST's two short struts
}
function realStar(ctx, x, y, u, m, cl, tier, pd, fl = 0) {                 // cl = [core, glow, bloom]: hot white centre, colour only in the glow
  const T = TIER_STAR[tier] || TIER_STAR[1], p = u / 1.5, k = clamp(m, 0.12, 1.4), z = Math.sqrt(k) * p
  if (fl) { psf(ctx, x, y, T.glow * z * 3.2, cl[2], 0.2 * pd, 12); psf(ctx, x, y, T.glow * z * 1.6, cl[1], 0.25 * pd, 10) }   // milestone flare: a soft bloom
  if (T.bloom) psf(ctx, x, y, T.bloom * z, cl[2], T.ba * k * pd, 9)
  psf(ctx, x, y, T.glow * z, cl[1], clamp(T.ga * k, 0.04, 0.8) * pd, 7)
  if (tier === 100) softRing(ctx, x, y, T.glow * z * 1.9, cl[1], 0.05 * pd, 0.3 * p)   // a faint airy ring
  if (T.spike && k > 0.3) spikes(ctx, x, y, p, T.spike * Math.min(1.15, k) * (fl ? 1.3 : 1), cl[1], tier, pd * Math.min(1, k))
  psf(ctx, x, y, T.cpsf * z, cl[0], clamp(T.ca * (0.7 + 0.3 * k), 0, 0.96) * pd, 5)
  dot(ctx, x, y, T.core * z * 0.62, cl[0], clamp(T.ca + 0.1, 0, 1) * pd)
}
const SPECK_K = { 1: 0.55, 10: 0.8, 100: 1 }
function speck(ctx, x, y, u, m, c, pd, tier) {                             // a field star: always fainter and smaller than the small medal tier
  const p = u / 1.5, f = SPECK_K[tier] || 1, mm = clamp(m, 0, 0.6)
  psf(ctx, x, y, (0.22 + 0.35 * mm) * p, c, clamp(0.05 + 0.3 * mm, 0, 0.22) * f * pd, 4)
  dot(ctx, x, y, (0.1 + 0.22 * mm) * p, mixHex(c, "#FFFFFF", 0.5), clamp(0.08 + 0.45 * mm, 0, 0.32) * f * pd)
  if (tier === 100 && m > 0.35) spikes(ctx, x, y, p, 2.5 * m, c, 10, pd * 0.45)
}
function nebula(ctx, x, y, R, cA, cB, a, q, ex, ang, n, skip) {             // soft, clumpy gas: many faint Gaussian puffs
  const ca = Math.cos(ang), sa = Math.sin(ang)
  for (let k = 0, N = Math.round(n * 1.6); k < N; k++) {                  // many faint puffs, wide soft edges, so no outline shows
    const gx = gauss(q) * ex * 0.45 * R, gy = gauss(q) * 0.45 * R, bx = x + gx * ca - gy * sa, by = y + gx * sa + gy * ca
    if (skip && skip(bx, by)) continue
    psf(ctx, bx, by, R * (0.14 + 0.24 * q()), mixHex(cA, cB, q()), a * 0.85 * (0.25 + 0.75 * q() * q()), 7)
  }
}
function dustLane(ctx, x, y, len, w, ang, a, q, skip) {                   // a dark, ragged dust lane
  const ca = Math.cos(ang), sa = Math.sin(ang), n = 18, ph = q() * 6.28
  for (let k = 0; k <= n; k++) {
    const f = k / n - 0.5, t = f * len, o = Math.sin(k * 0.45 + ph) * w * 0.5 + gauss(q) * w * 0.15
    const ww = w * (0.5 + 0.5 * Math.sin(k * 0.7 + ph * 2) ** 2) * (1 - 1.3 * f * f), bx = x + t * ca - o * sa, by = y + t * sa + o * ca
    if (skip && skip(bx, by)) continue
    psf(ctx, bx, by, ww * 0.9, "#020208", a * 0.34, 7)
  }
}
function field(form, n, q) {                                               // field-star positions (star radii) + brightness
  const P = [], add = (x, y, m) => P.push([x, y, m])
  switch (form) {
    case "open": { const cx = 0.2 * gauss(q), cy = 0.2 * gauss(q), mem = Math.ceil(n * 0.65)
      for (let k = 0; k < n; k++) k < mem ? add(cx + gauss(q) * 0.5, cy + gauss(q) * 0.42, powM(q, 0.08, 0.4) + (k < 3 ? 0.12 : 0)) : add(gauss(q) * 1.1, gauss(q) * 0.9, powM(q, 0.03, 0.15)); break }
    case "glob": for (let k = 0; k < n * 3; k++) { const r = 0.05 + 1.05 * Math.pow(q(), 1.9), a = q() * 6.283; add(Math.cos(a) * r, Math.sin(a) * r, k < n ? powM(q, 0.05, 0.3) * (1.15 - 0.5 * r) : 0.025 + 0.05 * q()) } break
    case "assoc": { const G = [0, 1, 2].map(() => { const a = q() * 6.283, r = 0.6 + 0.5 * q(); return [Math.cos(a) * r, Math.sin(a) * r] })
      for (let k = 0; k < n; k++) { const g = G[k % 3]; add(g[0] + gauss(q) * 0.28, g[1] + gauss(q) * 0.24, powM(q, 0.04, 0.32)) } break }
    case "stream": { const b = 0.15 * gauss(q); for (let k = 0; k < n; k++) { const t = (q() * 2 - 1) * 1.45; add(t, 0.16 * t * t - 0.1 + b * t + gauss(q) * 0.08, powM(q, 0.03, 0.26)) } break }
    case "trap": { const T = [[0.3, -0.08, 0.42], [-0.2, 0.24, 0.32], [0.06, 0.36, 0.25], [-0.26, -0.2, 0.2]]
      for (let k = 0; k < n; k++) k < 4 ? add(T[k][0] * (0.9 + 0.2 * q()), T[k][1] * (0.9 + 0.2 * q()), T[k][2]) : add(gauss(q) * 0.85, gauss(q) * 0.75, powM(q, 0.03, 0.14)); break }
    case "edge": for (let k = 0; k < n; k++) add(-0.15 - 0.85 * q(), gauss(q) * 0.55, powM(q, 0.04, 0.3)); break
    case "dust": for (let k = 0; k < n; k++) { const a = q() * 6.283, r = 0.3 + 0.95 * Math.sqrt(q()); add(Math.cos(a) * r, Math.sin(a) * r * 0.85, powM(q, 0.03, 0.2)) } break
    default: for (let k = 0; k < n; k++) { const a = q() * 6.283, r = 0.3 + 0.95 * Math.sqrt(q()); add(Math.cos(a) * r, Math.sin(a) * r * 0.85, powM(q, 0.03, 0.32)) }   // "field"
  }
  return P
}
// chaos structures (realistic): a dark globule with a red rim, supernova filaments, a black hole, a tidal stream, a bipolar dusty disc, a faint shell
function chaosFx(ctx, x, y, R, u, v, B, q, th, pd, skip, front, m) {
  const P = (fx, fy) => [x + (fx * Math.cos(th) - fy * Math.sin(th)) * R, y + (fx * Math.sin(th) + fy * Math.cos(th)) * R]
  switch (v.fx) {
    case "globule": if (front) { const [gx, gy] = P(v.g[0], v.g[1]), r = v.g[2] * R
      for (let k = 0; k < 16; k++) { const a = q() * 6.283, rr = r * (0.85 + 0.2 * q())                // a ragged red rim, lit from behind
        psf(ctx, gx + Math.cos(a) * rr, gy + Math.sin(a) * rr, r * (0.18 + 0.15 * q()), B(mixHex(v.halo, v.bloom, q())), 0.1 * pd, 6) }
      for (let k = 0; k < 14; k++) psf(ctx, gx + gauss(q) * r * 0.32, gy + gauss(q) * r * 0.28, r * (0.22 + 0.2 * q()), "#010103", 0.32 * pd, 10) } break
    case "filament": if (!front) { nebula(ctx, x, y, R * 0.8, B("#40080E"), B(v.bloom), 0.08 * pd, q, 1, 0, 10, skip)
      for (let k = 0; k < 6; k++) { const a0 = k * 1.05 + q() * 0.6, span = 0.35 + q() * 0.55, r0 = R * v.fr * (0.6 + 0.55 * q()), p = new Path(), c = B(mixHex("#FF5A48", "#FF9A6A", q()))
        const wv = 0.02 + 0.03 * q(), ph = q() * 6.28
        for (let j = 0; j <= 24; j++) { const t = a0 + span * j / 24, rr = r0 * (1 + wv * Math.sin(j * 0.32 + ph)), pt = new Point(x + Math.cos(t) * rr, y + Math.sin(t) * rr * 0.88); j ? p.addLine(pt) : p.move(pt) }
        for (const [w, al] of [[2.2, 0.05], [1, 0.1], [0.4, 0.22 + 0.2 * q()]]) { ctx.addPath(p); ctx.setStrokeColor(col(c, al * pd)); ctx.setLineWidth(w * u); ctx.strokePath() } } } break
    case "blackhole": if (!front) { psf(ctx, x, y, R * 0.75, B(v.bloom), 0.16 * pd, 9); nebula(ctx, x, y, R * 0.55, B(v.bloom), B(v.halo), 0.12 * pd, q, 3, 0.25, 12, skip)
      for (let k = 0; k < 16; k++) { const t = -1.3 + 2.6 * k / 15, r = R * 0.3; psf(ctx, x + Math.cos(t + 0.3) * r, y + Math.sin(t + 0.3) * r, R * 0.1, B(mixHex(v.core, v.halo, Math.abs(t) / 1.3)), 0.25 * (1 - 0.6 * Math.abs(t) / 1.3) * pd, 4) }
      for (let k = 0; k < 9; k++) { const t = 1.6 + 3 * k / 8, r = R * 0.3; psf(ctx, x + Math.cos(t + 0.3) * r, y + Math.sin(t + 0.3) * r, R * 0.07, B(v.halo), 0.12 * pd, 4) }
      psf(ctx, x, y, R * 0.18, "#000000", 0.85, 7); dot(ctx, x, y, R * 0.16, "#000000", 0.9) } break
    case "tde": if (!front) { for (let k = 0; k < 60; k++) { const f = Math.pow(q(), 0.8), a = th + f * 3.4 + gauss(q) * 0.08, r = R * (0.12 + 1.0 * f) * (1 + gauss(q) * 0.06), [sx, sy] = [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.75]
      if (skip && skip(sx, sy)) continue; psf(ctx, sx, sy, R * (0.04 + 0.07 * f) * (0.6 + 0.8 * q()), B(mixHex(v.halo, "#FF9A6A", f)), 0.16 * (1 - 0.7 * f) * pd, 5) } } break
    case "lobes": if (!front) { for (const s of [-1, 1]) { const [lx, ly] = P(0, s * 0.42); nebula(ctx, lx, ly, R * 0.65, B(NR.red[0]), B(NR.red[1]), 0.22 * pd, q, 1.5, th, 12, skip) } }
      else dustLane(ctx, x, y, R * 2.2, R * 0.26, th, 0.55 * pd, q, skip); break
    case "pn": if (!front) { for (let k = 0; k < 20; k++) { const a = q() * 6.283, r = R * (0.55 + 0.12 * gauss(q)); psf(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.85, R * 0.16, B(mixHex("#B88A8E", "#7A9EB0", q())), 0.07 * pd, 4) } } break
  }
}
// a medal star in its natural setting; the setting turns slowly through the day (rot) while spikes keep the telescope's angle; skip(x, y) drops on UI
function medalCluster(ctx, x, y, u, d, I, seed, pd = 1, tw = 1, ang = 0, skip = null, rot = 0, fl = 0, v = null) {
  const q = rng(seed), R = { 1: 4.4, 10: 7, 100: 10.5 }[d] * u, n = MEDAL_SPECKS[d]
  v = v || starVariant(d, 0)
  const B = (c, amt = 0.9) => redStar(c, I, amt), th = q() * 6.283 + rot, ct = Math.cos(th), st = Math.sin(th)
  const P = (fx, fy) => [x + (fx * ct - fy * st) * R, y + (fx * st + fy * ct) * R], tints = v.tints || SPECK_TINTS
  psf(ctx, x, y, R * 0.85, B(v.band || "#B8C6DE"), 0.05 * pd, 6)                 // unresolved starlight: sits inside the Milky Way band
  if (v.glow) psf(ctx, x, y, R * 0.42, B(v.halo), v.glow * pd, 8)                 // a globular's unresolved core
  for (const nb of v.neb || []) { const [nx, ny] = P(nb.at[0], nb.at[1]); nebula(ctx, nx, ny, nb.r * R, B(nb.c[0]), B(nb.c[1]), nb.a * pd, q, nb.ex || 1, th + (nb.ang || 0), nb.n || (d === 100 ? 18 : d === 10 ? 13 : 9), skip) }
  if (v.fx) chaosFx(ctx, x, y, R, u, v, B, q, th, pd, skip, false)
  for (const [fx, fy, m] of field(v.form, n, q)) {
    const [sx, sy] = P(fx, fy), c = B(mixHex(v.halo, tints[Math.floor(q() * tints.length)], 0.35 + 0.5 * q()))
    if (skip && skip(sx, sy)) continue
    speck(ctx, sx, sy, u, m * (v.sm || 1), c, pd, d)
  }
  for (const [cx, cy, m, k] of v.comp || []) {
    const [sx, sy] = P(cx, cy), c = SC[k] || [v.core, v.halo, v.bloom]
    if (skip && skip(sx, sy)) continue
    realStar(ctx, sx, sy, u, m * 0.75, [B(c[0], 0.45), B(c[1]), B(c[2])], d, pd, 0)
  }
  const m = clamp(v.m || 1, 0.8, 1.15) * tw
  if (!v.nostar) realStar(ctx, x, y, u, m, [B(v.core, 0.45), B(v.halo), B(v.bloom)], d, pd, fl)
  else if (fl) psf(ctx, x, y, R * 1.2, B(v.bloom), 0.2 * pd, 12)
  for (const ln of v.dust || []) { const [lx, ly] = P(ln.at[0], ln.at[1]); dustLane(ctx, lx, ly, ln.len * R, ln.w * R, th + ln.ang, ln.a * pd, q, skip) }
  if (v.fx) chaosFx(ctx, x, y, R, u, v, B, q, th, pd, skip, true)
}
// milestone flare: remember the last count + day in Scriptable's local storage; when the count crosses a new hundred (a new superior star is
// born) that superior shows a burst ring for the rest of the day. Only live/cached sheet data counts (never the built-in snapshot). Safe anywhere.
const milestonePath = () => fm.joinPath(fm.documentsDirectory(), "grok-fitness-milestone.json")
function milestoneFlare(n, source) {
  const today = dayNumber(skyDate())
  let st = null
  try { if (fm.fileExists(milestonePath())) st = JSON.parse(fm.readString(milestonePath())) } catch (e) { st = null }
  let flare = st && st.flare && st.flare.day === today ? st.flare : null
  if (source === "snapshot") return flare ? flare.h : 0
  if (st && Number.isFinite(st.count) && Math.floor(n / 100) > Math.floor(st.count / 100) && n < MEDAL_SLOTS[100] * 100 + 100) flare = { day: today, h: Math.floor(n / 100) }
  try { fm.writeString(milestonePath(), JSON.stringify({ count: n, day: today, flare })) } catch (e) {}
  return flare ? flare.h : 0
}
const fbmRaw = fbm
// v13.8: how bright a medal star may be at (x, y) in the medium widget: 1 in the open sky, softened behind the quest panel's text
function flowDim(W, H, x, y) {
  const u = H / 170, X = x / u, Y = y / u
  const inP = smooth(clamp((X - 170) / 14, 0, 1))                                    // soft ramp: fully softened by the panel edge (184u)
  if (inP <= 0) return 1
  const verse = smooth(clamp((Y - 56) / 8, 0, 1))
  const k = GAL_FLOW === 2 ? 0.36 - 0.08 * verse : GAL_FLOW === 3 ? 0.55 : 0.5      // 1: 50% · 2: tiles 36%, verse lane 28% · 3: small stars 55%
  return 1 - inP * (1 - k)
}
function drawMilkyWay(ctx, W, H, p, pal, s) {
  const u = H / 170, wide = W > 250
  const PAT = galaxyPattern(galaxyIndex()), r = rng(4242 + PAT.k * 977)
  const fbm = (x, y, s, o) => fbmRaw(x + PAT.ox, y + PAT.oy, s, o)           // a different slice of the noise per pattern: other dust lanes, clumps and clusters
  const kind = (LIVE.chaos && LIVE.chaos.state) || "clear", M = MWPAL[kind] || MWPAL.clear
  const ARC2 = wide && C_MED() && GAL_FLOW === 2                                                    // v13.8 (2): flatter band that arcs over the whole widget
  const base = wide ? (ARC2 ? -14 + 20 * PAT.a : -30 + 38 * PAT.a) : -60 + 52 * PAT.a, ang = (base + (0.5 - p) * (ARC2 ? 8 : 16)) * Math.PI / 180
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx
  const cx = W * (0.5 + (p - 0.5) * 0.06), cy = H * (wide ? 0.5 : 0.46)
  const L = Math.hypot(W, H) * 0.62, sig = (wide ? 17 : 19) * u * (0.82 + 0.44 * PAT.e)
  const wob = (t) => 1 + 0.28 * Math.sin(t / (46 * u)) + 0.12 * Math.sin(t / (17 * u) + 1.3)
  const t0 = -L * (wide ? 0.4 : 0.34) * (0.55 + 0.9 * PAT.f)                                          // galactic core: where the XP light sits
  const bulge = (t) => 0.5 + 0.5 * Math.exp(-Math.pow((t - t0) / (L * 0.46), 2))
  // the spine of the band is an S-curve whose phase drifts slowly through the day (the whole galaxy flows)
  const hr = skyHour(), amp = (3 + 13 * PAT.b) * u, lam = (40 + 62 * PAT.c) * u, ph = PAT.d * 6.283 + 1.4 * Math.sin(hr * 0.2618)
  const arc = ARC2 ? (PAT.b < 0.5 ? 1 : -1) * (34 + 16 * PAT.e) * u : 0                             // v13.8 (2): arches up or sags, by pattern
  const spine = (t) => amp * (Math.sin(t / lam + ph) + 0.32 * Math.sin(t / (lam * 0.47) + 2 * ph)) + arc * (Math.pow(t / (L * 0.62), 2) - 0.45)
  __BAND = { cx, cy, dx, dy, nx, ny, L, sig, u, wide, t0, spine }
  const at = (t, off) => { const o = off + spine(t); return [cx + dx * t + nx * o, cy + dy * t + ny * o] }
  const I = pal.I, band = pal.band
  // dust: the Great Rift (a lane that wanders along the spine, splitting) + ridged filaments
  const dustAt = (t, off) => {
    const s = sig * wob(t)
    const roff = s * (0.14 * Math.sin(t / (33 * u) + 0.7) + 0.5 * (fbm(t / (70 * u), 0.5, 8, 2) - 0.5) - 0.06)
    const rw = s * (0.2 + 0.16 * fbm(t / (24 * u), 1.7, 9, 2))
    const m = smooth(clamp((t + 0.5 * L) / (0.4 * L), 0, 1)) * (1 - smooth(clamp((t - 0.72 * L) / (0.28 * L), 0, 1)))
    const rift = Math.exp(-Math.pow((off - roff) / rw, 2)) * m * (0.55 + 0.6 * fbm(t / (16 * u), off / (5 * u), 10, 3))
    const split = Math.exp(-Math.pow((off - roff - s * 0.75) / (rw * 0.55), 2)) * m * clamp(fbm(t / (40 * u), 2.2, 12, 2) * 1.6 - 0.4, 0, 1) * 0.8
    const rid = 1 - Math.abs(2 * fbm(t / (17 * u), off / (5.5 * u), 11, 4) - 1)
    const fil = clamp((rid - 0.8) / 0.18, 0, 1) * Math.exp(-Math.pow(off / (s * 1.5), 2)) * 0.75
    return clamp((rift + split) * 1.05 + fil + 0.3 * I * fil, 0, 1)
  }
  // ---- THE MEDALS BUILD THE GALAXY: medal slots are placed first (band coords), then every cloud/dust/star-cloud layer is weighted by
  // mask(t, off) = global growth from the medal count + a local wisp of light around each medal star that is actually lit ----
  const coins = medalCoins(medalTotal(s))
  const med = C_MED(), rcx = (med ? RING_MED.x : 85) * u, rcy = (med ? RING_MED.y : wide ? 66 : 50) * u, rcr = (med ? RING_MED.r + 4 : wide ? 44 : 35) * u, py = (wide ? 134 : 110) * u
  const blocked = (x, y, m) => Math.hypot(x - rcx, y - rcy) < rcr + m || (med ? false : y > py - 16 * u - m && (!wide || x < 166 * u)) || x < 3 * u + m || x > W - 3 * u - m || y < 3 * u + m || y > H - 3 * u - m
  const SZ = { 100: 12, 10: 8.5, 1: 5.2 }                                // keep-clear radius per star incl. its speck cluster (u)
  const fb = (x) => med && GAL_FLOW ? 1 + [0, 0.75, 0.75, 0.3][GAL_FLOW] * smooth(clamp((x - 160 * u) / (44 * u), 0, 1)) : 1   // v13.8: the band keeps its glow behind the quest haze
  const rightNo = (d) => !med || GAL_FLOW === 0 || (GAL_FLOW === 3 && d !== 1)   // v13.8: 1/2 = everyone flows right · 3 = only the small stars · 0 = v13.7
  const order = []
  for (const d of MEDAL_DENOMS) for (let i = 0; i < Math.min(9, MEDAL_SLOTS[d]); i++) order.push({ d, i })
  for (let i = 9; i < MEDAL_SLOTS[100]; i++) order.push({ d: 100, i })        // v13.4: extra superiors placed LAST so the first 27 slots keep their spots
  const spots = []
  order.forEach((S) => {
  const q = rng(Math.floor(MWH(S.d * 31 + S.i, 37, 919) * 4294967295))
  const sz = SZ[S.d] * u
    let best = null
    for (let tries = 0; tries < 260; tries++) {
    const spread = tries < 120 ? 1 : 1.5                                                   // first along the band's heart, then a little wider
    const t = (q() * 2 - 1) * L * 0.85, g = (q() + q() + q() - 1.5) / 0.5 * 0.55 * spread, off = g * sig * wob(t)
    const [x, y] = at(t, off)
      if (blocked(x, y, sz * 0.45) || (wide && (rightNo(S.d) || (GAL_FLOW === 1 && S.d === 100 && tries < 150)) && x > 182 * u - sz * 0.6)) continue   // v13.8: GAL_FLOW decides who may cross into the quest side (1: superiors try the open sky first)
    const k = tries < 100 ? 1 : tries < 180 ? 0.8 : 0.6
      if (spots.some((o) => !o.none && Math.hypot(o.x - x, o.y - y) < (o.sz + sz) * 0.62 * k)) continue
      best = { t, off, x, y, sz }; break
    }
    for (let tries = 0; !best && tries < 400; tries++) {                                    // never drop a star: last resort, anywhere clear on the band
    const t = (q() * 2 - 1) * L * 0.95, off = (q() * 2 - 1) * sig * 2.2, [x, y] = at(t, off)
      if (blocked(x, y, sz * 0.25) || (wide && rightNo(S.d) && x > 182 * u)) continue
      if (spots.some((o) => !o.none && Math.hypot(o.x - x, o.y - y) < (o.sz + sz) * 0.3)) continue
      best = { t, off, x, y, sz }
    }
    spots.push({ ...S, q, ...(best || { none: true, sz }) })
  })
  const NMED = medalTotal(s), GROW = galaxyGrowth(NMED)
  const WISP = { 100: [0.75, 46, 1.6], 10: [0.5, 26, 1.25], 1: [0.32, 14, 0.95] }      // peak, reach along the band (u), width (x sigma)
  const lit = spots.filter((S) => !S.none && S.i < coins[S.d]).map((S) => ({ t: S.t, off: S.off, w: WISP[S.d][0], lt: WISP[S.d][1] * u, lo: WISP[S.d][2] * sig }))
  const mask = (t, off) => {
    let m = GROW * (0.25 + 0.75 * Math.exp(-Math.pow(off / (sig * 2.4), 2)))
    for (const S of lit) { const a = (t - S.t) / S.lt, o = (off - S.off) / S.lo; if (a * a + o * o < 9) m += S.w * Math.exp(-a * a - o * o) * (1 - 0.6 * GROW) }
    return clamp(m, 0, 1)
  }
  __BAND.grow = GROW; __BAND.n = NMED
  // ---- smooth base haze: cool blue-violet arms warming toward the bulge (no noise yet, so the band reads as one continuous river) ----
  for (let i = 0, n = wide ? 90 : 66; i <= n; i++) {
    const t = -L + 2 * L * i / n, s = sig * wob(t), b = bulge(t), [x, y] = at(t, 0)
    const wm = clamp(Math.exp(-Math.pow((t - t0) / (L * 0.5), 2)) * 1.1, 0, 1), mk = mask(t, 0)
    if (mk < 0.01) continue
    const f0 = fb(x)
    ell(ctx, x, y, s * 2.2, s * 1.25, mixHex(M.cool, M.mid, 0.4 + 0.4 * wm), 0.022 * b * band * mk * f0)
    ell(ctx, x, y, s * 1.4, s * 0.75, mixHex(M.mid, M.rose, wm * 0.7), 0.02 * b * band * mk * f0)
    ell(ctx, x, y, s * 0.8, s * 0.42, mixHex(M.rose, M.warm, wm), 0.02 * b * band * (0.4 + wm) * mk * f0)
  }
  const mk0 = mask(t0, 0); if (mk0 > 0.01) for (let i = 0; i < 9; i++) { const [kx, ky] = at(t0, 0); ell(ctx, kx, ky, (46 - i * 4.4) * u, (24 - i * 2.3) * u, i < 5 ? M.rose : M.warm, 0.012 * band * (1 + i * 0.35) * mk0) }
  const st = (wide ? 2.5 : 2.3) * u
  // ---- glow + dust cells ----
  for (let t = -L; t <= L; t += st) {
    const s = sig * wob(t), b = bulge(t), rj = 3.2 * s
    for (let off = -rj; off <= rj; off += st) {
      const j1 = MWH(Math.round(t / st), Math.round(off / st), 1), j2 = MWH(Math.round(t / st), Math.round(off / st), 2)
      const tt = t + (j1 - 0.5) * st * 0.9, oo = off + (j2 - 0.5) * st * 0.9
      const [x, y] = at(tt, oo)
      if (x < -6 * u || x > W + 6 * u || y < -6 * u || y > H + 6 * u) continue
      const mk = mask(tt, oo); if (mk < 0.01) continue
      const g = oo / s, env = Math.exp(-g * g * 0.5)
      const clump = 0.72 + 0.7 * fbm(tt / (24 * u), oo / (9 * u), 3, 4)             // cloudy, with irregular edges
      const edge = 0.75 + 0.5 * fbm(tt / (9 * u), oo / (4 * u), 6, 3)
      let d = env * b * clump * edge * mk
      const dust = dustAt(tt, oo)
      d *= 1 - 0.88 * dust
      const cw = Math.exp(-Math.pow((tt - t0) / (L * 0.22), 2) - Math.pow(oo / (sig * 1.35), 2))     // the bulge itself
      const bw = Math.exp(-Math.pow((tt - t0) / (L * 0.5), 2)) * 0.55
      d += cw * 0.9 * (1 - 0.8 * dust) * mk
      if (d > 0.03) {
        let c = mixHex(M.cool, M.mid, clamp(0.35 + 0.65 * (1 - Math.abs(g) / 2.2) + 0.25 * (tt < t0 ? 0.3 : -0.1), 0, 1))
        const rose = clamp((fbm(tt / (50 * u), oo / (20 * u), 5, 3) - 0.46) * 3.4, 0, 1) * (0.3 + bw)
        c = mixHex(c, M.rose, clamp(rose * 0.7, 0, 0.7))
        c = mixHex(c, M.warm, clamp(cw * 1.1 + bw * 0.45 * env, 0, 0.92))
        const f1 = fb(x)
        ell(ctx, x, y, st * 2.6, st * 2.0, c, 0.0135 * d * band * f1)
        ell(ctx, x, y, st * 1.2, st * 0.95, mixHex(c, "#FFFFFF", 0.18 + 0.3 * cw), 0.026 * d * band * (0.5 + 0.9 * edge) * f1)
      }
      if (dust > 0.28) ell(ctx, x, y, st * 1.5, st * 1.1, "#02020A", 0.21 * dust * (0.8 + 0.4 * I) * mk)
    }
  }
  // ---- faint nebula patches: an emission knot (rose), a reflection wisp (teal / haze) and a blue veil ----
  const fl = PAT.c < 0.5 ? 1 : -1, sh = (PAT.b - 0.5) * 0.5
  const NEB = [[-0.58 + sh, 1.05 * fl, 9, M.rose, 0.034], [0.22 + sh, -1.25 * fl, 11, pal.haze[1], 0.026], [-0.05 + sh, 1.55 * fl, 8, M.cool, 0.03], [0.55 + sh, 0.6 * fl, 7, M.rose, 0.022]]
  NEB.forEach(([tf, of, rad, c, a], k) => {
    const nq = rng(300 + k + PAT.k * 61)
    for (let i = 0; i < 20; i++) {
      const a1 = nq() * 6.283, rr = Math.sqrt(nq()) * rad * u
      const [x, y] = at(L * tf + Math.cos(a1) * rr * 1.5, sig * of + Math.sin(a1) * rr)
      const kk = 0.5 + nq(), mk = mask(L * tf + Math.cos(a1) * rr * 1.5, sig * of + Math.sin(a1) * rr)
      if (mk > 0.01) ell(ctx, x, y, rad * 0.5 * u * kk, rad * 0.36 * u * kk, c, a * band * mk)
    }
  })
  // ---- H-alpha emission knots (pink) and a faint teal reflection wisp, patchy rather than round ----
  const hq = rng(1717 + PAT.k * 131)
  for (let k = 0, nk = wide ? 6 : 4; k < nk; k++) {
    const tf = (hq() * 2 - 1) * 0.8, of = (hq() - 0.5) * 2.2, rad = (5 + 7 * hq()) * u, teal = k === nk - 1
    const hc = teal ? "#3FB9B0" : M === MWPAL.clear ? mixHex("#A8C6EE", "#CFE0F6", hq()) : mixHex("#FF4F7B", "#E2457F", hq())   // v12: icy knots in the normal sky
    for (let i = 0; i < 26; i++) {
      const a1 = hq() * 6.283, rr = Math.sqrt(hq()) * rad, tt = L * tf + Math.cos(a1) * rr * 1.6, oo = sig * of + Math.sin(a1) * rr
      const lumpy = clamp(fbm(tt / (6 * u), oo / (4 * u), 31, 3) * 1.8 - 0.55, 0, 1)
      if (lumpy <= 0) continue
      const [x, y] = at(tt, oo), kk = 0.4 + 0.8 * hq(), mk = mask(tt, oo)
      if (mk > 0.01) ell(ctx, x, y, rad * 0.32 * kk, rad * 0.22 * kk, hc, (teal ? 0.02 : 0.03) * lumpy * band * mk * (1 - dustAt(tt, oo) * 0.8))
    }
  }
  // ---- thin dark dust filaments layered over the bright clouds (wispy, broken, slightly curved) ----
  const fq = rng(2323 + PAT.k * 17)
  for (let k = 0, nf = wide ? 7 : 5; k < nf; k++) {
    const o0 = (fq() - 0.5) * 1.8, f0 = -0.95 + fq() * 1.2, len = 0.25 + fq() * 0.5, m = 40, cv = (fq() - 0.5) * 0.6
    for (let j = 0; j <= m; j++) {
      const f = j / m, t = L * (f0 + len * f), s0 = sig * wob(t), off = (o0 + cv * Math.sin(f * 3.14) + 0.05 * Math.sin(j * 0.9 + k)) * s0
      const brk = fbm(t / (8 * u), k * 3.1, 41, 2)
      if (brk < 0.42) continue
      const [x, y] = at(t, off), w = (0.6 + 1.1 * brk) * u, mk = mask(t, off)
      if (mk > 0.01) ell(ctx, x, y, w * 2.4, w, "#03030A", 0.07 * (brk - 0.35) * Math.sin(f * 3.14) * mk)
    }
  }
  // ---- fine grain: thousands of faint unresolved stars that make the clouds look grainy (tiny rects, one colour per batch = cheap) ----
  {
    const gq = rng(9090 + PAT.k * 7), GN = wide ? 9000 : 5200, B = 8, px = Math.max(0.3 * u, 0.34)
    for (let bi = 0; bi < B; bi++) {
      const warm = bi % 2, al = 0.1 + 0.07 * (bi >> 1)
      ctx.setFillColor(col(redStar(warm ? "#FFE6C8" : "#DCE4FF", I, 0.6), al))
      for (let i = 0; i < GN / B; i++) {
        const t = (gq() * 2 - 1) * L, g = (gq() + gq() + gq() - 1.5) / 0.5 * 0.8, off = g * sig * wob(t)
        const env = Math.exp(-g * g * 0.35) * bulge(t)
        if (gq() > env * (0.55 + 0.6 * fbm(t / (10 * u), off / (5 * u), 51, 3))) continue
        if (gq() < dustAt(t, off) * 0.9) continue
        if (MWH(bi, i, 61) > mask(t, off)) continue
        const [x, y] = at(t, off)
        ctx.fillRect(new Rect(x, y, px, px))
      }
    }
    // a gentle noise texture over the whole sky (sensor grain), very faint
    ctx.setFillColor(col("#9AA0B8", 0.012 + 0.023 * GROW))
    for (let i = 0, n = wide ? 2600 : 1500; i < n; i++) ctx.fillRect(new Rect(gq() * W, gq() * H, px, px))
  }
  // ---- stars: magnitude power law · colour temperature · clustering ----
  const NS = Math.round((wide ? 6500 : 4200)), tint = (k) => { for (const [lim, c] of STAR_TEMP) if (k <= lim) return c; return "#FFFFFF" }
  const clustered = (t, off) => fbm(t / (14 * u), off / (6 * u), 20, 3)
  let sid = 0
  const putStar = (t, off, boost) => {
    const vis = MWH(sid++, 7, 73) <= mask(t, off)
    const [x, y] = at(t, off)
    if (x < 1 || x > W - 1 || y < 1 || y > H - 1) return
    const s = sig * wob(t), g = off / s, core = Math.exp(-g * g * 0.5) * bulge(t)
    const dust = dustAt(t, off), k = r()
    const mag = Math.pow(k, 9)                                                    // few bright, very many faint
    const rad = (0.12 + mag * 0.2) * u
    const a = clamp((0.14 + r() * 0.4 + mag * 0.3) * (0.5 + 0.9 * core) * (1 - 0.85 * dust) * boost, 0, 0.3)
    if (a < 0.04) return
    let c = tint(r()); if (I > 0) c = redStar(mixHex(c, pal.star[Math.floor(r() * pal.star.length)], 0.55 + 0.3 * I), I, 0.9)
    if (!vis) return
    if (mag > 0.3) dot(ctx, x, y, rad * 2.4, c, a * 0.07)
    dot(ctx, x, y, rad, c, a)
  }
  for (let i = 0, got = 0; i < NS * 3 && got < NS; i++) {
    const t = (r() * 2 - 1) * L, g = (r() + r() + r() - 1.5) / 0.5 * (r() < 0.28 ? 1.7 : 0.62), off = g * sig * wob(t)
    const cl = clustered(t, off)
    if (r() > 0.4 + 0.8 * cl * cl) continue
    putStar(t, off, 1); got++
  }
  // a few tight open clusters
  const cq = rng(811 + PAT.k * 29)
  for (let k = 0; k < (wide ? 5 : 3); k++) {
    const ct = (cq() * 2 - 1) * L * 0.8, co = (cq() - 0.5) * sig * 2.2
    for (let i = 0; i < 26; i++) putStar(ct + (cq() + cq() - 1) * 5 * u, co + (cq() + cq() - 1) * 4 * u, 0.9)
  }
  // sparse field stars everywhere, with colour temperature
  for (let i = 0; i < (wide ? 190 : 100); i++) {
    const x = r() * W, y = r() * H, k = r()
    let c = tint(r()); if (I > 0) c = redStar(mixHex(c, pal.star[Math.floor(r() * pal.star.length)], 0.6), I, 0.9)
    dot(ctx, x, y, (0.12 + Math.pow(k, 6) * 0.16) * u, c, 0.07 + r() * 0.22)
  }
  // ---- medal stars: every slot (denomination x index) has a fixed spot in band coordinates, worked out for ALL 27 slots in one fixed order,
  // so a new medal only adds a small star or merges (10 small -> 1 big, 10 big -> 1 superior) and nothing else jumps; they float with the flow
  {
    const flow = 2 * Math.PI * hr / 24, skip = (x, y) => blocked(x, y, 0.5 * u), slot = Math.floor(skyDate().getTime() / 1800000)
    // drawn later, on top of the eclipse and the chaos tint (render calls this), so chaos bleeds them blood red but never hides them
    // chaos looks: stars convert in a fixed order (lowest chaosRank first); share = 0 calm · ~20% gold · ~59% diamond · 100% prismatic
    const CK = kind === "clear" ? 0 : BLOOD_K[kind] || 0, share = CK > 0 ? clamp((CK - 0.25) / 0.75, 0, 1) : 0
    const litS = spots.filter((S) => !S.none && S.i < coins[S.d]).sort((a, b) => chaosRank(a.d, a.i) - chaosRank(b.d, b.i))
    const nCh = share >= 1 ? litS.length : share > 0 ? Math.max(1, Math.round(share * litS.length)) : 0
    const turned = new Set(litS.slice(0, nCh).map((S) => S.d * 100 + S.i))
    __STAR_DRAW = () => spots.slice().reverse().forEach((S) => {
      if (S.none || S.i >= coins[S.d]) return
      const q = rng(S.d * 7919 + S.i * 104729 + 7), ph0 = q() * 6.283
      const fa = (0.006 + 0.008 * q()) * L, fo = (0.3 + 0.4 * q()) * u      // a gentle float with the flow, never far from its slot
      const [x, y] = at(S.t + fa * Math.sin(flow + ph0), S.off + fo * Math.sin(flow * 2 + ph0))
      const tq = MWH(slot, S.d * 31 + S.i, 71)                             // twinkle: a little different every refresh (30-min slot), steady within one
      const tw = S.d === 100 ? 0.92 + 0.3 * (0.5 + 0.5 * Math.sin(slot * 2.39 + ph0)) * (0.7 + 0.3 * tq) : 0.8 + 0.2 * tq   // superiors pulse brighter
      const fl = S.d === 100 && LIVE.flare && S.i === Math.min(MEDAL_SLOTS[100], LIVE.flare) - 1 ? 1 : 0
      const pdim = med && GAL_FLOW ? flowDim(W, H, x, y) : 1                      // v13.8: softened behind the quest text, never full brightness there
      medalCluster(ctx, x, y, u * 1.5, S.d, I, S.d * 1013 + S.i * 37 + 5, pdim, tw * (0.75 + 0.25 * pdim), Math.atan2(dy, dx), skip, ph0 + flow * 0.5, fl, turned.has(S.d * 100 + S.i) ? chaosVariant(S.d, S.i) : starVariant(S.d, S.i))
    })
  }
  // extra dust lanes only when chaos is rising (the eclipse proper is drawn in reasonsBand)
  const lq = rng(555)
  for (let i = 0, ex = Math.round(I * 5); i < ex; i++) {
    const o = (lq() - 0.5) * 0.9, f0 = -0.9 + lq() * 0.8, f1 = -0.2 + lq() * 1.1, k = 0.7 + lq() * 0.5, m = 34
    for (let j = 0; j <= m; j++) {
      const t = L * (f0 + (f1 - f0) * j / m), s = sig * wob(t), off = (o + 0.07 * Math.sin(j * 0.55 + i * 2)) * s * 1.6
      const [x, y] = at(t, off), w = (3.4 + 2.2 * Math.sin(j * 0.31 + i)) * u * k
      ell(ctx, x, y, w * 1.9, w * 0.8, "#02020A", (0.075 + 0.06 * I) * mask(t, off))
    }
  }
  // ominous glow along the spine of the band (chaos only)
  if (I > 0) for (let i = 0, n = wide ? 86 : 64; i <= n; i++) {
    const t = -L + 2 * L * i / n, s = sig * wob(t), b = bulge(t), [x, y] = at(t, 0)
    const mk = mask(t, 0); ell(ctx, x, y, s * 1.6, s * 0.2, pal.glow, 0.028 * I * b * mk); ell(ctx, x, y, s * 1.0, s * 0.09, pal.haze[2], 0.02 * I * b * mk)
  }
  // faint ember specks drifting around the band (chaos only)
  if (pal.ember.length) {
    const eq = rng(909)
    for (let i = 0, ne = Math.round((wide ? 60 : 34) * I); i < ne; i++) {
      const t = (eq() * 2 - 1) * L, off = (eq() - 0.5) * sig * 3.2, [x, y] = at(t, off)
      if (x < 2 || x > W - 2 || y < 2 || y > H - 2) continue
      const c = pal.ember[Math.floor(eq() * pal.ember.length)], k = 0.5 + eq()
      dot(ctx, x, y, 2.6 * k * u, c, 0.05 * I); dot(ctx, x, y, (0.3 + 0.3 * k) * u, c, 0.5 + 0.4 * eq())
    }
  }
  // a few brighter pinpoints + twinkles (each a fixed spot; brightness drifts with the clock)
  const q = rng(77), h = skyHour(), nt = wide ? 9 : 5
  for (let i = 0; i < nt; i++) {
    const x = (0.04 + q() * 0.92) * W, y = (0.05 + q() * 0.9) * H, k = q()
    const a = 0.3 + 0.6 * Math.abs(Math.sin(h * 5.1 + i * 1.7)), tt = pal.star[i % pal.star.length]
    dot(ctx, x, y, 2.2 * u, tt, 0.05 * a); dot(ctx, x, y, 0.5 * u, tt, 0.35 + 0.4 * a)          // plain pinpoints: 4-point stars are reserved for streak stars
  }
}

// ============ MILKY WAY WITH A REASON (live: LIVE.reason = XP progress + cleansedMedals) ============
// Widget-tab keys: xpIn / xpNeed light the galactic core; cleansedMedals = permanent gold stars; chaosState / chaosCover drive the eclipse.
const REASON = () => LIVE.reason
const goldHue = "#FFD774"
function bandAt(t, off) { const B = __BAND, o = off + B.spine(t); return [B.cx + B.dx * t + B.nx * o, B.cy + B.dy * t + B.ny * o] }
function reasonZones(W, H, x, y, pad) {            // true where text/ring/glass live: nothing decorative goes there
  const u = H / 170, wide = W > 250
  const rc = wide ? [85, 66, 41] : [85, 50, 32]
  if (Math.hypot(x - rc[0] * u, y - rc[1] * u) < (rc[2] + 5) * u + pad) return true
  if (wide && x > 180 * u - pad) return true
  const py = wide ? 134 : 110; if (y > py * u - pad && x < (wide ? 160 : 166) * u + pad) return true
  if (!wide && y > 110 * u - pad) return true
  return false
}
function reasonsBand(ctx, W, H, pal) {           // behind everything: galactic core, creeping eclipse, cleansed gold stars
  const R = REASON(), B = __BAND, u = B.u, c = pal.I, wide = B.wide
  // XP lights the galactic core (the bright bulge at the band's lower-left)
  const t0 = B.t0, [kx, ky] = bandAt(t0, 0), g = (0.35 + 0.95 * R.xp) * (1 - 0.82 * Math.min(1, c)) * (B.n > 0 ? 0.3 + 0.7 * B.grow : 0)   // the core needs medals to shine
  if (g > 0) for (let i = 0; i < 9; i++) dot(ctx, kx, ky, (34 - i * 3.3) * u, i < 5 ? "#FFE2B0" : "#FFF3D6", 0.011 * g * (1 + i * 0.5))
  if (g > 0) dot(ctx, kx, ky, 2.4 * u, "#FFF8E8", 0.5 * g)
  // creeping eclipse: dust spreads from the far end of the band toward the core, with a faint blood-red leading edge
  if (c > 0) {
    const reach = 0.35 + 1.25 * c
    for (let j = 0; j <= 46; j++) {
      const f = j / 46, t = B.L * (1 - f * reach), off = Math.sin(j * 0.7) * B.sig * 0.5, [x, y] = bandAt(t, off)
      const w = (7 + 5 * Math.sin(j * 0.9)) * u * (0.6 + c * 0.7)
      ell(ctx, x, y, w * 2.1, w, "#010106", (0.12 + 0.2 * c) * (1 - f * 0.4))
    }
    const [ex, ey] = bandAt(B.L * (1 - reach), 0)
    dot(ctx, ex, ey, 14 * u, pal.glow, 0.05 * c)
  }
  // cleansed medals: permanent gold stars sitting on the band, in clear spots
  let placed = 0
  for (const [tf, of] of [[-0.62, -0.7], [-0.15, 0.95], [0.34, -0.8], [-0.86, 0.5], [0.62, 0.7], [0.12, -1.0], [0.82, -0.4], [-0.4, 0.8], [0.52, -0.2], [-0.72, -0.2]]) {
    if (placed >= R.cleansed) break
    const [x, y] = bandAt(B.L * tf, B.sig * of)
    if (x < 6 * u || x > W - 6 * u || y < 6 * u || y > H - 6 * u || reasonZones(W, H, x, y, 3 * u)) continue
    const MG = redStar(goldHue, c, 0.55), MT = redStar("#FFE08A", c, 0.55); for (let q = 0; q < 5; q++) dot(ctx, x, y, (9 - q * 1.4) * u, MG, 0.035 + q * 0.012); strokeEll(ctx, x, y, 3.3 * u, MG, 0.5, 0.4 * u); twinkle(ctx, x, y, 6.4 * u, 1, MT); dot(ctx, x, y, 1.5 * u, redStar("#FFFFFF", c, 0.4), 1); placed++
  }
}
// subtle dark pools behind the ring and the text so they stay the brightest thing on the widget
function skyVignette(ctx, W, H) {
  const u = H / 170, wide = W > 250, med = C_MED()
  const pools = med ? [[RING_MED.x, RING_MED.y, 84, 84, 0.05], [278, 86, 96, 80, 0.045]] : wide ? [[85, 74, 78, 82, 0.05], [278, 86, 96, 80, 0.045]] : [[85, 62, 66, 66, 0.05], [85, 150, 90, 38, 0.045]]
  if (med && GAL_FLOW) pools[1] = [pools[1][0], pools[1][1], pools[1][2], pools[1][3], GAL_FLOW === 3 ? 0.035 : 0.02]   // v13.8: the quest haze guards the text, so the galaxy may glow through on the right
  for (const [px, py, rx, ry, a] of pools) for (let i = 0; i < 9; i++) ell(ctx, px * u, py * u, rx * u * (1 - i * 0.09), ry * u * (1 - i * 0.09), "#000000", a)
  const cx = med ? RING_MED.x * u : wide ? 85 * u : W / 2, cy = (med ? RING_MED.y : wide ? 66 : 50) * u, R = (med ? RING_MED.r : wide ? 41 : 32) * u
  dot(ctx, cx, cy, R - 4 * u, "#04040A", 0.45)                               // calm centre for the XP number
  const VR = Math.hypot(W, H) * 0.42                                          // natural lens vignette: corners fall off softly
  for (const [vx, vy] of [[0, 0], [W, 0], [0, H], [W, H]]) for (let i = 0; i < 8; i++) dot(ctx, vx, vy, VR * (1 - i * 0.1), "#000000", 0.03)
}

// ---- quest icons (vector, centred on x,y; s ≈ width) ----
function iconTrain(ctx, x, y, s, hex, a) {
  seg(ctx, x - s * 0.5, y, x + s * 0.5, y, hex, a, s * 0.14)
  for (const sd of [-1, 1]) {
    fillPath(ctx, rrPath(x + sd * s * 0.5 - s * 0.09, y - s * 0.3, s * 0.18, s * 0.6, s * 0.06), hex, a)
    fillPath(ctx, rrPath(x + sd * s * 0.34 - s * 0.07, y - s * 0.22, s * 0.14, s * 0.44, s * 0.05), hex, a * 0.85)
  }
}
function iconCook(ctx, x, y, s, hex, a) {
  fillPath(ctx, rrPath(x - s * 0.42, y - s * 0.02, s * 0.84, s * 0.46, s * 0.12), hex, a)
  seg(ctx, x - s * 0.5, y - s * 0.06, x + s * 0.5, y - s * 0.06, hex, a, s * 0.12)
  seg(ctx, x - s * 0.42, y + s * 0.08, x - s * 0.58, y + s * 0.08, hex, a, s * 0.1); seg(ctx, x + s * 0.42, y + s * 0.08, x + s * 0.58, y + s * 0.08, hex, a, s * 0.1)
  for (const k of [-1, 1]) {                                                // steam
    const p = new Path(); p.move(P_(x + k * s * 0.14, y - s * 0.16)); p.addQuadCurve(P_(x + k * s * 0.14, y - s * 0.52), P_(x + k * s * 0.32, y - s * 0.34))
    strokeP(ctx, p, hex, a * 0.7, s * 0.07)
  }
}
function iconBadge(ctx, x, y, s, hex, a) {
  for (const k of [-1, 1]) {
    const p = new Path(); p.move(P_(x + k * s * 0.06, y + s * 0.08)); p.addLine(P_(x + k * s * 0.34, y + s * 0.5)); p.addLine(P_(x + k * s * 0.12, y + s * 0.42)); p.addLine(P_(x - k * s * 0.02, y + s * 0.5)); p.closeSubpath()
    fillPath(ctx, p, hex, a * 0.75)
  }
  dot(ctx, x, y - s * 0.08, s * 0.36, hex, a)
  dot(ctx, x, y - s * 0.08, s * 0.22, "#0A0A12", a * 0.45)
  dot(ctx, x, y - s * 0.08, s * 0.1, hex, a)
}
const QPAL = (n) => n === 2 ? { acc: "#F2D58F", glow: "#E9B84A", name: "#FFF3D2", done: "#F2D58F" } : { acc: "#7FD6CC", glow: "#2BB8A8", name: "#E6F7F5", done: "#7FD6CC" }
const questState = () => { const q = LIVE.quest || {}; const a = [!!q.train, !!q.cook]; return { a, n: a.filter(Boolean).length } }
function tick(ctx, x, y, s, hex, a, w) {
  seg(ctx, x - s * 0.5, y + s * 0.02, x - s * 0.12, y + s * 0.4, hex, a, w); seg(ctx, x - s * 0.12, y + s * 0.4, x + s * 0.55, y - s * 0.4, hex, a, w)
}
// ---- quest icons: crisp vector dumbbell (Train) and lidded pot with steam (Cook). Lit = glowing + highlight, unlit = dim outline ----
function qiShape(ctx, p, c, lit, s, hi) {
  if (lit) { fillPath(ctx, p, c, 0.96); if (hi) fillPath(ctx, hi, "#FFFFFF", 0.33) }
  else { fillPath(ctx, p, SILVER, 0.07); strokeP(ctx, p, SILVER, 0.5, Math.max(0.6, s * 0.045)) }
}
function iconTrainQ(ctx, x, y, s, lit, pal) {
  const c = lit ? pal.acc : SILVER
  if (lit) { dot(ctx, x, y, s * 0.78, pal.glow, 0.07); dot(ctx, x, y, s * 0.55, pal.glow, 0.13) }
  qiShape(ctx, rrPath(x - s * 0.5, y - s * 0.045, s, s * 0.09, s * 0.04), c, lit, s)                  // bar
  qiShape(ctx, rrPath(x - s * 0.13, y - s * 0.075, s * 0.26, s * 0.15, s * 0.05), c, lit, s)          // grip
  for (const sd of [-1, 1]) {
    const pl = (cxo, w, h, rd) => rrPath(x + sd * s * cxo - w / 2, y - h / 2, w, h, rd)
    qiShape(ctx, pl(0.24, s * 0.14, s * 0.66, s * 0.045), c, lit, s, rrPath(x + sd * s * 0.24 - s * 0.055, y - s * 0.31, s * 0.035, s * 0.56, s * 0.02))
    qiShape(ctx, pl(0.375, s * 0.1, s * 0.46, s * 0.04), c, lit, s, rrPath(x + sd * s * 0.375 - s * 0.036, y - s * 0.21, s * 0.026, s * 0.36, s * 0.012))
    qiShape(ctx, pl(0.47, s * 0.06, s * 0.2, s * 0.025), c, lit, s)
  }
}
function iconCookQ(ctx, x, y0, s, lit, pal) {
  const c = lit ? pal.acc : SILVER, y = y0 + s * 0.14
  if (lit) { dot(ctx, x, y - s * 0.05, s * 0.8, pal.glow, 0.07); dot(ctx, x, y - s * 0.05, s * 0.55, pal.glow, 0.13) }
  for (const [dx, ph] of [[-0.17, 0], [0.01, 1.6], [0.19, 3.1]]) {                                 // steam wisps
    const q = new Path(), sx = x + dx * s, by = y - s * 0.36
    q.move(P_(sx, by)); q.addCurve(P_(sx + (ph > 2 ? -1 : 1) * s * 0.02, by - s * 0.3), P_(sx + s * 0.1, by - s * 0.1), P_(sx - s * 0.02, by - s * 0.24))
    strokeP(ctx, q, lit ? pal.name : SILVER, lit ? 0.62 : 0.32, Math.max(0.6, s * 0.05))
  }
  const dome = new Path(); dome.move(P_(x - s * 0.3, y - s * 0.12)); dome.addCurve(P_(x + s * 0.3, y - s * 0.12), P_(x - s * 0.26, y - s * 0.36), P_(x + s * 0.26, y - s * 0.36)); dome.closeSubpath()
  qiShape(ctx, dome, c, lit, s, rrPath(x - s * 0.18, y - s * 0.27, s * 0.12, s * 0.035, s * 0.015))   // lid
  if (lit) dot(ctx, x, y - s * 0.325, s * 0.045, "#FFFFFF", 0.7); else dot(ctx, x, y - s * 0.325, s * 0.04, SILVER, 0.5)  // knob
  qiShape(ctx, rrPath(x - s * 0.37, y - s * 0.13, s * 0.74, s * 0.075, s * 0.03), c, lit, s)          // rim
  const body = new Path(); body.move(P_(x - s * 0.33, y - s * 0.055)); body.addLine(P_(x + s * 0.33, y - s * 0.055)); body.addLine(P_(x + s * 0.31, y + s * 0.24))
  body.addQuadCurve(P_(x + s * 0.27, y + s * 0.34), P_(x + s * 0.31, y + s * 0.34)); body.addLine(P_(x - s * 0.27, y + s * 0.34)); body.addQuadCurve(P_(x - s * 0.31, y + s * 0.24), P_(x - s * 0.31, y + s * 0.34)); body.closeSubpath()
  qiShape(ctx, body, c, lit, s, rrPath(x - s * 0.26, y + s * 0.0, s * 0.055, s * 0.28, s * 0.025))
  for (const sd of [-1, 1]) qiShape(ctx, rrPath(sd < 0 ? x - s * 0.5 : x + s * 0.33, y + s * 0.02, s * 0.17, s * 0.07, s * 0.03), c, lit, s)   // handles
}
const questIcon = (ctx, kind, x, y, s, lit, pal) => (kind === "train" ? iconTrainQ : iconCookQ)(ctx, x, y, s, lit, pal)
// medium side panel when no chaos locks: two-row "Today's quest" inside the glass card; the flames match the streak flames under the ring
const QUEST_ROWS = [["workout", "Train", "train", "logged", "not yet"], ["home cook", "Cook", "cook", "cooked", "not yet"]]
// ---------------- v13 · Bible verses (KJV, public domain, word for word) replace the motivation quotes ----------------
// one verse per HOUR: a fixed seeded shuffle of the list, indexed by hours since 1970 (local clock), so every refresh in the
// same hour shows the same verse, neighbouring hours are unrelated, and no verse repeats until the whole list has been shown
const VERSES = /*VERSES*/[["In the beginning God created the heaven and the earth.","Genesis 1:1"],["The LORD shall fight for you, and ye shall hold your peace.","Exodus 14:14"],["The LORD bless thee, and keep thee:","Numbers 6:24"],["The LORD make his face shine upon thee, and be gracious unto thee:","Numbers 6:25"],["The LORD lift up his countenance upon thee, and give thee peace.","Numbers 6:26"],["Take you wise men, and understanding, and known among your tribes, and I will make them rulers over you.","Deuteronomy 1:13"],["Let me pass through thy land: I will go along by the high way, I will neither turn unto the right hand nor to the left.","Deuteronomy 2:27"],["But if from thence thou shalt seek the LORD thy God, thou shalt find him, if thou seek him with all thy heart and with all thy soul.","Deuteronomy 4:29"],["Keep the sabbath day to sanctify it, as the LORD thy God hath commanded thee.","Deuteronomy 5:12"],["O that there were such an heart in them, that they would fear me, and keep all my commandments always, that it might be well with them, and with their children for ever!","Deuteronomy 5:29"],["Ye shall diligently keep the commandments of the LORD your God, and his testimonies, and his statutes, which he hath commanded thee.","Deuteronomy 6:17"],["Ye shall walk after the LORD your God, and fear him, and keep his commandments, and obey his voice, and ye shall serve him, and cleave unto him.","Deuteronomy 13:4"],["Six days thou shalt eat unleavened bread: and on the seventh day shall be a solemn assembly to the LORD thy God: thou shalt do no work therein.","Deuteronomy 16:8"],["The LORD shall establish thee an holy people unto himself, as he hath sworn unto thee, if thou shalt keep the commandments of the LORD thy God, and walk in his ways.","Deuteronomy 28:9"],["Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee.","Deuteronomy 31:6"],["And the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed.","Deuteronomy 31:8"],["For they are a nation void of counsel, neither is there any understanding in them.","Deuteronomy 32:28"],["Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.","Joshua 1:9"],["I am as one mocked of his neighbour, who calleth upon God, and he answereth him: the just upright man is laughed to scorn.","Job 12:4"],["With the ancient is wisdom; and in length of days understanding.","Job 12:12"],["With him is wisdom and strength, he hath counsel and understanding.","Job 12:13"],["With him is strength and wisdom: the deceived and the deceiver are his.","Job 12:16"],["For he stretcheth out his hand against God, and strengtheneth himself against the Almighty.","Job 15:25"],["For thou hast hid their heart from understanding: therefore shalt thou not exalt them.","Job 17:4"],["Have pity upon me, have pity upon me, O ye my friends; for the hand of God hath touched me.","Job 19:21"],["I have heard the check of my reproach, and the spirit of my understanding causeth me to answer.","Job 20:3"],["I will teach you by the hand of God: that which is with the Almighty will I not conceal.","Job 27:11"],["For God shall cast upon him, and not spare: he would fain flee out of his hand.","Job 27:22"],["No mention shall be made of coral, or of pearls: for the price of wisdom is above rubies.","Job 28:18"],["God understandeth the way thereof, and he knoweth the place thereof.","Job 28:23"],["He shall pray unto God, and he will be favourable unto him: and he shall see his face with joy: for he will render unto man his righteousness.","Job 33:26"],["Let men of understanding tell me, and let a wise man hearken unto me.","Job 34:34"],["Job hath spoken without knowledge, and his words were without wisdom.","Job 34:35"],["Behold, God is mighty, and despiseth not any: he is mighty in strength and wisdom.","Job 36:5"],["But his delight is in the law of the LORD; and in his law doth he meditate day and night.","Psalm 1:2"],["Serve the LORD with fear, and rejoice with trembling.","Psalm 2:11"],["But thou, O LORD, art a shield for me; my glory, and the lifter up of mine head.","Psalm 3:3"],["Salvation belongeth unto the LORD: thy blessing is upon thy people. Selah.","Psalm 3:8"],["Hear me when I call, O God of my righteousness: thou hast enlarged me when I was in distress; have mercy upon me, and hear my prayer.","Psalm 4:1"],["Stand in awe, and sin not: commune with your own heart upon your bed, and be still. Selah.","Psalm 4:4"],["There be many that say, Who will shew us any good? LORD, lift thou up the light of thy countenance upon us.","Psalm 4:6"],["Thou hast put gladness in my heart, more than in the time that their corn and their wine increased.","Psalm 4:7"],["I will both lay me down in peace, and sleep: for thou, LORD, only makest me dwell in safety.","Psalm 4:8"],["My voice shalt thou hear in the morning, O LORD; in the morning will I direct my prayer unto thee, and will look up.","Psalm 5:3"],["Lead me, O LORD, in thy righteousness because of mine enemies; make thy way straight before my face.","Psalm 5:8"],["But let all those that put their trust in thee rejoice: let them ever shout for joy, because thou defendest them: let them also that love thy name be joyful in thee.","Psalm 5:11"],["For thou, LORD, wilt bless the righteous; with favour wilt thou compass him as with a shield.","Psalm 5:12"],["Have mercy upon me, O LORD; for I am weak: O LORD, heal me; for my bones are vexed.","Psalm 6:2"],["Return, O LORD, deliver my soul: oh save me for thy mercies’ sake.","Psalm 6:4"],["The LORD shall judge the people: judge me, O LORD, according to my righteousness, and according to mine integrity that is in me.","Psalm 7:8"],["My defence is of God, which saveth the upright in heart.","Psalm 7:10"],["I will praise the LORD according to his righteousness: and will sing praise to the name of the LORD most high.","Psalm 7:17"],["I will praise thee, O LORD, with my whole heart; I will shew forth all thy marvellous works.","Psalm 9:1"],["I will be glad and rejoice in thee: I will sing praise to thy name, O thou most High.","Psalm 9:2"],["But the LORD shall endure for ever: he hath prepared his throne for judgment.","Psalm 9:7"],["Sing praises to the LORD, which dwelleth in Zion: declare among the people his doings.","Psalm 9:11"],["Arise, O LORD; O God, lift up thine hand: forget not the humble.","Psalm 10:12"],["For the righteous LORD loveth righteousness; his countenance doth behold the upright.","Psalm 11:7"],["Help, LORD; for the godly man ceaseth; for the faithful fail from among the children of men.","Psalm 12:1"],["Thou shalt keep them, O LORD, thou shalt preserve them from this generation for ever.","Psalm 12:7"],["But I have trusted in thy mercy; my heart shall rejoice in thy salvation.","Psalm 13:5"],["I will sing unto the LORD, because he hath dealt bountifully with me.","Psalm 13:6"],["The LORD looked down from heaven upon the children of men, to see if there were any that did understand, and seek God.","Psalm 14:2"],["Oh that the salvation of Israel were come out of Zion! when the LORD bringeth back the captivity of his people, Jacob shall rejoice, and Israel shall be glad.","Psalm 14:7"],["He that walketh uprightly, and worketh righteousness, and speaketh the truth in his heart.","Psalm 15:2"],["He that putteth not out his money to usury, nor taketh reward against the innocent. He that doeth these things shall never be moved.","Psalm 15:5"],["Preserve me, O God: for in thee do I put my trust.","Psalm 16:1"],["I will bless the LORD, who hath given me counsel: my reins also instruct me in the night seasons.","Psalm 16:7"],["I have set the LORD always before me: because he is at my right hand, I shall not be moved.","Psalm 16:8"],["Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore.","Psalm 16:11"],["Thou hast proved mine heart; thou hast visited me in the night; thou hast tried me, and shalt find nothing; I am purposed that my mouth shall not transgress.","Psalm 17:3"],["Hold up my goings in thy paths, that my footsteps slip not.","Psalm 17:5"],["Shew thy marvellous lovingkindness, O thou that savest by thy right hand them which put their trust in thee from those that rise up against them.","Psalm 17:7"],["I will love thee, O LORD, my strength.","Psalm 18:1"],["The LORD is my rock, and my fortress, and my deliverer; my God, my strength, in whom I will trust; my buckler, and the horn of my salvation, and my high tower.","Psalm 18:2"],["I will call upon the LORD, who is worthy to be praised: so shall I be saved from mine enemies.","Psalm 18:3"],["They prevented me in the day of my calamity: but the LORD was my stay.","Psalm 18:18"],["The LORD rewarded me according to my righteousness; according to the cleanness of my hands hath he recompensed me.","Psalm 18:20"],["For thou wilt light my candle: the LORD my God will enlighten my darkness.","Psalm 18:28"],["For by thee I have run through a troop; and by my God have I leaped over a wall.","Psalm 18:29"],["For who is God save the LORD? or who is a rock save our God?","Psalm 18:31"],["It is God that girdeth me with strength, and maketh my way perfect.","Psalm 18:32"],["The LORD liveth; and blessed be my rock; and let the God of my salvation be exalted.","Psalm 18:46"],["Day unto day uttereth speech, and night unto night sheweth knowledge.","Psalm 19:2"],["The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple.","Psalm 19:7"],["The statutes of the LORD are right, rejoicing the heart: the commandment of the LORD is pure, enlightening the eyes.","Psalm 19:8"],["The fear of the LORD is clean, enduring for ever: the judgments of the LORD are true and righteous altogether.","Psalm 19:9"],["Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer.","Psalm 19:14"],["Grant thee according to thine own heart, and fulfil all thy counsel.","Psalm 20:4"],["We will rejoice in thy salvation, and in the name of our God we will set up our banners: the LORD fulfil all thy petitions.","Psalm 20:5"],["Some trust in chariots, and some in horses: but we will remember the name of the LORD our God.","Psalm 20:7"],["Thou hast given him his heart’s desire, and hast not withholden the request of his lips. Selah.","Psalm 21:2"],["For thou preventest him with the blessings of goodness: thou settest a crown of pure gold on his head.","Psalm 21:3"],["For thou hast made him most blessed for ever: thou hast made him exceeding glad with thy countenance.","Psalm 21:6"],["Be thou exalted, LORD, in thine own strength: so will we sing and praise thy power.","Psalm 21:13"],["Our fathers trusted in thee: they trusted, and thou didst deliver them.","Psalm 22:4"],["He trusted on the LORD that he would deliver him: let him deliver him, seeing he delighted in him.","Psalm 22:8"],["But be not thou far from me, O LORD: O my strength, haste thee to help me.","Psalm 22:19"],["Save me from the lion’s mouth: for thou hast heard me from the horns of the unicorns.","Psalm 22:21"],["I will declare thy name unto my brethren: in the midst of the congregation will I praise thee.","Psalm 22:22"],["Ye that fear the LORD, praise him; all ye the seed of Jacob, glorify him; and fear him, all ye the seed of Israel.","Psalm 22:23"],["My praise shall be of thee in the great congregation: I will pay my vows before them that fear him.","Psalm 22:25"],["The meek shall eat and be satisfied: they shall praise the LORD that seek him: your heart shall live for ever.","Psalm 22:26"],["All the ends of the world shall remember and turn unto the LORD: and all the kindreds of the nations shall worship before thee.","Psalm 22:27"],["All they that be fat upon earth shall eat and worship: all they that go down to the dust shall bow before him: and none can keep alive his own soul.","Psalm 22:29"],["The LORD is my shepherd; I shall not want.","Psalm 23:1"],["He shall receive the blessing from the LORD, and righteousness from the God of his salvation.","Psalm 24:5"],["Shew me thy ways, O LORD; teach me thy paths.","Psalm 25:4"],["Lead me in thy truth, and teach me: for thou art the God of my salvation; on thee do I wait all the day.","Psalm 25:5"],["Remember not the sins of my youth, nor my transgressions: according to thy mercy remember thou me for thy goodness’ sake, O LORD.","Psalm 25:7"],["Good and upright is the LORD: therefore will he teach sinners in the way.","Psalm 25:8"],["The meek will he guide in judgment: and the meek will he teach his way.","Psalm 25:9"],["All the paths of the LORD are mercy and truth unto such as keep his covenant and his testimonies.","Psalm 25:10"],["What man is he that feareth the LORD? him shall he teach in the way that he shall choose.","Psalm 25:12"],["O keep my soul, and deliver me: let me not be ashamed; for I put my trust in thee.","Psalm 25:20"],["Let integrity and uprightness preserve me; for I wait on thee.","Psalm 25:21"],["Judge me, O LORD; for I have walked in mine integrity: I have trusted also in the LORD; therefore I shall not slide.","Psalm 26:1"],["Examine me, O LORD, and prove me; try my reins and my heart.","Psalm 26:2"],["LORD, I have loved the habitation of thy house, and the place where thine honour dwelleth.","Psalm 26:8"],["But as for me, I will walk in mine integrity: redeem me, and be merciful unto me.","Psalm 26:11"],["My foot standeth in an even place: in the congregations will I bless the LORD.","Psalm 26:12"],["The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?","Psalm 27:1"],["Hear, O LORD, when I cry with my voice: have mercy also upon me, and answer me.","Psalm 27:7"],["Teach me thy way, O LORD, and lead me in a plain path, because of mine enemies.","Psalm 27:11"],["I had fainted, unless I had believed to see the goodness of the LORD in the land of the living.","Psalm 27:13"],["Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.","Psalm 27:14"],["Blessed be the LORD, because he hath heard the voice of my supplications.","Psalm 28:6"],["The LORD is my strength and my shield; my heart trusted in him, and I am helped: therefore my heart greatly rejoiceth; and with my song will I praise him.","Psalm 28:7"],["The LORD is their strength, and he is the saving strength of his anointed.","Psalm 28:8"],["Save thy people, and bless thine inheritance: feed them also, and lift them up for ever.","Psalm 28:9"],["Give unto the LORD, O ye mighty, give unto the LORD glory and strength.","Psalm 29:1"],["The LORD will give strength unto his people; the LORD will bless his people with peace.","Psalm 29:11"],["I will extol thee, O LORD; for thou hast lifted me up, and hast not made my foes to rejoice over me.","Psalm 30:1"],["O LORD my God, I cried unto thee, and thou hast healed me.","Psalm 30:2"],["Sing unto the LORD, O ye saints of his, and give thanks at the remembrance of his holiness.","Psalm 30:4"],["For his anger endureth but a moment; in his favour is life: weeping may endure for a night, but joy cometh in the morning.","Psalm 30:5"],["Hear, O LORD, and have mercy upon me: LORD, be thou my helper.","Psalm 30:10"],["In thee, O LORD, do I put my trust; let me never be ashamed: deliver me in thy righteousness.","Psalm 31:1"],["For thou art my rock and my fortress; therefore for thy name’s sake lead me, and guide me.","Psalm 31:3"],["Pull me out of the net that they have laid privily for me: for thou art my strength.","Psalm 31:4"],["Into thine hand I commit my spirit: thou hast redeemed me, O LORD God of truth.","Psalm 31:5"],["My times are in thy hand: deliver me from the hand of mine enemies, and from them that persecute me.","Psalm 31:15"],["Oh how great is thy goodness, which thou hast laid up for them that fear thee; which thou hast wrought for them that trust in thee before the sons of men!","Psalm 31:19"],["Thou shalt hide them in the secret of thy presence from the pride of man: thou shalt keep them secretly in a pavilion from the strife of tongues.","Psalm 31:20"],["Be of good courage, and he shall strengthen your heart, all ye that hope in the LORD.","Psalm 31:24"],["Blessed is the man unto whom the LORD imputeth not iniquity, and in whose spirit there is no guile.","Psalm 32:2"],["For day and night thy hand was heavy upon me: my moisture is turned into the drought of summer. Selah.","Psalm 32:4"],["Thou art my hiding place; thou shalt preserve me from trouble; thou shalt compass me about with songs of deliverance. Selah.","Psalm 32:7"],["I will instruct thee and teach thee in the way which thou shalt go: I will guide thee with mine eye.","Psalm 32:8"],["Be ye not as the horse, or as the mule, which have no understanding: whose mouth must be held in with bit and bridle, lest they come near unto thee.","Psalm 32:9"],["Be glad in the LORD, and rejoice, ye righteous: and shout for joy, all ye that are upright in heart.","Psalm 32:11"],["Rejoice in the LORD, O ye righteous: for praise is comely for the upright.","Psalm 33:1"],["Praise the LORD with harp: sing unto him with the psaltery and an instrument of ten strings.","Psalm 33:2"],["Sing unto him a new song; play skilfully with a loud noise.","Psalm 33:3"],["For the word of the LORD is right; and all his works are done in truth.","Psalm 33:4"],["He loveth righteousness and judgment: the earth is full of the goodness of the LORD.","Psalm 33:5"],["The LORD bringeth the counsel of the heathen to nought: he maketh the devices of the people of none effect.","Psalm 33:10"],["The counsel of the LORD standeth for ever, the thoughts of his heart to all generations.","Psalm 33:11"],["Blessed is the nation whose God is the LORD; and the people whom he hath chosen for his own inheritance.","Psalm 33:12"],["Our soul waiteth for the LORD: he is our help and our shield.","Psalm 33:20"],["For our heart shall rejoice in him, because we have trusted in his holy name.","Psalm 33:21"],["Let thy mercy, O LORD, be upon us, according as we hope in thee.","Psalm 33:22"],["I will bless the LORD at all times: his praise shall continually be in my mouth.","Psalm 34:1"],["My soul shall make her boast in the LORD: the humble shall hear thereof, and be glad.","Psalm 34:2"],["O taste and see that the LORD is good: blessed is the man that trusteth in him.","Psalm 34:8"],["The young lions do lack, and suffer hunger: but they that seek the LORD shall not want any good thing.","Psalm 34:10"],["What man is he that desireth life, and loveth many days, that he may see good?","Psalm 34:12"],["The eyes of the LORD are upon the righteous, and his ears are open unto their cry.","Psalm 34:15"],["The righteous cry, and the LORD heareth, and delivereth them out of all their troubles.","Psalm 34:17"],["The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.","Psalm 34:18"],["Many are the afflictions of the righteous: but the LORD delivereth him out of them all.","Psalm 34:19"],["The LORD redeemeth the soul of his servants: and none of them that trust in him shall be desolate.","Psalm 34:22"],["Plead my cause, O LORD, with them that strive with me: fight against them that fight against me.","Psalm 35:1"],["Take hold of shield and buckler, and stand up for mine help.","Psalm 35:2"],["Let them be confounded and put to shame that seek after my soul: let them be turned back and brought to confusion that devise my hurt.","Psalm 35:4"],["Let their way be dark and slippery: and let the angel of the LORD persecute them.","Psalm 35:6"],["I will give thee thanks in the great congregation: I will praise thee among much people.","Psalm 35:18"],["This thou hast seen, O LORD: keep not silence: O Lord, be not far from me.","Psalm 35:22"],["Judge me, O LORD my God, according to thy righteousness; and let them not rejoice over me.","Psalm 35:24"],["Thy mercy, O LORD, is in the heavens; and thy faithfulness reacheth unto the clouds.","Psalm 36:5"],["Thy righteousness is like the great mountains; thy judgments are a great deep: O LORD, thou preservest man and beast.","Psalm 36:6"],["For with thee is the fountain of life: in thy light shall we see light.","Psalm 36:9"],["O continue thy lovingkindness unto them that know thee; and thy righteousness to the upright in heart.","Psalm 36:10"],["Fret not thyself because of evildoers, neither be thou envious against the workers of iniquity.","Psalm 37:1"],["Delight thyself also in the LORD; and he shall give thee the desires of thine heart.","Psalm 37:4"],["Commit thy way unto the LORD; trust also in him; and he shall bring it to pass.","Psalm 37:5"],["For evildoers shall be cut off: but those that wait upon the LORD, they shall inherit the earth.","Psalm 37:9"],["But the meek shall inherit the earth; and shall delight themselves in the abundance of peace.","Psalm 37:11"],["The Lord shall laugh at him: for he seeth that his day is coming.","Psalm 37:13"],["The LORD knoweth the days of the upright: and their inheritance shall be for ever.","Psalm 37:18"],["The steps of a good man are ordered by the LORD: and he delighteth in his way.","Psalm 37:23"],["I have been young, and now am old; yet have I not seen the righteous forsaken, nor his seed begging bread.","Psalm 37:25"],["The righteous shall inherit the land, and dwell therein for ever.","Psalm 37:29"],["The mouth of the righteous speaketh wisdom, and his tongue talketh of judgment.","Psalm 37:30"],["The law of his God is in his heart; none of his steps shall slide.","Psalm 37:31"],["The LORD will not leave him in his hand, nor condemn him when he is judged.","Psalm 37:33"],["Mark the perfect man, and behold the upright: for the end of that man is peace.","Psalm 37:37"],["But the salvation of the righteous is of the LORD: he is their strength in the time of trouble.","Psalm 37:39"],["I am feeble and sore broken: I have roared by reason of the disquietness of my heart.","Psalm 38:8"],["My heart panteth, my strength faileth me: as for the light of mine eyes, it also is gone from me.","Psalm 38:10"],["My lovers and my friends stand aloof from my sore; and my kinsmen stand afar off.","Psalm 38:11"],["For in thee, O LORD, do I hope: thou wilt hear, O Lord my God.","Psalm 38:15"],["Make haste to help me, O Lord my salvation.","Psalm 38:22"],["Remove thy stroke away from me: I am consumed by the blow of thine hand.","Psalm 39:10"],["O spare me, that I may recover strength, before I go hence, and be no more.","Psalm 39:13"],["I waited patiently for the LORD; and he inclined unto me, and heard my cry.","Psalm 40:1"],["Blessed is that man that maketh the LORD his trust, and respecteth not the proud, nor such as turn aside to lies.","Psalm 40:4"],["I delight to do thy will, O my God: yea, thy law is within my heart.","Psalm 40:8"],["I have preached righteousness in the great congregation: lo, I have not refrained my lips, O LORD, thou knowest.","Psalm 40:9"],["Withhold not thou thy tender mercies from me, O LORD: let thy lovingkindness and thy truth continually preserve me.","Psalm 40:11"],["Be pleased, O LORD, to deliver me: O LORD, make haste to help me.","Psalm 40:13"],["Let all those that seek thee rejoice and be glad in thee: let such as love thy salvation say continually, The LORD be magnified.","Psalm 40:16"],["But I am poor and needy; yet the Lord thinketh upon me: thou art my help and my deliverer; make no tarrying, O my God.","Psalm 40:17"],["The LORD will preserve him, and keep him alive; and he shall be blessed upon the earth: and thou wilt not deliver him unto the will of his enemies.","Psalm 41:2"],["The LORD will strengthen him upon the bed of languishing: thou wilt make all his bed in his sickness.","Psalm 41:3"],["But thou, O LORD, be merciful unto me, and raise me up, that I may requite them.","Psalm 41:10"],["Blessed be the LORD God of Israel from everlasting, and to everlasting. Amen, and Amen.","Psalm 41:13"],["Why art thou cast down, O my soul? and why art thou disquieted in me? hope thou in God: for I shall yet praise him for the help of his countenance.","Psalm 42:5"],["O send out thy light and thy truth: let them lead me; let them bring me unto thy holy hill, and to thy tabernacles.","Psalm 43:3"],["Why art thou cast down, O my soul? and why art thou disquieted within me? hope in God: for I shall yet praise him, who is the health of my countenance, and my God.","Psalm 43:5"],["We have heard with our ears, O God, our fathers have told us, what work thou didst in their days, in the times of old.","Psalm 44:1"],["In God we boast all the day long, and praise thy name for ever. Selah.","Psalm 44:8"],["Shall not God search this out? for he knoweth the secrets of the heart.","Psalm 44:21"],["Arise for our help, and redeem us for thy mercies’ sake.","Psalm 44:26"],["Thou art fairer than the children of men: grace is poured into thy lips: therefore God hath blessed thee for ever.","Psalm 45:2"],["All thy garments smell of myrrh, and aloes, and cassia, out of the ivory palaces, whereby they have made thee glad.","Psalm 45:8"],["I will make thy name to be remembered in all generations: therefore shall the people praise thee for ever and ever.","Psalm 45:17"],["God is our refuge and strength, a very present help in trouble.","Psalm 46:1"],["God is in the midst of her; she shall not be moved: God shall help her, and that right early.","Psalm 46:5"],["The LORD of hosts is with us; the God of Jacob is our refuge. Selah.","Psalm 46:7"],["Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.","Psalm 46:10"],["The LORD of hosts is with us; the God of Jacob is our refuge. Selah.","Psalm 46:11"],["Sing praises to God, sing praises: sing praises unto our King, sing praises.","Psalm 47:6"],["For God is the King of all the earth: sing ye praises with understanding.","Psalm 47:7"],["God is known in her palaces for a refuge.","Psalm 48:3"],["Walk about Zion, and go round about her: tell the towers thereof.","Psalm 48:12"],["My mouth shall speak of wisdom; and the meditation of my heart shall be of understanding.","Psalm 49:3"],["Our God shall come, and shall not keep silence: a fire shall devour before him, and it shall be very tempestuous round about him.","Psalm 50:3"],["Whoso offereth praise glorifieth me: and to him that ordereth his conversation aright will I shew the salvation of God.","Psalm 50:23"],["Have mercy upon me, O God, according to thy lovingkindness: according unto the multitude of thy tender mercies blot out my transgressions.","Psalm 51:1"],["Behold, thou desirest truth in the inward parts: and in the hidden part thou shalt make me to know wisdom.","Psalm 51:6"],["Make me to hear joy and gladness; that the bones which thou hast broken may rejoice.","Psalm 51:8"],["Create in me a clean heart, O God; and renew a right spirit within me.","Psalm 51:10"],["Restore unto me the joy of thy salvation; and uphold me with thy free spirit.","Psalm 51:12"],["O Lord, open thou my lips; and my mouth shall shew forth thy praise.","Psalm 51:15"],["Do good in thy good pleasure unto Zion: build thou the walls of Jerusalem.","Psalm 51:18"],["I will praise thee for ever, because thou hast done it: and I will wait on thy name; for it is good before thy saints.","Psalm 52:9"],["God looked down from heaven upon the children of men, to see if there were any that did understand, that did seek God.","Psalm 53:2"],["Oh that the salvation of Israel were come out of Zion! When God bringeth back the captivity of his people, Jacob shall rejoice, and Israel shall be glad.","Psalm 53:6"],["Save me, O God, by thy name, and judge me by thy strength.","Psalm 54:1"],["For strangers are risen up against me, and oppressors seek after my soul: they have not set God before them. Selah.","Psalm 54:3"],["Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved.","Psalm 55:22"],["Be merciful unto me, O God: for man would swallow me up; he fighting daily oppresseth me.","Psalm 56:1"],["What time I am afraid, I will trust in thee.","Psalm 56:3"],["In God I will praise his word, in God I have put my trust; I will not fear what flesh can do unto me.","Psalm 56:4"],["In God will I praise his word: in the LORD will I praise his word.","Psalm 56:10"],["In God have I put my trust: I will not be afraid what man can do unto me.","Psalm 56:11"],["Thy vows are upon me, O God: I will render praises unto thee.","Psalm 56:12"],["Be merciful unto me, O God, be merciful unto me: for my soul trusteth in thee: yea, in the shadow of thy wings will I make my refuge, until these calamities be overpast.","Psalm 57:1"],["He shall send from heaven, and save me from the reproach of him that would swallow me up. Selah. God shall send forth his mercy and his truth.","Psalm 57:3"],["My heart is fixed, O God, my heart is fixed: I will sing and give praise.","Psalm 57:7"],["I will praise thee, O Lord, among the people: I will sing unto thee among the nations.","Psalm 57:9"],["For thy mercy is great unto the heavens, and thy truth unto the clouds.","Psalm 57:10"],["Do ye indeed speak righteousness, O congregation? do ye judge uprightly, O ye sons of men?","Psalm 58:1"],["Let them melt away as waters which run continually: when he bendeth his bow to shoot his arrows, let them be as cut in pieces.","Psalm 58:7"],["But I will sing of thy power; yea, I will sing aloud of thy mercy in the morning: for thou hast been my defence and refuge in the day of my trouble.","Psalm 59:16"],["Thou hast made the earth to tremble; thou hast broken it: heal the breaches thereof; for it shaketh.","Psalm 60:2"],["Thou hast given a banner to them that fear thee, that it may be displayed because of the truth. Selah.","Psalm 60:4"],["From the end of the earth will I cry unto thee, when my heart is overwhelmed: lead me to the rock that is higher than I.","Psalm 61:2"],["He shall abide before God for ever: O prepare mercy and truth, which may preserve him.","Psalm 61:7"],["Truly my soul waiteth upon God: from him cometh my salvation.","Psalm 62:1"],["My soul, wait thou only upon God; for my expectation is from him.","Psalm 62:5"],["In God is my salvation and my glory: the rock of my strength, and my refuge, is in God.","Psalm 62:7"],["Trust in him at all times; ye people, pour out your heart before him: God is a refuge for us. Selah.","Psalm 62:8"],["My soul followeth hard after thee: thy right hand upholdeth me.","Psalm 63:8"],["Hear my voice, O God, in my prayer: preserve my life from fear of the enemy.","Psalm 64:1"],["The righteous shall be glad in the LORD, and shall trust in him; and all the upright in heart shall glory.","Psalm 64:10"],["Praise waiteth for thee, O God, in Sion: and unto thee shall the vow be performed.","Psalm 65:1"],["Thou waterest the ridges thereof abundantly: thou settlest the furrows thereof: thou makest it soft with showers: thou blessest the springing thereof.","Psalm 65:10"],["The pastures are clothed with flocks; the valleys also are covered over with corn; they shout for joy, they also sing.","Psalm 65:13"],["Sing forth the honour of his name: make his praise glorious.","Psalm 66:2"],["All the earth shall worship thee, and shall sing unto thee; they shall sing to thy name. Selah.","Psalm 66:4"],["Come and see the works of God: he is terrible in his doing toward the children of men.","Psalm 66:5"],["Blessed be God, which hath not turned away my prayer, nor his mercy from me.","Psalm 66:20"],["God be merciful unto us, and bless us; and cause his face to shine upon us; Selah.","Psalm 67:1"],["Let the people praise thee, O God; let all the people praise thee.","Psalm 67:3"],["O let the nations be glad and sing for joy: for thou shalt judge the people righteously, and govern the nations upon earth. Selah.","Psalm 67:4"],["Let the people praise thee, O God; let all the people praise thee.","Psalm 67:5"],["God shall bless us; and all the ends of the earth shall fear him.","Psalm 67:7"],["But let the righteous be glad; let them rejoice before God: yea, let them exceedingly rejoice.","Psalm 68:3"],["Sing unto God, sing praises to his name: extol him that rideth upon the heavens by his name Jah, and rejoice before him.","Psalm 68:4"],["Thy congregation hath dwelt therein: thou, O God, hast prepared of thy goodness for the poor.","Psalm 68:10"],["Blessed be the Lord, who daily loadeth us with benefits, even the God of our salvation. Selah.","Psalm 68:19"],["Bless ye God in the congregations, even the Lord, from the fountain of Israel.","Psalm 68:26"],["Thy God hath commanded thy strength: strengthen, O God, that which thou hast wrought for us.","Psalm 68:28"],["Ascribe ye strength unto God: his excellency is over Israel, and his strength is in the clouds.","Psalm 68:34"],["O God, thou art terrible out of thy holy places: the God of Israel is he that giveth strength and power unto his people. Blessed be God.","Psalm 68:35"],["Save me, O God; for the waters are come in unto my soul.","Psalm 69:1"],["I am weary of my crying: my throat is dried: mine eyes fail while I wait for my God.","Psalm 69:3"],["Let not them that wait on thee, O Lord GOD of hosts, be ashamed for my sake: let not those that seek thee be confounded for my sake, O God of Israel.","Psalm 69:6"],["But as for me, my prayer is unto thee, O LORD, in an acceptable time: O God, in the multitude of thy mercy hear me, in the truth of thy salvation.","Psalm 69:13"],["Hear me, O LORD; for thy lovingkindness is good: turn unto me according to the multitude of thy tender mercies.","Psalm 69:16"],["Reproach hath broken my heart; and I am full of heaviness: and I looked for some to take pity, but there was none; and for comforters, but I found none.","Psalm 69:20"],["Let them be blotted out of the book of the living, and not be written with the righteous.","Psalm 69:28"],["I will praise the name of God with a song, and will magnify him with thanksgiving.","Psalm 69:30"],["The humble shall see this, and be glad: and your heart shall live that seek God.","Psalm 69:32"],["Let the heaven and earth praise him, the seas, and every thing that moveth therein.","Psalm 69:34"],["Make haste, O God, to deliver me; make haste to help me, O LORD.","Psalm 70:1"],["Let them be ashamed and confounded that seek after my soul: let them be turned backward, and put to confusion, that desire my hurt.","Psalm 70:2"],["Let all those that seek thee rejoice and be glad in thee: and let such as love thy salvation say continually, Let God be magnified.","Psalm 70:4"],["But I am poor and needy: make haste unto me, O God: thou art my help and my deliverer; O LORD, make no tarrying.","Psalm 70:5"],["In thee, O LORD, do I put my trust: let me never be put to confusion.","Psalm 71:1"],["Deliver me in thy righteousness, and cause me to escape: incline thine ear unto me, and save me.","Psalm 71:2"],["Be thou my strong habitation, whereunto I may continually resort: thou hast given commandment to save me; for thou art my rock and my fortress.","Psalm 71:3"],["For thou art my hope, O Lord GOD: thou art my trust from my youth.","Psalm 71:5"],["I am as a wonder unto many; but thou art my strong refuge.","Psalm 71:7"],["Let my mouth be filled with thy praise and with thy honour all the day.","Psalm 71:8"],["Cast me not off in the time of old age; forsake me not when my strength faileth.","Psalm 71:9"],["O God, be not far from me: O my God, make haste for my help.","Psalm 71:12"],["Let them be confounded and consumed that are adversaries to my soul; let them be covered with reproach and dishonour that seek my hurt.","Psalm 71:13"],["But I will hope continually, and will yet praise thee more and more.","Psalm 71:14"],["My mouth shall shew forth thy righteousness and thy salvation all the day; for I know not the numbers thereof.","Psalm 71:15"],["I will go in the strength of the Lord GOD: I will make mention of thy righteousness, even of thine only.","Psalm 71:16"],["O God, thou hast taught me from my youth: and hitherto have I declared thy wondrous works.","Psalm 71:17"],["Thou shalt increase my greatness, and comfort me on every side.","Psalm 71:21"],["My lips shall greatly rejoice when I sing unto thee; and my soul, which thou hast redeemed.","Psalm 71:23"],["The mountains shall bring peace to the people, and the little hills, by righteousness.","Psalm 72:3"],["In his days shall the righteous flourish; and abundance of peace so long as the moon endureth.","Psalm 72:7"],["Blessed be the LORD God, the God of Israel, who only doeth wondrous things.","Psalm 72:18"],["Truly God is good to Israel, even to such as are of a clean heart.","Psalm 73:1"],["Thou shalt guide me with thy counsel, and afterward receive me to glory.","Psalm 73:24"],["My flesh and my heart faileth: but God is the strength of my heart, and my portion for ever.","Psalm 73:26"],["But it is good for me to draw near to God: I have put my trust in the Lord GOD, that I may declare all thy works.","Psalm 73:28"],["Why withdrawest thou thy hand, even thy right hand? pluck it out of thy bosom.","Psalm 74:11"],["For God is my King of old, working salvation in the midst of the earth.","Psalm 74:12"],["Thou didst divide the sea by thy strength: thou brakest the heads of the dragons in the waters.","Psalm 74:13"],["The day is thine, the night also is thine: thou hast prepared the light and the sun.","Psalm 74:16"],["But I will declare for ever; I will sing praises to the God of Jacob.","Psalm 75:9"],["I call to remembrance my song in the night: I commune with mine own heart: and my spirit made diligent search.","Psalm 77:6"],["Is his mercy clean gone for ever? doth his promise fail for evermore?","Psalm 77:8"],["I will remember the works of the LORD: surely I will remember thy wonders of old.","Psalm 77:11"],["I will meditate also of all thy work, and talk of thy doings.","Psalm 77:12"],["Thy way, O God, is in the sanctuary: who is so great a God as our God?","Psalm 77:13"],["Thou art the God that doest wonders: thou hast declared thy strength among the people.","Psalm 77:14"],["Thy way is in the sea, and thy path in the great waters, and thy footsteps are not known.","Psalm 77:19"],["We will not hide them from their children, shewing to the generation to come the praises of the LORD, and his strength, and his wonderful works that he hath done.","Psalm 78:4"],["In the daytime also he led them with a cloud, and all the night with a light of fire.","Psalm 78:14"],["For their heart was not right with him, neither were they stedfast in his covenant.","Psalm 78:37"],["Help us, O God of our salvation, for the glory of thy name: and deliver us, and purge away our sins, for thy name’s sake.","Psalm 79:9"],["Turn us again, O God, and cause thy face to shine; and we shall be saved.","Psalm 80:3"],["Turn us again, O God of hosts, and cause thy face to shine; and we shall be saved.","Psalm 80:7"],["Why hast thou then broken down her hedges, so that all they which pass by the way do pluck her?","Psalm 80:12"],["Let thy hand be upon the man of thy right hand, upon the son of man whom thou madest strong for thyself.","Psalm 80:17"],["Turn us again, O LORD God of hosts, cause thy face to shine; and we shall be saved.","Psalm 80:19"],["Sing aloud unto God our strength: make a joyful noise unto the God of Jacob.","Psalm 81:1"],["Blow up the trumpet in the new moon, in the time appointed, on our solemn feast day.","Psalm 81:3"],["Keep not thou silence, O God: hold not thy peace, and be not still, O God.","Psalm 83:1"],["Fill their faces with shame; that they may seek thy name, O LORD.","Psalm 83:16"],["My soul longeth, yea, even fainteth for the courts of the LORD: my heart and my flesh crieth out for the living God.","Psalm 84:2"],["Blessed are they that dwell in thy house: they will be still praising thee. Selah.","Psalm 84:4"],["Blessed is the man whose strength is in thee; in whose heart are the ways of them.","Psalm 84:5"],["They go from strength to strength, every one of them in Zion appeareth before God.","Psalm 84:7"],["Behold, O God our shield, and look upon the face of thine anointed.","Psalm 84:9"],["For the LORD God is a sun and shield: the LORD will give grace and glory: no good thing will he withhold from them that walk uprightly.","Psalm 84:11"],["O LORD of hosts, blessed is the man that trusteth in thee.","Psalm 84:12"],["Wilt thou not revive us again: that thy people may rejoice in thee?","Psalm 85:6"],["Shew us thy mercy, O LORD, and grant us thy salvation.","Psalm 85:7"],["I will hear what God the LORD will speak: for he will speak peace unto his people, and to his saints: but let them not turn again to folly.","Psalm 85:8"],["Truth shall spring out of the earth; and righteousness shall look down from heaven.","Psalm 85:11"],["Righteousness shall go before him; and shall set us in the way of his steps.","Psalm 85:13"],["Be merciful unto me, O Lord: for I cry unto thee daily.","Psalm 86:3"],["For thou, Lord, art good, and ready to forgive; and plenteous in mercy unto all them that call upon thee.","Psalm 86:5"],["In the day of my trouble I will call upon thee: for thou wilt answer me.","Psalm 86:7"],["Among the gods there is none like unto thee, O Lord; neither are there any works like unto thy works.","Psalm 86:8"],["Teach me thy way, O LORD; I will walk in thy truth: unite my heart to fear thy name.","Psalm 86:11"],["I will praise thee, O Lord my God, with all my heart: and I will glorify thy name for evermore.","Psalm 86:12"],["But thou, O Lord, art a God full of compassion, and gracious, longsuffering, and plenteous in mercy and truth.","Psalm 86:15"],["Shall thy wonders be known in the dark? and thy righteousness in the land of forgetfulness?","Psalm 88:12"],["But unto thee have I cried, O LORD; and in the morning shall my prayer prevent thee.","Psalm 88:13"],["I will sing of the mercies of the LORD for ever: with my mouth will I make known thy faithfulness to all generations.","Psalm 89:1"],["O LORD God of hosts, who is a strong LORD like unto thee? or to thy faithfulness round about thee?","Psalm 89:8"],["Thou hast a mighty arm: strong is thy hand, and high is thy right hand.","Psalm 89:13"],["Justice and judgment are the habitation of thy throne: mercy and truth shall go before thy face.","Psalm 89:14"],["Blessed is the people that know the joyful sound: they shall walk, O LORD, in the light of thy countenance.","Psalm 89:15"],["In thy name shall they rejoice all the day: and in thy righteousness shall they be exalted.","Psalm 89:16"],["But my faithfulness and my mercy shall be with him: and in my name shall his horn be exalted.","Psalm 89:24"],["I will set his hand also in the sea, and his right hand in the rivers.","Psalm 89:25"],["He shall cry unto me, Thou art my father, my God, and the rock of my salvation.","Psalm 89:26"],["My mercy will I keep for him for evermore, and my covenant shall stand fast with him.","Psalm 89:28"],["Thou hast broken down all his hedges; thou hast brought his strong holds to ruin.","Psalm 89:40"],["All that pass by the way spoil him: he is a reproach to his neighbours.","Psalm 89:41"],["Blessed be the LORD for evermore. Amen, and Amen.","Psalm 89:52"],["Thou carriest them away as with a flood; they are as a sleep: in the morning they are like grass which groweth up.","Psalm 90:5"],["In the morning it flourisheth, and groweth up; in the evening it is cut down, and withereth.","Psalm 90:6"],["O satisfy us early with thy mercy; that we may rejoice and be glad all our days.","Psalm 90:14"],["Let thy work appear unto thy servants, and thy glory unto their children.","Psalm 90:16"],["I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.","Psalm 91:2"],["With long life will I satisfy him, and shew him my salvation.","Psalm 91:16"],["For thou, LORD, hast made me glad through thy work: I will triumph in the works of thy hands.","Psalm 92:4"],["O LORD, how great are thy works! and thy thoughts are very deep.","Psalm 92:5"],["He that chastiseth the heathen, shall not he correct? he that teacheth man knowledge, shall not he know?","Psalm 94:10"],["But judgment shall return unto righteousness: and all the upright in heart shall follow it.","Psalm 94:15"],["Unless the LORD had been my help, my soul had almost dwelt in silence.","Psalm 94:17"],["In the multitude of my thoughts within me thy comforts delight my soul.","Psalm 94:19"],["But the LORD is my defence; and my God is the rock of my refuge.","Psalm 94:22"],["O come, let us sing unto the LORD: let us make a joyful noise to the rock of our salvation.","Psalm 95:1"],["Let us come before his presence with thanksgiving, and make a joyful noise unto him with psalms.","Psalm 95:2"],["In his hand are the deep places of the earth: the strength of the hills is his also.","Psalm 95:4"],["O sing unto the LORD a new song: sing unto the LORD, all the earth.","Psalm 96:1"],["Sing unto the LORD, bless his name; shew forth his salvation from day to day.","Psalm 96:2"],["For the LORD is great, and greatly to be praised: he is to be feared above all gods.","Psalm 96:4"],["Honour and majesty are before him: strength and beauty are in his sanctuary.","Psalm 96:6"],["Give unto the LORD, O ye kindreds of the people, give unto the LORD glory and strength.","Psalm 96:7"],["Say among the heathen that the LORD reigneth: the world also shall be established that it shall not be moved: he shall judge the people righteously.","Psalm 96:10"],["Let the heavens rejoice, and let the earth be glad; let the sea roar, and the fulness thereof.","Psalm 96:11"],["The LORD reigneth; let the earth rejoice; let the multitude of isles be glad thereof.","Psalm 97:1"],["Clouds and darkness are round about him: righteousness and judgment are the habitation of his throne.","Psalm 97:2"],["The hills melted like wax at the presence of the LORD, at the presence of the Lord of the whole earth.","Psalm 97:5"],["The heavens declare his righteousness, and all the people see his glory.","Psalm 97:6"],["Light is sown for the righteous, and gladness for the upright in heart.","Psalm 97:11"],["Rejoice in the LORD, ye righteous; and give thanks at the remembrance of his holiness.","Psalm 97:12"],["O sing unto the LORD a new song; for he hath done marvellous things: his right hand, and his holy arm, hath gotten him the victory.","Psalm 98:1"],["The LORD hath made known his salvation: his righteousness hath he openly shewed in the sight of the heathen.","Psalm 98:2"],["Make a joyful noise unto the LORD, all the earth: make a loud noise, and rejoice, and sing praise.","Psalm 98:4"],["Sing unto the LORD with the harp; with the harp, and the voice of a psalm.","Psalm 98:5"],["Let them praise thy great and terrible name; for it is holy.","Psalm 99:3"],["Make a joyful noise unto the LORD, all ye lands.","Psalm 100:1"],["Serve the LORD with gladness: come before his presence with singing.","Psalm 100:2"],["For the LORD is good; his mercy is everlasting; and his truth endureth to all generations.","Psalm 100:5"],["I will sing of mercy and judgment: unto thee, O LORD, will I sing.","Psalm 101:1"],["I will behave myself wisely in a perfect way. O when wilt thou come unto me? I will walk within my house with a perfect heart.","Psalm 101:2"],["Mine eyes shall be upon the faithful of the land, that they may dwell with me: he that walketh in a perfect way, he shall serve me.","Psalm 101:6"],["Hide not thy face from me in the day when I am in trouble; incline thine ear unto me: in the day when I call answer me speedily.","Psalm 102:2"],["But thou, O LORD, shalt endure for ever; and thy remembrance unto all generations.","Psalm 102:12"],["Thou shalt arise, and have mercy upon Zion: for the time to favour her, yea, the set time, is come.","Psalm 102:13"],["This shall be written for the generation to come: and the people which shall be created shall praise the LORD.","Psalm 102:18"],["Bless the LORD, O my soul: and all that is within me, bless his holy name.","Psalm 103:1"],["The LORD executeth righteousness and judgment for all that are oppressed.","Psalm 103:6"],["The LORD is merciful and gracious, slow to anger, and plenteous in mercy.","Psalm 103:8"],["Bless the LORD, ye his angels, that excel in strength, that do his commandments, hearkening unto the voice of his word.","Psalm 103:20"],["Bless ye the LORD, all ye his hosts; ye ministers of his, that do his pleasure.","Psalm 103:21"],["Bless the LORD, all his works in all places of his dominion: bless the LORD, O my soul.","Psalm 103:22"],["Bless the LORD, O my soul. O LORD my God, thou art very great; thou art clothed with honour and majesty.","Psalm 104:1"],["By them shall the fowls of the heaven have their habitation, which sing among the branches.","Psalm 104:12"],["The young lions roar after their prey, and seek their meat from God.","Psalm 104:21"],["Man goeth forth unto his work and to his labour until the evening.","Psalm 104:23"],["O LORD, how manifold are thy works! in wisdom hast thou made them all: the earth is full of thy riches.","Psalm 104:24"],["Thou sendest forth thy spirit, they are created: and thou renewest the face of the earth.","Psalm 104:30"],["The glory of the LORD shall endure for ever: the LORD shall rejoice in his works.","Psalm 104:31"],["I will sing unto the LORD as long as I live: I will sing praise to my God while I have my being.","Psalm 104:33"],["My meditation of him shall be sweet: I will be glad in the LORD.","Psalm 104:34"],["O give thanks unto the LORD; call upon his name: make known his deeds among the people.","Psalm 105:1"],["Sing unto him, sing psalms unto him: talk ye of all his wondrous works.","Psalm 105:2"],["Glory ye in his holy name: let the heart of them rejoice that seek the LORD.","Psalm 105:3"],["Seek the LORD, and his strength: seek his face evermore.","Psalm 105:4"],["Praise ye the LORD. O give thanks unto the LORD; for he is good: for his mercy endureth for ever.","Psalm 106:1"],["Blessed are they that keep judgment, and he that doeth righteousness at all times.","Psalm 106:3"],["Save us, O LORD our God, and gather us from among the heathen, to give thanks unto thy holy name, and to triumph in thy praise.","Psalm 106:47"],["Blessed be the LORD God of Israel from everlasting to everlasting: and let all the people say, Amen. Praise ye the LORD.","Psalm 106:48"],["O give thanks unto the LORD, for he is good: for his mercy endureth for ever.","Psalm 107:1"],["Oh that men would praise the LORD for his goodness, and for his wonderful works to the children of men!","Psalm 107:8"],["Oh that men would praise the LORD for his goodness, and for his wonderful works to the children of men!","Psalm 107:15"],["Oh that men would praise the LORD for his goodness, and for his wonderful works to the children of men!","Psalm 107:21"],["These see the works of the LORD, and his wonders in the deep.","Psalm 107:24"],["Oh that men would praise the LORD for his goodness, and for his wonderful works to the children of men!","Psalm 107:31"],["Let them exalt him also in the congregation of the people, and praise him in the assembly of the elders.","Psalm 107:32"],["The righteous shall see it, and rejoice: and all iniquity shall stop her mouth.","Psalm 107:42"],["Whoso is wise, and will observe these things, even they shall understand the lovingkindness of the LORD.","Psalm 107:43"],["O God, my heart is fixed; I will sing and give praise, even with my glory.","Psalm 108:1"],["I will praise thee, O LORD, among the people: and I will sing praises unto thee among the nations.","Psalm 108:3"],["For thy mercy is great above the heavens: and thy truth reacheth unto the clouds.","Psalm 108:4"],["Let the extortioner catch all that he hath; and let the strangers spoil his labour.","Psalm 109:11"],["Let there be none to extend mercy unto him: neither let there be any to favour his fatherless children.","Psalm 109:12"],["But do thou for me, O GOD the Lord, for thy name’s sake: because thy mercy is good, deliver thou me.","Psalm 109:21"],["I will greatly praise the LORD with my mouth; yea, I will praise him among the multitude.","Psalm 109:30"],["For he shall stand at the right hand of the poor, to save him from those that condemn his soul.","Psalm 109:31"],["The LORD shall send the rod of thy strength out of Zion: rule thou in the midst of thine enemies.","Psalm 110:2"],["Thy people shall be willing in the day of thy power, in the beauties of holiness from the womb of the morning: thou hast the dew of thy youth.","Psalm 110:3"],["Praise ye the LORD. I will praise the LORD with my whole heart, in the assembly of the upright, and in the congregation.","Psalm 111:1"],["The works of the LORD are great, sought out of all them that have pleasure therein.","Psalm 111:2"],["He hath made his wonderful works to be remembered: the LORD is gracious and full of compassion.","Psalm 111:4"],["The works of his hands are verity and judgment; all his commandments are sure.","Psalm 111:7"],["The fear of the LORD is the beginning of wisdom: a good understanding have all they that do his commandments: his praise endureth for ever.","Psalm 111:10"],["Praise ye the LORD. Blessed is the man that feareth the LORD, that delighteth greatly in his commandments.","Psalm 112:1"],["Wealth and riches shall be in his house: and his righteousness endureth for ever.","Psalm 112:3"],["A good man sheweth favour, and lendeth: he will guide his affairs with discretion.","Psalm 112:5"],["Blessed be the name of the LORD from this time forth and for evermore.","Psalm 113:2"],["From the rising of the sun unto the going down of the same the LORD’s name is to be praised.","Psalm 113:3"],["He maketh the barren woman to keep house, and to be a joyful mother of children. Praise ye the LORD.","Psalm 113:9"],["O Israel, trust thou in the LORD: he is their help and their shield.","Psalm 115:9"],["Ye that fear the LORD, trust in the LORD: he is their help and their shield.","Psalm 115:11"],["He will bless them that fear the LORD, both small and great.","Psalm 115:13"],["Ye are blessed of the LORD which made heaven and earth.","Psalm 115:15"],["But we will bless the LORD from this time forth and for evermore. Praise the LORD.","Psalm 115:18"],["I love the LORD, because he hath heard my voice and my supplications.","Psalm 116:1"],["Gracious is the LORD, and righteous; yea, our God is merciful.","Psalm 116:5"],["Return unto thy rest, O my soul; for the LORD hath dealt bountifully with thee.","Psalm 116:7"],["I will walk before the LORD in the land of the living.","Psalm 116:9"],["I will take the cup of salvation, and call upon the name of the LORD.","Psalm 116:13"],["O praise the LORD, all ye nations: praise him, all ye people.","Psalm 117:1"],["For his merciful kindness is great toward us: and the truth of the LORD endureth for ever. Praise ye the LORD.","Psalm 117:2"],["O give thanks unto the LORD; for he is good: because his mercy endureth for ever.","Psalm 118:1"],["Let Israel now say, that his mercy endureth for ever.","Psalm 118:2"],["Let them now that fear the LORD say, that his mercy endureth for ever.","Psalm 118:4"],["It is better to trust in the LORD than to put confidence in man.","Psalm 118:8"],["It is better to trust in the LORD than to put confidence in princes.","Psalm 118:9"],["The LORD is my strength and song, and is become my salvation.","Psalm 118:14"],["The voice of rejoicing and salvation is in the tabernacles of the righteous: the right hand of the LORD doeth valiantly.","Psalm 118:15"],["The right hand of the LORD is exalted: the right hand of the LORD doeth valiantly.","Psalm 118:16"],["I will praise thee: for thou hast heard me, and art become my salvation.","Psalm 118:21"],["This is the day which the LORD hath made; we will rejoice and be glad in it.","Psalm 118:24"],["Save now, I beseech thee, O LORD: O LORD, I beseech thee, send now prosperity.","Psalm 118:25"],["Thou art my God, and I will praise thee: thou art my God, I will exalt thee.","Psalm 118:28"],["O give thanks unto the LORD; for he is good: for his mercy endureth for ever.","Psalm 118:29"],["Blessed are the undefiled in the way, who walk in the law of the LORD.","Psalm 119:1"],["Blessed are they that keep his testimonies, and that seek him with the whole heart.","Psalm 119:2"],["Thou hast commanded us to keep thy precepts diligently.","Psalm 119:4"],["O that my ways were directed to keep thy statutes!","Psalm 119:5"],["I will praise thee with uprightness of heart, when I shall have learned thy righteous judgments.","Psalm 119:7"],["I will keep thy statutes: O forsake me not utterly.","Psalm 119:8"],["With my whole heart have I sought thee: O let me not wander from thy commandments.","Psalm 119:10"],["Thy word have I hid in mine heart, that I might not sin against thee.","Psalm 119:11"],["Blessed art thou, O LORD: teach me thy statutes.","Psalm 119:12"],["I have rejoiced in the way of thy testimonies, as much as in all riches.","Psalm 119:14"],["I will delight myself in thy statutes: I will not forget thy word.","Psalm 119:16"],["Make me to understand the way of thy precepts: so shall I talk of thy wondrous works.","Psalm 119:27"],["My soul melteth for heaviness: strengthen thou me according unto thy word.","Psalm 119:28"],["Remove from me the way of lying: and grant me thy law graciously.","Psalm 119:29"],["I have chosen the way of truth: thy judgments have I laid before me.","Psalm 119:30"],["I will run the way of thy commandments, when thou shalt enlarge my heart.","Psalm 119:32"],["Give me understanding, and I shall keep thy law; yea, I shall observe it with my whole heart.","Psalm 119:34"],["Make me to go in the path of thy commandments; for therein do I delight.","Psalm 119:35"],["Incline my heart unto thy testimonies, and not to covetousness.","Psalm 119:36"],["Turn away my reproach which I fear: for thy judgments are good.","Psalm 119:39"],["Behold, I have longed after thy precepts: quicken me in thy righteousness.","Psalm 119:40"],["I remembered thy judgments of old, O LORD; and have comforted myself.","Psalm 119:52"],["I intreated thy favour with my whole heart: be merciful unto me according to thy word.","Psalm 119:58"],["I made haste, and delayed not to keep thy commandments.","Psalm 119:60"],["At midnight I will rise to give thanks unto thee because of thy righteous judgments.","Psalm 119:62"],["I am a companion of all them that fear thee, and of them that keep thy precepts.","Psalm 119:63"],["The earth, O LORD, is full of thy mercy: teach me thy statutes.","Psalm 119:64"],["Teach me good judgment and knowledge: for I have believed thy commandments.","Psalm 119:66"],["Thou art good, and doest good; teach me thy statutes.","Psalm 119:68"],["The proud have forged a lie against me: but I will keep thy precepts with my whole heart.","Psalm 119:69"],["Let thy tender mercies come unto me, that I may live: for thy law is my delight.","Psalm 119:77"],["Let my heart be sound in thy statutes; that I be not ashamed.","Psalm 119:80"],["All thy commandments are faithful: they persecute me wrongfully; help thou me.","Psalm 119:86"],["Quicken me after thy lovingkindness; so shall I keep the testimony of thy mouth.","Psalm 119:88"],["Thy faithfulness is unto all generations: thou hast established the earth, and it abideth.","Psalm 119:90"],["I am thine, save me; for I have sought thy precepts.","Psalm 119:94"],["I have more understanding than all my teachers: for thy testimonies are my meditation.","Psalm 119:99"],["I understand more than the ancients, because I keep thy precepts.","Psalm 119:100"],["I have sworn, and I will perform it, that I will keep thy righteous judgments.","Psalm 119:106"],["My soul is continually in my hand: yet do I not forget thy law.","Psalm 119:109"],["Thy testimonies have I taken as an heritage for ever: for they are the rejoicing of my heart.","Psalm 119:111"],["I have inclined mine heart to perform thy statutes alway, even unto the end.","Psalm 119:112"],["Thou art my hiding place and my shield: I hope in thy word.","Psalm 119:114"],["Depart from me, ye evildoers: for I will keep the commandments of my God.","Psalm 119:115"],["Uphold me according unto thy word, that I may live: and let me not be ashamed of my hope.","Psalm 119:116"],["Mine eyes fail for thy salvation, and for the word of thy righteousness.","Psalm 119:123"],["It is time for thee, LORD, to work: for they have made void thy law.","Psalm 119:126"],["The entrance of thy words giveth light; it giveth understanding unto the simple.","Psalm 119:130"],["Look thou upon me, and be merciful unto me, as thou usest to do unto those that love thy name.","Psalm 119:132"],["Deliver me from the oppression of man: so will I keep thy precepts.","Psalm 119:134"],["Rivers of waters run down mine eyes, because they keep not thy law.","Psalm 119:136"],["Thy testimonies that thou hast commanded are righteous and very faithful.","Psalm 119:138"],["Thy righteousness is an everlasting righteousness, and thy law is the truth.","Psalm 119:142"],["Trouble and anguish have taken hold on me: yet thy commandments are my delights.","Psalm 119:143"],["The righteousness of thy testimonies is everlasting: give me understanding, and I shall live.","Psalm 119:144"],["I cried unto thee; save me, and I shall keep thy testimonies.","Psalm 119:146"],["I prevented the dawning of the morning, and cried: I hoped in thy word.","Psalm 119:147"],["Thou art near, O LORD; and all thy commandments are truth.","Psalm 119:151"],["Consider how I love thy precepts: quicken me, O LORD, according to thy lovingkindness.","Psalm 119:159"],["Thy word is true from the beginning: and every one of thy righteous judgments endureth for ever.","Psalm 119:160"],["I rejoice at thy word, as one that findeth great spoil.","Psalm 119:162"],["Seven times a day do I praise thee because of thy righteous judgments.","Psalm 119:164"],["Great peace have they which love thy law: and nothing shall offend them.","Psalm 119:165"],["LORD, I have hoped for thy salvation, and done thy commandments.","Psalm 119:166"],["My soul hath kept thy testimonies; and I love them exceedingly.","Psalm 119:167"],["My lips shall utter praise, when thou hast taught me thy statutes.","Psalm 119:171"],["My tongue shall speak of thy word: for all thy commandments are righteousness.","Psalm 119:172"],["Let thine hand help me; for I have chosen thy precepts.","Psalm 119:173"],["I have longed for thy salvation, O LORD; and thy law is my delight.","Psalm 119:174"],["Let my soul live, and it shall praise thee; and let thy judgments help me.","Psalm 119:175"],["I will lift up mine eyes unto the hills, from whence cometh my help.","Psalm 121:1"],["My help cometh from the LORD, which made heaven and earth.","Psalm 121:2"],["The LORD is thy keeper: the LORD is thy shade upon thy right hand.","Psalm 121:5"],["The LORD shall preserve thy going out and thy coming in from this time forth, and even for evermore.","Psalm 121:8"],["Pray for the peace of Jerusalem: they shall prosper that love thee.","Psalm 122:6"],["Peace be within thy walls, and prosperity within thy palaces.","Psalm 122:7"],["Have mercy upon us, O LORD, have mercy upon us: for we are exceedingly filled with contempt.","Psalm 123:3"],["Blessed be the LORD, who hath not given us as a prey to their teeth.","Psalm 124:6"],["Our help is in the name of the LORD, who made heaven and earth.","Psalm 124:8"],["They that trust in the LORD shall be as mount Zion, which cannot be removed, but abideth for ever.","Psalm 125:1"],["Do good, O LORD, unto those that be good, and to them that are upright in their hearts.","Psalm 125:4"],["The LORD hath done great things for us; whereof we are glad.","Psalm 126:3"],["He that goeth forth and weepeth, bearing precious seed, shall doubtless come again with rejoicing, bringing his sheaves with him.","Psalm 126:6"],["Lo, children are an heritage of the LORD: and the fruit of the womb is his reward.","Psalm 127:3"],["Blessed is every one that feareth the LORD; that walketh in his ways.","Psalm 128:1"],["Behold, that thus shall the man be blessed that feareth the LORD.","Psalm 128:4"],["The LORD shall bless thee out of Zion: and thou shalt see the good of Jerusalem all the days of thy life.","Psalm 128:5"],["Wherewith the mower filleth not his hand; nor he that bindeth sheaves his bosom.","Psalm 129:7"],["I wait for the LORD, my soul doth wait, and in his word do I hope.","Psalm 130:5"],["My soul waiteth for the Lord more than they that watch for the morning: I say, more than they that watch for the morning.","Psalm 130:6"],["Let Israel hope in the LORD: for with the LORD there is mercy, and with him is plenteous redemption.","Psalm 130:7"],["LORD, my heart is not haughty, nor mine eyes lofty: neither do I exercise myself in great matters, or in things too high for me.","Psalm 131:1"],["Let Israel hope in the LORD from henceforth and for ever.","Psalm 131:3"],["I will abundantly bless her provision: I will satisfy her poor with bread.","Psalm 132:15"],["Behold, how good and how pleasant it is for brethren to dwell together in unity!","Psalm 133:1"],["Lift up your hands in the sanctuary, and bless the LORD.","Psalm 134:2"],["The LORD that made heaven and earth bless thee out of Zion.","Psalm 134:3"],["Praise the LORD; for the LORD is good: sing praises unto his name; for it is pleasant.","Psalm 135:3"],["Thy name, O LORD, endureth for ever; and thy memorial, O LORD, throughout all generations.","Psalm 135:13"],["The idols of the heathen are silver and gold, the work of men’s hands.","Psalm 135:15"],["Blessed be the LORD out of Zion, which dwelleth at Jerusalem. Praise ye the LORD.","Psalm 135:21"],["O give thanks unto the LORD; for he is good: for his mercy endureth for ever.","Psalm 136:1"],["O give thanks unto the God of gods: for his mercy endureth for ever.","Psalm 136:2"],["O give thanks to the Lord of lords: for his mercy endureth for ever.","Psalm 136:3"],["The moon and stars to rule by night: for his mercy endureth for ever.","Psalm 136:9"],["With a strong hand, and with a stretched out arm: for his mercy endureth for ever.","Psalm 136:12"],["O give thanks unto the God of heaven: for his mercy endureth for ever.","Psalm 136:26"],["For there they that carried us away captive required of us a song; and they that wasted us required of us mirth, saying, Sing us one of the songs of Zion.","Psalm 137:3"],["I will praise thee with my whole heart: before the gods will I sing praise unto thee.","Psalm 138:1"],["In the day when I cried thou answeredst me, and strengthenedst me with strength in my soul.","Psalm 138:3"],["The LORD will perfect that which concerneth me: thy mercy, O LORD, endureth for ever: forsake not the works of thine own hands.","Psalm 138:8"],["Thou compassest my path and my lying down, and art acquainted with all my ways.","Psalm 139:3"],["Thou hast beset me behind and before, and laid thine hand upon me.","Psalm 139:5"],["Such knowledge is too wonderful for me; it is high, I cannot attain unto it.","Psalm 139:6"],["I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.","Psalm 139:14"],["O GOD the Lord, the strength of my salvation, thou hast covered my head in the day of battle.","Psalm 140:7"],["Set a watch, O LORD, before my mouth; keep the door of my lips.","Psalm 141:3"],["But mine eyes are unto thee, O GOD the Lord: in thee is my trust; leave not my soul destitute.","Psalm 141:8"],["I looked on my right hand, and beheld, but there was no man that would know me: refuge failed me; no man cared for my soul.","Psalm 142:4"],["Bring my soul out of prison, that I may praise thy name: the righteous shall compass me about; for thou shalt deal bountifully with me.","Psalm 142:7"],["Hear my prayer, O LORD, give ear to my supplications: in thy faithfulness answer me, and in thy righteousness.","Psalm 143:1"],["I remember the days of old; I meditate on all thy works; I muse on the work of thy hands.","Psalm 143:5"],["Cause me to hear thy lovingkindness in the morning; for in thee do I trust: cause me to know the way wherein I should walk; for I lift up my soul unto thee.","Psalm 143:8"],["Teach me to do thy will; for thou art my God: thy spirit is good; lead me into the land of uprightness.","Psalm 143:10"],["Quicken me, O LORD, for thy name’s sake: for thy righteousness’ sake bring my soul out of trouble.","Psalm 143:11"],["My goodness, and my fortress; my high tower, and my deliverer; my shield, and he in whom I trust; who subdueth my people under me.","Psalm 144:2"],["LORD, what is man, that thou takest knowledge of him! or the son of man, that thou makest account of him!","Psalm 144:3"],["I will sing a new song unto thee, O God: upon a psaltery and an instrument of ten strings will I sing praises unto thee.","Psalm 144:9"],["Every day will I bless thee; and I will praise thy name for ever and ever.","Psalm 145:2"],["Great is the LORD, and greatly to be praised; and his greatness is unsearchable.","Psalm 145:3"],["One generation shall praise thy works to another, and shall declare thy mighty acts.","Psalm 145:4"],["I will speak of the glorious honour of thy majesty, and of thy wondrous works.","Psalm 145:5"],["The LORD is gracious, and full of compassion; slow to anger, and of great mercy.","Psalm 145:8"],["The LORD is good to all: and his tender mercies are over all his works.","Psalm 145:9"],["All thy works shall praise thee, O LORD; and thy saints shall bless thee.","Psalm 145:10"],["The eyes of all wait upon thee; and thou givest them their meat in due season.","Psalm 145:15"],["Thou openest thine hand, and satisfiest the desire of every living thing.","Psalm 145:16"],["The LORD is righteous in all his ways, and holy in all his works.","Psalm 145:17"],["The LORD is nigh unto all them that call upon him, to all that call upon him in truth.","Psalm 145:18"],["My mouth shall speak the praise of the LORD: and let all flesh bless his holy name for ever and ever.","Psalm 145:21"],["While I live will I praise the LORD: I will sing praises unto my God while I have any being.","Psalm 146:2"],["Put not your trust in princes, nor in the son of man, in whom there is no help.","Psalm 146:3"],["Praise ye the LORD: for it is good to sing praises unto our God; for it is pleasant; and praise is comely.","Psalm 147:1"],["Great is our Lord, and of great power: his understanding is infinite.","Psalm 147:5"],["The LORD taketh pleasure in them that fear him, in those that hope in his mercy.","Psalm 147:11"],["Praise the LORD, O Jerusalem; praise thy God, O Zion.","Psalm 147:12"],["Praise ye him, all his angels: praise ye him, all his hosts.","Psalm 148:2"],["Praise ye him, sun and moon: praise him, all ye stars of light.","Psalm 148:3"],["Praise him, ye heavens of heavens, and ye waters that be above the heavens.","Psalm 148:4"],["Let them praise the name of the LORD: for he commanded, and they were created.","Psalm 148:5"],["Let them praise the name of the LORD: for his name alone is excellent; his glory is above the earth and heaven.","Psalm 148:13"],["Praise ye the LORD. Sing unto the LORD a new song, and his praise in the congregation of saints.","Psalm 149:1"],["Let Israel rejoice in him that made him: let the children of Zion be joyful in their King.","Psalm 149:2"],["Let them praise his name in the dance: let them sing praises unto him with the timbrel and harp.","Psalm 149:3"],["For the LORD taketh pleasure in his people: he will beautify the meek with salvation.","Psalm 149:4"],["Let the saints be joyful in glory: let them sing aloud upon their beds.","Psalm 149:5"],["Praise him for his mighty acts: praise him according to his excellent greatness.","Psalm 150:2"],["Praise him with the sound of the trumpet: praise him with the psaltery and harp.","Psalm 150:3"],["Praise him with the timbrel and dance: praise him with stringed instruments and organs.","Psalm 150:4"],["Praise him upon the loud cymbals: praise him upon the high sounding cymbals.","Psalm 150:5"],["For the LORD giveth wisdom: out of his mouth cometh knowledge and understanding.","Proverbs 2:6"],["None that go unto her return again, neither take they hold of the paths of life.","Proverbs 2:19"],["For length of days, and long life, and peace, shall they add to thee.","Proverbs 3:2"],["Trust in the LORD with all thine heart; and lean not unto thine own understanding.","Proverbs 3:5"],["In all thy ways acknowledge him, and he shall direct thy paths.","Proverbs 3:6"],["Happy is the man that findeth wisdom, and the man that getteth understanding.","Proverbs 3:13"],["Length of days is in her right hand; and in her left hand riches and honour.","Proverbs 3:16"],["The LORD by wisdom hath founded the earth; by understanding hath he established the heavens.","Proverbs 3:19"],["By his knowledge the depths are broken up, and the clouds drop down the dew.","Proverbs 3:20"],["For the LORD shall be thy confidence, and shall keep thy foot from being taken.","Proverbs 3:26"],["Withhold not good from them to whom it is due, when it is in the power of thine hand to do it.","Proverbs 3:27"],["Strive not with a man without cause, if he have done thee no harm.","Proverbs 3:30"],["Hear, ye children, the instruction of a father, and attend to know understanding.","Proverbs 4:1"],["Get wisdom, get understanding: forget it not; neither decline from the words of my mouth.","Proverbs 4:5"],["Forsake her not, and she shall preserve thee: love her, and she shall keep thee.","Proverbs 4:6"],["Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding.","Proverbs 4:7"],["I have taught thee in the way of wisdom; I have led thee in right paths.","Proverbs 4:11"],["Take fast hold of instruction; let her not go: keep her; for she is thy life.","Proverbs 4:13"],["But the path of the just is as the shining light, that shineth more and more unto the perfect day.","Proverbs 4:18"],["Let them not depart from thine eyes; keep them in the midst of thine heart.","Proverbs 4:21"],["For they are life unto those that find them, and health to all their flesh.","Proverbs 4:22"],["Keep thy heart with all diligence; for out of it are the issues of life.","Proverbs 4:23"],["Ponder the path of thy feet, and let all thy ways be established.","Proverbs 4:26"],["Let thy fountain be blessed: and rejoice with the wife of thy youth.","Proverbs 5:18"],["Do this now, my son, and deliver thyself, when thou art come into the hand of thy friend; go, humble thyself, and make sure thy friend.","Proverbs 6:3"],["Deliver thyself as a roe from the hand of the hunter, and as a bird from the hand of the fowler.","Proverbs 6:5"],["Bind them continually upon thine heart, and tie them about thy neck.","Proverbs 6:21"],["Lust not after her beauty in thine heart; neither let her take thee with her eyelids.","Proverbs 6:25"],["My son, keep my words, and lay up my commandments with thee.","Proverbs 7:1"],["Keep my commandments, and live; and my law as the apple of thine eye.","Proverbs 7:2"],["Bind them upon thy fingers, write them upon the table of thine heart.","Proverbs 7:3"],["Come, let us take our fill of love until the morning: let us solace ourselves with loves.","Proverbs 7:18"],["Let not thine heart decline to her ways, go not astray in her paths.","Proverbs 7:25"],["Receive my instruction, and not silver; and knowledge rather than choice gold.","Proverbs 8:10"],["I wisdom dwell with prudence, and find out knowledge of witty inventions.","Proverbs 8:12"],["Counsel is mine, and sound wisdom: I am understanding; I have strength.","Proverbs 8:14"],["I love them that love me; and those that seek me early shall find me.","Proverbs 8:17"],["Riches and honour are with me; yea, durable riches and righteousness.","Proverbs 8:18"],["The LORD possessed me in the beginning of his way, before his works of old.","Proverbs 8:22"],["Hear instruction, and be wise, and refuse it not.","Proverbs 8:33"],["For whoso findeth me findeth life, and shall obtain favour of the LORD.","Proverbs 8:35"],["Give instruction to a wise man, and he will be yet wiser: teach a just man, and he will increase in learning.","Proverbs 9:9"],["The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding.","Proverbs 9:10"],["In the lips of him that hath understanding wisdom is found: but a rod is for the back of him that is void of understanding.","Proverbs 10:13"],["In the multitude of words there wanteth not sin: but he that refraineth his lips is wise.","Proverbs 10:19"],["The blessing of the LORD, it maketh rich, and he addeth no sorrow with it.","Proverbs 10:22"],["He that is void of wisdom despiseth his neighbour: but a man of understanding holdeth his peace.","Proverbs 11:12"],["A talebearer revealeth secrets: but he that is of a faithful spirit concealeth the matter.","Proverbs 11:13"],["A gracious woman retaineth honour: and strong men retain riches.","Proverbs 11:16"],["The merciful man doeth good to his own soul: but he that is cruel troubleth his own flesh.","Proverbs 11:17"],["He that trusteth in his riches shall fall: but the righteous shall flourish as a branch.","Proverbs 11:28"],["The fruit of the righteous is a tree of life; and he that winneth souls is wise.","Proverbs 11:30"],["A man shall be commended according to his wisdom: but he that is of a perverse heart shall be despised.","Proverbs 12:8"],["A man shall be satisfied with good by the fruit of his mouth: and the recompence of a man’s hands shall be rendered unto him.","Proverbs 12:14"],["Heaviness in the heart of man maketh it stoop: but a good word maketh it glad.","Proverbs 12:25"],["Hope deferred maketh the heart sick: but when the desire cometh, it is a tree of life.","Proverbs 13:12"],["A good man leaveth an inheritance to his children’s children: and the wealth of the sinner is laid up for the just.","Proverbs 13:22"],["The heart knoweth his own bitterness; and a stranger doth not intermeddle with his joy.","Proverbs 14:10"],["The backslider in heart shall be filled with his own ways: and a good man shall be satisfied from himself.","Proverbs 14:14"],["The simple inherit folly: but the prudent are crowned with knowledge.","Proverbs 14:18"],["He that despiseth his neighbour sinneth: but he that hath mercy on the poor, happy is he.","Proverbs 14:21"],["In all labour there is profit: but the talk of the lips tendeth only to penury.","Proverbs 14:23"],["In the fear of the LORD is strong confidence: and his children shall have a place of refuge.","Proverbs 14:26"],["Righteousness exalteth a nation: but sin is a reproach to any people.","Proverbs 14:34"],["A wholesome tongue is a tree of life: but perverseness therein is a breach in the spirit.","Proverbs 15:4"],["Folly is joy to him that is destitute of wisdom: but a man of understanding walketh uprightly.","Proverbs 15:21"],["Without counsel purposes are disappointed: but in the multitude of counsellors they are established.","Proverbs 15:22"],["A man hath joy by the answer of his mouth: and a word spoken in due season, how good is it!","Proverbs 15:23"],["The light of the eyes rejoiceth the heart: and a good report maketh the bones fat.","Proverbs 15:30"],["The ear that heareth the reproof of life abideth among the wise.","Proverbs 15:31"],["He that refuseth instruction despiseth his own soul: but he that heareth reproof getteth understanding.","Proverbs 15:32"],["The fear of the LORD is the instruction of wisdom; and before honour is humility.","Proverbs 15:33"],["The preparations of the heart in man, and the answer of the tongue, is from the LORD.","Proverbs 16:1"],["Commit thy works unto the LORD, and thy thoughts shall be established.","Proverbs 16:3"],["Better is a little with righteousness than great revenues without right.","Proverbs 16:8"],["A man’s heart deviseth his way: but the LORD directeth his steps.","Proverbs 16:9"],["A just weight and balance are the LORD’s: all the weights of the bag are his work.","Proverbs 16:11"],["He that handleth a matter wisely shall find good: and whoso trusteth in the LORD, happy is he.","Proverbs 16:20"],["The wise in heart shall be called prudent: and the sweetness of the lips increaseth learning.","Proverbs 16:21"],["The heart of the wise teacheth his mouth, and addeth learning to his lips.","Proverbs 16:23"],["Pleasant words are as an honeycomb, sweet to the soul, and health to the bones.","Proverbs 16:24"],["The hoary head is a crown of glory, if it be found in the way of righteousness.","Proverbs 16:31"],["The lot is cast into the lap; but the whole disposing thereof is of the LORD.","Proverbs 16:33"],["Children’s children are the crown of old men; and the glory of children are their fathers.","Proverbs 17:6"],["A gift is as a precious stone in the eyes of him that hath it: whithersoever it turneth, it prospereth.","Proverbs 17:8"],["He that covereth a transgression seeketh love; but he that repeateth a matter separateth very friends.","Proverbs 17:9"],["A friend loveth at all times, and a brother is born for adversity.","Proverbs 17:17"],["A man void of understanding striketh hands, and becometh surety in the presence of his friend.","Proverbs 17:18"],["A merry heart doeth good like a medicine: but a broken spirit drieth the bones.","Proverbs 17:22"],["He that hath knowledge spareth his words: and a man of understanding is of an excellent spirit.","Proverbs 17:27"],["Through desire a man, having separated himself, seeketh and intermeddleth with all wisdom.","Proverbs 18:1"],["The words of a man’s mouth are as deep waters, and the wellspring of wisdom as a flowing brook.","Proverbs 18:4"],["The name of the LORD is a strong tower: the righteous runneth into it, and is safe.","Proverbs 18:10"],["The heart of the prudent getteth knowledge; and the ear of the wise seeketh knowledge.","Proverbs 18:15"],["A man’s gift maketh room for him, and bringeth him before great men.","Proverbs 18:16"],["Whoso findeth a wife findeth a good thing, and obtaineth favour of the LORD.","Proverbs 18:22"],["He that getteth wisdom loveth his own soul: he that keepeth understanding shall find good.","Proverbs 19:8"],["Chasten thy son while there is hope, and let not thy soul spare for his crying.","Proverbs 19:18"],["Hear counsel, and receive instruction, that thou mayest be wise in thy latter end.","Proverbs 19:20"],["There are many devices in a man’s heart; nevertheless the counsel of the LORD, that shall stand.","Proverbs 19:21"],["Cease, my son, to hear the instruction that causeth to err from the words of knowledge.","Proverbs 19:27"],["Counsel in the heart of man is like deep water; but a man of understanding will draw it out.","Proverbs 20:5"],["The just man walketh in his integrity: his children are blessed after him.","Proverbs 20:7"],["Love not sleep, lest thou come to poverty; open thine eyes, and thou shalt be satisfied with bread.","Proverbs 20:13"],["An inheritance may be gotten hastily at the beginning; but the end thereof shall not be blessed.","Proverbs 20:21"],["The glory of young men is their strength: and the beauty of old men is the gray head.","Proverbs 20:29"],["Every way of a man is right in his own eyes: but the LORD pondereth the hearts.","Proverbs 21:2"],["The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want.","Proverbs 21:5"],["He that followeth after righteousness and mercy findeth life, righteousness, and honour.","Proverbs 21:21"],["There is no wisdom nor understanding nor counsel against the LORD.","Proverbs 21:30"],["The horse is prepared against the day of battle: but safety is of the LORD.","Proverbs 21:31"],["A good name is rather to be chosen than great riches, and loving favour rather than silver and gold.","Proverbs 22:1"],["By humility and the fear of the LORD are riches, and honour, and life.","Proverbs 22:4"],["Train up a child in the way he should go: and when he is old, he will not depart from it.","Proverbs 22:6"],["He that hath a bountiful eye shall be blessed; for he giveth of his bread to the poor.","Proverbs 22:9"],["Bow down thine ear, and hear the words of the wise, and apply thine heart unto my knowledge.","Proverbs 22:17"],["Labour not to be rich: cease from thine own wisdom.","Proverbs 23:4"],["Apply thine heart unto instruction, and thine ears to the words of knowledge.","Proverbs 23:12"],["My son, if thine heart be wise, my heart shall rejoice, even mine.","Proverbs 23:15"],["Let not thine heart envy sinners: but be thou in the fear of the LORD all the day long.","Proverbs 23:17"],["Hear thou, my son, and be wise, and guide thine heart in the way.","Proverbs 23:19"],["Buy the truth, and sell it not; also wisdom, and instruction, and understanding.","Proverbs 23:23"],["The father of the righteous shall greatly rejoice: and he that begetteth a wise child shall have joy of him.","Proverbs 23:24"],["My son, give me thine heart, and let thine eyes observe my ways.","Proverbs 23:26"],["A wise man is strong; yea, a man of knowledge increaseth strength.","Proverbs 24:5"],["But to them that rebuke him shall be delight, and a good blessing shall come upon them.","Proverbs 24:25"],["Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.","Proverbs 24:27"],["Say not, I will do so to him as he hath done to me: I will render to the man according to his work.","Proverbs 24:29"],["Whoso boasteth himself of a false gift is like clouds and wind without rain.","Proverbs 25:14"],["For thou shalt heap coals of fire upon his head, and the LORD shall reward thee.","Proverbs 25:22"],["Boast not thyself of to morrow; for thou knowest not what a day may bring forth.","Proverbs 27:1"],["Let another man praise thee, and not thine own mouth; a stranger, and not thine own lips.","Proverbs 27:2"],["Open rebuke is better than secret love.","Proverbs 27:5"],["Ointment and perfume rejoice the heart: so doth the sweetness of a man’s friend by hearty counsel.","Proverbs 27:9"],["My son, be wise, and make my heart glad, that I may answer him that reproacheth me.","Proverbs 27:11"],["A continual dropping in a very rainy day and a contentious woman are alike.","Proverbs 27:15"],["Whoso keepeth the fig tree shall eat the fruit thereof: so he that waiteth on his master shall be honoured.","Proverbs 27:18"],["Be thou diligent to know the state of thy flocks, and look well to thy herds.","Proverbs 27:23"],["He that covereth his sins shall not prosper: but whoso confesseth and forsaketh them shall have mercy.","Proverbs 28:13"],["A faithful man shall abound with blessings: but he that maketh haste to be rich shall not be innocent.","Proverbs 28:20"],["Correct thy son, and he shall give thee rest; yea, he shall give delight unto thy soul.","Proverbs 29:17"],["The fear of man bringeth a snare: but whoso putteth his trust in the LORD shall be safe.","Proverbs 29:25"],["Many seek the ruler’s favour; but every man’s judgment cometh from the LORD.","Proverbs 29:26"],["I neither learned wisdom, nor have the knowledge of the holy.","Proverbs 30:3"],["Every word of God is pure: he is a shield unto them that put their trust in him.","Proverbs 30:5"],["Open thy mouth, judge righteously, and plead the cause of the poor and needy.","Proverbs 31:9"],["The heart of her husband doth safely trust in her, so that he shall have no need of spoil.","Proverbs 31:11"],["Strength and honour are her clothing; and she shall rejoice in time to come.","Proverbs 31:25"],["All the rivers run into the sea; yet the sea is not full; unto the place from whence the rivers come, thither they return again.","Ecclesiastes 1:7"],["All things are full of labour; man cannot utter it: the eye is not satisfied with seeing, nor the ear filled with hearing.","Ecclesiastes 1:8"],["To every thing there is a season, and a time to every purpose under the heaven:","Ecclesiastes 3:1"],["I know that there is no good in them, but for a man to rejoice, and to do good in his life.","Ecclesiastes 3:12"],["Two are better than one; because they have a good reward for their labour.","Ecclesiastes 4:9"],["Be not rash with thy mouth, and let not thine heart be hasty to utter any thing before God: for God is in heaven, and thou upon earth: therefore let thy words be few.","Ecclesiastes 5:2"],["For he shall not much remember the days of his life; because God answereth him in the joy of his heart.","Ecclesiastes 5:20"],["All the labour of man is for his mouth, and yet the appetite is not filled.","Ecclesiastes 6:7"],["Better is the end of a thing than the beginning thereof: and the patient in spirit is better than the proud in spirit.","Ecclesiastes 7:8"],["Wisdom is good with an inheritance: and by it there is profit to them that see the sun.","Ecclesiastes 7:11"],["For wisdom is a defence, and money is a defence: but the excellency of knowledge is, that wisdom giveth life to them that have it.","Ecclesiastes 7:12"],["It is good that thou shouldest take hold of this; yea, also from this withdraw not thine hand: for he that feareth God shall come forth of them all.","Ecclesiastes 7:18"],["Lo, this only have I found, that God hath made man upright; but they have sought out many inventions.","Ecclesiastes 7:29"],["Whoso keepeth the commandment shall feel no evil thing: and a wise man’s heart discerneth both time and judgment.","Ecclesiastes 8:5"],["Go thy way, eat thy bread with joy, and drink thy wine with a merry heart; for God now accepteth thy works.","Ecclesiastes 9:7"],["The preacher sought to find out acceptable words: and that which was written was upright, even words of truth.","Ecclesiastes 12:10"],["The words of the wise are as goads, and as nails fastened by the masters of assemblies, which are given from one shepherd.","Ecclesiastes 12:11"],["Let us hear the conclusion of the whole matter: Fear God, and keep his commandments: for this is the whole duty of man.","Ecclesiastes 12:13"],["Learn to do well; seek judgment, relieve the oppressed, judge the fatherless, plead for the widow.","Isaiah 1:17"],["Zion shall be redeemed with judgment, and her converts with righteousness.","Isaiah 1:27"],["The lofty looks of man shall be humbled, and the haughtiness of men shall be bowed down, and the LORD alone shall be exalted in that day.","Isaiah 2:11"],["In that day shall he swear, saying, I will not be an healer; for in my house is neither bread nor clothing: make me not a ruler of the people.","Isaiah 3:7"],["Say ye to the righteous, that it shall be well with him: for they shall eat the fruit of their doings.","Isaiah 3:10"],["In that day shall the branch of the LORD be beautiful and glorious, and the fruit of the earth shall be excellent and comely for them that are escaped of Israel.","Isaiah 4:2"],["But the LORD of hosts shall be exalted in judgment, and God that is holy shall be sanctified in righteousness.","Isaiah 5:16"],["Take counsel together, and it shall come to nought; speak the word, and it shall not stand: for God is with us.","Isaiah 8:10"],["Behold, God is my salvation; I will trust, and not be afraid: for the LORD JEHOVAH is my strength and my song; he also is become my salvation.","Isaiah 12:2"],["Sing unto the LORD; for he hath done excellent things: this is known in all the earth.","Isaiah 12:5"],["The whole earth is at rest, and is quiet: they break forth into singing.","Isaiah 14:7"],["Take counsel, execute judgment; make thy shadow as the night in the midst of the noonday; hide the outcasts; bewray not him that wandereth.","Isaiah 16:3"],["Prepare the table, watch in the watchtower, eat, drink: arise, ye princes, and anoint the shield.","Isaiah 21:5"],["The mirth of tabrets ceaseth, the noise of them that rejoice endeth, the joy of the harp ceaseth.","Isaiah 24:8"],["They shall lift up their voice, they shall sing for the majesty of the LORD, they shall cry aloud from the sea.","Isaiah 24:14"],["O LORD, thou art my God; I will exalt thee, I will praise thy name; for thou hast done wonderful things; thy counsels of old are faithfulness and truth.","Isaiah 25:1"],["For in this mountain shall the hand of the LORD rest, and Moab shall be trodden down under him, even as straw is trodden down for the dunghill.","Isaiah 25:10"],["Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee.","Isaiah 26:3"],["The way of the just is uprightness: thou, most upright, dost weigh the path of the just.","Isaiah 26:7"],["LORD, thou wilt ordain peace for us: for thou also hast wrought all our works in us.","Isaiah 26:12"],["I the LORD do keep it; I will water it every moment: lest any hurt it, I will keep it night and day.","Isaiah 27:3"],["In measure, when it shooteth forth, thou wilt debate with it: he stayeth his rough wind in the day of the east wind.","Isaiah 27:8"],["Get you out of the way, turn aside out of the path, cause the Holy One of Israel to cease from before us.","Isaiah 30:11"],["Blessed are ye that sow beside all waters, that send forth thither the feet of the ox and the ass.","Isaiah 32:20"],["O LORD, be gracious unto us; we have waited for thee: be thou their arm every morning, our salvation also in the time of trouble.","Isaiah 33:2"],["The LORD is exalted; for he dwelleth on high: he hath filled Zion with judgment and righteousness.","Isaiah 33:5"],["The wilderness and the solitary place shall be glad for them; and the desert shall rejoice, and blossom as the rose.","Isaiah 35:1"],["Strengthen ye the weak hands, and confirm the feeble knees.","Isaiah 35:3"],["I reckoned till morning, that, as a lion, so will he break all my bones: from day even to night wilt thou make an end of me.","Isaiah 38:13"],["O Lord, by these things men live, and in all these things is the life of my spirit: so wilt thou recover me, and make me to live.","Isaiah 38:16"],["Behold, for peace I had great bitterness: but thou hast in love to my soul delivered it from the pit of corruption: for thou hast cast all my sins behind thy back.","Isaiah 38:17"],["The living, the living, he shall praise thee, as I do this day: the father to the children shall make known thy truth.","Isaiah 38:19"],["Comfort ye, comfort ye my people, saith your God.","Isaiah 40:1"],["The grass withereth, the flower fadeth: but the word of our God shall stand for ever.","Isaiah 40:8"],["Behold, the Lord GOD will come with strong hand, and his arm shall rule for him: behold, his reward is with him, and his work before him.","Isaiah 40:10"],["The workman melteth a graven image, and the goldsmith spreadeth it over with gold, and casteth silver chains.","Isaiah 40:19"],["He giveth power to the faint; and to them that have no might he increaseth strength.","Isaiah 40:29"],["But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.","Isaiah 40:31"],["Keep silence before me, O islands; and let the people renew their strength: let them come near; then let them speak: let us come near together to judgment.","Isaiah 41:1"],["Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.","Isaiah 41:10"],["For I the LORD thy God will hold thy right hand, saying unto thee, Fear not; I will help thee.","Isaiah 41:13"],["A bruised reed shall he not break, and the smoking flax shall he not quench: he shall bring forth judgment unto truth.","Isaiah 42:3"],["I am the LORD: that is my name: and my glory will I not give to another, neither my praise to graven images.","Isaiah 42:8"],["Sing unto the LORD a new song, and his praise from the end of the earth, ye that go down to the sea, and all that is therein; the isles, and the inhabitants thereof.","Isaiah 42:10"],["Let them give glory unto the LORD, and declare his praise in the islands.","Isaiah 42:12"],["The LORD is well pleased for his righteousness’ sake; he will magnify the law, and make it honourable.","Isaiah 42:21"],["But Israel shall be saved in the LORD with an everlasting salvation: ye shall not be ashamed nor confounded world without end.","Isaiah 45:17"],["I bring near my righteousness; it shall not be far off, and my salvation shall not tarry: and I will place salvation in Zion for Israel my glory.","Isaiah 46:13"],["I, even I, have spoken; yea, I have called him: I have brought him, and he shall make his way prosperous.","Isaiah 48:15"],["Sing, O heavens; and be joyful, O earth; and break forth into singing, O mountains: for the LORD hath comforted his people, and will have mercy upon his afflicted.","Isaiah 49:13"],["For the Lord GOD will help me; therefore shall I not be confounded: therefore have I set my face like a flint, and I know that I shall not be ashamed.","Isaiah 50:7"],["Hearken to me, ye that follow after righteousness, ye that seek the LORD: look unto the rock whence ye are hewn, and to the hole of the pit whence ye are digged.","Isaiah 51:1"],["Hearken unto me, my people; and give ear unto me, O my nation: for a law shall proceed from me, and I will make my judgment to rest for a light of the people.","Isaiah 51:4"],["My righteousness is near; my salvation is gone forth, and mine arms shall judge the people; the isles shall wait upon me, and on mine arm shall they trust.","Isaiah 51:5"],["Hearken unto me, ye that know righteousness, the people in whose heart is my law; fear ye not the reproach of men, neither be ye afraid of their revilings.","Isaiah 51:7"],["Thy watchmen shall lift up the voice; with the voice together shall they sing: for they shall see eye to eye, when the LORD shall bring again Zion.","Isaiah 52:8"],["Break forth into joy, sing together, ye waste places of Jerusalem: for the LORD hath comforted his people, he hath redeemed Jerusalem.","Isaiah 52:9"],["The LORD hath made bare his holy arm in the eyes of all the nations; and all the ends of the earth shall see the salvation of our God.","Isaiah 52:10"],["But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.","Isaiah 53:5"],["All we like sheep have gone astray; we have turned every one to his own way; and the LORD hath laid on him the iniquity of us all.","Isaiah 53:6"],["O thou afflicted, tossed with tempest, and not comforted, behold, I will lay thy stones with fair colours, and lay thy foundations with sapphires.","Isaiah 54:11"],["In righteousness shalt thou be established: thou shalt be far from oppression; for thou shalt not fear: and from terror; for it shall not come near thee.","Isaiah 54:14"],["Behold, I have given him for a witness to the people, a leader and commander to the people.","Isaiah 55:4"],["I will declare thy righteousness, and thy works; for they shall not profit thee.","Isaiah 57:12"],["I have seen his ways, and will heal him: I will lead him also, and restore comforts unto him and to his mourners.","Isaiah 57:18"],["I create the fruit of the lips; Peace, peace to him that is far off, and to him that is near, saith the LORD; and I will heal him.","Isaiah 57:19"],["The way of peace they know not; and there is no judgment in their goings: they have made them crooked paths: whosoever goeth therein shall not know peace.","Isaiah 59:8"],["Arise, shine; for thy light is come, and the glory of the LORD is risen upon thee.","Isaiah 60:1"],["Thy sun shall no more go down; neither shall thy moon withdraw itself: for the LORD shall be thine everlasting light, and the days of thy mourning shall be ended.","Isaiah 60:20"],["For as a young man marrieth a virgin, so shall thy sons marry thee: and as the bridegroom rejoiceth over the bride, so shall thy God rejoice over thee.","Isaiah 62:5"],["But they that have gathered it shall eat it, and praise the LORD; and they that have brought it together shall drink it in the courts of my holiness.","Isaiah 62:9"],["But now, O LORD, thou art our father; we are the clay, and thou our potter; and we all are the work of thy hand.","Isaiah 64:8"],["But be ye glad and rejoice for ever in that which I create: for, behold, I create Jerusalem a rejoicing, and her people a joy.","Isaiah 65:18"],["I have set thee for a tower and a fortress among my people, that thou mayest know and try their way.","Jeremiah 6:27"],["Take ye heed every one of his neighbour, and trust ye not in any brother: for every brother will utterly supplant, and every neighbour will walk with slanders.","Jeremiah 9:4"],["Thy words were found, and I did eat them; and thy word was unto me the joy and rejoicing of mine heart: for I am called by thy name, O LORD God of hosts.","Jeremiah 15:16"],["I sat not in the assembly of the mockers, nor rejoiced; I sat alone because of thy hand: for thou hast filled me with indignation.","Jeremiah 15:17"],["Blessed is the man that trusteth in the LORD, and whose hope the LORD is.","Jeremiah 17:7"],["Heal me, O LORD, and I shall be healed; save me, and I shall be saved: for thou art my praise.","Jeremiah 17:14"],["Behold, I will bring it health and cure, and I will cure them, and will reveal unto them the abundance of peace and truth.","Jeremiah 33:6"],["But I will deliver thee in that day, saith the LORD: and thou shalt not be given into the hand of the men of whom thou art afraid.","Jeremiah 39:17"],["Leave thy fatherless children, I will preserve them alive; and let thy widows trust in me.","Jeremiah 49:11"],["The LORD hath brought forth our righteousness: come, and let us declare in Zion the work of the LORD our God.","Jeremiah 51:10"],["I was a derision to all my people; and their song all the day.","Lamentations 3:14"],["It is of the LORD’s mercies that we are not consumed, because his compassions fail not.","Lamentations 3:22"],["They are new every morning: great is thy faithfulness.","Lamentations 3:23"],["The LORD is good unto them that wait for him, to the soul that seeketh him.","Lamentations 3:25"],["It is good that a man should both hope and quietly wait for the salvation of the LORD.","Lamentations 3:26"],["Our necks are under persecution: we labour, and have no rest.","Lamentations 5:5"],["Go thee one way or other, either on the right hand, or on the left, whithersoever thy face is set.","Ezekiel 21:16"],["Tarshish was thy merchant by reason of the multitude of all kind of riches; with silver, iron, tin, and lead, they traded in thy fairs.","Ezekiel 27:12"],["I have even heard of thee, that the spirit of the gods is in thee, and that light and understanding and excellent wisdom is found in thee.","Daniel 5:14"],["But go thou thy way till the end be: for thou shalt rest, and stand in thy lot at the end of the days.","Daniel 12:13"],["Rejoice not, O Israel, for joy, as other people: for thou hast gone a whoring from thy God, thou hast loved a reward upon every cornfloor.","Hosea 9:1"],["Sow to yourselves in righteousness, reap in mercy; break up your fallow ground: for it is time to seek the LORD, till he come and rain righteousness upon you.","Hosea 10:12"],["Fear not, O land; be glad and rejoice: for the LORD will do great things.","Joel 2:21"],["Be not afraid, ye beasts of the field: for the pastures of the wilderness do spring, for the tree beareth her fruit, the fig tree and the vine do yield their strength.","Joel 2:22"],["But let judgment run down as waters, and righteousness as a mighty stream.","Amos 5:24"],["He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?","Micah 6:8"],["The best of them is as a brier: the most upright is sharper than a thorn hedge: the day of thy watchmen and thy visitation cometh; now shall be their perplexity.","Micah 7:4"],["Trust ye not in a friend, put ye not confidence in a guide: keep the doors of thy mouth from her that lieth in thy bosom.","Micah 7:5"],["Therefore I will look unto the LORD; I will wait for the God of my salvation: my God will hear me.","Micah 7:7"],["Rejoice not against me, O mine enemy: when I fall, I shall arise; when I sit in darkness, the LORD shall be a light unto me.","Micah 7:8"],["Behold, his soul which is lifted up is not upright in him: but the just shall live by his faith.","Habakkuk 2:4"],["The LORD God is my strength, and he will make my feet like hinds’ feet, and he will make me to walk upon mine high places. To the chief singer on my stringed instruments.","Habakkuk 3:19"],["The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing.","Zephaniah 3:17"],["But it shall be one day which shall be known to the LORD, not day, nor night: but it shall come to pass, that at evening time it shall be light.","Zechariah 14:7"],["My covenant was with him of life and peace; and I gave them to him for the fear wherewith he feared me, and was afraid before my name.","Malachi 2:5"],["Blessed are they that mourn: for they shall be comforted.","Matthew 5:4"],["Blessed are the meek: for they shall inherit the earth.","Matthew 5:5"],["Blessed are they which do hunger and thirst after righteousness: for they shall be filled.","Matthew 5:6"],["Blessed are the merciful: for they shall obtain mercy.","Matthew 5:7"],["Blessed are the pure in heart: for they shall see God.","Matthew 5:8"],["Blessed are the peacemakers: for they shall be called the children of God.","Matthew 5:9"],["Rejoice, and be exceeding glad: for great is your reward in heaven: for so persecuted they the prophets which were before you.","Matthew 5:12"],["Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.","Matthew 5:16"],["Take heed that ye do not your alms before men, to be seen of them: otherwise ye have no reward of your Father which is in heaven.","Matthew 6:1"],["Give us this day our daily bread.","Matthew 6:11"],["The light of the body is the eye: if therefore thine eye be single, thy whole body shall be full of light.","Matthew 6:22"],["But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.","Matthew 6:33"],["Every tree that bringeth not forth good fruit is hewn down, and cast into the fire.","Matthew 7:19"],["What I tell you in darkness, that speak ye in light: and what ye hear in the ear, that preach ye upon the housetops.","Matthew 10:27"],["He that loveth father or mother more than me is not worthy of me: and he that loveth son or daughter more than me is not worthy of me.","Matthew 10:37"],["He that findeth his life shall lose it: and he that loseth his life for my sake shall find it.","Matthew 10:39"],["Come unto me, all ye that labour and are heavy laden, and I will give you rest.","Matthew 11:28"],["Take my yoke upon you, and learn of me; for I am meek and lowly in heart: and ye shall find rest unto your souls.","Matthew 11:29"],["For the Son of man is Lord even of the sabbath day.","Matthew 12:8"],["Either make the tree good, and his fruit good; or else make the tree corrupt, and his fruit corrupt: for the tree is known by his fruit.","Matthew 12:33"],["But when he saw the wind boisterous, he was afraid; and beginning to sink, he cried, saying, Lord, save me.","Matthew 14:30"],["For whosoever will save his life shall lose it: and whosoever will lose his life for my sake shall find it.","Matthew 16:25"],["For the Son of man shall come in the glory of his Father with his angels; and then he shall reward every man according to his works.","Matthew 16:27"],["Honour thy father and thy mother: and, Thou shalt love thy neighbour as thyself.","Matthew 19:19"],["But Jesus beheld them, and said unto them, With men this is impossible; but with God all things are possible.","Matthew 19:26"],["Take that thine is, and go thy way: I will give unto this last, even as unto thee.","Matthew 20:14"],["Blessed is that servant, whom his lord when he cometh shall find so doing.","Matthew 24:46"],["Rise, let us be going: behold, he is at hand that doth betray me.","Matthew 26:46"],["The voice of one crying in the wilderness, Prepare ye the way of the Lord, make his paths straight.","Mark 1:3"],["No man can enter into a strong man’s house, and spoil his goods, except he will first bind the strong man; and then he will spoil his house.","Mark 3:27"],["For whosoever will save his life shall lose it; but whosoever shall lose his life for my sake and the gospel’s, the same shall save it.","Mark 8:35"],["Jesus said unto him, If thou canst believe, all things are possible to him that believeth.","Mark 9:23"],["But Jesus took him by the hand, and lifted him up; and he arose.","Mark 9:27"],["But they held their peace: for by the way they had disputed among themselves, who should be the greatest.","Mark 9:34"],["Rise up, let us go; lo, he that betrayeth me is at hand.","Mark 14:42"],["Save thyself, and come down from the cross.","Mark 15:30"],["In holiness and righteousness before him, all the days of our life.","Luke 1:75"],["Glory to God in the highest, and on earth peace, good will toward men.","Luke 2:14"],["Rejoice ye in that day, and leap for joy: for, behold, your reward is great in heaven: for in the like manner did their fathers unto the prophets.","Luke 6:23"],["But that on the good ground are they, which in an honest and good heart, having heard the word, keep it, and bring forth fruit with patience.","Luke 8:15"],["No man, when he hath lighted a candle, covereth it with a vessel, or putteth it under a bed; but setteth it on a candlestick, that they which enter in may see the light.","Luke 8:16"],["For whosoever will save his life shall lose it: but whosoever will lose his life for my sake, the same shall save it.","Luke 9:24"],["Carry neither purse, nor scrip, nor shoes: and salute no man by the way.","Luke 10:4"],["Give us day by day our daily bread.","Luke 11:3"],["No man, when he hath lighted a candle, putteth it in a secret place, neither under a bushel, but on a candlestick, that they which come in may see the light.","Luke 11:33"],["The life is more than meat, and the body is more than raiment.","Luke 12:23"],["Blessed is that servant, whom his lord when he cometh shall find so doing.","Luke 12:43"],["I say unto you, that likewise joy shall be in heaven over one sinner that repenteth, more than over ninety and nine just persons, which need no repentance.","Luke 15:7"],["He that is faithful in that which is least is faithful also in much: and he that is unjust in the least is unjust also in much.","Luke 16:10"],["There are not found that returned to give glory to God, save this stranger.","Luke 17:18"],["For the Son of man is come to seek and to save that which was lost.","Luke 19:10"],["In your patience possess ye your souls.","Luke 21:19"],["But I have prayed for thee, that thy faith fail not: and when thou art converted, strengthen thy brethren.","Luke 22:32"],["Hereafter shall the Son of man sit on the right hand of the power of God.","Luke 22:69"],["But we trusted that it had been he which should have redeemed Israel: and beside all this, to day is the third day since these things were done.","Luke 24:21"],["In him was life; and the life was the light of men.","John 1:4"],["For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.","John 3:16"],["But he that doeth truth cometh to the light, that his deeds may be made manifest, that they are wrought in God.","John 3:21"],["The Father loveth the Son, and hath given all things into his hand.","John 3:35"],["God is a Spirit: and they that worship him must worship him in spirit and in truth.","John 4:24"],["I sent you to reap that whereon ye bestowed no labour: other men laboured, and ye are entered into their labours.","John 4:38"],["In these lay a great multitude of impotent folk, of blind, halt, withered, waiting for the moving of the water.","John 5:3"],["For the Father loveth the Son, and sheweth him all things that himself doeth: and he will shew him greater works than these, that ye may marvel.","John 5:20"],["I can of mine own self do nothing: as I hear, I judge: and my judgment is just; because I seek not mine own will, but the will of the Father which hath sent me.","John 5:30"],["Search the scriptures; for in them ye think ye have eternal life: and they are they which testify of me.","John 5:39"],["But I know you, that ye have not the love of God in you.","John 5:42"],["For the bread of God is he which cometh down from heaven, and giveth life unto the world.","John 6:33"],["All that the Father giveth me shall come to me; and him that cometh to me I will in no wise cast out.","John 6:37"],["No man can come to me, except the Father which hath sent me draw him: and I will raise him up at the last day.","John 6:44"],["Judge not according to the appearance, but judge righteous judgment.","John 7:24"],["Ye shall seek me, and shall not find me: and where I am, thither ye cannot come.","John 7:34"],["Your father Abraham rejoiced to see my day: and he saw it, and was glad.","John 8:56"],["I must work the works of him that sent me, while it is day: the night cometh, when no man can work.","John 9:4"],["I am the good shepherd: the good shepherd giveth his life for the sheep.","John 10:11"],["I am the good shepherd, and know my sheep, and am known of mine.","John 10:14"],["My Father, which gave them me, is greater than all; and no man is able to pluck them out of my Father’s hand.","John 10:29"],["But if a man walk in the night, he stumbleth, because there is no light in him.","John 11:10"],["For they loved the praise of men more than the praise of God.","John 12:43"],["I am come a light into the world, that whosoever believeth on me should not abide in darkness.","John 12:46"],["He that rejecteth me, and receiveth not my words, hath one that judgeth him: the word that I have spoken, the same shall judge him in the last day.","John 12:48"],["Jesus saith to him, He that is washed needeth not save to wash his feet, but is clean every whit: and ye are clean, but not all.","John 13:10"],["A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another.","John 13:34"],["By this shall all men know that ye are my disciples, if ye have love one to another.","John 13:35"],["Let not your heart be troubled: ye believe in God, believe also in me.","John 14:1"],["Believe me that I am in the Father, and the Father in me: or else believe me for the very works’ sake.","John 14:11"],["I will not leave you comfortless: I will come to you.","John 14:18"],["At that day ye shall know that I am in my Father, and ye in me, and I in you.","John 14:20"],["He that loveth me not keepeth not my sayings: and the word which ye hear is not mine, but the Father’s which sent me.","John 14:24"],["Greater love hath no man than this, that a man lay down his life for his friends.","John 15:13"],["Hitherto have ye asked nothing in my name: ask, and ye shall receive, that your joy may be full.","John 16:24"],["I have glorified thee on the earth: I have finished the work which thou gavest me to do.","John 17:4"],["Sanctify them through thy truth: thy word is truth.","John 17:17"],["I in them, and thou in me, that they may be made perfect in one; and that the world may know that thou hast sent me, and hast loved them, as thou hast loved me.","John 17:23"],["O righteous Father, the world hath not known thee: but I have known thee, and these have known that thou hast sent me.","John 17:25"],["But these are written, that ye might believe that Jesus is the Christ, the Son of God; and that believing ye might have life through his name.","John 20:31"],["But when the morning was now come, Jesus stood on the shore: but the disciples knew not that it was Jesus.","John 21:4"],["For to do whatsoever thy hand and thy counsel determined before to be done.","Acts 4:28"],["By stretching forth thine hand to heal; and that signs and wonders may be done by the name of thy holy child Jesus.","Acts 4:30"],["But in every nation he that feareth him, and worketh righteousness, is accepted with him.","Acts 10:35"],["For he was a good man, and full of the Holy Ghost and of faith: and much people was added unto the Lord.","Acts 11:24"],["First, I thank my God through Jesus Christ for you all, that your faith is spoken of throughout the whole world.","Romans 1:8"],["For therein is the righteousness of God revealed from faith to faith: as it is written, The just shall live by faith.","Romans 1:17"],["But we are sure that the judgment of God is according to truth against them which commit such things.","Romans 2:2"],["In the day when God shall judge the secrets of men by Jesus Christ according to my gospel.","Romans 2:16"],["Much every way: chiefly, because that unto them were committed the oracles of God.","Romans 3:2"],["Blessed is the man to whom the Lord will not impute sin.","Romans 4:8"],["For the promise, that he should be the heir of the world, was not to Abraham, or to his seed, through the law, but through the righteousness of faith.","Romans 4:13"],["But God be thanked, that ye were the servants of sin, but ye have obeyed from the heart that form of doctrine which was delivered you.","Romans 6:17"],["But now being made free from sin, and become servants to God, ye have your fruit unto holiness, and the end everlasting life.","Romans 6:22"],["But if we hope for that we see not, then do we with patience wait for it.","Romans 8:25"],["And we know that all things work together for good to them that love God, to them who are the called according to his purpose.","Romans 8:28"],["For he will finish the work, and cut it short in righteousness: because a short work will the Lord make upon the earth.","Romans 9:28"],["Brethren, my heart’s desire and prayer to God for Israel is, that they might be saved.","Romans 10:1"],["For I bear them record that they have a zeal of God, but not according to knowledge.","Romans 10:2"],["For they being ignorant of God’s righteousness, and going about to establish their own righteousness, have not submitted themselves unto the righteousness of God.","Romans 10:3"],["For Christ is the end of the law for righteousness to every one that believeth.","Romans 10:4"],["For with the heart man believeth unto righteousness; and with the mouth confession is made unto salvation.","Romans 10:10"],["For God hath concluded them all in unbelief, that he might have mercy upon all.","Romans 11:32"],["O the depth of the riches both of the wisdom and knowledge of God! how unsearchable are his judgments, and his ways past finding out!","Romans 11:33"],["And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.","Romans 12:2"],["Rejoicing in hope; patient in tribulation; continuing instant in prayer;","Romans 12:12"],["Owe no man any thing, but to love one another: for he that loveth another hath fulfilled the law.","Romans 13:8"],["Love worketh no ill to his neighbour: therefore love is the fulfilling of the law.","Romans 13:10"],["The night is far spent, the day is at hand: let us therefore cast off the works of darkness, and let us put on the armour of light.","Romans 13:12"],["Him that is weak in the faith receive ye, but not to doubtful disputations.","Romans 14:1"],["Let us not therefore judge one another any more: but judge this rather, that no man put a stumblingblock or an occasion to fall in his brother’s way.","Romans 14:13"],["Let every one of us please his neighbour for his good to edification.","Romans 15:2"],["For whatsoever things were written aforetime were written for our learning, that we through patience and comfort of the scriptures might have hope.","Romans 15:4"],["Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.","Romans 15:13"],["For they that are such serve not our Lord Jesus Christ, but their own belly; and by good words and fair speeches deceive the hearts of the simple.","Romans 16:18"],["The grace of our Lord Jesus Christ be with you all. Amen.","Romans 16:24"],["Grace be unto you, and peace, from God our Father, and from the Lord Jesus Christ.","1 Corinthians 1:3"],["God is faithful, by whom ye were called unto the fellowship of his Son Jesus Christ our Lord.","1 Corinthians 1:9"],["For Christ sent me not to baptize, but to preach the gospel: not with wisdom of words, lest the cross of Christ should be made of none effect.","1 Corinthians 1:17"],["For after that in the wisdom of God the world by wisdom knew not God, it pleased God by the foolishness of preaching to save them that believe.","1 Corinthians 1:21"],["For I determined not to know any thing among you, save Jesus Christ, and him crucified.","1 Corinthians 2:2"],["But as it is written, Eye hath not seen, nor ear heard, neither have entered into the heart of man, the things which God hath prepared for them that love him.","1 Corinthians 2:9"],["Every man’s work shall be made manifest: for the day shall declare it, because it shall be revealed by fire; and the fire shall try every man’s work of what sort it is.","1 Corinthians 3:13"],["What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own?","1 Corinthians 6:19"],["For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God’s.","1 Corinthians 6:20"],["But if the unbelieving depart, let him depart. A brother or a sister is not under bondage in such cases: but God hath called us to peace.","1 Corinthians 7:15"],["But if any man love God, the same is known of him.","1 Corinthians 8:3"],["I speak as to wise men; judge ye what I say.","1 Corinthians 10:15"],["Let no man seek his own, but every man another’s wealth.","1 Corinthians 10:24"],["Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God.","1 Corinthians 10:31"],["But all these worketh that one and the selfsame Spirit, dividing to every man severally as he will.","1 Corinthians 12:11"],["Beareth all things, believeth all things, hopeth all things, endureth all things.","1 Corinthians 13:7"],["Charity never faileth: but whether there be prophecies, they shall fail; whether there be tongues, they shall cease; whether there be knowledge, it shall vanish away.","1 Corinthians 13:8"],["Brethren, be not children in understanding: howbeit in malice be ye children, but in understanding be men.","1 Corinthians 14:20"],["But if there be no interpreter, let him keep silence in the church; and let him speak to himself, and to God.","1 Corinthians 14:28"],["For God is not the author of confusion, but of peace, as in all churches of the saints.","1 Corinthians 14:33"],["Let your women keep silence in the churches: for it is not permitted unto them to speak; but they are commanded to be under obedience, as also saith the law.","1 Corinthians 14:34"],["But thanks be to God, which giveth us the victory through our Lord Jesus Christ.","1 Corinthians 15:57"],["Upon the first day of the week let every one of you lay by him in store, as God hath prospered him, that there be no gatherings when I come.","1 Corinthians 16:2"],["For I will not see you now by the way; but I trust to tarry a while with you, if the Lord permit.","1 Corinthians 16:7"],["Let no man therefore despise him: but conduct him forth in peace, that he may come unto me: for I look for him with the brethren.","1 Corinthians 16:11"],["Watch ye, stand fast in the faith, quit you like men, be strong.","1 Corinthians 16:13"],["Let all your things be done with charity.","1 Corinthians 16:14"],["The grace of our Lord Jesus Christ be with you.","1 Corinthians 16:23"],["Grace be to you and peace from God our Father, and from the Lord Jesus Christ.","2 Corinthians 1:2"],["But their minds were blinded: for until this day remaineth the same vail untaken away in the reading of the old testament; which vail is done away in Christ.","2 Corinthians 3:14"],["But even unto this day, when Moses is read, the vail is upon their heart.","2 Corinthians 3:15"],["For God, who commanded the light to shine out of darkness, hath shined in our hearts, to give the light of the knowledge of the glory of God in the face of Jesus Christ.","2 Corinthians 4:6"],["For all things are for your sakes, that the abundant grace might through the thanksgiving of many redound to the glory of God.","2 Corinthians 4:15"],["Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.","2 Corinthians 5:17"],["Great is my boldness of speech toward you, great is my glorying of you: I am filled with comfort, I am exceeding joyful in all our tribulation.","2 Corinthians 7:4"],["I speak not by commandment, but by occasion of the forwardness of others, and to prove the sincerity of your love.","2 Corinthians 8:8"],["For ye know the grace of our Lord Jesus Christ, that, though he was rich, yet for your sakes he became poor, that ye through his poverty might be rich.","2 Corinthians 8:9"],["But thanks be to God, which put the same earnest care into the heart of Titus for you.","2 Corinthians 8:16"],["Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.","2 Corinthians 9:7"],["Thanks be unto God for his unspeakable gift.","2 Corinthians 9:15"],["Truly the signs of an apostle were wrought among you in all patience, in signs, and wonders, and mighty deeds.","2 Corinthians 12:12"],["For we are glad, when we are weak, and ye are strong: and this also we wish, even your perfection.","2 Corinthians 13:9"],["Finally, brethren, farewell. Be perfect, be of good comfort, be of one mind, live in peace; and the God of love and peace shall be with you.","2 Corinthians 13:11"],["But the scripture hath concluded all under sin, that the promise by faith of Jesus Christ might be given to them that believe.","Galatians 3:22"],["For ye are all the children of God by faith in Christ Jesus.","Galatians 3:26"],["For we through the Spirit wait for the hope of righteousness by faith.","Galatians 5:5"],["A little leaven leaveneth the whole lump.","Galatians 5:9"],["Meekness, temperance: against such there is no law.","Galatians 5:23"],["Brethren, if a man be overtaken in a fault, ye which are spiritual, restore such an one in the spirit of meekness; considering thyself, lest thou also be tempted.","Galatians 6:1"],["But let every man prove his own work, and then shall he have rejoicing in himself alone, and not in another.","Galatians 6:4"],["Let him that is taught in the word communicate unto him that teacheth in all good things.","Galatians 6:6"],["And let us not be weary in well doing: for in due season we shall reap, if we faint not.","Galatians 6:9"],["Ye see how large a letter I have written unto you with mine own hand.","Galatians 6:11"],["But God forbid that I should glory, save in the cross of our Lord Jesus Christ, by whom the world is crucified unto me, and I unto the world.","Galatians 6:14"],["Grace be to you, and peace, from God our Father, and from the Lord Jesus Christ.","Ephesians 1:2"],["For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:","Ephesians 2:8"],["For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.","Ephesians 2:10"],["But unto every one of us is given grace according to the measure of the gift of Christ.","Ephesians 4:7"],["Let him that stole steal no more: but rather let him labour, working with his hands the thing which is good, that he may have to give to him that needeth.","Ephesians 4:28"],["Let no corrupt communication proceed out of your mouth, but that which is good to the use of edifying, that it may minister grace unto the hearers.","Ephesians 4:29"],["Finally, my brethren, be strong in the Lord, and in the power of his might.","Ephesians 6:10"],["Peace be to the brethren, and love with faith, from God the Father and the Lord Jesus Christ.","Ephesians 6:23"],["Grace be unto you, and peace, from God our Father, and from the Lord Jesus Christ.","Philippians 1:2"],["Fulfil ye my joy, that ye be likeminded, having the same love, being of one accord, of one mind.","Philippians 2:2"],["For it is God which worketh in you both to will and to do of his good pleasure.","Philippians 2:13"],["For the same cause also do ye joy, and rejoice with me.","Philippians 2:18"],["But I trust in the Lord Jesus to send Timotheus shortly unto you, that I also may be of good comfort, when I know your state.","Philippians 2:19"],["For all seek their own, not the things which are Jesus Christ’s.","Philippians 2:21"],["But I trust in the Lord that I also myself shall come shortly.","Philippians 2:24"],["I sent him therefore the more carefully, that, when ye see him again, ye may rejoice, and that I may be the less sorrowful.","Philippians 2:28"],["Brethren, be followers together of me, and mark them which walk so as ye have us for an ensample.","Philippians 3:17"],["Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.","Philippians 4:6"],["And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.","Philippians 4:7"],["Those things, which ye have both learned, and received, and heard, and seen in me, do: and the God of peace shall be with you.","Philippians 4:9"],["But I rejoiced in the Lord greatly, that now at the last your care of me hath flourished again; wherein ye were also careful, but ye lacked opportunity.","Philippians 4:10"],["I can do all things through Christ which strengtheneth me.","Philippians 4:13"],["For though I be absent in the flesh, yet am I with you in the spirit, joying and beholding your order, and the stedfastness of your faith in Christ.","Colossians 2:5"],["Rooted and built up in him, and stablished in the faith, as ye have been taught, abounding therein with thanksgiving.","Colossians 2:7"],["And whatsoever ye do, do it heartily, as to the Lord, and not unto men;","Colossians 3:23"],["Walk in wisdom toward them that are without, redeeming the time.","Colossians 4:5"],["Let your speech be alway with grace, seasoned with salt, that ye may know how ye ought to answer every man.","Colossians 4:6"],["But as we were allowed of God to be put in trust with the gospel, even so we speak; not as pleasing men, but God, which trieth our hearts.","1 Thessalonians 2:4"],["But as touching brotherly love ye need not that I write unto you: for ye yourselves are taught of God to love one another.","1 Thessalonians 4:9"],["For yourselves know perfectly that the day of the Lord so cometh as a thief in the night.","1 Thessalonians 5:2"],["Ye are all the children of light, and the children of the day: we are not of the night, nor of darkness.","1 Thessalonians 5:5"],["But let us, who are of the day, be sober, putting on the breastplate of faith and love; and for an helmet, the hope of salvation.","1 Thessalonians 5:8"],["In every thing give thanks: for this is the will of God in Christ Jesus concerning you.","1 Thessalonians 5:18"],["Prove all things; hold fast that which is good.","1 Thessalonians 5:21"],["Faithful is he that calleth you, who also will do it.","1 Thessalonians 5:24"],["Grace unto you, and peace, from God our Father and the Lord Jesus Christ.","2 Thessalonians 1:2"],["Comfort your hearts, and stablish you in every good word and work.","2 Thessalonians 2:17"],["For we hear that there are some which walk among you disorderly, working not at all, but are busybodies.","2 Thessalonians 3:11"],["For they that have used the office of a deacon well purchase to themselves a good degree, and great boldness in the faith which is in Christ Jesus.","1 Timothy 3:13"],["For bodily exercise profiteth little: but godliness is profitable unto all things, having promise of the life that now is, and of that which is to come.","1 Timothy 4:8"],["Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.","1 Timothy 4:12"],["Neglect not the gift that is in thee, which was given thee by prophecy, with the laying on of the hands of the presbytery.","1 Timothy 4:14"],["Take heed unto thyself, and unto the doctrine; continue in them: for in doing this thou shalt both save thyself, and them that hear thee.","1 Timothy 4:16"],["But if any widow have children or nephews, let them learn first to shew piety at home, and to requite their parents: for that is good and acceptable before God.","1 Timothy 5:4"],["Let the elders that rule well be counted worthy of double honour, especially they who labour in the word and doctrine.","1 Timothy 5:17"],["Lay hands suddenly on no man, neither be partaker of other men’s sins: keep thyself pure.","1 Timothy 5:22"],["Perverse disputings of men of corrupt minds, and destitute of the truth, supposing that gain is godliness: from such withdraw thyself.","1 Timothy 6:5"],["But thou, O man of God, flee these things; and follow after righteousness, godliness, faith, love, patience, meekness.","1 Timothy 6:11"],["Fight the good fight of faith, lay hold on eternal life, whereunto thou art also called, and hast professed a good profession before many witnesses.","1 Timothy 6:12"],["For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.","2 Timothy 1:7"],["Hold fast the form of sound words, which thou hast heard of me, in faith and love which is in Christ Jesus.","2 Timothy 1:13"],["The Lord grant unto him that he may find mercy of the Lord in that day: and in how many things he ministered unto me at Ephesus, thou knowest very well.","2 Timothy 1:18"],["No man that warreth entangleth himself with the affairs of this life; that he may please him who hath chosen him to be a soldier.","2 Timothy 2:4"],["Consider what I say; and the Lord give thee understanding in all things.","2 Timothy 2:7"],["Study to shew thyself approved unto God, a workman that needeth not to be ashamed, rightly dividing the word of truth.","2 Timothy 2:15"],["Ever learning, and never able to come to the knowledge of the truth.","2 Timothy 3:7"],["But watch thou in all things, endure afflictions, do the work of an evangelist, make full proof of thy ministry.","2 Timothy 4:5"],["They profess that they know God; but in works they deny him, being abominable, and disobedient, and unto every good work reprobate.","Titus 1:16"],["But Christ as a son over his own house; whose house are we, if we hold fast the confidence and the rejoicing of the hope firm unto the end.","Hebrews 3:6"],["For if Jesus had given them rest, then would he not afterward have spoken of another day.","Hebrews 4:8"],["For he that is entered into his rest, he also hath ceased from his own works, as God did from his.","Hebrews 4:10"],["Let us labour therefore to enter into that rest, lest any man fall after the same example of unbelief.","Hebrews 4:11"],["For God is not unrighteous to forget your work and labour of love, which ye have shewed toward his name, in that ye have ministered to the saints, and do minister.","Hebrews 6:10"],["For the law made nothing perfect, but the bringing in of a better hope did; by the which we draw nigh unto God.","Hebrews 7:19"],["Cast not away therefore your confidence, which hath great recompence of reward.","Hebrews 10:35"],["For ye have need of patience, that, after ye have done the will of God, ye might receive the promise.","Hebrews 10:36"],["Now faith is the substance of things hoped for, the evidence of things not seen.","Hebrews 11:1"],["Through faith we understand that the worlds were framed by the word of God, so that things which are seen were not made of things which do appear.","Hebrews 11:3"],["But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him.","Hebrews 11:6"],["Let brotherly love continue.","Hebrews 13:1"],["Remember them which have the rule over you, who have spoken unto you the word of God: whose faith follow, considering the end of their conversation.","Hebrews 13:7"],["Jesus Christ the same yesterday, and to day, and for ever.","Hebrews 13:8"],["Pray for us: for we trust we have a good conscience, in all things willing to live honestly.","Hebrews 13:18"],["But let patience have her perfect work, that ye may be perfect and entire, wanting nothing.","James 1:4"],["Blessed is the man that endureth temptation: for when he is tried, he shall receive the crown of life, which the Lord hath promised to them that love him.","James 1:12"],["Every good gift and every perfect gift is from above, and cometh down from the Father of lights, with whom is no variableness, neither shadow of turning.","James 1:17"],["But whoso looketh into the perfect law of liberty, and continueth therein, he being not a forgetful hearer, but a doer of the work, this man shall be blessed in his deed.","James 1:25"],["My brethren, have not the faith of our Lord Jesus Christ, the Lord of glory, with respect of persons.","James 2:1"],["For whosoever shall keep the whole law, and yet offend in one point, he is guilty of all.","James 2:10"],["For he shall have judgment without mercy, that hath shewed no mercy; and mercy rejoiceth against judgment.","James 2:13"],["Behold, we put bits in the horses’ mouths, that they may obey us; and we turn about their whole body.","James 3:3"],["Humble yourselves in the sight of the Lord, and he shall lift you up.","James 4:10"],["Ye have lived in pleasure on the earth, and been wanton; ye have nourished your hearts, as in a day of slaughter.","James 5:5"],["Take, my brethren, the prophets, who have spoken in the name of the Lord, for an example of suffering affliction, and of patience.","James 5:10"],["Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much.","James 5:16"],["But let it be the hidden man of the heart, in that which is not corruptible, even the ornament of a meek and quiet spirit, which is in the sight of God of great price.","1 Peter 3:4"],["But rejoice, inasmuch as ye are partakers of Christ’s sufferings; that, when his glory shall be revealed, ye may be glad also with exceeding joy.","1 Peter 4:13"],["By Silvanus, a faithful brother unto you, as I suppose, I have written briefly, exhorting, and testifying that this is the true grace of God wherein ye stand.","1 Peter 5:12"],["For if these things be in you, and abound, they make you that ye shall neither be barren nor unfruitful in the knowledge of our Lord Jesus Christ.","2 Peter 1:8"],["For it had been better for them not to have known the way of righteousness, than, after they have known it, to turn from the holy commandment delivered unto them.","2 Peter 2:21"],["But grow in grace, and in the knowledge of our Lord and Saviour Jesus Christ. To him be glory both now and for ever. Amen.","2 Peter 3:18"],["He that saith, I know him, and keepeth not his commandments, is a liar, and the truth is not in him.","1 John 2:4"],["He that saith he abideth in him ought himself also so to walk, even as he walked.","1 John 2:6"],["He that loveth his brother abideth in the light, and there is none occasion of stumbling in him.","1 John 2:10"],["I have not written unto you because ye know not the truth, but because ye know it, and that no lie is of the truth.","1 John 2:21"],["Little children, let no man deceive you: he that doeth righteousness is righteous, even as he is righteous.","1 John 3:7"],["My little children, let us not love in word, neither in tongue; but in deed and in truth.","1 John 3:18"],["For if our heart condemn us, God is greater than our heart, and knoweth all things.","1 John 3:20"],["Beloved, if our heart condemn us not, then have we confidence toward God.","1 John 3:21"],["Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.","1 John 4:7"],["He that loveth not knoweth not God; for God is love.","1 John 4:8"],["Beloved, if God so loved us, we ought also to love one another.","1 John 4:11"],["We love him, because he first loved us.","1 John 4:19"],["By this we know that we love the children of God, when we love God, and keep his commandments.","1 John 5:2"],["For this is the love of God, that we keep his commandments: and his commandments are not grievous.","1 John 5:3"],["For whatsoever is born of God overcometh the world: and this is the victory that overcometh the world, even our faith.","1 John 5:4"],["He that hath the Son hath life; and he that hath not the Son of God hath not life.","1 John 5:12"],["Little children, keep yourselves from idols. Amen.","1 John 5:21"],["Grace be with you, mercy, and peace, from God the Father, and from the Lord Jesus Christ, the Son of the Father, in truth and love.","2 John 1:3"],["I rejoiced greatly that I found of thy children walking in truth, as we have received a commandment from the Father.","2 John 1:4"],["Look to yourselves, that we lose not those things which we have wrought, but that we receive a full reward.","2 John 1:8"],["Mercy unto you, and peace, and love, be multiplied.","Jude 1:2"],["Keep yourselves in the love of God, looking for the mercy of our Lord Jesus Christ unto eternal life.","Jude 1:21"],["Blessed is he that readeth, and they that hear the words of this prophecy, and keep those things which are written therein: for the time is at hand.","Revelation 1:3"],["I know thy works, and charity, and service, and faith, and thy patience, and thy works; and the last to be more than the first.","Revelation 2:19"],["Behold, I stand at the door, and knock: if any man hear my voice, and open the door, I will come in to him, and will sup with him, and he with me.","Revelation 3:20"],["Reward her even as she rewarded you, and double unto her double according to her works: in the cup which she hath filled fill to her double.","Revelation 18:6"],["Let us be glad and rejoice, and give honour to him: for the marriage of the Lamb is come, and his wife hath made herself ready.","Revelation 19:7"]]/*END-VERSES*/   // [text, reference]
const VERSE_ORDER = (() => {
  const r = rng(0xB1B1E), a = VERSES.map((_, i) => i)
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t }
  return a
})()
function verseIndex(date) {
  const n = VERSES.length
  if (CFG.verseIndex != null) return ((Number(CFG.verseIndex) % n) + n) % n          // preview / testing only
  const hr = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()) / 3600000)
  return VERSE_ORDER[((hr % n) + n) % n]
}
const thisHoursVerse = (date) => VERSES[verseIndex(date || skyDate())]
// Futura Medium advance widths (1/1000 em, ASCII 32-126) for line breaking; the 1.08 margin keeps a line from re-wrapping on the phone
const FUT_W = [300,318,486,630,597,819,706,294,323,323,592,639,314,215,309,553,625,474,604,576,629,597,614,556,579,614,309,355,640,620,640,585,770,690,601,691,701,571,521,791,744,275,276,619,481,843,783,803,578,820,595,579,504,656,690,1020,608,601,575,325,528,325,510,513,375,504,589,484,589,539,309,586,543,267,259,495,246,796,545,564,589,589,371,424,271,545,475,713,465,473,485,346,306,346,575]
function futW(str, fz, bold) {
  let w = 0
  for (const ch of str) { const c = ch.charCodeAt(0); w += c >= 32 && c < 127 ? FUT_W[c - 32] : ch === "—" ? 910 : ch === "\u200A" ? 90 : 560 }
  return w / 1000 * (bold ? 1.16 : 1.08) * fz
}
function wrapWords(str, fz, maxW) {
  const out = [""]
  for (const w of str.split(" ")) {
    const cur = out[out.length - 1], t = cur ? cur + " " + w : w
    if (!cur || futW(t, fz) <= maxW) out[out.length - 1] = t
    else out.push(w)
  }
  return out
}
// v13.4 fit-to-box verse: uses the whole area under the tiles, edge to edge (tiny ✦ in the glass margin), biggest size that fits in up to 5 lines
function verseFill(ctx, x0, x1, y0, y1, u, hex, a, hot, fmax = 13, floor = 7, maxL = 5, bottom = false) {
  const [v, ref] = thisHoursVerse(), tx = x0, mw = x1 - tx, rz = 6 * u, rgap = 2.6 * u, LH = 1.3
  const fits = (z) => { const L = wrapWords(v, z * u, mw); return L.length <= maxL && L.length * z * LH * u + rgap + rz <= y1 - y0 ? L : null }
  let fz = floor, lines = null
  for (let k = 0; fmax - k * 0.2 > floor + 0.05; k++) { const z = fmax - k * 0.2; if ((lines = fits(z))) { fz = z; break } }
  if (!lines) { for (let z = floor; z >= 5.6 - 0.001; z -= 0.2) { if ((lines = fits(z))) { fz = z; break } } }
  if (!lines) { fz = 5.6; lines = wrapWords(v, fz * u, mw) }
  const f = fz * u, lh = f * LH, tot = lines.length * lh + rgap + rz
  let y = bottom ? y1 - tot + lh / 2 : (y0 + y1) / 2 - tot / 2 + lh / 2
  const sx = x0 - 5.2 * u, s2 = 1.9 * u
  seg(ctx, sx - s2, y, sx + s2, y, hot || SILVER, 0.55, 0.35 * u); seg(ctx, sx, y - s2, sx, y + s2, hot || SILVER, 0.55, 0.35 * u); dot(ctx, sx, y, 0.6 * u, "#FFFFFF", 0.8)
  lines.forEach((l, i) => text(ctx, l, FUT(false, f), f, hex, a, tx, y + i * lh, "left", mw + 30 * u))
  text(ctx, "— " + ref, FUT(false, rz), rz, hot || SILVER, 0.7, tx, y + (lines.length - 1) * lh + lh / 2 + rgap + rz / 2, "left", mw + 30 * u)
  if (globalThis.__VF) globalThis.__VF.push([fz, lines.length])
}
// the verse block: largest size (fmax → 5pt, ≥4.6 on the narrowest phones) at which the verse fits maxLines, then the reference on its own dimmer line; centred in y0..y1
function verseBlock(ctx, x0, x1, y0, y1, u, hex, a, hot, maxLines = 3, fmax = 7.2, floor = 6.2) {
  // v13.2: biggest size from fmax down to the floor (6.2pt) on ≤3 lines, or 4 lines when that is ≥0.8pt bigger; reference line 5.4
  const [v, ref] = thisHoursVerse(), tx = x0 + 8 * u, mw = x1 - tx, rz = (floor >= 6 ? 5.4 : 4.9) * u, rgap = 3.4 * u
  const fits = (fz, n) => { const L = wrapWords(v, fz * u, mw); return L.length <= n && L.length * fz * 1.36 * u + rgap + rz <= y1 - y0 ? L : null }
  const ZS = []; for (let k = 0; fmax - k * 0.2 > floor + 0.05; k++) ZS.push(fmax - k * 0.2); ZS.push(floor)
  const best = (n) => { for (const z of ZS) { const L = fits(z, n); if (L) return [z, L] } return null }
  const b3 = best(maxLines), b4 = best(maxLines + 1)                  // one extra line only when it buys ≥0.8pt (or ≤maxLines can't fit)
  let [fz, lines] = b3 && !(b4 && b4[0] - b3[0] >= 0.8) ? b3 : b4 || [floor, wrapWords(v, floor * u, mw)]
  if (!b3 && !b4) for (let z = floor - 0.2; z >= 5.6 - 0.001; z -= 0.2) { const L = fits(z, maxLines + 1); if (L) { fz = z; lines = L; break } }   // narrowest phones only (e.g. Isaiah 40:31 on a mini)
  const f = fz * u, lh = f * 1.36, tot = lines.length * lh + rgap + rz
  let y = (y0 + y1) / 2 - tot / 2 + lh / 2
  const sx = x0 + 2.2 * u
  seg(ctx, sx - 2.6 * u, y, sx + 2.6 * u, y, hot || SILVER, 0.55, 0.4 * u); seg(ctx, sx, y - 2.6 * u, sx, y + 2.6 * u, hot || SILVER, 0.55, 0.4 * u); dot(ctx, sx, y, 0.8 * u, "#FFFFFF", 0.8)
  lines.forEach((l, i) => text(ctx, l, FUT(false, f), f, hex, a, tx, y + i * lh, "left", mw + 30 * u))
  text(ctx, "— " + ref, FUT(false, rz), rz, hot || SILVER, 0.62, tx, y + (lines.length - 1) * lh + lh / 2 + rgap + rz / 2, "left", mw + 30 * u)
}
// streaks in one tight line: 🔥7 Train · 🔥8 Cook (flame + tabular number exactly as the v11 cells, k = size vs the big cells)
function streakParts(s, u, k) {
  return [["train", s.exercise, "Train"], ["cook", s.cooking, "Cook"]].map(([kind, v, label]) => {
    const T = flameTier(v), str = String(v), capH = NUM.cap * NUM.fz * u * k, vis = capH * (1 + 0.025 * Math.min(T, 14)), h = vis / FL_TOP(T), fw = FL_W(T) * h
    return { kind, v, label, T, str, vis, h, fw, gp: 2.4 * u * k, nw: numInkW(str, u * k) }
  })
}
function flameNum(ctx, p, x, yc, u, k) {            // draws one flame+number group with its left ink edge at x; returns its width
  fire(ctx, x + p.fw / 2, yc + p.vis / 2, p.h, p.kind, p.T, (p.v * 7 + (p.kind === "train" ? 1 : 2)) + fireSeed(), p.v > 0)
  digitsAt(ctx, p.str, p.T >= 18 ? 8 : p.T >= 10 ? 6 : p.T >= 4 ? 3 : 0, x + p.fw + p.gp, yc, u * k)
  return p.fw + p.gp + p.nw
}
function streakInline(ctx, s, cx, yc, u, k = 0.62) {
  const P = streakParts(s, u, k), lz = 5.4 * u, lg = 2.8 * u, sep = 9 * u
  const wOf = (p) => p.fw + p.gp + p.nw + lg + futW(p.label, lz)
  let x = cx - (wOf(P[0]) + sep + wOf(P[1])) / 2
  P.forEach((p, i) => {
    x += flameNum(ctx, p, x, yc, u, k) + lg
    text(ctx, p.label, FUT(false, lz), lz, SILVER, 0.62, x, yc + 0.245 * lz, "left", 40 * u); x += futW(p.label, lz)
    if (!i) { dot(ctx, x + sep / 2, yc, 0.75 * u, SILVER, 0.45); x += sep }
  })
}
// slim panel header: TITLE ··········· n/N DONE
function panelHead(ctx, x0, x1, y, u, title, hex, n, N, nHex, nA, tail) {
  text(ctx, tr(title), FUT(true, 6.8 * u), 6.8 * u, hex, 1, x0, y, "left", 120 * u)
  const tw = tail ? futW(tr(tail), 4.6 * u) + 3.5 * u : 0
  if (tail) textR(ctx, tr(tail), FUT(false, 4.6 * u), 4.6 * u, SILVER, 0.55, x1, y + 0.6 * u, 30 * u)
  textR(ctx, `${n}/${N}`, FUT(true, 8.6 * u), 8.6 * u, nHex, nA, x1 - tw, y - 0.3 * u, 40 * u)
}
function slimBar(ctx, x0, x1, y, u, done, pal) {
  const g = 2.4 * u, h = 1.5 * u, w = (x1 - x0 - g) / 2
  done.forEach((d, i) => {
    const x = x0 + i * (w + g)
    if (d) { glowRR(ctx, x, y - h / 2, w, h, h / 2, pal.glow, 0.45, 1.6 * u); fillPath(ctx, rrPath(x, y - h / 2, w, h, h / 2), pal.acc, 0.95) }
    else fillPath(ctx, rrPath(x, y - h / 2, w, h, h / 2), SILVER, 0.14)
  })
}
const PANEL_FRAME = String(CFG.panelFrame || "soft").toUpperCase()   // v13.5 right panel frame: "soft" haze (default) · "faint" fill, no border · "glass" = v13.4 framed box
const PANEL = String(CFG.panel || "B").toUpperCase()                 // v13 compact right panel: "A" tight list · "B" side-by-side tiles
const QLONG = CFG.questLabels === "long"                             // "Workout" / "Home cook" instead of "Train" / "Cook"
const qName = (i) => QLONG ? ["Workout", "Home cook"][i] : ["Train", "Cook"][i]
function panelQuestA(ctx, W, H, u) {
  const { a: done, n } = questState(), pal = QPAL(n), s = LIVE.streaks
  const x0 = 198 * u, x1 = W - 24 * u
  panelHead(ctx, x0, x1, 23 * u, u, "today's quest", pal.acc, n, 2, n ? pal.name : SILVER, n ? 1 : 0.55, "done")
  slimBar(ctx, x0, x1, 32 * u, u, done, pal)
  const P = s ? streakParts(s, u, 0.66) : null
  QUEST_ROWS.forEach(([cap, label, kind, yes, no], i) => {
    const y = (46 + i * 17) * u, d = done[i]
    questBadge(ctx, kind, x0 + 6.5 * u, y, 6.5 * u, d, pal, u)
    text(ctx, qName(i), FUT(false, 8 * u), 8 * u, d ? pal.name : SILVER, d ? 1 : 0.6, x0 + 17 * u, y + 0.245 * 8 * u, "left", 70 * u)
    let xr = x1
    if (P) { const p = P[i], w = p.fw + p.gp + p.nw; flameNum(ctx, p, x1 - w, y, u, 0.66); xr = x1 - w - 6 * u }
    textR(ctx, tr(d ? yes : no), FUT(true, 4.6 * u), 4.6 * u, d ? pal.acc : SILVER, d ? 0.95 : 0.4, xr, y + 0.245 * 4.6 * u, 50 * u)
  })
  seg(ctx, x0, 76 * u, x1, 76 * u, "#FFFFFF", 0.07, 0.5)
  verseBlock(ctx, x0, x1, 80 * u, 160 * u, u, SILVER, 0.86, pal.acc, 3, 9.2)
}
// v13.6 quest tile: no status words, just [icon] Label [flame N] as one centred row, bigger. Done = the tile lights up, not done = dim.
// FITNESS_CONFIG.questTiles: 1 "glow" (default: lit warm fill + soft halo + bright border) · 2 "underline" (bright label + glowing accent bar) · 3 "tint" (soft tint, bold label, no border)
const QTILE = [1, 2, 3].includes(Number(CFG.questTiles)) ? Number(CFG.questTiles) : 1
const QGOLD = CFG.questGold !== false                 // v13.7: any done tile is gold-lit (false = v13.6 teal at 1/2, gold at 2/2)
const QFLAME_K = 1.18                                 // v13.7: tile flame + number scale (v13.6 was 0.8)
const QB_TOP_U = 17                                   // v13.7 panel B header row, in u (v13.6: 23u): lifted so the top clearance matches the bottom
const QB_BOT_U = 9.4                                  // gap from the widget bottom to the verse reference line's centre, in u
// v13.9 stacked tiles (FITNESS_CONFIG.questStack), built on one typographic scale so label, flame and number read as one unit:
// label cap c · number cap = c x R · flame = number x F (the flame leads, the number sits on the flame's base line) · gaps + padding from c
// "A" icon + label over flame + number, perfect-fourth scale R = 1.333² ≈ 1.78 (default) · "B" label only, golden R = 1.618 with the tallest flame
// "C" icon left of a 2-line stack, golden R = 1.618 · "row" = the v13.8 single row
// v13.10: "D" (default) label alone on line 1, line 2 = [icon] [flame] [number] on A's scale, icon ink ≈ 0.75 x the flame height · "E" same, icon ink ≈ the flame height
// v13.14: "P" (default) = J's structure (word + icon left-aligned in the left column, number over flame centred in the right one, grid centred) with M's optical polish below
// v13.14: "M" polished grid: each column centred (word over icon, number over flame), number cap 1.25 x the word's, dumbbell ink 0.9 x the flame,
//   icon + flame on one OPTICAL centre line (flame mass sits low, so its line is 0.42 up from its base; the pot is centred on its body, steam ignored),
//   the ink block centred top-to-bottom; "L" columns on the tile's thirds · "M" three equal gutters · "N" = M + a hairline between the columns
// v13.13: "J" 2x2 grid: [word][number] on one baseline, [icon][flame] on one centre line; icon ink left-aligned under the word, flame centred under the number; grid centred in the tile · "K" same, number column on the tile's inner right edge
// v13.11: "F" [icon] | word / flame + number, the column left-aligned (flame's left edge under the word's first letter), whole group centred · "G" same, column centred
const QSTACK = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "P"].includes(String(CFG.questStack || "P").toUpperCase()) ? String(CFG.questStack || "P").toUpperCase() : "ROW"
const QCAP = 0.7                                                       // Futura cap height / font size
const QSK = (() => {
  const V = { A: { lz: 8.4, R: 1.778, F: 1.5, icon: 1.75 }, B: { lz: 9.2, R: 1.618, F: 1.618, icon: 0 }, C: { lz: 8, R: 1.618, F: 1.5, icon: 0 }, D: { lz: 8.4, R: 1.778, F: 1.5, icon: 0, i2: 1.1 }, E: { lz: 8.4, R: 1.778, F: 1.5, icon: 0, i2: 1.3 }, F: { lz: 8.4, R: 1.778, F: 1.5, icon: 0, side: 0.7, left: 1 }, G: { lz: 8.4, R: 1.778, F: 1.5, icon: 0, side: 0.7, left: 0 }, H: { lz: 8.4, R: 1.778, F: 1.5, icon: 0, mode: "H", i2: 1.1 }, I: { lz: 8.4, R: 1.778, F: 1.5, icon: 0, mode: "I", i2: 1.1 }, J: { lz: 8.4, R: 1.3, F: 2.05, icon: 0, grid: "J", ib: 1.37, gc: 1.6 }, K: { lz: 8.4, R: 1.3, F: 2.05, icon: 0, grid: "K", ib: 1.37, gc: 1.6 }, L: { lz: 8.4, R: 1.25, F: 2.133, icon: 0, g2: "L", ib: 1.45 }, M: { lz: 8.4, R: 1.25, F: 2.133, icon: 0, g2: "M", ib: 1.45 }, N: { lz: 8.4, R: 1.25, F: 2.133, icon: 0, g2: "N", ib: 1.45 }, P: { lz: 8.4, R: 1.25, F: 2.133, icon: 0, g2: "P", ib: 1.45, gc: 1.6 } }[QSTACK]
  if (!V) return { k: QFLAME_K, th: 30 }
  const c = QCAP * V.lz, nc = c * V.R, fv = nc * V.F, gap = 0.6 * c, pad = 1.05 * c, fg = 0.3 * nc   // all in u
  const stack = c + gap + fv
  return { ...V, c, nc, fv, gap, pad, fg, stack, k: nc / (NUM.cap * NUM.fz), th: Math.round((stack + 2 * pad) * 2) / 2 }
})()
// v13.14 questFont (2x2 grids): F = Futura (as v13.13) · R = SF Rounded (default) · V = Avenir Next · U = SF semibold, tracked UPPERCASE · digits stay tabular (fixed slots)
const QFONT = ["F", "R", "V", "U"].includes(String(CFG.questFont || "R").toUpperCase()) ? String(CFG.questFont || "R").toUpperCase() : "R"
const QFONTS = {
  F: null,
  R: { lab: (b, z) => b ? Font.boldRoundedSystemFont(z) : Font.semiboldRoundedSystemFont(z), num: (b, z) => b ? Font.heavyRoundedSystemFont(z) : Font.boldRoundedSystemFont(z), wf: 0.93, off: 0.02, slot: 0.6, ink: 0.5, up: 0, zk: 1 },
  V: { lab: (b, z) => new Font(b ? "AvenirNext-DemiBold" : "AvenirNext-Medium", z), num: (b, z) => new Font(b ? "AvenirNext-Heavy" : "AvenirNext-Bold", z), wf: 0.9, off: -0.026, slot: 0.6, ink: 0.5, up: 0, zk: 1 },
  U: { lab: (b, z) => b ? Font.semiboldSystemFont(z) : Font.mediumSystemFont(z), num: (b, z) => b ? Font.heavySystemFont(z) : Font.boldSystemFont(z), wf: 1.0, off: 0.02, slot: 0.62, ink: 0.52, up: 1, zk: 0.78 },
}
// v13.14 questIcon (2x2 grids): A = v13.13 dumbbell + pot · B = kettlebell + chef hat · R = refined line icons, one stroke weight, round caps (default) · S = solid glyphs with an inner highlight
const QICON = ["A", "B", "R", "S"].includes(String(CFG.questIcon || "S").toUpperCase()) ? String(CFG.questIcon || "S").toUpperCase() : "S"   // v13.15: solid glyphs by default
let __QNF = null, __QART2 = null
const QICON2 = () => __QART2 || QART
const labW = (label, lz, bold) => { const Q = __QNF; if (!Q) return futW(label, lz, bold); const z = lz * Q.zk; return futW(Q.up ? track(label.toUpperCase()) : label, z, bold) * Q.wf }
const FLINK = [0.23, 0.43, 0.45, 0.45, 0.46, 0.56, 0.46, 0.56, 0.56, 0.56, 0.56, 0.56, 0.58, 0.58, 0.58, 0.58, 0.58, 0.61, 0.61]   // v13.11: measured half ink width of the lit flame per tier (x flame box height) + a hair of margin
const FLINKTOP = [0.83, 1.2, 1.2, 1.23, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.2, 1.25, 1.52, 1.55]   // v13.11: measured top of the lit flame (x box height), so F/G flames stay under the word
function questStacked(ctx, x, y, w, h, u, kind, label, p, d, pal) {
  const S = QSK, cx = x + w / 2, cy = y + h / 2, bold = d
  const lab = (lz, lx, cc) => {                                         // label with its cap centre on cc
    const Q = __QNF
    if (Q) {                                                            // v13.14 questFont: same baseline as the nominal Futura label (cc + cap/2)
      const z = lz * Q.zk, str = Q.up ? track(label.toUpperCase()) : label, yb = cc + QCAP * lz / 2 - QCAP * z / 2 + Q.off * z, lw = labW(label, lz, bold) + 6 * u
      if (d) text(ctx, str, Q.lab(bold, z), z, pal.glow, 0.28, lx, yb + 0.25 * u, "left", lw)
      text(ctx, str, Q.lab(bold, z), z, d ? pal.name : SILVER, d ? 1 : 0.5, lx, yb, "left", lw)
      return
    }
    const lw = futW(label, lz, bold) + 6 * u
    if (d) text(ctx, label, FUT(bold, lz), lz, pal.glow, 0.28, lx, cc + 0.245 * lz + 0.25 * u, "left", lw)
    text(ctx, label, FUT(bold, lz), lz, d ? pal.name : SILVER, d ? 1 : 0.5, lx, cc + 0.245 * lz, "left", lw)
  }
  // flame + number as one group: shared base line, flame S.F x the number's cap, gap 0.3 x cap
  const T = p ? flameTier(p.v) : 0, fvis = S.fv * u, fh = fvis / ((S.side || S.mode || S.grid || S.g2) && p && p.v > 0 ? FLINKTOP[Math.min(18, T)] : FL_TOP(T)), ffw = (S.side || S.mode || S.grid || S.g2 ? 2 * FLINK[Math.min(18, T)] : FL_W(T)) * fh, ncap = S.nc * u, fg = S.fg * u   // v13.11 F/G: measured flame ink width, so its left edge lines up and it never touches the number
  const nw = p ? numInkW(p.str, u * S.k) : 0, gw = p ? ffw + fg + nw : 0
  const group = (gx, base) => {                                          // gx = left ink edge, base = shared base line
    const fcx = gx + ffw / 2, gyc = base - fvis / 2
    if (d) for (let k = 0; k < 5; k++) dot(ctx, fcx, gyc, fh * (0.8 - k * 0.13), pal.glow, 0.05)
    __EMBER_TOP = base - fvis - 0.4 * S.gap * u
    try { fire(ctx, fcx, base, fh, p.kind, T, (p.v * 7 + (p.kind === "train" ? 1 : 2)) + fireSeed(), p.v > 0) } finally { __EMBER_TOP = null }
    digitsAt(ctx, p.str, T >= 18 ? 8 : T >= 10 ? 6 : T >= 4 ? 3 : 0, gx + ffw + fg, base - ncap / 2, u * S.k)
    if (!d) { const mx = gx + gw / 2, mr = Math.max(gw, fvis) * 0.62; for (let k = 0; k < 5; k++) dot(ctx, mx, gyc, mr * (1 - k * 0.12), "#05070C", 0.12) }   // not done: sits back
  }
  let lz = S.lz * u
  const top = cy - S.stack * u / 2, c1 = top + S.c * u / 2, base = top + S.stack * u
  const tilesQ = __QSL || [{ label, p, bold }]
  const gwQ = (q) => { if (!q) return 0; const t = Math.min(18, flameTier(q.v)), hh = fvis / (q.v > 0 ? FLINKTOP[t] : FL_TOP(t)); return 2 * FLINK[t] * hh + fg + numInkW(q.str, u * S.k) }
  const icon = (icx, icy, sz) => {                                     // v13.12: one icon box for both kinds; the pot + shorter steam fit the dumbbell's box
    if (d) for (let k = 0; k < 6; k++) dot(ctx, icx, icy, sz * (1.0 - k * 0.12), pal.glow, 0.045)
    if (kind === "cook" && QICON2() === "A") { __POT_FIT = S.g2 ? 2 : 1; try { questArt(ctx, kind, icx, icy + 0.015 * sz, sz * 0.9, d, pal, u) } finally { __POT_FIT = 0 } }
    else questArt(ctx, kind, icx, icy, sz, d, pal, u)
  }
  if (S.g2) {                                                           // v13.14 L/M/N: the polished grid, geometry from BOTH tiles
    const c = S.c * u, nk = u * S.k, ncap2 = S.nc * u, ib = S.ib * fvis, iInk = 0.84 * ib, g = S.gap * u
    const flWq = (q) => { if (!q) return 0; const t = Math.min(18, flameTier(q.v)), hh = fvis / (q.v > 0 ? FLINKTOP[t] : FL_TOP(t)); return 2 * FLINK[t] * hh }
    const Wl = Math.max(iInk, ...tilesQ.map((q) => labW(q.label, lz, q.bold)))
    const Wr = Math.max(...tilesQ.map((q) => q.p ? Math.max(numInkW(q.p.str, nk), flWq(q.p)) : 0))
    let lc, rc
    if (S.g2 === "P") { const L0 = cx - (Wl + S.gc * c + Wr) / 2; lc = L0 + Wl / 2; rc = L0 + Wl + S.gc * c + Wr / 2 }
    else if (S.g2 === "L") { lc = x + w / 3; rc = x + 2 * w / 3 }
    else { const gut = (w - Wl - Wr) / 3; lc = x + gut + Wl / 2; rc = x + w - gut - Wr / 2 }
    const wx = S.g2 === "P" ? lc - Wl / 2 : lc - labW(label, lz, bold) / 2      // P: word + icon ink left-aligned to the column
    if (!p) { lab(lz, wx, cy); return }
    const OPT = 0.42, up = (1 - OPT) * fvis, dn = Math.max(OPT * fvis, 0.31 * ib)   // optical extents of row 2 around its centre line
    const Hb = ncap2 + g + up + dn, bl = cy - Hb / 2 + ncap2, mid = bl + g + up, fb = mid + OPT * fvis
    lab(lz, wx, bl - c / 2)
    const icx = S.g2 === "P" ? wx + iInk / 2 : lc
    icon(icx, kind === "cook" && QICON2() === "A" ? mid - 0.089 * ib : mid, ib)   // pot A: its body (not the steam) on the line; R/S/B are drawn body-centred
    if (globalThis.__QG2) globalThis.__QG2.push({ kind, tx: x, wx, icx, rc, bl, mid, fb })
    const nw = numInkW(p.str, nk)
    if (d) for (let k = 0; k < 5; k++) dot(ctx, rc, mid, fh * (0.8 - k * 0.13), pal.glow, 0.05)
    __EMBER_TOP = fb - fvis - 0.4 * g
    try { fire(ctx, rc, fb, fh, p.kind, T, (p.v * 7 + (p.kind === "train" ? 1 : 2)) + fireSeed(), p.v > 0) } finally { __EMBER_TOP = null }
    digitsAt(ctx, p.str, T >= 18 ? 8 : T >= 10 ? 6 : T >= 4 ? 3 : 0, rc - nw / 2, bl - ncap2 / 2, nk)
    if (!d) { const mr = Math.max(Wr, fvis + ncap2) * 0.62, my = (bl - ncap2 + fb) / 2; for (let k = 0; k < 5; k++) dot(ctx, rc, my, mr * (1 - k * 0.12), "#05070C", 0.12) }
    if (S.g2 === "N") { const hx = (lc + Wl / 2 + rc - Wr / 2) / 2; seg(ctx, hx, bl - ncap2 + 0.5 * u, hx, mid + dn - 0.5 * u, d ? pal.glow : "#FFFFFF", d ? 0.22 : 0.08, 0.5 * u) }
    return
  }
  if (S.grid) {                                                         // v13.13 J/K: 2x2 grid, geometry from BOTH tiles
    const c = S.c * u, nk = u * S.k, ncapJ = S.nc * u, ib = S.ib * fvis, iInk = 0.84 * ib, gc = S.gc * c
    const flWq = (q) => { if (!q) return 0; const t = Math.min(18, flameTier(q.v)), hh = fvis / (q.v > 0 ? FLINKTOP[t] : FL_TOP(t)); return 2 * FLINK[t] * hh }
    const Wl = Math.max(iInk, ...tilesQ.map((q) => labW(q.label, lz, q.bold)))
    const Wr = Math.max(...tilesQ.map((q) => q.p ? Math.max(numInkW(q.p.str, nk), flWq(q.p)) : 0))
    const L = S.grid === "K" ? x + S.pad * u : cx - (Wl + gc + Wr) / 2
    const rc = S.grid === "K" ? x + w - S.pad * u - Wr / 2 : L + Wl + gc + Wr / 2   // right column centre
    const cc = p ? c1 : cy, bl = cc + c / 2, mid = base - fvis / 2
    lab(lz, L, cc)
    if (!p) return
    icon(L + ib / 2 - (ib - iInk) / 2, mid, ib)
    const nw = numInkW(p.str, nk), fx = rc
    if (d) for (let k = 0; k < 5; k++) dot(ctx, fx, mid, fh * (0.8 - k * 0.13), pal.glow, 0.05)
    __EMBER_TOP = base - fvis - 0.4 * S.gap * u
    try { fire(ctx, fx, base, fh, p.kind, T, (p.v * 7 + (p.kind === "train" ? 1 : 2)) + fireSeed(), p.v > 0) } finally { __EMBER_TOP = null }
    digitsAt(ctx, p.str, T >= 18 ? 8 : T >= 10 ? 6 : T >= 4 ? 3 : 0, rc - nw / 2, bl - ncapJ / 2, nk)
    if (!d) { const mr = Math.max(Wr, fvis + ncapJ) * 0.62, my = (bl - ncapJ + base) / 2; for (let k = 0; k < 5; k++) dot(ctx, rc, my, mr * (1 - k * 0.12), "#05070C", 0.12) }   // not done: sits back
    return
  }
  if (S.mode) {                                                         // v13.12 H: word centred / [icon][flame][number] centred · I: both left on the tile's inner padding
    const i2 = S.i2 * fvis, gi = 0.5 * ncap, gwm = Math.max(...tilesQ.map((q) => gwQ(q.p))), rw = i2 + gi + gwm
    const lx = S.mode === "H" ? cx - futW(label, lz, bold) / 2 : x + S.pad * u
    lab(lz, lx, p ? c1 : cy)
    if (!p) return
    const rx = S.mode === "H" ? cx - rw / 2 : x + S.pad * u
    icon(rx + i2 / 2, base - fvis / 2, i2)
    group(rx + i2 + gi, base)
    return
  }
  if (S.side) {                                                         // v13.11 F/G: [icon] | word / flame + number
    let iw = S.side * S.stack * u                                       // v13.12: sized from BOTH tiles (__QSL) so Train and Cook get identical geometry
    const tiles = tilesQ, gwOf = gwQ
    const g = 0.9 * S.c * u, room = w - 2 * S.pad * u, cwOf = () => Math.max(...tiles.map((q) => Math.max(futW(q.label, lz, q.bold), gwOf(q.p))))
    while (iw + g + cwOf() > room && iw > 0.6 * S.stack * u) iw -= 0.2 * u
    while (lz > 6.6 * u && iw + g + cwOf() > room) lz -= 0.2 * u
    const cw = cwOf(), x0 = cx - (iw + g + cw) / 2, colX = x0 + iw + g, ic = p ? top + S.stack * u / 2 : cy
    icon(x0 + iw / 2, ic, iw)
    const lw = futW(label, lz, bold)
    lab(lz, S.left ? colX : colX + (cw - lw) / 2, p ? c1 : cy)
    if (p) group(S.left ? colX : colX + (cw - gw) / 2, base)
    return
  }
  if (QSTACK === "C") {                                                 // [icon] | label / flame + number
    const iw = S.stack * u * 0.92, g = 1.2 * S.c * u
    while (lz > 6.6 * u && iw + g + Math.max(futW(label, lz, bold), gw) > w - 2 * S.pad * u) lz -= 0.2 * u
    const cw = Math.max(futW(label, lz, bold), gw), x0 = cx - (iw + g + cw) / 2, sx = x0 + iw + g + cw / 2
    if (d) for (let k = 0; k < 6; k++) dot(ctx, x0 + iw / 2, cy, iw * (1.05 - k * 0.12), pal.glow, 0.045)
    questArt(ctx, kind, x0 + iw / 2, cy, iw, d, pal, u)
    lab(lz, sx - futW(label, lz, bold) / 2, p ? c1 : cy)
    if (p) group(sx - gw / 2, base)
    return
  }
  const iw = S.icon * S.c * u, g1 = iw ? 0.45 * S.c * u : 0
  while (lz > 7 * u && iw + g1 + futW(label, lz, bold) > w - 2 * S.pad * u) lz -= 0.2 * u
  let lx = cx - (iw + g1 + futW(label, lz, bold)) / 2
  const l1 = p ? c1 : cy
  if (iw) {
    if (d) for (let k = 0; k < 6; k++) dot(ctx, lx + iw / 2, l1, iw * (1.05 - k * 0.12), pal.glow, 0.045)
    questArt(ctx, kind, lx + iw / 2, l1, iw, d, pal, u); lx += iw + g1
  }
  lab(lz, lx, l1)
  if (p && S.i2) {                                                      // v13.10 D/E: [icon] gap [flame] gap [number], one centred row, icon centred on the flame
    const i2 = S.i2 * fvis, gi = 0.5 * ncap, rw = i2 + gi + gw, rx = cx - rw / 2, ic = base - fvis / 2   // icon-to-flame gap 0.5 x the number's cap
    if (d) for (let k = 0; k < 6; k++) dot(ctx, rx + i2 / 2, ic, i2 * (0.95 - k * 0.11), pal.glow, 0.04)
    questArt(ctx, kind, rx + i2 / 2, ic, i2, d, pal, u)
    group(rx + i2 + gi, base)
  } else if (p) group(cx - gw / 2, base)
}
function questTile(ctx, x, y, w, h, u, kind, label, p, d, pal) {
  const cy = y + h / 2, rr = 8 * u, S = QTILE
  if (d && S === 1 && QGLOW !== "G") { galGlow(ctx, x, y, w, h, rr, u, kind, QGLOW, __QN >= 2); pal = Object.assign({}, pal, { glow: GLOWC[QGLOW] }) }   // v13.15 galaxy done-glow; inner blooms take its colour
  else if (S === 1) tileGlow(ctx, x, y, w, h, rr, u, d, pal)
  else if (S === 2) { fillPath(ctx, rrPath(x, y, w, h, rr), "#FFFFFF", d ? 0.06 : 0.025); strokeP(ctx, rrPath(x, y, w, h, rr), "#FFFFFF", d ? 0.16 : 0.06, 0.5 * u) }
  else fillPath(ctx, rrPath(x, y, w, h, rr), d ? pal.glow : "#FFFFFF", d ? 0.17 : 0.02)
  if (QSTACK !== "ROW") {                                              // v13.9 · v13.14: questFont / questIcon apply to the 2x2 grids (J/K/L/M/N/P)
    const G = QSK.grid || QSK.g2
    __QNF = G ? QFONTS[QFONT] : null; __QART2 = G ? QICON : null
    try { return questStacked(ctx, x, y, w, h, u, kind, label, p, d, pal) } finally { __QNF = null; __QART2 = null }
  }
  // centred row: [icon] gap [label] gap [flame + number]
  const iw = 15 * u, g1 = 3 * u, g2 = 3.6 * u, bold = d
  const fw = p ? p.fw + p.gp + p.nw : 0, room = w - 7 * u
  let lz = 9.4 * u
  const lw = () => futW(label, lz, bold)
  while (lz > 7.4 * u && iw + g1 + lw() + (p ? g2 + fw : 0) > room) lz -= 0.2 * u
  const tot = iw + g1 + lw() + (p ? g2 + fw : 0)
  let xx = x + (w - tot) / 2
  if (d) for (let k = 0; k < 6; k++) dot(ctx, xx + iw / 2, cy, iw * (1.05 - k * 0.12), pal.glow, 0.045)   // soft radial bloom behind the icon
  questArt(ctx, kind, xx + iw / 2, cy, iw, d, pal, u)
  xx += iw + g1
  if (d) text(ctx, label, FUT(bold, lz), lz, pal.glow, 0.28, xx, cy + 0.245 * lz + 0.25 * u, "left", lw() + 6 * u)   // faint warm under-glow
  text(ctx, label, FUT(bold, lz), lz, d ? (S === 2 ? "#FFFFFF" : pal.name) : SILVER, d ? 1 : 0.5, xx, cy + 0.245 * lz, "left", lw() + 6 * u)
  if (S === 2 && d) { const ux0 = x + 10 * u, ux1 = x + w - 10 * u, uy = y + h - 3.2 * u; seg(ctx, ux0, uy, ux1, uy, pal.glow, 0.25, 3.2 * u); seg(ctx, ux0, uy, ux1, uy, pal.acc, 0.95, 1.1 * u) }
  xx += lw() + g2
  if (p) {
    if (d) for (let k = 0; k < 4; k++) dot(ctx, xx + p.fw / 2, cy, p.h * (0.75 - k * 0.14), pal.glow, 0.05)
    flameNum(ctx, p, xx, cy, u, QFLAME_K)
    if (!d) { const mx = xx + fw / 2, mr = Math.max(fw, p.h) * 0.62; for (let k = 0; k < 5; k++) dot(ctx, mx, cy, mr * (1 - k * 0.12), "#05070C", 0.12) }   // not done: flame + number sit back (soft dim veil, no edge)
  }
}
// v13.15 galaxy "done" glow (FITNESS_CONFIG.questGlow; 2/2 a little stronger than 1/2; not-done tiles stay the dim glass):
//   A nebula haze: deep-space fill, sapphire + violet nebula clouds, tiny twinkle specks inside, icy rim
//   B icy starlight rim: crisp ice-white rim, top starlight highlight, soft sapphire outer bloom (default)
//   C aurora: gold at the floor rising into ice-blue at the top, with an ice rim
//   D stardust: faint sapphire glass, stardust specks drifting around the icon and flame
//   E milky way streak: an icy-blue Milky Way band crossing behind the tile with star specks
//   G legacy gold glow (v13.14)
const QGLOW = ["A", "B", "C", "D", "E", "G"].includes(String(CFG.questGlow || "B").toUpperCase()) ? String(CFG.questGlow || "B").toUpperCase() : "B"   // v13.16: B icy starlight rim by default
const GLOWC = { A: "#4F7DFF", B: "#7FB2FF", C: "#9CC8FF", D: "#6F9BFF", E: "#8DB8FF", G: "#E9B84A" }
let __QN = 0
function rrRows(ctx, x, y, w, h, rr, step, fn) {        // fill a rounded rect row by row; fn(t 0 top..1 bottom, rowY) -> [hex, a] (a gradient without gradients)
  for (let yy = y; yy < y + h - 0.01; yy += step) {
    const ym = Math.min(yy + step / 2, y + h), dy = ym < y + rr ? y + rr - ym : ym > y + h - rr ? ym - (y + h - rr) : 0
    const ins = dy > 0 ? rr - Math.sqrt(Math.max(0, rr * rr - dy * dy)) : 0, c = fn((ym - y) / h, ym)
    if (c && c[1] > 0) { ctx.setFillColor(col(c[0], c[1])); ctx.fillRect(new Rect(x + ins, yy, w - 2 * ins, Math.min(step, y + h - yy))) }
  }
}
function galGlow(ctx, x, y, w, h, rr, u, kind, G, big) {
  const k = big ? 1.25 : 1, R = rrPath(x, y, w, h, rr), cx = x + w / 2, cy = y + h / 2
  let sd = kind === "cook" ? 7 : 3; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280 }   // fixed specks per tile
  const specks = (n, x0, y0, ww, hh, hexs, amax, rmax) => { for (let i = 0; i < n; i++) { const px = x0 + rnd() * ww, py = y0 + rnd() * hh, r = (0.18 + rnd() * rmax) * u; dot(ctx, px, py, r, hexs[i % hexs.length], (0.25 + rnd() * 0.75) * amax) } }
  const bloom = (hex, a, sp) => { for (let i = 6; i >= 1; i--) strokeP(ctx, R, hex, (a + 0.008 * (6 - i)) * k, i * sp * u) }
  const ice = "#E8F2FF"
  if (G === "A") {
    bloom("#2F5FE0", 0.018, 1.1)
    fillPath(ctx, R, "#060A1C", 0.55); fillPath(ctx, R, "#1E3FA8", 0.16 * k)
    for (const [fx, fy, fr, hx, a] of [[0.22, 0.62, 0.42, "#2F6BFF", 0.05], [0.7, 0.35, 0.38, "#7A5CFF", 0.045], [0.5, 0.8, 0.3, "#4FA3FF", 0.04], [0.85, 0.75, 0.25, "#5B4CFF", 0.035]])
      for (let i = 0; i < 6; i++) dot(ctx, x + fx * w, y + fy * h, Math.min(fr * h, h * 0.45) * (1 - i / 7), hx, a * k)
    specks(big ? 22 : 16, x + 3 * u, y + 2.5 * u, w - 6 * u, h - 5 * u, [ice, "#BFD6FF", "#D9CCFF"], 0.75, 0.32)
    for (const [fx, fy] of [[0.12, 0.22], [0.9, 0.55]]) { const px = x + fx * w, py = y + fy * h, r = (big ? 1.5 : 1.2) * u; seg(ctx, px - r, py, px + r, py, ice, 0.55, 0.25 * u); seg(ctx, px, py - r, px, py + r, ice, 0.55, 0.25 * u); dot(ctx, px, py, 0.3 * u, "#FFFFFF", 0.9) }
    strokeP(ctx, R, "#BFD6FF", 0.38 * k, 0.5 * u)
  } else if (G === "B") {
    bloom("#3D7BFF", 0.024, 1.25)
    fillPath(ctx, R, "#0A1430", 0.4); fillPath(ctx, R, "#2F6BFF", 0.08 * k)
    rrRows(ctx, x + 0.6 * u, y + 0.6 * u, w - 1.2 * u, h - 1.2 * u, rr - 0.6 * u, 0.5 * u, (t) => ["#CFE2FF", 0.09 * k * Math.max(0, 1 - t * 1.8)])
    strokeP(ctx, R, ice, 0.6 * k, 0.55 * u)
    const n = 18; for (let i = 0; i < n; i++) { const f = 1 - Math.abs((i + 0.5) / n * 2 - 1); seg(ctx, x + rr + (w - 2 * rr) * i / n, y + 0.35 * u, x + rr + (w - 2 * rr) * (i + 1) / n, y + 0.35 * u, "#FFFFFF", 0.1 + 0.7 * f, 0.6 * u) }
    const sx = x + w - rr * 0.7, sy = y + rr * 0.3, r = (big ? 2.6 : 2) * u
    seg(ctx, sx - r, sy, sx + r, sy, "#FFFFFF", 0.7, 0.28 * u); seg(ctx, sx, sy - r * 0.8, sx, sy + r * 0.8, "#FFFFFF", 0.6, 0.28 * u); dot(ctx, sx, sy, 0.45 * u, "#FFFFFF", 1)
  } else if (G === "C") {
    bloom("#8FB4FF", 0.016, 1.1)
    fillPath(ctx, R, "#070B18", 0.45)
    rrRows(ctx, x, y, w, h, rr, 0.5 * u, (t) => t > 0.55 ? ["#E9B84A", (0.05 + 0.24 * (t - 0.55) / 0.45) * k] : ["#7FB2FF", (0.05 + 0.2 * (0.55 - t) / 0.55) * k])
    for (let i = 0; i < 14; i++) { const t = (i + 0.5) / 14, px = x + rr * 0.6 + t * (w - rr * 1.2), py = y + h * (0.42 + 0.08 * Math.sin(t * Math.PI * 2.2)); for (let j = 0; j < 3; j++) dot(ctx, px, py, h * 0.12 * (1 - j / 3), i % 3 === 1 ? "#9FFFE0" : "#BFD6FF", 0.022 * k) }   // soft aurora curtain
    specks(big ? 10 : 7, x + 4 * u, y + 2 * u, w - 8 * u, h * 0.45, [ice], 0.6, 0.25)
    strokeP(ctx, R, "#DCEBFF", 0.42 * k, 0.5 * u)
  } else if (G === "D") {
    bloom("#3D6BFF", 0.016, 1.1)
    fillPath(ctx, R, "#081028", 0.45); fillPath(ctx, R, "#2F6BFF", 0.07 * k)
    const L = __QSL && __QSL[0] ? 1 : 1, ix = x + w * 0.3, fx = x + w * 0.72, iy = y + h * 0.66
    for (const [ox, rad] of [[ix, h * 0.3], [fx, h * 0.26]]) for (let i = 0; i < (big ? 16 : 12); i++) {
      const a = rnd() * Math.PI * 2, rr2 = rad * (0.75 + rnd() * 0.55), px = ox + Math.cos(a) * rr2 * 1.25, py = iy + Math.sin(a) * rr2 * 0.8
      if (px > x + 2 * u && px < x + w - 2 * u && py > y + 2 * u && py < y + h - 2 * u) dot(ctx, px, py, (0.2 + rnd() * 0.35) * u, i % 4 ? ice : "#F2D58F", (0.35 + rnd() * 0.6) * k)
    }
    specks(8, x + 3 * u, y + 2 * u, w - 6 * u, h - 4 * u, ["#BFD6FF"], 0.45, 0.2)
    strokeP(ctx, R, "#BFD6FF", 0.34 * k, 0.5 * u)
  } else {                                              // E milky way streak behind the tile
    fillPath(ctx, R, "#050914", 0.45); fillPath(ctx, R, "#2F6BFF", 0.05 * k)
    const band = (t) => [x - 5 * u + t * (w + 10 * u), y + h * (0.92 - t * 0.84)]   // soft dust band (round puffs, no hard edge)
    for (let i = 0; i <= 28; i++) { const t = i / 28, [px, py] = band(t), f = Math.sin(Math.PI * t); for (let j = 0; j < 3; j++) dot(ctx, px, py, (2.2 + 3.2 * f) * u * (1 - j / 3.2), j === 2 ? "#E8F2FF" : "#7FA8FF", (j === 2 ? 0.08 : 0.045) * k) }; for (let i = 0; i < 12; i++) { const [px, py] = band(0.1 + rnd() * 0.8); dot(ctx, px + (rnd() - 0.5) * 6 * u, py + (rnd() - 0.5) * 4 * u, (0.25 + rnd() * 0.3) * u, "#FFFFFF", 0.5 + rnd() * 0.5) }
    for (let i = 0; i < 9; i++) { const t = 0.08 + i / 9, px = x + t * w, py = y + h * (0.9 - t * 0.9) + (rnd() - 0.5) * 5 * u; dot(ctx, px, py, (0.6 + rnd() * 1.4) * u, "#9FC4FF", 0.05 * k) }
    specks(big ? 16 : 11, x + 2 * u, y + 2 * u, w - 4 * u, h - 4 * u, [ice, "#CFE0FF"], 0.6, 0.28)
    strokeP(ctx, R, "#CFE0FF", 0.36 * k, 0.5 * u)
  }
}
// v13.7 lit tile: soft outer bloom, warm fill with an inner light falling from the top, gentle gold rim + a top highlight that fades at the ends (no harsh outline)
function tileGlow(ctx, x, y, w, h, rr, u, d, pal) {
  if (!d) { fillPath(ctx, rrPath(x, y, w, h, rr), "#FFFFFF", 0.03); strokeP(ctx, rrPath(x, y, w, h, rr), "#FFFFFF", 0.075, 0.5 * u); return }
  for (let i = 6; i >= 1; i--) strokeP(ctx, rrPath(x, y, w, h, rr), pal.glow, 0.022 + 0.008 * (6 - i), i * 1.15 * u)
  fillPath(ctx, rrPath(x, y, w, h, rr), pal.glow, 0.16)
  for (let k = 0; k < 6; k++) { const hh = h * (0.92 - k * 0.13); fillPath(ctx, rrPath(x + 0.6 * u, y + 0.6 * u, w - 1.2 * u, hh, Math.min(rr, hh / 2)), "#FFE7A8", 0.03) }
  strokeP(ctx, rrPath(x, y, w, h, rr), pal.acc, 0.42, 0.55 * u)
  const n = 16; for (let i = 0; i < n; i++) { const f = 1 - Math.abs((i + 0.5) / n * 2 - 1); seg(ctx, x + rr + (w - 2 * rr) * i / n, y + 0.35 * u, x + rr + (w - 2 * rr) * (i + 1) / n, y + 0.35 * u, "#FFF6DC", 0.08 + 0.6 * f, 0.6 * u) }
}
// v13.7 quest icons, vector, centred at (cx, cy) in an s-wide box. FITNESS_CONFIG.questArt: "A" dumbbell + steaming pot (default) · "B" kettlebell + chef hat · "C" minimal line icons
// v13.8: how the galaxy flows into the right (quest) side of the medium widget
// 1 = diagonal flow (default): band runs to the right edge, medal stars spread full width, ~50% dimmed behind the panel
// 2 = arc + text lane: band arcs across, stars full width, plus a dark text-safe lane behind the verse (stars there dimmed hardest)
// 3 = subtle: only faint dust and small stars drift right; big + superior stars stay in the open sky on the left · 0 = v13.7 (left only)
const GAL_FLOW = [0, 1, 2, 3].includes(Number(CFG.galaxyFlow)) ? Number(CFG.galaxyFlow) : 1
const QART = ["A", "B", "C"].includes(String(CFG.questArt || "").toUpperCase()) ? String(CFG.questArt).toUpperCase() : "A"
function qPath(pts) { const p = new Path(); p.move(P_(pts[0][0], pts[0][1])); for (let i = 1; i < pts.length; i++) p.addLine(P_(pts[i][0], pts[i][1])); p.closeSubpath(); return p }
function ellPath(cx, cy, rx, ry) { const p = new Path(), k = 0.5523; p.move(P_(cx + rx, cy)); p.addCurve(P_(cx, cy + ry), P_(cx + rx, cy + ry * k), P_(cx + rx * k, cy + ry)); p.addCurve(P_(cx - rx, cy), P_(cx - rx * k, cy + ry), P_(cx - rx, cy + ry * k)); p.addCurve(P_(cx, cy - ry), P_(cx - rx, cy - ry * k), P_(cx - rx * k, cy - ry)); p.addCurve(P_(cx + rx, cy), P_(cx + rx * k, cy - ry), P_(cx + rx, cy - ry * k)); p.closeSubpath(); return p }
let __POT_FIT = 0, __QSL = null   // v13.12: F/G pot fit flag · both quest tiles' labels + streak parts while panelQuestB draws them
function steam(ctx, x, y0, y1, s, hex, a, lw) {   // one gentle S-curve wisp rising from y0 to y1
  const p = new Path(), m = (y0 + y1) / 2, k = s * 0.06
  p.move(P_(x, y0)); p.addCurve(P_(x, m), P_(x - k, y0 - (y0 - m) * 0.4), P_(x - k, m + (y0 - m) * 0.2)); p.addCurve(P_(x, y1), P_(x + k, m - (m - y1) * 0.2), P_(x + k, y1 + (m - y1) * 0.4))
  strokeP(ctx, p, hex, a, lw)
}
function questArt(ctx, kind, cx, cy, s, d, pal, u) {
  const A = __QART2 || QART, lit = d, body = lit ? pal.acc : SILVER, hi = lit ? "#FFF6DC" : SILVER, sh = lit ? pal.glow : SILVER
  const F = (p, a) => fillPath(ctx, p, body, lit ? a : 0.10), O = (p) => { if (!lit) strokeP(ctx, p, SILVER, 0.55, 0.5 * u) }, H = (p, a) => { if (lit) fillPath(ctx, p, hi, a) }
  const L = (p, w) => strokeP(ctx, p, lit ? pal.acc : SILVER, lit ? 1 : 0.55, w)
  const X = (fx) => cx + fx * s, Y = (fy) => cy + fy * s
  if (A === "R") {                                   // v13.14 refined line icons: one stroke weight, round caps, a light inner fill when done
    const w = 0.07 * s, sc = lit ? pal.acc : SILVER, sa = lit ? 1 : 0.6, fl = (p) => { if (lit) fillPath(ctx, p, pal.acc, 0.22) }, st = (p) => strokeP(ctx, p, sc, sa, w)
    if (kind === "train") {
      seg(ctx, X(-0.17), cy, X(0.17), cy, sc, sa, w)
      for (const sg of [-1, 1]) {
        const p1 = rrPath(sg > 0 ? X(0.17) : X(-0.27), Y(-0.27), 0.1 * s, 0.54 * s, 0.045 * s), p2 = rrPath(sg > 0 ? X(0.31) : X(-0.385), Y(-0.17), 0.075 * s, 0.34 * s, 0.035 * s)
        fl(p1); fl(p2); st(p1); st(p2)
      }
      if (lit) for (const sg of [-1, 1]) seg(ctx, X(0.205 * sg), Y(-0.19), X(0.205 * sg), Y(-0.06), "#FFF6DC", 0.55, 0.025 * s)
    } else {
      const body = new Path(); body.move(P_(X(-0.3), Y(-0.02))); body.addLine(P_(X(-0.28), Y(0.19))); body.addQuadCurve(P_(X(-0.17), Y(0.28)), P_(X(-0.27), Y(0.28))); body.addLine(P_(X(0.17), Y(0.28))); body.addQuadCurve(P_(X(0.28), Y(0.19)), P_(X(0.27), Y(0.28))); body.addLine(P_(X(0.3), Y(-0.02))); body.closeSubpath()
      fl(body); st(body)
      const lid = new Path(); lid.move(P_(X(-0.36), Y(-0.08))); lid.addQuadCurve(P_(X(0.36), Y(-0.08)), P_(cx, Y(-0.27))); st(lid)
      seg(ctx, X(-0.36), Y(-0.08), X(0.36), Y(-0.08), sc, sa, w)
      st(ellPath(cx, Y(-0.215), 0.035 * s, 0.03 * s))
      for (const sg of [-1, 1]) seg(ctx, X(0.31 * sg), Y(0.05), X(0.4 * sg), Y(0.05), sc, sa, w)
      for (const sx of [-0.1, 0.1]) steam(ctx, X(sx), Y(-0.28), Y(-0.43), s * 0.8, lit ? "#FFF6DC" : SILVER, lit ? 0.75 : 0.4, w * 0.75)
      if (lit) seg(ctx, X(-0.2), Y(0.04), X(-0.2), Y(0.18), "#FFF6DC", 0.5, 0.025 * s)
    }
    return
  }
  if (A === "S") {                                   // v13.14 solid glyphs: one silhouette, a soft inner highlight when done, a flat dim fill when not
    const fc = lit ? pal.acc : SILVER, fa = lit ? 1 : 0.34, SF = (p) => fillPath(ctx, p, fc, fa), HL = (p, a) => { if (lit) fillPath(ctx, p, "#FFF6DC", a) }
    if (kind === "train") {
      SF(rrPath(X(-0.18), Y(-0.045), 0.36 * s, 0.09 * s, 0.045 * s))
      for (const sg of [-1, 1]) {
        SF(rrPath(sg > 0 ? X(0.16) : X(-0.28), Y(-0.28), 0.12 * s, 0.56 * s, 0.05 * s)); SF(rrPath(sg > 0 ? X(0.3) : X(-0.4), Y(-0.19), 0.1 * s, 0.38 * s, 0.04 * s)); SF(rrPath(sg > 0 ? X(0.39) : X(-0.43), Y(-0.06), 0.04 * s, 0.12 * s, 0.02 * s))
        HL(rrPath(sg > 0 ? X(0.175) : X(-0.265), Y(-0.25), 0.035 * s, 0.3 * s, 0.017 * s), 0.42); HL(rrPath(sg > 0 ? X(0.315) : X(-0.385), Y(-0.16), 0.03 * s, 0.2 * s, 0.015 * s), 0.32)
      }
    } else {
      const body = new Path(); body.move(P_(X(-0.31), Y(-0.03))); body.addLine(P_(X(-0.29), Y(0.19))); body.addQuadCurve(P_(X(-0.17), Y(0.29)), P_(X(-0.28), Y(0.29))); body.addLine(P_(X(0.17), Y(0.29))); body.addQuadCurve(P_(X(0.29), Y(0.19)), P_(X(0.28), Y(0.29))); body.addLine(P_(X(0.31), Y(-0.03))); body.closeSubpath()
      SF(body)
      const lid = new Path(); lid.move(P_(X(-0.38), Y(-0.07))); lid.addQuadCurve(P_(X(0.38), Y(-0.07)), P_(cx, Y(-0.27))); lid.closeSubpath(); SF(lid)
      SF(rrPath(X(-0.4), Y(-0.09), 0.8 * s, 0.05 * s, 0.025 * s)); SF(ellPath(cx, Y(-0.225), 0.05 * s, 0.04 * s))
      for (const sg of [-1, 1]) SF(rrPath(sg > 0 ? X(0.3) : X(-0.42), Y(0.02), 0.12 * s, 0.065 * s, 0.03 * s))
      HL(rrPath(X(-0.24), Y(0.0), 0.05 * s, 0.2 * s, 0.025 * s), 0.38); HL(rrPath(X(-0.24), Y(-0.15), 0.18 * s, 0.03 * s, 0.015 * s), 0.4)
      if (!lit) fillPath(ctx, rrPath(X(-0.31), Y(-0.03), 0.62 * s, 0.012 * s, 0.006 * s), "#05070C", 0.5)
    }
    return
  }
  if (A === "C") {                                   // minimal line icons
    const w = 0.075 * s
    if (kind === "train") {
      seg(ctx, X(-0.2), cy, X(0.2), cy, lit ? pal.acc : SILVER, lit ? 1 : 0.55, w)
      for (const sg of [-1, 1]) { seg(ctx, X(0.24 * sg), Y(-0.2), X(0.24 * sg), Y(0.2), lit ? pal.acc : SILVER, lit ? 1 : 0.55, w * 1.15); seg(ctx, X(0.38 * sg), Y(-0.12), X(0.38 * sg), Y(0.12), lit ? pal.acc : SILVER, lit ? 1 : 0.55, w * 1.15) }
    } else {
      const p = new Path(); p.move(P_(X(-0.36), Y(-0.02))); p.addLine(P_(X(-0.32), Y(0.24))); p.addQuadCurve(P_(X(-0.2), Y(0.34)), P_(X(-0.31), Y(0.34))); p.addLine(P_(X(0.2), Y(0.34))); p.addQuadCurve(P_(X(0.32), Y(0.24)), P_(X(0.31), Y(0.34))); p.addLine(P_(X(0.36), Y(-0.02))); p.closeSubpath(); L(p, w)
      seg(ctx, X(-0.46), Y(-0.02), X(0.46), Y(-0.02), lit ? pal.acc : SILVER, lit ? 1 : 0.55, w)
      for (const sx of [-0.16, 0, 0.16]) steam(ctx, X(sx), Y(-0.12), Y(-0.44), s, lit ? hi : SILVER, lit ? 0.9 : 0.45, w * 0.8)
    }
    return
  }
  if (kind === "train" && A === "A") {               // dumbbell: two-plate heads, knurled bar
    const bar = qPath([[X(-0.3), Y(-0.045)], [X(0.3), Y(-0.045)], [X(0.3), Y(0.045)], [X(-0.3), Y(0.045)]]); F(bar, 0.85); O(bar)
    for (const sg of [-1, 1]) {
      const p1 = rrPath(X(sg > 0 ? 0.17 : -0.3), Y(-0.31), 0.13 * s, 0.62 * s, 0.035 * s), p2 = rrPath(X(sg > 0 ? 0.31 : -0.42), Y(-0.21), 0.11 * s, 0.42 * s, 0.03 * s)
      F(p1, 0.98); F(p2, 0.9); O(p1); O(p2)
      H(rrPath(X(sg > 0 ? 0.185 : -0.285), Y(-0.29), 0.04 * s, 0.56 * s, 0.02 * s), 0.45)
      H(rrPath(X(sg > 0 ? 0.325 : -0.405), Y(-0.19), 0.035 * s, 0.38 * s, 0.017 * s), 0.35)
    }
    if (lit) for (let i = -2; i <= 2; i++) seg(ctx, X(i * 0.045), Y(-0.04), X(i * 0.045), Y(0.04), pal.glow, 0.7, 0.25 * u)
    return
  }
  if (kind === "train") {                             // kettlebell: wide flat-topped handle (open window), broad bell, flat base
    const hp = new Path(); hp.move(P_(X(-0.25), Y(-0.02))); hp.addLine(P_(X(-0.27), Y(-0.27))); hp.addQuadCurve(P_(X(-0.17), Y(-0.38)), P_(X(-0.27), Y(-0.38))); hp.addLine(P_(X(0.17), Y(-0.38))); hp.addQuadCurve(P_(X(0.27), Y(-0.27)), P_(X(0.27), Y(-0.38))); hp.addLine(P_(X(0.25), Y(-0.02)))
    strokeP(ctx, hp, body, lit ? 0.98 : 0.55, 0.085 * s)
    if (lit) seg(ctx, X(-0.13), Y(-0.385), X(0.1), Y(-0.385), hi, 0.55, 0.025 * s)
    const bell = ellPath(cx, Y(0.13), 0.36 * s, 0.26 * s); F(bell, 0.98); O(bell)
    const base = rrPath(X(-0.22), Y(0.3), 0.44 * s, 0.08 * s, 0.03 * s); F(base, 0.98); O(base)
    H(ellPath(X(-0.14), Y(0.05), 0.1 * s, 0.06 * s), 0.42)
    return
  }
  if (A === "A") {                                    // steaming pot: lid + knob, rounded body, side handles, three wisps
    for (const sx of [-0.16, 0, 0.16]) steam(ctx, X(sx), Y(-0.17), Y(__POT_FIT === 2 ? -0.32 : __POT_FIT ? -0.38 : -0.48), s, lit ? hi : SILVER, lit ? 0.85 : 0.45, 0.055 * s)
    const bp = new Path(); bp.move(P_(X(-0.34), Y(-0.02))); bp.addLine(P_(X(0.34), Y(-0.02))); bp.addLine(P_(X(0.32), Y(0.24))); bp.addQuadCurve(P_(X(0.2), Y(0.35)), P_(X(0.31), Y(0.35))); bp.addLine(P_(X(-0.2), Y(0.35))); bp.addQuadCurve(P_(X(-0.32), Y(0.24)), P_(X(-0.31), Y(0.35))); bp.closeSubpath()
    F(bp, 0.98); O(bp)
    for (const sg of [-1, 1]) { const hp = rrPath(sg > 0 ? X(0.32) : X(-0.47), Y(0.03), 0.15 * s, 0.07 * s, 0.035 * s); F(hp, 0.9); O(hp) }
    const lid = rrPath(X(-0.4), Y(-0.11), 0.8 * s, 0.09 * s, 0.045 * s); F(lid, 1); O(lid)
    const kn = ellPath(cx, Y(-0.14), 0.065 * s, 0.045 * s); F(kn, 1); O(kn)
    H(rrPath(X(-0.27), Y(0.02), 0.06 * s, 0.24 * s, 0.03 * s), 0.35); H(rrPath(X(-0.34), Y(-0.1), 0.5 * s, 0.025 * s, 0.012 * s), 0.5)
    return
  }
  // chef hat (toque): three puffs over a pleated band
  const puffs = [ellPath(X(-0.19), Y(-0.1), 0.19 * s, 0.18 * s), ellPath(cx, Y(-0.2), 0.22 * s, 0.2 * s), ellPath(X(0.19), Y(-0.1), 0.19 * s, 0.18 * s), rrPath(X(-0.25), Y(-0.1), 0.5 * s, 0.32 * s, 0.03 * s)]
  puffs.forEach((p) => F(p, 0.98)); if (!lit) puffs.slice(0, 3).forEach(O)
  if (lit) { const c1 = new Path(); c1.move(P_(X(-0.06), Y(-0.04))); c1.addQuadCurve(P_(X(-0.02), Y(-0.2)), P_(X(-0.1), Y(-0.12))); strokeP(ctx, c1, sh, 0.7, 0.03 * s); const c2 = new Path(); c2.move(P_(X(0.06), Y(-0.04))); c2.addQuadCurve(P_(X(0.02), Y(-0.2)), P_(X(0.1), Y(-0.12))); strokeP(ctx, c2, sh, 0.7, 0.03 * s) }   // puff creases
  const band = rrPath(X(-0.26), Y(0.2), 0.52 * s, 0.15 * s, 0.03 * s); fillPath(ctx, band, lit ? sh : SILVER, lit ? 1 : 0.18); O(band)
  for (const fx of [-0.12, 0, 0.12]) seg(ctx, X(fx), Y(0.0), X(fx), Y(0.2), lit ? pal.glow : SILVER, lit ? 0.55 : 0.35, 0.03 * s)
  H(ellPath(X(-0.08), Y(-0.26), 0.08 * s, 0.05 * s), 0.55)
}
// v13.14: the quest panel's "today's quest" header + x/2 counter are replaced by a star (questHeader: 1 brings the old header back)
//   sapphire (1/2 deep #1E4FD8, 2/2 bright #2F6BFF, ice core, #0F52BA glow, violet edge) · same day boundary as the tiles: shown only while today's trainToday/cookToday say done
//   questStar 1 = sparkle (default) · 2 = classic 5-point · 3 = sparkle + flare · questStarPos "R" badge on the right tile's top-right corner (default) / "M" badge between the tiles' tops · questStarEmpty 1 = faint outline at 0/2
const QHEAD = CFG.questHeader === 1 || CFG.questHeader === true
const QSTAR = ["1", "2", "3"].includes(String(CFG.questStar || "0")) ? String(CFG.questStar) : "0"   // v13.15: star off by default (questStar 1/2/3 brings a v13.14 star back)
const QSTAR_POS = String(CFG.questStarPos || "R").toUpperCase() === "M" ? "M" : "R"
const QSTAR_EMPTY = CFG.questStarEmpty === 1 || CFG.questStarEmpty === true
const QSTAR_TY = () => QB_BOT_U                         // v13.14: no header -> tiles flush up; their top clearance = the verse box's bottom clearance (was 24u)
function sparkP(cx, cy, rs, k, rot) {                   // concave sparkle through tips rs[i]; k = waist (x the shorter neighbouring tip)
  const n = rs.length, p = new Path(), tip = (i) => { const a = rot + i * Math.PI * 2 / n; return P_(cx + Math.cos(a) * rs[i % n], cy + Math.sin(a) * rs[i % n]) }
  p.move(tip(0))
  for (let i = 0; i < n; i++) { const b = rot + (i + 0.5) * Math.PI * 2 / n, r = Math.min(rs[i % n], rs[(i + 1) % n]) * k; p.addQuadCurve(tip(i + 1), P_(cx + Math.cos(b) * r, cy + Math.sin(b) * r)) }
  p.closeSubpath(); return p
}
function star5P(cx, cy, R, r, rot) { const pts = []; for (let i = 0; i < 10; i++) { const a = rot + i * Math.PI / 5, q = i % 2 ? r : R; pts.push([cx + Math.cos(a) * q, cy + Math.sin(a) * q]) } return qPath(pts) }
function questStar(ctx, cx, cy, n, u, design) {        // n = quests done (0..2)
  const up = -Math.PI / 2, big = n >= 2   // v13.14 sapphire: 1/2 deep sapphire, 2/2 brighter radiant sapphire with an ice-white core
  const WG = big ? "#F4F9FF" : "#E8F2FF", G1 = big ? "#2F6BFF" : "#1E4FD8", G0 = G1, GL = "#0F52BA", VI = "#7A6CFF"
  const bloom = (r, hex, a, k) => { for (let i = 0; i < k; i++) dot(ctx, cx, cy, r * (1 - i / k), hex, a) }
  if (n <= 0) { if (QSTAR_EMPTY) strokeP(ctx, design === "2" ? star5P(cx, cy, 3.6 * u, 1.5 * u, up) : sparkP(cx, cy, [3.8 * u, 3.8 * u, 3.8 * u, 3.8 * u], 0.3, up), SILVER, 0.3, 0.45 * u); return }
  if (design === "2") {                                 // classic 5-point star, rounded glow; 2/2 adds a halo ring + spokes
    const R = (big ? 5.6 : 4.4) * u
    bloom(R * (big ? 3 : 2), GL, big ? 0.05 : 0.04, 8); bloom(R * (big ? 1.5 : 1.2), VI, 0.025, 4)
    if (big) { arcStroke(ctx, cx, cy, R * 1.55, 0, Math.PI * 2, "#9CC2FF", 0.35, 0.4 * u); for (let k = 0; k < 10; k++) { const a = up + k * Math.PI / 5 + Math.PI / 5; seg(ctx, cx + Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05, cx + Math.cos(a) * R * 1.35, cy + Math.sin(a) * R * 1.35, WG, 0.35, 0.35 * u) } }
    strokeP(ctx, star5P(cx, cy, R, R * 0.45, up), VI, 0.45, 0.6 * u)
    fillPath(ctx, star5P(cx, cy, R, R * 0.45, up), G1, 1)
    fillPath(ctx, star5P(cx, cy, R * 0.55, R * 0.25, up), WG, big ? 0.9 : 0.6)
    return
  }
  const R = (big ? 6.4 : 4.8) * u
  bloom(R * (big ? 2.8 : 1.9), GL, big ? 0.055 : 0.045, 9); bloom(R * (big ? 1.4 : 1.1), VI, big ? 0.03 : 0.022, 5)
  if (big) {                                            // 2/2: 8-point radiant sparkle (4 long + 4 short), white-hot core, twinkle ring
    if (design === "3") { seg(ctx, cx - R * 2.1, cy, cx + R * 2.1, cy, WG, 0.22, 0.35 * u); seg(ctx, cx, cy - R * 1.6, cx, cy + R * 1.6, WG, 0.16, 0.3 * u) }
    const PR = ["#9FE7FF", "#C9B8FF", "#FFFFFF", "#8FB8FF", "#FFC8F0", "#B8FFF0"]   // faint prismatic twinkle ring (design 3)
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 + 0.13; dot(ctx, cx + Math.cos(a) * R * 1.45, cy + Math.sin(a) * R * 1.45, (k % 3 ? 0.18 : 0.3) * u, design === "3" ? PR[k % 6] : WG, k % 3 ? 0.4 : 0.7) }
    strokeP(ctx, sparkP(cx, cy, [R, R * 0.5, R, R * 0.5, R, R * 0.5, R, R * 0.5], 0.36, up), VI, 0.4, 0.5 * u)
    fillPath(ctx, sparkP(cx, cy, [R, R * 0.5, R, R * 0.5, R, R * 0.5, R, R * 0.5], 0.36, up), G1, 1)
    fillPath(ctx, sparkP(cx, cy, [R * 0.62, R * 0.32, R * 0.62, R * 0.32, R * 0.62, R * 0.32, R * 0.62, R * 0.32], 0.36, up), WG, 0.9)
    dot(ctx, cx, cy, R * 0.16, "#FFFFFF", 1)
  } else {                                              // 1/2: 4-point gold sparkle with a soft glow
    if (design === "3") { seg(ctx, cx - R * 1.7, cy, cx + R * 1.7, cy, WG, 0.16, 0.3 * u); for (const [dx, dy, r] of [[-1.25, -0.85, 1.3], [1.15, 0.9, 1.0]]) fillPath(ctx, sparkP(cx + dx * R, cy + dy * R, [r * u, r * u, r * u, r * u], 0.3, up), WG, 0.75) }
    strokeP(ctx, sparkP(cx, cy, [R, R * 0.78, R, R * 0.78], 0.28, up), VI, 0.4, 0.45 * u)
    fillPath(ctx, sparkP(cx, cy, [R, R * 0.78, R, R * 0.78], 0.28, up), G0, 1)
    fillPath(ctx, sparkP(cx, cy, [R * 0.55, R * 0.42, R * 0.55, R * 0.42], 0.28, up), WG, 0.7)
  }
}
// v13.16 balanced quest block (no header, stacked tiles): the verse sits a fixed gap under the tiles, takes the biggest size (≤ QV_FMAX) at which
//   tiles + gap + verse + reference fit between the QB_BOT_U clearances, and the whole group is centred vertically (tile top edge ↔ reference baseline),
//   so the top and bottom clearances are always equal and no hole opens between the tiles and the verse. Text spans exactly the tiles' left..right edges.
const QV_FMAX = 16.5, QV_GAP = 8, QV_LH = 1.3, QV_RZ = 6, QV_RGAP = 2.6, QV_CAP = 0.68, QV_REFB = 2.2
function questBlock(u, H, th, mw) {
  const [v, ref] = thisHoursVerse(), cmin = QB_BOT_U * u, room = H - 2 * cmin
  const lay = (z) => { const f = z * u, L = wrapWords(v, f, mw), lh = f * QV_LH, top = QV_GAP * u - (lh / 2 - QV_CAP * f), Hv = L.length * lh + QV_RGAP * u + QV_RZ * u
    return { f, z, L, lh, top, Hv, span: th + top + Hv - QV_REFB * u, v, ref } }
  let best = null
  for (let z = QV_FMAX; z >= 5.6 - 0.001; z -= 0.2) { const o = lay(z); if (o.L.length <= 7 && o.span <= room) { best = o; break } }
  if (!best) best = lay(5.6)
  best.ty = Math.max(cmin * 0.6, (H - best.span) / 2)
  return best
}
function drawQuestVerse(ctx, B, tx, mw, y0, u, hot) {
  const { f, L, lh, ref } = B, rz = QV_RZ * u, y = y0 + lh / 2
  const sx = tx - 5.2 * u, s2 = 1.9 * u                                      // the sparkle hangs in the margin; the text edge sits on the tile edge
  seg(ctx, sx - s2, y, sx + s2, y, hot || SILVER, 0.55, 0.35 * u); seg(ctx, sx, y - s2, sx, y + s2, hot || SILVER, 0.55, 0.35 * u); dot(ctx, sx, y, 0.6 * u, "#FFFFFF", 0.8)
  L.forEach((l, i) => text(ctx, l, FUT(false, f), f, SILVER, 0.9, tx, y + i * lh, "left", mw + 30 * u))
  text(ctx, "— " + ref, FUT(false, rz), rz, hot || SILVER, 0.7, tx, y + (L.length - 1) * lh + lh / 2 + QV_RGAP * u + rz / 2, "left", mw + 30 * u)
  if (globalThis.__VF) globalThis.__VF.push([B.z, L.length])
}
function panelQuestB(ctx, W, H, u) {
  const { a: done, n } = questState(), pal = QGOLD ? QPAL(n ? 2 : 0) : QPAL(n), s = LIVE.streaks
  const x0 = 198 * u, x1 = W - 24 * u, gp = 5 * u, tw = (x1 - x0 + 8 * u - gp) / 2, th = QSK.th * u
  const TL = x0 - 4 * u, TR = x0 - 4 * u + 2 * tw + gp, BLK = !QHEAD && QSTACK !== "ROW" && CFG.verseAnchor !== "C" && CFG.verseAnchor !== "B" ? questBlock(u, H, th, TR - TL - 0.4 * u) : null
  const ty = QHEAD ? (QB_TOP_U * u) + 7 * u : BLK ? Math.round(BLK.ty * 3) / 3 : QSTAR_TY() * u   // v13.7: header + tiles lifted 6u · v13.9: taller stacked tiles · v13.14: no header -> tiles up 4.5u
  const dv = QSTACK === "ROW" ? 8 : 6                                                                  // v13.9: divider a little closer so the verse keeps its room
  if (QHEAD) panelHead(ctx, x0, x1, (QB_TOP_U * u), u, "today's quest", pal.acc, n, 2, n ? pal.name : SILVER, n ? 1 : 0.55, "done")
  const starAt = () => { if (!QHEAD && QSTAR !== "0") questStar(ctx, QSTAR_POS === "M" ? x0 - 4 * u + tw + gp / 2 : x1 + 1.5 * u, ty + (QSTAR_POS === "M" ? 0.5 : 1.8) * u, n, u, QSTAR) }   // overlaid badge, drawn after the tiles
  const P = s ? streakParts(s, u, QSK.k) : null
  __QN = n
  __QSL = QUEST_ROWS.map((row, i) => ({ label: qName(i), p: P && P[i], bold: !!done[i] }))   // v13.12: shared tile geometry
  try { QUEST_ROWS.forEach((row, i) => questTile(ctx, x0 - 4 * u + (QSK.side || QSK.mode || QSK.grid || QSK.g2 ? Math.round(i * (tw + gp) * 3) / 3 : i * (tw + gp)), ty, tw, th, u, row[2], qName(i), P && P[i], done[i], pal)) } finally { __QSL = null }   // F/G: tile step snapped to whole @3x pixels so both tiles rasterise the same
  starAt()
  if (BLK) {                                                                // v13.16: divider centred in the tile→verse gap, spanning the tiles' inner width; verse text on the tile edges
    const gy = ty + th + QV_GAP * u * 0.5; seg(ctx, TL + 8 * u, gy, TR - 8 * u, gy, "#FFFFFF", 0.07, 0.5)
    return drawQuestVerse(ctx, BLK, TL - 0.4 * u, TR - TL - 0.4 * u, ty + th + BLK.top, u, pal.acc)
  }
  seg(ctx, x0, ty + th + dv * u, x1, ty + th + dv * u, "#FFFFFF", 0.07, 0.5)
  if (QHEAD) verseFill(ctx, x0 - 3 * u, x1 + 5 * u, ty + th + (dv + 2) * u, H - QB_BOT_U * u, u, SILVER, 0.9, pal.acc, 13, 7, QSTACK === "ROW" ? 5 : 7, QSTACK === "ROW")
  else verseFill(ctx, x0 - 3 * u, x1 + 5 * u, ty + th + (dv + 2) * u, H - (QSTAR_TY() - 2.233) * u, u, SILVER, 0.9, pal.acc, 15.5, 7, 7, QSTACK === "ROW" || CFG.verseAnchor !== "C")   // v13.14 (verseAnchor "C" = centre the spare room instead of bottom-anchoring): the freed header room goes to the verse (up to 15.5pt); a full box puts the reference baseline as far from the bottom as the tiles are from the top   // v13.9: up to 7 lines so long verses fill the box; any spare room split above + below   // anchored so the reference sits as far from the bottom as the header from the top
}
// chaos · RESTRICTED, compact: all five tiers in one list (locked bright, still-free faint) or a 2-column chip grid, then the streak line, then the verse
function panelRestrictedA(ctx, W, H, u, pal, LK, st) {
  const x0 = 198 * u, x1 = W - 24 * u
  panelHead(ctx, x0, x1, 23 * u, u, "restricted", pal.acc, LK, 5, pal.name, 1, "")
  for (let i = 0; i < 5; i++) {
    const y = (35 + i * 9.6) * u, lk = i < LK
    if (lk) fillPath(ctx, rrPath(x0 - 4 * u, y - 4.3 * u, x1 - x0 + 8 * u, 8.6 * u, 4.3 * u), pal.glow, 0.12)
    lockIcon(ctx, x0 + 2 * u, y, 3.6 * u, lk ? pal.name : SILVER, lk ? 1 : 0.3, !lk)
    const fz = lk ? 6.2 * u : 5.8 * u
    text(ctx, CHAOS_TIERS[i], FUT(lk, fz), fz, lk ? pal.name : SILVER, lk ? 1 : 0.4, x0 + 9 * u, y + 0.245 * fz, "left", x1 - x0 - 24 * u)
    textR(ctx, tr(`t${i + 1}`), FUT(true, 4.2 * u), 4.2 * u, lk ? pal.acc : SILVER, lk ? 0.85 : 0.3, x1, y + 0.245 * 4.2 * u, 20 * u)
  }
  if (LIVE.streaks) streakInline(ctx, LIVE.streaks, (x0 + x1) / 2, 88 * u, u)
  seg(ctx, x0, 97 * u, x1, 97 * u, "#FFFFFF", 0.07, 0.5)
  verseBlock(ctx, x0, x1, 98 * u, 162 * u, u, pal.name, 0.84, pal.acc, 3, 8.2)
}
function panelRestrictedB(ctx, W, H, u, pal, LK, st) {
  const x0 = 198 * u, x1 = W - 24 * u, gp = 4 * u, cw = (x1 - x0 + 8 * u - gp) / 2, ch = 10 * u
  panelHead(ctx, x0, x1, (QB_TOP_U * u), u, "restricted", pal.acc, LK, 5, pal.name, 1, "")
  for (let i = 0; i < 6; i++) {
    const x = x0 - 4 * u + (i % 2) * (cw + gp), y = (QB_TOP_U * u) + (8 + Math.floor(i / 2) * 12.5) * u, cy = y + ch / 2
    if (i === 5) { if (LIVE.streaks) { const P = streakParts(LIVE.streaks, u, 0.5); let xx = x + 6 * u; P.forEach((p, j) => { xx += flameNum(ctx, p, xx, cy, u, 0.5) + (j ? 0 : 7 * u) }) } continue }
    const lk = i < LK
    fillPath(ctx, rrPath(x, y, cw, ch, ch / 2), lk ? pal.glow : "#FFFFFF", lk ? 0.14 : 0.03)
    strokeP(ctx, rrPath(x, y, cw, ch, ch / 2), lk ? pal.acc : "#FFFFFF", lk ? 0.4 : 0.08, 0.5 * u)
    lockIcon(ctx, x + 6 * u, cy, 3.4 * u, lk ? pal.name : SILVER, lk ? 1 : 0.3, !lk)
    const nm = CHAOS_TIERS[i], fz = Math.min(5.8 * u, (cw - 14 * u) / Math.max(1e-6, futW(nm, 1, lk)))
    text(ctx, nm, FUT(lk, fz), fz, lk ? pal.name : SILVER, lk ? 1 : 0.42, x + 11.5 * u, cy + 0.245 * fz, "left", cw - 12 * u)
  }
  seg(ctx, x0, (QB_TOP_U * u) + 51 * u, x1, (QB_TOP_U * u) + 51 * u, "#FFFFFF", 0.07, 0.5)
  verseFill(ctx, x0 - 3 * u, x1 + 5 * u, (QB_TOP_U * u) + 52 * u, H - QB_BOT_U * u, u, pal.name, 0.88, pal.acc, 13, 7, 5, true)
}
// v13 ring-centre typography options (FITNESS_CONFIG.ringText = 1..4; 0 = the v12 layout). Same content: XP · level · % to next · p.a.
const RING_TEXT = Number(CFG.ringText) || 0
function xpLabelsV(ctx, s, cx, cy, u, pct, red, LT, v) {
  const g = red ? "#FFC9B8" : GOLD, gb = red ? "#FFD0C4" : GOLD_BRIGHT, lc = (LT && LT.text) || "#E3E7EF", teal = red ? "#FFC9B8" : "#7FD6CC"
  const pa = paText(s.savings), P = `${Math.round(pct * 100)}%`
  if (v === 1) {            // (a) elegant thin serif numerals (Didot), warm gold glow; level in light caps
    glowText(ctx, fmtNum(s.xp), new Font("Didot", 22 * u), 22 * u, g, cx, cy - 8.5 * u, "center", 1.5)
    text(ctx, fmtNum(s.xp), new Font("Didot", 22 * u), 22 * u, gb, 0.35, cx, cy - 8.9 * u, "center", 80 * u)     // lighter top layer ≈ gold gradient
    text(ctx, `Level ${s.level}`, new Font("Didot-Italic", 9.5 * u), 9.5 * u, lc, 0.95, cx, cy + 6.2 * u, "center", 60 * u)
    text(ctx, `${P} to Lvl ${s.level + 1}`, FUT(false, 5 * u), 5 * u, teal, 0.9, cx, cy + 14 * u, "center", 60 * u)
    if (pa) text(ctx, pa, FUT(false, 4.5 * u), 4.5 * u, red ? "#FFB0A0" : GOLD_SOFT, 0.7, cx, cy + 20.4 * u, "center", 60 * u)
  } else if (v === 2) {     // (b) LV pill above the XP
    const pl = `LV ${s.level}`, pz = 5.6 * u, pw = futW(pl, pz, true) + 9 * u, ph = 9 * u, py = cy - 21 * u
    fillPath(ctx, rrPath(cx - pw / 2, py - ph / 2, pw, ph, ph / 2), red ? "#3A0A10" : "#1A1406", 0.85)
    strokeP(ctx, rrPath(cx - pw / 2, py - ph / 2, pw, ph, ph / 2), g, 0.7, 0.6 * u)
    text(ctx, track(pl), FUT(true, pz), pz, gb, 1, cx, py + 0.245 * pz, "center", 40 * u)
    glowText(ctx, fmtNum(s.xp), FS.hero(20 * u * FS.heroK), 20 * u, g, cx, cy - 2.5 * u, "center", 1.2)
    text(ctx, `${P} to Lvl ${s.level + 1}`, FUT(false, 5.4 * u), 5.4 * u, teal, 0.95, cx, cy + 12 * u, "center", 60 * u)
    if (pa) text(ctx, pa, FUT(false, 4.7 * u), 4.7 * u, red ? "#FFB0A0" : GOLD_SOFT, 0.72, cx, cy + 19 * u, "center", 60 * u)
  } else if (v === 3) {     // (c) % to next level as a fine inner arc with a tick at its tip
    const r = 33.5 * u, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * pct
    arcStroke(ctx, cx, cy, r, 0, Math.PI * 2, "#FFFFFF", 0.07, 0.6 * u)
    arcStroke(ctx, cx, cy, r, a0, a1, teal, 0.8, 1 * u)
    for (let i = 0; i < 10; i++) { const a = a0 + i / 10 * Math.PI * 2; seg(ctx, cx + Math.cos(a) * (r - 1.6 * u), cy + Math.sin(a) * (r - 1.6 * u), cx + Math.cos(a) * (r + 1.6 * u), cy + Math.sin(a) * (r + 1.6 * u), i / 10 <= pct ? teal : "#FFFFFF", i / 10 <= pct ? 0.7 : 0.18, 0.5 * u) }
    const tx = cx + Math.cos(a1) * r, ty = cy + Math.sin(a1) * r
    dot(ctx, tx, ty, 2.4 * u, teal, 0.22); dot(ctx, tx, ty, 1.15 * u, "#FFFFFF", 0.95)
    text(ctx, track(P), FUT(true, 4.6 * u), 4.6 * u, teal, 0.95, cx, cy - 22.5 * u, "center", 30 * u)
    glowText(ctx, fmtNum(s.xp), FS.hero(18.5 * u * FS.heroK), 18.5 * u, g, cx, cy - 4 * u, "center", 1.2)
    const nd = String(s.level).length, lw = 5.4 * 3.9 * u, gw = lw + nd * 8.8 * 0.62 * u, lx2 = cx - gw / 2
    text(ctx, track("LEVEL"), FUT(false, 5.4 * u), 5.4 * u, lc, 0.85, lx2, cy + 9.5 * u + 0.12 * 8.8 * u, "left", 30 * u)
    glowText(ctx, String(s.level), FUT(true, 8.8 * u), 8.8 * u, lc, lx2 + lw + nd * 8.8 * 0.31 * u, cy + 9.5 * u, "center", 0.8)
    if (pa) text(ctx, pa, FUT(false, 4.4 * u), 4.4 * u, red ? "#FFB0A0" : GOLD_SOFT, 0.7, cx, cy + 18 * u, "center", 50 * u)
  } else {                  // (d) minimal: light numerals, hairline, tracked small caps
    glowText(ctx, fmtNum(s.xp), FUT(false, 19 * u), 19 * u, g, cx, cy - 6 * u, "center", 0.9)
    seg(ctx, cx - 16 * u, cy + 4.5 * u, cx + 16 * u, cy + 4.5 * u, g, 0.45, 0.5 * u)
    dot(ctx, cx, cy + 4.5 * u, 0.8 * u, gb, 0.9)
    text(ctx, track(`LEVEL ${s.level}  ·  ${P} TO ${s.level + 1}`), FUT(false, 4.6 * u), 4.6 * u, lc, 0.85, cx, cy + 11 * u, "center", 70 * u)
    if (pa) text(ctx, track(pa.toUpperCase()), FUT(false, 4.1 * u), 4.1 * u, red ? "#FFB0A0" : GOLD_SOFT, 0.65, cx, cy + 17.5 * u, "center", 70 * u)
  }
}
function quoteLine(ctx, x0, x1, y, u, hex, a, hot) {    // v13: the verse (2 lines max) centred on y
  verseBlock(ctx, x0, x1, y - 13 * u, y + 11 * u, u, hex, a, hot, 2, 6, 4.6)
}
function panelQuest(ctx, W, H, u) {
  if (PANEL === "A") return panelQuestA(ctx, W, H, u)
  if (PANEL === "B") return panelQuestB(ctx, W, H, u)
  const { a: done, n } = questState(), pal = QPAL(n)
  const x0 = 198 * u, x1 = W - 24 * u, nx = 208 * u
  text(ctx, tr("today's quest"), FUT(true, 7.8 * u), 7.8 * u, pal.acc, 1, x0, 23 * u, "left", 130 * u)
  textR(ctx, tr("done"), FUT(false, 5.2 * u), 5.2 * u, SILVER, 0.6, x1, 23.6 * u, 30 * u)
  textR(ctx, `${n}/2`, FUT(true, 11 * u), 11 * u, n ? pal.name : SILVER, n ? 1 : 0.55, x1 - 21 * u, 22.6 * u, 40 * u)
  text(ctx, tr(n === 2 ? "all done · nice work" : n === 0 ? "nothing logged yet" : "keep going"), FUT(false, 4.9 * u), 4.9 * u, SILVER, 0.5, x0, 32.5 * u, "left", 140 * u)
  seg(ctx, x0, 38.5 * u, x1, 38.5 * u, "#FFFFFF", 0.07, 0.5)
  const ys = [0, 1].map((i) => (55 + i * 25) * u)                   // v12: rows tightened to make room for the streak cells
  seg(ctx, nx, ys[0], nx, ys[1], SILVER, 0.14, 1 * u)
  if (done[0] && done[1]) { seg(ctx, nx, ys[0], nx, ys[1], pal.glow, 0.18, 6 * u); seg(ctx, nx, ys[0], nx, ys[1], pal.acc, 0.85, 1.4 * u) }
  QUEST_ROWS.forEach(([cap, label, kind, yes, no], i) => {
    const y = ys[i], d = done[i]
    if (d) { dot(ctx, nx, y, 11 * u, pal.glow, 0.1); dot(ctx, nx, y, 7.6 * u, pal.glow, 0.2); dot(ctx, nx, y, 6.2 * u, pal.done, 1); tick(ctx, nx, y, 5.6 * u, "#08141A", 1, 1.3 * u) }
    else { dot(ctx, nx, y, 6 * u, "#0A0A12", 0.9); strokeEll(ctx, nx, y, 6 * u, SILVER, 0.3, 0.9 * u) }
    questBadge(ctx, kind, 230 * u, y, 9.5 * u, d, pal, u)
    text(ctx, tr(cap), FUT(false, 4.7 * u), 4.7 * u, d ? pal.acc : SILVER, d ? 0.9 : 0.4, 246 * u, y - 5.4 * u, "left", 70 * u)
    text(ctx, label, FUT(false, 9.4 * u), 9.4 * u, d ? pal.name : SILVER, d ? 1 : 0.55, 246 * u, y + 2.8 * u, "left", 80 * u)
    textR(ctx, tr(d ? yes : no), FUT(true, 5.2 * u), 5.2 * u, d ? pal.acc : SILVER, d ? 0.95 : 0.4, x1, y, 56 * u)
  })
  questBar(ctx, x0, x1, 98 * u, u, done, pal)
  panelStreaks(ctx, x0, x1, 116.5 * u, u)
  seg(ctx, x0, 138 * u, x1, 138 * u, "#FFFFFF", 0.07, 0.5)
  quoteLine(ctx, x0, x1, 151 * u, u, SILVER, 0.82, pal.acc)
}
// v12 medium: the streak cells (flame · number · label, same aligned statRow) sit in the right panel, split by a fading hairline
function panelStreaks(ctx, x0, x1, y, u) {
  const s = LIVE.streaks; if (!s) return
  const cx = (x0 + x1) / 2, a0 = y - 9 * u, a1 = y + 15 * u, n = 10
  for (let i = 0; i < n; i++) { const f = 1 - Math.abs((i + 0.5) / n * 2 - 1); seg(ctx, cx, a0 + (a1 - a0) * i / n, cx, a0 + (a1 - a0) * (i + 1) / n, "#FFFFFF", 0.03 + 0.11 * f, 0.5) }
  statRow(ctx, s, cx, y, 48 * u, u, true)
}
// small strip when no chaos locks: the divider doubles as the progress bar; chips carry the same flames
// v10 small quest strip: the 2 streak cells above already carry each quest's done mark; this adds a quiet label + a 2-segment bar,
// all inset inside the glass panel (panel = W/2 ± 75u, content = W/2 ± 66u) so nothing can sit near the widget's edge
function stripQuest(ctx, W, H, u) {
  const { a: done, n } = questState(), pal = QPAL(n), x0 = W / 2 - 66 * u, x1 = W / 2 + 66 * u
  text(ctx, tr("today's quest"), FUT(false, 4.4 * u), 4.4 * u, SILVER, 0.5, x0, 150 * u, "left", 80 * u)
  textR(ctx, `${n}/2`, FUT(false, 5.2 * u), 5.2 * u, n ? pal.name : SILVER, n ? 0.66 : 0.4, x1, 150 * u, 30 * u)
  questBar(ctx, x0, x1, 157.5 * u, u, done, pal)
}
// one segment per quest (Train | Cook), each lit when that quest is done
function questBar(ctx, x0, x1, y, u, done, pal) {
  const g = 3 * u, h = 2.6 * u, w = (x1 - x0 - g) / 2
  done.forEach((d, i) => {
    const x = x0 + i * (w + g)
    if (d) { glowRR(ctx, x, y - h / 2, w, h, h / 2, pal.glow, 0.6, 2.2 * u); fillPath(ctx, rrPath(x, y - h / 2, w, h, h / 2), pal.acc, 0.95); seg(ctx, x + h, y - h * 0.22, x + w - h, y - h * 0.22, "#FFFFFF", 0.28, 0.5 * u) }
    else fillPath(ctx, rrPath(x, y - h / 2, w, h, h / 2), SILVER, 0.13)
  })
}
// the same round badge for Train and Cook: dark disc + ring (bright when done, dim when not) + the quest icon
function questBadge(ctx, kind, x, y, r, d, pal, u) {
  if (d) dot(ctx, x, y, r * 1.55, pal.glow, 0.12)
  dot(ctx, x, y, r, "#0A0D14", 0.88)
  strokeEll(ctx, x, y, r, d ? pal.acc : SILVER, d ? 0.95 : 0.26, (d ? 0.9 : 0.6) * u * Math.max(1, r / (6 * u)))
  questIcon(ctx, kind, x, y - (kind === "cook" ? r * 0.12 : 0), r * 1.22, d, pal)
}
// cell label: [badge] TRAIN ✓   (not done: dim ring + a dim dot)
function questLabel(ctx, kind, label, x, yc, u, d, pal) {      // [badge][label] centred on x by measured width; ✓ / dot trails outside the centring
  const fz = 5.2 * u, r = 4.4 * u, gp = 2.2 * u, tw = (LABEL_EM[label] || label.length * 0.6) * fz
  const left = x - (2 * r + gp + tw) / 2, tx = left + 2 * r + gp
  questBadge(ctx, kind, left + r, yc, r, d, pal, u)
  text(ctx, track(label), FUT(false, fz), fz, d ? pal.name : SILVER, d ? 0.85 : 0.5, tx + tw / 2, yc + 0.245 * fz, "center", tw + 10 * u)
  if (d) tick(ctx, tx + tw + gp + 1.8 * u, yc, 3.6 * u, pal.acc, 1, 0.9 * u)
  else dot(ctx, tx + tw + gp + 1 * u, yc, 0.9 * u, SILVER, 0.35)
}

// built-in galaxy: drawn once from a fixed seed (no flicker), cached as a PNG in Documents
function galaxyPath(W, H) { return fm.joinPath(fm.documentsDirectory(), `grok-fitness-galaxy-v1-${GALAXY_SEED}-${Math.round(W)}x${Math.round(H)}.png`) }
function galaxyImage(W, H) {
  const p = galaxyPath(W, H)
  if (fm.fileExists(p)) return fm.readImage(p)
  const ctx = new DrawContext()
  ctx.size = new Size(W, H); ctx.opaque = true; ctx.respectScreenScale = true
  drawGalaxy(ctx, W, H)
  const img = ctx.getImage()
  try { fm.writeImage(p, img) } catch (e) {}
  return img
}
function drawGalaxy(ctx, W, H) {
  const r = rng(GALAXY_SEED), u = H / 170
  ctx.setFillColor(new Color("#030306")); ctx.fillRect(new Rect(0, 0, W, H))
  // very faint violet / indigo haze near the edges, one warm wisp
  const haze = [[0.0, 0.95, "#3A2466"], [1.0, 0.08, "#2E2258"], [0.95, 1.0, "#2A1C4A"], [0.02, 0.12, "#22183C"]]
  for (const [hx, hy, c] of haze) for (let i = 0; i < 6; i++)
    dot(ctx, W * hx + (r() - 0.5) * 24 * u, H * hy + (r() - 0.5) * 24 * u, (62 - i * 8) * u, c, 0.026)
  for (let i = 0; i < 3; i++) dot(ctx, W * 0.86, H * 0.62, (34 - i * 9) * u, "#3A2418", 0.022)
  // dust of tiny soft stars, varied brightness
  const tints = ["#FFFFFF", "#FFFFFF", "#F6F4EE", "#FFEBD2", "#E2E8FF"]
  for (let i = 0; i < 280; i++) {
    const x = r() * W, y = r() * H, sz = r(), tint = tints[Math.floor(r() * tints.length)]
    const rad = (0.16 + Math.pow(sz, 4) * 0.72) * u, a = 0.08 + Math.pow(r(), 1.7) * 0.62
    if (rad > 0.5 * u) dot(ctx, x, y, rad * 3, tint, a * 0.1)
    dot(ctx, x, y, rad, tint, a)
  }
  // a few faint warm orange / gold stars
  for (let i = 0; i < 5; i++) {
    const x = (0.06 + r() * 0.88) * W, y = (0.05 + r() * 0.9) * H, c = i % 2 ? "#FFB46A" : "#FFD58A"
    dot(ctx, x, y, 3.4 * u, c, 0.045); dot(ctx, x, y, 1.4 * u, c, 0.12); dot(ctx, x, y, 0.55 * u, c, 0.85)
  }
  // soft vignette: stacked dark discs on each corner (no seams), corners blend into the icon grid
  for (const [vx, vy] of [[0, 0], [W, 0], [0, H], [W, H]])
    for (let i = 0; i < 6; i++) dot(ctx, vx, vy, (70 - i * 10) * u, "#000000", 0.07)
}
// v10: the real widget size in points. v9 always drew a 170pt (or 360x170) picture; on phones whose widgets are smaller or larger
// (155 / 158 / 162 / 164 / 169 / 176pt …) iOS scales-to-fill and crops that picture, so the left-anchored bottom strip got cut.
// Keys are the screen size in portrait points. FITNESS_CONFIG.widgetSize = [small, mediumW] overrides the table (for an unknown phone).
const WIDGET_PT = {
  "440x956": [170, 364], "430x932": [170, 364], "428x926": [170, 364], "414x896": [169, 360], "402x874": [162, 344],
  "393x852": [158, 338], "390x844": [158, 338], "414x736": [159, 348], "375x812": [155, 329], "360x780": [155, 329],
  "375x667": [148, 321], "320x568": [141, 292],
}
const WIDGET_PT_26 = { "440x956": [176.7, 377.3], "430x932": [170, 364], "402x874": [170, 364] }   // iOS 26 grew the Pro Max widgets
function widgetSize(family) {
  let sm = 170, md = 360
  try {
    const o = CFG.widgetSize
    if (Array.isArray(o) && o[0] > 100) { sm = Number(o[0]); md = Number(o[1]) || Math.round(sm * 2.14) }
    else {
      const z = Device.screenSize(), k = `${Math.round(Math.min(z.width, z.height))}x${Math.round(Math.max(z.width, z.height))}`
      const v26 = parseInt(String(Device.systemVersion ? Device.systemVersion() : "0"), 10) >= 26
      const hit = (v26 && WIDGET_PT_26[k]) || WIDGET_PT[k]
      if (hit) { sm = hit[0]; md = hit[1] }
    }
  } catch (e) {}
  return family === "medium" ? [md, sm] : [sm, sm]
}
async function buildWidget(fam) {
  const { s, source } = await loadStats()
  const family = (fam || config.widgetFamily) === "small" || !(fam || config.widgetFamily) ? "small" : "medium"   // large falls back to the medium layout
  const [W, H] = widgetSize(family), bg = null                       // v10: drawn at the phone's real widget size (see widgetSize)

  const CS = String(s.chaosState || "clear").toLowerCase().trim()
  const state = ["gold", "diamond", "prismatic"].includes(CS) ? CS : "clear"
  const lock = state === "clear" ? 0 : clamp(Math.round(Number(s.chaosCover) || CPAL[state].lock), 1, 5)
  const tiers = String(s.chaosTierNames || "").split("|").map((x) => x.trim()).filter(Boolean)
  if (tiers.length === 5) CHAOS_TIERS = tiers
  LIVE.chaos = { state, family, variant: 1, lock }
  LIVE.quest = { train: Number(s.trainToday) > 0, cook: Number(s.cookToday) > 0 }
  LIVE.reason = { xp: clamp(s.xpNeed > 0 ? s.xpIn / s.xpNeed : 0, 0, 1), cleansed: Math.max(0, Math.floor(Number(s.cleansedMedals) || 0)) }
  LIVE.sky = {}
  LIVE.flare = 0
  try { LIVE.flare = milestoneFlare(medalTotal(s), source) } catch (e) { LIVE.flare = 0 }   // never let storage break the widget
  const w = new ListWidget()
  w.setPadding(0, 0, 0, 0)
  w.backgroundImage = render(W, H, bg, s, source)
  if (TAP_URL) w.url = TAP_URL
  w.refreshAfterDate = new Date(now.getTime() + FETCH_MINUTES * 60000)
  return w
}

// ---------------- background setup ----------------
const PHONES = {
  "2868": [
    ["iOS 26 · icons with labels", { small: 530, medium: 1132, left: 94, right: 696, top: 297, middle: 933, bottom: 1569 }],
    ["iOS 18 · icons with labels", { small: 510, medium: 1092, left: 114, right: 696, top: 276, middle: 912, bottom: 1548 }],
    ["iOS 18 · large icons, no labels", { small: 530, medium: 1138, left: 91, right: 699, top: 276, middle: 882, bottom: 1488 }]],
  "2796": [
    ["Icons with labels", { small: 510, medium: 1092, left: 98, right: 681, top: 252, middle: 888, bottom: 1524 }],
    ["Large icons, no labels", { small: 530, medium: 1139, left: 75, right: 684, top: 252, middle: 858, bottom: 1464 }]],
  "2622": [
    ["Icons with labels", { small: 486, medium: 1032, left: 87, right: 633, top: 261, middle: 872, bottom: 1485 }],
    ["Large icons, no labels", { small: 495, medium: 1037, left: 84, right: 626, top: 270, middle: 810, bottom: 1350 }]],
  "2556": [
    ["Icons with labels", { small: 474, medium: 1017, left: 81, right: 624, top: 240, middle: 828, bottom: 1416 }],
    ["Large icons, no labels", { small: 495, medium: 1047, left: 66, right: 618, top: 243, middle: 795, bottom: 1347 }]],
  "2778": [["Default", { small: 510, medium: 1092, left: 96, right: 678, top: 246, middle: 882, bottom: 1518 }]],
  "2688": [["Default", { small: 507, medium: 1080, left: 81, right: 654, top: 228, middle: 858, bottom: 1488 }]],
  "2532": [["Default", { small: 474, medium: 1014, left: 78, right: 618, top: 231, middle: 819, bottom: 1407 }]],
  "2436": [
    ["iPhone X / XS / 11 Pro", { small: 465, medium: 987, left: 69, right: 591, top: 213, middle: 783, bottom: 1353 }],
    ["iPhone 12 / 13 mini", { small: 465, medium: 987, left: 69, right: 591, top: 231, middle: 801, bottom: 1371 }]],
  "1792": [["Default", { small: 338, medium: 720, left: 55, right: 437, top: 159, middle: 579, bottom: 999 }]],
  "1334": [
    ["Icons with labels", { small: 296, medium: 642, left: 54, right: 400, top: 60, middle: 412, bottom: 764 }],
    ["Large icons, no labels", { small: 309, medium: 667, left: 41, right: 399, top: 67, middle: 425, bottom: 783 }]],
}

async function choose(title, message, options) {
  const a = new Alert()
  a.title = title
  a.message = message
  options.forEach((o) => a.addAction(o))
  a.addCancelAction("Cancel")
  const i = await a.presentSheet()
  return i < 0 ? null : i
}
async function notice(title, message) {
  const a = new Alert()
  a.title = title
  a.message = message
  a.addAction("OK")
  await a.presentAlert()
}

async function setupBackground() {
  const go = await choose("Background setup",
    "1. Long-press your home screen and swipe to an empty page.\n2. Take a screenshot.\n3. Come back here and pick it.",
    ["Pick screenshot"])
  if (go === null) return false
  const shot = await Photos.fromLibrary()
  const variants = PHONES[String(Math.round(shot.size.height))]
  if (!variants) {
    await notice("Not supported", "That doesn't look like a full iPhone screenshot from a supported model. The widget will use its own star background.")
    return false
  }
  let v = 0
  if (variants.length > 1) {
    v = await choose("Your home screen", "Which matches your phone?", variants.map((x) => x[0]))
    if (v === null) return false
  }
  const p = variants[v][1]
  const size = 0                                   // this widget is small only
  let crop
  if (size === 0) {
    const pos = ["Top left", "Top right", "Middle left", "Middle right", "Bottom left", "Bottom right"]
    const i = await choose("Widget position", "Where will the small widget sit?", pos)
    if (i === null) return false
    const [row, side] = pos[i].toLowerCase().split(" ")
    crop = { x: p[side], y: p[row], w: p.small, h: p.small }
  } else {
    const pos = ["Top", "Middle", "Bottom"]
    const i = await choose("Widget position", "Where will the medium widget sit?", pos)
    if (i === null) return false
    crop = { x: p.left, y: p[pos[i].toLowerCase()], w: p.medium, h: p.small }
  }
  const ctx = new DrawContext()
  ctx.size = new Size(crop.w, crop.h)
  ctx.respectScreenScale = false
  ctx.drawImageAtPoint(shot, new Point(-(crop.x + CROP_NUDGE.x), -(crop.y + CROP_NUDGE.y)))
  const fam = size === 0 ? "small" : "medium"
  fm.writeImage(bgPath(fam), ctx.getImage())
  return fam
}

// ---------------- run ----------------
async function runInApp() {
  const galaxy = BG_MODE === "galaxy"
  if (!galaxy && !fm.fileExists(bgPath("small"))) await setupBackground()
  else {
    const i = await choose("Fitness Quest", "", ["Preview small", "Preview medium", "Refresh stats now"])
    if (i === null) return
    if (i === 2 && fm.fileExists(cachePath)) fm.remove(cachePath)
    if (i === 1) { const wm = await buildWidget("medium"); await wm.presentMedium(); return }
    const ws = await buildWidget("small"); await ws.presentSmall(); return
    if (i === 1 && galaxy && fm.fileExists(galaxyPath(170, 170))) fm.remove(galaxyPath(170, 170))
    if (i === 1 && !galaxy) await setupBackground()
    if (i === 2 && fm.fileExists(cachePath)) fm.remove(cachePath)
  }
  const w = await buildWidget()
  await w.presentSmall()
}

if (config.runsInWidget) Script.setWidget(await buildWidget())
else await runInApp()
Script.complete()
