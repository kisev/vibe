<!-- source: a0b0bbb0302c -->

# Transkrybuj pierwsze nagranie

Ten samouczek transkrybuje jeden plik multimedialny domyślnym modelem. Zakłada, że Vibe jest zainstalowany i domyślny model został pobrany; [Instalacja Vibe](/vibe/docs#install) to obejmuje.

## Dodaj plik

1. Otwórz Vibe.
1. Upuść plik audio lub wideo na obszar upuszczania albo wybierz **Plik** i wskaż plik.
1. Poczekaj, aż plik pojawi się w kolejce.

Vibe akceptuje formaty z [Obsługiwane formaty](/vibe/docs#formats). Normalizuje multimedia za pomocą ffmpeg przed transkrypcją, więc nietypowy kontener może nadal działać.

## Rozpocznij transkrypcję

1. Pozostaw język na automatycznym lub wybierz język, gdy wykrywanie się myli.
1. Naciśnij **Transkrybuj**.
1. Obserwuj podgląd na żywo. **Anuluj** zatrzymuje uruchomienie bez usuwania nagrania.

Aplikacja desktopowa uruchamia `vibe-server` w tle i wysyła do niego dźwięk przez lokalne HTTP. Serwer ładuje wybrany model, transkrybuje i zwraca segmenty ze znacznikami czasu.

## Odczytaj wynik

Transkrypcja otwiera się po zakończeniu uruchomienia. Każdy wiersz można edytować w miejscu, a zmiana jest zapisywana wraz z projektem.

Aby oznaczyć mówców, włącz **Rozpoznaj mówców** w **Więcej opcji** przed uruchomieniem. Rozpoznawanie mówców korzysta z modelu Nemotron-3 i oznacza do 8 mówców.

## Eksport

Otwórz okno eksportu i wybierz format: TXT, Markdown, SRT, VTT, HTML, JSON, CSV, DOCX lub PDF. [Obsługiwane formaty](/vibe/docs#formats) wyjaśniają, co zawiera każdy z nich.

## Dalsze kroki

- [Nagrywanie mikrofonu i dźwięku systemowego](/vibe/docs#record-audio), gdy dźwięk to rozmowa na żywo, a nie plik.
- [Modele](/vibe/docs#models), gdy potrzebujesz innego języka, szybkości lub dokładności.
- [Wiersz poleceń](/vibe/docs#cli), aby uruchomić ten sam silnik bez okna.
