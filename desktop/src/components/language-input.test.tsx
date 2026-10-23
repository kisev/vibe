// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import type { ModelCapabilities } from '~/lib/model'
import LanguageInput from './language-input'

const mocks = vi.hoisted(() => ({ preference: {} as Record<string, unknown> }))

vi.mock('~/providers/preference', () => ({ usePreferenceProvider: () => mocks.preference }))

const whisper: ModelCapabilities = {
	engine: 'whisper',
	requires_vad: false,
	languages: ['en', 'ru'],
	language_detection: true,
	streaming: true,
	translation: true,
	timestamps: true,
	text_prompts: true,
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
}

function preferenceWith(capabilities: ModelCapabilities, lang: string) {
	return {
		modelMetadata: { format: 'gguf', capabilities },
		modelOptions: { lang },
		displayLanguage: 'en-US',
		recentLanguages: [],
		setModelOptions: vi.fn(),
		setRecentLanguages: vi.fn(),
	}
}

function openPicker() {
	fireEvent.click(screen.getByRole('button', { name: m.language() }))
}

afterEach(cleanup)
beforeEach(() => {
	mocks.preference = preferenceWith(gigaam, 'ru')
})

describe('language selection for GigaAM', () => {
	it('offers Russian only and no automatic detection', () => {
		render(<LanguageInput />)
		openPicker()

		expect(screen.getByText('Russian')).toBeTruthy()
		expect(screen.queryByText(/auto detect/i)).toBeNull()
		expect(screen.queryByText('English')).toBeNull()
	})

	it('still offers automatic detection and every language for Whisper', () => {
		mocks.preference = preferenceWith(whisper, 'en')
		render(<LanguageInput />)
		openPicker()

		expect(screen.getByText('English')).toBeTruthy()
		expect(screen.getByText('Russian')).toBeTruthy()
		expect(screen.getByText(/auto detect/i)).toBeTruthy()
	})
})
