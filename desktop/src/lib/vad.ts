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
 */
export async function ensureVadModel(gate: VadGate): Promise<boolean> {
	if (!requiresVad(gate.metadata?.capabilities)) return true
	if (await gate.isUsable(gate.vadPath)) return true
	if (!(await gate.confirm())) return false
	await gate.download(config.vadModelUrl, gate.vadPath)
	return true
}
