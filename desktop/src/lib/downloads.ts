// Registry of in-flight downloads: the shared progress toast and the setup
// progress bar read from here, keyed by URL, so parallel downloads no longer
// fight over one percentage.
import { listen } from '@tauri-apps/api/event'

export interface DownloadEntry {
	name: string
	/** Percent, 0–100. */
	progress: number
	/** Concurrent downloads of the same URL; the entry lives until the last one ends. */
	refs: number
}

type Listener = () => void

const entries = new Map<string, DownloadEntry>()
const listeners = new Set<Listener>()
/** Keys in touch order, the most recently active download last. */
const touchOrder: string[] = []

function notify() {
	for (const listener of listeners) listener()
}

function removeFromTouchOrder(url: string) {
	const at = touchOrder.indexOf(url)
	if (at >= 0) touchOrder.splice(at, 1)
}

function touch(url: string) {
	removeFromTouchOrder(url)
	touchOrder.push(url)
	notify()
}

export function beginDownload(url: string, name: string) {
	const existing = entries.get(url)
	if (existing) {
		// The same URL started again while the first download runs: share the entry instead of
		// resetting its progress, and leave removal to the last end.
		existing.refs += 1
		touch(url)
		return
	}
	entries.set(url, { name, progress: 0, refs: 1 })
	touch(url)
}

export function updateDownload(url: string, progress: number) {
	const entry = entries.get(url)
	if (!entry) return
	entry.progress = progress
	touch(url)
}

export function endDownload(url: string) {
	const entry = entries.get(url)
	if (!entry) return
	entry.refs -= 1
	if (entry.refs > 0) return
	entries.delete(url)
	removeFromTouchOrder(url)
	notify()
}

export function subscribeDownloads(listener: Listener): () => void {
	listeners.add(listener)
	return () => listeners.delete(listener)
}

/** The latest-touched entry plus how many are in flight; the count is what the toast shows. */
export function downloadSnapshot(): { latest: DownloadEntry | null; count: number } {
	const latestUrl = touchOrder[touchOrder.length - 1] ?? null
	return { latest: latestUrl ? (entries.get(latestUrl) ?? null) : null, count: entries.size }
}

/** Short file label from a download URL, for the toast when no display name is given. */
export function downloadName(url: string): string {
	const withoutQuery = url.split('?')[0]
	const parts = withoutQuery.split('/')
	return parts[parts.length - 1] || url
}

/** The Rust side's progress event; the payload carries byte counts. */
export const DOWNLOAD_PROGRESS_EVENT = 'download_progress'

export interface DownloadProgressEvent {
	url: string
	current: number
	total: number
}

let eventsAttached = false

/**
 * Route the Rust `download_progress` event into the registry. Call once per window before any
 * download starts (the app shell does): the registry has to advance on every route, including
 * `/setup`, where the settings view that used to own this bridge is not mounted.
 */
export function initDownloadEvents(): void {
	if (eventsAttached) return
	eventsAttached = true
	void listen<DownloadProgressEvent>(DOWNLOAD_PROGRESS_EVENT, ({ payload }) => {
		if (!payload || !(payload.total > 0)) return
		updateDownload(payload.url, (payload.current / payload.total) * 100)
	}).catch((error) => {
		console.error('failed to listen for download progress:', error)
	})
}
