# Supported formats

Vibe accepts audio and video files and exports transcripts in several text formats. The desktop app normalizes media with ffmpeg before transcription; on Linux the system `ffmpeg` is required, while macOS and Windows bundles ship their own.

## Input

| Kind | Extensions |
| --- | --- |
| Audio | `mp3`, `wav`, `aac`, `flac`, `oga`, `ogg`, `opus`, `m4a`, `m4b`, `wma` |
| Video | `mp4`, `mkv`, `avi`, `mov`, `wmv`, `webm`, `mxf` |

A container outside this list may still work if ffmpeg can decode it; convert it first if the app refuses it.

## Desktop export

Open the export dialog on a transcript and pick one of these:

| Format | Contents |
| --- | --- |
| TXT | Plain text without formatting |
| Markdown | Headings and formatted text |
| SRT | Numbered subtitle cues with timestamps |
| VTT | WebVTT subtitles with timestamps |
| HTML | A styled web page |
| JSON | Structured transcript and timing data |
| CSV | Spreadsheet-ready rows |
| DOCX | A formatted Word document |
| PDF | A printable document |

The export options also toggle timestamps and speaker labels where the format supports them. Auto-export can write any of these formats next to the recording, into the projects folder, or into a folder you choose.

## CLI output

`vibe-server transcribe` writes `txt` (default), `markdown` (alias `md`), `json`, `srt`, or `vtt`. `--output` writes a new file and refuses to overwrite an existing path. See [Command line](/vibe/docs#cli).

## Related pages

- [Models](/vibe/docs#models) for the model families and their limits.
- [Transcribe your first recording](/vibe/docs#first-transcription) for the desktop flow.
