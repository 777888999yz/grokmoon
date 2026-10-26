// Grok Reset · EARTH + MOON widget: only Earth and the Moon, lit by an off-screen Sun with real geometry. The Moon laps Earth once a week; no drift, no loop.
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

const MODE = "earthmoon"                         // Earth + Moon only; the Sun is off-screen and only sets the light (MODE "week" brings back the one-body-per-day widget)
const EFFECT_ECLIPSE = false                     // true brings back the lunar eclipse (Earth shadow + copper tint on the Moon) and the Moon shadow on Earth
const SG_GLOW = true                             // a subtle red-white star glow marking Singapore (1.35N, 103.82E) on Earth, only while it faces us; false = off
const EARTH_SS = 1.5                             // Earth is shaded at 1.5x the screen resolution (night lights are single pixels); 1 = faster
const DEBUG_TIMING = false
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
const PLAIN_BLACK = true                          // the sky behind everything is flat black (#000000), no nebula or background stars: the widget melts into a black wallpaper
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
const DRIFT_BODY = { name: "Earth", kind: "earth", scale: 1, hex: "#6FA8FF", tint: "#FF9E3A", fact: "" }
const BODY = MODE === "earthmoon" ? DRIFT_BODY : FORCE_BODY ? pick(FORCE_BODY) : !PLANETS ? BODIES[0] : lastHour ? SUN : DAILY ? pick(WEEK[dayIndex % WEEK.length]) : BODIES[(((ROTATE_MINUTES > 0 ? Math.floor(now.getTime() / (ROTATE_MINUTES * 60000)) : k) % BODIES.length) + BODIES.length) % BODIES.length]

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
  pluto: [],      // Charon: real period and distance; its starting phase is not from data
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
const PAD = { earth: 0.27, mars: 0.04, saturn: 1.4 }                                      // extra room around the disc (atmosphere glow, rings)
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

// real-Moon craters for the textured Moon: the famous ones at their true selenographic spots [lon, lat, size, floor darkness] plus about 110 scattered ones.
// (the NASA map already carries the albedo of every crater and ray, so these only add relief and terminator shadows)
let TEXG = null
function texCraters() {
  if (TEXG) return TEXG
  const r = rng(MOON_SEED + 7), cs = []
  const NM = [[-11.4, -43.3, 0.035, 0], [-20.1, 9.6, 0.042, 0], [-38.0, 8.1, 0.022, 0], [-47.5, 23.7, 0.018, 0], [-9.4, 51.6, 0.04, 0.3], [-14.4, -58.8, 0.065, 0], [60.9, -8.9, 0.04, 0], [26.4, -11.4, 0.04, 0],
    [-68.5, -5.2, 0.04, 0.3], [60.4, -25.3, 0.04, 0], [17.3, 50.2, 0.03, 0], [-4.0, 29.7, 0.02, 0.1], [-1.9, -9.3, 0.04, 0], [-3.2, -13.4, 0.025, 0], [-1.9, -17.7, 0.025, 0], [-11.3, 14.5, 0.02, 0],
    [29.9, 31.8, 0.035, 0.2], [55.5, 27.7, 0.035, 0], [-54.5, -44.3, 0.04, 0], [-69.1, -66.5, 0.06, 0], [129.1, -20.4, 0.035, 0.4], [-24.0, 3.2, 0.014, 0]]
  for (const [lo, la, rr, dk] of NM) { const a = lo * d2r, b = la * d2r; cs.push({ c: [Math.cos(b) * Math.sin(a), -Math.sin(b), Math.cos(b) * Math.cos(a)], r: rr, rays: 0, dark: dk, fresh: false }) }
  for (let n = 0; n < 110; n++) {
    const z = 2 * r() - 1, a = r() * Math.PI * 2, sq = Math.sqrt(1 - z * z)
    cs.push({ c: norm3([Math.cos(a) * sq, z * 0.92, Math.sin(a) * sq]), r: Math.min(0.09, 0.026 / Math.sqrt(1 - r() * 0.97)), rays: 0, dark: 0, fresh: r() < 0.25 })
  }
  for (const cr of cs) cr.b = tangentBasis(cr.c)
  return (TEXG = cs)
}

function moonSurface(R, s, f, face, o, opt) {
  const maria = !(opt && opt.maria === false), tex = !!(opt && opt.tex), esh = opt && opt.es
  const N = Math.ceil(2 * R * s) + 2, c0 = N / 2, k = R * s, NN = N * N
  const G = tex ? { seas: [], craters: texCraters() } : globe(), ak = tex ? 0.35 : 1
  const nx = new Float32Array(NN), ny = new Float32Array(NN), nz = new Float32Array(NN), inside = new Uint8Array(NN)
  const alb = new Float32Array(NN), ht = new Float32Array(NN), ray = new Float32Array(NN), mare = new Float32Array(NN), tn = new Float32Array(NN)
  // 1) albedo and rough terrain on the turning globe: seas with ragged edges, regolith mottling at pixel scale (3D noise, so no seams)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, r2 = x * x + y * y
    if (r2 > 1.05) continue
    const p = j * N + i, z = Math.sqrt(Math.max(0, 1 - r2))
    nx[p] = x; ny[p] = y; nz[p] = z; inside[p] = 1
    const b = viewToBody([x, y, z], o)
    if (tex) {                                                                    // the real Moon: albedo from the NASA map (maria, ray systems, highlands), plus a little pixel-scale regolith grain
      moonTex(Math.atan2(b[0], b[2]) / d2r, -Math.asin(clamp(b[1], -1, 1)) / d2r)
      const mott = fbm3(b[0] * 7 + 3, b[1] * 7 + 5, b[2] * 7, 3), fine = fbm3(b[0] * 19 + 4, b[1] * 19, b[2] * 19 + 9, 3)
      const mm = clamp((0.7 - MS[0]) / 0.16, 0, 1)
      alb[p] = clamp(0.45 + (MS[0] + (fine - 0.5) * 0.05 - 0.52) * 1.52, 0.22, 1.1) * (0.95 + 0.1 * mott) + (hash3(Math.floor(b[0] * 300), Math.floor(b[1] * 300), Math.floor(b[2] * 300)) - 0.5) * 0.04
      mare[p] = mm; tn[p] = clamp((MS[1] - 0.025) / 0.03, -1, 1) * 0.9
      ht[p] = (fbm3(b[0] * 5.5 + 2, b[1] * 5.5, b[2] * 5.5 + 7, 3) - 0.5) * 0.02 * (1 - 0.8 * mm) + (fine - 0.5) * 0.006 * (1 - 0.6 * mm)
      continue
    }
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
        alb[p] *= 1 - (0.05 * ak + cr.dark) * (1 - sstep(0.4, 1, dd)) * sup
      } else {
        h = 0.34 * D * Math.exp(-Math.pow((dd - 1) / 0.2, 2)) + 0.06 * D * Math.exp(-(dd - 1) * 1.4)
        alb[p] += (0.05 + (cr.fresh ? 0.08 : 0)) * ak * Math.exp(-(dd - 1) * 2.2) * sup
      }
      ht[p] += h * sup * (tex ? 0.75 : 1)
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
    if (DRIFT_ECL) {                              // Earth's shadow, from the real Sun-Earth-Moon geometry: only where this pixel is behind Earth along the Sun line
      const E = DRIFT_ECL.E, S = DRIFT_ECL.S, wx = x - E[0], wy = y - E[1], wz = z - E[2], t = wx * S[0] + wy * S[1] + wz * S[2]
      if (t < 0) {
        const qx = wx - t * S[0], qy = wy - t * S[1], qz = wz - t * S[2], q = Math.sqrt(qx * qx + qy * qy + qz * qz), ru = DRIFT_ECL.Re * 0.8, back = sstep(0, 0.3 * DRIFT_ECL.Re, -t)
        um = (1 - sstep(ru * 0.8, ru * 1.08, q)) * back; pe = (1 - sstep(ru, ru * 1.9, q)) * back
        v *= (1 - 0.94 * um) * (1 - 0.3 * pe)
      }
    } else if (ECL) { const d = Math.hypot(x - ECL.toAnti[0], y - ECL.toAnti[1]); um = 1 - sstep(2.5, 2.9, d); pe = 1 - sstep(2.9, 5.2, d); v *= (1 - 0.94 * um) * (1 - 0.3 * pe) }
    v = clamp(v, 0, 1.12)
    const warm = 0.4 * term * Math.exp(-Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]) / 0.1)
    let e
    if (tex && esh) {                                                                   // earthshine: our own planet lights the Moon's night side, brightest facing Earth and as strong as Earth is full; plus a dim floor so the night side is never a flat black hole
      const fe = Math.max(0, x * esh.d[0] + y * esh.d[1] + z * esh.d[2])
      e = (1 - term) * alb[p] * (0.3 * esh.k * Math.pow(fe, 0.8) + 0.22 * (0.5 + 0.5 * esh.k) * (0.6 + 0.4 * z))
    } else e = es * (1 - term) * alb[p] * (0.75 + 0.25 * z)
    const t = tn[p], tint = tex ? [1 + 0.045 * t, 1, 1 - 0.075 * t] : [1 + 0.03 * t, 1 - 0.002 * t, 1 - 0.045 * t]               // highlands a little warm, seas a little cool
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
  if (kind === "earth") {                                   // real continents and seas (0.5 degree NASA data) as seen from above 104E
    const la = -Math.asin(clamp(b[1], -1, 1)) * 180 / Math.PI, lo = 103.82 + Math.atan2(b[0], b[2]) * 180 / Math.PI
    sampleEarth(lo, la, false)
    const n = fbm3(b[0] * 7 + 2, b[1] * 7, b[2] * 7, 3) - 0.5, ld = sstep(0.38, 0.62, ES[0] + n * 0.3)
    return [clamp((ES[4] * (1 - ld) + ES[1] * ld) * (1 + n * 0.2), 0, 255), clamp((ES[5] * (1 - ld) + ES[2] * ld) * (1 + n * 0.16), 0, 255), clamp((ES[6] * (1 - ld) + ES[3] * ld) * (1 + n * 0.1), 0, 255)]
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
let DRIFT_W = 0, DRIFT_MS = null, DRIFT_ECL = null          // drift mode: warmth 0..1, Moon shadow on Earth, Earth shadow on Moon
const CITY_GAIN = MODE === "earthmoon" ? 2.0 : 1, NIGHT_P = MODE === "earthmoon" ? 1.0 : 2, NIGHT_AMB = MODE === "earthmoon" ? 0.035 : 0.012
// ---- real Earth data: NASA Blue Marble Next Generation (Oct 2004) land colours + shelf depth, GEBCO relief, Black Marble 2012 night lights. 0.5 degree grids, deflated, base64 ----
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
function b64bytes(s) {
  const lut = new Uint8Array(128); for (let i = 0; i < 64; i++) lut[B64.charCodeAt(i)] = i
  let n = s.length; while (s.charCodeAt(n - 1) === 61) n--
  const out = new Uint8Array((n * 6) >> 3); let bits = 0, nb = 0, o = 0
  for (let i = 0; i < n; i++) { bits = (bits << 6) | lut[s.charCodeAt(i)]; nb += 6; if (nb >= 8) { nb -= 8; out[o++] = (bits >> nb) & 255; bits &= (1 << nb) - 1 } }
  return out
}
function inflateRaw(src, outLen) {                       // raw DEFLATE decoder (RFC 1951), after zlib's puff
  const out = new Uint8Array(outLen); let pos = 0, op = 0, bb = 0, bc = 0
  const bits = (n) => { while (bc < n) { bb |= src[pos++] << bc; bc += 8 } const v = bb & ((1 << n) - 1); bb >>= n; bc -= n; return v }
  const build = (len, n) => {
    const count = new Uint16Array(16), sym = new Uint16Array(n), offs = new Uint16Array(16)
    for (let i = 0; i < n; i++) count[len[i]]++
    for (let i = 1; i < 15; i++) offs[i + 1] = offs[i] + count[i]
    for (let i = 0; i < n; i++) if (len[i]) sym[offs[len[i]]++] = i
    return { count, sym }
  }
  const dec = (h) => {
    let code = 0, first = 0, index = 0
    for (let l = 1; l < 16; l++) {
      code |= bits(1); const c = h.count[l]
      if (code - c < first) return h.sym[index + (code - first)]
      index += c; first = (first + c) << 1; code <<= 1
    }
    return -1
  }
  const LB = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258]
  const LE = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0]
  const DB = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577]
  const DE = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]
  let last = 0
  while (!last) {
    last = bits(1); const type = bits(2)
    if (type === 0) {
      bb = 0; bc = 0; const len = src[pos] | (src[pos + 1] << 8); pos += 4
      for (let i = 0; i < len; i++) out[op++] = src[pos++]
      continue
    }
    let lc, dc
    if (type === 1) {
      const l = new Uint8Array(288); for (let i = 0; i < 288; i++) l[i] = i < 144 ? 8 : i < 256 ? 9 : i < 280 ? 7 : 8
      lc = build(l, 288); dc = build(new Uint8Array(30).fill(5), 30)
    } else {
      const nl = bits(5) + 257, nd = bits(5) + 1, nc = bits(4) + 4, ord = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15], l = new Uint8Array(320)
      for (let i = 0; i < nc; i++) l[ord[i]] = bits(3)
      const ch = build(l.slice(0, 19), 19), ln = new Uint8Array(320)
      for (let i = 0; i < nl + nd;) {
        const s = dec(ch)
        if (s < 16) ln[i++] = s
        else {
          let prev = 0, rep
          if (s === 16) { prev = ln[i - 1]; rep = 3 + bits(2) } else if (s === 17) rep = 3 + bits(3); else rep = 11 + bits(7)
          while (rep--) ln[i++] = prev
        }
      }
      lc = build(ln.slice(0, nl), nl); dc = build(ln.slice(nl, nl + nd), nd)
    }
    for (;;) {
      let s = dec(lc)
      if (s < 256) out[op++] = s
      else if (s === 256) break
      else {
        s -= 257; const len = LB[s] + bits(LE[s]), ds = dec(dc), dist = DB[ds] + bits(DE[ds])
        for (let i = 0; i < len; i++) { out[op] = out[op - dist]; op++ }
      }
    }
  }
  return out
}
const EARTH_PAL = "18240B212E102C35163A3C1E4A44285D4D31705C3C846E4C76796E96805FB0936E9FA29CC5A67DC0C5C7EEF3FA"
const EARTH_TERR_Z = "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"
const EARTH_ELEV_Z = "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"
const EARTH_LGT_Z = "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"
// ---- real cloud cover: NASA Visible Earth "Blue Marble: Clouds" composite (cloud_combined_2048), 0.5 degree grid, 3 bits per cell, deflated, base64. Two cells per byte, row 0 = 90N, column 0 = 180W ----
const CLOUD_Z = "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"
// ---- real Moon: NASA SVS CGI Moon Kit (LROC WAC colour mosaic). Albedo 1 degree grid (5 bits, 0.44-0.94 of the mosaic's luminance), colour tint 2 degree grid (4 bits, red-blue balance). Row 0 = 90N, column 0 = 180W ----
const MOON_LUM_Z = "rX2JchxJruRIZF15Z1yZWUWq//8vF+6OiCyq5+2zNVvOtETxqAOBAByXY9+Pt4+nPupnx//zx9P/+/vL+nj994/6XPv+87f2949t3/71gS9v+3//4MPx/3rYvX7y9wP7g2z/04d+bX97L8dRH1jP/j+9hL9ez/m+/ou8/d8mjPbt5/uHv26Jt4nyCx/f399/8PHtH/Uff/zDPuXPfTVZvz+un/bfgv/rOP7LMRT8hw//85SXn8l/VRD/8v4vrXn7gd1Poz3Qj0Pd9V97Te8acBzb28vTK/zrVe3bv1Tmfzr2t4Or2vumxy6/+lr5kvAtfvs8sf1NfP/Wvnf5Hn9LXd9/vt6f+v3jx1ffn+WHzP56rvaT7zK3139q3I9nPw/r54PlnFNK9kdMuRT7V6kfVf723XYW5aeKbNvf/z6v8yl6Pqf9aK6Pbt/KeDYe6o+ja/e8vuh23PX+6rraY5W3F3S+5sIfk1Dr+Z6fnGL+KaK/RdXuyP+gUj/tjBuOv/Vtc63l+9Y7P/UX/4IMtvZQdgxNOn+LdPc3qkfCcZ3nVJ/z38Koz3i4QPHM214t3XZ+t140Py5chq2KV08G7agf/L0fh3fq+94syvb+zX9pPH5cv37eOxf3f3srWcIq/tSl/Ub7Abyu7Aps3+KFrj8iXZFgqc9lK/7ydI2erlR87PO0eDF+3gUXdXk7lq1+vx5d+Zf12fyBq4R3fyQpPIXx9k7+fcm2t8N/O4V3AZ1f236aCTyy3z496l/Gcq9PgFNuxsCv19Z+rz1j/TvGmPSR9c62JlQ+bDVD/zI5m58hjzTrgbM/OT8/n8wl5g/VbNzbyy9vb7ldm4J33I7/5zlsp6zebmW7mu/6tbmWn6J/e2V84/4A52NtbpjKm2zf7RSllN9UVu88RX+4gu9Kl124yeQcQogUN37AJEGdMatG+PD95xvA4YuyBuqol1CHZw+g347twH4okR6v6sLr68+fr+dpLFwz/q2R7xjifDPtZF3Q59G4XdFdo4Fp5/GXb/Ej1MlXPeE7f7sBrpDbaV5e7g1/3pkfUEYnC2hmcOu16401ISc/BfwjSc4n1LSXDDk3rEZ0Ry8kgdaLUGjs9SjtYfF53k5sVpW1vhd/O6dG+dtyCya/rWer16S9aGmbjPEuB//6/qZq/Ljmbps21+DN9UvXrZ5CzpueRbd8a554F1D9+onx96389EK0LoewFO/fCS39jZnx1d2p+mwf1e83rOzw2TVZsmlvuv5qTE0KoSl4KvvTLsPXq3kZ4TpqoLDE9mYR/Kq8CcltMt6XP4/+ylWzN/eYVZtpvN/AKr/dbkR2DZBA21uIza2cDlx4eXNvcJ6+vvWOMd5vk96QxFxxgY5Xrz+6eXbj0mKgvaHu491BVu/u5o0ilv05P1zOB4yOroHfb39px+ngq+fHdfOX6mHGCd7wlLFdwXz65f8Wb51QpdmbBon85uo2RgFaXeVCfyCr48bxhNDyGtLW3a+oKXqTvjyC0FHzXLmqsD08XnV7+XKfDgkqlmp+uL7U03VWBeZjNQHjz3VdQ0jVqfDSNFuS20WjpF17HPa+u3zdtYYxi/RR/nrzwzlaHMc7cjwdjLR763apOY7UHiRL4MQLZTv9BH/XMBgR3k/vKxcre/L19Tx++Jmyn76r/HWwsTkif0V4gmdFtnqM03fIxpw6Ky9YLR5feVPm00ifvjG9u3fdGkb0x36as+L6Ym9lb6YDtoMKEWNFY+2+/XB70iM3u292Ib9B/Ip9Mw1e1FfLO/5raM5N8V8xikeJNQ9Un90tCnU/p/wmlqy3UaqsN8dFhOYKV8rpIM7DiVWc1Rmav3vuzQRGKnSIFcskf4j2fmTF+DeNRg1mm52ub+MtweTfdkBYhVtxfoWsuR3pibSiBzPpVN6tIruq7Ip5aEbcc7kb+hvk757HUcD5BIL6fp3WqrQcRnawu73FOD8i6vLTW1b7kKslf4Nwqdp5/L9eUP/B6OchQ138wsYEq+2Qy363ucOjRcP2+muEDaG/mGfiN5R3kld9vafNqPjybX6m1ZhVKwGz+Q6W/T9cFIcitIypfr38lX6gbeY1wsuTwO2Vff/zzz/fr2PfqhBK+eEWtnqibrXfU1wnOP4roHKFaGCuVK+Yzi/xujYEZtpcby5NouvOD8iz1cTTW5r0LUXjuaGv19eZ6ft+Q1r7W1DqYkypnnD9dzqDkPzj5RbXvdJU74fClb9SDbsH/m+u16ybHWpFQaUFmUfTYQXRf9ntfPrmkv8dPvmbkRmO8qFvR7H/iH35/LBMpZnF9mZ2OVZew+Zwq9N1hPQW8h5ff0xz/lE21f97PWvk4CbjLVxqwFLhcQWvNRfxpiOefPK0TsWILpp3u0TE637FT5dxIe6JXJL9frvhCmxehwzJCV48vjpxST1Zj5o8wQN0tYaYmqfOevVv4v47j+D4L5/Xpcr1jNZaMLt79sxefEMlcniwGn8Um37/+efPN6Omw32OSzXiYAF17GNeViqC29n6Gh2VO3LUP46W1vFcFVK2X9+8V29QwO8erQff2wlx81u+KCkEOUPHll2scdWPigOfIr9l6uw17EXvQofHhz5vYxFy2XbdrjM0wDuMb+GAEnVVZ08MVmRKzzRofR2u55T0P/r48yVt1q1I8LohCgHhFS72Mc+hQdCWttganHhHx4Q8T4Gf6g0Y/Cpn7aLHhzCQifjYlP9o+TP6+PIWcz0bGuZXU82bNLT0bJ5JB13lxh/ieRYZ3AYjBI9Krlmsqv1FmkS4J9xcPAVgZuDPl56oVKekWGdd1thwfJW3vVsT96vWX6TQdD8EfPFEFNGhe03ZpOb8fmQuJWEJlY/4xRippUoruMf3+A/eP5z4XnIzf1uNSFoG4mdkWfatOqGSGrirSSRkoVPDEfvR0uqlpUVSeU9x6LYwglZwLzxMYfPC1riA3zaf9k2V9LzJU6FmS7Hgr3U1IeVmulpQekI9+62SahRSPOKIQWKWoB1xZLfQFZ078sZh88i+iWCIYw4Bevz7pXqavVLim6MFsjDB5Wcev7SU2tv18bqJELR9vTRg73GsP1z2bEtF6i0LQk+Oh9JjxvTjYtJyHC1TLKuQsnve3SOTl96cX9ntLXd95nmSpxepssIxvAx08ZsHIniV0S1Z5F/vQWlNQ5p+KHVIoFiBjWSMqwGX+vq2C/aUjnsOAP9B1V/Pltrat+1U5iouF7QXKnTjW/aHOu7mUVpYdFc3adCm79O2xpbZi57PwFcZipg9DK6tLowzN79LIIVpwFafUJrxq5ULT3N+RkE0N4rVavRWkZj9PoyIex57EeE9twIdyFt260G/mN7wGp8dAsaHDD1vlhmkb/39LUjzBUuNDBj+fNXaRoUZ0svjS7brqJrt8dZW3u9Pzbu2d7L9rEFJWyX9GGJDwf6m8CnfBbUo8H7WpO3WwuIKQmtSzu2ztx88lcZs4ahDXz04nnUxWx2rTWjxxoELrmsqrxfcYgShjZBo5d14RF6w116xFbzptxt596l/JFAakW+V5w01ynBAlq/nGQ9Bi6sv25UKzLVAUqpDqQ7SE1g/UHlhWv2MjHJVeqElhVa8iU1x1oUKTZ3KFIMcwZmyLGdw2T5rvrZV3Hnk0bN+AeJZZaFccos927JSZv74zHXgmzTGMcXTHuv3+UvrihxfPuuRUGUaC5chZf2HkjYF/v6iov/zLQBJi+3h0JkBrO/Jc1Uq6x1ewaE+VUsr8b8hHWbH9oYhHWel6kQioQTfQnRlw1uCvkCTlJsT1OOxZPvtmqnmkwJtVrWupcgz2UysrHg8+nWnJsoi2VeWaZpX6icygPKUEYK3P3DE9rIK1NmgHMFdCqGZDc/Z4nDM2jATzj4Uyg+66iEmAiAIl5GQ7Iey5sdbwc4TAVuLyx3LmYriLblNEJDWrY9ZZ8F3T5MKf3tste4FgcPIxfcUaKa5qGqmYzAIJv0+rb5Hv9Xsu4fYzjYWe72GlfajFQW3MyHCI1uEf6mukN80jOO4pDAvOFPIN/llCgiacLJukGFnoMnnrUvSl3J8OS62pyUgfyHIUbXEZOoG5LticyI9R5G1t+QsELvxUPlV1rqVXPkVIQOEo8LLsJSFgPtQMa5QFeEE4WOK7GRLzAT3fJmSzQXXkyqHmwu7kwHGMnLaxAu6RC3M38/iKtOBrSiS/LrHMM8mqsViOXyyxDiO8zwOw9j3fdVpEyU/4a9ECt5eS9DZLLQa4cQryrua6uJcDy+KlOz5fDV20Fp88S/hPNREacThKwk/z/YYyZggCp4jb7XmahqXgco88UeHYv+OmbU7QaaypZ+ptVaDKNmFk5RsXvkuKFq8TVoNz3RUJCucXHQvcoHm0qO6q2AQuSnUzEUpgeRWeF1HyHeZTL7L1A/D1He9/X8YetPpwY5gtm9N4zRP0xIl2XmCyO1v/mt1JfZ0lacxj+8vXG4mAqGVBFrKm+xlp1i9Ue2rmmaiD4IRhZ6K7op3tJQqTIoKTwWR803tRymeg1D4Vk1NSiW17L38WSyeOoVq06ma18F1rTlRAg17PxmQwHQJVxcuB2dl79OLZLXhoKT3dJbwo1SueBJVBhfXwxR5MlkOM3S4f5iYp6EfTc72r3EaugekPk4QcFjNck/zbP8tgUKGtidBIXuDMbn3YzRZaqoBF2jba56dl1kV0BeDk+8KOcxiCOLJTtcGHthpext01bKQJluASfwt90G7Fqrm4SYJ2UXpI11ZhEQ9o0iz+vVFMUfaZthGeT1BKFrnCLOYjyIXBFXSAWU+Gq/J+/mzrJqQTlcpQ6ARliCE2SRoCguTDMEOfTeYLvcj/2X/7u73h0l6nCDadZ0h5wV2W7q8JF043DV7cThGM1GMS5i/YL+VyWgOOe1PKgNuXlyTB1HPww02od2Xy/jw2nuFbNDFkLdEXOSetsiN29sKcsAQEQCSlyKzlAlqVaCxCl09y2d3jeafqRpIcI0OUylARsdhne06hyK7jUfAgxcdjv1znmnUo2NwSHpXEUowjIjX4YEZATPO8xxMc01rB8oZhoNyts87k7KpOL5lBzJB+e1YJlgSex67CdNEyx4C8bMXMxDYbITAjgjgy4EPn8hpRlyINQAQFCaVzD4j30F5f3mptVZz7MWrCqOUjeCOZ4pX+G2IGrrl9Q6iIaSD8C3JlFkLPH/Munj2zNsLMdDxKsBQAFREUDVugP+jL1zjgsOZITk4KbeRdP2AskuNGULtF4G3aOXaBWcByztSdPMUIL5xnQcI1QSMPzuYDogZUodvHGA1ptm+OthvjZD+MuJ7C6w7POka4FoIL3YoDf0zpIRbn1YTwF7CyAdQbFSbWL1lwzDC88uzda1LrdbC9HaywmV7M9kjKrvUwswEprjq9luCEFDB17PwmCMLlLjWUSkie6rnXstWrdEjOsAV+sI9JVBYA1NAAFtJpiUJbgECj/JbocU8dKJAcRRx94DK0vzO68QP/qvvJO2Z2jtA4GZHBvxhx0ITA82HleFfHY9islezBPgl5jQQI2xPRgPIUdprI0ZKk/3sw34ap7Yk/MxLSY7XC2/cYADhPnN0Bc21QqGJyiPUD4XJuvCFQJR4WBdYesRseKSumS1j5Ky7XcuZXtavXzIdJTKpmU4aicCXzLBslbjVUcC7aZbAvmxvGEjNZDPMkJcyDwRpM0CcCWqkNPGmH8RwptQmZtjhkZZiJG7Du8N3IFmgkQEmAyps6jzAYVL3uw6/MoZlnJn83uDLCTGhNoBiWclqu/6hxw8PZjnslSsFduzKvxjk/j5SPpQShY2BaaGQ4flhNc++CuWxZG7dksgo2qUSWAiJvyAQkZXj5E8SiuimQdhmRwjCEkEjYeBqXw90/AAdcJIeCTPIkFkwrbIfgNLi/fP6TwSFMOz29uThANzwYapq34d/NY02E7wMvd2FaaTTW/A/nEugXuN0YKf1e7QsfT0t/DXgDplQskdMezTtX5E7ZGRAHcHds5cxLkrPwCv6XIIKkPumZLT9/lMBiYpj0C14d0YjMfj9zTShErO0kPZakWo6ctpecP97zUwy8EPUSLwA85D0aVRBmcmFNSi1wAiRRnhRwWhR4pTxcViogabm5uEet7t9dI8JNxroYIZBhlhMutMi6zHKlsMbmkjHbmL0miO8I9CzmeJQDFsDhNgHj0fnRETSVWlDziZoOzC8K5Pvc7MznVdTb5jVA5odcNuE4jODiZrtVGj+RwlTAufnc1PHBwFuUJBUcLthPGUb6JtgEqSzW0ZKKyh0XZZanjRnu3mPTlg9B0osp3jbXgz+FPj1Jo1VaDl51EsLMQfCYD7VSq9rsM9s37TMkLP9vzM9hFXA5cf9hnPrezPkBGlUCl4CmBr8pFnrAtjS3+8DEMWatmzmx74DID3SNo+8DQQonfzmAF9opgFCTfB59sqBKrw9xjQ82fMA6wtZqyBdaDUY/yGv93yprrK/XuzxA9zP0GN6HgONuzJfyyrnVDPe1aZC7+0H9VlSOjWxhSamKkMKEX8gwrS/EHmvzC14l9hO7LEqa0bjEJkDgp0mzoCwN4DTBTjXtPfxeNwZaMAmdiaTx/V6g5I/EIMAPMx0MXZasNzUXjuOroduT7fL5WrBn92XDE20b5thCTAbBCnjTInr/x3uBwux9EZ2HQKiImoJs4umMCGqUKu05c4TYJ7r8IjcIDTzy7uSqtnzRzGF+NapUutkVC+aAdplN9mwvEH4hnm+pyAtQ8U1yxQwEalwW8knpu4OJpggR0Y9iOAPnMACdTfLKW1cACGTAhD77kjkBQfFEM9UeLjbv25XfNyud+CKme6U12wm2pijaWtvZ3HFHZiGR2einGCF0kYlsouxwPTw1VTvCDhtxmiGB4ieZkxSGgMUCb7DUexC/B8l9ZYGQlLtYJfRF5LjMCFfiFCINljxUxGC6s3QAPCVeReeoYoezI2Xmt+lXhaYI5YX6Q2L8udFrkIublX6nGEGni4KDK70Hng8Bs3UREIOs0Z2JbenKbNCNpPco7v3UGNT6gdQBeTd3e4Q9e0Onz8qHYdsEiNv08jRbMXjZiov0NEbipup9JEOdoapQPhoL2iBSzUzYooMKD0xvmTmlIplry/bTTAAZHLGe4NEBP1NP5BLY4qitcbXRB3DSGT42Mfd8qJKcTDtEMtKXxPk++1hdnkxL4ewzQ0YEr0+iHfyxmwS1Bw5JvOyMBWCbkoW1fpRVPaZ+ZBtT7zHAuIwHWYnmKowS0MnYDd6XmFd7w8Lmk3cd6jyg+jLVPpmYqaclQQiYoKgzSqMZmbMLNyvj+k+PMzM2D8NiBLfIXU0wSwzBETIAkVGrtpEDYOyzgQFarTMzAWabY98AngUfgq3JlkAakjB2MfJpKlB6Jea7VXshvHe99qfVOMVnbqrI54LCJLhGz2fXQR0HiJrhwSxKmDZy4YGPo6v50YInBx0w5LrmJRTZ9BtVrqaFWUV9Bl0Z6FjTLPZDAZ7prt3Io7bzSRmIpfATVkNKNtRMDVjEkSyyCRqFr2zH8WHafw44+eh+Aau+cbsPwBss0cMu2mjzXPSMTIqsCCVwQheDuwFYhHgnCXUKNnLQ8xRtFEViPOJ/Iz5wLKZA9y3F1sVvUyBf78YwysBzQuzqIazriw/FAmp6IYUwe7MxhrUEBm+E00wpclEAHU5vrcKs7UpVpSOtKvcIi27gXFEh4yWFvPIpnrLA/jrLpFdL/bJ9faQbpvUhql7mCZPzHEyTH/c6Rpvd7MqF7PdFPPNToQnQ5szIiFhsQ/wyLoQ3wHDL7NHhuNqpmc2PJtNrZH9yi+74YbDFwTYBkIM53m13gEZggImj80qejXiSdUFdD6+vv+8WmcdU01PZvbVlOIWIqxl0d8ExuYM1sykHXws/2Lk/nq2IbbWJWxxk+ISz29apOJgg9fPlIAh5lpPDbZd0TTuNpwv9KvD9YYddq9nf935h6myia27PQgYBOTCjHO4wZxcr5fPz88LfkPXoB9ge0zaI9LUhhfNQsMkzXw6uAIzI2bU8XAISaJKXRnJRGi/RfOM6e3NyENmZL4YBGSkgoHwMlMNdsOp01t5vk247t7UACNSlGFnXFd0YIanZvXWO9hjNm9TAZihqMoOTF4xV6Q2otTaYizuV6oYFiyzAQiwQ3lSNYRszGplpgqBnM0/ZENOTMsDBkjG18sFKkpZX6m1V6C1xwBAbQo3mvt6EIBAqy+U8+VGZ0mrgz9M0KP9JGOdRak2kxkzJzDXFsVPiCAH+xa+BseMOBv2xb7UjyxtmaUOrs9eq2dG3PNMKKUVQ3MU5+4DMEzEA+LVrhQiai9lsY6KApBXmJK3ObwN/OlBAWVeR+EUhaehs1e+DAQfrBEAi8Bxsnr4eubEuijziepBRYOqecQMhzgRTwIfwGL2JmKT1QRBmzWQYj8eJkpI/nJnEI14cLaoET8Kw/H5+WGC/rzKQpux7mDfgVdGFbggaGoswkWEMAbrALZXwm5hQ48D1hkYSSWBON8fhEc0cWfDlpITaoku+QDEUJH6YIPNhsoIkN7z6WVA6aJmqHG3A3AX/hfY8edd+J4rMotDa8Q+eZbBA8vWpZpj3KK8e1+mZzw8JoQy7Gr7PDShjLpIkKYhklCC2BAZdPEKEV+g1LIhN5f45fPRe35jXOfuJrWn1YDduACSwHTc+CcgS2dwecRBwuEF9ixCzDMdajB9ZiqEGGQWjOGprADyo/1Wbw8Qha727PV9dWohtIJ0c4I+wyYzKYr6gKbcd3OIeW8IefO+MmZNCGNo76mQSgEDPQgvokLJM5JtVllJ7rewbQ6o7/n1PArzeUXtbCVsTJYoXYrqzLMIcdv7QjwHEaPQNxB9jRbP3S6fFwgO0r583pqcrw/PB3XQSdPyT4nYDccnjcyNPvFmfpCJfxxjUi+dy/mBOBD5kVkYD6l/5lYAvpAeMV2NyxzTqvQZdXFn7x/MJ0FAYZhhtgE3FtiC1T1YZrXG2pvf3+vzugY0sqiJ7cwtn6FJoj9LzJmmrZIiyFbbL22yVqz4+RAaexeynsGHUACikT9YAf6o8NkdSyxMXyI1YZ+YPiM9FDoKGIK7UoLXi4JBiJwJCouwzcIYqLiaxZDJMBlTt2XSb3Cgj+7BsC9YBMjggN0dJtSeabqJIeGMSHFaWQ1H+LoiU4IixTqu3m5ijpw3tdoNbwOAHqG6YdB5f7GJi8VaenmG3rAgCn5WJtqyBsK8gX+vw1CEu5mITv21VGbOGvPRXLxqZ1WN+mCrMbNMRY+uXg6mPYGT4fs0V0E3u0BlqNETYhQYjiuyyhfopuszPr9RhjTRDyVETSHv/IJZ5g/JWkcCfb4xAGciDvjNYhKkMxN6D4DpEJcja9J1I6sB5n8X9fJAJBNrEPaS0RRNLBCYW2KDQMrefENX76jiYKvjS7eZitr6qlD9V0cWfENJGgHbdzlQ3Qx1cKzJkyGoEiDKfMLEEnyr62NLRV2b7B/ipNxBt8h6CaITZvSRWFyUcmVRm70X9AeRzh7FaDMHgHWuxZQcrMf1+rgLf5gAIR+zu8MK10hTcoFOU6mh0jeCjhtQd98zk4GiypRarQBmxKtaA7SZ2NxhPA9dvUq4jSv9x+JtfPnn0ArEZjHB9rLQ7+sPeqKfPpCY1AKIJPxR5JyQ0EhCCPR0KbfZepW32diiTAgADFpSdw+BttqL681NG0oLX+e8DeScIxs1KdOsGiDsNWWrji2kn6BkFkXQD5ol/vy83yBllzPRHT+hReg7IuNHR2BycSfoGk3MYebkRsA9qDqFEJLJJPvNgUbKQnsmRQ1z9PCWUzIVQEI21MZdu8l7UisEk+Uzddwvo+p1KBnCCqPD4B92wh+qxCa1suz8BJ4KuZ3M3NHb3DIPqsi+qFmKAQhbGZxoha1n2+bXwFvxZFVgODQpKcQZ1J8pjV5q7nmCO2LpBge50qoA15kMTVCfnw/J+fPi7o+Y4nKjiUa7QAeRyY7IA0KjgQOp9LIbSEJ1zEYBKgPSPOBNbx07aZARNFl3ijUX4UtmNIC1IntHo8JjOxd1l6nGpxlwlmpVJWQL2IsxoTNOQeleu48rQMS0196O4cjQL0RtFQWSxukW1REOZ7c5nuw8Ytyxo6mgznAwCN3qZGBCjhsQG/ZhXtQQhywbSkvMT6ufAhlIKJzp3+1BD/hZBQ0r4AJ1MA3cd308KGJ6PRpxNzNXxd/2e9DTvhvGBzDHkkPnmOWGro7RrLtF6OPEBEnXT7Ppw55YIkNSBAWQrCymec7F/SEuOBvQvNYMmW9PtiKZnE3G6NVmW1zx3GhJSlwwuimeS4rsw07eG8RuhuLomX3kqCXYw3w9ZccpzWQmCPgcsNinJYklELMg6aGeY3MMsIBqJKJmI3Be1eXJjjeCLoMSFmHIBlwlXTcZFyk39PkKaA2IrQjQT8HhnUzJDdo/3JCrntlx0JmudldFi8gwWXyJz/qJ6cARfUxBPY/eNZUJqrwCDCNNixfYu6HKafH0fd6fyPLbj6M9Rk2Pe+uBy02g2Wc/lVHOPvEXkfvca1GR1ZuXfQmKi//QA0Irtbvyw+RXRhI2adUhfHtxcNHMhxL/M9JW86FHWQERmHmb1W7z/XL9+A05Q8DU5Gvn4APCFo6mZt9qQgMy/bzqCjC0+ZSVgb4CPU9KQg3Xi8JFqLspO8LGYZnZHjYjl4H3nbz1B0lceGsKGU05wZvUWebzInQhhLabjTEaNhJwKgbG04Ruig5jsWUP1SE1qKF6A2KjI9DU2FPdt5msOJm1MeaB7PDoMTeELi16d0F7oM5pE68KstV/QZ3X/slSLHyTEoQsTCNVP1hAcvn4/ZsuDdqo9JDjjs8qJ099UJ73O8V8qfFKDRB5GLDkw8ga4DIMRNiE4RfX7N4MgiF2ZEZ13pEJAtrhLOQ5I2pBOo/tU2pXYR0xe28HsIN9/7mnY0uMdcvhs7nu6twUw2CX458X2vRqdzKAePB5IyQjIGW0HO1qgUSHqUm9jpMRdbTh693nowsLL2dAiYpQUoZUcVmY2GdgVnth+p2Zhsfl87cgmgn6/gHd/oANgdxgK5pK0ixLahehjWrEpfEQcwcxj+qXod5/XOq3GNaPhntQ5WXvAmt5PsUSVaZH4g55D36DrSYV0DHVE30eJ9s7sbCQCnswmUQswHkr9WUCWLCPDN1OSNchV5t2xNRr4jc1/ooIxB4Y+g3PCO3U6CaMshgwxKKyNzIpn4DzqTwaefbUI9XsA2WzcpUQtTKdKEHfLOogmlNmiGIGlFB2iVkjOUNa2BoCXmiaPxXK6FCuHYEdkoC9GeTH7UbEQmOPYNH+fkwR1fWweJcx8ENc2OHH1iHTdvTxsT89s3qEvHyG0y8AbTS29rqBS/MWfA5W+aOnB5BRHZ30iNv+Zdq5rvY2J/bGbcwe05YzmlTHAsSI8B3GW5Ml6sb25nU7Ugbe6lhOmnc6itKvKfoIOWqQLHl6hV31dJY6lr67flzuSO2bAb15sMdozyRtV/2DiTvlpyF4U/C7qy/+b2dzu7qYTfHZr8SyYNcxU10jSpkNGKJbB3V19iAzAMwyJg23sA+QuVIMWyi5kAMMi96sz6DSvc/sPw32NgkVEMUhXXeii8pfhPLePBokvU0I4Z47M6KldQEDOBenwthim1cxXP7c6kzR8f3cPcD3KWT3sXAYKAEmBNpqtmMbOEqwqMGidrOgadbEbKK8m/m4G8q9KRH3wY/Pq6LER/dAQo//ME9G2OH4WtK9CINcH+wMY1/u8LCYz3S42u6LLoKd36UbXM4KmRK7iEyyJc8s07NIoWGXvLN52F2PUjiogkTAbmS2d32Pbg35JTMjKLYzdcaYj1WRYCjeEM9nB6xxbHC1fFYcJazDH0QfACrHyzNEnAH7oqPUGPb3F36CxmM7fLaZjQ9q9WH8PQXNhaBdkXKeI3nxZpRKcZtvSB2rWnWlPiME+XQlBSa+3S93ysxORFbXBP2ggE35bzTLSCGhIxoJ6I75PQPluCLwpYgvHx6r34d5fWt8C+XJHqEIz8ymYbg8lQdDVl3J6QOQIeJ40ePKMY3FjEDUwB0HW0hAoEm0IveUmA4aYPjslXTTovJXUKsRW4tMuhZPq9n0eKrz1qDeU0X0A56WPaoHg0hVIfPm90QzenAG6IRDFTUqka6AFtaQrXtzN9zt7nfjJ2t99+HhMqaZJvK49xPy0xY03+kCa4hyrRgaaesBLeY9k3qoe9vBIeCW8aaFdoNOh/tgbYrECuqHYAfLynZdALoFyaQ1zj6KV8hn8XpuMM0IYEJahiD4Z/oCvaRCc4Lp5cNhSoCi17CkpWOSxk5/cUooTUjVJBKSdGhE5ciWYIQhxxcienEw7RtLCaQnIrxhd0PxeSb1zqBeA0dYAKTUyrCyvyZuSPv2aw+be0NOTjjiQ/khID1h5o6hOdIbgm5EcjiAKyGdWXfAEtOYu1r7TXso+OH6WQHJ9XITvL6YkboPIxIZGhQ3wU6rdyysarRep6AGYaXd4Lg0Mgmx9+M6YowLttC8S8kivwt1MFM5JEAKtcYZBE6rvfr757W7wRFuRXUltjSYXqJBY+eMDNKA9KamwQAp6C/TYC0yGwgU7T6RVQJPguw0uyVXPg3AEcthSbgOEXipdBj21tB/ce9hPe3q9wQewHUXojuI6P4wd6lOA8r5U+CBwgbUk5wVXXesupiVNxNslwB5ap6WzotyNvv8GIYQ6sDdMo/IZRjWw0XD1TMfGvOo3B2xsugCODK1ZVQzMWKEOiL7E8ueRICBSUjNLuFtB+aVyZeQAlsH7d3BXrG5OXrzPmISJC2QV1Z2+cWMq7KAz5eYENmCIy3m1TmcYijJxLFXPKW99jJr3En97UwVBuiTeaz+dmE+ouuGluTwnKdpbTfEPxYqo6R9VXBiOm0+7oMpUxiNmwfnn9cH1BlTQtMYxjuBC23Q5X714osdHvwkmxSYy+pZP1uGCbm7ubvbqxhTGeBK2PidRS1B94d6aqCdcV8Jh7aLckBlDLabs1mc41ysMZmgB8SmZpZWHwtFT8hWnAqHlfLdx9kNV7Ax4evP1yGWiUp0WFluCrk91K3AeS2E4vb5fjB1Z2gpBbG2IKBXS+TC2lWHZg3Tw4vsgVle4rrfH4zvLEAe0Hd380YC2OOLKesFvR63y71FL1Tx+w3hNLo2htvnb7dBn4QoDGs+P+63GS25SP9b9NAhcDJVHtdh7VhkvN9nBJKSM0yAyZlFIsPLPg9hpi9xQhEpho150Lh5tzPTmZuY/9TEhLB4gblEJ0H2eWF17YmLmHIWU+QmKP00Ob8qf4vTwiJv4hSljXSK0aDzqWx7zHXkhK8krFn9u0l2EBHhvZc5vRoaMMxsQv71GymPC2GIPggalH27P+jsUIOFqD2cIcozOaOIM6CN5vcv5acvj5vOiGHkDYmmsb/3a7HzWKkCy9Sbn72xqQmAfb73/aQJJYRbK96AcqRBQ7eLetu2BBlncTNnQozopgE6hVFEfMIGKTVmLTyc6Al8pEdgi730h1bzg6QJh0ZhGpeoGs8jhYp2X7Yg+VixiBOJADda8FDHp7wMVDgVtBjSReIStvPz49o/zKr+/q3gm64QGuuY7377vFPM9k/I9zZdb26or8ou3SaFmeg2vf36uLLicvfarf3522wUOhS6e2dyntl9sKa5tysFBHm/EdUMHXpyahMcsgcFba9Rkfmq0tY8T4i4surR3qvl3eLZKSIVrZS0Kl8KrLUR7xWVsIoYDNjZBF+7PysVqdmcxHFhaLonCtWtwOS0hgIj4kbkS0XIxPZgP9DgQ5woazJ6CqspkxLOuOc3gC8J2vPL6lVCuu3qMYe3iT6k0ewoQLwHBNer7b+zOBNivX04bGFC1Xysqufo3Bvn5OGKvQKcox5HJ3LrYVnYm59RCop55ugZyxNmqueVCDoigoQ87AAM5SnfoBhuF5UMYr1UfFqO+b/NubepxfZTaQxo2VOTQiXNRMfvZgF1ZTRS4ZwlMaXBVVUBXdqTyC/vtdTtVLkZZk3Mx/uLjXgrevllnE2lTadhNH5B0p8fNXOHtqQHA2lUqe4wxB0Fc1ccY/blAceIDoRxtOgbRRjWZ5k7kfRgjz4fpqz9TV1lI+8e+rJ73ClVHhk03m6GQEYqIPLnSPsjH40ewXlhxzxGmzVmg/wZLDGaJyrZA+EgUppfT7ZmYd5B05epseHtRRwjdiAm5q8vEcEUzmJs5UnO2syKy6KgtPj/lA13zh/Gh2I8QCzFed+watZezkBzyRGXd4QIO6CD2/Xz969fv+y/378/L0IMwmYmGAjidvtEwRWtoR3DLLPgPWHf7YrxqmlG0IJo5fLBFBR9J+DiL1Nme6yr/byZB8KTKbIOkiz89xDoSmhprwPZ8oxUgSnuZE8ydXM29Vsih0U5xagW6lVxshjmqv2ImuneeZkxv1U0C4QiVeF8F03Cy0mgaJQ19C5mu5SOL8SCauOHvHQ4Wf0xKdf+1Y1N7kVcpMfB/DepfNZlSOqUzzlUkjP0ZXSPKwT6Wx8m548KF5jLU5vuFXlO9t9itqeDQ0RxVaVszMV2w0gfSfUENLkZuoDJ+OQFsYdnesqO8+OBvOxiN/uJDMRdjU64TuaOP+6oZa5pWiDnGUH9bGHFkWKrxamViRkoX2Ox+wRP2sQnm32c21mYdjYKITIBsmBh+/X6Iu0WzAaxW5YHfKb0tHD80EWQk4iN/lxZasF6Z4fa6sqSXbfJsJwFVGqH5n8bh9pGaBhtqNsKE/IvQg6Dd16/QpNif1MuaQyTz62xI6xXA43ZEjPMqM+oZm6Q3AzSbV0wKXC5dB8w/L9+f346/GB/9GJWcV7H+80LvJ77vg2EFPcBya7Jbk7fhfsdPQiwG/ksWwRxDjT+DVUIYZNT0fBwVDCBljCmWI/9xdweutRfKum+SFCGq8+4BOkiJEsODd37wFTluxVFGgaz4CzZLOUc3Igoj02twJWaKIu0T9Q6Uw99ujAd+kl3SJX+zy/8/akKFvLPE6778Lg+JsxOYRZiIlkB5jAZETI+9wzUPYTBHB+KNGZxTL72iHxoPAWeZOzRqxMsDh47gzTMsOIArn3/6OkEZ3th033uWG2YHtf+Pg8qcuomzuhnSozLj+J7U6C4HJxAbjXmg4M+qDLuplORTaFHNc1PBIBfZBpnJbuIRcsQHkomTw7YcpLG70Xl8EUuEZmRPzs9biVeEl9MVjsDR4Jgdtj5A8eCfn7TxflBFKZcP4w07DT0z5MaRNFXQ2nXB5qOJgykcBSALQN9vfl3mgxcAQPBD/vj3t0eHzg0yJkqbeI2oX9w8nta9ryF4X71VLUd9Q3tSwIbGgkf7soMmOu1E2USxPQYWTHNmNCROUMKEsdbXetBCYmGBNEk2p20hkasNU7s+/zCOADivKOQ8xDwbHtmbxNjXUAJ/IgjVY8CC1wvX2jCPqidnayeMOSMkJqk2aaqrPkyG9QaH65PVOvfv5qN/kByQh3RsByfSAWNK5o7J3YlchizYx/vx39+X2QBAOEQdHT9dK/HBsNvD+8H+OvzgfErpOTjZDjwKnNjBgZN6T0jP/MmnZ3oXbWdq0U86EeYZ/Nr4ihFITHxAqu1wADWy4vVroRtRl6zXexS1lKDrzYj9zxy5Sd9vUBkbA9wyKKzSaG8HM/hTIGQjhJgk+zHUtaMRvRuBG9VZa0i73S9rEswwWjwFBNXBh0eFwIMeK1filZQWGGV76oJb4TXwzSgzDdaMM8GakAMVLVMzh9sSjB9/f3L4IUdTj8SwkDUv/2m/Dblhn7bWYADwV6X2Y9bLQk8JnupU28GbpwntuKzt5rFSnPGZDsgwkPxk3MjkFfZnfEFhrkSdSVRPrDdiXYEQBiqvItnD70vGmBGmdC+Wrd5wXBQOdWQYMA5tUY0HkiRTosozYlFvRlQLASonKGEuIo+Sdjf3s2ARpYbmpI+lN2wqPlXE/VvxCAPjKSZcbk8HiR9mBbMhHHkdWAAyPzyFVGd2V8z7hek8MahI1T89Z//fNq9kP2ArH8DfJhOz/Qay4j6i5lgPC583aw5adR9LJYfBibdVK2Z1BvG/C+m9NCsxcEpT9HtxWkuCV/ZsZI0TMhGyO35dbBdkS0Jh28RcMzA5SMvjGXgsAAOn54HTMKEuYgMhsOFDAs1cZfZ8J9yJfdj9x6uJMdGQmVjQ+FlNtjQ5ExZ/3bM8YGaCfJw/WCorGN7kSkiIlsNzQPzIRxBJyOSG/CmcIETIuzrx3/s4xfs8m/ZfPvrYg/fo+Vu8dbWmePjGB5Cv/QyPlb1+CzTtBruAw3FJJoEtktDpRFnTRgPOl5f7PN8Hu4NNWepMReiMw3QR0boz++jVKarw1cNvK/vQLv55gMorqVFS76estnOaL+FmgDVMMyW/YCd/iSwzd6HD9H4d4AGFFk9Q1BIeX4S3f0GvoPMGWLce0KskRF3J72ym0tsh9ZE01XTOEgZnV13Tr09ZkxLPC6//wPs8klTJE9I038dB3Y0MtHJvo1Fjf9jf+sX85JER5h2Mb+AYo0aIqfg/D+c0l5JBWwRx4HC6cYmJR8DouMHsQmT+pEVGbT475jIMnm+/vxBJ9POqhdcKarqGsLgYHlSH79wuLoMVIcVL+yWfNqe440l1p0vohTMrFmtCsHt8uF3D9ZykM7skLo3+2wgwXPQkDNSmw8yOSyjCtmmt6IjgCnByCG6Ez44ytJPC76MgLFDSd0eU7bejEYN6X9/2J83xDkI2XuOjrKfxK7UdYoWAOIgZ/GyoRv+0YGKBtVNNFYvtYHNDAJZJwsqpcy5eWeoYV/0JSkR7EPEzFZmUkxocuj5D2MWdCYpQbeJDGljBUCghdzFMA8Hh+qYN9pYWbHTDZWw5txCJIfJpCs6IBiBa0pjI5VZgZNfGJgxO3/xVnJaEXbVdaJT6xBVw1ZMU0/+kwcnDm+///Mfk/MUMCmLeQz7MQAStHndkcymczXTgXQgcfTHHSDw0aO0iFH8RZPncz89DN2YfTILITojNAfiUFFHJuXSTFK8LBSBIcTy/P7eN09uMiHforeyqS+/qFReOcA07clGSN/qoKq3b3lK8cBhaYME4xKGm7wwG+ducQbA5hR6KU+wajEv5ckT1iGD0yfhE1yFoIwSfGMPePeBW84upQ8JGj3OaBIfOFSFeeMBYgbfywMQ7naHn0OoaPqMiufCqgkp7fq7aujQYoQrHzpHBJmm8f2EebgBTTykITQ7bUYCEwYY90ZaMa0zuVNmDIuTFWRazQisTJcSR6EB8c/395NDbew+FDuf6PZ9rL54Gl6aR6K04kk6AxmwDxvpruApCeA40QVP6Cu7nNIefUrP1wZYjRGNfGxqP9EGMFHdv3yWA6/ex4SYVJxDgagBpgeLCj4INdjd+KE2g4/PG5uWB+SGkM+weAEsKOgDRSnrbr4OabYHupGmESgB0T26+MyGqL5r9odu9fIhnIwkIOplTFxjOBkGAvOa/RWnhZ4ZmO7MXAb86TwMZlfIlbAdABHoBDB3iCv5Au3Joflj6a/axZ4bs/+0nKt3o2Ma5fvPVkmaCyYinuT9EZXdXpg1poanHJxTn4OinA3FzXFiV5hl5yrNMkboQ/365/sQRSEB5qpZ9pzMYJDlwH5nnR/EwfJYH2wAk3S6++VmcdsVeSITtgmIRa8OBXO0eFBpbw/wRk3sKguY2sPAAGorH8xofzCM/1BFFslUCy6vLGoZbJ7Z8zcu08MeF4ZkWNY0ocXLvgpkfbcfGvnYiXeQE1n2baSBSQPLzJt6c814Js3dU1ik7mJStC0IY8pI9CnPF6mRtY+hsCpSmBXaGVanc3nPjpkNUFEw3vemUfVWOe0hHvnr+0VOOB/JWoLa59FSQ3o79FgtGI74ZDTBpA8V8YOJiut9hFARfsMPdp3hE3OAHIq9IihBshN5vYkNZuxwW81eh8dN9XPYaaZWGXVeLOhghhRftyPtrzdMciaLrjsMztqdAf6IZuIf45XjMsCWBpSKJw4AqJiC5k4BSJpzbpRI25riJLkMBjcWbJ2r/GurC/d8n14UmysG4AyEfP/xtSo5e5GXTN4Gvp1M367RAepHZMkh08oevbFfmtNvuEQOnZkkQIeSctOmTaiEOAD77XgDGPqO1MWd0S/qVpikmAzr0Z7f1HlrCmdoru9gbTPLvijXEOcBxnkZvTe5IRF9hc2x+IeGyQJG6HlncQuuDHIB9vlE12fQsGd55nIdmChF18RK5i1OP4QEJjtfUkn0zP5C9O+yKd/LWsnrgjAX6rtFM4cTne6eiGOFC0DlwJjRoS0hdVeFmWbzmhg/OthkBljjgT177c5NoUX8P2LKVGulOnty0WgZcv4XSZf/qXEGN/72ofmgC7uTUM4zSDcsZhVu6lRCWbxXSmMW/0Rmo9w89VBhh4mXq2k7Om8wqn9FEhRohsWyT3Sg2c+i+jURK489Mv1jb0fCtptrz6FH7/NHryey6Kag9uafpM6V71O6J2oogpkOcjkntfUX32hziH2mLRYMIlTNu1fAK6fmVuqaEIwL7c7sjfBTLHC+hCNvbWllOfd4kVZUXUpArwhUkEucMamNhiToGOX8W4HhL+94VpXwQUEP97tBZRa07jfMVQ393S7/yJiZDQ4kVsFIaM8knun09bFFsEBgwla9kRCgXIBZkjvKWj0yVZwkBaIeHndovd0As1YL2hhnEowoy0zN5vgf17dCNE7eWRfdcVRbY291cisLyrD06h2KJdWNOuofEGH+8dqVh6u5jKcv1/SdKpsTqrF3rXC8u+1rcmoPsqA7nPK9MSktEytODANreoMO8dcv9dzhHd85WwVveLuSMRH9pA+0yJgLfDxG8vK47af1wpMYJjStvlweIOXAv8f5wcoh8TqS0pwwuqNbxIwzvOkIK7GMiz08EtT2nOMQ54jaIMeYIs0z2qfRIPAl9mLuu/UNGpqFyKT5rC0Y7HXeVvRYhyzwlVVLcYJ12G8NdWLqWwsqeHDekyvK9+LcziTUDA4oRDa9+ToYe+7NKZY0i4pGgNsDznA1r4OZVU/1/xbuNTH85/fHTU3RGH64oAEA1W5o2IDGXbOlI+g1xIAwk11bJQX1OqMveEW6/tIvK0N2g26qCNxoUVCAQVGHSQzkNybRSOMhQSeEaVE8zbRo6kODkVm3UTtYX1poc9Qt4czsvO1nA6/HtmmHVZzJCQpchql8NPMz0xzV+cJBFORFRNlfcm50QFo2uvkEJ+lumcrwmXzvW7LYXi5WSVOOvokCbDHPZbHbmtHkolTd79+Y/aHAfyG0UELpcntc2NrPKU6Q0ZkABraI5yBwJsbHxTsBOJptr2Id7xy4IoEPM0IC0Z8+8YzhFtNci8LRpYVskdgIQXPFwu8ckOtAKENMaqgvVmZpg8aHiHS/xAvhEEHxGfugN6WRTEHz4SSuoe1u4YoMb4XBVJDgHCwLS6x1L7CaVw2tH5UWIpGubPVMeIlK6XG6SMYGRyzyc/FV2gufILfVQoHxcam5ugv7Oa7sbWTJSdMUoOUAYwSGfkBi0M2mv3RRUjbkdxbRwQAOsJe8x0isKf0M0IYhFbtFV6+isI7wQCEdqcBRJojtWuA66MhFRlJCUXWq4wBGcXHmdItcBKE5pC3yNAobFBOImNKWFdmwplcp4rUFk9XujLb2uPkesqev3tFURZ2myF410Y4kn8qPlTVeC2UOX3nn68wYtmdvoBcvPKDsbYWgDQy4oFE1ZErpt0XXaPJHG9K9v7ON994/MMuN1Nywaiw0qj6DFkMn3MWeg2OL69CJoQ3z3ivoZXpDLRcNX3xquoWgZazdkGD0nskRRhayMQwcFNd8rwwHU48BUxRMcaDSBxDhxGesEqo3IC0iYrR4e881VvSOGY5UbbV/rhTC5kMdqMgpE1DzhlTEVjeDbURUdTGp78Y7V0LX5e5CXmLSRsbjYYLtDBHNmKz3tqTP+0f90IS9fQfDPkDNV8McJFgEyGB6ng81awimaIdKWDN4DhMpC0wvRwjLdNzMODuaMPmm8a6bPdzIMtgscu6FjGzmVGdE+3cmSlcaODLWcGQZREwku8sbWOVfzGfmNivIZIJoIuCMEvu52JGbtBdo97wFG7pI8LU/OWirup+KhM785bvVc46+FA22Pfq+Gk7ekbZtU7RSNwNndYD4ADQSkOhHmUtBUe6OVg36QuTsfit5d7vASpsJXaf5jrsugoJxuH+yNkvkIo1bULLkegZkKAopSMFc8yAHyhTyjtGq7sbjYlkMj9WRVG0W8fHqpp6+sBsN67FjY2aNhSUX9bCJjBVB4ZcKqgxePMvPtGQAV6KauBgNq/cwc5CQudDyRTwGbEAm++eByJK2fT8UwGxtwyYrWIHjc0GzbUyTMztaSl1NVJeyk91GNQawGay1/QTV/GXuexVl1WZ3UcSiBgMl7nqvGZp85wWlAeRNke4B7IUNhaVTdyfHfZh2RY28J0kVOmTz0vWcfeNwLdKAI+rRJS3imAd009DmoqKvSKuiiLHJgqy5V4AOA0pFGxMYJrNyWHzzBqbIkyofssmmZV+7huyTxosOp7riyBoqtOD90rQVZpKFudu+V3Ho1mVTlYgQUy1agqp1mMU3gWxcwCCTIZAb6cXAKDFhvMSMsUZVrj7JeUUnGPBGN1M6cGI3GA6253UYhSS7PAS1skSG/hBm17cdoeFKYn8IKC1riUB4w5WTzTeUaIaFzUTzkn2+cSNsi941ZcJLyIdyjnYRt5IzCM8ozZaDy40AKsBiRRpFbYsTeR/3H0DOqEyxCMDFrdo5t2ttnYqE32gG03orQA9uV2j7xQN79RhqB85MqMhKh7p9i6yCSSpeiRLhMJZ+BQEY13aIzYhsDcgBPzTtd/9AIPGJQuztipSmus8vTtUBMDaMIP25T0hlTtyfAmTAZj5ySaGb8gC23MM6TIE7E9hHnhMWKVgkyaZnszyMlXSzZIM0Ys+QZ9EmIeRtEiD/iH4kDsfyEOwSsTeosnTxvXugpvURgU4TVxhiIN6KwVfmkOqyeMYZDR0vMAaqnrt9Hc+2mDhxL2xAstb5o7nE1F7Yzsakp8gTtJkY1fMjjhGhxOLDWYv2Vmn9ASjkkIe7DgOyyzfEEve+q11h5iU/KpcShg8ni5Svt3EU3iXsHefoS6/UuSnvvNn1NuuPJBSgiUXQD7PLZqQxHoMZz4nMTaQjW4hLDJPzlgYW6J3+Oq6iGhTvTxB92MrOGmJlkVBFETAtq1o3nERTG+LI8FCcDbBypyF3wSQ9NhtuytWZpTcw8rWfG9KdizNURoXCyuqan0WhIgvmT245+9pYhZk2C2HnkeOGKqeEJG5dsMxOoFAbH6MBDMjFJGF2WA3jBB1VzmZXFxITIA1PenSQn89ooEXUbYZAURYbTMjLOKEu2HUT5WVB+qBIzwJ28NCgusuZ6FUFw1WGI2sDj9qLTdFn0dFyPcyi3NJKzhJk3L1/kBMLdY/MQuooruxwJLFpVY52NCmG4dQ3pgWfh3IVgAhbUi411y15WmWD4t/SdlbSrDzZy/jyVVD7N1IlW36sII7teaeQI1gH8s0hwXvs68StSj3Z0pAHRURydVYONI7fDTwzHrzep8eNDaWcKZ6ZuWTwgyuiLgvzV88XHS9NPwvmM8SMPMM8zmbjxedNOm84iIk004s42IN26ImfPWoLhnZtsZ9R0iR8o73mvJW9KZj6VQGpKKB9cym3e5Ghftu/nk6EyVqfVm/DeLxEOwprQjfOXIa7QrHyrM4NG51diNMbNM2+OJhj+fZYy0TKyeBLKZBcQ+SMqDkmUsdPUGM05w8Dw4cREz1IYJoWj8N6Q+Mi/jA1f1i0fu/QCLaIUlrt9ovUCqQZVJCAVg8G0WNCJLMO4zKN5scQipgjXEFlDNY10RaIx2oNvgxC01KLryyTEsuUk0/6HHOtoYOoqIOWUERRn7EFMQGCRObjkjcA+M5bpulhqjObEVAUiqTWFXVQinUgXZtueY5ZqpSd4Yc96vuWpojUSTZbXnxmRaxmcSWPHzteSb+Pbg2T8oNLJ6Z1uN6GXgRUyDYYhian6+VOGlLWDFd2gU8E0T4syuyDOk1eJUx1NLmnx0YTDDpAMaHSdWT1N0mvYsYMYigjbmHz54YUMRmqRGAZ1RtB8LdGpduZpnQ5s0hEGYRK8k7iI/FLoNQfuRxsFl82LPXrKZpc0HvQSCWKOpEVKIlhhiB6EcGQ1rSIk7D4wAbq3mEiZ/uKdNQwi4FsrUvtDDh3gfBuBkKbZ+46ufO9m1oPl4uhEAu5P8zrddPorMQ3b56+P9iRxfQGTy4fwlwclUKC5lUirLGYqEDY2/UwVD34DcDcgerMnZ2K6K+eMt8M0xj28iP5WLnbAPvIaE8s7uCmyTlolMzVHu9J07Tq86Dr8eWT7B3VviOzvI8lYgMDWOoxirWnvQRR/B970tIVLMfCUCANiUoGUGBRdbLZSExXSlYZgCXHlb0Ne+HjEqY1lx4/Mkcn2YJmDBP1QXJephs6m/sZnI0GIcbbRzcggWTCJv0rxqZFLIqS3wPdzKQVxWgZEDTpEpA64ehCQTV+4fhKZ78CPvmH3YCR9KWPfkLSE3sVzEprpRC7pggVtucfbeQwX6XNodpVguQVLt8SyQxVN8STgGPVFqQYnnl9cLGYgoSsbqaA6m0eexSLteYs+BgorAu52sgDD6mS1ZKszlgOqsYub4mKoTaUiWvMNz0PdzOiywiGd7sO68DJGvwW96qtxNvAH1gRgcxlP2Hcb54SOBZ7USLduG5m4gghByQYDhqAXskXileNSGwiXS4ZIOmSkWXEhpuh5wDbdcB2HJCeoJgLO2RXxBVZzkH8gRx/ICMdvBuY3hG5MVPHrTDoR5gCVGhNnt0JnHYIKhVBdCuGLgp3K2TnwLbP6PAy1rfAISdkARfBRWwSNEMMYIMSa9JuDNC/k3S3TTJqcy7TfoWtSxywBQgEz+c02PtE1fhZCLyEL1cmXLjtKDPtCCIUcIFaRBsl4o+PXxYhm/51bLtgMVD0JRgR7GZ5BY7DL0r1KCJlD3BWRxSiCuTfHsg8gfJ5MNtsgMauGYBWWLjOaRkQiCzc8wUiBzLvkdgnZhFdJzZAB8/ghfLcSK+b09zN9zukrpDbq56Y3Nfql5Uv0yIglj82Me0s60Y2h2Xk+iFaelIjM/8YxTJU9ydpgRAq2dAAmv2iPDYnL8qTxFQclLp34Cz+hltgSwHtmgVtqe7qY/A9DajRQW9Q3UNJGlM8WBthQUnXDesgjrVPcc4DqKxRcANzUbMvLsELWhdFqTCMZoh6LAExO4w2MZQVzVwPCwqmovVHtm4i5e5CRg5AvezonqgDFDuLM/HO2suqZa4599flfl2K+D00FkcD/0yLs57xL5AZcaTCE/AkLVwE2GnnNoI3rpRyQENBIwe7+H4PUYAjoi9aJsiGMqi1SRy1Uru0bPMIyybyLAbofJ2ouWNAmkSvbFxhtuPKKc4LpoIG9s7BPyLBfwU/BMt86PYCzx+31TDWcDdBonpfcGmCAHV8NFtilhrBiIl15fK7hf1Ri1oJ8Oyrd2jnKMJuxndsK877E1ZVFMfUek2bcSJ2MI98HInerFoJ5afIXUpCU8gyeeObz27piZEgNHtTFtGE8tsY80d2kCNqindX72kGQRPsBhP/0mgu3YVVwPTS5y3I0iGPJ5cZyWVWd1NSp2fyxZuYyRCo3OjHBYNrIDS3u85x7E5FkftsSI9UeQIws3akwBGvKqmTD8PuOxXdbIFdCDARO9Hl4kuEtYNTwTdv+IpRFFangm/4jWT0YbwIDIgfQ0bf9+DmoZMVkb9ikoUQV0aAWxjGKdReTpbeLTZDwiSidDkrrmESEP8SYdfiZUAsdmNOAWGN+Dx8Q57WKrABz2IUi0ss+LhMyYlgWQVePVttv8elczuvYSazllmy8UFWS0r69yfszmB6PGKaHn0CN4aJID2YfX41kRWG5DsAY7KJgZwKomyn/R7Z1AAKGVo+7R2BHska+MJTYDWWDiyA56xEYMuz7yVCJ42gmqYwObd5oNyvhQVaWlC3bzvNla7aImw+T9rvYujKkBfbr2mnIrXbQPyCVh9fSpNVGFHmSNte2Z3ruIO5E3Z/cbotN8IrbU1OYrZGSGMx458/LyByFUPsqTC84jNUrHijeQPwAhQpIpi5+kKEHlmNGaE+RAdCFXLzMmRDY+q+M7kFBmq7xNOqRSko4RXOGQSlw5XLD2hiVMjnKbnAFW6azEvYA8IlkuzK5u7DoMV3aEzhbhlsVlJoqEk+7ZDhBD4+nUYSM5vjg/kZuZuZi76AdKbI0j1r71wXwZWGQSTGTqLHzL2YO30ZqdMNkj9T7aJaDSw6enE0LiqzH2yBQNqLoVBcuzFOLERjiIq2+AamVlPoXl+tw/YWppBgEzEFs2TOpqDtliyBap6dTO12VegauRoUW+oY+oqxgh238+TcHKsWXy6VE2IVbBhI4MYtfhy0mMUwkfK8RLXTiYqElQuVlZboABZkaGGeRHrAYu/A/ifEwFzPyh0mrE3CA3CrkXQYqWqP/4VBFNiv2sjkPZJbYzQsKhceTnQTHN2xbRo1SS4yQ7GeUePSobVOtPJXzAP2y0Os0B1NBmf/bvcH3iHkCwYiw3EHu0hIJYuHJj0clIE9caxX57p4JLOmx5QN4gbe8ZUb+wyBsc92FVeJ+yzgOSBD4HWkoRGvcxZ89t2D5AVWIdrX+ZgdZUYaFykSAuH47V7Ndiij0BWXNcAlw10s6JjH4C+uDTAHrLtXY8nJq81vTla91u2bZC0soYNjz1qIodjFhxDVPbQmByAMYcHHjPm14YJ6IQntbohcugGI7qZCKnobbw8LxAdk1ZJSjnCkzN7GxbvPNm2IoiDljwT4BTtZJdpU6lHLScI1hrImbI5NGqmfKW1U1hZ7BWDcXePkHe2L4whG/AgqVrjgSG4o5g0JqpitVjRlDjnDJMAhdNce47lYt2hvjzZkhWavC0rvk7ocEtczkHW7aApUlkAbdzjJnUlknzHvP/Zm8Dhsh+Etpa8ZCZISZ5EyoDKzYXjAfntGx+Z4/yBJD8YnUOYzEXdhuHdkyO1w4uPiS85p+bmCgGkAfGBxDvMGwcmBa7pbvXG1qZsj8TQmhVsMMZG5TowGfQf4LIGaFe2QdkLDDCtlijaY31VfoS+1CwsbC6i+q6+4Q0ywatUI05Cj2Iuwl1Kp8J6me6HxVyPgiNYRFbk513awXC7NrEk7JfyKb9ZimZtEbAyH2PjeGiEQSgbwiOSVSYMAxn/6KNKyon1/GhaLWm4c+FlWLo/FigPCAmec3TmNQEsg9pdAKh3uh9EQAROUKgCh2xOFnpfGb7gtAnA0cjAISFH0UU5mrX1kHBNQco9LaLndISlEa0uig7ocAW7BvKgQPOcVMR/7RxauR0SnCFJZWBc8g4SBA+vM7nq/Dlc3T4tztUXfewWzgTheB7z6qnAOABU1iTKzVLzrLHOkbXUIz+F1hu/K+JFKBZD3Poy37jFhamFZrpeBy/Fme/XBDtpw3orsIToEA5mxdk7dRVWWVlpYZdJ9v1byFRIr49Ftf3n5cj+yBK9OB0YELFfpjKDgowpj0Ec2e3BPGYtgEaGIVIwhdiJpqb3H14EhdpQP1m1Hgh3ThyDMMhzXa/01+Rd8sSpXjiOPiEaI0Rfs4HWUPdT1stBq7qBf1HKlJjcRUOBbM2cpRCPhtFUMUtRPoOAJ9Xpy5iMZCGuDaRNwmNhB21tkGeXBQ4eaMsISOYMqkGKH1KbXqP07hdlGljHrhuBtV3kE+nYc/3y/NDa5oZ78BC8LTDtwLlqP8Bwpzo/hPnilBatSWY/UiAYYS7Oqo8FzeZPXtSLKKrj3jBztgkJ5SeD0sNAAo01c2DO0bcGd9g0vU4e3yH19XvVU2pH+Lz0JjIhxQlaErwW0JKiPYOQTDxXZaDe9d7UkLYsGk7GEUU1b3NVgIaxdNfQTIqG2jNgbC3oCi7Pj7iwI7FEzGX9/P59HIrMTVhGQ7RuUF5DblounE1mUZ85LrFhl//P1hVFr8FZq70YSlSh0KGkns6GE+YHJisk+p2KzO3dG81pZfTOY54Sx8o8bxZdoRmeZlDFBGIXHnQ0yofVkYHPrxI3Bfa+9wyB2gnynlRmcEWvNZy1yRiYgkRAIrpp9Rppu9JRAqPDOqzmJ7aW+VURj+LIbq1a7IChb071Txl671ZF/hh4N9uoxLWg2+dHPqPqBmBe3E2Oor69//pioChetCl84tVvU9ri6hVlBONMPUVszds4O//l+2uETV6rCsfoIt1lTtDGCDghgriZOsUEupMpYxJB4GBhOoyUBlUZ7XvAdYCEA6x/YcbksqN0bdIKWj5NWxJMNZwDF58eFP42VMdgE0+HHGK5o3fN2sESACtai/OSiFoO6uYE+IpGTl0FNIPlb9N3pTHIzqGcDJlM3BFAYS7UrhNZw8igaoEIPUgcdN1S6ifCpcCL96/UtkuT94CodslXmrQ4Ic63jwpqdn3ptm+CwHmYfMgPEWN0Zrxo8f3+7dpDKjKoDP/CKJgIL1LjJ3R5EDc2sMbqicHUR1z0u/R22ZRm0nhhFyAHra8de/GSTOR/S4gwdW+ZBGWlP2dnF6dEs1RPYTcTbIGYLajiFp2FJvTJeOpv5Kg3JrDho+x47HpQP53KbaVXba1aXCcyifRWbZToqERaxgSBsDq6XBjGeoENFS8j2EhvLpvY/oBk7hVX0VxoA4+1aGPqlymKu3m3S62tbwVo1gwiY0XF3e4ymylwcAj3jNhziubgRQnITkmLFsIwR00cLme5M6vfLA4ug7N0BQQMc90jBI3DHUC9GqS3+GkQI118eWN2MuRv2Tl1+f9zHyXf5zQtnAxKGxbWJ1wyTdtEweGXjt1bQ1TyWL1mhUonpnDM7qL+C6FAmezXTZ4AdE08dA7F+8llsVODyCr4hImZxs7zIAFDIe2O6/NzBRRjootgCxuSEElbS5yh6B2ylK5xFW1jTW8l3byJi86GWnmHtr3kFMKX3oIplPXFcQqxrYJ1RhPzL3HTD9CXOdLrfMDLNVvg5hRnO72Hhq2FUmASM5qG7z2ATYr/H9WJ+KIxYEWqa1V3JrkWO0Im2w/e0RZZaIGmVi2ttXtukVEOqZffke5FXFaXxuWlPBikp7ASwJlq5WLYbPTMZ1JJiwuN93dF0s4se5PUkRRlbrMlFyZ3MWYG2d2HlrKWLmvVCPB0URDGjpR/jyAfHWpBWm5D7H31l02o2FLrMPWjwiYoxCRLD4gSxGE1Y2ZbOtU4glpgY4HIBMfNwZowXrRPtQGQGmMEVaGDGgZUMYGGAhvdkDoJxgdQ5bpFVCNF2W+ZlatfcrKU0IroR3ZcSob6bnZNReutYeWQojQltzppMomswIGUeT72a08r7o3UDB7T5pVacQzu1OcXHthjYHYePQXRO0r02Yg4B4UJw0vzYnc0QVwAXAMj2dudW+0n8beT/78XeY5+QFD+osYvuz05lV6s7ayOinGB/KaBfJhnNKBsB2Gbvzg5wVvslxp5REX5g0BSqtZCTiAsHBhiPwfRuSeDCY7k5ORXgyn9zy7PkTNMAYSnKxi5Can9s4aBJGG6UxeJJ7cya//CmH4IRBKwTco4o0HD5EQmTOcD4Ijcnd+FqcF3+gOORZRd7kFPbENWLX2BTX6AOcnWThdKoHTMw7Yit652Wi5PKrUPWoet5W7V7hzAxQqD0K/PkS0ojq13QZ95fxYIGXbSINWT6Vuzfop+fMUPTEdOMPZivur5uE+25xJaZiZxJQRxdnRfxhy76w82jPzcDBnjoCq+Dou8NE+JpW1W3YlToiUk6RUkoJJblssYwOIXLjicaDhC/KYTWxtBDDWwKPQHtmXooorzcuAN0y1xgz8YRZPrV00TGm2lBeZyM9OCuf4AGBK0kABwzEDEylk42vDgxB9ZWo56qzENkbonOH29nnpx7D+zrWK6GQf9hFMtKSnPH7e/mBw3iKel757IS0+ZZk+sRpUP21uDo1H2Wmng9IvW+0Oh7f5Wj1ZQ5Ra82BcRThljZxFZDWUIUea/irHlZ2VXKmmtsaT9EoYqKpBhVj1zXtAYVj53WcPMJdVpxYnWl3ZQnYobMoiP0G6DvABExslbmtma29s5gqR+x8o3lFTh6bWpCZcwOaFqlcdzBSa4jjUoi6hjYywcTyRqoWl3FZyMoA2IEkJ4i3duR0QX1YQSKixAvXvHE4ozfPlZsFy0693XnqzoOnCraPWJwk03SAjCNgzNmDppeEC0229iDfFjI4oKE1SjbFztZnWFd3IgcyaNRODbsRCzYHKACGeko9s2HRtmHrOIo93HBqrL1jAE2l6sP9ha4mA9vmn07ZqpB1sQwIxACeJ2RjTXsmQd16qqUGdm/wrarNMKluCDoBJ5YWQWdHbROHO7AMjnYJraV4PkmesOhhoUsmxK8TFprrD5J9ZO4M0A/KPGrVNo3JgRf2061wAqSsKJdblpo0ZAcG2VfUA4jpvaxl8SRsB2TTiJLxuZWzWaYkc6SKJJkVOdFnew02hyZUV4vR+9Unrn3W02gAZuCL1e4o7kHZCfl1+1258gbwAEyox1nQk2KGxdXkhXTJ3MsEjQzUf755zi0F9ekwSKURSAUWN/rnxL0SL+vPcKgRRhAFiXi1JntQkwOzr6rmZN13CWsDpW1CplejP1/0+ItjnWAjtWUXWmOOXjx2zwrHbBwB6lylCjXMg4SHGpMDobiCaoymhCysFeSQlZlVJQjL6LolDWIS2rVozjvKb3FoikqtluZK7a3hSEr0zk6/BERCpp/YSwXDi6zCVBDodqux3ugCVGQV3FoBZNuFHNgPRgyvS2P2zD7mHSvSpUogZAAJAuZ/Q0CjAcpIDvmf1mOjDDSrNhzRxjDOranpdUravPqY5Q8ABL2sloZz1jNCx3oE9HCwr4j4hfj2TyrWKexD68tgC3LiTV9LoM5O5bSRT++BKdv06YRNV6yrXsTLTsC57W2LmnBC84mgxNpAivSisIGsG3HBuFuJJXNyNrS5HiI1tWDX8y6BbhCphnSRvuJOS4sWkay2aI/mOcwi3BsYG50nQife86eOg0wuT7Ry6m8tDhrKdhp9t5rXBtOcDAXo9w/k+1cWaQOpFhl5i2AzOhxdkgIzi6sGnSR5EAjltpwtNlErZOSsz6eInQSbyyoLWIFaUKOrPtowk6F4C/KWXm21ipU0+YzuBO6nm6rh6firDJkgBGAHjYbKTWgec6or+rOVcKDSTDqsPbQcycxUKJ9dewu1weHchHqdOIeJFEI2ExN0tgWMNI8S84Pz0o7P/AoYgBGJVEh7rooQaE6g3qBqa7KNFRNU/Uhe+zAaA9ngvCRNfdR+woM0KKXlYExsr3cuvwU9bH+L0mTpChtSrqq/0rh9ir+Qs2gM9sE1obV6YY9ivKpP9zj2+2hnqUBXXhoepwp4hELLUjChvLrOLP/LtRDRVArl4/V6+IgREUb9dUBFYlVaNkOjwyn48KgM62cYPDM3Yj+OLDDEeowNGK4yA3bHsyG1edN2BGs5Kg3wjASSb5TWQt6g9tpT3wIaTMVIr4uAEy2cHKiT2t8lWqD7oCfbNdC7Sc4O59fLy+NIEMrFjeWIFTpZ5lYGVltKcjiCHQ1FpbWjmAA5vtD1Q5MFAz9RNdj/hC4Ocze97ZManGK+YmlXgaC1UDEY0sMXznYCd8Xaf0Iz6cwot26E78jq9lYkmPvtbOzHFeUCh80zR3kz2oWGmhZv8Hzk14vqM+WzSGL9484v2TQrvqQ1Ais+TNgn72W89eKAGexxfGCqfNKjdwOtFFFeWL91rEr5NYs13Pfnlwkt9eV43uSpDntVPxU2R3vmzpM38smPtpXRqnEfOBj7TEzZ3o7cOHCAKvRLXEGi01QXQur8ezFIQpfOOXAUgYcFOE4m0pljSYmDyDwRIo99E/apQDHIaMWbY5njRm2eQY7U8cB60ffii0Ml/qBybQgBo/kpatCl19X1AcSqSwasmIpNHpxA9OKCmpo3uk5lXJh/5M2kC0ivVt9swlXT6ZNfNWHllpijpfekIOQ++ZtMWhDjaKnJuhgnr9UahH21gOdFPArMpiI090EjH5JwwQ3bsCZSNIGIDeomYKGWYPgMzd3sco5aY5iXjRWwJFPYgQNoBt6BpYaMX6k/Oo4ckSES+MnrrADqcjI3fAcGkEbslZKacJ/GAQC12ldvOyrlBE2zXlKgdSnw6LGUrcn3ICsvgoOkbF5Q90uvGgit55k0mPQNp6sXQtahcvJc3Y2cNKOHG+7yGNr2t5b3JhKQjeHdzQkdR4skTSVuE6MiGfMziJHB1pGdJg97oi1Z03PsCUOE3TDDLyEL4h/OKyeQLKD0L5kBN0iF9RsI7J9bKuDegOyQZuVeGXpHDKH+UY6SZy0tNOwHAM4cyRqWNF1IdyFk1rJ46/lc+xSLPKEstqaBFM+yfdiIXmkvmWfCcD5IzeIBhVWwNWJguPjhkkswn36digSQh7kBX+R1yl79TEq5U82d8rXF2swJmWVIXj5RBVUQ19INGAGFO9qYUFnYP4XXSWL15GmwGBMK+DrUJWmgrQqUnCRvTHS5rD4sC3X0DLc6dilAcAHQzIRdbDXi/FKb+4QTDaEG70n71DzZ9KfNZZ81F1XPqwSEvsIg7dfM6ALuTaKxjr6r6BM2Q78ayCsWpScUgzpqTbspgSEZsZu1+pQRtzb87n5kmtnFS/OEuRbGIuozlBw4iRxSwcsoazYDDLDDFtI0mHIYmT+wdT2zpY4Q5tA8xMy4mx2Yl8Hgt/MHB/X0mn4EKPYvm1xcUPNeIvtG1OvoB4pJa4ZAGHREgg2eAKY0MWkAbesDaqWjQwModCz/OesCpGoc2JtnBRDP9zZynmtpCax5E3gPnKnn7ZXqbz/SLPFH1MLsBrzSQznS8S5J0rVJ3LGoZyyJc+LathfhMr+ItRnEjXYwdJEkcEK0QtVJMR6IKVhOo1iTt+vmmtmz/fqcG1lX7JZY/oBPcTKzjCgOvheJrKRymYzAkr5JdKQDAxMTJrwtZynM6SBYgsTeZIzGBU4uwvyIGWtSXc9iHQLlwTnbEcbhS88QSsrUXmTNNeZahEr1h7WtV4Axi3siMHjsfbEtkBm6nYyVogDfGMfWWKnZBGJqnhpJVoVfnPanIqCO7J5ezjHeZDcVOseHX1wohcMKhaNqXcRYA2jhRzNSUjDT7MLmX1UTzwbOYDth4vK9GpfWTwB6R2lNAwDV1KaQVLrHFwgBr3wjQfn/A3bYfsOlvAAO/cowDAoRwkL4HIkfe9KQvrZg45Ajg1fbrP61hGxIcOMFemz6OjFvMKUkdpPxVxiEIqpmFXJPq4sB5cJSE2f2BnAHQ2c+D+cMYthDKaKSPWdK8F4oh3JWRgrcp9PVOOIGh3Yfc9slTwwyHfW9X5HRIdlWPPARLydv4kPmwhg/MTjpckchILaksBhSOwFAs0/A8MF5gFlZSG4kZ3WQC34wF/K0cECjyrgmO2aGSmOzLL4QPToyWjm5sT0QJ3RhFusm4bBq0ODWY2thjuo2m6rsw+PN6nnM40qHmnM+MMYv7gF15T6JcoQZJeyT/uTfkitDORvpzERpT1Rjq8wFTIqalDjKAGaELt7j10LG/dgwxNymAJTyhYnjhy0oLsjIw8aG8hDl+pON2ajoR1b0SUJwIEoqyJRQoIEzknQzGJxGRMcM3oykQEffBEPSK4VcKNzNGhwBxIfdUk0zsHsV0wi69UcaMUZCwftdABchVMQRGgXsTdNq4UraZv45qu4kvNdJTQsogRLTnD7i1m6Ujf2YV1ryaUx2HrKuzgFJbekk54hqg26aC1VUis6zA4yQcChwGHDOoKMCrSjI6MI9cr4ZQgRGzn++fPCS1ZvGSO1WHyxaFgwRkhOG9iDHmXunrzdM8HrIiImQuh5DHMFesp4DCrgeEKN562Wjkljl8HFSlHu6HRQks5hc2KrDFuWybdZtIIlSQLFoZnTUaueDvxXVxwVla2+fBfli8QrFCQlWfNxWajaKZxAdc+BETU6cy1g68KkOiugB90RiUaQfzRjzOI0AAZtyaLczrBIipmbc7/A5qKkPqd3VrSnwBN4t3tSlWZ+AJqpVkuYs7Bxf5Zis0F0QWly9MQR1FhNo6oP0k8TdbPPIErMSEqwvV3UrVkE9VwTHpSkcNJjERf6Qht1bOVM1kenusraPEA+avwG00UbUs8Hl6rubP51olSRTJvcX9y05Rt6RJW8Ru5wqE0cvuqTYLvyD2Ho0p6bvdIz/NPCMSd2njMyVRaPmccg6IjTRKFy07zisjogV5ohM2eiTjlydZN/YhK2wVJr5vxG712cIxnUR/ZEC7pT4hPTzgR1KpEL9ETf694I1nKtM/PSyjJnFzOl4sycZB+0QGLXaoG6ulPNjxDkXrT9BtkNs4uv72/sKhP9IEueSTO9u2iqi7Pp+Hp0n6PRem4Wa7dctzUkjjT5aLqz23Cur0Oz6Ky5YNL+qNaldi+kFlanpcrkWPHmVN9zKtEvzp3idJALKTpnR8xsK/B+x4WUOsyt+D4NdNJrRmhW9VYDLYuXBufFoVzStC4b/t2tcW0tk0GbF0AYpW1ady/LYMoRi/JBKrzK0u7kAhG6eIGmFlQ3TxVWi4jxtXNR20e8EThrgEZlSRqJzU+vEtqmdJZ5NhAraj0Ue14WsC8xURHEQxidRGWtUb2mNVFdX7n2ipbKy1WkfdLWEHJp+rzPIqwBva32Y/KczuxtfHSHBIL8nWmqljnO2kXiWIP7jp3hzPntfExWdODkbOBKWucR3MX1qAWrUQSc7tDqekP+g0RZLzOKoLl5kTvOt/Gxu1HUs77pIaqzXaflfcGVs5NrSbKvaq3hFPltvXgZVmy56KbahBJq9+sqyo3gXVXkCT24X5v9gWqf8EkLxYMMutj/M04qqwLKoCI1YbxZjUFK902DE0MSzbFGOwxN2PSD9LSr09lUBh+R9XPojeIV1iu6odm5dH0AzmkbNf5fckNbdcWTU2xi18uLS+UsWGFLvigkSUMmumXO4Xr+yHlPXc50hdywUffwHPVpRcznLQ54J7zDbIryZbsE+47GBZ7E7SnrJU+g5lGKgAWCifZnZFrPYh6XGEciZo9gJldXpv+moXamjtPknxHk9NqMPah3faYNC87o0upSwDob3Q/3qtfdKsW3vkvBOMMp06nwTqoc1d/pkmYelIu32If0Ym60VIrpTXtxSMNXfLA5a8ArVe4sJvtQTZTlUnpEi3J19Gp1JKUmMZQh0f21a761CA2q+F7tkjhZNWrUBC09HifvfmPlwCU3qc2fX2voghR73G3OlNJIvff2Dk1WdMrZKXu4rK0f1/MXfimbIYz1BcohORO3L6auqE6m23dYe296/YGye6Mo8vyvwy+C6rKi4/SVDskTqUItUURryd0tY0kubd2cv0wvDutMgs80ebJm9ZxU9LjUS2OxvA4/OWyeONq6No14x6B06SqSTIUanKKiCClvJVyprmK0mSZPgRLE+Y4cpUS0daoyJ+tAF+dzja2NnjutTvykUX+lLDZZ3oby6rhQdsxQYbfv+nUeatYHi/8i2dKplLzee8XO9UlSs/elVKBT1Jt+sPlRP1lXTrvFi63NZ/VWOtbe6V1qqT4IoUqh6Y2wBNlrNisr1LhSubaITW5qmXs16c9sAJs8+YH0ftc76YqKVUp9q1FsGCty8SH/VS2Nq88sSBW07jQ1CFEhFQjotf3Xd7FvTt7rMYreF4M233q4iSxSEtoqb6Gk7P5S90IroPy6VO5ZwYyi9jze9+ihvffIz7M3oUw+pSSQVwcZlkq8LP5OeU1IO3h7rG4Hk3iqzbqicERKbaKj2gqwPQSB4ii5cvaKDQWjJ0DdTNB+iQJSTUzzXCuVq3O8LOQt3TTvJWNbPdIJvvD+K6PgsdeN96li38qlJa3WQoxSF+HubMdgm0aqo66HAvdqh5pd8mkvN0LiBq4XRo8PaS2OgCUkvgtxgjFIECvj4hXNVbY4tNeqF+mM1LOSPgtnm9hZMlfvNogNWUKXQR4xFYQMnmO4qrduKbzVRfrNVrBVVfrW/sUclt/gKr1TwC4F351KiJTZnrY65PZEU2ipKa16KTVxR7wYG+ep24XTWCSxHpKK+hQ6x5Faikk+LGrpqHP/sCoMYAVdEuCd6zeChmVFvOUu5015nP6jHUWsraOrTAf1l7GIfwxKnEqXx9MS8wd9ed+8eg1wOXXdWzmCDJxMSXQDEisgzgxLnLSKINQBdHK/WZ0oewZBXutNn7uTzFbo7GFdrmmow52i+0dp/+7GZt+qaXr7qOZ3dUNaQbDDLvdPnD/x9P1SbYfsihhTUoOz0jS/iJzQ2hksssCHkG7WyQlgyIiwsO35fJ9NpscUwlhC7R9guUGiXuqWjaWy4sZqokISfPB7LdZ+xxi+dbzaDF87pjoGGhwlTmeDdJBQL4a+I/e2++wm6uFcJlzDejI08ptN0j4XJIU8wRJP1gMDdM6OY72/i/+FdM4spnSNF3E9YzU5qh6QIFDZdzn1dfZOj9m50/1fmgaQlXaV5iPrYBbnE3XYIplqoVdrJPeOn+rYlMhrgLheYxex7p00uEYzSVZJfJYppTcE6LTTpwGuwY9DCbbTqPNu07Zs51b365Ka2Xf3nGuym/SH4gQAhYpfUv6o91qtjkSazrYpkXo1KuZy0JVOnfHombfAf1pn6gP0fnNc+B6OvhuM9rGG9go0GVI3UrwBLvnl6JU7KYV4/+u3mdhU4CASE3Xr+9Ki042WqrAKZZ5s91cXnmNsbndQiOQwvAabwangBTKZ9dMt4lySeC1DNbThTKe7lfG0WIli7mJWxEdyagTv4yEu6uA+cvJv6SxLxP5W1gM9GPGRk6UBi9UHHtx4N//ozfz+C8q7nRiseowWMoboN/80HKnBDHUKeMra3WUNlyVhzlCA4p7Yehf/NCIZEfYSwSV/DeV8/lx3FNdr4TvBGu7ky1iV51GzhNOxp8bdXkEetA8RhfeTSg3X1ftZUj1eva01tIgyasIW08nYYzY3D+q6rxMOVcxS6faddV0asax6RXMjZ3J5plQBiC9TzemEAEkhgWcS5A3VKPOs7aLe8kyEx3AcqVK1+GOwWINv+GlpuGxHM0+OTnLFl83I857l7d1jRgeXjRTXjUJ7+aHebXdJS2tlEx2azhGhavYrFCpZiehKEieA2bs7N41e3izFD3Phj7y4q1VgUhq0rUcfz0CkZpxcc52bzEGg85XGmM+ciBRu1w7sva0M2bWtWdNu3tbodmT3PMbmmzLecqXVtdb1LxVaO/zZqnvds1ichYb8FYN+6b1zwWcpnfvJBRG8E1U3umSPFJfT6IpfLMw9mwq8x3GuOK0yqLuHXt/PcFYP4rKmtjJ1U/5FH6u3OPq1jWd+ryL9nKs5kxoXd5Oe4vOYo26qZOwNBd5P+LZJ8hx6rXKW3BoVezWafq6+B1sg8PClPDXJojxeVeofzue8CjII0sLF86lJ85/a33YCv7rP583Msy3JN3wypfcu2ybjtcq+HaS6nFP1N95W3rR4XcO7R67vIdT72czzCXKj561zbn+e6dS2tFY7iKtd2X4syqkJozfYKz2rIU30O/P0TOBp0eL72/NxMO/e88K8H1qN1VfnJPbrKnhdDUw8f9CNR2jns2pZziyI42J4g8ihpZGa5UipGYAmwKqp7fN3wVZrF8IZDcfzZmppotJ+DvySF1xy3VEERdbadznFvZ1F8U1c7ejfnINzVisOornn6lehD5WCvFvtlExd4HH6lqpF8Q1mtCY32dHW9eZxtETlIZxihoqIK8gJ77Kr7XEVMPr5xZTeDrUxfjYNVaCc3cmVCrVaqqbdTxEtSxRVd5zP2+FxBdDcQH7UERYPhXg8fEX5DfJUHL8/1Tyt1MlZeTghfmsqaRef+RBtxolvt8JTjE3LWJoo57Ol5qRisyCxbaBp+YX49jQN0oR43m5dsvQG31LdT3smF9zOvtmDCjPevWI8O33rh1/vph75BNpecdx+yFx/Ch64T/JdubnUZhH2IfgnmgEtWw2FynbGRKetyPksktc79+PdpX9/iC6KmEDvMf14982cRdnuKllP+qmfM55ybpG9o4W3bL8X53I5kaQXlmpqLbV4u8rx1KeaYWvxydsTCiig447b3dl07tG930+3QfU686HfsqY8dmdbkg90Z3g4rpG9r/iv+IZyrZHXUm2Whs630G6vm7vN9yNtHlAlLov/KeZ4WssKMHw71epLI+q1rs47xZYKamHIj+NQtVnV6dzUo1UCT/E6oI7VAL8F2OlE2+m9+FLO+57Ox36LidbVe7LWpjinqWZEoSKAJ2k1PfeUKWqn0l7laQfjSfLRsLZHX54KOHyv4L632D+7oVlDM4b5VLczkvR3XJswiucq3l1DO65atToRkejZHNNWGVcJOdL1p2ml6tJ+LNVCdgO+LWHypqr+z2ZtQjx91Xr6MicTkWdJ6TQAvgX6LS/yU5QhNA3KDh0duvw0KcXrR5Vvb3dp5/cbmuubb++n4qAaqf0o9G3NCNMX5dTgwel8fipu/umf3i1bja39nrdUxpnja3WqirR+VBFOn1ZOLC2IV/2XVmtrY6jgylMTc4p5nhW71Ci0Emq9P9Mb/gx+Q/56X25t6pmdcYDv8C1n5f8N85cm8PJ+lesJpnbpaw5tqwmcVr0q+dThJvi311JvbHvGlt9DwlPCQMMMhupfajJoj97eYC3t7ooYfU0za7lYDP2FhhuE6Fgy9fXnz59/+PEHH9/8fg0xteSv2RDHNNu73NpNaiL89ztzpInn5EvHUk5smX2pvNw+auXjqEmb9kTnM5yPLDH4L54a4UemouDuM61eI/QQGk8qCfjX/XeP9kvtx5uutWyc3K2DNX+857O+ryZNilPbof0N4wv/tC+eb1mv41kfqL4fnZvGRt/ewLNJ6lV/43keMv/953/5+P6uB/BfPl7//pL/7Pf58eMX/vuHvvM8P/79I8//28f/9jPtWf4W8V8f//x//Dgfkn//Hw=="
const MOON_TINT_Z = "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"
let CLOUD_Q = null, MOON_MAP = null
function cloudSample(lo, la) {                         // cloud density 0..1 at a longitude/latitude (degrees), bilinear on the 0.5 degree grid
  if (!CLOUD_Q) {
    const Z = inflateRaw(b64bytes(CLOUD_Z), 129600), q = new Uint8Array(259200)
    for (let i = 0; i < 129600; i++) { q[2 * i] = Z[i] >> 4; q[2 * i + 1] = Z[i] & 15 }
    CLOUD_Q = q
  }
  const fx = ((((lo + 180) * 2) % 720) + 720) % 720 - 0.5, fy = clamp((90 - la) * 2 - 0.5, 0, 358.999), x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, q = CLOUD_Q
  const a = q[y0 * 720 + ((x0 + 720) % 720)], b = q[y0 * 720 + ((x0 + 1) % 720)], c = q[(y0 + 1) * 720 + ((x0 + 720) % 720)], d = q[(y0 + 1) * 720 + ((x0 + 1) % 720)]
  return ((a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty) / 7
}
const MS = new Float64Array(2)                          // moonTex result: [albedo 0.44..0.94, tint -0.02..0.065]
function moonTex(lo, la) {
  if (!MOON_MAP) {
    const L = inflateRaw(b64bytes(MOON_LUM_Z), 64800), Tz = inflateRaw(b64bytes(MOON_TINT_Z), 8100), T = new Uint8Array(16200)
    for (let i = 0; i < 8100; i++) { T[2 * i] = Tz[i] >> 4; T[2 * i + 1] = Tz[i] & 15 }
    MOON_MAP = { L, T }
  }
  const L = MOON_MAP.L, T = MOON_MAP.T
  const fx = ((((lo + 180)) % 360) + 360) % 360 - 0.5, fy = clamp(90 - la - 0.5, 0, 178.999), x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0
  const xa = (x0 + 360) % 360, xb = (x0 + 1) % 360
  const l = ((L[y0 * 360 + xa] * (1 - tx) + L[y0 * 360 + xb] * tx) * (1 - ty) + (L[(y0 + 1) * 360 + xa] * (1 - tx) + L[(y0 + 1) * 360 + xb] * tx) * ty) / 31
  const gx = ((((lo + 180) / 2) % 180) + 180) % 180 - 0.5, gy = clamp((90 - la) / 2 - 0.5, 0, 88.999), u0 = Math.floor(gx), v0 = Math.floor(gy), ux = gx - u0, uy = gy - v0
  const ua = (u0 + 180) % 180, ub = (u0 + 1) % 180
  const t = ((T[v0 * 180 + ua] * (1 - ux) + T[v0 * 180 + ub] * ux) * (1 - uy) + (T[(v0 + 1) * 180 + ua] * (1 - ux) + T[(v0 + 1) * 180 + ub] * ux) * uy) / 15
  MS[0] = 0.44 + 0.5 * l; MS[1] = -0.02 + 0.085 * t
}
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

// ---- Earth: NASA Blue Marble colours and relief, shelf depth, Black Marble city lights, seasonal sea ice, weather-like clouds, sun glint, atmosphere, aurora ----
const EARTH_WAT = [[6, 20, 64], [9, 30, 88], [13, 44, 108], [20, 68, 130], [32, 96, 152]]      // ocean colour by depth class (deep ... shallow shelf)
let EARTH_DATA = null
function earthData() {
  if (EARTH_DATA) return EARTH_DATA
  const T = inflateRaw(b64bytes(EARTH_TERR_Z), 259200), Eq = inflateRaw(b64bytes(EARTH_ELEV_Z), 64800), Lq = inflateRaw(b64bytes(EARTH_LGT_Z), 129600)
  const pal = []
  for (let i = 0; i < 15; i++) {
    const c = [0, 1, 2].map((q) => parseInt(EARTH_PAL.substr(i * 6 + q * 2, 2), 16)), l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]
    pal.push(c.map((v) => 255 * Math.pow(clamp((l + (v - l) * (i === 14 ? 1 : 1.5)) / 255, 0, 1), i === 14 ? 1 : 0.76)))    // a little vibrance: the Oct-2004 composite is drab
  }
  const elev = new Float32Array(64800); for (let i = 0; i < 64800; i++) elev[i] = Math.pow(Eq[i] / 15, 2) * 7200
  const lut = new Float32Array(16); for (let q = 1; q < 16; q++) lut[q] = Math.pow(10, -3.7 + ((q - 1) * 3.6) / 14)
  const lg = new Float32Array(259200); for (let i = 0; i < 129600; i++) { lg[2 * i] = lut[Lq[i] >> 4]; lg[2 * i + 1] = lut[Lq[i] & 15] }
  return (EARTH_DATA = { T, pal, elev, lg })
}
const ES = new Float64Array(12)           // sampleEarth result: [land weight, land rgb(1-3), water rgb(4-6), elevation m(7), lights(8)]
function sampleEarth(lo, la, wantLights) {
  const D = earthData(), T = D.T, fx = ((((lo + 180) * 2) % 720) + 720) % 720 - 0.5, fy = clamp((90 - la) * 2 - 0.5, 0, 358.999), x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0
  let wl = 0, lr = 0, lg = 0, lb = 0, ww = 0, wr = 0, wg = 0, wb = 0, ll = 0
  for (let q = 0; q < 4; q++) {
    const w = (q & 1 ? tx : 1 - tx) * (q >> 1 ? ty : 1 - ty), idx = Math.min(359, y0 + (q >> 1)) * 720 + ((x0 + (q & 1) + 720) % 720), cls = T[idx]
    if (cls >= 5) { const c = D.pal[cls - 5]; wl += w; lr += c[0] * w; lg += c[1] * w; lb += c[2] * w } else { const c = EARTH_WAT[cls]; ww += w; wr += c[0] * w; wg += c[1] * w; wb += c[2] * w }
    if (wantLights) ll += D.lg[idx] * w
  }
  ES[0] = wl
  if (wl > 1e-4) { ES[1] = lr / wl; ES[2] = lg / wl; ES[3] = lb / wl } else { ES[1] = 60; ES[2] = 70; ES[3] = 40 }
  if (ww > 1e-4) { ES[4] = wr / ww; ES[5] = wg / ww; ES[6] = wb / ww } else { ES[4] = 8; ES[5] = 24; ES[6] = 72 }
  const ex = ((((lo + 180) % 360) + 360) % 360) - 0.5, ey = clamp(90 - la - 0.5, 0, 178.999), ix = Math.floor(ex), iy = Math.floor(ey), ux = ex - ix, uy = ey - iy, E = D.elev
  const e00 = E[iy * 360 + ((ix + 360) % 360)], e10 = E[iy * 360 + ((ix + 361) % 360)], e01 = E[(iy + 1) * 360 + ((ix + 360) % 360)], e11 = E[(iy + 1) * 360 + ((ix + 361) % 360)]
  ES[7] = (e00 * (1 - ux) + e10 * ux) * (1 - uy) + (e01 * (1 - ux) + e11 * ux) * uy
  ES[8] = ll
}
// sun: declination, equation of time and the sub-solar longitude (NOAA fit), so day and night sit where they really do
function solarPos(tMs) {
  const d = new Date(tMs), days = (tMs - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000, g = (2 * Math.PI / 365) * (days - 0.5), utcH = (days % 1) * 24
  const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g))
  const dec = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g)
  return { dec: dec / d2r, lon: 15 * (12 - utcH) - eot / 4 }
}
// sea ice follows the season: Arctic is largest in March and smallest in September, Antarctic the other way round (edge latitude per 30 degrees of longitude)
const ICE_N_MAX = [62, 70, 72, 62, 52, 66, 74, 76, 74, 75, 73, 55, 62], ICE_N_MIN = 81, ICE_S_MAX = [-63, -65, -66, -62, -58, -56, -55, -56, -59, -60, -62, -62, -63], ICE_S_MIN = [-73, -74, -74, -72, -70, -70, -71, -72, -74, -74, -74, -74, -73]
const SEA_S = (() => { const d = new Date(now), doy = (now.getTime() - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000; return 0.5 - 0.5 * Math.cos((2 * Math.PI * (doy - 258)) / 365) })()
function iceTab(t, lo) { const u = (lo + 180) / 30, i = Math.floor(u) % 12, f = u - Math.floor(u); return t[i] * (1 - f) + t[i + 1] * f }
// clouds: the real NASA cloud-cover grid (see CLOUD_Z), drifting slowly east, with fine procedural breakup on top so edges and thin veils are not grid-blocky.
// bias is kept for the old call sites and ignored: the real map already has the dry deserts and wet rainforests in it.
function cloudAt(b, la, lo, drift, full, bias) {
  const v = cloudSample(lo + drift / d2r, la)
  if (!full) return sstep(0.02, 0.4, v)
  const cs = Math.cos(drift), sn = Math.sin(drift), cx = b[0] * cs + b[2] * sn, cz = -b[0] * sn + b[2] * cs
  const n1 = fbm3(cx * 24 + 4, b[1] * 24, cz * 24 + 1, 3), n2 = vnoise3(cx * 70 + 7, b[1] * 70, cz * 70)
  const w = v * (0.78 + 0.44 * n1) + (v > 0.02 ? (n2 - 0.5) * 0.06 : 0)
  return clamp(sstep(0.02, 0.4, w), 0, 1)
}
const MAGN = [Math.sin((-72.6 - 103.82) * d2r) * Math.cos(80.4 * d2r), -Math.sin(80.4 * d2r), Math.cos((-72.6 - 103.82) * d2r) * Math.cos(80.4 * d2r)]     // geomagnetic dipole axis (north pole at ~80N 73W; the south one is its mirror, near 80S 107E)
function earthSurface(R, s, f, o) {
  const N = surfN(R, s, "earth"), c0 = N / 2, k = R * s, NN = N * N
  const sr = new Float32Array(NN), sg = new Float32Array(NN), sb = new Float32Array(NN), om = new Float32Array(NN), cld = new Float32Array(NN), shd = new Float32Array(NN), ht = new Float32Array(NN), lit = new Float32Array(NN), inside = new Uint8Array(NN)
  const Sb = viewToBody(LIGHT, o), drift = Math.floor(now.getTime() / 600000) * 0.0025
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (i + 0.5 - c0) / k, y = (j + 0.5 - c0) / k, rr2 = x * x + y * y
    if (rr2 > 1.06) continue
    const p = j * N + i, z = Math.sqrt(Math.max(0, 1 - rr2)), b = viewToBody([x, y, z], o)
    const la = -Math.asin(clamp(b[1], -1, 1)) / d2r, lo = 103.82 + Math.atan2(b[0], b[2]) / d2r, al = Math.abs(la)
    sampleEarth(lo, la, EFFECTS && rr2 < 1)
    const wl = ES[0], cn = fbm3(b[0] * 26 + 3, b[1] * 26, b[2] * 26 + 1, 3) - 0.5
    const land = sstep(0.36, 0.64, wl + cn * 0.36)
    const mt = fbm3(b[0] * 9 + 2, b[1] * 9, b[2] * 9, 3), mt2 = vnoise3(b[0] * 30, b[1] * 30 + 3, b[2] * 30)
    const e = ES[7]
    let col = [0, 0, 0], wet = 0
    if (land > 0.01) {
      let lc = [ES[1], ES[2], ES[3]]
      const lum = 0.3 * lc[0] + 0.59 * lc[1] + 0.11 * lc[2], isIce = lc[0] + lc[1] + lc[2] > 650
      if (!isIce) {
        if (lc[0] > lc[1] + 16) lc = [lc[0] * 1.07, lc[1] * 0.99, lc[2] * 0.9]                  // warm desert reds (Australia, Arabia)
        lc = mix3(lc, [150, 128, 106], sstep(1800, 4600, e) * 0.3)                                 // bare rock on the high ground
        lc = mix3(lc, [236, 240, 246], sstep(5300, 6700, e) * sstep(0.42, 0.7, mt2) * 0.85)           // thin snow only on the very highest ranges
        wet = clamp((lc[1] - lc[0] + 4) / 14, 0, 1) * clamp((95 - lum) / 40, 0, 1) - clamp((lc[0] - lc[1] - 14) / 14, 0, 1) * clamp((lum - 90) / 40, 0, 1)
      }
      const g = isIce ? 0.97 + 0.03 * mt + 0.03 * mt2 : 0.8 + 0.26 * mt + 0.16 * mt2
      col = [lc[0] * g, lc[1] * g, lc[2] * g]
      ht[p] = land * (0.0025 * mt + 0.0145 * Math.sqrt(e / 7000) + (isIce ? 0 : 0.0016 * mt2 * clamp(e / 500, 0, 1)))
    }
    let oc = [0, 0, 0], ice = 0
    if (land < 0.99) {
      const dpn = 0.9 + 0.2 * fbm3(b[0] * 4 + 1, b[1] * 4, b[2] * 4, 2)
      oc = [ES[4] * dpn, ES[5] * dpn, ES[6] * dpn]
      if (al > 48) {                                                                               // seasonal sea ice with a ragged, mottled edge
        const nN = fbm3(b[0] * 7 + 5, b[1] * 7, b[2] * 7, 3), nm = fbm3(b[0] * 36 + 9, b[1] * 36, b[2] * 36, 3)
        let edge
        if (la > 0) edge = ICE_N_MIN + (iceTab(ICE_N_MAX, lo) - ICE_N_MIN) * SEA_S
        else { const mn = iceTab(ICE_S_MIN, lo); edge = mn + (iceTab(ICE_S_MAX, lo) - mn) * (1 - SEA_S) }
        ice = sstep(0, 1, (la > 0 ? (la - edge) : (edge - la)) / 2.2 + (nN - 0.5) * 3.2) * (0.72 + 0.4 * nm)
        if (la > 50 && la < 66 && lo > -100 && lo < -76) ice = Math.max(ice, sstep(0.45, 0.8, SEA_S) * sstep(0.3, 0.55, nN) * 0.95)     // Hudson Bay freezes over in winter
        ice = clamp(ice, 0, 1)
        oc = mix3(oc, [228, 237, 247], ice * 0.93)
      }
      om[p] = (1 - land) * (1 - ice)
    }
    sr[p] = col[0] * land + oc[0] * (1 - land); sg[p] = col[1] * land + oc[1] * (1 - land); sb[p] = col[2] * land + oc[2] * (1 - land)
    lit[p] = ES[8] * (land + 0.35 * (1 - land))
    cld[p] = cloudAt(b, la, lo, drift, true, -0.1 * wet * land)
    const geo = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]
    if (geo > 0.05) { const q = norm3([b[0] + 0.03 * Sb[0], b[1] + 0.03 * Sb[1], b[2] + 0.03 * Sb[2]]); shd[p] = cloudAt(q, la, lo, drift, false, -0.1 * wet * land) }
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
      const r1 = Math.max(rr, 1), h = r1 - 1
      // 1) the thin blue shell of air: bright toward the Sun, with a faint airglow rim left past the dark limb; a warm sliver where the limb crosses the terminator
      const a1 = Math.exp(-h / 0.03) * (0.06 + 0.74 * lo) * (1 - edge)
      let c1 = mix3(mix3([46, 92, 210], [80, 140, 255], lo), [170, 210, 255], Math.exp(-h / 0.01) * (0.25 + 0.75 * lo))
      c1 = mix3(c1, [255, 160, 110], 0.32 * Math.exp(-Math.pow(el / 0.16, 2)) * lo)
      // 2) camera glare: a faint wide halo around the lit limb that fades out before the edge of the image
      const a2 = 0.1 * Math.exp(-h / 0.1) * (1 - sstep(0.55 * pad, pad, h)) * sstep(-0.15, 0.75, el + 0.5 * Math.max(0, LIGHT[2])) * (1 - edge)
      aa = a1 + a2 * (1 - a1)
      ac = aa > 1e-5 ? mix3(c1, [150, 190, 255], a2 * (1 - a1) / aa) : c1
    }
    let dc = [0, 0, 0]
    if (edge > 0) {
      const z = Math.sqrt(Math.max(0, 1 - rr * rr))
      const geo = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2], ndl = bumpNdl(ht, N, p, k, x, y, z, rr, 0.45)
      const day = sstep(-0.05, 0.22, geo), lam = Math.pow(clamp(ndl, 0, 1), 0.72), night = 1 - day
      const ca = clamp(cld[p] * 1.08, 0, 0.97), tw = Math.exp(-Math.pow((geo - 0.03) / 0.1, 2))
      const sh = 1 - 0.5 * shd[p] * (1 - ca), dl = lam * day * sh * 1.12
      const imu = 1 / Math.max(geo, 0.03) - 1, T0 = Math.exp(-0.010 * imu), T1 = Math.exp(-0.030 * imu), T2 = Math.exp(-0.080 * imu)    // sunlight through the long slant of air near the terminator loses blue first: yellow, orange, then red
      let sl = [sr[p] * dl * T0 + sr[p] * 0.045 * night + 1.0 * night, sg[p] * dl * T1 + sg[p] * 0.07 * night + 2.0 * night, sb[p] * dl * T2 + sb[p] * 0.15 * night + 5.0 * night]     // the night side keeps a faint moonlit blue
      const nh = Math.max(0, x * HV[0] + y * HV[1] + z * HV[2]), oceanM = om[p] * day * (1 - 0.92 * ca)
      const spec = Math.pow(nh, 90) * 0.55 + Math.pow(nh, 22) * 0.1
      sl = [sl[0] + 255 * spec * oceanM, sl[1] + 246 * spec * oceanM, sl[2] + 226 * spec * oceanM]
      const fr = Math.pow(1 - z, 4) * 0.55 * om[p] * day
      sl = mix3(sl, [118, 168, 238], fr * 0.8)
      const tw2 = Math.exp(-Math.pow((geo - 0.03) / 0.1, 2)), cl = 0.045 + 0.955 * day * Math.pow(clamp(geo + 0.06, 0, 1.05), 0.6)
      const cc = [252 * cl * Math.pow(T0, 0.7), 252 * cl * Math.pow(T1, 0.7), 255 * cl * Math.pow(T2, 0.7)]
      dc = mix3(sl, cc, ca)
      const sunset = Math.exp(-Math.pow((geo + 0.03) / 0.04, 2))                       // just past the terminator the high cloud tops still catch the setting Sun
      dc[0] += 16 * ca * night + 22 * ca * ca * sunset; dc[1] += 24 * ca * night + 9 * ca * ca * sunset; dc[2] += 46 * ca * night + 3 * ca * ca * sunset
      {                                                                             // Rayleigh haze: the nearer the limb, the more air we look through, so blue light scattered toward us takes over
        const sun = sstep(-0.22, 0.35, geo), pl = 1 / Math.max(z, 0.12), scat = 1 - Math.exp(-0.3 * (pl - 1))
        dc = mix3(dc, mix3([80, 138, 255], [150, 195, 255], sstep(0.2, 0.7, scat)), clamp(0.8 * scat * sun, 0, 0.85))
        dc = mix3(dc, [14, 28, 78], 0.5 * scat * (1 - sun))                           // on the night side the limb keeps a faint blue edge
      }
      if (DRIFT_MS || DRIFT_W > 0) {
        const dw = sstep(-0.05, 0.4, geo)
        if (DRIFT_MS) {                                  // the Moon's shadow, only where the Moon really stands between this spot and the Sun
          const M = DRIFT_MS.M, wx = x - M[0], wy = y - M[1], wz = z - M[2], S = DRIFT_MS.S, t = wx * S[0] + wy * S[1] + wz * S[2]
          if (t < 0) {
            const qx = wx - t * S[0], qy = wy - t * S[1], qz = wz - t * S[2], q = Math.sqrt(qx * qx + qy * qy + qz * qz), rm = DRIFT_MS.rm, dd = -t
            const ms = (1 - sstep(rm * 0.25, rm * (1 + 0.5 * dd), q)) * 0.62 * Math.exp(-dd * 0.12)
            const k = 1 - ms * dw; dc = [dc[0] * k, dc[1] * k, dc[2] * k]
          }
        }
        if (DRIFT_W > 0) {                               // nearer the Sun: warmer, brighter light and a golden rim on the lit limb
          const g = 1 + 0.3 * DRIFT_W * dw, rim = Math.pow(1 - z, 2.4) * sstep(-0.1, 0.5, geo) * DRIFT_W * 0.9
          dc = [dc[0] * g + 255 * rim * 0.9, dc[1] * g * (1 - 0.1 * DRIFT_W * dw) + 150 * rim * 0.9, dc[2] * g * (1 - 0.32 * DRIFT_W * dw) + 60 * rim * 0.9]
        }
      }
      if (nlight && night > 0.2 && z > 0.08) {
        const bb = viewToBody([x, y, z], o)
        const nl = sstep(0.03, -0.2, geo) * (1 - 0.85 * ca)          // lights fade toward the terminator, vanish on the day side, and hide under cloud
        const Dl = lit[p]
        if (nl > 0.01 && Dl > 1.5e-4 && om[p] < 0.98) {
          const F = k * 1.25, f1 = vnoise3(bb[0] * F + 1, bb[1] * F, bb[2] * F + 3), f2 = vnoise3(bb[0] * F * 0.43 + 5, bb[1] * F * 0.43, bb[2] * F * 0.43 + 2)
          const f3 = vnoise3(bb[0] * 22 + 9, bb[1] * 22, bb[2] * 22 + 4), Dm = Math.min(Math.sqrt(Dl) * 1.5, 1.3)
          const thr = 0.97 - 0.42 * Math.pow(Dm, 0.7), pt = sstep(thr, thr + 0.05, f1 * 0.62 + f2 * 0.18 + f3 * 0.2)
          let L = pt * (0.25 + 0.5 * Dm) * (0.6 + 0.8 * f2) + 0.16 * Math.pow(Dm, 1.7) * (0.55 + 0.9 * f3)
          L = Math.min(L * nl * CITY_GAIN, 1.15)
          const q = Math.min(L, 1)
          dc = [dc[0] + 255 * L, dc[1] + (170 + 60 * q) * L, dc[2] + (80 + 110 * q * q) * L]
        }
        const dN = bb[0] * MAGN[0] + bb[1] * MAGN[1] + bb[2] * MAGN[2], th1 = Math.acos(clamp(dN, -1, 1)) / d2r, th2 = Math.acos(clamp(-dN, -1, 1)) / d2r, tm = Math.min(th1, th2)
        if (tm < 36 && tm > 8) {                              // auroral ovals sit around the magnetic poles, patchy and faint
          const pa = fbm3(bb[0] * 5 + 3, bb[1] * 5, bb[2] * 5, 3), st = vnoise3(bb[0] * 30 + 1, bb[1] * 30, bb[2] * 30)
          const au = Math.exp(-Math.pow((tm - 21 + (pa - 0.5) * 3) / 3.4, 2)) * (0.1 + 1.2 * sstep(0.4, 0.68, pa)) * (0.65 + 0.7 * st) * night * night * (MODE === "earthmoon" ? 0.2 : 0.4)
          const pu = fbm3(bb[0] * 3 + 8, bb[1] * 9, bb[2] * 3, 2)
          dc = [dc[0] + (50 + 90 * pu) * au, dc[1] + (255 - 90 * pu) * au, dc[2] + (110 + 70 * pu) * au]
        }
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
  const W = MODE === "earthmoon" ? [[1, 255, 244, 196], [0.72, 255, 216, 108], [0.45, 255, 170, 56], [0.2, 244, 112, 26], [0, 190, 58, 8]] : [[1, 255, 250, 222], [0.72, 255, 232, 150], [0.45, 255, 196, 82], [0.2, 255, 148, 40], [0, 214, 84, 16]]
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
    const lane = 1 - sstep(0.0, 0.42, d2 - d1), gran = 1 - (MODE === "earthmoon" ? 0.07 : 0.075) * lane + (MODE === "earthmoon" ? 0.1 : 0.06) * (cb - 0.5) + 0.03 * (vnoise3(x * 90, y * 90, z * 90 + 4) - 0.5)
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
  pluto: [],
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
let FLARE_K = 1
const dotf = (c, x, y, r, h, a) => dot(c, x, y, r, h, a * FLARE_K)
function sunFlares(ctx, cx, cy, R) {                                          // heat flares: soft glowing loops and plumes rising off the limb (new ones every ~10 minutes), drawn behind the disc
  const r = rng(Math.floor(now.getTime() / 600000) * 7919 + 17), n = 3
  for (let i = 0; i < n; i++) {                                                // loops
    const th = r() * Math.PI * 2, span = 0.12 + r() * 0.1, h = 0.08 + r() * 0.1, m = 40
    for (let j = 0; j <= m; j++) {
      const t = j / m, a = th - span + 2 * span * t, rad = R * (1 + h * Math.pow(Math.sin(Math.PI * t), 0.8)) * (0.996 + 0.008 * r())
      const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad, w = R * (0.022 + 0.02 * Math.sin(Math.PI * t)) * (0.8 + 0.4 * r())
      dotf(ctx, x, y, w * 4, "#FF6A28", 0.013); dotf(ctx, x, y, w * 2.2, "#FF8A38", 0.03); dotf(ctx, x, y, w * 1.1, "#FFAA60", 0.05); dotf(ctx, x, y, w * 0.5, "#FFD59A", 0.06)
    }
  }
  for (let i = 0; i < 2; i++) {                                                // plumes: a cloud of hot gas drifting out and fading
    const th = r() * Math.PI * 2, len = R * (0.35 + r() * 0.35), m = 18
    for (let j = 0; j <= m; j++) {
      const t = j / m, d = R * 0.98 + len * t, wob = (r() - 0.5) * R * 0.06
      const x = cx + Math.cos(th) * d - Math.sin(th) * wob, y = cy + Math.sin(th) * d + Math.cos(th) * wob
      const w = R * (0.1 + 0.16 * t), f = 1 - t
      dotf(ctx, x, y, w * 2.2, "#FF6A28", 0.02 * f); dotf(ctx, x, y, w, "#FF9440", 0.045 * f); dotf(ctx, x, y, w * 0.45, "#FFC070", 0.06 * f)
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

// ======================= EARTH + MOON =======================
// Only Earth and the Moon are drawn. The Sun is off-screen, to the upper right, and only decides the light:
// Earth's day/night terminator, the Moon's phase and the eclipse shadows are real Sun-Earth-Moon geometry (scene units: Earth radii, x right, y down, z toward you).
// The Moon laps Earth once per CYCLE_DAYS (the real 27.3-day sidereal orbit compressed to one week), so its phase is continuous across the weekly reset.
const T_HRS = CYCLE_DAYS * 24
const unit3v = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l] }
function orientFrom(By, Bz) {                              // body axes in view coordinates (y = south pole, z = lon 0 / lat 0) -> the {lon, tilt, roll} the surface shaders take
  const t = -Math.asin(clamp(By[2], -1, 1)), r = Math.atan2(-By[0], By[1]), ct = Math.cos(t)
  const x1 = Bz[0] * Math.cos(r) + Bz[1] * Math.sin(r)
  return { lon: Math.atan2(-x1, Bz[2] / ct), tilt: t, roll: r }
}
function sunDecl(tMs) { return solarPos(tMs).dec }          // solar declination in degrees for the date
function driftFace(ctx, W, H, kind, key, file, N, size, cx, cy, make) {
  const path = fm.joinPath(fm.documentsDirectory(), file), kp = path + ".key"
  let img = null
  try { if (fm.fileExists(path) && fm.fileExists(kp) && fm.readString(kp) === key) img = fm.readImage(path) } catch (err) { img = null }   // a missing or damaged cache file just means re-draw
  if (!img) {
    const t0 = DEBUG_TIMING ? performance.now() : 0
    try { img = make() } catch (err) { console.log("surface failed: " + err); return }                                                       // if a surface cannot be made, leave the wallpaper showing instead of an error card
    if (DEBUG_TIMING) console.log("SURFMS " + kind + " " + (performance.now() - t0).toFixed(0))
    try { fm.writeImage(path, img); fm.writeString(kp, key) } catch (err) {}
  }
  ctx.drawImageInRect(img, new Rect(cx - size / 2, cy - size / 2, size, size))
}
const EM_SUN = unit3v([0.95, -0.3, -0.04])                 // where the (off-screen) Sun is: to the right and a little above, so Earth is half lit and half night
function drawDrift(ctx, W, H, family, u) {
  const med = family === "medium", sc = Device.screenScale()
  const slot = Math.floor(now.getTime() / 600000), tms = slot * 600000            // the scene is re-posed every 10 minutes
  const hrs = ((tms - prevReset.getTime()) / 3600000 % T_HRS + T_HRS) % T_HRS
  DRIFT_W = 0
  // layout (screen points): Earth is big, the Moon laps it; sizes are constant, the Moon is 0.2727 of Earth (real 3475 : 12742 km)
  const Re = (med ? 48 : 35) * u, rm = 0.2727, orb = med ? 1.9 : 1.8
  const ex = W / 2, ey = H / 2                       // Earth is dead centre of the widget; the Moon's orbit is centred on it
  const Se = EM_SUN
  const L0 = [-0.2, -0.8, 0.55], dl = dot3(L0, Se), Ln = unit3v([L0[0] - dl * Se[0], L0[1] - dl * Se[1], L0[2] - dl * Se[2]])   // ecliptic north, perpendicular to the Sun line
  const Qe = cross3(Se, Ln)                          // ecliptic east at the Sun: the direction the Sun and Moon move, counter-clockwise seen from north (the screen axes are left-handed, so it is Se x Ln, not Ln x Se)
  const inc = 5.1 * d2r, Qm = [0, 1, 2].map((i) => Qe[i] * Math.cos(inc) + Ln[i] * Math.sin(inc))       // Moon's orbit is inclined 5.1 degrees
  const phi = 0.9 + 2 * Math.PI * hrs / T_HRS, cp = Math.cos(phi), sp = Math.sin(phi)
  const M = [0, 1, 2].map((i) => orb * (cp * Se[i] + sp * Qm[i]))                                      // phi = 0 is new moon (Moon toward the Sun), pi is full
  const Lm = unit3v([Se[0] * 60 - M[0], Se[1] * 60 - M[1], Se[2] * 60 - M[2]])                           // the Sun is far away: its direction at the Moon is the same
  const mx = ex + M[0] * Re, my = ey + M[1] * Re
  // orientations: Moon is tidally locked (near side toward Earth, pole along the orbit normal); Earth turns west to east, tilted 23.44 deg from the ecliptic normal
  const Mn = unit3v(cross3(Qm, Se)), dE = unit3v([-M[0], -M[1], -M[2]])
  const MBy = [-Mn[0], -Mn[1], -Mn[2]]
  // libration: the Moon's near side is not fixed. Over one lap it nods in longitude (about 7.5 deg, from its eccentric orbit) and in latitude (about 6.7 deg, from its tilted axis), so the sub-Earth point wanders around (0, 0).
  const psi = 2 * Math.PI * hrs / T_HRS, libL = (6.29 * Math.sin(psi + 0.7) + 1.27 * Math.sin(2 * psi + 1.9)) * d2r, libB = (6.7 * Math.sin(psi + 2.1) + 0.4 * Math.sin(2 * psi)) * d2r
  const cb = Math.cos(libB), sb = Math.sin(libB), cL = Math.cos(libL), sL = Math.sin(libL)
  const MBy1 = unit3v([0, 1, 2].map((i) => cb * MBy[i] - sb * dE[i])), MBz1 = unit3v([0, 1, 2].map((i) => cb * dE[i] + sb * MBy[i])), MBx1 = cross3(MBy1, MBz1)
  const moonO = orientFrom(MBy1, unit3v([0, 1, 2].map((i) => cL * MBz1[i] - sL * MBx1[i])))
  const kE = (1 + cp) / 2                                                         // how much of Earth the Moon sees lit: full when the Moon is between us and the Sun
  const dec = sunDecl(tms), eps = 23.44 * d2r
  const kap = clamp(Math.sin(dec * d2r) / Math.sin(eps), -1, 1), sig = sunDecl(tms + 86400000) > dec ? 1 : -1
  const Np = unit3v([0, 1, 2].map((i) => Math.cos(eps) * Ln[i] + Math.sin(eps) * (kap * Se[i] + sig * Math.sqrt(1 - kap * kap) * Qe[i])))
  const lamS = solarPos(tms).lon   // sub-solar longitude (E), with the equation of time: the Sun moves west across the surface as Earth turns east
  const aS = (lamS - 103.82) * d2r, EBy = [-Np[0], -Np[1], -Np[2]]
  const eh = unit3v([0, 1, 2].map((i) => Se[i] - dot3(Se, EBy) * EBy[i])), kk = cross3(EBy, eh)
  const EBz = [0, 1, 2].map((i) => eh[i] * Math.cos(aS) - kk[i] * Math.sin(aS)), earthO = orientFrom(EBy, EBz)
  const drawEarth = () => {
    LIGHT = Se
    DRIFT_MS = EFFECT_ECLIPSE ? { M, rm, S: Se } : null     // the Moon's shadow on Earth (solar eclipse), off unless EFFECT_ECLIPSE
    const ss = EARTH_SS, Rt = Re * 1.08, N = surfN(Rt, sc * ss, "earth"), size = N / (sc * ss) * (Re / Rt)
    const key = `em5-e-${N}-${slot}-${Math.round(M[0] * 20)}_${Math.round(M[1] * 20)}_${Math.round(M[2] * 20)}`
    driftFace(ctx, W, H, "earth", key, "grok-em-earth.png", N, size, ex, ey, () => earthSurface(Rt, sc * ss, 0.6, earthO).img)
    DRIFT_MS = null
    if (SG_GLOW) {                                                       // Singapore marker: a tiny hot white core in a soft reddish halo, round, no spikes; only on the visible hemisphere
      const la = 1.35 * d2r, v = bodyToView([0, -Math.sin(la), Math.cos(la)], earthO), vis = sstep(0.1, 0.5, v[2])
      if (vis > 0.01) {
        const day = sstep(-0.1, 0.25, dot3(v, Se)), k = vis * (1 - day)   // a city light: only on the night side
        const gx = ex + v[0] * Re, gy = ey + v[1] * Re, sq = 0.45 + 0.55 * v[2]    // the halo is squashed a little toward the limb
        for (let i = 0; i < 9; i++) {
          const f = 1 - i / 9, r = 3.0 * u * f * f * 0.9 + 0.5 * u
          ctx.setFillColor(col("#ff4a3c", 0.04 * k))
          ctx.fillEllipse(new Rect(gx - r * sq, gy - r, r * 2 * sq, r * 2))
        }
        dot(ctx, gx, gy, 1.15 * u, "#ff9a86", 0.35 * k)
        dot(ctx, gx, gy, 0.55 * u, "#ffffff", 0.95 * k)
      }
    }
  }
  const drawMoonBody = () => {
    LIGHT = Lm
    DRIFT_ECL = EFFECT_ECLIPSE ? { E: [-M[0] / rm, -M[1] / rm, -M[2] / rm], S: Se, Re: 1 / rm } : null   // Earth's shadow on the Moon (lunar eclipse, red tint), off unless EFFECT_ECLIPSE
    const ss = 2, Rt = rm * Re * 1.08, N = Math.ceil(2 * Rt * sc * ss) + 2, size = N / (sc * ss) * (Re / (Re * 1.08))
    const key = `em5-m-${N}-${slot}-${Math.round(Lm[0] * 50)}_${Math.round(Lm[1] * 50)}_${Math.round(Lm[2] * 50)}`
    driftFace(ctx, W, H, "moon", key, "grok-em-moon.png", N, size, mx, my, () => moonSurface(Rt, sc * ss, clamp((1 + Lm[2]) / 2, 0.02, 1), "#CFC6B8", moonO, { tex: true, es: { k: kE, d: dE } }).img)
    DRIFT_ECL = null
  }
  if (M[2] < 0) { drawMoonBody(); drawEarth() } else { drawEarth(); drawMoonBody() }
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
const STAR_NAMES = ["Proxima Centauri", "Sirius", "Rigel", "Antares", "Betelgeuse", "Eta Carinae", "R136a1"]   // day 1..7 (names only, nothing is drawn on screen)
// [colour, size, spike length, gain]: real star colours from their temperatures
const DAY_STARS = [
  ["#FF5A36", 0.85, 3.0, 0.72],   // Proxima Centauri: M5.5 red dwarf, ~3,050 K: dim deep red, the smallest
  ["#CFE0FF", 1.45, 4.2, 1],      // Sirius: A1, ~9,900 K: brilliant blue-white
  ["#B3C9FF", 1.6, 4.6, 1],       // Rigel: B8 supergiant, ~12,000 K: blue-white
  ["#FF7A4A", 1.75, 5.0, 1],      // Antares: M1.5 supergiant, ~3,600 K: orange-red
  ["#FFA86A", 1.85, 5.2, 1],      // Betelgeuse: M2 supergiant, ~3,500 K: red-orange
  ["#FFF0C4", 1.9, 5.6, 1],       // Eta Carinae: yellow-white, hot and unstable, wrapped in a faint nebula
  ["#9CBBFF", 2.6, 9.0, 1]        // R136a1: most massive known star, ~46,000 K: the most intense blue-white, the biggest
]
// The 7 day-stars zig-zag across the widget, alternating the top and bottom band from left to right (a loose, jittered path of the week, clear of Earth, its Moon orbit and the edges). Positions are fractions of the widget [x, y].
// Countdown: all 7 stars are lit after the weekly reset and one goes out each day (R136a1 first, Proxima last): lit stars = days left. A star that has gone out is only a tiny faint dot.
const STAR_POS = {
  small: [[0.14, 0.16], [0.28, 0.87], [0.40, 0.12], [0.53, 0.88], [0.62, 0.14], [0.75, 0.86], [0.84, 0.17]],     // zig-zag week: days alternate top / bottom band, left to right, jittered; inset so halos stay clear of the rounded corners (every star >= 0.12 from an edge, >= 0.16 from the Moon's path)
  medium: [[0.08, 0.15], [0.21, 0.87], [0.35, 0.11], [0.52, 0.91], [0.69, 0.09], [0.82, 0.86], [0.90, 0.16]]
}
// Countdown: the number of lit stars is the number of days left: all 7 right after the weekly reset, one fewer each day (R136a1 goes out first, Proxima last). A star that has gone out is a tiny faint dot; the survivors get brighter as the others go out.
function starLit(i) { return i <= CYCLE_DAYS - 1 - Math.min(CYCLE_DAYS - 1, Math.floor((now.getTime() - prevReset.getTime()) / 86400000)) }   // countdown: all 7 stars are lit right after the reset, then one goes out each day (R136a1 first, Proxima last), so the lit count is the number of days left
// ---- reset-hour effects: all drawn at draw time (scaled cached sprites + small in-memory glow images), so they never touch the cached star sprites ----
const SINCE_MS = now.getTime() - prevReset.getTime(), SINCE_MIN = SINCE_MS / 60000
const FIN = lastHour ? 1 - leftMs / 3600000 : 0                     // 0..1 through the final hour before the reset
const SWELL_ON = leftMs <= 10800000 || SINCE_MIN < 30           // the existing final-3h swell window and the post-reset settle: this alone drives the faster refresh
const RAMP = leftMs <= 86400000 && leftMs > 10800000 ? Math.pow((86400000 - leftMs) / 75600000, 1.3) : 0   // 0..1 over the last 24 h down to 3 h left (ease-in): the lit star(s) brighten and grow a little more every refresh, drawn on the cached sprite
const SWELL_RAW = leftMs <= 10800000 ? Math.pow(1 - leftMs / 10800000, 2.2) : SINCE_MIN < 30 ? 1 - sstep(0, 30, SINCE_MIN) : 0   // 0..1: the lone last star swells over the final 3 h (ease-in, peak = 1 at the reset); at the reset all 7 relight together and the swell settles over ~30 min
const RAMP_SHARE = 0.55                                          // the 24 h ramp climbs to this share of the full swell by 3 h left; the final-3 h swell takes it from there to 1 at the reset, with no jump at either seam
const SWELL = leftMs <= 10800000 ? RAMP_SHARE + (1 - RAMP_SHARE) * SWELL_RAW : SINCE_MIN < 30 ? SWELL_RAW : RAMP_SHARE * RAMP   // 0..1, continuous: 0 at 24 h left -> 0.55 at 3 h -> 1 at the reset -> settles to 0 within 30 min
const LIT_N = CYCLE_DAYS - Math.min(CYCLE_DAYS - 1, Math.floor(SINCE_MS / 86400000))   // stars still lit: 7 right after the reset, 1 on the last day
const BOOST = (CYCLE_DAYS - LIT_N) / (CYCLE_DAYS - 1)              // 0 with 7 lit .. 1 with 1 lit: each star that goes out makes the survivors a step brighter (and a touch bigger), applied at draw time
const SWELL_K = 0.7                                                  // size at the peak = 1 + SWELL_K, the same for every star
const PULSE_PERIOD = 780                                            // seconds per breath (13 min): slower than the ~10 min refresh, so each refresh lands on a different phase
const PULSE = FIN > 0 ? sstep(0, 0.1, FIN) * Math.sin(2 * Math.PI * (now.getTime() / 1000) / PULSE_PERIOD) : 0   // -1..1, the same for all 7 stars
let AURA_W = 1e9, AURA_H = 1e9                                     // widget size in points, set per render
function aura(ctx, x, y, hex, R, amp, wob, seed) {                  // a soft round glow: one small RGBA image built in memory per draw (dithered, no banding)
  if (!(amp > 0.004) || !(R > 2)) return
  R = Math.min(R, 0.92 * Math.min(x, AURA_W - x, y, AURA_H - y))     // a glow always fades out before the widget edge, so no soft box shows against a black wallpaper
  if (!(R > 2)) return
  try {
    const N = Math.max(16, Math.min(260, Math.round(R * 2.6))), c = rgb(hex), px = new Uint8Array(N * N * 4), h = N / 2
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const dx = (i + 0.5 - h) / h, dy = (j + 0.5 - h) / h, rr = Math.sqrt(dx * dx + dy * dy)
      if (rr >= 1) continue
      let f = Math.exp(-3.4 * rr * rr) * (1 - sstep(0.55, 1, rr))
      if (wob) f *= 1 - wob + 2 * wob * sv2(dx * 1.7 + 6, dy * 1.7 + 6, seed || 1)
      const q = (j * N + i) * 4
      px[q] = c[0]; px[q + 1] = c[1]; px[q + 2] = c[2]; px[q + 3] = Math.min(255, Math.floor(amp * f * 255 + Math.random()))
    }
    ctx.drawImageInRect(pngFromRGBA(px, N, N), new Rect(x - R, y - R, 2 * R, 2 * R))
  } catch (err) { console.log("aura skipped: " + err) }
}
// per star: [brightness weight, size]; the colours come from DAY_STARS
const STAR_PH = [[1.25, 1.05], [1, 1], [0.95, 1], [0.95, 1.05], [1, 1.05], [0.95, 1.05], [1.25, 1.3]]
const SPR = Math.max(2, Math.round(Device.screenScale()))   // star sprite pixels per point: one sprite pixel is one device pixel, so the cores stay crisp
function sn2(ix, iy, s) { let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(s, 2246822519)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
function sv2(x, y, s) {                                // smooth 2D value noise
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy)
  const a = sn2(ix, iy, s), b = sn2(ix + 1, iy, s), c = sn2(ix, iy + 1, s), d = sn2(ix + 1, iy + 1, s)
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy
}
// A crisp point star, built per pixel at device resolution: a tiny white-hot core, a tight halo in the star's own colour and a very small faint skirt. No spikes, no big soft blobs.
// A star whose day has not come is just one tiny, very faint dot in its colour.
function starSprite(i, on, u, last, big) {
  const [b, k] = STAR_PH[i], g = k * u * (big ? 1.3 : 1.1)                       // pinpoint scale, matched to the wallpaper's own stars (a few device pixels across)
  const T = rgb(DAY_STARS[i][0]).map((v) => v / 255), mx = Math.max(...T), tn = T.map((v) => v / mx)
  const cc = tn.map((v) => v + (1 - v) * 0.6), pc = tn.map((v) => v + (1 - v) * 0.12), hc = tn.map((v) => Math.pow(v, 1.4))   // saturated: the core is only a little whitened, the halo is the star's own colour
  const rc = (on ? 0.42 : 0.2) * g, rp = (on ? 1.2 : 0.8) * g, rh = 2.4 * g, Rm = on ? 6.5 * g : 1.6 * g   // a lit star: a clear 3-4 device-pixel core and a small halo; a gone-out star: a barely-there dim dot
  const N = Math.max(8, Math.round(2 * Rm * SPR)), px = new Uint8Array(N * N * 4), c0 = N / 2, d = 1 / SPR, amp = on ? b * DAY_STARS[i][3] : 0.1, E = [0, 0, 0]
  for (let j = 0; j < N; j++) for (let i2 = 0; i2 < N; i2++) {
    const dx = (i2 + 0.5 - c0) * d, dy = (j + 0.5 - c0) * d, r2 = dx * dx + dy * dy, rr0 = Math.sqrt(r2)
    if (rr0 >= N * d / 2) continue
    const win = 1 - sstep(0.55, 1, rr0 / (N * d / 2))
    for (let ch = 0; ch < 3; ch++) {
      E[ch] = amp * (on ? 1.7 * Math.exp(-0.5 * r2 / (rc * rc)) * cc[ch] + 0.3 * Math.pow(1 + r2 / (rp * rp), -1.9) * pc[ch] + 0.045 * Math.pow(1 + r2 / (rh * rh), -1.6) * hc[ch]
        : Math.exp(-0.5 * r2 / (rc * rc)) * 0.55 * tn[ch]) * win
    }
    let m = E[0] > E[1] ? (E[0] > E[2] ? E[0] : E[2]) : (E[1] > E[2] ? E[1] : E[2]); const q = (j * N + i2) * 4
    if (m < 0.0008) continue
    const mo = m < 0.6 ? m : 0.6 + 0.4 * (1 - Math.exp(-(m - 0.6) / 0.4)), tm = mo / m      // soft shoulder at the very top only: the core stays a bright point
    for (let c2 = 0; c2 < 3; c2++) E[c2] *= tm
    m *= tm
    const al = Math.min(1, m)
    px[q] = Math.min(255, Math.round(E[0] / m * 255)); px[q + 1] = Math.min(255, Math.round(E[1] / m * 255)); px[q + 2] = Math.min(255, Math.round(E[2] / m * 255))
    px[q + 3] = Math.min(255, Math.floor(al * 255 + Math.random()))
  }
  return { img: pngFromRGBA(px, N, N), R: N * d / 2 }
}
function dayStar(ctx, x, y, i, on, u, big, ks) { try { dayStar1(ctx, x, y, i, on, u, big, ks || 1) } catch (err) { console.log("star " + i + " skipped: " + err) } }
function dayStar1(ctx, x, y, i, on, u, big, ks) {                 // the sprite is cached per star in two states (lit or not yet), so it is only ever re-made when a star's day arrives
  const last = i === CYCLE_DAYS - 1
  const key = `em9-s-${i}-${Math.round(u * 100)}-${on ? 1 : 0}-${big ? 1 : 0}-${SPR}`, path = fm.joinPath(fm.documentsDirectory(), `grok-em-star${i}${big ? "s" : "m"}.png`), kp = path + ".key"
  let img = null, R = 0
  try {
    if (fm.fileExists(path) && fm.fileExists(kp)) { const [k0, r0] = fm.readString(kp).split("|"); if (k0 === key) { img = fm.readImage(path); R = parseFloat(r0) } }
  } catch (err) { img = null }
  if (!img || !(R > 0)) {
    const s = starSprite(i, on, u, last, big)
    img = s.img; R = s.R
    try { fm.writeImage(path, img); fm.writeString(kp, key + "|" + R) } catch (err) {}
  }
  const sc = Device.screenScale(), D = 2 * R * ks, rx = ks === 1 ? Math.round((x - R) * sc) / sc : x - R * ks, ry = ks === 1 ? Math.round((y - R) * sc) / sc : y - R * ks   // snapped to the device pixel grid unless swelling
  ctx.drawImageInRect(img, new Rect(rx, ry, D, D))
}
// ---- the stars wander: each one follows its own smooth pseudo-random path through the free sky, a pure function of the clock (no state, no jump at the weekly reset) ----
// Free sky = at least 0.10 H from every edge, outside Earth + its glare, at least 0.14 H from the Moon's path; stars stay at least 0.12 H apart. Sprites are cached per star and never touch the position, which is applied at draw time.
const WANDER_PER = [[17, 13], [21, 15], [14, 19], [19, 24], [23, 16], [15, 21], [20, 12]]   // hours per noise cell, x and y, per star
const SIDE_PER = [61, 83, 71, 97, 67, 89, 77]   // hours per noise cell for the top/bottom choice
function vn1(t, sd) { const k = Math.floor(t), f = t - k, w = f * f * (3 - 2 * f); return sn2(k, 7, sd) * (1 - w) + sn2(k + 1, 7, sd) * w }
function wnoise(hrs, per, sd) { const n = 0.82 * vn1(hrs / per, sd) + 0.18 * vn1(hrs / (per * 0.45) + 11, sd + 50); return clamp(0.5 + (n - 0.5) * 1.5, 0, 1) }
let FS_KEY = "", FS_VAL = null
function freeSky(W, H, med, u) {
  const fk = `${W}|${H}|${med}|${u}`; if (fk === FS_KEY && FS_VAL) return FS_VAL
  FS_KEY = fk; FS_VAL = freeSkyCalc(W, H, med, u); return FS_VAL
}
function freeSkyCalc(W, H, med, u) {
  const Re = (med ? 48 : 35) * u, orb = med ? 1.9 : 1.8, Se = EM_SUN
  const L0 = [-0.2, -0.8, 0.55], dl = dot3(L0, Se), Ln = unit3v([L0[0] - dl * Se[0], L0[1] - dl * Se[1], L0[2] - dl * Se[2]]), Qe = cross3(Se, Ln)
  const inc = 5.1 * d2r, Qm = [0, 1, 2].map((i) => Qe[i] * Math.cos(inc) + Ln[i] * Math.sin(inc))
  const path = []
  for (let k = 0; k < 120; k++) { const ph = 2 * Math.PI * k / 120, c = Math.cos(ph), s2 = Math.sin(ph); path.push([W / 2 + orb * (c * Se[0] + s2 * Qm[0]) * Re, H / 2 + orb * (c * Se[1] + s2 * Qm[1]) * Re]) }
  const cell = 3 * u, nx = Math.floor(W / cell), ny = Math.floor(H / cell), inset = 0.1 * H, clr = 0.14 * H + 2.2 * u, ecl = Re + 0.1 * H + 2.2 * u
  const ok = new Uint8Array(nx * ny)
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const X = (i + 0.5) * cell, Y = (j + 0.5) * cell
    if (X - cell / 2 < inset || X + cell / 2 > W - inset || Y - cell / 2 < inset || Y + cell / 2 > H - inset) continue
    if (Math.hypot(X - W / 2, Y - H / 2) < ecl) continue
    let near = false
    for (let k = 0; k < 120; k++) if (Math.hypot(path[k][0] - X, path[k][1] - Y) < clr) { near = true; break }
    if (!near) ok[j * nx + i] = 1
  }
  return { ok, cell, nx, ny }
}
function wanderPos(W, H, family, u) {
  try {
    const med = family === "medium", fs = freeSky(W, H, med, u), { ok, cell, nx, ny } = fs, inset = 0.1 * H, hrs = now.getTime() / 3600000
    const snap = (x, y) => {                              // nearest free cell centre (or the point itself if it is free)
      const ci = clamp(Math.floor(x / cell), 0, nx - 1), cj = clamp(Math.floor(y / cell), 0, ny - 1)
      if (ok[cj * nx + ci]) return [x, y]
      let best = 1e9, bx = x, by = y
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (ok[j * nx + i]) { const dx = (i + 0.5) * cell - x, dy = (j + 0.5) * cell - y, d = dx * dx + dy * dy; if (d < best) { best = d; bx = (i + 0.5) * cell; by = (j + 0.5) * cell } }
      return [bx, by]
    }
    const dmin = 0.12 * H, P = []
    const regions = [[], [], [], []]                       // [half + 2 * side]: the free columns of that quarter of the sky, each with its list of free rows
    for (let i = 0; i < nx; i++) for (let h = 0; h < 2; h++) {
      const rows = []
      for (let j = 0; j < ny; j++) if (ok[j * nx + i] && ((j + 0.5) * cell >= H / 2) === (h === 1)) rows.push(j)
      if (rows.length) regions[h + 2 * (med && (i + 0.5) * cell > W / 2 ? 1 : 0)].push([i, rows])
    }
    const clash = (x, y) => { for (const p of P) if (Math.hypot(p[0] - x, p[1] - y) < dmin) return true; return false }
    for (let s = 0; s < CYCLE_DAYS; s++) {
      const nX = wnoise(hrs, WANDER_PER[s][0], 3 + s * 17), v = wnoise(hrs, WANDER_PER[s][1], 101 + s * 29)
      const wantLow = wnoise(hrs, SIDE_PER[s], 201 + s * 13) >= 0.5, wantRight = med && wnoise(hrs, SIDE_PER[(s + 3) % 7], 301 + s * 11) >= 0.5   // slow coins: top or bottom half, and (medium only) left or right, so a star changes region only about every day or two
      let cols = null
      for (let t = 0; t < 4 && !cols; t++) { const c = regions[(wantLow !== ((t & 1) === 1) ? 1 : 0) + 2 * (med && wantRight !== ((t & 2) === 2) ? 1 : 0)]; if (c.length) cols = c }
      if (!cols) { P.push(snap(W / 2, H / 2)); continue }
      const qx = nX * cols.length, kx = Math.min(cols.length - 1, Math.floor(qx)), ci = cols[kx][0], col = cols[kx][1]
      const X = (ci + (qx - kx)) * cell
      let x = X, y = H / 2
      { const q = v * col.length, k = Math.min(col.length - 1, Math.floor(q)); y = (col[k] + (q - k)) * cell }   // v picks a height among the free cells of this column, so stars spread over the free sky instead of piling on its border
      if (clash(x, y)) {                                  // too close to an earlier star: take the nearest free spot that is not
        let best = 1e9, bx = x, by = y
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (ok[j * nx + i]) {
          const cx = (i + 0.5) * cell, cy = (j + 0.5) * cell, d = (cx - x) * (cx - x) + (cy - y) * (cy - y)
          if (d < best && !clash(cx, cy)) { best = d; bx = cx; by = cy }
        }
        x = bx; y = by
      }
      P.push([x, y])
    }
    return P
  } catch (err) { console.log("wander skipped: " + err); return null }
}
// ---- sparkles: a few tiny white pinpoints that twinkle in and out and re-seed every ~13 min, so they read as wallpaper dust and never as countdown stars ----
// Positions are a pure function of the clock. Each sparkle lives in its own staggered 13-min slot: it fades in, peaks mid-slot, fades out, and the next slot picks a new free spot while it is invisible.
// They stay in the free sky (off the edges and corners, away from Earth + glare and the Moon's path), keep clear of the 7 named stars and of each other, and are far smaller, whiter and dimmer than any lit star.
const SPARK_SLOT = 780000, SPARK_LV = [0.28, 0.42, 0.58, 0.74, 0.9]   // slot length (ms); peak opacity per brightness level (a lit star core is ~1.0)
const SPARK_MEM = {}                                                  // tiny sprites, built once per run in memory: [level, glint] -> image (a handful of 3x3 / 7x7 images, nothing is written to disk)
function sparkSprite(lv, glint) {
  const key = lv + (glint ? "g" : "d")
  if (SPARK_MEM[key]) return SPARK_MEM[key]
  const N = glint ? 7 : 3, c0 = (N - 1) / 2, px = new Uint8Array(N * N * 4), a = SPARK_LV[lv]
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const dx = i - c0, dy = j - c0, r2 = dx * dx + dy * dy
    let v = Math.exp(-0.5 * r2 / 0.5)                               // a ~1-pixel dot, a faint 1-pixel skirt
    if (glint && (dx === 0 || dy === 0) && r2 > 0) v = Math.max(v, 0.3 * Math.exp(-0.45 * (Math.sqrt(r2) - 1)) * (r2 > 4 ? 0.55 : 1))   // a very faint 4-point glint, 3 px each way
    const q = (j * N + i) * 4
    px[q] = 248; px[q + 1] = 250; px[q + 2] = 255; px[q + 3] = Math.min(255, Math.round(a * v * 255))
  }
  SPARK_MEM[key] = { img: pngFromRGBA(px, N, N), N }
  return SPARK_MEM[key]
}
function sparkles(ctx, W, H, family, u, P) {
  try {
    const med = family === "medium", NS = med ? 22 : 14, fs = freeSky(W, H, med, u), { ok, cell, nx, ny } = fs, ms = now.getTime(), sc = Device.screenScale()
    const cells = []; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) if (ok[j * nx + i]) cells.push([i, j])
    if (!cells.length) return
    const dStar = 0.11 * H, dSp = 0.04 * H, placed = []
    for (let j = 0; j < NS; j++) {
      const off = sn2(j, 3, 8101) * SPARK_SLOT, t = ms + off, k = Math.floor(t / SPARK_SLOT), ph = t / SPARK_SLOT - k
      if (sn2(k, j, 8102) < 0.08) continue                           // a slot now and then stays dark: the sky is never the same twice
      const env = sstep(0, 0.3, ph) * (1 - sstep(0.7, 1, ph)),   // fade in, hold, fade out: invisible at both slot edges, so the jump to a new spot is never seen
         bri = 0.6 + 0.4 * sn2(k, j, 8103), v = env * bri
      let x = 0, y = 0, got = false
      for (let a = 0; a < 14 && !got; a++) {
        const c = cells[Math.floor(sn2(k, j * 31 + a, 8104) * cells.length)]
        x = (c[0] + 0.15 + 0.7 * sn2(k, j * 31 + a, 8105)) * cell; y = (c[1] + 0.15 + 0.7 * sn2(k, j * 31 + a, 8106)) * cell
        got = true
        for (const p of P) if (Math.hypot(p[0] - x, p[1] - y) < dStar) { got = false; break }
        if (got) for (const p of placed) if (Math.hypot(p[0] - x, p[1] - y) < dSp) { got = false; break }
      }
      if (!got) continue
      placed.push([x, y])                                            // reserve the spot even while it is faint, so spots never swap places
      const lv = Math.floor(v * 5.2); if (lv < 0 || v < 0.12) continue
      const L = Math.min(4, lv), glint = sn2(k, j, 8107) < 0.28 && L >= 3
      const sp = sparkSprite(L, glint), d = sp.N / SPR, cx = (Math.floor(x * sc) + 0.5) / sc, cy = (Math.floor(y * sc) + 0.5) / sc
      ctx.drawImageInRect(sp.img, new Rect(cx - d / 2, cy - d / 2, d, d))
    }
  } catch (err) { console.log("sparkles skipped: " + err) }
}
function dayDots(ctx, W, H, family, u) {
  for (let i = 0; i < CYCLE_DAYS; i++) {                // tidy up the pre-release star sprite names (nothing else piles up: each cache file keeps one fixed name and is overwritten)
    try { const old = fm.joinPath(fm.documentsDirectory(), `grok-em-star${i}.png`); if (fm.fileExists(old)) fm.remove(old); if (fm.fileExists(old + ".key")) fm.remove(old + ".key") } catch (err) {}
  }
  const pos = STAR_POS[family === "medium" ? "medium" : "small"]
  const big = family !== "medium", P = wanderPos(W, H, family, u) || pos.map((p) => [W * p[0], H * p[1]])   // wandering stars; the fixed zig-zag layout below is only the fallback
  sparkles(ctx, W, H, family, u, P)                       // under the stars, so a lit star always wins
  for (let i = 0; i < CYCLE_DAYS; i++) {
    const [x, y] = P[i], last = i === CYCLE_DAYS - 1, on = starLit(i), g = u * (big ? 1.3 : 1.1) * STAR_PH[i][1], g0 = STAR_PH[i][1]
    let ks = 1
    if (on && BOOST > 0.01) {                                   // survivors brighten as the others go out: a tighter, hotter core and halo on the cached sprite, still a point
      aura(ctx, x, y, mixHex(DAY_STARS[i][0], "#FFFFFF", 0.4), (big ? 5 : 4.2) * u * g0 * (0.8 + 0.4 * BOOST), 0.07 + 0.2 * BOOST, 0, 0)
      aura(ctx, x, y, "#FFFFFF", (big ? 2.2 : 1.9) * u * g0 * (0.8 + 0.3 * BOOST), 0.32 * BOOST, 0, 0)
      ks = 1 + 0.25 * BOOST
    }
    if (PULSE !== 0 && on) aura(ctx, x, y, mixHex(DAY_STARS[i][0], "#FFFFFF", 0.35), 4.5 * g, 0.16 * (0.5 + 0.5 * PULSE), 0, 0)   // the final-hour breath: all stars glow together, a tight halo and no size change, so the cores stay sharp
    if (on && SWELL > 0.01) {                                   // brighter and a little bigger, still a crisp point: a tight bright core on top of the scaled sprite, plus a faint small halo
      aura(ctx, x, y, mixHex(DAY_STARS[i][0], "#FFFFFF", 0.45), (big ? 6 : 5) * u * g0 * (0.7 + 0.5 * SWELL), 0.16 * SWELL, 0, 0)
      aura(ctx, x, y, "#FFFFFF", (big ? 2.6 : 2.2) * u * g0 * (0.8 + 0.4 * SWELL), 0.45 * SWELL, 0, 0)
      ks *= 1 + SWELL_K * SWELL
    }
    dayStar(ctx, x, y, i, on, u, big, ks)
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
  AURA_W = W; AURA_H = H
  const ctx = new DrawContext()
  ctx.size = new Size(W, H)
  ctx.opaque = true
  ctx.respectScreenScale = true
  if (bg && !PLAIN_BLACK) ctx.drawImageInRect(bg, new Rect(0, 0, W, H))
  else { ctx.setFillColor(new Color(PLAIN_BLACK ? "#000000" : "#030305")); ctx.fillRect(new Rect(0, 0, W, H)) }

  const u = H / 170
  const medium = family === "medium"
  const moon = medium ? { x: W * 0.25, y: H * 0.5, R: 39 * u } : { x: W / 2, y: LABEL ? H * 0.3 : H * 0.31, R: (LABEL ? 24 : 27) * u }
  satLimit = medium ? Math.min(moon.x - 4, W * 0.5 - 12 - moon.x) : W / 2 - 4
  const box = medium ? { x0: W * 0.5 - 10, y0: H * 0.22, x1: W, y1: H } : { x0: 0, y0: H * 0.52, x1: W, y1: H }
  const pure = PLAIN_BLACK || (!!bg && WALLPAPER_MODE)
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
    dayDots(ctx, W, H, family, u)                       // stars first, so Earth and the Moon cover them (and their halos) if they ever meet
    if (MODE === "earthmoon") drawDrift(ctx, W, H, family, u); else drawMoon(ctx, moon.x, moon.y, moon.R)
    if (LABEL) starlightText(ctx, LABEL, label, labelSize, W / 2, H * 0.648, "center", labelSpan, shimmer)
    bodyLabel(ctx, W / 2, H * 0.538, H * 0.945, H * 0.9, "center", u)
  } else {
    const tx = W * 0.5, gap = 8 * u
    const heroY = H * (LABEL ? 0.55 : 0.455), dotsY = H * (LABEL ? 0.75 : 0.65)
    if (!pure) shootingStar(ctx, W, H, [{ x: moon.x, y: moon.y, r: moon.R * 1.7 }, { x0: tx - 10, y0: H * 0.22, x1: W, y1: H }])
    dayDots(ctx, W, H, family, u)                       // stars first, so Earth and the Moon pass in front
    if (MODE === "earthmoon") drawDrift(ctx, W, H, family, u); else drawMoon(ctx, moon.x, moon.y, moon.R)
    if (LABEL) starlightText(ctx, LABEL, label, labelSize, tx + 1, H * 0.3, "left", labelSpan, shimmer)
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
  const step = Math.min(toSlot, lastHour ? 60000 : SWELL_ON ? 120000 : (60 + Math.floor(Math.random() * 241)) * 1000)
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