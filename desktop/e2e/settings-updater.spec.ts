import { expect, test } from '@playwright/test'
import { boot, goToSection, mockCalls, openSettings, overrideCommand } from './helpers'

// Update lines are product names, Beta is candidate-only, and a release that has no
// entry on the selected line must never be presented as an available version.

test('the channel names stay Release, Beta and Dev in a translated interface', async ({ page }) => {
	await page.addInitScript(() => {
		// Paraglide reads the locale from localStorage before the first render.
		window.localStorage.setItem('PARAGLIDE_LOCALE', 'ru-RU')
	})
	await boot(page)
	await openSettings(page)
	await goToSection(page, 'Общие')

	// The rest of the surface is translated...
	await expect(page.getByText('Обновления', { exact: true })).toBeVisible()
	// ...but the channel names are not.
	const channels = page.getByRole('radiogroup', { name: 'Канал обновлений' })
	await expect(channels.getByRole('radio')).toHaveCount(3)
	for (const label of ['Release', 'Beta', 'Dev']) {
		await expect(channels.getByRole('radio', { name: label, exact: true })).toBeVisible()
	}
})

test('Beta with an absent manifest reports no candidate instead of a version', async ({ page }) => {
	await boot(page)
	await overrideCommand(page, 'update_check', null)
	await openSettings(page)
	await goToSection(page, 'General')

	await page.getByRole('radio', { name: 'Beta' }).click()

	await expect(page.getByText('No candidate on this line')).toBeVisible()
	await expect(page.getByText(/Version .* is available/)).toHaveCount(0)
})

test('Beta with an empty manifest reports no candidate instead of an empty version', async ({ page }) => {
	await boot(page)
	await overrideCommand(page, 'update_check', {})
	await openSettings(page)
	await goToSection(page, 'General')

	await page.getByRole('radio', { name: 'Beta' }).click()

	await expect(page.getByText('No candidate on this line')).toBeVisible()
	await expect(page.getByText(/Version .* is available/)).toHaveCount(0)
})

test('the changelog link opens the dev channel for a dev build', async ({ page }) => {
	await boot(page)
	await overrideCommand(page, 'plugin:app|version', '1.0.0-dev.75')
	// Keep the check hermetic: record the URL, never attempt the navigation.
	await overrideCommand(page, 'plugin:opener|open_url', null)

	await openSettings(page)
	await goToSection(page, 'General')

	const versionButton = page.getByRole('button', { name: /1\.0\.0-dev\.75/ })
	await expect(versionButton).toBeVisible()
	await versionButton.click()

	const opened = await mockCalls(page, 'plugin:opener|open_url')
	expect(opened).toHaveLength(1)
	expect(String(opened[0]?.args.url)).toMatch(/\/changelog\/dev$/)
})
