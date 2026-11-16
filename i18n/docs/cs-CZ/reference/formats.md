<!-- source: e0f14454bcc5 -->

# Podporované formáty

Vibe přijímá zvukové a obrazové soubory a exportuje přepisy v několika textových formátech. Desktopová aplikace normalizuje média pomocí ffmpeg před přepisem; na Linuxu je vyžadován systémový `ffmpeg`, zatímco sestavení pro macOS a Windows přinášejí vlastní.

## Vstup

| Druh | Přípony |
| --- | --- |
| Zvuk | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| Video | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

Kontejner mimo tento seznam může stále fungovat, pokud jej ffmpeg umí dekódovat; pokud jej aplikace odmítne, nejprve jej převeďte.

## Export z desktopové aplikace

Otevřete dialog exportu u přepisu a vyberte jeden z těchto formátů:

| Formát | Obsah |
| --- | --- |
| TXT | Prostý text bez formátování |
| Markdown | Nadpisy a formátovaný text |
| SRT | Číslované titulkové položky s časovými značkami |
| VTT | Titulky WebVTT s časovými značkami |
| HTML | Webová stránka se styly |
| JSON | Strukturovaná data přepisu a časování |
| CSV | Řádky připravené pro tabulkový procesor |
| DOCX | Formátovaný dokument Word |
| PDF | Dokument připravený k tisku |

Možnosti exportu také přepínají časové značky a označení mluvčích, pokud je formát podporuje. Automatický export umí zapsat kterýkoli z těchto formátů vedle nahrávky, do složky projektů nebo do složky, kterou zvolíte.

## Výstup CLI

`vibe-server transcribe` zapisuje `txt` (výchozí), `markdown` (alias `md`), `json`, `srt` nebo `vtt`. `--output` zapíše nový soubor a odmítne přepsat existující cestu. Viz [Příkazový řádek](/vibe/docs#cli).

## Související stránky

- [Modely](/vibe/docs#models) pro rodiny modelů a jejich limity.
- [Přepis první nahrávky](/vibe/docs#first-transcription) pro postup v desktopové aplikaci.
