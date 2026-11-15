// Shared plumbing for the browser-mode suite: opening Settings and driving the mock
// backend's test surface (`window.__vibeMockTauri`, installed by src/mock-tauri).
import { expect, type Page } from '@playwright/test'
// The mock's own types are the single source; a local copy here would drift silently.
import type { MockInvocation, MockTauriControls } from '../src/mock-tauri/runtime'

export type { MockInvocation }

type MockWindow = Window & { __vibeMockTauri?: MockTauriControls }

/** Shown when a helper runs before `boot(page)` or against a build made without `--mode e2e`. */
const MISSING_MOCK = '__vibeMockTauri is missing: call boot(page) first and serve a build made with --mode e2e'

export async function mockCalls(page: Page, cmd: string): Promise<MockInvocation[]> {
	// The callback runs in the page, so it must reach the surface through `window`.
	return page.evaluate(
		({ name, missing }) => {
			const controls = (window as unknown as MockWindow).__vibeMockTauri
			if (!controls) throw new Error(missing)
			return controls.callsFor(name)
		},
		{ name: cmd, missing: MISSING_MOCK },
	)
}

/** Wait until the app has booted against the mock (the Recents sidebar is its first surface). */
export async function boot(page: Page): Promise<void> {
	await page.goto('/')
	// Locale-independent: the drag-region header proves the shell mounted. The wordmark
	// is translated in some locales ("Vibe !", "वाइब!"), so it cannot be matched verbatim.
	await expect(page.locator('header[data-tauri-drag-region]').first()).toBeVisible()
}

/** Open Settings through the same event the tray/menu uses, after per-test overrides are in place. */
export async function openSettings(page: Page): Promise<void> {
	await page.evaluate(() => window.dispatchEvent(new CustomEvent('vibe:open-settings')))
	await expect(settingsNav(page)).toBeVisible()
}

/** The settings sidebar; its accessible name is translated, so match the landmark instead. */
export const settingsNav = (page: Page) => page.getByRole('navigation')

/** The settings sheet: the sidebar div (`nav` parent) and the section column share it. */
const settingsSurface = (page: Page) => settingsNav(page).locator('xpath=../..')

/**
 * The active section's title. It must stay scoped to the settings sheet: the main page
 * remains in the accessibility tree behind the overlay and renders its own h2
 * ("Recording ready"), so a document-wide lookup can match two elements.
 */
export const sectionHeading = (page: Page) => settingsSurface(page).getByRole('heading', { level: 2 })

export async function goToSection(page: Page, label: string): Promise<void> {
	await settingsNav(page).getByRole('button', { name: label, exact: true }).click()
	await expect(sectionHeading(page)).toHaveText(label)
}

/** The error boundary renders a dialog whose log starts with "Boundary error:". */
export async function expectNoBoundary(page: Page): Promise<void> {
	await expect(page.getByText('Boundary error:', { exact: false })).toHaveCount(0)
}

/** Poll until the mock has seen at least `count` commands with this name. */
export async function waitForCalls(page: Page, cmd: string, count = 1): Promise<MockInvocation[]> {
	// At least, not exactly: a command may legitimately run twice between two polls, and
	// an exact match would then never settle even though the calls the test needs exist.
	await expect.poll(async () => (await mockCalls(page, cmd)).length, { timeout: 10_000 }).toBeGreaterThanOrEqual(count)
	return mockCalls(page, cmd)
}

/** Replace one command's return value for the rest of the test. */
export async function overrideCommand(page: Page, cmd: string, value: unknown): Promise<void> {
	await page.evaluate(
		({ cmd, value, missing }) => {
			const controls = (window as unknown as MockWindow).__vibeMockTauri
			if (!controls) throw new Error(missing)
			controls.override(cmd, () => value)
		},
		{ cmd, value, missing: MISSING_MOCK },
	)
}

/** Replace one command's return value with a different value on each call (last one repeats). */
export async function overrideCommandSequence(page: Page, cmd: string, values: unknown[]): Promise<void> {
	if (values.length === 0) throw new Error(`overrideCommandSequence: empty sequence for command "${cmd}"`)
	await page.evaluate(
		({ cmd, values, missing }) => {
			const controls = (window as unknown as MockWindow).__vibeMockTauri
			if (!controls) throw new Error(missing)
			let index = 0
			controls.override(cmd, () => values[Math.min(index++, values.length - 1)])
		},
		{ cmd, values, missing: MISSING_MOCK },
	)
}

/** Deliver a backend event to every listening frontend handler. */
export async function emitMockEvent(page: Page, event: string, payload?: unknown): Promise<void> {
	await page.evaluate(
		({ event, payload, missing }) => {
			const controls = (window as unknown as MockWindow).__vibeMockTauri
			if (!controls) throw new Error(missing)
			controls.emit(event, payload)
		},
		{ event, payload, missing: MISSING_MOCK },
	)
}
