// Mister 14 · Fitness Quest widget
// Scriptable · small · built-in galaxy background (BG_MODE = "galaxy", no setup needed)
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
  badges: 48, prismatic: 1, diamond: 0, gold: 0,
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

// ---------------- helpers (shared with the moon widget) ----------------
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)) }
function smooth(t) { return t * t * (3 - 2 * t) }
function rgb(hex) { return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) }
function mixHex(a, b, t) {
  const A = rgb(a), B = rgb(b)
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("")
}
function col(hex, a) { return new Color(hex, a) }
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
    medals: "badges", prismatic: "prismatic", diamond: "diamond", gold: "gold" }
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
  for (const k of ["xp", "level", "xpIn", "xpNeed", "exercise", "cooking", "savings", "badges", "prismatic", "diamond", "gold"])
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
function drawStars(ctx, W, H, count, moon) {
  const r = rng(STAR_SEED)
  const tints = ["#FFFFFF", "#FFFFFF", "#F3F5FF", "#FFE9CC", "#D6E2FF"]
  for (let i = 0; i < count; i++) {
    const x = r() * W, y = r() * H, s = r(), tint = tints[Math.floor(r() * tints.length)]
    let a = 0.12 + r() * 0.4
    const rad = 0.25 + Math.pow(s, 3) * 0.9
    const dm = Math.hypot(x - moon.x, y - moon.y)
    if (dm < moon.R * 1.05) continue
    if (dm < moon.R * 2.6) a *= 0.55 + Math.random() * 0.9  // twinkle near the moon
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
const FLAME_TIERS = [0, 10, 50, 100, 200, 300, 400, 500, 888]
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
// kind: "train" (ember tint) or "cook" (gold tint); tiers 0-3 keep the tint, 4+ share a scheme
// with a white-ice core for TRAIN and a warm gold core for COOK
function streakFlame(ctx, x, y, u, days, kind) {
  const t = flameTier(days), h = FLAME_H[t] * u, train = kind === "train"
  const core = train ? "#F4FAFF" : "#FFF1C4"
  const base = y + 5.5 * u                                           // all tiers stand on the same baseline
  const c = base - h / 2
  switch (t) {
    case 0:                                                          // ember
      dot(ctx, x, base - h * 0.3, h * 0.45, train ? "#C8643A" : "#B8903F", 0.08)
      flameLayer(ctx, x, c, h, train ? "#C8643A" : "#B8903F", 0.85)
      flameLayer(ctx, x, c + h * 0.22, h * 0.45, train ? "#FFB47A" : "#F4D58A", 0.85)
      break
    case 1:                                                          // flame
      flame(ctx, x, c, h, train ? EMBER : GOLD, train ? "#FFE3A3" : "#FFF6DA")
      break
    case 2:                                                          // double flame
      dot(ctx, x, c + h * 0.12, h * 0.6, train ? "#FF6A3A" : "#E0A040", 0.08)
      flameLayer(ctx, x + h * 0.16, c - h * 0.06, h * 1.02, train ? "#E0502E" : "#C98A2E", 0.9)
      flameLayer(ctx, x - h * 0.1, c + h * 0.05, h * 0.86, train ? "#FF9A5A" : GOLD, 0.95)
      flameLayer(ctx, x - h * 0.08, c + h * 0.24, h * 0.44, train ? "#FFE3A3" : "#FFF6DA", 0.95)
      break
    case 3:                                                          // gold flame with sparks
      dot(ctx, x, c + h * 0.1, h * 0.62, GOLD, 0.09)
      flameLayer(ctx, x + h * 0.14, c - h * 0.04, h, train ? "#E9703A" : "#D9A24A", 0.9)
      flameLayer(ctx, x - h * 0.08, c + h * 0.04, h * 0.9, train ? "#FFB347" : GOLD_BRIGHT, 0.97)
      flameLayer(ctx, x - h * 0.06, c + h * 0.22, h * 0.48, "#FFF6DA", 1)
      sparks(ctx, x, c, h, GOLD_BRIGHT, 4, 31 + days % 3)
      break
    case 4:                                                          // blue-hot
      dot(ctx, x, c + h * 0.1, h * 0.62, "#5AA8FF", 0.1)
      flameLayer(ctx, x, c, h, "#3F86FF", 0.95)
      flameLayer(ctx, x, c + h * 0.12, h * 0.72, "#8CC4FF", 0.95)
      flameLayer(ctx, x, c + h * 0.26, h * 0.4, core, 1)
      sparks(ctx, x, c, h, "#CFE6FF", 3, 41)
      break
    case 5:                                                          // violet twin flame
      dot(ctx, x, c + h * 0.1, h * 0.66, "#9B6BFF", 0.1)
      flameLayer(ctx, x - h * 0.2, c + h * 0.06, h * 0.82, "#7A52E0", 0.9)
      flameLayer(ctx, x + h * 0.2, c + h * 0.06, h * 0.82, "#7A52E0", 0.9)
      flameLayer(ctx, x, c - h * 0.04, h, "#B48CFF", 0.95)
      flameLayer(ctx, x, c + h * 0.2, h * 0.5, core, 1)
      sparks(ctx, x, c, h, "#E2D4FF", 4, 53)
      break
    case 6:                                                          // white-gold with aura
      for (let i = 0; i < 3; i++) dot(ctx, x, c + h * 0.08, h * (0.46 + 0.14 * i), GOLD, 0.06)
      flameLayer(ctx, x, c, h, "#FFD774", 0.95)
      flameLayer(ctx, x, c + h * 0.1, h * 0.76, "#FFF0C2", 0.97)
      flameLayer(ctx, x, c + h * 0.26, h * 0.42, "#FFFFFF", 1)
      sparks(ctx, x, c, h, "#FFF6DA", 5, 67)
      break
    case 7:                                                          // prismatic with crystals
      for (let i = 0; i < 3; i++) dot(ctx, x, c + h * 0.08, h * (0.46 + 0.14 * i), i % 2 ? "#C3A6FF" : "#9CC8FF", 0.07)
      flameLayer(ctx, x, c, h, "#9CC8FF", 0.95)
      flameLayer(ctx, x, c + h * 0.08, h * 0.82, "#C3A6FF", 0.95)
      flameLayer(ctx, x, c + h * 0.17, h * 0.62, "#F4E2B0", 0.97)
      flameLayer(ctx, x, c + h * 0.28, h * 0.36, "#FFFFFF", 1)
      lozenge(ctx, x - h * 0.5, c - h * 0.15, h * 0.06, h * 0.12, "#CFE0FA", 0.95)
      lozenge(ctx, x + h * 0.52, c + h * 0.02, h * 0.05, h * 0.1, "#D9CCF5", 0.95)
      lozenge(ctx, x + h * 0.3, c - h * 0.52, h * 0.05, h * 0.1, "#F3F4FA", 0.95)
      break
    default: {                                                       // 888: celestial inferno
      for (let i = 0; i < 3; i++) dot(ctx, x, c + h * 0.05, h * (0.5 + 0.15 * i), i % 2 ? "#C3A6FF" : GOLD, 0.07)
      ctx.setStrokeColor(col(GOLD_SOFT, 0.8)); ctx.setLineWidth(0.6)                         // halo ring
      ctx.strokeEllipse(new Rect(x - h * 0.42, c - h * 0.72, h * 0.84, h * 0.24))
      flameLayer(ctx, x - h * 0.3, c + h * 0.12, h * 0.7, "#7A9CFF", 0.9)                       // side flames
      flameLayer(ctx, x + h * 0.3, c + h * 0.12, h * 0.7, "#A77CFF", 0.9)
      flameLayer(ctx, x, c - h * 0.04, h * 1.04, "#9CC8FF", 0.95)
      flameLayer(ctx, x, c + h * 0.06, h * 0.86, "#C3A6FF", 0.95)
      flameLayer(ctx, x, c + h * 0.16, h * 0.64, GOLD_BRIGHT, 0.97)
      flameLayer(ctx, x, c + h * 0.28, h * 0.36, "#FFFFFF", 1)
      twinkle(ctx, x - h * 0.55, c - h * 0.42, h * 0.2, 1)
      twinkle(ctx, x + h * 0.56, c - h * 0.2, h * 0.15, 0.9)
      lozenge(ctx, x + h * 0.42, c - h * 0.62, h * 0.045, h * 0.09, "#F3F4FA", 0.95)
    }
  }
  return h
}
// stat numbers: gold from tier 3, glowing from tier 6, bright glow at the top tier
function tierNumber(ctx, str, t, x, y, u) {
  const f = Font.mediumSystemFont(10.5 * u)
  if (t >= 8) glowText(ctx, str, Font.semiboldSystemFont(10.5 * u), 10.5 * u, GOLD_BRIGHT, x, y, "left", 2.2)
  else if (t >= 6) glowText(ctx, str, f, 10.5 * u, GOLD_BRIGHT, x, y, "left", 1.4)
  else text(ctx, str, f, 10.5 * u, t >= 3 ? GOLD : GOLD_SOFT, 0.95, x, y, "left", 40)
}
function streakNumber(ctx, v, x, y, u) { tierNumber(ctx, String(v), flameTier(v), x, y, u) }
function badgeNumber(ctx, v, x, y, u) { tierNumber(ctx, String(v), medalTier(v), x, y, u) }
function statRow(ctx, s, cx, y, gap, u) {
  const f = Font.mediumSystemFont(10.5 * u), cap = Font.semiboldSystemFont(5.6 * u)
  const items = [["train", s.exercise, "TRAIN"], ["cook", s.cooking, "COOK"], ["medal", s.badges, "BADGES"]]
  items.forEach(([kind, v, label], i) => {
    const x = cx + (i - 1) * gap, ix = x - 6 * u
    let nx = x + 1.5 * u
    if (kind === "medal") {
      const h = badgeMedal(ctx, ix, y, u, v)
      nx = Math.max(nx, ix + h * (medalTier(v) >= 5 ? 0.52 : 0.42) + 1.2 * u)
      badgeNumber(ctx, v, nx, y + 0.5 * u, u)
    } else {
      const h = streakFlame(ctx, ix, y, u, v, kind)
      nx = Math.max(nx, ix + h * 0.5 + 1.2 * u)
      streakNumber(ctx, v, nx, y + 0.5 * u, u)
    }
    text(ctx, track(label), cap, 5.6 * u, SILVER, 0.42, x + 3 * u, y + 11.5 * u, "center", 60)
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

function render(W, H, bg, s, source) {
  const ctx = new DrawContext()
  ctx.size = new Size(W, H)
  ctx.opaque = true
  ctx.respectScreenScale = true
  if (bg) ctx.drawImageInRect(bg, new Rect(0, 0, W, H))
  else {
    ctx.setFillColor(new Color("#05050B")); ctx.fillRect(new Rect(0, 0, W, H))
    for (let i = 0; i < 10; i++) dot(ctx, W * 0.7, H * 0.3, W * (0.9 - i * 0.07), i % 2 ? "#3A2A6A" : "#1B2A55", 0.035)   // faint nebula
  }
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
    const cx = W / 2, cy = 66 * u, R = 41 * u
    drawStars(ctx, W, H, bg ? 18 : 50, { x: cx, y: cy, R: R * 1.15 })
    for (let i = 0; i < 36; i++) {                                   // faint tick marks, like a star dial
      const a = i / 36 * Math.PI * 2, r0 = R + 4.5 * u, r1 = R + (i % 9 === 0 ? 7.5 : 5.8) * u
      seg(ctx, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, i % 9 === 0 ? GOLD : SILVER, i % 9 === 0 ? 0.45 : 0.16, 0.5)
    }
    const LT = levelTier(s.level), top = LT === LEVEL_TIERS[LEVEL_TIERS.length - 1]
    if (top) {                                                       // max level: gold halo + crystal sparkles
      arcStroke(ctx, cx, cy, R + 10 * u, Math.PI * 0.72, Math.PI * 2.28, GOLD_SOFT, 0.4, 0.6)   // open at the bottom, clear of "Level N"
    }
    prismLine(ctx, arcPts(cx, cy, R, 0, Math.PI * 2, 72), 3 * u, 0, 1, 0.09, LT.pal)     // track
    const a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * pct, n = Math.max(2, Math.ceil(72 * pct))
    if (LT.glow > 0.1) prismLine(ctx, arcPts(cx, cy, R, a0, a1, n), 13 * u, 0, pct, 0.04, LT.pal)   // wide aura
    prismLine(ctx, arcPts(cx, cy, R, a0, a1, n), 8 * u, 0, pct, LT.glow, LT.pal)    // glow
    prismLine(ctx, arcPts(cx, cy, R, a0, a1, n), 3 * u, 0, pct, 1, LT.pal)
    if (top) {
      const cr = ["#CFE0FA", "#D9CCF5", "#F3F4FA", "#FFE3A3"]
      ;[-60, 0, 35, 145, 180, 240].forEach((deg, i) => {
        const a = deg * Math.PI / 180, rr = R + 10 * u
        lozenge(ctx, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.3 * u, 2.6 * u, cr[i % 4], 0.95)
      })
      twinkle(ctx, cx - R * 0.95, cy - R * 0.95, 4.5 * u, 0.9); twinkle(ctx, cx + R * 1.0, cy + R * 0.9, 3.5 * u, 0.8)
    }
    twinkle(ctx, cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, (LT.glow > 0.1 ? 8 : 7) * u, 1, LT.tip)
    text(ctx, track(`TOTAL`), tiny, 6.4 * u, GOLD_SOFT, 0.75, cx, cy - 16 * u, "center")
    glowText(ctx, fmtNum(s.xp), heroF, 24 * u, GOLD, cx, cy + 1 * u, "center", 1.2)
    text(ctx, track(`XP · ${Math.round(pct * 100)}%`), tiny, 6.4 * u, SILVER, 0.55, cx, cy + 18 * u, "center")
    glowText(ctx, `Level ${s.level}`, rankF, 13 * u, LT.text, cx, 120 * u, "center", top ? 1.6 : 1)
    text(ctx, track(fmtSavings(s.savings)), tiny, 6 * u, GOLD_SOFT, 0.7, cx, 131 * u, "center", W)
    statRow(ctx, s, cx, 149 * u, 50 * u, u)
  }
  statusDot(ctx, W, u, source)
  return ctx.getImage()
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
  const r = rng(GALAXY_SEED), u = W / 170
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
  // one tiny faint constellation, top-right
  const pts = [[0.80, 0.06], [0.87, 0.125], [0.935, 0.095], [0.965, 0.185], [0.895, 0.235]].map(([a, b]) => ({ x: a * W, y: b * H }))
  for (let i = 1; i < pts.length; i++) seg(ctx, pts[i - 1].x, pts[i - 1].y, pts[i].x, pts[i].y, "#E8ECF7", 0.14, 0.35 * u)
  pts.forEach((p, i) => { const c = i === 2 ? "#FFD58A" : "#F3F5FF"; dot(ctx, p.x, p.y, 1.6 * u, c, 0.08); dot(ctx, p.x, p.y, 0.55 * u, c, 0.75) })
  // soft vignette: stacked dark discs on each corner (no seams), corners blend into the icon grid
  for (const [vx, vy] of [[0, 0], [W, 0], [0, H], [W, H]])
    for (let i = 0; i < 6; i++) dot(ctx, vx, vy, (70 - i * 10) * u, "#000000", 0.07)
}
async function buildWidget() {
  const { s, source } = await loadStats()
  let bg = null, W = 170, H = 170
  if (BG_MODE === "galaxy") bg = galaxyImage(W, H)
  else if (fm.fileExists(bgPath("small"))) {
    bg = fm.readImage(bgPath("small"))
    const scale = Device.screenScale()
    W = bg.size.width / scale; H = bg.size.height / scale
  }
  const w = new ListWidget()
  w.setPadding(0, 0, 0, 0)
  w.backgroundImage = render(W, H, bg, s, source)
  if (TAP_URL) w.url = TAP_URL
  w.refreshAfterDate = new Date(now.getTime() + FETCH_MINUTES * 60000)
  return w
}

// ---------------- background setup (same as the moon widget) ----------------
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
    const i = await choose("Fitness Quest", "", ["Preview", galaxy ? "Redraw galaxy" : "Reset background", "Refresh stats now"])
    if (i === null) return
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
