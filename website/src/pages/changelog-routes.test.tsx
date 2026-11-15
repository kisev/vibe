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

	it('resolves a swept dev version to the current dev entry', () => {
		renderAt('/vibe/changelog/dev.84')
		expect(screen.getAllByText(m.changelogUnreleased()).length).toBeGreaterThan(0)
	})

	it('resolves /changelog/dev to the unreleased entry', () => {
		renderAt('/vibe/changelog/dev')
		expect(screen.getAllByText(m.changelogUnreleased()).length).toBeGreaterThan(0)
		// The dev line names itself, and an unknown version is the only thing that says
		// the release does not exist.
		expect(screen.getAllByText(m.changelogDevLine()).length).toBeGreaterThan(0)
		expect(screen.queryByText(/There is no release/)).toBeNull()
	})
})
