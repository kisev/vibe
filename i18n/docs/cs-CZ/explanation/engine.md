<!-- source: 6fd793aea9b2 -->

# Volba jádra a GPU

Vibe odděluje desktopový obal od jádra přepisu. Obal je aplikace Tauri v Rustu a Reactu; jádrem je `vibe-server`, proces v Rustu, který volá knihovnu transcribe.cpp v C++ nad ggml.

## Proč je jádro samostatný proces

Server vlastní načítání modelů a těžké výpočty. To, že je mimo desktopový proces, znamená:

- okno se může restartovat, aniž by znovu načítalo mnohagigabajtový model;
- stejná binárka obsluhuje aplikaci, CLI i lokální HTTP API;
- pád jádra s sebou nevezme okno;
- jádro lze aktualizovat podle vlastního plánu a aplikace jej připíná ke svému sestavení.

Desktopová aplikace komunikuje se serverem přes lokální HTTP. Nic v této cestě neopouští počítač; [Soukromí a offline návrh](/vibe/docs#privacy) se věnuje síťové komunikaci.

## Jedno jádro, mnoho rodin modelů

Každá podporovaná rodina běží na stejném sestavení ggml: Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral a GigaAM. Silero VAD a diarizace Nemotron-3 běží na stejném stacku. Jedno jádro drží správu paměti, kvantizaci a odesílání práce na GPU stejné pro každý model.

Kompromisem je svázanost verzí: model, jehož GGUF potřebuje novější transcribe.cpp než přibalené sestavení, je uveden v [Modelech](/vibe/docs#models), ale nelze jej načíst, dokud se jádro neposune. Toto připnutí je záměrné, protože upgrady jádra jsou události sladění verzí, ne aktualizace závislostí na pozadí.

## Backendy GPU

ggml zvolí backend pro počítač, na kterém běží:

| Platforma | Backend |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

Počítač bez použitelné GPU běží na CPU. **Nastavení → Modely** obsahuje **Přepisovat na CPU** a na Windows a Linuxu také výběr zařízení GPU. Pokud načtení GPU selže, aplikace to zkusí znovu na CPU a oznámí, že tak učinila.

GPU je nejdůležitější u velkých modelů a dlouhých souborů. Malé modely mohou být na moderním CPU dost rychlé a cesta přes CPU je náhradou, když chybí ovladač nebo zavaděč Vulkan.

## Související stránky

- [Modely](/vibe/docs#models) pro katalog a limity jednotlivých rodin.
- [Příkazový řádek](/vibe/docs#cli) pro přepínače `vibe-server`, jako je `--gpu-device`.
- [Soukromí a offline návrh](/vibe/docs#privacy) pro to, co zůstává na počítači.
