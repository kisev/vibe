// The meeting window asks the main window for the two decisions it cannot present itself:
// whether to stop a recording before closing, and what to do with a page that never loaded.
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { ask } from '@tauri-apps/plugin-dialog'
import { m } from '~/paraglide/messages.js'
import { closeMeetingBrowser, confirmMeetingBrowserClose, retryMeetingBrowser } from '~/lib/meeting-browser'

export default function MeetingBrowserCloseGate() {
	useEffect(() => {
		const unlisteners: (() => void)[] = []

		listen<{ session: number }>('meeting-browser-close-requested', async (event) => {
			// OK stops the recording and closes; cancel keeps it running while the window goes.
			const stopAndClose = await ask(m.meetingBrowserCloseQuestion(), {
				title: m.meetingBrowserCloseTitle(),
				kind: 'warning',
				okLabel: m.meetingBrowserStopAndClose(),
				cancelLabel: m.meetingBrowserKeepRecording(),
			})
			try {
				await confirmMeetingBrowserClose(event.payload.session, stopAndClose)
			} catch (error) {
				console.error('could not close the meeting browser:', error)
			}
		}).then((fn) => unlisteners.push(fn))

		listen<{ session: number }>('meeting-browser-load-failed', async (event) => {
			// OK retries the page, cancel closes the window instead of leaving a blank surface.
			const retry = await ask(m.meetingBrowserLoadFailedBody(), {
				title: m.meetingBrowserLoadFailedTitle(),
				kind: 'error',
				okLabel: m.meetingBrowserRetry(),
				cancelLabel: m.meetingBarClose(),
			})
			try {
				await (retry ? retryMeetingBrowser(event.payload.session) : closeMeetingBrowser(event.payload.session))
			} catch (error) {
				console.error('could not recover the meeting browser:', error)
			}
		}).then((fn) => unlisteners.push(fn))

		return () => {
			unlisteners.forEach((unlisten) => unlisten())
		}
	}, [])
	return null
}
