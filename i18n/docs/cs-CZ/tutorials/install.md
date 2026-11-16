<!-- source: 03e5a04c40fd -->

# Instalace Vibe

Tento návod provede nový počítač od stažení až po běžící okno Vibe. Předpokládá desktop s připojením k internetu a bez existující instalace. [Přepis první nahrávky](/vibe/docs#first-transcription) je dalším krokem.

## Stažení instalátoru

Otevřete [stránku ke stažení](https://kisev.github.io/vibe/) a vyberte sestavení pro tento počítač:

| Platforma | Sestavení |
| --- | --- |
| Windows | instalátor `.exe` |
| macOS, Apple silicon | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` nebo `.rpm`, x86-64 nebo arm64 |

Stejné soubory jsou přiloženy ke každému [vydání na GitHubu](https://github.com/kisev/vibe/releases). Linuxový `.deb` deklaruje své běhové závislosti, včetně `ffmpeg`.

## Instalace a otevření

1. Spusťte instalátor a postupujte podle jeho pokynů.
1. Otevřete Vibe z nabídky aplikací, nebo spusťte `vibe` z terminálu.

Vydaná sestavení nejsou podepsaná. V macOS je při prvním spuštění potřeba klepnout pravým tlačítkem → **Otevřít** ve Finderu, aby se prošlo kolem Gatekeeperu; další spuštění se otevírají normálně. Windows SmartScreen může ze stejného důvodu zobrazit upozornění.

## Dokončení nastavení

Při prvním spuštění Vibe nabídne výchozí model. Přijměte stažení a počkejte na jeho dokončení. Model se uloží lokálně a znovu se použije při každém dalším spuštění; [Modely](/vibe/docs#models) uvádějí alternativy.

Okno je připraveno, když jsou vidět oblast pro přetažení a akce **Nahrávat** a **Z odkazu**.

## Další kroky

- [Přepis první nahrávky](/vibe/docs#first-transcription) navazuje na tuto instalaci.
- [Podporované formáty](/vibe/docs#formats) uvádějí, co Vibe umí otevřít a exportovat.
- [Řešení pádu](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) pokrývá záznamy a diagnostiku, pokud se okno neotevře.
