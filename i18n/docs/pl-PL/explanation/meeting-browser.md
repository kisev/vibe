<!-- source: 42d301759b1a -->

# Dlaczego przeglądarka spotkań działa w ten sposób

Rozmowę łatwiej nagrać, gdy Vibe sam hostuje stronę: aplikacja kontroluje okno, wie, kiedy trwa nagrywanie, i może pokazać pasek z jedną akcją. Projekt jest kształtowany przez to, na co faktycznie pozwala system operacyjny.

## Dlaczego schemat URL, a nie kliknięcia https

Przeglądarka nigdy nie przekazuje linku `https://` zainstalowanej aplikacji, chyba że ta aplikacja jest domyślną przeglądarką. Aplikacje spotkań działają odwrotnie: rejestrują własny schemat, a ich strony lub instalatory go wywołują.

Vibe robi to samo:

- `vibe://open/?url=https://…` otwiera cel w oknie przeglądarki Vibe. Może go wywołać dowolna aplikacja, skrypt lub skrót. Vibe waliduje adres URL w Rust i odrzuca wszystko, co nie jest https i poprawnie sformułowane.
- **Ustawienia → Nagrywanie → Otwórz w Vibe** wkleja link do tej samej ścieżki.

Kliknięcie linku `https` w Chrome, Edge lub Firefox nadal otwiera tę przeglądarkę. Uczynienie Vibe domyślną przeglądarką jest celowo poza zakresem: przejęłoby to każdy link na maszynie, aby obsłużyć jedną funkcję.

## Dlaczego widok treści jest izolowany

Okno treści to zwykły webview z własnym katalogiem danych. Pliki cookie usług nigdy nie mieszają się z pamięcią aplikacji, do strony nie wstrzykuje się żadnych skryptów, a monity o kamerę i mikrofon pochodzą od samej strony, a nie z faktu, że Vibe przyznaje je w imieniu użytkownika. Osadzona strona jest traktowana jako niezaufana treść internetowa, a nie część aplikacji.

Pasek oferuje adres, wstecz, dalej, odświeżenie, zamknięcie i **Otwórz w przeglądarce systemowej**. Ostatnia akcja to wyjście awaryjne dla usługi, która odmawia działania w osadzonym webview.

## Dlaczego nagrywanie pozostaje ręczne

Hosty z listy spotkań zamieniają okno w sesję spotkania: pasek pokazuje **Nagraj tę rozmowę**. Nagrywanie nadal jest ręczne — naciśnij przycisk przed rozmową lub w jej trakcie, zatrzymaj z paska lub z głównego okna. Automatyczne rozpoczęcie nagrywałoby rozmowy, których użytkownik nie poprosił o nagranie, i powodowałoby pojawienie się wskaźnika mikrofonu bez wyraźnej akcji.

Zamknięcie okna podczas nagrywania pyta, czy zatrzymać nagrywanie, czy kontynuować je w tle, więc opuszczenie rozmowy nie może po cichu odrzucić ani kontynuować nagrania.

## Ograniczenia

- Tylko linki `vibe://open/` otwierają się automatycznie. Kliknięcie `https` wymaga decyzji o domyślnej przeglądarce, której Vibe nie podejmuje.
- Witryny z dużym DRM lub nieprzyjazne WebRTC mogą działać lepiej w przeglądarce systemowej; **Otwórz w przeglądarce systemowej** to obsługiwany wariant awaryjny.
- Windows jest sprawdzany jako pierwszy. Inne platformy używają własnych webview i przechodzą do przeglądarki systemowej, jeśli okno nie może hostować rozmowy.
- Rejestrowanie schematów Zoom, Teams i Webex jest opcjonalne i dostępne w Windows i Linux, nie w macOS.

## Powiązane strony

- [Korzystanie z przeglądarki spotkań](/vibe/docs#use-the-meeting-browser) dla kroków.
- [Nagrywanie mikrofonu i dźwięku systemowego](/vibe/docs#record-audio) dla samego rejestratora.
