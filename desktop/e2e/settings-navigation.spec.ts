import { expect, test } from '@playwright/test'
import { boot, expectNoBoundary, goToSection, openSettings, sectionHeading, settingsNav } from './helpers'

// Every settings surface the user can reach today. A crash inside one of them used to
// mean finding out from a dev build, so each entry is opened and checked for the
// error boundary, not just for a heading.
const sections = [
	{ label: 'General', content: 'Installed version' },
	{ label: 'Privacy', content: null },
	{ label: 'Transcription', content: null },
	{ label: 'Models', content: 'Compare models' },
	{ label: 'Tuning', content: null },
	{ label: 'Recording', content: 'Open in Vibe' },
	{ label: 'Dictation', content: null },
	{ label: 'AI Assistant', content: null },
	{ label: 'Phone', content: null },
	{ label: 'Agents', content: 'API server is off' },
	{ label: 'Advanced', content: null },
]

test.beforeEach(async ({ page }) => {
	await boot(page)
	await openSettings(page)
})

test('every settings section renders without hitting the error boundary', async ({ page }) => {
	for (const section of sections) {
		await goToSection(page, section.label)
		await expectNoBoundary(page)
		if (section.content) {
			await expect(page.getByText(section.content, { exact: false }).first()).toBeVisible()
		}
	}
})

test('the meeting browser settings live under Recording and expose the open-link flow', async ({ page }) => {
	await goToSection(page, 'Recording')
	await expect(page.getByRole('heading', { name: 'Meeting hosts' })).toBeVisible()
	await expect(page.getByRole('textbox', { name: 'Link to open' })).toBeVisible()
	await expect(page.getByRole('button', { name: 'Open', exact: true })).toBeDisabled()
	await expectNoBoundary(page)
})

test('the Agents section shows the API switch and the skill actions', async ({ page }) => {
	await goToSection(page, 'Agents')
	await expect(page.getByText('API server is off')).toBeVisible()
	await expect(page.getByRole('switch')).toBeVisible()
	await expect(page.getByText('Copy Agent Skill instructions')).toBeVisible()
	await expectNoBoundary(page)
})

test('the Updates controls sit in General with the three channel names', async ({ page }) => {
	await goToSection(page, 'General')
	await expect(page.getByText('Updates', { exact: true })).toBeVisible()
	for (const label of ['Release', 'Beta', 'Dev']) {
		await expect(page.getByRole('radio', { name: label })).toBeVisible()
	}
	await expectNoBoundary(page)
})

test('Settings closes and leaves the main window usable', async ({ page }) => {
	await page.getByRole('button', { name: 'Close', exact: true }).click()
	await expect(settingsNav(page)).toHaveCount(0)
	await expect(page.getByRole('button', { name: 'New transcription' })).toBeVisible()
})

test('the section heading follows the sidebar selection', async ({ page }) => {
	await goToSection(page, 'Privacy')
	await expect(sectionHeading(page)).toHaveText('Privacy')
	await settingsNav(page).getByRole('button', { name: 'Models', exact: true }).click()
	await expect(sectionHeading(page)).toHaveText('Models')
})
