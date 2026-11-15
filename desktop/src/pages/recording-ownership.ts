/**
 * Records who a `record_finish` clip belongs to, for the listeners that would otherwise all
 * adopt it. The main window saves every finished recording as a project and moves the temp
 * file into it, so a clip recorded by another surface must be claimed before it lands there.
 */

/** Marks a recording-state report this window published itself, so its own listener skips the echo. */
export const OWN_RECORDING_REPORT = 'session'

/** True while the model-comparison lab has asked the recorder to stop and awaits its clip. */
let comparisonClipPending = false

export function isComparisonClipPending() {
	return comparisonClipPending
}

export function setComparisonClipPending(pending: boolean) {
	comparisonClipPending = pending
}
