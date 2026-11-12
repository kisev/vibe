import { describe, expect, it } from 'vitest'
import { categories, docs, loadDocs, pageOrder } from './docs'

/** Every `/vibe/docs#slug` link in a page, which lands back on the /docs hash router. */
function internalLinks(markdown: string) {
	return [...markdown.matchAll(/\]\(\/vibe\/docs#([^)\s]+)\)/g)].map((match) => decodeURIComponent(match[1]))
}

describe('site docs', () => {
	it('shows every page exactly once, in all four categories', () => {
		const slugs = docs.map((doc) => doc.slug)
		expect(new Set(slugs).size).toBe(slugs.length)
		expect(slugs).toEqual(pageOrder.map((page) => page.slug))
		for (const category of categories) expect(docs.some((doc) => doc.category === category)).toBe(true)
	})

	it('gives every page content and a title separate from its slug', () => {
		for (const doc of docs) {
			expect(doc.markdown, `${doc.slug} is empty`).not.toBe('')
			expect(doc.markdown.trimStart().startsWith('# '), `${doc.slug} has no H1`).toBe(true)
			expect(doc.title, `${doc.slug} has no title`).not.toBe(doc.slug)
		}
	})

	it('resolves every internal docs link to a page slug', () => {
		const slugs = new Set(docs.map((doc) => doc.slug))
		for (const doc of docs) {
			for (const link of internalLinks(doc.markdown)) expect(slugs, `${doc.slug} links to #${link}`).toContain(link)
		}
	})

	it('paints the English pages whole when a locale has no translated page', async () => {
		const fallback = await loadDocs('xx-XX')
		expect(fallback.map((doc) => doc.locale)).toEqual(docs.map(() => 'en-US'))
	})
})
