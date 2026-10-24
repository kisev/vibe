import { describe, expect, it } from 'vitest'
import { hidesDecodingOptions, hidesStableTimestamps, requiresVad, resolveModelLanguage, withoutUnsupportedOptions, type ModelCapabilities } from './model'

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

/** The exact metadata the server reports for a GigaAM v3 GGUF. */
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
}

const options = { lang: 'en', init_prompt: 'Punctuate. Use full sentences.', translate: true, n_threads: 4 }
const decodingOptions = {
	...options,
	word_timestamps: true,
	max_sentence_len: 32,
	sampling_strategy: 'greedy' as const,
	best_of: 3,
	beam_size: 3,
	temperature: 0.4,
	max_text_ctx: 512,
}

describe('withoutUnsupportedOptions', () => {
	it('sends everything to a model that takes prompts and translation', () => {
		expect(withoutUnsupportedOptions(options, whisper)).toEqual(options)
		expect(withoutUnsupportedOptions(decodingOptions, whisper)).toEqual(decodingOptions)
	})

	it('drops the prompt and translation for engines that reject them, keeping the rest', () => {
		expect(withoutUnsupportedOptions(options, { ...whisper, engine: 'parakeet', text_prompts: false, translation: false, stable_timestamps: false, decoding_options: false })).toEqual({
			lang: 'en',
			n_threads: 4,
		})
	})

	it('drops every Whisper-only decoding option for GigaAM', () => {
		expect(withoutUnsupportedOptions(decodingOptions, gigaam)).toEqual({ lang: 'en', n_threads: 4 })
	})

	it('leaves the options alone when no capabilities are known yet', () => {
		expect(withoutUnsupportedOptions(options, null)).toEqual(options)
		expect(withoutUnsupportedOptions(options, undefined)).toBe(options)
	})
})

describe('capability gates', () => {
	it('hides the Whisper-style controls for models that report no support', () => {
		expect(hidesStableTimestamps(whisper)).toBe(false)
		expect(hidesDecodingOptions(whisper)).toBe(false)
		expect(hidesStableTimestamps(gigaam)).toBe(true)
		expect(hidesDecodingOptions(gigaam)).toBe(true)
		// Metadata that has not loaded yet must not hide controls from a model that may support them.
		expect(hidesStableTimestamps(null)).toBe(false)
		expect(hidesStableTimestamps(undefined)).toBe(false)
		expect(hidesDecodingOptions(null)).toBe(false)
		expect(hidesDecodingOptions(undefined)).toBe(false)
	})

	it('reads the flags, not the engine name: equal capabilities gate alike', () => {
		const futureEngine = { ...whisper, engine: 'some-future-engine' }
		expect(hidesStableTimestamps(futureEngine)).toBe(false)
		expect(hidesDecodingOptions(futureEngine)).toBe(false)
		const unflaggedWhisper = { ...gigaam, engine: 'whisper' }
		expect(hidesStableTimestamps(unflaggedWhisper)).toBe(true)
		expect(hidesDecodingOptions(unflaggedWhisper)).toBe(true)
	})

	it('keeps the controls when the flags are missing entirely', () => {
		const legacy = { ...whisper, stable_timestamps: undefined, decoding_options: undefined }
		expect(hidesStableTimestamps(legacy)).toBe(false)
		expect(hidesDecodingOptions(legacy)).toBe(false)
	})

	it('reports VAD as required only when the model says so', () => {
		expect(requiresVad(gigaam)).toBe(true)
		expect(requiresVad(whisper)).toBe(false)
		expect(requiresVad(null)).toBe(false)
	})
})

describe('resolveModelLanguage', () => {
	it('moves an unsupported or auto language to the only language GigaAM supports', () => {
		expect(resolveModelLanguage(gigaam, 'en')).toBe('ru')
		expect(resolveModelLanguage(gigaam, 'auto')).toBe('ru')
		expect(resolveModelLanguage(gigaam, 'ru')).toBe('ru')
	})

	it('keeps a supported language exactly as chosen', () => {
		expect(resolveModelLanguage(whisper, 'en')).toBe('en')
		expect(resolveModelLanguage(whisper, 'auto')).toBe('auto')
		expect(resolveModelLanguage(null, 'auto')).toBe('auto')
	})
})
