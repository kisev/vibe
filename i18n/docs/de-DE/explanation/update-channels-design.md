<!-- source: dc7efd39c01b -->

# Warum Update-Kanäle so funktionieren

GitHub hat ein einziges „Latest Release“. Vibe braucht drei Linien — Release, Beta und Dev —, zwischen denen ein Nutzer wechseln kann, auch aus einer älteren Installation. Diese Diskrepanz prägt das Kanalkonzept.

## Warum die Website und nicht GitHub

Die App liest `updater/<channel>.json` von der Website. Jede Datei ist die `latest.json`, die ein Release-Build erzeugt hat, neben die anderen kopiert:

- Release → `stable.json`
- Beta → `beta.json`
- Dev → `dev.json`

Eine Kanaldatei ist ein statisches Asset, das mit der Website ausgeliefert wird, sodass eine Linie auf einen Build zu zeigen ein Commit ist, keine Release-Bearbeitung. Außerdem kann ein fehlender Kanal etwas Präzises bedeuten: ein `404` oder `410` heißt „nichts auf dieser Linie“, was die App als auf dem neuesten Stand meldet. Würde die App bei einer fehlenden Datei auf einen anderen Kanal zurückfallen, würde ein Beta-Nutzer ohne Kandidat stillschweigend zu Release verschoben.

## Warum das Beta-Suffix `-rc.<n>` ist

Semver sortiert:

```text
X.Y.Z-dev.N < X.Y.Z-rc.N < X.Y.Z
```

Diese Reihenfolge ist der ganze Grund für die Schreibweise. Mit dem strikten Vergleich des Updaters bewegt sich Dev → Beta → Release immer vorwärts; eine Sonderfall-Ausnahme ist nicht nötig.

Eine frühere Linie verwendete `-beta.N`, hatte aber keinen Dev-Kanal. `X.Y.Z-beta.N` sortiert über `X.Y.Z-dev.N`, sodass ein Beta-Build neuer als jeder Dev-Build wirken und den Wechsel brechen würde. Der Beta-Kanal behält seinen Namen; nur das Versionssuffix ist `-rc.<n>`.

## Warum Beta nur Kandidaten enthält

Nur eine Version `X.Y.Z-rc.<n>` wird in `beta.json` geschrieben; ein einfaches Release wird abgelehnt. Das hält die Beta-Linie aussagekräftig: Sie ist die Kandidatenlinie, keine zweite stabile Linie. Nach einem stabilen Release wechselt eine Beta-Installation zum finalen Release, indem sie ihren Kanal auf Release umstellt, wo `X.Y.Z` über seinen Kandidaten sortiert.

## Nur vorwärts gerichtete Updates

Der Updater bewegt sich nur vorwärts. Ein schlechtes Release wird behoben, indem ein neueres ausgeliefert wird, wofür die Beta-Linie da ist: Es abfangen, bevor Release es bekommt. Deshalb sieht eine Release- oder Beta-Installation, die Dev wählt, auch „Auf dem neuesten Stand“: Jeder Dev-Build sortiert unter der bereits laufenden Version. Der Wechsel auf die Dev-Linie erfordert eine manuelle Installation eines Dev-Builds; danach aktualisiert der Dev-Kanal sie vorwärts.

## Kompromisse

- **Kopierte Manifeste** bedeuten, dass eine Kanaländerung ein Commit auf `main` plus ein Website-Deploy ist, kein API-Aufruf. Die Verzögerung beträgt Minuten, und der Verlauf ist nachprüfbar.
- **Kein Rückfall zwischen Kanälen** bedeutet, dass ein Nutzer ein korrektes „Auf dem neuesten Stand“ sieht statt eines überraschenden Downgrades oder Sprungs zwischen Linien.
- **Dev erfordert eine manuelle Installation** ist der Preis dafür, die Semver-Sortierung ehrlich zu halten. Eine Automatisierung bräuchte ein Kanalkonzept, das die alten Clients nicht haben.

## Verwandte Seiten

- [Update-Kanäle](/vibe/docs#update-channels) für die Dateien und Versionsregeln.
- [Update-Kanäle wechseln](/vibe/docs#switch-update-channels) für die Schritte.
