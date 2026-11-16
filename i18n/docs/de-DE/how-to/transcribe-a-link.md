<!-- source: b806d3524bf0 -->

# Von einem Link transkribieren

Vibe lädt das Audio hinter einer Medien-URL mit yt-dlp herunter und transkribiert das Ergebnis. Unterstützt werden die Seiten, die yt-dlp unterstützt; wenn eine Seite nicht mehr funktioniert, behebt ein aktualisiertes yt-dlp das meist.

## Link senden

1. Öffnen Sie Vibe und wählen Sie **Von Link**.
1. Fügen Sie eine URL ein, oder mehrere durch Leerraum getrennt, um alle in die Warteschlange zu stellen.
1. Drücken Sie **Transkribieren**.

Vibe fragt beim ersten Link nach der Installation von yt-dlp und bei einer fehlschlagenden Seite nach einer Aktualisierung. Das heruntergeladene Audio ist temporär; das Transkript wird wie jedes andere Projekt gespeichert.

## Was Sie erwarten können

- Ein einzelner Link startet, sobald der Download abgeschlossen ist.
- Eine Warteschlange verarbeitet jeweils einen Link und zeigt den Fortschritt pro Eintrag.
- Gewichte, Modelle und das Transkript bleiben lokal. Der Download selbst kontaktiert den Medien-Host und GitHub für yt-dlp.

## Nächste Schritte

- [Unterstützte Formate](/vibe/docs#formats) für lokale Dateien und Exportoptionen.
- [Modelle](/vibe/docs#models), wenn das Audio eine andere Sprache oder Genauigkeit braucht.
