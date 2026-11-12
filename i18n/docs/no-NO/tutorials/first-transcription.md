<!-- source: a0b0bbb0302c -->

# Transkriber ditt første opptak

Denne veiledningen transkriberer én mediefil med standardmodellen. Den forutsetter at Vibe er installert og at standardmodellen er lastet ned; [Installer Vibe](/vibe/docs#install) dekker det.

## Legg til en fil

1. Åpne Vibe.
1. Slipp en lyd- eller videofil på slippområdet, eller velg **Fil** og plukk en.
1. Vent til filen vises i køen.

Vibe godtar formatene i [Støttede formater](/vibe/docs#formats). Appen normaliserer mediet med ffmpeg før transkripsjon, så en uvanlig beholder kan fortsatt fungere.

## Start transkripsjonen

1. La språket stå på automatisk, eller velg et språk når gjenkjenningen tar feil.
1. Trykk **Transkriber**.
1. Følg forhåndsvisningen i sanntid. **Avbryt** stopper kjøringen uten å slette opptaket.

Skrivebordsappen starter `vibe-server` i bakgrunnen og sender lyden til den over lokal HTTP. Serveren laster den valgte modellen, transkriberer og returnerer segmenter med tidsstempler.

## Les resultatet

Transkripsjonen åpnes når kjøringen er ferdig. Hver linje kan redigeres på stedet, og endringen lagres med prosjektet.

For å merke talere, slå på **Identifiser talere** under **Flere alternativer** før kjøringen. Talergjenkjenning bruker Nemotron-3-modellen og merker opptil 8 talere.

## Eksporter

Åpne eksportdialogen og velg et format: TXT, Markdown, SRT, VTT, HTML, JSON, CSV, DOCX eller PDF. [Støttede formater](/vibe/docs#formats) forklarer hva hvert av dem inneholder.

## Neste steg

- [Ta opp mikrofon og systemlyd](/vibe/docs#record-audio) når lyden er en samtale i sanntid i stedet for en fil.
- [Modeller](/vibe/docs#models) når du trenger et annet språk, høyere hastighet eller bedre nøyaktighet.
- [Kommandolinje](/vibe/docs#cli) for å kjøre samme motor uten vinduet.
