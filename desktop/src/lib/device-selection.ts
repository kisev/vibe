import type { AudioDevice } from './audio'

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
 * are never used for matching. An empty saved name counts as "nothing saved" (the legacy
 * id-based values never match a name and fall here). A saved name the user has hidden is
 * treated as no selection rather than unavailable — hiding is deliberate, not a plug event.
 */
export function resolveSelection(devices: AudioDevice[], savedName: string | null, hiddenNames: string[]): ResolvedSelection {
	if (savedName === null || savedName === '') {
		return { device: devices.find((device) => device.isDefault) ?? null, unavailableName: null }
	}
	if (hiddenNames.includes(savedName)) {
		return { device: null, unavailableName: null }
	}
	const device = devices.find((candidate) => candidate.name === savedName) ?? null
	return { device, unavailableName: device ? null : savedName }
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
