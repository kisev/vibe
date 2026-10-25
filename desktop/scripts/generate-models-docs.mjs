// Generate ../i18n/docs/en-US/models.md from the vendored model catalogs.
//
//   node scripts/generate-models-docs.mjs        render the models page
//   node scripts/generate-models-docs.mjs check  fail unless the page is current
//
// The page's prose (title, intro, "Long recordings", the GigaAM details block,
// the closing sections) is carried over from the existing file; only the
// "Available Models" listing is rendered from src/data. The merge and display
// helpers below mirror src/lib/catalog.ts — that file is the source of truth,
// keep the two in step. src/lib/docs-parity.test.ts pins the rendered page to
// asrCatalog() so a stale render cannot slip through.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const docsPath = join(root, '..', 'i18n', 'docs', 'en-US', 'models.md')

// --- catalog helpers, mirrored from src/lib/catalog.ts (the source of truth) ---

const ENGINE_VERSION = '0.4.1'
/** Preferred quantization order for the per-entry download links. */
const QUANT_PREFERENCE = ['Q8_0', 'Q6_K', 'Q5_K_M', 'Q4_K_M', 'F16', 'F32']
const PROVIDER_NAMES = {
	'handy-computer': 'Handy',
	'vibe-app': 'Vibe',
	ggerganov: 'whisper.cpp',
	'ivrit-ai': 'Ivrit AI',
	'ggml-org': 'ggml',
}

/** The provider-qualified identity of one downloadable file. */
function identityKey(model, quant) {
	const file = model.files[quant]
	return file ? `${model.repository}@${model.revision}/${file.filename}` : `${model.repository}@${model.revision}/${model.id}`
}

/** Concatenate both layers, deduplicating by file identity; handy wins. */
function mergeCatalogs(handy, vibe) {
	const seenFiles = new Set()
	for (const model of handy.models) for (const quant of Object.keys(model.files)) seenFiles.add(identityKey(model, quant))
	const models = [...handy.models]
	for (const model of vibe.models) {
		const novel = {}
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

/** Provider display name from the repository owner. */
function providerName(repository) {
	const owner = repository.split('/')[0] ?? repository
	return PROVIDER_NAMES[owner] ?? owner
}

/** File size in whole megabytes (1 MB = 10^6 B, matching how providers label files). */
function sizeMb(bytes) {
	return Math.round(bytes / 1_000_000)
}

/** `0.2.4`-style dot versions, compared numerically part by part. */
function engineAtLeast(required, engine = ENGINE_VERSION) {
	const a = required.split('.').map(Number)
	const b = engine.split('.').map(Number)
	for (let i = 0; i < Math.max(a.length, b.length); i++) {
		if ((a[i] ?? 0) !== (b[i] ?? 0)) return (b[i] ?? 0) > (a[i] ?? 0)
	}
	return true
}

// --- rendering ---

const FAMILY_EMOJI = {
	parakeet: '🦜',
	whisper: '🌟',
	canary: '🐤',
	canary_qwen: '🐤',
	gigaam: '🇷🇺',
	qwen3_asr: '🐉',
	cohere_asr: '🧭',
	voxtral: '🎙️',
	voxtral_realtime: '🎙️',
	funasr_nano: '🎏',
	granite_speech: '🪨',
	granite5_ctc: '🪨',
	sensevoice: '👂',
	medasr: '🩺',
	moonshine: '🌙',
	moonshine_streaming: '🌙',
	moss: '🌿',
	sortformer: '🗣️',
}

const AVAILABLE_HEADING = '## Available Models'
const TAIL_MARKER = 'Enjoy exploring these models'
const GIGAAM_ANCHOR = 'handy-computer/gigaam-v3-e2e-rnnt-gguf'
const GIGAAM_DETAILS_PATTERN = /<details>\n<summary>GigaAM limitations and command-line examples<\/summary>[\s\S]*?\n<\/details>/

/** Pull the preserved prose out of the current page; fail loudly if any piece is gone. */
function extractProse(markdown) {
	const headEnd = markdown.indexOf(AVAILABLE_HEADING)
	if (headEnd < 0) throw new Error(`models.md is missing the "${AVAILABLE_HEADING}" heading; cannot find the prose to preserve`)
	const gigaamMatch = markdown.match(GIGAAM_DETAILS_PATTERN)
	if (!gigaamMatch) throw new Error('models.md is missing the GigaAM details block; cannot preserve it')
	const tailStart = markdown.indexOf(TAIL_MARKER)
	if (tailStart < 0) throw new Error(`models.md is missing the closing sections (searching for "${TAIL_MARKER}"); cannot preserve them`)
	return { head: markdown.slice(0, headEnd), gigaamDetails: gigaamMatch[0], tail: markdown.slice(tailStart) }
}

/** ASR files not ending .gguf are the legacy whisper.cpp container. */
function isLegacy(model) {
	const files = Object.values(model.files)
	return files.length > 0 && files.every((file) => !file.filename.endsWith('.gguf'))
}

function languagesLabel(languages) {
	if (languages.length === 0) return ''
	const listed = languages.length <= 5 ? languages.join(', ') : `${languages.slice(0, 5).join(', ')} +${languages.length - 5}`
	return `Languages: ${listed}`
}

/** One `###` subsection: name, provider, parameters, languages, notes, links per quant. */
function entryBlock(model, curated) {
	const meta = [`By ${providerName(model.repository)}`, model.parameters ? `${model.parameters} parameters` : '', languagesLabel(model.languages ?? [])]
		.filter(Boolean)
		.join(' · ')
	const notes = []
	if (model.capabilities?.streaming) notes.push('Supports streaming.')
	if (!engineAtLeast(model.minEngine)) notes.push(`Requires transcribe.cpp ${model.minEngine}; the bundled engine is ${ENGINE_VERSION}, so it cannot load yet.`)
	const heading = curated ? `### ${FAMILY_EMOJI[model.family] ?? '⭐'} ${model.name}` : `### ${model.name}`
	const links = [`[👉 View Model](https://huggingface.co/${model.repository}/tree/${model.revision})`]
	const quants = [
		...QUANT_PREFERENCE.filter((quant) => model.files[quant]),
		...Object.keys(model.files).filter((quant) => !QUANT_PREFERENCE.includes(quant)),
	]
	for (const quant of quants) {
		const file = model.files[quant]
		links.push(`[🔽 ${quant} · ${sizeMb(file.size)} MB](https://huggingface.co/${model.repository}/resolve/${model.revision}/${file.filename}?download=true)`)
	}
	return [heading, '', [meta, ...notes].join('  \n'), '', links.join('  \n')].join('\n')
}

function render(markdown) {
	const { head, gigaamDetails, tail } = extractProse(markdown)
	const handy = JSON.parse(readFileSync(join(root, 'src', 'data', 'handy-catalog.json'), 'utf8'))
	const vibe = JSON.parse(readFileSync(join(root, 'src', 'data', 'catalog-vibe.json'), 'utf8'))
	const merged = mergeCatalogs(handy, vibe)
	const asr = merged.models.filter((model) => model.role === 'asr')
	const current = asr.filter((model) => !isLegacy(model))
	const legacy = asr.filter(isLegacy)
	const curated = current.filter((model) => model.curated)
	const others = current.filter((model) => !model.curated)
	const blocks = [
		...curated.map((model) => entryBlock(model, true)),
		...others.map((model) => entryBlock(model, false)),
		'### Legacy (reference only)',
		'These pre-GGUF whisper.cpp containers are kept for reference only: the unified engine loads GGUF only.',
		...legacy.map((model) => entryBlock(model, false)),
	]
	const anchorIndex = blocks.findIndex((block) => block.includes(`huggingface.co/${GIGAAM_ANCHOR}/tree/`))
	if (anchorIndex < 0) throw new Error(`no docs block for ${GIGAAM_ANCHOR}; cannot place the GigaAM details block`)
	blocks.splice(anchorIndex + 1, 0, gigaamDetails)
	const page = `${head}${AVAILABLE_HEADING}\n\n${blocks.join('\n\n')}\n\n${tail}`
	return {
		page,
		counts: { documented: asr.length, curated: curated.length, legacy: legacy.length, handy: handy.models.length, vibeKept: merged.models.length - handy.models.length },
	}
}

const markdown = readFileSync(docsPath, 'utf8')
const { page, counts } = render(markdown)

if (process.argv[2] === 'check') {
	if (page !== markdown) {
		console.error('models docs are stale; run pnpm docs:models')
		process.exit(1)
	}
	console.log('models docs match the catalogs')
} else if (process.argv[2] === undefined) {
	writeFileSync(docsPath, page)
	console.log(
		`rendered ${docsPath}: ${counts.documented} ASR entries (${counts.curated} curated, ${counts.legacy} legacy) from ${counts.handy} handy + ${counts.vibeKept} vibe models`,
	)
} else {
	console.error('usage: generate-models-docs.mjs [check]')
	process.exit(2)
}
