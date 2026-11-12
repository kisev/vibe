<!-- source: 03e5a04c40fd -->

# Vibe installieren

Diese Anleitung führt einen neuen Rechner vom Download zu einem laufenden Vibe-Fenster. Sie setzt einen Desktop mit Internetverbindung und ohne vorhandene Installation voraus. [Erste Aufnahme transkribieren](/vibe/docs#first-transcription) ist der nächste Schritt.

## Installationsprogramm herunterladen

Öffnen Sie die [Downloadseite](https://kisev.github.io/vibe/) und wählen Sie den Build für diesen Rechner:

| Plattform | Build |
| --- | --- |
| Windows | `.exe`-Installationsprogramm |
| macOS, Apple silicon | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` oder `.rpm`, x86-64 oder arm64 |

Dieselben Dateien hängen an jedem [GitHub-Release](https://github.com/kisev/vibe/releases). Das Linux-`.deb` deklariert seine Laufzeitabhängigkeiten, einschließlich `ffmpeg`.

## Installieren und öffnen

1. Führen Sie das Installationsprogramm aus und folgen Sie den Anweisungen.
1. Öffnen Sie Vibe aus dem Anwendungsmenü oder führen Sie `vibe` in einem Terminal aus.

Release-Builds sind nicht signiert. Unter macOS erfordert der erste Start einen Rechtsklick → **Öffnen** im Finder, um Gatekeeper zu passieren; spätere Starts öffnen normal. Windows SmartScreen zeigt aus demselben Grund möglicherweise eine Warnung.

## Einrichtung abschließen

Beim ersten Start bietet Vibe das Standardmodell an. Bestätigen Sie den Download und warten Sie, bis er abgeschlossen ist. Das Modell wird lokal gespeichert und bei jedem späteren Lauf wiederverwendet; [Modelle](/vibe/docs#models) listet die Alternativen.

Das Fenster ist bereit, sobald der Ablagebereich und die Aktionen **Aufnehmen** und **Von Link** sichtbar sind.

## Nächste Schritte

- [Erste Aufnahme transkribieren](/vibe/docs#first-transcription) nutzt diese Installation.
- [Unterstützte Formate](/vibe/docs#formats) listet, was Vibe öffnen und exportieren kann.
- [Absturz beheben](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) behandelt Protokolle und Diagnose, falls sich das Fenster nicht öffnet.
