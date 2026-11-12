import { expect, test } from '@playwright/test'
import { boot, goToSection, mockCalls, openSettings, overrideCommand } from './helpers'

// The switch is the user's intent, not a view of whichever process happens to be
// alive, so the state it opens with must come from the backend and every toggle
// must go through the matching command.

test('the switch shows the persisted state on load', async ({ page }) => {
	await boot(page)
	// A previous session left the API server on.
	await overrideCommand(page, 'api_server_enabled', true)
	await overrideCommand(page, 'get_api_base_url', 'http://127.0.0.1:33333')

	await openSettings(page)
	await goToSection(page, 'Agents')

	await expect(page.getByText('API server is running')).toBeVisible()
	await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
	expect((await mockCalls(page, 'api_server_enabled')).length).toBeGreaterThan(0)
})

test('turning the switch on starts the server and turning it off stops it', async ({ page }) => {
	await boot(page)
	await openSettings(page)
	await goToSection(page, 'Agents')

	await expect(page.getByText('API server is off')).toBeVisible()
	await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false')

	await page.getByRole('switch').click()
	await expect(page.getByText('API server is running')).toBeVisible()
	await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'true')

	const starts = await mockCalls(page, 'start_api_server')
	expect(starts).toHaveLength(1)
	expect(starts[0]?.args).toHaveProperty('unloadTimeoutMinutes')
	expect(typeof starts[0]?.args.unloadTimeoutMinutes).toBe('number')

	await page.getByRole('switch').click()
	await expect(page.getByText('API server is off')).toBeVisible()
	await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
	expect(await mockCalls(page, 'stop_api_server')).toHaveLength(1)
})
