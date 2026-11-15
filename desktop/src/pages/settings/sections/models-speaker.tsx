// The speaker-separation model is auxiliary: it is not a transcription model, so
// it never appears in the catalog. This row is the one place in the app where its
// identity, size, and download state are visible.
import { useCallback, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'
import { FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '~/components/ui/button'
import { m } from '~/paraglide/messages.js'
import { openPath } from '~/lib/app'
import { sizeMb } from '~/lib/catalog'
import * as config from '~/lib/config'
import { downloadSnapshot, subscribeDownloads } from '~/lib/downloads'
import { downloadModel, getModelDisplayName, isModelFileUsable } from '~/lib/model'
import { errorMessage } from '~/lib/errors'
import { usePreferenceProvider } from '~/providers/preference'
import { IconAction, SettingsGroup, SettingsRow } from './shared'

type SpeakerModelState = 'checking' | 'installed' | 'missing' | 'downloading'

/** Human name of the bundled speaker-separation model, the same on every install. */
const speakerModelName = getModelDisplayName(config.diarizeModelFilename)
/** The published size, as the catalog labels its files (whole MB). */
const speakerModelSize = config.diarizeModelIntegrity.size ? `${sizeMb(config.diarizeModelIntegrity.size)} MB` : null

/** Fired in this window after the model lands, so every section that mirrors it revalidates. */
const DIARIZE_MODEL_CHANGED_EVENT = 'vibe:diarize-model-changed'

function announceDiarizeModelChanged() {
	window.dispatchEvent(new Event(DIARIZE_MODEL_CHANGED_EVENT))
}

export interface DiarizationModel {
	/** Absolute path of the file in the configured models folder, or null when the check failed. */
	path: string | null
	installed: boolean
	/** False until the first check resolves, so a row shows a spinner instead of a false "missing". */
	checked: boolean
	refresh: () => Promise<void>
}

/**
 * Availability of the bundled speaker-separation model, shared by the group that downloads it and
 * the comparison lab that only needs to know whether it can offer separation. One hook owns the
 * check so a download or a removal in one section is visible in the other without leaving Settings.
 */
export function useDiarizationModel(): DiarizationModel {
	const [state, setState] = useState<Omit<DiarizationModel, 'refresh'>>({ path: null, installed: false, checked: false })
	const preference = usePreferenceProvider()

	const refresh = useCallback(async () => {
		try {
			const path = await join(await invoke<string>('get_models_folder'), config.diarizeModelFilename)
			const installed = await isModelFileUsable(path)
			setState({ path, installed, checked: true })
		} catch (error) {
			// A refused check is not an installed model: fall back to the download offer, not a spinner.
			console.error('failed to check the speaker-separation model:', error)
			setState({ path: null, installed: false, checked: true })
		}
	}, [])

	useEffect(() => {
		void refresh()
		// The file can be downloaded by another section, or copied in while the app was in the background.
		const onChanged = () => void refresh()
		window.addEventListener(DIARIZE_MODEL_CHANGED_EVENT, onChanged)
		window.addEventListener('focus', onChanged)
		return () => {
			window.removeEventListener(DIARIZE_MODEL_CHANGED_EVENT, onChanged)
			window.removeEventListener('focus', onChanged)
		}
	}, [refresh])

	// The diarization gate in Tuning downloads the model without leaving Settings (so no focus
	// event) and flips the preference only after the download landed; the startup migration
	// downloads it through the shared registry instead. Either is a signal to look again.
	useEffect(() => {
		if (preference.diarizeEnabled) void refresh()
	}, [preference.diarizeEnabled, refresh])
	useEffect(
		() =>
			subscribeDownloads(() => {
				// Only the last in-flight download finishing can mean the model has landed.
				if (downloadSnapshot().count === 0) void refresh()
			}),
		[refresh],
	)

	return { ...state, refresh }
}

export function SpeakerSeparationModelGroup() {
	const { path: modelPath, installed, checked } = useDiarizationModel()
	const [downloading, setDownloading] = useState(false)

	async function download() {
		// The download resolves its own destination from the URL and the models folder, so a row
		// whose check failed (no path) still offers a working action rather than a dead button.
		setDownloading(true)
		try {
			const downloaded = await downloadModel(
				{ url: config.diarizeModelUrl, ...config.diarizeModelIntegrity },
				{ displayName: config.diarizeModelFilename },
			)
			if (downloaded) {
				toast.success(m.downloadComplete())
				announceDiarizeModelChanged()
			}
		} catch (error) {
			toast.error(errorMessage(error))
		} finally {
			setDownloading(false)
		}
	}

	const state: SpeakerModelState = downloading ? 'downloading' : !checked ? 'checking' : installed ? 'installed' : 'missing'

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
