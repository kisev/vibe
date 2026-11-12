// The update controls: which line the app follows, what the last check said, and
// one explicit action. The provider owns the state machine; this file only
// renders it, so a manual check and the startup check report the same way.
import { getVersion } from '@tauri-apps/api/app'
import { useContext, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { m } from '~/paraglide/messages.js'
import { UpdaterContext, type CheckState, type UpdateChannel } from '~/providers/updater'
import { SettingsField, SettingsGroup, SettingsRow } from './shared'

// Channel names are product names, not copy: they read the same in every language.
const channels: { value: UpdateChannel; label: string }[] = [
	{ value: 'stable', label: 'Release' },
	{ value: 'beta', label: 'Beta' },
	{ value: 'dev', label: 'Dev' },
]

/** One sentence for the last check, whatever the phase. */
function statusText(state: CheckState, version: string | undefined, lastCheckedAt: number | null): string {
	switch (state) {
		case 'checking':
			return m.updateChecking()
		case 'current':
			return m.updateUpToDate()
		case 'available':
			return m.updateAvailableVersion({ version: version ?? '' })
		case 'downloading':
			return m.updateDownloading()
		case 'installing':
			return m.updateInstalling()
		case 'error':
			return m.updateFailed()
		default:
			return lastCheckedAt ? m.updateLastChecked({ time: new Date(lastCheckedAt).toLocaleTimeString() }) : m.updateNotChecked()
	}
}

export function UpdateControls() {
	const { channel, setChannel, checkNow, checkState, checkError, lastCheckedAt, manifest, updateApp, updating, progress } = useContext(UpdaterContext)
	const [version, setVersion] = useState('')

	useEffect(() => {
		let active = true
		getVersion()
			.then((value) => {
				if (active) setVersion(value)
			})
			.catch((error) => console.error('failed to read the app version', error))
		return () => {
			active = false
		}
	}, [])

	// A release or beta build cannot be offered a `-dev.N` version: semver sorts it
	// below what is installed. The copy says so instead of pretending a check failed.
	const devLineBelow = channel === 'dev' && version !== '' && !version.includes('-dev.')
	const busy = checkState === 'checking' || updating

	return (
		<SettingsGroup title={m.updates()}>
			<SettingsRow label={m.updatesCurrentVersion()}>
				<span className="text-sm tabular-nums text-muted-foreground">{version || '—'}</span>
			</SettingsRow>

			<SettingsField label={m.updateChannel()} description={devLineBelow ? m.updateDevBoundary() : m.updateChannelInfo()}>
				<div role="radiogroup" aria-label={m.updateChannel()} className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
					{channels.map(({ value, label }) => {
						const selected = channel === value
						return (
							<button
								key={value}
								type="button"
								role="radio"
								aria-checked={selected}
								onClick={() => setChannel(value)}
								className={`flex h-8 cursor-pointer items-center justify-center rounded-md px-3 text-xs transition-colors ${
									selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
								}`}>
								{label}
							</button>
						)
					})}
				</div>
			</SettingsField>

			<SettingsRow
				label={statusText(checkState, manifest?.version, lastCheckedAt)}
				description={checkState === 'error' ? checkError : undefined}
				clampDescription={false}>
				{busy && checkState !== 'available' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
				{checkState === 'downloading' && progress !== null && (
					<span className="text-xs tabular-nums text-muted-foreground">{progress}%</span>
				)}
				{checkState === 'available' && (
					<Button size="sm" onClick={() => void updateApp()}>
						{m.updateNow()}
					</Button>
				)}
				<Button variant="outline" size="sm" disabled={busy} onClick={() => void checkNow()}>
					{m.checkForUpdates()}
				</Button>
			</SettingsRow>
		</SettingsGroup>
	)
}
