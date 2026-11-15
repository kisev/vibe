import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import {
	allowBrowserHost,
	BROWSER_BLOCKED_HOSTS_EVENT,
	getBrowserAllowedHosts,
	getBrowserBlockedHosts,
	getBrowserPolicy,
	getMeetingSchemesEnabled,
	meetingSchemesSupported,
	normalizeAllowedHost,
	resolveMeetingAddress,
	openMeetingBrowser,
	openMeetingLink,
	removeBrowserAllowedHost,
	setBrowserPolicy,
	setMeetingSchemesEnabled,
	type BrowserPolicy,
} from '~/lib/meeting-browser'
import { m } from '~/paraglide/messages.js'
import { IconAction, SettingsField, SettingsGroup, SettingsNote, SettingsRow } from './shared'

function errorText(error: unknown) {
	return error instanceof Error ? error.message : String(error)
}

/**
 * The embedded browser is a real allowlist: only these domains, and their subdomains over https,
 * may load, and everything else is refused. The blocked list is the remedy: allowing a host there
 * adds it and reloads the open pages so their refused assets retry.
 */
export function MeetingBrowserSettings() {
	const [hosts, setHosts] = useState<string[]>([])
	const [blocked, setBlocked] = useState<string[]>([])
	const [policy, setPolicy] = useState<BrowserPolicy>('strict')
	const [draft, setDraft] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [link, setLink] = useState('')
	const [opening, setOpening] = useState(false)
	const [handlers, setHandlers] = useState<{ enabled: boolean; supported: boolean } | null>(null)
	// Strict blocks every unlisted origin through the page webview's resource filter, which only
	// one platform implements; offering it elsewhere would be a switch that changes nothing.
	const [resourceFilterSupported, setResourceFilterSupported] = useState(true)

	useEffect(() => {
		let cancelled = false
		invoke<boolean>('browser_resource_filter_supported')
			.then((supported) => {
				if (!cancelled) setResourceFilterSupported(supported)
			})
			.catch((reason) => console.error('Failed to read the browser resource filter support:', reason))
		return () => {
			cancelled = true
		}
	}, [])

	useEffect(() => {
		let cancelled = false
		Promise.all([getMeetingSchemesEnabled(), meetingSchemesSupported()])
			.then(([enabled, supported]) => {
				if (!cancelled) setHandlers({ enabled, supported })
			})
			.catch((reason) => console.error('Failed to read the meeting link handlers:', reason))
		return () => {
			cancelled = true
		}
	}, [])

	async function toggleHandlers(next: boolean) {
		setHandlers((current) => (current ? { ...current, enabled: next } : current))
		try {
			await setMeetingSchemesEnabled(next)
		} catch (reason) {
			setHandlers((current) => (current ? { ...current, enabled: !next } : current))
			toast.error(errorText(reason))
		}
	}

	useEffect(() => {
		let cancelled = false
		let unlisten: (() => void) | undefined
		Promise.all([getBrowserAllowedHosts(), getBrowserBlockedHosts(), getBrowserPolicy()])
			.then(([allowed, blockedHosts, storedPolicy]) => {
				if (cancelled) return
				setHosts(allowed)
				setBlocked(blockedHosts)
				setPolicy(storedPolicy)
			})
			.catch((reason) => console.error('Failed to read the browser allowlist:', reason))
		// The blocked registry changes from the page webview, not only from this screen.
		listen<string[]>(BROWSER_BLOCKED_HOSTS_EVENT, (event) => setBlocked(event.payload)).then((fn) => {
			if (cancelled) fn()
			else unlisten = fn
		})
		return () => {
			cancelled = true
			unlisten?.()
		}
	}, [])

	async function allow(host: string) {
		const previous = hosts
		if (!hosts.includes(host)) setHosts([...hosts, host])
		try {
			setHosts(await allowBrowserHost(host))
			setBlocked((current) => current.filter((item) => item !== host))
		} catch (reason) {
			setHosts(previous)
			toast.error(m.browserAllowedHostSaveFailed(), { description: errorText(reason) })
		}
	}

	async function remove(host: string) {
		const previous = hosts
		setHosts(hosts.filter((item) => item !== host))
		try {
			setHosts(await removeBrowserAllowedHost(host))
		} catch (reason) {
			setHosts(previous)
			toast.error(m.browserAllowedHostSaveFailed(), { description: errorText(reason) })
		}
	}

	/** The backend refuses anything but the two known modes; the selected value is authoritative. */
	async function changePolicy(next: BrowserPolicy) {
		const previous = policy
		setPolicy(next)
		try {
			setPolicy(await setBrowserPolicy(next))
		} catch (reason) {
			setPolicy(previous)
			toast.error(errorText(reason))
		}
	}

	function addHost() {
		const host = normalizeAllowedHost(draft)
		if (!host) {
			setError(m.browserAllowedHostInvalid())
			return
		}
		setError(null)
		setDraft('')
		if (hosts.includes(host)) return
		void allow(host)
	}

	async function openLink() {
		// A web link opens in the embedded window; a scheme is mapped by Rust. The shared resolver
		// upgrades an `http` or uppercase `HTTPS` link, the only web scheme the page loads.
		const target = resolveMeetingAddress(link)
		if (!target || opening) return
		setOpening(true)
		try {
			if (target.kind === 'web') await openMeetingBrowser(target.url)
			else await openMeetingLink(target.url)
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
			{/* Taking a scheme from the application that owns it is opt-in and reversible. */}
			<SettingsGroup title={m.meetingHandlers()} description={handlers && !handlers.supported ? m.meetingHandlersUnavailable() : m.meetingHandlersInfo()}>
				<SettingsRow label={m.meetingHandlers()} description={m.infoMeetingHandlers()}>
					<Switch
						checked={handlers?.enabled ?? false}
						disabled={!handlers?.supported}
						onCheckedChange={(checked) => void toggleHandlers(checked)}
						aria-label={m.meetingHandlers()}
					/>
				</SettingsRow>
			</SettingsGroup>

			{/* Two modes only; navigation is always gated. */}
			<SettingsGroup>
				<SettingsRow label={m.browserPolicy()} description={m.browserPolicyInfo()}>
					<select
						aria-label={m.browserPolicy()}
						value={policy}
						onChange={(event) => void changePolicy(event.target.value as BrowserPolicy)}
						className="h-9 w-40 cursor-pointer rounded-lg border border-input/60 bg-muted/40 px-2 text-sm text-foreground">
						<option value="strict" disabled={!resourceFilterSupported}>
							{m.browserPolicyStrict()}
						</option>
						<option value="trusted-site">{m.browserPolicyTrustedSite()}</option>
					</select>
				</SettingsRow>
				{!resourceFilterSupported && <SettingsNote>{`${m.browserPolicyStrict()} — ${m.permissionNotApplicable()}`}</SettingsNote>}
			</SettingsGroup>

			<SettingsGroup title={m.browserAllowedHosts()} description={m.browserAllowedHostsInfo()}>
				{hosts.map((host) => (
					<SettingsRow key={host} label={<span className="font-mono text-sm">{host}</span>}>
						<IconAction label={m.browserAllowedHostRemove({ host })} icon={<X className="h-4 w-4" />} onClick={() => void remove(host)} />
					</SettingsRow>
				))}
				<SettingsField
					label={m.browserAllowedHostAdd()}
					description={m.infoMeetingHostAdd()}
					footer={error ? <span className="text-destructive">{error}</span> : undefined}>
					<div className="flex gap-2">
						<Input
							type="text"
							spellCheck={false}
							autoComplete="off"
							aria-label={m.browserAllowedHostAdd()}
							placeholder={m.browserAllowedHostPlaceholder()}
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
							{m.browserAllowedHostAddAction()}
						</Button>
					</div>
				</SettingsField>
			</SettingsGroup>

			{/* Scoped to strict mode by design: trusted-site leaves resources unfiltered.
				Refused navigations are still recorded in both modes, so a host refused
				under trusted-site shows up here after switching back. */}
			{policy === 'strict' && (
				<SettingsGroup title={m.browserBlockedHosts()} description={m.browserBlockedHostsInfo()}>
					{blocked.length === 0 && <SettingsNote>{m.browserBlockedHostsEmpty()}</SettingsNote>}
					{blocked.map((host) => (
						<SettingsRow key={host} label={<span className="font-mono text-sm">{host}</span>}>
							<Button type="button" variant="outline" size="sm" className="h-9 rounded-lg" onClick={() => void allow(host)}>
								{m.browserBlockedHostAllow()}
							</Button>
						</SettingsRow>
					))}
				</SettingsGroup>
			)}

			<SettingsGroup title={m.openInVibe()} description={m.openInVibeInfo()}>
				<SettingsField label={m.openInVibeUrlLabel()} description={m.infoOpenInVibeLink()}>
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
