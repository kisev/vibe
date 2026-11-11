// The speaker-separation model is auxiliary: it is not a transcription model, so
// it never appears in the catalog. This row is the one place in the app where its
// identity, size, and download state are visible.
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'
import { FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { m } from '~/paraglide/messages.js'
import { openPath } from '~/lib/app'
import { sizeMb } from '~/lib/catalog'
import * as config from '~/lib/config'
import { downloadModel, getModelDisplayName, isModelFileUsable } from '~/lib/model'
import { IconAction, SettingsGroup, SettingsRow } from './shared'

type SpeakerModelState = 'checking' | 'installed' | 'missing' | 'downloading'

/** Human name of the bundled speaker-separation model, the same on every install. */
const speakerModelName = getModelDisplayName(config.diarizeModelFilename)
/** The published size, as the catalog labels its files (whole MB). */
const speakerModelSize = config.diarizeModelIntegrity.size ? `${sizeMb(config.diarizeModelIntegrity.size)} MB` : null

export function SpeakerSeparationModelGroup() {
	const [state, setState] = useState<SpeakerModelState>('checking')
	const [modelPath, setModelPath] = useState<string | null>(null)

	useEffect(() => {
		let active = true
		void (async () => {
			const folder = await invoke<string>('get_models_folder')
			const path = await join(folder, config.diarizeModelFilename)
			const usable = await isModelFileUsable(path)
			if (!active) return
			setModelPath(path)
			setState(usable ? 'installed' : 'missing')
		})()
		return () => {
			active = false
		}
	}, [])

	async function download() {
		if (!modelPath) return
		setState('downloading')
		try {
			const downloaded = await downloadModel(
				{ url: config.diarizeModelUrl, ...config.diarizeModelIntegrity },
				{ displayName: config.diarizeModelFilename },
			)
			if (downloaded) toast.success(m.downloadComplete())
			setState(downloaded ? 'installed' : 'missing')
		} catch (error) {
			toast.error(String(error))
			setState('missing')
		}
	}

	return (
		<SettingsGroup title={m.diarization()}>
			<SettingsRow
				label={speakerModelName}
				description={speakerModelSize ? `${m.infoDiarization()} · ${speakerModelSize}` : m.infoDiarization()}>
				{state === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
				{state === 'downloading' && (
					<span className="flex items-center gap-2 text-xs text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						{m.downloadingModel()}
					</span>
				)}
				{state === 'installed' && (
					<>
						<span className="text-xs text-muted-foreground">{m.catalogInstalled()}</span>
						<IconAction
							label={m.showInFolder()}
							icon={<FolderOpen className="h-4 w-4" />}
							onClick={() => {
								if (modelPath) void openPath({ name: speakerModelName, path: modelPath })
							}}
						/>
					</>
				)}
				{state === 'missing' && (
					<Button variant="outline" size="sm" onClick={() => void download()}>
						{m.downloadModel()}
					</Button>
				)}
			</SettingsRow>
		</SettingsGroup>
	)
}
