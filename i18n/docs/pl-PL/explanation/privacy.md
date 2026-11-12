<!-- source: 2459ffcb4329 -->

# Prywatność i projekt offline

Vibe jest zbudowany tak, aby zwykła ścieżka transkrypcji nie wymagała konta ani usługi w chmurze. Aplikacja uruchamia lokalny serwer, serwer ładuje model z dysku, a dźwięk jest dekodowany i transkrybowany na tej samej maszynie.

## Co pozostaje lokalne

- Pliki audio, nagrania, eksporty i transkrypcje.
- Modele i pliki binarne ffmpeg.
- Historia projektów w folderze projektów.
- Lokalne API HTTP między aplikacją desktopową a `vibe-server`, powiązane z loopback.

Aplikacja nie wysyła telemetrii. **Zgłoś problem** buduje wstępnie wypełniony problem z lokalnej diagnostyki i otwiera GitHuba; nic nie jest wysyłane, dopóki go nie przejrzysz i nie wyślesz.

## Gdzie używana jest sieć

| Funkcja | Kontakt sieciowy |
| --- | --- |
| Pobieranie modelu | Host udostępniający plik modelu |
| Transkrypcja z linku | Host multimediów oraz GitHub dla pliku binarnego yt-dlp |
| Sprawdzanie aktualizacji | Plik kanału w witrynie |
| Podsumowanie AI z Claude lub OpenAI | Skonfigurowany dostawca |
| Podsumowanie AI z Ollama | Adres URL Ollama, domyślnie lokalny |
| Przekazywanie z telefonu | Serwer pośredniczący szyfrowany end-to-end między telefonem a tym komputerem |

Sam silnik transkrypcji nie ma ścieżki sieciowej.

## Przekazywanie z telefonu

Telefon i komputer stacjonarny łączą się przez iroh. Serwer pośredniczący przenosi ruch szyfrowany end-to-end, więc przekazuje bajty, których nie potrafi odczytać; transkrypcja nadal odbywa się na tym komputerze, a Vibe musi pozostać otwarty, aby przekazywanie działało.

## Kompromisy

- Modele lokalne zajmują miejsce na dysku i korzystają z CPU lub GPU maszyny. [Silnik i wybór GPU](/vibe/docs#engine) wyjaśnia podział.
- Podsumowanie w chmurze wysyła tekst transkrypcji do wybranego dostawcy. Pozostaw platformę na Ollama, aby zachować ją lokalnie.
- Aktualizacje są sprawdzane z plików statycznych w witrynie, co zdradza, że aplikacja sprawdziła kanał, a nie co transkrybowała.

## Powiązane strony

- [Ustawienia i konfiguracja](/vibe/docs#settings) dla lokalnego pliku konfiguracyjnego.
- [Transkrypcja z telefonu](/vibe/docs#transcribe-from-a-phone) dla kroków przekazywania.
- [Podsumuj transkrypcję](/vibe/docs#summarize-transcripts) dla platform AI.
