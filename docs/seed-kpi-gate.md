# Seed KPI Gate

Dieses Dokument beschreibt den reproduzierbaren KPI-Gate-Workflow für Maze- und Enemy-Entscheidungen.

## Ziele

- Reproduzierbare Seed-Steuerung für Maze-Generierung und Enemy-Entscheidungs-Noise.
- Batch-Simulation über viele Seeds mit KPI-Ausgabe:
  - durchschnittliche Überlebenszeit
  - Winrate
  - Dead-end-Encounter-Rate
- KPI-Korridore pro Schwierigkeitsgrad (`easy`, `normal`, `hard`).
- Automatische Ausreißer-Erkennung (zu leicht/zu schwer) je Seed.
- Persistierung der Ausreißer als Regression-Fälle.
- Nutzung als Release-Gate in CI.

## Konfiguration

Die Korridore und Simulationsparameter liegen in `tools/kpi-targets.json`.

Wichtige Felder pro Schwierigkeit:

- `seedStart`, `seedCount`, `runsPerSeed`
- `kpiCorridors.survivalSeconds`
- `kpiCorridors.winRate`
- `kpiCorridors.deadEndEncounterRate`
- `maxOutlierRate` (Gate-Schwelle)

## Ausführung

```bash
npm run simulate:seeds
npm run kpi:gate
```

- `simulate:seeds` erzeugt KPI-Berichte und Ausreißerdatei ohne Exit-Fail.
- `kpi:gate` schlägt fehl, wenn die Outlier-Rate über `maxOutlierRate` liegt.

## Regression-Fälle

Ausreißer-Seeds werden gespeichert in:

- `tests/regression/seed-outliers.json`

Die Datei wird bei jedem Lauf neu erzeugt und kann als Baseline für spätere Regression-Checks dienen.

## Release-Gate

In GitHub Actions wird der Gate-Check vor Playwright ausgeführt (`.github/workflows/playwright.yml`).
