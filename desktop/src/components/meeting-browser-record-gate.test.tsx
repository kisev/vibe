// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import MeetingBrowserRecordGate, { RECORDING_START_FAILED_EVENT } from './meeting-browser-record-gate'

const mocks = vi.hoisted(() => {
	const listeners = new Map<string, (event: { payload: any }) => void>()
	const emit = vi.fn(async (_event: string, _payload?: unknown) => {})
	const isRecordingActive = vi.fn(async () => false)
	const refreshDevices = vi.fn(async () => {})
	const startRecord = vi.fn(async () => true)
	const stopRecord = vi.fn(async () => {})
	const setIsRecording = vi.fn()
	const recording = {
		isRecording: false,
		inputDevice: { id: '0', name: 'Camera Mic', isInput: true, isDefault: true },
		outputDevice: null,
		refreshDevices,
		startRecord,
		stopRecord,
		setIsRecording,
	}
	return { listeners, emit, isRecordingActive, refreshDevices, startRecord, stopRecord, setIsRecording, recording }
})

vi.mock('@tauri-apps/api/event', () => ({
	emit: mocks.emit,
	listen: async (event: string, callback: (event: { payload: any }) => void) => {
		mocks.listeners.set(event, callback)
		return () => mocks.listeners.delete(event)
	},
}))
vi.mock('~/lib/meeting-browser', () => ({
	RECORDING_STATE_EVENT: 'meeting-browser-recording-state',
	RECORDING_STATE_REQUEST_EVENT: 'meeting-browser-recording-state-request',
	RECORDING_TOGGLE_EVENT: 'meeting-browser-recording-toggle',
	isRecordingActive: mocks.isRecordingActive,
}))
vi.mock('~/pages/home/hooks/use-recording', () => ({ useRecording: () => mocks.recording }))

beforeEach(() => {
	vi.resetAllMocks()
	mocks.listeners.clear()
	mocks.recording.isRecording = false
	mocks.isRecordingActive.mockResolvedValue(false)
	mocks.startRecord.mockResolvedValue(true)
	mocks.emit.mockImplementation(async () => {})
})

afterEach(cleanup)

const settle = async () => {
	await act(async () => {})
}

/** Let the async `listen()` registrations settle, then answer like the Rust side would. */
async function fire(event: string, payload?: unknown) {
	await waitFor(() => expect(mocks.listeners.has(event)).toBe(true))
	await act(async () => {
		await mocks.listeners.get(event)!({ payload })
	})
}

const stateCalls = () => mocks.emit.mock.calls.filter(([event]) => event === 'meeting-browser-recording-state')

describe('the gate reporting the recorder state', () => {
	it('seeds the chrome from Rust on mount instead of reporting idle', async () => {
		// The main window's webview reloaded while the recorder kept capturing: the chrome is
		// still open and must not be told "not recording".
		mocks.isRecordingActive.mockResolvedValue(true)
		render(<MeetingBrowserRecordGate />)
		await settle()

		expect(stateCalls().some(([, state]) => (state as { recording: boolean }).recording === true)).toBe(true)
	})

	it('keeps the real start time another surface announced', async () => {
		mocks.isRecordingActive.mockResolvedValue(true)
		render(<MeetingBrowserRecordGate />)
		await settle()
		mocks.emit.mockClear()

		// session.tsx reports the run the main window or the shortcut started.
		await fire('meeting-browser-recording-state', { recording: true, startedAt: 1_234_567 })
		await fire('meeting-browser-recording-state-request')

		expect(stateCalls()).toContainEqual([
			'meeting-browser-recording-state',
			expect.objectContaining({ recording: true, startedAt: 1_234_567 }),
		])
	})

	it('omits the sources of a run it did not start', async () => {
		mocks.isRecordingActive.mockResolvedValue(true)
		render(<MeetingBrowserRecordGate />)
		await settle()
		mocks.emit.mockClear()

		await fire('meeting-browser-recording-state-request')

		// The hook never resolved devices for a foreign run, so the chrome keeps its own default.
		expect(stateCalls()[0]?.[1]).not.toHaveProperty('sources')
	})

	it('logs a failed state report instead of leaking the rejection', async () => {
		mocks.isRecordingActive.mockResolvedValue(false)
		render(<MeetingBrowserRecordGate />)
		await settle()
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
		mocks.isRecordingActive.mockRejectedValue(new Error('recording_active failed'))

		await fire('meeting-browser-recording-state-request')

		await waitFor(() => expect(consoleError).toHaveBeenCalledWith('could not report the recording state:', expect.any(Error)))
		consoleError.mockRestore()
	})
})

describe('the gate starting a recording', () => {
	it('starts one recording for a double click', async () => {
		render(<MeetingBrowserRecordGate />)
		await settle()

		await waitFor(() => expect(mocks.listeners.has('meeting-browser-recording-toggle')).toBe(true))
		await act(async () => {
			const handler = mocks.listeners.get('meeting-browser-recording-toggle')!
			void handler({ payload: { stop: false } })
			void handler({ payload: { stop: false } })
		})

		expect(mocks.startRecord).toHaveBeenCalledTimes(1)
	})

	it('tells the chrome when the recorder refused the start', async () => {
		mocks.startRecord.mockResolvedValue(false)
		render(<MeetingBrowserRecordGate />)
		await settle()
		mocks.emit.mockClear()

		await fire('meeting-browser-recording-toggle', { stop: false })

		// The refusal's error modal is in the main window, out of sight from the meeting window.
		expect(mocks.emit).toHaveBeenCalledWith(RECORDING_START_FAILED_EVENT)
	})
})
