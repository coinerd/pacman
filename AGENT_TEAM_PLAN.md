# Pacman Code Review - Pi Agent Team Plan

## 📊 Zusammenfassung der Code Review

**Session:** lucky-valley (2h27m, abgebrochen)
**Modell:** Z.AI GLM-5
**Projekt:** /root/src/pacman

---

## 🔍 Gefundene Schwächen

### 1. Lint-Fehler
- **35+ Warnungen**
- **12 Errors**
- Priorität: **HOCH** (Code-Qualität)

### 2. Backup-Dateien
- `GameModel.backup.js`
- `TechSoundManager.legacy.js`
- Priorität: **NIEDRIG** (Cleanup)

### 3. Failed Tests
- **5 Test-Dateien** in `.failed/` Verzeichnis
- Priorität: **HOCH** (Test-Integrität)

### 4. Test-Abdeckung
- **Statements:** 46.4% ❌ (Threshold: 70%)
- **Branches:** 40.94% ❌ (Threshold: 70%)
- **Tests:** 1575 passed, 41 skipped, 15 archiviert
- Priorität: **MITTEL** (langfristiges Ziel)

---

## 🤖 Pi Agent Team Plan

### Phase 1: Cleanup (30 Min)
**Agent:** `cleanup-agent`
**Aufgabe:** Backup-Dateien entfernen
**Commands:**
```bash
cd /root/src/pacman
rm GameModel.backup.js
rm TechSoundManager.legacy.js
git add -A
git commit -m "chore: remove backup files"
```
**Erfolgskriterien:**
- Backup-Dateien entfernt
- Git commit erstellt

---

### Phase 2: Failed Tests Reparieren (2-3h)
**Agent:** `test-repair-agent`
**Aufgabe:** 5 Failed Test-Dateien in `.failed/` reparieren
**Commands:**
```bash
cd /root/src/pacman
# Analysiere failed tests
ls -la .failed/
# Repariere jede Test-Datei
# Führe Tests aus
npm test
```
**Erfolgskriterien:**
- Alle Tests in `.failed/` repariert
- `npm test` läuft erfolgreich durch
- Keine archivierten Tests mehr

---

### Phase 3: Lint-Fehler Beheben (2-3h)
**Agent:** `lint-fix-agent`
**Aufgabe:** 35+ Warnungen und 12 Errors beheben
**Commands:**
```bash
cd /root/src/pacman
# Lint ausführen
npm run lint
# Auto-fix wo möglich
npm run lint -- --fix
# Manuelle Fixes für verbleibende Fehler
```
**Erfolgskriterien:**
- 0 Errors
- Warnungen minimiert
- Code formatiert

---

### Phase 4: Test-Abdeckung Verbessern (4-6h)
**Agent:** `coverage-agent`
**Aufgabe:** Test-Abdeckung von ~46% auf 70% erhöhen
**Commands:**
```bash
cd /root/src/pacman
# Coverage Report analysieren
npm run test:coverage
# Neue Tests schreiben für ungedeckte Bereiche
# Fokus auf Statements und Branches
```
**Erfolgskriterien:**
- Statements: ≥70%
- Branches: ≥70%
- Alle kritischen Pfade getestet

---

## 🎯 Empfohlene Reihenfolge

1. **Phase 1:** Cleanup (schnell, einfach)
2. **Phase 2:** Failed Tests (wichtig für Integrität)
3. **Phase 3:** Lint-Fixes (Code-Qualität)
4. **Phase 4:** Test-Abdeckung (langfristig)

---

## 🚀 Nächste Schritte

**Option A:** Alle Phasen sequenziell ausführen
**Option B:** Priorisierte Phasen auswählen
**Option C:** Parallel Agents für unabhängige Phasen

**Empfehlung:** Sequenziell, da:
- Phase 2 (Failed Tests) Voraussetzung für Phase 4
- Phase 3 (Lint) kann parallel zu Phase 2 laufen
- Phase 1 (Cleanup) ist schnell erledigt

---

## 📝 Notizen

- **GLM-5 ist langsam:** Code Review hat 2h27m gedauert
- **Empfehlung:** Für Team-Tasks vielleicht schnelleres Modell verwenden
- **Alternative:** Claude oder GPT-4 für komplexere Aufgaben

---

**Erstellt:** 2026-03-16
**Status:** Bereit für Team-Start
