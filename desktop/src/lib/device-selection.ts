import type { AudioDevice } from './audio'
import { CONFIG_KEYS } from './config-keys'
import { readConfig } from './config-store'

export interface ResolvedSelection {
	/** The device matching the saved name, the default device when nothing is saved, or null. */
	device: AudioDevice | null
	/** The saved name when it names a device that is absent right now; the pin stays visible. */
	unavailableName: string | null
}

/**
 * Match a saved selection against the current device snapshot by name.
 *
 * Enumeration ids are indexes and change when devices are plugged or unplugged, so they
 * are never used for matching. `null` means nothing is stored and the system default applies;
 * an empty name is what both pickers persist for an explicit "None", so it resolves to no
 * device rather than back to the default. A saved name the user has hidden is treated as no
 * selection rather than unavailable — hiding is deliberate, not a plug event.
 */
export function resolveSelection(devices: AudioDevice[], savedName: string | null, hiddenNames: string[]): ResolvedSelection {
	if (savedName === null) {
		return { device: devices.find((device) => device.isDefault) ?? null, unavailableName: null }
	}
	if (savedName === '') {
		return { device: null, unavailableName: null }
	}
	if (hiddenNames.includes(savedName)) {
		return { device: null, unavailableName: null }
	}
	const device = devices.find((candidate) => candidate.name === savedName) ?? null
	return { device, unavailableName: device ? null : savedName }
}

/** One direction's configured selection, with the stored values the callers also need to report. */
export interface ConfiguredSelection extends ResolvedSelection {
	/** The stored pin, for copy that has to name it. */
	savedName: string | null
	/** The hidden names of this direction, for the picker's restore section. */
	hiddenNames: string[]
}

/**
 * Resolve one direction's configured device from the config: the saved name and the hidden list
 * both live under `recording.*`. Every recording entry point (main window, dictation hotkey,
 * recording shortcut, meeting chrome) goes through here so they agree on what a pin means.
 */
export function resolveConfiguredSelection(devices: AudioDevice[], type: 'input' | 'output'): ConfiguredSelection {
	const savedName = readConfig<string | null>(type === 'input' ? CONFIG_KEYS.inputDeviceName : CONFIG_KEYS.outputDeviceName, null)
	const hiddenNames = readConfig<string[]>(type === 'input' ? CONFIG_KEYS.hiddenInputDevices : CONFIG_KEYS.hiddenOutputDevices, [])
	const forType = devices.filter((device) => (type === 'input') === device.isInput)
	return { ...resolveSelection(forType, savedName, hiddenNames), savedName, hiddenNames }
}

export interface DeviceMenuEntry {
	value: string
	label: string
	kind: 'none' | 'unavailable' | 'device' | 'hidden'
	device?: AudioDevice
}

/**
 * The picker's item list: "none", the unavailable pin (if any), the visible devices of
 * this direction, and a trailing hidden section. A hidden device reappears by selecting
 * its entry, which restores it.
 *
 * `hiddenNames` must already be direction-specific (callers keep separate input/output
 * lists): the direction of a hidden, absent device cannot be recovered here, so a shared
 * list would surface foreign-direction restore entries in this picker.
 */
export function deviceMenuEntries(devices: AudioDevice[], type: 'input' | 'output', hiddenNames: string[], unavailableName: string | null): DeviceMenuEntry[] {
	const forType = devices.filter((device) => (type === 'input') === device.isInput)
	const visible = forType.filter((device) => !hiddenNames.includes(device.name))
	const entries: DeviceMenuEntry[] = [{ value: 'none', label: '', kind: 'none' }]
	if (unavailableName) entries.push({ value: 'unavailable', label: unavailableName, kind: 'unavailable' })
	for (const device of visible) entries.push({ value: device.id, label: device.name, kind: 'device', device })
	for (const name of hiddenNames) entries.push({ value: `hidden:${name}`, label: name, kind: 'hidden' })
	return entries
}
