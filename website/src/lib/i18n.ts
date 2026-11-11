import localeRegistry from '../../../i18n/locales.json'
import type { Locale } from '../paraglide/runtime.js'

type MessageFunction = (params?: Record<string, unknown>) => unknown

export const supportedWebsiteLocales = localeRegistry.filter((locale) => locale.website).map(({ code }) => code)

/** The query parameter a shared link carries the chosen language in. */
export const websiteLocaleParam = 'lang'

export function isSupportedWebsiteLocale(value: string | null | undefined): value is Locale {
	return typeof value === 'string' && supportedWebsiteLocales.includes(value)
}

/** Reads a supported locale out of a URL search string; unsupported and empty values are ignored. */
export function localeFromSearch(search: string): Locale | undefined {
	const value = new URLSearchParams(search).get(websiteLocaleParam)
	return isSupportedWebsiteLocale(value) ? value : undefined
}

/**
 * The same URL with `?lang=` set, keeping every other search parameter and the
 * hash. Takes the origin from `base` so it can run without a live document.
 */
export function urlWithLocale(href: string, locale: Locale, base = 'http://localhost'): string {
	const url = new URL(href, base)
	url.searchParams.set(websiteLocaleParam, locale)
	return `${url.pathname}${url.search}${url.hash}`
}

/** Writes the chosen locale into the address bar without adding a history entry or reloading. */
export function writeLocaleToUrl(locale: Locale): void {
	if (typeof window === 'undefined') return
	window.history.replaceState(window.history.state, '', urlWithLocale(window.location.href, locale, window.location.origin))
}

export function safeTranslate(messages: Record<string, unknown>, key: string, fallback: string, params?: Record<string, unknown>) {
	const message = messages[key]
	return typeof message === 'function' ? String((message as MessageFunction)(params)) : fallback
}
