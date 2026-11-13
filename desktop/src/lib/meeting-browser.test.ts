// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { isMeetingLaunchArg, normalizeAllowedHost, normalizeMeetingUrl } from './meeting-browser'

describe('allowed host normalization', () => {
	it('lowercases a bare host and drops the trailing dot', () => {
		expect(normalizeAllowedHost(' Meet.Example.COM. ')).toBe('meet.example.com')
	})

	it('rejects paths, ports and credentials', () => {
		for (const value of ['example.com/path', 'example.com:443', 'user@example.com', 'not a host', '']) {
			expect(normalizeAllowedHost(value)).toBeNull()
		}
	})
})

describe('meeting launch arguments', () => {
	it('accepts the schemes other applications register', () => {
		for (const value of [
			'zoommtg://zoom.us/join?confno=123',
			'msteams://teams.microsoft.com/l/meetup-join/19%3ameeting',
			'teams://teams.microsoft.com/l/meetup-join/19%3ameeting',
			'webex://example.webex.com/meet/room',
		]) {
			expect(isMeetingLaunchArg(value)).toBe(true)
		}
	})

	it('accepts plain https links', () => {
		expect(isMeetingLaunchArg('https://stream.wb.ru/room')).toBe(true)
	})

	it('leaves the app’s own scheme, files and other protocols alone', () => {
		for (const value of ['vibe://download/?url=https://example.com/model.gguf', 'vibe://open/?url=https://x', '/tmp/a.wav', 'mailto:a@b.c']) {
			expect(isMeetingLaunchArg(value)).toBe(false)
		}
	})
})

describe('pasted meeting addresses', () => {
	it('adds https to a bare domain', () => {
		expect(normalizeMeetingUrl('stream.wb.ru/room')).toBe('https://stream.wb.ru/room')
		expect(normalizeMeetingUrl('  telemost.yandex.ru  ')).toBe('https://telemost.yandex.ru')
	})

	it('keeps an explicit scheme and meeting schemes', () => {
		expect(normalizeMeetingUrl('https://meet.example.com/j/1')).toBe('https://meet.example.com/j/1')
		expect(normalizeMeetingUrl('zoommtg://zoom.us/join?confno=1')).toBe('zoommtg://zoom.us/join?confno=1')
	})

	it('leaves an empty input empty', () => {
		expect(normalizeMeetingUrl('   ')).toBe('')
	})
})
