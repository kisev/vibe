---
version: unreleased
date: 
title: "Co dalej"
source: 4462099ac37f
---

## New

- 🧪 **Porównanie modeli obok siebie** — Ustawienia → Modele przepuszczają jeden klip lub plik przez każdy wybrany zainstalowany model i otwierają wyniki na całe okno: kolumna dla każdego modelu z jego czasem i liczbą słów, niezależne przewijanie, wybór punktu odniesienia oraz podświetlanie na poziomie słów, które wykreśla brakujące słowa i oznacza dodatkowe
- 🗣️ **Rozdzielanie mówców w porównaniu** — jeden przełącznik dodaje etykiety głosu do transkrypcji każdego modelu, więc to samo uruchomienie pokazuje, który model usłyszał słowa i kto je wypowiedział
- 🔄 **Trzy kanały aktualizacji** — śledź Release, Beta lub Dev, sprawdzaj bieżącą wersję i czas ostatniego sprawdzenia, a sprawdzanie uruchamiaj sam jednym przyciskiem, zamiast czekać na następne uruchomienie
- 🗺️ **Strona ma plan rozwoju** — nowa strona wymienia każdą niearchiwizowaną zmianę prosto z plików planistycznych projektu, więc to, co nadchodzi, nigdy nie jest ręcznie napisanym domysłem
- 🌐 **Spotkania otwierają się w Vibe** — linki do spotkań otwierają się we wbudowanej przeglądarce z własnym menu (wstecz, dalej, odśwież, otwórz w przeglądarce systemowej, zamknij) i edytowalną listą hostów spotkań; Vibe może zarejestrować się jako program obsługujący linki Zoom, Teams i Webex, gdy o to poprosisz, a wykryta rozmowa proponuje jej nagranie z mikrofonu i dźwięku systemowego
- 🌍 **Strona mówi w Twoim języku** — selektor języka w nagłówku przełącza stronę w miejscu, zachowuje `?lang=` w adresie URL, aby udostępniane linki niosły ten wybór, i stosuje układ od prawej do lewej. `/changelog/dev` jest teraz stałym adresem notatek z wersji dev

## Improved

- 🧭 **Aktualizacje dev mają własną linię** — kompilacje dev są dostarczane jako wersje wstępne `-dev.N` na kanale Dev, wersje kandydujące są tworzone dla Beta, a dziennik zmian wersji dev zachowuje jeden stały adres URL, gdy kompilacje się zmieniają
- 🏷️ **Porównania poprawnie nazywają modele** — wyniki i okna dialogowe używają kanonicznej nazwy modelu z katalogu i zapisu kwantyzacji, zamiast zmieniać nazwę pliku w tytuł
- 🤫 **Wykrywanie spotkań nie przeszkadza** — własne okno spotkań Vibe wyłącza zewnętrzny komunikat o wykryciu, a stan nagrywania jest wspólny, więc rozmowa już otwarta w Vibe nigdy nie proponuje nagrania drugi raz
- 🕵️ **Nic nie opuszcza Twojego urządzenia** — cała telemetria zniknęła: brak klucza analitycznego, brak sygnału przy uruchomieniu lub akcji i brak banerów darowizn na stronie. Logi, diagnostyka i eksporty pozostają na dysku i opuszczają go tylko wtedy, gdy sam je wyślesz
- 📚 **Dokumentacja podąża za Diátaxis** — samouczki, poradniki, referencje i wyjaśnienia są rozdzielone w repozytorium i na stronie, więc „jak to zrobić…” i „co to znaczy” nie dzielą już jednej długiej strony
- 🔗 **Informacje o wydaniu prowadzą do przetłumaczonego dziennika zmian** — każdy opis wydania linkuje do `https://kisev.github.io/vibe/changelog/<version>`, więc czytelnik wybiera własny język zamiast angielskiego

## Fixed

- 🎙️ **Każdy model może uruchomić porównanie** — GigaAM i Parakeet nie odmawiają już uruchomienia z powodu brakującego modelu VAD; laboratorium dostarcza swój dołączony detektor, więc wyniki różnią się tylko modelem
- 📍 **Porównanie jest na pierwszym miejscu** — laboratorium przeniosło się nad długi katalog modeli w Ustawienia → Modele, więc jest pierwszą rzeczą, którą widzisz
- 🔍 **Długie transkrypcje wciąż są podświetlane** — widok różnic nie poddaje się już powyżej tysiąca słów i nie zgłasza zera różnic; gdy tekst jest naprawdę za długi, zamiast tego komunikuje to kolumna
- 🔁 **Kanały aktualizacji zachowują nazwy i swoją linię** — selektor pokazuje Release, Beta i Dev w każdym języku, a Beta oferuje tylko wersje kandydujące, zamiast kopiować stabilną kompilację
- 🔌 **Przełącznik serwera API pozostaje wyłączony** — przełącznik Agenci to Twoja decyzja i przetrwa ponowne uruchomienie; odczytywanie metadanych modeli przy starcie nie zostawia już za sobą działającego serwera
- 🪟 **Okno spotkania można zamknąć** — jego elementy sterujące znajdują się w samym oknie, więc strona, która nie chce się wczytać, nie pozostawia już okna bez wyjścia
- 🌍 **Strona tłumaczy całą stronę** — przełączenie języka nie zostawia już za sobą angielskich sekcji, a dziennik zmian również podąża za wybranym językiem
