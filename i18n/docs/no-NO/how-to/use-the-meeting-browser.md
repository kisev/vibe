<!-- source: a039b159d4fd -->

# Bruk møtenettleseren

Vibe kan være vert for en samtale i sitt eget Chromium-baserte vindu: appens nettleserlinje (adresse, tilbake, fremover, last inn på nytt, åpne eksternt, lukk og **Ta opp denne samtalen**) ligger øverst, og siden fyller resten av det samme vinduet. Det finnes ikke noe eget vindu for linjen. Se [Møtenettleser-referansen](../reference/meeting-browser.md) for URL-ordningene og tillatelseslisten, og [forklaringen](../explanation/meeting-browser.md) for hvorfor mekanismen virker slik.

## Åpne en samtale i Vibe

Bruk en av disse veiene:

- Fra en annen app eller systemet: slå på **Åpne møtelenker i Vibe** under **Innstillinger → Opptak** for å registrere Zoom-, Teams- og Webex-lenker (Windows og Linux, ikke macOS). Appen validerer den tilknyttede URL-en og åpner den i nettleservinduet når verten får lastes, ellers i systemnettleseren.
- Inne i Vibe: **Møtenettleser**-kilden på hjemmesiden, eller **Innstillinger → Opptak → Åpne i Vibe**; lim inn lenken og trykk **Åpne i Vibe**.
- Verten til lenken må stå i tillatelseslisten; navigasjon på toppnivå og ressurser fra andre opprinnelser utenfor den avvises. Nettleserlinjens opptakskontroller finnes på hver tillatte side.

Å klikke en https-lenke i Chrome, Edge eller Firefox åpner fortsatt den nettleseren. Vibe registrerer seg ikke som standardnettleser.

## Ta opp en samtale

1. Åpne møtet i Vibe.
1. Trykk **Ta opp denne samtalen** i nettleserlinjen før eller under samtalen.
1. Stopp fra nettleserlinjen eller fra hovedvinduet.

Opptak er manuelt; et møtevindu starter aldri et opptak av seg selv. Opptakeren fanger den konfigurerte mikrofonen og, når det er slått på, systemlyd-loopbacken, slik at begge sider av samtalen tas opp.

Mikrofon- og høyttalervelgerne i nettleserlinjen endrer de samme enhetene som hovedvinduet bruker, slik at en samtale kan rutes uten å forlate den. Mens et opptak pågår, er de deaktivert og angir enhetene det fanger; en kilde opptaket ikke fanger, viser **Ingen**.

Å lukke vinduet mens du tar opp spør om du vil stoppe eller fortsette opptaket i bakgrunnen.

## Tillat nettstedene du bruker

**Innstillinger → Opptak → Tillatte domener** er nettleserens tillatelsesliste; den starter tom. Legg til hvert domene du trenger, og underdomenene inkluderes over https.

Bare oppførte domener får lastes. En lenke til en annen vert avvises, og det samme gjør ethvert skript, enhver skrifttype eller ethvert bilde som en tillatt side henter fra en ikke-oppført opprinnelse. Avviste verter vises under **Blokkert** med en **Tillat**-handling som legger til domenet og laster inn siden på nytt. Nettleserlinjen viser det samme tilbudet når den avviser en navigasjon.

Den strenge listen kan ødelegge en side hvis ressurser kommer fra et CDN, helt til det CDN-et er tillatt; det er den tilsiktede avveiningen, og Blokkert-listen gjør rettelsen til ett klikk.

## Fall tilbake til systemnettleseren

Hvis en tjeneste nekter å kjøre i den innebygde webvisningen, bruk **Åpne i systemnettleseren** i nettleserlinjen. Systemnettleseren er den støttede fallbacken for DRM-tunge eller WebRTC-fiendtlige nettsteder.

På macOS har den innebygde nettleseren ingen nettleserlinje i vinduet: siden åpnes i et vindu med bare siden, opptak er fortsatt tilgjengelig fra hovedvinduet, og systemnettleseren er fallbacken for hele samtalen.
