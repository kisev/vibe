import { expect, test } from '@playwright/test'
import { boot, goToSection, openSettings, settingsNav } from './helpers'

// Switching the interface language re-renders in place. A reload would also close
// Settings, so the dialog and the navigation counter are what prove it did not.

test('changing the display language re-renders the open settings surface', async ({ page }) => {
	let navigations = 0
	page.on('framenavigated', () => {
		navigations += 1
	})

	await boot(page)
	await openSettings(page)
	await goToSection(page, 'General')

	await expect(page.getByRole('button', { name: 'Display language' })).toBeVisible()
	await page.getByRole('button', { name: 'Display language' }).click()

	const search = page.getByRole('textbox', { name: 'Display language' })
	await search.fill('russian')
	const beforeSwitch = navigations
	await page.getByRole('button', { name: /русский/i }).click()

	// The open surface is now Russian, and it is still the same page load.
	await expect(settingsNav(page).getByRole('button', { name: 'Общие', exact: true })).toBeVisible()
	await expect(page.getByRole('heading', { level: 2 })).toHaveText('Общие')
	await expect(page.getByRole('button', { name: 'General', exact: true })).toHaveCount(0)
	expect(navigations).toBe(beforeSwitch)
	expect(await page.evaluate(() => window.localStorage.getItem('PARAGLIDE_LOCALE'))).toBe('ru-RU')
})
