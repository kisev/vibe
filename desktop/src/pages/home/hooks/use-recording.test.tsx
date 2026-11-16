// @vitest-environment jsdom

import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AudioDevice } from '~/lib/audio'
import { ErrorModalContext } from '~/providers/error-modal'
import { useRecording } from './use-recording'

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(),
	emit: vi.fn(),
	/** Stands in for the persisted config store: key -> value, no disk. */
	persisted: new Map<string, unknown>(),
	/** Subscribers per key, as the real store wakes every window on a shared write. */
	persistedListeners: new Map<string, Set<() => void>>(),
	errorModal: null as { log: string; open: boolean } | null,
	beforeStart: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: (...args: unknown[]) => mocks.invoke(...args) }))
vi.mock('@tauri-apps/api/event', () => ({ emit: (...args: unknown[]) => mocks.emit(...args) }))
vi.mock('~/lib/keep-awake', () => ({ KEEP_AWAKE: { record: 'record' }, startKeepAwake: () => {}, stopKeepAwake: () => {} }))
vi.mock('~/lib/permissions', () => ({ ensureSystemAudioPermission: async () => true }))
vi.mock('~/providers/preference', () => ({ usePreferenceProvider: () => ({ homeTab: 'record' }) }))
vi.mock('~/lib/config-store', async () => {
	const React = await import('react')
	// The real store hands back one stable reference per default value; memoize the
	// defaults the same way, or fresh [] identities retrigger the hook's effects forever.
	const defaults = new Map<string, unknown>()
	return {
		usePersisted: (key: string, initial: unknown) => {
			const [, force] = React.useReducer((n: number) => n + 1, 0)
			if (!defaults.has(key)) defaults.set(key, initial)
			const value = mocks.persisted.has(key) ? mocks.persisted.get(key) : defaults.get(key)
			const setValue = (next: unknown) => {
				const resolved = typeof next === 'function' ? (next as (prev: unknown) => unknown)(value) : next
				mocks.persisted.set(key, resolved)
				force()
			}
			// The real hook subscribes to the store, so a write from another window re-renders it.
			React.useEffect(() => {
				const subscribers = mocks.persistedListeners.get(key) ?? new Set()
				mocks.persistedListeners.set(key, subscribers)
				subscribers.add(force)
				return () => {
					subscribers.delete(force)
				}
			}, [key])
			return [value, setValue]
		},
	}
})

function device(name: string, isInput: boolean, id: string, isDefault = false): AudioDevice {
	return { id, name, isInput, isDefault }
}

function renderRecording() {
	const wrapper = ({ children }: { children: ReactNode }) => (
		<ErrorModalContext.Provider
			value={{ setState: (value: { log: string; open: boolean }) => void (mocks.errorModal = value) } as never}>
			{children}
		</ErrorModalContext.Provider>
	)
	return renderHook(() => useRecording(mocks.beforeStart), { wrapper })
}

/** A write from another window (the browser chrome): same file, every window's subscribers wake. */
function writeFromAnotherWindow(key: string, value: unknown) {
	mocks.persisted.set(key, value)
	for (const subscriber of mocks.persistedListeners.get(key) ?? []) subscriber()
}

beforeEach(() => {
	mocks.invoke.mockReset()
	mocks.errorModal = null
	mocks.beforeStart.mockClear()
	mocks.persisted.clear()
	mocks.persistedListeners.clear()
})

describe('useRecording device enforcement', () => {
	it('blocks the run with an error naming the missing pinned device', async () => {
		mocks.persisted.set('recording.inputDeviceName', 'Bluetooth')
		mocks.invoke.mockImplementation(async (command: string) => {
			if (command === 'get_audio_devices') return [device('Camera Mic', true, '0', true)]
			throw new Error(`unexpected invoke: ${command}`)
		})

		const { result } = renderRecording()
		await waitFor(() => expect(result.current.inputUnavailableName).toBe('Bluetooth'))

		await act(async () => {
			await result.current.startRecord()
		})

		expect(mocks.invoke).not.toHaveBeenCalledWith('start_record', expect.anything())
		expect(mocks.beforeStart).not.toHaveBeenCalled()
		expect(result.current.isRecording).toBe(false)
		expect(mocks.errorModal?.open).toBe(true)
		expect(mocks.errorModal?.log).toContain('Bluetooth')
	})

	it('re-selects a pinned device the moment a refreshed snapshot contains it', async () => {
		mocks.persisted.set('recording.inputDeviceName', 'Camera Mic')
		let snapshot = [device('Camera Mic', true, '0'), device('Bluetooth', true, '1', true)]
		mocks.invoke.mockImplementation(async (command: string) => {
			if (command === 'get_audio_devices') return snapshot
			throw new Error(`unexpected invoke: ${command}`)
		})

		const { result } = renderRecording()
		await waitFor(() => expect(result.current.inputDevice?.name).toBe('Camera Mic'))

		// Unplug: the pin survives as unavailable...
		snapshot = [device('Bluetooth', true, '0', true)]
		await act(async () => {
			await result.current.refreshDevices()
		})
		expect(result.current.inputDevice).toBeNull()
		expect(result.current.inputUnavailableName).toBe('Camera Mic')

		// ...and replug restores the selection without touching the pin.
		snapshot = [device('Bluetooth', true, '0'), device('Camera Mic', true, '1')]
		await act(async () => {
			await result.current.refreshDevices()
		})
		expect(result.current.inputDevice?.name).toBe('Camera Mic')
		expect(result.current.inputUnavailableName).toBeNull()
	})

	it('re-selects a device chosen in another window through the shared config key', async () => {
		mocks.persisted.set('recording.inputDeviceName', 'Camera Mic')
		mocks.invoke.mockImplementation(async (command: string) => {
			if (command === 'get_audio_devices') return [device('Camera Mic', true, '0'), device('USB Mic', true, '1')]
			throw new Error(`unexpected invoke: ${command}`)
		})

		const { result } = renderRecording()
		await waitFor(() => expect(result.current.inputDevice?.name).toBe('Camera Mic'))

		// The browser chrome's picker writes the same key; the main window follows the store.
		act(() => writeFromAnotherWindow('recording.inputDeviceName', 'USB Mic'))

		await waitFor(() => expect(result.current.inputDevice?.name).toBe('USB Mic'))
	})

	it('keeps an explicit "None" instead of falling back to the default device', async () => {
		mocks.invoke.mockImplementation(async (command: string) => {
			if (command === 'get_audio_devices') return [device('Camera Mic', true, '0', true)]
			throw new Error(`unexpected invoke: ${command}`)
		})

		const { result } = renderRecording()
		// Nothing stored yet: the system default stands in.
		await waitFor(() => expect(result.current.inputDevice?.name).toBe('Camera Mic'))

		act(() => result.current.setInputDevice(null))
		// '' is the stored "None"; null would mean "nothing stored" and bring the default back.
		expect(mocks.persisted.get('recording.inputDeviceName')).toBe('')

		// The write re-enumerates the devices; None must survive that refresh.
		await act(async () => {
			await result.current.refreshDevices()
		})
		expect(result.current.inputDevice).toBeNull()
		expect(result.current.inputUnavailableName).toBeNull()
	})

	it('starts with the devices enumerated at start, not the ones from the rendering closure', async () => {
		let snapshot = [device('Camera Mic', true, '0', true)]
		mocks.invoke.mockImplementation(async (command: string) => {
			if (command === 'get_audio_devices') return snapshot
			if (command === 'start_record') return null
			throw new Error(`unexpected invoke: ${command}`)
		})

		const { result } = renderRecording()
		await waitFor(() => expect(result.current.inputDevice?.name).toBe('Camera Mic'))

		// The device set changed since the last render; a stale closure would still name the old mic.
		snapshot = [device('Bluetooth', true, '0', true)]
		await act(async () => {
			await result.current.startRecord()
		})

		expect(mocks.invoke).toHaveBeenCalledWith(
			'start_record',
			expect.objectContaining({ devices: [expect.objectContaining({ name: 'Bluetooth' })] }),
		)
	})

	it('starts normally when every pinned device is present', async () => {
		mocks.persisted.set('recording.inputDeviceName', 'Camera Mic')
		mocks.invoke.mockImplementation(async (command: string) => {
			if (command === 'get_audio_devices') return [device('Camera Mic', true, '0', true)]
			if (command === 'start_record') return null
			throw new Error(`unexpected invoke: ${command}`)
		})

		const { result } = renderRecording()
		await waitFor(() => expect(result.current.inputDevice?.name).toBe('Camera Mic'))

		await act(async () => {
			await result.current.startRecord()
		})

		expect(mocks.invoke).toHaveBeenCalledWith('start_record', expect.objectContaining({ devices: [expect.objectContaining({ name: 'Camera Mic' })] }))
		expect(result.current.isRecording).toBe(true)
	})
})
