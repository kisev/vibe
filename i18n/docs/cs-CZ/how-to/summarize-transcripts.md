<!-- source: f5e20b838770 -->

# Shrnutí přepisu

Vibe umí z hotového přepisu udělat shrnutí, poznámky nebo překlad. Požadavek jde na platformu AI, kterou nastavíte: lokální model Ollama, Claude nebo jakýkoli koncový bod kompatibilní s OpenAI. [Nastavení a konfigurace](/vibe/docs#settings) uvádějí, kde je připojení uloženo.

## Použití lokálního modelu Ollama

1. Nainstalujte [Ollama](https://ollama.com) a stáhněte model, například `ollama pull llama3.1`.
1. Otevřete **Nastavení → AI**.
1. Nastavte **Platforma** na **Ollama**. Výchozí URL je `http://localhost:11434`.
1. Vyberte název modelu.
1. Zapněte **Shrnutí** a volitelně **Automaticky shrnovat nové přepisy**.

Ollama běží na tomto počítači, takže přepis zůstává lokálně.

## Použití Claude nebo koncového bodu kompatibilního s OpenAI

1. Otevřete **Nastavení → AI** a zvolte platformu.
1. Vložte API klíč a změňte základní URL, pokud koncový bod není výchozí.
1. Vyberte model.
1. Zapněte **Shrnutí**.

U nevýchozího koncového bodu jsou základní URL a klíč připojením, které aplikace používá pro shrnutí i diktování.

## Shrnutí

1. Dokončete přepis.
1. Otevřete akci shrnutí v zobrazení přepisu.
1. Vyberte předvolbu a v případě potřeby upravte zadání (prompt).
1. Spusťte ji; výsledek se uloží s projektem a lze jej exportovat vedle přepisu.

Když je zapnuté **Automaticky shrnovat nové přepisy**, shrnutí se spustí hned po dokončení přepisu.

## Další kroky

- [Nastavení a konfigurace](/vibe/docs#settings) pro konfigurační soubor a sekce nastavení.
- [Soukromí a offline návrh](/vibe/docs#privacy) pro to, které platformy drží text na počítači.
