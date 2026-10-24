import { describe, expect, it } from 'vitest'
import type { ModelCapabilities } from './model'
import { modelLimitations } from './model'

const gigaamLike: ModelCapabilities = {
	engine: 'gigaam',
	requires_vad: true,
	languages: ['ru'],
	language_detection: false,
	streaming: false,
	translation: false,
	timestamps: true,
	text_prompts: false,
}

/** Same gaps, different engine name: the note must be identical. */
const renamedGigaamLike: ModelCapabilities = { ...gigaamLike, engine: 'some-future-engine' }

const full: ModelCapabilities = {
	engine: 'whisper',
	requires_vad: false,
	languages: ['en'],
	language_detection: true,
	streaming: true,
	translation: true,
	timestamps: true,
	text_prompts: true,
}

describe('modelLimitations', () => {
	it('names every gap of a limited model', () => {
		expect(modelLimitations(gigaamLike)).toEqual([
			{ kind: 'language', language: 'ru' },
			{ kind: 'streaming' },
			{ kind: 'translation' },
			{ kind: 'prompts' },
		])
	})

	it('is identical for capability-equal models with different engine names', () => {
		expect(modelLimitations(renamedGigaamLike)).toEqual(modelLimitations(gigaamLike))
	})

	it('stays silent for a model without gaps and for missing metadata', () => {
		expect(modelLimitations(full)).toEqual([])
		expect(modelLimitations(null)).toEqual([])
	})
})
