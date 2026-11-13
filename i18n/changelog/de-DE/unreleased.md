---
version: unreleased
date: 
title: "Was kommt als Nächstes"
source: 4462099ac37f
---

## New

- 🧪 **Modellvergleich, Seite an Seite** — Einstellungen → Modelle lässt einen Ausschnitt oder eine Datei durch jedes ausgewählte installierte Modell laufen und öffnet die Ergebnisse im Vollfenster: eine Spalte pro Modell mit Laufzeit und Wortanzahl, unabhängiges Scrollen, eine Referenzauswahl und Hervorhebung auf Wortebene, die fehlende Wörter durchstreicht und zusätzliche markiert
- 🗣️ **Sprechertrennung im Vergleich** — ein Schalter ergänzt Sprecherbezeichnungen in jedem Modelltranskript, sodass derselbe Lauf zeigt, welches Modell die Wörter gehört hat und wer sie gesagt hat
- 🔄 **Drei Update-Kanäle** — folgen Sie Release, Beta oder Dev, sehen Sie die aktuelle Version und wann zuletzt geprüft wurde, und starten Sie eine Prüfung selbst mit einer Schaltfläche, statt auf den nächsten Start zu warten
- 🗺️ **Die Website hat einen Fahrplan** — eine neue Seite listet jede nicht archivierte Änderung direkt aus den Planungsdateien des Projekts, sodass das, was als Nächstes kommt, nie eine handgeschriebene Vermutung ist
- 🌐 **Besprechungen öffnen in Vibe** — Besprechungslinks öffnen in einem integrierten Browser mit eigenem Menü (Zurück, Vorwärts, Neu laden, im Systembrowser öffnen, Schließen) und einer bearbeitbaren Liste der Besprechungs-Hosts; Vibe kann sich auf Anfrage als Handler für Zoom-, Teams- und Webex-Links registrieren, und ein erkanntes Gespräch fordert Sie auf, es mit Ihrem Mikrofon und Systemaudio aufzunehmen
- 🌍 **Die Website spricht Ihre Sprache** — eine Sprachauswahl in der Kopfzeile wechselt die Seite an Ort und Stelle, behält `?lang=` in der URL, damit geteilte Links die Auswahl mitbringen, und wendet ein Rechts-nach-links-Layout an. `/changelog/dev` ist jetzt die dauerhafte Adresse für die Dev-Notizen

## Improved

- 🧭 **Dev-Updates haben ihre eigene Linie** — Dev-Builds erscheinen als `-dev.N`-Vorabversionen im Dev-Kanal, für Beta werden Release Candidates erstellt, und das Dev-Änderungsprotokoll behält eine stabile URL, während Builds kommen und gehen
- 🏷️ **Vergleiche benennen Modelle korrekt** — Ergebnisse und Dialoge verwenden den kanonischen Modellnamen und die Quantisierungs-Schreibweise des Katalogs, statt einen Dateinamen in Titelform zu setzen
- 🤫 **Die Besprechungserkennung bleibt unaufdringlich** — Vibes eigenes Besprechungsfenster unterdrückt die externe Erkennungsabfrage, und der Aufnahmestatus wird geteilt, sodass ein bereits in Vibe geöffnetes Gespräch nie ein zweites Mal eine Aufnahme anbietet
- 🕵️ **Nichts verlässt Ihr Gerät** — sämtliche Telemetrie ist entfernt: kein Analyse-Schlüssel, kein Ping beim Start oder bei einer Aktion und keine Spendenbanner auf der Website. Protokolle, Diagnosen und Exporte bleiben auf der Festplatte und verlassen sie nur, wenn Sie sie selbst senden
- 📚 **Die Dokumentation folgt Diátaxis** — Tutorials, praktische Anleitungen, Referenz und Erklärung sind getrennt, im Repository und auf der Website, sodass „Wie mache ich …“ und „Was bedeutet das“ nicht mehr eine lange Seite teilen
- 🔗 **Versionshinweise zeigen auf das übersetzte Änderungsprotokoll** — jeder Release-Text verlinkt auf `https://kisev.github.io/vibe/changelog/<version>`, sodass Leser ihre eigene Sprache wählen statt Englisch

## Fixed

- 🎙️ **Jedes Modell kann den Vergleich ausführen** — GigaAM und Parakeet verweigern einen Lauf nicht mehr wegen eines fehlenden VAD-Modells; das Labor stellt seinen mitgelieferten Detektor bereit, sodass sich die Ergebnisse nur durch das Modell unterscheiden
- 📍 **Der Vergleich steht an erster Stelle** — das Labor steht jetzt über dem langen Modellkatalog unter Einstellungen → Modelle, sodass es das Erste ist, was Sie sehen
- 🔍 **Lange Transkripte werden weiterhin hervorgehoben** — der Diff gibt nicht mehr oberhalb von tausend Wörtern auf und meldet null Unterschiede; ist ein Text wirklich zu lang, sagt die Spalte das stattdessen
- 🔁 **Update-Kanäle behalten ihre Namen und ihre Linie** — die Auswahl zeigt Release, Beta und Dev in jeder Sprache, und Beta bietet nur Release Candidates statt den stabilen Build zu spiegeln
- 🔌 **Der API-Server-Schalter bleibt aus** — der Agenten-Schalter ist Ihre Entscheidung und übersteht einen Neustart; das Lesen von Modell-Metadaten beim Start lässt keinen Server mehr dahinter laufen
- 🪟 **Das Besprechungsfenster lässt sich schließen** — seine Bedienelemente liegen im Fenster selbst, sodass eine Seite, die nicht lädt, kein Fenster ohne Ausweg mehr hinterlässt
- 🌍 **Die Website übersetzt die ganze Seite** — der Sprachwechsel lässt keine englischen Abschnitte mehr zurück, und auch das Änderungsprotokoll folgt der gewählten Sprache
