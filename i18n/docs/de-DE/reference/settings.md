<!-- source: dd9e41dac7e3 -->

# Einstellungen und Konfiguration

Die Einstellungen liegen in `app_config.json` im Konfigurationsverzeichnis der App. Die Datei ist zum Lesen und Bearbeiten gedacht: Vibe überwacht sie und übernimmt eine externe Änderung ohne Neustart. **Einstellungen → Agenten → Konfigurationsdatei** öffnet sie.

## Speicherort der Konfigurationsdatei

| Plattform | Verzeichnis |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

Das Verzeichnis behält seine Upstream-Kennung, daher ist der Name gegenüber früheren Builds unverändert.

## Einstellungsbereiche

| Bereich | Enthält |
| --- | --- |
| Allgemein | Anzeigesprache, Thema, Updates, Weiterlaufen im Infobereich, Start bei Anmeldung, Ruhezustand verhindern |
| Datenschutz | Ob Projekte gespeichert werden, und die Datenschutzerklärung |
| Transkription | Sprache, automatischer Export, Ton und Fokus bei Abschluss, Projektordner |
| Modelle | CPU/GPU-Wahl, GPU-Gerät, Modellkatalog, Sprechertrennungsmodell |
| Feinabstimmung | Whisper-Optionen, Audioverarbeitung, Modellspeicher und Entlade-Timeout |
| Aufnahme | Besprechungsbrowser, Besprechungserkennung, automatisches Transkribieren, Aufnahme-Kurzbefehl, Berechtigungen unter macOS |
| Diktat | Diktat-Kurzbefehl und Aktivierungsmodus |
| KI | Zusammenfassungen und Diktataufgaben, Plattformverbindung |
| Telefon | Übergabe vom Telefon, Kopplung, gekoppelte Geräte |
| Agenten | Lokale API, Agent-Skill, Konfigurationsdatei |
| Erweitert | Protokolle, Diagnose und Entwicklersteuerungen |

## Wichtige Werte

| Schlüsselgruppe | Bedeutung |
| --- | --- |
| `transcription.*` | Sprache, Prompt, Diarisierung, Zeitstempel, Aufteilung langer Aufnahmen |
| `model.*` | Ausgewähltes Modell, Anzeigenamen, GPU-Gerät, Nur-CPU-Schalter, Entlade-Timeout |
| `transcript.*` | Exportformat, Zeitstempel, Sprecher, automatischer Export |
| `recording.*` | Eingabe- und Ausgabegeräte, Besprechungserkennung, Aufnahme-Kurzbefehl |
| `ai.*` | Plattform, Basis-URL, Schlüssel, Modell, Prompt und Schalter pro Aufgabe |
| `general.updateChannel` | `stable`, `beta` oder `dev` |
| `handoff.pairing` | Gekoppelte Telefongeräte und Anmeldeinformations-Hashes |

Die genauen Feldnamen sind stabil genug zum Bearbeiten, aber die App besitzt das Schema: Ändern Sie einen Wert über die Einstellungsoberfläche, wenn es eine gibt, und lassen Sie die App die Datei neu schreiben, statt sie als Ganzes zu ersetzen.

## Verwandte Seiten

- [Update-Kanäle wechseln](/vibe/docs#switch-update-channels) für die Kanaleinstellung.
- [Transkript zusammenfassen](/vibe/docs#summarize-transcripts) für die KI-Verbindung.
- [Vom Telefon transkribieren](/vibe/docs#transcribe-from-a-phone) für die Übergabeeinstellungen.
