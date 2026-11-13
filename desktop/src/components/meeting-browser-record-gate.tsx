// The bar cannot start a recording itself without booting the recorder's device handling, so
// it asks the main window — the window that already owns the recorder — through an event.
import { useEffect, useRef } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import {
	RECORDING_STATE_EVENT,
	RECORDING_STATE_REQUEST_EVENT,
	RECORDING_TOGGLE_EVENT,
	type RecordingStatePayload,
} from '~/lib/meeting-browser'
import { useRecording } from '~/pages/home/hooks/use-recording'

export default function MeetingBrowserRecordGate() {
	const recording = useRecording(() => {})
	const latest = useRef(recording)
	latest.current = recording
	// The chrome shows a timer, so the state event carries when this recording actually began.
	const startedAt = useRef<number | null>(null)

	function currentState(): RecordingStatePayload {
		const active = latest.current.isRecording
		if (active) startedAt.current ??= Date.now()
		else startedAt.current = null
		return { recording: active, startedAt: startedAt.current }
	}

	useEffect(() => {
		void recording.refreshDevices()
	}, [])

	// `stopRecord` only asks the recorder to stop; the recorder answers with `record_finish`,
	// and without listening for it this gate kept reporting "recording" forever.
	useEffect(() => {
		const unlisten = listen('record_finish', () => {
			latest.current.setIsRecording(false)
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	useEffect(() => {
		const unlisten = listen<{ stop: boolean }>(RECORDING_TOGGLE_EVENT, async (event) => {
			const current = latest.current
			try {
				if (event.payload.stop) await current.stopRecord()
				else {
					await current.refreshDevices()
					await current.startRecord()
				}
			} catch (error) {
				console.error('meeting bar recording toggle failed:', error)
			}
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	useEffect(() => {
		void emit(RECORDING_STATE_EVENT, currentState())
	}, [recording.isRecording])

	// A chrome can open while a recording already runs; answer its request instead of leaving it
	// on a stale "Record" button until the next state flip.
	useEffect(() => {
		const unlisten = listen(RECORDING_STATE_REQUEST_EVENT, () => {
			void emit(RECORDING_STATE_EVENT, currentState())
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	return null
}
