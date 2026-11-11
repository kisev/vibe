import { invoke } from '@tauri-apps/api/core'
import { message } from '@tauri-apps/plugin-dialog'
import { m } from '~/paraglide/messages.js'
import type { AudioDevice } from './audio'
import { CONFIG_KEYS } from './config-keys'
import { readConfig } from './config-store'
import { resolveSelection } from './device-selection'

/** The Rust-side session record, mirrored for the frontend. */
export interface BrowserSessionInfo {
	session: number
	url: string
	host: string
	isMeeting: boolean
	canBack: boolean
	canForward: boolean
}

export type BrowserNavigationAction = 'back' | 'forward' | 'reload'

/** Hosts the Rust side treats as meetings when the stored list has never been written. */
export const DEFAULT_MEETING_HOSTS = ['telemost.yandex.ru', 'stream.wb.ru']

export const openMeetingBrowser = (url: string) => invoke<BrowserSessionInfo>('open_meeting_browser', { url })

export const getMeetingBrowserSession = (session: number) => invoke<BrowserSessionInfo | null>('meeting_browser_session', { session })

export const navigateMeetingBrowser = (session: number, action: BrowserNavigationAction) =>
	invoke<void>('meeting_browser_navigate', { session, action })

export const openMeetingBrowserExternal = (session: number) => invoke<void>('meeting_browser_open_external', { session })

export const closeMeetingBrowser = (session: number) => invoke<void>('meeting_browser_close', { session })

export const confirmMeetingBrowserClose = (session: number, stopRecording: boolean) =>
	invoke<void>('meeting_browser_confirm_close', { session, stopRecording })

export const getMeetingHosts = () => invoke<string[]>('meeting_hosts')

export const setMeetingHosts = (hosts: string[]) => invoke<void>('set_meeting_hosts', { hosts })

export const isRecordingActive = () => invoke<boolean>('recording_active')

/**
 * A host is stored as the bare lowercase host name: no scheme, path, port or credentials.
 * Anything that is not one DNS-shaped name (letters, digits and inner hyphens, dot-separated)
 * is refused rather than silently cleaned up.
 */
const HOSTNAME_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export function normalizeMeetingHost(value: string): string | null {
	const host = value.trim().toLowerCase().replace(/\.$/, '')
	if (!host || host.length > 253) return null
	if (!host.split('.').every((label) => HOSTNAME_LABEL.test(label))) return null
	return host
}

/**
 * `vibe://open/?url=…` (and the path variants the deep-link plugin may hand over).
 * Returns null for anything that is not an open link; `url` is null when the link carries no
 * target, so the caller can tell "not ours" apart from "ours but malformed".
 */
export function parseBrowserDeepLink(raw: string): { url: string | null } | null {
	let parsed: URL
	try {
		parsed = new URL(raw)
	} catch {
		return null
	}
	if (parsed.protocol !== 'vibe:' || parsed.hostname !== 'open') return null
	return { url: parsed.searchParams.get('url') }
}

/**
 * Hand a deep-linked URL to the browser window. The Rust side validates it; a rejection is
 * reported with its reason and nothing is opened.
 */
export async function handOffMeetingUrl(url: string | null): Promise<void> {
	if (!url) {
		await message(m.meetingBrowserMissingLink(), { title: m.meetingBrowserTitle(), kind: 'error' })
		return
	}
	try {
		await openMeetingBrowser(url)
	} catch (error) {
		await message(m.meetingBrowserInvalidLink({ reason: String(error) }), { title: m.meetingBrowserTitle(), kind: 'error' })
	}
}

/** The configured device selection, resolved exactly like the main recording path. */
export async function readConfiguredRecordingDevices(): Promise<{ input: AudioDevice | null; output: AudioDevice | null }> {
	const devices = await invoke<AudioDevice[]>('get_audio_devices')
	const input = resolveSelection(
		devices.filter((device) => device.isInput),
		readConfig<string | null>(CONFIG_KEYS.inputDeviceName, null),
		readConfig<string[]>(CONFIG_KEYS.hiddenInputDevices, []),
	).device
	const output = resolveSelection(
		devices.filter((device) => !device.isInput),
		readConfig<string | null>(CONFIG_KEYS.outputDeviceName, null),
		readConfig<string[]>(CONFIG_KEYS.hiddenOutputDevices, []),
	).device
	return { input, output }
}
