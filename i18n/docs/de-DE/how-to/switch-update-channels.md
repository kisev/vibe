<!-- source: bc1a1519974a -->

# Update-Kanäle wechseln

Vibe prüft einen von drei Update-Kanälen: Release, Beta oder Dev. Der Kanal entscheidet, welche Builds die App anbietet, und er bewegt sich nur vorwärts.

## Einen Kanal wählen

1. Öffnen Sie **Einstellungen → Allgemein → Updates**.
1. Wählen Sie **Release**, **Beta** oder **Dev**.
1. Drücken Sie **Nach Updates suchen**.

Derselbe Bereich zeigt die installierte Version, den Zeitpunkt der letzten Prüfung und das Ergebnis. Die Prüfung läuft auch beim Start.

## Was jeder Kanal enthält

| Kanal | Builds |
| --- | --- |
| Release | Stabile Versionen |
| Beta | Release Candidates für die nächste stabile Version |
| Dev | Die neuesten `dev`-Builds |

Eine Release- oder Beta-Installation, die Dev wählt, sieht **Auf dem neuesten Stand**: Jeder Dev-Build sortiert unter der bereits laufenden Version. Der Wechsel auf die Dev-Linie erfordert eine manuelle Installation eines Dev-Builds; danach aktualisiert der Dev-Kanal sie vorwärts.

Eine Beta-Installation wechselt zum finalen Release, indem sie auf Release umstellt, wo die stabile Version über ihren Kandidaten sortiert.

## Nächste Schritte

- [Update-Kanäle](/vibe/docs#update-channels) für die Kanaldateien und Tag-Regeln.
- [Warum Update-Kanäle so funktionieren](/vibe/docs#update-channels-design) für die Versionssortierung.
