// Browser-mode mocks for the meeting browser commands. The real single window and its native
// page webview cannot exist in a browser tab, so this keeps the session record, the allowlist
// and the blocked registry observable instead of pretending to load a page.
import { emitMockEvent } from '../event-bus'
import type { CommandHandlerMap } from '../types'

/** Mirrors the Rust event: the full blocked list, emitted whenever a new host is refused. */
const BROWSER_BLOCKED_HOSTS_EVENT = 'browser-blocked-hosts'
/** Mirrors the Rust event: an open chrome follows a policy saved in Settings. */
const BROWSER_POLICY_EVENT = 'browser-policy'
/** Same shape the Rust `normalize_host` accepts: a bare host, or a URL it can parse. */
const HOSTNAME_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/

/** Starts empty, like the Rust side: what the user stored is the only source of entries. */
let allowedHosts: string[] = []
let blockedHosts: string[] = []
/** `strict` checks every origin; `trusted-site` skips the (mock) resource filter only. */
let policy = 'strict'
let schemesEnabled = false
let nextSession = 0
interface MockSession {
	session: number
	url: string
	host: string
	canBack: boolean
	canForward: boolean
	history: string[]
	index: number
}
const sessions = new Map<number, MockSession>()

/** The bare lowercase host of a URL, or '' when it does not parse. */
function hostOf(url: string): string {
	try {
		return new URL(url).hostname.toLowerCase()
	} catch {
		return ''
	}
}

/** Mirror `browser_policy::normalize_host`, plus the two-label rule: `com` would allow every .com. */
function normalizeAllowedHost(value: unknown): string | null {
	const raw = String(value ?? '').trim()
	if (!raw) return null
	let host: string
	try {
		host = new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.toLowerCase().replace(/\.$/, '')
	} catch {
		return null
	}
	if (!host || host.length > 253) return null
	if (host !== 'localhost' && !host.includes('.')) return null
	if (!host.split('.').every((label) => HOSTNAME_LABEL.test(label))) return null
	return host
}

function recordBlocked(host: string) {
	if (!host || blockedHosts.includes(host)) return
	blockedHosts = [host, ...blockedHosts]
	// Rust emits the whole list on every new refusal so an open page can offer to allow it.
	emitMockEvent(BROWSER_BLOCKED_HOSTS_EVENT, [...blockedHosts])
}

function allowed(url: string): boolean {
	try {
		const parsed = new URL(url)
		if (parsed.protocol !== 'https:') return false
		return allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
	} catch {
		return false
	}
}

/** Like every other refusal in this mock, a bad URL must carry the group's prefix. */
function parseUrl(url: string): URL {
	try {
		return new URL(url)
	} catch {
		throw `[mock-meeting] Invalid URL: ${url}`
	}
}

/** Like `open_meeting_browser`: only an allowed https link opens, and a refusal is recorded. */
function openBrowser(url: string): MockSession {
	const parsed = parseUrl(url)
	if (parsed.protocol !== 'https:') {
		throw `[mock-meeting] Only https URLs can be opened; ${url} uses the ${parsed.protocol.replace(':', '')} scheme`
	}
	const host = hostOf(url)
	if (!allowed(url)) {
		recordBlocked(host)
		throw `[mock-meeting] ${host} is not in the allowlist`
	}
	const existing = [...sessions.values()].find((state) => state.url === url)
	if (existing) return existing
	const session = (nextSession += 1)
	const info: MockSession = { session, url, host, canBack: false, canForward: false, history: [url], index: 0 }
	sessions.set(session, info)
	return info
}

/** What a command returns: the session record without the mock-only browsing history. */
function sessionInfo(state: MockSession) {
	return { session: state.session, url: state.url, host: state.host, canBack: state.canBack, canForward: state.canForward }
}

/**
 * Mirror `meeting_schemes::meeting_url`: the web address a meeting scheme stands for, or null for
 * a shape the Rust side declines. Kept small on purpose — the mock exists to exercise the flow,
 * not to re-implement every validation rule Zoom links are held to.
 */
function meetingUrl(raw: string): string | null {
	const split = raw.indexOf('://')
	if (split < 0) return null
	const scheme = raw.slice(0, split).toLowerCase()
	const rest = raw.slice(split + 3)
	if (scheme === 'webex' || scheme === 'wbx') return `https://${rest}`
	const hostEnd = rest.search(/[/?#]/)
	const host = hostEnd < 0 ? rest : rest.slice(0, hostEnd)
	const tail = hostEnd < 0 ? '' : rest.slice(hostEnd)
	if (!host.includes('.')) return null
	if (scheme === 'msteams' || scheme === 'teams') return tail.startsWith('/') ? `https://${host}${tail}` : null
	if (scheme === 'zoommtg' || scheme === 'zoomus') {
		const query = tail.includes('?') ? tail.slice(tail.indexOf('?') + 1) : ''
		const value = (key: string) => query.split('&').find((pair) => pair.startsWith(`${key}=`))?.slice(key.length + 1)
		const confno = value('confno')
		// The meeting number is untrusted input: digits only, or it could rewrite the path.
		if (!confno || !/^\d+$/.test(confno)) return null
		const pwd = value('pwd')
		return `https://${host}/j/${confno}${pwd ? `?pwd=${encodeURIComponent(pwd)}` : ''}`
	}
	return null
}

export const meetingHandlers: CommandHandlerMap = {
	// --- Settings -------------------------------------------------------------

	browser_allowed_hosts: () => [...allowedHosts],

	browser_blocked_hosts: () => [...blockedHosts],

	browser_allow_host: (args) => {
		const host = normalizeAllowedHost(args.host)
		if (!host) throw `[mock-meeting] Enter a bare host name, not ${String(args.host ?? '')}`
		if (!allowedHosts.includes(host)) allowedHosts = [...allowedHosts, host]
		// Like Rust: allowing a host drops it from the blocked registry and publishes the list.
		if (blockedHosts.includes(host)) {
			blockedHosts = blockedHosts.filter((item) => item !== host)
			emitMockEvent(BROWSER_BLOCKED_HOSTS_EVENT, [...blockedHosts])
		}
		return [...allowedHosts]
	},

	browser_remove_allowed_host: (args) => {
		const host = normalizeAllowedHost(args.host)
		if (!host) throw `[mock-meeting] Invalid host ${String(args.host ?? '')}`
		allowedHosts = allowedHosts.filter((item) => item !== host)
		return [...allowedHosts]
	},

	// Like the Rust command: only the two known modes are accepted, and there is no "off".
	get_browser_policy: () => policy,

	set_browser_policy: (args) => {
		const next = String(args.policy ?? '')
		if (next !== 'strict' && next !== 'trusted-site') {
			throw `[mock-meeting] unknown browser policy: ${next}`
		}
		policy = next
		// Rust publishes the saved mode so an open chrome can grow or fold its blocked list.
		emitMockEvent(BROWSER_POLICY_EVENT, policy)
		return policy
	},

	meeting_schemes_enabled: () => schemesEnabled,

	set_meeting_schemes_enabled: (args) => {
		schemesEnabled = Boolean(args.enabled)
	},

	// Scheme registration is implemented for the platforms the mock reports (macOS).
	meeting_schemes_supported: () => true,

	// --- Meeting browser ------------------------------------------------------

	// Like the Rust command, including the order: a non-https or unparsable URL is refused
	// before the allowlist check, so it never lands in the blocked registry.
	open_meeting_browser: (args) => sessionInfo(openBrowser(String(args.url ?? ''))),

	meeting_browser_load: (args) => {
		const session = Number(args.session)
		const current = sessions.get(session)
		if (!current) throw `[mock-meeting] unknown session ${String(args.session)}`
		const url = String(args.url ?? '')
		const parsed = parseUrl(url)
		if (parsed.protocol !== 'https:') {
			throw `[mock-meeting] Only https URLs can be opened; ${url} uses the ${parsed.protocol.replace(':', '')} scheme`
		}
		const host = hostOf(url)
		if (!allowed(url)) {
			recordBlocked(host)
			throw `[mock-meeting] ${host} is not in the allowlist`
		}
		const history = [...current.history.slice(0, current.index + 1), url]
		const index = history.length - 1
		const next: MockSession = { ...current, url, host, canBack: index > 0, canForward: false, history, index }
		sessions.set(session, next)
		return sessionInfo(next)
	},

	meeting_browser_session: (args) => {
		const state = sessions.get(Number(args.session))
		return state ? sessionInfo(state) : null
	},

	// Back, forward and reload move through the mock's own history, like the Rust runtime.
	meeting_browser_navigate: (args) => {
		const session = Number(args.session)
		const current = sessions.get(session)
		if (!current) throw `[mock-meeting] unknown session ${String(args.session)}`
		const action = String(args.action ?? '')
		if (action === 'reload') return
		let index: number
		if (action === 'back') {
			if (current.index === 0) return
			index = current.index - 1
		} else if (action === 'forward') {
			if (current.index + 1 >= current.history.length) return
			index = current.index + 1
		} else {
			throw `[mock-meeting] unsupported navigation action ${action}`
		}
		const url = current.history[index]!
		sessions.set(session, {
			...current,
			url,
			host: hostOf(url),
			canBack: index > 0,
			canForward: index + 1 < current.history.length,
			index,
		})
	},

	meeting_browser_open_external: (args) => {
		if (!sessions.has(Number(args.session))) throw `[mock-meeting] unknown session ${String(args.session)}`
	},

	// A scheme or web link from the system: map it like `meeting_schemes::meeting_url`, open an
	// allowed link in the mock session and send anything else to the (mock) system browser.
	open_meeting_link: async (args) => {
		const raw = String(args.raw ?? '')
		const url = raw.startsWith('https://') ? raw : meetingUrl(raw)
		if (!url) throw `[mock-meeting] This link is not a meeting link Vibe can open: ${raw}`
		if (!allowed(url)) return null
		return sessionInfo(openBrowser(url))
	},

	meeting_browser_retry: (args) => {
		if (!sessions.has(Number(args.session))) {
			throw `[mock-meeting] unknown session ${String(args.session)}`
		}
	},

	meeting_browser_close: (args) => {
		sessions.delete(Number(args.session))
	},

	// The mock has no second webview to resize; accept the toggle so the chrome can call it.
	browser_set_chrome_expanded: () => undefined,

	meeting_browser_confirm_close: (args) => {
		sessions.delete(Number(args.session))
	},
}
