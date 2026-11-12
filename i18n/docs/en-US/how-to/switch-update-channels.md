# Switch update channels

Vibe checks one of three update channels: Release, Beta, or Dev. The channel decides which builds the app offers, and it only ever moves forward.

## Choose a channel

1. Open **Settings → General → Updates**.
1. Pick **Release**, **Beta**, or **Dev**.
1. Press **Check for updates**.

The same section shows the installed version, the last check time, and the result. The check also runs at startup.

## What each channel carries

| Channel | Builds |
| --- | --- |
| Release | Stable versions |
| Beta | Release candidates for the next stable version |
| Dev | The newest `dev` builds |

A Release or Beta install that selects Dev sees **up to date**: every dev build sorts below the version it already runs. Moving to the dev line takes one manual install of a dev build; after that the Dev channel updates it forward.

A Beta install moves to the final release by switching to Release, where the stable version sorts above its candidates.

## Next steps

- [Update channels](/vibe/docs#update-channels) for the channel files and tag rules.
- [Why update channels work this way](/vibe/docs#update-channels-design) for the version ordering.
