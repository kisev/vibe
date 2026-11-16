// @vitest-environment jsdom

import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SessionProvider } from './session'

const mocks = vi.hoisted(() => {
	const listeners = new Map<string, (event: { payload: unknown }) => void>()
	const preference = {
		modelPath: '/models/model.gguf',
		projectsPath: '/projects',
		skippedSetup: false,
		closeToTray: false,
		modelOptions: { lang: 'en' },
		advancedTranscribeOptions: { includeSubFolders: false },
		autoTranscribeAfterRecording: false,
		setModelPath: vi.fn(),
	}
	const recording = {
		isRecording: false,
		ownsRecording: false,
		startedAt: null as number | null,
		inputDevice: null,
		outputDevice: null,
		setIsRecording: vi.fn(),
		adoptRecording: vi.fn(),
	}
	const shortcut = {
		isShortcutRecording: false,
		shortcutStartedAt: null as number | null,
		shortcutDevices: null as { input: string | null; output: string | null } | null,
		setNormalRecordingActive: vi.fn(),
	}
	const queue = {
		jobs: [] as unknown[],
		running: false,
		enqueue: vi.fn(),
		hydrate: vi.fn(),
		transcribeJob: vi.fn(),
		reset: vi.fn(),
	}
	return {
		listeners,
		preference,
		recording,
		shortcut,
		queue,
		summaries: {},
		link: {},
		emit: vi.fn<(name: string, payload: unknown) => Promise<void>>(async () => {}),
		invoke: vi.fn(async () => undefined),
		saveTranscript: vi.fn(async () => null),
		isComparisonClipPending: vi.fn(() => false),
		errorState: { setState: vi.fn() },
	}
})

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('@tauri-apps/api/event', () => ({
	listen: vi.fn(async (name: string, callback: (event: { payload: unknown }) => void) => {
		mocks.listeners.set(name, callback)
		return () => {
			mocks.listeners.delete(name)
		}
	}),
	emit: mocks.emit,
}))
vi.mock('@tauri-apps/api', () => ({
	webviewWindow: { getCurrentWebviewWindow: () => ({ show: async () => {}, setFocus: async () => {} }) },
}))
vi.mock('@tauri-apps/plugin-dialog', () => ({ open: vi.fn(), message: vi.fn() }))
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), warning: vi.fn() } }))
vi.mock('~/lib/config', () => ({ audioExtensions: ['wav'], videoExtensions: ['mp4'] }))
vi.mock('~/lib/fs', () => ({ pathToNamedPath: async (path: string) => ({ name: path, path }) }))
vi.mock('~/lib/model', () => ({
	cleanupPartialDownloads: vi.fn(async () => {}),
	listInstalledModels: vi.fn(async () => [{ name: 'model.gguf', path: '/models/model.gguf', valid: true }]),
}))
vi.mock('~/lib/project-name', () => ({ autoProjectName: (name: string) => name }))
vi.mock('~/lib/transcripts-store', () => ({
	notifyTranscriptsChanged: vi.fn(),
	saveTranscript: mocks.saveTranscript,
	TRANSCRIPT_VERSION: 1,
}))
vi.mock('~/lib/use-confirm-exit', () => ({ useConfirmExit: vi.fn() }))
vi.mock('~/lib/meeting-browser', () => ({ RECORDING_STATE_EVENT: 'recording-state' }))
vi.mock('~/providers/hotkey', () => ({ hotkeyRecordingActive: false }))
vi.mock('~/providers/recording-shortcut', () => ({ useRecordingShortcut: () => mocks.shortcut }))
vi.mock('~/providers/error-modal', async () => {
	const { createContext } = await import('react')
	return { ErrorModalContext: createContext(mocks.errorState) }
})
vi.mock('~/providers/preference', () => ({ usePreferenceProvider: () => mocks.preference }))
vi.mock('~/pages/home/hooks/use-audio-download', () => ({ useAudioDownload: () => mocks.link }))
vi.mock('~/pages/home/hooks/use-recording', () => ({ useRecording: () => mocks.recording }))
vi.mock('./hooks/use-drop-target', () => ({ useDropTarget: () => false }))
vi.mock('./hooks/use-summaries', () => ({ useSummaries: () => mocks.summaries }))
vi.mock('./hooks/use-transcribe-queue', () => ({ useTranscribeQueue: () => mocks.queue }))
vi.mock('~/pages/recording-ownership', () => ({
	OWN_RECORDING_REPORT: 'session',
	isComparisonClipPending: mocks.isComparisonClipPending,
}))

beforeEach(() => {
	mocks.listeners.clear()
	mocks.emit.mockClear()
	mocks.invoke.mockReset().mockResolvedValue(undefined)
	mocks.recording.adoptRecording.mockClear()
	mocks.recording.setIsRecording.mockClear()
	mocks.saveTranscript.mockReset().mockResolvedValue(null)
	mocks.isComparisonClipPending.mockReset().mockReturnValue(false)
})

afterEach(cleanup)

function renderProvider() {
	return render(
		<SessionProvider>
			<div />
		</SessionProvider>,
	)
}

describe('recording state ownership', () => {
	it('does not adopt the recording state this window published itself', async () => {
		renderProvider()
		await waitFor(() => expect(mocks.emit).toHaveBeenCalled())

		const call = mocks.emit.mock.calls.find(([name]) => name === 'recording-state')
		expect(call).toBeTruthy()
		const payload = call![1] as { origin?: string; recording: boolean }
		expect(payload).toMatchObject({ recording: false, origin: 'session' })

		// emit() also delivers to the emitting window; replay that echo through the listener.
		act(() => mocks.listeners.get('recording-state')?.({ payload }))
		expect(mocks.recording.adoptRecording).not.toHaveBeenCalled()

		// A report from another surface (the meeting gate) is still adopted.
		act(() => mocks.listeners.get('recording-state')?.({ payload: { recording: true, startedAt: 42 } }))
		expect(mocks.recording.adoptRecording).toHaveBeenCalledWith(true, 42)
	})

	it('leaves a comparison-lab clip to the lab instead of saving it as a project', async () => {
		renderProvider()
		await waitFor(() => expect(mocks.listeners.has('record_finish')).toBe(true))

		mocks.isComparisonClipPending.mockReturnValue(true)
		await act(async () => {
			await mocks.listeners.get('record_finish')?.({ payload: { path: '/tmp/clip.wav', name: 'clip.wav' } })
		})
		expect(mocks.saveTranscript).not.toHaveBeenCalled()

		// Any other finished recording is still saved as a project.
		mocks.isComparisonClipPending.mockReturnValue(false)
		await act(async () => {
			await mocks.listeners.get('record_finish')?.({ payload: { path: '/tmp/take.wav', name: 'take.wav' } })
		})
		expect(mocks.saveTranscript).toHaveBeenCalled()
	})
})
