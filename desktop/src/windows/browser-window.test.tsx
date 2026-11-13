// @vitest-environment jsdom

import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import type { AudioDevice } from '~/lib/audio'
import { CONFIG_KEYS } from '~/lib/config-keys'
import BrowserWindow from './browser-window'

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(),
	listen: vi.fn(),
	emit: vi.fn(async () => {}),
	listeners: new Map<string, (event: { payload: any }) => void>(),
	config: new Map<string, unknown>(),
	readConfig: vi.fn(),
	writeConfig: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('@tauri-apps/api/event', () => ({ listen: mocks.listen, emit: mocks.emit }))
vi.mock('@tauri-apps/api/window', () => ({
	getCurrentWindow: () => ({ close: vi.fn(async () => {}), setTheme: vi.fn(async () => {}) }),
}))
vi.mock('~/lib/config-store', () => ({ readConfig: mocks.readConfig, writeConfig: mocks.writeConfig }))

const session = {
	session: 7,
	url: 'https://telemost.yandex.ru/rooms/1',
	host: 'telemost.yandex.ru',
	isMeeting: true,
	canBack: true,
	canForward: false,
}

const devices: AudioDevice[] = [
	{ id: '0', name: 'Camera Mic', isInput: true, isDefault: true },
	{ id: '1', name: 'USB Mic', isInput: true, isDefault: false },
	{ id: '2', name: 'Speakers', isInput: false, isDefault: true },
	{ id: '3', name: 'Headphones', isInput: false, isDefault: false },
]

const recordingState = (payload: { recording: boolean; startedAt: number | null }) => {
	act(() => mocks.listeners.get('meeting-browser-recording-state')?.({ payload }))
}

// Radix's select calls pointer-capture and scroll APIs jsdom does not implement.
beforeAll(() => {
	Element.prototype.hasPointerCapture ??= () => false
	Element.prototype.releasePointerCapture ??= () => {}
	Element.prototype.setPointerCapture ??= () => {}
	Element.prototype.scrollIntoView ??= () => {}
})

beforeEach(() => {
	vi.resetAllMocks()
	mocks.listeners.clear()
	mocks.config.clear()
	mocks.config.set(CONFIG_KEYS.inputDeviceName, 'Camera Mic')
	mocks.config.set(CONFIG_KEYS.outputDeviceName, 'Speakers')
	mocks.invoke.mockImplementation(async (command: string) => {
		if (command === 'meeting_browser_session') return session
		if (command === 'meeting_browser_load') return { ...session, url: 'https://example.com/' }
		if (command === 'get_audio_devices') return devices
		return undefined
	})
	mocks.listen.mockImplementation(async (event: string, callback: (event: { payload: any }) => void) => {
		mocks.listeners.set(event, callback)
		return () => mocks.listeners.delete(event)
	})
	mocks.readConfig.mockImplementation((key: string, fallback: unknown) => (mocks.config.has(key) ? mocks.config.get(key) : fallback))
	mocks.writeConfig.mockImplementation((key: string, value: unknown) => {
		mocks.config.set(key, value)
	})
})

afterEach(cleanup)

describe('browser chrome', () => {
	it('shows the session address and drives the page', async () => {
		render(<BrowserWindow session={7} />)
		const address = await screen.findByLabelText(m.meetingBarAddress())
		expect(address).toHaveProperty('value', session.url)

		await userEvent.click(screen.getByRole('button', { name: m.meetingBarReload() }))
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('meeting_browser_navigate', { session: 7, action: 'reload' }))

		await userEvent.clear(address)
		await userEvent.type(address, 'https://example.com/{Enter}')
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('meeting_browser_load', { session: 7, url: 'https://example.com/' }))
	})

	it('asks the main window to start a recording on a meeting host', async () => {
		render(<BrowserWindow session={7} />)
		const record = await screen.findByRole('button', { name: m.meetingBrowserRecord() })
		await userEvent.click(record)
		expect(mocks.emit).toHaveBeenCalledWith('meeting-browser-recording-toggle', { stop: false })
	})

	it('asks the main window for a recording that already runs', async () => {
		render(<BrowserWindow session={7} />)
		await screen.findByLabelText(m.meetingBarAddress())
		expect(mocks.emit).toHaveBeenCalledWith('meeting-browser-recording-state-request')
	})

	it('mirrors the recording state, timer and stop control', async () => {
		render(<BrowserWindow session={7} />)
		await screen.findByRole('combobox', { name: m.microphone() })

		recordingState({ recording: true, startedAt: Date.now() - 65_000 })

		const stop = await screen.findByRole('button', { name: m.meetingBrowserStop() })
		expect(screen.getByRole('timer').textContent).toBe('01:05')
		expect(screen.getByRole('meter', { name: `${m.microphone()} Camera Mic` })).toBeDefined()
		expect(screen.getByRole('meter', { name: `${m.systemAudio()} Speakers` })).toBeDefined()

		await userEvent.click(stop)
		expect(mocks.emit).toHaveBeenCalledWith('meeting-browser-recording-toggle', { stop: true })

		recordingState({ recording: false, startedAt: null })
		expect(await screen.findByRole('button', { name: m.meetingBrowserRecord() })).toBeDefined()
		expect(screen.queryByRole('timer')).toBeNull()
	})

	it('names the selected devices and disables the pickers while recording', async () => {
		render(<BrowserWindow session={7} />)
		const microphone = await screen.findByRole('combobox', { name: m.microphone() })
		const systemAudio = screen.getByRole('combobox', { name: m.systemAudio() })
		expect(microphone.textContent).toContain('Camera Mic')
		expect(systemAudio.textContent).toContain('Speakers')

		recordingState({ recording: true, startedAt: Date.now() })
		await waitFor(() => expect((screen.getByRole('combobox', { name: m.microphone() }) as HTMLButtonElement).disabled).toBe(true))
		expect((screen.getByRole('combobox', { name: m.systemAudio() }) as HTMLButtonElement).disabled).toBe(true)

		recordingState({ recording: false, startedAt: null })
		await waitFor(() => expect((screen.getByRole('combobox', { name: m.microphone() }) as HTMLButtonElement).disabled).toBe(false))
	})

	it('persists a device picked in the chrome under the shared config key', async () => {
		render(<BrowserWindow session={7} />)
		const microphone = await screen.findByRole('combobox', { name: m.microphone() })

		await userEvent.click(microphone)
		await userEvent.click(await screen.findByRole('option', { name: 'USB Mic' }))

		await waitFor(() => expect(mocks.writeConfig).toHaveBeenCalledWith(CONFIG_KEYS.inputDeviceName, 'USB Mic'))
		await waitFor(() => expect(screen.getByRole('combobox', { name: m.microphone() }).textContent).toContain('USB Mic'))
	})

	it('closes the session from the chrome', async () => {
		render(<BrowserWindow session={7} />)
		await screen.findByLabelText(m.meetingBarAddress())
		await userEvent.click(screen.getByRole('button', { name: m.meetingBarClose() }))
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('meeting_browser_close', { session: 7 }))
	})
})
