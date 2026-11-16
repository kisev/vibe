<!-- source: 63b7a2f2736b -->

# Kanály aktualizací

Aplikace se aktualizuje z jednoho ze tří souborů kanálů na webu, nikoli z nejnovějšího vydání GitHubu:

| Kanál | Soubor |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Každý soubor je `latest.json`, který vytvořilo vydané sestavení. Kanál bez souboru je řada, na které nic není: aplikace hlásí „Aktuální“, místo aby přešla na jiný kanál nebo chybějící soubor považovala za neúspěšnou kontrolu.

## Řady a verze

| Kanál | Značka | Větev | Verze | Co to je |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | Stabilní řada |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Kandidát na příští stabilní verzi, publikovaný jako předběžné vydání GitHubu |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Pohyblivé sestavení `dev` |

`beta.json` chybí, dokud není publikován žádný kandidát. Běžné vydání je v kanálu beta odmítnuto; přijímá se tam pouze `X.Y.Z-rc.<n>`.

## Odkud manifesty pocházejí

- **Release a beta**: Tauri aktualizátor vydaného sestavení vytvoří `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` jej stáhne z `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, ověří verzi a zapíše `website/public/updater/<channel>.json`. Soubor zacommitujte do `main`; nasazení webu jej publikuje.
- **Dev**: `.github/workflows/dev-build.yml` publikuje předběžné vydání s artefakty aktualizátoru a `latest.json`. `scripts/dev_manifest.py` přečte nejnovější kompletní dev vydání a zapíše `website/public/updater/dev.json`; nové dev sestavení spustí nasazení webu. Pokud je nejnovější vydání neúplné nebo volání API selže, zůstane předchozí `dev.json`.

`channel.py` odmítá posunout kanál zpět a rozumí řazení `-rc.<n>`.

## V aplikaci

- **Nastavení → Obecné → Aktualizace** obsahuje výběr kanálu, aktuální verzi, **Zkontrolovat aktualizace**, čas poslední kontroly a výsledek.
- Volba za běhu je v `desktop/src-tauri/src/updater.rs`; část webview je `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` dotazuje `updater/<channel>.json` přímo. Kód `404` nebo `410` znamená, že kanál nebyl nikdy publikován; každé jiné selhání je skutečná chyba.
- Statický koncový bod pluginu Tauri v `tauri.conf.json` je náhrada, kterou zná samotný plugin; volba kanálu probíhá v kódu aplikace.

## Hranice

- Aktualizátor se posouvá pouze vpřed. Špatné sestavení se opraví vydáním novějšího.
- Instalace Release nebo Beta, která zvolí Dev, uvidí „Aktuální“: každé dev sestavení se řadí pod verzi, která už běží. Přechod na řadu dev vyžaduje jednu ruční instalaci dev sestavení; poté jej kanál Dev aktualizuje vpřed.
- Instalace Beta přejde na finální vydání přepnutím na Release, kde se `X.Y.Z` řadí nad své kandidáty.
- Aplikace sestavené před soubory kanálů (upstreamová řada 3.x) stále čtou to vydání GitHubu, které je označeno jako „latest“. Co se jim doručí, určuje `gh release edit --latest`, spuštěné jako poslední.

Postupy najdete v [Publikování vydání](../how-to/publish-a-release.md) a [Vytvoření dev sestavení](../how-to/cut-a-dev-build.md) a důvody, proč mají řady a přípony právě tento tvar, ve [vysvětlení](../explanation/update-channels.md).
