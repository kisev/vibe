---
version: unreleased
date: 
title: "Hva kommer neste"
source: 4462099ac37f
---

## New

- 🧪 **Modellsammenligning side om side** — Innstillinger → Modeller kjører ett klipp eller én fil gjennom hver installerte modell du velger og åpner resultatene i fullt vindu: én kolonne per modell med tiden og ordantallet, uavhengig rulling, en velger for referansemodell og ordvis utheving som stryker over ord som mangler og markerer ord som er ekstra
- 🗣️ **Taleradskillelse i sammenligningen** — én bryter legger taleretiketter til hver modells transkripsjon, slik at samme kjøring viser hvilken modell som hørte ordene og hvem som sa dem
- 🔄 **Tre oppdateringskanaler** — følg Release, Beta eller Dev, se gjeldende versjon og når siste sjekk ble kjørt, og start en sjekk selv med én knapp i stedet for å vente på neste oppstart
- 🗺️ **Nettstedet har et veikart** — en ny side lister opp hver ikke-arkiverte endring rett fra prosjektets planleggingsfiler, slik at det som kommer aldri er en håndskrevet gjetning
- 🌐 **Møter åpnes inne i Vibe** — møtelenker åpnes i en innebygd nettleser med sin egen meny (tilbake, fremover, oppdater, åpne i systemnettleseren, lukk) og en redigerbar liste over møteverter; Vibe kan registrere seg som behandler for Zoom-, Teams- og Webex-lenker når du ber om det, og et oppdaget møte foreslår at du tar det opp med mikrofonen og systemlyden
- 🌍 **Nettstedet snakker språket ditt** — en språkvelger i toppteksten bytter siden på stedet, beholder `?lang=` i URL-en slik at delte lenker bærer valget, og bruker høyre-til-venstre-oppsett. `/changelog/dev` er nå den faste adressen for dev-notatene

## Improved

- 🧭 **Dev-oppdateringer har sin egen linje** — dev-bygg leveres som `-dev.N`-forhåndsutgivelser på Dev-kanalen, utgivelseskandidater kuttes for Beta, og dev-endringsloggen beholder én stabil URL mens bygg kommer og går
- 🏷️ **Sammenligninger navngir modellene riktig** — resultater og dialoger bruker katalogens kanoniske modellnavn og kvantiseringsskrivemåte i stedet for å tittelformatere et filnavn
- 🤫 **Møtegjenkjenning holder seg unna** — Vibes eget møtevindu undertrykker den eksterne gjenkjenningsforespørselen, og opptakstilstanden deles, slik at et møte som allerede er åpent i Vibe aldri tilbyr seg å bli tatt opp to ganger
- 🕵️ **Ingenting forlater enheten din** — all telemetri er fjernet: ingen analysenøkkel, ingen ping ved oppstart eller ved en handling, og ingen donasjonsbannere på nettstedet. Logger, diagnostikk og eksporter blir liggende på disken og forlater den bare når du sender dem selv
- 📚 **Dokumentasjonen følger Diátaxis** — veiledninger, praktiske veiledninger, referanse og forklaring er skilt, både i repositoriet og på nettstedet, slik at «hvordan gjør jeg …» og «hva betyr dette» ikke lenger deler én lang side
- 🔗 **Versjonsnotatene peker på den oversatte endringsloggen** — hver utgivelsestekst lenker til `https://kisev.github.io/vibe/changelog/<version>`, slik at leseren velger sitt eget språk i stedet for engelsk

## Fixed

- 🎙️ **Hver modell kan kjøre sammenligningen** — GigaAM og Parakeet nekter ikke lenger å kjøre fordi en VAD-modell mangler; laben leverer sin innebygde detektor, slik at resultatene bare skiller seg etter modellen
- 📍 **Sammenligningen kommer først** — laben er flyttet over den lange modellkatalogen i Innstillinger → Modeller, slik at den er det første du ser
- 🔍 **Lange transkripsjoner blir fortsatt uthevet** — diffen gir ikke lenger opp over tusen ord og rapporterer null forskjeller; når en tekst virkelig er for lang, sier kolonnen det i stedet
- 🔁 **Oppdateringskanalene beholder navnene og linjen sin** — velgeren viser Release, Beta og Dev på alle språk, og Beta tilbyr bare utgivelseskandidater i stedet for å speile det stabile bygget
- 🔌 **API-serverbryteren blir av** — bryteren under Agenter er ditt valg og overlever en omstart; lesing av modellmetadata ved oppstart lar ikke lenger en server kjøre i bakgrunnen
- 🪟 **Møtevinduet kan lukkes** — kontrollene ligger i selve vinduet, slik at en side som ikke lastes ikke lenger etterlater et vindu uten vei ut
- 🌍 **Nettstedet oversetter hele siden** — et språkbytte etterlater ikke lenger engelske seksjoner, og endringsloggen følger også det valgte språket
