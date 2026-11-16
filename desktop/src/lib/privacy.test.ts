import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The app promises that nothing leaves the device. A re-added SDK, key or call
// site would be invisible until it shipped, so these tests read the tree the
// build is made from instead of watching network traffic after the fact.
const repo = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const self = fileURLToPath(import.meta.url)

/** Names that only exist to ship usage data somewhere: the Aptabase client, its
 * event calls, and the frontend module and settings toggle that drove it. */
const TELEMETRY = /aptabase|track_event|track_analytics_event|trackEvent|trackAnalyticsEvent/i

const appDirs = [join(repo, 'desktop', 'src'), join(repo, 'desktop', 'src-tauri', 'src')]

const manifests = [
	join(repo, 'Cargo.toml'),
	join(repo, 'desktop', 'src-tauri', 'Cargo.toml'),
	join(repo, 'desktop', 'package.json'),
	join(repo, 'desktop', 'src-tauri', 'tauri.conf.json'),
]

function filesUnder(dir: string): string[] {
	return readdirSync(dir).flatMap((entry) => {
		const path = join(dir, entry)
		return statSync(path).isDirectory() ? filesUnder(path) : [path]
	})
}

function proseFiles(dir: string): Array<[string, string]> {
	return filesUnder(dir)
		.filter((path) => /\.(ts|tsx|rs)$/.test(path) && path !== self)
		.map((path) => [path, readFileSync(path, 'utf8')])
}

describe('nothing is transmitted off the device', () => {
	// Scenario: running any feature. No analytics client exists, so no feature can send anything.
	it('has no analytics call site in the app', () => {
		const offenders = appDirs
			.flatMap(proseFiles)
			.flatMap(([path, source]) => {
				const match = source.match(TELEMETRY)
				return match ? [`${relative(repo, path)}: ${match[0]}`] : []
			})
		expect(offenders).toEqual([])
	})

	it('ships no analytics module', () => {
		expect(existsSync(join(repo, 'desktop', 'src-tauri', 'src', 'analytics'))).toBe(false)
		expect(existsSync(join(repo, 'desktop', 'src', 'lib', 'analytics.ts'))).toBe(false)
	})

	// Scenario: debugging. The report is a string the user opens; the only outbound
	// step is the GitHub issue URL the user submits by hand.
	it('keeps diagnostics a report the user opens', () => {
		const diagnostics = readFileSync(join(repo, 'desktop', 'src-tauri', 'src', 'diagnostics.rs'), 'utf8')
		expect(diagnostics).not.toMatch(/reqwest|ureq|hyper::|\.post\(|upload/i)
		expect(diagnostics).toMatch(/issues\/new/)
	})

	it('keeps logs in a local file', () => {
		const logging = readFileSync(join(repo, 'desktop', 'src-tauri', 'src', 'logging.rs'), 'utf8')
		expect(logging).toMatch(/OpenOptions/)
		expect(logging).not.toMatch(/reqwest|ureq|hyper::|upload/i)
	})
})

describe('configuration carries no analytics', () => {
	// Scenario: a release build. Neither the manifests nor a workflow can inject a key.
	it('has no analytics dependency or key in the manifests', () => {
		const offenders = manifests
			.filter((path) => TELEMETRY.test(readFileSync(path, 'utf8')))
			.map((path) => relative(repo, path))
		expect(offenders).toEqual([])
	})

	it('has no analytics secret in a build workflow', () => {
		const workflows = join(repo, '.github', 'workflows')
		const offenders = readdirSync(workflows)
			.filter((file) => file.endsWith('.yml'))
			.filter((file) => /aptabase|analytics/i.test(readFileSync(join(workflows, file), 'utf8')))
		expect(offenders).toEqual([])
	})
})
