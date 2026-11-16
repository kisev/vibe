<!-- source: 648b5aad742b -->

# Mikrofon und Systemaudio aufnehmen

Vibe nimmt von den ausgewählten Geräten auf und transkribiert anschließend die Aufnahme. Diese Anleitung gilt für Anrufe, Besprechungen und Audio, das gerade abgespielt wird statt als Datei vorzuliegen. [Unterstützte Formate](/vibe/docs#formats) behandelt Dateien.

## Geräte auswählen

1. Öffnen Sie Vibe und wählen Sie **Aufnehmen**.
1. Wählen Sie unter **Mikrofon** das Eingabegerät. Vibe merkt sich das Gerät anhand des Namens.
1. Wählen Sie unter **Audio-Lautsprecher** das Ausgabegerät, um Systemaudio aufzunehmen. Wählen Sie **Keine**, um nur das Mikrofon aufzunehmen.

Die Aufnahme beider Geräte führt sie mit ffmpeg zu einer Spur zusammen, sodass beide Seiten eines Anrufs im selben Transkript landen.

## Berechtigungen unter macOS erteilen

Öffnen Sie **Einstellungen → Aufnahme → Berechtigungen** und erteilen Sie, was die Aufnahme benötigt:

| Berechtigung | Verwendet für |
| --- | --- |
| Mikrofon | Mikrofon-Audio |
| Systemaudio | Auf dem Mac abgespieltes Audio (Bildschirm- & Systemaudioaufnahme) |

Ohne die Berechtigung für Systemaudio öffnet macOS den Loopback-Stream, nimmt aber Stille auf, sodass die Aufnahme unbrauchbar ist.

## Aufnehmen und transkribieren

1. Drücken Sie **Aufnehmen**.
1. Verwenden Sie **Stopp**, wenn der Anruf endet.
1. Die Aufnahme öffnet sich mit einer Sprachauswahl. Wählen Sie eine Sprache oder lassen Sie sie auf Automatisch.
1. Drücken Sie **Transkribieren**.

Wenn **Aufnahmen automatisch transkribieren** unter **Einstellungen → Aufnahme** aktiviert ist, startet der letzte Schritt von selbst.

## Nächste Schritte

- [Transkript zusammenfassen](/vibe/docs#summarize-transcripts), nachdem die Aufnahme beendet ist.
- [Besprechungsbrowser verwenden](/vibe/docs#use-the-meeting-browser), um einen Anruf in Vibe aufzunehmen.
