<!-- source: 63b7a2f2736b -->

# Update-Kanäle

Die App aktualisiert aus einer von drei Kanaldateien auf der Website, nicht aus dem neuesten GitHub-Release:

| Kanal | Datei |
| --- | --- |
| Release | `https://kisev.github.io/vibe/updater/stable.json` |
| Beta | `https://kisev.github.io/vibe/updater/beta.json` |
| Dev | `https://kisev.github.io/vibe/updater/dev.json` |

Jede Datei ist die `latest.json`, die ein Release-Build erzeugt hat. Ein Kanal ohne Datei ist eine Linie ohne Inhalt: Die App meldet „Auf dem neuesten Stand“, statt auf einen anderen Kanal zurückzufallen oder die fehlende Datei als fehlgeschlagene Prüfung zu behandeln.

## Linien und Versionen

| Kanal | Tag | Branch | Version | Was es ist |
| --- | --- | --- | --- | --- |
| Release | `vX.Y.Z` | `main` | `X.Y.Z` | Die stabile Linie |
| Beta | `vX.Y.Z-rc.<n>` | `main` | `X.Y.Z-rc.<n>` | Kandidat für die nächste stabile Version, als GitHub-Vorabversion veröffentlicht |
| Dev | `dev.<n>` | `dev` | `<config>-dev.<n>.<sha>` | Der fortlaufende Build von `dev` |

`beta.json` fehlt, solange kein Kandidat veröffentlicht ist. Ein einfaches Release wird im Beta-Kanal abgelehnt; dort wird nur `X.Y.Z-rc.<n>` akzeptiert.

## Woher die Manifeste kommen

- **Release und Beta**: Der Tauri-Updater des Release-Builds erzeugt `latest.json`. `scripts/channel.py <version> --channel <stable|beta>` lädt sie von `https://github.com/kisev/vibe/releases/download/v<version>/latest.json`, validiert die Version und schreibt `website/public/updater/<channel>.json`. Committen Sie die Datei nach `main`; der Website-Deploy veröffentlicht sie.
- **Dev**: `.github/workflows/dev-build.yml` veröffentlicht eine Vorabversion mit Updater-Artefakten und `latest.json`. `scripts/dev_manifest.py` liest die neueste vollständige Dev-Version und schreibt `website/public/updater/dev.json`; ein frischer Dev-Build stößt den Website-Deploy an. Wenn die neueste Version unvollständig ist oder der API-Aufruf fehlschlägt, bleibt die vorherige `dev.json` erhalten.

`channel.py` weigert sich, einen Kanal rückwärts zu bewegen, und versteht die Reihenfolge von `-rc.<n>`.

## In der App

- **Einstellungen → Allgemein → Updates** enthält die Kanalauswahl, die aktuelle Version, **Nach Updates suchen**, den Zeitpunkt der letzten Prüfung und das Ergebnis.
- Die Auswahl zur Laufzeit liegt in `desktop/src-tauri/src/updater.rs`; die Webview-Seite ist `desktop/src/providers/updater.tsx`.
- `desktop/src-tauri/src/updater.rs` fragt `updater/<channel>.json` direkt ab. Ein `404` oder `410` bedeutet, dass der Kanal nie veröffentlicht wurde; jeder andere Fehler ist ein echter Fehler.
- Der statische Endpunkt des Tauri-Plugins in `tauri.conf.json` ist der Fallback, den das Plugin selbst kennt; die Kanalwahl erfolgt im App-Code.

## Grenzen

- Der Updater bewegt sich nur vorwärts. Ein schlechter Build wird behoben, indem ein neuerer ausgeliefert wird.
- Eine Release- oder Beta-Installation, die Dev wählt, sieht „Auf dem neuesten Stand“: Jeder Dev-Build sortiert unter der bereits laufenden Version. Der Wechsel auf die Dev-Linie erfordert eine manuelle Installation eines Dev-Builds; danach aktualisiert der Dev-Kanal sie vorwärts.
- Eine Beta-Installation wechselt zum finalen Release, indem sie auf Release umstellt, wo `X.Y.Z` über seinen Kandidaten sortiert.
- Vor den Kanaldateien gebaute Apps (die Upstream-3.x-Linie) lesen weiterhin das GitHub-Release, das als „latest“ markiert ist. `gh release edit --latest` ist das, was an sie ausgeliefert wird, zuletzt ausgeführt.

Siehe [Einen Release veröffentlichen](../how-to/publish-a-release.md) und [Einen Dev-Build erstellen](../how-to/cut-a-dev-build.md) für die Abläufe sowie [die Erklärung](../explanation/update-channels.md) dafür, warum die Linien und Suffixe so gestaltet sind.
