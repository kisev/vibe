<!-- source: 2459ffcb4329 -->

# Personvern og offline-design

Vibe er bygget slik at den normale transkripsjonsveien ikke trenger konto eller skytjeneste. Appen starter en lokal server, serveren laster en modell fra disken, og lyden dekodes og transkriberes på samme maskin.

## Hva som blir lokalt

- Lydfiler, opptak, eksporter og transkripsjoner.
- Modellene og ffmpeg-binærene.
- Prosjekthistorikken i prosjektmappen.
- Det lokale HTTP-API-et mellom skrivebordsappen og `vibe-server`, bundet til loopback.

Appen sender ingen telemetri. **Rapporter feil** bygger en forhåndsutfylt feilrapport fra lokal diagnostikk og åpner GitHub; ingenting sendes før du har gjennomgått og sendt det.

## Hvor nettverket brukes

| Funksjon | Nettverkskontakt |
| --- | --- |
| Modellnedlasting | Verten som betjener modellfilen |
| Transkriber fra en lenke | Medieverten, og GitHub for yt-dlp-binæren |
| Oppdateringssjekk | Nettstedets kanalfil |
| KI-sammendrag med Claude eller OpenAI | Den konfigurerte leverandøren |
| KI-sammendrag med Ollama | Ollama-URL-en, lokal som standard |
| Telefonoverlevering | Et ende-til-ende-kryptert relé mellom telefonen og denne datamaskinen |

Selve transkripsjonsmotoren har ingen nettverksvei.

## Telefonoverlevering

Telefonen og skrivebordsappen kobles sammen gjennom iroh. Reléet frakter ende-til-ende-kryptert trafikk, så reléet videresender bytes det ikke kan lese; transkripsjonen skjer fortsatt på denne datamaskinen, og Vibe må være åpent for at overleveringen skal virke.

## Avveininger

- Lokale modeller koster diskplass og bruker maskinens CPU eller GPU. [Motor- og GPU-valg](/vibe/docs#engine) forklarer delingen.
- Et sammendrag i skyen sender transkripsjonsteksten til leverandøren du velger. La plattformen stå på Ollama for å holde det lokalt.
- Oppdateringer sjekkes fra statiske filer på nettstedet, noe som avslører at appen sjekket en kanal, ikke hva den transkriberte.

## Relaterte sider

- [Innstillinger og konfigurasjon](/vibe/docs#settings) for den lokale konfigurasjonsfilen.
- [Transkriber fra telefonen](/vibe/docs#transcribe-from-a-phone) for overleveringstrinnene.
- [Oppsummer en transkripsjon](/vibe/docs#summarize-transcripts) for KI-plattformene.
