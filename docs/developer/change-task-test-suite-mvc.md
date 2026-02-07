# Änderungsaufgabe: Test-Suite auf MVC-Architektur anpassen

## Ziel
Die komplette Test-Suite soll zur aktuellen Model-View-Controller-Architektur passen. Insbesondere muss die Spiellogik unabhängig von der Anzeige testbar sein und View-spezifische Tests dürfen den Model- und Controller-Layer nicht mehr direkt beeinflussen.

## Kontext
Die Architektur wurde auf MVC umgestellt. Dadurch sind Zustände und Regeln in das Model gewandert, Views rendern den Zustand, und Controller übersetzen Eingaben in Model-Aktionen. Die bisherigen Tests sind auf die alte Struktur zugeschnitten und müssen neu ausgerichtet werden.

## Umfang
- **Model**: Unit- und Integrationstests für Spiellogik ohne Rendering-Abhängigkeiten.
- **Controller**: Tests für Input-Handling und die korrekte Weitergabe von Aktionen an das Model.
- **View**: Renderer- und Scene-Tests nur für Darstellung und UI-Bindings, inklusive minimaler Stubs.
- **Test Utilities**: Aktualisierung aller Test-Helper und Mocks.
- **E2E**: Anpassung der End-to-End-Tests an neue Einstiegspunkte und Zustandsflüsse.

## Aufgabenpakete

### 1) Testinventar erfassen und neu zuordnen
- [ ] Alle bestehenden Test-Suites inventarisieren (Datei, Zweck, Abhängigkeiten).
- [ ] Tests nach Layer (Model/Controller/View/E2E) reklassifizieren.
- [ ] Veraltete Tests markieren und Kandidaten für Refactor/Removal definieren.

### 2) Model-Tests aufbauen
- [ ] Neue Unit-Tests für Model-Zustände und Regeln anlegen.
- [ ] Tests für deterministische `step`-/Tick-Logik hinzufügen.
- [ ] Tests für Randfälle (Level-Up, Tod, Game-Over, Punkte, Power-Pellets) ergänzen.
- [ ] Model-Tests ohne Phaser-Abhängigkeit erzwingen (Node-Umgebung).

### 3) Controller-Tests aufbauen
- [ ] Tests für Input-Mapping (Keys/Touch → Actions) schreiben.
- [ ] Tests für Pause/Resume/Replay-Befehle als reine Controller-Aktionen.
- [ ] Sicherstellen, dass Controller nur Model-APIs nutzt (keine View-Abhängigkeiten).

### 4) View-Tests vereinfachen
- [ ] Phaser-Mocks auf reine Darstellung reduzieren.
- [ ] Snapshot-/Rendering-Tests nur für UI-Text/Anzeigen.
- [ ] Keine Spiellogik im View-Test zulassen (klarer Layer-Gate).

### 5) Test-Utilities & Mocks aktualisieren
- [ ] Helper für Model-Instanzierung und deterministische Simulationen erstellen.
- [ ] Mocks für Controller-Inputs hinzufügen.
- [ ] Phaser-Mock auf minimalen Renderer-Scope reduzieren.

### 6) E2E-Tests anpassen
- [ ] E2E-Flows an neue Szene- oder Einstiegspunkte anpassen.
- [ ] Stabilitäts-Checks (z. B. „Start → Play → Win/Lose“) aktualisieren.
- [ ] Event- und Telemetrie-Hooks prüfen.

## Akzeptanzkriterien
- [ ] Alle Tests laufen gegen die MVC-Struktur ohne direkte Kopplung an Rendering.
- [ ] Model-Tests laufen headless ohne Phaser.
- [ ] Controller-Tests prüfen ausschließlich Input→Action-Übersetzung.
- [ ] View-Tests prüfen ausschließlich Darstellung/Binding.
- [ ] E2E-Tests decken Kernflows ab.
- [ ] Test-Utilities und Mocks sind dokumentiert und konsistent.

## Notizen
- Wenn möglich, neue Tests zuerst am Model aufbauen, dann Controller, zuletzt View/E2E.
- Testabdeckung für Model-Logik priorisieren.
