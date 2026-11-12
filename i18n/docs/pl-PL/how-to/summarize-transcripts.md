<!-- source: f5e20b838770 -->

# Podsumuj transkrypcję

Vibe może zamienić gotową transkrypcję w podsumowanie, notatki lub tłumaczenie. Żądanie trafia do skonfigurowanej przez Ciebie platformy AI: lokalnego modelu Ollama, Claude lub dowolnego punktu końcowego zgodnego z OpenAI. [Ustawienia i konfiguracja](/vibe/docs#settings) zawierają informacje o tym, gdzie przechowywane jest połączenie.

## Użyj lokalnego modelu Ollama

1. Zainstaluj [Ollama](https://ollama.com) i pobierz model, na przykład `ollama pull llama3.1`.
1. Otwórz **Ustawienia → Asystent AI**.
1. Ustaw **Platforma** na **Ollama**. Domyślny adres URL to `http://localhost:11434`.
1. Wybierz nazwę modelu.
1. Włącz **Podsumowania**, a opcjonalnie **Automatycznie podsumowuj nowe transkrypcje**.

Ollama działa na tej maszynie, więc transkrypcja pozostaje lokalna.

## Użyj Claude lub punktu końcowego zgodnego z OpenAI

1. Otwórz **Ustawienia → Asystent AI** i wybierz platformę.
1. Wklej klucz API i zmień bazowy adres URL, jeśli punkt końcowy nie jest domyślny.
1. Wybierz model.
1. Włącz **Podsumowania**.

W przypadku punktu końcowego innego niż domyślny bazowy adres URL i klucz to połączenie używane przez aplikację zarówno do podsumowań, jak i dyktowania.

## Podsumuj

1. Zakończ transkrypcję.
1. Otwórz akcję podsumowania w widoku transkrypcji.
1. Wybierz ustawienie wstępne i w razie potrzeby edytuj monit.
1. Uruchom je; wynik jest zapisywany wraz z projektem i można go wyeksportować obok transkrypcji.

Po włączeniu **Automatycznie podsumowuj nowe transkrypcje** podsumowanie uruchamia się, gdy tylko transkrypcja się zakończy.

## Dalsze kroki

- [Ustawienia i konfiguracja](/vibe/docs#settings) dla pliku konfiguracyjnego i sekcji ustawień.
- [Prywatność i projekt offline](/vibe/docs#privacy) — które platformy zachowują tekst na maszynie.
