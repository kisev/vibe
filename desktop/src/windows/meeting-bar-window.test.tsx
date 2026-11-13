// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { m } from '~/paraglide/messages.js'
import MeetingBarWindow from './meeting-bar-window'

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(),
	listen: vi.fn(async () => () => {}),
	startRecord: vi.fn(async () => {}),
	stopRecord: vi.fn(async () => {}),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('@tauri-apps/api/event', () => ({ listen: mocks.listen }))
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => ({ close: vi.fn(async () => {}) }) }))
vi.mock('~/pages/home/hooks/use-recording', () => ({
	useRecording: () => ({
		refreshDevices: vi.fn(async () => {}),
		startRecord: mocks.startRecord,
		stopRecord: mocks.stopRecord,
		isRecording: false,
	}),
}))

const session = {
	session: 7,
	url: 'https://telemost.yandex.ru/rooms/1',
	host: 'telemost.yandex.ru',
	isMeeting: true,
	canBack: true,
	canForward: false,
}

beforeEach(() => {
	mocks.invoke.mockReset()
	mocks.invoke.mockImplementation(async (command: string) => {
		if (command === 'meeting_browser_session') return session
		if (command === 'meeting_browser_load') return { ...session, url: 'https://example.com/' }
		return undefined
	})
})

afterEach(cleanup)

describe('meeting bar', () => {
	it('shows the session address and drives the content window', async () => {
		render(
			<TooltipProvider>
				<MeetingBarWindow session={7} />
			</TooltipProvider>,
		)
		const address = await screen.findByLabelText(m.meetingBarAddress())
		expect(address).toHaveProperty('value', session.url)

		await userEvent.click(screen.getByRole('button', { name: m.meetingBarReload() }))
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('meeting_browser_navigate', { session: 7, action: 'reload' }))

		await userEvent.clear(address)
		await userEvent.type(address, 'https://example.com/{Enter}')
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('meeting_browser_load', { session: 7, url: 'https://example.com/' }))
	})

	it('starts a recording on a meeting host', async () => {
		render(
			<TooltipProvider>
				<MeetingBarWindow session={7} />
			</TooltipProvider>,
		)
		const record = await screen.findByRole('button', { name: m.meetingBrowserRecord() })
		await userEvent.click(record)
		expect(mocks.startRecord).toHaveBeenCalled()
	})

	it('closes the session from the bar', async () => {
		render(
			<TooltipProvider>
				<MeetingBarWindow session={7} />
			</TooltipProvider>,
		)
		await screen.findByLabelText(m.meetingBarAddress())
		await userEvent.click(screen.getByRole('button', { name: m.meetingBarClose() }))
		await waitFor(() => expect(mocks.invoke).toHaveBeenCalledWith('meeting_browser_close', { session: 7 }))
	})
})
