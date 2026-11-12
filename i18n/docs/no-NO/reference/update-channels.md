<!-- source: 18fa449ab772 -->

# Oppdateringskanaler

Appen oppdateres fra én av tre kanalfiler på nettstedet, ikke fra GitHubs «siste utgivelse»:

| Kanal | Fil |
| --- | --- |
| Utgivelse | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Hver fil er den `latest.json` en utgivelsesbygg produserte. En manglende fil betyr at linjen ikke har noe på seg: appen rapporterer «oppdatert» i stedet for å falle tilbake til en annen kanal.

## Linjer og versjoner

| Kanal | Tag | Gren | Versjon | Hva det er |
| --- | --- | --- | --- | --- |
| Utgivelse | `vX.Y.Z` | `main` | `X.Y.Z` | Den stabile linjen |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Kandidat for neste stabile, publisert som en forhåndsutgivelse |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Det bevegelige bygget av `dev` |

En vanlig utgivelse avvises på beta-kanalen; bare `X.Y.Z-rc.<n>` godtas der. En kanal uten kandidat er fraværende, ikke tom.

## I appen

- **Innstillinger → Generelt → Oppdateringer** har kanalvelgeren, gjeldende versjon, **Se etter oppdateringer**, tidspunktet for siste sjekk og resultatet.
- Appen sonderer `updater/<channel>.json` selv. En `404` eller `410` betyr at kanalen aldri ble publisert; alle andre feil er ekte feil.
- Sjekken kjøres ved oppstart og etter et kanalbytte.

## Grenser

- Oppdatereren beveger seg bare fremover. Et dårlig bygg fikses ved å sende ut et nyere.
- En installasjon av Utgivelse eller Beta som velger Dev, ser «oppdatert»: hvert dev-bygg sorteres under versjonen den allerede kjører. Å flytte til dev-linjen krever én manuell installasjon av et dev-bygg; etter det oppdaterer Dev-kanalen den fremover.
- En Beta-installasjon går over til den endelige utgivelsen ved å bytte til Utgivelse, der `X.Y.Z` sorteres over kandidatene.

## Relaterte sider

- [Bytt oppdateringskanal](/vibe/docs#switch-update-channels) for trinnene.
- [Hvorfor oppdateringskanalene fungerer slik](/vibe/docs#update-channels-design) for designet.
