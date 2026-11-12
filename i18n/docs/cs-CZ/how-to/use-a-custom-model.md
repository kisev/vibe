<!-- source: aa8415261690 -->

# Import vlastního modelu

Vibe spouští modely GGUF prostřednictvím přibaleného jádra. Katalog v **Nastavení → Modely** pokrývá otestované rodiny; tento návod přidává model, který v katalogu není. [Modely](/vibe/docs#models) jsou referencí pro to, co která rodina podporuje.

## Stažení z URL

1. Otevřete **Nastavení → Modely**.
1. Vložte přímý odkaz na model do **Stáhnout model** a potvrďte.
1. Počkejte na dokončení stahování; soubor se uloží do složky s modely.
1. Vyberte nový model v seznamu modelů.

Vibe přijme stejný požadavek i jako deep link:

```text
vibe://download/?url=https://example.com/model.gguf
```

Vložená URL nenese velikost ani kontrolní součet, proto Vibe před přijetím souboru zkontroluje stažená data a hlavičku GGUF/BIN. Položky katalogu v [Modelech](/vibe/docs#models) nesou pevně danou revizi, velikost a SHA-256.

## Použití souboru na disku

1. Umístěte soubor `.gguf` do složky s modely. Cesta ke složce je v **Nastavení → Modely → Složka s modely**, která ji také otevře.
1. Vraťte se do **Nastavení → Modely**; soubor se objeví v seznamu nainstalovaných.
1. Vyberte jej.

Složku přesouvejte nebo přejmenovávejte jen pomocí **Změnit složku s modely** a poté model znovu vyberte.

## Když se model nenačte

- Soubor musí být GGUF nebo starší kontejner `.bin`, který jádro přijímá.
- Model, který vyžaduje novější transcribe.cpp než přibalený, je v katalogu uveden, ale zatím se nenačte.
- Model s pevně daným jazykem odmítne jiný jazyk; chyba uvede podporovaný jazyk.

## Další kroky

- [Modely](/vibe/docs#models) pro otestovaný katalog a limity jednotlivých rodin.
- [Příkazový řádek](/vibe/docs#cli) pro spuštění modelu bez okna.
