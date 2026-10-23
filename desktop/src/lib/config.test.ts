import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { gigaamModelFilename, gigaamModelUrl, vadModelFilename, vadModelUrl } from './config'
import { getFilenameFromUrl, isAuxiliaryModelFile, isModelFile } from './model'

describe('GigaAM model catalog entry', () => {
	it('uses a direct GGUF download that the settings URL flow can install', async () => {
		expect(gigaamModelFilename).toBe('gigaam-v3-e2e-rnnt-Q8_0.gguf')
		expect(await getFilenameFromUrl(gigaamModelUrl)).toBe(gigaamModelFilename)
		expect(isModelFile(gigaamModelFilename)).toBe(true)
		// Transcription models must not be mistaken for the VAD/diarization helpers.
		expect(isAuxiliaryModelFile(gigaamModelFilename)).toBe(false)
	})

	it('is the same URL the model catalog documents', () => {
		const catalog = readFileSync(join(__dirname, '../../../i18n/docs/en-US/models.md'), 'utf8')
		expect(catalog).toContain(gigaamModelUrl)
	})

	it('keeps the documented GigaAM limitations in the app strings', () => {
		const catalog = readFileSync(join(__dirname, '../../../i18n/docs/en-US/models.md'), 'utf8').toLowerCase()
		for (const limitation of ['russian only', 'silero vad', '25 seconds', 'translation', 'stable timestamps', 'auto-detect']) {
			expect(catalog).toContain(limitation)
		}
	})

	it('leaves the existing VAD helper URL unchanged', () => {
		expect(vadModelFilename).toBe('ggml-silero-v6.2.0.bin')
		expect(vadModelUrl).toContain(vadModelFilename)
	})
})
