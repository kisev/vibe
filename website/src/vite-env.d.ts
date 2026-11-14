/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Base path the build is served under: `/vibe/` or, for the preview, `/vibe/dev/`. */
	readonly VITE_SITE_BASE?: string
	/** `hash` selects the dev preview's hash router; the production build leaves it unset. */
	readonly VITE_SITE_ROUTER?: 'browser' | 'hash'
}

declare module '*.md?raw' {
	const content: string
	export default content
}
