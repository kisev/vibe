// Registry of in-flight downloads: the shared progress toast and the setup
// progress bar read from here, keyed by URL, so parallel downloads no longer
// fight over one percentage.
export interface DownloadEntry {
	name: string
	progress: number
}

type Listener = () => void

const entries = new Map<string, DownloadEntry>()
const listeners = new Set<Listener>()
let latestUrl: string | null = null

function notify() {
	for (const listener of listeners) listener()
}

export function beginDownload(url: string, name: string) {
	entries.set(url, { name, progress: 0 })
	latestUrl = url
	notify()
}

export function updateDownload(url: string, progress: number) {
	const entry = entries.get(url)
	if (!entry) return
	entry.progress = progress
	latestUrl = url
	notify()
}

export function endDownload(url: string) {
	entries.delete(url)
	if (latestUrl === url) latestUrl = entries.size > 0 ? [...entries.keys()][entries.size - 1] ?? null : null
	notify()
}

export function subscribeDownloads(listener: Listener): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

/** The latest-touched entry plus how many are in flight; the count is what the toast shows. */
export function downloadSnapshot(): { latest: DownloadEntry | null; count: number } {
	return { latest: latestUrl ? (entries.get(latestUrl) ?? null) : null, count: entries.size }
}

/** Short file label from a download URL, for the toast when no display name is given. */
export function downloadName(url: string): string {
	const withoutQuery = url.split('?')[0] ?? url
	const parts = withoutQuery.split('/')
	return parts[parts.length - 1] || url
}
