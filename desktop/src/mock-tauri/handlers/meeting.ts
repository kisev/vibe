// Browser-mode mocks for the meeting browser commands. The real single window and its native
// page webview cannot exist in a browser tab, so this keeps the session record, the allowlist
// and the blocked registry observable instead of pretending to load a page.
import type { CommandHandlerMap } from '../types'

/** Starts empty, like the Rust side: what the user stored is the only source of entries. */
let allowedHosts: string[] = []
let blockedHosts: string[] = []
let schemesEnabled = false
let nextSession = 0
const sessions = new Map<number, { session: number; url: string; host: string; canBack: boolean; canForward: boolean }>()

function hostOf(url: string): string {
	try {
		return new URL(url).hostname
	} catch {
		return ''
	}
}

function recordBlocked(host: string) {
	if (!host || blockedHosts.includes(host)) return
	blockedHosts = [host, ...blockedHosts]
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

export const meetingHandlers: CommandHandlerMap = {
	// --- Settings -------------------------------------------------------------

	browser_allowed_hosts: () => [...allowedHosts],

	browser_blocked_hosts: () => [...blockedHosts],

	browser_allow_host: (args) => {
		const host = String(args.host ?? '').trim().toLowerCase()
		if (host && !allowedHosts.includes(host)) allowedHosts = [...allowedHosts, host]
		blockedHosts = blockedHosts.filter((item) => item !== host)
		return [...allowedHosts]
	},

	browser_remove_allowed_host: (args) => {
		const host = String(args.host ?? '').trim().toLowerCase()
		allowedHosts = allowedHosts.filter((item) => item !== host)
		return [...allowedHosts]
	},

	meeting_schemes_enabled: () => schemesEnabled,

	set_meeting_schemes_enabled: (args) => {
		schemesEnabled = Boolean(args.enabled)
	},

	// Scheme registration is implemented for the platforms the mock reports (macOS).
	meeting_schemes_supported: () => true,

	// --- Meeting browser ------------------------------------------------------

	// Like the Rust command: only an allowed https link opens; anything else is refused and
	// recorded so the blocked list can offer to allow it.
	open_meeting_browser: (args) => {
		const url = String(args.url ?? '')
		if (!/^https?:\/\//i.test(url)) {
			throw `[mock-meeting] unsupported URL: ${url}`
		}
		const host = hostOf(url)
		if (!allowed(url)) {
			recordBlocked(host)
			throw `[mock-meeting] ${host} is not in the allowlist`
		}
		const session = (nextSession += 1)
		const info = { session, url, host, canBack: false, canForward: false }
		sessions.set(session, info)
		return info
	},

	meeting_browser_load: (args) => {
		const session = Number(args.session)
		const current = sessions.get(session)
		if (!current) throw `[mock-meeting] unknown session ${String(args.session)}`
		const url = String(args.url ?? '')
		if (!/^https?:\/\//i.test(url)) throw `[mock-meeting] unsupported URL: ${url}`
		const host = hostOf(url)
		if (!allowed(url)) {
			recordBlocked(host)
			throw `[mock-meeting] ${host} is not in the allowlist`
		}
		const next = { ...current, url, host, canBack: true, canForward: false }
		sessions.set(session, next)
		return next
	},

	meeting_browser_retry: (args) => {
		if (!sessions.has(Number(args.session))) {
			throw `[mock-meeting] unknown session ${String(args.session)}`
		}
	},

	meeting_browser_close: (args) => {
		sessions.delete(Number(args.session))
	},

	meeting_browser_confirm_close: (args) => {
		sessions.delete(Number(args.session))
	},
}
