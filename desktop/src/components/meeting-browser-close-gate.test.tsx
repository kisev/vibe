// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import MeetingBrowserCloseGate from './meeting-browser-close-gate'

const mocks = vi.hoisted(() => ({
	ask: vi.fn(),
	listeners: new Map<string, (event: { payload: { session: number } }) => void>(),
	close: vi.fn(async () => {}),
	confirmClose: vi.fn(async () => {}),
	retry: vi.fn(async () => {}),
}))

vi.mock('@tauri-apps/api/event', () => ({
	listen: async (event: string, callback: (event: { payload: { session: number } }) => void) => {
		mocks.listeners.set(event, callback)
		return () => mocks.listeners.delete(event)
	},
}))
vi.mock('@tauri-apps/plugin-dialog', () => ({ ask: mocks.ask }))
vi.mock('~/lib/meeting-browser', () => ({
	closeMeetingBrowser: mocks.close,
	confirmMeetingBrowserClose: mocks.confirmClose,
	retryMeetingBrowser: mocks.retry,
}))

beforeEach(() => {
	mocks.ask.mockReset()
	mocks.close.mockClear()
	mocks.confirmClose.mockClear()
	mocks.retry.mockClear()
	mocks.listeners.clear()
})

afterEach(cleanup)

async function fire(event: string, session = 7) {
	await waitFor(() => expect(mocks.listeners.has(event)).toBe(true))
	await act(async () => {
		await mocks.listeners.get(event)!({ payload: { session } })
	})
}

describe('closing the browser while recording', () => {
	it('stops the recording and closes when the user chooses Stop and close', async () => {
		mocks.ask.mockResolvedValue(true)
		render(<MeetingBrowserCloseGate />)

		await fire('meeting-browser-close-requested')

		expect(mocks.ask).toHaveBeenCalledWith(m.meetingBrowserCloseQuestion(), expect.objectContaining({ okLabel: m.meetingBrowserStopAndClose() }))
		expect(mocks.confirmClose).toHaveBeenCalledWith(7, true)
	})

	it('keeps recording in the background when the user chooses that', async () => {
		mocks.ask.mockResolvedValue(false)
		render(<MeetingBrowserCloseGate />)

		await fire('meeting-browser-close-requested')

		expect(mocks.confirmClose).toHaveBeenCalledWith(7, false)
	})

	it('closes the window anyway when the dialog itself fails', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		mocks.ask.mockRejectedValue(new Error('the dialog could not open'))
		render(<MeetingBrowserCloseGate />)

		await fire('meeting-browser-close-requested')

		// Rust holds the window until this gate answers; an unanswered request would leave it stuck.
		expect(mocks.confirmClose).toHaveBeenCalledWith(7, false)
		consoleError.mockRestore()
	})
})

describe('a page that never loaded', () => {
	it('retries when the user asks to try again', async () => {
		mocks.ask.mockResolvedValue(true)
		render(<MeetingBrowserCloseGate />)

		await fire('meeting-browser-load-failed')

		expect(mocks.retry).toHaveBeenCalledWith(7)
		expect(mocks.close).not.toHaveBeenCalled()
	})

	it('closes instead of leaving a blank window', async () => {
		mocks.ask.mockResolvedValue(false)
		render(<MeetingBrowserCloseGate />)

		await fire('meeting-browser-load-failed')

		expect(mocks.close).toHaveBeenCalledWith(7)
		expect(mocks.retry).not.toHaveBeenCalled()
	})

	it('opens one dialog for two failures at once', async () => {
		let answer: (retry: boolean) => void = () => {}
		mocks.ask.mockImplementation(() => new Promise<boolean>((resolve) => (answer = resolve)))
		render(<MeetingBrowserCloseGate />)

		await waitFor(() => expect(mocks.listeners.has('meeting-browser-load-failed')).toBe(true))
		await act(async () => {
			const handler = mocks.listeners.get('meeting-browser-load-failed')!
			const first = handler({ payload: { session: 7 } })
			const second = handler({ payload: { session: 8 } })
			answer(false)
			await Promise.all([first, second])
		})

		// The second failure must not stack a dialog whose answer contradicts the first one.
		expect(mocks.ask).toHaveBeenCalledTimes(1)
		expect(mocks.close).toHaveBeenCalledTimes(1)
	})
})
