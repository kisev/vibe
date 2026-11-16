import { deleteConfig } from '~/lib/config-store'

/**
 * Telemetry was removed from the app, and with it the opt-out flag. A leftover
 * `analytics_enabled` in a file people read (and edit) by hand would suggest the app still
 * sends something, or that turning it off still matters. The flag never had a `localStorage`
 * counterpart, so the config file is the only place it can linger.
 */
export function removeAnalyticsEnabled() {
	deleteConfig('analytics_enabled')
}
