import { describe, expect, it, vi } from 'vitest'
import * as config from './config'
import type { ModelMetadata } from './model'
import { ensureVadModel, type VadGate } from './vad'

/** The exact metadata the server reports for a GigaAM v3 GGUF, which needs Silero VAD. */
const gigaam: ModelMetadata = {
	format: 'gguf',
	capabilities: {
		engine: 'gigaam',
		requires_vad: true,
		languages: ['ru'],
		language_detection: false,
		streaming: false,
		translation: false,
		timestamps: true,
		text_prompts: false,
		stable_timestamps: false,
		decoding_options: false,
	},
}

/** Metadata for a Whisper model, which runs without a separate VAD file. */
const whisper: ModelMetadata = {
	...gigaam,
	capabilities: { ...gigaam.capabilities, engine: 'whisper', requires_vad: false },
}

function fakeGate(options: { metadata?: ModelMetadata | null; usable?: boolean; confirmed?: boolean; downloadError?: Error } = {}) {
	const isUsable = vi.fn(async () => options.usable ?? false)
	const confirm = vi.fn(async () => options.confirmed ?? true)
	const download = vi.fn(async () => {
		if (options.downloadError) throw options.downloadError
	})
	const gate: VadGate = {
		metadata: options.metadata === undefined ? gigaam : options.metadata,
		vadPath: '/models/ggml-silero-v6.2.0.bin',
		isUsable,
		confirm,
		download,
	}
	return { gate, isUsable, confirm, download }
}

describe('ensureVadModel', () => {
	it('passes without a prompt or download when the model does not require VAD', async () => {
		const { gate, isUsable, confirm, download } = fakeGate({ metadata: whisper })

		await expect(ensureVadModel(gate)).resolves.toBe(true)
		expect(isUsable).not.toHaveBeenCalled()
		expect(confirm).not.toHaveBeenCalled()
		expect(download).not.toHaveBeenCalled()
	})

	it('passes without a prompt when the VAD file is already usable', async () => {
		const { gate, confirm, download } = fakeGate({ usable: true })

		await expect(ensureVadModel(gate)).resolves.toBe(true)
		expect(confirm).not.toHaveBeenCalled()
		expect(download).not.toHaveBeenCalled()
	})

	it('gives up without downloading when the user declines', async () => {
		const { gate, confirm, download } = fakeGate({ confirmed: false })

		await expect(ensureVadModel(gate)).resolves.toBe(false)
		expect(confirm).toHaveBeenCalledOnce()
		expect(download).not.toHaveBeenCalled()
	})

	it('downloads the VAD model once when the user agrees', async () => {
		const { gate, download } = fakeGate()

		await expect(ensureVadModel(gate)).resolves.toBe(true)
		expect(download).toHaveBeenCalledOnce()
		expect(download).toHaveBeenCalledWith(config.vadModelUrl, gate.vadPath)
	})

	it('propagates a failed download', async () => {
		const { gate, download } = fakeGate({ downloadError: new Error('offline') })

		await expect(ensureVadModel(gate)).rejects.toThrow('offline')
		expect(download).toHaveBeenCalledOnce()
	})
})
