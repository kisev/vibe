/**
 * Node 26 ships a `localStorage` global that is unusable unless `--localstorage-file` is passed.
 * Vitest's jsdom environment does not overwrite that inherited global, so Paraglide's locale
 * resolution reads `undefined` and every message call throws. Hand the tests jsdom's storage.
 */
const jsdomWindow = (globalThis as { jsdom?: { window?: Window } }).jsdom?.window
const storage = jsdomWindow?.localStorage
// Out of jsdom there is nothing to install; Paraglide treats the process as a server and does
// not resolve a locale from storage.
if (storage) {
	Object.defineProperty(globalThis, 'localStorage', {
		value: storage,
		configurable: true,
		writable: true,
	})
}
