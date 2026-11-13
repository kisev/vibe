<!-- source: 7770d2556ea9 -->

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

## Hvorfor nettleseren er en tillatelsesliste

Den innebygde nettleseren lastet opprinnelig alt en side ba om; møtevertlisten avgjorde bare hvilke lenker som fikk opptakslinjen. Nå er den en reell grense. Bare domener brukeren har tillatt, og underdomenene deres over https, kan lastes — sider på toppnivå og hver ressurs siden ber om. En avvist ressurs besvares med et feilsvar, slik at siden behandler den opprinnelsen som utilgjengelig i stedet for å prøve på nytt i det uendelige.

Strenghet er poenget, og den har en pris: en side som henter skrifttyper eller skript fra et CDN, går i stykker helt til det CDN-et er tillatt. Den blokkerte listen er botemiddelet — unike verter, nyeste først, hver med en **Tillat**-handling som legger til domenet og laster inn siden på nytt. Grensesnittet gir det samme tilbudet når det avviser en navigasjon.

## Hvorfor opptak forblir manuelt

Hver side i nettleservinduet viser **Ta opp denne samtalen**, og mens et nettleservindu er åpent, undertrykker Vibe sin egen eksterne samtaleforespørsel. Opptak er fortsatt manuelt — trykk på knappen før eller under samtalen, og stopp fra grensesnittet eller hovedvinduet. Automatisk start ville ta opp samtaler brukeren ikke ba om, og ville få mikrofonindikatoren til å vises uten en uttrykkelig handling.

Å lukke vinduet mens du tar opp spør om du vil stoppe eller fortsette opptaket i bakgrunnen, slik at det å forlate en samtale ikke stille kan forkaste eller fortsette et opptak.

## Begrensninger

- Bare `vibe://open/`-lenker åpnes automatisk. Et `https`-klikk trenger standardnettleserbeslutningen Vibe ikke tar.
- DRM-tunge eller WebRTC-fiendtlige nettsteder kan fungere bedre i systemnettleseren; **Åpne i systemnettleseren** er den støttede fallbacken.
- Windows valideres først. Ressursblokkering bruker hver motorens egen mekanisme: WebView2 `WebResourceRequested` på Windows; Linux og macOS blokkerer for øyeblikket bare navigasjon på toppnivå og er under ferdigstillelse.
- Registrering av Zoom-, Teams- og Webex-ordninger er valgfri og tilgjengelig på Windows og Linux, ikke macOS.

## Relaterte sider

- [Bruk møtenettleseren](/vibe/docs#use-the-meeting-browser) for trinnene.
- [Ta opp mikrofon og systemlyd](/vibe/docs#record-audio) for selve opptakeren.
