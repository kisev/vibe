// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_LONG_SILENCE_MINUTES } from '~/lib/recording-limits'
import { m } from '~/paraglide/messages.js'
import RecordingIndicator from './recording-feedback'

const mocks = vi.hoisted(() => ({
	listen: vi.fn(),
	listeners: new Map<string, (event: { payload: unknown }) => void>(),
}))

/** The escalation's side effects: bringing the window forward and showing the alert. */
const escalation = vi.hoisted(() => ({
	setFocus: vi.fn(),
	message: vi.fn(),
	silenceMinutes: { value: 5 },
}))

vi.mock('@tauri-apps/api/event', () => ({ listen: mocks.listen }))
vi.mock('@tauri-apps/api/window', () => ({ getCurrentWindow: () => ({ setFocus: escalation.setFocus }) }))
vi.mock('@tauri-apps/plugin-dialog', () => ({ message: escalation.message }))
vi.mock('~/lib/config-store', () => ({ readConfig: (_key: string, fallback: number) => escalation.silenceMinutes.value ?? fallback }))

const level = (device: 'microphone' | 'system', value: number) => {
	act(() => {
		mocks.listeners.get('record_level')?.({ payload: { device, level: value } })
	})
}

/** Let the async `listen()` registration settle before events are delivered. */
const settle = async () => {
	await act(async () => {})
}

/**
 * Advance fake time in short steps so effects flush between timer callbacks — the escalation
 * reads the silence flags out of a ref refreshed on render. `keepMicrophoneAlive` feeds a level
 * every step, so only the source that makes no sound is ever marked silent.
 */
const advance = async (ms: number, keepMicrophoneAlive = false) => {
	const step = 500
	for (let left = ms; left > 0; left -= step) {
		if (keepMicrophoneAlive) level('microphone', 0.5)
		await act(async () => {
			await vi.advanceTimersByTimeAsync(Math.min(step, left))
		})
	}
}

beforeEach(() => {
	vi.useFakeTimers()
	vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
	vi.resetAllMocks()
	escalation.setFocus.mockResolvedValue(undefined)
	escalation.message.mockResolvedValue(undefined)
	escalation.silenceMinutes.value = DEFAULT_LONG_SILENCE_MINUTES
	mocks.listeners.clear()
	mocks.listen.mockImplementation(async (event: string, callback: (event: { payload: unknown }) => void) => {
		mocks.listeners.set(event, callback)
		return () => mocks.listeners.delete(event)
	})
})

afterEach(() => {
	cleanup()
	vi.useRealTimers()
})

describe('recording indicator', () => {
	it('shows the elapsed time from the recording start', () => {
		render(<RecordingIndicator startedAt={Date.now() - 65_000} microphoneName="Camera Mic" systemName="Speakers" />)

		expect(screen.getByRole('timer').textContent).toBe('01:05')

		// The clock follows the recording, not the moment the surface mounted.
		act(() => vi.advanceTimersByTime(1000))
		expect(screen.getByRole('timer').textContent).toBe('01:06')
	})

	it('drives one independent meter per source', async () => {
		render(<RecordingIndicator startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" />)
		await settle()

		level('microphone', 0.8)
		act(() => vi.advanceTimersByTime(60))

		const first = screen.getAllByRole('meter')
		expect(Number(first[0].getAttribute('aria-valuenow'))).toBeGreaterThan(0)
		expect(Number(first[1].getAttribute('aria-valuenow'))).toBe(0)

		level('system', 0.3)
		act(() => vi.advanceTimersByTime(60))

		const second = screen.getAllByRole('meter')
		const microphone = Number(second[0].getAttribute('aria-valuenow'))
		const system = Number(second[1].getAttribute('aria-valuenow'))
		expect(microphone).toBeGreaterThan(system)
		expect(system).toBeGreaterThan(0)
	})

	it('marks a source silent after it stays flat, while the other keeps working', async () => {
		render(<RecordingIndicator startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" />)
		await settle()

		// Both sources are captured but open and quiet: the recorder sends level 0 for each.
		level('microphone', 0)
		level('system', 0)
		act(() => vi.advanceTimersByTime(1600))
		expect(screen.getAllByText(m.recordingSilent())).toHaveLength(2)

		level('microphone', 0.6)
		act(() => vi.advanceTimersByTime(120))

		// The silent one is the system source; the microphone proved it is live.
		expect(screen.getAllByText(m.recordingSilent())).toHaveLength(1)
		expect(screen.getByRole('meter', { name: `${m.systemAudio()} Speakers` })).toBeDefined()
	})

	it('marks a source that never sent a level as silent', async () => {
		// The system loopback sends nothing until the first sound reaches it; leaving that source
		// unlabelled is how a wrong output device stays invisible.
		render(<RecordingIndicator startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" />)
		await settle()

		act(() => vi.advanceTimersByTime(1200))
		expect(screen.getAllByText(m.recordingSilent())).toHaveLength(2)
	})

	it('gives a pause shorter than the delay no silence marker', async () => {
		render(<RecordingIndicator startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" />)
		await settle()

		level('microphone', 0.5)
		level('system', 0.5)
		act(() => vi.advanceTimersByTime(100))

		// 300 ms of quiet is a pause in speech, not a dead device.
		level('microphone', 0)
		level('system', 0)
		act(() => vi.advanceTimersByTime(300))
		expect(screen.queryAllByText(m.recordingSilent())).toHaveLength(0)

		act(() => vi.advanceTimersByTime(900))
		expect(screen.getAllByText(m.recordingSilent())).toHaveLength(2)
	})

	it('draws no meter for a source the recording does not capture', async () => {
		render(<RecordingIndicator startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" sources={['microphone']} />)
		await settle()

		act(() => vi.advanceTimersByTime(1200))
		// One meter, and the silence marker belongs to the captured source only.
		expect(screen.getAllByRole('meter')).toHaveLength(1)
		expect(screen.getAllByText(m.recordingSilent())).toHaveLength(1)
	})

	it('renders compact meters for the chrome', async () => {
		render(<RecordingIndicator compact startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" />)
		await settle()

		expect(screen.getAllByRole('meter')).toHaveLength(2)
		expect(screen.getByRole('timer')).toBeDefined()
	})

	it('brings the window forward and names the silent source after the configured window', async () => {
		render(<RecordingIndicator startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" />)
		await settle()

		// The microphone keeps sounding; the system loopback never does.
		await advance(60_000, true)
		expect(escalation.message).not.toHaveBeenCalled()

		// Five minutes of silence for the system source, plus the alert's own 15 s tick.
		await advance(4 * 60_000 + 15_000, true)
		expect(escalation.setFocus).toHaveBeenCalledTimes(1)
		expect(escalation.message).toHaveBeenCalledTimes(1)
		expect(escalation.message).toHaveBeenCalledWith(
			m.recordingLongSilence({ name: 'Speakers', minutes: DEFAULT_LONG_SILENCE_MINUTES }),
			expect.objectContaining({ kind: 'warning' }),
		)

		// Once per source per recording: continued silence must not nag.
		await advance(60_000, true)
		expect(escalation.message).toHaveBeenCalledTimes(1)
	})

	it('fires after the configured one-minute window, not after five', async () => {
		escalation.silenceMinutes.value = 1
		render(<RecordingIndicator startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" sources={['system']} />)
		await settle()

		// The silent marker's second, the configured minute, and the alert's 15 s tick.
		await advance(90_000)

		expect(escalation.setFocus).toHaveBeenCalledTimes(1)
		expect(escalation.message).toHaveBeenCalledTimes(1)
		expect(escalation.message).toHaveBeenCalledWith(m.recordingLongSilence({ name: 'Speakers', minutes: 1 }), expect.anything())
	})
})
