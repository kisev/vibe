// The browser chrome: the trusted app UI shown in the top strip of the meeting browser window.
// The window holds two webviews — this chrome and the remote page below it — so the native page
// covers everything under the toolbar and only the toolbar's height matters here.
//
// This is a chrome-only surface: `bootstrap` mounts it instead of the app, so it never runs the
// startup migrations, device enumeration or server supervision a second time. Recording is the
// main window's job: the chrome only asks it, through an event, and mirrors the state it reports.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ArrowLeft, ArrowRight, ExternalLink, Mic, RotateCw, ShieldAlert, Square, X } from 'lucide-react'
import RecordingIndicator from '~/components/recording-feedback'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { AudioDevice } from '~/lib/audio'
import { deviceMenuEntries, type DeviceMenuEntry } from '~/lib/device-selection'
import {
	allowBrowserHost,
	BROWSER_BLOCKED_HOSTS_EVENT,
	BROWSER_NAVIGATION_BLOCKED_EVENT,
	BROWSER_POLICY_EVENT,
	closeMeetingBrowser,
	getBrowserBlockedHosts,
	getBrowserPolicy,
	getMeetingBrowserSession,
	navigateMeetingBrowser,
	openMeetingBrowserExternal,
	loadMeetingBrowserUrl,
	normalizeMeetingUrl,
	readRecordingDeviceState,
	setBrowserChromeExpanded,
	writeRecordingDeviceSelection,
	RECORDING_STATE_EVENT,
	RECORDING_STATE_REQUEST_EVENT,
	RECORDING_TOGGLE_EVENT,
	type BrowserNavigationAction,
	type BrowserNavigationBlocked,
	type BrowserPolicy,
	type BrowserSessionInfo,
	type RecordingDeviceState,
	type RecordingStatePayload,
} from '~/lib/meeting-browser'
import { m } from '~/paraglide/messages.js'
import { getLocale, getTextDirection, isLocale, setLocale } from '~/paraglide/runtime.js'
import { CONFIG_KEYS } from '~/lib/config-keys'
import { usePersisted } from '~/lib/config-store'
import { cn } from '~/lib/style'

/**
 * The chrome webview is sized by Rust before this script runs, and both sides must agree on the
 * same two heights. Rust passes them in the window URL so neither constant can drift silently;
 * the literals below are the fallback for a stale Rust side and for the unit tests.
 */
const chromeParams = new URLSearchParams(window.location.search)
function chromeHeight(name: string, fallback: number): number {
	const parsed = Number(chromeParams.get(name))
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
const TOOLBAR_HEIGHT = chromeHeight('toolbar', 104)
const BLOCKED_LIST_HEIGHT = chromeHeight('blocked', 200)

/** A native option cannot use a component, so "none" and the absent pin get their copy here. */
function entryLabel(entry: DeviceMenuEntry): string {
	if (entry.kind === 'none') return m.noRecord()
	if (entry.kind === 'unavailable') return m.deviceUnavailable({ name: entry.label })
	return entry.label
}

/**
 * A compact device picker: the same device list, hidden lists and "none" entry the main window's
 * recorder uses, so a pick here means the same device there. Chrome-only, so it never asks the
 * settings view-model for anything.
 */
function DevicePicker({
	type,
	label,
	devices,
	device,
	unavailableName,
	hiddenNames,
	disabled,
	recordedName,
	onPick,
}: {
	type: 'input' | 'output'
	label: string
	devices: AudioDevice[]
	device: AudioDevice | null
	unavailableName: string | null
	hiddenNames: string[]
	disabled: boolean
	/** The device the running recording actually captures; undefined when idle or unreported. */
	recordedName?: string | null
	onPick: (entry: DeviceMenuEntry) => void
}) {
	const entries = deviceMenuEntries(devices, type, hiddenNames, unavailableName)
	// While a recording runs the picker names what it captures, which need not be what the shared
	// config says now: the run resolved its devices when it started, possibly in another window.
	const shownDevice =
		recordedName === undefined
			? device
			: (devices.find((candidate) => candidate.name === recordedName && candidate.isInput === (type === 'input')) ?? null)
	const value =
		recordedName === undefined
			? (device?.id ?? (unavailableName ? 'unavailable' : 'none'))
			: shownDevice
				? shownDevice.id
				: recordedName
					? 'recorded'
					: 'none'
	const triggerLabel =
		recordedName === undefined
			? (device?.name ?? (unavailableName ? m.deviceUnavailable({ name: unavailableName }) : m.noRecord()))
			: (recordedName ?? m.noRecord())

	return (
		// A native select on purpose: its popup is drawn by the platform, so the device list is not
		// clipped by the 104-pixel chrome webview, which sits above the page.
		<select
			aria-label={label}
			title={disabled ? m.recordingDevicesLocked() : triggerLabel}
			value={value}
			disabled={disabled}
			onChange={(event) => {
				const entry = entries.find((candidate) => candidate.value === event.target.value)
				if (entry) onPick(entry)
			}}
			className={cn('h-8 w-36 shrink-0 truncate rounded-lg border border-input/60 bg-muted/40 px-2 text-xs text-foreground', disabled && 'opacity-60')}>
			{entries
				.filter((entry) => entry.kind !== 'hidden')
				.map((entry) => (
					<option key={entry.value} value={entry.value}>
						{entryLabel(entry)}
					</option>
				))}
			{value !== 'none' && !entries.some((entry) => entry.value === value) && <option value={value}>{triggerLabel}</option>}
		</select>
	)
}

export default function BrowserWindow({ session }: { session: number }) {
	// The chrome must follow the app's theme and language: it is a separate webview, so the
	// providers never run here and nothing would set the `dark` class or the locale. Subscribing
	// (rather than reading once) makes a change in the main window reach a chrome already open.
	const [theme] = usePersisted<'light' | 'dark'>(
		CONFIG_KEYS.theme,
		window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
	)
	const [locale] = usePersisted<string>(CONFIG_KEYS.displayLanguage, getLocale())
	useLayoutEffect(() => {
		// A hand-edited config must not push an unknown locale into Paraglide; fall back to the
		// resolved one, exactly like bootstrap's pre-paint pass.
		const stored = isLocale(locale) ? locale : undefined
		if (stored) setLocale(stored, { reload: false })
		const active = stored ?? getLocale()
		document.documentElement.lang = active
		document.body.dir = getTextDirection(active)
		document.documentElement.classList.toggle('dark', theme === 'dark')
		void getCurrentWindow()
			.setTheme(theme)
			.catch(() => undefined)
	}, [locale, theme])

	const [info, setInfo] = useState<BrowserSessionInfo | null>(null)
	const [address, setAddress] = useState('')
	/** True while the user is typing an address, so a page redirect does not overwrite it. */
	const addressFocused = useRef(false)
	const [error, setError] = useState<string | null>(null)
	/** A host the allowlist refused in this window; the notice offers to allow it. */
	const [blockedHost, setBlockedHost] = useState<string | null>(null)
	/** Every host the strict policy refused; the toolbar offers to allow them. */
	const [blockedHosts, setBlockedHosts] = useState<string[]>([])
	/** The list is an in-chrome region, not a popup: open means the chrome has grown. */
	const [listExpanded, setListExpanded] = useState(false)
	const [policy, setPolicy] = useState<BrowserPolicy>('strict')
	const [recording, setRecording] = useState(false)
	const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
	const [recordingSources, setRecordingSources] = useState<('microphone' | 'system')[]>(['microphone', 'system'])
	const [recordingDevices, setRecordingDevices] = useState<RecordingDeviceState | null>(null)
	/** The devices the running recording reports; null when idle or when the reporter omitted them. */
	const [recordedDevices, setRecordedDevices] = useState<{ input: string | null; output: string | null } | null>(null)

	/** Hidden with no hosts to show, or when the policy leaves resources unfiltered. */
	const showBlockedList = policy === 'strict' && blockedHosts.length > 0

	/** Ask the Rust side to grow or restore the chrome; the page follows to the remaining height. */
	const setChromeExpanded = useCallback(
		(expanded: boolean) => {
			void setBrowserChromeExpanded(session, expanded).catch((reason) => console.error('could not resize the browser chrome:', reason))
		},
		[session],
	)

	/** A close or an empty list must never leave the page displaced by an open region. */
	const collapseList = useCallback(() => {
		setListExpanded(false)
		setChromeExpanded(false)
	}, [setChromeExpanded])

	const refreshDevices = useCallback(async () => {
		try {
			setRecordingDevices(await readRecordingDeviceState())
		} catch (reason) {
			console.error('could not read the recording devices:', reason)
		}
	}, [])

	useEffect(() => {
		let active = true
		getMeetingBrowserSession(session)
			.then((current) => {
				if (!active) return
				setInfo(current)
				if (current) setAddress(current.url)
			})
			.catch((reason) => console.error('could not read the browser session:', reason))
		// The stored mode only seeds the chrome: the Rust filter follows the cached policy, and
		// BROWSER_POLICY_EVENT below updates an open window when Settings saves a change.
		getBrowserPolicy()
			.then((storedPolicy) => {
				if (active) setPolicy(storedPolicy)
			})
			.catch((reason) => console.error('could not read the browser policy:', reason))
		getBrowserBlockedHosts()
			.then((hosts) => {
				if (active) setBlockedHosts(hosts)
			})
			.catch((reason) => console.error('could not read the blocked hosts:', reason))

		const unlisteners: (() => void)[] = []
		// `listen` resolves asynchronously: if the window unmounts first, unsubscribe immediately
		// instead of leaving the handler behind for a webview that already went away.
		const track = (pending: Promise<() => void>) => pending.then((fn) => (active ? unlisteners.push(fn) : fn()))

		track(listen<string[]>(BROWSER_BLOCKED_HOSTS_EVENT, (event) => setBlockedHosts(event.payload)))
		track(listen<BrowserPolicy>(BROWSER_POLICY_EVENT, (event) => setPolicy(event.payload)))
		track(
			listen<BrowserSessionInfo>('meeting-browser-session', (event) => {
				if (event.payload.session !== session) return
				setInfo(event.payload)
				// A redirect during a login flow must not wipe an address being typed right now.
				if (!addressFocused.current) setAddress(event.payload.url)
				setBlockedHost(null)
			}),
		)
		track(
			listen<BrowserNavigationBlocked>(BROWSER_NAVIGATION_BLOCKED_EVENT, (event) => {
				if (event.payload.session !== session) return
				setBlockedHost(event.payload.host)
			}),
		)
		track(
			listen<{ session: number }>('meeting-browser-closed', (event) => {
				if (event.payload.session !== session) return
				// Restore the page before the window goes away, in case unmount never runs.
				setChromeExpanded(false)
				void getCurrentWindow().close()
			}),
		)
		listen<RecordingStatePayload>(RECORDING_STATE_EVENT, (event) => {
			setRecording(event.payload.recording)
			setRecordingStartedAt(event.payload.recording ? (event.payload.startedAt ?? Date.now()) : null)
			if (event.payload.sources?.length) setRecordingSources(event.payload.sources)
			// Several surfaces report the same run. One that did not resolve its devices omits the
			// fields, so an absent report keeps what a surface that did know already said.
			if (!event.payload.recording) setRecordedDevices(null)
			else if (event.payload.inputName !== undefined || event.payload.outputName !== undefined) {
				setRecordedDevices({ input: event.payload.inputName ?? null, output: event.payload.outputName ?? null })
			}
		}).then((fn) => {
			if (active) unlisteners.push(fn)
			else fn()
			// A chrome opened while a recording already runs learns the current state instead of
			// waiting for the next flip. Asked only now, so the answer cannot arrive before the listener.
			void emit(RECORDING_STATE_REQUEST_EVENT)
		})

		// Devices refresh on focus, when the main window may have moved.
		void refreshDevices()
		const onFocus = () => void refreshDevices()
		window.addEventListener('focus', onFocus)

		return () => {
			active = false
			window.removeEventListener('focus', onFocus)
			for (const unlisten of unlisteners) unlisten()
		}
	}, [session, refreshDevices, setChromeExpanded])

	// Nothing left to show (every host allowed, or trusted-site): hide and restore the toolbar.
	useEffect(() => {
		if (listExpanded && !showBlockedList) collapseList()
	}, [listExpanded, showBlockedList, collapseList])

	// A chrome that unmounts must not leave the page shoved down by a region nobody can see.
	useEffect(() => () => setChromeExpanded(false), [setChromeExpanded])

	async function run(action: () => Promise<unknown>) {
		try {
			setError(null)
			await action()
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : String(reason))
		}
	}

	function navigate(action: BrowserNavigationAction) {
		void run(() => navigateMeetingBrowser(session, action))
	}

	function go() {
		// The address bar takes the same input as the settings field: a bare domain becomes https
		// (and an http link is upgraded), which is the only scheme the page webview loads.
		const url = normalizeMeetingUrl(address.trim()).replace(/^http:\/\//i, 'https://')
		if (!url) return
		void run(() => loadMeetingBrowserUrl(session, url))
	}

	/** Allow a refused host; the Rust side persists it and reloads the page webviews. */
	function allowHost(host: string) {
		void run(async () => {
			await allowBrowserHost(host)
			setBlockedHosts((current) => current.filter((item) => item !== host))
			setBlockedHost(null)
		})
		// The action the region existed for is done; fold the chrome back to the toolbar.
		collapseList()
	}

	/** The shield grows the chrome to show the list and folds it back on the second press. */
	function toggleBlockedList() {
		const expanded = !listExpanded
		setListExpanded(expanded)
		setChromeExpanded(expanded)
	}

	/**
	 * A pick is written under the main window's keys; the config store carries it across windows.
	 * Hidden entries are filtered out of the select, so a device un-hidden from here is not
	 * reachable: the main window's picker is where a hidden device is restored.
	 */
	function pickDevice(type: 'input' | 'output', entry: DeviceMenuEntry) {
		if (entry.kind === 'unavailable' || entry.kind === 'hidden') return
		writeRecordingDeviceSelection(type, entry.kind === 'none' ? null : entry.label)
		void refreshDevices()
	}

	// While the running recording reports its devices, they win over the shared config: the config
	// may have moved since the run started, and a source it does not capture is not any device.
	const recordedInputName = recording && recordedDevices ? recordedDevices.input : undefined
	const recordedOutputName = recording && recordedDevices ? recordedDevices.output : undefined
	const microphoneName = recordedInputName !== undefined ? (recordedInputName ?? m.noRecord()) : (recordingDevices?.input?.name ?? m.noRecord())
	const systemName = recordedOutputName !== undefined ? (recordedOutputName ?? m.noRecord()) : (recordingDevices?.output?.name ?? m.noRecord())

	return (
		<div className="flex h-screen w-screen flex-col bg-background text-sm">
			<div className="flex shrink-0 flex-col justify-center gap-2 bg-background px-3 py-2" style={{ height: TOOLBAR_HEIGHT }}>
				<div className="flex items-center gap-1.5" dir="ltr">
					<Button variant="ghost" size="icon" aria-label={m.meetingBarBack()} disabled={!info?.canBack} onClick={() => navigate('back')}>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" aria-label={m.meetingBarForward()} disabled={!info?.canForward} onClick={() => navigate('forward')}>
						<ArrowRight className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" aria-label={m.meetingBarReload()} onClick={() => navigate('reload')}>
						<RotateCw className="h-4 w-4" />
					</Button>
					<form
						className="flex-1"
						onSubmit={(event) => {
							event.preventDefault()
							go()
						}}>
						<Input
							aria-label={m.meetingBarAddress()}
							placeholder={m.meetingBarAddress()}
							value={address}
							spellCheck={false}
							className="h-8 font-mono text-xs"
							onChange={(event) => setAddress(event.target.value)}
							onFocus={() => {
								addressFocused.current = true
							}}
							onBlur={() => {
								addressFocused.current = false
							}}
						/>
					</form>
					{/* Strict only: the region below the toolbar is hidden in trusted-site mode. */}
					{showBlockedList && (
						<Button
							variant="ghost"
							size="icon"
							className="relative"
							aria-label={m.browserBlockedHostsCount({ count: blockedHosts.length })}
							aria-expanded={listExpanded}
							title={m.browserBlockedHostsCount({ count: blockedHosts.length })}
							onClick={toggleBlockedList}>
							<ShieldAlert className="h-4 w-4 text-destructive" />
							<span className="pointer-events-none absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
								{blockedHosts.length}
							</span>
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						aria-label={m.meetingBarOpenExternal()}
						onClick={() => void run(() => openMeetingBrowserExternal(session))}>
						<ExternalLink className="h-4 w-4" />
					</Button>
					<Button variant="ghost" size="icon" aria-label={m.meetingBarClose()} onClick={() => void run(() => closeMeetingBrowser(session))}>
						<X className="h-4 w-4" />
					</Button>
				</div>
				<div className="flex min-w-0 items-center gap-2" dir="ltr">
					<div role="group" aria-label={m.recordingDevices()} className="flex min-w-0 items-center gap-2">
						<DevicePicker
							type="input"
							label={m.microphone()}
							devices={recordingDevices?.devices ?? []}
							device={recordingDevices?.input ?? null}
							unavailableName={recordingDevices?.inputUnavailableName ?? null}
							hiddenNames={recordingDevices?.hiddenInputDevices ?? []}
							disabled={recording}
							recordedName={recordedInputName}
							onPick={(entry) => pickDevice('input', entry)}
						/>
						<DevicePicker
							type="output"
							label={m.systemAudio()}
							devices={recordingDevices?.devices ?? []}
							device={recordingDevices?.output ?? null}
							unavailableName={recordingDevices?.outputUnavailableName ?? null}
							hiddenNames={recordingDevices?.hiddenOutputDevices ?? []}
							disabled={recording}
							recordedName={recordedOutputName}
							onPick={(entry) => pickDevice('output', entry)}
						/>
					</div>
					{recording ? (
						<Button size="sm" variant="secondary" onClick={() => void run(() => emit(RECORDING_TOGGLE_EVENT, { stop: true }))}>
							<Square />
							{m.meetingBrowserStop()}
						</Button>
					) : (
						<Button size="sm" onClick={() => void run(() => emit(RECORDING_TOGGLE_EVENT, { stop: false }))}>
							<Mic />
							{m.meetingBrowserRecord()}
						</Button>
					)}
					{recording && (
						<RecordingIndicator
							compact
							startedAt={recordingStartedAt}
							microphoneName={microphoneName}
							systemName={systemName}
							sources={recordingSources}
						/>
					)}
					{blockedHost ? (
						<div className="flex min-w-0 items-center gap-2">
							<span className="min-w-0 truncate text-xs text-destructive">{error ?? m.browserNavigationBlocked({ host: blockedHost })}</span>
							<Button size="sm" variant="outline" onClick={() => allowHost(blockedHost)}>
								{m.browserBlockedHostAllow()}
							</Button>
						</div>
					) : (
						<span className={error ? 'min-w-0 truncate text-xs text-destructive' : 'min-w-0 truncate text-xs text-muted-foreground'}>
							{error ?? info?.host ?? ''}
						</span>
					)}
				</div>
			</div>
			{/* In the chrome webview, which has grown so the page cannot clip it. */}
			{listExpanded && showBlockedList && (
				<div
					role="region"
					aria-label={m.browserBlockedHosts()}
					className="flex shrink-0 flex-col overflow-hidden border-t bg-background px-3 py-2"
					style={{ height: BLOCKED_LIST_HEIGHT }}>
					<p className="px-1 pb-1 text-xs font-medium text-foreground">{m.browserBlockedHosts()}</p>
					<div className="min-h-0 space-y-0.5 overflow-y-auto">
						{blockedHosts.map((host) => (
							<div key={host} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 hover:bg-accent/45">
								<span className="min-w-0 truncate font-mono text-xs">{host}</span>
								<Button
									type="button"
									variant="outline"
									size="sm"
									className="h-7 shrink-0 px-2 text-xs"
									aria-label={m.browserBlockedHostAllowHost({ host })}
									onClick={() => allowHost(host)}>
									{m.browserBlockedHostAllow()}
								</Button>
							</div>
						))}
					</div>
				</div>
			)}
			{/* Native page webview covers this area; it is only a neutral backdrop while it loads. */}
			<div className="min-h-0 flex-1 bg-background" />
		</div>
	)
}
