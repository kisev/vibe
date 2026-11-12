<!-- source: 2459ffcb4329 -->

# Soukromí a offline návrh

Vibe je postaveno tak, že běžná cesta přepisu nepotřebuje účet ani cloudovou službu. Aplikace spustí lokální server, server načte model z disku a zvuk se dekóduje a přepíše na stejném počítači.

## Co zůstává lokálně

- Zvukové soubory, nahrávky, exporty a přepisy.
- Modely a binárky ffmpeg.
- Historie projektů ve složce projektů.
- Lokální HTTP API mezi desktopovou aplikací a `vibe-server`, navázané na loopback.

Aplikace neposílá žádnou telemetrii. **Nahlásit problém** sestaví předvyplněný problém z lokální diagnostiky a otevře GitHub; nic se neodešle, dokud jej nezkontrolujete a neodešlete.

## Kde se používá síť

| Funkce | Síťový kontakt |
| --- | --- |
| Stahování modelu | Hostitel, který poskytuje soubor modelu |
| Přepis z odkazu | Hostitel média a GitHub kvůli binárce yt-dlp |
| Kontrola aktualizací | Soubor kanálu na webu |
| Shrnutí pomocí AI s Claude nebo OpenAI | Nastavený poskytovatel |
| Shrnutí pomocí AI s Ollama | URL Ollama, ve výchozím nastavení lokální |
| Předání z telefonu | End-to-end šifrovaný předávací server mezi telefonem a tímto počítačem |

Samotné jádro přepisu nemá síťovou cestu.

## Předání z telefonu

Telefon a počítač se propojují přes iroh. Předávací server přenáší end-to-end šifrovaný provoz, takže předává bajty, které nedokáže přečíst; přepis stále probíhá na tomto počítači a Vibe musí zůstat otevřené, aby předání fungovalo.

## Kompromisy

- Lokální modely zabírají místo na disku a využívají CPU nebo GPU počítače. [Volba jádra a GPU](/vibe/docs#engine) vysvětluje rozdělení.
- Shrnutí v cloudu posílá text přepisu zvolenému poskytovateli. Ponechte platformu na Ollama, aby zůstal lokálně.
- Aktualizace se kontrolují ze statických souborů na webu, což prozradí, že aplikace zkontrolovala kanál, nikoli co přepsala.

## Související stránky

- [Nastavení a konfigurace](/vibe/docs#settings) pro lokální konfigurační soubor.
- [Přepis z telefonu](/vibe/docs#transcribe-from-a-phone) pro kroky předání.
- [Shrnutí přepisu](/vibe/docs#summarize-transcripts) pro platformy AI.
