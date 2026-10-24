import { describe, expect, it } from 'vitest'
import type { AudioDevice } from './audio'
import { deviceMenuEntries, resolveSelection } from './device-selection'

function device(name: string, isInput: boolean, id: string, isDefault = false): AudioDevice {
	return { id, name, isInput, isDefault }
}

const mic = (name: string, id: string, isDefault = false) => device(name, true, id, isDefault)
const speakers = (name: string, id: string, isDefault = false) => device(name, false, id, isDefault)

describe('resolveSelection', () => {
	it('selects the saved device by name after the enumeration order changes', () => {
		const before = [mic('Camera Mic', '0'), mic('Bluetooth', '1', true)]
		const after = [mic('Bluetooth', '0'), mic('Camera Mic', '1')] // ids reassigned by replug
		expect(resolveSelection(before, 'Camera Mic', []).device?.name).toBe('Camera Mic')
		expect(resolveSelection(after, 'Camera Mic', []).device?.name).toBe('Camera Mic')
	})

	it('falls back to the default device when nothing is saved', () => {
		const devices = [mic('Camera Mic', '0'), mic('Bluetooth', '1', true)]
		expect(resolveSelection(devices, null, []).device?.name).toBe('Bluetooth')
	})

	it('treats an empty saved name as nothing saved', () => {
		// The legacy id-based values never match a device name and land here once.
		const devices = [mic('Camera Mic', '0', true)]
		expect(resolveSelection(devices, '', []).device?.name).toBe('Camera Mic')
	})

	it('keeps a missing pinned device as unavailable instead of silently dropping it', () => {
		const devices = [mic('Camera Mic', '0', true)]
		const resolved = resolveSelection(devices, 'Bluetooth', [])
		expect(resolved.device).toBeNull()
		expect(resolved.unavailableName).toBe('Bluetooth')
	})

	it('treats a hidden pinned device as unselected, not unavailable', () => {
		const devices = [mic('Camera Mic', '0', true)]
		const resolved = resolveSelection(devices, 'Camera Mic', ['Camera Mic'])
		expect(resolved.device).toBeNull()
		expect(resolved.unavailableName).toBeNull()
	})
})

describe('deviceMenuEntries', () => {
	it('lists visible devices and hides the excluded ones behind restore entries', () => {
		const devices = [mic('Camera Mic', '0'), mic('Bluetooth', '1'), speakers('Speakers', '2')]
		const entries = deviceMenuEntries(devices, 'input', ['Bluetooth'], null)
		expect(entries.map((entry) => entry.kind)).toEqual(['none', 'device', 'hidden'])
		expect(entries.find((entry) => entry.kind === 'device')?.label).toBe('Camera Mic')
		expect(entries.find((entry) => entry.kind === 'hidden')).toMatchObject({ label: 'Bluetooth', value: 'hidden:Bluetooth' })
	})

	it('shows the unavailable pin ahead of the devices instead of falling back to none', () => {
		const entries = deviceMenuEntries([mic('Camera Mic', '0')], 'input', [], 'Bluetooth')
		expect(entries[0].kind).toBe('none')
		expect(entries[1]).toMatchObject({ kind: 'unavailable', label: 'Bluetooth', value: 'unavailable' })
	})

	it('keeps input and output directions independent', () => {
		const devices = [mic('Camera Mic', '0'), speakers('Speakers', '1')]
		expect(deviceMenuEntries(devices, 'output', [], null).every((entry) => entry.kind !== 'device' || !entry.device?.isInput)).toBe(true)
	})
})
