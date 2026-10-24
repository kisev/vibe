// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'
import type { ModelCapabilities } from '~/lib/model'
import type { Preference } from '~/providers/preference'
import { buildSharedOptions, reconcileProjectName } from './use-transcribe-queue'

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(async () => '/models') }))

const gigaam: ModelCapabilities = {
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
	max_input_seconds: 25,
}

const whisper: ModelCapabilities = {
	engine: 'whisper',
	requires_vad: false,
	languages: ['en'],
	language_detection: true,
	streaming: true,
	translation: true,
	timestamps: true,
	text_prompts: true,
	stable_timestamps: true,
	decoding_options: true,
}

function preferenceWith(
	capabilities: ModelCapabilities,
	overrides: { diarizeEnabled?: boolean; stableTimestampsEnabled?: boolean; chunkSeconds?: number | null } = {},
) {
	return {
		modelMetadata: { format: 'gguf', capabilities },
		diarizeEnabled: false,
		stableTimestampsEnabled: false,
		chunkSeconds: null,
		...overrides,
	} as unknown as Preference
}

describe('shared transcription options', () => {
	it('passes the required VAD model to GigaAM', async () => {
		expect(await buildSharedOptions(preferenceWith(gigaam))).toEqual({ vad_model: '/models/ggml-silero-v6.2.0.bin' })
	})

	it('keeps diarization working for GigaAM', async () => {
		expect(await buildSharedOptions(preferenceWith(gigaam, { diarizeEnabled: true }))).toEqual({
			diarize_model: '/models/diar_streaming_sortformer_4spk-v2.q8_0.gguf',
			vad_model: '/models/ggml-silero-v6.2.0.bin',
		})
	})

	it('never sends stable timestamps to GigaAM, even if the setting is left on', async () => {
		const options = await buildSharedOptions(preferenceWith(gigaam, { stableTimestampsEnabled: true }))
		expect(options).not.toHaveProperty('stable_timestamps')
		expect(options).toEqual({ vad_model: '/models/ggml-silero-v6.2.0.bin' })
	})

	it('still sends stable timestamps to Whisper', async () => {
		expect(await buildSharedOptions(preferenceWith(whisper, { stableTimestampsEnabled: true }))).toEqual({
			vad_model: '/models/ggml-silero-v6.2.0.bin',
			stable_timestamps: true,
		})
	})

	it('sends a custom chunk length to a bounded engine', async () => {
		expect(await buildSharedOptions(preferenceWith(gigaam, { chunkSeconds: 10 }))).toEqual({
			vad_model: '/models/ggml-silero-v6.2.0.bin',
			chunk_seconds: 10,
		})
	})

	it('clamps a custom chunk length to the engine maximum', async () => {
		expect(await buildSharedOptions(preferenceWith(gigaam, { chunkSeconds: 999 }))).toEqual({
			vad_model: '/models/ggml-silero-v6.2.0.bin',
			chunk_seconds: 25,
		})
	})

	it('never sends a chunk length to Whisper or when it is unset', async () => {
		expect(await buildSharedOptions(preferenceWith(whisper, { chunkSeconds: 10 }))).not.toHaveProperty('chunk_seconds')
		expect(await buildSharedOptions(preferenceWith(gigaam))).not.toHaveProperty('chunk_seconds')
	})
})

describe('project name reconciliation', () => {
	it('keeps reconciling when the live title changes during a slow rename', async () => {
		let liveName = 'Second draft'
		const rename = vi.fn(async (_path: string, name: string) => {
			if (name === 'Second draft') liveName = 'Final title'
			return {
				path: `/projects/${name}/transcript.vibe.json`,
				mediaPath: `/projects/${name}/audio.wav`,
				name,
				createdAt: new Date(0),
			}
		})

		const result = await reconcileProjectName(
			'Original',
			{ recordPath: '/projects/Original/transcript.vibe.json', mediaPath: '/projects/Original/audio.wav' },
			() => liveName,
			rename,
		)

		expect(rename.mock.calls.map(([, name]) => name)).toEqual(['Second draft', 'Final title'])
		expect(result).toEqual({
			recordPath: '/projects/Final title/transcript.vibe.json',
			mediaPath: '/projects/Final title/audio.wav',
		})
	})
})
