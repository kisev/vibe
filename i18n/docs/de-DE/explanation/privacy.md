<!-- source: 2459ffcb4329 -->

# Datenschutz und Offline-Design

Vibe ist so gebaut, dass der normale Transkriptionsweg kein Konto und keinen Cloud-Dienst benötigt. Die App startet einen lokalen Server, der Server lädt ein Modell von der Festplatte, und das Audio wird auf demselben Rechner dekodiert und transkribiert.

## Was lokal bleibt

- Audiodateien, Aufnahmen, Exporte und Transkripte.
- Die Modelle und ffmpeg-Binärdateien.
- Der Projektverlauf im Projektordner.
- Die lokale HTTP-API zwischen Desktop-App und `vibe-server`, gebunden an Loopback.

Die App sendet keine Telemetrie. **Problem melden** erstellt aus lokalen Diagnosedaten ein vorausgefülltes Issue und öffnet GitHub; nichts wird übermittelt, bevor Sie es prüfen und senden.

## Wo das Netzwerk genutzt wird

| Funktion | Netzwerkkontakt |
| --- | --- |
| Modell-Download | Der Host, der die Modelldatei bereitstellt |
| Von einem Link transkribieren | Der Medien-Host und GitHub für die yt-dlp-Binärdatei |
| Update-Prüfung | Die Kanaldatei der Website |
| KI-Zusammenfassung mit Claude oder OpenAI | Der konfigurierte Anbieter |
| KI-Zusammenfassung mit Ollama | Die Ollama-URL, standardmäßig lokal |
| Telefon-Übergabe | Ein Ende-zu-Ende-verschlüsselter Relay zwischen dem Telefon und diesem Computer |

Die Transkriptions-Engine selbst hat keinen Netzwerkpfad.

## Übergabe vom Telefon

Telefon und Desktop verbinden sich über iroh. Der Relay transportiert Ende-zu-Ende-verschlüsselten Verkehr, sodass er Bytes weiterleitet, die er nicht lesen kann; die Transkription findet weiterhin auf diesem Computer statt, und Vibe muss für die Übergabe geöffnet bleiben.

## Kompromisse

- Lokale Modelle kosten Speicherplatz und nutzen CPU oder GPU des Rechners. [Engine- und GPU-Auswahl](/vibe/docs#engine) erklärt die Aufteilung.
- Eine Cloud-Zusammenfassung sendet den Transkripttext an den gewählten Anbieter. Lassen Sie die Plattform auf Ollama, um ihn lokal zu halten.
- Updates werden aus statischen Dateien auf der Website geprüft, was verrät, dass die App einen Kanal geprüft hat, nicht was sie transkribiert hat.

## Verwandte Seiten

- [Einstellungen und Konfiguration](/vibe/docs#settings) für die lokale Konfigurationsdatei.
- [Vom Telefon transkribieren](/vibe/docs#transcribe-from-a-phone) für die Schritte zur Übergabe.
- [Transkript zusammenfassen](/vibe/docs#summarize-transcripts) für die KI-Plattformen.
