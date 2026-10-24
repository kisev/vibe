// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import type { ModelCapabilities } from '~/lib/model'
import type { SettingsViewModel } from './shared'
import { WhisperOptionsSection } from './whisper-options'

afterEach(cleanup)

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

function vmWith(capabilities: ModelCapabilities | null) {
	return {
		preference: {
			modelMetadata: capabilities ? { format: 'gguf', capabilities } : null,
			modelOptions: {
				lang: capabilities?.languages[0] ?? 'en',
				verbose: false,
				n_threads: 4,
				init_prompt: '',
				temperature: 0.4,
				word_timestamps: false,
				max_sentence_len: undefined,
				sampling_strategy: 'beam search',
				best_of: 5,
				beam_size: 5,
				max_text_ctx: undefined,
				translate: false,
			},
			setModelOptions: vi.fn(),
		},
	} as unknown as SettingsViewModel
}

describe('Whisper-only option gating', () => {
	it('shows the decoding controls for a Whisper model', () => {
		render(<WhisperOptionsSection vm={vmWith(whisper)} />)

		expect(screen.getByText(m.translateToEnglish())).toBeTruthy()
		expect(screen.getByText(m.useWordTimestamps())).toBeTruthy()
		expect(screen.getByText(m.maxSentenceLen())).toBeTruthy()
		expect(screen.getByText(m.prompt())).toBeTruthy()
		expect(screen.getByText(m.samplingStrategy())).toBeTruthy()
		expect(screen.getByText(m.temperature())).toBeTruthy()
		expect(screen.getByText(m.maxTextCtx())).toBeTruthy()
		expect(screen.queryByText(m.whisperOnlyOptionsNote())).toBeNull()
	})

	it('hides them for GigaAM while keeping the shared thread count', () => {
		render(<WhisperOptionsSection vm={vmWith(gigaam)} />)

		expect(screen.getByText(m.whisperOnlyOptionsNote())).toBeTruthy()
		expect(screen.queryByText(m.translateToEnglish())).toBeNull()
		expect(screen.queryByText(m.useWordTimestamps())).toBeNull()
		expect(screen.queryByText(m.maxSentenceLen())).toBeNull()
		expect(screen.queryByText(m.prompt())).toBeNull()
		expect(screen.queryByText(m.samplingStrategy())).toBeNull()
		expect(screen.queryByText(m.temperature())).toBeNull()
		expect(screen.queryByText(m.maxTextCtx())).toBeNull()
		// Threads apply to every ggml engine, so that row stays.
		expect(screen.getByText(m.threads())).toBeTruthy()
	})

	it('keeps the controls when metadata has not loaded yet', () => {
		render(<WhisperOptionsSection vm={vmWith(null)} />)
		expect(screen.getByText(m.translateToEnglish())).toBeTruthy()
		expect(screen.queryByText(m.whisperOnlyOptionsNote())).toBeNull()
	})
})
