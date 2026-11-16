<!-- source: aa8415261690 -->

# Importer en egendefinert modell

Vibe kjører GGUF-modeller gjennom den innebygde motoren. Katalogen i **Innstillinger → Modeller** dekker de testede familiene; denne veiledningen legger til en som katalogen ikke lister. [Modeller](/vibe/docs#models) er referansen for hva hver familie støtter.

## Last ned fra en URL

1. Åpne **Innstillinger → Modeller**.
1. Lim inn en direkte modelllenke i **Last ned modell** og bekreft.
1. Vent til nedlastingen er ferdig; filen havner i modellmappen.
1. Velg den nye modellen i modellisten.

Vibe godtar også samme forespørsel som en dyp lenke:

```text
vibe://download/?url=https://example.com/model.gguf
```

En innlimt URL har ingen størrelse eller sjekksum, så Vibe kontrollerer de nedlastede byttene og GGUF/BIN-overskriften før filen godtas. Katalogoppføringene i [Modeller](/vibe/docs#models) har en festet revisjon, størrelse og SHA-256.

## Bruk en fil på disken

1. Legg `.gguf`-filen i modellmappen. Mappebanen står i **Innstillinger → Modeller → Modellmappe**, som også åpner den.
1. Gå tilbake til **Innstillinger → Modeller**; filen vises i listen over installerte.
1. Velg den.

Flytt eller gi mappen nytt navn bare gjennom **Endre modellmappe**, og velg deretter modellen på nytt.

## Når en modell ikke vil lastes

- Filen må være GGUF eller den eldre `.bin`-beholderen motoren godtar.
- En modell som krever en nyere transcribe.cpp enn den innebygde, er oppført i katalogen, men kan ikke lastes ennå.
- En modell med et fast språk avviser et annet språk; feilen navngir det støttede språket.

## Neste steg

- [Modeller](/vibe/docs#models) for den testede katalogen og grenser per familie.
- [Kommandolinje](/vibe/docs#cli) for å kjøre en modell uten vinduet.
