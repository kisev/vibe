// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { m } from '~/paraglide/messages.js'
import * as config from '~/lib/config'
import { SpeakerSeparationModelGroup } from './models-speaker'

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(),
	isUsable: vi.fn(),
	downloadModel: vi.fn(),
	openPath: vi.fn(),
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('@tauri-apps/api/path', () => ({ join: async (dir: string, name: string) => `${dir}/${name}` }))
vi.mock('~/lib/model', () => ({
	isModelFileUsable: mocks.isUsable,
	downloadModel: mocks.downloadModel,
	getModelDisplayName: (filename: string) =>
		filename === config.diarizeModelFilename
			? 'Nemotron-3-Diarization Q8_0'
			: filename
					.replace(/\.[^.]+$/, '')
					.replace(/[-_]+/g, ' ')
					.replace(/\b\w/g, (letter: string) => letter.toUpperCase()),
}))
vi.mock('~/lib/catalog', () => ({ sizeMb: (bytes: number) => Math.round(bytes / 1_000_000) }))
vi.mock('~/lib/app', () => ({ openPath: mocks.openPath }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// The model name the component renders from the bundled filename.
const speakerModelName = 'Nemotron-3-Diarization Q8_0'

beforeEach(() => {
	mocks.invoke.mockResolvedValue('C:/models')
	mocks.isUsable.mockResolvedValue(true)
})

afterEach(() => {
	cleanup()
	for (const value of Object.values(mocks)) {
		if (typeof value === 'function' && 'mockClear' in value) value.mockClear()
	}
})

function renderGroup() {
	return render(
		<TooltipProvider>
			<SpeakerSeparationModelGroup />
		</TooltipProvider>,
	)
}

describe('speaker separation model group', () => {
	it('names the bundled model and shows it installed', async () => {
		renderGroup()

		expect(await screen.findByText(m.catalogInstalled())).toBeTruthy()
		expect(screen.getByText(speakerModelName)).toBeTruthy()
		expect(mocks.invoke).toHaveBeenCalledWith('get_models_folder')
		expect(mocks.isUsable).toHaveBeenCalledWith(`C:/models/${config.diarizeModelFilename}`)
		expect(screen.queryByRole('button', { name: m.downloadModel() })).toBeNull()
	})

	it('offers the download when the model is missing and flips to installed', async () => {
		mocks.isUsable.mockResolvedValue(false)
		mocks.downloadModel.mockResolvedValue(`C:/models/${config.diarizeModelFilename}`)
		const user = userEvent.setup()
		renderGroup()

		await user.click(await screen.findByRole('button', { name: m.downloadModel() }))

		expect(mocks.downloadModel).toHaveBeenCalledWith(
			{ url: config.diarizeModelUrl, ...config.diarizeModelIntegrity },
			{ displayName: config.diarizeModelFilename },
		)
		expect(await screen.findByText(m.catalogInstalled())).toBeTruthy()
	})

	it('stays on the download button when the download fails', async () => {
		mocks.isUsable.mockResolvedValue(false)
		mocks.downloadModel.mockRejectedValue(new Error('offline'))
		const user = userEvent.setup()
		renderGroup()

		await user.click(await screen.findByRole('button', { name: m.downloadModel() }))

		expect(await screen.findByRole('button', { name: m.downloadModel() })).toBeTruthy()
		expect(screen.queryByText(m.catalogInstalled())).toBeNull()
	})
})
