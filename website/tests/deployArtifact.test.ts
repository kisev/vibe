import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

/**
 * One deploy publishes both builds, so the assembly step is what makes the dev
 * preview reachable next to the release site. These tests run the real script
 * against stand-in builds instead of the Vite output, which is not built here.
 *
 * They live outside `src/` because the website's `tsc` pass has no Node types.
 */
const script = fileURLToPath(new URL('../../scripts/website_assemble.sh', import.meta.url))

let work: string
let prod: string
let dev: string
let site: string

function build(dir: string, marker: string) {
	mkdirSync(dir, { recursive: true })
	writeFileSync(path.join(dir, 'index.html'), `<html><body>${marker}</body></html>`)
	writeFileSync(path.join(dir, '404.html'), `<html><body>${marker} 404</body></html>`)
}

function assemble() {
	return execFileSync('bash', [script], {
		encoding: 'utf8',
		env: { ...process.env, WEBSITE_PROD_DIR: prod, WEBSITE_DEV_DIR: dev, WEBSITE_SITE_DIR: site },
	})
}

beforeEach(() => {
	work = mkdtempSync(path.join(tmpdir(), 'vibe-site-'))
	prod = path.join(work, 'dist')
	dev = path.join(work, 'dist-dev')
	site = path.join(work, 'dist-site')
})

afterEach(() => {
	rmSync(work, { recursive: true, force: true })
})

describe('deploy artifact assembly', () => {
	it('puts the production build at the root and the dev build under dev/', () => {
		build(prod, 'production')
		build(dev, 'development')
		assemble()

		expect(readFileSync(path.join(site, 'index.html'), 'utf8')).toContain('production')
		expect(readFileSync(path.join(site, 'dev', 'index.html'), 'utf8')).toContain('development')
		// Pages serves exactly one root 404.html; it must keep falling back to production.
		expect(readFileSync(path.join(site, '404.html'), 'utf8')).toBe(readFileSync(path.join(prod, '404.html'), 'utf8'))
	})

	it('refuses to publish half a pair', () => {
		build(prod, 'production')

		expect(() => assemble()).toThrow()
		expect(existsSync(site)).toBe(false)
	})

	it('refuses a production build with no root fallback', () => {
		build(prod, 'production')
		rmSync(path.join(prod, '404.html'))
		build(dev, 'development')

		expect(() => assemble()).toThrow()
		expect(existsSync(site)).toBe(false)
	})
})
