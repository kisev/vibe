// @vitest-environment jsdom
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import * as ts from 'typescript'
import { getLocale, locales } from '../paraglide/runtime.js'
import Layout from '../components/Layout'
import { localeFromSearch, safeTranslate, supportedWebsiteLocales, urlWithLocale, writeLocaleToUrl } from './i18n'

const pageSources = import.meta.glob('../pages/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const componentSources = import.meta.glob('../components/*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const changelogTranslations = import.meta.glob('../../../i18n/changelog/*/*.md') as Record<string, unknown>

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

/** Names that are the same in every language: brands, platforms and people. */
const BRAND_NAMES = new Set([
	'Vibe',
	'GitHub',
	'Discord',
	'macOS',
	'Windows',
	'Linux',
	'macOS / Windows / Linux',
	'Apple',
	'Intel',
	'NVIDIA',
	'AMD',
	'thewh1teagle',
])

/** Attributes whose value a visitor can read or hear. */
const VISIBLE_ATTRIBUTES = new Set(['aria-label', 'aria-description', 'aria-roledescription', 'title', 'alt', 'placeholder', 'text', 'label', 'hint'])

/** Object keys whose string values are rendered without going through a message. */
const VISIBLE_PROPERTIES = new Set(['title', 'description', 'label', 'text', 'hint', 'time', 'name', 'message'])

/**
 * Prose the guard would fail on. Identifiers, file names, paths and brand names
 * are allowed; anything with a space (or a capitalised word) must be a message.
 */
function isVisibleProse(raw: string): boolean {
	const value = raw.replace(/\s+/g, ' ').trim()
	if (!/[A-Za-z]{2,}/.test(value)) return false
	if (BRAND_NAMES.has(value)) return false
	if (!/\s/.test(value) && /^[\w./:@+-]+$/.test(value)) {
		// `podcast-episode.mp3` and `Documents/Vibe` are identifiers, `Save` is prose.
		return !/^[a-z0-9]/.test(value) && !/[./:_-]/.test(value)
	}
	return true
}

function scanSource(path: string, source: string, violations: string[]) {
	const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

	function report(node: ts.Node, text: string) {
		if (!isVisibleProse(text)) return
		const line = file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1
		violations.push(`${path}:${line}: "${text.replace(/\s+/g, ' ').trim()}"`)
	}

	function checkExpression(expression: ts.Expression | undefined) {
		if (!expression) return
		if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
			report(expression, expression.text)
		} else if (ts.isTemplateExpression(expression)) {
			report(expression.head, expression.head.text)
			for (const span of expression.templateSpans) report(span.literal, span.literal.text)
		} else if (ts.isConditionalExpression(expression)) {
			checkExpression(expression.whenTrue)
			checkExpression(expression.whenFalse)
		} else if (ts.isBinaryExpression(expression) && expression.operatorToken.kind === ts.SyntaxKind.PlusToken) {
			checkExpression(expression.left)
			checkExpression(expression.right)
		}
	}

	function visit(node: ts.Node) {
		if (ts.isJsxText(node)) {
			report(node, node.getText(file))
		} else if (ts.isJsxAttribute(node)) {
			const name = node.name.getText(file)
			if (VISIBLE_ATTRIBUTES.has(name) && node.initializer) {
				if (ts.isStringLiteral(node.initializer)) report(node.initializer, node.initializer.text)
				else if (ts.isJsxExpression(node.initializer)) checkExpression(node.initializer.expression)
			}
		} else if (ts.isJsxExpression(node) && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
			// A literal rendered directly as a child: {condition ? 'Buy now' : 'Sold out'}.
			checkExpression(node.expression)
		} else if (ts.isPropertyAssignment(node) && VISIBLE_PROPERTIES.has(node.name.getText(file).replace(/['"]/g, ''))) {
			if (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer)) {
				report(node.initializer, node.initializer.text)
			}
		}
		ts.forEachChild(node, visit)
	}

	visit(file)
}

function renderLayout(url: string) {
	window.history.replaceState({}, '', url)
	return render(
		createElement(
			BrowserRouter,
			{ basename: '/vibe' },
			createElement(
				Routes,
				null,
				createElement(Route, { element: createElement(Layout) }, createElement(Route, { index: true, element: createElement('div') }), createElement(Route, { path: 'features', element: createElement('div') })),
			),
		),
	)
}

beforeEach(() => {
	cleanup()
	localStorage.clear()
	window.history.replaceState({}, '', '/vibe/')
	document.documentElement.removeAttribute('lang')
	document.documentElement.removeAttribute('dir')
	document.body.removeAttribute('dir')
})

afterEach(() => {
	cleanup()
})

describe('website i18n', () => {
	it('derives website locales from the central registry', () => {
		expect(supportedWebsiteLocales).toContain('en-US')
		expect(supportedWebsiteLocales).toContain('he-IL')
	})

	it('falls back safely when a message is missing', () => {
		expect(safeTranslate({}, 'missing', 'Fallback')).toBe('Fallback')
	})

	it('offers exactly the website locales, matching the changelog translation set', () => {
		expect([...supportedWebsiteLocales].sort()).toEqual([...locales].sort())
		const changelogLocales = [...new Set(Object.keys(changelogTranslations).map((path) => path.split('/').at(-2)))]
		expect(changelogLocales.sort()).toEqual(supportedWebsiteLocales.filter((code) => code !== 'en-US').sort())
	})
})

describe('locale URL parameter', () => {
	it('reads only supported locales from the search string', () => {
		expect(localeFromSearch('?lang=he-IL')).toBe('he-IL')
		expect(localeFromSearch('?lang=xx-YY')).toBeUndefined()
		expect(localeFromSearch('')).toBeUndefined()
	})

	it('writes lang while preserving other parameters and the hash', () => {
		expect(urlWithLocale('/vibe/features?foo=1&lang=fr-FR#install', 'he-IL')).toBe('/vibe/features?foo=1&lang=he-IL#install')
	})

	it('replaces the current history entry instead of adding one', () => {
		window.history.replaceState({ marker: true }, '', '/vibe/docs?tab=models#windows')
		const length = window.history.length
		writeLocaleToUrl('ru-RU')
		expect(window.location.pathname).toBe('/vibe/docs')
		expect(window.location.search).toBe('?tab=models&lang=ru-RU')
		expect(window.location.hash).toBe('#windows')
		expect(window.history.length).toBe(length)
	})
})

describe('layout document attributes', () => {
	it('adopts a supported ?lang= over the stored choice and makes it the stored choice', () => {
		localStorage.setItem('PARAGLIDE_LOCALE', 'ru-RU')
		renderLayout('/vibe/?lang=he-IL&ref=share')
		expect(getLocale()).toBe('he-IL')
		expect(localStorage.getItem('PARAGLIDE_LOCALE')).toBe('he-IL')
		expect(document.documentElement.lang).toBe('he-IL')
		expect(document.documentElement.getAttribute('dir')).toBe('rtl')
		expect(document.body.getAttribute('dir')).toBe('rtl')
	})

	it('keeps the stored choice when the URL has no lang parameter', () => {
		localStorage.setItem('PARAGLIDE_LOCALE', 'ru-RU')
		renderLayout('/vibe/')
		expect(getLocale()).toBe('ru-RU')
		expect(document.documentElement.lang).toBe('ru-RU')
		expect(document.documentElement.getAttribute('dir')).toBe('ltr')
		// The choice is represented in the URL so a link from here carries it.
		expect(new URLSearchParams(window.location.search).get('lang')).toBe('ru-RU')
	})

	it('renders the selector in both layouts and lists exactly the website locales', () => {
		renderLayout('/vibe/')
		const placements = [...document.querySelectorAll('[data-placement]')].map((element) => element.getAttribute('data-placement'))
		expect(placements).toEqual(['mobile', 'desktop'])

		fireEvent.click(screen.getAllByRole('button', { name: 'Language' })[0])
		const listed = [...document.querySelectorAll('[data-locale]')].map((element) => element.getAttribute('data-locale'))
		expect(listed).toEqual([...supportedWebsiteLocales])
	})

	it('switches locale, direction, lang and URL together', () => {
		renderLayout('/vibe/?foo=1#docs')
		fireEvent.click(screen.getAllByRole('button', { name: 'Language' })[0])
		const option = document.querySelector('[data-locale="he-IL"]')
		expect(option).not.toBeNull()
		fireEvent.click(option as HTMLElement)

		expect(getLocale()).toBe('he-IL')
		expect(document.documentElement.lang).toBe('he-IL')
		expect(document.documentElement.getAttribute('dir')).toBe('rtl')
		expect(window.location.search).toBe('?foo=1&lang=he-IL')
		expect(window.location.hash).toBe('#docs')
	})

	it('keeps the choice in the URL across in-site navigation', async () => {
		localStorage.setItem('PARAGLIDE_LOCALE', 'fr-FR')
		renderLayout('/vibe/')
		const featuresLink = screen.getAllByRole('link').find((link) => link.getAttribute('href')?.endsWith('/features'))
		expect(featuresLink).not.toBeNull()
		fireEvent.click(featuresLink as HTMLElement)
		await waitFor(() => expect(window.location.pathname).toBe('/vibe/features'))
		expect(getLocale()).toBe('fr-FR')
		expect(new URLSearchParams(window.location.search).get('lang')).toBe('fr-FR')
	})
})

describe('string coverage guard', () => {
	it('finds no hardcoded visible English in page and component sources', () => {
		const violations: string[] = []
		for (const [path, source] of Object.entries({ ...pageSources, ...componentSources })) {
			scanSource(path, source, violations)
		}
		expect(violations).toEqual([])
	})

	it('catches a planted literal', () => {
		const violations: string[] = []
		scanSource('Plant.tsx', 'export default function Plant() {\n\treturn <h1>Buy now</h1>\n}\n', violations)
		expect(violations).toHaveLength(1)
		expect(violations[0]).toContain('Buy now')
	})
})
