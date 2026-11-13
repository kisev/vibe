import { useLocation } from 'react-router-dom'
import { getLocale, type Locale } from '~/paraglide/runtime.js'
import { localeFromSearch } from '~/lib/i18n'

/**
 * The locale the page should render in, read from the live URL rather than once at
 * module load. The language switcher stores the choice and writes `?lang=` without
 * triggering a router navigation, so reading the router's cached location would
 * hand back the previous language after a switch; `window.location` is already
 * updated. The router subscription is kept for in-site navigation, and Layout
 * remounts the routed page on a switch.
 */
export function useLocale(): Locale {
	useLocation()
	const search = typeof window === 'undefined' ? '' : window.location.search
	return localeFromSearch(search) ?? getLocale()
}
