/**
 * A human-readable message from an unknown rejection. Tauri commands reject with a serialized
 * `CommandError` object (`{ code, message }`), which `String(error)` renders as "[object Object]";
 * a plain string or anything else keeps the usual string form.
 */
export function errorMessage(error: unknown): string {
	if (typeof error === 'string') return error
	if (typeof error === 'object' && error !== null && 'message' in error) return String((error as { message: unknown }).message)
	return String(error)
}
