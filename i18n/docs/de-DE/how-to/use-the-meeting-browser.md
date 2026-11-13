<!-- source: cc4651e4e37d -->

# Besprechungsbrowser verwenden

Vibe kann einen Anruf in einem eigenen Fenster mit einer Leiste hosten, die immer im Vordergrund bleibt und deren Hauptaktion **Diese Besprechung aufnehmen** ist. Das Fenster nutzt die Webview der Plattform; [Warum der Besprechungsbrowser so funktioniert](/vibe/docs#meeting-browser) behandelt die Isolation und die Grenzen.

## Einen Anruf in Vibe öffnen

Verwenden Sie einen dieser Wege:

- Öffnen Sie **Einstellungen → Aufnahme → In Vibe öffnen**, fügen Sie den Link ein und öffnen Sie ihn.
- Rufen Sie aus einer anderen App, einem Skript oder einer Verknüpfung `vibe://open/?url=https://…` auf. Vibe akzeptiert nur wohlgeformte https-URLs und lehnt alles andere mit einem Dialog ab.
- Aktivieren Sie **Besprechungslinks in Vibe öffnen** unter **Einstellungen → Aufnahme**, um Zoom-, Teams- und Webex-Links zu registrieren. Das ist unter Windows und Linux verfügbar, nicht unter macOS.

Ein Klick auf einen https-Link in Chrome, Edge oder Firefox öffnet weiterhin diesen Browser. Vibe registriert sich nicht als Standardbrowser.

## Die von Ihnen verwendeten Seiten zulassen

**Einstellungen → Aufnahme → Erlaubte Domains** ist die Allowlist des Browsers. Sie startet leer: Fügen Sie jede Domain hinzu, die geöffnet werden soll, und ihre Subdomains sind automatisch enthalten. Abgeglichen wird nach Hostname über https – eine `http`-URL wird nie geladen.

Die Liste ist eine Grenze, kein Filter. Ein Link zu einem Host außerhalb davon wird abgelehnt, ebenso jedes Skript, jede Schriftart und jedes Bild, das eine erlaubte Seite von einem nicht gelisteten Ursprung anfordert. Jeder abgelehnte Host erscheint unter **Blockiert** mit einer Aktion **Zulassen**; wenn Sie ihn zulassen, wird die Domain hinzugefügt und die Seite neu geladen, damit die abgelehnten Ressourcen erneut versucht werden.

Eine strenge Liste kann eine Seite brechen, deren Ressourcen von einem CDN kommen, bis dieses CDN zugelassen ist. Die Liste Blockiert ist das Gegenmittel, und die Browserleiste zeigt dasselbe Angebot, wenn sie eine Navigation ablehnt. Solange ein Browserfenster offen ist, unterdrückt Vibe seine eigene Anrufabfrage.

## Einen Anruf aufnehmen

Die Aufnahmesteuerung der Browserleiste ist auf jeder erlaubten Seite vorhanden, nicht nur bei einer Hostliste.

1. Öffnen Sie die Besprechung in Vibe.
1. Drücken Sie **Diese Besprechung aufnehmen** vor oder während des Anrufs.
1. Stoppen Sie über die Browserleiste oder das Hauptfenster.

Die Aufnahme ist manuell; ein Besprechungsfenster startet nie von selbst eine Aufnahme. Der Recorder erfasst das konfigurierte Mikrofon und, wenn aktiviert, das Systemaudio-Loopback, sodass beide Seiten des Anrufs aufgenommen werden.

Das Schließen des Fensters während einer Aufnahme fragt, ob beendet oder im Hintergrund weiter aufgenommen werden soll.

## Auf den Systembrowser ausweichen

Wenn ein Dienst sich weigert, in der eingebetteten Webview zu laufen, verwenden Sie **Im Systembrowser öffnen** in der Leiste. Das ist der unterstützte Ausweichweg für DRM-lastige oder WebRTC-feindliche Seiten.

## Nächste Schritte

- [Warum der Besprechungsbrowser so funktioniert](/vibe/docs#meeting-browser) erklärt das URL-Schema, die isolierte Webview, den Kompromiss der Allowlist und die Regel zur manuellen Aufnahme.
- [Mikrofon und Systemaudio aufnehmen](/vibe/docs#record-audio) behandelt die Aufnahme außerhalb eines Anrufs.
