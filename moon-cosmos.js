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
// clouds: a zonal climate (ITCZ, dry subtropics, stormy mid-latitudes and Southern Ocean) with drier deserts and wetter rainforest, plus cyclone swirls. bias < 0 = wetter
const CYCLONES = [[128, 16, 7, 1], [-28, 54, 14, 1], [82, -52, 14, -1], [-62, -41, 10, -1], [-165, 50, 13, 1], [172, -58, 15, -1], [22, -52, 13, -1], [-118, -50, 12, -1], [8, 61, 10, 1], [-88, 24, 6, 1], [145, 47, 10, 1], [-30, -50, 12, -1], [60, -48, 10, -1]]
function cloudAt(b, la, lo, drift, full, bias) {
  const cs = Math.cos(drift), sn = Math.sin(drift), cx = b[0] * cs + b[2] * sn, cz = -b[0] * sn + b[2] * cs
  const w = fbm3(cx * 2.1 + 4, b[1] * 2.1, cz * 2.1, 3)
  const n = fbm3(cx * 3.3 + w * 1.7, b[1] * 4.4 + w * 1.1, cz * 3.3 + w * 1.7, full ? 5 : 3)
  const al = Math.abs(la)
  const th = 0.44 - 0.13 * Math.exp(-Math.pow((la - 5) / 7, 2)) - 0.09 * Math.exp(-Math.pow((al - 52) / 12, 2)) - 0.04 * Math.exp(-Math.pow((la + 63) / 9, 2)) + 0.17 * Math.exp(-Math.pow((al - 26) / 8, 2)) + 0.06 * sstep(75, 88, al) + (bias || 0)
  let c = sstep(th, th + 0.3, n)
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
      const r1 = Math.max(rr, 1), g = Math.exp(-(r1 - 1) / 0.03)
      aa = g * 0.8 * lo * (1 - edge); ac = mix3([80, 140, 255], [170, 210, 255], Math.exp(-(r1 - 1) / 0.01))
    }
    let dc = [0, 0, 0]
    if (edge > 0) {
      const z = Math.sqrt(Math.max(0, 1 - rr * rr))
      const geo = x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2], ndl = bumpNdl(ht, N, p, k, x, y, z, rr, 0.45)
      const day = sstep(-0.05, 0.22, geo), lam = Math.pow(clamp(ndl, 0, 1), 0.72), night = 1 - day
      const ca = clamp(cld[p] * 1.08, 0, 0.97), tw = Math.exp(-Math.pow((geo - 0.03) / 0.1, 2))
      const sh = 1 - 0.5 * shd[p] * (1 - ca), dl = lam * day * sh * 1.12
      let sl = [sr[p] * dl + sr[p] * 0.045 * night + 1.0 * night, sg[p] * dl + sg[p] * 0.07 * night + 2.0 * night, sb[p] * dl + sb[p] * 0.15 * night + 5.0 * night]     // the night side keeps a faint moonlit blue
      const nh = Math.max(0, x * HV[0] + y * HV[1] + z * HV[2]), oceanM = om[p] * day * (1 - 0.92 * ca)
      const spec = Math.pow(nh, 90) * 0.55 + Math.pow(nh, 22) * 0.1
      sl = [sl[0] + 255 * spec * oceanM, sl[1] + 246 * spec * oceanM, sl[2] + 226 * spec * oceanM]
      const fr = Math.pow(1 - z, 4) * 0.55 * om[p] * day
      sl = mix3(sl, [118, 168, 238], fr * 0.8)
      const tw2 = Math.exp(-Math.pow((geo - 0.03) / 0.1, 2)), cl = 0.045 + 0.955 * day * Math.pow(clamp(geo + 0.06, 0, 1.05), 0.6)
      const cc = [252 * cl * (1 - 0.1 * tw2), 252 * cl * (1 - 0.34 * tw2), 255 * cl * (1 - 0.58 * tw2)]
      dc = mix3(sl, cc, ca)
      dc[0] += 16 * ca * night; dc[1] += 24 * ca * night; dc[2] += 46 * ca * night
      const ha = Math.pow(1 - z, 2.3) * 0.75 * sstep(-0.3, 0.5, geo)
      dc = [dc[0] + 60 * ha, dc[1] + 120 * ha, dc[2] + 250 * ha]
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
  if (fm.fileExists(path) && fm.fileExists(kp) && fm.readString(kp) === key) img = fm.readImage(path)
  if (!img) {
    const t0 = DEBUG_TIMING ? performance.now() : 0
    img = make()
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
  const Re = (med ? 40 : 32) * u, rm = 0.2727, orb = med ? 1.7 : 1.8
  const ex = W * (med ? 0.25 : 0.5) - (med ? 4 * u : 0), ey = H * (med ? 0.5 : 0.275)   // centred in the free area above the day dots (small) / in the left half beside the text (medium)
  const Se = EM_SUN
  const L0 = [-0.2, -0.8, 0.55], dl = dot3(L0, Se), Ln = unit3v([L0[0] - dl * Se[0], L0[1] - dl * Se[1], L0[2] - dl * Se[2]])   // ecliptic north, perpendicular to the Sun line
  const Qe = cross3(Ln, Se)
  const inc = 5.1 * d2r, Qm = [0, 1, 2].map((i) => Qe[i] * Math.cos(inc) + Ln[i] * Math.sin(inc))       // Moon's orbit is inclined 5.1 degrees
  const phi = 0.9 + 2 * Math.PI * hrs / T_HRS, cp = Math.cos(phi), sp = Math.sin(phi)
  const M = [0, 1, 2].map((i) => orb * (cp * Se[i] + sp * Qm[i]))                                      // phi = 0 is new moon (Moon toward the Sun), pi is full
  const Lm = unit3v([Se[0] * 60 - M[0], Se[1] * 60 - M[1], Se[2] * 60 - M[2]])                           // the Sun is far away: its direction at the Moon is the same
  const mx = ex + M[0] * Re, my = ey + M[1] * Re
  // orientations: Moon is tidally locked (near side toward Earth, pole along the orbit normal); Earth turns west to east, tilted 23.44 deg from the ecliptic normal
  const Mn = unit3v(cross3(Se, Qm)), dE = unit3v([-M[0], -M[1], -M[2]])
  const MBy = [-Mn[0], -Mn[1], -Mn[2]], MBx = cross3(MBy, dE)
  const moonO = orientFrom(MBy, unit3v(cross3(MBx, MBy)))
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
    const key = `em4-e-${N}-${slot}-${Math.round(M[0] * 20)}_${Math.round(M[1] * 20)}_${Math.round(M[2] * 20)}`
    driftFace(ctx, W, H, "earth", key, "grok-em-earth.png", N, size, ex, ey, () => earthSurface(Rt, sc * ss, 0.6, earthO).img)
    DRIFT_MS = null
    if (SG_GLOW) {                                                       // Singapore marker: a tiny hot white core in a soft reddish halo, round, no spikes; only on the visible hemisphere
      const la = 1.35 * d2r, v = bodyToView([0, -Math.sin(la), Math.cos(la)], earthO), vis = sstep(0.1, 0.5, v[2])
      if (vis > 0.01) {
        const day = sstep(-0.1, 0.25, dot3(v, Se)), k = vis * (1 - 0.5 * day)   // gentler on the day side
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
    const key = `em4-m-${N}-${slot}-${Math.round(Lm[0] * 50)}_${Math.round(Lm[1] * 50)}_${Math.round(Lm[2] * 50)}`
    driftFace(ctx, W, H, "moon", key, "grok-em-moon.png", N, size, mx, my, () => moonSurface(Rt, sc * ss, clamp((1 + Lm[2]) / 2, 0.02, 1), mixHex(MOON_COOL, MOON_WARM, 0.1), moonO).img)
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
    if (MODE === "earthmoon") drawDrift(ctx, W, H, family, u); else drawMoon(ctx, moon.x, moon.y, moon.R)
    dayDots(ctx, W / 2, dotsY, 7.5 * u)
    if (LABEL) starlightText(ctx, LABEL, label, labelSize, W / 2, H * 0.648, "center", labelSpan, shimmer)
    countdown(ctx, formatLeft(leftMs), hero, heroSize, heroHex, W / 2, heroY, "center", glow)
    bodyLabel(ctx, W / 2, H * 0.538, H * 0.945, H * 0.9, "center", u)
  } else {
    const tx = W * 0.5, gap = 8 * u
    const heroY = H * (LABEL ? 0.55 : 0.455), dotsY = H * (LABEL ? 0.75 : 0.65)
    if (!pure) shootingStar(ctx, W, H, [{ x: moon.x, y: moon.y, r: moon.R * 1.7 }, { x0: tx - 10, y0: H * 0.22, x1: W, y1: H }])
    if (MODE === "earthmoon") drawDrift(ctx, W, H, family, u); else drawMoon(ctx, moon.x, moon.y, moon.R)
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