# Import a custom model

Vibe runs GGUF models through the bundled engine. The catalog in **Settings → Models** covers the tested families; this guide adds one the catalog does not list. [Models](/vibe/docs#models) is the reference for what each family supports.

## Download from a URL

1. Open **Settings → Models**.
1. Paste a direct model link into **Download model** and confirm.
1. Wait for the download to finish; the file lands in the models folder.
1. Select the new model in the model list.

Vibe also accepts the same request as a deep link:

```text
vibe://download/?url=https://example.com/model.gguf
```

A pasted URL carries no size or checksum, so Vibe checks the downloaded bytes and the GGUF/BIN header before accepting the file. The catalog entries in [Models](/vibe/docs#models) carry a pinned revision, size, and SHA-256.

## Use a file on disk

1. Put the `.gguf` file in the models folder. The folder path is in **Settings → Models → Models Folder**, which also opens it.
1. Return to **Settings → Models**; the file appears in the installed list.
1. Select it.

Move or rename the folder only through **Change Models Folder**, then select the model again.

## When a model will not load

- The file must be GGUF or the legacy `.bin` container the engine accepts.
- A model requiring a newer transcribe.cpp than the bundled one is listed in the catalog but cannot load yet.
- A model with a fixed language rejects another language; the error names the supported one.

## Next steps

- [Models](/vibe/docs#models) for the tested catalog and per-family limits.
- [Command line](/vibe/docs#cli) to run a model without the window.
