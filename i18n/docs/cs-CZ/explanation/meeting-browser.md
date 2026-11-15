<!-- source: 6737f12a1fc7 -->

# Prohlížeč schůzek

Prohlížeč schůzek existuje proto, že hovor se snáze nahrává, když stránku hostuje samo Vibe: aplikace ovládá okno, ví, kdy probíhá nahrávání, a umí v jedné akci zobrazit svou lištu. Návrh vychází z toho, co operační systém skutečně dovoluje.

## Proč schéma URL místo kliknutí na https

Prohlížeč nikdy nepředá odkaz `https://` nainstalované aplikaci, pokud tato aplikace není výchozím prohlížečem. Desktopové aplikace pro schůzky to dělají obráceně: registrují vlastní schéma (`zoommtg://`, `msteams://`, `mattermost://`) a vyvolávají je jejich vlastní stránky nebo instalátory.

Vibe dělá totéž poctivě:

- Zapněte **Otevírání odkazů na schůzky ve Vibe** a Vibe zaregistruje schémata schůzek, která Zoom, Teams a Webex už používají (`zoommtg://`, `msteams://`, `webex://`), a každé namapuje na webovou URL, kterou nese. Aplikace URL ověří v Rustu a otevře ji v okně prohlížeče, když se její hostitel smí načíst, jinak v systémovém prohlížeči.
- URL `https` předaná jako argument spuštění jde stejnou cestou.
- Uvnitř aplikace se odkaz vloží do stejné cesty přes zdroj **Prohlížeč schůzek** na domovské stránce nebo přes **Nastavení → Nahrávání → Otevřít ve Vibe**.

Vibe záměrně nevydává žádný vlastní odkaz `vibe://open/`: žádná stránka schůzky jej nevysílá, a proto byl tento první vstupní bod odstraněn. Kliknutí na odkaz `https` v Chrome, Edge nebo Firefoxu stále otevře daný prohlížeč. Udělat z Vibe výchozí prohlížeč je záměrně mimo rozsah: převzalo by to každý odkaz na počítači, aby posloužilo jedné funkci, a stejně by to bylo rozhodnutí uživatele.

## Proč je zobrazení obsahu izolované

Okno obsahuje dva podřízené webview: lištu Vibe a vzdálenou stránku. Lišta je uživatelské rozhraní aplikace a nese schopnosti aplikace; stránka je běžný nedůvěryhodný webový obsah zcela bez schopností, nevkládají se do ní žádné skripty a výzvy ke kameře a mikrofonu přicházejí ze samotné stránky, místo aby je Vibe udělovalo jménem uživatele. Obě sdílejí prostředí WebView2 daného procesu, protože WebView2 nepodporuje druhý datový adresář v jednom procesu.

Lišta nabízí adresu, zpět, vpřed, obnovení, zavření a **Otevřít v systémovém prohlížeči**. Poslední akce je úniková cesta pro službu, která odmítá běžet ve vestavěném webview. Vkládání více webview je zde vlastností desktopových Windows a Linuxu; v macOS prohlížeč místo selhání přejde na okno pouze se stránkou, bez lišty.

## Proč je prohlížeč seznamem povolených domén

Vestavěný prohlížeč původně načítal, co stránka požadovala; seznam hostitelů schůzek jen rozhodoval, které odkazy dostanou lištu nahrávání. Nyní je to skutečná hranice: přes https se mohou načíst jen povolené domény a jejich subdomény, a to jak pro stránky nejvyšší úrovně, tak pro každý prostředek, který požadují. Odmítnutý prostředek dostane chybovou odpověď, takže stránka považuje tento zdroj za nedostupný, místo aby to zkoušela donekonečna.

Striktnost má svou cenu: stránka tahající písma nebo skripty z CDN se rozbije, dokud tato CDN není povolena. Řešením je seznam blokovaných — jedineční hostitelé, nejnovější první, každý s akcí **Povolit**, která přidá doménu a znovu načte stránku. Seznam se vykresluje uvnitř lišty a lišta roste, aby se do něj vešla, protože vyskakovací okno ve webview o velikosti 104 pixelů by stránka pod ním ořízla. Stejnou nabídku lišta zobrazí, když odmítne navigaci. Windows vynucuje blokování prostředků pomocí `WebResourceRequested` WebView2; Linux a macOS zatím blokují jen navigaci nejvyšší úrovně.

Režim se ukládá do mezipaměti, místo aby se četl pro každé okno, a filtr prostředků je nainstalovaný v obou režimech, takže přepnutí mezi `strict` a `trusted-site` se do již otevřené stránky promítne při jejím dalším požadavku, aniž by bylo nutné ji znovu otevírat.

## Proč nahrávání zůstává ruční

Každá stránka v prohlížeči zobrazuje **Nahrávat tento hovor** a dokud je otevřené jakékoli okno prohlížeče, výzva k nahrávání schůzky v externím prohlížeči je potlačena. Nahrávání je stále ruční — stiskněte tlačítko před hovorem nebo během něj, zastavte z lišty nebo z hlavního okna. Automatické spuštění by nahrávalo hovory, které uživatel nahrát nechtěl, a rozsvítilo by indikátor mikrofonu aplikace bez výslovné akce.

Zavření okna během nahrávání se zeptá, zda nahrávání zastavit, nebo pokračovat na pozadí, takže opuštění hovoru nemůže nahrávku tiše zahodit ani v ní pokračovat.

## Limity

- Vibe přebírá pouze registrované schéma schůzky nebo argument spuštění `https`. Kliknutí na `https` potřebuje rozhodnutí o výchozím prohlížeči, které Vibe nečiní.
- Stránky silně závislé na DRM nebo nepříznivé vůči WebRTC mohou lépe fungovat v systémovém prohlížeči; **Otevřít v systémovém prohlížeči** je podporovaná náhrada.
- Nejprve se ověřuje Windows. Ostatní platformy používají vlastní webview a pokud okno nemůže hovor hostovat, přejdou na systémový prohlížeč.

Fakta a pravidla seznamu povolených domén najdete v [Referenci prohlížeče schůzek](../reference/meeting-browser.md); kroky jsou v [Používání prohlížeče schůzek](../how-to/use-the-meeting-browser.md).
