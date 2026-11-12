// Browser-mode mocks for the meeting browser commands. The real window, page loads and
// native menus cannot exist in a browser tab, so this keeps the session record and the
// two close-gate decisions observable instead of pretending to load a page.
import type { CommandHandlerMap } from '../types'

/** Same default allowlist as `src/lib/meeting-browser.ts`; the real Rust side seeds it too. */
const DEFAULT_MEETING_HOSTS = ['telemost.yandex.ru', 'stream.wb.ru']

let hosts = [...DEFAULT_MEETING_HOSTS]
let schemesEnabled = false
let nextSession = 0
const sessions = new Map<number, { session: number; url: string; host: string; isMeeting: boolean; canBack: boolean; canForward: boolean }>()

function hostOf(url: string): string {
	try {
		return new URL(url).hostname
	} catch {
		return ''
	}
}

export const meetingHandlers: CommandHandlerMap = {
	// --- Settings -------------------------------------------------------------

	meeting_hosts: () => [...hosts],

	set_meeting_hosts: (args) => {
		hosts = ((args.hosts ?? []) as string[]).map((host) => String(host))
	},

	meeting_schemes_enabled: () => schemesEnabled,

	set_meeting_schemes_enabled: (args) => {
		schemesEnabled = Boolean(args.enabled)
	},

	// Scheme registration is implemented for the platforms the mock reports (macOS).
	meeting_schemes_supported: () => true,

	// --- Meeting browser ------------------------------------------------------

	// Like the Rust command: only a web link is loadable, anything else is refused.
	open_meeting_browser: (args) => {
		const url = String(args.url ?? '')
		if (!/^https?:\/\//i.test(url)) {
			throw `[mock-meeting] unsupported URL: ${url}`
		}
		const session = (nextSession += 1)
		const info = { session, url, host: hostOf(url), isMeeting: false, canBack: false, canForward: false }
		sessions.set(session, info)
		return info
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
