// The comparison lab's engine: run one input through several models, one model
// at a time, and leave a markdown transcript per model in one folder. The UI
// owns nothing but the calls; everything sequenced, timed and written lives
// here so tests can drive it against a fake world.
import { invoke } from '@tauri-apps/api/core'
import * as pathApi from '@tauri-apps/api/path'
import * as fs from '@tauri-apps/plugin-fs'
import { m } from '~/paraglide/messages.js'
import { renderExport } from '~/lib/auto-export'
import * as config from '~/lib/config'
import { requiresVad, resolveModelLanguage, type ModelMetadata } from '~/lib/model'
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
	/** The transcript itself, kept in memory so results can be compared side by side; set on done. */
	segments?: Segment[]
	/** Absolute path of the written markdown file; set on done. */
	outputPath?: string
	/** Why the run failed; set on error. */
	error?: string
}

/** The world the runner needs; the section passes the Tauri implementation, tests a fake. */
export interface ComparisonIo {
	/** Load one model (or confirm it is resident); rejects on load failure. */
	loadModel(path: string): Promise<void>
	/** Transcribe the input file with the plain options for the loaded model; rejects on failure. */
	transcribe(modelPath: string, path: string, language: string): Promise<Segment[]>
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
	// One folder per comparison, created once: a failure here is a setup failure the caller
	// reports for the whole run, not a per-model one.
	await io.mkdir(folder)
	// Renaming does not require unique display names, so two chosen models can share a stem.
	const usedFiles = new Set<string>()

	for (const [index, run] of runs.entries()) {
		run.status = 'running'
		emit(index)
		const startedAt = performance.now()
		try {
			await io.loadModel(run.model.path)
			const segments = await io.transcribe(run.model.path, input.path, language)
			// Stop the clock when the transcript returns: rendering and writing are not model
			// processing time, and timing covers load-if-needed plus transcription only.
			const seconds = Math.round((performance.now() - startedAt) / 1000)
			const markdown = await io.renderMarkdown(run.model.name, segments)
			const stem = projectExportFilename(run.model.name, 'md').replace(/\.md$/i, '')
			let filename = `${stem}.md`
			for (let suffix = 2; usedFiles.has(filename.toLowerCase()); suffix++) filename = `${stem} (${suffix}).md`
			usedFiles.add(filename.toLowerCase())
			const outputPath = await io.join(folder, filename)
			await io.writeText(outputPath, markdown)
			run.status = 'done'
			run.seconds = seconds
			run.segments = segments
			run.outputPath = outputPath
		} catch (error) {
			run.status = 'error'
			run.error = typeof error === 'object' && error !== null && 'message' in error ? String((error as { message: string }).message) : String(error)
		}
		emit(index)
	}
	return runs
}

/**
 * The model's metadata, or null when it cannot be read. A read failure falls through to the
 * transcribe call's own error rather than failing the run here.
 */
async function comparisonModelMetadata(modelPath: string): Promise<ModelMetadata | null> {
	try {
		return await invoke<ModelMetadata>('get_model_metadata', { modelPath })
	} catch {
		return null
	}
}

/**
 * The bundled VAD model for an engine that cannot plan its speech ranges without one. It is
 * not a comparison option: every model that requires it gets the same file, so outputs still
 * differ only by the model. An engine that does not advertise the requirement gets no
 * `vad_model`.
 */
async function bundledVadModel(): Promise<string | null> {
	try {
		const modelsFolder = await invoke<string>('get_models_folder')
		return `${modelsFolder}/${config.vadModelFilename}`
	} catch {
		return null
	}
}

/** What the load call needs from the user's hardware preferences. */
export interface ComparisonLoadOptions {
	gpuDevice: number | null
	noGpu: boolean
	unloadTimeoutMinutes: number
	/** The audio-processing settings, applied before upload as everywhere else. */
	ffmpegOptions?: { normalize_loudness: boolean; custom_command: string | null }
}

/** The Tauri-backed world: the same `load_model` / `transcribe` commands the transcription queue uses. */
export function tauriComparisonIo(load: ComparisonLoadOptions, projectsPath?: string | null, diarizeModelPath?: string | null): ComparisonIo {
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
		// Plain options by design: the language preference alone, plus the bundled
		// VAD model for engines that cannot plan speech ranges without one, and the
		// diarization model when the comparison asks for speaker separation. No
		// stable timestamps, no decoding knobs — differences between the outputs are
		// model differences. Every run of one comparison gets the same set.
		transcribe: async (modelPath, path, language) => {
			const metadata = await comparisonModelMetadata(modelPath)
			// Each model can run only its own languages, and the server rejects the rest: comparing
			// a single-language model under the global language would fail it for no good reason.
			const lang = resolveModelLanguage(metadata?.capabilities, language)
			const vadModel = requiresVad(metadata?.capabilities) ? await bundledVadModel() : null
			const ffmpeg = load.ffmpegOptions
			const wantsProcessing = ffmpeg ? ffmpeg.normalize_loudness || (ffmpeg.custom_command ?? '').trim().length > 0 : false
			const result = await invoke<{ segments: Segment[] }>('transcribe', {
				options: {
					path,
					lang,
					...(wantsProcessing && ffmpeg ? { ffmpeg_options: ffmpeg } : {}),
					...(vadModel ? { vad_model: vadModel } : {}),
					...(diarizeModelPath ? { diarize_model: diarizeModelPath } : {}),
				},
			})
			return result.segments
		},
		renderMarkdown: (name, segments) =>
			renderExport('md', { name, path: '', segments }, {
				direction: 'ltr',
				theme: 'light',
				showTimestamps: true,
				// The saved transcript must show the same speaker labels as the results window.
				showSpeakers: diarizeModelPath != null,
				speakerLabel: m.speakerPrefix(),
				labels: { transcript: '', summary: '' },
			}).then((rendered) => String(rendered)),
		comparisonsFolder: async () => pathApi.join(await transcriptsFolder(projectsPath), 'comparisons'),
		join: (...parts) => pathApi.join(...parts),
		mkdir: (path) => fs.mkdir(path, { recursive: true }),
		writeText: (path, text) => fs.writeTextFile(path, text),
	}
}
