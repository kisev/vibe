import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'
import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ErrorModalContext } from '~/providers/error-modal'
import { usePreferenceProvider } from '~/providers/preference'
import * as utils from '~/lib/model'
import * as osExt from '@tauri-apps/plugin-os'
import * as config from '~/lib/config'
import { downloadSnapshot, subscribeDownloads } from '~/lib/downloads'
import { errorMessage } from '~/lib/errors'
import { ensureRequiredVadModel } from '~/pages/model-selection'

export function viewModel() {
	const location = useLocation()
	const [downloadProgress, setDownloadProgress] = useState(0)
	const [isOnline, setIsOnline] = useState<boolean | null>(null)
	const downloadProgressRef = useRef(0)
	const { setState: setErrorModal } = useContext(ErrorModalContext)
	const navigate = useNavigate()
	const preference = usePreferenceProvider()

	// The setup progress bar follows the download registry: the latest-touched download,
	// restarting when the file changes or the same file goes back to zero (a retry). The shell's
	// global bridge feeds the registry on every route, this one included.
	const latestNameRef = useRef<string | null>(null)
	useEffect(
		() =>
			subscribeDownloads(() => {
				const { latest } = downloadSnapshot()
				if (!latest) return
				// Within one attempt the record is monotonic; a drop means the same file restarted
				// from zero (an in-place re-download, or "Try again" after a failure).
				if (latest.name !== latestNameRef.current || latest.progress < downloadProgressRef.current) {
					latestNameRef.current = latest.name
					downloadProgressRef.current = 0
					setDownloadProgress(0)
				}
				if (latest.progress > downloadProgressRef.current) {
					setDownloadProgress(latest.progress)
					downloadProgressRef.current = latest.progress
				}
			}),
		[],
	)

	async function readModelMetadata(modelPath: string) {
		return invoke<utils.ModelMetadata>('get_model_metadata', { modelPath }).catch((error) => {
			console.warn('No specialized GGUF metadata available:', error)
			return null
		})
	}

	async function selectDownloadedModel(modelPath: string) {
		const metadata = await readModelMetadata(modelPath)
		if (!(await ensureRequiredVadModel(metadata))) return false
		// The provider reconciles the language when the metadata changes; writing it here too would
		// spread a stale snapshot of the options taken before the awaits over the current one.
		preference.setModelMetadata(metadata)
		preference.setModelPath(modelPath)
		return true
	}

	async function downloadModel() {
		let lastError = null

		try {
			let urls: config.ModelDownload[] = []

			// Determine model URLs
			if (location?.state?.downloadURL) {
				// A URL the user supplied carries no size or hash, so the backend falls back to the
				// size and magic-byte checks it runs on every download.
				urls = [{ url: location.state.downloadURL }]
				console.log(`[model] Using provided model URL: ${urls[0].url}`)
			} else {
				urls = [...config.modelUrls.default]
				const locale = await osExt.locale()
				console.log(`[locale] Detected locale: ${locale}`)

				if (locale?.endsWith('-IL')) {
					console.log(`[model] Prioritizing Hebrew models`)
					urls.unshift(...config.modelUrls.hebrew)
				}
			}

			// Try downloading from each URL
			for (const source of urls) {
				try {
					console.log(`[model] Attempting to download from: ${source.url}`)
					// Re-downloading a corrupt model overwrites it in place instead of dropping a
					// second, randomly named copy next to the broken one.
					const path = await utils.downloadModel(source, { replacePath: location?.state?.replacePath })
					if (!path) {
						console.log('[model] Download cancelled')
						return
					}
					console.log(`[model] Download succeeded: ${path}`)
					if (!(await selectDownloadedModel(path))) {
						navigate('/#settings', { replace: true })
						return
					}
					navigate('/', { replace: true, state: { disableBack: true } })
					return
				} catch (err) {
					console.error(`[model] Failed to download from ${source.url}:`, err)
					lastError = err
				}
			}

			throw new Error(`All model downloads failed. Last error: ${errorMessage(lastError)}`)
		} catch (err) {
			console.error(`[model] Unhandled error:`, err)
			setErrorModal?.({ open: true, log: errorMessage(err) })
		}
	}

	async function downloadIfOnline() {
		// Check if online
		const isOnlineResponse = await invoke<boolean>('is_online')
		// If online download model
		if (isOnlineResponse) {
			downloadModel()
		}
		// Update UI
		setIsOnline(isOnlineResponse)
	}

	async function cancelSetup() {
		// Cancel and go to settings
		preference.setSkippedSetup(true)
		emit('abort_download')
		navigate('/#settings', { replace: true, state: { disableBack: true } })
	}

	useEffect(() => {
		downloadIfOnline()
	}, [])

	return {
		navigate,
		cancelSetup,
		setErrorModal,
		downloadProgress,
		downloadIfOnline,
		setDownloadProgress,
		downloadProgressRef,
		isOnline,
		location,
	}
}
