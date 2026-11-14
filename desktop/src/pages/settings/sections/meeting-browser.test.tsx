// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { m } from '~/paraglide/messages.js'
import { MeetingBrowserSettings } from './meeting-browser'

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(),
	listeners: new Map<string, (event: { payload: unknown }) => void>(),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('@tauri-apps/api/event', () => ({
	listen: async (event: string, callback: (event: { payload: unknown }) => void) => {
		mocks.listeners.set(event, callback)
		return () => mocks.listeners.delete(event)
	},
}))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const stored = ['meet.example.com']
const blocked = ['cdn.other.test']

beforeEach(() => {
	mocks.invoke.mockReset()
	mocks.listeners.clear()
	mocks.invoke.mockImplementation(async (command: string, args?: { host?: string }) => {
		if (command === 'browser_allowed_hosts') return [...stored]
		if (command === 'browser_blocked_hosts') return [...blocked]
		if (command === 'browser_allow_host') return [...new Set([...stored, String(args?.host ?? '')])]
		if (command === 'browser_remove_allowed_host') return stored.filter((host) => host !== args?.host)
		if (command === 'get_browser_policy') return 'strict'
		if (command === 'set_browser_policy') return String((args as { policy?: string } | undefined)?.policy ?? 'strict')
		return undefined
	})
})

afterEach(cleanup)

function renderSettings() {
	render(
		<TooltipProvider>
			<MeetingBrowserSettings />
		</TooltipProvider>,
	)
}

function lastCall(command: string) {
	const calls = mocks.invoke.mock.calls.filter(([name]) => name === command)
	return calls[calls.length - 1]
}

describe('browser allowlist settings', () => {
	it('adds a normalized domain through the allow command', async () => {
		const user = userEvent.setup()
		renderSettings()
		await screen.findByText('meet.example.com')

		await user.type(screen.getByLabelText(m.browserAllowedHostAdd()), 'New.Example.com.')
		await user.click(screen.getByRole('button', { name: m.browserAllowedHostAddAction() }))

		await waitFor(() => expect(lastCall('browser_allow_host')).toEqual(['browser_allow_host', { host: 'new.example.com' }]))
		expect(await screen.findByText('new.example.com')).toBeTruthy()
	})

	it('removes a domain through the remove command', async () => {
		const user = userEvent.setup()
		renderSettings()
		await screen.findByText('meet.example.com')

		await user.click(screen.getByRole('button', { name: m.browserAllowedHostRemove({ host: 'meet.example.com' }) }))

		await waitFor(() => expect(lastCall('browser_remove_allowed_host')).toEqual(['browser_remove_allowed_host', { host: 'meet.example.com' }]))
		await waitFor(() => expect(screen.queryByText('meet.example.com')).toBeNull())
	})

	it('refuses a value that is not a bare host name without calling the backend', async () => {
		const user = userEvent.setup()
		renderSettings()
		await screen.findByText('meet.example.com')

		await user.type(screen.getByLabelText(m.browserAllowedHostAdd()), 'https://example.com/path')
		await user.click(screen.getByRole('button', { name: m.browserAllowedHostAddAction() }))

		expect(screen.getByText(m.browserAllowedHostInvalid())).toBeTruthy()
		expect(lastCall('browser_allow_host')).toBeUndefined()
	})

	it('allows a blocked host in place and drops it from the blocked list', async () => {
		const user = userEvent.setup()
		renderSettings()
		await screen.findByText('cdn.other.test')

		await user.click(screen.getByRole('button', { name: m.browserBlockedHostAllow() }))

		await waitFor(() => expect(lastCall('browser_allow_host')).toEqual(['browser_allow_host', { host: 'cdn.other.test' }]))
		// It moves to the allowlist: no Allow action or empty-state note remains under Blocked.
		await waitFor(() => expect(screen.queryByRole('button', { name: m.browserBlockedHostAllow() })).toBeNull())
		expect(await screen.findByText(m.browserBlockedHostsEmpty())).toBeTruthy()
	})

	it('opens a pasted link in the in-app browser', async () => {
		const user = userEvent.setup()
		renderSettings()

		await user.type(screen.getByLabelText(m.openInVibeUrlLabel()), 'https://meet.example.com/j/1')
		await user.click(screen.getByRole('button', { name: m.openInVibeAction() }))

		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('open_meeting_browser', { url: 'https://meet.example.com/j/1' }))
	})
})

describe('blocking policy', () => {
	it('starts strict and persists a change to trusted-site', async () => {
		renderSettings()
		const select = (await screen.findByLabelText(m.browserPolicy())) as HTMLSelectElement
		expect(select.value).toBe('strict')

		await userEvent.selectOptions(select, 'trusted-site')
		await waitFor(() => expect(lastCall('set_browser_policy')?.[1]).toMatchObject({ policy: 'trusted-site' }))
	})

	it('hides the blocked hosts while the policy is trusted-site', async () => {
		renderSettings()
		const select = (await screen.findByLabelText(m.browserPolicy())) as HTMLSelectElement
		await userEvent.selectOptions(select, 'trusted-site')
		await waitFor(() => expect(screen.queryByText(m.browserBlockedHosts())).toBeNull())
	})
})
