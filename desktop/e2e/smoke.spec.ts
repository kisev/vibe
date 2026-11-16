import { expect, test } from '@playwright/test'

test('the app boots against the mocked backend', async ({ page }) => {
	await page.goto('/')
	await expect(page.locator('body')).toBeVisible()
	// The mock installs `__TAURI_INTERNALS__`; without it the app would call the real API.
	expect(await page.evaluate(() => '__TAURI_INTERNALS__' in window)).toBe(true)
})
