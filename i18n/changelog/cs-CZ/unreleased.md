---
version: unreleased
date: 
title: "Co nás čeká"
source: 4462099ac37f
---

## New

- 🧪 **Porovnání modelů vedle sebe** — Nastavení → Modely spustí jednu ukázku nebo soubor přes každý vybraný nainstalovaný model a otevře výsledky přes celé okno: sloupec pro každý model s jeho časem a počtem slov, samostatné posouvání, volba referenčního modelu a zvýrazňování po slovech, které škrtne vynechaná slova a označí slova navíc
- 🗣️ **Rozlišení mluvčích v porovnání** — jeden přepínač přidá k přepisu každého modelu označení mluvčích, takže stejné spuštění ukáže, který model slova slyšel a kdo je vyslovil
- 🔄 **Tři kanály aktualizací** — sledujte kanál Release, Beta nebo Dev, uvidíte aktuální verzi a kdy proběhla poslední kontrola a kontrolu spustíte sami jedním tlačítkem, místo abyste čekali na další spuštění
- 🗺️ **Web má plán vývoje** — nová stránka vypisuje každou nearchivovanou změnu přímo ze souborů s plánováním projektu, takže to, co se chystá, nikdy není ručně psaný odhad
- 🌐 **Schůzky se otevírají přímo ve Vibe** — odkazy na schůzky se otevírají ve vestavěném prohlížeči s vlastní nabídkou (zpět, vpřed, znovu načíst, otevřít v systémovém prohlížeči, zavřít) a s upravitelným seznamem hostitelů schůzek; Vibe se může na vaše vyžádání zaregistrovat jako obsluha odkazů na Zoom, Teams a Webex a rozpoznaný hovor vás vyzve k jeho nahrání pomocí mikrofonu a systémového zvuku
- 🌍 **Web mluví vaším jazykem** — výběr jazyka v záhlaví přepne stránku na místě, zachová `?lang=` v adrese URL, takže sdílené odkazy nesou zvolený jazyk, a použije rozvržení zprava doleva. `/changelog/dev` je nyní trvalou adresou pro poznámky k vývoji

## Improved

- 🧭 **Vývojové aktualizace mají vlastní řadu** — vývojová sestavení vycházejí jako předběžné verze `-dev.N` na kanálu Dev, pro Beta se vytvářejí kandidáti na vydání a vývojový seznam změn si drží jednu stabilní adresu URL, i když sestavení přicházejí a odcházejí
- 🏷️ **Porovnání správně pojmenovávají modely** — výsledky a dialogy používají kanonický název modelu a pravopis kvantizace z katalogu, místo aby z názvu souboru vytvářely podobu nadpisu
- 🤫 **Detekce schůzek nepřekáží** — vlastní okno schůzky ve Vibe potlačí vnější výzvu k detekci a stav nahrávání je sdílený, takže hovor už otevřený ve Vibe nikdy nenabídne nahrávání dvakrát
- 🕵️ **Nic neopouští vaše zařízení** — veškerá telemetrie je pryč: žádný analytický klíč, žádný ping při spuštění ani při akci a žádné bannery s výzvou k daru na webu. Záznamy, diagnostika a exporty zůstávají na disku a opouštějí ho jen tehdy, když je sami odešlete
- 📚 **Dokumentace se řídí Diátaxis** — návody, praktické postupy, reference a vysvětlení jsou oddělené, a to v repozitáři i na webu, takže „jak to udělám…“ a „co to znamená“ už nesdílejí jednu dlouhou stránku
- 🔗 **Poznámky k vydání odkazují na přeložený seznam změn** — tělo každého vydání odkazuje na `https://kisev.github.io/vibe/changelog/<version>`, takže si čtenář zvolí vlastní jazyk místo angličtiny

## Fixed

- 🎙️ **Porovnání zvládne každý model** — GigaAM a Parakeet už neodmítnou spuštění kvůli chybějícímu modelu VAD; laboratoř dodá svůj přibalený detektor, takže se výsledky liší jen modelem
- 📍 **Porovnání je nyní první** — laboratoř se na stránce Nastavení → Modely přesunula nad dlouhý katalog modelů, takže ji uvidíte jako první
- 🔍 **Dlouhé přepisy se stále zvýrazňují** — rozdíly se už nevzdávají nad tisícem slov a nehlásí nula rozdílů; když je text skutečně příliš dlouhý, sloupec to místo toho uvede
- 🔁 **Kanály aktualizací si drží názvy i svou řadu** — volič zobrazuje Release, Beta a Dev v každém jazyce a Beta nabízí jen kandidáty na vydání, místo aby zrcadlila stabilní sestavení
- 🔌 **Přepínač serveru API zůstává vypnutý** — přepínač agentů je vaše volba a přežije restart; čtení metadat modelů při spuštění už za sebou nenechává běžet server
- 🪟 **Okno schůzky lze zavřít** — jeho ovládací prvky jsou přímo v okně, takže stránka, která se nepodaří načíst, už nezanechá okno bez východiska
- 🌍 **Web překládá celou stránku** — přepnutí jazyka už nezanechává anglické části a seznam změn se také řídí zvoleným jazykem
