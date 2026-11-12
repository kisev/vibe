<!-- source: fa863fbcee4b -->

# Besprechungsbrowser verwenden

Vibe kann einen Anruf in einem eigenen Fenster mit einer immer sichtbaren Leiste hosten, deren Hauptaktion **Diese Besprechung aufnehmen** ist. Das Fenster nutzt die Webview der Plattform; [Warum der Besprechungsbrowser so funktioniert](/vibe/docs#meeting-browser) behandelt die Isolation und die Grenzen.

## Einen Anruf in Vibe öffnen

Verwenden Sie einen dieser Wege:

- Öffnen Sie **Einstellungen → Aufnahme → In Vibe öffnen**, fügen Sie den Link ein und öffnen Sie ihn.
- Rufen Sie aus einer anderen App, einem Skript oder einer Verknüpfung `vibe://open/?url=https://…` auf. Vibe akzeptiert nur wohlgeformte https-URLs und lehnt alles andere mit einem Dialog ab.
- Aktivieren Sie **Besprechungslinks in Vibe öffnen** unter **Einstellungen → Aufnahme**, um Zoom-, Teams- und Webex-Links zu registrieren. Das ist unter Windows und Linux verfügbar, nicht unter macOS.

Ein Klick auf einen https-Link in Chrome, Edge oder Firefox öffnet weiterhin diesen Browser. Vibe registriert sich nicht als Standardbrowser.

## Die Aufnahmeleiste erhalten

**Einstellungen → Aufnahme → Besprechungs-Hosts** listet die Hosts, die die Besprechungsleiste erhalten. Die Standardwerte sind `telemost.yandex.ru` und `stream.wb.ru`.

- Fügen Sie einen Host hinzu, damit seine Links aufnehmbare Sitzungen werden.
- Entfernen Sie einen Host, um die Leiste zu verlieren; seine Links öffnen weiterhin im Browserfenster.

Abgeglichen wird nach Hostname über https, sodass `sub.telemost.yandex.ru` zu einem Eintrag `telemost.yandex.ru` passt, eine `http`-URL hingegen nicht. Die Liste ist ein Komfortfilter, keine Sicherheitsgrenze: Jeder https-Link öffnet im Fenster, aber nur gelistete Hosts erhalten die Leiste.

## Einen Anruf aufnehmen

1. Öffnen Sie die Besprechung in Vibe.
1. Drücken Sie **Diese Besprechung aufnehmen** vor oder während des Anrufs.
1. Stoppen Sie über die Leiste oder das Hauptfenster.

Die Aufnahme ist manuell; ein Besprechungsfenster startet nie von selbst eine Aufnahme. Der Recorder erfasst das konfigurierte Mikrofon und, wenn aktiviert, das Systemaudio-Loopback, sodass beide Seiten des Anrufs aufgenommen werden.

Das Schließen des Fensters während einer Aufnahme fragt, ob beendet oder im Hintergrund weiter aufgenommen werden soll.

## Auf den Systembrowser ausweichen

Wenn ein Dienst sich weigert, in der eingebetteten Webview zu laufen, verwenden Sie **Im Systembrowser öffnen** in der Leiste. Das ist der unterstützte Ausweichweg für DRM-lastige oder WebRTC-feindliche Seiten.

## Nächste Schritte

- [Warum der Besprechungsbrowser so funktioniert](/vibe/docs#meeting-browser) erklärt das URL-Schema, die isolierte Webview und die Regel zur manuellen Aufnahme.
- [Mikrofon und Systemaudio aufnehmen](/vibe/docs#record-audio) behandelt die Aufnahme außerhalb eines Anrufs.
