<!-- source: bc1a1519974a -->

# Przełączanie kanałów aktualizacji

Vibe sprawdza jeden z trzech kanałów aktualizacji: Wydanie, Beta lub Dev. Kanał decyduje o tym, jakie kompilacje oferuje aplikacja, i zawsze przesuwa się tylko do przodu.

## Wybierz kanał

1. Otwórz **Ustawienia → Ogólne → Aktualizacje**.
1. Wybierz **Wydanie**, **Beta** lub **Dev**.
1. Naciśnij **Sprawdź aktualizacje**.

Ta sama sekcja pokazuje zainstalowaną wersję, czas ostatniego sprawdzenia i wynik. Sprawdzanie uruchamia się również przy starcie.

## Co zawiera każdy kanał

| Kanał | Kompilacje |
| --- | --- |
| Wydanie | Stabilne wersje |
| Beta | Wersje kandydujące do następnej stabilnej wersji |
| Dev | Najnowsze kompilacje `dev` |

Instalacja Wydania lub Beta, która wybierze Dev, widzi **Aktualne**: każda kompilacja dev sortuje się poniżej wersji, która jest już uruchomiona. Przejście na linię dev wymaga jednej ręcznej instalacji kompilacji dev; potem kanał Dev aktualizuje ją do przodu.

Instalacja Beta przechodzi do finalnego wydania przez przełączenie na Wydanie, gdzie stabilna wersja sortuje się powyżej swoich wersji kandydujących.

## Dalsze kroki

- [Kanały aktualizacji](/vibe/docs#update-channels) dla plików kanałów i reguł tagów.
- [Dlaczego kanały aktualizacji działają w ten sposób](/vibe/docs#update-channels-design) dla porządkowania wersji.
