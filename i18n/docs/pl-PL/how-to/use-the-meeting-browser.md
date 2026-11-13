<!-- source: cc4651e4e37d -->

# Korzystanie z przeglądarki spotkań

Vibe może hostować rozmowę we własnym oknie z paskiem zawsze na wierzchu, którego główna akcja to **Nagraj tę rozmowę**. Okno korzysta z webview platformy; [Dlaczego przeglądarka spotkań działa w ten sposób](/vibe/docs#meeting-browser) omawia izolację i ograniczenia.

## Otwórz rozmowę w Vibe

Użyj jednej z tych ścieżek:

- Otwórz **Ustawienia → Nagrywanie → Otwórz w Vibe**, wklej link i otwórz go.
- Z innej aplikacji, skryptu lub skrótu wywołaj `vibe://open/?url=https://…`. Vibe akceptuje tylko poprawnie sformułowane adresy https i odrzuca wszystko inne oknem dialogowym.
- Włącz **Otwieraj linki do spotkań w Vibe** w **Ustawienia → Nagrywanie**, aby zarejestrować linki Zoom, Teams i Webex. Jest to dostępne w Windows i Linux, nie w macOS.

Kliknięcie linku https w Chrome, Edge lub Firefox nadal otwiera tę przeglądarkę. Vibe nie rejestruje się jako domyślna przeglądarka.

## Zezwól na używane witryny

**Ustawienia → Nagrywanie → Dozwolone domeny** to lista dozwolonych przeglądarki. Zaczyna się pusta: dodaj każdą domenę, którą chcesz otwierać, a jej subdomeny zostaną uwzględnione automatycznie. Dopasowanie odbywa się po nazwie hosta przez https — adres `http` nigdy się nie wczyta.

Lista to granica, a nie filtr. Link do hosta spoza niej jest odrzucany, podobnie jak każdy skrypt, czcionka lub obraz, którego dozwolona strona żąda z niewymienionego źródła. Każdy odrzucony host pojawia się w sekcji **Zablokowane** z akcją **Zezwól**; zezwolenie dodaje domenę i ponownie wczytuje stronę, aby odrzucone zasoby zostały ponowione.

Ścisła lista może zepsuć stronę, której zasoby pochodzą z CDN, dopóki ta CDN nie zostanie dozwolona. Lista „Zablokowane“ jest rozwiązaniem, a interfejs przeglądarki pokazuje tę samą propozycję, gdy odmawia nawigacji. Gdy otwarte jest jakiekolwiek okno przeglądarki, Vibe ukrywa własne zapytanie o nagrywanie.

## Nagraj rozmowę

Kontrolki nagrywania w interfejsie przeglądarki są na każdej dozwolonej stronie, nie tylko na hoście z listy.

1. Otwórz spotkanie w Vibe.
1. Naciśnij **Nagraj tę rozmowę** przed rozmową lub w jej trakcie.
1. Zatrzymaj z interfejsu przeglądarki lub z głównego okna.

Nagrywanie jest ręczne; okno spotkania nigdy nie rozpoczyna nagrywania samo. Rejestrator przechwytuje skonfigurowany mikrofon i, gdy włączono, pętlę zwrotną dźwięku systemowego, więc obie strony rozmowy są nagrywane.

Zamknięcie okna podczas nagrywania pyta, czy zatrzymać nagrywanie, czy kontynuować je w tle.

## Wróć do przeglądarki systemowej

Jeśli usługa odmawia działania w osadzonym webview, użyj **Otwórz w przeglądarce systemowej** na pasku. To obsługiwany wariant awaryjny dla witryn z dużym DRM lub nieprzyjaznych WebRTC.

## Dalsze kroki

- [Dlaczego przeglądarka spotkań działa w ten sposób](/vibe/docs#meeting-browser) wyjaśnia schemat URL, izolowany webview, kompromis z listą dozwolonych domen i zasadę ręcznego nagrywania.
- [Nagrywanie mikrofonu i dźwięku systemowego](/vibe/docs#record-audio) dotyczy nagrywania poza rozmową.
