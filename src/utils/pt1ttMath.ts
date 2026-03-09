import type { WendetangenteState, DerivedValues } from '../types';

function parseNum(s: string): number | null {
  const v = parseFloat(s);
  return isNaN(v) || !isFinite(v) ? null : v;
}

/**
 * Berechnet alle abgeleiteten Größen aus dem aktuellen State.
 *
 * Tangentendefinition:
 *   P₁ = (tWP,     xWP)       – Wendepunkt (erster Tangentenpunkt)
 *   P₂ = (tWP+Δt,  xWP+ΔX)   – zweiter Tangentenpunkt
 *   Steigung = ΔX / Δt
 *   t1Calc = tWP + (xA − xWP) / Steigung  → Tangente ∩ XA
 *   t2Calc = tWP + (xE − xWP) / Steigung  → Tangente ∩ XE
 *
 * Methode 1 (Küpfmüller):  TT = t1 − t0,  TG  = t2 − t1
 * Methode 2 (Modifiziert):  TT = t1 − t0,  TG1 = t2 − tWP
 * Methode 3: beide
 */
export function computeDerived(state: WendetangenteState): DerivedValues {
  const xA = parseNum(state.xA);
  const xE = parseNum(state.xE);
  const yA = parseNum(state.yA);
  const yE = parseNum(state.yE);
  const t0 = parseNum(state.t0);

  const dX = xA !== null && xE !== null ? xE - xA : null;
  const dY = yA !== null && yE !== null ? yE - yA : null;
  const kS = dX !== null && dY !== null && dY !== 0 ? dX / dY : null;

  const xWP  = parseNum(state.xWP);
  const tWP  = parseNum(state.tWP);
  const xP2  = parseNum(state.dx);   // absolute X-Koordinate von P2
  const tP2  = parseNum(state.dt);   // absolute t-Koordinate von P2

  let t1Calc: number | null = null;
  let t2Calc: number | null = null;
  let TT:  number | null = null;
  let TG:  number | null = null;
  let TG1: number | null = null;

  // Tangentenschnittpunkte — unabhängig von t0
  if (
    xA !== null && xE !== null &&
    xWP !== null && tWP !== null &&
    xP2 !== null && tP2 !== null && tP2 !== tWP
  ) {
    const slope = (xP2 - xWP) / (tP2 - tWP);
    if (slope !== 0) {
      const t1_raw = tWP + (xA - xWP) / slope;
      const t2_raw = tWP + (xE - xWP) / slope;
      // Geometrische Prüfung: t1 vor WP, t2 nach WP
      if (t1_raw < tWP && t2_raw > tWP) {
        t1Calc = t1_raw;
        t2Calc = t2_raw;
      }
    }
  }

  // Kennwerte — nur wenn t0 gültig (≥ 0)
  if (t1Calc !== null && t2Calc !== null && t0 !== null && t0 >= 0) {
    TT  = t1Calc - t0;
    TG  = t2Calc - t1Calc;   // Küpfmüller
    TG1 = t2Calc - tWP!;     // Modifiziert
  }

  // ── Modell-Sprungantworten ───────────────────────────────────────────────────
  const { timeData } = state;

  let modelData1: number[] = [];
  if (
    xA !== null && dY !== null && kS !== null &&
    TT !== null && TG !== null && TG > 0 &&
    t0 !== null && timeData.length > 0
  ) {
    const tDelay = t0 + TT;
    const ksDy   = kS * dY;
    modelData1 = timeData.map(t =>
      t <= tDelay ? xA : xA + ksDy * (1 - Math.exp(-(t - tDelay) / TG!)),
    );
  }

  let modelData2: number[] = [];
  if (
    xA !== null && dY !== null && kS !== null &&
    TT !== null && TG1 !== null && TG1 > 0 &&
    t0 !== null && timeData.length > 0
  ) {
    const tDelay = t0 + TT;
    const ksDy   = kS * dY;
    modelData2 = timeData.map(t =>
      t <= tDelay ? xA : xA + ksDy * (1 - Math.exp(-(t - tDelay) / TG1!)),
    );
  }

  // ── Fehlermetriken Modell 1 ─────────────────────────────────────────────────
  let diffs: number[]       = [];
  let diffSquared: number[] = [];
  let cumSum: number[]      = [];
  let cumSumTotal: number | null = null;

  if (modelData1.length > 0 && state.xData.length > 0) {
    diffs       = state.xData.map((x, i) => x - modelData1[i]);
    diffSquared = diffs.map(d => d * d);
    let acc = 0;
    cumSum = timeData.map((t, i) => {
      const dt = i === 0 ? 0 : t - timeData[i - 1];
      acc += diffSquared[i] * dt;
      return acc;
    });
    cumSumTotal = acc;
  }

  // ── Fehlermetriken Modell 2 ─────────────────────────────────────────────────
  let diffs2: number[]       = [];
  let diffSquared2: number[] = [];
  let cumSum2: number[]      = [];
  let cumSumTotal2: number | null = null;

  if (modelData2.length > 0 && state.xData.length > 0) {
    diffs2       = state.xData.map((x, i) => x - modelData2[i]);
    diffSquared2 = diffs2.map(d => d * d);
    let acc2 = 0;
    cumSum2 = timeData.map((t, i) => {
      const dt = i === 0 ? 0 : t - timeData[i - 1];
      acc2 += diffSquared2[i] * dt;
      return acc2;
    });
    cumSumTotal2 = acc2;
  }

  return {
    dX, dY, kS,
    t1Calc, t2Calc,
    TT, TG, TG1,
    modelData1, modelData2,
    diffs, diffSquared, cumSum, cumSumTotal,
    diffs2, diffSquared2, cumSum2, cumSumTotal2,
  };
}

export function fmt(val: number | null, decimals = 4): string {
  return val !== null ? val.toFixed(decimals) : '';
}
