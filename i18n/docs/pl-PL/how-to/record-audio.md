<!-- source: 648b5aad742b -->

# Nagrywanie mikrofonu i dźwięku systemowego

Vibe nagrywa z wybranych urządzeń, a następnie transkrybuje nagranie. Użyj tego przewodnika w przypadku rozmów, spotkań i dźwięku, który jest odtwarzany, a nie zapisany w pliku. [Obsługiwane formaty](/vibe/docs#formats) dotyczą plików.

## Wybierz urządzenia

1. Otwórz Vibe i wybierz **Nagraj**.
1. W sekcji **Mikrofon** wybierz urządzenie wejściowe. Vibe zapamiętuje urządzenie po nazwie.
1. W sekcji **Głośniki** wybierz urządzenie wyjściowe do przechwytywania dźwięku systemowego. Wybierz **Brak**, aby nagrywać tylko mikrofon.

Nagrywanie obu urządzeń łączy je w jedną ścieżkę za pomocą ffmpeg, więc obie strony rozmowy trafiają do tej samej transkrypcji.

## Przyznaj uprawnienia w macOS

Otwórz **Ustawienia → Nagrywanie → Uprawnienia** i przyznaj to, czego potrzebuje nagrywanie:

| Uprawnienie | Do czego |
| --- | --- |
| Mikrofon | Dźwięk z mikrofonu |
| Dźwięk systemowy | Dźwięk odtwarzany na Macu (Nagrywanie ekranu i dźwięku systemowego) |

Bez uprawnienia do dźwięku systemowego macOS otwiera strumień zwrotny, ale nagrywa ciszę, więc nagranie nie nadaje się do użytku.

## Nagraj i transkrybuj

1. Naciśnij **Nagraj**.
1. Gdy rozmowa się skończy, użyj **Zatrzymaj**.
1. Nagranie otwiera się z selektorem języka. Wybierz język lub pozostaw automatyczny.
1. Naciśnij **Transkrybuj**.

Jeśli w **Ustawienia → Nagrywanie** włączono **Automatycznie transkrybuj nagrania**, ostatni krok rozpoczyna się sam.

## Dalsze kroki

- [Podsumowanie transkrypcji](/vibe/docs#summarize-transcripts) po zakończeniu nagrywania.
- [Korzystanie z przeglądarki spotkań](/vibe/docs#use-the-meeting-browser), aby nagrać rozmowę w Vibe.
