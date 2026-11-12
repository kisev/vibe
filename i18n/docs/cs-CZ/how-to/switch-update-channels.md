<!-- source: bc1a1519974a -->

# Přepínání kanálů aktualizací

Vibe kontroluje jeden ze tří kanálů aktualizací: Release, Beta nebo Dev. Kanál určuje, která sestavení aplikace nabízí, a posouvá se pouze vpřed.

## Volba kanálu

1. Otevřete **Nastavení → Obecné → Aktualizace**.
1. Zvolte **Release**, **Beta** nebo **Dev**.
1. Stiskněte **Zkontrolovat aktualizace**.

Stejná část zobrazuje nainstalovanou verzi, čas poslední kontroly a výsledek. Kontrola probíhá také při spuštění.

## Co který kanál obsahuje

| Kanál | Sestavení |
| --- | --- |
| Release | Stabilní verze |
| Beta | Kandidáti na vydání příští stabilní verze |
| Dev | Nejnovější sestavení `dev` |

Instalace Release nebo Beta, která zvolí Dev, uvidí **Aktuální**: každé dev sestavení se řadí pod verzi, která už běží. Přechod na řadu dev vyžaduje jednu ruční instalaci dev sestavení; poté jej kanál Dev aktualizuje vpřed.

Instalace Beta přejde na finální vydání přepnutím na Release, kde se stabilní verze řadí nad své kandidáty.

## Další kroky

- [Kanály aktualizací](/vibe/docs#update-channels) pro soubory kanálů a pravidla značek.
- [Proč kanály aktualizací fungují takto](/vibe/docs#update-channels-design) pro řazení verzí.
