<!-- source: dd9e41dac7e3 -->

# Nastavení a konfigurace

Nastavení jsou uložena v `app_config.json` v adresáři konfigurace aplikace. Soubor je určen ke čtení a úpravám: Vibe jej sleduje a vnější změnu aplikuje bez restartu. **Nastavení → Agenti → Konfigurační soubor** jej otevře.

## Umístění konfiguračního souboru

| Platforma | Adresář |
| --- | --- |
| macOS | `~/Library/Application Support/github.com.thewh1teagle.vibe` |
| Windows | `%appdata%\github.com.thewh1teagle.vibe` |
| Linux | `~/.config/github.com.thewh1teagle.vibe` |

Adresář si zachovává identifikátor z upstreamu, takže název se oproti dřívějším sestavením nezměnil.

## Sekce nastavení

| Sekce | Obsahuje |
| --- | --- |
| Obecné | Jazyk zobrazení, motiv vzhledu, aktualizace, ponechání běhu v oznamovací oblasti, spouštění po přihlášení, zabránění uspání |
| Soukromí | Zda se ukládají projekty a zásady ochrany osobních údajů |
| Přepis | Jazyk, automatický export, zvuk a přenesení okna po dokončení, složka projektů |
| Modely | Volba CPU/GPU, zařízení GPU, katalog modelů, model pro rozlišení mluvčích |
| Ladění | Možnosti Whisperu, zpracování zvuku, paměť modelu a časový limit uvolnění |
| Nahrávání | Prohlížeč schůzek, detekce schůzek, automatický přepis, zkratka pro nahrávání, oprávnění v macOS |
| Diktování | Zkratka pro diktování a režim aktivace |
| AI | Shrnutí a úlohy diktování, připojení k platformě |
| Telefon | Předání z telefonu, párování, spárovaná zařízení |
| Agenti | Lokální API, dovednost agenta, konfigurační soubor |
| Pokročilé | Záznamy (logy), diagnostika a nástroje pro vývojáře |

## Hodnoty, které je dobré znát

| Skupina klíčů | Význam |
| --- | --- |
| `transcription.*` | Jazyk, zadání (prompt), diarizace, časové značky, dělení dlouhých nahrávek |
| `model.*` | Vybraný model, zobrazovaná jména, zařízení GPU, přepínač pouze CPU, časový limit uvolnění |
| `transcript.*` | Formát exportu, časové značky, mluvčí, automatický export |
| `recording.*` | Vstupní a výstupní zařízení, detekce schůzek, zkratka pro nahrávání |
| `ai.*` | Platforma, základní URL, klíč, model, zadání a přepínače pro jednotlivé úlohy |
| `general.updateChannel` | `stable`, `beta` nebo `dev` |
| `handoff.pairing` | Spárovaná telefonní zařízení a hashe přihlašovacích údajů |

Přesné názvy polí jsou natolik stabilní, že je lze upravovat, ale schéma vlastní aplikace: měňte hodnotu přes uživatelské rozhraní nastavení, když taková možnost existuje, a nechte aplikaci soubor přepsat, místo abyste jej nahrazovali celý.

## Související stránky

- [Přepínání kanálů aktualizací](/vibe/docs#switch-update-channels) o nastavení kanálu.
- [Shrnutí přepisu](/vibe/docs#summarize-transcripts) o připojení k AI.
- [Přepis z telefonu](/vibe/docs#transcribe-from-a-phone) o nastaveních předání z telefonu.
