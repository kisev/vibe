<!-- source: 18fa449ab772 -->

# Update-Kanäle

Die App aktualisiert aus einer von drei Kanaldateien auf der Website, nicht aus dem „Latest Release“ von GitHub:

| Kanal | Datei |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Jede Datei ist die `latest.json`, die ein Release-Build erzeugt hat. Eine fehlende Datei bedeutet, dass auf der Linie nichts liegt: Die App meldet „Auf dem neuesten Stand“, statt auf einen anderen Kanal zurückzufallen.

## Linien und Versionen

| Kanal | Tag | Branch | Version | Was es ist |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | Die stabile Linie |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Kandidat für die nächste stabile Version, als Vorabversion veröffentlicht |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Der fortlaufende Build von `dev` |

Ein einfaches Release wird im Beta-Kanal abgelehnt; dort wird nur `X.Y.Z-rc.<n>` akzeptiert. Ein Kanal ohne Kandidat fehlt, er ist nicht leer.

## In der App

- **Einstellungen → Allgemein → Updates** enthält die Kanalauswahl, die aktuelle Version, **Nach Updates suchen**, den Zeitpunkt der letzten Prüfung und das Ergebnis.
- Die App fragt selbst `updater/<channel>.json` ab. Ein `404` oder `410` bedeutet, dass der Kanal nie veröffentlicht wurde; jeder andere Fehler ist ein echter Fehler.
- Die Prüfung läuft beim Start und nach einem Kanalwechsel.

## Grenzen

- Der Updater bewegt sich nur vorwärts. Ein schlechter Build wird behoben, indem ein neuerer ausgeliefert wird.
- Eine Release- oder Beta-Installation, die Dev wählt, sieht „Auf dem neuesten Stand“: Jeder Dev-Build sortiert unter der bereits laufenden Version. Der Wechsel auf die Dev-Linie erfordert eine manuelle Installation eines Dev-Builds; danach aktualisiert der Dev-Kanal sie vorwärts.
- Eine Beta-Installation wechselt zum finalen Release, indem sie auf Release umstellt, wo `X.Y.Z` über seinen Kandidaten sortiert.

## Verwandte Seiten

- [Update-Kanäle wechseln](/vibe/docs#switch-update-channels) für die Schritte.
- [Warum Update-Kanäle so funktionieren](/vibe/docs#update-channels-design) für das Design.
