<!-- source: dd9e41dac7e3 -->

# Ustawienia i konfiguracja

Ustawienia znajdują się w `app_config.json` w katalogu konfiguracji aplikacji. Plik jest przeznaczony do odczytu i edycji: Vibe obserwuje go i stosuje zewnętrzną zmianę bez ponownego uruchamiania. **Ustawienia → Agenci → Plik konfiguracyjny** otwiera go.

## Lokalizacja pliku konfiguracyjnego

| Platforma | Katalog |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

Katalog zachowuje swój identyfikator upstream, więc nazwa nie zmieniła się względem wcześniejszych kompilacji.

## Sekcje ustawień

| Sekcja | Zawiera |
| --- | --- |
| Ogólne | Język wyświetlania, motyw, aktualizacje, działanie w zasobniku, uruchamianie przy starcie, zapobieganie usypianiu |
| Prywatność | Czy projekty są zapisywane, oraz polityka prywatności |
| Transkrypcja | Język, automatyczny eksport, dźwięk zakończenia i fokus, folder projektów |
| Modele | Wybór CPU/GPU, urządzenie GPU, katalog modeli, model rozpoznawania mówców |
| Strojenie | Opcje Whispera, przetwarzanie dźwięku, pamięć modelu i limit czasu zwolnienia |
| Nagrywanie | Przeglądarka spotkań, wykrywanie spotkań, automatyczna transkrypcja, skrót nagrywania, uprawnienia w macOS |
| Dyktowanie | Skrót dyktowania i tryb aktywacji |
| Asystent AI | Podsumowania i zadania dyktowania, połączenie z platformą |
| Telefon | Przekazywanie z telefonu, parowanie, sparowane urządzenia |
| Agenci | Lokalne API, umiejętność agenta, plik konfiguracyjny |
| Zaawansowane | Logi, diagnostyka i kontrolki dla programistów |

## Wartości warte poznania

| Grupa kluczy | Znaczenie |
| --- | --- |
| `transcription.*` | Język, monit, rozpoznawanie mówców, znaczniki czasu, dzielenie długich nagrań |
| `model.*` | Wybrany model, nazwy wyświetlane, urządzenie GPU, przełącznik tylko CPU, limit czasu zwolnienia |
| `transcript.*` | Format eksportu, znaczniki czasu, mówcy, automatyczny eksport |
| `recording.*` | Urządzenia wejściowe i wyjściowe, wykrywanie spotkań, skrót nagrywania |
| `ai.*` | Platforma, bazowy URL, klucz, model, monit i przełączniki dla poszczególnych zadań |
| `general.updateChannel` | `stable`, `beta` lub `dev` |
| `handoff.pairing` | Sparowane urządzenia telefoniczne i skróty poświadczeń |

Dokładne nazwy pól są na tyle stabilne, by je edytować, ale schemat należy do aplikacji: zmieniaj wartość przez interfejs ustawień, gdy taki istnieje, i pozwól aplikacji przepisać plik, zamiast zastępować go w całości.

## Powiązane strony

- [Przełączanie kanałów aktualizacji](/vibe/docs#switch-update-channels) dla ustawienia kanału.
- [Podsumuj transkrypcję](/vibe/docs#summarize-transcripts) dla połączenia z AI.
- [Transkrypcja z telefonu](/vibe/docs#transcribe-from-a-phone) dla ustawień przekazywania.
