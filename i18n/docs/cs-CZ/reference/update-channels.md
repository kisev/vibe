<!-- source: 18fa449ab772 -->

# Kanály aktualizací

Aplikace se aktualizuje z jednoho ze tří souborů kanálů na webu, nikoli z „nejnovějšího vydání“ GitHubu:

| Kanál | Soubor |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Každý soubor je `latest.json`, který vytvořilo vydané sestavení. Chybějící soubor znamená, že v řadě nic není: aplikace hlásí **Aktuální**, místo aby přešla na jiný kanál.

## Řady a verze

| Kanál | Značka | Větev | Verze | Co to je |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | Stabilní řada |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Kandidát na příští stabilní verzi, publikovaný jako předběžné vydání |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Pohyblivé sestavení řady `dev` |

Běžné vydání je v kanálu beta odmítnuto; přijímá se tam pouze `X.Y.Z-rc.<n>`. Kanál bez kandidáta chybí, není prázdný.

## V aplikaci

- **Nastavení → Obecné → Aktualizace** obsahuje výběr kanálu, aktuální verzi, **Zkontrolovat aktualizace**, čas poslední kontroly a výsledek.
- Aplikace sama zkouší `updater/<channel>.json`. Kód `404` nebo `410` znamená, že kanál nebyl nikdy publikován; každé jiné selhání je skutečná chyba.
- Kontrola probíhá při spuštění a po přepnutí kanálu.

## Hranice

- Aktualizátor se posouvá pouze vpřed. Špatné sestavení se opraví vydáním novějšího.
- Instalace Release nebo Beta, která zvolí Dev, uvidí **Aktuální**: každé dev sestavení se řadí pod verzi, která už běží. Přechod na řadu dev vyžaduje jednu ruční instalaci dev sestavení; poté jej kanál Dev aktualizuje vpřed.
- Instalace Beta přejde na finální vydání přepnutím na Release, kde se `X.Y.Z` řadí nad své kandidáty.

## Související stránky

- [Přepínání kanálů aktualizací](/vibe/docs#switch-update-channels) pro jednotlivé kroky.
- [Proč kanály aktualizací fungují takto](/vibe/docs#update-channels-design) pro návrh.
