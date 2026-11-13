<!-- source: 7770d2556ea9 -->

# Proč prohlížeč schůzek funguje takto

Hovor se snáze nahrává, když stránku hostuje samo Vibe: aplikace ovládá okno, ví, kdy probíhá nahrávání, a může zobrazit lištu s jednou akcí. Návrh vychází z toho, co operační systém skutečně dovoluje.

## Proč schéma URL místo kliknutí na https

Prohlížeč nikdy nepředá odkaz `https://` nainstalované aplikaci, pokud tato aplikace není výchozím prohlížečem. Aplikace pro schůzky to dělají obráceně: registrují vlastní schéma a jejich stránky nebo instalátory jej vyvolávají.

Vibe dělá totéž:

- `vibe://open/?url=https://…` otevře cíl v okně prohlížeče Vibe. Může jej zavolat jakákoli aplikace, skript nebo zkratka. Vibe URL ověří v Rustu a odmítne vše, co není https a správně utvořené.
- **Nastavení → Nahrávání → Otevřít ve Vibe** vloží odkaz do stejné cesty.

Kliknutí na odkaz `https` v Chrome, Edge nebo Firefoxu stále otevře daný prohlížeč. Udělat z Vibe výchozí prohlížeč je záměrně mimo rozsah: převzalo by to každý odkaz na počítači, aby posloužilo jedné funkci.

## Proč je zobrazení obsahu izolované

Okno obsahu je běžný webview s vlastním adresářem dat. Cookies služeb se nikdy nemíchají s úložištěm aplikace, do stránky se nevkládají žádné skripty a výzvy ke kameře a mikrofonu přicházejí ze samotné stránky, místo aby je Vibe udělovalo jménem uživatele. Vložená stránka se považuje za nedůvěryhodný webový obsah, ne za součást aplikace.

Lišta nabízí adresu, zpět, vpřed, obnovení, zavření a **Otevřít v systémovém prohlížeči**. Poslední akce je úniková cesta pro službu, která odmítá běžet ve vestavěném webview.

## Proč je prohlížeč seznamem povolených domén

Vestavěný prohlížeč původně načítal, co stránka požadovala; seznam hostitelů schůzek jen rozhodoval, které odkazy dostanou lištu nahrávání. Nyní je to skutečná hranice. Načíst se mohou jen domény povolené uživatelem a jejich subdomény přes https — stránky nejvyšší úrovně i každý prostředek, který stránka požaduje. Odmítnutému prostředku se odpoví chybovou odpovědí, aby stránka považovala tento zdroj za nedostupný, místo aby to zkoušela donekonečna.

Striktnost je smyslem a má svou cenu: stránka tahající písma nebo skripty z CDN se rozbije, dokud tato CDN není povolena. Seznam blokovaných je řešení — jedineční hostitelé, nejnovější první, každý s akcí **Povolit**, která přidá doménu a znovu načte stránku. Rozhraní prohlížeče nabízí totéž, když odmítne navigaci.

## Proč nahrávání zůstává ruční

Každá stránka v okně prohlížeče zobrazuje **Nahrávat tento hovor**, a dokud je otevřené jakékoli okno prohlížeče, Vibe potlačí vlastní výzvu k nahrávání externího hovoru. Nahrávání je stále ruční — stiskněte tlačítko před hovorem nebo během něj a zastavte z rozhraní prohlížeče nebo z hlavního okna. Automatické spuštění by nahrávalo hovory, které uživatel nahrát nechtěl, a rozsvítilo by indikátor mikrofonu bez výslovné akce.

Zavření okna během nahrávání se zeptá, zda nahrávání zastavit, nebo pokračovat na pozadí, takže opuštění hovoru nemůže nahrávku tiše zahodit ani v ní pokračovat.

## Limity

- Automaticky se otevírají pouze odkazy `vibe://open/`. Kliknutí na `https` potřebuje rozhodnutí o výchozím prohlížeči, které Vibe nečiní.
- Stránky silně závislé na DRM nebo nepříznivé vůči WebRTC mohou lépe fungovat v systémovém prohlížeči; **Otevřít v systémovém prohlížeči** je podporovaná náhrada.
- Nejprve se ověřuje Windows. Blokování prostředků používá vlastní mechanismus každého enginu: `WebResourceRequested` WebView2 na Windows; Linux a macOS zatím blokují jen navigaci nejvyšší úrovně a práce na nich pokračuje.
- Registrace schémat Zoom, Teams a Webex je volitelná a dostupná na Windows a Linuxu, ne na macOS.

## Související stránky

- [Používání prohlížeče schůzek](/vibe/docs#use-the-meeting-browser) pro jednotlivé kroky.
- [Nahrávání mikrofonu a systémového zvuku](/vibe/docs#record-audio) pro samotný nahrávač.
