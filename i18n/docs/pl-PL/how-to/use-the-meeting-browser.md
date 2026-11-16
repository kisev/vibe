<!-- source: a039b159d4fd -->

# Korzystanie z przeglądarki spotkań

Vibe może hostować rozmowę we własnym oknie opartym na Chromium: pasek aplikacji (adres, wstecz, dalej, odświeżenie, otwarcie w przeglądarce systemowej, zamknięcie i **Nagraj tę rozmowę**) znajduje się u góry, a strona wypełnia resztę tego samego okna. Nie ma osobnego okna paska. Zobacz [dokumentację przeglądarki spotkań](../reference/meeting-browser.md), aby poznać schematy URL i listę dozwolonych domen, oraz [wyjaśnienie](../explanation/meeting-browser.md), dlaczego mechanizm działa w ten sposób.

## Otwórz rozmowę w Vibe

Użyj jednej z tych ścieżek:

- Z innej aplikacji lub z systemu: włącz **Otwieraj linki do spotkań w Vibe** w **Ustawienia → Nagrywanie**, aby zarejestrować linki Zoom, Teams i Webex (Windows i Linux, nie macOS). Aplikacja waliduje zmapowany adres URL i otwiera go w oknie przeglądarki, gdy jego host może się wczytać, a w przeciwnym razie w przeglądarce systemowej.
- W Vibe: źródło **Przeglądarka spotkań** na stronie głównej lub **Ustawienia → Nagrywanie → Otwórz w Vibe**; wklej link i naciśnij **Otwórz w Vibe**.
- Host linku musi znajdować się na liście dozwolonych domen; nawigacja najwyższego poziomu i zasoby cross-origin spoza niej są odrzucane. Kontrolki nagrywania na pasku są obecne na każdej dozwolonej stronie.

Kliknięcie linku https w Chrome, Edge lub Firefox nadal otwiera tę przeglądarkę. Vibe nie rejestruje się jako domyślna przeglądarka.

## Nagraj rozmowę

1. Otwórz spotkanie w Vibe.
1. Naciśnij **Nagraj tę rozmowę** na pasku okna przed rozmową lub w jej trakcie.
1. Zatrzymaj z paska lub z głównego okna.

Nagrywanie jest ręczne; okno spotkania nigdy nie rozpoczyna nagrywania samo. Rejestrator przechwytuje skonfigurowany mikrofon i, gdy włączono, pętlę zwrotną dźwięku systemowego, więc obie strony rozmowy są nagrywane.

Selektory mikrofonu i głośników na pasku zmieniają te same urządzenia, których używa główne okno, więc rozmowę można skierować bez jej opuszczania. Gdy trwa nagrywanie, są wyłączone i nazywają urządzenia, które przechwytuje; źródło, którego to nagranie nie przechwytuje, wyświetla **Brak**.

Zamknięcie okna podczas nagrywania pyta, czy zatrzymać nagrywanie, czy kontynuować je w tle.

## Zezwól na używane witryny

**Ustawienia → Nagrywanie → Dozwolone domeny** to lista dozwolonych przeglądarki; zaczyna się pusta. Dodaj każdą potrzebną domenę, a jej subdomeny zostaną uwzględnione przez https.

Wczytywać mogą się tylko wymienione domeny. Link do innego hosta jest odrzucany, podobnie jak każdy skrypt, czcionka lub obraz, który dozwolona strona pobiera z niewymienionego źródła. Odrzucone hosty pojawiają się w sekcji **Zablokowane** z akcją **Zezwól**, która dodaje domenę i ponownie wczytuje stronę. Pasek pokazuje tę samą propozycję, gdy odmawia nawigacji.

Ścisła lista może zepsuć stronę, której zasoby pochodzą z CDN, dopóki ta CDN nie zostanie dozwolona; to zamierzony kompromis, a lista Zablokowane pozwala naprawić to jednym kliknięciem.

## Wróć do przeglądarki systemowej

Jeśli usługa odmawia działania w osadzonym webview, użyj **Otwórz w przeglądarce systemowej** na pasku. Przeglądarka systemowa to obsługiwany wariant awaryjny dla witryn z dużym DRM lub nieprzyjaznych WebRTC.

W macOS osadzona przeglądarka nie ma paska w oknie: strona otwiera się w oknie tylko ze stroną, nagrywanie pozostaje dostępne z głównego okna, a przeglądarka systemowa jest wariantem awaryjnym dla całej rozmowy.
