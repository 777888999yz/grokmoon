// Grok Reset · Moon + planets widget
// Scriptable · small + medium · "transparent" background cropped from your wallpaper
//
// SETUP (one time): long-press the home screen, swipe to an empty page, take a screenshot.
// Run this script in the Scriptable app and follow the prompts. Then add a Scriptable
// widget to your home screen and choose this script. Run it in-app anytime and pick
// "Reset background" after changing wallpaper or moving the widget.
//
// Widget position measurements: mzeryck's "Widget Blur" tables (iOS 18), plus an iOS 26
// entry for 2868-px screens measured from a real screenshot.

// ===================== CONFIG =====================
const RESET_ANCHOR = "2026-10-28T02:44:00+08:00" // any one known reset time (ISO 8601)
const CYCLE_DAYS = 7                             // resets repeat every N days
const LABEL = ""                                 // starlight-shimmer monogram above the countdown
const STAR_SEED = 2814                           // fixed seed: base stars never move

const CROP_NUDGE = { x: 0, y: 0 }                // px; fine-tune the background crop if it looks offset
const PLANETS = true                             // each weekly reset shows the next body: Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune
const SHOW_LINE = false                          // the thin titanium line under the countdown
const HERO_FONT = ""                             // countdown font: "" = system light, or e.g. "Avenir-Light", "Futura-Medium", "Didot", "Optima-Regular"
const RING_MIN_TILT_DEG = 10                       // Saturn: the real rings are almost edge-on in 2026 (a thin line); this opens them to at least this angle so the ring detail shows (0 = true angle)
const SHOW_NAME = false                          // true brings back the body name under the planet
const EFFECTS = true                            // city lights + aurora on Earth, Sun flares, Jupiter moon shadows, ring shadow, eclipses, reset-hour burst
const FORCE_BODY = ""                           // testing: force one body, e.g. "Jupiter"
const SHOW_SUNSPOTS = false                        // dark spots on the Sun
const FANCY = true                               // extra atmosphere: nebula glow, constellation, sparkles, gold dust (new spots every refresh)
const REAL = true                                // real physics: real rotation speeds, real Moon phase and position, real planet phases seen from Earth (false = the earlier stylised motion)
const SPIN_STEP_DEG = 20                         // planets turn this many degrees every 10 minutes (0 = no spin); 20 means a full turn every 3 hours
const SUN_DIRECTION = true                       // the lit side faces where the Sun is for the time of day: left at 6 am, top at noon, right at 6 pm, bottom at midnight
const DAILY = true                               // one body per day of the 7-day week, in the order of WEEK below (overrides ROTATE_MINUTES)
const WEEK = ["Moon", "Earth", "Mars", "Jupiter", "Saturn", "Pluto", "Sun"]   // day 1 ... day 7 (edit names to change; any of: Moon Mercury Venus Earth Mars Jupiter Saturn Uranus Neptune Sun)
const ROTATE_MINUTES = 0                        // show a new body every N minutes, all day (0 = one body per weekly reset)
const WALLPAPER_MODE = true                      // with a background set up: use ONLY your wallpaper behind the widget (no extra stars, nebula or constellation)
const TAP_URL = "grok://"                          // opens the Grok app; if nothing happens try "https://grok.com" (opens the app via link) or "" for Scriptable
// ==================================================

const GOLD = "#E9C877"
const GOLD_BRIGHT = "#FFD774"
const GOLD_SOFT = "#F4E2B0"
const SILVER = "#DDE2EC"
const MOON_COOL = "#E3E8F1"   // early in the cycle
const MOON_WARM = "#F2CF83"   // just before the reset

const fm = FileManager.local()
const bgPath = (fam) => fm.joinPath(fm.documentsDirectory(), `grok-moon-bg-${fam}.png`)

// ---------------- time ----------------
const CYCLE_MS = CYCLE_DAYS * 86400000
const now = new Date()
const anchor = new Date(RESET_ANCHOR).getTime()
const k = Math.floor((now.getTime() - anchor) / CYCLE_MS) + 1
const nextReset = new Date(anchor + k * CYCLE_MS)
const prevReset = new Date(nextReset.getTime() - CYCLE_MS)
const leftMs = nextReset.getTime() - now.getTime()
const progress = clamp((now.getTime() - prevReset.getTime()) / CYCLE_MS, 0, 1)
const lastHour = leftMs <= 3600000
const resetDay = leftMs <= 86400000 || now.toDateString() === nextReset.toDateString()
const dayIndex = Math.min(CYCLE_DAYS - 1, Math.floor(progress * CYCLE_DAYS)) // 0-based "today"
const hourNow = now.getHours() + now.getMinutes() / 60
const sunAng = (hourNow - 6) / 12 * Math.PI
const LDX = SUN_DIRECTION ? -Math.cos(sunAng) : 1, LDY = SUN_DIRECTION ? -Math.sin(sunAng) : 0   // unit vector (screen x, y down) toward the Sun

// which body this week: this cycle (ending at the anchor reset) is the Moon, then each reset moves one step out
const BODIES = [
  { name: "Moon", kind: "moon", scale: 1, tint: "#6C4FE0", fact: "384,400 km · 27.3 d orbit" },
  { name: "Mercury", kind: "mercury", scale: 0.78, hex: "#BDB6AB", tint: "#A89C8A", fact: "0.39 AU · 88 d year" },
  { name: "Venus", kind: "venus", scale: 0.92, hex: "#EBD39A", tint: "#E8B866", fact: "0.72 AU · hottest planet" },
  { name: "Earth", kind: "earth", scale: 0.9, hex: "#6FA8FF", tint: "#3E7BE6", fact: "1 AU · 24 h day" },
  { name: "Mars", kind: "mars", scale: 0.82, hex: "#D77B4A", tint: "#E2693A", fact: "1.52 AU · 24 h 37 m day" },
  { name: "Jupiter", kind: "jupiter", scale: 1.1, hex: "#E3C79F", tint: "#D58A5E", fact: "5.2 AU · 9 h 56 m day" },
  { name: "Saturn", kind: "saturn", scale: 0.82, hex: "#E8D3A0", tint: "#E3C77A", fact: "9.6 AU · 146 moons" },
  { name: "Uranus", kind: "uranus", scale: 0.95, hex: "#A9E4E6", tint: "#4FD0D8", fact: "19.2 AU · spins sideways" },
  { name: "Pluto", kind: "pluto", scale: 0.6, hex: "#C7AE96", tint: "#B58E78", fact: "39.5 AU · 248 yr year" },
  { name: "Neptune", kind: "neptune", scale: 0.95, hex: "#4B72F0", tint: "#3A5BE8", fact: "30 AU · 165 yr year" },
]
const SUN = { name: "Sun", kind: "sun", scale: 1.02, hex: "#FFD27A", tint: "#FF9E3A", fact: "5,500 °C · reset hour" }
// the last hour before a reset shows the Sun instead, with a special glow
const pick = (n) => n === "Sun" ? SUN : (BODIES.find((x) => x.name === n) || BODIES[0])
const BODY = FORCE_BODY ? pick(FORCE_BODY) : !PLANETS ? BODIES[0] : lastHour ? SUN : DAILY ? pick(WEEK[dayIndex % WEEK.length]) : BODIES[(((ROTATE_MINUTES > 0 ? Math.floor(now.getTime() / (ROTATE_MINUTES * 60000)) : k) % BODIES.length) + BODIES.length) % BODIES.length]

function formatLeft(ms) {
  const mins = Math.max(0, Math.ceil(ms / 60000))
  const d = Math.floor(mins / 1440), h = Math.floor((mins % 1440) / 60), m = mins % 60
  if (lastHour) return `${Math.max(1, mins)}m`
  if (d > 0) return `${d}d ${h}h`
  return `${h}h ${m}m`
}
function fmt(date, pattern) {
  const f = new DateFormatter()
  f.dateFormat = pattern
  return f.string(date)
}

// ---------------- helpers ----------------
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
// ---- starlight label ----
// DrawContext has no gradient text, masks or clipping, but a context only paints inside its own
// size. So the gradient is built from 1-pt vertical slices: each slice is a tiny DrawContext that
// draws the whole label shifted by -x in that slice's colour, then is pasted back at x.
const STARLIGHT = [            // champagne → pearl silver → ice-blue → soft violet → champagne gold
  [0.00, "#EDCF8E"], [0.24, "#F4E6C4"], [0.44, "#F3F4FA"], [0.62, "#CFE0FA"], [0.78, "#D9CCF5"], [1.00, "#E9C77C"],
]
function starlightAt(t) {
  for (let i = 1; i < STARLIGHT.length; i++) {
    const [t1, c1] = STARLIGHT[i], [t0, c0] = STARLIGHT[i - 1]
    if (t <= t1) return mixHex(c0, c1, smooth((t - t0) / (t1 - t0)))
  }
  return STARLIGHT[STARLIGHT.length - 1][1]
}
function twinkle(ctx, x, y, l, a) {          // 4-point star
  dot(ctx, x, y, l * 0.7, "#FFFFFF", 0.07 * a)
  for (const [dx, dy] of [[1, 0], [0, 1]]) {
    const p = new Path()
    p.move(new Point(x - dx * l, y - dy * l)); p.addLine(new Point(x + dy * l * 0.11, y + dx * l * 0.11))
    p.addLine(new Point(x + dx * l, y + dy * l)); p.addLine(new Point(x - dy * l * 0.11, y - dx * l * 0.11)); p.closeSubpath()
    fillPath(ctx, p, "#FFFFFF", 0.85 * a)
  }
  dot(ctx, x, y, l * 0.16, "#FFFFFF", a)
}
// span: estimated text width in em (no text measuring in Scriptable); x is the centre, or the left edge if align is "left"
function starlightText(ctx, str, font, size, x, y, align, span, boost) {
  const wEm = span * size
  const left = align === "left" ? x : x - wEm / 2
  const x0 = Math.floor(left - size * 0.12), x1 = Math.ceil(left + wEm + size * 0.12)
  const top = y - size, h = size * 2.2
  const rx = align === "left" ? x : x - 200, rw = 400
  // soft glow: champagne and ice copies on a ring
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    text(ctx, str, font, size, i % 2 ? GOLD_SOFT : "#CFE0FF", 0.03 * boost, x + Math.cos(a) * size * 0.08, y + Math.sin(a) * size * 0.08, align)
  }
  // faint prismatic edge: ice-blue to the left, violet to the right
  const d = Math.max(0.35, size * 0.025)
  text(ctx, str, font, size, "#9CC8FF", 0.15, x - d, y + d * 0.25, align)
  text(ctx, str, font, size, "#C3A6FF", 0.15, x + d, y - d * 0.25, align)
  // gradient fill, with a white shine stripe at a new spot every refresh
  const shine = 0.15 + Math.random() * 0.7
  for (let sx = x0; sx < x1; sx += 1) {
    const t = (sx - x0) / (x1 - x0)
    const glint = Math.exp(-Math.pow((t - shine) / 0.09, 2))
    const c = new DrawContext()
    c.size = new Size(1, h)
    c.opaque = false
    c.respectScreenScale = true
    c.setFont(font)
    c.setTextColor(col(mixHex(starlightAt(t), "#FFFFFF", 0.75 * glint), 1))
    if (align === "left") c.setTextAlignedLeft(); else c.setTextAlignedCenter()
    c.drawTextInRect(str, new Rect(rx - sx, size * 0.38, rw, size * 1.5))
    ctx.drawImageAtPoint(c.getImage(), new Point(sx, top))
  }
  twinkle(ctx, left + wEm + size * 0.22, y - size * 0.36, size * 0.2, Math.min(1, 0.75 * boost))
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

// ---------------- moon ----------------
// Lit region for a waxing moon (lit on the right). e = terminator x-semi-axis / R, from 1 (new) to -1 (full).
// ---------------- real astronomy (circular-orbit approximations, good for a widget) ----------------
const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0)
const dJ = (now.getTime() - J2000) / 86400000                       // days since J2000
const ORB = {                                                         // semi-major axis AU, period days, mean longitude at J2000 (deg)
  mercury: [0.387, 87.969, 252.25], venus: [0.723, 224.701, 181.98], earth: [1, 365.256, 100.46], mars: [1.524, 686.98, 355.45],
  jupiter: [5.203, 4332.59, 34.4], saturn: [9.537, 10759.2, 49.94], uranus: [19.19, 30688.5, 313.23], neptune: [30.07, 60182, 304.88],
}
const SPIN_H = { earth: 23.934, mars: 24.623, jupiter: 9.925, saturn: 10.656, uranus: -17.24, neptune: 16.11, venus: -5832, pluto: -153.29 }   // sidereal rotation hours (negative = retrograde)
const ELEM = {                                                        // JPL approximate Keplerian elements: [a, e, I, L, long.peri, long.node] then their rates per century (AU, deg)
  mercury: [0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593, 3.7e-7, 1.906e-5, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
  venus: [0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255, 3.9e-6, -4.107e-5, -0.0007889, 58517.81538729, 0.00268329, -0.27769418],
  earth: [1.00000261, 0.01671123, -1.531e-5, 100.46457166, 102.93768193, 0, 5.62e-6, -4.392e-5, -0.01294668, 35999.37244981, 0.32327364, 0],
  mars: [1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 1.847e-5, 7.882e-5, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
  jupiter: [5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -1.1607e-4, -1.3253e-4, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
  saturn: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, -0.0012506, -5.0991e-4, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
  uranus: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503, -0.00196176, -4.397e-5, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
  neptune: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574, 2.6291e-4, 5.105e-5, 3.5372e-4, 218.45945325, -0.32241464, -0.00508664],
  pluto: [39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684, -3.1596e-4, 5.17e-5, 4.818e-5, 145.20780515, -0.04062942, -0.01183482],
}
function helio(kind) {                                                // heliocentric ecliptic position (AU) from a Kepler orbit
  const q = ELEM[kind], T = dJ / 36525, g = (i) => q[i] + q[i + 6] * T
  const a = g(0), e = g(1), I = g(2) * Math.PI / 180, L = g(3), w = g(4), O = g(5) * Math.PI / 180
  const M = ((L - w) % 360) * Math.PI / 180
  let E = M + e * Math.sin(M)
  for (let i = 0; i < 6; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E))
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E), om = (w - g(5)) * Math.PI / 180
  const co = Math.cos(om), so = Math.sin(om), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I)
  return [(co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp, (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp, so * sI * xp + co * sI * yp]
}
// ---- sky geometry: where each body really is, seen from Singapore (circular-orbit planets, low-precision Moon) ----
const OBS = { lat: 1.3521 * Math.PI / 180, lon: 103.8198 }
const EPS = 23.4393 * Math.PI / 180
const d2r = Math.PI / 180
const unit3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const eclToEq = (v) => [v[0], v[1] * Math.cos(EPS) - v[2] * Math.sin(EPS), v[1] * Math.sin(EPS) + v[2] * Math.cos(EPS)]
const LST = ((280.46061837 + 360.98564736629 * dJ + OBS.lon) % 360) * d2r        // local sidereal time at the observer
const ZENITH = [Math.cos(OBS.lat) * Math.cos(LST), Math.cos(OBS.lat) * Math.sin(LST), Math.sin(OBS.lat)]
function moonEcl() {                                                          // unit vector toward the Moon (ecliptic), main Meeus terms (~0.2° accurate)
  const L = (218.3164477 + 13.17639648 * dJ) * d2r, M = (134.9633964 + 13.06499295 * dJ) * d2r, F = (93.272095 + 13.22935 * dJ) * d2r
  const D = (297.8501921 + 12.19074912 * dJ) * d2r, Ms = (357.5291092 + 0.98560028 * dJ) * d2r
  const lam = L + d2r * (6.288774 * Math.sin(M) + 1.274027 * Math.sin(2 * D - M) + 0.658314 * Math.sin(2 * D) + 0.213618 * Math.sin(2 * M) - 0.185116 * Math.sin(Ms) - 0.114332 * Math.sin(2 * F))
  const bet = d2r * (5.128122 * Math.sin(F) + 0.280602 * Math.sin(M + F) + 0.277693 * Math.sin(M - F) + 0.173237 * Math.sin(2 * D - F))
  return [Math.cos(bet) * Math.cos(lam), Math.cos(bet) * Math.sin(lam), Math.sin(bet)]
}
function sunDirEq() { const e = helio("earth"); return unit3(eclToEq([-e[0], -e[1], -e[2]])) }
function bodyDirEq(kind) {
  if (kind === "moon") {                                                      // topocentric: the Moon is close enough that your own spot on Earth shifts it by up to 1°
    const M = (134.9633964 + 13.06499295 * dJ) * d2r, D = (297.8501921 + 12.19074912 * dJ) * d2r
    const r = 385000.56 - 20905.355 * Math.cos(M) - 3699.111 * Math.cos(2 * D - M) - 2955.968 * Math.cos(2 * D) - 569.925 * Math.cos(2 * M)
    const g = eclToEq(moonEcl())
    return unit3([g[0] * r - 6371 * ZENITH[0], g[1] * r - 6371 * ZENITH[1], g[2] * r - 6371 * ZENITH[2]])
  }
  const e = helio("earth"), p = helio(kind)
  return unit3(eclToEq([p[0] - e[0], p[1] - e[1], p[2] - e[2]]))
}
function viewBasis(u) {                                                       // what the observer sees: zenith up, right = u x up
  const up = unit3(sub3(ZENITH, [u[0] * dot3(ZENITH, u), u[1] * dot3(ZENITH, u), u[2] * dot3(ZENITH, u)]))
  return { up, right: cross3(u, up) }
}
function realFraction(kind) {                                                 // lit fraction as seen from Earth
  if (kind === "earth") return 0.62
  const sd = sunDirEq()
  if (kind === "moon") return (1 - dot3(bodyDirEq("moon"), sd)) / 2
  const E = helio("earth"), P = helio(kind)
  const sv = [-P[0], -P[1], -P[2]], vv = [E[0] - P[0], E[1] - P[1], E[2] - P[2]]
  const c = dot3(sv, vv) / (Math.hypot(sv[0], sv[1], sv[2]) * Math.hypot(vv[0], vv[1], vv[2]))
  return (1 + c) / 2
}
const POLES = { moon: [269.99, 66.54], mars: [317.68, 52.89], jupiter: [268.06, 64.5], saturn: [40.59, 83.54], uranus: [257.31, -15.18], neptune: [299.36, 43.46], pluto: [132.99, -6.16] }
let AXIS = { roll: 0, lat: 0.08 }
function axisFor(kind) {                                                      // where the spin axis points on screen, and how far the viewer is above the equator
  if (!REAL) return { roll: 0, lat: 0.08 }
  if (kind === "earth") return { roll: 0, lat: OBS.lat, sunLat: 0 }
  const P = POLES[kind]; if (!P) return { roll: 0, lat: 0.08 }
  const u = bodyDirEq(kind), B = viewBasis(u), al = P[0] * d2r, de = P[1] * d2r
  const p = [Math.cos(de) * Math.cos(al), Math.cos(de) * Math.sin(al), Math.sin(de)]
  return { roll: Math.atan2(dot3(p, B.right), dot3(p, B.up)), lat: Math.asin(clamp(-dot3(p, u), -1, 1)), sunLat: Math.asin(clamp(dot3(p, sunDirEq()), -1, 1)) }
}
function computeLight(kind, f) {                                              // unit light vector in view coords (x right, y down, z toward viewer)
  const ca = clamp(2 * f - 1, -1, 1), sa = Math.sqrt(Math.max(0, 1 - ca * ca))
  if (!REAL) return [LDX * sa, LDY * sa, ca]
  const sd = sunDirEq()
  if (kind === "earth") {                                                     // a weather-satellite view straight down on Singapore
    const east = [-Math.sin(LST), Math.cos(LST), 0], north = [-Math.sin(OBS.lat) * Math.cos(LST), -Math.sin(OBS.lat) * Math.sin(LST), Math.cos(OBS.lat)]
    return [dot3(sd, east), -dot3(sd, north), dot3(sd, ZENITH)]
  }
  const u = bodyDirEq(kind), B = viewBasis(u)
  const k = dot3(sd, u), d = sub3(sd, [u[0] * k, u[1] * k, u[2] * k])
  const dl = Math.hypot(d[0], d[1], d[2])
  if (dl < 1e-6) return [sa, 0, ca]
  const dx = dot3(d, B.right) / dl, dy = dot3(d, B.up) / dl
  return [dx * sa, -dy * sa, ca]
}
// ---- real moon positions (JPL mean elements at J2000: semi-major axis km, period d, pole RA/Dec, node, arg. of periapsis, mean anomaly, inclination) ----
const SATD = {
  mars: [[9375, 0.31891023, 317.7, 52.9, 169.2, 216.3, 189.7, 1.1], [23457, 1.26244, 316.6, 53.5, 54.3, 0, 205.0, 1.8]],
  jupiter: [[421800, 1.762732, 268.1, 64.5, 0, 49.1, 330.9, 0], [671100, 3.525463, 268.1, 64.5, 184.0, 45.0, 345.4, 0.5],
    [1070400, 7.155588, 268.2, 64.6, 58.5, 198.3, 324.8, 0.2], [1882700, 16.69044, 268.7, 64.8, 309.1, 43.8, 87.4, 0.3]],
  saturn: [[1221900, 15.945448, 36.4, 84.0, 78.6, 78.3, 11.7, 0.3]],
  uranus: [[436298, 8.705869, 257.311, -15.175, 29.5, 184.0, 68.1, 0.1], [583511, 13.463237, 257.311, -15.175, 76.8, 132.2, 143.6, 0.1]],
  pluto: [[19591, 6.3872, 132.99, -6.16, 0, 0, 0, 0]],      // Charon: real period and distance; its starting phase is not from data
  neptune: [[354800, 5.876854, 299.36, 43.46, 177.7, 0, 63.0, 157.3]],
}
function satVec(sd) {                                                         // moon position (km) in equatorial coords
  const [a, P, ra, de, Om, w, M, inc] = sd
  const u = (w + M + 360 * dJ / P) * d2r, O = Om * d2r, ci = Math.cos(inc * d2r), si = Math.sin(inc * d2r)
  const x = Math.cos(O) * Math.cos(u) - Math.sin(O) * ci * Math.sin(u), y = Math.sin(O) * Math.cos(u) + Math.cos(O) * ci * Math.sin(u), z = si * Math.sin(u)
  const al = ra * d2r, dl = de * d2r
  const pole = [Math.cos(dl) * Math.cos(al), Math.cos(dl) * Math.sin(al), Math.sin(dl)], nn = [-Math.sin(al), Math.cos(al), 0], mm = cross3(pole, nn)
  return [a * (x * nn[0] + y * mm[0] + z * pole[0]), a * (x * nn[1] + y * mm[1] + z * pole[1]), a * (x * nn[2] + y * mm[2] + z * pole[2])]
}
function realSpin(kind) {                                             // rotation angle (rad) at the start of the current 10-minute step
  const h = SPIN_H[kind]; if (!h || kind === "earth") return 0      // Earth is viewed from a satellite fixed over Singapore, so it does not turn in the picture
  const t = Math.floor(now.getTime() / 600000) * 600000 / 3600000
  return 2 * Math.PI * (t / h)
}

function litPath(cx, cy, R, e) {
  const k = 0.5523, ex = e * R, p = new Path()
  p.move(new Point(cx, cy - R))
  p.addCurve(new Point(cx + R, cy), new Point(cx + R * k, cy - R), new Point(cx + R, cy - R * k))
  p.addCurve(new Point(cx, cy + R), new Point(cx + R, cy + R * k), new Point(cx + R * k, cy + R))
  p.addCurve(new Point(cx + ex, cy), new Point(cx + ex * k, cy + R), new Point(cx + ex, cy + R * k))
  p.addCurve(new Point(cx, cy - R), new Point(cx + ex, cy - R * k), new Point(cx + ex * k, cy - R))
  p.closeSubpath()
  return p
}
function fillPath(ctx, p, hex, a) { ctx.addPath(p); ctx.setFillColor(col(hex, a)); ctx.fillPath() }

// ---- realistic, slowly turning moon ----
// The face is shaded pixel by pixel in JS and handed to Scriptable as a PNG built in memory
// (Image.fromData), which is one draw call instead of thousands of dots. The surface is a seeded
// sphere (longitude/latitude features over the whole globe), so it never changes, but it turns
// one full revolution per cycle with a slight libration wobble. Seas and craters drift in from
// the dark side while the light and phase stay as they were. At reset (full moon) the familiar
// near side faces you.
const MOON_SEED = 1969
// Near-side maria, given as where they sit on the classic full-moon disc (x right, y down,
// radius 1): [x, y, rx, ry, depth]. Converted to points on the sphere below.
const MARIA = [
  [-0.30, -0.36, 0.30, 0.25, 1.0],   // Imbrium
  [-0.60, -0.02, 0.26, 0.42, 0.9],   // Procellarum
  [-0.40, 0.18, 0.20, 0.16, 0.8],    // Procellarum south
  [0.18, -0.40, 0.17, 0.15, 0.95],   // Serenitatis
  [0.36, -0.10, 0.22, 0.17, 0.9],    // Tranquillitatis
  [0.68, -0.30, 0.10, 0.12, 1.0],    // Crisium
  [0.55, 0.16, 0.12, 0.17, 0.8],     // Fecunditatis
  [0.33, 0.30, 0.08, 0.08, 0.8],     // Nectaris
  [-0.18, 0.36, 0.17, 0.13, 0.75],   // Nubium
  [-0.50, 0.38, 0.08, 0.08, 0.8],    // Humorum
  [0.00, -0.18, 0.09, 0.07, 0.7],    // Vaporum
  [-0.05, -0.72, 0.38, 0.06, 0.65],  // Frigoris
]
// named craters on the same disc: [x, y, r, rays (0-1), floor darkness]
const NAMED = [
  [-0.12, 0.70, 0.040, 1.0, 0],      // Tycho
  [-0.27, -0.17, 0.045, 0.4, 0],     // Copernicus
  [-0.48, -0.11, 0.024, 0.45, 0],    // Kepler
  [-0.60, -0.30, 0.018, 0.25, 0],    // Aristarchus
  [-0.10, -0.76, 0.040, 0, 0.3],     // Plato
  [-0.16, 0.86, 0.065, 0, 0],        // Clavius
  [0.78, 0.12, 0.040, 0, 0],         // Langrenus
  [0.25, 0.22, 0.040, 0, 0],         // Theophilus
]

function hash3(ix, iy, iz) {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 2246822519) + Math.imul(MOON_SEED, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function vnoise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  let fx = x - ix, fy = y - iy, fz = z - iz
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz)
  const l = (a, b, t) => a + (b - a) * t
  return l(l(l(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx), l(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx), fy),
    l(l(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx), l(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx), fy), fz)
}
function fbm3(x, y, z, oct) {
  let s = 0, amp = 0.5, fr = 1
  for (let i = 0; i < oct; i++) { s += amp * vnoise3(x * fr, y * fr, z * fr); fr *= 2.03; amp *= 0.5 }
  return s
}
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }

// sphere helpers (unit vectors; body frame = how the globe sits at reset)
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const norm3 = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const discToSphere = (x, y) => norm3([x, y, Math.sqrt(Math.max(0.02, 1 - x * x - y * y))])
function tangentBasis(c) {                      // east and south directions at a point
  const e1 = norm3(cross3([0, 1, 0], c)), e2 = cross3(c, e1)
  return [e1, e2]
}
// orientation over the cycle: one turn per cycle plus a small nodding libration
function moonTurn(p) {
  return { lon: 2 * Math.PI * (1 - p), tilt: 0.1 * Math.sin(2 * Math.PI * p * 2), roll: 0 }
}
function viewToBody(v0, o) {                    // roll in the screen plane, tilt about x, then turn about y
  const cr = Math.cos(o.roll || 0), sr = Math.sin(o.roll || 0), v = [v0[0] * cr + v0[1] * sr, -v0[0] * sr + v0[1] * cr, v0[2]]
  const ct = Math.cos(o.tilt), st = Math.sin(o.tilt), cl = Math.cos(o.lon), sl = Math.sin(o.lon)
  const y1 = v[1] * ct - v[2] * st, z1 = v[1] * st + v[2] * ct
  return [v[0] * cl + z1 * sl, y1, -v[0] * sl + z1 * cl]
}
function bodyToView(b, o) {
  const ct = Math.cos(o.tilt), st = Math.sin(o.tilt), cl = Math.cos(o.lon), sl = Math.sin(o.lon)
  const x1 = b[0] * cl - b[2] * sl, z1 = b[0] * sl + b[2] * cl
  const y1 = b[1] * ct + z1 * st, cr = Math.cos(o.roll || 0), sr = Math.sin(o.roll || 0)
  return [x1 * cr - y1 * sr, x1 * sr + y1 * cr, -b[1] * st + z1 * ct]
}

// the globe's features, built once from the seed (near side from the tables, far side seeded)
let GLOBE = null
function globe() {
  if (GLOBE) return GLOBE
  const r = rng(MOON_SEED)
  const randUnit = () => { const z = 2 * r() - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - z * z); return [Math.cos(a) * s, z * 0.92, Math.sin(a) * s] }
  const seas = MARIA.map(([x, y, rx, ry, dep]) => {
    const c = discToSphere(x, y), lc = Math.sqrt(Math.max(0.15, 1 - x * x))
    return { c, b: tangentBasis(c), rx: rx / lc, ry, dep }
  })
  for (let n = 0; seas.length < MARIA.length + 6 && n < 60; n++) {   // a few small far-side seas
    const c = norm3(randUnit())
    if (c[2] < -0.25) seas.push({ c, b: tangentBasis(c), rx: 0.05 + 0.1 * r(), ry: 0.05 + 0.08 * r(), dep: 0.45 + 0.35 * r() })
  }
  const craters = NAMED.map(([x, y, cr, rays, dark]) => ({ c: discToSphere(x, y), r: cr, rays, dark }))
  for (let n = 0; n < 650; n++) craters.push({ c: norm3(randUnit()), r: Math.min(0.1, 0.017 / Math.sqrt(1 - r() * 0.99)), rays: 0, dark: 0, fresh: r() < 0.25 })   // power-law sizes: many small, few large
  for (const cr of craters) {
    cr.b = tangentBasis(cr.c)
    if (cr.rays) cr.rayAngs = Array.from({ length: Math.round(6 + 6 * cr.rays) }, () => [r() * Math.PI * 2, 0.6 + 0.4 * r()])
  }
  GLOBE = { seas, craters }
  return GLOBE
}

// PNG (RGBA, stored/uncompressed deflate) → Scriptable Image
let CRC_T = null
function crc32(bytes, start, end) {
  if (!CRC_T) {
    CRC_T = new Uint32Array(256)
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0 }
  }
  let c = 0xFFFFFFFF
  for (let i = start; i < end; i++) c = CRC_T[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function pngFromRGBA(px, w, h) {
  const rowLen = w * 4 + 1, raw = rowLen * h
  const nBlocks = Math.ceil(raw / 65535)
  const zLen = 2 + raw + nBlocks * 5 + 4
  const out = new Uint8Array(8 + 25 + 12 + zLen + 12)
  let o = 0
  const u32 = (v) => { out[o++] = v >>> 24; out[o++] = (v >>> 16) & 255; out[o++] = (v >>> 8) & 255; out[o++] = v & 255 }
  const str = (s) => { for (let i = 0; i < s.length; i++) out[o++] = s.charCodeAt(i) }
  const chunk = (type, len, fill) => { u32(len); const st = o; str(type); fill(); u32(crc32(out, st, o)) }
  ;[137, 80, 78, 71, 13, 10, 26, 10].forEach((b) => (out[o++] = b))
  chunk("IHDR", 13, () => { u32(w); u32(h); out[o++] = 8; out[o++] = 6; out[o++] = 0; out[o++] = 0; out[o++] = 0 })
  chunk("IDAT", zLen, () => {
    out[o++] = 0x78; out[o++] = 0x01
    let a = 1, b = 0, done = 0, blockLeft = 0
    for (let y = 0; y < h; y++) {
      for (let i = -1; i < w * 4; i++) {
        if (blockLeft === 0) {
          const len = Math.min(65535, raw - done)
          out[o++] = done + len >= raw ? 1 : 0
          out[o++] = len & 255; out[o++] = len >>> 8; out[o++] = ~len & 255; out[o++] = (~len >>> 8) & 255
          blockLeft = len
        }
        const v = i < 0 ? 0 : px[y * w * 4 + i]
        out[o++] = v; a += v; b += a; done++; blockLeft--
      }
      a %= 65521; b %= 65521                       // checksum modulo once per row (exact in doubles)
    }
    u32(((b << 16) | a) >>> 0)
  })
  chunk("IEND", 0, () => {})
  const T = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", tc = []
  for (let i = 0; i < 64; i++) tc.push(T.charCodeAt(i))
  const parts = []
  let buf = []
  for (let i = 0; i < out.length; i += 3) {
    const n = (out[i] << 16) | ((out[i + 1] || 0) << 8) | (out[i + 2] || 0)
    buf.push(tc[n >>> 18], tc[(n >>> 12) & 63], i + 1 < out.length ? tc[(n >>> 6) & 63] : 61, i + 2 < out.length ? tc[n & 63] : 61)
    if (buf.length >= 8192) { parts.push(String.fromCharCode.apply(null, buf)); buf = [] }
  }
  if (buf.length) parts.push(String.fromCharCode.apply(null, buf))
  return Image.fromData(Data.fromBase64String(parts.join("")))
}

// ---- shared surface helpers (hi-res pass) ----
const mix3 = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t]
const adiff = (a, b) => { let d = a - b; d -= Math.round(d / 360) * 360; return d }          // longitude difference, degrees
const PAD = { earth: 0.17, mars: 0.04, saturn: 1.4 }                                      // extra room around the disc (atmosphere glow, rings)
function surfN(R, s, kind) { return Math.ceil(2 * R * s * (1 + (PAD[kind] || 0))) + 2 }
// the height field of a surface tilts the lighting: slopes toward the Sun brighten, slopes away shade (true relief, even at the limb)
function bumpNdl(ht, N, p, k, x, y, z, rr, str) {
  if (rr > 0.985 || rr < 1e-4) return x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]
  const hx = (ht[p + 1] - ht[p - 1]) * 0.5 * k * str, hy = (ht[p + N] - ht[p - N]) * 0.5 * k * str
  const ex = x / rr, ey = y / rr, gr = (hx * ex + hy * ey) * z, gt = -hx * ey + hy * ex
  const t2x = z * ex, t2y = z * ey, t2z = -rr
  const nl = (x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]) - gt * (-ey * LIGHT[0] + ex * LIGHT[1]) - gr * (t2x * LIGHT[0] + t2y * LIGHT[1] + t2z * LIGHT[2])
  return nl / Math.sqrt(1 + gt * gt + gr * gr)
}
// scattered craters from a jittered 3D grid: each cell may hold one crater (bowl, raised rim, soft ejecta). Returns height in sphere units.
function craterField(x, y, z, F, off, dens, depth) {
  const px = x * F + off, py = y * F + off * 0.7, pz = z * F + off * 1.3
  const ix = Math.floor(px - 0.5), iy = Math.floor(py - 0.5), iz = Math.floor(pz - 0.5)
  let h = 0
  for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const cx = ix + dx, cy = iy + dy, cz = iz + dz, q = hash3(cx * 3 + 7, cy * 3 + 1, cz * 3 + 5)
    if (q > dens) continue
    const r = 0.14 + 0.34 * Math.pow(q / dens, 1.8)
    const ox = cx + 0.18 + 0.64 * hash3(cx, cy, cz + 101), oy = cy + 0.18 + 0.64 * hash3(cx + 53, cy, cz), oz = cz + 0.18 + 0.64 * hash3(cx, cy + 71, cz)
    const d = Math.hypot(px - ox, py - oy, pz - oz) / r
    if (d > 2.4) continue
    const dp = depth * r / F
    h += d < 1 ? -dp * (1 - sstep(0.25, 1, d)) + 0.3 * dp * Math.exp(-Math.pow((d - 1) / 0.2, 2)) : 0.3 * dp * Math.exp(-Math.pow((d - 1) / 0.2, 2)) + 0.05 * dp * Math.exp(-(d - 1) * 1.5)
  }
  return h
}

function moonSurface(R, s, f, face, o, opt) {
  const maria = !(opt && opt.maria === false)
  const N = Math.ceil(2 * R * s) + 2, c0 = N / 2, k = R * s, NN = N * N
  const G = globe()
  const nx = new Float32Array(NN), ny = new Float32Array(NN), nz = new Float32Array(NN), inside = new Uint8Array(NN)
  const alb = new Float32Array(NN), ht = new Float32Array(NN), ray = new Float32Array(NN), mare = new Float32Array(NN), tn = new Float32Array(NN)
  // 1) albedo and rough terrain on the turning globe: seas with ragged edges, regolith mottling at pixel scale (3D noise, so no seams)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, r2 = x * x + y * y
    if (r2 > 1.05) continue
    const p = j * N + i, z = Math.sqrt(Math.max(0, 1 - r2))
    nx[p] = x; ny[p] = y; nz[p] = z; inside[p] = 1
    const b = viewToBody([x, y, z], o)
    const w0 = fbm3(b[0] * 1.7 + 11, b[1] * 1.7, b[2] * 1.7, 3) - 0.5 + 0.25 * (vnoise3(b[0] * 7 + 2, b[1] * 7, b[2] * 7) - 0.5)
    const w1 = fbm3(b[0] * 1.7, b[1] * 1.7 + 17, b[2] * 1.7 + 5, 3) - 0.5 + 0.25 * (vnoise3(b[0] * 7, b[1] * 7 + 9, b[2] * 7 + 4) - 0.5)
    let keep = 1
    for (const m of maria ? G.seas : []) {
      const cd = dot3(b, m.c)
      if (cd < 0.6) continue
      const u = dot3(b, m.b[0]) + 0.3 * w0, v = dot3(b, m.b[1]) + 0.3 * w1
      const d = (u / m.rx) ** 2 + (v / m.ry) ** 2
      if (d < 2) keep *= 1 - m.dep * (1 - sstep(0.15, 1.6, d))
    }
    const mott = fbm3(b[0] * 7 + 3, b[1] * 7 + 5, b[2] * 7, 3)
    const fine = fbm3(b[0] * 19 + 4, b[1] * 19, b[2] * 19 + 9, 3)
    const m = (1 - keep) * (0.85 + 0.15 * fbm3(b[0] * 4 + 5, b[1] * 4 + 3, b[2] * 4, 2))
    const high = 0.9 + 0.22 * (mott - 0.5)
    const mareA = 0.5 + 0.18 * (fbm3(b[0] * 5 + 9, b[1] * 5 + 1, b[2] * 5, 2) - 0.5)
    alb[p] = (high + (mareA - high) * m) * (0.9 + 0.2 * fine) + (hash3(Math.floor(b[0] * 300), Math.floor(b[1] * 300), Math.floor(b[2] * 300)) - 0.5) * 0.05
    mare[p] = m
    tn[p] = (1 - 2 * m) * 0.7 + 0.6 * (fbm3(b[0] * 3 + 6, b[1] * 3, b[2] * 3 + 2, 2) - 0.5)
    ht[p] = (fbm3(b[0] * 5.5 + 2, b[1] * 5.5, b[2] * 5.5 + 7, 3) - 0.5) * 0.02 * (1 - 0.8 * m) + (fine - 0.5) * 0.006 * (1 - 0.6 * m)
  }
  // 2) craters on the sphere (angular distance, so they foreshorten toward the limb): bowl, raised rim, ejecta, central peaks, bright rays
  for (const cr of G.craters) {
    const cv = bodyToView(cr.c, o)
    if (cv[2] < -0.05) continue
    const e1 = bodyToView(cr.b[0], o), e2 = bodyToView(cr.b[1], o)
    const box = (ext) => [Math.max(1, Math.floor((cv[0] - ext) * k + c0)), Math.min(N - 2, Math.ceil((cv[0] + ext) * k + c0)),
      Math.max(1, Math.floor((cv[1] - ext) * k + c0)), Math.min(N - 2, Math.ceil((cv[1] + ext) * k + c0))]
    const reach = cr.r * 2.3, [i0, i1, j0, j1] = box(reach), cosR = Math.cos(reach)
    const D = cr.r * (cr.r > 0.05 ? 0.2 : 0.3), big = cr.r > 0.045
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const p = j * N + i
      if (!inside[p]) continue
      const cd = nx[p] * cv[0] + ny[p] * cv[1] + nz[p] * cv[2]
      if (cd < cosR) continue
      const dd = Math.acos(Math.min(1, cd)) / cr.r
      const sup = cr.r < 0.035 ? 1 - 0.65 * mare[p] : 1
      let h
      if (dd < 1) {
        h = -D * (1 - sstep(0.22, 1, dd)) + 0.34 * D * Math.exp(-Math.pow((dd - 1) / 0.2, 2))
        if (big) h += 0.5 * D * Math.exp(-Math.pow(dd / 0.14, 2))                                  // central peak
        alb[p] *= 1 - (0.05 + cr.dark) * (1 - sstep(0.4, 1, dd)) * sup
      } else {
        h = 0.34 * D * Math.exp(-Math.pow((dd - 1) / 0.2, 2)) + 0.06 * D * Math.exp(-(dd - 1) * 1.4)
        alb[p] += (0.05 + (cr.fresh ? 0.08 : 0)) * Math.exp(-(dd - 1) * 2.2) * sup
      }
      ht[p] += h * sup
      if (cr.rays) alb[p] += 0.22 * cr.rays * (1 - sstep(0.6, 1.3, dd))
    }
    if (cr.rays) {                                                 // ray systems, fixed to the surface
      const len = 0.25 + 0.6 * cr.rays, cosL = Math.cos(len)
      const [a0, a1, b0, b1] = box(Math.sin(Math.min(len, 1.5)) + 0.02)
      for (let j = b0; j <= b1; j++) for (let i = a0; i <= a1; i++) {
        const p = j * N + i
        if (!inside[p]) continue
        const cd = nx[p] * cv[0] + ny[p] * cv[1] + nz[p] * cv[2]
        if (cd < cosL) continue
        const dist = Math.acos(Math.min(1, cd))
        if (dist < cr.r) continue
        const ang = Math.atan2(nx[p] * e2[0] + ny[p] * e2[1] + nz[p] * e2[2], nx[p] * e1[0] + ny[p] * e1[1] + nz[p] * e1[2])
        let best = 0
        for (const [ra, rl] of cr.rayAngs) {
          let da = Math.abs(ang - ra); if (da > Math.PI) da = 2 * Math.PI - da
          const w = Math.exp(-Math.pow((da * dist) / (0.018 + 0.035 * dist), 2)) * Math.pow(Math.max(0, 1 - dist / (len * rl)), 1.5) * (0.6 + 0.4 * vnoise3(dist * 30, ra * 5, 0))
          if (w > best) best = w
        }
        ray[p] += best * cr.rays
      }
    }
  }
  // 3) lighting from the bumpy surface: Lommel-Seeliger (a full Moon is flat, no limb darkening), rugged terminator, warm band at the terminator, earthshine
  const F = rgb(face), WARM = rgb("#D6A468"), DARK = [4, 4, 7], ES = rgb("#9AA6BE")
  const es = 0.085 * (0.5 + 0.5 * (1 - f))
  const px = new Uint8Array(NN * 4)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, rr = Math.sqrt(x * x + y * y)
    const edge = clamp((1 - rr) * k + 0.5, 0, 1)
    if (edge <= 0) continue
    const z = Math.sqrt(Math.max(0, 1 - rr * rr)), p = j * N + i
    const ndl = bumpNdl(ht, N, p, k, x, y, z, rr, 0.8)
    const term = sstep(-0.03, 0.09, ndl)
    const nl = Math.max(ndl, 0), ls = (2 * nl) / (nl + z + 1e-3)
    let v = term * (0.1 + 0.9 * clamp(ls, 0, 1.15)) * alb[p]
    v += ray[p] * 0.15 * term * Math.pow(clamp(nl, 0, 1), 0.7)
    let um = 0, pe = 0
    if (ECL) { const d = Math.hypot(x - ECL.toAnti[0], y - ECL.toAnti[1]); um = 1 - sstep(2.5, 2.9, d); pe = 1 - sstep(2.9, 5.2, d); v *= (1 - 0.94 * um) * (1 - 0.3 * pe) }
    v = clamp(v, 0, 1.12)
    const warm = 0.4 * term * Math.exp(-Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]) / 0.1)
    const e = es * (1 - term) * alb[p] * (0.75 + 0.25 * z)
    const t = tn[p], tint = [1 + 0.03 * t, 1 - 0.002 * t, 1 - 0.045 * t]               // highlands a little warm, seas a little cool
    for (let ch = 0; ch < 3; ch++) {
      const lit = (F[ch] + (WARM[ch] - F[ch]) * warm) * tint[ch]
      px[p * 4 + ch] = clamp(Math.round(DARK[ch] + (lit * 1.03 - DARK[ch]) * Math.pow(v, 0.92) + ES[ch] * e + [150, 52, 22][ch] * um * (0.55 + 0.45 * alb[p]) * 0.4), 0, 255)
    }
    px[p * 4 + 3] = Math.round(255 * edge * (0.94 + 0.06 * term))
  }
  return { img: pngFromRGBA(px, N, N), size: N / s }
}


// ---------------- planets ----------------
// Same trick as the moon: shade a sphere pixel by pixel, wrap it in a PNG and draw it in one call.
// c(b) gives the surface colour (0-255) at a point b on the unit sphere (y = pole axis).
function planetColor(kind, b) {
  const mix = (a, c, t) => [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t]
  const lat = b[1], lon = Math.atan2(b[0], b[2])
  if (kind === "venus") {
    const w = fbm3(b[0] * 2.2 + 3, b[1] * 2.2, b[2] * 2.2, 3)
    const v = fbm3(b[0] * 3 + w * 2.4, b[1] * 5 + w * 1.6, b[2] * 3 + w * 2.4, 4)
    return mix(rgb("#F1DFAE"), rgb("#BE9250"), sstep(0.3, 0.72, v))
  }
  if (kind === "earth") {                                   // real continents (1° map) as seen from above 104°E
    const la = -Math.asin(clamp(b[1], -1, 1)) * 180 / Math.PI, lo = 103.82 + Math.atan2(b[0], b[2]) * 180 / Math.PI
    const m = earthMap(), fx = (((lo + 180) % 360 + 360) % 360) - 0.5, fy = clamp(90 - la - 0.5, 0, 179.001)
    const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0
    const CC = [rgb("#1C4FB4"), rgb("#3C7A3A"), rgb("#B9A56A"), [244, 246, 250]], acc = [0, 0, 0]
    const ws = [(1 - tx) * (1 - ty), tx * (1 - ty), (1 - tx) * ty, tx * ty]
    for (let q = 0; q < 4; q++) {
      const cx2 = (x0 + (q & 1) + 360) % 360, cy2 = Math.min(179, y0 + (q >> 1)), c = CC[m[cy2 * 360 + cx2]]
      acc[0] += c[0] * ws[q]; acc[1] += c[1] * ws[q]; acc[2] += c[2] * ws[q]
    }
    const n = fbm3(b[0] * 7 + 2, b[1] * 7, b[2] * 7, 3) - 0.5
    return [clamp(acc[0] * (1 + n * 0.25), 0, 255), clamp(acc[1] * (1 + n * 0.2), 0, 255), clamp(acc[2] * (1 + n * 0.15), 0, 255)]
  }
  if (kind === "pluto") {
    const n = fbm3(b[0] * 3 + 4, b[1] * 3, b[2] * 3, 4), g = fbm3(b[0] * 9, b[1] * 9, b[2] * 9 + 3, 2), la = -b[1]
    let c = mix(rgb("#8E6E5A"), rgb("#C7AE96"), sstep(0.3, 0.7, n))
    const dk = sstep(0.62, 0.8, fbm3(b[0] * 2 + 9, b[1] * 5, b[2] * 2, 3)) * (1 - sstep(0.1, 0.4, Math.abs(la)))   // dark equatorial band
    c = mix(c, rgb("#4B2E26"), dk * 0.8)
    const blob = (lo0, la0, rx, ry) => { const dl = Math.atan2(Math.sin(lon - lo0), Math.cos(lon - lo0)) * Math.cos(Math.asin(clamp(la, -1, 1))) / rx, dy = (Math.asin(clamp(la, -1, 1)) - la0) / ry; return Math.exp(-(dl * dl + dy * dy) * 1.4) }
    const heart = Math.max(blob(Math.PI + 0.2, 0.3, 0.2, 0.2), blob(Math.PI - 0.22, 0.28, 0.2, 0.2), blob(Math.PI, 0.0, 0.2, 0.2))   // Tombaugh Regio
    c = mix(c, rgb("#F1E4D2"), clamp(heart * 1.1, 0, 0.9))
    return mix(c, [c[0] * 0.9, c[1] * 0.88, c[2] * 0.88], g * 0.5)
  }
  if (kind === "mars") {
    const n = fbm3(b[0] * 2.4 + 7, b[1] * 2.4, b[2] * 2.4, 4), g = fbm3(b[0] * 9, b[1] * 9 + 2, b[2] * 9, 2)
    let c = mix(rgb("#C46A3C"), rgb("#E1995F"), sstep(0.35, 0.6, fbm3(b[0] * 3 + 1, b[1] * 3, b[2] * 3 + 4, 3)))
    c = mix(c, rgb("#6B3322"), sstep(0.5, 0.68, n) * 0.85)
    c = mix(c, [c[0] * 0.9, c[1] * 0.88, c[2] * 0.88], g)
    return mix(c, [246, 244, 240], sstep(0.78, 0.88, Math.abs(lat) + 0.04 * (g - 0.5)))
  }
  if (kind === "jupiter") {
    const wr = (fbm3(b[0] * 3 + 5, b[1] * 10, b[2] * 3, 4) - 0.5) * 0.22, L = lat + wr
    const band = 0.5 + 0.5 * Math.sin(L * Math.PI * 7.2 + 0.6)
    const fine = 0.5 + 0.5 * Math.sin(L * 52 + fbm3(b[0] * 4, b[1] * 12, b[2] * 4, 2) * 5)
    let c = mix(rgb("#B88A62"), rgb("#EBDDC2"), sstep(0.1, 0.9, band))
    c = mix(c, rgb("#9B5B3A"), 0.2 * sstep(0.55, 1, fine) * (1 - band))
    const dl = Math.atan2(Math.sin(lon - 0.0), Math.cos(lon - 0.0)), dx = dl * Math.cos(lat) / 0.26, dy = (lat + 0.3) / 0.1
    const spot = Math.exp(-(dx * dx + dy * dy) * 1.1)
    c = mix(c, rgb("#C0522E"), clamp(spot * 1.2, 0, 0.92))
    return mix(c, [c[0] * 0.75, c[1] * 0.74, c[2] * 0.78], sstep(0.82, 1, Math.abs(lat)))
  }
  if (kind === "saturn") {
    const wr = (fbm3(b[0] * 2 + 9, b[1] * 8, b[2] * 2, 2) - 0.5) * 0.08, L = lat + wr
    const band = 0.5 + 0.5 * Math.sin(L * Math.PI * 6 + 1.2) * 0.8 + 0.1 * Math.sin(L * 31)
    const c = mix(rgb("#C9AD74"), rgb("#EDDBAE"), sstep(0.2, 0.85, band))
    return mix(c, rgb("#8F9AA0"), sstep(0.78, 1, Math.abs(lat)) * 0.45)
  }
  if (kind === "uranus") {
    const band = 0.5 + 0.5 * Math.sin(lat * Math.PI * 5 + 0.4), n = fbm3(b[0] * 2 + 2, b[1] * 5, b[2] * 2, 2)
    let c = mix(rgb("#98D8DC"), rgb("#BDEEEE"), clamp(band * 0.35 + n * 0.25 + 0.2, 0, 1))
    return mix(c, rgb("#D5F6F4"), sstep(0.7, 1, Math.abs(lat)) * 0.6)
  }
  if (kind === "neptune") {
    const wr = (fbm3(b[0] * 2.5 + 4, b[1] * 9, b[2] * 2.5, 3) - 0.5) * 0.12, L = lat + wr
    const band = 0.5 + 0.5 * Math.sin(L * Math.PI * 4 + 2) * 0.6 + 0.35 * (fbm3(b[0] * 2 + 1, b[1] * 4, b[2] * 2, 3) - 0.5)
    let c = mix(rgb("#2B4BCC"), rgb("#4C7BF2"), sstep(0.2, 0.85, band))
    const streak = sstep(0.62, 0.78, fbm3(b[0] * 1.6 + 8, b[1] * 11, b[2] * 1.6, 3))
    c = mix(c, [236, 242, 255], streak * 0.55)
    const dl = Math.atan2(Math.sin(lon + 0.5), Math.cos(lon + 0.5)), dx = dl * Math.cos(lat) / 0.3, dy = (lat + 0.25) / 0.12
    return mix(c, rgb("#14267E"), clamp(Math.exp(-(dx * dx + dy * dy) * 1.2) * 0.9, 0, 0.85))
  }
  return [200, 200, 200]
}
let EARTH_MAP = null
function earthMap() {                                                         // 360x180 run-length coded: 0 sea, 1 land, 2 desert, 3 ice
  if (EARTH_MAP) return EARTH_MAP
  const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", out = new Uint8Array(64800)
  let bits = 0, nb = 0, pos = 0
  for (const ch of EARTH_RLE) {
    bits = (bits << 6) | A.indexOf(ch); nb += 6
    if (nb >= 8) { nb -= 8; const byte = (bits >> nb) & 255; bits &= (1 << nb) - 1; const c = byte >> 6, n = byte & 63; for (let i = 0; i < n && pos < 64800; i++) out[pos++] = c }
  }
  EARTH_MAP = out
  return out
}
const EARTH_RLE = "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"
const RIM = { pluto: "#FFD9B8", earth: "#9CC8FF", venus: "#FFE9B0", uranus: "#BFF3F5", neptune: "#7FA0FF", jupiter: "#FFE6C0", saturn: "#FFE9B8", mars: "#FFB27A" }
// ---- colour tables over latitude (degrees north, then r g b): belts and zones ----
function tableAt(T, lat) {
  if (lat <= T[0][0]) return [T[0][1], T[0][2], T[0][3]]
  const n = T.length
  if (lat >= T[n - 1][0]) return [T[n - 1][1], T[n - 1][2], T[n - 1][3]]
  let i = 1
  while (i < n - 1 && T[i][0] < lat) i++
  const a = T[i - 1], b = T[i], t = sstep(0, 1, (lat - a[0]) / (b[0] - a[0]))
  return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]
}
const JUP = [[-90, 118, 108, 100], [-66, 138, 124, 110], [-58, 172, 152, 128], [-50, 214, 198, 172], [-44, 192, 168, 136], [-38, 218, 203, 177], [-33, 166, 132, 102], [-29, 184, 152, 120],
  [-25, 228, 212, 184], [-20, 206, 170, 134], [-16, 164, 108, 78], [-12, 148, 96, 70], [-8, 170, 120, 88], [-4, 230, 210, 170], [0, 240, 222, 186], [4, 232, 210, 170], [8, 168, 116, 84],
  [12, 146, 94, 66], [16, 172, 122, 88], [20, 232, 214, 184], [24, 214, 186, 152], [28, 170, 138, 108], [34, 226, 208, 180], [40, 176, 146, 114], [46, 214, 196, 168], [54, 182, 160, 134],
  [66, 142, 128, 114], [90, 120, 110, 102]]
const SAT = [[-90, 128, 136, 148], [-78, 150, 148, 140], [-65, 176, 158, 120], [-58, 196, 174, 126], [-50, 210, 186, 138], [-42, 190, 166, 120], [-35, 216, 194, 146], [-26, 224, 202, 154],
  [-18, 208, 182, 132], [-10, 226, 204, 154], [-3, 240, 220, 170], [5, 232, 210, 160], [14, 212, 186, 134], [22, 226, 204, 154], [32, 208, 182, 130], [41, 216, 194, 146], [52, 198, 174, 126],
  [64, 176, 156, 120], [75, 158, 150, 136], [90, 130, 138, 150]]
function ovalW(lat, lon, lon0, lat0, rl, rb, n) {                              // soft oval storm, size in degrees of latitude
  const u = adiff(lon, lon0) * Math.cos(lat0 * d2r) / rl, v = (lat - lat0) / rb
  return 1 - sstep(0.45, 1.05, (u * u + v * v) * (1 + 0.4 * n))
}
const JOVALS = [[-135, 13.6, 5.5, 2.1, [108, 64, 46], 0.75], [38, 14.2, 6.5, 2.3, [112, 68, 48], 0.7], [-60, 8.4, 3, 1.4, [246, 242, 234], 0.7],
  [95, -33, 3.8, 2.5, [244, 240, 232], 0.9], [120, -33, 3.3, 2.3, [244, 240, 232], 0.9], [146, -33, 3.1, 2.1, [242, 238, 228], 0.85], [-75, -33, 4.4, 3.1, [214, 144, 108], 0.85],
  [165, 20, 3, 1.6, [250, 246, 238], 0.6], [-168, -17, 3.5, 1.6, [96, 58, 42], 0.6]]
function jupiterColor(b) {
  const lon = Math.atan2(b[0], b[2]) / d2r, lat = -Math.asin(clamp(b[1], -1, 1)) / d2r, lr = lon * d2r
  const w1 = fbm3(b[0] * 3 + 5, b[1] * 12, b[2] * 3, 4) - 0.5, w2 = fbm3(b[0] * 8 + 1, b[1] * 30, b[2] * 8, 3) - 0.5
  const L = lat + w1 * 9 + w2 * 2.6 + Math.sin(lr * 5 + 1) * 0.7 + Math.sin(lr * 11 + 3) * 0.45      // belts wander and ripple in longitude
  let c = tableAt(JUP, L)
  const ca = tableAt(JUP, L + 2.4), cb = tableAt(JUP, L - 2.4)
  const edge = clamp(Math.abs(ca[0] - cb[0]) / 50 + Math.abs(ca[2] - cb[2]) / 60, 0, 1)             // turbulence is strongest where belts meet zones
  const eddy = fbm3(b[0] * 14 + 8, b[1] * 20, b[2] * 14, 3) - 0.5, eddy2 = vnoise3(b[0] * 30 + 2, b[1] * 44, b[2] * 30) - 0.5
  const stri = vnoise3(b[0] * 4, b[1] * 95, b[2] * 4) - 0.5
  const gain = 1 + eddy * (0.1 + 0.55 * edge) + eddy2 * 0.1 * edge + stri * 0.09
  c = [c[0] * gain, c[1] * gain, c[2] * gain]
  const fe = Math.exp(-Math.pow((lat - 6.6 - w1 * 4) / 2.4, 2)) * Math.pow(Math.max(0, Math.sin(lr * 15 + (lat - 6) * 0.45 + w2 * 3)), 2)   // festoons: dark plumes on the equatorial zone
  c = mix3(c, [92, 94, 108], clamp(fe * 0.6, 0, 0.6))
  const nn = fbm3(b[0] * 10 + 3, b[1] * 10, b[2] * 10, 2) - 0.5
  for (const [lo0, la0, rl, rb, col, st] of JOVALS) { const w = ovalW(lat, lon, lo0, la0, rl, rb, nn); if (w > 0) c = mix3(c, col, w * st) }
  const gu = adiff(lon, 0) * Math.cos(22 * d2r) / 10, gv = (lat + 22) / 6.6
  const gr = Math.sqrt(gu * gu + gv * gv) * (1 + 0.22 * nn)                                       // the Great Red Spot, with its pale collar and a dark wake
  if (gr < 2) {
    const ang = Math.atan2(gv, gu), sw = 0.5 + 0.5 * Math.sin(ang * 2 + gr * 7 + nn * 6)
    const core = mix3([184, 80, 54], [216, 128, 92], sw * 0.65 + 0.35 * sstep(0.3, 0.9, gr))
    c = mix3(c, [240, 226, 202], sstep(0.95, 1.12, gr) * (1 - sstep(1.2, 1.8, gr)) * 0.55)
    c = mix3(c, core, (1 - sstep(0.84, 1.03, gr)) * 0.94)
  }
  const wk = sstep(-4.5, -1.3, gu) * (1 - sstep(-1.5, -1.1, gu)) * Math.exp(-gv * gv * 0.7)
  if (wk > 0.01) c = mix3(c, [142, 100, 76], clamp(wk * (0.2 + 1.2 * (nn + 0.3)), 0, 0.5))
  return [c[0], c[1], c[2], 0]
}
function saturnColor(b) {
  const lat = -Math.asin(clamp(b[1], -1, 1)) / d2r, lon = Math.atan2(b[0], b[2])
  const L = lat + (fbm3(b[0] * 2 + 9, b[1] * 10, b[2] * 2, 3) - 0.5) * 3
  let c = tableAt(SAT, L)
  const g = 1 + (vnoise3(b[0] * 3, b[1] * 70, b[2] * 3) - 0.5) * 0.11 + (vnoise3(b[0] * 2, b[1] * 31 + 5, b[2] * 2) - 0.5) * 0.14 + (fbm3(b[0] * 12 + 4, b[1] * 18, b[2] * 12, 3) - 0.5) * 0.12
  c = [c[0] * g, c[1] * g, c[2] * g]
  const hx = sstep(0, 1, 1 - Math.abs(lat - (77 + 1.4 * Math.cos(6 * lon))) / 1.6)             // hint of the north-polar hexagon
  c = mix3(c, [138, 140, 150], hx * 0.35)
  return [c[0], c[1], c[2], 0]
}
const MARS_DARK = [[69, 9, 15, 20, 1.0], [0, -3, 18, 7, 0.65], [-25, 50, 36, 11, 0.7], [-38, -22, 22, 10, 0.75], [-90, -27, 10, 8, 0.9], [-148, -32, 30, 7, 0.8],
  [148, -32, 28, 7, 0.8], [104, -15, 18, 8, 0.7], [60, 35, 12, 5, 0.55], [150, 8, 24, 6, 0.45], [10, -35, 16, 6, 0.5], [-5, 12, 10, 6, 0.4]]
const MARS_BRIGHT = [[70, -42, 15, 11, 0.9], [-43, -50, 10, 8, 0.85], [15, 24, 22, 15, 0.5], [-112, 4, 24, 14, 0.4], [150, 28, 14, 10, 0.4]]
function marsColor(b) {
  const lon = Math.atan2(b[0], b[2]) / d2r, lat = -Math.asin(clamp(b[1], -1, 1)) / d2r, cl = Math.cos(lat * d2r)
  const warp = fbm3(b[0] * 4 + 2, b[1] * 4, b[2] * 4 + 5, 3) - 0.5, rag = fbm3(b[0] * 12 + 6, b[1] * 12, b[2] * 12, 3)
  const base = fbm3(b[0] * 2.2 + 7, b[1] * 2.2, b[2] * 2.2, 4)
  let c = mix3([192, 112, 66], [226, 152, 98], sstep(0.35, 0.65, base))
  let ht = 0, dk = 0, br = 0
  for (const [lo0, la0, rl, rb, st] of MARS_DARK) {
    const u = adiff(lon + warp * 22, lo0) * Math.cos(la0 * d2r) / rl, v = (lat + warp * 12 - la0) / rb
    if (u > 2.4 || u < -2.4) continue
    const w = st * (1 - sstep(0.4, 1.2, u * u + v * v))
    if (w > dk) dk = w
  }
  for (const [lo0, la0, rl, rb, st] of MARS_BRIGHT) {
    const u = adiff(lon + warp * 14, lo0) * Math.cos(la0 * d2r) / rl, v = (lat + warp * 8 - la0) / rb
    if (u > 2.4 || u < -2.4) continue
    const w = st * (1 - sstep(0.35, 1.1, u * u + v * v))
    if (w > br) br = w
  }
  { const mid = fbm3(b[0] * 22 + 2, b[1] * 22, b[2] * 22 + 7, 3), wn = dk + (rag - 0.5) * 1.5 + (mid - 0.5) * 0.9
    dk = clamp(sstep(0.12, 0.75, wn) * 0.8 + sstep(0.02, 0.4, dk) * 0.2, 0, 1) * (0.6 + 0.6 * rag) }
  { const st = fbm3(b[0] * 3 + 5, b[1] * 14, b[2] * 3 + 1, 4); c = mix3(c, [150, 84, 52], 0.22 * sstep(0.5, 0.8, st)); c = mix3(c, [232, 170, 118], 0.2 * sstep(0.45, 0.75, 1 - st)) }
  c = mix3(c, [236, 176, 128], br * 0.5)
  c = mix3(c, mix3([86, 58, 50], [112, 78, 66], rag), clamp(dk * 0.8, 0, 0.8))
  const vm = Math.exp(-Math.pow((lat + 11 + 1.6 * Math.sin(lon * 0.09)) / 2.1, 2)) * (1 - sstep(24, 30, Math.abs(lon + 62)))   // Valles Marineris
  c = mix3(c, [82, 48, 38], vm * 0.62); ht -= 0.012 * vm
  for (const [lo0, la0] of [[-134, 18], [-120.5, -9], [-112.8, 1], [-104.5, 11]]) {                    // volcano summits, with a little orographic cloud
    const u = adiff(lon, lo0) * Math.cos(la0 * d2r), v = lat - la0, d = u * u + v * v
    if (d < 20) { c = mix3(c, [244, 232, 218], 0.5 * (1 - sstep(1.5, 4.2, Math.sqrt(d)))); ht += 0.012 * (1 - sstep(0, 3, Math.sqrt(d))) }
  }
  const gr = fbm3(b[0] * 24 + 1, b[1] * 24, b[2] * 24 + 5, 2), g = 0.93 + 0.14 * gr
  c = [c[0] * g, c[1] * g, c[2] * g]
  ht += (fbm3(b[0] * 6 + 3, b[1] * 6, b[2] * 6, 3) - 0.5) * 0.02 + craterField(b[0], b[1], b[2], 17, 3, 0.4, 0.3) + craterField(b[0], b[1], b[2], 7, 9, 0.18, 0.25)
  const nCap = 79 + 3 * (rag - 0.5) * 3, sCap = -75 - 4 * (rag - 0.5) * 3
  const cap = Math.max(sstep(nCap - 1.2, nCap + 1.2, lat), sstep(-sCap - 1.5, -sCap + 1.5, -lat))
  const collar = Math.max(sstep(nCap - 7, nCap - 1, lat) * (1 - sstep(nCap - 1, nCap + 1, lat)), sstep(-sCap - 8, -sCap - 1.5, -lat) * (1 - sstep(-sCap - 1.5, -sCap + 1.5, -lat)))
  c = mix3(c, [118, 76, 62], collar * 0.45)
  c = mix3(c, [238, 240, 244], cap * 0.95)
  return [c[0], c[1], c[2], ht]
}
function plutoColor(b) {
  const lon = Math.atan2(b[0], b[2]) / d2r, lat = -Math.asin(clamp(b[1], -1, 1)) / d2r
  const nL = fbm3(b[0] * 3 + 4, b[1] * 3, b[2] * 3, 4), nM = fbm3(b[0] * 9 + 1, b[1] * 9, b[2] * 9, 3), nF = vnoise3(b[0] * 26 + 3, b[1] * 26, b[2] * 26)
  const wl = (fbm3(b[0] * 5 + 8, b[1] * 5, b[2] * 5, 2) - 0.5) * 12, wb = (fbm3(b[0] * 5, b[1] * 5 + 8, b[2] * 5, 2) - 0.5) * 12
  let c = mix3([150, 112, 86], [198, 170, 142], sstep(0.3, 0.7, nL))
  const eq = 1 - sstep(10, 30, Math.abs(lat) + (nL - 0.5) * 22)
  c = mix3(c, [96, 54, 40], eq * 0.5 * (0.45 + nM))
  const ct = ovalW(lat + wb * 0.5, lon + wl * 0.5, 122, -6, 34, 16, nM - 0.5)                              // dark red Cthulhu Macula
  c = mix3(c, [64, 32, 26], ct * 0.9)
  c = mix3(c, [128, 80, 60], sstep(52, 72, lat) * 0.55)                                                 // dark polar cap in the north
  const la = lat + wb, lo = lon + wl
  const west = Math.max(ovalW(la, lo, 172, 24, 20, 25, nM - 0.5), ovalW(la, lo, 186, 0, 11, 15, nM - 0.5) * 0.9)  // Sputnik Planitia, the left lobe of the heart
  const east = ovalW(la, lo, 209, 27, 17, 19, nM - 0.5)                                                  // the Tombaugh Regio highlands, the right lobe
  c = mix3(c, [226, 210, 186], east * 0.88)
  c = mix3(c, [246, 238, 226], west * 0.96)
  const g = 0.93 + 0.12 * nF + 0.08 * (nM - 0.5)
  const ht = (fbm3(b[0] * 7 + 5, b[1] * 7, b[2] * 7, 3) - 0.5) * 0.018 * (1 - west) + craterField(b[0], b[1], b[2], 12, 5, 0.3, 0.3) * (1 - west) + craterField(b[0], b[1], b[2], 28, 2, 0.2, 0.25) * (1 - west)
  return [c[0] * g, c[1] * g, c[2] * g, ht]
}
const LAW = { mars: { e: [0.78, 0.8, 0.82], bump: 1.1, rim: 0.28 }, pluto: { e: [0.7, 0.7, 0.72], bump: 1.2, rim: 0.12 }, jupiter: { e: [0.5, 0.62, 0.8], bump: 0, rim: 0.12 } }
function planetSurface(R, s, f, kind, o) {
  if (kind === "earth") return earthSurface(R, s, f, o)
  if (kind === "saturn") return saturnSurface(R, s, f, o)
  const N = surfN(R, s, kind), c0 = N / 2, k = R * s, NN = N * N
  const law = LAW[kind] || { e: [0.5, 0.5, 0.5], bump: 0, rim: 0.3 }
  const cr = new Float32Array(NN), cg = new Float32Array(NN), cb = new Float32Array(NN), ht = new Float32Array(NN), inside = new Uint8Array(NN)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, rr2 = x * x + y * y
    if (rr2 > 1.06) continue
    const p = j * N + i, z = Math.sqrt(Math.max(0, 1 - rr2)), bb = viewToBody([x, y, z], o)
    const c = kind === "jupiter" ? jupiterColor(bb) : kind === "mars" ? marsColor(bb) : kind === "pluto" ? plutoColor(bb) : planetColor(kind, bb)
    cr[p] = c[0]; cg[p] = c[1]; cb[p] = c[2]; ht[p] = c[3] || 0; inside[p] = 1
  }
  const rimc = rgb(RIM[kind] || "#FFFFFF"), DARK = [4, 4, 8], px = new Uint8Array(NN * 4)
  const pad = PAD[kind] || 0
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, rr = Math.sqrt(x * x + y * y), p = j * N + i
    const edge = clamp((1 - rr) * k + 0.5, 0, 1)
    if (edge <= 0) {
      if (kind === "mars" && rr < 1 + pad) {                                    // a thin blush of dusty air above the limb
        const el = clamp((x * LIGHT[0] + y * LIGHT[1]) / rr + 0.5 * Math.max(0, LIGHT[2]), -1, 1), a = Math.exp(-(rr - 1) / 0.012) * 0.4 * sstep(-0.4, 0.5, el)
        px[p * 4] = 214; px[p * 4 + 1] = 168; px[p * 4 + 2] = 150; px[p * 4 + 3] = Math.round(255 * a)
      }
      continue
    }
    const z = Math.sqrt(Math.max(0, 1 - rr * rr))
    const ndl = law.bump ? bumpNdl(ht, N, p, k, x, y, z, rr, law.bump) : x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]
    const lit = sstep(-0.1, 0.32, ndl), gnd = clamp(ndl + 0.03, 0, 1)
    const geo = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2], term = sstep(-0.12, 0.3, geo)
    const rim = Math.pow(1 - z, 3) * law.rim * term
    const alb = [cr[p], cg[p], cb[p]]
    for (let ch = 0; ch < 3; ch++) {
      const v = lit * Math.pow(gnd, law.e[ch]) * (law.bump ? 1 : 0.74 + 0.26 * Math.sqrt(z))
      px[p * 4 + ch] = clamp(Math.round(DARK[ch] + (alb[ch] - DARK[ch]) * (0.035 + 0.965 * v) + rimc[ch] * rim), 0, 255)
    }
    px[p * 4 + 3] = Math.round(255 * edge)
  }
  return { img: pngFromRGBA(px, N, N), size: N / s }
}

// ---- Earth: real continents with coast detail and shelves, biomes, clouds with cyclones, sun glint, atmosphere, city lights, aurora ----
const CITIES = [[139.7, 35.7, 1, 3.2], [126.9, 37.5, 0.8, 2.2], [121.5, 31.2, 0.95, 3.2], [116.4, 39.9, 0.8, 3], [113.3, 23.1, 1, 3.2], [114.1, 22.3, 0.6, 1.2], [121.5, 25, 0.6, 1.5], [77.2, 28.6, 0.9, 3],
  [72.8, 19.1, 0.8, 2], [88.4, 22.6, 0.6, 2.2], [90.4, 23.8, 0.7, 1.8], [106.8, -6.2, 0.9, 2.5], [112.7, -7.3, 0.4, 1.8], [103.8, 1.35, 0.9, 1], [100.5, 13.8, 0.6, 1.8], [121, 14.6, 0.7, 1.8],
  [105.8, 21, 0.4, 1.3], [106.7, 10.8, 0.5, 1.5], [151.2, -33.9, 0.6, 1.5], [145, -37.8, 0.4, 1.3], [31.2, 30, 0.8, 2], [3.4, 6.5, 0.7, 1.6], [28, -26.2, 0.5, 1.6], [29, 41, 0.6, 1.6],
  [37.6, 55.7, 0.7, 2.4], [-0.1, 51.5, 0.9, 2.6], [2.3, 48.9, 0.8, 2], [7, 51.3, 0.8, 2.6], [-3.7, 40.4, 0.5, 1.6], [12.5, 41.9, 0.5, 1.6], [9.2, 45.5, 0.6, 2], [-74, 40.7, 1, 3.4],
  [-87.6, 41.9, 0.7, 2.4], [-118.2, 34, 0.8, 2.6], [-77, 38.9, 0.6, 2], [-122.3, 37.6, 0.5, 1.8], [-95.4, 29.8, 0.5, 1.8], [-99.1, 19.4, 0.7, 2], [-46.6, -23.5, 0.9, 2.8],
  [-58.4, -34.6, 0.7, 2.2], [-43.2, -22.9, 0.5, 1.8], [-77, -12, 0.5, 1.6], [-74.1, 4.7, 0.5, 1.6], [51.4, 35.7, 0.6, 1.8], [46.7, 24.7, 0.5, 1.5], [67, 24.9, 0.6, 1.8], [74.3, 31.5, 0.6, 2],
  [36.8, -1.3, 0.3, 1.3], [-0.2, 5.6, 0.3, 1.2], [135.5, 34.7, 0.8, 2], [127, 37, 0.3, 4]]
const CYCLONES = [[128, 16, 7, 1], [-28, 54, 14, 1], [82, -52, 14, -1], [-62, -41, 10, -1]]       // lon, lat, size (deg), spin direction
function cloudAt(b, la, lo, drift, full) {
  const cs = Math.cos(drift), sn = Math.sin(drift), cx = b[0] * cs + b[2] * sn, cz = -b[0] * sn + b[2] * cs
  const w = fbm3(cx * 2.1 + 4, b[1] * 2.1, cz * 2.1, 3)
  const n = fbm3(cx * 3.3 + w * 1.7, b[1] * 4.4 + w * 1.1, cz * 3.3 + w * 1.7, full ? 5 : 3)
  const al = Math.abs(la)
  const th = 0.55 - 0.15 * Math.exp(-Math.pow(la / 9, 2)) - 0.12 * Math.exp(-Math.pow((al - 52) / 11, 2)) + 0.1 * Math.exp(-Math.pow((al - 27) / 9, 2))
  let c = sstep(th, th + 0.2, n)
  for (const [lo0, la0, sz, dir] of CYCLONES) {
    const dl = adiff(lo, lo0) * Math.cos(la0 * d2r), dy = la - la0, d = Math.sqrt(dl * dl + dy * dy) / sz
    if (d > 2.6) continue
    const sp = 0.5 + 0.5 * Math.cos(dir * (Math.atan2(dy, dl) * 2 - 3.2 * Math.log(d + 0.12)) + n * 2)
    const cy = Math.exp(-d * d * 0.55) * (0.35 + 0.65 * sp) * (1 - Math.exp(-d * d * 14))
    c = Math.max(c, cy * 1.1)
  }
  if (full) c *= 0.8 + 0.4 * vnoise3(cx * 30 + 7, b[1] * 52, cz * 30)
  return clamp(c, 0, 1)
}
function earthSurface(R, s, f, o) {
  const N = surfN(R, s, "earth"), c0 = N / 2, k = R * s, NN = N * N, m = earthMap()
  const sr = new Float32Array(NN), sg = new Float32Array(NN), sb = new Float32Array(NN), om = new Float32Array(NN), cld = new Float32Array(NN), shd = new Float32Array(NN), ht = new Float32Array(NN), inside = new Uint8Array(NN)
  const Sb = viewToBody(LIGHT, o), drift = Math.floor(now.getTime() / 600000) * 0.0025
  const lm = (lo, la) => m[clamp(Math.floor(90 - la), 0, 179) * 360 + (((Math.floor(lo + 180) % 360) + 360) % 360)] !== 0 ? 1 : 0
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, rr2 = x * x + y * y
    if (rr2 > 1.06) continue
    const p = j * N + i, z = Math.sqrt(Math.max(0, 1 - rr2)), b = viewToBody([x, y, z], o)
    const la = -Math.asin(clamp(b[1], -1, 1)) / d2r, lo = 103.82 + Math.atan2(b[0], b[2]) / d2r, al = Math.abs(la)
    const fx = (((lo + 180) % 360) + 360) % 360 - 0.5, fy = clamp(90 - la - 0.5, 0, 178.999), x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0
    let wL = 0, wD = 0, wI = 0
    for (let q = 0; q < 4; q++) {
      const w = (q & 1 ? tx : 1 - tx) * (q >> 1 ? ty : 1 - ty), cls = m[Math.min(179, y0 + (q >> 1)) * 360 + ((x0 + (q & 1) + 360) % 360)]
      if (cls === 1) wL += w; else if (cls === 2) wD += w; else if (cls === 3) wI += w
    }
    const landW = wL + wD + wI, cn = fbm3(b[0] * 26 + 3, b[1] * 26, b[2] * 26 + 1, 3) - 0.5
    const land = sstep(0.42, 0.58, landW + cn * 0.42)
    const mt = fbm3(b[0] * 9 + 2, b[1] * 9, b[2] * 9, 3), mt2 = vnoise3(b[0] * 30, b[1] * 30 + 3, b[2] * 30)
    let col
    if (land > 0.01) {
      let veg = mix3([54, 100, 44], [100, 130, 60], sstep(0.35, 0.7, mt))
      veg = mix3(veg, [26, 74, 38], 0.75 * clamp(1 - al / 15, 0, 1))
      veg = mix3(veg, [42, 76, 58], sstep(48, 58, al) * 0.8)
      veg = mix3(veg, [132, 126, 106], sstep(64, 72, al))
      const des = mix3([208, 172, 110], [198, 122, 78], sstep(0.4, 0.7, mt))
      let lc = [(wL * veg[0] + wD * des[0] + wI * 242) / (landW + 1e-3), (wL * veg[1] + wD * des[1] + wI * 246) / (landW + 1e-3), (wL * veg[2] + wD * des[2] + wI * 250) / (landW + 1e-3)]
      const bl = (lo0, la0, rl, rb) => { const u = adiff(lo, lo0) * Math.cos(la0 * d2r) / rl, v = (la - la0) / rb; return Math.exp(-(u * u + v * v)) }
      const mtn = clamp(sstep(0.64, 0.84, fbm3(b[0] * 5 + 11, b[1] * 5, b[2] * 5, 3)) * 0.6 + bl(88, 33, 16, 6) + bl(-70, -18, 4.5, 24) * 0.8 + bl(-113, 43, 7, 15) * 0.6, 0, 1)
      lc = mix3(lc, [158, 140, 118], mtn * 0.55)
      lc = mix3(lc, [240, 242, 246], sstep(0.74, 0.95, mtn) * 0.7 * (wI > 0.5 ? 0 : 1))
      const g = 0.92 + 0.16 * mt2
      col = [lc[0] * g, lc[1] * g, lc[2] * g]
      ht[p] = land * (0.003 * mt + 0.012 * mtn)
    } else col = [0, 0, 0]
    let oc = [0, 0, 0]
    if (land < 0.99) {
      const sh = (lm(lo + 2.2, la) + lm(lo - 2.2, la) + lm(lo, la + 2.2) + lm(lo, la - 2.2)) / 4
      oc = mix3(mix3([7, 30, 84], [16, 62, 132], 0.35 + 0.5 * (fbm3(b[0] * 4 + 1, b[1] * 4, b[2] * 4, 2))), [40, 124, 164], sstep(0, 0.6, sh) * 0.9)
      const ice = Math.max(sstep(0, 1, (la - 73 - cn * 14) / 3), sstep(0, 1, (-la - 63 - cn * 10) / 3))
      oc = mix3(oc, [228, 236, 246], ice * 0.95)
      om[p] = (1 - land) * (1 - ice)
    }
    sr[p] = col[0] * land + oc[0] * (1 - land); sg[p] = col[1] * land + oc[1] * (1 - land); sb[p] = col[2] * land + oc[2] * (1 - land)
    cld[p] = cloudAt(b, la, lo, drift, true)
    const geo = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]
    if (geo > 0.05) { const q = norm3([b[0] + 0.03 * Sb[0], b[1] + 0.03 * Sb[1], b[2] + 0.03 * Sb[2]]); shd[p] = cloudAt(q, la, lo, drift, false) }
    inside[p] = 1
  }
  const px = new Uint8Array(NN * 4), nlight = EFFECTS, pad = PAD.earth
  const HV = norm3([LIGHT[0], LIGHT[1], LIGHT[2] + 1])
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, rr = Math.sqrt(x * x + y * y), p = j * N + i
    const edge = clamp((1 - rr) * k + 0.5, 0, 1)
    if (rr >= 1 + pad) continue
    let aa = 0, ac = [0, 0, 0]
    {
      const el = rr > 1e-4 ? (x * LIGHT[0] + y * LIGHT[1]) / rr : 0, lo = sstep(-0.35, 0.45, el + 0.45 * Math.max(0, LIGHT[2]))
      const r1 = Math.max(rr, 1), g = Math.exp(-(r1 - 1) / 0.03)
      aa = g * 0.8 * lo * (1 - edge); ac = mix3([80, 140, 255], [170, 210, 255], Math.exp(-(r1 - 1) / 0.01))
    }
    let dc = [0, 0, 0]
    if (edge > 0) {
      const z = Math.sqrt(Math.max(0, 1 - rr * rr))
      const geo = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2], ndl = bumpNdl(ht, N, p, k, x, y, z, rr, 0.45)
      const day = sstep(-0.05, 0.22, geo), lam = Math.pow(clamp(ndl, 0, 1), 0.72)
      const ca = clamp(cld[p] * 1.08, 0, 0.97), tw = Math.exp(-Math.pow((geo - 0.03) / 0.1, 2))
      const sh = 1 - 0.5 * shd[p] * (1 - ca)
      let sl = [sr[p] * (lam * day * sh + 0.012), sg[p] * (lam * day * sh + 0.012), sb[p] * (lam * day * sh + 0.012)]
      const nh = Math.max(0, x * HV[0] + y * HV[1] + z * HV[2]), oceanM = om[p] * day * (1 - 0.92 * ca)
      const spec = Math.pow(nh, 90) * 0.55 + Math.pow(nh, 22) * 0.1
      sl = [sl[0] + 255 * spec * oceanM, sl[1] + 246 * spec * oceanM, sl[2] + 226 * spec * oceanM]
      const fr = Math.pow(1 - z, 4) * 0.55 * om[p] * day
      sl = mix3(sl, [118, 168, 238], fr * 0.8)
      const cl = 0.03 + 0.97 * day * Math.pow(clamp(geo + 0.06, 0, 1.05), 0.6)
      const cc = [252 * cl * (1 - 0.1 * tw), 252 * cl * (1 - 0.34 * tw), 255 * cl * (1 - 0.58 * tw)]
      dc = mix3(sl, cc, ca)
      dc[0] += 14 * ca * (1 - day); dc[1] += 20 * ca * (1 - day); dc[2] += 36 * ca * (1 - day)
      const ha = Math.pow(1 - z, 2.3) * 0.75 * sstep(-0.3, 0.5, geo)
      dc = [dc[0] + 60 * ha, dc[1] + 120 * ha, dc[2] + 250 * ha]
      const night = 1 - day
      if (nlight && night > 0.2 && z > 0.08) {
        const bb = viewToBody([x, y, z], o), la = -Math.asin(clamp(bb[1], -1, 1)) / d2r, lo = 103.82 + Math.atan2(bb[0], bb[2]) / d2r
        const cls = m[clamp(Math.floor(90 - la), 0, 179) * 360 + (((Math.floor(lo + 180) % 360) + 360) % 360)]
        let L = 0
        if (om[p] < 0.5 && cls !== 3) {
          let pop = 0
          for (const [cx, cy, st, sp] of CITIES) {
            const dy = la - cy; if (dy > sp * 3.4 || dy < -sp * 3.4) continue
            const dx = adiff(lo, cx) * Math.cos(cy * d2r), d2 = (dx * dx + dy * dy) / (sp * sp)
            if (d2 < 11) pop += st * (Math.exp(-d2 * 1.6) * 1.2 + 0.28 * Math.exp(-d2 * 0.25))
          }
          const grain = vnoise3(bb[0] * 70 + 1, bb[1] * 70, bb[2] * 70 + 3), cl2 = fbm3(bb[0] * 18 + 1, bb[1] * 18, bb[2] * 18, 2)
          L = clamp(pop * (0.35 + 1.0 * grain) * (0.6 + 0.8 * cl2), 0, 1.5) * (cls === 2 ? 0.5 : 1) * (1 - sstep(55, 68, Math.abs(la)))
        }
        const sdx = bb[0], sdy = bb[1] + Math.sin(OBS.lat), sdz = bb[2] - Math.cos(OBS.lat), sg2 = Math.exp(-(sdx * sdx + sdy * sdy + sdz * sdz) / (0.05 * 0.05)) * (z > 0.2 ? 1 : 0)
        L = clamp(L + sg2 * 1.4, 0, 1.5) * night * night * (1 - 0.8 * ca)
        dc = [dc[0] + 255 * L, dc[1] + 190 * L, dc[2] + 100 * L]
        const au = Math.exp(-Math.pow((Math.abs(la) - 67) / 4.5, 2)) * (0.45 + fbm3(bb[0] * 6 + 3, bb[1] * 20, bb[2] * 6, 3)) * night * night * 0.9
        const pu = fbm3(bb[0] * 3 + 8, bb[1] * 9, bb[2] * 3, 2)
        dc = [dc[0] + (60 + 110 * pu) * au, dc[1] + (255 - 100 * pu) * au, dc[2] + (140 + 100 * pu) * au]
      }
    }
    const A = edge + (1 - edge) * aa
    if (A <= 0.002) continue
    for (let ch = 0; ch < 3; ch++) px[p * 4 + ch] = clamp(Math.round((dc[ch] * edge + ac[ch] * (1 - edge) * aa) / A), 0, 255)
    px[p * 4 + 3] = Math.round(255 * A)
  }
  return { img: pngFromRGBA(px, N, N), size: N / s }
}

// ---- Saturn: globe and rings traced together, so the rings pass in front of and behind the planet, throw a shadow on it, and receive its shadow ----
function ringTau(r, sm) {                                                       // opacity of the rings at r (Saturn radii): C ring, B ring, Cassini Division, A ring, Encke gap
  if (r < 1.24 || r > 2.27) return 0
  const fine = sm ? 0.5 : vnoise3(r * 38 + 3, 1.7, 0.4), mid = sm ? 0.5 : vnoise3(r * 13 + 8, 0.5, 5.1)
  let t
  if (r < 1.526) t = (0.1 + 0.12 * sstep(1.3, 1.5, r)) * (0.55 + 0.9 * fine)
  else if (r < 1.95) t = (0.5 + 0.45 * sstep(1.53, 1.72, r) - 0.15 * sstep(1.88, 1.95, r)) * (0.8 + 0.3 * (fine - 0.5) * 2 * 0.6 + 0.3 * (mid - 0.5))
  else if (r < 2.025) t = 0.05 + 0.07 * fine + 0.35 * Math.exp(-Math.pow((r - 1.99) / 0.008, 2))
  else { t = (0.62 + 0.22 * (mid - 0.5) + 0.12 * (fine - 0.5)) * (1 - 0.35 * sstep(2.24, 2.27, r)); t *= 1 - 0.92 * Math.exp(-Math.pow((r - 2.214) / 0.012, 2)) }
  const e = sstep(1.24, 1.27, r) * (1 - sstep(2.262, 2.27, r))
  return clamp(t, 0, 1) * e
}
function ringColor(r, fine) {
  const g = 0.92 + 0.16 * fine
  let c = r < 1.526 ? [122, 108, 94] : r < 1.95 ? mix3([214, 188, 144], [238, 214, 168], sstep(1.55, 1.75, r)) : r < 2.025 ? [176, 156, 124] : [206, 186, 150]
  if (r > 1.45 && r < 1.58) c = mix3(c, mix3([122, 108, 94], [214, 188, 144], sstep(1.45, 1.58, r)), 1)
  return [c[0] * g, c[1] * g, c[2] * g]
}
function saturnSurface(R, s, f, o) {
  const N = surfN(R, s, "saturn"), c0 = N / 2, k = R * s, NN = N * N, px = new Uint8Array(NN * 4)
  const Lb = viewToBody(LIGHT, o), dv = viewToBody([0, 0, 1], o), litFace = (dv[1] >= 0) === (Lb[1] >= 0)
  const DARK = [4, 4, 8], rimc = rgb(RIM.saturn), e = [0.4, 0.45, 0.56]
  const flat = Math.abs(dv[1]) > 1e-4
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, rr = Math.sqrt(x * x + y * y), p = j * N + i
    let pa = clamp((1 - rr) * k + 0.5, 0, 1), pc = [0, 0, 0], z = 0
    const ob = viewToBody([x, y, 0], o)
    if (pa > 0) {
      z = Math.sqrt(Math.max(0, 1 - rr * rr))
      const bb = [ob[0] + z * dv[0], ob[1] + z * dv[1], ob[2] + z * dv[2]], alb = saturnColor(bb)
      const geo = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2], lit = sstep(-0.1, 0.32, geo), gnd = clamp(geo + 0.03, 0, 1)
      let shade = 1
      if (EFFECTS && Math.abs(Lb[1]) > 1e-3) {                                               // the rings' shadow on the globe (4 taps keep the thin shadow line smooth)
        let sh = 0
        for (let q = 0; q < 4; q++) {
          const xx = x + ((q & 1) - 0.5) * 0.9 / k, yy = y + ((q >> 1) - 0.5) * 0.9 / k, zz = Math.sqrt(Math.max(0, 1 - xx * xx - yy * yy)), o2 = viewToBody([xx, yy, 0], o)
          const b2 = [o2[0] + zz * dv[0], o2[1] + zz * dv[1], o2[2] + zz * dv[2]], u = -b2[1] / Lb[1]
          if (u > 0) { const tt = ringTau(Math.hypot(b2[0] + u * Lb[0], b2[2] + u * Lb[2]), true); sh += tt }
        }
        shade = 1 - 0.7 * sh / 4
      }
      const rim = Math.pow(1 - z, 3) * 0.2 * sstep(-0.12, 0.3, geo)
      for (let ch = 0; ch < 3; ch++) pc[ch] = clamp(DARK[ch] + (alb[ch] - DARK[ch]) * (0.035 + 0.965 * lit * Math.pow(gnd, e[ch]) * (0.78 + 0.22 * Math.sqrt(z))) * shade + rimc[ch] * rim, 0, 255)
    }
    let tau = 0, rc = [0, 0, 0]
    if (flat) {
      let ta = 0, ra = 0, ga = 0, ba = 0
      for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {                        // 3x3 samples keep the thin ring edges smooth
        const ox = (sx - 1) / 3, oy = (sy - 1) / 3, ob2 = viewToBody([x + ox / k, y + oy / k, 0], o)
        const t = -ob2[1] / dv[1], qx = ob2[0] + t * dv[0], qz = ob2[2] + t * dv[2], rg = Math.hypot(qx, qz)
        if (rg < 1.24 || rg > 2.27) continue
        const zz = 1 - (x + ox / k) * (x + ox / k) - (y + oy / k) * (y + oy / k)
        if (zz > 0 && t < Math.sqrt(zz)) continue                                          // hidden behind the globe
        let tt = ringTau(rg)
        if (tt <= 0.003) continue
        let cc = ringColor(rg, vnoise3(rg * 61, 4.4, 2.2))
        let br = litFace ? 1 : 0.1 + 0.55 * clamp((1 - tt) * 1.1, 0, 1) * Math.min(1, tt * 3)
        if (EFFECTS) { const bq = qx * Lb[0] + qz * Lb[2], disc = bq * bq - (qx * qx + qz * qz - 1); if (disc > 0 && -bq - Math.sqrt(disc) > 0) br *= 0.1 + 0.9 * (1 - sstep(0, 0.05, disc)) }   // Saturn's shadow across the rings
        tt *= 0.97
        ta += tt; ra += cc[0] * br * tt; ga += cc[1] * br * tt; ba += cc[2] * br * tt
      }
      if (ta > 0) { tau = ta / 9; rc = [ra / ta, ga / ta, ba / ta] }
    }
    const A = tau + pa * (1 - tau)
    if (A <= 0.003) continue
    for (let ch = 0; ch < 3; ch++) px[p * 4 + ch] = clamp(Math.round((rc[ch] * tau + pc[ch] * pa * (1 - tau)) / A), 0, 255)
    px[p * 4 + 3] = Math.round(255 * A)
  }
  return { img: pngFromRGBA(px, N, N), size: N / s }
}

// ---- Sun: limb darkening that reddens toward the edge, granulation cells, supergranules, bright faculae, sunspot groups with umbra and penumbra ----
const SUNSPOTS = [[-30, 13, 0.034], [-24, 11, 0.017], [-36, 15, 0.013], [-20, 16, 0.01], [36, -16, 0.024], [41, -14, 0.012], [31, -19, 0.01], [63, 9, 0.02], [67, 11, 0.01]].map(([lo, la, r]) => {
  const a = lo * d2r, b = la * d2r
  return { c: [Math.sin(a) * Math.cos(b), -Math.sin(b), Math.cos(a) * Math.cos(b)], r }
})
function sunSurface(R, s) {
  const N = Math.ceil(2 * R * s) + 2, c0 = N / 2, k = R * s, px = new Uint8Array(N * N * 4)
  const W = [[1, 255, 250, 222], [0.72, 255, 232, 150], [0.45, 255, 196, 82], [0.2, 255, 148, 40], [0, 214, 84, 16]]
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, rr = Math.sqrt(x * x + y * y)
    const edge = clamp((1 - rr) * k + 0.5, 0, 1)
    if (edge <= 0) continue
    const z = Math.sqrt(Math.max(0, 1 - rr * rr)), p = (j * N + i) * 4
    let q = 1
    while (q < W.length - 1 && W[q][0] > z) q++
    const t = clamp((z - W[q][0]) / (W[q - 1][0] - W[q][0]), 0, 1), c = [0, 1, 2].map((ch) => W[q][ch + 1] + (W[q - 1][ch + 1] - W[q][ch + 1]) * t)
    const ld = 0.62 + 0.5 * Math.pow(z, 0.7)                                                     // limb darkening (bright overall, a touch under at the rim)
    // granulation: bright cells with dark lanes (jittered 3D cells, foreshortened toward the limb for free)
    const gx = x * 40 + 5, gy = y * 40 + 2, gz = z * 40 + 9, ix = Math.floor(gx - 0.5), iy = Math.floor(gy - 0.5), iz = Math.floor(gz - 0.5)
    let d1 = 9, d2 = 9, cb = 0
    for (let dz = 0; dz < 2; dz++) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const cx = ix + dx, cy = iy + dy, cz = iz + dz
      const ox = cx + 0.15 + 0.7 * hash3(cx, cy, cz), oy = cy + 0.15 + 0.7 * hash3(cx + 31, cy, cz), oz = cz + 0.15 + 0.7 * hash3(cx, cy + 17, cz)
      const d = Math.hypot(gx - ox, gy - oy, gz - oz)
      if (d < d1) { d2 = d1; d1 = d; cb = hash3(cx, cy + 5, cz + 3) } else if (d < d2) d2 = d
    }
    const lane = 1 - sstep(0.0, 0.42, d2 - d1), gran = 1 - 0.075 * lane + 0.06 * (cb - 0.5) + 0.03 * (vnoise3(x * 90, y * 90, z * 90 + 4) - 0.5)
    const sg = fbm3(x * 5.5 + 3, y * 5.5, z * 5.5 + 1, 3), super_ = 0.96 + 0.08 * sg
    const fac = sstep(0.55, 0.85, fbm3(x * 10 + 9, y * 10, z * 10 + 4, 3)) * sstep(0.5, 0.95, 1 - z) * 0.22
    let sp = 1, red = 0
    for (const S of (SHOW_SUNSPOTS ? SUNSPOTS : [])) {
      const cd = x * S.c[0] + y * S.c[1] + z * S.c[2]
      if (cd < 0.9) continue
      const ang = Math.acos(Math.min(1, cd)), pr = S.r * 2.4
      if (ang > pr) continue
      const um = 1 - sstep(S.r * 0.7, S.r * 1.05, ang), pe = 1 - sstep(pr * 0.8, pr, ang)
      const fil = 0.75 + 0.5 * vnoise3(ang * 70, Math.atan2(y - S.c[1], x - S.c[0]) * 3.5, 1.3)
      const m = 0.12 * um + (1 - um) * (1 - pe * (0.5 + 0.1 * (fil - 1)))
      if (m < sp) sp = m
      red = Math.max(red, pe)
    }
    const br = ld * gran * super_ * sp + fac * ld
    const rb = 1 - 0.1 * red
    px[p] = clamp(Math.round(c[0] * br), 0, 255); px[p + 1] = clamp(Math.round(c[1] * br * rb), 0, 255); px[p + 2] = clamp(Math.round(c[2] * br * rb * rb), 0, 255)
    px[p + 3] = Math.round(255 * edge)
  }
  return { img: pngFromRGBA(px, N, N), size: N / s }
}

// ---- moons of the planets: real orbital periods, so they are really where they should be (roughly) ----
// [period days (negative = retrograde), orbit radius in planet radii, flatten, size in planet radii, colour]
// ---- eclipses, from the real Sun/Moon geometry (only drawn when that body is the one on show) ----
function eclipseGeom() {
  const sd = sunDirEq(), md = bodyDirEq("moon"), B = viewBasis(md)
  const anti = [-sd[0], -sd[1], -sd[2]]
  return { sepAnti: Math.acos(clamp(dot3(md, anti), -1, 1)) / d2r, sepSun: Math.acos(clamp(dot3(md, sd), -1, 1)) / d2r,
    toAnti: [dot3(sub3(anti, md), B.right) / (0.26 * d2r), -dot3(sub3(anti, md), B.up) / (0.26 * d2r)],        // Earth's shadow centre, in Moon radii
    toSun: [dot3(sub3(sd, md), B.right) / (0.267 * d2r), -dot3(sub3(sd, md), B.up) / (0.267 * d2r)] }
}
let ECL = null, ECLG = null
const SATS = {
  earth: [[27.32, 2.1, 0.35, 0.19, "#CFCFCA"]],
  mars: [[0.319, 1.55, 0.2, 0.07, "#B9A99A"], [1.263, 2.05, 0.2, 0.06, "#A89888"]],
  jupiter: [[1.7627, 1.5, 0.1, 0.075, "#F2D98B"], [3.5255, 1.8, 0.1, 0.07, "#E8E0D0"], [7.155, 2.15, 0.1, 0.1, "#BDB4A8"], [16.689, 2.5, 0.1, 0.09, "#8C8277"]],
  saturn: [[15.945, 2.6, 0.27, 0.11, "#E7B96B"]],
  uranus: [[8.706, 1.9, 0.15, 0.07, "#C9C4BE"], [13.463, 2.3, 0.15, 0.07, "#B8B0A8"]],
  neptune: [[-5.877, 2.0, 0.2, 0.08, "#D8D2CC"]],
  pluto: [[6.3872, 2.0, 0.2, 0.32, "#B8A9A0"]],
}
let LIGHT = [1, 0, 0]
let satLimit = 80                                   // max distance from the body centre (set by render)
function satellites(ctx, cx, cy, R) {
  const list = SATS[BODY.kind]
  if (!list) return
  const maxA = Math.max(...list.map((q) => q[1])) * R, f = Math.min(1, satLimit / maxA)
  const day = now.getTime() / 86400000
  let B = null, U = null
  if (REAL && SATD[BODY.kind]) { U = bodyDirEq(BODY.kind); B = viewBasis(U) }
  list.forEach(([P, a, fl, sz, hex], i) => {
    let x, y, behind
    if (B && SATD[BODY.kind][i]) {                                              // real position: JPL elements projected on the sky as the observer sees it
      const sd = SATD[BODY.kind][i], v = satVec(sd), aT = sd[0]
      x = cx + dot3(v, B.right) / aT * a * R * f; y = cy - dot3(v, B.up) / aT * a * R * f
      behind = dot3(v, U) > 0 && Math.hypot(x - cx, y - cy) < R * 1.02          // farther than the planet and hidden by it
    } else {
      const ph = REAL && BODY.kind === "earth" ? (218.3164477 + 13.17639648 * dJ + 6.288774 * Math.sin((134.9633964 + 13.06499295 * dJ) * d2r)) * Math.PI / 180 : 2 * Math.PI * (day / P) + i * 1.7   // Earth's Moon: real ecliptic longitude, seen from above
      x = cx + a * R * f * Math.cos(ph); y = cy + a * R * f * fl * Math.sin(ph)
      behind = Math.sin(ph) < 0 && Math.hypot(x - cx, y - cy) < R * 1.02          // behind the planet
    }
    if (behind) return
    const r = Math.max(0.9, sz * R), lx = LIGHT[0], ly = LIGHT[1]
    dot(ctx, x, y, r * 1.9, hex, 0.04); dot(ctx, x, y, r, mixHex(hex, "#101018", 0.25), 0.95)
    dot(ctx, x + r * 0.2 * lx, y + r * 0.2 * ly, r * 0.7, hex, 0.9)             // lit side faces the Sun
  })
}

function arcPath(cx, cy, R, th, span, h, n) {                                 // a loop of plasma standing on the limb
  const path = new Path()
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = th - span + 2 * span * t, rad = R * (1 + h * Math.sin(Math.PI * t))
    const pt = new Point(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
    if (i === 0) path.move(pt); else path.addLine(pt)
  }
  return path
}
function sunFlares(ctx, cx, cy, R) {                                          // heat flares: soft glowing loops and plumes rising off the limb (new ones every ~10 minutes), drawn behind the disc
  const r = rng(Math.floor(now.getTime() / 600000) * 7919 + 17), n = 3
  for (let i = 0; i < n; i++) {                                                // loops
    const th = r() * Math.PI * 2, span = 0.12 + r() * 0.1, h = 0.08 + r() * 0.1, m = 40
    for (let j = 0; j <= m; j++) {
      const t = j / m, a = th - span + 2 * span * t, rad = R * (1 + h * Math.pow(Math.sin(Math.PI * t), 0.8)) * (0.996 + 0.008 * r())
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad, w = R * (0.022 + 0.02 * Math.sin(Math.PI * t)) * (0.8 + 0.4 * r())
      dot(ctx, x, y, w * 4, "#FF6A28", 0.013); dot(ctx, x, y, w * 2.2, "#FF8A38", 0.03); dot(ctx, x, y, w * 1.1, "#FFAA60", 0.05); dot(ctx, x, y, w * 0.5, "#FFD59A", 0.06)
    }
  }
  for (let i = 0; i < 2; i++) {                                                // plumes: a cloud of hot gas drifting out and fading
    const th = r() * Math.PI * 2, len = R * (0.35 + r() * 0.35), m = 18
    for (let j = 0; j <= m; j++) {
      const t = j / m, d = R * 0.98 + len * t, wob = (r() - 0.5) * R * 0.06
      const x = cx + Math.cos(th) * d - Math.sin(th) * wob, y = cy + Math.sin(th) * d + Math.cos(th) * wob
      const w = R * (0.1 + 0.16 * t), f = 1 - t
      dot(ctx, x, y, w * 2.2, "#FF6A28", 0.02 * f); dot(ctx, x, y, w, "#FF9440", 0.045 * f); dot(ctx, x, y, w * 0.45, "#FFC070", 0.06 * f)
    }
  }
}

function solarEclipse(ctx, cx, cy, R) {
  const g = ECLG; if (!g || g.sepSun > 1.5) return
  const ex = g.toSun[0], ey = g.toSun[1], d = Math.hypot(ex, ey)                  // Moon's disc, relative to the Sun's
  if (d > 2.1) return
  if (d < 0.25) { dot(ctx, cx, cy, R * 2.2, "#DDE6FF", 0.07); dot(ctx, cx, cy, R * 1.6, "#EEF2FF", 0.12) }   // corona when nearly total
  dot(ctx, cx - ex * R, cy - ey * R, R * 1.003, "#020204", 1)
}
function jupiterShadows(ctx, cx, cy, R) {                                      // each Galilean moon's shadow on the cloud tops, where the Sun really puts it
  const U = bodyDirEq("jupiter"), B = viewBasis(U), sd = sunDirEq(), RJ = 71492, dv = [-sd[0], -sd[1], -sd[2]]
  const rad = [1822, 1561, 2634, 2410]
  SATD.jupiter.forEach((q, i) => {
    const v = satVec(q), b = dot3(v, dv), c = dot3(v, v) - RJ * RJ, disc = b * b - c
    if (disc < 0) return
    const t = -b - Math.sqrt(disc); if (t <= 0) return
    const h = [v[0] + dv[0] * t, v[1] + dv[1] * t, v[2] + dv[2] * t]
    if (dot3(h, U) > 0) return                                                   // on the far side
    const x = cx + dot3(h, B.right) / RJ * R, y = cy - dot3(h, B.up) / RJ * R, r = Math.max(R * 0.05, rad[i] / RJ * R * 1.6)
    dot(ctx, x, y, r * 1.6, "#2A1A12", 0.2); dot(ctx, x, y, r, "#0C0705", 0.8)
  })
}
function resetBurst(ctx, cx, cy, R) {                                          // gold shimmer in the final hour before the reset: soft specks and a warm bloom, no lines
  const r = rng(Math.floor(now.getTime() / 60000) * 104729 + 3)
  for (let i = 0; i < 22; i++) { const a = r() * Math.PI * 2, d = R * (1.25 + r() * 1.3); dot(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d, 0.6 + r() * 1.0, "#FFF1C8", 0.35 + r() * 0.4) }
  for (let i = 12; i >= 1; i--) dot(ctx, cx, cy, R * (1.1 + 0.5 * i / 12), "#FFC85A", 0.012)
}

// ---- name + one fact, plus a hairline of white titanium (matches the wallpaper) ----
function bodyLabel(ctx, x, nameY, factY, lineY, align, u) {
  const nameHex = mixHex(BODY.tint, "#FFFFFF", 0.62)
  if (SHOW_NAME) text(ctx, BODY.name.toUpperCase().split("").join("\u200A\u200A"), Font.mediumSystemFont(6.8 * u), 6.8 * u, nameHex, 0.9, x, nameY, align)
  if (!SHOW_LINE) return
  const len = 54 * u, x0 = align === "left" ? x : x - len / 2, n = 18
  for (let i = 0; i < n; i++) {                     // titanium hairline that fades out at both ends
    const t0 = i / n, t1 = (i + 1) / n, fade = Math.sin(Math.PI * (t0 + t1) / 2)
    seg(ctx, x0 + len * t0, lineY, x0 + len * t1 + 0.4, lineY, "#E9ECF1", 0.5 * fade, 0.5)
  }
}

function axisOf(kind) {                       // the real viewing angle; Saturn's rings are nearly edge-on in 2025-27, so they are opened to at least RING_MIN_TILT_DEG to stay readable
  const a = axisFor(kind)
  if (kind === "saturn" && RING_MIN_TILT_DEG > 0) { const m = RING_MIN_TILT_DEG * d2r; if (Math.abs(a.lat) < m) a.lat = (a.lat < 0 ? -1 : 1) * m }
  return a
}
function drawMoon(ctx, cx, cy, R) {
  const isMoon = BODY.kind === "moon", isSun = BODY.kind === "sun"
  R = R * BODY.scale
  const f = REAL && !isSun ? clamp(BODY.kind === "earth" ? (1 + computeLight("earth", 0.5)[2]) / 2 : realFraction(BODY.kind), 0.02, 1) : isMoon ? 0.04 + 0.96 * progress : 0.55 + 0.45 * progress   // lit fraction: real phase, or crescent → full over the week
  const e = 1 - 2 * f
  AXIS = axisOf(BODY.kind)
  ECL = REAL && EFFECTS ? eclipseGeom() : null
  const lunarEcl = !!ECL && isMoon && ECL.sepAnti < 1.9
  if (!lunarEcl) { const g = ECL; ECL = null; if (g) ECLG = g } else ECLG = ECL
  if (!isSun) LIGHT = computeLight(BODY.kind, f)
  const warm = smooth(progress)
  const face = isMoon ? mixHex(MOON_COOL, MOON_WARM, warm) : BODY.hex
  const glowHex = resetDay ? GOLD_BRIGHT : face

  // soft layered halo, biased toward the lit side
  const hx = cx + R * 0.3 * (1 - f) * (isSun ? 0 : LIGHT[0]), hy = cy + R * 0.3 * (1 - f) * (isSun ? 0 : LIGHT[1])
  const base = resetDay ? (lastHour ? 0.12 : 0.1) : 0.035 + 0.03 * f
  const layers = resetDay ? 20 : 16              // many thin layers so the halo has no visible bands
  for (let i = layers; i >= 1; i--) {
    const rr = R * (1 + (resetDay ? 1.2 : 0.96) * i / layers)
    dot(ctx, hx, hy, rr, glowHex, 0.5 * base * Math.pow(1 - i / (layers + 1), 1.6))
  }
  if (resetDay && !isSun) {                      // fine gold orbit ring (two in the last hour)
    for (const [k, a] of lastHour ? [[1.3, 0.3], [1.52, 0.12]] : [[1.32, 0.24]]) {
      ctx.setStrokeColor(col(GOLD, a)); ctx.setLineWidth(0.4)
      ctx.strokeEllipse(new Rect(cx - R * k, cy - R * k, R * 2 * k, R * 2 * k))
    }
  }
  // thin bloom just outside the lit limb
  if (isMoon && !SUN_DIRECTION) fillPath(ctx, litPath(cx, cy, R * 1.03, clamp(e - 0.06, -1, 1)), face, 0.08)
  if (isSun) {                                   // corona: a smooth glow that thins out, with uneven soft streamers (no lines)
    for (let i = 48; i >= 1; i--) dot(ctx, cx, cy, R * (1 + 1.9 * i / 48), "#FFB347", 0.075 * Math.pow(1 - i / 49, 1.7))
    for (let i = 20; i >= 1; i--) dot(ctx, cx, cy, R * (1 + 0.35 * i / 20), "#FFF0C0", 0.09 * Math.pow(1 - i / 21, 1.3))   // hot white-gold inner glow
    const hz = rng(Math.floor(now.getTime() / 300000) * 17 + 3)            // heat haze: faint warm shimmer drifting just off the limb
    for (let i = 0; i < 26; i++) { const an = hz() * Math.PI * 2, d = R * (1.05 + hz() * 0.3); dot(ctx, cx + Math.cos(an) * d, cy + Math.sin(an) * d, R * (0.1 + hz() * 0.14), "#FF8A3A", 0.018) }
    const cr = rng(Math.floor(now.getTime() / 1800000) * 31 + 5)
    for (let i = 0; i < 46; i++) {
      const an = cr() * Math.PI * 2, d = R * (1.12 + cr() * 0.55), rr = R * (0.16 + cr() * 0.3)
      dot(ctx, cx + Math.cos(an) * d, cy + Math.sin(an) * d, rr, i % 4 ? "#FFC468" : "#FFE2A8", 0.016 + cr() * 0.016)
    }
  }
  if (EFFECTS && BODY.kind === "jupiter") { dot(ctx, cx, cy, R * 1.5, "#E3B98A", 0.035); dot(ctx, cx, cy, R * 1.22, "#F0CFA0", 0.06) }

  if (EFFECTS && isSun) sunFlares(ctx, cx, cy, R)
  let drawn = false
  try {
    // the surface is cached and re-shaded about once an hour, so most refreshes just read a file
    const sc = Device.screenScale(), N = surfN(R, sc, BODY.kind), size = N / sc
    AXIS = axisOf(BODY.kind)
    const turn = REAL ? { lon: 0, tilt: AXIS.lat, roll: AXIS.roll } : moonTurn(progress)   // real: tidally locked, only a slow libration               // ~2° of rotation per hourly bucket
    const slot = Math.floor(now.getTime() / 600000)
    const spins = !isMoon && !isSun && BODY.kind !== "mercury" && (REAL || SPIN_STEP_DEG > 0)
    const spin = !spins ? 0 : REAL ? realSpin(BODY.kind) : slot * SPIN_STEP_DEG * Math.PI / 180
    const key = `v9-${isMoon ? "" : BODY.name + "-"}${N}-${Math.round(((turn.lon / (2 * Math.PI)) % 1) * CYCLE_DAYS * 24)}-${Math.round(progress * CYCLE_DAYS * 24)}${spins ? "-s" + slot : ""}${SUN_DIRECTION && !isSun ? "-t" + slot : ""}${ECL ? "-e" + Math.round(ECL.toAnti[0] * 10) + "_" + Math.round(ECL.toAnti[1] * 10) : ""}${REAL ? "-r" + Math.round(f * 100) + "-a" + Math.round(AXIS.roll * 57) + "_" + Math.round(AXIS.lat * 57) : ""}`
    const cPath = fm.joinPath(fm.documentsDirectory(), `grok-moon-face-${Math.round(R)}.png`), kPath = cPath + ".key"
    let img = null
    if (fm.fileExists(cPath) && fm.fileExists(kPath) && fm.readString(kPath) === key) img = fm.readImage(cPath)
    if (!img) {
      const gas = BODY.kind === "jupiter" || BODY.kind === "neptune"
      const orient = { lon: (REAL ? 0 : gas ? (progress - 0.5) * 1.5 : turn.lon) + spin, tilt: AXIS.lat, roll: AXIS.roll }   // storms drift across the face
      img = isSun ? sunSurface(R, sc).img : isMoon ? moonSurface(R, sc, f, face, turn).img
        : BODY.kind === "mercury" ? moonSurface(R, sc, f, face, turn, { maria: false }).img
        : planetSurface(R, sc, f, BODY.kind, orient).img
      try { fm.writeImage(cPath, img); fm.writeString(kPath, key) } catch (err) {}
    }
    ctx.drawImageInRect(img, new Rect(cx - size / 2, cy - size / 2, size, size))
    drawn = true
  } catch (err) { console.log("moon surface fallback: " + err) }
  if (!drawn) {                                  // simple vector moon if the PNG path ever fails
    dot(ctx, cx, cy, R, "#040407", 0.93)
    dot(ctx, cx, cy, R, "#9AA4B8", 0.04)
    for (const [d, a] of [[-0.12, 0.16], [-0.07, 0.22], [-0.03, 0.32], [0.01, 0.45], [0.05, 1]])
      fillPath(ctx, litPath(cx, cy, R, clamp(e + d, -1, 0.995)), face, a)
  }

  // hairline rim
  if (!isSun) { ctx.setStrokeColor(col(GOLD, resetDay ? 0.36 : 0.14)); ctx.setLineWidth(0.4); ctx.strokeEllipse(new Rect(cx - R, cy - R, R * 2, R * 2)) }

  if (EFFECTS && isSun) solarEclipse(ctx, cx, cy, R)
  if (EFFECTS && BODY.kind === "jupiter") jupiterShadows(ctx, cx, cy, R)
  satellites(ctx, cx, cy, R)
  if (EFFECTS && isSun && lastHour) resetBurst(ctx, cx, cy, R)
  // a burst of twinkles on the orbit when the reset is close (new spots every refresh)
  const sparks = lastHour ? 6 : resetDay ? 3 : 0
  for (let i = 0; i < sparks; i++) {
    const a = -Math.PI * (0.12 + 0.76 * (i + 0.2 + 0.6 * Math.random()) / sparks)   // spread over the upper arc
    const k = 1.3 + 0.25 * Math.random()
    if (isSun) { const sx = cx + Math.cos(a) * R * k, sy = cy + Math.sin(a) * R * k; dot(ctx, sx, sy, 2.4, "#FFE2A8", 0.08); dot(ctx, sx, sy, 0.9, "#FFFFFF", 0.85) }
    else twinkle(ctx, cx + Math.cos(a) * R * k, cy + Math.sin(a) * R * k, R * (0.1 + 0.05 * Math.random()), 0.9)
  }
}

// ---------------- stars ----------------
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


// ---------------- atmosphere (FANCY) ----------------
// A widget is one still image, so "blinking" works by re-rolling the sparkles on every refresh (1-5 min).
// box = area the text lives in; nothing sparkly is placed there or on the moon.
function atmosphere(ctx, W, H, moon, box, bg) {
  const free = (x, y, pad) => Math.hypot(x - moon.x, y - moon.y) > moon.R * 1.5 + (pad || 0) &&
    !(x > box.x0 - (pad || 0) && x < box.x1 + (pad || 0) && y > box.y0 - (pad || 0) && y < box.y1 + (pad || 0))
  // 1. nebula: soft, very faint colour clouds (stable through the day, change each day); the first takes the body's colour
  const r = rng(STAR_SEED + 97 * (dayIndex + 1))
  const clouds = [[BODY.tint, 1.0], ["#3E7BE6", 0.7], ["#6C4FE0", 0.7]]
  for (const [hex, k] of clouds) {
    const cx = W * (0.1 + 0.8 * r()), cy = H * (0.06 + 0.5 * r()), rad = H * (0.32 + 0.2 * r())
    for (let i = 14; i >= 1; i--) dot(ctx, cx, cy, rad * i / 14, hex, (bg ? 0.011 : 0.016) * k)
  }
  for (let i = 12; i >= 1; i--) dot(ctx, moon.x, moon.y, moon.R * (1.3 + i * 0.28), BODY.tint, 0.006)   // a wash of the body's colour behind it
  // 2. Taurus in a top corner (real star positions, same as the wallpaper)
  const TA = [[68.98, 16.51, 1.5], [64.95, 15.63, 0.9], [65.73, 17.54, 0.8], [67.15, 19.18, 0.9], [67.17, 15.87, 0.9], [81.57, 28.61, 1.3],
    [84.41, 21.14, 1.0], [60.17, 12.49, 0.8], [49.58, 9.03, 0.7], [56.3, 9.7, 0.7], [75.5, 25.0, 0.7], [56.87, 24.1, 1.0]]
  const TL = [[0, 4], [4, 1], [1, 2], [2, 3], [0, 10], [10, 5], [0, 6], [1, 7], [7, 9], [9, 8], [3, 11]]
  const sc = H * (W > 250 ? 0.0088 : 0.0085)
  const tp = TA.map(([ra, de]) => [-(ra - 49.58) * 0.93 * sc, -(de - 9.03) * sc])
  const xs = tp.map((q) => q[0]), ys = tp.map((q) => q[1])
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const ox = (W > 250 ? W - 8 - (maxX - minX) : 7) - minX, oy = 5 - minY
  const tq = tp.map((q) => [q[0] + ox, q[1] + oy])
  if (tq.every((q) => Math.hypot(q[0] - moon.x, q[1] - moon.y) > moon.R * 1.12 && !(q[0] > box.x0 - 1 && q[1] > box.y0 - 1))) {
    for (const [a, b] of TL) seg(ctx, tq[a][0], tq[a][1], tq[b][0], tq[b][1], "#BCD0FF", 0.22, 0.35)
    tq.forEach((q, i) => {
      const hex = i === 0 ? "#FFC47A" : "#FFFFFF"
      dot(ctx, q[0], q[1], TA[i][2] * 2.6, hex, 0.09); dot(ctx, q[0], q[1], TA[i][2] * 0.62, hex, 0.9)
    })
  }
  // 3. gold dust motes (new positions every refresh)
  for (let i = 0, n = 0; i < 40 && n < 9; i++) {
    const x = Math.random() * W, y = Math.random() * H
    if (!free(x, y, 2)) continue
    n++
    const rr = 0.45 + Math.random() * 0.6
    dot(ctx, x, y, rr * 3.2, "#F6E2AA", 0.05); dot(ctx, x, y, rr, "#F6E2AA", 0.35 + 0.4 * Math.random())
  }
  // 4. blinking sparkles: a few bright 4-point stars, different spots each refresh
  for (let i = 0, n = 0; i < 60 && n < (box.x0 > W * 0.3 ? 4 : 3); i++) {
    const x = W * (0.06 + 0.88 * Math.random()), y = H * (0.05 + 0.85 * Math.random())
    if (!free(x, y, 6)) continue
    n++
    twinkle(ctx, x, y, 2.6 + 3.4 * Math.random(), 0.45 + 0.5 * Math.random())
  }
}

// ---------------- day dots ----------------
function starPoly(cx, cy, R, r, n, rot) {
  const p = new Path()
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 ? r : R, an = rot + (i * Math.PI) / n
    const pt = new Point(cx + Math.cos(an) * rad, cy + Math.sin(an) * rad)
    if (i === 0) p.move(pt)
    else p.addLine(pt)
  }
  p.closeSubpath()
  return p
}
// seven real star colours, one per day: Rigel, Sirius, Capella, Pollux, Arcturus, Antares, and Aldebaran (the eye of Taurus) on day 7
// [colour, size, spike length]
const DAY_STARS = [["#B7CCFF", 1.0, 3.2], ["#E1EAFF", 1.1, 3.6], ["#FFF2CF", 1.2, 4.0], ["#FFD9A0", 1.3, 4.4], ["#FFBF85", 1.45, 4.8], ["#FF8F66", 1.6, 5.4], ["#FFB878", 2.1, 8.5]]
function dayStar(ctx, x, y, i, state, u) {
  const [base, size] = DAY_STARS[i % DAY_STARS.length], last = i === CYCLE_DAYS - 1
  const tint = base                                                              // every star that has been reached keeps its true colour
  const tw = 0.85 + Math.random() * 0.3                                         // twinkle: a little different each refresh
  const lit = (state === "future" ? (last ? 0.8 : 0.32) : state === "past" ? 0.95 : 1) * tw     // reached days are all lit; days to come stay dim
  const k = (state === "now" ? 1.3 : 1) * (last && state === "now" ? 1.25 : 1)
  const R = size * u * 1.25 * k
  const r = rng(i * 977 + 13)
  for (let j = 0; j < 22; j++) {                        // soft round bloom, falling off smoothly like a photographed star
    const t = j / 22, rad = R * (4.2 - t * 3.8), f = Math.pow(t, 2.2)
    dot(ctx, x, y, rad, tint, (0.004 + 0.05 * f) * lit * (last ? 1.5 : 1))
  }
  if (last || state === "now") {                        // only the brightest get a few faint, uneven streaks
    const n = last ? 4 : 2
    for (let q = 0; q < n; q++) {
      const an = r() * Math.PI * 2, len = R * (last ? 3.2 : 2.0) * (0.45 + r() * 0.8)
      for (let m = 0; m < 7; m++) {
        const t0 = m / 7, t1 = (m + 1) / 7, f = Math.pow(1 - t0, 2.2)
        seg(ctx, x + Math.cos(an) * len * t0, y + Math.sin(an) * len * t0, x + Math.cos(an) * len * t1, y + Math.sin(an) * len * t1, tint, 0.2 * f * lit, 0.3)
      }
    }
  }
  dot(ctx, x, y, R * 0.8, tint, 0.3 * lit)
  dot(ctx, x, y, R * 0.5, mixHex(tint, "#FFFFFF", 0.7), 0.7 * lit)
  dot(ctx, x, y, R * 0.28, "#FFFFFF", 0.95 * lit)
}
function dayDots(ctx, cx, y, gap) {
  const x0 = cx - gap * (CYCLE_DAYS - 1) / 2, u = gap / 7.5
  for (let i = 0; i < CYCLE_DAYS; i++) {
    dayStar(ctx, x0 + i * gap, y, i, i < dayIndex ? "past" : i === dayIndex ? "now" : "future", u)
  }
}
// countdown: hair-spaced letters, a plain word space between the parts, and a faint top highlight
function countdown(ctx, str, font, size, hex, x, y, align, strength) {
  const s = str.split(" ").map(track).join(" ")   // word space without the extra hair spaces
  glowText(ctx, s, font, size, hex, x, y, align, strength)
  text(ctx, s, font, size, "#FFF4D6", 0.18, x, y - size * 0.012, align)
}

// ---------------- widget art ----------------
function render(family, W, H, bg) {
  const ctx = new DrawContext()
  ctx.size = new Size(W, H)
  ctx.opaque = true
  ctx.respectScreenScale = true
  if (bg) ctx.drawImageInRect(bg, new Rect(0, 0, W, H))
  else { ctx.setFillColor(new Color("#030305")); ctx.fillRect(new Rect(0, 0, W, H)) }

  const u = H / 170
  const medium = family === "medium"
  const moon = medium ? { x: W * 0.25, y: H * 0.5, R: 39 * u } : { x: W / 2, y: LABEL ? H * 0.3 : H * 0.31, R: (LABEL ? 24 : 27) * u }
  satLimit = medium ? Math.min(moon.x - 4, W * 0.5 - 12 - moon.x) : W / 2 - 4
  const box = medium ? { x0: W * 0.5 - 10, y0: H * 0.22, x1: W, y1: H } : { x0: 0, y0: H * 0.52, x1: W, y1: H }
  const pure = !!bg && WALLPAPER_MODE
  if (FANCY && !pure) atmosphere(ctx, W, H, moon, box, bg)
  if (!pure) drawStars(ctx, W, H, bg ? (medium ? 36 : 22) : (medium ? 110 : 60), moon)

  const heroHex = lastHour ? GOLD_BRIGHT : GOLD
  const heroSize = (medium ? 40 : 30) * u
  const hero = HERO_FONT ? new Font(HERO_FONT, heroSize) : Font.lightSystemFont(heroSize)
  const glow = lastHour ? 1.8 : resetDay ? 1.3 : 1
  const labelSize = (medium ? 21 : 18.5) * u
  const label = new Font("Didot-Bold", labelSize)
  const labelSpan = LABEL.length <= 1 ? 0.78 : LABEL.length * 0.55   // est. width in em
  const shimmer = lastHour || resetDay ? 1.6 : 1
  const small = Font.regularSystemFont((medium ? 9.5 : 8.5) * u)
  const when = `${fmt(nextReset, "EEE d MMM")} · ${fmt(nextReset, "h:mm a")}`

  if (!medium) {
    const dotsY = H * (LABEL ? 0.58 : 0.625), heroY = H * (LABEL ? 0.8 : 0.79)
    if (!pure) shootingStar(ctx, W, H, [{ x: moon.x, y: moon.y, r: moon.R * 2 }, { x0: 0, y0: dotsY - 8, x1: W, y1: H }])
    drawMoon(ctx, moon.x, moon.y, moon.R)
    dayDots(ctx, W / 2, dotsY, 7.5 * u)
    if (LABEL) starlightText(ctx, LABEL, label, labelSize, W / 2, H * 0.648, "center", labelSpan, shimmer)
    countdown(ctx, formatLeft(leftMs), hero, heroSize, heroHex, W / 2, heroY, "center", glow)
    bodyLabel(ctx, W / 2, H * 0.538, H * 0.945, H * 0.9, "center", u)
  } else {
    const tx = W * 0.5, gap = 8 * u
    const heroY = H * (LABEL ? 0.55 : 0.455), dotsY = H * (LABEL ? 0.75 : 0.65)
    if (!pure) shootingStar(ctx, W, H, [{ x: moon.x, y: moon.y, r: moon.R * 1.7 }, { x0: tx - 10, y0: H * 0.22, x1: W, y1: H }])
    drawMoon(ctx, moon.x, moon.y, moon.R)
    if (LABEL) starlightText(ctx, LABEL, label, labelSize, tx + 1, H * 0.3, "left", labelSpan, shimmer)
    countdown(ctx, formatLeft(leftMs), hero, heroSize, heroHex, tx - 1, heroY, "left", glow)
    dayDots(ctx, tx + 2 * u + gap * (CYCLE_DAYS - 1) / 2, dotsY, gap)
    bodyLabel(ctx, tx + 1, H * 0.2, H * 0.89, H * 0.82, "left", u)
  }
  return ctx.getImage()
}

function buildWidget(family) {
  const fam = family === "medium" ? "medium" : "small"
  let bg = null
  if (fm.fileExists(bgPath(fam))) bg = fm.readImage(bgPath(fam))
  const scale = Device.screenScale()
  const W = bg ? bg.size.width / scale : (fam === "medium" ? 364 : 170)
  const H = bg ? bg.size.height / scale : 170
  const w = new ListWidget()
  w.setPadding(0, 0, 0, 0)
  w.backgroundImage = render(fam, W, H, bg)
  // random 1-5 min refresh (iOS may still refresh less often); every minute in the last hour
  const toSlot = ROTATE_MINUTES > 0 ? ROTATE_MINUTES * 60000 - (now.getTime() % (ROTATE_MINUTES * 60000)) + 2000 : 1e12
  const step = Math.min(toSlot, lastHour ? 60000 : (60 + Math.floor(Math.random() * 241)) * 1000)
  if (TAP_URL) w.url = TAP_URL
  w.refreshAfterDate = new Date(Math.min(now.getTime() + step, nextReset.getTime() + 5000))
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
    "1. Long-press your home screen and swipe to an empty page (with your galaxy wallpaper showing).\n2. Take a screenshot of it.\n3. Come back here and pick that screenshot.",
    ["Pick screenshot"])
  if (go === null) return false
  let shot = null
  try { shot = await Photos.fromLibrary() } catch (err) {}
  if (!shot) return false
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
  const size = await choose("Widget size", "", ["Small", "Medium"])
  if (size === null) return false
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
  let fam = "small"
  if (!fm.fileExists(bgPath("small")) && !fm.fileExists(bgPath("medium"))) {
    fam = (await setupBackground()) || "small"
  } else {
    const i = await choose("Grok Reset · Moon", "", ["Preview small", "Preview medium", "Reset background"])
    if (i === null) return
    if (i === 1) fam = "medium"
    if (i === 2) fam = (await setupBackground()) || "small"
  }
  const w = safeWidget(fam)
  if (fam === "medium") await w.presentMedium()
  else await w.presentSmall()
}

function safeWidget(family) {
  try { return buildWidget(family) } catch (err) {       // never leave a blank widget: show the error instead
    const w = new ListWidget()
    w.backgroundColor = new Color("#030305")
    const t = w.addText("Moon widget error")
    t.font = Font.boldSystemFont(11); t.textColor = new Color(GOLD)
    const m = w.addText(String(err).slice(0, 120))
    m.font = Font.systemFont(8); m.textColor = new Color(SILVER)
    w.refreshAfterDate = new Date(Date.now() + 5 * 60000)
    return w
  }
}

if (config.runsInWidget) Script.setWidget(safeWidget(config.widgetFamily))
else await runInApp()
Script.complete()