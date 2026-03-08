import type { WendetangenteState, ShowMode, Methode, ExcelParseResult } from '../types';

export type Action =
  | { type: 'SET_FIELD'; field: 'xA' | 'xE' | 'yA' | 'yE' | 't0' | 'xWP' | 'tWP' | 'dx' | 'dt'; value: string }
  | { type: 'SET_METHODE'; methode: Methode }
  | { type: 'SET_SHOW_MODE'; mode: ShowMode }
  | { type: 'SET_DISPLAY_MODE'; value: number }
  | { type: 'LOAD_EXCEL'; result: ExcelParseResult; fileName: string };

export const initialState: WendetangenteState = {
  xA: '', xE: '', yA: '', yE: '',
  t0: '-100',
  xWP: '', tWP: '', dx: '', dt: '',
  methode: 1,
  showMode: 1,
  timeData: [], xData: [], yData: [],
  systemName: '',
  varNames: { time: 'Zeit', x: 'X', y: 'Y' },
  units: { time: '', x: '', y: '' },
  fileName: '',
  excelPreviewRows: [],
  displayMode: 0,
};

export function reducer(state: WendetangenteState, action: Action): WendetangenteState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_METHODE':
      return { ...state, methode: action.methode };
    case 'SET_SHOW_MODE':
      return { ...state, showMode: action.mode };
    case 'SET_DISPLAY_MODE':
      return { ...state, displayMode: action.value };
    case 'LOAD_EXCEL':
      return {
        ...state,
        xA: '', xE: '', yA: '', yE: '', t0: '-100',
        xWP: '', tWP: '', dx: '', dt: '',
        timeData: action.result.timeData,
        xData:    action.result.xData,
        yData:    action.result.yData,
        systemName:      action.result.systemName,
        varNames:        action.result.varNames,
        units:           action.result.units,
        fileName:        action.fileName,
        excelPreviewRows: action.result.previewRows,
      };
    default:
      return state;
  }
}
