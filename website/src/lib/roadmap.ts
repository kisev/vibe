/**
 * The roadmap is generated at build time by `scripts/roadmap.py` into
 * `website/public/roadmap.json` from the repository's unarchived OpenSpec
 * changes, so the site never carries a hand-maintained second copy of the
 * plans. A failed load is the page's problem to state, not a reason to crash.
 *
 * `i18n/roadmap/<locale>.json` carries the same entries translated, keyed by
 * change name. A change name is an identity and is never translated; a locale
 * without an entry for one change falls back to the English card rather than
 * showing an empty one.
 */
export interface RoadmapEntry {
	name: string
	title: string
	why: string
}

interface RoadmapTranslation {
	title: string
	why: string
}

const translations = import.meta.glob('../../../i18n/roadmap/*.json', { eager: true, import: 'default' }) as Record<
	string,
	Record<string, RoadmapTranslation>
>

function isEntry(value: unknown): value is RoadmapEntry {
	if (!value || typeof value !== 'object') return false
	const entry = value as Record<string, unknown>
	return typeof entry.name === 'string' && typeof entry.title === 'string' && typeof entry.why === 'string'
}

function isTranslation(value: unknown): value is RoadmapTranslation {
	if (!value || typeof value !== 'object') return false
	const entry = value as Record<string, unknown>
	return typeof entry.title === 'string' && entry.title.trim() !== '' && typeof entry.why === 'string' && entry.why.trim() !== ''
}

/** The translations this locale has, keyed by change name. Malformed entries are ignored. */
export function translatedEntries(locale: string): Record<string, RoadmapTranslation> {
	const file = Object.entries(translations).find(([path]) => path.split('/').at(-1) === `${locale}.json`)?.[1]
	if (!file || typeof file !== 'object') return {}
	const result: Record<string, RoadmapTranslation> = {}
	for (const [name, value] of Object.entries(file)) {
		if (isTranslation(value)) result[name] = value
	}
	return result
}

/** English entries with each translated card swapped in; untranslated ones stay English whole. */
export function localizeRoadmap(entries: RoadmapEntry[], locale: string): RoadmapEntry[] {
	const translated = translatedEntries(locale)
	return entries.map((entry) => {
		const translation = translated[entry.name]
		return translation ? { name: entry.name, title: translation.title, why: translation.why } : entry
	})
}

export async function loadRoadmap(locale: string, signal?: AbortSignal): Promise<RoadmapEntry[]> {
	const response = await fetch(`${import.meta.env.BASE_URL}roadmap.json`, { signal })
	if (!response.ok) throw new Error(`roadmap: ${response.status}`)
	const data: unknown = await response.json()
	if (!Array.isArray(data) || !data.every(isEntry)) throw new Error('roadmap: unexpected JSON')
	return localizeRoadmap(data, locale)
}
