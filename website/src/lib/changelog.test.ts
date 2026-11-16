import { describe, expect, it } from 'vitest'
import { devAlias, findDevRelease, findRelease, isDevVersion, releases, type Release } from './changelog'

function entry(version: string, bullets: number): Release {
	return {
		version,
		date: '2026-01-01',
		title: version,
		locale: 'en-US',
		items: Array.from({ length: bullets }, () => ({ section: 'New' as const, html: 'note' })),
	}
}

describe('dev changelog detection', () => {
	it('recognizes the alias and every versioned dev URL', () => {
		expect(isDevVersion(devAlias)).toBe(true)
		expect(isDevVersion('1.0.0-dev.72')).toBe(true)
		expect(isDevVersion('v1.0.0-dev.72')).toBe(true)
	})

	it('leaves stable, release-candidate, and missing params alone', () => {
		expect(isDevVersion('1.0.0')).toBe(false)
		expect(isDevVersion('v1.0.0')).toBe(false)
		expect(isDevVersion('1.1.0-rc.1')).toBe(false)
		expect(isDevVersion('unreleased')).toBe(false)
		expect(isDevVersion(undefined)).toBe(false)
	})
})

describe('dev changelog entry', () => {
	it('renders the unreleased entry while it has notes', () => {
		const list = [entry('unreleased', 2), entry('1.0.0', 3)]
		const dev = findDevRelease(list)
		expect(dev?.release.version).toBe('unreleased')
		expect(dev?.fallback).toBe(false)
	})

	it('falls back to the newest release when the unreleased entry is empty', () => {
		const list = [entry('unreleased', 0), entry('1.1.0', 2), entry('1.0.0', 3)]
		const dev = findDevRelease(list)
		expect(dev?.release.version).toBe('1.1.0')
		expect(dev?.fallback).toBe(true)
	})

	it('falls back when there is no unreleased entry at all', () => {
		const list = [entry('1.1.0', 2), entry('1.0.0', 3)]
		const dev = findDevRelease(list)
		expect(dev?.release.version).toBe('1.1.0')
		expect(dev?.fallback).toBe(true)
	})

	it('has nothing to show for an empty list', () => {
		expect(findDevRelease([])).toBeUndefined()
	})
})

describe('release lookup', () => {
	it('resolves stable versions exactly as before', () => {
		const list = [entry('unreleased', 1), entry('1.1.0', 1), entry('1.0.0', 1)]
		expect(findRelease('1.0.0', list)?.version).toBe('1.0.0')
		expect(findRelease('v1.1.0', list)?.version).toBe('1.1.0')
	})

	it('does not resolve the dev alias as a versioned entry', () => {
		const list = [entry('unreleased', 1), entry('1.0.0', 1)]
		expect(findRelease(devAlias, list)).toBeUndefined()
	})

	it('sorts the bundled unreleased entry first and keeps every release', () => {
		expect(releases[0]?.version).toBe('unreleased')
		expect(findRelease('1.0.0')).toBeDefined()
	})
})
