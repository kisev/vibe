<!-- source: 648b5aad742b -->

# Nahrávání mikrofonu a systémového zvuku

Vibe nahrává z vybraných zařízení a poté nahrávku přepíše. Tento návod použijte pro hovory, schůzky a zvuk, který se přehrává, místo aby byl uložený v souboru. [Podporované formáty](/vibe/docs#formats) se věnují souborům.

## Výběr zařízení

1. Otevřete Vibe a zvolte **Nahrávat**.
1. V části **Mikrofon** vyberte vstupní zařízení. Vibe si zařízení pamatuje podle názvu.
1. V části **Reproduktory** vyberte výstupní zařízení pro zachycení systémového zvuku. Chcete-li nahrávat pouze mikrofon, zvolte **Žádný**.

Při nahrávání obou zařízení se s ffmpeg sloučí do jedné stopy, takže obě strany hovoru skončí ve stejném přepisu.

## Udělení oprávnění v macOS

Otevřete **Nastavení → Nahrávání → Oprávnění** a udělte, co nahrávání potřebuje:

| Oprávnění | Používá se pro |
| --- | --- |
| Mikrofon | Zvuk z mikrofonu |
| Systémový zvuk | Zvuk přehrávaný na Macu (Nahrávání obrazovky a systémového zvuku) |

Bez oprávnění k systémovému zvuku macOS otevře loopbackový proud, ale nahrává ticho, takže nahrávka je nepoužitelná.

## Nahrávání a přepis

1. Stiskněte **Nahrávat**.
1. Po skončení hovoru použijte **Zastavit**.
1. Nahrávka se otevře s výběrem jazyka. Zvolte jazyk, nebo jej ponechte automaticky.
1. Stiskněte **Přepsat**.

Pokud je v **Nastavení → Nahrávání** zapnuté **Automaticky přepisovat nahrávky**, poslední krok se spustí sám.

## Další kroky

- [Shrnutí přepisu](/vibe/docs#summarize-transcripts) po dokončení nahrávky.
- [Používání prohlížeče schůzek](/vibe/docs#use-the-meeting-browser) pro nahrání hovoru ve Vibe.
