# PT1TT Wendetangente – Projektnotizen

## Projektbeschreibung
Web-App zur PT1TT-Parameterbestimmung über die **Wendetangenten-Methode**.
Eingabe zweier Punkte auf der Messkurve (P₁=Wendepunkt, P₂=zweiter Tangentenpunkt),
daraus Berechnung der Wendetangente und der Kennwerte TT, TG (Küpfmüller) bzw. TG1 (Modifiziert).

- **Framework:** React + Vite (TypeScript)
- **UI:** Material UI (MUI)
- **Visualisierung:** Plotly.js (direkt, kein react-plotly.js)
- **Excel-Import:** xlsx
- **Start:** `npm run dev`

## Projektstruktur
```
src/
  App.tsx
  main.tsx
  theme.ts
  components/
    ExcelImport.tsx    – Excel-Datei laden
    ParameterPanel.tsx – Parametereingabe und Ergebnisanzeige
    ResponseChart.tsx  – Plotly-Diagramm (2 Subplots)
  store/
    reducer.ts         – Zustandsverwaltung (useReducer)
  types/
    index.ts           – TypeScript-Typen
  utils/
    pt1ttMath.ts       – Berechnungslogik (Tangente, Modell, Fehlermetriken)
    tooltips.ts        – Tooltip-Texte
```

## Mathematik
- **Eingabe:** P₁=(XWP, tWP), P₂=(X₂, t₂) – beide als absolute Koordinaten
- **Steigung:** a = (X₂ − XWP) / (t₂ − tWP)
- **Schnittpunkte:** tS1 = tWP + (XA − XWP) / a,  tS2 = tWP + (XE − XWP) / a
- **Methode 1 (Küpfmüller):** TT = tS1 − t0,  TG = tS2 − tS1
- **Methode 2 (Modifiziert):** TT = tS1 − t0,  TG1 = tS2 − tWP
- **Methode 3:** beide Methoden parallel

## Wichtige Implementierungsdetails
- `Plotly.react()` in `useEffect` — kein react-plotly.js-Wrapper
- Shapes/Annotations/Marker-Traces immer **konstante Arraygröße** → verhindert SVG-Rebuild und Hover-Reset
  - Shapes: immer 4 Einträge, Sichtbarkeit per `opacity`
  - Annotations: immer 7 Einträge, Sichtbarkeit per `visible`
  - Marker-Traces: immer 4 Pushes; Basis-Traces immer 5 (traceX, M1, M2, lower1, lower2)
  - Unsichtbarer Y-Anker-Trace erzwingt Autorange auf XA/XE
- `xaxis2: { matches: 'x' }` synchronisiert beide Zeitachsen
- Annotations mit `visible: false` haben keinen Einfluss auf Autorange
- Shapes haben generell keinen Einfluss auf Autorange

## Validierungsregeln (ParameterPanel)
- XWP: strikt zwischen XA und XE (XA < XWP < XE)
- X₂: XWP < X₂ < XE
- t₂: t₂ > tWP
- t0: ≥ 0

## Git-Verlauf
- **9fe39cf** – Initialer Commit: PT1TT Wendetangenten-Methode
- **V1-Einsatzfähig** – Erste einsatzfähige Version (2026-03-09)

## Verlauf Zusammenarbeit mit Claude
- **2026-02-22:** CLAUDE.md angelegt
- **2026-03-09:** V1 fertiggestellt – Tangenten-Berechnung, Hover-Stabilität, Fehlermetriken für beide Modelle, Zeitachsen-Synchronisierung

## Offene Punkte / Nächste Schritte
- (hier eintragen was als nächstes gemacht werden soll)
