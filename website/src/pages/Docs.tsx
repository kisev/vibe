import { useEffect, useState } from 'react'
import DocViewer from '~/components/DocViewer'
import { cn } from '~/lib/style'
import { categories, docs as englishDocs, loadDocs, type Category, type Doc } from '~/lib/docs'
import { m } from '~/paraglide/messages.js'
import { getLocale, getTextDirection, type Locale } from '~/paraglide/runtime.js'

const categoryLabel: Record<Category, () => string> = {
	tutorials: () => m.docsTutorials(),
	'how-to': () => m.docsHowTo(),
	reference: () => m.docsReference(),
	explanation: () => m.docsExplanation(),
}

function slugFromHash(hash: string) {
	const wanted = decodeURIComponent(hash.replace(/^#/, '')).toLowerCase()
	return englishDocs.find((doc) => doc.slug === wanted)?.slug ?? englishDocs[0].slug
}

export default function Docs() {
	// The English pages paint immediately; this locale's translations swap in once fetched.
	const [pages, setPages] = useState<Doc[]>(englishDocs)
	const [slug, setSlug] = useState(englishDocs[0].slug)
	const shown = pages.find((doc) => doc.slug === slug) ?? pages[0]
	// The language switcher changes locale without a reload, so refetch when it does.
	const locale = getLocale()

	useEffect(() => {
		let live = true
		loadDocs(locale).then((translated) => {
			if (live) setPages(translated)
		})
		return () => {
			live = false
		}
	}, [locale])

	useEffect(() => {
		if (window.location.hash) setSlug(slugFromHash(window.location.hash))

		const onHashChange = () => setSlug(slugFromHash(window.location.hash))
		window.addEventListener('hashchange', onHashChange)

		return () => window.removeEventListener('hashchange', onHashChange)
	}, [])

	function open(next: Doc['slug']) {
		setSlug(next)
		window.location.hash = next
	}

	return (
		<main className="mx-auto w-full max-w-[1065px] px-5 pb-24 pt-14 lg:pt-20" dir={getTextDirection(locale)}>
			<header>
				<p className="eyebrow">{m['docs-eyebrow']()}</p>
				<h1 className="mt-4 text-[2rem] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground lg:text-[2.5rem]">{m.vibeDocumentation()}</h1>
			</header>

			<div className="mt-10 flex flex-col gap-10 lg:flex-row lg:gap-14">
				<nav className="flex shrink-0 flex-row flex-wrap gap-x-6 gap-y-3 border-b border-border pb-4 lg:sticky lg:top-24 lg:h-fit lg:max-h-[calc(100dvh-8rem)] lg:w-52 lg:flex-col lg:gap-y-0 lg:overflow-y-auto lg:border-b-0 lg:border-s lg:pb-0 lg:ps-4">
					{categories.map((category) => {
						const entries = pages.filter((doc) => doc.category === category)
						if (entries.length === 0) return null
						return (
							<div key={category} className="flex min-w-0 flex-col lg:mb-4">
								<p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground/70">
									{categoryLabel[category]()}
								</p>
								{entries.map((entry) => (
									<button
										key={entry.slug}
										type="button"
										onClick={() => open(entry.slug)}
										className={cn(
											'cursor-pointer rounded-full px-3 py-1.5 text-start text-[13px] transition-colors lg:rounded-md',
											entry.slug === slug ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
										)}>
										{entry.title}
									</button>
								))}
							</div>
						)
					})}
				</nav>

				{/* An untranslated page stays English, so the article follows its own direction. */}
				<div className="min-w-0 flex-1" dir={getTextDirection(shown.locale as Locale)}>
					<DocViewer content={shown.markdown} />
				</div>
			</div>
		</main>
	)
}
