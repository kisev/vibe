// The merged model catalog: the vendored handy layer plus the vibe layer.
//
// Identity is provider-qualified: repository + revision + filename. Two
// providers publishing "the same" model are two entries; a file that already
// exists in the handy layer is dropped from the vibe layer (handy wins), so a
// re-mirror never duplicates.
import handyFile from '~/data/handy-catalog.json'
import vibeFile from '~/data/catalog-vibe.json'

export interface CatalogFileEntry {
	filename: string
	size: number
	sha256: string
}

export interface CatalogCapabilities {
	streaming: boolean
	translate: boolean
	languageDetection: boolean
	timestamps: boolean
}

export interface CatalogModel {
	id: string
	name: string
	description: string
	repository: string
	revision: string
	license: string
	family: string
	parameters: string
	languages: string[]
	capabilities: CatalogCapabilities
	quant: string
	role: 'asr' | 'vad' | 'diarize' | 'langid'
	curated: boolean
	minEngine: string
	files: Record<string, CatalogFileEntry>
}

/** One model's benchmark row: word error rate per language, speed as realtime factor (higher is faster). */
export interface CatalogBenchmark {
	accuracy: Record<string, { error: number; ciLower?: number }>
	performance: { accelerated: number; cpu: number }
}

export interface CatalogData {
	schema: number
	models: CatalogModel[]
	results: Record<string, CatalogBenchmark>
}

/** The transcribe.cpp build the bundled engine runs; catalog entries gate on it via `minEngine`. */
export const ENGINE_VERSION = '0.4.1'

/** Download URL for one file of an entry. */
export function fileUrl(model: CatalogModel, file: CatalogFileEntry): string {
	return `https://huggingface.co/${model.repository}/resolve/${model.revision}/${file.filename}`
}

/** Provider display name from the repository owner. */
export function providerName(repository: string): string {
	const owner = repository.split('/')[0] ?? repository
	const names: Record<string, string> = {
		'handy-computer': 'Handy',
		'vibe-app': 'Vibe',
		ggerganov: 'whisper.cpp',
		'ivrit-ai': 'Ivrit AI',
		'ggml-org': 'ggml',
	}
	return names[owner] ?? owner
}

/** The provider-qualified identity of one downloadable file. */
export function identityKey(model: CatalogModel, quant: string): string {
	const file = model.files[quant]
	return file ? `${model.repository}@${model.revision}/${file.filename}` : `${model.repository}@${model.revision}/${model.id}`
}

/**
 * Concatenate both layers, deduplicating by file identity: when every file of
 * a vibe entry already exists in the handy layer the entry is dropped, and a
 * partially overlapping entry keeps only its novel files. VAD and diarization
 * entries ride along in the data (the planner needs them) but the settings
 * catalog filters them out.
 */
export function mergeCatalogs(handy: CatalogData, vibe: { schema: number; models: CatalogModel[] }): CatalogData {
	const seenFiles = new Set<string>()
	for (const model of handy.models) {
		for (const quant of Object.keys(model.files)) seenFiles.add(identityKey(model, quant))
	}
	const models = [...handy.models]
	for (const model of vibe.models) {
		const novel: Record<string, CatalogFileEntry> = {}
		for (const [quant, file] of Object.entries(model.files)) {
			if (!seenFiles.has(`${model.repository}@${model.revision}/${file.filename}`)) novel[quant] = file
		}
		if (Object.keys(novel).length === 0) continue
		if (Object.keys(novel).length !== Object.keys(model.files).length) continue // partial overlap: data bug, skip loudly
		seenFiles.add(identityKey(model, model.quant))
		models.push(model)
	}
	return { schema: handy.schema, models, results: handy.results ?? {} }
}

export const CATALOG: CatalogData = mergeCatalogs(handyFile as unknown as CatalogData, vibeFile as unknown as { schema: number; models: CatalogModel[] })

/** ASR entries for the settings catalog. */
export function asrCatalog(catalog: CatalogData = CATALOG): CatalogModel[] {
	return catalog.models.filter((model) => model.role === 'asr')
}

/** Best (lowest) error across the languages a benchmark reports — the headline accuracy. */
function headlineAccuracy(benchmark: CatalogBenchmark): number | undefined {
	const errors = Object.values(benchmark.accuracy).map((row) => row.error)
	return errors.length ? Math.min(...errors) : undefined
}

/** The best headline accuracy and CPU speed in the catalog; bars are relative to these. */
export function catalogBests(catalog: CatalogData = CATALOG): { accuracy: number; speed: number } {
	let accuracy = Infinity
	let speed = 0
	for (const model of asrCatalog(catalog)) {
		const benchmark = catalog.results[model.id]
		if (!benchmark) continue
		const error = headlineAccuracy(benchmark)
		if (error !== undefined) accuracy = Math.min(accuracy, error)
		speed = Math.max(speed, benchmark.performance.cpu)
	}
	return { accuracy: accuracy === Infinity ? 1 : accuracy, speed: speed || 1 }
}

/** Relative scores in 0..1 against the catalog bests; absent when unbenchmarked. */
export function entryScores(model: CatalogModel, catalog: CatalogData = CATALOG): { accuracy?: number; speed?: number } {
	const benchmark = catalog.results[model.id]
	if (!benchmark) return {}
	const bests = catalogBests(catalog)
	const error = headlineAccuracy(benchmark)
	return {
		...(error !== undefined && { accuracy: Math.min(1, bests.accuracy / error) }),
		...(benchmark.performance.cpu > 0 && { speed: Math.min(1, benchmark.performance.cpu / bests.speed) }),
	}
}

/** Preferred quantization order; the first one the entry ships in wins. */
const QUANT_PREFERENCE = ['Q8_0', 'Q6_K', 'Q5_K_M', 'Q4_K_M', 'F16', 'F32']

export function defaultQuant(model: CatalogModel): string {
	return QUANT_PREFERENCE.find((quant) => model.files[quant]) ?? Object.keys(model.files)[0] ?? model.quant
}

/** File size in whole megabytes (1 MB = 10^6 B, matching how providers label files). */
export function sizeMb(bytes: number): number {
	return Math.round(bytes / 1_000_000)
}

/** `0.2.4`-style dot versions, compared numerically part by part. */
export function engineAtLeast(required: string, engine: string = ENGINE_VERSION): boolean {
	const a = required.split('.').map(Number)
	const b = engine.split('.').map(Number)
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		if ((a[i] ?? 0) !== (b[i] ?? 0)) return (b[i] ?? 0) > (a[i] ?? 0)
	}
	return true
}

export type Availability = { ok: true } | { ok: false; reason: 'engine' | 'format'; requirement: string }

/**
 * Whether the bundled engine can load this file. `minEngine` is the transcribe.cpp
 * version the family needs; `.bin` is the pre-GGUF whisper container the unified
 * engine refuses for ASR (it still loads VAD/diarize `.bin`, but those roles are
 * not in the settings catalog).
 */
export function availability(model: CatalogModel, quant: string): Availability {
	if (!engineAtLeast(model.minEngine)) return { ok: false, reason: 'engine', requirement: model.minEngine }
	const file = model.files[quant]
	if (model.role === 'asr' && file && !file.filename.endsWith('.gguf'))
		return { ok: false, reason: 'format', requirement: 'GGUF' }
	return { ok: true }
}
