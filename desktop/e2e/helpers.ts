// Shared plumbing for the browser-mode suite: opening Settings and driving the mock
// backend's test surface (`window.__vibeMockTauri`, installed by src/mock-tauri).
import { expect, type Page } from '@playwright/test'

/** One frontend -> backend command, as the mock saw it. */
export interface MockInvocation {
	cmd: string
	args: Record<string, unknown>
}

interface MockTauriControls {
	calls(): MockInvocation[]
	callsFor(cmd: string): MockInvocation[]
	clearCalls(): void
	override(cmd: string, handler: (args: Record<string, unknown>) => unknown): void
	restore(cmd: string): void
	reset(): void
	emit(event: string, payload?: unknown): void
}

type MockWindow = Window & { __vibeMockTauri: MockTauriControls }

export async function mockCalls(page: Page, cmd: string): Promise<MockInvocation[]> {
	// The callback runs in the page, so it must reach the surface through `window`.
	return page.evaluate((name) => (window as unknown as MockWindow).__vibeMockTauri.callsFor(name), cmd)
}

/** Wait until the app has booted against the mock (the Recents sidebar is its first surface). */
export async function boot(page: Page): Promise<void> {
	await page.goto('/')
	// Locale-independent: the wordmark does not translate, and the shell is mounted.
	await expect(page.getByText('Vibe', { exact: true }).first()).toBeVisible()
	await expect(page.locator('header[data-tauri-drag-region]').first()).toBeVisible()
}

/** Open Settings through the same event the tray/menu uses, after per-test overrides are in place. */
export async function openSettings(page: Page): Promise<void> {
	await page.evaluate(() => window.dispatchEvent(new CustomEvent('vibe:open-settings')))
	await expect(settingsNav(page)).toBeVisible()
}

/** The settings sidebar; its accessible name is translated, so match the landmark instead. */
export const settingsNav = (page: Page) => page.getByRole('navigation')

export const sectionHeading = (page: Page) => page.getByRole('heading', { level: 2 })

export async function goToSection(page: Page, label: string): Promise<void> {
	await settingsNav(page).getByRole('button', { name: label, exact: true }).click()
	await expect(sectionHeading(page)).toHaveText(label)
}

/** The error boundary renders a dialog whose log starts with "Boundary error:". */
export async function expectNoBoundary(page: Page): Promise<void> {
	await expect(page.getByText('Boundary error:', { exact: false })).toHaveCount(0)
}

/** Poll until the mock has seen `count` commands with this name. */
export async function waitForCalls(page: Page, cmd: string, count = 1): Promise<MockInvocation[]> {
	await expect.poll(async () => (await mockCalls(page, cmd)).length, { timeout: 10_000 }).toBe(count)
	return mockCalls(page, cmd)
}

/** Replace one command's return value for the rest of the test. */
export async function overrideCommand(page: Page, cmd: string, value: unknown): Promise<void> {
	await page.evaluate(
		({ cmd, value }) => {
			;(window as unknown as MockWindow).__vibeMockTauri.override(cmd, () => value)
		},
		{ cmd, value },
	)
}

/** Replace one command's return value with a different value on each call (last one repeats). */
export async function overrideCommandSequence(page: Page, cmd: string, values: unknown[]): Promise<void> {
	await page.evaluate(
		({ cmd, values }) => {
			let index = 0
			;(window as unknown as MockWindow).__vibeMockTauri.override(cmd, () => values[Math.min(index++, values.length - 1)])
		},
		{ cmd, values },
	)
}

/** Deliver a backend event to every listening frontend handler. */
export async function emitMockEvent(page: Page, event: string, payload?: unknown): Promise<void> {
	await page.evaluate(
		({ event, payload }) => {
			;(window as unknown as MockWindow).__vibeMockTauri.emit(event, payload)
		},
		{ event, payload },
	)
}
