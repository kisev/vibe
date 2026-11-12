<!-- source: 42d301759b1a -->

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

## Warum die Aufnahme manuell bleibt

Hosts in der Besprechungsliste machen das Fenster zu einer Besprechungssitzung: Die Leiste zeigt **Diese Besprechung aufnehmen**. Die Aufnahme bleibt manuell — drücken Sie die Schaltfläche vor oder während des Anrufs und stoppen Sie über die Leiste oder das Hauptfenster. Ein automatischer Start würde Anrufe aufnehmen, die der Nutzer nicht aufnehmen wollte, und den Mikrofonindikator ohne ausdrückliche Aktion erscheinen lassen.

Das Schließen des Fensters während einer Aufnahme fragt, ob beendet oder im Hintergrund weiter aufgenommen werden soll, sodass ein Verlassen des Anrufs eine Aufnahme nicht still verwerfen oder fortsetzen kann.

## Grenzen

- Nur `vibe://open/`-Links öffnen automatisch. Ein `https`-Klick braucht die Standardbrowser-Entscheidung, die Vibe nicht trifft.
- DRM-lastige oder WebRTC-feindliche Seiten funktionieren möglicherweise besser im Systembrowser; **Im Systembrowser öffnen** ist der unterstützte Ausweichweg.
- Windows wird zuerst validiert. Die anderen Plattformen nutzen ihre eigenen Webviews und weichen auf den Systembrowser aus, wenn das Fenster den Anruf nicht hosten kann.
- Die Registrierung von Zoom-, Teams- und Webex-Schemas ist optional und unter Windows und Linux verfügbar, nicht unter macOS.

## Verwandte Seiten

- [Besprechungsbrowser verwenden](/vibe/docs#use-the-meeting-browser) für die Schritte.
- [Mikrofon und Systemaudio aufnehmen](/vibe/docs#record-audio) für den Recorder selbst.
