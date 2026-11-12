import { expect, test, type Page } from '@playwright/test'
import { boot, goToSection, openSettings, overrideCommand, overrideCommandSequence } from './helpers'

// The comparison lab is where a bogus "no differences" report used to hide real
// differences. These checks run the real section against the mock backend and read
// the result surface the user sees.

const segment = (text: string) => ({ segments: [{ start: 0, stop: 1000, text }] })

async function runComparison(page: Page) {
	const compare = page.locator('section', { has: page.getByRole('heading', { name: 'Compare models', level: 3 }) })
	await compare.getByRole('button', { name: 'Choose audio file' }).click()
	// The mock file dialog hands back /mock/documents/sample.mp3.
	await expect(compare.getByText('sample.mp3')).toBeVisible()

	const models = compare.locator('button[aria-pressed]')
	await expect(models).toHaveCount(2)
	await models.nth(0).click()
	await models.nth(1).click()

	await compare.getByRole('button', { name: 'Run comparison' }).click()
	const results = compare.getByRole('button', { name: 'Compare results' })
	await expect(results).toBeVisible()
	await results.click()
	return page.getByRole('dialog')
}

test.beforeEach(async ({ page }) => {
	await boot(page)
	// Loading is not what this test is about, and the mock's real transcribe takes seconds.
	await overrideCommand(page, 'load_model', 'ok')
	await openSettings(page)
	await goToSection(page, 'Models')
})

test('complete diffs show the added and removed word counts', async ({ page }) => {
	await overrideCommandSequence(page, 'transcribe', [segment('The quick brown fox'), segment('The quick red fox jumps')])

	const dialog = await runComparison(page)
	await expect(dialog.getByText('+2 −1')).toBeVisible()
	await expect(dialog.getByText('+0 −0')).toHaveCount(0)
})

test('an over-budget diff says so instead of reporting zero differences', async ({ page }) => {
	// 20,001 tokens is over the diff budget, so the candidate cannot be compared.
	const overBudget = 'word '.repeat(20_001)
	await overrideCommandSequence(page, 'transcribe', [segment('Short input'), segment(overBudget)])

	const dialog = await runComparison(page)
	await expect(dialog.getByText('Too long to highlight differences')).toBeVisible()
	await expect(dialog.getByText('+0 −0')).toHaveCount(0)
})
