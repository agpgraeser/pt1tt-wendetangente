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
    const { modelData1, modelData2, diffs, diffSquared, cumSum, cumSumTotal, t1Calc, t2Calc } = derived;

    const xA  = parseNum(state.xA);
    const xE  = parseNum(state.xE);
    const t0v = parseNum(state.t0);
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

    const traceY: Plotly.Data = {
      x: timeData, y: yData,
      mode: 'lines', name: 'Eingang Y',
      line: { width: 2, color: 'green' },
      xaxis: 'x2', yaxis: 'y2',
    };

    const traceDiff: Plotly.Data = {
      x: timeData, y: diffs,
      mode: 'lines', name: 'Abweichung Δx(t)',
      line: { color: 'red', width: 2 },
      xaxis: 'x2', yaxis: 'y2',
    };

    const traceDiffsqr: Plotly.Data = {
      x: timeData, y: diffSquared,
      mode: 'lines', name: 'Δx²(t)',
      line: { color: 'red', width: 2 },
      xaxis: 'x2', yaxis: 'y2',
    };

    const traceCumSum: Plotly.Data = {
      x: timeData, y: cumSum,
      mode: 'lines', name: 'Σ Δx²·Δt',
      line: { color: '#7b1fa2', width: 2 },
      xaxis: 'x2', yaxis: 'y2',
    };

    let traces: Plotly.Data[];
    let y2title: string;

    if (showMode === 1) {
      traces = [traceX, traceModel1, traceModel2, traceY];
      y2title = 'Stellgröße y(t)';
    } else if (showMode === 2) {
      traces = [traceX, traceModel1, traceModel2, traceDiff];
      y2title = 'Abweichung Δx(t)';
    } else if (showMode === 3) {
      traces = [traceX, traceModel1, traceModel2, traceDiffsqr];
      y2title = 'Δx²(t)';
    } else {
      traces = [traceX, traceModel1, traceModel2, traceCumSum];
      y2title = 'Σ Δx²·Δt';
    }

    // ── Shapes & Annotations ────────────────────────────────────────────────
    const xaXeValid = xA !== null && xE !== null;
    const shapes: Partial<Plotly.Shape>[]       = [];
    const annotations: Partial<Plotly.Annotations>[] = [];

    // XA / XE horizontale Referenzlinien
    if (xaXeValid) {
      shapes.push({
        type: 'line', x0: tMin, x1: tMax, y0: xA!, y1: xA!,
        xref: 'x', yref: 'y',
        line: { color: 'red', width: 2, dash: 'dash' },
      });
      shapes.push({
        type: 'line', x0: tMin, x1: tMax, y0: xE!, y1: xE!,
        xref: 'x', yref: 'y',
        line: { color: 'red', width: 2, dash: 'dash' },
      });
    }

    // t0 Vertikallinie — nur wenn t0 gültig (≥ 0)
    if (xaXeValid && t0v !== null && t0v >= 0) {
      shapes.push({
        type: 'line', x0: t0v, x1: t0v, y0: xA!, y1: xE!,
        xref: 'x', yref: 'y',
        line: { color: 'orange', width: 2, dash: 'dot' },
      });
      annotations.push({
        x: t0v, y: xA!, xref: 'x', yref: 'y',
        text: 't₀', showarrow: false, yshift: -18,
        font: { size: 12, color: 'orange' },
      });
    }

    // ── Tangentenpunkte, Gerade und Schnittpunkte ────────────────────────────

    // P₁ = Wendepunkt
    if (xWPv !== null && tWPv !== null) {
      traces.push({
        x: [tWPv], y: [xWPv],
        mode: 'markers', name: 'P₁ = WP (Eingabe)',
        marker: { color: 'darkorange', size: 10, symbol: 'diamond' },
        xaxis: 'x', yaxis: 'y',
        hoverinfo: 'skip',
      } as Plotly.Data);
      annotations.push({
        x: tWPv, y: xWPv, xref: 'x', yref: 'y',
        text: 'WP', showarrow: true, ax: 20, ay: -20,
        font: { size: 11, color: 'darkorange' }, arrowcolor: 'darkorange',
      });
    }

    // P₂ = zweiter Tangentenpunkt (immer zeigen wenn alle 4 Werte vorhanden)
    if (xWPv !== null && tWPv !== null && dxv !== null && dtv !== null) {
      const p2y = xWPv + dxv;
      const p2t = tWPv + dtv;
      traces.push({
        x: [p2t], y: [p2y],
        mode: 'markers', name: 'P₂ (zweiter Tangentenpunkt)',
        marker: { color: 'darkorange', size: 10, symbol: 'diamond' },
        xaxis: 'x', yaxis: 'y',
        hoverinfo: 'skip',
      } as Plotly.Data);
      annotations.push({
        x: p2t, y: p2y, xref: 'x', yref: 'y',
        text: 'P₂', showarrow: true, ax: 20, ay: -20,
        font: { size: 11, color: 'darkorange' }, arrowcolor: 'darkorange',
      });
    }

    // Tangentengerade (XA → XE) + Schnittpunktmarker
    if (xaXeValid && t1Calc !== null && t2Calc !== null) {
      shapes.push({
        type: 'line',
        x0: t1Calc, y0: xA!,
        x1: t2Calc, y1: xE!,
        xref: 'x', yref: 'y',
        line: { color: 'darkorange', width: 2 },
      });

      traces.push({
        x: [t1Calc], y: [xA!],
        mode: 'markers', name: 't₁ (Tangente ∩ XA)',
        marker: { color: 'darkorange', size: 9, symbol: 'circle' },
        xaxis: 'x', yaxis: 'y',
        hoverinfo: 'skip',
      } as Plotly.Data);
      annotations.push({
        x: t1Calc, y: xA!, xref: 'x', yref: 'y',
        text: 't₁', showarrow: true, ax: -30, ay: 20,
        font: { size: 11, color: 'darkorange' }, arrowcolor: 'darkorange',
      });

      traces.push({
        x: [t2Calc], y: [xE!],
        mode: 'markers', name: 't₂ (Tangente ∩ XE)',
        marker: { color: 'darkorange', size: 9, symbol: 'square' },
        xaxis: 'x', yaxis: 'y',
        hoverinfo: 'skip',
      } as Plotly.Data);
      annotations.push({
        x: t2Calc, y: xE!, xref: 'x', yref: 'y',
        text: 't₂', showarrow: true, ax: 20, ay: -20,
        font: { size: 11, color: 'darkorange' }, arrowcolor: 'darkorange',
      });
    }

    // Σ-Annotation im unteren Diagramm (Mode 4)
    if (showMode === 4 && cumSumTotal !== null && timeData.length > 0) {
      annotations.push({
        x: timeData[timeData.length - 1],
        y: cumSumTotal,
        xref: 'x2', yref: 'y2',
        text: `Σ = ${cumSumTotal.toFixed(4)}`,
        showarrow: true, arrowhead: 2, ax: -60, ay: -20,
        font: { size: 12, color: '#7b1fa2' }, arrowcolor: '#7b1fa2',
      });
    }

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
      xaxis:  { title: { text: varNames.time || 'Zeit' }, showspikes: false },
      yaxis:  { title: { text: varNames.x    || 'x(t)' }, showspikes: false },
      xaxis2: { title: { text: varNames.time || 'Zeit' }, showspikes: false },
      yaxis2: { title: { text: y2title }, showspikes: false },
      shapes,
      annotations,
      margin: { t: 50, r: 20, b: 40, l: 60 },
      autosize: true,
      hovermode: 'closest',
      hoverdistance: -1,
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
