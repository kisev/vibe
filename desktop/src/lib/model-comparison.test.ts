// The pure half of the comparison lab: `runComparison` against a fake world. The
// Tauri-backed `tauriComparisonIo` is deliberately out of scope — everything that
// touches the OS lives there, while the runner only needs the injected contract.
import { invoke } from '@tauri-apps/api/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as config from '~/lib/config'
import {
	comparisonFolderName,
	comparisonStamp,
	runComparison,
	tauriComparisonIo,
	type ComparisonIo,
	type ComparisonModel,
	type ComparisonStatus,
} from './model-comparison'

// The module imports Tauri globals and the markdown renderer at load time; none of
// them is on the path under test, so keep the real modules out of the runner.
vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }))
vi.mock('@tauri-apps/api/path', () => ({ join: vi.fn() }))
vi.mock('@tauri-apps/plugin-fs', () => ({ mkdir: vi.fn(), writeTextFile: vi.fn() }))
vi.mock('~/lib/transcripts-store', () => ({ transcriptsFolder: vi.fn() }))
vi.mock('~/lib/auto-export', () => ({ renderExport: vi.fn() }))

const input = { path: '/rec/clip.wav', name: 'clip.wav' }
const models: ComparisonModel[] = [
	{ name: 'Alpha', path: '/models/alpha.gguf' },
	{ name: 'Beta', path: '/models/beta.gguf' },
	{ name: 'Gamma', path: '/models/gamma.gguf' },
]
const stamp = '2024-05-06_07-08-09'
const folder = `/projects/comparisons/${stamp}-clip`

/** A fake world with an explicit call log, a write record, and per-model failures. */
function fakeIo(failures: { load?: string; transcribe?: string; render?: string } = {}) {
	const calls: string[] = []
	const writes: { path: string; text: string }[] = []
	const io: ComparisonIo = {
		loadModel: async (path) => {
			calls.push(`load ${path}`)
			if (path === failures.load) throw new Error(`cannot load ${path}`)
		},
		transcribe: async (modelPath, path, language) => {
			calls.push(`transcribe ${path} ${language}`)
			// Tauri rejects with a bare string, so one test keeps that rejection shape.
			if (modelPath === failures.transcribe) return Promise.reject('no audio track')
			return [{ start: 0, stop: 1, text: 'spoken words' }]
		},
		renderMarkdown: async (name, segments) => {
			calls.push(`render ${name}`)
			if (name === failures.render) throw new Error('render exploded')
			return `# ${name}\n${segments.map((segment) => segment.text).join('\n')}`
		},
		comparisonsFolder: async () => '/projects/comparisons',
		join: async (...parts) => parts.join('/'),
		mkdir: async (path) => {
			calls.push(`mkdir ${path}`)
		},
		writeText: async (path, text) => {
			calls.push(`write ${path}`)
			writes.push({ path, text })
		},
	}
	return { io, calls, writes }
}

describe('runComparison', () => {
	beforeEach(() => {
		// Freeze only Date: the folder stamp is local time, while the real performance
		// clock keeps running (nothing here waits on timers).
		vi.useFakeTimers({ toFake: ['Date'] })
		vi.setSystemTime(new Date(2024, 4, 6, 7, 8, 9))
	})
	afterEach(() => vi.useRealTimers())

	it('writes the rendered transcript of every model into one shared folder', async () => {
		const { io, writes } = fakeIo()
		const runs = await runComparison(input, models.slice(0, 2), 'en', io)

		expect(runs.map((run) => run.status)).toEqual(['done', 'done'])
		expect(writes).toEqual([
			{ path: `${folder}/Alpha.md`, text: '# Alpha\nspoken words' },
			{ path: `${folder}/Beta.md`, text: '# Beta\nspoken words' },
		])
		expect(runs.map((run) => run.outputPath)).toEqual([`${folder}/Alpha.md`, `${folder}/Beta.md`])
		expect(runs.every((run) => typeof run.seconds === 'number' && Number.isFinite(run.seconds) && run.seconds >= 0)).toBe(true)
		expect(runs.map((run) => run.error)).toEqual([undefined, undefined])
	})

	it('runs one model at a time: no load starts before the previous run finished', async () => {
		const { io, calls } = fakeIo()
		await runComparison(input, models, 'en', io)

		expect(calls.filter((call) => /^(load|transcribe|render|write)/.test(call))).toEqual([
			'load /models/alpha.gguf',
			'transcribe /rec/clip.wav en',
			'render Alpha',
			`write ${folder}/Alpha.md`,
			'load /models/beta.gguf',
			'transcribe /rec/clip.wav en',
			'render Beta',
			`write ${folder}/Beta.md`,
			'load /models/gamma.gguf',
			'transcribe /rec/clip.wav en',
			'render Gamma',
			`write ${folder}/Gamma.md`,
		])
	})

	it('isolates a load failure: the failed model errors, the rest still run', async () => {
		const { io, writes } = fakeIo({ load: '/models/beta.gguf' })
		const runs = await runComparison(input, models, 'en', io)

		expect(runs.map((run) => run.status)).toEqual(['done', 'error', 'done'])
		expect(runs[1].error).toBe('cannot load /models/beta.gguf')
		expect(runs[1].outputPath).toBeUndefined()
		expect(runs[1].seconds).toBeUndefined()
		expect(writes.map((write) => write.path)).toEqual([`${folder}/Alpha.md`, `${folder}/Gamma.md`])
	})

	it('isolates a transcribe failure and keeps a string rejection verbatim', async () => {
		const { io, writes } = fakeIo({ transcribe: '/models/beta.gguf' })
		const runs = await runComparison(input, models, 'en', io)

		expect(runs.map((run) => run.status)).toEqual(['done', 'error', 'done'])
		expect(runs[1].error).toBe('no audio track')
		expect(writes.map((write) => write.path)).toEqual([`${folder}/Alpha.md`, `${folder}/Gamma.md`])
	})

	it('reports every transition in run order and hands out snapshots', async () => {
		const events: { name: string; status: ComparisonStatus; index: number }[] = []
		const { io, writes } = fakeIo()
		const runs = await runComparison(input, models.slice(0, 2), 'en', io, (run, index) => {
			events.push({ name: run.model.name, status: run.status, index })
			// A listener scribbling on its copy must not steer the runner: neither the
			// run's fields nor the model it is about to render and name a file after.
			run.status = 'error'
			run.seconds = -1
			run.model.name = 'Corrupted'
		})

		expect(events).toEqual([
			{ name: 'Alpha', status: 'running', index: 0 },
			{ name: 'Alpha', status: 'done', index: 0 },
			{ name: 'Beta', status: 'running', index: 1 },
			{ name: 'Beta', status: 'done', index: 1 },
		])
		expect(runs.map((run) => run.status)).toEqual(['done', 'done'])
		expect(writes.map((write) => write.path)).toEqual([`${folder}/Alpha.md`, `${folder}/Beta.md`])
	})

	it('turns a render failure into that run’s error instead of aborting', async () => {
		const { io, writes } = fakeIo({ render: 'Beta' })
		const runs = await runComparison(input, models.slice(0, 2), 'en', io)

		expect(runs.map((run) => run.status)).toEqual(['done', 'error'])
		expect(runs[1].error).toBe('render exploded')
		expect(writes.map((write) => write.path)).toEqual([`${folder}/Alpha.md`])
	})
})

describe('tauriComparisonIo transcribe options', () => {
	const io = () => tauriComparisonIo({ gpuDevice: null, noGpu: false, unloadTimeoutMinutes: 5 }, null)
	const invokeMock = invoke as unknown as ReturnType<typeof vi.fn>

	beforeEach(() => invokeMock.mockReset())

	it('supplies the bundled VAD model to an engine that requires one', async () => {
		invokeMock.mockImplementation(async (command: string) => {
			if (command === 'get_model_metadata') return { capabilities: { requires_vad: true } }
			if (command === 'get_models_folder') return 'C:/models'
			return { segments: [] }
		})

		await io().transcribe('/models/gigaam.gguf', '/rec/clip.wav', 'ru')

		expect(invokeMock).toHaveBeenCalledWith('transcribe', {
			options: { path: '/rec/clip.wav', lang: 'ru', vad_model: `C:/models/${config.vadModelFilename}` },
		})
	})

	it('leaves an engine without the requirement on the plain options', async () => {
		invokeMock.mockImplementation(async (command: string) => {
			if (command === 'get_model_metadata') return { capabilities: { requires_vad: false } }
			return { segments: [] }
		})

		await io().transcribe('/models/whisper.gguf', '/rec/clip.wav', 'ru')

		expect(invokeMock).toHaveBeenCalledWith('transcribe', { options: { path: '/rec/clip.wav', lang: 'ru' } })
	})

	it('still transcribes when the model metadata cannot be read', async () => {
		invokeMock.mockImplementation(async (command: string) => {
			if (command === 'get_model_metadata') throw new Error('unreadable header')
			return { segments: [] }
		})

		await io().transcribe('/models/odd.gguf', '/rec/clip.wav', 'ru')

		expect(invokeMock).toHaveBeenCalledWith('transcribe', { options: { path: '/rec/clip.wav', lang: 'ru' } })
	})
})

describe('folder naming', () => {
	const date = new Date(2024, 4, 6, 7, 8, 9)

	it('stamps local time as YYYY-MM-DD_HH-MM-SS', () => {
		expect(comparisonStamp(date)).toBe(stamp)
	})

	it('sanitizes a Windows-hostile input name and trims the media extension', () => {
		const name = comparisonFolderName('my/recording?: 2024.wav', date)

		expect(name).toBe(`${stamp}-my-recording-- 2024`)
		expect(name).not.toMatch(/[/\\?%*:|"<>]/)
	})
})
