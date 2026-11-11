// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { m } from '~/paraglide/messages.js'
import { MeetingBrowserSettings } from './meeting-browser'

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const stored = ['telemost.yandex.ru', 'stream.wb.ru']

beforeEach(() => {
	mocks.invoke.mockReset()
	mocks.invoke.mockImplementation(async (command: string) => {
		if (command === 'meeting_hosts') return [...stored]
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

function savedHosts() {
	const calls = mocks.invoke.mock.calls.filter(([command]) => command === 'set_meeting_hosts')
	return calls[calls.length - 1]?.[1]
}

describe('meeting host settings', () => {
	it('adds a normalized host and saves the whole list', async () => {
		const user = userEvent.setup()
		renderSettings()
		await screen.findByText('telemost.yandex.ru')

		await user.type(screen.getByLabelText(m.meetingHostAdd()), 'Meet.Example.com.')
		await user.click(screen.getByRole('button', { name: m.meetingHostAddAction() }))

		await waitFor(() => expect(savedHosts()).toEqual({ hosts: [...stored, 'meet.example.com'] }))
		expect(await screen.findByText('meet.example.com')).toBeTruthy()
	})

	it('removes a host and saves the remaining list', async () => {
		const user = userEvent.setup()
		renderSettings()
		await screen.findByText('stream.wb.ru')

		await user.click(screen.getByRole('button', { name: m.meetingHostRemove({ host: 'stream.wb.ru' }) }))

		await waitFor(() => expect(savedHosts()).toEqual({ hosts: ['telemost.yandex.ru'] }))
		await waitFor(() => expect(screen.queryByText('stream.wb.ru')).toBeNull())
	})

	it('refuses a value that is not a bare host name without saving', async () => {
		const user = userEvent.setup()
		renderSettings()
		await screen.findByText('telemost.yandex.ru')

		await user.type(screen.getByLabelText(m.meetingHostAdd()), 'https://example.com/path')
		await user.click(screen.getByRole('button', { name: m.meetingHostAddAction() }))

		expect(screen.getByText(m.meetingHostInvalid())).toBeTruthy()
		expect(savedHosts()).toBeUndefined()
	})

	it('opens a pasted link in the in-app browser', async () => {
		const user = userEvent.setup()
		renderSettings()

		await user.type(screen.getByLabelText(m.openInVibeUrlLabel()), 'https://telemost.yandex.ru/j/1')
		await user.click(screen.getByRole('button', { name: m.openInVibeAction() }))

		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('open_meeting_browser', { url: 'https://telemost.yandex.ru/j/1' }))
	})
})
