// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { ToastProvider } from '~/providers/toast'
import { m } from '~/paraglide/messages.js'
import type { CatalogModel } from '~/lib/catalog'
import type { SettingsViewModel } from './shared'
import { ModelsCatalogSection } from './models-catalog'

const mocks = vi.hoisted(() => ({ downloadModel: vi.fn() }))
vi.mock('~/lib/model', () => ({ downloadModel: mocks.downloadModel }))

// jsdom has no pointer-capture API; Radix's select calls it on the trigger.
beforeAll(() => {
	Element.prototype.hasPointerCapture ??= () => false
	Element.prototype.releasePointerCapture ??= () => {}
	Element.prototype.setPointerCapture ??= () => {}
	Element.prototype.scrollIntoView ??= () => {}
})

afterEach(() => {
	cleanup()
	mocks.downloadModel.mockReset()
})

function fixture(overrides: Partial<CatalogModel> = {}): CatalogModel {
	return {
		id: 'fixture-model',
		name: 'Fixture Model',
		description: '',
		repository: 'handy-computer/fixture-gguf',
		revision: 'abc123',
		license: 'cc-by-4.0',
		family: 'parakeet',
		parameters: '618M',
		languages: ['en'],
		capabilities: { streaming: true, translate: true, languageDetection: false, timestamps: true },
		quant: 'Q8_0',
		role: 'asr',
		curated: true,
		minEngine: '0.2.4',
		files: {
			Q8_0: { filename: 'fixture-Q8_0.gguf', size: 731_357_568, sha256: 'hash-q8' },
			Q4_K_M: { filename: 'fixture-Q4_K_M.gguf', size: 485_425_536, sha256: 'hash-q4' },
		},
		...overrides,
	}
}

// The catalog section folds the URL download and folder rows in; the vm mock
// carries just those handlers.
const vm = {
	downloadURL: '',
	setDownloadURL: vi.fn(),
	downloadModel: vi.fn(),
	openModelsUrl: vi.fn(),
	openModelPath: vi.fn(),
	changeModelsFolder: vi.fn(),
} as unknown as SettingsViewModel

function renderCatalog(models: CatalogModel[]) {
	return render(
		<TooltipProvider>
			<ToastProvider>
				<ModelsCatalogSection vm={vm} models={models} />
			</ToastProvider>
		</TooltipProvider>,
	)
}

describe('models catalog section', () => {
	it('renders provider, size, languages, both badges and both bars for a benchmarked entry', () => {
		// The fixture borrows a real benchmarked id, so entryScores resolves against the real catalog.
		renderCatalog([
			fixture({
				id: 'parakeet-unified-en-0.6b',
				repository: 'handy-computer/parakeet-unified-en-0.6b-gguf',
			}),
		])

		expect(screen.getByText(/Handy/)).toBeTruthy()
		expect(screen.getByText(/731 MB/)).toBeTruthy()
		expect(screen.getByText('en')).toBeTruthy()
		// The filter chip always shows, so a badge means the text appears twice.
		expect(screen.getAllByText(m.catalogStreaming()).length).toBe(2)
		expect(screen.getAllByText(m.catalogTranslation()).length).toBe(2)
		expect(screen.getByLabelText(m.catalogAccuracy())).toBeTruthy()
		expect(screen.getByLabelText(m.catalogSpeed())).toBeTruthy()
	})

	it('compacts a long language list to the first three plus a count', () => {
		renderCatalog([fixture({ languages: ['en', 'de', 'es', 'fr', 'it'] })])
		expect(screen.getByText('en, de, es +2')).toBeTruthy()
	})

	it('renders no bars or badges for an unbenchmarked, non-streaming entry', () => {
		renderCatalog([
			fixture({
				id: 'never-benchmarked',
				capabilities: { streaming: false, translate: false, languageDetection: false, timestamps: true },
			}),
		])

		expect(screen.queryByLabelText(m.catalogAccuracy())).toBeNull()
		expect(screen.queryByLabelText(m.catalogSpeed())).toBeNull()
		// Only the filter chip carries the label — no card badge.
		expect(screen.getAllByText(m.catalogStreaming()).length).toBe(1)
		expect(screen.getAllByText(m.catalogTranslation()).length).toBe(1)
	})

	it('switching quantization updates the displayed size', async () => {
		const user = userEvent.setup()
		renderCatalog([fixture()])
		expect(screen.getByText(/731 MB/)).toBeTruthy()
		expect(screen.queryByText(/485 MB/)).toBeNull()

		await user.click(screen.getByRole('combobox', { name: m.catalogQuantization() }))
		await user.click(await screen.findByRole('option', { name: 'Q4_K_M' }))

		expect(screen.getByText(/485 MB/)).toBeTruthy()
		expect(screen.queryByText(/731 MB/)).toBeNull()
	})

	it('downloads the selected quantization with the right url, size and sha256', async () => {
		const user = userEvent.setup()
		mocks.downloadModel.mockResolvedValue('/models/fixture-Q8_0.gguf')
		renderCatalog([fixture()])
		// Two rows download: the card's one-click download and the pasted-URL row. The card's comes first.
		const cardDownload = () => screen.getAllByRole('button', { name: m.downloadModel() })[0]!

		await user.click(cardDownload())
		expect(mocks.downloadModel).toHaveBeenCalledWith({
			url: 'https://huggingface.co/handy-computer/fixture-gguf/resolve/abc123/fixture-Q8_0.gguf',
			size: 731_357_568,
			sha256: 'hash-q8',
		})

		await user.click(screen.getByRole('combobox', { name: m.catalogQuantization() }))
		await user.click(await screen.findByRole('option', { name: 'Q4_K_M' }))
		await user.click(cardDownload())
		expect(mocks.downloadModel).toHaveBeenLastCalledWith({
			url: 'https://huggingface.co/handy-computer/fixture-gguf/resolve/abc123/fixture-Q4_K_M.gguf',
			size: 485_425_536,
			sha256: 'hash-q4',
		})
	})

	it('marks an entry ahead of the bundled engine with its requirement and a disabled download', () => {
		renderCatalog([fixture({ id: 'ahead-of-engine', minEngine: '9.9.9' })])

		expect(screen.getByText(m.catalogRequiresEngine({ requirement: '9.9.9' }))).toBeTruthy()
		expect((screen.getAllByRole('button', { name: m.downloadModel() })[0] as HTMLButtonElement).disabled).toBe(true)
	})

	it('marks a legacy .bin entry as needing a GGUF build and disables the download', () => {
		renderCatalog([
			fixture({
				id: 'legacy-bin',
				quant: 'F16',
				files: { F16: { filename: 'ggml-fixture.bin', size: 77_691_713, sha256: 'hash-bin' } },
			}),
		])

		expect(screen.getByText(m.catalogRequiresGguf())).toBeTruthy()
		expect((screen.getAllByRole('button', { name: m.downloadModel() })[0] as HTMLButtonElement).disabled).toBe(true)
		// A single file ships no quantization selector.
		expect(screen.queryByRole('combobox', { name: m.catalogQuantization() })).toBeNull()
	})
})

describe('catalog filters', () => {
	it('keeps only streaming entries when the streaming chip is on', async () => {
		const user = userEvent.setup()
		renderCatalog([
			fixture({ name: 'Streaming Model' }),
			fixture({ id: 'plain', name: 'Plain Model', capabilities: { streaming: false, translate: false, languageDetection: false, timestamps: true } }),
		])

		await user.click(screen.getByRole('button', { name: m.catalogStreaming() }))

		expect(screen.getByText('Streaming Model')).toBeTruthy()
		expect(screen.queryByText('Plain Model')).toBeNull()
	})

	it('searches by name and shows the no-matches note when nothing survives', async () => {
		const user = userEvent.setup()
		renderCatalog([fixture(), fixture({ id: 'other', name: 'Other Model' })])

		await user.type(screen.getByPlaceholderText(m.catalogSearch()), 'Other')

		expect(screen.getByText('Other Model')).toBeTruthy()
		expect(screen.queryByText('Fixture Model')).toBeNull()

		await user.type(screen.getByPlaceholderText(m.catalogSearch()), 'zzz')
		expect(screen.getByText(m.catalogNoMatches())).toBeTruthy()
	})

	it('filters by language', async () => {
		const user = userEvent.setup()
		renderCatalog([fixture({ name: 'English Model', languages: ['en'] }), fixture({ id: 'de', name: 'German Model', languages: ['de'] })])

		await user.click(screen.getByRole('combobox', { name: m.language() }))
		await user.click(await screen.findByRole('option', { name: 'de' }))

		expect(screen.getByText('German Model')).toBeTruthy()
		expect(screen.queryByText('English Model')).toBeNull()

		await user.click(screen.getByRole('combobox', { name: m.language() }))
		await user.click(await screen.findByRole('option', { name: m.catalogAllLanguages() }))

		expect(screen.getByText('English Model')).toBeTruthy()
	})
})
