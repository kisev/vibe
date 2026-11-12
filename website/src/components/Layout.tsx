import { useCallback, useEffect, useRef, useState } from 'react'
import { getLocale, getTextDirection, setLocale, type Locale } from '../paraglide/runtime.js'
import { localeFromSearch, supportedWebsiteLocales, writeLocaleToUrl } from '~/lib/i18n'
import { Outlet, useLocation } from 'react-router-dom'
import useUrlActions from '~/lib/useUrlActions'
import Footer from './Footer'
import Nav from './Nav'
import PrivacyPolicy from './PrivacyPolicy'

export default function Layout() {
	const location = useLocation()
	const [privacyOpen, setPrivacyOpen] = useState(false)
	// A supported ?lang= in the URL wins over the stored choice from the first render, so the
	// first paint already resolves messages in the shared language instead of flashing another.
	const [locale, setCurrentLocale] = useState<Locale>(() => {
		const initial = localeFromSearch(location.search) ?? getLocale()
		setLocale(initial, { reload: false })
		return initial
	})
	const localeRef = useRef(locale)
	localeRef.current = locale
	const direction = getTextDirection(locale)
	const availableLocales = supportedWebsiteLocales as readonly Locale[]
	const onOpenPrivacyPolicy = useCallback(() => setPrivacyOpen(true), [])
	const onLocaleChange = useCallback((nextLocale: Locale) => {
		setLocale(nextLocale, { reload: false })
		setCurrentLocale(nextLocale)
		writeLocaleToUrl(nextLocale)
	}, [])

	// A supported ?lang= outranks the stored choice and becomes the stored choice for the next visit.
	useEffect(() => {
		const fromUrl = localeFromSearch(location.search)
		if (!fromUrl) return
		if (fromUrl !== getLocale()) setLocale(fromUrl, { reload: false })
		if (fromUrl !== localeRef.current) setCurrentLocale(fromUrl)
	}, [location.pathname, location.search])

	// Keep lang in the URL so in-site navigation and shared links carry the choice.
	useEffect(() => {
		writeLocaleToUrl(localeRef.current)
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
			<Nav locale={locale} availableLocales={availableLocales} onLocaleChange={onLocaleChange} />
			<main className="flex-1">
				<Outlet />
			</main>
			<Footer onOpenPrivacyPolicy={onOpenPrivacyPolicy} />
			<PrivacyPolicy open={privacyOpen} onOpenChange={setPrivacyOpen} />
		</div>
	)
}
