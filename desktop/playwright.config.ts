// Browser-mode end-to-end tests: the app boots with the mock Tauri layer (src/mock-tauri),
// so the real React surfaces render without a native webview or a Rust build.
import { defineConfig } from '@playwright/test'

const PORT = 5199

export default defineConfig({
	testDir: './e2e',
	timeout: 60_000,
	expect: { timeout: 10_000 },
	reporter: [['list']],
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: 'retain-on-failure',
		// A system Chromium keeps the suite runnable on hosts that cannot download the
		// bundled build; CI leaves this unset and uses Playwright's own browser.
		launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
	},
	webServer: {
		command: `pnpm dev --port ${PORT} --strictPort`,
		url: `http://127.0.0.1:${PORT}`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
})
