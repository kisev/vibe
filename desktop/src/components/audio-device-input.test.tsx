// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { AudioDevice } from '~/lib/audio'
import AudioDeviceInput from './audio-device-input'

// The picker's open list is radix-driven; its content is covered by the
// deviceMenuEntries unit tests. What matters at the DOM level is what the closed
// trigger promises: the selected device, or the pinned device flagged unavailable —
// never a silent fall back to "None".
afterEach(cleanup)

// jsdom has no pointer-capture API; Radix's select calls it on the trigger.
beforeAll(() => {
	Element.prototype.hasPointerCapture ??= () => false
	Element.prototype.releasePointerCapture ??= () => {}
	Element.prototype.setPointerCapture ??= () => {}
	Element.prototype.scrollIntoView ??= () => {}
})

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

describe('AudioDeviceInput hide interaction', () => {
	it('hides the device from the eye button without selecting it', async () => {
		const onHide = vi.fn()
		const setDevice = vi.fn()
		const user = userEvent.setup()
		render(
			<AudioDeviceInput
				type="input"
				devices={devices}
				device={devices[0]}
				setDevice={setDevice}
				onHide={onHide}
				hiddenNames={[]}
			/>,
		)
		await user.click(screen.getByRole('combobox'))
		const eye = await screen.findByLabelText('Hide Bluetooth')
		await user.click(eye)
		expect(onHide).toHaveBeenCalledWith(devices[1])
		expect(setDevice).not.toHaveBeenCalledWith(devices[1])
	})
})
