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

/**
 * A start the recorder refused. Its error modal opens in the main window, which the person in the
 * meeting window never sees, so the chrome shows the failure in its own error line instead.
 */
export const RECORDING_START_FAILED_EVENT = 'meeting-browser-recording-start-failed'

export default function MeetingBrowserRecordGate() {
	const recording = useRecording(() => {})
	const latest = useRef(recording)
	latest.current = recording
	// The chrome shows a timer, so the state event carries when this recording actually began.
	const startedAt = useRef<number | null>(null)
	/** Whether the run in progress was started by this gate: its device set is the one this hook resolved. */
	const ownRun = useRef(false)
	/**
	 * Rust reserves the recorder's slot on the first start. A double click in the chrome must not
	 * deliver a second one: its failed start would drop the keep-awake hold of the live recording.
	 */
	const startPending = useRef(false)

	function localState(): RecordingStatePayload {
		const active = latest.current.isRecording
		if (active) startedAt.current ??= Date.now()
		else startedAt.current = null
		return { recording: active, startedAt: startedAt.current, sources: capturedSources(latest.current), ...recordedDevices(latest.current) }
	}

	function capturedSources(state: ReturnType<typeof useRecording>): ('microphone' | 'system')[] {
		return [...(state.inputDevice ? (['microphone'] as const) : []), ...(state.outputDevice ? (['system'] as const) : [])]
	}

	/**
	 * The devices this run records. Only a run this hook started is known from its own state;
	 * for one started in the main window the fields stay absent so the chrome keeps the shared
	 * config rather than being told "no device" by a hook that never saw the run.
	 */
	function recordedDevices(state: ReturnType<typeof useRecording>): Pick<RecordingStatePayload, 'inputName' | 'outputName'> {
		if (!state.isRecording) return {}
		return { inputName: state.inputDevice?.name ?? null, outputName: state.outputDevice?.name ?? null }
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
		return {
			recording: active,
			startedAt: startedAt.current,
			// Which sources a run captures is known only to the surface that resolved them; a
			// foreign run omits them, like the device names, so the chrome keeps its own default.
			...(active && ownRun.current ? { sources: capturedSources(latest.current) } : {}),
			...recordedDevices(latest.current),
		}
	}

	useEffect(() => {
		void recording.refreshDevices()
	}, [])

	// `stopRecord` only asks the recorder to stop; the recorder answers with `record_finish`,
	// and without listening for it this gate kept reporting "recording" forever.
	useEffect(() => {
		const unlisten = listen('record_finish', () => {
			ownRun.current = false
			latest.current.setIsRecording(false)
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	// A run this hook did not start (the main window's record tab, the shortcut) reports its real
	// start time. Keeping it stops the next report from resetting every surface's clock to now.
	useEffect(() => {
		const unlisten = listen<RecordingStatePayload>(RECORDING_STATE_EVENT, ({ payload }) => {
			startedAt.current = payload.recording ? (payload.startedAt ?? startedAt.current) : null
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	useEffect(() => {
		const unlisten = listen<{ stop: boolean }>(RECORDING_TOGGLE_EVENT, async (event) => {
			const current = latest.current
			try {
				if (event.payload.stop) {
					ownRun.current = false
					await current.stopRecord()
					return
				}
				if (startPending.current) return
				startPending.current = true
				try {
					if (await isRecordingActive()) {
						// Already running elsewhere: report it rather than opening a second stream set.
						void emit(RECORDING_STATE_EVENT, await reportedState())
						return
					}
					await current.refreshDevices()
					// Read the hook from the latest render: `current` still carries the device set
					// from before the refresh, so a just-plugged device would miss this run.
					ownRun.current = true
					const started = await latest.current.startRecord()
					ownRun.current = started
					if (started) void emit(RECORDING_STATE_EVENT, await reportedState())
					// A refused start (a missing pinned device, a permission) leaves the chrome on
					// "Record" with no explanation: the error modal is in the other window.
					else void emit(RECORDING_START_FAILED_EVENT)
				} finally {
					startPending.current = false
				}
			} catch (error) {
				console.error('meeting bar recording toggle failed:', error)
				if (!event.payload.stop) {
					ownRun.current = false
					void emit(RECORDING_START_FAILED_EVENT)
				}
			}
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	const mounted = useRef(false)
	useEffect(() => {
		// On mount the truth is Rust's: a main-window webview reload must not tell an open chrome
		// "not recording" over a run the recorder is still capturing.
		if (!mounted.current) {
			mounted.current = true
			void reportedState()
				.then((state) => emit(RECORDING_STATE_EVENT, state))
				.catch((error) => console.error('could not report the recording state:', error))
			return
		}
		void emit(RECORDING_STATE_EVENT, localState())
	}, [recording.isRecording])

	// A chrome can open while a recording already runs; answer its request instead of leaving it
	// on a stale "Record" button until the next state flip.
	useEffect(() => {
		const unlisten = listen(RECORDING_STATE_REQUEST_EVENT, () => {
			reportedState()
				.then((state) => emit(RECORDING_STATE_EVENT, state))
				.catch((error) => console.error('could not report the recording state:', error))
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	return null
}
