// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { ToastProvider } from '~/providers/toast'
import { m } from '~/paraglide/messages.js'
import * as config from '~/lib/config'
import type { InstalledModel } from '~/lib/model'
import { MAX_DIFF_TOKENS } from '~/lib/text-diff'
import type { SettingsViewModel } from './shared'
import { ModelsComparisonSection } from './models-comparison'

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(),
	runComparison: vi.fn(),
	tauriComparisonIo: vi.fn(),
	startRecord: vi.fn(),
	stopRecord: vi.fn(),
	refreshDevices: vi.fn(),
	getMediaDurationSeconds: vi.fn(),
	isModelFileUsable: vi.fn(),
	openPath: vi.fn(),
	listeners: new Map<string, (event: { payload: unknown }) => void>(),
}))

vi.mock('~/lib/model-comparison', () => ({
	runComparison: mocks.runComparison,
	tauriComparisonIo: mocks.tauriComparisonIo,
}))
vi.mock('~/lib/model', () => ({
	getModelDisplayName: (name: string) => name,
	isModelFileUsable: mocks.isModelFileUsable,
}))
vi.mock('@tauri-apps/api/path', () => ({
	join: async (...parts: string[]) => parts.join('/'),
}))
vi.mock('~/pages/home/hooks/use-recording', () => ({
	useRecording: () => ({
		isRecording: false,
		startRecord: mocks.startRecord,
		stopRecord: mocks.stopRecord,
		refreshDevices: mocks.refreshDevices,
	}),
}))
vi.mock('@tauri-apps/api/event', () => ({
	listen: vi.fn(async (name: string, callback: (event: { payload: unknown }) => void) => {
		mocks.listeners.set(name, callback)
		return () => mocks.listeners.delete(name)
	}),
}))
vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('~/lib/media', () => ({ getMediaDurationSeconds: mocks.getMediaDurationSeconds }))
vi.mock('~/lib/fs', () => ({
	pathToNamedPath: async (path: string) => ({ name: path.split('/').pop() ?? path, path }),
}))
vi.mock('~/lib/app', () => ({ openPath: mocks.openPath }))

// jsdom has no pointer-capture API; Radix's tooltip trigger calls it.
beforeAll(() => {
	Element.prototype.hasPointerCapture ??= () => false
	Element.prototype.releasePointerCapture ??= () => {}
	Element.prototype.setPointerCapture ??= () => {}
	Element.prototype.scrollIntoView ??= () => {}
})

beforeEach(() => {
	mocks.invoke.mockResolvedValue(null)
	mocks.runComparison.mockResolvedValue([])
	mocks.tauriComparisonIo.mockReturnValue({})
	mocks.getMediaDurationSeconds.mockResolvedValue(12)
	mocks.isModelFileUsable.mockResolvedValue(false)
})

afterEach(() => {
	cleanup()
	for (const value of Object.values(mocks)) {
		if (value instanceof Map) continue
		if (typeof value === 'function' && 'mockClear' in value) value.mockClear()
	}
	mocks.listeners.clear()
})

function model(name: string, overrides: Partial<InstalledModel> = {}): InstalledModel {
	return { name, path: `/models/${name}`, valid: true, reason: null, ...overrides }
}

function makeVm(models: InstalledModel[]) {
	return {
		models,
		preference: {
			modelDisplayNames: {},
			modelOptions: { lang: 'en' },
			gpuDevice: null,
			noGpu: false,
			unloadTimeoutMinutes: 5,
			projectsPath: null,
		},
	} as unknown as SettingsViewModel
}

function renderSection(models: InstalledModel[]) {
	return render(
		<TooltipProvider>
			<ToastProvider>
				<ModelsComparisonSection vm={makeVm(models)} />
			</ToastProvider>
		</TooltipProvider>,
	)
}

async function chooseFile(user: ReturnType<typeof userEvent.setup>) {
	mocks.invoke.mockResolvedValue(['/x/clip.wav'])
	await user.click(screen.getByRole('button', { name: m.compareChooseFile() }))
	await screen.findByText('clip.wav')
}

describe('models comparison section', () => {
	it('gates the run on an input and two selected models', async () => {
		const user = userEvent.setup()
		renderSection([model('alpha.gguf'), model('beta.gguf')])
		await chooseFile(user)

		const runButton = screen.getByRole('button', { name: m.compareRun() }) as HTMLButtonElement
		expect(runButton.disabled).toBe(true)
		expect(screen.getByText(m.compareNeedTwo())).toBeTruthy()

		await user.click(screen.getByRole('button', { name: 'alpha.gguf' }))
		expect(runButton.disabled).toBe(true)

		await user.click(screen.getByRole('button', { name: 'beta.gguf' }))
		expect(runButton.disabled).toBe(false)
		expect(screen.queryByText(m.compareNeedTwo())).toBeNull()
	})

	it('shows the file name and duration for a picked input', async () => {
		const user = userEvent.setup()
		renderSection([model('alpha.gguf')])
		await chooseFile(user)

		expect(screen.getByText('clip.wav')).toBeTruthy()
		expect(screen.getByText(/· 12s/)).toBeTruthy()
		expect(mocks.invoke).toHaveBeenCalledWith('pick_media_paths', expect.anything())
	})

	it('records a clip and adopts record_finish only while awaiting the stop', async () => {
		const user = userEvent.setup()
		renderSection([model('alpha.gguf')])

		// A recording finished elsewhere must not replace the lab's input.
		await act(async () => {
			await mocks.listeners.get('record_finish')?.({ payload: { path: '/x/stray.wav', name: 'stray.wav' } })
		})
		expect(screen.queryByText('stray.wav')).toBeNull()

		await user.click(screen.getByRole('button', { name: m.compareRecord() }))
		expect(mocks.startRecord).toHaveBeenCalled()
		await user.click(screen.getByRole('button', { name: m.compareStopRecording() }))
		expect(mocks.stopRecord).toHaveBeenCalled()

		await act(async () => {
			await mocks.listeners.get('record_finish')?.({ payload: { path: '/x/take.wav', name: 'take.wav' } })
		})
		expect(screen.getByText('take.wav')).toBeTruthy()
	})

	it('runs the chosen models and renders done and error rows', async () => {
		mocks.runComparison.mockResolvedValue([
			{ model: { name: 'Alpha', path: '/models/alpha.gguf' }, status: 'done', seconds: 3, outputPath: '/out/Alpha.md' },
			{ model: { name: 'Beta', path: '/models/beta.gguf' }, status: 'error', error: 'boom' },
		])
		const user = userEvent.setup()
		renderSection([model('alpha.gguf'), model('beta.gguf')])
		await chooseFile(user)
		await user.click(screen.getByRole('button', { name: 'alpha.gguf' }))
		await user.click(screen.getByRole('button', { name: 'beta.gguf' }))

		await user.click(screen.getByRole('button', { name: m.compareRun() }))

		expect(mocks.runComparison).toHaveBeenCalledWith(
			{ name: 'clip.wav', path: '/x/clip.wav', duration: 12 },
			[
				{ name: 'alpha.gguf', path: '/models/alpha.gguf' },
				{ name: 'beta.gguf', path: '/models/beta.gguf' },
			],
			'en',
			{},
			expect.any(Function),
		)
		expect(mocks.tauriComparisonIo).toHaveBeenCalledWith({ gpuDevice: null, noGpu: false, unloadTimeoutMinutes: 5 }, null, null)

		expect(await screen.findByText('3s')).toBeTruthy()
		expect(screen.getByText('Error: boom')).toBeTruthy()

		await user.click(screen.getByRole('button', { name: m.showInFolder() }))
		expect(mocks.openPath).toHaveBeenCalledWith({ name: 'Alpha', path: '/out/Alpha.md' })
	})

	it('offers speaker separation only when the separate model is installed, and applies it to every run', async () => {
		// A metadata read here means the switch row exists; the file check decides.
		mocks.isModelFileUsable.mockResolvedValue(true)
		mocks.invoke.mockImplementation(async (command: string) => {
			if (command === 'get_models_folder') return 'C:/models'
			if (command === 'pick_media_paths') return ['/x/clip.wav']
			return null
		})
		const user = userEvent.setup()
		renderSection([model('alpha.gguf'), model('beta.gguf')])

		// Separation is on by default once the model is usable, so the first run
		// already shows speakers instead of a wall of text.
		const toggle = await screen.findByRole('switch')
		expect(toggle.getAttribute('aria-checked')).toBe('true')
		expect(screen.getByText(m.diarization())).toBeTruthy()

		await user.click(screen.getByRole('button', { name: m.compareChooseFile() }))
		await screen.findByText('clip.wav')
		await user.click(screen.getByRole('button', { name: 'alpha.gguf' }))
		await user.click(screen.getByRole('button', { name: 'beta.gguf' }))
		await user.click(screen.getByRole('button', { name: m.compareRun() }))
		expect(mocks.tauriComparisonIo).toHaveBeenCalledWith(expect.anything(), null, `C:/models/${config.diarizeModelFilename}`)

		// Off is a real choice: the next run asks for plain transcripts and drops the
		// stale side-by-side results of the run that used separation.
		await user.click(toggle)
		await user.click(screen.getByRole('button', { name: m.compareRun() }))
		expect(mocks.tauriComparisonIo).toHaveBeenLastCalledWith(expect.anything(), null, null)
	})

	it('opens the full results view with a baseline and diff switch after a run', async () => {
		mocks.runComparison.mockResolvedValue([
			{
				model: { name: 'Alpha', path: '/models/alpha.gguf' },
				status: 'done',
				seconds: 3,
				outputPath: '/out/Alpha.md',
				segments: [{ start: 0, stop: 1, text: 'hello world' }],
			},
			{
				model: { name: 'Beta', path: '/models/beta.gguf' },
				status: 'done',
				seconds: 5,
				outputPath: '/out/Beta.md',
				segments: [{ start: 0, stop: 1, text: 'hello there' }],
			},
		])
		const user = userEvent.setup()
		renderSection([model('alpha.gguf'), model('beta.gguf')])
		await chooseFile(user)
		await user.click(screen.getByRole('button', { name: 'alpha.gguf' }))
		await user.click(screen.getByRole('button', { name: 'beta.gguf' }))
		await user.click(screen.getByRole('button', { name: m.compareRun() }))

		await user.click(await screen.findByRole('button', { name: m.compareResults() }))

		expect(await screen.findByText(m.compareBaseline())).toBeTruthy()
		expect(screen.getByText(m.compareHighlight())).toBeTruthy()
		expect(screen.getAllByText(/2 words/)).toHaveLength(2)
	})

	it('says highlighting is unavailable instead of showing +0 −0 for an overlong transcript', async () => {
		const longText = Array.from({ length: MAX_DIFF_TOKENS + 1 }, (_, index) => `w${index}`).join(' ')
		mocks.runComparison.mockResolvedValue([
			{
				model: { name: 'Alpha', path: '/models/alpha.gguf' },
				status: 'done',
				seconds: 3,
				outputPath: '/out/Alpha.md',
				segments: [{ start: 0, stop: 1, text: 'hello world' }],
			},
			{
				model: { name: 'Beta', path: '/models/beta.gguf' },
				status: 'done',
				seconds: 5,
				outputPath: '/out/Beta.md',
				segments: [{ start: 0, stop: 1, text: longText }],
			},
		])
		const user = userEvent.setup()
		renderSection([model('alpha.gguf'), model('beta.gguf')])
		await chooseFile(user)
		await user.click(screen.getByRole('button', { name: 'alpha.gguf' }))
		await user.click(screen.getByRole('button', { name: 'beta.gguf' }))
		await user.click(screen.getByRole('button', { name: m.compareRun() }))
		await user.click(await screen.findByRole('button', { name: m.compareResults() }))

		expect(await screen.findByText(m.compareTooLongNote())).toBeTruthy()
		expect(screen.queryByText('+0')).toBeNull()
	})

	it('states how many models finished and how many failed before the results button', async () => {
		mocks.runComparison.mockResolvedValue([
			{
				model: { name: 'Alpha', path: '/models/alpha.gguf' },
				status: 'done',
				seconds: 3,
				outputPath: '/out/Alpha.md',
				segments: [{ start: 0, stop: 1, text: 'hello world' }],
			},
			{
				model: { name: 'Beta', path: '/models/beta.gguf' },
				status: 'done',
				seconds: 5,
				outputPath: '/out/Beta.md',
				segments: [{ start: 0, stop: 1, text: 'hello there' }],
			},
			{ model: { name: 'Gamma', path: '/models/gamma.gguf' }, status: 'error', error: 'boom' },
		])
		const user = userEvent.setup()
		renderSection([model('alpha.gguf'), model('beta.gguf'), model('gamma.gguf')])
		await chooseFile(user)
		for (const name of ['alpha.gguf', 'beta.gguf', 'gamma.gguf']) {
			await user.click(screen.getByRole('button', { name }))
		}
		await user.click(screen.getByRole('button', { name: m.compareRun() }))

		expect(await screen.findByText(`${m.compareRunsDone({ count: 2 })} · ${m.compareRunsFailed({ count: 1 })}`)).toBeTruthy()
		expect(screen.getByRole('button', { name: m.compareResults() })).toBeTruthy()
	})

	it('opens the results when every run failed, without a baseline', async () => {
		mocks.runComparison.mockResolvedValue([
			{ model: { name: 'Alpha', path: '/models/alpha.gguf' }, status: 'error', error: 'boom' },
			{ model: { name: 'Beta', path: '/models/beta.gguf' }, status: 'error', error: 'bang' },
		])
		const user = userEvent.setup()
		renderSection([model('alpha.gguf'), model('beta.gguf')])
		await chooseFile(user)
		await user.click(screen.getByRole('button', { name: 'alpha.gguf' }))
		await user.click(screen.getByRole('button', { name: 'beta.gguf' }))
		await user.click(screen.getByRole('button', { name: m.compareRun() }))

		await user.click(await screen.findByRole('button', { name: m.compareResults() }))

		expect(await screen.findByText(m.compareAllFailed())).toBeTruthy()
		expect(screen.queryByText(m.compareBaseline())).toBeNull()
	})

	it('does not offer corrupt model files', () => {
		renderSection([model('good.gguf'), model('bad.gguf', { valid: false, reason: 'truncated' })])

		expect(screen.getByRole('button', { name: 'good.gguf' })).toBeTruthy()
		expect(screen.queryByRole('button', { name: 'bad.gguf' })).toBeNull()
	})
})
