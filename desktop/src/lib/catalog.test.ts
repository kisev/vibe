import { describe, expect, it } from 'vitest'
import {
	CATALOG,
	asrCatalog,
	availability,
	catalogBests,
	defaultQuant,
	engineAtLeast,
	entryScores,
	identityKey,
	matchInstalled,
	mergeCatalogs,
	providerName,
	sizeMb,
	type CatalogData,
	type CatalogModel,
} from './catalog'

const handyTwins = CATALOG.models.filter((m) => m.id === 'parakeet-tdt-0.6b-v3')
const vibeTwins = CATALOG.models.filter((m) => m.id === 'vibe-parakeet-tdt-0.6b-v3')

describe('mergeCatalogs', () => {
	it('keeps same-named models from different providers as distinct entries', () => {
		expect(handyTwins).toHaveLength(1)
		expect(vibeTwins).toHaveLength(1)
		expect(handyTwins[0].repository).toBe('handy-computer/parakeet-tdt-0.6b-v3-gguf')
		expect(vibeTwins[0].repository).toBe('vibe-app/parakeet-tdt-0.6b-v3-gguf')
	})

	it('produces unique identity keys for every file', () => {
		const keys = CATALOG.models.flatMap((m) => Object.entries(m.files).map(([quant]) => identityKey(m, quant)))
		expect(new Set(keys).size).toBe(keys.length)
	})

	it('drops a vibe entry whose files the handy layer already carries', () => {
		const twin: CatalogModel = { ...vibeTwins[0], id: 'dup', repository: handyTwins[0].repository, revision: handyTwins[0].revision, files: handyTwins[0].files }
		const handy = { schema: 2, models: [handyTwins[0]], results: {} } as unknown as CatalogData
		const merged = mergeCatalogs(handy, { schema: 2, models: [twin] })
		expect(merged.models.map((m) => m.id)).toEqual([handyTwins[0].id])
	})

	it('filters the settings catalog to loadable ASR entries', () => {
		expect(asrCatalog().every((m) => m.role === 'asr')).toBe(true)
		expect(asrCatalog().length).toBeLessThan(CATALOG.models.length)
		// Legacy .bin containers and engine-ahead families stay in the data but never in the chooser.
		expect(asrCatalog().every((m) => Object.values(m.files).every((f) => f.filename.endsWith('.gguf')))).toBe(true)
		expect(asrCatalog().every((m) => engineAtLeast(m.minEngine))).toBe(true)
	})
})

describe('entryScores', () => {
	it('gives a benchmarked entry relative bars against the catalog best', () => {
		const model = CATALOG.models.find((m) => m.id === 'parakeet-unified-en-0.6b')!
		const scores = entryScores(model)
		expect(scores.accuracy).toBeGreaterThan(0)
		expect(scores.accuracy).toBeLessThanOrEqual(1)
		expect(scores.speed).toBeGreaterThan(0)
		expect(scores.speed).toBeLessThanOrEqual(1)
		// The catalog best scores the full bar.
		const bestError = catalogBests().accuracy
		const best = CATALOG.models.find((m) => CATALOG.results[m.id] && Math.min(...Object.values(CATALOG.results[m.id].accuracy).map((r) => r.error)) === bestError)!
		expect(entryScores(best).accuracy).toBe(1)
	})

	it('gives an unbenchmarked entry no bars rather than fake ones', () => {
		const model = CATALOG.models.find((m) => !CATALOG.results[m.id])!
		expect(entryScores(model)).toEqual({})
	})
})

describe('availability', () => {
	it('marks GGUF files of supported engine versions as available', () => {
		const model = CATALOG.models.find((m) => m.id === 'parakeet-tdt-0.6b-v3')!
		expect(availability(model, 'Q8_0')).toEqual({ ok: true })
	})

	it('marks a family ahead of the bundled engine with its requirement', () => {
		const ahead: CatalogModel = { ...vibeTwins[0], id: 'ahead', minEngine: '9.9.9' }
		expect(availability(ahead, 'Q4_K_M')).toEqual({ ok: false, reason: 'engine', requirement: '9.9.9' })
	})

	it('marks legacy .bin ASR files with the format requirement', () => {
		// The vibe layer no longer carries .bin entries, so exercise the format gate with an inline fixture.
		const legacy: CatalogModel = {
			...vibeTwins[0],
			id: 'inline-legacy-bin',
			files: { F16: { filename: 'ggml-tiny.bin', size: 77_700_000, sha256: '0'.repeat(64) } },
		}
		expect(availability(legacy, 'F16')).toEqual({ ok: false, reason: 'format', requirement: 'GGUF' })
		expect(asrCatalog({ schema: 2, models: [legacy], results: {} })).toEqual([])
	})

	it('compares dot versions numerically', () => {
		expect(engineAtLeast('0.4.1')).toBe(true)
		expect(engineAtLeast('0.4.2')).toBe(false)
		expect(engineAtLeast('1.0', '0.4.1')).toBe(false)
		expect(engineAtLeast('0.2.4', '0.4.1')).toBe(true)
	})
})

describe('presentation helpers', () => {
	it('matches an installed file to its catalog entry', () => {
		// The -he file is vibe-only; the base parakeet quants are shared with the handy layer.
		const hebrew = CATALOG.models.find((m) => m.id === 'vibe-parakeet-tdt-0.6b-v3-he')!
		const match = matchInstalled('parakeet-tdt-0.6b-v3-he-q8_0.gguf')
		expect(match?.model).toBe(hebrew)
		expect(match?.quant).toBe('Q8_0')
		expect(matchInstalled('parakeet-tdt-0.6b-v3-Q4_K_M.gguf')?.model.id).toBe('parakeet-tdt-0.6b-v3')
		// A manual download the catalog does not know simply matches nothing.
		expect(matchInstalled('somebody-elses-model.bin')).toBeUndefined()
	})

	it('maps repository owners to provider display names', () => {
		expect(providerName('vibe-app/x')).toBe('Vibe')
		expect(providerName('handy-computer/y')).toBe('Handy')
		expect(providerName('someone-else/z')).toBe('someone-else')
	})

	it('prefers Q8_0 as the default quantization and falls back along the ladder', () => {
		const multi = CATALOG.models.find((m) => Object.keys(m.files).includes('Q8_0'))!
		expect(defaultQuant(multi)).toBe('Q8_0')
		const single = vibeTwins[0]
		expect(defaultQuant(single)).toBe('Q4_K_M')
	})

	it('renders sizes in megabytes', () => {
		expect(sizeMb(485425536)).toBe(485)
		expect(sizeMb(885098)).toBe(1)
	})
})
