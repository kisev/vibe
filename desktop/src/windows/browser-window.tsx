// The browser chrome: the trusted app UI shown in the top strip of the meeting browser window.
// The window holds two webviews — this chrome and the remote page below it — so the native page
// covers everything under the toolbar and only the toolbar's height matters here.
//
// This is a chrome-only surface: `bootstrap` mounts it instead of the app, so it never runs the
// startup migrations, device enumeration or server supervision a second time. Recording is the
// main window's job: the chrome only asks it, through an event, and mirrors the state it reports.
import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ArrowLeft, ArrowRight, ExternalLink, Mic, RotateCw, Square, X } from 'lucide-react'
import RecordingIndicator from '~/components/recording-feedback'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { AudioDevice } from '~/lib/audio'
import { deviceMenuEntries, type DeviceMenuEntry } from '~/lib/device-selection'
import {
	allowBrowserHost,
	BROWSER_NAVIGATION_BLOCKED_EVENT,
	closeMeetingBrowser,
	getMeetingBrowserSession,
	navigateMeetingBrowser,
	openMeetingBrowserExternal,
	loadMeetingBrowserUrl,
	readRecordingDeviceState,
	restoreRecordingDevice,
	writeRecordingDeviceSelection,
	RECORDING_STATE_EVENT,
	RECORDING_STATE_REQUEST_EVENT,
	RECORDING_TOGGLE_EVENT,
	type BrowserNavigationAction,
	type BrowserNavigationBlocked,
	type BrowserSessionInfo,
	type RecordingDeviceState,
	type RecordingStatePayload,
} from '~/lib/meeting-browser'
import { m } from '~/paraglide/messages.js'
import { getTextDirection, setLocale } from '~/paraglide/runtime.js'
import { CONFIG_KEYS } from '~/lib/config-keys'
import { readConfig } from '~/lib/config-store'
import { cn } from '~/lib/style'

/** Must match `TOOLBAR_H` in `desktop/src-tauri/src/meeting_browser.rs`. */
const TOOLBAR_HEIGHT = 104

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
	onPick,
}: {
	type: 'input' | 'output'
	label: string
	devices: AudioDevice[]
	device: AudioDevice | null
	unavailableName: string | null
	hiddenNames: string[]
	disabled: boolean
	onPick: (entry: DeviceMenuEntry) => void
}) {
	const entries = deviceMenuEntries(devices, type, hiddenNames, unavailableName)
	const value = device?.id ?? (unavailableName ? 'unavailable' : 'none')
	const triggerLabel = device?.name ?? (unavailableName ? m.deviceUnavailable({ name: unavailableName }) : m.noRecord())

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
						{entry.label}
					</option>
				))}
			{value !== 'none' && !entries.some((entry) => entry.value === value) && <option value={value}>{triggerLabel}</option>}
		</select>
	)
}

export default function BrowserWindow({ session }: { session: number }) {
	// The chrome must follow the app's theme and language: it is a separate webview, so the
	// providers never run here and nothing would set the `dark` class or the locale.
	const theme = readConfig<'light' | 'dark'>(CONFIG_KEYS.theme, window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
	const locale = readConfig<string>(CONFIG_KEYS.displayLanguage, 'en-US')
	useLayoutEffect(() => {
		if (locale) setLocale(locale as never, { reload: false })
		document.body.dir = getTextDirection(locale as never)
		document.documentElement.classList.toggle('dark', theme === 'dark')
		void getCurrentWindow()
			.setTheme(theme)
			.catch(() => undefined)
	}, [locale, theme])

	const [info, setInfo] = useState<BrowserSessionInfo | null>(null)
	const [address, setAddress] = useState('')
	const [error, setError] = useState<string | null>(null)
	/** A host the allowlist refused in this window; the notice offers to allow it. */
	const [blockedHost, setBlockedHost] = useState<string | null>(null)
	const [recording, setRecording] = useState(false)
	const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null)
	const [recordingDevices, setRecordingDevices] = useState<RecordingDeviceState | null>(null)

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

		const unlisteners: (() => void)[] = []
		listen<BrowserSessionInfo>('meeting-browser-session', (event) => {
			if (event.payload.session !== session) return
			setInfo(event.payload)
			setAddress(event.payload.url)
			setBlockedHost(null)
		}).then((fn) => unlisteners.push(fn))
		listen<BrowserNavigationBlocked>(BROWSER_NAVIGATION_BLOCKED_EVENT, (event) => {
			if (event.payload.session !== session) return
			setBlockedHost(event.payload.host)
		}).then((fn) => unlisteners.push(fn))
		listen<{ session: number }>('meeting-browser-closed', (event) => {
			if (event.payload.session !== session) return
			void getCurrentWindow().close()
		}).then((fn) => unlisteners.push(fn))
		listen<RecordingStatePayload>(RECORDING_STATE_EVENT, (event) => {
			setRecording(event.payload.recording)
			setRecordingStartedAt(event.payload.recording ? (event.payload.startedAt ?? Date.now()) : null)
		}).then((fn) => unlisteners.push(fn))

		// A chrome opened while a recording already runs learns the current state instead of
		// waiting for the next flip. Devices refresh on focus, when the main window may have moved.
		void emit(RECORDING_STATE_REQUEST_EVENT)
		void refreshDevices()
		const onFocus = () => void refreshDevices()
		window.addEventListener('focus', onFocus)

		return () => {
			active = false
			window.removeEventListener('focus', onFocus)
			for (const unlisten of unlisteners) unlisten()
		}
	}, [session, refreshDevices])

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
		const url = address.trim()
		if (!url) return
		void run(() => loadMeetingBrowserUrl(session, url))
	}

	/** Allow a refused host; the Rust side persists it and reloads the page webviews. */
	function allowHost(host: string) {
		void run(async () => {
			await allowBrowserHost(host)
			setBlockedHost(null)
		})
	}

	/** A pick is written under the main window's keys; the config store carries it across windows. */
	function pickDevice(type: 'input' | 'output', entry: DeviceMenuEntry) {
		if (entry.kind === 'unavailable') return
		if (entry.kind === 'hidden') restoreRecordingDevice(type, entry.label)
		else writeRecordingDeviceSelection(type, entry.kind === 'none' ? null : entry.label)
		void refreshDevices()
	}

	const microphoneName = recordingDevices?.input?.name ?? m.noRecord()
	const systemName = recordingDevices?.output?.name ?? m.noRecord()

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
						/>
					</form>
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
					{
						<>
							<div role="group" aria-label={m.recordingDevices()} className="flex min-w-0 items-center gap-2">
								<DevicePicker
									type="input"
									label={m.microphone()}
									devices={recordingDevices?.devices ?? []}
									device={recordingDevices?.input ?? null}
									unavailableName={recordingDevices?.inputUnavailableName ?? null}
									hiddenNames={recordingDevices?.hiddenInputDevices ?? []}
									disabled={recording}
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
							{recording && <RecordingIndicator compact startedAt={recordingStartedAt} microphoneName={microphoneName} systemName={systemName} />}
						</>
					}
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
			{/* Native page webview covers this area; it is only a neutral backdrop while it loads. */}
			<div className="min-h-0 flex-1 bg-background" />
		</div>
	)
}
