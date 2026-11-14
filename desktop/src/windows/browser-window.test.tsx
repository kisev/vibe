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
	url: 'https://meet.example.com/rooms/1',
	host: 'meet.example.com',
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
		if (command === 'get_browser_policy') return 'strict'
		if (command === 'browser_blocked_hosts') return []
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

		// A native select: its options are drawn by the platform, not by a popup inside the chrome.
		await userEvent.selectOptions(microphone, 'USB Mic')

		await waitFor(() => expect(mocks.writeConfig).toHaveBeenCalledWith(CONFIG_KEYS.inputDeviceName, 'USB Mic'))
		await waitFor(() => expect(screen.getByRole('combobox', { name: m.microphone() }).textContent).toContain('USB Mic'))
	})

	it('offers to allow a host the allowlist refused', async () => {
		render(<BrowserWindow session={7} />)
		await screen.findByLabelText(m.meetingBarAddress())

		act(() => mocks.listeners.get('meeting-browser-navigation-blocked')?.({ payload: { session: 7, host: 'cdn.other.test' } }))
		expect(await screen.findByText(m.browserNavigationBlocked({ host: 'cdn.other.test' }))).toBeTruthy()

		await userEvent.click(screen.getByRole('button', { name: m.browserBlockedHostAllow() }))
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('browser_allow_host', { host: 'cdn.other.test' }))
		await waitFor(() => expect(screen.queryByText(m.browserNavigationBlocked({ host: 'cdn.other.test' }))).toBeNull())
	})

	it('closes the session from the chrome', async () => {
		render(<BrowserWindow session={7} />)
		await screen.findByLabelText(m.meetingBarAddress())
		await userEvent.click(screen.getByRole('button', { name: m.meetingBarClose() }))
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('meeting_browser_close', { session: 7 }))
	})
})

describe('blocked hosts in the chrome', () => {
	function withBlocked(hosts: string[], policy: 'strict' | 'trusted-site' = 'strict') {
		mocks.invoke.mockImplementation(async (command: string) => {
			if (command === 'meeting_browser_session') return session
			if (command === 'get_audio_devices') return devices
			if (command === 'get_browser_policy') return policy
			if (command === 'browser_blocked_hosts') return hosts
			if (command === 'browser_allow_host') return []
			return undefined
		})
	}

	it('grows the chrome for the blocked list and allows a host without leaving the browser', async () => {
		withBlocked(['cdn.other.test'])
		render(<BrowserWindow session={7} />)

		const trigger = await screen.findByRole('button', { name: m.browserBlockedHostsCount({ count: 1 }) })
		// The region is not a popover: it does not exist until the chrome has been grown for it.
		expect(screen.queryByText('cdn.other.test')).toBeNull()
		await userEvent.click(trigger)
		expect(await screen.findByRole('region', { name: m.browserBlockedHosts() })).toBeTruthy()
		expect(await screen.findByText('cdn.other.test')).toBeTruthy()
		await waitFor(() =>
			expect(mocks.invoke).toHaveBeenCalledWith('browser_set_chrome_expanded', { session: 7, expanded: true }),
		)

		await userEvent.click(screen.getByRole('button', { name: m.browserBlockedHostAllowHost({ host: 'cdn.other.test' }) }))
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('browser_allow_host', { host: 'cdn.other.test' }))
		await waitFor(() => expect(screen.queryByText('cdn.other.test')).toBeNull())
		// Allow folds the chrome back, so the page takes the space again.
		await waitFor(() =>
			expect(mocks.invoke).toHaveBeenCalledWith('browser_set_chrome_expanded', { session: 7, expanded: false }),
		)
	})

	it('folds the list back when the shield is pressed a second time', async () => {
		withBlocked(['cdn.other.test'])
		render(<BrowserWindow session={7} />)

		const trigger = await screen.findByRole('button', { name: m.browserBlockedHostsCount({ count: 1 }) })
		await userEvent.click(trigger)
		expect(await screen.findByText('cdn.other.test')).toBeTruthy()

		await userEvent.click(trigger)
		await waitFor(() => expect(screen.queryByText('cdn.other.test')).toBeNull())
		await waitFor(() =>
			expect(mocks.invoke).toHaveBeenCalledWith('browser_set_chrome_expanded', { session: 7, expanded: false }),
		)
	})

	it('hides the blocked control while the policy is trusted-site', async () => {
		withBlocked(['cdn.other.test'], 'trusted-site')
		render(<BrowserWindow session={7} />)
		await screen.findByLabelText(m.meetingBarAddress())
		expect(screen.queryByRole('button', { name: m.browserBlockedHostsCount({ count: 1 }) })).toBeNull()
	})

	it('hides an open list when the policy changes to trusted-site', async () => {
		withBlocked(['cdn.other.test'])
		render(<BrowserWindow session={7} />)

		await userEvent.click(await screen.findByRole('button', { name: m.browserBlockedHostsCount({ count: 1 }) }))
		expect(await screen.findByText('cdn.other.test')).toBeTruthy()

		act(() => mocks.listeners.get('browser-policy')?.({ payload: 'trusted-site' }))

		await waitFor(() => expect(screen.queryByText('cdn.other.test')).toBeNull())
		expect(screen.queryByRole('button', { name: m.browserBlockedHostsCount({ count: 1 }) })).toBeNull()
		await waitFor(() =>
			expect(mocks.invoke).toHaveBeenCalledWith('browser_set_chrome_expanded', { session: 7, expanded: false }),
		)
	})

	it('hides the blocked control when nothing was blocked', async () => {
		withBlocked([])
		render(<BrowserWindow session={7} />)
		await screen.findByLabelText(m.meetingBarAddress())
		expect(screen.queryByRole('region', { name: m.browserBlockedHosts() })).toBeNull()
	})
})
