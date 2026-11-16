<!-- source: aa8415261690 -->

# Importuj własny model

Vibe uruchamia modele GGUF przez dołączony silnik. Katalog w **Ustawienia → Modele** obejmuje przetestowane rodziny; ten przewodnik dodaje model, którego katalog nie wymienia. [Modele](/vibe/docs#models) to dokumentacja referencyjna tego, co obsługuje każda rodzina.

## Pobierz z adresu URL

1. Otwórz **Ustawienia → Modele**.
1. Wklej bezpośredni link do modelu w **Pobierz model** i potwierdź.
1. Poczekaj na zakończenie pobierania; plik trafia do folderu modeli.
1. Wybierz nowy model na liście modeli.

Vibe akceptuje to samo żądanie również jako link bezpośredni:

```text
vibe://download/?url=https://example.com/model.gguf
```

Wklejony adres URL nie zawiera rozmiaru ani sumy kontrolnej, więc Vibe sprawdza pobrane bajty i nagłówek GGUF/BIN przed przyjęciem pliku. Wpisy katalogu w [Modele](/vibe/docs#models) zawierają przypiętą wersję, rozmiar i SHA-256.

## Użyj pliku z dysku

1. Umieść plik `.gguf` w folderze modeli. Ścieżka folderu znajduje się w **Ustawienia → Modele → Folder modeli**, co również go otwiera.
1. Wróć do **Ustawienia → Modele**; plik pojawi się na liście zainstalowanych.
1. Wybierz go.

Przenoś lub zmieniaj nazwę folderu tylko przez **Zmień folder modeli**, a następnie wybierz model ponownie.

## Gdy model się nie ładuje

- Plik musi być w formacie GGUF lub w starszym kontenerze `.bin` akceptowanym przez silnik.
- Model wymagający nowszego transcribe.cpp niż dołączony jest wymieniony w katalogu, ale nie może się jeszcze załadować.
- Model z ustalonym językiem odrzuca inny język; błąd podaje obsługiwany język.

## Dalsze kroki

- [Modele](/vibe/docs#models) dla przetestowanego katalogu i limitów poszczególnych rodzin.
- [Wiersz poleceń](/vibe/docs#cli), aby uruchomić model bez okna.
