<!-- source: 42d301759b1a -->

# Hvorfor møtenettleseren fungerer slik

En samtale er lettere å ta opp når Vibe er vert for siden selv: appen kontrollerer vinduet, vet når et opptak pågår og kan vise en linje med én handling. Designet er formet av hva operativsystemet faktisk tillater.

## Hvorfor en URL-ordning i stedet for https-klikk

En nettleser gir aldri en `https://`-lenke til en installert app med mindre appen er standardnettleser. Møteapper gjør det motsatte: de registrerer sin egen ordning, og sidene eller installasjonsprogrammene deres kaller den.

Vibe gjør det samme:

- `vibe://open/?url=https://…` åpner målet i Vibes nettleservindu. Enhver app, ethvert skript eller enhver snarvei kan kalle den. Vibe validerer URL-en i Rust og avviser alt som ikke er https og velformet.
- **Innstillinger → Opptak → Åpne i Vibe** limer inn en lenke i samme vei.

Å klikke en `https`-lenke i Chrome, Edge eller Firefox åpner fortsatt den nettleseren. Å gjøre Vibe til standardnettleser er bevisst utenfor omfanget: det ville ta over hver lenke på maskinen for å betjene én funksjon.

## Hvorfor innholdsvisningen er isolert

Innholdsvinduet er en vanlig webvisning med sin egen datamappe. Tjenestens informasjonskapsler blandes aldri med appens lagring, ingen skript injiseres i siden, og forespørsler om kamera og mikrofon kommer fra selve siden i stedet for at Vibe gir dem på brukerens vegne. Den innebygde siden behandles som ubetrodd webinnhold, ikke som en del av appen.

Linjen tilbyr adresse, tilbake, fremover, oppdater, lukk og **Åpne i systemnettleseren**. Den siste handlingen er nødutgangen for en tjeneste som nekter å kjøre i den innebygde webvisningen.

## Hvorfor opptak forblir manuelt

Verter i møtelisten gjør vinduet til en møteøkt: linjen viser **Ta opp denne samtalen**. Opptak er fortsatt manuelt — trykk på knappen før eller under samtalen, og stopp fra linjen eller hovedvinduet. Automatisk start ville ta opp samtaler brukeren ikke ba om, og ville få mikrofonindikatoren til å vises uten en uttrykkelig handling.

Å lukke vinduet mens du tar opp spør om du vil stoppe eller fortsette opptaket i bakgrunnen, slik at det å forlate en samtale ikke stille kan forkaste eller fortsette et opptak.

## Begrensninger

- Bare `vibe://open/`-lenker åpnes automatisk. Et `https`-klikk trenger standardnettleserbeslutningen Vibe ikke tar.
- DRM-tunge eller WebRTC-fiendtlige nettsteder kan fungere bedre i systemnettleseren; **Åpne i systemnettleseren** er den støttede fallbacken.
- Windows valideres først. De andre plattformene bruker sine egne webvisninger og faller tilbake til systemnettleseren hvis vinduet ikke kan være vert for samtalen.
- Registrering av Zoom-, Teams- og Webex-ordninger er valgfri og tilgjengelig på Windows og Linux, ikke macOS.

## Relaterte sider

- [Bruk møtenettleseren](/vibe/docs#use-the-meeting-browser) for trinnene.
- [Ta opp mikrofon og systemlyd](/vibe/docs#record-audio) for selve opptakeren.
