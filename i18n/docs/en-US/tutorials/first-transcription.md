# Transcribe your first recording

This tutorial transcribes one media file with the default model. It assumes Vibe is installed and the default model has downloaded; [Install Vibe](/vibe/docs#install) covers that.

## Add a file

1. Open Vibe.
1. Drop an audio or video file on the drop area, or choose **File** and pick one.
1. Wait for the file to appear in the queue.

Vibe accepts the formats in [Supported formats](/vibe/docs#formats). It normalizes the media with ffmpeg before transcription, so an uncommon container may still work.

## Start the transcription

1. Leave the language on automatic, or pick a language when detection gets it wrong.
1. Press **Transcribe**.
1. Watch the live preview. **Cancel** stops the run without deleting the recording.

The desktop app starts `vibe-server` in the background and sends the audio to it over local HTTP. The server loads the selected model, transcribes, and returns segments with timestamps.

## Read the result

The transcript opens when the run finishes. Every line can be edited in place, and the change is saved with the project.

To label speakers, enable **Recognize speakers** under **More options** before the run. Diarization uses the Nemotron-3 model and labels up to 8 speakers.

## Export

Open the export dialog and choose a format: TXT, Markdown, SRT, VTT, HTML, JSON, CSV, DOCX, or PDF. [Supported formats](/vibe/docs#formats) explains what each one carries.

## Next steps

- [Record microphone and system audio](/vibe/docs#record-audio) when the audio is a live call rather than a file.
- [Models](/vibe/docs#models) when you need another language, speed, or accuracy.
- [Command line](/vibe/docs#cli) to run the same engine without the window.
