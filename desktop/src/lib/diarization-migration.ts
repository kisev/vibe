import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'
import { ask } from '@tauri-apps/plugin-dialog'
import { toast } from 'sonner'
import { m } from '~/paraglide/messages.js'
import * as config from '~/lib/config'
import { deleteModelFile, downloadModel, isModelFileUsable } from '~/lib/model'

export type DiarizationMigration =
	| 'not-needed' // speaker detection off: nothing to revalidate
	| 'installed' // the current model is already on disk
	| 'migrated' // replacement downloaded, legacy files cleaned up
	| 'declined' // offer declined or download failed: preference disabled

/**
 * The diarization model changed format with the unified engine, but the download gate only runs
 * when the switch is toggled — a preference that predates the change points at a file that is no
 * longer downloaded, and the server logs the load error away, silently dropping speakers. This
 * revalidates the persisted preference at startup: one download offer, keep the preference on
 * success, disable it with a notice when the user declines.
 */
export async function runDiarizationMigration(diarizeEnabled: boolean, disable: () => void): Promise<DiarizationMigration> {
	if (!diarizeEnabled) return 'not-needed'
	const modelsFolder = await invoke<string>('get_models_folder')
	const modelPath = await join(modelsFolder, config.diarizeModelFilename)
	if (await isModelFileUsable(modelPath)) return 'installed'

	const confirmed = await ask(m.diarizationMigrateQuestion(), { title: m.diarization(), kind: 'info' })
	if (!confirmed) {
		disable()
		toast.info(m.diarizationMigratedOff())
		return 'declined'
	}

	const downloaded = await downloadModel(
		{ url: config.diarizeModelUrl, ...config.diarizeModelIntegrity },
		{ displayName: config.diarizeModelFilename },
	)
	if (!downloaded) {
		disable()
		toast.error(m.diarizationMigratedOff())
		return 'declined'
	}
	await cleanupLegacyDiarizationFiles(modelsFolder)
	toast.success(m.downloadComplete())
	return 'migrated'
}

/** Best effort: a leftover artifact only wastes disk space, it must not fail the migration. */
async function cleanupLegacyDiarizationFiles(modelsFolder: string) {
	for (const filename of config.legacyDiarizationFilenames) {
		try {
			await deleteModelFile(await join(modelsFolder, filename))
		} catch {
			// already gone, or removal refused — nothing to recover
		}
	}
}
