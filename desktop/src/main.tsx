// Entry point. The imports below are dynamic on purpose: app modules call Tauri APIs at
// import time, so nothing may be evaluated before the browser-mode mock is installed.
async function boot() {
	// The browser suite serves a production build, so the mock is opted in by the
	// `e2e` build mode; a real build uses another mode and never carries it.
	const mockRequested = import.meta.env.DEV || import.meta.env.MODE === 'e2e'
	if (mockRequested && !('__TAURI_INTERNALS__' in window)) {
		const { installMockTauri } = await import('./mock-tauri')
		installMockTauri()
	}
	await import('./bootstrap')
}

boot()
