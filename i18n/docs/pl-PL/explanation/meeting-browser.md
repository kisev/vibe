<!-- source: 6737f12a1fc7 -->

# Przeglądarka spotkań

Przeglądarka spotkań istnieje, ponieważ rozmowę łatwiej nagrać, gdy Vibe sam hostuje stronę: aplikacja kontroluje okno, wie, kiedy trwa nagrywanie, i potrafi pokazać własny pasek jedną akcją. Projekt jest kształtowany przez to, na co faktycznie pozwala system operacyjny.

## Dlaczego schemat URL, a nie kliknięcia https

Przeglądarka nigdy nie przekazuje linku `https://` zainstalowanej aplikacji, chyba że ta aplikacja jest domyślną przeglądarką. Aplikacje spotkań działają odwrotnie: rejestrują własny schemat (`zoommtg://`, `msteams://`, `mattermost://`), a ich własne strony lub instalatory go wywołują.

Vibe postępuje tak samo uczciwie:

- Włącz **Otwieraj linki do spotkań w Vibe**, a Vibe zarejestruje schematy spotkań, których używają już Zoom, Teams i Webex (`zoommtg://`, `msteams://`, `webex://`), mapując każdy z nich na adres internetowy, który przenosi. Aplikacja waliduje adres URL w Rust i otwiera go w oknie przeglądarki, gdy jego host może się wczytać, a w przeciwnym razie w przeglądarce systemowej.
- Adres URL `https` przekazany jako argument uruchomienia przechodzi tą samą drogą.
- W aplikacji źródło **Przeglądarka spotkań** na stronie głównej oraz **Ustawienia → Nagrywanie → Otwórz w Vibe** wklejają link do tej samej ścieżki.

Vibe celowo nie dostarcza własnego linku `vibe://open/`: żadna strona spotkania go nie emituje, dlatego ten pierwszy punkt wejścia został usunięty. Kliknięcie linku `https` w Chrome, Edge lub Firefox nadal otwiera tę przeglądarkę. Uczynienie Vibe domyślną przeglądarką jest celowo poza zakresem: przejęłoby to każdy link na maszynie, aby obsłużyć jedną funkcję, i nadal byłoby decyzją użytkownika.

## Dlaczego widok treści jest izolowany

Okno zawiera dwa podrzędne webview: pasek Vibe i zdalną stronę. Pasek to interfejs aplikacji i ma uprawnienia aplikacji; strona to zwykła niezaufana treść internetowa bez żadnych uprawnień, bez wstrzykiwanych skryptów, a monity o kamerę i mikrofon pochodzą od samej strony, a nie z faktu, że Vibe przyznaje je w imieniu użytkownika. Oba współdzielą środowisko WebView2 procesu, ponieważ WebView2 nie obsługuje drugiego katalogu danych w jednym procesie.

Pasek oferuje adres, wstecz, dalej, odświeżenie, zamknięcie i **Otwórz w przeglądarce systemowej**. Ostatnia akcja to wyjście awaryjne dla usługi, która odmawia działania w osadzonym webview. Osadzanie wielu webview to tutaj funkcja desktopowa Windows/Linux; w macOS przeglądarka zamiast zawieść przechodzi do okna tylko ze stroną, bez paska.

## Dlaczego przeglądarka jest listą dozwolonych domen

Osadzona przeglądarka początkowo wczytywała wszystko, o co poprosiła strona; lista hostów spotkań decydowała tylko, które linki otrzymają pasek nagrywania. Teraz jest to prawdziwa granica: przez https mogą się wczytywać tylko dozwolone domeny i ich subdomeny, zarówno jako strony najwyższego poziomu, jak i każdy zasób, którego żądają. Odrzucony zasób otrzymuje odpowiedź błędu, więc strona traktuje to źródło jako niedostępne, zamiast ponawiać próby w nieskończoność.

Ścisłość ma swoją cenę: strona pobierająca czcionki lub skrypty z CDN psuje się, dopóki ta CDN nie zostanie dozwolona. Lista zablokowanych jest rozwiązaniem — unikalne hosty, najnowsze pierwsze, każdy z akcją **Zezwól**, która dodaje domenę i ponownie wczytuje stronę. Lista jest rysowana wewnątrz paska, a pasek rośnie, aby ją pomieścić, ponieważ wyskakujące okno wewnątrz webview o wysokości 104 pikseli zostałoby przycięte przez stronę poniżej. Pasek pokazuje tę samą propozycję, gdy odmawia nawigacji. Windows wymusza blokowanie zasobów przez `WebResourceRequested` w WebView2; Linux i macOS obecnie blokują tylko nawigację najwyższego poziomu.

Tryb jest buforowany, a nie odczytywany dla każdego okna, a filtr zasobów jest instalowany w obu trybach, więc przełączenie między `strict` i `trusted-site` dociera do już otwartej strony przy jej następnym żądaniu, zamiast wymagać ponownego otwarcia.

## Dlaczego nagrywanie pozostaje ręczne

Każda strona w przeglądarce pokazuje **Nagraj tę rozmowę**, a gdy otwarte jest jakiekolwiek okno przeglądarki, monit o spotkaniu w przeglądarce zewnętrznej jest wyciszany. Nagrywanie nadal jest ręczne — naciśnij przycisk przed rozmową lub w jej trakcie, zatrzymaj z paska lub z głównego okna. Automatyczne rozpoczęcie nagrywałoby rozmowy, których użytkownik nie poprosił o nagranie, i powodowałoby pojawienie się wskaźnika mikrofonu aplikacji bez wyraźnej akcji.

Zamknięcie okna podczas nagrywania pyta, czy zatrzymać nagrywanie, czy kontynuować je w tle, więc opuszczenie rozmowy nie może po cichu odrzucić ani kontynuować nagrania.

## Ograniczenia

- Vibe otrzymuje tylko zarejestrowany schemat spotkania lub argument uruchomienia `https`. Kliknięcie `https` wymaga decyzji o domyślnej przeglądarce, której Vibe nie podejmuje.
- Witryny z dużym DRM lub nieprzyjazne WebRTC mogą działać lepiej w przeglądarce systemowej; **Otwórz w przeglądarce systemowej** to obsługiwany wariant awaryjny.
- Windows jest sprawdzany jako pierwszy. Pozostałe platformy używają własnych webview i przechodzą do przeglądarki systemowej, jeśli okno nie może hostować rozmowy.

Fakty i zasady listy dozwolonych domen znajdują się w [dokumentacji przeglądarki spotkań](../reference/meeting-browser.md); kroki opisano w [Korzystaniu z przeglądarki spotkań](../how-to/use-the-meeting-browser.md).
