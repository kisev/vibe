// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { DEFAULT_MEETING_HOSTS, normalizeMeetingHost, parseBrowserDeepLink } from './meeting-browser'

describe('meeting host normalization', () => {
	it('lowercases a bare host and drops the trailing dot', () => {
		expect(normalizeMeetingHost(' Meet.Example.COM. ')).toBe('meet.example.com')
	})

	it('keeps the shipped defaults as bare hosts', () => {
		for (const host of DEFAULT_MEETING_HOSTS) expect(normalizeMeetingHost(host)).toBe(host)
	})

	it('rejects schemes, paths, ports and credentials', () => {
		for (const value of ['https://example.com', 'example.com/path', 'example.com:443', 'user@example.com', 'not a host', '']) {
			expect(normalizeMeetingHost(value)).toBeNull()
		}
	})
})

describe('vibe://open deep links', () => {
	it('reads the url query parameter', () => {
		expect(parseBrowserDeepLink('vibe://open/?url=https%3A%2F%2Ftelemost.yandex.ru%2Fj%2F123')).toEqual({
			url: 'https://telemost.yandex.ru/j/123',
		})
	})

	it('accepts path variants and reports a missing target', () => {
		expect(parseBrowserDeepLink('vibe://open/join?url=https://stream.wb.ru/room')).toEqual({ url: 'https://stream.wb.ru/room' })
		expect(parseBrowserDeepLink('vibe://open/')).toEqual({ url: null })
	})

	it('leaves other schemes to the download and file paths', () => {
		expect(parseBrowserDeepLink('vibe://download/?url=https://example.com/model.gguf')).toBeNull()
		expect(parseBrowserDeepLink('https://example.com')).toBeNull()
	})
})
