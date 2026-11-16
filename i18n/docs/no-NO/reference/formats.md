<!-- source: e0f14454bcc5 -->

# Støttede formater

Vibe godtar lyd- og videofiler og eksporterer transkripsjoner i flere tekstformater. Skrivebordsappen normaliserer mediet med ffmpeg før transkripsjon; på Linux kreves systemets `ffmpeg`, mens macOS- og Windows-byggene har sitt eget.

## Inndata

| Type | Filendelser |
| --- | --- |
| Lyd | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| Video | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

En beholder utenfor denne listen kan fortsatt fungere hvis ffmpeg kan dekode den; konverter den først hvis appen avviser den.

## Eksport fra skrivebordsappen

Åpne eksportdialogen på en transkripsjon og velg ett av disse:

| Format | Innhold |
| --- | --- |
| TXT | Ren tekst uten formatering |
| Markdown | Overskrifter og formatert tekst |
| SRT | Nummererte undertekstlinjer med tidsstempler |
| VTT | WebVTT-undertekster med tidsstempler |
| HTML | En stilisert nettside |
| JSON | Strukturerte transkripsjons- og tidsdata |
| CSV | Rader klare for regneark |
| DOCX | Et formatert Word-dokument |
| PDF | Et utskriftsvennlig dokument |

Eksportvalgene slår også av og på tidsstempler og talermerker der formatet støtter det. Automatisk eksport kan skrive hvilket som helst av disse formatene ved siden av opptaket, i prosjektmappen eller i en mappe du velger.

## CLI-utdata

`vibe-server transcribe` skriver `txt` (standard), `markdown` (alias `md`), `json`, `srt` eller `vtt`. `--output` skriver en ny fil og nekter å overskrive en eksisterende bane. Se [Kommandolinje](/vibe/docs#cli).

## Relaterte sider

- [Modeller](/vibe/docs#models) for modellfamiliene og grensene deres.
- [Transkriber ditt første opptak](/vibe/docs#first-transcription) for skrivebordsflyten.
