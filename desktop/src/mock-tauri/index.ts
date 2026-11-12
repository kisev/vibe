import { installRuntime } from './runtime'
import { pluginHandlers } from './handlers/plugins'
import { pathHandlers } from './handlers/path'
import { serverHandlers } from './handlers/server'
import { mediaMiscHandlers } from './handlers/media-misc'
import { handoffHandlers } from './handlers/handoff'
import { meetingHandlers } from './handlers/meeting'

// Commands with no dedicated handler group.
const extraHandlers = {
	keepawake_start: () => undefined,
	keepawake_stop: () => undefined,
	// Nothing is published on any line by default; specs override it per channel.
	update_check: () => null,
}

// Entry point for browser mock mode. Must run before any app module is imported
// (some modules call Tauri APIs at import time).
export function installMockTauri() {
	installRuntime({ ...pluginHandlers, ...pathHandlers, ...serverHandlers, ...mediaMiscHandlers, ...handoffHandlers, ...meetingHandlers, ...extraHandlers })
}
