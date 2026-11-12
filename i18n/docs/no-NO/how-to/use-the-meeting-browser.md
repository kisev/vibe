<!-- source: fa863fbcee4b -->

# Bruk møtenettleseren

Vibe kan være vert for en samtale i sitt eget vindu med en linje som alltid ligger øverst, og der hovedhandlingen er **Ta opp denne samtalen**. Vinduet bruker plattformens webvisning; [Hvorfor møtenettleseren fungerer slik](/vibe/docs#meeting-browser) dekker isolasjonen og grensene.

## Åpne en samtale i Vibe

Bruk en av disse veiene:

- Åpne **Innstillinger → Opptak → Åpne i Vibe**, lim inn lenken og åpne den.
- Fra en annen app, et skript eller en snarvei, kall `vibe://open/?url=https://…`. Vibe godtar bare velformede https-URL-er og avviser alt annet med en dialog.
- Slå på **Åpne møtelenker i Vibe** under **Innstillinger → Opptak** for å registrere Zoom-, Teams- og Webex-lenker. Dette er tilgjengelig på Windows og Linux, ikke macOS.

Å klikke en https-lenke i Chrome, Edge eller Firefox åpner fortsatt den nettleseren. Vibe registrerer seg ikke som standardnettleser.

## Få opptakslinjen

**Innstillinger → Opptak → Møteverter** lister vertene som får møtelinjen. Standardverdiene er `telemost.yandex.ru` og `stream.wb.ru`.

- Legg til en vert for å gjøre lenkene dens til opptakbare økter.
- Fjern en vert for å miste linjen; lenkene dens åpnes fortsatt i nettleservinduet.

Samsvar avgjøres etter vertsnavn over https, så `sub.telemost.yandex.ru` samsvarer med en `telemost.yandex.ru`-oppføring, mens en `http`-URL ikke gjør det. Listen er et bekvemmelighetsfilter, ikke en sikkerhetsgrense: hver https-lenke åpnes i vinduet, men bare oppførte verter får linjen.

## Ta opp en samtale

1. Åpne møtet i Vibe.
1. Trykk **Ta opp denne samtalen** før eller under samtalen.
1. Stopp fra linjen eller fra hovedvinduet.

Opptak er manuelt; et møtevindu starter aldri et opptak av seg selv. Opptakeren fanger den konfigurerte mikrofonen og, når det er slått på, systemlyd-loopbacken, slik at begge sider av samtalen tas opp.

Å lukke vinduet mens du tar opp spør om du vil stoppe eller fortsette opptaket i bakgrunnen.

## Fall tilbake til systemnettleseren

Hvis en tjeneste nekter å kjøre i den innebygde webvisningen, bruk **Åpne i systemnettleseren** i linjen. Det er den støttede fallbacken for DRM-tunge eller WebRTC-fiendtlige nettsteder.

## Neste steg

- [Hvorfor møtenettleseren fungerer slik](/vibe/docs#meeting-browser) forklarer URL-ordningen, den isolerte webvisningen og regelen om manuelt opptak.
- [Ta opp mikrofon og systemlyd](/vibe/docs#record-audio) dekker opptak utenfor en samtale.
