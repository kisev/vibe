// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { ToastProvider } from '~/providers/toast'
import { m } from '~/paraglide/messages.js'
import type { CatalogModel } from '~/lib/catalog'
import type { NamedPath } from '~/lib/types'
import type { SettingsViewModel } from './shared'
import { ModelsCatalogSection } from './models-catalog'

const mocks = vi.hoisted(() => ({
	downloadModel: vi.fn(),
	deleteModelFile: vi.fn(),
	loadModels: vi.fn(),
	selectModel: vi.fn(),
	openSelectedModel: vi.fn(),
	setModelDisplayNames: vi.fn(),
}))
vi.mock('~/lib/model', () => ({
	downloadModel: mocks.downloadModel,
	deleteModelFile: mocks.deleteModelFile,
	getFriendlyModelName: (name: string) => name,
}))

// jsdom has no pointer-capture API; Radix's select calls it on the trigger.
beforeAll(() => {
	Element.prototype.hasPointerCapture ??= () => false
	Element.prototype.releasePointerCapture ??= () => {}
	Element.prototype.setPointerCapture ??= () => {}
	Element.prototype.scrollIntoView ??= () => {}
})

afterEach(() => {
	cleanup()
	for (const mock of Object.values(mocks)) mock.mockReset()
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

// The catalog section folds the URL download and folder rows in and shows the
// installed files among the cards; the vm mock carries those handlers.
function makeVm(models: NamedPath[] = [], modelPath: string | null = null) {
	return {
		downloadURL: '',
		setDownloadURL: vi.fn(),
		downloadModel: vi.fn(),
		openModelsUrl: vi.fn(),
		openModelPath: vi.fn(),
		changeModelsFolder: vi.fn(),
		selectModel: mocks.selectModel,
		openSelectedModel: mocks.openSelectedModel,
		loadModels: mocks.loadModels,
		models,
		preference: { modelPath, modelDisplayNames: {}, setModelDisplayNames: mocks.setModelDisplayNames },
	} as unknown as SettingsViewModel
}

function renderCatalog(models: CatalogModel[], installed: NamedPath[] = [], modelPath: string | null = null) {
	return render(
		<TooltipProvider>
			<ToastProvider>
				<ModelsCatalogSection vm={makeVm(installed, modelPath)} models={models} />
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

		expect(screen.getByText(/Handy · 731 MB/)).toBeTruthy()
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
		expect(screen.getByText(/Handy · 731 MB/)).toBeTruthy()
		expect(screen.queryByText(/Handy · 485 MB/)).toBeNull()

		await user.click(screen.getByRole('combobox', { name: m.catalogQuantization() }))
		await user.click(await screen.findByRole('option', { name: 'Q4_K_M · 485 MB' }))

		expect(screen.getByText(/Handy · 485 MB/)).toBeTruthy()
		expect(screen.queryByText(/Handy · 731 MB/)).toBeNull()
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
		await user.click(await screen.findByRole('option', { name: 'Q4_K_M · 485 MB' }))
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
		// The selector still renders — it carries the per-quant download/delete affordances.
		expect(screen.getByRole('combobox', { name: m.catalogQuantization() })).toBeTruthy()
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

	it('lists short language codes only — regional variants collapse to the base', async () => {
		const user = userEvent.setup()
		renderCatalog([fixture({ languages: ['en-US', 'en-GB', 'ru-RU'] })])

		await user.click(screen.getByRole('combobox', { name: m.language() }))
		expect(await screen.findByRole('option', { name: 'en' })).toBeTruthy()
		expect(screen.getByRole('option', { name: 'ru' })).toBeTruthy()
		expect(screen.queryByRole('option', { name: 'en-US' })).toBeNull()

		await user.click(screen.getByRole('option', { name: 'en' }))
		expect(screen.getByText('Fixture Model')).toBeTruthy()
	})

	it('offers a Custom provider that shows only manual downloads', async () => {
		const user = userEvent.setup()
		renderCatalog([fixture()], [{ name: 'manual-download-Q4.gguf', path: '/models/manual-download-Q4.gguf' }])

		await user.click(screen.getByRole('combobox', { name: m.catalogProvider() }))
		await user.click(await screen.findByRole('option', { name: m.catalogCustom() }))

		// Display name plus the file line.
		expect(screen.getAllByText('manual-download-Q4.gguf').length).toBe(2)
		expect(screen.queryByText('Fixture Model')).toBeNull()

		await user.click(screen.getByRole('combobox', { name: m.catalogProvider() }))
		await user.click(await screen.findByRole('option', { name: m.catalogAllProviders() }))
		expect(screen.getByText('Fixture Model')).toBeTruthy()
	})
})

describe('quant selector affordances', () => {
	it('marks the installed quant and offers download per quant without selecting it', async () => {
		const user = userEvent.setup()
		renderCatalog([fixture()], [{ name: 'fixture-Q8_0.gguf', path: '/models/fixture-Q8_0.gguf' }])

		await user.click(screen.getByRole('combobox', { name: m.catalogQuantization() }))
		// The installed quant offers delete, the other one download.
		expect(screen.getAllByRole('button', { name: m.catalogDelete() }).length).toBe(1)
		const downloadButtons = screen.getAllByRole('button', { name: m.downloadModel() })
		await user.click(downloadButtons[0])

		expect(mocks.downloadModel).toHaveBeenCalledWith({
			url: 'https://huggingface.co/handy-computer/fixture-gguf/resolve/abc123/fixture-Q4_K_M.gguf',
			size: 485_425_536,
			sha256: 'hash-q4',
		})
		// Acting on an item must not select it — a selection would close the dropdown.
		expect(await screen.findByRole('listbox')).toBeTruthy()
	})

	it('deletes a downloaded quant after a confirm click and refreshes the list', async () => {
		mocks.deleteModelFile.mockResolvedValue(undefined)
		mocks.loadModels.mockResolvedValue(undefined)
		const user = userEvent.setup()
		renderCatalog([fixture()], [{ name: 'fixture-Q8_0.gguf', path: '/models/fixture-Q8_0.gguf' }])

		await user.click(screen.getByRole('combobox', { name: m.catalogQuantization() }))
		await user.click(screen.getByRole('button', { name: m.catalogDelete() }))
		await user.click(await screen.findByRole('button', { name: m.catalogConfirmDelete() }))

		expect(mocks.deleteModelFile).toHaveBeenCalledWith('/models/fixture-Q8_0.gguf')
		expect(mocks.loadModels).toHaveBeenCalled()
	})

	it('deletes the model from the card with a confirm click', async () => {
		mocks.deleteModelFile.mockResolvedValue(undefined)
		mocks.loadModels.mockResolvedValue(undefined)
		const user = userEvent.setup()
		renderCatalog([fixture()], [{ name: 'fixture-Q8_0.gguf', path: '/models/fixture-Q8_0.gguf' }])

		await user.click(screen.getByRole('button', { name: m.catalogDeleteModel() }))
		await user.click(await screen.findByRole('button', { name: m.catalogConfirmDelete() }))

		expect(mocks.deleteModelFile).toHaveBeenCalledWith('/models/fixture-Q8_0.gguf')
	})

	it('refuses to delete the active model', () => {
		const path = '/models/fixture-Q8_0.gguf'
		renderCatalog([fixture()], [{ name: 'fixture-Q8_0.gguf', path }], path)

		expect((screen.getByRole('button', { name: m.catalogDeleteModel() }) as HTMLButtonElement).disabled).toBe(true)
	})
})

describe('card links', () => {
	it('links to the model page on Hugging Face at the pinned revision', () => {
		renderCatalog([fixture()])

		const link = screen.getByRole('link', { name: m.catalogOpenOnHuggingFace() }) as HTMLAnchorElement
		expect(link.getAttribute('href')).toBe('https://huggingface.co/handy-computer/fixture-gguf/tree/abc123')
		expect(link.getAttribute('target')).toBe('_blank')
	})
})

describe('installed models in the catalog', () => {
	it('sorts an installed entry first, marks it and selects it with Use', async () => {
		const user = userEvent.setup()
		const path = '/models/fixture-Q8_0.gguf'
		// The installed model comes second in the list and must still lead; the other entry ships different files.
		renderCatalog(
			[fixture({ id: 'other', name: 'Other Model', files: { Q8_0: { filename: 'other-Q8_0.gguf', size: 100, sha256: 'h' } } }), fixture()],
			[{ name: 'fixture-Q8_0.gguf', path }],
		)

		const installedName = await screen.findByText('Fixture Model')
		const otherName = screen.getByText('Other Model')
		expect(installedName.compareDocumentPosition(otherName) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
		expect(screen.getByText(m.catalogInstalled())).toBeTruthy()

		await user.click(screen.getByRole('button', { name: m.catalogUse() }))
		expect(mocks.selectModel).toHaveBeenCalledWith(path)
	})

	it('marks the active model and offers no Use button for it', () => {
		const path = '/models/fixture-Q8_0.gguf'
		renderCatalog([fixture()], [{ name: 'fixture-Q8_0.gguf', path }], path)

		expect(screen.getByText(m.catalogActive())).toBeTruthy()
		expect(screen.queryByRole('button', { name: m.catalogUse() })).toBeNull()
	})

	it('renders an installed file the catalog does not know above the cards', () => {
		renderCatalog([fixture()], [{ name: 'manual-download-Q4.gguf', path: '/models/manual-download-Q4.gguf' }])

		// The display name and the file line both carry it.
		expect(screen.getAllByText('manual-download-Q4.gguf').length).toBe(2)
		expect(screen.getByText(m.catalogInstalled())).toBeTruthy()
		expect(screen.getByRole('button', { name: m.catalogUse() })).toBeTruthy()
	})
})

describe('limitations on the card', () => {
	it('lists what an entry cannot do on its card', () => {
		renderCatalog([
			fixture({
				id: 'plain',
				capabilities: { streaming: false, translate: false, languageDetection: false, timestamps: true },
			}),
		])

		expect(screen.getByText(m.modelLimitationStreaming(), { exact: false })).toBeTruthy()
		expect(screen.getByText(m.modelLimitationTranslation(), { exact: false })).toBeTruthy()
		expect(screen.getByText(m.modelLimitationLanguage({ language: 'en' }), { exact: false })).toBeTruthy()
	})

	it('shows no limitations for a fully capable entry', () => {
		renderCatalog([
			fixture({
				id: 'full',
				languages: ['en', 'de'],
				capabilities: { streaming: true, translate: true, languageDetection: true, timestamps: true },
			}),
		])

		expect(screen.queryByText(m.modelLimitationStreaming(), { exact: false })).toBeNull()
		expect(screen.queryByText(m.modelLimitationTranslation(), { exact: false })).toBeNull()
	})
})
