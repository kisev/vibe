import { useEffect, useRef, useState } from 'react'
import { Check, Languages } from 'lucide-react'
import { m } from '../paraglide/messages.js'
import type { Locale } from '../paraglide/runtime.js'

interface LanguageSelectorProps {
	locale: Locale
	availableLocales: readonly Locale[]
	onLocaleChange: (locale: Locale) => void
	/** Compact trigger for the small-screen header: the same list, less chrome. */
	compact?: boolean
	className?: string
}

export default function LanguageSelector({ locale, availableLocales, onLocaleChange, compact = false, className }: LanguageSelectorProps) {
	const [open, setOpen] = useState(false)
	const menuRef = useRef<HTMLLIElement>(null)
	const languageNames = new Intl.DisplayNames([locale], { type: 'language' })
	const shortLocale = locale.split('-')[0]?.toUpperCase() ?? locale

	useEffect(() => {
		function closeOnOutsideClick(event: MouseEvent) {
			if (!menuRef.current?.contains(event.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', closeOnOutsideClick)
		return () => document.removeEventListener('mousedown', closeOnOutsideClick)
	}, [])

	return (
		<li ref={menuRef} data-placement={compact ? 'mobile' : 'desktop'} className={`relative ${className ?? ''}`}>
			<button
				type="button"
				aria-label={m.language()}
				title={m.language()}
				aria-expanded={open}
				onClick={() => setOpen((value) => !value)}
				className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring">
				<Languages aria-hidden="true" className="size-4" />
				<span aria-hidden="true" className="text-[11px] font-medium tracking-[0.04em] uppercase">
					{shortLocale}
				</span>
			</button>
			{open && (
				<div className="absolute top-full end-0 z-50 mt-2 min-w-52 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg">
					{availableLocales.map((code) => (
						<button
							key={code}
							type="button"
							data-locale={code}
							aria-pressed={code === locale}
							onClick={() => {
								onLocaleChange(code)
								setOpen(false)
							}}
							className={`flex w-full items-center justify-between gap-4 whitespace-nowrap rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-accent hover:text-foreground ${
								code === locale ? 'text-foreground' : 'text-muted-foreground'
							}`}>
							<span>{languageNames.of(code) ?? code}</span>
							{code === locale && <Check aria-hidden="true" className="size-3.5 text-foreground" />}
						</button>
					))}
				</div>
			)}
		</li>
	)
}
