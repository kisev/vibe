<!-- source: 6737f12a1fc7 -->

# Besprechungsbrowser

Der Besprechungsbrowser existiert, weil sich ein Anruf leichter aufnehmen lässt, wenn Vibe die Seite selbst hostet: Die App kontrolliert das Fenster, weiß, wann eine Aufnahme läuft, und kann ihre eigene Leiste mit einer Aktion anzeigen. Das Design richtet sich danach, was das Betriebssystem tatsächlich erlaubt.

## Warum ein URL-Schema statt https-Klicks

Ein Browser übergibt einen `https://`-Link nie an eine installierte App, es sei denn, diese App ist der Standardbrowser. Desktop-Besprechungs-Apps arbeiten umgekehrt: Sie registrieren ihr eigenes Schema (`zoommtg://`, `msteams://`, `mattermost://`), und ihre eigenen Seiten oder Installationsprogramme rufen es auf.

Vibe macht es genauso, ohne Umwege:

- Aktivieren Sie **Besprechungslinks in Vibe öffnen**, und Vibe registriert die Besprechungsschemata, die Zoom, Teams und Webex bereits verwenden (`zoommtg://`, `msteams://`, `webex://`), und ordnet jedes der Web-URL zu, die es trägt. Die App validiert die URL in Rust und öffnet sie im Browserfenster, wenn ihr Host geladen werden darf, andernfalls im Systembrowser.
- Eine als Startargument übergebene `https`-URL nimmt denselben Weg.
- In der App fügen die Quelle **Besprechungsbrowser** auf der Startseite und **Einstellungen → Aufnahme → In Vibe öffnen** einen Link in denselben Weg ein.

Vibe liefert bewusst keinen eigenen `vibe://open/`-Link aus: Keine Besprechungsseite gibt einen aus, weshalb dieser erste Einstiegspunkt entfernt wurde. Ein Klick auf einen `https`-Link in Chrome, Edge oder Firefox öffnet weiterhin diesen Browser. Vibe zum Standardbrowser zu machen ist bewusst außerhalb des Umfangs: Es würde jeden Link auf dem Rechner übernehmen, um eine Funktion zu bedienen, und wäre immer noch eine Entscheidung des Nutzers.

## Warum die Inhaltsansicht isoliert ist

Das Fenster enthält zwei untergeordnete Webviews: die Leiste von Vibe und die entfernte Seite. Die Leiste ist App-Oberfläche und trägt die Fähigkeiten der App; die Seite ist gewöhnlicher, nicht vertrauenswürdiger Webinhalt ganz ohne Fähigkeiten, es werden keine Skripte in sie injiziert, und Kamera- und Mikrofonabfragen kommen von der Seite selbst, statt dass Vibe sie im Namen des Nutzers erteilt. Beide teilen sich die WebView2-Umgebung des Prozesses, weil WebView2 kein zweites Datenverzeichnis in einem Prozess unterstützt.

Die Leiste bietet Adresse, Zurück, Vorwärts, Neu laden, Schließen und **Im Systembrowser öffnen**. Die letzte Aktion ist der Ausweg für einen Dienst, der sich weigert, in der eingebetteten Webview zu laufen. Das Einbetten mehrerer Webviews ist hier eine Desktop-Funktion von Windows und Linux; unter macOS fällt der Browser auf ein reines Seitenfenster ohne Leiste zurück, statt zu scheitern.

## Warum der Browser eine Allowlist ist

Der eingebettete Browser lud ursprünglich, was auch immer eine Seite anforderte; die Besprechungs-Host-Liste entschied nur, welche Links die Aufnahmeleiste erhielten. Jetzt ist er eine echte Grenze: Nur erlaubte Domains und ihre Subdomains dürfen über https geladen werden, sowohl für Top-Level-Seiten als auch für jede Ressource, die sie anfordern. Eine abgelehnte Ressource erhält eine Fehlerantwort, damit die Seite diesen Ursprung als nicht verfügbar behandelt, statt endlos erneut zu versuchen.

Strenge hat einen Preis: Eine Seite, die Schriftarten oder Skripte von einem CDN lädt, bricht, bis dieses CDN zugelassen ist. Die Liste der blockierten Hosts ist das Gegenmittel — eindeutige Hosts, neueste zuerst, jeweils mit einer Aktion **Zulassen**, die die Domain hinzufügt und die Seite neu lädt. Die Liste wird innerhalb der Leiste gezeichnet, und die Leiste wächst, um sie aufzunehmen, weil ein Popup in einer 104-Pixel-Webview von der Seite darunter abgeschnitten würde. Die Leiste macht dasselbe Angebot, wenn sie eine Navigation ablehnt. Windows erzwingt das Blockieren von Ressourcen mit `WebResourceRequested` von WebView2; Linux und macOS blockieren derzeit nur die Top-Level-Navigation.

Der Modus wird zwischengespeichert und nicht pro Fenster gelesen, und der Ressourcenfilter wird in beiden Modi installiert, sodass ein Wechsel zwischen `strict` und `trusted-site` eine bereits geöffnete Seite bei ihrer nächsten Anfrage erreicht, statt ein erneutes Öffnen zu verlangen.

## Warum die Aufnahme manuell bleibt

Jede Seite im Browser zeigt **Diese Besprechung aufnehmen**, und solange ein Browserfenster geöffnet ist, wird die Aufforderung für Besprechungen im externen Browser unterdrückt. Die Aufnahme bleibt manuell — drücken Sie die Schaltfläche vor oder während des Anrufs, stoppen Sie über die Leiste oder das Hauptfenster. Ein automatischer Start würde Anrufe aufnehmen, die der Nutzer nicht aufnehmen wollte, und den Mikrofonindikator der App ohne eine ausdrückliche Aktion erscheinen lassen.

Das Schließen des Fensters während einer Aufnahme fragt, ob beendet oder im Hintergrund weiter aufgenommen werden soll, sodass das Verlassen eines Anrufs eine Aufnahme nicht still verwerfen oder fortsetzen kann.

## Grenzen

- Nur ein registriertes Besprechungsschema oder ein `https`-Startargument wird an Vibe übergeben. Ein `https`-Klick braucht die Standardbrowser-Entscheidung, die Vibe nicht trifft.
- DRM-lastige oder WebRTC-feindliche Seiten funktionieren möglicherweise besser im Systembrowser; **Im Systembrowser öffnen** ist der unterstützte Ausweichweg.
- Windows wird zuerst validiert. Die anderen Plattformen nutzen ihre eigenen Webviews und fallen auf den Systembrowser zurück, wenn das Fenster den Anruf nicht hosten kann.

Fakten und die Regeln der Allowlist stehen in [Besprechungsbrowser-Referenz](../reference/meeting-browser.md); die Schritte stehen in [Besprechungsbrowser verwenden](../how-to/use-the-meeting-browser.md).
