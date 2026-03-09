export type ShowMode = 1 | 2 | 3 | 4;
export type Methode  = 1 | 2 | 3;

export interface VarNames {
  time: string;
  x: string;
  y: string | null;
}

export interface Units {
  time: string;
  x: string;
  y: string;
}

export interface WendetangenteState {
  // User inputs (stored as strings to allow free typing)
  xA: string;
  xE: string;
  yA: string;
  yE: string;
  t0: string;
  xWP: string;   // Wendepunkt X-Wert
  tWP: string;   // Wendepunkt Zeit
  dx: string;    // ΔX zum zweiten Tangentenpunkt
  dt: string;    // Δt zum zweiten Tangentenpunkt
  methode: Methode;
  showMode: ShowMode;
  // Excel data
  timeData: number[];
  xData: number[];
  yData: number[];
  systemName: string;
  varNames: VarNames;
  units: Units;
  fileName: string;
  excelPreviewRows: (string | number | undefined)[][];
  displayMode: number;
}

export interface DerivedValues {
  dX: number | null;
  dY: number | null;
  kS: number | null;
  t1Calc: number | null;    // Schnittpunkt Tangente ∩ XA
  t2Calc: number | null;    // Schnittpunkt Tangente ∩ XE
  TT: number | null;
  TG: number | null;        // Küpfmüller: t2 − t1
  TG1: number | null;       // Modifiziert: t2 − tWP
  modelData1: number[];
  modelData2: number[];
  diffs: number[];
  diffSquared: number[];
  cumSum: number[];
  cumSumTotal: number | null;
  diffs2: number[];
  diffSquared2: number[];
  cumSum2: number[];
  cumSumTotal2: number | null;
}

export interface ExcelParseResult {
  timeData: number[];
  xData: number[];
  yData: number[];
  systemName: string;
  varNames: VarNames;
  units: Units;
  previewRows: (string | number | undefined)[][];
}
