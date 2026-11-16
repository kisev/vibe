<!-- source: b806d3524bf0 -->

# Transkrypcja z linku

Vibe pobiera dźwięk spod adresu URL multimediów za pomocą yt-dlp i transkrybuje wynik. Obsługiwane witryny to te, które obsługuje yt-dlp; gdy witryna przestaje działać, zwykle naprawia to zaktualizowany yt-dlp.

## Wyślij link

1. Otwórz Vibe i wybierz **Z linku**.
1. Wklej jeden adres URL lub wklej kilka oddzielonych białymi znakami, aby dodać je wszystkie do kolejki.
1. Naciśnij **Transkrybuj**.

Vibe prosi o zainstalowanie yt-dlp przy pierwszym użyciu linku oraz o jego aktualizację, gdy witryna zawiedzie. Pobrany dźwięk jest tymczasowy; transkrypcja jest zapisywana jak każdy inny projekt.

## Czego się spodziewać

- Pojedynczy link zaczyna się, gdy tylko zakończy się pobieranie.
- Kolejka przetwarza jeden link naraz i pokazuje postęp dla każdego elementu.
- Wagi, modele i transkrypcja pozostają lokalnie. Samo pobieranie łączy się z hostem multimediów oraz z GitHubem w celu pobrania yt-dlp.

## Dalsze kroki

- [Obsługiwane formaty](/vibe/docs#formats) dla plików lokalnych i opcji eksportu.
- [Modele](/vibe/docs#models), gdy dźwięk wymaga innego języka lub dokładności.
