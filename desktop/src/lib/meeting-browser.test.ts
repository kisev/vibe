// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handOffMeetingLaunchArg, handOffMeetingLink, isMeetingLaunchArg, normalizeAllowedHost, normalizeMeetingUrl } from './meeting-browser'

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(),
	message: vi.fn(async () => true),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('@tauri-apps/plugin-dialog', () => ({ message: mocks.message }))

describe('allowed host normalization', () => {
	it('lowercases a bare host and drops the trailing dot', () => {
		expect(normalizeAllowedHost(' Meet.Example.COM. ')).toBe('meet.example.com')
	})

	it('rejects paths, ports and credentials', () => {
		for (const value of ['example.com/path', 'example.com:443', 'user@example.com', 'not a host', '']) {
			expect(normalizeAllowedHost(value)).toBeNull()
		}
	})

	it('rejects a single label, which would allow a whole top-level domain', () => {
		for (const value of ['com', 'net', 'io']) {
			expect(normalizeAllowedHost(value)).toBeNull()
		}
		// The local development host stays usable.
		expect(normalizeAllowedHost('localhost')).toBe('localhost')
	})
})

describe('meeting launch arguments', () => {
	beforeEach(() => {
		mocks.invoke.mockReset()
		mocks.message.mockClear()
	})

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

	it('hands a meeting scheme or an https launch argument to the Rust router', async () => {
		mocks.invoke.mockResolvedValue(null)
		expect(await handOffMeetingLaunchArg('zoommtg://zoom.us/join?confno=1')).toBe(true)
		expect(mocks.invoke).toHaveBeenCalledWith('open_meeting_link', {
			raw: 'zoommtg://zoom.us/join?confno=1',
		})

		expect(await handOffMeetingLaunchArg('https://meet.example.com/j/1')).toBe(true)
		expect(mocks.invoke).toHaveBeenLastCalledWith('open_meeting_link', {
			raw: 'https://meet.example.com/j/1',
		})
	})

	it('leaves a launch argument it does not handle untouched', async () => {
		expect(await handOffMeetingLaunchArg('mailto:a@b.c')).toBe(false)
		expect(mocks.invoke).not.toHaveBeenCalled()
	})

	it('reports an invalid link in a dialog and opens nothing', async () => {
		mocks.invoke.mockRejectedValue(new Error('Only https URLs can be opened'))
		await handOffMeetingLink('https://meet.example.com/j/1')

		expect(mocks.invoke).toHaveBeenCalledWith('open_meeting_link', {
			raw: 'https://meet.example.com/j/1',
		})
		expect(mocks.message).toHaveBeenCalledTimes(1)
		expect(String(mocks.message.mock.calls[0][0])).toContain('Only https URLs can be opened')
	})
})

describe('app capability isolation', () => {
	it('grants the app’s permissions to the chrome webview only, never the page', () => {
		const capabilities = JSON.parse(readFileSync(join(__dirname, '../../src-tauri/capabilities/main.json'), 'utf8'))
		expect(capabilities.webviews).toEqual(['browser-chrome-*'])
		expect(capabilities.webviews.some((pattern: string) => pattern.startsWith('browser-page'))).toBe(false)
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
