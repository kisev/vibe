// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import type { ModelCapabilities } from '~/lib/model'
import type { SettingsViewModel } from './shared'
import { parseChunkSeconds, TuningSection } from './tuning'

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
}

const gigaam: ModelCapabilities = {
	engine: 'gigaam',
	requires_vad: true,
	languages: ['ru'],
	language_detection: false,
	streaming: false,
	translation: false,
	timestamps: true,
	text_prompts: false,
	max_input_seconds: 25,
}

function vmWith(capabilities: ModelCapabilities) {
	return {
		preference: {
			modelMetadata: { format: 'gguf', capabilities },
			modelOptions: { lang: 'en', verbose: false, sampling_strategy: 'beam search', best_of: 5, beam_size: 5 },
			diarizeEnabled: false,
			stableTimestampsEnabled: false,
			chunkSeconds: null,
			setChunkSeconds: vi.fn(),
		},
		handleStableTimestampsToggle: vi.fn(),
		toggleDiarization: vi.fn(),
	} as unknown as SettingsViewModel
}

describe('tuning section engine gating', () => {
	it('offers stable timestamps and Whisper options for Whisper models', () => {
		render(<TuningSection vm={vmWith(whisper)} onOpenWhisper={vi.fn()} onOpenAudio={vi.fn()} />)

		expect(screen.getByText(m.enableStableTimestamps())).toBeTruthy()
		expect(screen.getByText(m.whisperOptions())).toBeTruthy()
		expect(screen.queryByText(m.whisperOnlyOptionsNote())).toBeNull()
	})

	it('hides both for GigaAM but keeps diarization and audio processing', () => {
		render(<TuningSection vm={vmWith(gigaam)} onOpenWhisper={vi.fn()} onOpenAudio={vi.fn()} />)

		expect(screen.queryByText(m.enableStableTimestamps())).toBeNull()
		expect(screen.queryByText(m.whisperOptions())).toBeNull()
		expect(screen.getByText(m.whisperOnlyOptionsNote())).toBeTruthy()
		expect(screen.getByText(m.enableDiarization())).toBeTruthy()
		expect(screen.getByText(m.audioProcessing())).toBeTruthy()
	})

	it('offers the chunk length to a bounded engine', () => {
		render(<TuningSection vm={vmWith(gigaam)} onOpenWhisper={vi.fn()} onOpenAudio={vi.fn()} />)
		expect(screen.getByLabelText(m.chunkLength())).toBeTruthy()
	})

	it('hides the chunk length from an unbounded engine', () => {
		render(<TuningSection vm={vmWith(whisper)} onOpenWhisper={vi.fn()} onOpenAudio={vi.fn()} />)
		expect(screen.queryByLabelText(m.chunkLength())).toBeNull()
	})

	it('clamps an oversized chunk length to the engine maximum', () => {
		const vm = vmWith(gigaam)
		render(<TuningSection vm={vm} onOpenWhisper={vi.fn()} onOpenAudio={vi.fn()} />)
		fireEvent.change(screen.getByLabelText(m.chunkLength()), { target: { value: '999' } })
		expect(vm.preference.setChunkSeconds).toHaveBeenCalledWith(25)
	})

	it('parses the chunk length: empty restores the default, values clamp into range', () => {
		expect(parseChunkSeconds('', 25)).toBeNull()
		expect(parseChunkSeconds('8', 25)).toBe(8)
		expect(parseChunkSeconds('999', 25)).toBe(25)
		expect(parseChunkSeconds('0', 25)).toBe(1)
		expect(parseChunkSeconds('abc', 25)).toBeNull()
	})
})
