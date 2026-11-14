/**
 * Build inputs that separate the production site from the dev preview. They are
 * baked in at build time — never read at runtime — so neither artifact can drift
 * into behaving like the other.
 */
export type SiteRouter = 'browser' | 'hash'

/**
 * The router the current build was made for: `VITE_SITE_ROUTER=hash` marks the
 * dev preview, whose routes all live after `#` inside `/vibe/dev/`. Anything
 * else keeps the production path routing.
 */
export function siteRouter(): SiteRouter {
	return import.meta.env.VITE_SITE_ROUTER === 'hash' ? 'hash' : 'browser'
}

/** The release site, outside the dev preview's hash base. */
export const productionSiteURL = '/vibe/'
