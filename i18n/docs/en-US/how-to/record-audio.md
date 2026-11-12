# Record microphone and system audio

Vibe records from the devices you pick and then transcribes the recording. Use this guide for calls, meetings, and audio that is playing rather than saved as a file. [Supported formats](/vibe/docs#formats) covers files.

## Pick the devices

1. Open Vibe and choose **Record**.
1. Under **Microphone**, pick the input device. Vibe remembers the device by name.
1. Under **Speakers**, pick the output device to capture system audio. Choose **None** to record only the microphone.

Recording both devices merges them into one track with ffmpeg, so both sides of a call land in the same transcript.

## Grant permissions on macOS

Open **Settings → Recording → Permissions** and grant what the recording needs:

| Permission | Used for |
| --- | --- |
| Microphone | Microphone audio |
| System audio | Audio playing on the Mac (Screen & System Audio Recording) |

Without system-audio permission macOS opens the loopback stream but records silence, so the recording is not usable.

## Record and transcribe

1. Press **Record**.
1. Use **Stop** when the call ends.
1. The recording opens with a language selector. Choose a language or leave it automatic.
1. Press **Transcribe**.

If **Transcribe recordings automatically** is on in **Settings → Recording**, the last step starts on its own.

## Next steps

- [Summarize a transcript](/vibe/docs#summarize-transcripts) after the recording finishes.
- [Use the meeting browser](/vibe/docs#use-the-meeting-browser) to record a call inside Vibe.
