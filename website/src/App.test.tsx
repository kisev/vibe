// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from './App'
import DevBanner from './components/DevBanner'
import DocViewer from './components/DocViewer'
import { docs } from './lib/docs'
import { siteRouter } from './lib/site'
import { m } from './paraglide/messages.js'

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

function featuresLink() {
	return screen.getAllByRole('link', { name: m.features() })[0]
}

beforeEach(() => {
	cleanup()
	vi.unstubAllEnvs()
	localStorage.clear()
	window.history.replaceState({}, '', '/vibe/')
})

afterEach(() => {
	cleanup()
	vi.unstubAllEnvs()
	vi.unstubAllGlobals()
})

describe('site build variants', () => {
	it('takes the router from the build environment', () => {
		expect(siteRouter()).toBe('browser')

		vi.stubEnv('VITE_SITE_ROUTER', 'hash')
		expect(siteRouter()).toBe('hash')

		vi.stubEnv('VITE_SITE_ROUTER', 'browser')
		expect(siteRouter()).toBe('browser')
	})

	it('shows the preview banner in the dev build and not in production', () => {
		const production = render(createElement(DevBanner))
		expect(screen.queryByRole('note')).toBeNull()
		production.unmount()

		vi.stubEnv('VITE_SITE_ROUTER', 'hash')
		render(createElement(DevBanner))

		expect(screen.getByRole('note').textContent).toContain(m['dev-preview-banner']())
		expect(screen.getByRole('link', { name: m['dev-preview-link']() }).getAttribute('href')).toBe('/vibe/')
	})

	it('keeps production links on the path routes under /vibe', () => {
		render(createElement(App))

		expect(featuresLink().getAttribute('href')).toBe('/vibe/features')
	})

	it('keeps dev links on hash routes inside /vibe/dev', async () => {
		vi.stubEnv('VITE_SITE_ROUTER', 'hash')
		window.history.replaceState({}, '', '/vibe/dev/')
		render(createElement(App))

		expect(featuresLink().getAttribute('href')).toBe('#/features')
		fireEvent.click(featuresLink())

		await waitFor(() => expect(window.location.hash).toBe('#/features'))
		expect(window.location.pathname).toBe('/vibe/dev/')
		expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(m.features())
	})

	it('renders a dev deep link inside the dev base', () => {
		vi.stubEnv('VITE_SITE_ROUTER', 'hash')
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })),
		)
		window.history.replaceState({}, '', '/vibe/dev/#/roadmap')
		render(createElement(App))

		expect(window.location.pathname).toBe('/vibe/dev/')
		expect(window.location.hash).toBe('#/roadmap')
		expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(m.roadmap())
	})

	it('keeps dev documentation pages and their nav inside the dev base', async () => {
		const models = docs.find((doc) => doc.slug === 'models')!
		const install = docs.find((doc) => doc.slug === 'install')!

		vi.stubEnv('VITE_SITE_ROUTER', 'hash')
		window.history.replaceState({}, '', '/vibe/dev/#/docs/models')
		render(createElement(App))

		// The article's own H1 follows the route, so a dev deep link opens the named page.
		await waitFor(() =>
			expect(screen.getAllByRole('heading', { level: 1 }).map((heading) => heading.textContent)).toContain(models.title),
		)

		fireEvent.click(screen.getByRole('button', { name: install.title }))

		await waitFor(() => expect(window.location.hash).toBe('#/docs/install'))
		expect(window.location.pathname).toBe('/vibe/dev/')
		await waitFor(() =>
			expect(screen.getAllByRole('heading', { level: 1 }).map((heading) => heading.textContent)).toContain(install.title),
		)
	})

	it('keeps the dev changelog alias inside the dev base', async () => {
		vi.stubEnv('VITE_SITE_ROUTER', 'hash')
		window.history.replaceState({}, '', '/vibe/dev/#/changelog/1.0.0-dev.42')
		render(createElement(App))

		await waitFor(() => expect(window.location.hash).toBe('#/changelog/dev'))
		expect(window.location.pathname).toBe('/vibe/dev/')
	})

	it('rewrites documentation cross-links for the dev build only', async () => {
		const content = 'See [Models](/vibe/docs#models) for the alternatives.'

		vi.stubEnv('VITE_SITE_ROUTER', 'hash')
		render(createElement(DocViewer, { content }))
		await waitFor(() => expect(screen.getByRole('link', { name: 'Models' }).getAttribute('href')).toBe('#/docs/models'))

		cleanup()
		vi.unstubAllEnvs()
		render(createElement(DocViewer, { content }))
		await waitFor(() => expect(screen.getByRole('link', { name: 'Models' }).getAttribute('href')).toBe('/vibe/docs#models'))
	})
})
