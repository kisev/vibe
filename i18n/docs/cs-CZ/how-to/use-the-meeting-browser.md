<!-- source: fa863fbcee4b -->

# Používání prohlížeče schůzek

Vibe umí hostovat hovor ve vlastním okně s lištou vždy navrchu, jejíž hlavní akcí je **Nahrávat tento hovor**. Okno používá webview platformy; [Proč prohlížeč schůzek funguje takto](/vibe/docs#meeting-browser) se věnuje izolaci a limitům.

## Otevření hovoru ve Vibe

Použijte jednu z těchto cest:

- Otevřete **Nastavení → Nahrávání → Otevřít ve Vibe**, vložte odkaz a otevřete jej.
- Z jiné aplikace, skriptu nebo zkratky zavolejte `vibe://open/?url=https://…`. Vibe přijímá jen správně utvořené https URL a cokoli jiného odmítne dialogem.
- Zapněte **Otevírání odkazů na schůzky ve Vibe** v **Nastavení → Nahrávání**, aby se registrovaly odkazy Zoom, Teams a Webex. Je k dispozici na Windows a Linuxu, ne na macOS.

Kliknutí na odkaz https v Chrome, Edge nebo Firefoxu stále otevře daný prohlížeč. Vibe se neregistruje jako výchozí prohlížeč.

## Získání lišty nahrávání

**Nastavení → Nahrávání → Hostitelé schůzek** uvádí hostitele, kteří dostanou lištu schůzky. Výchozí jsou `telemost.yandex.ru` a `stream.wb.ru`.

- Přidejte hostitele, aby se jeho odkazy staly relacemi, které lze nahrávat.
- Odeberte hostitele a lištu ztratíte; jeho odkazy se však stále otevírají v okně prohlížeče.

Párování probíhá podle názvu hostitele přes https, takže `sub.telemost.yandex.ru` odpovídá položce `telemost.yandex.ru`, zatímco URL s `http` ne. Seznam je pomocný filtr, ne bezpečnostní hranice: každý odkaz https se otevře v okně, ale lištu dostanou jen uvedení hostitelé.

## Nahrávání hovoru

1. Otevřete schůzku ve Vibe.
1. Stiskněte **Nahrávat tento hovor** před hovorem nebo během něj.
1. Zastavte z lišty nebo z hlavního okna.

Nahrávání je ruční; okno schůzky nikdy nezačne nahrávat samo. Nahrávač zachycuje nastavený mikrofon a při zapnutí i loopback systémového zvuku, takže se nahrají obě strany hovoru.

Zavření okna během nahrávání se zeptá, zda nahrávání zastavit, nebo pokračovat na pozadí.

## Návrat k systémovému prohlížeči

Pokud služba odmítne běžet ve vestavěném webview, použijte na liště **Otevřít v systémovém prohlížeči**. Je to podporovaná náhrada pro stránky silně závislé na DRM nebo nepříznivé vůči WebRTC.

## Další kroky

- [Proč prohlížeč schůzek funguje takto](/vibe/docs#meeting-browser) vysvětluje schéma URL, izolovaný webview a pravidlo ručního nahrávání.
- [Nahrávání mikrofonu a systémového zvuku](/vibe/docs#record-audio) se věnuje nahrávání mimo hovor.
