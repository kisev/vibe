// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import RecordingIndicator from './recording-feedback'

const mocks = vi.hoisted(() => ({
	listen: vi.fn(),
	listeners: new Map<string, (event: { payload: unknown }) => void>(),
}))

vi.mock('@tauri-apps/api/event', () => ({ listen: mocks.listen }))

const level = (device: 'microphone' | 'system', value: number) => {
	act(() => {
		mocks.listeners.get('record_level')?.({ payload: { device, level: value } })
	})
}

/** Let the async `listen()` registration settle before events are delivered. */
const settle = async () => {
	await act(async () => {})
}

beforeEach(() => {
	vi.useFakeTimers()
	vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
	vi.resetAllMocks()
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

		act(() => vi.advanceTimersByTime(1600))
		expect(screen.getAllByText(m.recordingSilent())).toHaveLength(2)

		level('microphone', 0.6)
		act(() => vi.advanceTimersByTime(120))

		// The silent one is the system source; the microphone proved it is live.
		expect(screen.getAllByText(m.recordingSilent())).toHaveLength(1)
		expect(screen.getByRole('meter', { name: `${m.systemAudio()} Speakers` })).toBeDefined()
	})

	it('renders compact meters for the chrome', async () => {
		render(<RecordingIndicator compact startedAt={Date.now()} microphoneName="Camera Mic" systemName="Speakers" />)
		await settle()

		expect(screen.getAllByRole('meter')).toHaveLength(2)
		expect(screen.getByRole('timer')).toBeDefined()
	})
})
