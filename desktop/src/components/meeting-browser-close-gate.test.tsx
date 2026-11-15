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
})
