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
 * Whether a launch argument is a URL a meeting window could load at all: either an
 * `https://` link or one of the schemes other applications register (Zoom, Teams,
 * Webex). The Rust side maps the scheme and decides between the meeting window and
 * the system browser; nothing here guesses.
 */
export function isMeetingLaunchArg(raw: string): boolean {
	if (raw.startsWith('https://')) return true
	return /^(zoommtg|zoomus|msteams|teams|webex|wbx):/i.test(raw)
}

/** A pasted address may be a bare domain; https is the only web scheme the window loads. */
export function normalizeMeetingUrl(raw: string): string {
	const trimmed = raw.trim()
	if (!trimmed) return ''
	const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || /^(zoommtg|zoomus|msteams|teams|webex|wbx):/i.test(trimmed)
	return hasScheme ? trimmed : `https://${trimmed}`
}

/** Hand a scheme or web link to the Rust side, which maps it and picks the window. */
export const openMeetingLink = (raw: string) => invoke<BrowserSessionInfo | null>('open_meeting_link', { raw })

/** Reload the page a meeting window failed to show. */
export const retryMeetingBrowser = (session: number) => invoke<void>('meeting_browser_retry', { session })

/** Whether the app is registered as the system handler for Zoom/Teams/Webex links. */
export const getMeetingSchemesEnabled = () => invoke<boolean>('meeting_schemes_enabled')

export const setMeetingSchemesEnabled = (enabled: boolean) => invoke<void>('set_meeting_schemes_enabled', { enabled })

/** False on platforms where taking a scheme from its owner is not supported. */
export const meetingSchemesSupported = () => invoke<boolean>('meeting_schemes_supported')

/** A launch argument that is a meeting link: mapped and opened, with the failure reported. */
export async function handOffMeetingLink(raw: string): Promise<void> {
	try {
		await openMeetingLink(raw)
	} catch (error) {
		await message(m.meetingBrowserInvalidLink({ reason: String(error) }), { title: m.meetingBrowserTitle(), kind: 'error' })
	}
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
