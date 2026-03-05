# Gameplay-Finetuning Guide (Enemy-AI & Maze)

Diese Anleitung beschreibt, wie ihr das neue Balancing-System kontrolliert nachschärft, ohne die Fairness zu verlieren.

## 1) Zielbild für gutes Gameplay

Beim Finetuning sollten diese vier Qualitätsziele gleichzeitig erfüllt sein:

1. **Lesbarkeit**: Spieler:innen können Enemy-Verhalten antizipieren.
2. **Druck ohne Checkmate**: Enemies bedrohen den Spieler, lassen aber Fluchtoptionen.
3. **Konsistenz zwischen Seeds**: Schwierigkeit schwankt, aber nicht extrem.
4. **Stabilität über Skill-Level**: DDA hilft schwächeren Spieler:innen, ohne starke Spieler:innen zu langweilen.

---

## 2) Wo werden die Parameter eingestellt?

Primäre Balancing-Quelle ist `src/config/gameConfig.js`:

- `enemyAIConfig`: State-Zyklus, Telegrapher, Rollenparameter
- `enemyAICaps`: harte Grenzen (z. B. minimale Scatter-Dauer)
- `aiWeights` / `ai_weights`: Gewichtungen für Richtungsentscheidung
- `enemyProfiles`: Rollenprofile pro Gegner (alpha/beta/gamma/delta)
- `adaptiveDifficultyConfig`: EMA, Clamp-Grenzen, Defaults für DDA

Maze-Fairness liegt in `src/utils/MazeGenerator.js` (Generator-Constraints + Retry/Fallback).

---

## 3) Empfohlener Finetuning-Workflow (pro Iteration)

1. **Hypothese formulieren** (z. B. „Midgame fühlt sich zu pinched an").
2. **Nur 1–2 Parameterblöcke ändern** (kein Big-Bang).
3. **Seed-Simulation laufen lassen**:
   - `npm run simulate:seeds`
   - `npm run kpi:gate`
4. **Outlier-Seeds prüfen** (`tests/regression/seed-outliers.json`).
5. **In-Game Smoke-Test** (mindestens Easy/Normal/Hard kurz spielen).
6. **Erst dann nächste Iteration starten**.

Regel: Keine Parameter-Freigabe ohne KPI-Vergleich gegen den vorherigen Stand.

---

## 4) Finetuning der Enemy-AI

## 4.1 State-Zyklus (Scatter/Chase/Frightened)

Wenn das Spiel **zu stressig** wirkt:
- Scatter-Dauer leicht erhöhen (`enemyAIConfig.stateCycle` bzw. DDA-`scatterDuration`-Grenzen).
- Randomness geringfügig erhöhen (mehr Atemfenster).

Wenn das Spiel **zu harmlos** wirkt:
- Scatter moderat reduzieren (nie unter `enemyAICaps.minScatterSeconds`).
- Aggressiveness einzelner Profile leicht erhöhen statt global alles schneller zu machen.

## 4.2 Gewichtungen (`aiWeights`)

Sinnvolle Reihenfolge für Anpassungen:

1. `reversePenalty` (verhindert „Ping-Pong“-Wendungen)
2. `antiClusterPenalty` / `diversityFactor` (gegen Gegner-Stacking)
3. `targetDistance` vs. `playerDistance` (Druckprofil)
4. `randomness` (klein halten, sonst wirkt AI beliebig)

Faustregel: pro Iteration nur ±5–10 % auf einzelne Gewichte.

## 4.3 Rollenprofile (`enemyProfiles`)

Anpassungen bevorzugt profilorientiert:

- **Alpha** zu dominant? `aggressiveness` oder `playerDistanceBias` etwas entschärfen.
- **Beta** zu unberechenbar? `predictionHorizon` reduzieren oder `reactionTime` erhöhen.
- **Gamma/Delta** erzeugen unfairen Raumdruck? `bottleneckBias` weniger negativ setzen.

So bleibt die Rollenidentität erhalten, statt alles zu nivellieren.

---

## 5) Finetuning der Maze-Generierung

Wenn Spieler:innen häufig früh sterben oder sich „eingesperrt“ fühlen:

- `deadEndDensityThreshold` senken
- `maxStraightCorridorLength` senken
- `spawnSafetyMinFreedomSteps` erhöhen
- `minAlternativePaths` erhöhen

Wenn Maps zu offen/leicht werden:

- `minAlternativePaths` nicht weiter erhöhen
- `maxStraightCorridorLength` moderat erhöhen
- `pathDensity` vorsichtig reduzieren

Wichtig: Mit höheren Fairness-Ansprüchen steigt die Retry-Quote. Deshalb `maxRetries` und Laufzeit im Blick behalten.

---

## 6) DDA richtig abstimmen

DDA sollte unterstützen, nicht „schummeln“. Deshalb:

- `emaAlpha` nicht zu hoch setzen (sonst oszilliert Schwierigkeit).
- Clamp-Grenzen eng halten (`adaptiveDifficultyConfig.clamps`).
- Nur kleine Änderungen je Profilbereich zulassen.
- Profilwechsel ausschließlich an Abschnitts-/Runden-Grenzen anwenden.

Warnsignal: Wenn Tester:innen „sprunghafte“ Schwierigkeit melden, zuerst EMA und Clamp-Spannen prüfen.

---

## 7) KPI-Korridore als Gate nutzen

Definiert pro Schwierigkeitsgrad Zielkorridore in `tools/kpi-targets.json` für:

- `survivalSeconds`
- `winRate`
- `deadEndEncounterRate`
- `maxOutlierRate`

Empfehlung:
- Korridore nicht zu eng setzen (verhindert sinnvolle Innovation).
- Aber eng genug, um Frust-Ausreißer zuverlässig zu erkennen.

---

## 8) Troubleshooting-Checkliste

- Zu viele Outlier-Seeds? → Maze-Constraints + `aiWeights.randomness` prüfen.
- Frühe Tode häufen sich? → Spawn-Safety und erste Scatter-Phasen prüfen.
- Gegner wirken „gleich“? → `enemyProfiles`-Differenzierung erhöhen.
- Difficulty springt stark? → `emaAlpha` senken, Clamp-Spannen verkleinern.

---

## 9) Team-Konventionen für Balancing-PRs

Jede Balancing-Änderung sollte enthalten:

1. Kurze Design-Intention („Was soll sich für Spieler ändern?“)
2. Geänderte Parameterliste
3. KPI-Vorher/Nachher
4. Liste neuer/bleibender Outlier-Seeds
5. Einschätzung von Risiko (zu leicht/zu schwer/Performance)

Damit bleiben Entscheidungen nachvollziehbar und reversibel.
