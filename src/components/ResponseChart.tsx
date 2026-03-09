import { useEffect, useRef } from 'react';
import Plotly from 'plotly.js';
import type { WendetangenteState, DerivedValues } from '../types';

interface Props {
  state: WendetangenteState;
  derived: DerivedValues;
}

function parseNum(s: string): number | null {
  const v = parseFloat(s);
  return isNaN(v) || !isFinite(v) ? null : v;
}

export default function ResponseChart({ state, derived }: Props) {
  const divRef = useRef<HTMLDivElement>(null);

  // ResizeObserver
  useEffect(() => {
    const div = divRef.current;
    if (!div) return;
    const observer = new ResizeObserver(() => Plotly.Plots.resize(div));
    observer.observe(div);
    return () => {
      observer.disconnect();
      Plotly.purge(div);
    };
  }, []);

  // Chart neu zeichnen bei State-Änderung
  useEffect(() => {
    const div = divRef.current;
    if (!div || state.timeData.length === 0) return;

    const { timeData, xData, yData, showMode, fileName, varNames, methode } = state;
    const { modelData1, modelData2,
      diffs, diffSquared, cumSum, cumSumTotal,
      diffs2, diffSquared2, cumSum2, cumSumTotal2,
      t1Calc, t2Calc } = derived;

    const xA  = parseNum(state.xA);
    const xE  = parseNum(state.xE);

    const xWPv = parseNum(state.xWP);
    const tWPv = parseNum(state.tWP);
    const dxv  = parseNum(state.dx);
    const dtv  = parseNum(state.dt);

    const tMin = Math.min(...timeData);
    const tMax = Math.max(...timeData);

    // ── Traces ──────────────────────────────────────────────────────────────

    const traceX: Plotly.Data = {
      x: timeData, y: xData,
      mode: 'lines', name: 'Messwert X',
      line: { width: 2, color: 'blue' },
      xaxis: 'x', yaxis: 'y',
    };

    const traceModel1: Plotly.Data = {
      x: modelData1.length > 0 ? timeData : [],
      y: modelData1,
      mode: 'lines', name: 'Modell M1 (Küpfmüller)',
      line: { width: 3, color: 'red', dash: 'dot' },
      xaxis: 'x', yaxis: 'y',
      visible: (methode === 1 || methode === 3) && modelData1.length > 0 ? true : false,
    };

    const traceModel2: Plotly.Data = {
      x: modelData2.length > 0 ? timeData : [],
      y: modelData2,
      mode: 'lines', name: 'Modell M2 (Modifiziert)',
      line: { width: 3, color: '#7b1fa2', dash: 'dot' },
      xaxis: 'x', yaxis: 'y',
      visible: (methode === 2 || methode === 3) && modelData2.length > 0 ? true : false,
    };

    const showM1 = methode === 1 || methode === 3;
    const showM2 = methode === 2 || methode === 3;

    // Unteres Diagramm: immer 2 Traces (lower1 + lower2), Sichtbarkeit per visible
    let lower1: Plotly.Data;
    let lower2: Plotly.Data;
    let y2title: string;

    if (showMode === 1) {
      lower1 = { x: timeData, y: yData, mode: 'lines', name: 'Eingang Y',
        line: { width: 2, color: 'green' }, xaxis: 'x2', yaxis: 'y2' };
      lower2 = { x: [], y: [], mode: 'lines', name: '', xaxis: 'x2', yaxis: 'y2',
        visible: false, showlegend: false };
      y2title = 'Stellgröße y(t)';
    } else if (showMode === 2) {
      lower1 = { x: timeData, y: diffs, mode: 'lines', name: 'Δx(t) M1',
        line: { color: 'red', width: 2 }, xaxis: 'x2', yaxis: 'y2',
        visible: showM1 && diffs.length > 0 };
      lower2 = { x: timeData, y: diffs2, mode: 'lines', name: 'Δx(t) M2',
        line: { color: '#7b1fa2', width: 2 }, xaxis: 'x2', yaxis: 'y2',
        visible: showM2 && diffs2.length > 0 };
      y2title = 'Abweichung Δx(t)';
    } else if (showMode === 3) {
      lower1 = { x: timeData, y: diffSquared, mode: 'lines', name: 'Δx²(t) M1',
        line: { color: 'red', width: 2 }, xaxis: 'x2', yaxis: 'y2',
        visible: showM1 && diffSquared.length > 0 };
      lower2 = { x: timeData, y: diffSquared2, mode: 'lines', name: 'Δx²(t) M2',
        line: { color: '#7b1fa2', width: 2 }, xaxis: 'x2', yaxis: 'y2',
        visible: showM2 && diffSquared2.length > 0 };
      y2title = 'Δx²(t)';
    } else {
      lower1 = { x: timeData, y: cumSum, mode: 'lines', name: 'Σ Δx²·Δt M1',
        line: { color: 'red', width: 2 }, xaxis: 'x2', yaxis: 'y2',
        visible: showM1 && cumSum.length > 0 };
      lower2 = { x: timeData, y: cumSum2, mode: 'lines', name: 'Σ Δx²·Δt M2',
        line: { color: '#7b1fa2', width: 2 }, xaxis: 'x2', yaxis: 'y2',
        visible: showM2 && cumSum2.length > 0 };
      y2title = 'Σ Δx²·Δt';
    }

    // Traces: immer 5 Basis-Traces (konstante Anzahl → kein Hover-Reset)
    const traces: Plotly.Data[] = [traceX, traceModel1, traceModel2, lower1, lower2];

    // ── Shapes & Annotations ────────────────────────────────────────────────
    // Alle Arrays haben IMMER feste Größe → kein SVG-Rebuild → kein Hover-Reset.
    // Sichtbarkeit wird über visible/opacity gesteuert, nie über push/length.

    const xaXeValid = xA !== null && xE !== null;
    const t0num     = parseFloat(state.t0);
    const t0Valid   = !isNaN(t0num) && t0num >= 0;
    const p1Valid   = xWPv !== null && tWPv !== null;
    const p2Valid   = p1Valid && dxv !== null && dtv !== null;
    const tangentValid = xaXeValid && t1Calc !== null && t2Calc !== null;

    const p2y = p2Valid ? dxv! : 0;    // dxv ist absolute X-Koordinate von P2
    const p2t = p2Valid ? dtv! : tMin; // dtv ist absolute t-Koordinate von P2

    // Shapes: immer 4 Einträge (opacity 0 = unsichtbar, kein Einfluss auf Hover)
    const shapes: Partial<Plotly.Shape>[] = [
      // 1. XA-Linie
      {
        type: 'line', x0: tMin, x1: tMax,
        y0: xA ?? 0, y1: xA ?? 0,
        xref: 'x', yref: 'y',
        line: { color: 'blue', width: 2, dash: 'dash' },
        opacity: xaXeValid ? 1 : 0,
      },
      // 2. XE-Linie
      {
        type: 'line', x0: tMin, x1: tMax,
        y0: xE ?? 0, y1: xE ?? 0,
        xref: 'x', yref: 'y',
        line: { color: 'blue', width: 2, dash: 'dash' },
        opacity: xaXeValid ? 1 : 0,
      },
      // 3. t0-Linie (bei ungültigem t0 auf tMin setzen damit Autorange nicht gestört wird)
      {
        type: 'line',
        x0: t0Valid ? t0num : tMin, x1: t0Valid ? t0num : tMin,
        y0: xA ?? 0, y1: xE ?? 0,
        xref: 'x', yref: 'y',
        line: { color: 'orange', width: 2, dash: 'dot' },
        opacity: xaXeValid && t0Valid ? 1 : 0,
      },
      // 4. Wendetangente
      {
        type: 'line',
        x0: tangentValid ? t1Calc! : tMin, y0: xA ?? 0,
        x1: tangentValid ? t2Calc! : tMin, y1: xE ?? 0,
        xref: 'x', yref: 'y',
        line: { color: 'darkorange', width: 2 },
        opacity: tangentValid ? 1 : 0,
      },
    ];

    // Annotations: immer 6 Einträge (visible:false = unsichtbar UND kein Autorange-Einfluss)
    const annotations: Partial<Plotly.Annotations>[] = [
      // 1. t0-Label
      {
        x: t0Valid ? t0num : tMin, y: xA ?? 0,
        xref: 'x', yref: 'y',
        text: 't₀', showarrow: false, yshift: -18,
        font: { size: 12, color: 'orange' },
        visible: xaXeValid && t0Valid,
      },
      // 2. WP-Label
      {
        x: p1Valid ? tWPv! : tMin, y: p1Valid ? xWPv! : 0,
        xref: 'x', yref: 'y',
        text: 'WP', showarrow: true, ax: 20, ay: -20,
        font: { size: 11, color: 'darkorange' }, arrowcolor: 'darkorange',
        visible: p1Valid,
      },
      // 3. P₂-Label
      {
        x: p2t, y: p2y,
        xref: 'x', yref: 'y',
        text: 'P₂', showarrow: true, ax: 20, ay: -20,
        font: { size: 11, color: 'darkorange' }, arrowcolor: 'darkorange',
        visible: p2Valid,
      },
      // 4. t₁-Label
      {
        x: tangentValid ? t1Calc! : tMin, y: xA ?? 0,
        xref: 'x', yref: 'y',
        text: 't₁', showarrow: true, ax: -30, ay: 20,
        font: { size: 14, color: 'darkorange' }, arrowcolor: 'darkorange',
        visible: tangentValid,
      },
      // 5. t₂-Label
      {
        x: tangentValid ? t2Calc! : tMin, y: xE ?? 0,
        xref: 'x', yref: 'y',
        text: 't₂', showarrow: true, ax: 20, ay: -20,
        font: { size: 14, color: 'darkorange' }, arrowcolor: 'darkorange',
        visible: tangentValid,
      },
      // 6. Σ₁-Annotation M1 (unteres Diagramm, Mode 4)
      {
        x: timeData.length > 0 ? timeData[timeData.length - 1] : 0,
        y: cumSumTotal ?? 0,
        xref: 'x2', yref: 'y2',
        text: cumSumTotal !== null ? `Σ₁ = ${cumSumTotal.toFixed(4)}` : '',
        showarrow: true, arrowhead: 2, ax: -60, ay: -20,
        font: { size: 12, color: 'red' }, arrowcolor: 'red',
        visible: showMode === 4 && cumSumTotal !== null && showM1,
      },
      // 7. Σ₂-Annotation M2 (unteres Diagramm, Mode 4)
      {
        x: timeData.length > 0 ? timeData[timeData.length - 1] : 0,
        y: cumSumTotal2 ?? 0,
        xref: 'x2', yref: 'y2',
        text: cumSumTotal2 !== null ? `Σ₂ = ${cumSumTotal2.toFixed(4)}` : '',
        showarrow: true, arrowhead: 2, ax: -60, ay: -40,
        font: { size: 12, color: '#7b1fa2' }, arrowcolor: '#7b1fa2',
        visible: showMode === 4 && cumSumTotal2 !== null && showM2,
      },
    ];

    // Marker-Traces: immer 4 Einträge, visible steuert Sichtbarkeit
    traces.push({
      x: p1Valid ? [tWPv!] : [tMin], y: p1Valid ? [xWPv!] : [0],
      mode: 'markers', name: 'P₁ = WP (Eingabe)',
      marker: { color: 'darkorange', size: 10, symbol: 'diamond' },
      xaxis: 'x', yaxis: 'y', hoverinfo: 'skip', visible: p1Valid,
    } as Plotly.Data);

    traces.push({
      x: [p2t], y: [p2y],
      mode: 'markers', name: 'P₂ (zweiter Tangentenpunkt)',
      marker: { color: 'darkorange', size: 10, symbol: 'diamond' },
      xaxis: 'x', yaxis: 'y', hoverinfo: 'skip', visible: p2Valid,
    } as Plotly.Data);

    traces.push({
      x: tangentValid ? [t1Calc!] : [tMin], y: [xA ?? 0],
      mode: 'markers', name: 't₁ (Tangente ∩ XA)',
      marker: { color: 'darkorange', size: 9, symbol: 'circle' },
      xaxis: 'x', yaxis: 'y', hoverinfo: 'skip', visible: tangentValid,
    } as Plotly.Data);

    traces.push({
      x: tangentValid ? [t2Calc!] : [tMin], y: [xE ?? 0],
      mode: 'markers', name: 't₂ (Tangente ∩ XE)',
      marker: { color: 'darkorange', size: 9, symbol: 'square' },
      xaxis: 'x', yaxis: 'y', hoverinfo: 'skip', visible: tangentValid,
    } as Plotly.Data);

    // 9. Unsichtbarer Y-Anker: zwingt Autorange XA und XE einzuschließen sobald xaXeValid
    traces.push({
      x: [tMin, tMax],
      y: xaXeValid ? [xA!, xE!] : [xData[0], xData[xData.length - 1]],
      mode: 'markers',
      marker: { size: 1, opacity: 0, color: 'rgba(0,0,0,0)' },
      hoverinfo: 'skip',
      showlegend: false,
      xaxis: 'x', yaxis: 'y',
    } as Plotly.Data);

    // ── Layout ──────────────────────────────────────────────────────────────
    const layout: Partial<Plotly.Layout> = {
      title: { text: fileName || 'PT1TT – Wendetangente', y: 0.97 },
      grid: {
        rows: 2, columns: 1,
        roworder: 'top to bottom',
        pattern: 'independent',
        heights: [0.67, 0.33],
        ygap: 0.05,
      } as Plotly.Layout['grid'],
      xaxis:  { title: { text: varNames.time || 'Zeit' } },
      yaxis:  { title: { text: varNames.x    || 'x(t)' } },
      xaxis2: { title: { text: varNames.time || 'Zeit' }, matches: 'x' },
      yaxis2: { title: { text: y2title } },
      shapes,
      annotations,
      margin: { t: 50, r: 20, b: 40, l: 60 },
      autosize: true,
    };

    Plotly.react(div, traces, layout, { responsive: true });
  }, [state, derived]);

  return (
    <div
      ref={divRef}
      style={{ width: '100%', height: '100%', background: '#fafafa' }}
    />
  );
}
