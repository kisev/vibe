/**
 * The roadmap is generated at build time by `scripts/roadmap.py` into
 * `website/public/roadmap.json` from the repository's unarchived OpenSpec
 * changes, so the site never carries a hand-maintained second copy of the
 * plans. A failed load is the page's problem to state, not a reason to crash.
 */
export interface RoadmapEntry {
	name: string
	title: string
	why: string
}

function isEntry(value: unknown): value is RoadmapEntry {
	if (!value || typeof value !== 'object') return false
	const entry = value as Record<string, unknown>
	return typeof entry.name === 'string' && typeof entry.title === 'string' && typeof entry.why === 'string'
}

export async function loadRoadmap(signal?: AbortSignal): Promise<RoadmapEntry[]> {
	const response = await fetch(`${import.meta.env.BASE_URL}roadmap.json`, { signal })
	if (!response.ok) throw new Error(`roadmap: ${response.status}`)
	const data: unknown = await response.json()
	if (!Array.isArray(data) || !data.every(isEntry)) throw new Error('roadmap: unexpected JSON')
	return data
}
