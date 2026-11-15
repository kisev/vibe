import { invoke } from '@tauri-apps/api/core'
import { join } from '@tauri-apps/api/path'
import { ask } from '@tauri-apps/plugin-dialog'
import { toast } from 'sonner'
import { m } from '~/paraglide/messages.js'
import * as config from '~/lib/config'
import { downloadModel, isModelFileUsable, requiresVad, type ModelMetadata } from '~/lib/model'
import { ensureVadModel } from '~/lib/vad'
import { errorMessage } from '~/lib/errors'

/** The user dismissed the model download on purpose: no failure to report, just no model. */
class VadDownloadCancelled extends Error {}

/**
 * Make sure the Silero VAD model a transcription model needs is present, asking before the
 * download. A model that does not require VAD passes without an IPC call. A cancelled or failed
 * download returns false, so the caller leaves the model unselected instead of persisting one
 * that cannot run.
 */
export async function ensureRequiredVadModel(metadata: ModelMetadata | null): Promise<boolean> {
	if (!requiresVad(metadata?.capabilities)) return true
	try {
		const modelsFolder = await invoke<string>('get_models_folder')
		const vadPath = await join(modelsFolder, config.vadModelFilename)
		return await ensureVadModel({
			metadata,
			vadPath,
			isUsable: isModelFileUsable,
			confirm: () => ask(m.downloadRequiredVadModelQuestion(), { title: m.downloadRequiredVadModel(), kind: 'info' }),
			download: async (url, path) => {
				const downloaded = await downloadModel(url, { replacePath: path, displayName: 'Silero VAD' })
				// A cancelled download resolves to null: the gate must not treat that as installed.
				if (!downloaded) throw new VadDownloadCancelled('VAD model download was cancelled')
				toast.success(m.downloadComplete())
			},
		})
	} catch (error) {
		if (!(error instanceof VadDownloadCancelled)) {
			console.error('failed to prepare the required VAD model:', error)
			toast.error(errorMessage(error))
		}
		return false
	}
}
