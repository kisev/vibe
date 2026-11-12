<!-- source: dd9e41dac7e3 -->

# Innstillinger og konfigurasjon

Innstillingene ligger i `app_config.json` i appens konfigurasjonsmappe. Filen er ment å leses og redigeres: Vibe overvåker den og bruker en ekstern endring uten omstart. **Innstillinger → Agenter → Konfigurasjonsfil** åpner den.

## Plassering av konfigurasjonsfilen

| Plattform | Mappe |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

Mappen beholder sin oppstrømsidentifikator, så navnet er uendret fra tidligere bygg.

## Innstillingsseksjoner

| Seksjon | Inneholder |
| --- | --- |
| Generelt | Visningsspråk, tema, oppdateringer, lukk til systemstatusfeltet, start ved pålogging, hindre dvale |
| Personvern | Om prosjekter lagres, og personvernerklæringen |
| Transkripsjon | Språk, automatisk eksport, lyd ved fullføring og fokus, prosjektmappe |
| Modeller | CPU/GPU-valg, GPU-enhet, modellkatalog, talergjenkjenningsmodell |
| Finjustering | Whisper-alternativer, lydbehandling, modellminne og tidsgrense for frigjøring |
| Opptak | Møtenettleser, møtegjenkjenning, automatisk transkripsjon, opptakshurtigtast, tillatelser på macOS |
| Diktering | Dikteringshurtigtast og aktiveringsmodus |
| KI | Sammendrag og dikteringsopgaver, plattformtilkobling |
| Telefon | Telefonoverlevering, sammenkobling, sammenkoblede enheter |
| Agenter | Lokalt API, agentferdighet, konfigurasjonsfil |
| Avansert | Logger, diagnostikk og utviklerkontroller |

## Verdier det er verdt å kjenne

| Nøkkelgruppe | Betydning |
| --- | --- |
| `transcription.*` | Språk, prompt, talergjenkjenning, tidsstempler, fragmentering av lange opptak |
| `model.*` | Valgt modell, visningsnavn, GPU-enhet, CPU-bare-bryter, tidsgrense for frigjøring |
| `transcript.*` | Eksportformat, tidsstempler, talere, automatisk eksport |
| `recording.*` | Inndata- og utdataenheter, møtegjenkjenning, opptakshurtigtast |
| `ai.*` | Plattform, basis-URL, nøkkel, modell, prompt og brytere per oppgave |
| `general.updateChannel` | `stable`, `beta` eller `dev` |
| `handoff.pairing` | Sammenkoblede telefonenheter og hash-verdier for legitimasjon |

De nøyaktige feltnavnene er stabile nok til å redigeres, men appen eier skjemaet: endre en verdi gjennom innstillingsgrensesnittet når det finnes et, og la appen skrive om filen i stedet for å erstatte den helt.

## Relaterte sider

- [Bytt oppdateringskanal](/vibe/docs#switch-update-channels) for kanalinnstillingen.
- [Oppsummer en transkripsjon](/vibe/docs#summarize-transcripts) for KI-tilkoblingen.
- [Transkriber fra telefonen](/vibe/docs#transcribe-from-a-phone) for overleveringsinnstillingene.
