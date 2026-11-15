import { afterEach, describe, expect, it, vi } from 'vitest'
import { beginDownload, downloadName, downloadSnapshot, endDownload, subscribeDownloads, updateDownload } from './downloads'

afterEach(() => {
	// Drain the registry between tests.
	for (const url of ['a', 'b', 'c']) endDownload(url)
})

describe('download registry', () => {
	it('reports the latest-touched download and the in-flight count', () => {
		beginDownload('a', 'model-a.gguf')
		beginDownload('b', 'model-b.gguf')
		updateDownload('a', 50)

		let snapshot = downloadSnapshot()
		expect(snapshot.count).toBe(2)
		expect(snapshot.latest?.name).toBe('model-a.gguf')
		expect(snapshot.latest?.progress).toBe(50)

		updateDownload('b', 80)
		snapshot = downloadSnapshot()
		expect(snapshot.latest?.name).toBe('model-b.gguf')

		endDownload('b')
		expect(downloadSnapshot().count).toBe(1)
		expect(downloadSnapshot().latest?.name).toBe('model-a.gguf')
	})

	it('notifies subscribers on every change', () => {
		const listener = vi.fn()
		const unsubscribe = subscribeDownloads(listener)
		beginDownload('c', 'model-c.gguf')
		updateDownload('c', 10)
		endDownload('c')
		expect(listener).toHaveBeenCalledTimes(3)
		unsubscribe()
	})

	it('keeps the entry until the last concurrent download of the same URL ends', () => {
		beginDownload('a', 'model-a.gguf')
		beginDownload('a', 'model-a.gguf')
		endDownload('a')
		expect(downloadSnapshot().count).toBe(1)
		endDownload('a')
		expect(downloadSnapshot().count).toBe(0)
	})

	it('falls back to the most recently touched download, not the last started', () => {
		beginDownload('a', 'model-a.gguf')
		beginDownload('b', 'model-b.gguf')
		beginDownload('c', 'model-c.gguf')
		updateDownload('b', 10)
		updateDownload('a', 20)

		endDownload('a')

		expect(downloadSnapshot().latest?.name).toBe('model-b.gguf')
	})

	it('derives a short file label from the URL', () => {
		expect(downloadName('https://huggingface.co/x/y/resolve/abc/model-Q4.gguf?download=true')).toBe('model-Q4.gguf')
	})
})
