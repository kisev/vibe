// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from '../components/Layout'
import Roadmap from '../pages/Roadmap'
import { localizeRoadmap } from './roadmap'
import { m } from '../paraglide/messages.js'
import { setLocale } from '../paraglide/runtime.js'

// Node's disabled `localStorage` global shadows jsdom's in this environment, so give the
// tests a real in-memory Storage; the runtime treats it exactly like the browser's.
const memory = new Map<string, string>()
const memoryStorage = {
	get length() {
		return memory.size
	},
	clear: () => memory.clear(),
	getItem: (key: string) => memory.get(key) ?? null,
	key: (index: number) => [...memory.keys()][index] ?? null,
	removeItem: (key: string) => void memory.delete(key),
	setItem: (key: string, value: string) => void memory.set(key, String(value)),
} as unknown as Storage
Object.defineProperty(globalThis, 'localStorage', { value: memoryStorage, configurable: true, writable: true })

const entries = [
	{ name: 'app-update-controls', title: 'App update controls', why: 'Three update channels need one rule each.' },
	{ name: 'model-comparison', title: 'Model comparison', why: 'Users want to judge models on their own audio.' },
]

function respondWith(body: unknown, ok = true, status = 200) {
	vi.stubGlobal(
		'fetch',
		vi.fn(async () => ({ ok, status, json: async () => body })),
	)
}

/** The page reads the locale from the router, so it must render inside one even in a unit test. */
function renderRoadmap() {
	return render(createElement(MemoryRouter, null, createElement(Roadmap)))
}

beforeEach(() => {
	cleanup()
	setLocale('en-US', { reload: false })
})

afterEach(() => {
	cleanup()
	vi.unstubAllGlobals()
})

describe('Roadmap', () => {
	it('lists every generated entry and says the work is planned, not shipped', async () => {
		respondWith(entries)

		renderRoadmap()

		expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Roadmap')
		expect(screen.getByText(m['roadmap-note']())).toBeTruthy()
		expect(await screen.findByText('App update controls')).toBeTruthy()
		expect(screen.getByText('Model comparison')).toBeTruthy()
		expect(screen.getByText('Users want to judge models on their own audio.')).toBeTruthy()
	})

	it('says so when the roadmap cannot be loaded', async () => {
		respondWith(null, false, 500)

		renderRoadmap()

		expect((await screen.findByRole('alert')).textContent).toBe(m['roadmap-load-failed']())
	})

	it('renders the empty state when there are no planned changes', async () => {
		respondWith([])

		renderRoadmap()

		expect(await screen.findByText(m['roadmap-empty']())).toBeTruthy()
	})

	it('treats malformed JSON as a failed load', async () => {
		respondWith({ not: 'a list' })

		renderRoadmap()

		await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy())
	})

	it('keeps every card in English when the locale has no translation for it', () => {
		expect(localizeRoadmap(entries, 'xx-XX')).toEqual(entries)
	})

	it('is reachable from the header navigation', async () => {
		respondWith(entries)
		window.history.replaceState({}, '', '/vibe/')

		render(
			createElement(
				BrowserRouter,
				{ basename: '/vibe' },
				createElement(
					Routes,
					null,
					createElement(
						Route,
						{ element: createElement(Layout) },
						createElement(Route, { index: true, element: createElement('div') }),
						createElement(Route, { path: 'roadmap', element: createElement(Roadmap) }),
					),
				),
			),
		)

		const link = screen.getAllByRole('link').find((element) => element.getAttribute('href')?.endsWith('/roadmap'))
		expect(link).toBeTruthy()
		fireEvent.click(link as HTMLElement)

		expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Roadmap')
		expect(await screen.findByText('App update controls')).toBeTruthy()
	})
})
