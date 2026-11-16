// Browser-mode end-to-end tests: the app boots with the mock Tauri layer (src/mock-tauri),
// so the real React surfaces render without a native webview or a Rust build.
import { defineConfig } from '@playwright/test'

const PORT = 5199

export default defineConfig({
	testDir: './e2e',
	timeout: 60_000,
	// No retries: the suite serves a built bundle, so a worker's first page is a
	// handful of requests instead of hundreds of dev-server module fetches. The
	// retry that used to hide `ERR_NETWORK_CHANGED` at boot came out once this
	// change proved repeated clean runs without it.
	retries: 0,
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
		// A built bundle, not the dev server: one request graph instead of hundreds
		// of on-demand module fetches, which is what made this host's Chromium drop
		// module loads (ERR_NETWORK_CHANGED) at a worker's first page.
		command: `pnpm build:e2e && pnpm exec vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
		url: `http://127.0.0.1:${PORT}`,
		// Never reuse: a server left on the port by an older run serves a stale
		// module graph, and the whole suite fails at boot for no visible reason.
		reuseExistingServer: false,
		timeout: 240_000,
		stdout: 'pipe',
		stderr: 'pipe',
	},
})
