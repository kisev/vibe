# Tasks

- [ ] 1. Windows: read capture sessions from the default input device (`IAudioSessionManager2` → `IAudioSessionControl2::GetProcessId`) and return the holding process; keep the consent-store registry as a fallback when no session reports a pid.
- [ ] 2. Linux: read `source-outputs` from PipeWire/PulseAudio and return the holding process (`application.process.binary`, `application.name`), with a test over captured `pactl` output.
- [ ] 3. macOS: use CoreAudio process taps where the OS offers them (14.4+); otherwise report "microphone is live" and attribute by the frontmost application, and expose that the signal is approximate.
- [ ] 4. Turn the service list into data: Zoom, Teams, Telegram, Telemost, Stream desktop clients plus their helper processes, and the browser-title rules already in use; one test per service.
- [ ] 5. Add `recording.meetingPromptDelaySeconds` (default 10, 0–120) to the delay in the detection state machine: onset starts the pause, losing the microphone or the attribution cancels it, re-detection does not stack offers.
- [ ] 6. Settings: describe the option and who it is for, show whether detection runs and the last observation with its time, and add the action that reveals the current log file.
- [ ] 7. Suppression: keep the prompt away while Vibe records, while the embedded browser holds a meeting, and for a call the person dismissed.
- [ ] 8. Docs: the three kinds of users and when each should enable the option; what "approximate" means on older macOS.
- [ ] 9. Acceptance on Windows: Zoom, Teams and Telegram desktop calls each raise the offer after the pause; a browser call is attributed by title; Vibe's own recording raises nothing.
- [ ] 10. Follow-up (separate change): a "prepare a debug bundle" action that packages logs, settings with secrets removed, versions and platform for attaching to a GitHub issue.
