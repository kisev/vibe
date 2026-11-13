<!-- source: cc4651e4e37d -->

# Bruk møtenettleseren

Vibe kan være vert for en samtale i sitt eget vindu med en linje som alltid ligger øverst, og der hovedhandlingen er **Ta opp denne samtalen**. Vinduet bruker plattformens webvisning; [Hvorfor møtenettleseren fungerer slik](/vibe/docs#meeting-browser) dekker isolasjonen og grensene.

## Åpne en samtale i Vibe

Bruk en av disse veiene:

- Åpne **Innstillinger → Opptak → Åpne i Vibe**, lim inn lenken og åpne den.
- Fra en annen app, et skript eller en snarvei, kall `vibe://open/?url=https://…`. Vibe godtar bare velformede https-URL-er og avviser alt annet med en dialog.
- Slå på **Åpne møtelenker i Vibe** under **Innstillinger → Opptak** for å registrere Zoom-, Teams- og Webex-lenker. Dette er tilgjengelig på Windows og Linux, ikke macOS.

Å klikke en https-lenke i Chrome, Edge eller Firefox åpner fortsatt den nettleseren. Vibe registrerer seg ikke som standardnettleser.

## Tillat nettstedene du bruker

**Innstillinger → Opptak → Tillatte domener** er nettleserens tillatelsesliste. Den starter tom: legg til hvert domene du vil åpne, og underdomenene tas med automatisk. Samsvar avgjøres etter vertsnavn over https — en `http`-URL lastes aldri.

Listen er en grense, ikke et filter. En lenke til en vert utenfor den avvises, og det samme gjør ethvert skript, enhver skrifttype eller ethvert bilde som en tillatt side ber om fra en ikke-oppført opprinnelse. Hver avvist vert vises under **Blokkert** med en **Tillat**-handling; å tillate den legger til domenet og laster inn siden på nytt slik at de avviste ressursene prøver igjen.

En streng liste kan ødelegge en side hvis ressurser kommer fra et CDN, helt til det CDN-et er tillatt. Den blokkerte listen er botemiddelet, og nettleserens eget grensesnitt viser det samme tilbudet når det avviser en navigasjon. Så lenge et nettleservindu er åpent, undertrykker Vibe sin egen samtaleforespørsel.

## Ta opp en samtale

Opptakskontrollene i grensesnittet finnes på hver tillatte side, ikke bare på en vertsliste.

1. Åpne møtet i Vibe.
1. Trykk **Ta opp denne samtalen** før eller under samtalen.
1. Stopp fra grensesnittet eller fra hovedvinduet.

Opptak er manuelt; et møtevindu starter aldri et opptak av seg selv. Opptakeren fanger den konfigurerte mikrofonen og, når det er slått på, systemlyd-loopbacken, slik at begge sider av samtalen tas opp.

Å lukke vinduet mens du tar opp spør om du vil stoppe eller fortsette opptaket i bakgrunnen.

## Fall tilbake til systemnettleseren

Hvis en tjeneste nekter å kjøre i den innebygde webvisningen, bruk **Åpne i systemnettleseren** i linjen. Det er den støttede fallbacken for DRM-tunge eller WebRTC-fiendtlige nettsteder.

## Neste steg

- [Hvorfor møtenettleseren fungerer slik](/vibe/docs#meeting-browser) forklarer URL-ordningen, den isolerte webvisningen, avveiningen med tillatelseslisten og regelen om manuelt opptak.
- [Ta opp mikrofon og systemlyd](/vibe/docs#record-audio) dekker opptak utenfor en samtale.
