// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AudioDevice } from '~/lib/audio'
import AudioDeviceInput from './audio-device-input'

// The picker's open list is radix-driven; its content is covered by the
// deviceMenuEntries unit tests. What matters at the DOM level is what the closed
// trigger promises: the selected device, or the pinned device flagged unavailable —
// never a silent fall back to "None".
afterEach(cleanup)

const devices: AudioDevice[] = [
	{ id: '0', name: 'Camera Mic', isInput: true, isDefault: true },
	{ id: '1', name: 'Bluetooth', isInput: true, isDefault: false },
]

describe('AudioDeviceInput trigger', () => {
	it('shows the selected device name', () => {
		render(
			<AudioDeviceInput type="input" devices={devices} device={devices[0]} setDevice={vi.fn()} />,
		)
		expect(screen.getByRole('combobox').textContent).toContain('Camera Mic')
	})

	it('flags a missing pinned device instead of falling back to none', () => {
		render(
			<AudioDeviceInput type="input" devices={devices} device={null} unavailableName="Bluetooth" setDevice={vi.fn()} />,
		)
		const trigger = screen.getByRole('combobox').textContent ?? ''
		expect(trigger).toContain('Bluetooth')
		expect(trigger).toContain('unavailable')
	})

	it('shows none when nothing is pinned', () => {
		render(<AudioDeviceInput type="input" devices={devices} device={null} setDevice={vi.fn()} />)
		expect(screen.getByRole('combobox').textContent).not.toContain('Camera Mic')
	})
})
