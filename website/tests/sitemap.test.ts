import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * The sitemap is hand-written, so it can fall behind the router: a page added to
 * `App.tsx` without an entry is one crawlers never see. Parameterized routes are
 * release and doc pages, not crawlable addresses of their own, so they are left out.
 */
const source = readFileSync(fileURLToPath(new URL('../src/App.tsx', import.meta.url)), 'utf8')
const sitemap = readFileSync(fileURLToPath(new URL('../public/sitemap.xml', import.meta.url)), 'utf8')

const routes = [...source.matchAll(/<Route path="([^"/:]+)"/g)].map((match) => match[1])

describe('sitemap', () => {
	it('lists every static route the production build serves', () => {
		expect(routes.length).toBeGreaterThan(0)
		expect(routes.filter((route) => !sitemap.includes(`/vibe/${route}</loc>`))).toEqual([])
	})
})
