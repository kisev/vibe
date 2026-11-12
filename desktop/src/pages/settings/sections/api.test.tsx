// @vitest-environment jsdom
//
// The switch states an intent, not a process: these tests drive the view-model's
// fields directly, so the "server is alive" and "user wants it" cases can disagree.
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import type { SettingsViewModel } from './shared'
import { ApiSection } from './api'

vi.mock('@tauri-apps/plugin-opener', () => ({ openUrl: vi.fn() }))

const runningUrl = 'http://127.0.0.1:4242'

function apiViewModel(overrides: Partial<SettingsViewModel> = {}): SettingsViewModel {
	return {
		apiEnabled: false,
		apiBaseUrl: null,
		isStartingApiServer: false,
		isStoppingApiServer: false,
		startApiServer: vi.fn(async () => {}),
		stopApiServer: vi.fn(async () => {}),
		installAgentSkill: vi.fn(),
		copyAgentSkill: vi.fn(),
		revealConfigFile: vi.fn(),
		...overrides,
	} as unknown as SettingsViewModel
}

function toggle(): HTMLElement {
	return screen.getByRole('switch')
}

afterEach(cleanup)

describe('local API section', () => {
	it('defaults the switch to off', () => {
		render(<ApiSection vm={apiViewModel()} />)

		expect(toggle().getAttribute('aria-checked')).toBe('false')
	})

	it('stays off while a transcription process is alive', () => {
		// A model load for transcription starts the shared server, but that is not the user's
		// choice: the base URL exists while the intent is still off.
		render(<ApiSection vm={apiViewModel({ apiEnabled: false, apiBaseUrl: runningUrl })} />)

		expect(toggle().getAttribute('aria-checked')).toBe('false')
	})

	it('reads on from the persisted intent', () => {
		render(<ApiSection vm={apiViewModel({ apiEnabled: true })} />)

		expect(toggle().getAttribute('aria-checked')).toBe('true')
	})

	it('starts the server when turned on and stops it when turned off', async () => {
		const user = userEvent.setup()
		const off = apiViewModel({ apiEnabled: false })
		const { unmount } = render(<ApiSection vm={off} />)
		await user.click(toggle())
		expect(off.startApiServer).toHaveBeenCalledTimes(1)
		unmount()

		const on = apiViewModel({ apiEnabled: true, apiBaseUrl: runningUrl })
		render(<ApiSection vm={on} />)
		await user.click(toggle())
		expect(on.stopApiServer).toHaveBeenCalledTimes(1)
	})

	it('keeps the docs and skill rows disabled until a base URL exists', () => {
		const { unmount } = render(<ApiSection vm={apiViewModel({ apiEnabled: true })} />)
		expect((screen.getByRole('button', { name: m.swaggerDocs() }) as HTMLButtonElement).disabled).toBe(true)
		expect((screen.getByRole('button', { name: m.copyAgentSkill() }) as HTMLButtonElement).disabled).toBe(true)
		unmount()

		render(<ApiSection vm={apiViewModel({ apiEnabled: true, apiBaseUrl: runningUrl })} />)
		expect((screen.getByRole('button', { name: m.swaggerDocs() }) as HTMLButtonElement).disabled).toBe(false)
		expect((screen.getByRole('button', { name: m.copyAgentSkill() }) as HTMLButtonElement).disabled).toBe(false)
	})
})
