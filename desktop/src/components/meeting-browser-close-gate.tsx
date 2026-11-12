// The meeting window asks the main window before closing while a recording runs: the
// window itself has no React surface to render a dialog on.
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { ask } from '@tauri-apps/plugin-dialog'
import { m } from '~/paraglide/messages.js'
import { confirmMeetingBrowserClose } from '~/lib/meeting-browser'

export default function MeetingBrowserCloseGate() {
	useEffect(() => {
		let unlisten: (() => void) | undefined
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
		}).then((fn) => {
			unlisten = fn
		})
		return () => {
			unlisten?.()
		}
	}, [])
	return null
}
