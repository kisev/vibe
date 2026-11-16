import { useLocation } from 'react-router-dom'
import { getLocale, type Locale } from '~/paraglide/runtime.js'
import { localeFromSearch } from '~/lib/i18n'

/**
 * The locale the page should render in, read from the live URL rather than once at
 * module load. The hash build keeps `?lang=` in the outer URL, which its router never
 * sees, and a bare history write does not update the router's cached location either,
 * so `window.location` is the one source both builds agree on. The router subscription
 * is kept for in-site navigation, and Layout remounts the routed page on a switch.
 */
export function useLocale(): Locale {
	useLocation()
	const search = typeof window === 'undefined' ? '' : window.location.search
	return localeFromSearch(search) ?? getLocale()
}
