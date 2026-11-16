import ReactDOM from 'react-dom/client'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { unregisterAll } from '@tauri-apps/plugin-global-shortcut'
import './globals.css'
import { CONFIG_KEYS } from './lib/config-keys'
import { loadConfigStore, readConfig } from './lib/config-store'
import { initDownloadEvents } from './lib/downloads'
import { getLocale, getTextDirection, isLocale, setLocale } from './paraglide/runtime.js'
import { runMigrations } from './lib/migrations'
import Root from './root'
import BrowserWindow from './windows/browser-window'

/**
 * Theme, language and direction for a chrome-only window: paraglide resolves the locale at call
 * time, so setting it before the first render is what makes the labels match the app.
 */
function applyAppearance() {
	try {
		applyAppearanceUnsafe()
	} catch (error) {
		// Cosmetic only: a bad config value must not keep the window from opening.
		console.error('could not apply the saved appearance:', error)
	}
}

function applyAppearanceUnsafe() {
	// Only a stored preference wins: with none, Paraglide's own resolved locale (the persisted
	// Paraglide key, then the browser) is already right, and forcing a default would override it.
	const stored = readConfig<string | null>(CONFIG_KEYS.displayLanguage, null)
	if (stored && isLocale(stored)) setLocale(stored, { reload: false })
	const locale = getLocale()
	const theme = readConfig<'light' | 'dark'>(CONFIG_KEYS.theme, window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
	document.documentElement.classList.toggle('dark', theme === 'dark')
	document.documentElement.lang = locale
	document.body.dir = getTextDirection(locale)
}

/**
 * Settings are read synchronously during render, so the config file has to be in memory before the
 * first paint — otherwise the window opens with the default theme and language and then corrects
 * itself. Migrations run after the load because they write through the same store.
 */
async function start() {
	const params = new URLSearchParams(window.location.search)
	const root = document.getElementById('root') as HTMLElement
	// The browser chrome is a chrome-only surface. Booting the whole app here would run device
	// enumeration and server supervision a second time, which is exactly what the main window
	// already does — and what made the chrome behave like a second app. It loads the config
	// store (theme and language must be right before the first paint) but leaves the startup
	// migrations to the non-browser windows below.
	if (params.get('window') === 'browser') {
		// The chrome follows the app's theme and language, so the store must be in memory before
		// the first paint — but it never runs the startup migrations the full boot below owns.
		await loadConfigStore()
		applyAppearance()
		const rawSession = params.get('session')
		const session = Number(rawSession)
		if (rawSession === null || rawSession === '' || !Number.isSafeInteger(session) || session < 0) {
			console.error('browser window opened without a valid session id:', window.location.search)
			// Nothing would ever render here; close the orphan window instead of leaving a blank surface.
			void getCurrentWindow()
				.close()
				.catch((error) => console.error('failed to close the orphan browser window:', error))
			return
		}
		ReactDOM.createRoot(root).render(<BrowserWindow session={session} />)
		return
	}
	await loadConfigStore()
	// One bridge from the Rust download event into the registry, owned by the shell: `/setup`
	// also downloads models, and the settings view that used to listen is not mounted there.
	initDownloadEvents()
	// Migrations write through the same store and can change the saved locale, so the
	// appearance is applied after them — both still run before the first paint.
	runMigrations()
	// Before the first paint: a wrong-language frame on every launch reads as a reset setting.
	applyAppearance()
	// Native registrations outlive a webview reload, including their dead JS callbacks.
	// Clear them before either shortcut provider mounts. Auxiliary windows must never
	// clear the main window's live shortcuts when their own webviews start.
	if (getCurrentWindow().label === 'main') {
		try {
			await unregisterAll()
		} catch (error) {
			console.error('Failed to clear shortcuts from the previous webview:', error)
		}
	}
	ReactDOM.createRoot(root).render(<Root />)
}

void start()
