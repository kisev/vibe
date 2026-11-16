import { useCallback, useEffect, useState } from 'react'
import { getLocale, getTextDirection, setLocale, type Locale } from '../paraglide/runtime.js'
import { localeFromSearch, supportedWebsiteLocales, websiteLocaleParam, writeLocaleToUrl } from '~/lib/i18n'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { siteRouter } from '~/lib/site'
import useUrlActions from '~/lib/useUrlActions'
import DevBanner from './DevBanner'
import Footer from './Footer'
import Nav from './Nav'
import PrivacyPolicy from './PrivacyPolicy'

export default function Layout() {
	const location = useLocation()
	const navigate = useNavigate()
	const [privacyOpen, setPrivacyOpen] = useState(false)
	// The entry point resolves a supported ?lang= into Paraglide before the first render, so the
	// first paint already speaks the shared language; here the state just starts from the same value.
	const [locale, setCurrentLocale] = useState<Locale>(() => localeFromSearch(location.search) ?? getLocale())
	const direction = getTextDirection(locale)
	const availableLocales = supportedWebsiteLocales as readonly Locale[]
	const onOpenPrivacyPolicy = useCallback(() => setPrivacyOpen(true), [])
	const onLocaleChange = useCallback(
		(nextLocale: Locale) => {
			setLocale(nextLocale, { reload: false })
			setCurrentLocale(nextLocale)
			// The path-routed site switches through the router, so its cached location never
			// disagrees with the address bar. The hash build keeps its language in the outer
			// URL, where a router navigation cannot reach it.
			if (siteRouter() === 'browser') {
				const search = new URLSearchParams(location.search)
				search.set(websiteLocaleParam, nextLocale)
				navigate({ pathname: location.pathname, search: `?${search.toString()}`, hash: location.hash }, { replace: true })
				return
			}
			writeLocaleToUrl(nextLocale)
		},
		[location.pathname, location.search, location.hash, navigate],
	)

	// A supported ?lang= outranks the stored choice and becomes the stored choice for the next visit.
	useEffect(() => {
		const fromUrl = localeFromSearch(location.search)
		if (!fromUrl) return
		if (fromUrl !== getLocale()) setLocale(fromUrl, { reload: false })
		if (fromUrl !== locale) setCurrentLocale(fromUrl)
	}, [location.pathname, location.search, locale])

	// Keep lang in the URL so in-site navigation and shared links carry the choice.
	useEffect(() => {
		// A fresh ?lang= outranks a locale state that has not committed yet: writing the
		// previous value here would clobber the address bar for a render.
		const fromUrl = localeFromSearch(window.location.search)
		if (fromUrl && fromUrl !== locale) return
		writeLocaleToUrl(locale)
	}, [location.pathname, location.search, locale])

	// Both document attributes follow the active locale, so RTL applies to the whole site.
	useEffect(() => {
		document.documentElement.lang = locale
		document.documentElement.setAttribute('dir', direction)
		document.body.setAttribute('dir', direction)
	}, [locale, direction])

	useUrlActions({
		'open-privacy-policy': onOpenPrivacyPolicy,
	})

	return (
		<div dir={direction} className="flex min-h-dvh flex-col bg-background text-foreground">
			<DevBanner />
			<Nav locale={locale} availableLocales={availableLocales} onLocaleChange={onLocaleChange} />
			<main className="flex-1">
				{/* Paraglide reads the locale at call time, so a language switch remounts the page. */}
				<Outlet key={locale} />
			</main>
			<Footer onOpenPrivacyPolicy={onOpenPrivacyPolicy} />
			<PrivacyPolicy open={privacyOpen} onOpenChange={setPrivacyOpen} />
		</div>
	)
}
