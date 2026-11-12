<!-- source: fa863fbcee4b -->

# Korzystanie z przeglądarki spotkań

Vibe może hostować rozmowę we własnym oknie z paskiem zawsze na wierzchu, którego główna akcja to **Nagraj tę rozmowę**. Okno korzysta z webview platformy; [Dlaczego przeglądarka spotkań działa w ten sposób](/vibe/docs#meeting-browser) omawia izolację i ograniczenia.

## Otwórz rozmowę w Vibe

Użyj jednej z tych ścieżek:

- Otwórz **Ustawienia → Nagrywanie → Otwórz w Vibe**, wklej link i otwórz go.
- Z innej aplikacji, skryptu lub skrótu wywołaj `vibe://open/?url=https://…`. Vibe akceptuje tylko poprawnie sformułowane adresy https i odrzuca wszystko inne oknem dialogowym.
- Włącz **Otwieraj linki do spotkań w Vibe** w **Ustawienia → Nagrywanie**, aby zarejestrować linki Zoom, Teams i Webex. Jest to dostępne w Windows i Linux, nie w macOS.

Kliknięcie linku https w Chrome, Edge lub Firefox nadal otwiera tę przeglądarkę. Vibe nie rejestruje się jako domyślna przeglądarka.

## Uzyskaj pasek nagrywania

**Ustawienia → Nagrywanie → Hosty spotkań** zawierają listę hostów, które otrzymują pasek spotkania. Domyślne to `telemost.yandex.ru` i `stream.wb.ru`.

- Dodaj hosta, aby jego linki były sesjami możliwymi do nagrania.
- Usuń hosta, aby stracić pasek; jego linki nadal otwierają się w oknie przeglądarki.

Dopasowanie odbywa się po nazwie hosta przez https, więc `sub.telemost.yandex.ru` pasuje do wpisu `telemost.yandex.ru`, a adres `http` nie. Lista to filtr wygody, a nie granica bezpieczeństwa: każdy link https otwiera się w oknie, ale tylko wymienione hosty otrzymują pasek.

## Nagraj rozmowę

1. Otwórz spotkanie w Vibe.
1. Naciśnij **Nagraj tę rozmowę** przed rozmową lub w jej trakcie.
1. Zatrzymaj z paska lub z głównego okna.

Nagrywanie jest ręczne; okno spotkania nigdy nie rozpoczyna nagrywania samo. Rejestrator przechwytuje skonfigurowany mikrofon i, gdy włączono, pętlę zwrotną dźwięku systemowego, więc obie strony rozmowy są nagrywane.

Zamknięcie okna podczas nagrywania pyta, czy zatrzymać nagrywanie, czy kontynuować je w tle.

## Wróć do przeglądarki systemowej

Jeśli usługa odmawia działania w osadzonym webview, użyj **Otwórz w przeglądarce systemowej** na pasku. To obsługiwany wariant awaryjny dla witryn z dużym DRM lub nieprzyjaznych WebRTC.

## Dalsze kroki

- [Dlaczego przeglądarka spotkań działa w ten sposób](/vibe/docs#meeting-browser) wyjaśnia schemat URL, izolowany webview i zasadę ręcznego nagrywania.
- [Nagrywanie mikrofonu i dźwięku systemowego](/vibe/docs#record-audio) dotyczy nagrywania poza rozmową.
