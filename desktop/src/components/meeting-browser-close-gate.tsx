// The meeting window asks the main window for the two decisions it cannot present itself:
// whether to stop a recording before closing, and what to do with a page that never loaded.
import { useEffect, useRef } from 'react'
import { listen } from '@tauri-apps/api/event'
import { ask } from '@tauri-apps/plugin-dialog'
import { m } from '~/paraglide/messages.js'
import { closeMeetingBrowser, confirmMeetingBrowserClose, retryMeetingBrowser } from '~/lib/meeting-browser'

export default function MeetingBrowserCloseGate() {
	// Rust holds the window in `prevent_close` until this gate answers. A second click while the
	// dialog is open must not open a second one or send the confirmation twice.
	const closePending = useRef(false)
	// The same guard for the load failure: two sessions failing (or the next one failing while the
	// dialog is still up) must not stack dialogs whose answers contradict each other.
	const loadPending = useRef(false)

	useEffect(() => {
		let disposed = false
		const unlisteners: (() => void)[] = []
		// `listen` resolves asynchronously; an unmount before it does must still unsubscribe.
		const track = (pending: Promise<() => void>) => pending.then((unlisten) => (disposed ? unlisten() : unlisteners.push(unlisten)))

		track(
			listen<{ session: number }>('meeting-browser-close-requested', async (event) => {
				if (closePending.current) return
				closePending.current = true
				try {
					// OK stops the recording and closes; cancel keeps it running while the window goes.
					const stopAndClose = await ask(m.meetingBrowserCloseQuestion(), {
						title: m.meetingBrowserCloseTitle(),
						kind: 'warning',
						okLabel: m.meetingBrowserStopAndClose(),
						cancelLabel: m.meetingBrowserKeepRecording(),
					})
					await confirmMeetingBrowserClose(event.payload.session, stopAndClose)
				} catch (error) {
					console.error('could not close the meeting browser:', error)
					// Rust holds the window in `prevent_close`: an unanswered request leaves it stuck
					// with no way out, so keep the recording running and close it best-effort instead.
					await confirmMeetingBrowserClose(event.payload.session, false).catch(() => undefined)
				} finally {
					closePending.current = false
				}
			}),
		)

		track(
			listen<{ session: number }>('meeting-browser-load-failed', async (event) => {
				if (loadPending.current) return
				loadPending.current = true
				try {
					// OK retries the page, cancel closes the window instead of leaving a blank surface.
					const retry = await ask(m.meetingBrowserLoadFailedBody(), {
						title: m.meetingBrowserLoadFailedTitle(),
						kind: 'error',
						okLabel: m.meetingBrowserRetry(),
						cancelLabel: m.meetingBarClose(),
					})
					await (retry ? retryMeetingBrowser(event.payload.session) : closeMeetingBrowser(event.payload.session))
				} catch (error) {
					console.error('could not recover the meeting browser:', error)
				} finally {
					loadPending.current = false
				}
			}),
		)

		return () => {
			disposed = true
			unlisteners.forEach((unlisten) => unlisten())
		}
	}, [])
	return null
}
