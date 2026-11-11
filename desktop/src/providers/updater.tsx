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
// Define the context type

/** Dev-only: pretend an update is waiting so the update affordances can be eyeballed. */
export const FAKE_UPDATE_KEY = 'vibe_fake_update'
export const devToolsEnabled = import.meta.env.DEV

/**
 * Which `updater/<channel>.json` the app follows. See docs/UPDATER.md:
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
	const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null)
	const [channel, setChannel] = usePersisted<UpdateChannel>(CONFIG_KEYS.updateChannel, 'stable')
	// A slow check on the previous channel must not overwrite the result of the new one.
	const channelRef = useRef(channel)
	channelRef.current = channel
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
		setCheckState('checking')
		setCheckError(null)
		try {
			const found = await invoke<Update | null>('update_check', { channel })
			if (channelRef.current !== channel) return
			setAvailableUpdate(found !== null)
			setUpdate(found ?? undefined)
			setCheckState(found !== null ? 'available' : 'current')
		} catch (error) {
			if (channelRef.current !== channel) return
			console.error(error)
			setCheckError(String(error))
			setCheckState('error')
		} finally {
			if (channelRef.current === channel) setLastCheckedAt(Date.now())
		}
	}, [channel])

	// Checked on startup and on a channel switch, so moving to another line offers its build right away.
	useEffect(() => {
		void checkNow()
	}, [checkNow])

	async function askForRelaunch() {
		const shouldRelaunch = await dialog.ask(m.askForRelaunchBody(), {
			title: m.askForRelaunchTitle(),
			kind: 'info',
			cancelLabel: m.cancelRelaunch(),
			okLabel: m.confirmRelaunch(),
		})
		if (shouldRelaunch) {
			console.info('relaunch....')
			await process.relaunch()
		}
	}

	async function downloadAndInstall() {
		setUpdating(true)
		setProgress(0)
		setCheckState('downloading')
		console.info(`Installing update ${update?.version}, ${update?.body}`)
		const unlisten = await listen<DownloadProgress>('updater-progress', ({ payload }) => {
			setProgress(payload.percent)
		})
		try {
			await invoke('update_download')
		} finally {
			unlisten()
		}
		// Windows cannot replace the bundled server.exe while it is running. Stop it
		// only after the update has downloaded so transcription remains available
		// while the (potentially long) download is in progress.
		setCheckState('installing')
		await invoke('stop_api_server')
		await invoke('update_install')
		// Progress is left at 100 rather than reset: the dialog fades out after this, and a reset
		// would show the bar sliding back to empty. The next download starts it at 0.
		setUpdating(false)
		setCheckState('available')
		await askForRelaunch()
		setAvailableUpdate(false)
	}

	async function updateApp() {
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
				setCheckState('error')
				setErrorModal?.({ open: true, log: String(e) })
			}
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
				lastCheckedAt,
				progress,
			}}>
			{children}
		</UpdaterContext.Provider>
	)
}
