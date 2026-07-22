// engine.js — pure functions only, no DOM. Depends on PLANS from plans.js.
//
// This is where a plan's shape parameters become an approximate km-per-week
// curve. The curves INTERPOLATE from a few numbers; they never read a stored
// weekly table. round5 snaps every displayed number to the nearest 5 km. That
// coarseness is a deliberate copyright-safety mechanism, not cosmetic: do not
// remove it or raise the precision. See §4 of the PRD.

import { PLANS } from "./plans.js";

// Snap to nearest 5 km. Coarse on purpose (copyright safety).
export const round5 = n => Math.round(n / 5) * 5;

// ---- 1. Curve generators ----
// Each takes (p = plan, weekOut = weeks before race) and returns approx km/week.
// weekOut counts DOWN to race: blockWeeks..1, then 0 = race week.

// Shared taper: an easing drop across the taper window down to race week.
function taperValue(p, weekOut) {
  const drop = { gentle: 0.55, moderate: 0.45, short: 0.60 }[p.taper] ?? 0.5;
  if (weekOut <= 0) return round5(p.peakVolume * 0.25);   // race week, minimal
  const frac = weekOut / p.peakWeekOut;                   // 1 at peak, toward 0 at race
  const floor = p.peakVolume * drop;
  return round5(floor + (p.peakVolume - floor) * frac);
}

export const CURVES = {
  // Steady near-linear climb from start to peak, then taper.
  gentleLinear(p, weekOut) {
    if (weekOut <= p.peakWeekOut) return taperValue(p, weekOut);
    const buildWeeks = p.blockWeeks - p.peakWeekOut;       // weeks of building
    const weeksIn = p.blockWeeks - weekOut;                // 0 at block start
    const frac = weeksIn / buildWeeks;                     // 0..1
    return round5(p.startVolume + (p.peakVolume - p.startVolume) * frac);
  },

  // Like linear but every 4th week drops about 20 percent for recovery.
  steppedRecovery(p, weekOut) {
    if (weekOut <= p.peakWeekOut) return taperValue(p, weekOut);
    const base = CURVES.gentleLinear(p, weekOut);
    const weeksIn = p.blockWeeks - weekOut;
    const isRecovery = weeksIn > 0 && weeksIn % 4 === 0;
    return round5(isRecovery ? base * 0.8 : base);
  },

  // Ramps up fast, then holds a high plateau (Hansons-like), short taper.
  flatHighPlateau(p, weekOut) {
    if (weekOut <= p.peakWeekOut) return taperValue(p, weekOut);
    const weeksIn = p.blockWeeks - weekOut;
    const rampWeeks = Math.round(p.blockWeeks * 0.35);     // reaches plateau about a third in
    if (weeksIn >= rampWeeks) return p.peakVolume;         // hold plateau
    const frac = weeksIn / rampWeeks;
    return round5(p.startVolume + (p.peakVolume - p.startVolume) * frac);
  }
};

// ---- 2. Phase classification ----
export function phaseFor(p, weekOut) {
  if (weekOut <= 0)                 return "Race week";
  if (weekOut <= p.peakWeekOut)     return "Taper";
  if (weekOut <= p.peakWeekOut + 4) return "Peak and sharpening";
  const weeksIn = p.blockWeeks - weekOut;
  if (weeksIn <= 3)                 return "Block intro";
  return "Base and build";
}

// ---- 3. Date helpers (local, timezone-stable) ----

// Parse "YYYY-MM-DD" into a local Date at midnight (no timezone drift).
export function parseISODate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Whole weeks until race, rounding up. Both dates reduced to local midnight.
export function weeksToRace(raceDate, today = new Date()) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const ms = raceDate - t;
  return Math.ceil(ms / (7 * 24 * 60 * 60 * 1000));
}

// The date a block of `blockWeeks` weeks would begin, given the race date.
export function blockStartDate(raceDate, blockWeeks) {
  const d = new Date(raceDate);
  d.setDate(d.getDate() - blockWeeks * 7);
  return d;
}

// ---- 4. The comparison for "right now" ----

export function getWeekComparison(raceISO, myVolume = null, userBlockWeeks = 18, today = new Date()) {
  const race = parseISODate(raceISO);
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayDiff = Math.round((race - todayMid) / (24 * 60 * 60 * 1000));
  const racePassed = dayDiff < 0;                          // any date before today
  const wtr = weeksToRace(race, today);                    // whole weeks to race

  const plans = Object.entries(PLANS).map(([id, p]) => {
    if (racePassed) {
      return { id, name: p.name, tier: p.tier, state: "done", source: p.source };
    }
    const started = wtr <= p.blockWeeks;                   // block begun only if within its length
    if (!started) {
      return {
        id, name: p.name, tier: p.tier, state: "before",
        startsInWeeks: wtr - p.blockWeeks,
        blockWeeks: p.blockWeeks,
        philosophy: p.philosophy, source: p.source
      };
    }
    const weekOut = wtr;                                   // shared axis: all v1 plans are 18 weeks
    return {
      id, name: p.name, short: p.short, tier: p.tier, state: "active",
      weekOut,
      weekLabel: `Week ${p.blockWeeks - weekOut + 1} of ${p.blockWeeks}`,
      phase: phaseFor(p, weekOut),
      approxKm: CURVES[p.curve](p, weekOut),
      paceApproach: p.paceApproach,
      signatureWorkout: p.signatureWorkout,
      source: p.source
    };
  });

  // Overall state drives the top-level message. All v1 plans share one length,
  // so the plans move between states together.
  let overall;
  if (racePassed)            overall = "done";
  else if (wtr === 0)        overall = "raceweek";
  else if (plans.some(r => r.state === "active")) overall = "active";
  else                       overall = "before";

  return {
    weeksToRace: wtr,
    overall,
    userBlockWeeks,
    userBlockStartsInWeeks: wtr - userBlockWeeks,
    myVolume,
    myPosition: myVolume ? positionVsPlans(myVolume, plans) : null,
    plans
  };
}

// Where the user's volume sits against the active plans right now.
export function positionVsPlans(myKm, rows) {
  const active = rows.filter(r => r.state === "active" && r.approxKm);
  if (!active.length) return null;
  const below = active.filter(r => myKm < r.approxKm).map(r => r.name);
  const above = active.filter(r => myKm >= r.approxKm).map(r => r.name);
  return {
    myKm,
    above,                        // plans you are at or above right now
    below,                        // plans you are under right now
    spread: [Math.min(...active.map(r => r.approxKm)),
             Math.max(...active.map(r => r.approxKm))]
  };
}
