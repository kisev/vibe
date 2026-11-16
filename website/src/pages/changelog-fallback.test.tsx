// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

const { newest } = vi.hoisted(() => ({
	newest: {
		version: '1.0.0',
		date: '2026-11-09',
		title: 'One engine, one model catalog',
		locale: 'en-US',
		items: [{ section: 'New' as const, html: 'note' }],
	},
}))

// The bundled unreleased entry always has notes, so the empty-dev-entry branch is
// only reachable by making the selector report a fallback — the state the page must
// render as the newest release plus a notice, never as an error.
vi.mock('~/lib/changelog', async (importOriginal) => {
	const actual = await importOriginal<typeof import('~/lib/changelog')>()
	return { ...actual, findDevRelease: () => ({ release: newest, fallback: true }) }
})

afterEach(cleanup)

describe('dev changelog with no dev notes', () => {
	it('renders the newest release with a notice instead of an error', () => {
		window.history.replaceState({}, '', '/vibe/changelog/dev')
		render(
			createElement(
				BrowserRouter,
				{ basename: '/vibe' },
				createElement(Routes, null, createElement(Route, { path: 'changelog/:version', element: createElement(Changelog) })),
			),
		)
		expect(screen.getByText(m.changelogDevFallback())).toBeTruthy()
		expect(screen.getByText(newest.title)).toBeTruthy()
		expect(screen.queryByText(/There is no release/)).toBeNull()
	})
})
