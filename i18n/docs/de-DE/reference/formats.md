<!-- source: e0f14454bcc5 -->

# Unterstützte Formate

Vibe akzeptiert Audio- und Videodateien und exportiert Transkripte in mehreren Textformaten. Die Desktop-App normalisiert Medien vor der Transkription mit ffmpeg; unter Linux ist das System-`ffmpeg` erforderlich, während die macOS- und Windows-Bundles ihr eigenes mitbringen.

## Eingabe

| Art | Erweiterungen |
| --- | --- |
| Audio | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| Video | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

Ein Container außerhalb dieser Liste kann trotzdem funktionieren, wenn ffmpeg ihn dekodieren kann; konvertieren Sie ihn zuerst, wenn die App ihn ablehnt.

## Desktop-Export

Öffnen Sie den Exportdialog bei einem Transkript und wählen Sie eines davon:

| Format | Inhalt |
| --- | --- |
| TXT | Unformatierter Text |
| Markdown | Überschriften und formatierter Text |
| SRT | Nummerierte Untertitel mit Zeitstempeln |
| VTT | WebVTT-Untertitel mit Zeitstempeln |
| HTML | Eine gestaltete Webseite |
| JSON | Strukturierte Transkriptions- und Zeitdaten |
| CSV | Tabellenfertige Zeilen |
| DOCX | Ein formatiertes Word-Dokument |
| PDF | Ein druckbares Dokument |

Die Exportoptionen schalten außerdem Zeitstempel und Sprecherbezeichnungen um, wo das Format sie unterstützt. Der automatische Export kann jedes dieser Formate neben die Aufnahme, in den Projektordner oder in einen Ordner Ihrer Wahl schreiben.

## CLI-Ausgabe

`vibe-server transcribe` schreibt `txt` (Standard), `markdown` (Alias `md`), `json`, `srt` oder `vtt`. `--output` schreibt eine neue Datei und weigert sich, einen vorhandenen Pfad zu überschreiben. Siehe [Befehlszeile](/vibe/docs#cli).

## Verwandte Seiten

- [Modelle](/vibe/docs#models) für die Modellfamilien und ihre Grenzen.
- [Erste Aufnahme transkribieren](/vibe/docs#first-transcription) für den Desktop-Ablauf.
