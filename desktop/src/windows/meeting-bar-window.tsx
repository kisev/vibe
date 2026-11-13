// The meeting bar: the trusted chrome for an external page shown in its own window.
// It lives in a small always-on-top window (`?window=meeting-bar&session=N`), so the
// content webview stays a plain page and this surface can never be swallowed by it.
import { useEffect, useState } from 'react'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ArrowLeft, ArrowRight, ExternalLink, Mic, RotateCw, Square, X } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { IconAction } from '~/pages/settings/sections/shared'
import { useRecording } from '~/pages/home/hooks/use-recording'
import {
	closeMeetingBrowser,
	getMeetingBrowserSession,
	navigateMeetingBrowser,
	openMeetingBrowserExternal,
	loadMeetingBrowserUrl,
	type BrowserNavigationAction,
	type BrowserSessionInfo,
} from '~/lib/meeting-browser'
import { m } from '~/paraglide/messages.js'
import { cn } from '~/lib/style'

export default function MeetingBarWindow({ session }: { session: number }) {
	const [info, setInfo] = useState<BrowserSessionInfo | null>(null)
	const [address, setAddress] = useState('')
	const [error, setError] = useState<string | null>(null)
	const recording = useRecording(() => {})

	useEffect(() => {
		void recording.refreshDevices()
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
		}).then((fn) => unlisteners.push(fn))
		listen<{ session: number }>('meeting-browser-closed', (event) => {
			if (event.payload.session !== session) return
			void getCurrentWindow().close()
		}).then((fn) => unlisteners.push(fn))

		return () => {
			active = false
			for (const unlisten of unlisteners) unlisten()
		}
	}, [session])

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

	return (
		<div className="flex h-screen w-screen flex-col justify-center gap-2 bg-background px-3 py-2 text-sm">
			<div className="flex items-center gap-1.5" dir="ltr">
				<IconAction label={m.meetingBarBack()} icon={<ArrowLeft className="h-4 w-4" />} disabled={!info?.canBack} onClick={() => navigate('back')} />
				<IconAction label={m.meetingBarForward()} icon={<ArrowRight className="h-4 w-4" />} disabled={!info?.canForward} onClick={() => navigate('forward')} />
				<IconAction label={m.meetingBarReload()} icon={<RotateCw className="h-4 w-4" />} onClick={() => navigate('reload')} />
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
				<IconAction
					label={m.meetingBarOpenExternal()}
					icon={<ExternalLink className="h-4 w-4" />}
					onClick={() => void run(() => openMeetingBrowserExternal(session))}
				/>
				<IconAction label={m.meetingBarClose()} icon={<X className="h-4 w-4" />} onClick={() => void run(() => closeMeetingBrowser(session))} />
			</div>
			<div className="flex items-center gap-2">
				{info?.isMeeting &&
					(recording.isRecording ? (
						<Button size="sm" variant="secondary" onClick={() => void recording.stopRecord()}>
							<Square />
							{m.meetingBrowserStop()}
						</Button>
					) : (
						<Button size="sm" onClick={() => void recording.startRecord()}>
							<Mic />
							{m.meetingBrowserRecord()}
						</Button>
					))}
				<span className={cn('truncate text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>
					{error ?? info?.host ?? ''}
				</span>
			</div>
		</div>
	)
}
