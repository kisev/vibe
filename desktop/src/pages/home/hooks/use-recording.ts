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
	const [recordingName, setRecordingName] = useState('')

	function setInputDeviceAndSave(value: SetStateAction<AudioDevice | null>) {
		const device = typeof value === 'function' ? value(inputDevice) : value
		setSavedInputDeviceName(device?.name ?? '')
		setInputUnavailableName(null)
		setInputDevice(device)
	}

	function setOutputDeviceAndSave(value: SetStateAction<AudioDevice | null>) {
		const device = typeof value === 'function' ? value(outputDevice) : value
		setSavedOutputDeviceName(device?.name ?? '')
		setOutputUnavailableName(null)
		setOutputDevice(device)
	}

	function hideInputDevice(device: AudioDevice) {
		setHiddenInputDevices([...hiddenInputDevices, device.name])
	}

	function hideOutputDevice(device: AudioDevice) {
		setHiddenOutputDevices([...hiddenOutputDevices, device.name])
	}

	/** Un-hide by name and select it again; a still-absent device becomes the unavailable pin. */
	function restoreInputDevice(name: string) {
		setHiddenInputDevices(hiddenInputDevices.filter((hidden) => hidden !== name))
		setSavedInputDeviceName(name)
	}

	function restoreOutputDevice(name: string) {
		setHiddenOutputDevices(hiddenOutputDevices.filter((hidden) => hidden !== name))
		setSavedOutputDeviceName(name)
	}

	const loadAudioDevices = useCallback(async () => {
		const newDevices = await invoke<AudioDevice[]>('get_audio_devices')
		const inputs = newDevices.filter((device) => device.isInput)
		const outputs = newDevices.filter((device) => !device.isInput)
		const input = resolveSelection(inputs, savedInputDeviceName, hiddenInputDevices)
		const output = resolveSelection(outputs, savedOutputDeviceName, hiddenOutputDevices)
		setInputDevice(input.device)
		setInputUnavailableName(input.unavailableName)
		setOutputDevice(output.device)
		setOutputUnavailableName(output.unavailableName)
		setDevices(newDevices)
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

	async function startRecord() {
		// A pinned device that is missing blocks the run loudly instead of letting it fall
		// through to some other device or to a silent "none".
		const missing = inputUnavailableName ?? outputUnavailableName
		if (missing) {
			setErrorModal?.({ log: m.pinnedDeviceMissing({ name: missing }), open: true })
			return
		}
		if (outputDevice && !(await ensureSystemAudioPermission())) return
		startKeepAwake(KEEP_AWAKE.record)
		onBeforeStart()
		setIsRecording(true)
		const selectedDevices = [inputDevice, outputDevice].filter((device): device is AudioDevice => device !== null)
		try {
			await invoke('start_record', {
				devices: selectedDevices,
				recordingName: recordingName.trim() || null,
			})
		} catch (error) {
			stopKeepAwake(KEEP_AWAKE.record)
			setIsRecording(false)
			console.error('startRecord error: ', error)
			setErrorModal?.({ log: String(error), open: true })
			// The device set may have changed under us; refresh before the next attempt.
			void loadAudioDevices()
		}
	}

	async function stopRecord() {
		try {
			await emit('stop_record')
		} catch (error) {
			stopKeepAwake(KEEP_AWAKE.record)
			setIsRecording(false)
			console.error('stopRecord error: ', error)
			setErrorModal?.({ log: String(error), open: true })
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
		refreshDevices: loadAudioDevices,
		isRecording,
		setIsRecording,
		recordingName,
		setRecordingName,
		setInputDevice: setInputDeviceAndSave,
		setOutputDevice: setOutputDeviceAndSave,
		startRecord,
		stopRecord,
	}
}
