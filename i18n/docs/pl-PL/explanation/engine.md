<!-- source: 6fd793aea9b2 -->

# Silnik i wybór GPU

Vibe oddziela powłokę desktopową od silnika transkrypcji. Powłoka to aplikacja Tauri w Rust i React; silnik to `vibe-server`, proces Rust, który wywołuje bibliotekę C++ transcribe.cpp na ggml.

## Dlaczego silnik jest osobnym procesem

Serwer odpowiada za ładowanie modeli i ciężkie obliczenia. Trzymanie go poza procesem desktopowym oznacza, że:

- okno można zrestartować bez ponownego ładowania wielogigabajtowego modelu;
- ten sam plik binarny obsługuje aplikację, CLI i lokalne API HTTP;
- awaria silnika nie pociąga za sobą okna;
- silnik można aktualizować według własnego harmonogramu, przypiętego przez kompilację aplikacji.

Aplikacja desktopowa komunikuje się z serwerem przez lokalne HTTP. Nic w tej ścieżce nie opuszcza maszyny; [Prywatność i projekt offline](/vibe/docs#privacy) omawiają powierzchnię sieciową.

## Jeden silnik, wiele rodzin modeli

Każda obsługiwana rodzina działa na tej samej kompilacji ggml: Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral i GigaAM. Silero VAD i rozpoznawanie mówców Nemotron-3 również działają na tym stosie. Jeden silnik utrzymuje obsługę pamięci, kwantyzację i dyspozycję GPU tak samo dla każdego modelu.

Kompromisem jest sprzężenie wersji: model, którego GGUF wymaga nowszego transcribe.cpp niż dołączona kompilacja, jest wymieniony w [Modele](/vibe/docs#models), ale nie może się załadować, dopóki silnik nie zostanie zaktualizowany. To przypięcie jest celowe, ponieważ aktualizacje silnika to zdarzenia parytetu, a nie aktualizacje zależności w tle.

## Backendy GPU

ggml wybiera backend dla maszyny, na której działa:

| Platforma | Backend |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

Maszyna bez użytecznego GPU działa na CPU. **Ustawienia → Modele** zawierają **Transkrybuj na CPU**, a w Windows i Linux selektor urządzenia GPU. Jeśli ładowanie GPU się nie powiedzie, aplikacja ponawia na CPU i zgłasza, że to zrobiła.

GPU ma największe znaczenie w przypadku dużych modeli i długich plików. Małe modele na nowoczesnym CPU mogą być wystarczająco szybkie, a ścieżka CPU jest wariantem awaryjnym, gdy brakuje sterownika lub loadera Vulkan.

## Powiązane strony

- [Modele](/vibe/docs#models) dla katalogu i limitów poszczególnych rodzin.
- [Wiersz poleceń](/vibe/docs#cli) dla opcji `vibe-server`, takich jak `--gpu-device`.
- [Prywatność i projekt offline](/vibe/docs#privacy) dla tego, co pozostaje na maszynie.
