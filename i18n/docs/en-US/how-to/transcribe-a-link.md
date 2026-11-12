# Transcribe from a link

Vibe downloads the audio behind a media URL with yt-dlp and transcribes the result. The supported sites are the ones yt-dlp supports; when a site stops working, an updated yt-dlp usually fixes it.

## Send the link

1. Open Vibe and choose **From link**.
1. Paste one URL, or paste several separated by whitespace to queue them all.
1. Press **Transcribe**.

Vibe asks to install yt-dlp the first time a link is used, and to update it when a site fails. The downloaded audio is temporary; the transcript is saved like any other project.

## What to expect

- A single link starts as soon as the download finishes.
- A queue runs one link at a time and shows progress per item.
- Weights, models, and the transcript stay local. The download itself contacts the media host and GitHub for yt-dlp.

## Next steps

- [Supported formats](/vibe/docs#formats) for local files and export choices.
- [Models](/vibe/docs#models) when the audio needs a different language or accuracy.
