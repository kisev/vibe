<!-- source: bc1a1519974a -->

# Bytt oppdateringskanal

Vibe sjekker én av tre oppdateringskanaler: Utgivelse, Beta eller Dev. Kanalen bestemmer hvilke bygg appen tilbyr, og den beveger seg bare fremover.

## Velg en kanal

1. Åpne **Innstillinger → Generelt → Oppdateringer**.
1. Velg **Utgivelse**, **Beta** eller **Dev**.
1. Trykk **Se etter oppdateringer**.

Samme seksjon viser den installerte versjonen, tidspunktet for siste sjekk og resultatet. Sjekken kjøres også ved oppstart.

## Hva hver kanal inneholder

| Kanal | Bygg |
| --- | --- |
| Utgivelse | Stabile versjoner |
| Beta | Utgivelseskandidater for neste stabile versjon |
| Dev | De nyeste `dev`-byggene |

En installasjon av Utgivelse eller Beta som velger Dev, ser **oppdatert**: hvert dev-bygg sorteres under versjonen den allerede kjører. Å flytte til dev-linjen krever én manuell installasjon av et dev-bygg; etter det oppdaterer Dev-kanalen den fremover.

En Beta-installasjon går over til den endelige utgivelsen ved å bytte til Utgivelse, der den stabile versjonen sorteres over kandidatene.

## Neste steg

- [Oppdateringskanaler](/vibe/docs#update-channels) for kanalfilene og tag-reglene.
- [Hvorfor oppdateringskanalene fungerer slik](/vibe/docs#update-channels-design) for versjonssorteringen.
