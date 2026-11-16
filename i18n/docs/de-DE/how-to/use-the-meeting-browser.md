<!-- source: a039b159d4fd -->

# Besprechungsbrowser verwenden

Vibe kann einen Anruf in einem eigenen Chromium-basierten Fenster hosten: Die Leiste der App (Adresse, Zurück, Vorwärts, Neu laden, extern öffnen, Schließen und **Diese Besprechung aufnehmen**) sitzt oben, und die Seite füllt den Rest desselben Fensters. Es gibt kein separates Leistenfenster. Siehe [Besprechungsbrowser-Referenz](../reference/meeting-browser.md) für die URL-Schemata und die Allowlist sowie [die Erklärung](../explanation/meeting-browser.md) dafür, warum der Mechanismus so funktioniert.

## Einen Anruf in Vibe öffnen

Verwenden Sie einen dieser Wege:

- Aus einer anderen App oder dem System: Aktivieren Sie **Besprechungslinks in Vibe öffnen** unter **Einstellungen → Aufnahme**, um Zoom-, Teams- und Webex-Links zu registrieren (Windows und Linux, nicht macOS). Die App validiert die zugeordnete URL und öffnet sie im Browserfenster, wenn ihr Host geladen werden darf, andernfalls im Systembrowser.
- In Vibe: die Quelle **Besprechungsbrowser** auf der Startseite oder **Einstellungen → Aufnahme → In Vibe öffnen**; fügen Sie den Link ein und drücken Sie **In Vibe öffnen**.
- Der Host des Links muss in der Allowlist stehen; Top-Level-Navigation und ursprungsübergreifende Ressourcen außerhalb davon werden abgelehnt. Die Aufnahmesteuerung der Leiste ist auf jeder erlaubten Seite vorhanden.

Ein Klick auf einen https-Link in Chrome, Edge oder Firefox öffnet weiterhin diesen Browser. Vibe registriert sich nicht als Standardbrowser.

## Einen Anruf aufnehmen

1. Öffnen Sie die Besprechung in Vibe.
1. Drücken Sie **Diese Besprechung aufnehmen** in der Leiste des Fensters vor oder während des Anrufs.
1. Stoppen Sie über die Leiste oder das Hauptfenster.

Die Aufnahme ist manuell; ein Besprechungsfenster startet nie von selbst eine Aufnahme. Der Recorder erfasst das konfigurierte Mikrofon und, wenn aktiviert, das Systemaudio-Loopback, sodass beide Seiten des Anrufs aufgenommen werden.

Die Mikrofon- und Lautsprecherauswahl in der Leiste ändern dieselben Geräte, die das Hauptfenster verwendet, sodass ein Anruf ohne Verlassen des Fensters geroutet werden kann. Während eine Aufnahme läuft, sind sie deaktiviert und nennen die Geräte, die sie erfasst; eine Quelle, die der Lauf nicht erfasst, zeigt **Keine**.

Das Schließen des Fensters während einer Aufnahme fragt, ob beendet oder im Hintergrund weiter aufgenommen werden soll.

## Die von Ihnen verwendeten Seiten zulassen

**Einstellungen → Aufnahme → Erlaubte Domains** ist die Allowlist des Browsers; sie startet leer. Fügen Sie jede benötigte Domain hinzu, und ihre Subdomains sind über https einbezogen.

Nur gelistete Domains dürfen geladen werden. Ein Link zu einem anderen Host wird abgelehnt, ebenso jedes Skript, jede Schriftart oder jedes Bild, das eine erlaubte Seite von einem nicht gelisteten Ursprung lädt. Abgelehnte Hosts erscheinen unter **Blockiert** mit einer Aktion **Zulassen**, die die Domain hinzufügt und die Seite neu lädt. Die Leiste zeigt dasselbe Angebot, wenn sie eine Navigation ablehnt.

Die strikte Liste kann eine Seite brechen, deren Ressourcen von einem CDN kommen, bis dieses CDN zugelassen ist; das ist der beabsichtigte Kompromiss, und die Liste der blockierten Hosts macht die Behebung zu einem Klick.

## Auf den Systembrowser ausweichen

Wenn ein Dienst sich weigert, in der eingebetteten Webview zu laufen, verwenden Sie **Im Systembrowser öffnen** in der Leiste. Der Systembrowser ist der unterstützte Ausweichweg für DRM-lastige oder WebRTC-feindliche Seiten.

Unter macOS hat der eingebettete Browser keine Leiste im Fenster: Die Seite öffnet sich in einem reinen Seitenfenster, die Aufnahme bleibt über das Hauptfenster verfügbar, und der Systembrowser ist der Ausweichweg für den gesamten Anruf.
