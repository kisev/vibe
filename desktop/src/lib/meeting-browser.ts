import { invoke } from '@tauri-apps/api/core'
import { message } from '@tauri-apps/plugin-dialog'
import { m } from '~/paraglide/messages.js'
import type { AudioDevice } from './audio'
import { CONFIG_KEYS } from './config-keys'
import { writeConfig } from './config-store'
import { resolveConfiguredSelection } from './device-selection'

/** The Rust-side session record, mirrored for the frontend. */
export interface BrowserSessionInfo {
	session: number
	url: string
	host: string
	canBack: boolean
	canForward: boolean
}

export type BrowserNavigationAction = 'back' | 'forward' | 'reload'

export const openMeetingBrowser = (url: string) => invoke<BrowserSessionInfo>('open_meeting_browser', { url })

export const getMeetingBrowserSession = (session: number) => invoke<BrowserSessionInfo | null>('meeting_browser_session', { session })

export const navigateMeetingBrowser = (session: number, action: BrowserNavigationAction) =>
	invoke<void>('meeting_browser_navigate', { session, action })

/** Load a URL typed into the chrome: it becomes a new entry in the session history. */
export const loadMeetingBrowserUrl = (session: number, url: string) => invoke<BrowserSessionInfo>('meeting_browser_load', { session, url })

export const openMeetingBrowserExternal = (session: number) => invoke<void>('meeting_browser_open_external', { session })

export const closeMeetingBrowser = (session: number) => invoke<void>('meeting_browser_close', { session })

/**
 * Grow the chrome webview so the blocked-hosts region fits inside it (the page moves down), or
 * restore the toolbar height. The Rust side applies the same bounds helper as a window resize.
 */
export const setBrowserChromeExpanded = (session: number, expanded: boolean) =>
	invoke<void>('browser_set_chrome_expanded', { session, expanded })

export const confirmMeetingBrowserClose = (session: number, stopRecording: boolean) =>
	invoke<void>('meeting_browser_confirm_close', { session, stopRecording })

/** The domains the embedded browser may load, with their subdomains, over https only. */
export const getBrowserAllowedHosts = () => invoke<string[]>('browser_allowed_hosts')

/** Unique hosts the browser refused, newest first; empty until something is blocked. */
export const getBrowserBlockedHosts = () => invoke<string[]>('browser_blocked_hosts')

/** Allow a host; the Rust side persists it, drops it from the blocked list and reloads pages. */
export const allowBrowserHost = (host: string) => invoke<string[]>('browser_allow_host', { host })

export const removeBrowserAllowedHost = (host: string) => invoke<string[]>('browser_remove_allowed_host', { host })

/**
 * How far the allowlist reaches. `strict` checks every origin; `trusted-site` lets an allowed
 * page load resources from anywhere, but navigation is gated in both modes.
 */
export type BrowserPolicy = 'strict' | 'trusted-site'

/** The stored policy; a missing value means `strict`. */
export const getBrowserPolicy = () => invoke<BrowserPolicy>('get_browser_policy')

/** Persist the policy. The backend refuses anything but the two known values. */
export const setBrowserPolicy = (policy: BrowserPolicy) => invoke<BrowserPolicy>('set_browser_policy', { policy })

/** The full blocked list, emitted whenever a new host is refused. */
export const BROWSER_BLOCKED_HOSTS_EVENT = 'browser-blocked-hosts'

/** The new mode, emitted when Settings saves the policy, so an open chrome updates. */
export const BROWSER_POLICY_EVENT = 'browser-policy'

/** A refused top-level navigation for one session, so its chrome can offer to allow the host. */
export const BROWSER_NAVIGATION_BLOCKED_EVENT = 'meeting-browser-navigation-blocked'

export interface BrowserNavigationBlocked {
	session: number
	host: string
}

export const isRecordingActive = () => invoke<boolean>('recording_active')

/**
 * A host is stored as the bare lowercase host name: no scheme, path, port or credentials.
 * Anything that is not one DNS-shaped name (letters, digits and inner hyphens, dot-separated)
 * is refused rather than silently cleaned up. A single-label entry is refused too — allowing
 * `com` would match every `*.com` host — except `localhost`.
 */
const HOSTNAME_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

export function normalizeAllowedHost(value: string): string | null {
	const host = value.trim().toLowerCase().replace(/\.$/, '')
	if (!host || host.length > 253) return null
	if (host !== 'localhost' && !host.includes('.')) return null
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

/**
 * What a pasted address should open as: a web page the meeting window can load, or a scheme
 * Rust maps. `https://` is the only web scheme the page webview loads, so an `http` (or an
 * uppercase `HTTPS`) link is upgraded here and nowhere else. Empty input resolves to `null`.
 */
export function resolveMeetingAddress(raw: string): { kind: 'web' | 'scheme'; url: string } | null {
	const normalized = normalizeMeetingUrl(raw)
	if (!normalized) return null
	if (/^https?:\/\//i.test(normalized)) return { kind: 'web', url: normalized.replace(/^https?:\/\//i, 'https://') }
	return { kind: 'scheme', url: normalized }
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

/** Hand over a launch argument when it is a meeting link; true when it was handled. */
export async function handOffMeetingLaunchArg(raw: string): Promise<boolean> {
	if (!isMeetingLaunchArg(raw)) return false
	await handOffMeetingLink(raw)
	return true
}

/** Everything a chrome-only picker needs: the device snapshot and the configured selection. */
export interface RecordingDeviceState {
	devices: AudioDevice[]
	input: AudioDevice | null
	output: AudioDevice | null
	inputUnavailableName: string | null
	outputUnavailableName: string | null
	hiddenInputDevices: string[]
	hiddenOutputDevices: string[]
}

/**
 * Resolve the configured recording devices exactly like the main recording path: stable device
 * names, the system default when nothing is pinned, and a pinned-but-absent name flagged rather
 * than silently replaced.
 */
export async function readRecordingDeviceState(): Promise<RecordingDeviceState> {
	const devices = await invoke<AudioDevice[]>('get_audio_devices')
	const input = resolveConfiguredSelection(devices, 'input')
	const output = resolveConfiguredSelection(devices, 'output')
	return {
		devices,
		input: input.device,
		output: output.device,
		inputUnavailableName: input.unavailableName,
		outputUnavailableName: output.unavailableName,
		hiddenInputDevices: input.hiddenNames,
		hiddenOutputDevices: output.hiddenNames,
	}
}

/**
 * Persist a picker choice under the same keys and convention the main window uses: an empty name
 * is an explicit "no device", `null` (nothing chosen) writes the same explicit "none". The system
 * default is never written, so `resolveSelection` keeps reading the saved name as a pin.
 */
export function writeRecordingDeviceSelection(type: 'input' | 'output', name: string | null): void {
	writeConfig(type === 'input' ? CONFIG_KEYS.inputDeviceName : CONFIG_KEYS.outputDeviceName, name ?? '')
}

/** What the main window reports about the recording it owns, for the chrome to mirror. */
export const RECORDING_STATE_EVENT = 'meeting-browser-recording-state'
/** Ask the main window to start or stop recording on the chrome's behalf. */
export const RECORDING_TOGGLE_EVENT = 'meeting-browser-recording-toggle'
/** Ask the main window to repeat its state, for a chrome that mounts while recording. */
export const RECORDING_STATE_REQUEST_EVENT = 'meeting-browser-recording-state-request'

export interface RecordingStatePayload {
	recording: boolean
	/** Epoch ms when the recording began, or null when idle. */
	startedAt: number | null
	/** Which sources this run captures, so the chrome draws only the meters that mean something. */
	sources?: ('microphone' | 'system')[]
	/**
	 * Names of the devices this run actually records, so the chrome names them even when the
	 * config has moved since the start. Absent when the reporter does not know the run (a
	 * recording it did not start); null when that source is not captured at all.
	 */
	inputName?: string | null
	outputName?: string | null
}
