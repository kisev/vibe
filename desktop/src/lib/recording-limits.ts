/** The silence-warning window is a setting; these bounds keep its value usable. */
export const DEFAULT_LONG_SILENCE_MINUTES = 5
export const MIN_LONG_SILENCE_MINUTES = 1
export const MAX_LONG_SILENCE_MINUTES = 60

/** Clamp any stored or typed value into the supported window. */
export function clampLongSilenceMinutes(value: number): number {
	const minutes = Number.isFinite(value) ? Math.round(value) : DEFAULT_LONG_SILENCE_MINUTES
	return Math.min(MAX_LONG_SILENCE_MINUTES, Math.max(MIN_LONG_SILENCE_MINUTES, minutes))
}
