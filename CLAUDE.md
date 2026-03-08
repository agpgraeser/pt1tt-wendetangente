# PT1TT-Berechnung – Projektnotizen

## Projektbeschreibung
Web-App zur PT1TT-Parameterbestimmung über 3-Punkte-Methode (Zeitpunkt-Eingabe).
- **Framework:** React + Vite (TypeScript)
- **UI:** Material UI (MUI)
- **Visualisierung:** Plotly.js
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
    ParameterPanel.tsx – Zeitpunkt-Eingabe und Parameterausgabe
    ResponseChart.tsx  – Diagramm-Anzeige
  store/               – Zustandsverwaltung
  types/               – TypeScript-Typen
  utils/               – Berechnungslogik
```

## Git-Verlauf (Auszug)
- t0 Startwert auf -100 gesetzt (Validierung zeigt Feld rot)
- Modellberechnung nur bei vollständigen und gültigen Zeitpunkten
- Eingaben löschen wenn neuer Excel-File geladen

## Verlauf Zusammenarbeit mit Claude
- **2026-02-22:** CLAUDE.md angelegt

## Offene Punkte / Nächste Schritte
- (hier eintragen was als nächstes gemacht werden soll)
