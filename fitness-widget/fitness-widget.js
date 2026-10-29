// Mister 14 · Fitness Quest widget · v11 (aligned stat cells: flame + number + label on one axis; real widget size + inset quest panel, clear star tiers; badges + medals build the Milky Way, 8 realistic astrophotography star designs per tier + realistic chaos looks, random-but-stable, twinkle + milestone flare: no medals = dark sky; Train | Cook bar, chaos blood theme)
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
    const f = (i + 0.5 + r() * 0.5) / n, ex = x + (r() - 0.5) * h * (0.7 + mains.length * 0.12), ey = b - h * (1.08 + f * (big ? 0.5 : 0.17)) - r() * h * 0.05, sz = h * (0.026 + r() * 0.026) * (1 - f * 0.4)
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
const NUM = { fz: 11.5, cap: 0.69, capOff: 0.245, slot: 0.56, ink: 0.47 }
const LABEL_EM = { TRAIN: 3.0, COOK: 3.0 }
// measured flame ink (in units of fire()'s h): visible top above the base, and visible width, per flame tier
const FL_TOP = (t) => t <= 3 ? 0.78 : t <= 16 ? 1.2 : 1.55
const FL_W = (t) => t <= 2 ? 0.32 : t === 3 ? 0.5 : t <= 9 ? 0.68 : t <= 11 ? 0.84 : 1.13
function digitsAt(ctx, str, t, x0, yc, u) {                     // draw str left-to-right in tabular slots; x0 = left ink edge, yc = cap centre
  const fz = NUM.fz * u, sl = NUM.slot * fz, y = yc + NUM.capOff * fz
  const f = t >= 8 ? FUT(true, fz) : FUT(false, fz), hex = t >= 6 ? GOLD_BRIGHT : t >= 3 ? GOLD : GOLD_SOFT
  str.split("").forEach((ch, i) => {
    const x = x0 + NUM.ink * fz / 2 + i * sl
    if (t >= 6) glowText(ctx, ch, f, fz, hex, x, y, "center", t >= 8 ? 1.6 : 1)
    else text(ctx, ch, f, fz, hex, 0.97, x, y, "center", 40 * u)
  })
}
const numInkW = (str, u) => ((str.length - 1) * NUM.slot + NUM.ink) * NUM.fz * u
function statRow(ctx, s, cx, y, gap, u) {
  const yc = y - 1.5 * u, capH = NUM.cap * NUM.fz * u, ly = yc + 11.5 * u   // number cap centre, label cap centre
  const items = [["train", s.exercise, "TRAIN"], ["cook", s.cooking, "COOK"]]
  const q = LIVE.quest ? questState() : null
  items.forEach(([kind, v, label], i) => {
    const x = cx + (i ? 0.75 : -0.75) * gap, T = flameTier(v), str = String(v)
    const top = FL_TOP(T), vis = capH * (1 + 0.025 * Math.min(T, 14)), h = vis / top, fw = FL_W(T) * h, gp = 3.5 * u
    const left = x - (fw + gp + numInkW(str, u)) / 2
    fire(ctx, left + fw / 2, yc + vis / 2, h, kind, T, (v * 7 + (kind === "train" ? 1 : 2)) + fireSeed(), v > 0)
    digitsAt(ctx, str, T >= 18 ? 8 : T >= 10 ? 6 : T >= 4 ? 3 : 0, left + fw + gp, yc, u)
    if (q) questLabel(ctx, kind, label, x, ly, u, q.a[i], QPAL(q.n))
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
function xpLabels(ctx, s, cx, cy, u, pct, CMP, red, LT) {   // centre of the ring: total XP (large) · LEVEL N · "64% to Lvl 10" · "+0.010% p.a." (the ring is the progress)
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
    const cx = MED ? 85 * u : W / 2, cy = (CMP ? 50 : 66) * u, R = (CMP ? 32 : 41) * u
    drawStars(ctx, W, H, SKY() ? 0 : bg ? 18 : 50, { x: cx, y: cy, R: R * 1.15 })
    let LT = levelTier(s.level); if (CH && CH.state === "prismatic") LT = { ...LT, pal: even("#7A0A16", "#C4202E", "#FF5A4A", "#E8A090", "#9A1020"), tip: "#FFB0A0", text: "#FF9A8A", glow: 0.12 }
    const RED = !!(CH && CH.state === "prismatic"), top = LT === LEVEL_TIERS[LEVEL_TIERS.length - 1], XS = XPS()
    if (XS === "bar") {
      xpBar(ctx, W, H, u, s, pct, RED, CMP)
      if (!CMP) text(ctx, track(fmtSavings(s.savings)), FUT(false, 5.6 * u), 5.6 * u, GOLD_SOFT, 0.62, cx, 128 * u, "center", W)
      else text(ctx, track(fmtSavings(s.savings)), FUT(false, 5.6 * u), 5.6 * u, GOLD_SOFT, 0.62, cx, 106 * u, "center", W)
    } else {
    if (XP_RING === "comet") for (let i = 0; i < 36; i++) {                                   // faint tick marks, like a star dial
      const a = i / 36 * Math.PI * 2, r0 = R + 4.5 * u, r1 = R + (i % 9 === 0 ? 7.5 : 5.8) * u
      seg(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, i % 9 === 0 ? GOLD : SILVER, i % 9 === 0 ? 0.45 : 0.16, 0.5)
    }
    if (top) {                                                       // max level: gold halo + crystal sparkles
      arcStroke(ctx, cx, cy, R + 10 * u, Math.PI * 0.72, Math.PI * 2.28, GOLD_SOFT, 0.4, 0.6)   // open at the bottom, clear of "Level N"
    }
    for (let i = 1; i <= 5; i++) (XP_RING === "comet" ? (r, h, al, w) => arcStroke(ctx, cx, cy, r, 0, Math.PI * 2, h, al, w) : (r, h, al, w) => ringStroke(ctx, cx, cy, r, h, al, w))(R - (2.6 + i * 1.5) * u, "#000000", 0.13 * (1 - i / 6), 1.7 * u)   // soft inner shadow
    if (XP_RING === "comet") arcStroke(ctx, cx, cy, R + 3.4 * u, 0, Math.PI * 2, "#FFFFFF", 0.07, 0.45)                  // hairline outer ring
    if (XP_RING === "comet") for (let i = 0; i < 60; i++) {                                    // tiny inner tick marks
      const a = i / 60 * Math.PI * 2, r0 = R - 5.4 * u, r1 = R - (i % 5 ? 6.5 : 7.6) * u
      seg(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, "#FFFFFF", i % 5 ? 0.09 : 0.2, 0.4)
    }
    const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * pct
    if (XP_RING === "halo") ringHalo(ctx, cx, cy, R, u, pct, RED)
    else xpOrbit(ctx, cx, cy, R, u, pct, RED, XS)
    if (top) {
      const cr = ["#CFE0FA", "#D9CCF5", "#F3F4FA", "#FFE3A3"]
      ;[-60, 0, 35, 145, 180, 240].forEach((deg, i) => {
        const a = deg * Math.PI / 180, rr = R + 10 * u
        lozenge(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.3 * u, 2.6 * u, cr[i % 4], 0.95)
      })
      twinkle(ctx, cx - R * 0.95, cy - R * 0.95, 4.5 * u, 0.9); twinkle(ctx, cx + R * 1.0, cy + R * 0.9, 3.5 * u, 0.8)
    }
    if (XS === "planet") { const hr = R + 15 * u, hxx = cx + Math.cos(a1) * hr, hyy = cy + Math.sin(a1) * hr; xpChip(ctx, hxx, hyy, `${Math.round(pct * 100)}%`, u, RED) }
    xpLabels(ctx, s, cx, cy, u, pct, CMP, RED, LT)
    if (false) {   // v3: the level now sits inside the ring
      const ly = (CMP ? 97 : 120) * u, nd = String(s.level).length, gw = 22 * u + 4.5 * u + nd * 8.6 * u, lx = cx - gw / 2
      text(ctx, track("LEVEL"), FUT(false, 6.6 * u), 6.6 * u, LT.text, 0.8, lx, ly + 2.6 * u, "left", 40 * u)
      glowText(ctx, String(s.level), FUT(true, 14.5 * u), 14.5 * u, LT.text, lx + 26.5 * u + nd * 4.3 * u, ly, "center", top ? 1.4 : 0.8)
    }
    // v3: no next-rank row; the p.a. rate now sits inside the ring
    }
    const sgap = (MED ? 46 : 50) * u
    statPanel(ctx, cx, sgap, (CMP ? 112.5 : 137.5) * u, H - 4 * u, u)
    statRow(ctx, s, cx, (CMP ? (CH.lock ? 123 : LIVE.quest ? 127 : 123) : 147.5) * u, sgap, u)
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
    glass(ctx, 184 * u, 12 * u, W - 196 * u, 154 * u, 12 * u, LK ? pal.acc : "#FFFFFF", 1)
    if (LK) glowRR(ctx, 184 * u, 12 * u, W - 196 * u, 154 * u, 12 * u, pal.glow, 0.05, 6 * u)
  }
  if (!LK && LIVE.quest) { (C.family === "medium" ? panelQuest : stripQuest)(ctx, W, H, u); return }
  if (LK && C.family === "medium") { panelRestricted(ctx, W, H, u, pal, LK, st); return }   // chaos: the quest panel becomes the list of what is restricted
  const f = { 1: [panelLadder, strip1], 2: [panelCards, strip2], 3: [panelMeter, strip3] }[v]
  ;(C.family === "medium" ? f[0] : f[1])(ctx, W, H, u, pal, LK, st)
}
// ---- chaos · medium side panel: "Today's quest" is replaced by the restricted list — only the tiers locked right now, in the blood theme ----
function panelRestricted(ctx, W, H, u, pal, LK, st) {
  const x0 = 196 * u, x1 = W - 22 * u, rh = 20 * u, y0 = 44 * u
  text(ctx, tr("restricted"), FUT(true, 8.6 * u), 8.6 * u, pal.acc, 1, x0, 23 * u, "left", 120 * u)
  textR(ctx, `${LK} / 5`, FUT(true, 8.6 * u), 8.6 * u, pal.name, 1, x1, 23 * u, 60 * u)
  text(ctx, tr(`${st} chaos · ${LK > 1 ? `tiers 1–${LK}` : "tier 1"} locked`), FUT(false, 4.9 * u), 4.9 * u, SILVER, 0.62, x0, 33 * u, "left", 140 * u)
  for (let i = 0; i < LK; i++) {
    const y = y0 + i * rh
    fillPath(ctx, rrPath(x0 - 4 * u, y - 8 * u, x1 - x0 + 8 * u, 16 * u, 8 * u), pal.glow, 0.13)
    strokeP(ctx, rrPath(x0 - 4 * u, y - 8 * u, x1 - x0 + 8 * u, 16 * u, 8 * u), pal.acc, 0.4, 0.6 * u)
    dot(ctx, x0 + 5 * u, y, 7 * u, pal.glow, 0.18); lockIcon(ctx, x0 + 5 * u, y, 5.6 * u, pal.name, 1, false)
    text(ctx, CHAOS_TIERS[i], FUT(true, 8.4 * u), 8.4 * u, pal.name, 1, x0 + 15 * u, y + 0.4 * u, "left", 130 * u)
    textR(ctx, tr(`t${i + 1}`), FUT(true, 4.8 * u), 4.8 * u, pal.acc, 0.85, x1, y + 0.4 * u, 20 * u)
  }
  if (LK < 5) {                                                         // the tiers still free, faint, one per line
    let y = y0 + LK * rh - 1 * u
    text(ctx, tr("still free"), FUT(false, 4.4 * u), 4.4 * u, SILVER, 0.42, x0, y, "left", 80 * u)
    for (let i = LK; i < 5 && (y += 10.5 * u) < 143 * u; i++) {
      lockIcon(ctx, x0 + 5 * u, y, 3.8 * u, SILVER, 0.3, true)
      text(ctx, CHAOS_TIERS[i], FUT(false, 6.2 * u), 6.2 * u, SILVER, 0.42, x0 + 15 * u, y + 0.3 * u, "left", 130 * u)
    }
  }
  seg(ctx, x0, 148 * u, x1, 148 * u, "#FFFFFF", 0.07, 0.5)
  quoteLine(ctx, x0, x1, 156 * u, u, pal.name, 0.82, pal.acc)
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
  clear:     { I: 0,    haze: ["#6A4DB8", "#26A69A", "#DCD0FF"], star: ["#FFFFFF", "#F3F5FF", "#FFE9CC", "#D6E2FF"], ember: [], glow: "#7FD6CC", band: 1 },
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
  clear:     { warm: "#F2C47E", rose: "#D8708C", mid: "#8F7AD0", cool: "#4668BE" },
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
const MEDAL_SLOTS = { 100: 9, 10: 9, 1: 9 }             // 9 of each covers 0..999 exactly
const MEDAL_SPECKS = { 100: 20, 10: 10, 1: 5 }
function medalCoins(n) {                                // 133 -> {100:1, 10:3, 1:3}; past 999 the superiors stay at 9 (cap) and the tens/ones show the remainder
  n = Math.max(0, Math.floor(Number(n) || 0))
  return { 100: Math.min(9, Math.floor(n / 100)), 10: Math.floor((n % 100) / 10), 1: n % 10 }
}
// how much Milky Way the medals have built: 0 → plain dark sky, 33 → a band forming, ~130-200 → the full galaxy
const GAL_GROW_K = 70
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
  psf(ctx, x, y, R * 0.85, B(v.band || "#B8B2DC"), 0.05 * pd, 6)                 // unresolved starlight: sits inside the Milky Way band
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
  if (st && Number.isFinite(st.count) && Math.floor(n / 100) > Math.floor(st.count / 100) && n < 1000) flare = { day: today, h: Math.floor(n / 100) }
  try { fm.writeString(milestonePath(), JSON.stringify({ count: n, day: today, flare })) } catch (e) {}
  return flare ? flare.h : 0
}
const fbmRaw = fbm
function drawMilkyWay(ctx, W, H, p, pal, s) {
  const u = H / 170, wide = W > 250
  const PAT = galaxyPattern(galaxyIndex()), r = rng(4242 + PAT.k * 977)
  const fbm = (x, y, s, o) => fbmRaw(x + PAT.ox, y + PAT.oy, s, o)           // a different slice of the noise per pattern: other dust lanes, clumps and clusters
  const kind = (LIVE.chaos && LIVE.chaos.state) || "clear", M = MWPAL[kind] || MWPAL.clear
  const base = wide ? -30 + 38 * PAT.a : -60 + 52 * PAT.a, ang = (base + (0.5 - p) * 16) * Math.PI / 180
  const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx
  const cx = W * (0.5 + (p - 0.5) * 0.06), cy = H * (wide ? 0.5 : 0.46)
  const L = Math.hypot(W, H) * 0.62, sig = (wide ? 17 : 19) * u * (0.82 + 0.44 * PAT.e)
  const wob = (t) => 1 + 0.28 * Math.sin(t / (46 * u)) + 0.12 * Math.sin(t / (17 * u) + 1.3)
  const t0 = -L * (wide ? 0.4 : 0.34) * (0.55 + 0.9 * PAT.f)                                          // galactic core: where the XP light sits
  const bulge = (t) => 0.5 + 0.5 * Math.exp(-Math.pow((t - t0) / (L * 0.46), 2))
  // the spine of the band is an S-curve whose phase drifts slowly through the day (the whole galaxy flows)
  const hr = skyHour(), amp = (3 + 13 * PAT.b) * u, lam = (40 + 62 * PAT.c) * u, ph = PAT.d * 6.283 + 1.4 * Math.sin(hr * 0.2618)
  const spine = (t) => amp * (Math.sin(t / lam + ph) + 0.32 * Math.sin(t / (lam * 0.47) + 2 * ph))
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
  const rcx = 85 * u, rcy = (wide ? 66 : 50) * u, rcr = (wide ? 41 : 32) * u + 3 * u, py = (wide ? 134 : 110) * u
  const blocked = (x, y, m) => Math.hypot(x - rcx, y - rcy) < rcr + m || (y > py - 16 * u - m && (!wide || x < 166 * u)) || x < 3 * u + m || x > W - 3 * u - m || y < 3 * u + m || y > H - 3 * u - m
  const SZ = { 100: 12, 10: 8.5, 1: 5.2 }                                // keep-clear radius per star incl. its speck cluster (u)
  const order = []
  for (const d of MEDAL_DENOMS) for (let i = 0; i < MEDAL_SLOTS[d]; i++) order.push({ d, i })
  const spots = []
  order.forEach((S) => {
  const q = rng(Math.floor(MWH(S.d * 31 + S.i, 37, 919) * 4294967295))
  const sz = SZ[S.d] * u
    let best = null
    for (let tries = 0; tries < 260; tries++) {
    const spread = tries < 120 ? 1 : 1.5                                                   // first along the band's heart, then a little wider
    const t = (q() * 2 - 1) * L * 0.85, g = (q() + q() + q() - 1.5) / 0.5 * 0.55 * spread, off = g * sig * wob(t)
    const [x, y] = at(t, off)
      if (blocked(x, y, sz * 0.45) || (wide && x > 182 * u - sz * 0.6)) continue           // stars stay in the open sky left of the quest glass
    const k = tries < 100 ? 1 : tries < 180 ? 0.8 : 0.6
      if (spots.some((o) => !o.none && Math.hypot(o.x - x, o.y - y) < (o.sz + sz) * 0.62 * k)) continue
      best = { t, off, x, y, sz }; break
    }
    for (let tries = 0; !best && tries < 400; tries++) {                                    // never drop a star: last resort, anywhere clear on the band
    const t = (q() * 2 - 1) * L * 0.95, off = (q() * 2 - 1) * sig * 2.2, [x, y] = at(t, off)
      if (blocked(x, y, sz * 0.25) || (wide && x > 182 * u)) continue
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
    ell(ctx, x, y, s * 2.2, s * 1.25, mixHex(M.cool, M.mid, 0.4 + 0.4 * wm), 0.022 * b * band * mk)
    ell(ctx, x, y, s * 1.4, s * 0.75, mixHex(M.mid, M.rose, wm * 0.7), 0.02 * b * band * mk)
    ell(ctx, x, y, s * 0.8, s * 0.42, mixHex(M.rose, M.warm, wm), 0.02 * b * band * (0.4 + wm) * mk)
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
        ell(ctx, x, y, st * 2.6, st * 2.0, c, 0.0135 * d * band)
        ell(ctx, x, y, st * 1.2, st * 0.95, mixHex(c, "#FFFFFF", 0.18 + 0.3 * cw), 0.026 * d * band * (0.5 + 0.9 * edge))
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
    const hc = teal ? "#3FB9B0" : mixHex("#FF4F7B", "#E2457F", hq())
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
      const fl = S.d === 100 && LIVE.flare && S.i === Math.min(9, LIVE.flare) - 1 ? 1 : 0
      medalCluster(ctx, x, y, u * 1.5, S.d, I, S.d * 1013 + S.i * 37 + 5, 1, tw, Math.atan2(dy, dx), skip, ph0 + flow * 0.5, fl, turned.has(S.d * 100 + S.i) ? chaosVariant(S.d, S.i) : starVariant(S.d, S.i))
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
  const u = H / 170, wide = W > 250
  const pools = wide ? [[85, 74, 78, 82, 0.05], [278, 86, 96, 80, 0.045]] : [[85, 62, 66, 66, 0.05], [85, 150, 90, 38, 0.045]]
  for (const [px, py, rx, ry, a] of pools) for (let i = 0; i < 9; i++) ell(ctx, px * u, py * u, rx * u * (1 - i * 0.09), ry * u * (1 - i * 0.09), "#000000", a)
  const cx = wide ? 85 * u : W / 2, cy = (wide ? 66 : 50) * u, R = (wide ? 41 : 32) * u
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
const QUOTES = [
  "Start small. Start today.",
  "One more rep beats one more excuse.",
  "Progress loves a steady hand.",
  "You are one session from a better mood.",
  "Show up first. Motivation follows.",
  "Today's effort is tomorrow's strength.",
  "Be the person your future self thanks.",
  "Small wins stack into big change.",
  "The hardest part is lacing up.",
  "Do it tired. Do it anyway.",
  "Every streak began with day one.",
  "Momentum is built, not found.",
  "Keep the promise you made to yourself.",
  "Make today count, even a little.",
  "Slow progress is still progress.",
  "You don't need perfect, just next.",
  "Your only rival is yesterday's you.",
  "Move now, feel proud later.",
  "Comfort is quiet. Growth is loud.",
  "Another day, another chance to rise.",
  "Push a little past easy.",
  "Believe it, then earn it.",
  "Great things come in daily doses.",
  "The work will not do itself.",
  "Aim higher than your excuses.",
  "Today is a clean page. Write on it.",
  "Begin before you feel ready.",
  "Strong is a decision, made daily.",
  "Go the extra mile. It's less crowded.",
  "Keep going. The view improves.",
  "You've survived worse than a workout.",
  "Turn the spark into a flame.",
  "Win the morning, shape the day.",
  "Effort never goes to waste.",
  "Chase the version of you who finished.",
  "Be stubborn about your goals.",
  "Let the sweat tell the story.",
  "Your body hears what your mind says.",
  "Keep climbing, one step at a time.",
  "Dream big, act now.",
  "Don't wait for a sign. This is it.",
  "Make it happen, not just wish.",
  "Hard now, easy later.",
  "The only bad workout is the skipped one.",
  "Build the life you keep imagining.",
  "Be relentless about small things.",
  "Quit quitting.",
  "Doubt dies when you take action.",
  "You are stronger than this moment.",
  "Reach for the next small milestone.",
  "Earn your rest.",
  "Courage is taking the first step.",
  "Light the fire. Keep it burning.",
  "Today, outwork your doubts.",
  "Rise with purpose.",
  "Keep your eyes on the climb.",
  "Grit turns plans into proof.",
  "You have done hard things before.",
  "Take the step you've been avoiding.",
  "Make future you proud.",
  "Effort now, freedom later.",
  "The comeback starts with showing up.",
  "Fuel the fire, don't fear it.",
  "Be proud of every attempt.",
  "Let your habits do the heavy lifting.",
  "Fortune favours the consistent.",
  "No shortcuts, only stairs.",
  "Run your own race.",
  "Do something today you'll be proud of.",
  "Make a move. Any move.",
  "Dare to be a little better today.",
  "Stay hungry for growth.",
  "Be unstoppable in small ways.",
  "Every rep is a vote for who you become.",
  "Lift the bar, lift the mood.",
  "Champions repeat the basics.",
  "A little each day goes a long way.",
  "Raise your standards, then meet them.",
  "Trust the process.",
  "Sweat now, shine later.",
  "Stay in the game.",
  "The best project is you.",
  "Rewrite your limits.",
  "Your streak is your story.",
  "Dig deep. There's more in you.",
  "Success is a pile of ordinary days.",
  "Prove yourself right.",
  "Stand taller after every effort.",
  "Rise, grind, repeat.",
  "Be bold enough to begin again.",
  "Make your effort impossible to ignore.",
  "The finish line loves finishers.",
  "Today's pain is tomorrow's power.",
  "Keep the flame small and daily.",
  "Leave nothing for the what-ifs.",
  "Clear the doubt, clear the goal.",
  "You can, so do.",
  "Nothing changes if nothing moves.",
  "Be a little braver than yesterday.",
  "Turn \"someday\" into today.",
  "Hustle gently, finish proudly.",
  "Pace yourself. Just don't stop.",
  "Get after it.",
  "Aim, move, repeat.",
  "Every sunrise offers a new start.",
  "Hold the line. It's working.",
  "Keep your word to your goals.",
  "Great days start with one choice.",
  "Make progress your habit.",
  "Level up a little today.",
  "You're closer than you think.",
  "Fight for the person you're becoming.",
  "Make this one count.",
  "Gather your will and go.",
  "Your body keeps score of kindness.",
  "Sleep is training too.",
  "Drink water. Thank yourself later.",
  "Move daily, think clearer.",
  "Rest is part of the plan.",
  "Real food, real energy.",
  "A walk resets the whole day.",
  "Strong body, calm mind.",
  "Health is the quiet kind of wealth.",
  "Stretch like you mean it.",
  "Breathe in slowly. Let go slowly.",
  "Fuel well. Move often.",
  "Your heart works for you all day.",
  "Eat the colours of the rainbow.",
  "Take care of the only body you get.",
  "Healthy habits are small and daily.",
  "Sunlight and a stroll. Simple medicine.",
  "Listen to your body before it shouts.",
  "Be gentle on days that need it.",
  "Good sleep, good tomorrow.",
  "Strong legs carry a strong life.",
  "Cook it fresh, feel it fast.",
  "Hydrate, then conquer.",
  "Energy is earned, not found.",
  "Treat your body like a good friend.",
  "Recovery is where strength grows.",
  "A full plate of vegetables never hurt.",
  "Posture up, spirits up.",
  "Your lungs love a brisk walk.",
  "Wellness is a daily practice.",
  "Nourish first, indulge second.",
  "Mind your sleep, mind your mood.",
  "Health compounds like interest.",
  "Be fit enough to enjoy your life.",
  "Eat slowly. Taste everything.",
  "Take the stairs. Own the day.",
  "A strong core steadies everything.",
  "Care for your joints, they carry you.",
  "Rest well so you can go hard.",
  "Salad today, strength tomorrow.",
  "Choose the meal your body will thank.",
  "Stand up. Your back says hello.",
  "Keep moving, keep young.",
  "Feed your brain well.",
  "Breathe. You are doing fine.",
  "Cooking at home is self-care.",
  "Wake your body gently.",
  "Wellness begins on the plate.",
  "Healthy is the new rich.",
  "Go outside. Fresh air is free.",
  "Fitness is a lifelong friend.",
  "Be kind to your knees.",
  "A calm mind heals a tired body.",
  "Nutrition is a daily love letter.",
  "Tired body? Try a slow stretch.",
  "Eat for energy, not for boredom.",
  "You can't pour from an empty cup.",
  "A little movement lifts a heavy mood.",
  "Honour your rest days.",
  "Strength is built in the kitchen too.",
  "Walk it off, think it through.",
  "Protect your sleep like treasure.",
  "Hydration is the easiest win.",
  "Try one new healthy meal this week.",
  "Your future body is listening.",
  "Let food be your fuel.",
  "Mobility today, freedom tomorrow.",
  "Keep your heart happy and busy.",
  "Healthy is a habit, not a mood.",
  "Make time for movement. It pays back.",
  "Feel your feet on the ground.",
  "A good meal heals more than you think.",
  "Ease into the morning.",
  "The best medicine is consistency.",
  "Choose whole foods most days.",
  "Self-care is not selfish.",
  "A strong body is a gift to your family.",
  "Deep breaths, steady heart.",
  "Sit less. Stand more.",
  "Your energy follows your habits.",
  "Build a body that lasts.",
  "Fresh fruit is the original snack.",
  "Be active, be alive.",
  "Warm up. Cool down. Repeat.",
  "Look after yourself first.",
  "Eat well, laugh often.",
  "Take the long way home.",
  "Nothing beats feeling strong.",
  "Feed your body, free your mind.",
  "Keep a steady, joyful pace.",
  "A healthy day starts with one good choice.",
  "Pay attention to how food feels.",
  "Daily movement is daily medicine.",
  "Rest, refuel, return.",
  "Respect your limits and stretch them.",
  "Your body is your first home.",
  "A good sweat clears the mind.",
  "Slow down. Digest. Enjoy.",
  "Quality sleep is your secret weapon.",
  "Stay curious about what feels good.",
  "A homemade meal is health you can taste.",
  "Look after your gut, it looks after you.",
  "Be strong enough to play.",
  "Water first, coffee second.",
  "Care for your body like a garden.",
  "Strength grows from gentle consistency.",
  "Make wellness a ritual, not a chore.",
  "Today's meal is tomorrow's energy.",
  "Keep your body in motion.",
  "A healthy habit is a quiet victory.",
  "Vitality is built day by day.",
  "Let your body feel capable.",
  "Notice the small good things.",
  "Kindness costs nothing, means everything.",
  "Say thank you, and mean it.",
  "Appreciate the people who show up.",
  "Someone is glad you exist.",
  "Praise someone today.",
  "The simple moments are the big ones.",
  "Look up. The sky is showing off.",
  "Value your time and others'.",
  "Appreciate how far you've come.",
  "Be kind to the one in the mirror.",
  "A kind word travels far.",
  "Cherish ordinary mornings.",
  "Honour the effort, not just the result.",
  "See the good in someone today.",
  "Treasure the people at your table.",
  "Appreciate your own steady work.",
  "A warm meal shared is a gift.",
  "Notice who makes your day lighter.",
  "Say it now. Don't save the kind words.",
  "Give credit freely.",
  "Respect the small steps others take.",
  "Every helper deserves a thank you.",
  "A smile is a free present.",
  "Be someone's good news today.",
  "Enjoy the quiet between things.",
  "Look closely. Beauty hides in plain sight.",
  "Appreciate your body for carrying you.",
  "Thank your hands for all they do.",
  "Compliment generously.",
  "Value the teachers in your life.",
  "Your effort deserves applause.",
  "Slow down to enjoy the view.",
  "Kindness is the best habit.",
  "Notice what's going right.",
  "Honour the work behind every meal.",
  "Pause and soak it in.",
  "Be generous with your praise.",
  "Love the process, not just the prize.",
  "Appreciate the ones who believe in you.",
  "An honest thank you changes a day.",
  "See the effort in everyone around you.",
  "Enjoy this, right where you are.",
  "Let people know they matter.",
  "Respect every journey, including yours.",
  "There's beauty in a job well done.",
  "Appreciate the sound of your own laugh.",
  "Treat every person like they matter.",
  "Thank the day for what it brought.",
  "Be the reason someone smiles.",
  "Notice the helpers, the quiet ones.",
  "Hold your loved ones a little longer.",
  "Love the life you're building.",
  "A grateful eye finds more to see.",
  "Celebrate small progress loudly.",
  "Your presence is a present.",
  "Cherish the ones who cheer for you.",
  "Every effort deserves a nod.",
  "Be present and enjoy the moment.",
  "Give flowers while they can smell them.",
  "Appreciate the ride, bumps and all.",
  "Respect your own pace.",
  "Honour what you have built.",
  "Appreciate the hands that fed you.",
  "Say well done, often.",
  "Learn to love the ordinary.",
  "Make someone feel seen.",
  "A good day is made of kind moments.",
  "Recognise your own courage.",
  "Applaud the small beginnings.",
  "Cherish the calm after effort.",
  "Thank the people who forgave you.",
  "Appreciate a quiet cup of tea.",
  "See the work. Say the thanks.",
  "Admire how much you've grown.",
  "Sunsets are free. Watch one.",
  "Love what's in front of you.",
  "Smile at the stranger. Why not?",
  "The best things are rarely things.",
  "Remember who helped you rise.",
  "Teach others to feel appreciated.",
  "Value what money can't buy.",
  "Look for reasons to be proud.",
  "Respect your effort today.",
  "Share the credit, share the joy.",
  "Take a moment to admire your progress.",
  "Relish the first sip of the morning.",
  "Honour your teachers, past and present.",
  "Be a kind witness to someone's effort.",
  "Treasure your good days.",
  "Enjoy the music in everyday life.",
  "Thank your past self for trying.",
  "Appreciate rain, it makes things grow.",
  "Look kindly on your mistakes.",
  "Notice the care in simple gestures.",
  "Give someone your full attention.",
  "Admire the persistence of a small seed.",
  "Praise sincerely, praise specifically.",
  "The gift of time is the best gift.",
  "Remember to enjoy the win.",
  "Your story deserves a gentle reader.",
  "Keep a soft heart for every effort.",
  "Honour the hands that built your day.",
  "Be thankful for good company.",
  "See the light in someone's work.",
  "A little recognition goes a long way.",
  "Value the journey as much as the goal.",
  "Savour the good stuff.",
  "Appreciate the people who make life easier.",
  "Mark the milestones, however small.",
  "Notice. Smile. Say thanks.",
  "Discipline is choosing what matters most.",
  "Routine beats mood.",
  "Consistency is quiet power.",
  "Habits decide the outcome.",
  "Do it now, not later.",
  "Be disciplined, be free.",
  "Doing it daily changes everything.",
  "Plan the day, then keep the plan.",
  "Reliability starts with small promises.",
  "Say no to the easy yes.",
  "Self-control is strength in disguise.",
  "Every day, the same good choice.",
  "Make it a rule. Make it a habit.",
  "Keep going on the boring days.",
  "Discipline is remembering what you want.",
  "Own your schedule.",
  "The clock rewards the consistent.",
  "Build the habit, trust the habit.",
  "Show up even when it's dull.",
  "You are what you repeatedly do.",
  "Stay on course.",
  "Boundaries protect your goals.",
  "Finish what you start.",
  "Ritual makes it effortless.",
  "Prepare today, thrive tomorrow.",
  "Delay the treat, win the prize.",
  "Focus is a daily decision.",
  "Honour your plan.",
  "Choose long-term over right-now.",
  "Discipline is self-respect in action.",
  "Make the hard choice a habit.",
  "Get up. Get going.",
  "Be early to your own goals.",
  "Practice makes steady.",
  "Simple rules, strong results.",
  "Do what you said you would.",
  "Tidy habits, tidy mind.",
  "Keep the streak alive.",
  "Treat your goals like appointments.",
  "Skip the excuse, take the step.",
  "Structure sets you free.",
  "Order your day, calm your mind.",
  "Repeat the basics until they're automatic.",
  "Discipline is just love for your future.",
  "Reduce the options, increase the action.",
  "Start on time, finish with pride.",
  "A small habit kept beats a big plan broken.",
  "Stay steady.",
  "Keep your standards, always.",
  "Hold the line today.",
  "Delay distraction.",
  "Win the first hour.",
  "One task. Full attention.",
  "Discipline turns wishes into work.",
  "Be consistent, not perfect.",
  "Practise patience.",
  "Lay one brick, then another.",
  "Don't negotiate with your alarm.",
  "The quiet grind pays off.",
  "Take action before you're comfortable.",
  "Say yes to your priorities.",
  "A tidy routine is a gift to yourself.",
  "Make today's task today's task.",
  "Your habits write your future.",
  "Automate the good, avoid the bad.",
  "Do the hard part first.",
  "Be ruthless with your time.",
  "Little by little, day by day.",
  "Follow through.",
  "Keep your feet moving.",
  "Control the controllable.",
  "Be steady when no one's watching.",
  "Trust your routine.",
  "Gain trust by keeping small promises.",
  "Keep it simple, keep it daily.",
  "A schedule is a kindness to your future.",
  "Plan. Act. Review.",
  "Ignore the noise. Do the work.",
  "Discipline: the bridge to your goals.",
  "Stay committed to the plan.",
  "Same time, same place, same effort.",
  "Take pride in the routine.",
  "Follow your own rules.",
  "Commit, then calmly carry on.",
  "Honour the early alarm.",
  "Finish the set. Finish the day.",
  "Choose effort again.",
  "Break big goals into small tasks.",
  "Do less, but do it daily.",
  "Put your goals first on the list.",
  "Keep to the schedule.",
  "Mastery loves repetition.",
  "Never miss twice.",
  "Aim for a streak, not a sprint.",
  "Persist politely.",
  "Discipline makes motivation optional.",
  "Respect the process.",
  "Act on your plan, not your mood.",
  "A steady pace wins.",
  "Be firm with yourself, gentle with others.",
  "Hold yourself to the standard.",
  "Train your will like a muscle.",
  "Reward effort, not just results.",
  "Practice the pause, then proceed.",
  "Push through the dip.",
  "Stick with it.",
  "Stay patient. Stay on task.",
  "Quiet discipline, loud results.",
  "Make your best habit your default.",
  "Keep it going.",
  "Be thankful for this very breath.",
  "Gratitude turns enough into plenty.",
  "Count your blessings, not your problems.",
  "Thank you for today.",
  "Grateful hearts see more light.",
  "Start the day with a thankful thought.",
  "Thankfulness makes ordinary golden.",
  "I am grateful for another chance.",
  "Be grateful for what you can do.",
  "Thankful for health, thankful for home.",
  "A grateful mind is a calm mind.",
  "Find three good things today.",
  "Gratitude is the quiet kind of joy.",
  "Say thanks for the little things.",
  "Be thankful for a body that moves.",
  "Gratitude makes room for happiness.",
  "Thankful for hands that cook and lift.",
  "Be grateful for the challenge, too.",
  "Today I have enough.",
  "Thank your lungs, thank your legs.",
  "Appreciation turns meals into feasts.",
  "Thankful for the people who love me.",
  "A grateful morning shapes the day.",
  "I'm grateful for my progress.",
  "Thanks for the lessons, even the hard ones.",
  "Grateful for sunshine and shade.",
  "Be glad for a fresh start.",
  "Thankful for every sunrise.",
  "Gratitude is a muscle. Train it.",
  "A full heart needs little.",
  "Pause and give thanks.",
  "Thankful for food on the table.",
  "Be grateful you get to try.",
  "Grateful for the strength I have.",
  "Thank you, body, for today.",
  "Feel lucky, feel light.",
  "Gratitude: the best daily habit.",
  "Thankful for another day of effort.",
  "I appreciate what I have.",
  "Gratitude changes your point of view.",
  "There is always something to thank.",
  "Thankful for the quiet moments.",
  "Grateful for laughter and rest.",
  "Be grateful for a roof and a bed.",
  "Thankful for a mind that keeps learning.",
  "Gratitude softens a hard day.",
  "I'm thankful to be here.",
  "Grateful for the road behind me.",
  "Thank the day, then rest.",
  "Thankful for second chances.",
  "Say thank you to your struggles.",
  "Be grateful for small victories.",
  "Grateful for friends who cheer me on.",
  "Today, I choose thankfulness.",
  "Thankful for the gift of movement.",
  "I am blessed with another morning.",
  "Gratitude: seeing what's already here.",
  "Be thankful for the strength to try.",
  "Grateful for good food and good health.",
  "Thanks for being here, you.",
  "Joy grows where gratitude is planted.",
  "Thankful for clean water and warm light.",
  "Grateful for the family I have.",
  "Be thankful for what's working.",
  "Gratitude begins with noticing.",
  "I have so much to be thankful for.",
  "Thankful for this little win.",
  "Gratitude is a way of seeing.",
  "Thank your hands for the work.",
  "Grateful for every step taken.",
  "Be thankful for lessons learned.",
  "Welcome the day with thanks.",
  "I am grateful for my own effort.",
  "Thankful for love, near and far.",
  "Grateful for music, food and friends.",
  "Gratitude brings peace.",
  "Thankful for a body that heals.",
  "Give thanks before you begin.",
  "Grateful for quiet evenings.",
  "Today's blessings are everywhere.",
  "Thankful to have something to work for.",
  "I'm thankful for my habits.",
  "Be grateful for the people who taught you.",
  "Thankful hearts are happy hearts.",
  "Thank your past self for staying.",
  "Grateful for tools, time and trust.",
  "Be thankful you have a tomorrow.",
  "Thank you for the strength I found.",
  "Grateful for the kindness I've received.",
  "Thankful for rain and rainbows.",
  "Gratitude makes today enough.",
  "I am thankful for this moment.",
  "Be grateful for a body you can train.",
  "Thankful for a home to return to.",
  "Gratitude is the best seasoning.",
  "Grateful for gentle mornings.",
  "Thank the small joys by name.",
  "Be thankful for good health today.",
  "Thankful for what I've overcome.",
  "Today I carry gratitude with me.",
  "Grateful for every person who helped.",
  "I am thankful for the chance to grow.",
  "Thankful for how far I've come.",
  "Gratitude warms a cold day.",
  "Grateful for the gift of effort.",
  "Say thanks and keep going.",
  "Be glad you showed up.",
  "Thank the day for being here.",
]
// ---- daily quote: 555 short original lines (motivation · health · appreciation · discipline · gratitude), shuffled, once per day ----
// one seeded permutation (fixed shuffle), indexed by days since 1970: ANY 555 consecutive days show 555 different quotes, and neighbouring days are unrelated
const QUOTE_ORDER = (() => {
  const r = rng(0x5EED555), a = QUOTES.map((_, i) => i)
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t }
  return a
})()
function quoteIndex(date) {
  const n = QUOTES.length, day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000)
  return QUOTE_ORDER[((day % n) + n) % n]
}
const todaysQuote = (date) => QUOTES[quoteIndex(date || skyDate())]
function quoteLine(ctx, x0, x1, y, u, hex, a, hot) {    // one line, left-aligned after a small star; the text frame is one line tall so a long line can only clip, never wrap
  const x = x0 + 2.2 * u
  seg(ctx, x - 2.6 * u, y, x + 2.6 * u, y, hot || SILVER, 0.55, 0.4 * u); seg(ctx, x, y - 2.6 * u, x, y + 2.6 * u, hot || SILVER, 0.55, 0.4 * u); dot(ctx, x, y, 0.8 * u, "#FFFFFF", 0.8)
  text(ctx, todaysQuote(), FUT(false, 5.2 * u), 5.2 * u, hex, a, x0 + 8 * u, y, "left", x1 - x0 - 8 * u)
}
function panelQuest(ctx, W, H, u) {
  const { a: done, n } = questState(), pal = QPAL(n)
  const x0 = 198 * u, x1 = W - 24 * u, nx = 208 * u
  text(ctx, tr("today's quest"), FUT(true, 7.8 * u), 7.8 * u, pal.acc, 1, x0, 24 * u, "left", 130 * u)
  textR(ctx, tr("done"), FUT(false, 5.2 * u), 5.2 * u, SILVER, 0.6, x1, 24.6 * u, 30 * u)
  textR(ctx, `${n}/2`, FUT(true, 11 * u), 11 * u, n ? pal.name : SILVER, n ? 1 : 0.55, x1 - 21 * u, 23.6 * u, 40 * u)
  text(ctx, tr(n === 2 ? "all done · nice work" : n === 0 ? "nothing logged yet" : "keep going"), FUT(false, 4.9 * u), 4.9 * u, SILVER, 0.5, x0, 34.5 * u, "left", 140 * u)
  seg(ctx, x0, 41 * u, x1, 41 * u, "#FFFFFF", 0.07, 0.5)
  const ys = [0, 1].map((i) => (70 + i * 33) * u)
  seg(ctx, nx, ys[0], nx, ys[1], SILVER, 0.14, 1 * u)
  if (done[0] && done[1]) { seg(ctx, nx, ys[0], nx, ys[1], pal.glow, 0.18, 6 * u); seg(ctx, nx, ys[0], nx, ys[1], pal.acc, 0.85, 1.4 * u) }
  QUEST_ROWS.forEach(([cap, label, kind, yes, no], i) => {
    const y = ys[i], d = done[i]
    if (d) { dot(ctx, nx, y, 11 * u, pal.glow, 0.1); dot(ctx, nx, y, 7.6 * u, pal.glow, 0.2); dot(ctx, nx, y, 6.2 * u, pal.done, 1); tick(ctx, nx, y, 5.6 * u, "#08141A", 1, 1.3 * u) }
    else { dot(ctx, nx, y, 6 * u, "#0A0A12", 0.9); strokeEll(ctx, nx, y, 6 * u, SILVER, 0.3, 0.9 * u) }
    questBadge(ctx, kind, 230 * u, y, 10.5 * u, d, pal, u)
    text(ctx, tr(cap), FUT(false, 4.7 * u), 4.7 * u, d ? pal.acc : SILVER, d ? 0.9 : 0.4, 246 * u, y - 5.4 * u, "left", 70 * u)
    text(ctx, label, FUT(false, 9.4 * u), 9.4 * u, d ? pal.name : SILVER, d ? 1 : 0.55, 246 * u, y + 2.8 * u, "left", 80 * u)
    textR(ctx, tr(d ? yes : no), FUT(true, 5.2 * u), 5.2 * u, d ? pal.acc : SILVER, d ? 0.95 : 0.4, x1, y, 56 * u)
  })
  questBar(ctx, x0, x1, 131 * u, u, done, pal)
  seg(ctx, x0, 142 * u, x1, 142 * u, "#FFFFFF", 0.07, 0.5)
  quoteLine(ctx, x0, x1, 154 * u, u, SILVER, 0.78, pal.acc)
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
