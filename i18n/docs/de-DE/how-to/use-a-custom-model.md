<!-- source: aa8415261690 -->

# Eigenes Modell importieren

Vibe führt GGUF-Modelle über die mitgelieferte Engine aus. Der Katalog unter **Einstellungen → Modelle** deckt die getesteten Familien ab; diese Anleitung fügt eines hinzu, das der Katalog nicht listet. [Modelle](/vibe/docs#models) ist die Referenz dafür, was jede Familie unterstützt.

## Von einer URL herunterladen

1. Öffnen Sie **Einstellungen → Modelle**.
1. Fügen Sie einen direkten Modell-Link in **Modell herunterladen** ein und bestätigen Sie.
1. Warten Sie, bis der Download abgeschlossen ist; die Datei landet im Modellordner.
1. Wählen Sie das neue Modell in der Modellliste aus.

Vibe akzeptiert dieselbe Anfrage auch als Deep-Link:

```text
vibe://download/?url=https://example.com/model.gguf
```

Eine eingefügte URL enthält weder Größe noch Prüfsumme, daher prüft Vibe die heruntergeladenen Bytes und den GGUF/BIN-Header, bevor die Datei akzeptiert wird. Die Katalogeinträge in [Modelle](/vibe/docs#models) tragen eine feste Revision, Größe und SHA-256.

## Eine Datei auf dem Datenträger verwenden

1. Legen Sie die `.gguf`-Datei in den Modellordner. Der Ordnerpfad steht unter **Einstellungen → Modelle → Modellordner**, was ihn auch öffnet.
1. Kehren Sie zu **Einstellungen → Modelle** zurück; die Datei erscheint in der Liste der installierten Modelle.
1. Wählen Sie sie aus.

Verschieben oder benennen Sie den Ordner nur über **Modellordner ändern** um und wählen Sie das Modell anschließend erneut aus.

## Wenn ein Modell nicht lädt

- Die Datei muss GGUF sein oder der alte `.bin`-Container, den die Engine akzeptiert.
- Ein Modell, das ein neueres transcribe.cpp als das mitgelieferte erfordert, ist im Katalog gelistet, kann aber noch nicht laden.
- Ein Modell mit fester Sprache lehnt eine andere Sprache ab; die Fehlermeldung nennt die unterstützte.

## Nächste Schritte

- [Modelle](/vibe/docs#models) für den getesteten Katalog und die Grenzen pro Familie.
- [Befehlszeile](/vibe/docs#cli), um ein Modell ohne Fenster auszuführen.
