<!-- source: 6737f12a1fc7 -->

# Møtenettleseren

Møtenettleseren finnes fordi en samtale er lettere å ta opp når Vibe selv er vert for siden: appen kontrollerer vinduet, vet når et opptak pågår, og kan vise sin egen nettleserlinje med én handling. Designet er formet av hva operativsystemet faktisk tillater.

## Hvorfor en URL-ordning i stedet for https-klikk

En nettleser gir aldri en `https://`-lenke til en installert app med mindre den appen er standardnettleseren. Skrivebordsbaserte møteapper gjør det motsatte: de registrerer sin egen ordning (`zoommtg://`, `msteams://`, `mattermost://`), og deres egne sider eller installasjonsprogrammer kaller den.

Vibe gjør det samme, på en ærlig måte:

- Slå på **Åpne møtelenker i Vibe**, og Vibe registrerer møteordningene Zoom, Teams og Webex allerede bruker (`zoommtg://`, `msteams://`, `webex://`) og kobler hver av dem til nettadressen den bærer. Appen validerer URL-en i Rust og åpner den i nettleservinduet når verten får lastes, ellers i systemnettleseren.
- En `https`-URL som overleveres som startargument, tar samme vei.
- Inne i appen limer **Møtenettleser**-kilden på hjemmesiden og **Innstillinger → Opptak → Åpne i Vibe** inn en lenke i samme løype.

Vibe leverer bevisst ingen egen `vibe://open/`-lenke: ingen møteside sender ut en slik, og derfor ble det første inngangspunktet fjernet. Å klikke en `https`-lenke i Chrome, Edge eller Firefox åpner fortsatt den nettleseren. Å gjøre Vibe til standardnettleser er bevisst utenfor omfanget: det ville ta over hver lenke på maskinen for å betjene én funksjon, og det ville fortsatt være en brukerbeslutning.

## Hvorfor innholdsvisningen er isolert

Vinduet rommer to underordnede webvisninger: Vibes nettleserlinje og den eksterne siden. Nettleserlinjen er appens grensesnitt og har appens tillatelser; siden er vanlig ubetrodd webinnhold helt uten tillatelser, uten skript injisert i den, og med kamera- og mikrofonforespørsler som kommer fra siden selv i stedet for at Vibe gir dem på brukerens vegne. Begge deler prosessens WebView2-miljø, fordi WebView2 ikke støtter en andre datamappe i én prosess.

Nettleserlinjen tilbyr adresse, tilbake, fremover, last inn på nytt, lukk og **Åpne i systemnettleseren**. Den siste handlingen er nødutgangen for en tjeneste som nekter å kjøre i den innebygde webvisningen. Innebygging av flere webvisninger er en skrivebordsfunksjon for Windows/Linux her; på macOS faller nettleseren tilbake til et vindu med bare siden, uten nettleserlinje, i stedet for å feile.

## Hvorfor nettleseren er en tillatelsesliste

Den innebygde nettleseren lastet opprinnelig alt en side ba om; møtevertlisten avgjorde bare hvilke lenker som fikk opptakslinjen. Nå er den en reell grense: bare tillatte domener og underdomenene deres får lastes over https, både for sider på toppnivå og for hver ressurs de ber om. En avvist ressurs får et feilsvar, slik at siden behandler opprinnelsen som utilgjengelig i stedet for å prøve på nytt i det uendelige.

Strenghet har en pris: en side som henter skrifttyper eller skript fra et CDN, går i stykker til det CDN-et er tillatt. Den blokkerte listen er botemiddelet — unike verter, nyeste først, hver med en **Tillat**-handling som legger til domenet og laster inn siden på nytt. Listen tegnes inne i nettleserlinjen, og nettleserlinjen vokser for å romme den, fordi en popup inne i en webvisning på 104 piksler ville blitt klippet av siden under. Nettleserlinjen gir det samme tilbudet når den avviser en navigasjon. Windows håndhever ressursblokkering med WebView2s `WebResourceRequested`; Linux og macOS blokkerer for øyeblikket bare navigasjon på toppnivå.

Modusen mellomlagres i stedet for å leses per vindu, og ressursfilteret installeres i begge modusene, slik at et bytte mellom `strict` og `trusted-site` når en side som allerede er åpen, ved dens neste forespørsel, uten at den må åpnes på nytt.

## Hvorfor opptak forblir manuelt

Hver side i nettleseren viser **Ta opp denne samtalen**, og mens noe nettleservindu er åpent, undertrykkes den eksterne samtaleforespørselen. Opptak er fortsatt manuelt — trykk på knappen før eller under samtalen, og stopp fra nettleserlinjen eller hovedvinduet. Automatisk start ville ta opp samtaler brukeren ikke ba om, og ville få appens mikrofonindikator til å vises uten en uttrykkelig handling.

Å lukke vinduet mens du tar opp spør om du vil stoppe eller fortsette opptaket i bakgrunnen, slik at det å forlate en samtale ikke stille kan forkaste eller fortsette et opptak.

## Begrensninger

- Bare en registrert møteordning eller et `https`-startargument overleveres til Vibe. Et `https`-klikk krever standardnettleserbeslutningen Vibe ikke tar.
- DRM-tunge eller WebRTC-fiendtlige nettsteder kan fungere bedre i systemnettleseren; **Åpne i systemnettleseren** er den støttede fallbacken.
- Windows valideres først. De andre plattformene bruker sine egne webvisninger og faller tilbake til systemnettleseren hvis vinduet ikke kan være vert for samtalen.

Fakta og reglene for tillatelseslisten står i [Møtenettleser-referansen](../reference/meeting-browser.md); trinnene står i [Bruk møtenettleseren](../how-to/use-the-meeting-browser.md).
