// The bar cannot start a recording itself without booting the recorder's device handling, so
// it asks the main window — the window that already owns the recorder — through an event.
import { useEffect, useRef } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import {
	isRecordingActive,
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

	function localState(): RecordingStatePayload {
		const active = latest.current.isRecording
		if (active) startedAt.current ??= Date.now()
		else startedAt.current = null
		return { recording: active, startedAt: startedAt.current }
	}

	/**
	 * The recorder is shared with the main window and the recording shortcut: this hook's own flag
	 * only knows the runs it started. Rust owns the real state, so a chrome opening mid-recording
	 * asks it instead of being told "not recording" and offering a second start.
	 */
	async function reportedState(): Promise<RecordingStatePayload> {
		const active = await isRecordingActive()
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
					if (await isRecordingActive()) {
						// Already running elsewhere: report it rather than opening a second stream set.
						void emit(RECORDING_STATE_EVENT, await reportedState())
						return
					}
					await current.refreshDevices()
					// Read the hook from the latest render: `current` still carries the device set
					// from before the refresh, so a just-plugged device would miss this run.
					await latest.current.startRecord()
					// A refused start (a missing pinned device, a permission) leaves the chrome on
					// "Record" instead of a stop button for a recording that never began.
					void emit(RECORDING_STATE_EVENT, await reportedState())
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
		void emit(RECORDING_STATE_EVENT, localState())
	}, [recording.isRecording])

	// A chrome can open while a recording already runs; answer its request instead of leaving it
	// on a stale "Record" button until the next state flip.
	useEffect(() => {
		const unlisten = listen(RECORDING_STATE_REQUEST_EVENT, () => {
			void reportedState().then((state) => emit(RECORDING_STATE_EVENT, state))
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	return null
}
