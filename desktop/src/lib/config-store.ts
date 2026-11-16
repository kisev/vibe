import { listen } from '@tauri-apps/api/event'
import { load, type Store } from '@tauri-apps/plugin-store'
import { useCallback, useRef, useSyncExternalStore } from 'react'
import * as config from '~/lib/config'

/**
 * Settings live in `app_config.json` next to the app's other data, not in `localStorage`: the file
 * survives a cleared webview, every window sees the same values, and a person (or an agent) can
 * open it and edit it.
 *
 * Reads have to be synchronous for React, so the whole file is pulled into a cache once at boot and
 * kept fresh by the store's change events — which also cover writes from another window.
 */
/**
 * Emitted by the Rust file watcher after someone edited `app_config.json` outside the app. The
 * store's own reload is silent (it only emits on set/delete/clear), so this carries the whole file.
 */
const CONFIG_CHANGED_EVENT = 'config-changed'

let store: Store | null = null
const cache = new Map<string, unknown>()
const listeners = new Map<string, Set<() => void>>()

function notify(key: string) {
	for (const listener of listeners.get(key) ?? []) listener()
}

/** Apply one changed value, waking subscribers only when it really moved. */
function applyConfigValue(key: string, value: unknown) {
	const exists = value !== undefined
	if (!exists && !cache.has(key)) return
	if (exists && cache.has(key) && JSON.stringify(cache.get(key)) === JSON.stringify(value)) return
	if (exists) cache.set(key, value)
	else cache.delete(key)
	notify(key)
}

/** Must finish before the first render, or every setting would flash its default. */
export async function loadConfigStore() {
	try {
		// autoSave batches the disk writes: a slider being dragged costs one save, not fifty.
		store = await load(config.storeFilename, { autoSave: 300, defaults: {} })
		for (const [key, value] of await store.entries()) cache.set(key, value)
		// `store.onChange` filters by this webview's resource id, so a write from another window
		// (the main window and the browser chrome share one config file) never reaches it. The
		// plugin emits the same event app-wide; listen to it raw so every window stays in step.
		await listen<{ path: string; key: string; value?: unknown; exists: boolean }>('store://change', ({ payload }) => {
			if (!payload?.path?.endsWith(config.storeFilename)) return
			applyConfigValue(payload.key, payload.exists ? payload.value : undefined)
		})
		await listen<Record<string, unknown>>(CONFIG_CHANGED_EVENT, ({ payload }) => applyExternalConfig(payload))
	} catch (error) {
		// A broken or unreadable file must not stop the app: every setting falls back to its default.
		console.error('failed to load the config store:', error)
	}
}

/** Replace the cache with a config file edited from outside, waking only the keys that moved. */
function applyExternalConfig(next: Record<string, unknown> | null) {
	const incoming = next ?? {}
	for (const key of new Set([...cache.keys(), ...Object.keys(incoming)])) applyConfigValue(key, incoming[key])
}

export function readConfig<T>(key: string, fallback: T): T {
	return cache.has(key) ? (cache.get(key) as T) : fallback
}

export function writeConfig<T>(key: string, value: T) {
	cache.set(key, value)
	notify(key)
	// Fire and forget, like the old localStorage write: the screen must not wait on the disk.
	void store?.set(key, value)
}

/** Remove a setting from both the live cache and the persisted config file. */
export function deleteConfig(key: string) {
	cache.delete(key)
	notify(key)
	void store?.delete(key)
}

function subscribe(key: string, listener: () => void) {
	const existing = listeners.get(key) ?? new Set<() => void>()
	existing.add(listener)
	listeners.set(key, existing)
	return () => {
		existing.delete(listener)
		if (existing.size === 0) listeners.delete(key)
	}
}

/**
 * Drop-in replacement for `useLocalStorage`: same tuple, same functional-update setter, but the
 * value is stored in the config file and shared across windows.
 */
export function usePersisted<T>(key: string, initial: T): [T, (value: T | ((previous: T) => T)) => void] {
	// Callers pass object literals as defaults; pinning the first one keeps the snapshot identity
	// stable while the key is missing, which useSyncExternalStore requires.
	const fallback = useRef(initial)

	const value = useSyncExternalStore(
		useCallback((listener: () => void) => subscribe(key, listener), [key]),
		useCallback(() => readConfig(key, fallback.current), [key]),
	)

	const setValue = useCallback(
		(next: T | ((previous: T) => T)) => {
			const resolved = typeof next === 'function' ? (next as (previous: T) => T)(readConfig(key, fallback.current)) : next
			writeConfig(key, resolved)
		},
		[key],
	)

	return [value, setValue]
}
