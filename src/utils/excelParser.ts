import * as XLSX from 'xlsx';
import type { ExcelParseResult, VarNames } from '../types';

export function parseExcelFile(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 });
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        resolve(parseRows(rows, baseName));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsArrayBuffer(file);
  });
}

function parseRows(
  rows: (string | number | undefined)[][],
  baseName: string,
): ExcelParseResult {
  const timeData: number[] = [];
  const xData: number[] = [];
  const yData: number[] = [];
  let systemName = '';
  let varNames: VarNames = { time: 'Zeit', x: 'X', y: 'Y' };
  let units = { time: '', x: '', y: '' };

  const first = rows[0];
  const second = rows[1];
  const third = rows[2];

  // Structure C: 3 header rows (system name / variable names / units)
  const isStructureC =
    first && typeof first[0] === 'string' &&
    second && typeof second[0] === 'string' &&
    !!third;

  if (isStructureC) {
    systemName = String(first[0]);
    varNames = {
      time: second[0] ? String(second[0]) : 'Zeit',
      x: second[1] ? String(second[1]) : 'X',
      y: second[2] ? String(second[2]) : null,
    };
    units = {
      time: third[0] ? String(third[0]) : '',
      x: third[1] ? String(third[1]) : '',
      y: third[2] ? String(third[2]) : '',
    };
    for (let i = 3; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;
      timeData.push(Number(r[0]));
      xData.push(Number(r[1]));
      if (r.length >= 3 && r[2] !== undefined) yData.push(Number(r[2]));
    }
  } else {
    // Structure A/B: 0–1 header rows, columns Zeit | X | Y
    const hasY = rows[0] && rows[0].length >= 3;
    systemName = baseName;
    varNames = { time: 'Zeit', x: 'X', y: hasY ? 'Y' : null };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.length < 2) continue;
      timeData.push(Number(r[0]));
      xData.push(Number(r[1]));
      if (hasY && r[2] !== undefined) yData.push(Number(r[2]));
    }
  }

  return {
    timeData,
    xData,
    yData,
    systemName,
    varNames,
    units,
    previewRows: rows.slice(0, 3),
  };
}
