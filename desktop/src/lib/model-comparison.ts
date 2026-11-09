// The comparison lab's engine: run one input through several models, one model
// at a time, and leave a markdown transcript per model in one folder. The UI
// owns nothing but the calls; everything sequenced, timed and written lives
// here so tests can drive it against a fake world.
import { invoke } from '@tauri-apps/api/core'
import * as pathApi from '@tauri-apps/api/path'
import * as fs from '@tauri-apps/plugin-fs'
import { renderExport } from '~/lib/auto-export'
import { projectExportFilename } from '~/lib/project-name'
import { transcriptsFolder } from '~/lib/transcripts-store'
import type { Segment } from '~/lib/transcript'

/** One model chosen for a comparison run. */
export interface ComparisonModel {
	/** Display name — also becomes the markdown file's stem. */
	name: string
	/** Absolute path of the model file on disk. */
	path: string
}

export type ComparisonStatus = 'queued' | 'running' | 'done' | 'error'

export interface ComparisonRun {
	model: ComparisonModel
	status: ComparisonStatus
	/** Wall-clock seconds of the whole run — load-if-needed plus transcription; set on done. */
	seconds?: number
	/** Absolute path of the written markdown file; set on done. */
	outputPath?: string
	/** Why the run failed; set on error. */
	error?: string
}

/** The world the runner needs; the section passes the Tauri implementation, tests a fake. */
export interface ComparisonIo {
	/** Load one model (or confirm it is resident); rejects on load failure. */
	loadModel(path: string): Promise<void>
	/** Transcribe the input file with the plain options; rejects on failure. */
	transcribe(path: string, language: string): Promise<Segment[]>
	/** The markdown rendering of one transcript. */
	renderMarkdown(name: string, segments: Segment[]): Promise<string>
	/** The comparisons root: `<projects>/comparisons`. */
	comparisonsFolder(): Promise<string>
	join(...parts: string[]): Promise<string>
	mkdir(path: string): Promise<void>
	writeText(path: string, text: string): Promise<void>
}

/** Fired on every status transition of every run, with that run's index, in run order. */
export type ComparisonEvent = (run: ComparisonRun, index: number) => void

/** Local-time folder stamp — sortable, no characters Windows forbids. */
export function comparisonStamp(date = new Date()): string {
	const pad = (value: number) => String(value).padStart(2, '0')
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`
}

/** The folder name of one comparison: `<stamp>-<input stem>`. */
export function comparisonFolderName(inputName: string, date = new Date()): string {
	return `${comparisonStamp(date)}-${projectExportFilename(inputName, 'md').replace(/\.md$/, '')}`
}

/**
 * Run every model over the same input, one after another, writing one
 * `<model-name>.md` per completed run into a single per-comparison folder.
 *
 * A model that fails — load or transcription — does not stop the others: its
 * run ends `error` with the reason, and the loop continues. Timing is
 * wall-clock from the desktop, covering load-if-needed plus transcription,
 * which is what a user switching models experiences.
 */
export async function runComparison(
	input: { path: string; name: string },
	models: ComparisonModel[],
	language: string,
	io: ComparisonIo,
	onEvent?: ComparisonEvent,
): Promise<ComparisonRun[]> {
	const runs: ComparisonRun[] = models.map((model) => ({ model, status: 'queued' }))
	// Copy the model too: a shallow spread would expose the runner's own model object, and a
	// listener that renamed it would change the file stem this run writes.
	const emit = (index: number) => {
		const run = runs[index]!
		onEvent?.({ ...run, model: { ...run.model } }, index)
	}
	const folder = await io.join(await io.comparisonsFolder(), comparisonFolderName(input.name))

	for (const [index, run] of runs.entries()) {
		run.status = 'running'
		emit(index)
		const startedAt = performance.now()
		try {
			await io.loadModel(run.model.path)
			const segments = await io.transcribe(input.path, language)
			// Stop the clock when the transcript returns: rendering and writing are not model
			// processing time, and timing covers load-if-needed plus transcription only.
			const seconds = Math.round((performance.now() - startedAt) / 1000)
			const markdown = await io.renderMarkdown(run.model.name, segments)
			const outputPath = await io.join(folder, projectExportFilename(run.model.name, 'md'))
			await io.mkdir(folder)
			await io.writeText(outputPath, markdown)
			run.status = 'done'
			run.seconds = seconds
			run.outputPath = outputPath
		} catch (error) {
			run.status = 'error'
			run.error = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: string }).message) : String(error)
		}
		emit(index)
	}
	return runs
}

/** What the load call needs from the user's hardware preferences. */
export interface ComparisonLoadOptions {
	gpuDevice: number | null
	noGpu: boolean
	unloadTimeoutMinutes: number
}

/** The Tauri-backed world: the same `load_model` / `transcribe` commands the transcription queue uses. */
export function tauriComparisonIo(load: ComparisonLoadOptions, projectsPath?: string | null): ComparisonIo {
	return {
		loadModel: async (path) => {
			// `gpu_fallback` is a warning toast in the main flow, not a failure: the run proceeded on the CPU.
			await invoke<string>('load_model', {
				modelPath: path,
				gpuDevice: load.gpuDevice,
				noGpu: load.noGpu,
				unloadTimeoutMinutes: load.unloadTimeoutMinutes,
			})
		},
		// Plain options by design: the language preference and nothing else. No
		// diarization, no stable timestamps, no decoding knobs — differences
		// between the outputs are model differences, and the diarization helper
		// never spawns inside a measurement.
		transcribe: async (path, language) => {
			const result = await invoke<{ segments: Segment[] }>('transcribe', { options: { path, lang: language } })
			return result.segments
		},
		renderMarkdown: (name, segments) =>
			renderExport('md', { name, path: '', segments }, {
				direction: 'ltr',
				theme: 'light',
				showTimestamps: true,
				showSpeakers: false,
				speakerLabel: '',
				labels: { transcript: '', summary: '' },
			}).then((rendered) => String(rendered)),
		comparisonsFolder: async () => pathApi.join(await transcriptsFolder(projectsPath), 'comparisons'),
		join: (...parts) => pathApi.join(...parts),
		mkdir: (path) => fs.mkdir(path, { recursive: true }),
		writeText: (path, text) => fs.writeTextFile(path, text),
	}
}
