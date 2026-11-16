<!-- source: 03e5a04c40fd -->

# Installer Vibe

Denne veiledningen tar en ny maskin fra nedlasting til et kjørende Vibe-vindu. Den forutsetter en stasjonær datamaskin med internettforbindelse og ingen eksisterende installasjon. [Transkriber ditt første opptak](/vibe/docs#first-transcription) er neste steg.

## Last ned installasjonsprogrammet

Åpne [nedlastingssiden](https://kisev.github.io/vibe/) og velg bygget for denne maskinen:

| Plattform | Bygg |
| --- | --- |
| Windows | `.exe`-installasjonsprogram |
| macOS, Apple-brikke | `aarch64.dmg` |
| macOS, Intel | `x64.dmg` |
| Linux | `.deb` eller `.rpm`, x86-64 eller arm64 |

De samme filene er vedlagt hver [GitHub-utgivelse](https://github.com/kisev/vibe/releases). Linux-`.deb`-pakken deklarerer kjøretidsavhengighetene sine, inkludert `ffmpeg`.

## Installer og åpne

1. Kjør installasjonsprogrammet og følg instruksjonene.
1. Åpne Vibe fra programmenyen, eller kjør `vibe` fra en terminal.

Utgivelsesbygg er usignerte. På macOS må første oppstart gjøres med høyreklikk → **Åpne** i Finder for å passere Gatekeeper; senere oppstarter åpnes normalt. Windows SmartScreen kan vise en advarsel av samme grunn.

## Fullfør oppsettet

Ved første oppstart tilbyr Vibe standardmodellen. Godta nedlastingen og vent til den er ferdig. Modellen lagres lokalt og brukes på nytt ved hver senere kjøring; [Modeller](/vibe/docs#models) lister alternativene.

Vinduet er klart når slippområdet og handlingene **Ta opp** og **Fra lenke** er synlige.

## Neste steg

- [Transkriber ditt første opptak](/vibe/docs#first-transcription) bruker denne installasjonen.
- [Støttede formater](/vibe/docs#formats) lister hva Vibe kan åpne og eksportere.
- [Feilsøk en krasj](https://github.com/kisev/vibe/blob/main/docs/how-to/troubleshoot-a-crash.md) dekker logger og diagnostikk hvis vinduet ikke åpnes.
