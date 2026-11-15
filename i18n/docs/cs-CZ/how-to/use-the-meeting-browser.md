<!-- source: a039b159d4fd -->

# Používání prohlížeče schůzek

Vibe umí hostovat hovor ve vlastním okně založeném na Chromiu: lišta aplikace (adresa, zpět, vpřed, obnovení, otevření externě, zavření a **Nahrávat tento hovor**) je nahoře a stránka vyplňuje zbytek téhož okna. Neexistuje žádné samostatné okno s lištou. Schémata URL a seznam povolených domén najdete v [Referenci prohlížeče schůzek](../reference/meeting-browser.md) a důvody, proč mechanismus funguje právě takto, ve [vysvětlení](../explanation/meeting-browser.md).

## Otevření hovoru ve Vibe

Použijte jednu z těchto cest:

- Z jiné aplikace nebo ze systému: zapněte **Otevírání odkazů na schůzky ve Vibe** v části **Nastavení → Nahrávání**, aby se zaregistrovaly odkazy Zoom, Teams a Webex (Windows a Linux, ne macOS). Aplikace ověří namapovanou URL a otevře ji v okně prohlížeče, když se její hostitel smí načíst, jinak v systémovém prohlížeči.
- Uvnitř Vibe: zdroj **Prohlížeč schůzek** na domovské stránce, nebo **Nastavení → Nahrávání → Otevřít ve Vibe**; vložte odkaz a stiskněte **Otevřít ve Vibe**.
- Hostitel odkazu musí být v seznamu povolených domén; navigace nejvyšší úrovně a prostředky z jiných zdrojů mimo něj se odmítají. Ovládací prvky nahrávání v liště jsou na každé povolené stránce.

Kliknutí na odkaz https v Chrome, Edge nebo Firefoxu stále otevře daný prohlížeč. Vibe se neregistruje jako výchozí prohlížeč.

## Nahrávání hovoru

1. Otevřete schůzku ve Vibe.
1. Stiskněte **Nahrávat tento hovor** v liště okna před hovorem nebo během něj.
1. Zastavte z lišty nebo z hlavního okna.

Nahrávání je ruční; okno schůzky nikdy nezačne nahrávat samo. Nahrávač zachycuje nastavený mikrofon a při zapnutí i loopback systémového zvuku, takže se nahrají obě strany hovoru.

Výběry mikrofonu a reproduktorů v liště mění stejná zařízení, která používá hlavní okno, takže hovor lze přesměrovat, aniž byste jej opustili. Po dobu nahrávání jsou zakázané a uvádějí zařízení, která nahrávání zachycuje; zdroj, který nahrávání nezachycuje, zobrazuje **Žádný**.

Zavření okna během nahrávání se zeptá, zda nahrávání zastavit, nebo pokračovat na pozadí.

## Povolení stránek, které používáte

**Nastavení → Nahrávání → Povolené domény** je seznam povolených domén prohlížeče; zpočátku je prázdný. Přidejte každou potřebnou doménu a její subdomény se zahrnou přes https.

Načíst se mohou jen uvedené domény. Odkaz na jiného hostitele se odmítne, stejně jako každý skript, písmo nebo obrázek, který povolená stránka stahuje z neuvedeného zdroje. Odmítnutí hostitelé se zobrazí v části **Blokováno** s akcí **Povolit**, která přidá doménu a znovu načte stránku. Stejnou nabídku lišta zobrazí, když odmítne navigaci.

Striktní seznam může rozbít stránku, jejíž prostředky pocházejí z CDN, dokud tato CDN není povolena; je to zamýšlený kompromis a seznam Blokováno dělá z opravy jediné kliknutí.

## Návrat k systémovému prohlížeči

Pokud služba odmítne běžet ve vestavěném webview, použijte v liště **Otevřít v systémovém prohlížeči**. Systémový prohlížeč je podporovaná náhrada pro stránky silně závislé na DRM nebo nepříznivé vůči WebRTC.

V macOS vestavěný prohlížeč nemá lištu v okně: stránka se otevře v okně pouze se stránkou, nahrávání zůstává dostupné z hlavního okna a systémový prohlížeč je náhradou pro celý hovor.
