// plans.js — plan characterizations and shape parameters.
//
// Everything here is original expression plus a handful of widely-known,
// approximate structure facts (peak weekly volume, where the peak lands,
// long-run cap). The numbers are used to GENERATE coarse curves in engine.js;
// no plan's week-by-week schedule is transcribed. See the README and the
// "Approximate shapes" disclaimer in the UI for why the numbers stay coarse.
//
// A coding beginner should be able to add a plan here without touching the
// engine: copy one block, change the words and the shape parameters.
//
// Shape parameters:
//   startVolume    approx km per week at the block start
//   peakVolume     approx km per week at the peak (a public, round fact)
//   peakWeekOut    how many weeks before race the peak lands
//   curve          ramp character: gentleLinear | steppedRecovery | flatHighPlateau
//   taper          gentle | moderate | short
//   blockWeeks     plan length in weeks (all v1 plans are 18)
//   paceApproach   mileage | pace | effort
//   longRunPeakKm  approx longest long run in km (a defining public fact)

export const PLANS = {
  higdonNovice1: {
    name: "Hal Higdon, Novice 1",
    short: "Higdon Nov",
    tier: "beginner",
    blockWeeks: 18,
    paceApproach: "mileage",
    startVolume: 25,
    peakVolume: 60,
    peakWeekOut: 3,
    curve: "gentleLinear",
    taper: "gentle",
    longRunPeakKm: 32,
    philosophy: "Finish focused. Steady weekly mileage growth, one long run, and no pace targets. The goal is to reach the start line healthy and ready to complete the distance, not to race it.",
    signatureWorkout: "The weekend long run, extended gradually, with the midweek runs kept easy and untimed.",
    bestFor: "A first marathon with low injury risk and no time goal.",
    source: { label: "halhigdon.com", url: "https://www.halhigdon.com" }
  },

  higdonIntermediate1: {
    name: "Hal Higdon, Intermediate 1",
    short: "Higdon Int",
    tier: "intermediate",
    blockWeeks: 18,
    paceApproach: "mileage",
    startVolume: 40,
    peakVolume: 80,
    peakWeekOut: 3,
    curve: "gentleLinear",
    taper: "gentle",
    longRunPeakKm: 32,
    philosophy: "A step up from Novice. It keeps the steady mileage build but adds paced weekend running and back to back long days, so there is a little more quality without the demands of a full quality plan.",
    signatureWorkout: "A Saturday run near marathon pace paired with a Sunday long run, so the legs learn to go long on some accumulated tiredness.",
    bestFor: "A second or third marathon, or a first with a modest time goal and a solid base.",
    source: { label: "halhigdon.com", url: "https://www.halhigdon.com" }
  },

  hansons: {
    name: "Hansons Marathon Method",
    short: "Hansons",
    tier: "intermediate",
    blockWeeks: 18,
    paceApproach: "pace",
    startVolume: 40,
    peakVolume: 92,
    peakWeekOut: 2,
    curve: "flatHighPlateau",
    taper: "short",
    longRunPeakKm: 26,
    philosophy: "Cumulative fatigue over peak distance. You rarely run beyond about 16 miles, but a consistent high weekly load means every long run starts on tired legs, rehearsing the marathon's final third rather than its full distance.",
    signatureWorkout: "Tempo runs at goal marathon pace, plus the deliberately capped long run taken on accumulated fatigue.",
    bestFor: "Runners who plateau on classic plans and can handle frequency over single session distance.",
    source: { label: "hansons-running.com", url: "https://hansons-running.com" }
  },

  higdonAdvanced1: {
    name: "Hal Higdon, Advanced 1",
    short: "Higdon Adv",
    tier: "advanced",
    blockWeeks: 18,
    paceApproach: "mileage",
    startVolume: 50,
    peakVolume: 95,
    peakWeekOut: 3,
    curve: "gentleLinear",
    taper: "gentle",
    longRunPeakKm: 32,
    philosophy: "The most demanding Higdon build. Higher weekly mileage with hills, intervals, and tempo runs layered onto the long run, for runners comfortable turning easy volume into faster racing.",
    signatureWorkout: "Midweek intervals or tempo work during the week, then a long run at the weekend on already trained legs.",
    bestFor: "Seasoned marathoners raising a time goal who already run high mileage comfortably.",
    source: { label: "halhigdon.com", url: "https://www.halhigdon.com" }
  },

  pfitz18_70: {
    name: "Pfitzinger, 18/70",
    short: "Pfitz 18/70",
    tier: "advanced",
    blockWeeks: 18,
    paceApproach: "pace",
    startVolume: 50,
    peakVolume: 112,
    peakWeekOut: 3,
    curve: "steppedRecovery",
    taper: "moderate",
    longRunPeakKm: 35,
    philosophy: "High volume and pace disciplined. It builds aerobic strength through frequent medium long runs and places marathon pace segments inside long runs, so race pace feels rehearsed rather than discovered on the day.",
    signatureWorkout: "The medium long run midweek (around 18 to 23 km) and long runs carrying sustained blocks at marathon pace.",
    bestFor: "Experienced runners chasing a time goal with six or more running days a week.",
    source: { label: "Advanced Marathoning (book)", url: "https://us.humankinetics.com" }
  }
};
