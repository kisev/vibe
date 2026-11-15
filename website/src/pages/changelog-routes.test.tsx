// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { m } from '../paraglide/messages.js'
import Changelog from './Changelog'

// Node's disabled `localStorage` shadows jsdom's here; paraglide reads it on first render.
const memory = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
	configurable: true,
	writable: true,
	value: {
		get length() {
			return memory.size
		},
		clear: () => memory.clear(),
		getItem: (key: string) => memory.get(key) ?? null,
		key: (index: number) => [...memory.keys()][index] ?? null,
		removeItem: (key: string) => void memory.delete(key),
		setItem: (key: string, value: string) => void memory.set(key, String(value)),
	} as unknown as Storage,
})

/**
 * The production route table for the changelog, as `App.tsx` builds it for
 * `siteRouter() === 'browser'`: no hash, everything after the `/vibe` basename.
 * Rendering it here proves what a deploy serves without a deploy.
 */
function renderAt(path: string) {
	window.history.replaceState({}, '', path)
	return render(
		createElement(
			BrowserRouter,
			{ basename: '/vibe' },
			createElement(
				Routes,
				null,
				createElement(Route, { path: 'changelog', element: createElement(Changelog) }),
				createElement(Route, { path: 'changelog/:version', element: createElement(Changelog) }),
			),
		),
	)
}

afterEach(cleanup)

describe('changelog routes in the production build', () => {
	it('lists the releases and the unreleased dev entry', () => {
		renderAt('/vibe/changelog')
		expect(screen.getAllByText(m.changelogUnreleased()).length).toBeGreaterThan(0)
	})

	it('resolves a swept dev version to the current dev entry and canonicalizes it', () => {
		// A real dev version carries the `-dev.` marker; the release it named is gone,
		// which is exactly what the alias exists for.
		renderAt('/vibe/changelog/1.0.0-dev.84')
		expect(screen.getAllByText(m.changelogUnreleased()).length).toBeGreaterThan(0)
		// The dev line labels itself, and the unknown-version notice is the one thing
		// that would say the release does not exist.
		expect(screen.getAllByText(m.changelogDevLine()).length).toBeGreaterThan(0)
		expect(screen.queryByText(/There is no release/)).toBeNull()
		// Copying the address bar must give the permanent alias, not the swept version.
		// Vitest serves the site at `/`, so the alias is `/changelog/dev` here; the
		// production build prefixes the same path with its `/vibe` base.
		expect(window.location.pathname).toBe('/changelog/dev')
	})

	it('resolves /changelog/dev to the unreleased entry', () => {
		renderAt('/vibe/changelog/dev')
		expect(screen.getAllByText(m.changelogUnreleased()).length).toBeGreaterThan(0)
		expect(screen.getAllByText(m.changelogDevLine()).length).toBeGreaterThan(0)
		expect(screen.queryByText(/There is no release/)).toBeNull()
		// The alias stays the alias — the versioned dev path above never survives in
		// the address bar.
		expect(window.location.pathname).toBe('/changelog/dev')
	})

	it('keeps a stable version on its own entry', () => {
		renderAt('/vibe/changelog/1.0.0')
		expect(screen.getByText('One engine, one model catalog, and long recordings that plan themselves')).toBeTruthy()
		expect(screen.queryByText(/There is no release/)).toBeNull()
		expect(screen.queryByText(m.changelogDevLine())).toBeNull()
		expect(window.location.pathname).toBe('/vibe/changelog/1.0.0')
	})
})
