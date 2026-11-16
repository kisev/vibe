<!-- source: 63b7a2f2736b -->

# Oppdateringskanaler

Appen oppdaterer seg fra én av tre kanalfiler på nettstedet, ikke fra GitHubs siste utgivelse:

| Kanal | Fil |
| --- | --- |
| Utgivelse | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Hver fil er den `latest.json` et utgivelsesbygg produserte. En kanal uten fil er en linje uten noe på seg: appen rapporterer «Oppdatert» i stedet for å falle tilbake til en annen kanal eller behandle den manglende filen som en mislykket sjekk.

## Linjer og versjoner

| Kanal | Tag | Gren | Versjon | Hva det er |
| --- | --- | --- | --- | --- |
| Utgivelse | `vX.Y.Z` | `main` | `X.Y.Z` | Den stabile linjen |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Kandidat for neste stabile, publisert som en GitHub-forhåndsutgivelse |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Det bevegelige bygget av `dev` |

`beta.json` mangler mens ingen kandidat er publisert. En vanlig utgivelse avvises på beta-kanalen; bare `X.Y.Z-rc.<n>` godtas der.

## Hvor manifestene kommer fra

- **Utgivelse og beta**: utgivelsesbyggets Tauri-oppdaterer produserer `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` laster den ned fra `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, validerer versjonen og skriver `website/public/updater/<channel>.json`. Commit filen til `main`; nettstedsdistribusjonen publiserer den.
- **Dev**: `.github/workflows/dev-build.yml` publiserer en forhåndsutgivelse med oppdateringsartefakter og `latest.json`. `scripts/dev_manifest.py` leser den nyeste komplette dev-utgivelsen og skriver `website/public/updater/dev.json`; et ferskt dev-bygg utløser nettstedsdistribusjonen. Hvis den nyeste utgivelsen er delvis eller API-kallet feiler, blir den forrige `dev.json` stående.

`channel.py` nekter å flytte en kanal bakover og forstår rekkefølgen til `-rc.<n>`.

## I appen

- **Innstillinger → generelt → Oppdateringer** har kanalvelgeren, gjeldende versjon, **Se etter oppdateringer**, tidspunktet for forrige sjekk og resultatet.
- Kjøretidsvalget ligger i `desktop/src-tauri/src/updater.rs`; webvisningssiden er `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` sonderer `updater/<channel>.json` direkte. En `404` eller `410` betyr at kanalen aldri ble publisert; alle andre feil er ekte feil.
- Tauri-pluginens statiske endepunkt i `tauri.conf.json` er fallbacken plugin-modulen selv kjenner til; kanalvalget skjer i appkoden.

## Grenser

- Oppdatereren beveger seg bare fremover. Et dårlig bygg fikses ved å sende ut et nyere.
- En installasjon av Utgivelse eller Beta som velger Dev, ser «Oppdatert»: hvert dev-bygg sorteres under versjonen den allerede kjører. Å flytte til dev-linjen krever én manuell installasjon av et dev-bygg; etter det oppdaterer Dev-kanalen den fremover.
- En Beta-installasjon går over til den endelige utgivelsen ved å bytte til Utgivelse, der `X.Y.Z` sorteres over kandidatene.
- Apper bygget før kanalfilene (oppstrøms 3.x-linjen) leser fortsatt den GitHub-utgivelsen som er merket «latest». `gh release edit --latest` er det som sendes til dem, og kjøres sist.

Se [Publiser en utgivelse](../how-to/publish-a-release.md) og [Lag et dev-bygg](../how-to/cut-a-dev-build.md) for fremgangsmåtene, og [forklaringen](../explanation/update-channels.md) for hvorfor linjene og suffiksene er formet slik.
