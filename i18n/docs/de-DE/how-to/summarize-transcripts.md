<!-- source: f5e20b838770 -->

# Transkript zusammenfassen

Vibe kann aus einem fertigen Transkript eine Zusammenfassung, Notizen oder eine Übersetzung machen. Die Anfrage geht an die konfigurierte KI-Plattform: ein lokales Ollama-Modell, Claude oder einen beliebigen OpenAI-kompatiblen Endpunkt. [Einstellungen und Konfiguration](/vibe/docs#settings) listet, wo die Verbindung gespeichert ist.

## Ein lokales Ollama-Modell verwenden

1. Installieren Sie [Ollama](https://ollama.com) und laden Sie ein Modell, zum Beispiel `ollama pull llama3.1`.
1. Öffnen Sie **Einstellungen → KI**.
1. Setzen Sie **Plattform** auf **Ollama**. Die Standard-URL ist `http://localhost:11434`.
1. Wählen Sie den Modellnamen.
1. Aktivieren Sie **Zusammenfassungen** und optional **Neue Transkripte automatisch zusammenfassen**.

Ollama läuft auf diesem Rechner, daher bleibt das Transkript lokal.

## Claude oder einen OpenAI-kompatiblen Endpunkt verwenden

1. Öffnen Sie **Einstellungen → KI** und wählen Sie die Plattform.
1. Fügen Sie den API-Schlüssel ein und ändern Sie die Basis-URL, wenn der Endpunkt nicht der Standard ist.
1. Wählen Sie das Modell.
1. Aktivieren Sie **Zusammenfassungen**.

Bei einem Nicht-Standard-Endpunkt sind Basis-URL und Schlüssel die Verbindung, die die App für Zusammenfassungen und Diktat verwendet.

## Zusammenfassen

1. Schließen Sie eine Transkription ab.
1. Öffnen Sie die Zusammenfassungsaktion in der Transkriptansicht.
1. Wählen Sie eine Voreinstellung und bearbeiten Sie bei Bedarf den Prompt.
1. Führen Sie sie aus; das Ergebnis wird mit dem Projekt gespeichert und kann neben dem Transkript exportiert werden.

Wenn **Neue Transkripte automatisch zusammenfassen** aktiviert ist, läuft die Zusammenfassung, sobald eine Transkription abgeschlossen ist.

## Nächste Schritte

- [Einstellungen und Konfiguration](/vibe/docs#settings) für die Konfigurationsdatei und die Einstellungsbereiche.
- [Datenschutz und Offline-Design](/vibe/docs#privacy) dafür, welche Plattformen den Text auf dem Rechner lassen.
