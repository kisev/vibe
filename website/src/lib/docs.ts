/**
 * The user-facing docs shown on /docs, organized by Diátaxis. English lives in
 * `i18n/docs/en-US/<category>/<slug>.md`; a translation is the same file under
 * `i18n/docs/<locale>/<category>/<slug>.md`, carrying a `source` hash of the
 * English file it was made from.
 *
 * Only the English pages are bundled; a locale's pages are fetched when that
 * locale asks for them, and a page without a translation falls back to English
 * whole — never paragraph by paragraph.
 */
const english = import.meta.glob('../../../i18n/docs/en-US/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const translations = import.meta.glob(['../../../i18n/docs/*/**/*.md', '!../../../i18n/docs/en-US/**/*.md'], { query: '?raw', import: 'default' }) as Record<
	string,
	() => Promise<string>
>

/** The four Diátaxis purposes, in the order the navigation shows them. */
export const categories = ['tutorials', 'how-to', 'reference', 'explanation'] as const
export type Category = (typeof categories)[number]

/**
 * Every page the site shows, in reading order within its category. The slug is
 * the deep-link anchor (`/docs#slug`), so it is unique across all categories.
 */
export const pageOrder = [
	{ category: 'tutorials', slug: 'install' },
	{ category: 'tutorials', slug: 'first-transcription' },
	{ category: 'how-to', slug: 'record-audio' },
	{ category: 'how-to', slug: 'transcribe-a-link' },
	{ category: 'how-to', slug: 'use-a-custom-model' },
	{ category: 'how-to', slug: 'transcribe-from-a-phone' },
	{ category: 'how-to', slug: 'summarize-transcripts' },
	{ category: 'how-to', slug: 'switch-update-channels' },
	{ category: 'how-to', slug: 'use-the-meeting-browser' },
	{ category: 'reference', slug: 'models' },
	{ category: 'reference', slug: 'formats' },
	{ category: 'reference', slug: 'cli' },
	{ category: 'reference', slug: 'settings' },
	{ category: 'reference', slug: 'update-channels' },
	{ category: 'explanation', slug: 'privacy' },
	{ category: 'explanation', slug: 'engine' },
	{ category: 'explanation', slug: 'meeting-browser' },
	{ category: 'explanation', slug: 'update-channels-design' },
] as const
export type Slug = (typeof pageOrder)[number]['slug']

export interface Doc {
	slug: Slug
	category: Category
	/** The locale this page is written in, so the page can set its direction. */
	locale: string
	/** The page's first H1, or the slug when it has none. */
	title: string
	markdown: string
}

/** Strips the `source` hash the audit script stamps in; it is bookkeeping, not content. */
function strip(raw: string) {
	return raw.replace(/^<!--\s*source:\s*[0-9a-f]+\s*-->\n*/, '')
}

function pageKey(category: Category, slug: Slug) {
	return `${category}/${slug}`
}

function findPage(category: string | undefined, slug: string | undefined) {
	return pageOrder.find((page) => page.category === category && page.slug === slug)
}

function titleOf(markdown: string, fallback: string) {
	return /^#\s+(.+?)\s*$/m.exec(markdown)?.[1] ?? fallback
}

function englishDocs(): Doc[] {
	const byKey = new Map<string, string>()
	for (const [path, raw] of Object.entries(english)) {
		const parts = path.split('/')
		const page = findPage(parts.at(-2), parts.at(-1)?.replace(/\.md$/, ''))
		if (page) byKey.set(pageKey(page.category, page.slug), strip(raw))
	}
	return pageOrder.map(({ category, slug }) => {
		const markdown = byKey.get(pageKey(category, slug)) ?? ''
		return { slug, category, locale: 'en-US', title: titleOf(markdown, slug), markdown }
	})
}

/** The English pages. What /docs paints before a translation lands. */
export const docs: Doc[] = englishDocs()

/** The same pages with whatever this locale has translated swapped in. */
export async function loadDocs(locale: string): Promise<Doc[]> {
	if (locale === 'en-US') return docs
	const wanted = Object.entries(translations).filter(([path]) => path.split('/').at(-3) === locale)
	if (wanted.length === 0) return docs
	const loaded = await Promise.all(
		wanted.map(async ([path, load]) => {
			const parts = path.split('/')
			const page = findPage(parts.at(-2), parts.at(-1)?.replace(/\.md$/, ''))
			if (!page) return null
			try {
				const markdown = strip(await load())
				return { slug: page.slug, category: page.category, locale, title: titleOf(markdown, page.slug), markdown } satisfies Doc
			} catch {
				// A half-written translation must not take the docs page down.
				console.warn(`docs: could not read ${path}`)
				return null
			}
		}),
	)
	const translated = new Map(loaded.filter((doc): doc is Doc => doc !== null).map((doc) => [pageKey(doc.category, doc.slug), doc]))
	return docs.map((doc) => translated.get(pageKey(doc.category, doc.slug)) ?? doc)
}
