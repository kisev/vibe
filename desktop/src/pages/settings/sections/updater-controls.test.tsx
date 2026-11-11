// @vitest-environment jsdom
//
// The controls are pure rendering over the provider's state: these tests drive the
// context value directly, so every phase is reachable without the Tauri updater.
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import { UpdaterContext, type UpdaterContextType } from '~/providers/updater'
import { UpdateControls } from './updater-controls'

vi.mock('@tauri-apps/api/app', () => ({
	getVersion: async () => '1.0.0',
}))

const noop = () => {}

function renderWith(overrides: Partial<UpdaterContextType> = {}) {
	const value: UpdaterContextType = {
		availableUpdate: false,
		setAvailableUpdate: noop,
		updating: false,
		setUpdating: noop,
		setManifest: noop,
		updateApp: vi.fn(async () => {}),
		checkNow: vi.fn(async () => {}),
		checkState: 'current',
		checkError: null,
		lastCheckedAt: null,
		progress: null,
		fakeUpdate: false,
		setFakeUpdate: noop,
		channel: 'stable',
		setChannel: vi.fn(),
		...overrides,
	}
	const utils = render(
		<UpdaterContext.Provider value={value}>
			<UpdateControls />
		</UpdaterContext.Provider>,
	)
	return { ...utils, value }
}

afterEach(cleanup)

describe('update controls', () => {
	it('shows the installed version and all three channels, and switches on click', async () => {
		const user = userEvent.setup()
		const { value } = renderWith()

		expect(await screen.findByText('1.0.0')).toBeTruthy()
		for (const label of [m.channelRelease(), m.channelBeta(), m.channelDev()]) {
			expect(screen.getByRole('radio', { name: label })).toBeTruthy()
		}
		expect(screen.getByRole('radio', { name: m.channelRelease() }).getAttribute('aria-checked')).toBe('true')

		await user.click(screen.getByRole('radio', { name: m.channelDev() }))
		expect(value.setChannel).toHaveBeenCalledWith('dev')
	})

	it('reports a finished check with its time and checks again on demand', async () => {
		const user = userEvent.setup()
		const lastCheckedAt = new Date(2026, 0, 2, 3, 4).getTime()
		const { value } = renderWith({ checkState: 'current', lastCheckedAt })

		expect(screen.getByText(m.updateUpToDate())).toBeTruthy()
		await user.click(screen.getByRole('button', { name: m.checkForUpdates() }))
		expect(value.checkNow).toHaveBeenCalled()
	})

	it('offers the found version and hands installation to the provider', async () => {
		const user = userEvent.setup()
		const { value } = renderWith({
			checkState: 'available',
			availableUpdate: true,
			manifest: { version: '1.1.0', currentVersion: '1.0.0' },
		})

		expect(screen.getByText(m.updateAvailableVersion({ version: '1.1.0' }))).toBeTruthy()
		await user.click(screen.getByRole('button', { name: m.updateNow() }))
		expect(value.updateApp).toHaveBeenCalled()
	})

	it('surfaces the failure text and re-enables the check', () => {
		renderWith({ checkState: 'error', checkError: 'manifest unreachable' })

		expect(screen.getByText(m.updateFailed())).toBeTruthy()
		expect(screen.getByText('manifest unreachable')).toBeTruthy()
		const check = screen.getByRole('button', { name: m.checkForUpdates() }) as HTMLButtonElement
		expect(check.disabled).toBe(false)
	})

	it('explains the semver boundary when a release install selects Dev', async () => {
		renderWith({ channel: 'dev' })

		expect(await screen.findByText(m.updateDevBoundary())).toBeTruthy()
	})
})
