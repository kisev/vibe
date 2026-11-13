<!-- source: cc4651e4e37d -->

# Používání prohlížeče schůzek

Vibe umí hostovat hovor ve vlastním okně s lištou vždy navrchu, jejíž hlavní akcí je **Nahrávat tento hovor**. Okno používá webview platformy; [Proč prohlížeč schůzek funguje takto](/vibe/docs#meeting-browser) se věnuje izolaci a limitům.

## Otevření hovoru ve Vibe

Použijte jednu z těchto cest:

- Otevřete **Nastavení → Nahrávání → Otevřít ve Vibe**, vložte odkaz a otevřete jej.
- Z jiné aplikace, skriptu nebo zkratky zavolejte `vibe://open/?url=https://…`. Vibe přijímá jen správně utvořené https URL a cokoli jiného odmítne dialogem.
- Zapněte **Otevírání odkazů na schůzky ve Vibe** v **Nastavení → Nahrávání**, aby se registrovaly odkazy Zoom, Teams a Webex. Je k dispozici na Windows a Linuxu, ne na macOS.

Kliknutí na odkaz https v Chrome, Edge nebo Firefoxu stále otevře daný prohlížeč. Vibe se neregistruje jako výchozí prohlížeč.

## Povolení stránek, které používáte

**Nastavení → Nahrávání → Povolené domény** je seznam povolených domén prohlížeče. Zpočátku je prázdný: přidejte každou doménu, kterou chcete otevírat, a její subdomény se zahrnou automaticky. Párování probíhá podle názvu hostitele přes https — URL s `http` se nikdy nenačte.

Seznam je hranice, ne filtr. Odkaz na hostitele mimo něj se odmítne, stejně jako každý skript, písmo nebo obrázek, který povolená stránka požaduje z neuvedeného zdroje. Každý odmítnutý hostitel se zobrazí v části **Blokováno** s akcí **Povolit**; povolením se doména přidá a stránka se znovu načte, aby se odmítnuté prostředky zkusily znovu.

Striktní seznam může rozbít stránku, jejíž prostředky pocházejí z CDN, dokud tato CDN není povolena. Seznam „Blokováno“ je řešení a rozhraní prohlížeče nabízí totéž, když odmítne navigaci. Dokud je otevřené jakékoli okno prohlížeče, Vibe potlačí vlastní výzvu k nahrávání.

## Nahrávání hovoru

Ovládací prvky nahrávání v rozhraní prohlížeče jsou na každé povolené stránce, nejen na hostiteli ze seznamu.

1. Otevřete schůzku ve Vibe.
1. Stiskněte **Nahrávat tento hovor** před hovorem nebo během něj.
1. Zastavte z rozhraní prohlížeče nebo z hlavního okna.

Nahrávání je ruční; okno schůzky nikdy nezačne nahrávat samo. Nahrávač zachycuje nastavený mikrofon a při zapnutí i loopback systémového zvuku, takže se nahrají obě strany hovoru.

Zavření okna během nahrávání se zeptá, zda nahrávání zastavit, nebo pokračovat na pozadí.

## Návrat k systémovému prohlížeči

Pokud služba odmítne běžet ve vestavěném webview, použijte na liště **Otevřít v systémovém prohlížeči**. Je to podporovaná náhrada pro stránky silně závislé na DRM nebo nepříznivé vůči WebRTC.

## Další kroky

- [Proč prohlížeč schůzek funguje takto](/vibe/docs#meeting-browser) vysvětluje schéma URL, izolovaný webview, kompromis se seznamem povolených domén a pravidlo ručního nahrávání.
- [Nahrávání mikrofonu a systémového zvuku](/vibe/docs#record-audio) se věnuje nahrávání mimo hovor.
