import { invoke } from '@tauri-apps/api/core'
import { emit, listen } from '@tauri-apps/api/event'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { ask, message } from '@tauri-apps/plugin-dialog'
import { ArrowLeft, ArrowRight, ExternalLink, Mic, RotateCw, Square, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import type { AudioDevice } from '~/lib/audio'
import { CONFIG_KEYS } from '~/lib/config-keys'
import { readConfig } from '~/lib/config-store'
import {
	confirmMeetingBrowserClose,
	closeMeetingBrowser,
	getMeetingBrowserSession,
	isRecordingActive,
	navigateMeetingBrowser,
	openMeetingBrowser,
	openMeetingBrowserExternal,
	readConfiguredRecordingDevices,
	type BrowserNavigationAction,
	type BrowserSessionInfo,
} from '~/lib/meeting-browser'
import { ensureSystemAudioPermission } from '~/lib/permissions'
import { supportedLanguages } from '~/lib/i18n'
import { m } from '~/paraglide/messages.js'
import { getLocale, getTextDirection, setLocale } from '~/paraglide/runtime.js'
import logoUrl from '../../../design/logo.svg?url'

interface SessionEventPayload {
	session: number
}

function errorText(error: unknown) {
	return error instanceof Error ? error.message : String(error)
}

async function showError(text: string) {
	await message(text, { title: m.meetingBrowserTitle(), kind: 'error' })
}

export default function MeetingBarWindow({ session }: { session: number }) {
	const configuredLocale = readConfig(CONFIG_KEYS.displayLanguage, 'en-US')
	if (supportedLanguages[configuredLocale] && configuredLocale !== getLocale()) {
		setLocale(configuredLocale as never, { reload: false })
	}
	const theme = readConfig<'light' | 'dark'>(CONFIG_KEYS.theme, window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
	const direction = getTextDirection(configuredLocale)

	const [info, setInfo] = useState<BrowserSessionInfo | null>(null)
	const [address, setAddress] = useState('')
	const [recording, setRecording] = useState(false)
	const [busy, setBusy] = useState(false)

	useLayoutEffect(() => {
		document.title = m.meetingBrowserTitle()
		document.body.dir = direction
		document.documentElement.classList.toggle('dark', theme === 'dark')
		document.documentElement.classList.add('meeting-bar-window')
		document.documentElement.style.background = 'transparent'
		document.body.style.background = 'transparent'
		void getCurrentWebviewWindow()
			.setTheme(theme)
			.catch(() => undefined)
		return () => {
			document.documentElement.classList.remove('meeting-bar-window')
			document.documentElement.style.removeProperty('background')
			document.body.style.removeProperty('background')
		}
	}, [direction, theme])

	// The current page updates the bar's URL and history state; the closed event tears the bar down.
	useEffect(() => {
		if (!session) return
		let cancelled = false
		void getMeetingBrowserSession(session)
			.then((current) => {
				if (!cancelled && current) setInfo(current)
			})
			.catch((error) => console.error('Failed to read the meeting browser session:', error))
		const unlistenSession = listen<BrowserSessionInfo>('meeting-browser-session', ({ payload }) => {
			if (payload.session === session) setInfo(payload)
		})
		const unlistenClosed = listen<SessionEventPayload>('meeting-browser-closed', ({ payload }) => {
			if (payload.session === session) setInfo(null)
		})
		return () => {
			cancelled = true
			unlistenSession.then((dispose) => dispose())
			unlistenClosed.then((dispose) => dispose())
		}
	}, [session])

	useEffect(() => {
		setAddress(info?.url ?? '')
	}, [info?.url])

	// A recording started elsewhere (main window, shortcut) shows as active instead of offering a second one.
	useEffect(() => {
		let cancelled = false
		isRecordingActive()
			.then((active) => {
				if (!cancelled) setRecording(active)
			})
			.catch((error) => console.error('Failed to read the recording state:', error))
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		const unlistenFinish = listen('record_finish', () => setRecording(false))
		const unlistenError = listen('record_error', () => setRecording(false))
		return () => {
			unlistenFinish.then((dispose) => dispose())
			unlistenError.then((dispose) => dispose())
		}
	}, [])

	async function navigate(action: BrowserNavigationAction) {
		try {
			await navigateMeetingBrowser(session, action)
		} catch (error) {
			console.error(`Failed to ${action} the meeting browser:`, error)
		}
	}

	async function openAddress() {
		const url = address.trim()
		if (!url || busy) return
		setBusy(true)
		try {
			const opened = await openMeetingBrowser(url)
			setAddress(opened.url)
		} catch (error) {
			await showError(m.meetingBrowserInvalidLink({ reason: errorText(error) }))
		} finally {
			setBusy(false)
		}
	}

	async function startRecording() {
		if (busy) return
		setBusy(true)
		try {
			const { input, output } = await readConfiguredRecordingDevices()
			if (!input && !output) throw new Error(m.noDefaultMicrophone())
			if (output && !(await ensureSystemAudioPermission())) {
				await showError(m.permissionAudioRecording())
				return
			}
			const devices = [input, output].filter((device): device is AudioDevice => device !== null)
			await invoke('start_record', { devices, recordingName: null })
			setRecording(true)
		} catch (error) {
			console.error('Failed to start recording from the meeting bar:', error)
			await showError(m.meetingBrowserStartFailed())
		} finally {
			setBusy(false)
		}
	}

	async function stopRecording() {
		if (busy) return
		setBusy(true)
		try {
			await emit('stop_record')
			setRecording(false)
		} catch (error) {
			console.error('Failed to stop recording from the meeting bar:', error)
			await showError(m.meetingBrowserStopFailed())
		} finally {
			setBusy(false)
		}
	}

	/** Ask whether to stop or keep the running recording before closing. */
	async function resolveClose() {
		let active = false
		try {
			active = await isRecordingActive()
		} catch (error) {
			console.error('Failed to read the recording state:', error)
		}
		if (!active) {
			setRecording(false)
			await confirmMeetingBrowserClose(session, false).catch((error) =>
				showError(m.meetingBrowserInvalidLink({ reason: errorText(error) })),
			)
			return
		}
		const stop = await ask(m.meetingBrowserCloseQuestion(), {
			title: m.meetingBrowserCloseTitle(),
			kind: 'warning',
			okLabel: m.meetingBrowserStopAndClose(),
			cancelLabel: m.meetingBrowserKeepRecording(),
		})
		await confirmMeetingBrowserClose(session, stop).catch((error) =>
			showError(m.meetingBrowserInvalidLink({ reason: errorText(error) })),
		)
	}

	useEffect(() => {
		if (!session) return
		const unlisten = listen<SessionEventPayload>('meeting-browser-close-requested', ({ payload }) => {
			if (payload.session === session) void resolveClose()
		})
		return () => {
			unlisten.then((dispose) => dispose())
		}
	}, [session])

	async function closeBar() {
		if (busy) return
		let active = false
		try {
			active = await isRecordingActive()
		} catch (error) {
			console.error('Failed to read the recording state:', error)
		}
		if (active) {
			await resolveClose()
			return
		}
		try {
			await closeMeetingBrowser(session)
			setInfo(null)
		} catch (error) {
			await showError(m.meetingBrowserInvalidLink({ reason: errorText(error) }))
		}
	}

	if (!session || !info) return null

	const iconButton = 'h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground'

	return (
		<div className="flex h-screen w-screen items-center bg-transparent p-2">
			<div className="flex h-full w-full items-center gap-1.5 rounded-xl border border-border/70 bg-card px-2 text-card-foreground shadow-xl">
				<img src={logoUrl} alt="" className="h-6 w-6 shrink-0 rounded-full" />
				<span className="h-5 w-px shrink-0 bg-border/70" />
				<Button
					type="button"
					variant="ghost"
					size="iconSm"
					className={iconButton}
					aria-label={m.meetingBarBack()}
					title={m.meetingBarBack()}
					disabled={!info.canBack}
					onClick={() => void navigate('back')}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="iconSm"
					className={iconButton}
					aria-label={m.meetingBarForward()}
					title={m.meetingBarForward()}
					disabled={!info.canForward}
					onClick={() => void navigate('forward')}>
					<ArrowRight className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="iconSm"
					className={iconButton}
					aria-label={m.meetingBarReload()}
					title={m.meetingBarReload()}
					onClick={() => void navigate('reload')}>
					<RotateCw className="h-4 w-4" />
				</Button>
				<Input
					type="text"
					spellCheck={false}
					autoComplete="off"
					aria-label={m.meetingBarAddress()}
					value={address}
					disabled={busy}
					onChange={(event) => setAddress(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter') {
							event.preventDefault()
							void openAddress()
						}
					}}
					className="h-9 min-w-0 flex-1 rounded-lg bg-muted/45 px-2.5 text-xs"
				/>
				{info.isMeeting &&
					(recording ? (
						<>
							<span
								role="status"
								aria-label={m.meetingBrowserRecordingActive()}
								title={m.meetingBrowserRecordingActive()}
								className="ms-1 flex shrink-0 items-center">
								<span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.18)]" />
							</span>
							<Button
								type="button"
								variant="destructive"
								size="sm"
								className="h-8 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs"
								disabled={busy}
								onClick={() => void stopRecording()}>
								<Square className="h-3.5 w-3.5" />
								{m.meetingBrowserStop()}
							</Button>
						</>
					) : (
						<Button
							type="button"
							size="sm"
							className="h-8 shrink-0 gap-1.5 rounded-lg px-2.5 text-xs"
							disabled={busy}
							onClick={() => void startRecording()}>
							<Mic className="h-3.5 w-3.5" />
							{m.meetingBrowserRecord()}
						</Button>
					))}
				<Button
					type="button"
					variant="ghost"
					size="iconSm"
					className={iconButton}
					aria-label={m.meetingBarOpenExternal()}
					title={m.meetingBarOpenExternal()}
					disabled={busy}
					onClick={() =>
						void openMeetingBrowserExternal(session).catch((error) =>
							showError(m.meetingBrowserInvalidLink({ reason: errorText(error) })),
						)
					}>
					<ExternalLink className="h-4 w-4" />
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="iconSm"
					className={iconButton}
					aria-label={m.meetingBarClose()}
					title={m.meetingBarClose()}
					disabled={busy}
					onClick={() => void closeBar()}>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</div>
	)
}
