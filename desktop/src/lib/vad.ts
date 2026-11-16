import * as config from './config'
import { requiresVad, type ModelMetadata } from './model'

/** The callbacks the VAD gate needs, so the check itself stays free of Tauri, React, and dialogs. */
export interface VadGate {
	metadata: ModelMetadata | null
	vadPath: string
	isUsable: (path: string) => Promise<boolean>
	confirm: () => Promise<boolean>
	download: (url: string, path: string) => Promise<void>
}

/**
 * Make sure the Silero VAD model a transcription model needs is present, asking the user before
 * downloading it. A model that does not require VAD, or one whose VAD file is already usable,
 * passes without a prompt or a download.
 *
 * The file is re-checked after the download: an implementation may report a failed download
 * through a toast instead of throwing, and returning true then would select a model whose VAD
 * file is missing.
 */
export async function ensureVadModel(gate: VadGate): Promise<boolean> {
	if (!requiresVad(gate.metadata?.capabilities)) return true
	if (await gate.isUsable(gate.vadPath)) return true
	if (!(await gate.confirm())) return false
	await gate.download(config.vadModelUrl, gate.vadPath)
	return gate.isUsable(gate.vadPath)
}
