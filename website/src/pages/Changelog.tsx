import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cn } from '~/lib/style'
import { siteRouter } from '~/lib/site'
import {
	devAlias,
	findDevRelease,
	findRelease,
	hasTranslations,
	isDevVersion,
	loadReleases,
	releases,
	sections,
	unreleasedVersion,
	type Release,
	type Section,
} from '~/lib/changelog'
import { useLocale } from '~/lib/useLocale'
import { m } from '~/paraglide/messages.js'
import { getTextDirection, type Locale } from '~/paraglide/runtime.js'

const badge: Record<Section, string> = {
	New: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
	Improved: 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
	Fixed: 'bg-amber-500/14 text-amber-800 dark:text-amber-300',
}

const label: Record<Section, () => string> = {
	New: () => m.changelogNew(),
	Improved: () => m.changelogImproved(),
	Fixed: () => m.changelogFixed(),
}

const inline = [
	'[&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:decoration-foreground',
	'[&_strong]:font-medium [&_strong]:text-foreground',
	'[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-foreground',
].join(' ')

/** The permanent address of the dev line, under whatever basename the site is deployed at. */
const devPath = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/changelog/${devAlias}`

/** One formatter per locale — building an Intl.DateTimeFormat is the expensive part, not using it. */
const formatters = new Map<string, Intl.DateTimeFormat>()

/** Written in the language the entry is written in, so "4 בספטמבר 2026" sits under Hebrew notes. */
function formatDate(date: string, locale: string) {
	let formatter = formatters.get(locale)
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
		formatters.set(locale, formatter)
	}
	return formatter.format(new Date(`${date}T00:00:00Z`))
}

/** The version as it is shown: the localized label for the dev line, otherwise the `v` prefix. */
function versionLabel(release: Pick<Release, 'version'>) {
	return release.version === unreleasedVersion ? m.changelogUnreleased() : `v${release.version}`
}

function Entry({ release, single, dev }: { release: Release; single: boolean; dev: boolean }) {
	// The unreleased entry has no version number yet — it is the dev line in progress.
	// The id stays machine-made and language-independent so anchors survive a locale switch.
	const id = release.version === unreleasedVersion ? 'unreleased' : `v${release.version}`
	const shownVersion = versionLabel(release)
	// The unreleased entry is the dev line, so its heading opens the permanent alias.
	const href = release.version === unreleasedVersion ? `/changelog/${devAlias}` : `/changelog/${release.version}`
	return (
		<article
			id={id}
			className="grid scroll-mt-24 gap-4 border-t border-border py-12 [contain-intrinsic-size:auto_28rem] [content-visibility:auto] first:border-t-0 lg:grid-cols-[10rem_1fr] lg:gap-12"
			dir={getTextDirection(release.locale as Locale)}>
			{/* The version and date stay put while the entry's notes scroll past. */}
			<div className="lg:sticky lg:top-24 lg:self-start">
				<div className="flex items-baseline gap-2">
					<Link to={href} className="text-[15px] font-medium text-foreground transition-colors hover:text-primary">
						{shownVersion}
					</Link>
					{dev && (
						<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
							{m.changelogDevLine()}
						</span>
					)}
				</div>
				{release.date && (
					<time dateTime={release.date} className="mt-1 block text-[13px] text-muted-foreground">
						{formatDate(release.date, release.locale)}
					</time>
				)}
				{single && (
					<Link
						to="/changelog"
						className="mt-4 block text-[13px] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground">
						{m.changelogAll()}
					</Link>
				)}
			</div>
			<div className="max-w-[68ch]">
				<h2 className="text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-foreground">
					{release.version === unreleasedVersion ? m.changelogUnreleasedTitle() : release.title}
				</h2>
				{sections.map((section) => {
					const items = release.items.filter((item) => item.section === section)
					if (items.length === 0) return null
					return (
						<section key={section} className="mt-7">
							<span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[12px] font-medium tracking-wide', badge[section])}>
								{label[section]()}
							</span>
							<ul className="mt-3 list-disc space-y-2 ps-5 text-[15px] leading-7 text-muted-foreground">
								{items.map((item, i) => (
									<li key={i} className={inline} dangerouslySetInnerHTML={{ __html: item.html }} />
								))}
							</ul>
						</section>
					)
				})}
			</div>
		</article>
	)
}

export default function Changelog() {
	const { version } = useParams()
	const navigate = useNavigate()
	// The language switcher remounts this page; reading the locale from the router
	// keeps the fetch in step with the switch instead of a value captured once.
	const locale = useLocale()
	// A dev link — the alias or a swept `-dev.` version — always resolves to the dev line.
	const dev = isDevVersion(version)
	// A locale with translations waits for them instead of painting English first: swapping
	// English for, say, Hebrew a moment later flips direction and reflows the whole page.
	const [list, setList] = useState<Release[] | null>(() => (hasTranslations(locale) ? null : releases))
	const devEntry = dev && list ? findDevRelease(list) : undefined
	const one = !dev && version && list ? findRelease(version, list) : undefined
	let shown: Release[] = list ?? []
	if (dev) shown = devEntry ? [devEntry.release] : []
	else if (one) shown = [one]

	// A versioned dev URL keeps working, but the address bar gives back the permanent alias.
	useEffect(() => {
		if (!dev) return
		// The dev preview's router owns the hash, so the alias is a route there. Writing
		// `devPath` — a path under the dev base — would move the address bar out of
		// `/vibe/dev/`, where only the production site answers.
		if (siteRouter() === 'hash') {
			if (version !== devAlias) navigate(`/changelog/${devAlias}`, { replace: true })
			return
		}
		if (window.location.pathname === devPath) return
		window.history.replaceState(window.history.state, '', `${devPath}${window.location.search}${window.location.hash}`)
	}, [dev, version, navigate])

	useEffect(() => {
		if (!hasTranslations(locale)) {
			setList(releases)
			return
		}
		let live = true
		setList(null)
		loadReleases(locale).then((translated) => {
			if (live) setList(translated)
		})
		return () => {
			live = false
		}
	}, [locale])

	const headline = one ?? devEntry?.release
	useEffect(() => {
		document.title = headline ? `Vibe ${versionLabel(headline)}: ${headline.title}` : `Vibe ${m.changelog()}`
		return () => {
			document.title = 'Vibe'
		}
	}, [headline])

	return (
		<main className="mx-auto w-full max-w-[1065px] px-5 pb-24 pt-14 lg:pt-20">
			<header dir={getTextDirection(locale)}>
				<p className="eyebrow">Vibe</p>
				<h1 className="mt-4 text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground lg:text-[2.5rem]">{m.changelog()}</h1>
				{devEntry?.fallback && <p className="mt-4 text-muted-foreground">{m.changelogDevFallback()}</p>}
				{!dev && version && list && !one && <p className="mt-4 text-muted-foreground">{m.changelogUnknownVersion({ version })}</p>}
			</header>
			{/* Holds the page's height while translations load, so the footer does not jump up and back. */}
			<div className={cn('mt-6', !list && 'min-h-[100vh]')}>
				{shown.map((release) => (
					<Entry key={release.version} release={release} single={Boolean(one) || Boolean(devEntry)} dev={dev} />
				))}
			</div>
		</main>
	)
}
