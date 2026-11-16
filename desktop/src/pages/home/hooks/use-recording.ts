import { emit } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { type SetStateAction, useCallback, useContext, useEffect, useState } from 'react'
import type { AudioDevice } from '~/lib/audio'
import { CONFIG_KEYS } from '~/lib/config-keys'
import { usePersisted } from '~/lib/config-store'
import { resolveSelection } from '~/lib/device-selection'
import { KEEP_AWAKE, startKeepAwake, stopKeepAwake } from '~/lib/keep-awake'
import { m } from '~/paraglide/messages.js'
import { ensureSystemAudioPermission } from '~/lib/permissions'
import { ErrorModalContext } from '~/providers/error-modal'
import { usePreferenceProvider } from '~/providers/preference'

/**
 * The saved value for a deliberate "None": the device keys tell a missing preference (null, use
 * the system default) apart from an empty selection (''), so selecting None must store this
 * sentinel rather than null.
 */
const NO_DEVICE_NAME = ''

/** A resolved device pair, as returned by a refresh: what a run started right after it must use. */
export interface ResolvedDevices {
	input: AudioDevice | null
	output: AudioDevice | null
	inputUnavailableName: string | null
	outputUnavailableName: string | null
}

export function useRecording(onBeforeStart: () => void) {
	const preference = usePreferenceProvider()
	const { setState: setErrorModal } = useContext(ErrorModalContext)
	const [devices, setDevices] = useState<AudioDevice[]>([])
	// Selections persist by device name: enumeration ids are indexes and shuffle when
	// hardware is plugged or unplugged, so a saved id can silently rebind to a different
	// device. Names are stable for the hardware people pin (camera mics, headsets).
	const [savedInputDeviceName, setSavedInputDeviceName] = usePersisted<string | null>(CONFIG_KEYS.inputDeviceName, null)
	const [savedOutputDeviceName, setSavedOutputDeviceName] = usePersisted<string | null>(CONFIG_KEYS.outputDeviceName, null)
	const [hiddenInputDevices, setHiddenInputDevices] = usePersisted<string[]>(CONFIG_KEYS.hiddenInputDevices, [])
	const [hiddenOutputDevices, setHiddenOutputDevices] = usePersisted<string[]>(CONFIG_KEYS.hiddenOutputDevices, [])
	const [inputDevice, setInputDevice] = useState<AudioDevice | null>(null)
	const [outputDevice, setOutputDevice] = useState<AudioDevice | null>(null)
	// A pinned device that is absent right now: the pin stays visible and the device is
	// re-selected the moment it reappears. Recording is blocked while it is missing.
	const [inputUnavailableName, setInputUnavailableName] = useState<string | null>(null)
	const [outputUnavailableName, setOutputUnavailableName] = useState<string | null>(null)
	const [isRecording, setIsRecording] = useState(false)
	/**
	 * Whether this hook started the running recording. An adopted run (the meeting chrome starts
	 * the same recorder) has a recording state but not necessarily this hook's device knowledge,
	 * so a reporter must not name devices it did not resolve.
	 */
	const [ownsRecording, setOwnsRecording] = useState(false)
	// When the running recording began, so a remounted indicator keeps its clock and its silence
	// window instead of restarting them. Null whenever no recording is active.
	const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
	const [recordingName, setRecordingName] = useState('')

	useEffect(() => {
		if (!isRecording) setRecordingStartedAt(null)
	}, [isRecording])

	function setInputDeviceAndSave(value: SetStateAction<AudioDevice | null>) {
		const device = typeof value === 'function' ? value(inputDevice) : value
		setSavedInputDeviceName(device?.name ?? NO_DEVICE_NAME)
		setInputUnavailableName(null)
		setInputDevice(device)
	}

	function setOutputDeviceAndSave(value: SetStateAction<AudioDevice | null>) {
		const device = typeof value === 'function' ? value(outputDevice) : value
		setSavedOutputDeviceName(device?.name ?? NO_DEVICE_NAME)
		setOutputUnavailableName(null)
		setOutputDevice(device)
	}

	function hideInputDevice(device: AudioDevice) {
		setHiddenInputDevices((previous) => (previous.includes(device.name) ? previous : [...previous, device.name]))
	}

	function hideOutputDevice(device: AudioDevice) {
		setHiddenOutputDevices((previous) => (previous.includes(device.name) ? previous : [...previous, device.name]))
	}

	/** Un-hide by name and select it again; a still-absent device becomes the unavailable pin. */
	function restoreInputDevice(name: string) {
		setHiddenInputDevices((previous) => previous.filter((hidden) => hidden !== name))
		setSavedInputDeviceName(name)
	}

	function restoreOutputDevice(name: string) {
		setHiddenOutputDevices((previous) => previous.filter((hidden) => hidden !== name))
		setSavedOutputDeviceName(name)
	}

	const loadAudioDevices = useCallback(async (): Promise<ResolvedDevices | null> => {
		try {
			const newDevices = await invoke<AudioDevice[]>('get_audio_devices')
			const inputs = newDevices.filter((device) => device.isInput)
			const outputs = newDevices.filter((device) => !device.isInput)
			const input = resolveSelection(inputs, savedInputDeviceName, hiddenInputDevices)
			const output = resolveSelection(outputs, savedOutputDeviceName, hiddenOutputDevices)
			const resolved: ResolvedDevices = {
				input: input.device,
				output: output.device,
				inputUnavailableName: input.unavailableName,
				outputUnavailableName: output.unavailableName,
			}
			setInputDevice(resolved.input)
			setInputUnavailableName(resolved.inputUnavailableName)
			setOutputDevice(resolved.output)
			setOutputUnavailableName(resolved.outputUnavailableName)
			setDevices(newDevices)
			// Returned so a caller that just refreshed (the meeting gate, startRecord) can use the
			// fresh devices instead of the state set from the render that is still stale.
			return resolved
		} catch (error) {
			// The pickers keep the last snapshot: a refused enumeration (a busy audio subsystem, or
			// cpal failing) must not surface as an unhandled rejection with no trace.
			console.error('get_audio_devices failed:', error)
			return null
		}
	}, [savedInputDeviceName, savedOutputDeviceName, hiddenInputDevices, hiddenOutputDevices])

	useEffect(() => {
		if (preference.homeTab === 'record') void loadAudioDevices()
	}, [preference.homeTab, loadAudioDevices])

	// Devices come and go while the app runs; cpal reports no hot-plug events, so the
	// snapshot refreshes whenever the record tab regains focus, and the pickers ask for a
	// refresh when they open. A plugged-in device shows up without an app restart.
	useEffect(() => {
		if (preference.homeTab !== 'record') return
		const onFocus = () => void loadAudioDevices()
		window.addEventListener('focus', onFocus)
		return () => window.removeEventListener('focus', onFocus)
	}, [preference.homeTab, loadAudioDevices])

	/**
	 * True when this call actually started the recorder; false when a guard blocked it. A caller
	 * that already refreshed (the meeting gate) can pass the resolved devices; without them this
	 * re-resolves first, so a device plugged in since the last snapshot is the one captured.
	 */
	async function startRecord(resolvedDevices?: ResolvedDevices | null): Promise<boolean> {
		// undefined = no fresh resolution supplied; null = a refresh was attempted and failed,
		// which keeps the last known state instead of guessing again.
		const resolved = resolvedDevices === undefined ? await loadAudioDevices() : resolvedDevices
		const input = resolved ? resolved.input : inputDevice
		const output = resolved ? resolved.output : outputDevice
		// A pinned device that is missing blocks the run loudly instead of letting it fall
		// through to some other device or to a silent "none".
		const missing = resolved
			? (resolved.inputUnavailableName ?? resolved.outputUnavailableName)
			: (inputUnavailableName ?? outputUnavailableName)
		if (missing) {
			setErrorModal?.({ log: m.pinnedDeviceMissing({ name: missing }), open: true })
			return false
		}
		if (output && !(await ensureSystemAudioPermission())) return false
		startKeepAwake(KEEP_AWAKE.record)
		onBeforeStart()
		setIsRecording(true)
		setOwnsRecording(true)
		const selectedDevices = [input, output].filter((device): device is AudioDevice => device !== null)
		try {
			await invoke('start_record', {
				devices: selectedDevices,
				recordingName: recordingName.trim() || null,
			})
			setRecordingStartedAt(Date.now())
			return true
		} catch (error) {
			stopKeepAwake(KEEP_AWAKE.record)
			setIsRecording(false)
			setOwnsRecording(false)
			console.error('startRecord error: ', error)
			setErrorModal?.({ log: String(error), open: true })
			// The device set may have changed under us; refresh before the next attempt.
			void loadAudioDevices()
			return false
		}
	}

	/**
	 * Adopt a recording this hook did not start (the meeting chrome starts the same recorder).
	 * Keeps one flag and one start time for every surface showing the recorder; a re-report of the
	 * run already known must not restart its clock.
	 */
	const adoptRecording = useCallback((active: boolean, startedAt: number | null) => {
		setIsRecording(active)
		setRecordingStartedAt((previous) => (active ? (previous ?? startedAt) : null))
		setOwnsRecording(false)
	}, [])

	/** False when the backend refused the stop, so the caller can drop its own pending state. */
	async function stopRecord(): Promise<boolean> {
		try {
			await emit('stop_record')
			return true
		} catch (error) {
			stopKeepAwake(KEEP_AWAKE.record)
			setIsRecording(false)
			console.error('stopRecord error: ', error)
			setErrorModal?.({ log: String(error), open: true })
			return false
		}
	}

	return {
		devices,
		setDevices,
		inputDevice,
		outputDevice,
		inputUnavailableName,
		outputUnavailableName,
		hiddenInputDevices,
		hiddenOutputDevices,
		hideInputDevice,
		hideOutputDevice,
		restoreInputDevice,
		restoreOutputDevice,
		/** Re-enumerate and re-resolve the selection; returns the fresh devices, or null on failure. */
		refreshDevices: loadAudioDevices,
		isRecording,
		setIsRecording,
		/** True while this hook's own run (not one adopted from another surface) is active. */
		ownsRecording: isRecording && ownsRecording,
		/** Epoch ms the running recording began; null when idle. */
		startedAt: recordingStartedAt,
		recordingName,
		setRecordingName,
		setInputDevice: setInputDeviceAndSave,
		setOutputDevice: setOutputDeviceAndSave,
		startRecord,
		stopRecord,
		adoptRecording,
	}
}
