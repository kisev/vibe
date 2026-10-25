import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'
import { useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { m } from '~/paraglide/messages.js'
import { ErrorModalContext } from '~/providers/error-modal'
import { usePreferenceProvider } from '~/providers/preference'
import * as utils from '~/lib/model'
import * as osExt from '@tauri-apps/plugin-os'
import * as config from '~/lib/config'
import { ask } from '@tauri-apps/plugin-dialog'
import { join } from '@tauri-apps/api/path'
import { ensureVadModel } from '~/lib/vad'
import { downloadSnapshot, subscribeDownloads } from '~/lib/downloads'

export function viewModel() {
	const location = useLocation()
	const [downloadProgress, setDownloadProgress] = useState(0)
	const [isOnline, setIsOnline] = useState<boolean | null>(null)
	const downloadProgressRef = useRef(0)
	const { setState: setErrorModal } = useContext(ErrorModalContext)
	const navigate = useNavigate()
	const preference = usePreferenceProvider()

	// The setup progress bar follows the download registry: the latest-touched
	// download, resetting when the source switches to a fallback URL.
	const latestNameRef = useRef<string | null>(null)
	useEffect(
		() =>
			subscribeDownloads(() => {
				const { latest } = downloadSnapshot()
				if (!latest) return
				if (latest.name !== latestNameRef.current) {
					latestNameRef.current = latest.name
					downloadProgressRef.current = 0
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

	async function ensureRequiredVad(metadata: utils.ModelMetadata | null) {
		const modelsFolder = await invoke<string>('get_models_folder')
		const vadPath = await join(modelsFolder, config.vadModelFilename)
		return ensureVadModel({
			metadata,
			vadPath,
			isUsable: utils.isModelFileUsable,
			confirm: () => ask(m.downloadRequiredVadModelQuestion(), { title: m.downloadRequiredVadModel(), kind: 'info' }),
			download: async (url, path) => {
				await invoke('download_model', { url, path })
			},
		})
	}

	async function selectDownloadedModel(modelPath: string) {
		const metadata = await readModelMetadata(modelPath)
		if (!(await ensureRequiredVad(metadata))) return false
		preference.setModelMetadata(metadata)
		if (metadata) {
			// A freshly downloaded model may not support the language left over from before.
			preference.setModelOptions({
				...preference.modelOptions,
				lang: utils.resolveModelLanguage(metadata.capabilities, preference.modelOptions.lang),
			})
		}
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

			throw new Error(`All model downloads failed. Last error: ${lastError}`)
		} catch (err) {
			console.error(`[model] Unhandled error:`, err)
			setErrorModal?.({ open: true, log: String(err) })
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
