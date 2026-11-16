<!-- source: 6fd793aea9b2 -->

# Engine- und GPU-Auswahl

Vibe trennt die Desktop-Shell von der Transkriptions-Engine. Die Shell ist eine Tauri-App in Rust und React; die Engine ist `vibe-server`, ein Rust-Prozess, der die C++-Bibliothek transcribe.cpp auf ggml aufruft.

## Warum die Engine ein eigener Prozess ist

Der Server übernimmt das Laden der Modelle und die schwere Rechenarbeit. Ihn außerhalb des Desktop-Prozesses zu halten bedeutet:

- das Fenster kann neu starten, ohne ein mehrere Gigabyte großes Modell neu zu laden;
- dieselbe Binärdatei dient der App, der Befehlszeile und der lokalen HTTP-API;
- ein Absturz der Engine reißt das Fenster nicht mit;
- die Engine kann nach ihrem eigenen Zeitplan aktualisiert werden, festgelegt durch den App-Build.

Die Desktop-App spricht über lokales HTTP mit dem Server. Nichts auf diesem Weg verlässt den Rechner; [Datenschutz und Offline-Design](/vibe/docs#privacy) behandelt die Netzwerkoberfläche.

## Eine Engine, viele Modellfamilien

Jede unterstützte Familie läuft über denselben ggml-Build: Whisper, Parakeet, Nemotron, Canary, Qwen3-ASR, Voxtral und GigaAM. Silero VAD und Nemotron-3-Diarisierung laufen ebenfalls auf diesem Stack. Eine Engine hält Speicherverwaltung, Quantisierung und GPU-Dispatch für jedes Modell gleich.

Der Kompromiss ist die Versionskopplung: Ein Modell, dessen GGUF ein neueres transcribe.cpp als der mitgelieferte Build erfordert, ist in [Modelle](/vibe/docs#models) gelistet, kann aber erst laden, wenn die Engine nachzieht. Diese Festlegung ist Absicht, denn Engine-Upgrades sind Paritätsereignisse, keine Hintergrund-Abhängigkeitsupdates.

## GPU-Backends

ggml wählt ein Backend für den Rechner, auf dem es läuft:

| Plattform | Backend |
| --- | --- |
| macOS | Metal |
| Windows | Vulkan |
| Linux | Vulkan |

Ein Rechner ohne nutzbare GPU läuft auf der CPU. **Einstellungen → Modelle** enthält **Auf der CPU transkribieren** und unter Windows und Linux eine GPU-Geräteauswahl. Wenn das Laden auf der GPU fehlschlägt, versucht es die App erneut auf der CPU und meldet das.

Die GPU zählt vor allem bei großen Modellen und langen Dateien. Kleine Modelle können auf einer modernen CPU schnell genug sein, und der CPU-Pfad ist der Rückfall, wenn ein Treiber oder der Vulkan-Loader fehlt.

## Verwandte Seiten

- [Modelle](/vibe/docs#models) für den Katalog und die Grenzen pro Familie.
- [Befehlszeile](/vibe/docs#cli) für `vibe-server`-Optionen wie `--gpu-device`.
- [Datenschutz und Offline-Design](/vibe/docs#privacy) dafür, was auf dem Rechner bleibt.
