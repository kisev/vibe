<!-- source: dc7efd39c01b -->

# Proč kanály aktualizací fungují takto

GitHub má jedno „nejnovější vydání“. Vibe potřebuje tři řady — Release, Beta a Dev — a uživatel musí moci mezi nimi přepínat, i ze starší instalace. Tento rozpor určuje návrh kanálů.

## Proč web, a ne GitHub

Aplikace čte `updater/<channel>.json` z webu. Každý soubor je `latest.json`, který vytvořilo vydané sestavení, zkopírovaný vedle ostatních:

- Release → `stable.json`
- Beta → `beta.json`
- Dev → `dev.json`

Soubor kanálu je statický prostředek nasazený s webem, takže nasměrování řady na sestavení je commit, ne úprava vydání. Umožňuje také, aby chybějící kanál znamenal něco přesného: `404` nebo `410` je „v této řadě nic“, což aplikace hlásí jako aktuální stav. Kdyby aplikace při chybějícím souboru přešla na jiný kanál, uživatel Beta bez kandidáta by byl tiše přesunut na Release.

## Proč má beta příponu `-rc.<n>`

Semver řadí:

```text
X.Y.Z-dev.N < X.Y.Z-rc.N < X.Y.Z
```

Toto řazení je celým důvodem tohoto zápisu. Při striktním porovnání aktualizátoru se Dev → Beta → Release vždy posouvá vpřed; žádná výjimka není potřeba.

Dřívější řada používala `-beta.N`, ale neměla kanál dev. `X.Y.Z-beta.N` se řadí nad `X.Y.Z-dev.N`, takže beta sestavení by vypadalo novější než každé dev sestavení a přepnutí by se rozbilo. Kanál beta si ponechává své jméno; přípona verze je pouze `-rc.<n>`.

## Proč beta obsahuje jen kandidáty

Do `beta.json` se zapisuje pouze verze `X.Y.Z-rc.<n>`; běžné vydání je odmítnuto. Díky tomu má řada beta smysl: je to řada kandidátů, ne druhá stabilní řada. Po stabilním vydání přejde instalace Beta na finální přepnutím kanálu na Release, kde se `X.Y.Z` řadí nad své kandidáty.

## Aktualizace pouze vpřed

Aktualizátor se posouvá pouze vpřed. Špatné vydání se opraví vydáním novějšího, a k tomu řada beta slouží: zachytit problém dřív, než se dostane do Release. To je také důvod, proč instalace Release nebo Beta, která zvolí Dev, uvidí **Aktuální**: každé dev sestavení se řadí pod verzi, která už běží. Přechod na řadu dev vyžaduje jednu ruční instalaci dev sestavení; poté jej kanál Dev aktualizuje vpřed.

## Kompromisy

- **Kopírované manifesty** znamenají, že změna kanálu je commit do `main` a nasazení webu, ne volání API. Zpoždění je v minutách a historie je dohledatelná.
- **Žádný přechod mezi kanály** znamená, že uživatel vidí přesné **Aktuální**, místo překvapivého downgradu nebo skoku mezi řadami.
- **Dev vyžaduje jednu ruční instalaci** — to je cena za poctivé řazení semver. Automatizace by vyžadovala koncept kanálu, který starší klienti nemají.

## Související stránky

- [Kanály aktualizací](/vibe/docs#update-channels) pro soubory a pravidla verzí.
- [Přepínání kanálů aktualizací](/vibe/docs#switch-update-channels) pro jednotlivé kroky.
