<!-- source: 7770d2556ea9 -->

# Warum der Besprechungsbrowser so funktioniert

Ein Anruf lässt sich leichter aufnehmen, wenn Vibe die Seite selbst hostet: Die App kontrolliert das Fenster, weiß, wenn eine Aufnahme läuft, und kann eine Leiste mit einer Aktion anzeigen. Das Design richtet sich danach, was das Betriebssystem tatsächlich erlaubt.

## Warum ein URL-Schema statt https-Klicks

Ein Browser übergibt einen `https://`-Link nie an eine installierte App, es sei denn, diese App ist der Standardbrowser. Besprechungs-Apps arbeiten umgekehrt: Sie registrieren ihr eigenes Schema, und ihre Seiten oder Installationsprogramme rufen es auf.

Vibe macht dasselbe:

- `vibe://open/?url=https://…` öffnet das Ziel im Browserfenster von Vibe. Jede App, jedes Skript und jede Verknüpfung kann es aufrufen. Vibe validiert die URL in Rust und lehnt alles ab, was nicht https und wohlgeformt ist.
- **Einstellungen → Aufnahme → In Vibe öffnen** fügt einen Link in denselben Weg ein.

Ein Klick auf einen `https`-Link in Chrome, Edge oder Firefox öffnet weiterhin diesen Browser. Vibe zum Standardbrowser zu machen ist bewusst außerhalb des Umfangs: Es würde jeden Link auf dem Rechner übernehmen, um eine Funktion zu bedienen.

## Warum die Inhaltsansicht isoliert ist

Das Inhaltsfenster ist eine gewöhnliche Webview mit einem eigenen Datenverzeichnis. Cookies des Dienstes vermischen sich nie mit dem Speicher der App, es werden keine Skripte in die Seite injiziert, und Kamera- und Mikrofonabfragen kommen von der Seite selbst, statt dass Vibe sie im Namen des Nutzers erteilt. Die eingebettete Seite wird als nicht vertrauenswürdiger Webinhalt behandelt, nicht als Teil der App.

Die Leiste bietet Adresse, Zurück, Vorwärts, Neu laden, Schließen und **Im Systembrowser öffnen**. Die letzte Aktion ist der Ausweg für einen Dienst, der sich weigert, in der eingebetteten Webview zu laufen.

## Warum der Browser eine Allowlist ist

Der eingebettete Browser lud ursprünglich, was auch immer eine Seite anforderte; die Besprechungs-Host-Liste entschied nur, welche Links die Aufnahmeleiste erhielten. Jetzt ist er eine echte Grenze. Nur Domains, die der Nutzer zugelassen hat, und ihre Subdomains über https dürfen geladen werden – Top-Level-Seiten und jede Ressource, die die Seite anfordert. Eine abgelehnte Ressource wird mit einer Fehlerantwort beantwortet, damit die Seite diesen Ursprung als nicht verfügbar behandelt, statt endlos erneut zu versuchen.

Strenge ist der Sinn, und sie hat einen Preis: Eine Seite, die Schriftarten oder Skripte von einem CDN lädt, bricht, bis dieses CDN zugelassen ist. Die Liste der blockierten Hosts ist das Gegenmittel – eindeutige Hosts, neueste zuerst, jeweils mit einer Aktion **Zulassen**, die die Domain hinzufügt und die Seite neu lädt. Die Browserleiste macht dasselbe Angebot, wenn sie eine Navigation ablehnt.

## Warum die Aufnahme manuell bleibt

Jede Seite im Browserfenster zeigt **Diese Besprechung aufnehmen**, und solange ein Browserfenster geöffnet ist, unterdrückt Vibe seine eigene Abfrage für externe Anrufe. Die Aufnahme bleibt manuell – drücken Sie die Schaltfläche vor oder während des Anrufs, stoppen Sie über die Browserleiste oder das Hauptfenster. Ein automatischer Start würde Anrufe aufnehmen, die der Nutzer nicht aufnehmen wollte, und den Mikrofonindikator ohne eine ausdrückliche Aktion erscheinen lassen.

Das Schließen des Fensters während einer Aufnahme fragt, ob beendet oder im Hintergrund weiter aufgenommen werden soll, sodass das Verlassen eines Anrufs eine Aufnahme nicht still verwerfen oder fortsetzen kann.

## Grenzen

- Nur `vibe://open/`-Links öffnen automatisch. Ein `https`-Klick braucht die Standardbrowser-Entscheidung, die Vibe nicht trifft.
- DRM-lastige oder WebRTC-feindliche Seiten funktionieren möglicherweise besser im Systembrowser; **Im Systembrowser öffnen** ist der unterstützte Ausweichweg.
- Windows wird zuerst validiert. Das Blockieren von Ressourcen nutzt den eigenen Mechanismus jeder Engine: WebView2 `WebResourceRequested` unter Windows; Linux und macOS blockieren derzeit nur die Top-Level-Navigation und werden noch fertiggestellt.
- Die Registrierung der Schemas für Zoom, Teams und Webex ist optional und unter Windows und Linux verfügbar, nicht unter macOS.

## Verwandte Seiten

- [Besprechungsbrowser verwenden](/vibe/docs#use-the-meeting-browser) für die Schritte.
- [Mikrofon und Systemaudio aufnehmen](/vibe/docs#record-audio) für den Recorder selbst.
