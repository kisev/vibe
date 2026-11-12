<!-- source: 6fd793aea9b2 -->

# Motor- og GPU-valg

Vibe skiller skrivebordsskallet fra transkripsjonsmotoren. Skallet er en Tauri-app i Rust og React; motoren er `vibe-server`, en Rust-prosess som kaller transcribe.cpp C++-biblioteket på ggml.

## Hvorfor motoren er en egen prosess

Serveren eier modellasting og den tunge beregningen. Å holde den utenfor skrivebordsprosessen betyr:

- vinduet kan startes på nytt uten å laste en modell på flere gigabyte på nytt;
- samme binær betjener appen, CLI-en og det lokale HTTP-API-et;
- en krasj i motoren tar ikke vinduet med seg;
- motoren kan oppdateres etter sin egen tidsplan, festet av appbygget.

Skrivebordsappen snakker med serveren over lokal HTTP. Ingenting i den veien forlater maskinen; [Personvern og offline-design](/vibe/docs#privacy) dekker nettverksoverflaten.

## Én motor, mange modellfamilier

Hver støttede familie kjører gjennom samme ggml-bygg: Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral og GigaAM. Silero VAD og Nemotron-3-talergjenkjenning kjører også på den stakken. Én motor holder minnehåndtering, kvantisering og GPU-dispatch lik for hver modell.

Avveiningen er versjonskobling: en modell hvis GGUF krever en nyere transcribe.cpp enn det innebygde bygget, er oppført i [Modeller](/vibe/docs#models), men kan ikke lastes før motoren flytter seg. Den festingen er bevisst, fordi motoroppgraderinger er paritetshendelser, ikke bakgrunnsoppdateringer av avhengigheter.

## GPU-backender

ggml velger en backend for maskinen den kjører på:

| Plattform | Backend |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

En maskin uten brukbar GPU kjører på CPU. **Innstillinger → Modeller** har **Transkriber på CPU-en** og, på Windows og Linux, en GPU-enhetsvelger. Hvis en GPU-lasting feiler, prøver appen på nytt på CPU og rapporterer at den gjorde det.

GPU-en betyr mest for store modeller og lange filer. Små modeller på en moderne CPU kan være raske nok, og CPU-veien er fallbacken når en driver eller Vulkan-lasteren mangler.

## Relaterte sider

- [Modeller](/vibe/docs#models) for katalogen og grensene per familie.
- [Kommandolinje](/vibe/docs#cli) for `vibe-server`-alternativer som `--gpu-device`.
- [Personvern og offline-design](/vibe/docs#privacy) for hva som blir på maskinen.
