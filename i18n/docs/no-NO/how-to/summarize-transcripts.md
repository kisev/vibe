<!-- source: f5e20b838770 -->

# Oppsummer en transkripsjon

Vibe kan gjøre en ferdig transkripsjon om til et sammendrag, notater eller en oversettelse. Forespørselen går til KI-plattformen du konfigurerer: en lokal Ollama-modell, Claude eller et OpenAI-kompatibelt endepunkt. [Innstillinger og konfigurasjon](/vibe/docs#settings) lister hvor tilkoblingen lagres.

## Bruk en lokal Ollama-modell

1. Installer [Ollama](https://ollama.com) og hent en modell, for eksempel `ollama pull llama3.1`.
1. Åpne **Innstillinger → KI**.
1. Sett **Plattform** til **Ollama**. Standard-URL-en er `http://localhost:11434`.
1. Velg modellnavnet.
1. Slå på **Sammendrag**, og eventuelt **Oppsummer nye transkripsjoner automatisk**.

Ollama kjører på denne maskinen, så transkripsjonen blir lokal.

## Bruk Claude eller et OpenAI-kompatibelt endepunkt

1. Åpne **Innstillinger → KI** og velg plattformen.
1. Lim inn API-nøkkelen, og endre basis-URL-en hvis endepunktet ikke er standard.
1. Velg modellen.
1. Slå på **Sammendrag**.

For et endepunkt som ikke er standard, er basis-URL-en og nøkkelen tilkoblingen appen bruker til både sammendrag og diktering.

## Oppsummer

1. Fullfør en transkripsjon.
1. Åpne sammendragshandlingen i transkripsjonsvisningen.
1. Velg en forhåndsinnstilling, og rediger ledeteksten om nødvendig.
1. Kjør den; resultatet lagres med prosjektet og kan eksporteres ved siden av transkripsjonen.

Med **Oppsummer nye transkripsjoner automatisk** slått på kjøres sammendraget så snart en transkripsjon fullføres.

## Neste steg

- [Innstillinger og konfigurasjon](/vibe/docs#settings) for konfigurasjonsfilen og innstillingsseksjonene.
- [Personvern og offline-design](/vibe/docs#privacy) for hvilke plattformer som holder teksten på maskinen.
