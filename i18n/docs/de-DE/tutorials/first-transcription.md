<!-- source: a0b0bbb0302c -->

# Erste Aufnahme transkribieren

Diese Anleitung transkribiert eine Mediendatei mit dem Standardmodell. Sie setzt voraus, dass Vibe installiert und das Standardmodell heruntergeladen ist; [Vibe installieren](/vibe/docs#install) behandelt das.

## Datei hinzufügen

1. Öffnen Sie Vibe.
1. Ziehen Sie eine Audio- oder Videodatei auf den Ablagebereich oder wählen Sie **Datei** und suchen Sie eine aus.
1. Warten Sie, bis die Datei in der Warteschlange erscheint.

Vibe akzeptiert die Formate aus [Unterstützte Formate](/vibe/docs#formats). Es normalisiert die Medien vor der Transkription mit ffmpeg, sodass ein ungewöhnlicher Container trotzdem funktionieren kann.

## Transkription starten

1. Lassen Sie die Sprache auf Automatisch oder wählen Sie eine Sprache, wenn die Erkennung danebenliegt.
1. Drücken Sie **Transkribieren**.
1. Verfolgen Sie die Live-Vorschau. **Abbrechen** stoppt den Lauf, ohne die Aufnahme zu löschen.

Die Desktop-App startet `vibe-server` im Hintergrund und sendet das Audio über lokales HTTP dorthin. Der Server lädt das ausgewählte Modell, transkribiert und liefert Segmente mit Zeitstempeln zurück.

## Ergebnis lesen

Das Transkript öffnet sich, wenn der Lauf endet. Jede Zeile kann direkt bearbeitet werden, und die Änderung wird mit dem Projekt gespeichert.

Um Sprecher zu kennzeichnen, aktivieren Sie vor dem Lauf **Sprecher erkennen** unter **Weitere Optionen**. Die Diarisierung nutzt das Nemotron-3-Modell und kennzeichnet bis zu 8 Sprecher.

## Exportieren

Öffnen Sie den Exportdialog und wählen Sie ein Format: TXT, Markdown, SRT, VTT, HTML, JSON, CSV, DOCX oder PDF. [Unterstützte Formate](/vibe/docs#formats) erklärt, was jedes davon enthält.

## Nächste Schritte

- [Mikrofon und Systemaudio aufnehmen](/vibe/docs#record-audio), wenn das Audio ein Live-Anruf statt einer Datei ist.
- [Modelle](/vibe/docs#models), wenn Sie eine andere Sprache, Geschwindigkeit oder Genauigkeit brauchen.
- [Befehlszeile](/vibe/docs#cli), um dieselbe Engine ohne Fenster auszuführen.
