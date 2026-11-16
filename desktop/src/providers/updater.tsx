import * as dialog from '@tauri-apps/plugin-dialog'
import * as process from '@tauri-apps/plugin-process'
import { listen } from '@tauri-apps/api/event'
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { m } from '~/paraglide/messages.js'
import { ErrorModalContext } from './error-modal'
import { ModifyState } from '~/lib/types'
import { invoke } from '@tauri-apps/api/core'
import { CONFIG_KEYS } from '~/lib/config-keys'
import { usePersisted } from '~/lib/config-store'
import { usePreferenceProvider } from './preference'
// Define the context type

/** Dev-only: pretend an update is waiting so the update affordances can be eyeballed. */
export const FAKE_UPDATE_KEY = 'vibe_fake_update'
export const devToolsEnabled = import.meta.env.DEV

/**
 * Which `updater/<channel>.json` the app follows. See docs/reference/update-channels.md:
 * release tags `vX.Y.Z` on main, beta tags `vX.Y.Z-rc.<n>` on main, dev tags `dev.<n>` on dev.
 */
export type UpdateChannel = 'stable' | 'beta' | 'dev'

/** Every user-visible phase of one update check and install. */
export type CheckState = 'idle' | 'checking' | 'current' | 'available' | 'downloading' | 'installing' | 'error'

/** A newer version `update_check` found on the channel. */
export interface Update {
	version: string
	currentVersion: string
	body?: string
}

interface DownloadProgress {
	percent: number
}

/** The Rust side emits this while `update_download` runs; the string must match `updater.rs`. */
const UPDATER_PROGRESS_EVENT = 'updater-progress'

export type UpdaterContextType = {
	availableUpdate: boolean
	setAvailableUpdate: ModifyState<boolean>
	updating: boolean
	setUpdating: ModifyState<boolean>
	manifest?: Update
	setManifest: ModifyState<Update | undefined>
	updateApp: () => Promise<void>
	/** Check the selected channel again without waiting for the next launch. */
	checkNow: () => Promise<void>
	checkState: CheckState
	/** Why the last check failed; cleared when a later check starts. */
	checkError: string | null
	/** Which step produced `checkState: 'error'`: the check itself or the download/install. */
	errorStage: 'check' | 'install' | 'download' | null
	/** Epoch milliseconds of the last finished check, or null before the first one. */
	lastCheckedAt: number | null
	progress: number | null
	/** Dev-only switch that fakes `availableUpdate`; always false in release builds. */
	fakeUpdate: boolean
	setFakeUpdate: (value: boolean) => void
	channel: UpdateChannel
	setChannel: (value: UpdateChannel) => void
}

// Create the context
export const UpdaterContext = createContext<UpdaterContextType>({
	availableUpdate: false,
	setAvailableUpdate: () => {},
	updating: false,
	setUpdating: () => {},
	setManifest: () => {},
	updateApp: async () => {},
	checkNow: async () => {},
	checkState: 'idle',
	checkError: null,
	errorStage: null,
	lastCheckedAt: null,
	progress: null,
	fakeUpdate: false,
	setFakeUpdate: () => {},
	channel: 'stable',
	setChannel: () => {},
})

export function UpdaterProvider({ children }: { children: React.ReactNode }) {
	const [availableUpdate, setAvailableUpdate] = useState(false)
	const [update, setUpdate] = useState<Update | undefined>()
	const [updating, setUpdating] = useState(false)
	const { setState: setErrorModal } = useContext(ErrorModalContext)
	const [progress, setProgress] = useState<number | null>(null)
	const [checkState, setCheckState] = useState<CheckState>('idle')
	const [checkError, setCheckError] = useState<string | null>(null)
	const [errorStage, setErrorStage] = useState<'check' | 'install' | 'download' | null>(null)
	const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)
	const [storedChannel, setChannel] = usePersisted<UpdateChannel>(CONFIG_KEYS.updateChannel, 'stable')
	// A hand-edited config can hold anything; an unknown channel would fail deserialization on
	// every check, including the automatic one at startup, so fall back to stable until the
	// user picks a line again.
	const channel: UpdateChannel = storedChannel === 'stable' || storedChannel === 'beta' || storedChannel === 'dev' ? storedChannel : 'stable'
	const preference = usePreferenceProvider()
	// A second confirmation while an update is already running would start a parallel download
	// and fail the second install with "no downloaded update to install".
	const updateRequestRef = useRef(false)
	// Set when the download half fails, so the dialog does not report it as an install failure.
	const downloadFailedRef = useRef(false)
	// A slow check must not overwrite the result of a newer one — including a switch back to a
	// channel whose first check is still in flight. Each invocation owns an id; only the latest writes.
	const checkIdRef = useRef(0)
	const [fakeUpdate, setFakeUpdateState] = useState(() => {
		if (!devToolsEnabled) return false
		try {
			return localStorage.getItem(FAKE_UPDATE_KEY) === '1'
		} catch {
			return false
		}
	})

	function setFakeUpdate(value: boolean) {
		setFakeUpdateState(value)
		try {
			localStorage.setItem(FAKE_UPDATE_KEY, value ? '1' : '0')
		} catch {
			/* private mode — the flag still holds for this session */
		}
	}

	/**
	 * One pass over the selected channel. The automatic check and the settings
	 * button share it, so both report through the same state.
	 */
	const checkNow = useCallback(async () => {
		const checkId = ++checkIdRef.current
		setCheckState('checking')
		setCheckError(null)
		setErrorStage(null)
		try {
			const found = await invoke<Update | null>('update_check', { channel })
			if (checkIdRef.current !== checkId) return
			// A manifest without a version is a line with nothing on it, not an
			// update whose version happens to be blank.
			const candidate = found && typeof found.version === 'string' && found.version.trim() !== '' ? found : null
			setAvailableUpdate(candidate !== null)
			setUpdate(candidate ?? undefined)
			setCheckState(candidate ? 'available' : 'current')
		} catch (error) {
			if (checkIdRef.current !== checkId) return
			console.error(error)
			setCheckError(String(error))
			setErrorStage('check')
			setCheckState('error')
		} finally {
			if (checkIdRef.current === checkId) setLastCheckedAt(Date.now())
		}
	}, [channel])

	// Checked on startup and on a channel switch, so moving to another line offers its build right away.
	useEffect(() => {
		void checkNow()
	}, [checkNow])

	async function askForRelaunch(): Promise<boolean> {
		const shouldRelaunch = await dialog.ask(m.askForRelaunchBody(), {
			title: m.askForRelaunchTitle(),
			kind: 'info',
			cancelLabel: m.cancelRelaunch(),
			okLabel: m.confirmRelaunch(),
		})
		if (!shouldRelaunch) return false
		console.info('relaunch....')
		await process.relaunch()
		// A relaunch that resolves instead of replacing the process leaves the app running.
		return false
	}

	/** The install stopped the shared server; bring it back when the app keeps running. */
	async function restartApiServer() {
		try {
			await invoke('start_api_server', { unloadTimeoutMinutes: preference.unloadTimeoutMinutes })
		} catch (error) {
			console.error('failed to restart the API server after the update:', error)
		}
	}

	async function downloadAndInstall() {
		setUpdating(true)
		setProgress(0)
		setCheckState('downloading')
		console.info(`Installing update ${update?.version}, ${update?.body}`)
		const unlisten = await listen<DownloadProgress>(UPDATER_PROGRESS_EVENT, ({ payload }) => {
			setProgress(payload.percent)
		})
		try {
			await invoke('update_download')
		} catch (error) {
			downloadFailedRef.current = true
			throw error
		} finally {
			unlisten()
		}
		// The API switch is the user's intent, and stopping the process for the install leaves it
		// on. Remember it so a failure can put the server back instead of leaving "enabled, no
		// process, base URL gone" behind.
		const apiWasEnabled = await invoke<boolean>('api_server_enabled').catch(() => false)
		// Windows cannot replace the bundled server.exe while it is running. Stop it
		// only after the update has downloaded so transcription remains available
		// while the (potentially long) download is in progress. This releases the
		// process without recording it as the user turning the API off.
		setCheckState('installing')
		await invoke('stop_api_server_process')
		try {
			await invoke('update_install')
		} catch (error) {
			if (apiWasEnabled) await restartApiServer()
			throw error
		}
		// Progress is left at 100 rather than reset: the dialog fades out after this, and a reset
		// would show the bar sliding back to empty. The next download starts it at 0.
		setUpdating(false)
		setCheckState('available')
		try {
			await askForRelaunch()
		} finally {
			// A declined (or failed) relaunch means this process keeps serving, and the install
			// only stopped its server. A real relaunch never reaches the finally.
			if (apiWasEnabled) await restartApiServer()
		}
		setAvailableUpdate(false)
		// The pending update was consumed by `update_install`. Ask again so a declined relaunch
		// leaves a working "update now" instead of one that fails with "no update to download".
		await checkNow()
	}

	async function updateApp() {
		if (updateRequestRef.current) return
		updateRequestRef.current = true
		try {
			if (fakeUpdate && !update) {
				await dialog.message('This is a faked update (dev mode). No download will happen.', { title: m.updateVersion(), kind: 'info' })
				return
			}
			const shouldUpdate = await dialog.ask(m.askForUpdateBody({ version: String(update?.version ?? '') }), {
				title: m.askForUpdateTitle(),
				kind: 'info',
				cancelLabel: m.cancelUpdate(),
				okLabel: m.confirmUpdate(),
			})
			if (shouldUpdate) {
				try {
					await downloadAndInstall()
				} catch (e) {
					console.error(e)
					setUpdating(false)
					setCheckError(String(e))
					setErrorStage(downloadFailedRef.current ? 'download' : 'install')
					downloadFailedRef.current = false
					setCheckState('error')
					setErrorModal?.({ open: true, log: String(e) })
				}
			}
		} finally {
			updateRequestRef.current = false
		}
	}

	return (
		<UpdaterContext.Provider
			value={{
				availableUpdate: availableUpdate || fakeUpdate,
				setAvailableUpdate,
				fakeUpdate,
				setFakeUpdate,
				channel,
				setChannel,
				manifest: update,
				setManifest: setUpdate,
				updating,
				setUpdating,
				updateApp,
				checkNow,
				checkState,
				checkError,
				errorStage,
				lastCheckedAt,
				progress,
			}}>
			{children}
		</UpdaterContext.Provider>
	)
}
