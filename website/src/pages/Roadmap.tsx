import { useEffect, useState } from 'react'
import { loadRoadmap, type RoadmapEntry } from '~/lib/roadmap'
import { useLocale } from '~/lib/useLocale'
import { m } from '~/paraglide/messages.js'

export default function Roadmap() {
	// Cards follow the chosen language, so a switch re-fetches the list with that
	// locale's translations rather than keeping the previous cards in state.
	const locale = useLocale()
	const [entries, setEntries] = useState<RoadmapEntry[] | null>(null)
	const [failed, setFailed] = useState(false)

	useEffect(() => {
		const controller = new AbortController()
		setEntries(null)
		setFailed(false)
		loadRoadmap(locale, controller.signal)
			.then((loaded) => {
				if (!controller.signal.aborted) setEntries(loaded)
			})
			.catch((error) => {
				// An aborted request is the page unmounting, not a broken roadmap.
				if (controller.signal.aborted) return
				console.error(error)
				setFailed(true)
			})
		return () => controller.abort()
	}, [locale])

	return (
		<main className="mx-auto w-full max-w-[1065px] px-5 pb-24 pt-14 lg:pt-20">
			<header className="max-w-[52ch]">
				<p className="eyebrow">{m['roadmap-eyebrow']()}</p>
				<h1 className="mt-5 text-[2.25rem] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground lg:text-[3rem]">{m.roadmap()}</h1>
				<p className="mt-5 text-[17px] leading-8 text-muted-foreground">{m['roadmap-description']()}</p>
				<p className="mt-3 text-[13.5px] leading-6 text-muted-foreground">{m['roadmap-note']()}</p>
			</header>

			{failed && (
				<p role="alert" className="mt-14 rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">
					{m['roadmap-load-failed']()}
				</p>
			)}

			{entries !== null && entries.length === 0 && (
				<p className="mt-14 rounded-2xl border border-border/70 bg-card p-6 text-sm text-muted-foreground">{m['roadmap-empty']()}</p>
			)}

			{entries !== null && entries.length > 0 && (
				<ul className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
					{entries.map((entry) => (
						<li
							key={entry.name}
							className="flex h-full flex-col gap-2.5 rounded-2xl border border-border/70 bg-card p-6 text-start shadow-xs sm:p-7">
							<h2 className="text-[17px] font-semibold leading-snug tracking-[-0.015em] text-foreground">{entry.title}</h2>
							<p className="text-[14.5px] leading-[1.65] text-muted-foreground">{entry.why}</p>
						</li>
					))}
				</ul>
			)}
		</main>
	)
}
