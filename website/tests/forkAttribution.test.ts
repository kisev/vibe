import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The site is the fork's, not upstream's. Every address it publishes — canonical, structured
 * data, sitemap, robots, the machine-readable summary, installer and repository links — must name
 * the fork, or a visitor and a crawler end up on someone else's project.
 */
const ROOT = new URL('..', import.meta.url).pathname
const UPSTREAM = /thewh1teagle\.(?:github\.io|com)/

/** Build output and generated copies: `public/docs` mirrors the repository docs, which discuss
 *  upstream on purpose, and `roadmap.json` is generated from change proposals that name it. */
const SKIP = new Set(['docs', 'roadmap.json', 'og.png'])

function files(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		if (SKIP.has(entry)) return []
		const path = join(dir, entry)
		if (statSync(path).isDirectory()) return files(path)
		return /\.(html|json|jsonld|txt|xml|sh|ts|tsx)$/.test(entry) ? [path] : []
	})
}

describe('the site names the fork', () => {
	it('publishes no upstream address anywhere a visitor or crawler reads it', () => {
		const offenders = ['src', 'public', 'index.html']
			.flatMap((entry) => (entry === 'index.html' ? [join(ROOT, entry)] : files(join(ROOT, entry))))
			.filter((path) => !path.includes('.test.'))
			.filter((path) => UPSTREAM.test(readFileSync(path, 'utf8')))
			.map((path) => path.replace(ROOT, ''))

		expect(offenders).toEqual([])
	})
})
