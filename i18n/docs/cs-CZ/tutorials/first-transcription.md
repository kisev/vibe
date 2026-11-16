<!-- source: a0b0bbb0302c -->

# Přepis první nahrávky

Tento návod přepíše jeden mediální soubor výchozím modelem. Předpokládá, že je Vibe nainstalované a výchozí model stažený; [Instalace Vibe](/vibe/docs#install) to popisuje.

## Přidání souboru

1. Otevřete Vibe.
1. Přetáhněte zvukový nebo obrazový soubor do oblasti pro přetažení, nebo zvolte **Soubor** a vyberte jej.
1. Počkejte, až se soubor objeví ve frontě.

Vibe přijímá formáty uvedené v [Podporovaných formátech](/vibe/docs#formats). Před přepisem média normalizuje pomocí ffmpeg, takže i neobvyklý kontejner může fungovat.

## Spuštění přepisu

1. Ponechte jazyk na automatickém rozpoznání, nebo vyberte jazyk, když jej detekce určí špatně.
1. Stiskněte **Přepsat**.
1. Sledujte živý náhled. **Zrušit** zastaví běh, aniž by nahrávku smazal.

Desktopová aplikace spouští na pozadí `vibe-server` a posílá mu zvuk přes lokální HTTP. Server načte vybraný model, přepíše zvuk a vrátí segmenty s časovými značkami.

## Čtení výsledku

Přepis se otevře po dokončení běhu. Každý řádek lze upravit přímo na místě a změna se uloží s projektem.

Chcete-li označit mluvčí, zapněte před spuštěním **Rozpoznávat mluvčí** v části **Další možnosti**. Diarizace používá model Nemotron-3 a označí až 8 mluvčích.

## Export

Otevřete dialog exportu a zvolte formát: TXT, Markdown, SRT, VTT, HTML, JSON, CSV, DOCX nebo PDF. [Podporované formáty](/vibe/docs#formats) vysvětlují, co který nese.

## Další kroky

- [Nahrávání mikrofonu a systémového zvuku](/vibe/docs#record-audio), když je zdrojem zvuku živý hovor, nikoli soubor.
- [Modely](/vibe/docs#models), když potřebujete jiný jazyk, rychlost nebo přesnost.
- [Příkazový řádek](/vibe/docs#cli) pro spuštění stejného jádra bez okna.
