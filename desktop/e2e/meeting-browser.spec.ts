import { expect, test } from '@playwright/test'
import { boot, emitMockEvent, goToSection, openSettings, overrideCommand, waitForCalls } from './helpers'

// The meeting browser lives in a native window the browser-mode suite cannot open.
// What can be checked is the contract around it: the URL handed to the backend, and
// the two decisions the main window answers on the meeting window's behalf.

test('a bare domain is normalized to https before the command runs', async ({ page }) => {
	await boot(page)
	await openSettings(page)
	await goToSection(page, 'Recording')

	const field = page.getByRole('textbox', { name: 'Link to open' })
	await field.fill('example.com/standup')
	await page.getByRole('button', { name: 'Open', exact: true }).click()

	const opened = await waitForCalls(page, 'open_meeting_browser')
	expect(opened[0]?.args.url).toBe('https://example.com/standup')
})

test('a failed page load asks to retry or close, then retries', async ({ page }) => {
	await boot(page)
	await emitMockEvent(page, 'meeting-browser-load-failed', { session: 7 })

	const asks = await waitForCalls(page, 'plugin:dialog|ask')
	expect(asks[0]?.args).toMatchObject({
		title: 'Page did not open',
		message: 'The page could not be loaded. Try again, or close the window?',
		yesButtonLabel: 'Try again',
		noButtonLabel: 'Close browser',
	})
	// The mock dialog answers yes, so the handler retries the page.
	const retried = await waitForCalls(page, 'meeting_browser_retry')
	expect(retried[0]?.args.session).toBe(7)
})

test('a failed page load closes the window when the user declines the retry', async ({ page }) => {
	await boot(page)
	await overrideCommand(page, 'plugin:dialog|ask', false)
	await emitMockEvent(page, 'meeting-browser-load-failed', { session: 8 })

	const closed = await waitForCalls(page, 'meeting_browser_close')
	expect(closed[0]?.args.session).toBe(8)
})

test('a close request with a running recording asks to stop or keep recording', async ({ page }) => {
	await boot(page)

	await emitMockEvent(page, 'meeting-browser-close-requested', { session: 9 })
	const asks = await waitForCalls(page, 'plugin:dialog|ask')
	expect(asks[0]?.args).toMatchObject({
		title: 'Close the meeting window?',
		message: 'A recording is running. Stop it before closing, or keep recording in the background?',
		yesButtonLabel: 'Stop and close',
		noButtonLabel: 'Keep recording',
	})
	// The mock dialog answers yes: stop the recording and close.
	const confirmed = await waitForCalls(page, 'meeting_browser_confirm_close')
	expect(confirmed[0]?.args).toMatchObject({ session: 9, stopRecording: true })
})

test('a close request keeps the recording when the user declines to stop', async ({ page }) => {
	await boot(page)
	await overrideCommand(page, 'plugin:dialog|ask', false)
	await emitMockEvent(page, 'meeting-browser-close-requested', { session: 10 })

	const confirmed = await waitForCalls(page, 'meeting_browser_confirm_close')
	expect(confirmed[0]?.args).toMatchObject({ session: 10, stopRecording: false })
})
