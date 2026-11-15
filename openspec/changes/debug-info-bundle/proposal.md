# Proposal

## Why

There is no telemetry, by design. That leaves a person who hits a bug with nothing to hand over but a description: the log lives in a folder nobody knows, the settings that matter are scattered, and the versions that decide whether a report is actionable have to be asked for. The maintainer ends up debugging from memory of a conversation.

The diagnostics surface can already open a pre-filled issue. What it cannot do is produce the evidence that issue should carry.

## What Changes

- The app gains one action: prepare a debug bundle. It collects the current log, the settings with secrets removed, the app build, the server build, the platform and the model catalog digest into a single archive, and reveals it in the file manager.
- What goes into it is listed before it is written, so nobody has to guess what they are about to attach to a public issue. Anything that could carry a secret — API keys, pairing tokens, full file paths of the person's own media — is redacted or omitted.
- The bundle never leaves the machine on its own. The person attaches it to a GitHub issue, where the diagnostics link already points.

## Capabilities

- `diagnostics` (new): what the app offers a person who needs to report a problem, and what it refuses to collect.

## Impact

- The diagnostics module, the settings surface that offers the action, the log and config readers it uses, and the docs for reporting a problem.

## Non-Goals

- Sending anything automatically, including to the maintainer.
- Crash reporting, sampling or usage statistics of any kind.
- A support portal: the issue tracker is where reports live.
