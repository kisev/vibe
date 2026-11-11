import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
	DEFAULT_MEETING_HOSTS,
	getMeetingHosts,
	normalizeMeetingHost,
	openMeetingBrowser,
	setMeetingHosts,
} from '~/lib/meeting-browser'
import { m } from '~/paraglide/messages.js'
import { IconAction, SettingsField, SettingsGroup, SettingsRow } from './shared'

function errorText(error: unknown) {
	return error instanceof Error ? error.message : String(error)
}

/**
 * The meeting-host allowlist is a UX filter, not a security boundary: every https link opens in
 * Vibe's browser, but only these hosts get the record-ready meeting bar.
 */
export function MeetingBrowserSettings() {
	const [hosts, setHosts] = useState<string[]>([...DEFAULT_MEETING_HOSTS])
	const [draft, setDraft] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [link, setLink] = useState('')
	const [opening, setOpening] = useState(false)

	useEffect(() => {
		let cancelled = false
		getMeetingHosts()
			.then((stored) => {
				if (!cancelled) setHosts(stored)
			})
			.catch((reason) => console.error('Failed to read the meeting hosts:', reason))
		return () => {
			cancelled = true
		}
	}, [])

	async function save(next: string[]) {
		const previous = hosts
		setHosts(next)
		try {
			await setMeetingHosts(next)
		} catch (reason) {
			setHosts(previous)
			toast.error(m.meetingHostSaveFailed(), { description: errorText(reason) })
		}
	}

	function addHost() {
		const host = normalizeMeetingHost(draft)
		if (!host) {
			setError(m.meetingHostInvalid())
			return
		}
		setError(null)
		setDraft('')
		if (hosts.includes(host)) return
		void save([...hosts, host])
	}

	async function openLink() {
		const url = link.trim()
		if (!url || opening) return
		setOpening(true)
		try {
			await openMeetingBrowser(url)
			setLink('')
		} catch (reason) {
			console.error('Failed to open the link in Vibe:', reason)
			toast.error(m.openInVibeFailed(), { description: errorText(reason) })
		} finally {
			setOpening(false)
		}
	}

	return (
		<div className="space-y-6">
			<SettingsGroup title={m.meetingHosts()} description={m.meetingHostsInfo()}>
				{hosts.map((host) => (
					<SettingsRow
						key={host}
						label={<span className="font-mono text-sm">{host}</span>}
						description={DEFAULT_MEETING_HOSTS.includes(host) ? m.meetingHostDefault() : undefined}>
						<IconAction label={m.meetingHostRemove({ host })} icon={<X className="h-4 w-4" />} onClick={() => void save(hosts.filter((item) => item !== host))} />
					</SettingsRow>
				))}
				<SettingsField
					label={m.meetingHostAdd()}
					footer={error ? <span className="text-destructive">{error}</span> : undefined}>
					<div className="flex gap-2">
						<Input
							type="text"
							spellCheck={false}
							autoComplete="off"
							aria-label={m.meetingHostAdd()}
							placeholder={m.meetingHostPlaceholder()}
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault()
									addHost()
								}
							}}
							className="h-9 rounded-lg text-sm"
						/>
						<Button type="button" variant="outline" size="sm" className="h-9 shrink-0 rounded-lg" onClick={addHost}>
							{m.meetingHostAddAction()}
						</Button>
					</div>
				</SettingsField>
			</SettingsGroup>

			<SettingsGroup title={m.openInVibe()} description={m.openInVibeInfo()}>
				<SettingsField label={m.openInVibeUrlLabel()}>
					<div className="flex gap-2">
						<Input
							type="text"
							inputMode="url"
							spellCheck={false}
							autoComplete="off"
							aria-label={m.openInVibeUrlLabel()}
							placeholder={m.openInVibePlaceholder()}
							value={link}
							onChange={(event) => setLink(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === 'Enter') {
									event.preventDefault()
									void openLink()
								}
							}}
							className="h-9 rounded-lg text-sm"
						/>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-9 shrink-0 rounded-lg"
							disabled={opening || !link.trim()}
							onClick={() => void openLink()}>
							{m.openInVibeAction()}
						</Button>
					</div>
				</SettingsField>
			</SettingsGroup>
		</div>
	)
}
