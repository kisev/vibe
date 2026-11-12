<!-- source: dc7efd39c01b -->

# Hvorfor oppdateringskanalene fungerer slik

GitHub har én «siste utgivelse». Vibe trenger tre linjer — Utgivelse, Beta og Dev — som en bruker kan bytte mellom, også fra en eldre installasjon. Det misforholdet driver kanaldesignet.

## Hvorfor nettstedet, ikke GitHub

Appen leser `updater/<channel>.json` fra nettstedet. Hver fil er den `latest.json` et utgivelsesbygg produserte, kopiert ved siden av de andre:

- Utgivelse → `stable.json`
- Beta → `beta.json`
- Dev → `dev.json`

En kanalfil er en statisk ressurs som distribueres med nettstedet, så å peke en linje mot et bygg er en commit, ikke en redigering av en utgivelse. Det lar også en manglende kanal bety noe presist: en `404` eller `410` er «ingenting på denne linjen», som appen rapporterer som oppdatert. Hvis appen falt tilbake til en annen kanal ved en manglende fil, ville en Beta-bruker uten kandidat stille blitt flyttet til Utgivelse.

## Hvorfor beta-suffikset er `-rc.<n>`

Semver sorterer:

```text
X.Y.Z-dev.N < X.Y.Z-rc.N < X.Y.Z
```

Den rekkefølgen er hele grunnen til stavemåten. Med oppdatererens strenge sammenligning beveger Dev → Beta → Utgivelse seg alltid fremover; ingen spesiell overstyring trengs.

En tidligere linje brukte `-beta.N`, men den hadde ingen dev-kanal. `X.Y.Z-beta.N` sorteres over `X.Y.Z-dev.N`, så et beta-bygg ville se nyere ut enn hvert dev-bygg og bryte byttet. Beta-kanalen beholder navnet sitt; bare versjonssuffikset er `-rc.<n>`.

## Hvorfor beta bare inneholder kandidater

Bare en versjon `X.Y.Z-rc.<n>` skrives til `beta.json`; en vanlig utgivelse avvises. Dette gjør beta-linjen meningsfull: det er kandidatlinjen, ikke en annen stabil linje. Etter en stabil utgivelse går en Beta-installasjon over til den endelige ved å bytte kanalen sin til Utgivelse, der `X.Y.Z` sorteres over kandidatene.

## Oppdateringer bare fremover

Oppdatereren beveger seg bare fremover. En dårlig utgivelse fikses ved å sende ut en nyere, som er det beta-linjen er til for: fang den før Utgivelse får den. Dette er også grunnen til at en installasjon av Utgivelse eller Beta som velger Dev, ser «oppdatert»: hvert dev-bygg sorteres under versjonen den allerede kjører. Å flytte til dev-linjen krever én manuell installasjon av et dev-bygg; etter det oppdaterer Dev-kanalen den fremover.

## Avveininger

- **Kopierte manifest** betyr at en kanalendring er en commit til `main` pluss en distribusjon av nettstedet, ikke et API-kall. Forsinkelsen er minutter, og historikken kan gjennomgås.
- **Ingen fallback mellom kanaler** betyr at en bruker ser en korrekt «oppdatert» i stedet for en overraskende nedgradering eller et hopp mellom linjer.
- **Dev krever én manuell installasjon** er prisen for å holde semver-rekkefølgen ærlig. Å automatisere det ville kreve et kanalbegrep de gamle klientene ikke har.

## Relaterte sider

- [Oppdateringskanaler](/vibe/docs#update-channels) for filene og versjonsreglene.
- [Bytt oppdateringskanal](/vibe/docs#switch-update-channels) for trinnene.
