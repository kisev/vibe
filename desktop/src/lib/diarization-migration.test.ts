import { beforeEach, describe, expect, it, vi } from 'vitest'

const askMock = vi.hoisted(() => vi.fn())
const invokeMock = vi.hoisted(() => vi.fn())
const joinMock = vi.hoisted(() => vi.fn(async (dir: string, name: string) => `${dir}/${name}`))
const isUsableMock = vi.hoisted(() => vi.fn())
const downloadMock = vi.hoisted(() => vi.fn())
const deleteMock = vi.hoisted(() => vi.fn())

vi.mock('@tauri-apps/plugin-dialog', () => ({ ask: askMock }))
vi.mock('@tauri-apps/api/core', () => ({ invoke: invokeMock }))
vi.mock('@tauri-apps/api/path', () => ({ join: joinMock }))
vi.mock('sonner', () => ({ toast: { info: vi.fn(), error: vi.fn(), success: vi.fn() } }))
vi.mock('~/paraglide/messages.js', () => ({ m: new Proxy({}, { get: (_t, key: string) => () => key }) }))
vi.mock('~/lib/model', () => ({
	isModelFileUsable: isUsableMock,
	downloadModel: downloadMock,
	deleteModelFile: deleteMock,
}))

import { runDiarizationMigration } from './diarization-migration'
import * as config from '~/lib/config'

const disable = vi.fn()

beforeEach(() => {
	vi.clearAllMocks()
	invokeMock.mockResolvedValue('C:/models')
})

describe('runDiarizationMigration', () => {
	it('does nothing when speaker detection is off', async () => {
		expect(await runDiarizationMigration(false, disable)).toBe('not-needed')
		expect(invokeMock).not.toHaveBeenCalled()
	})

	it('does nothing when the current model is already on disk', async () => {
		isUsableMock.mockResolvedValue(true)
		expect(await runDiarizationMigration(true, disable)).toBe('installed')
		expect(askMock).not.toHaveBeenCalled()
	})

	it('disables the preference with a notice when the download is declined', async () => {
		isUsableMock.mockResolvedValue(false)
		askMock.mockResolvedValue(false)
		expect(await runDiarizationMigration(true, disable)).toBe('declined')
		expect(downloadMock).not.toHaveBeenCalled()
		expect(disable).toHaveBeenCalledOnce()
	})

	it('disables the preference when the download fails', async () => {
		isUsableMock.mockResolvedValue(false)
		askMock.mockResolvedValue(true)
		downloadMock.mockResolvedValue(null)
		expect(await runDiarizationMigration(true, disable)).toBe('declined')
		expect(disable).toHaveBeenCalledOnce()
	})

	it('downloads the replacement and removes every legacy artifact', async () => {
		isUsableMock.mockResolvedValue(false)
		askMock.mockResolvedValue(true)
		downloadMock.mockResolvedValue('C:/models/diar_streaming_sortformer_4spk-v2.q8_0.gguf')
		expect(await runDiarizationMigration(true, disable)).toBe('migrated')
		expect(downloadMock).toHaveBeenCalledWith(
			{ url: config.diarizeModelUrl, ...config.diarizeModelIntegrity },
			{ displayName: config.diarizeModelFilename },
		)
		expect(deleteMock).toHaveBeenCalledTimes(config.legacyDiarizationFilenames.length)
		for (const filename of config.legacyDiarizationFilenames) {
			expect(deleteMock).toHaveBeenCalledWith(`C:/models/${filename}`)
		}
		expect(disable).not.toHaveBeenCalled()
	})

	it('a cleanup failure does not fail the migration', async () => {
		isUsableMock.mockResolvedValue(false)
		askMock.mockResolvedValue(true)
		downloadMock.mockResolvedValue('C:/models/diar_streaming_sortformer_4spk-v2.q8_0.gguf')
		deleteMock.mockRejectedValue(new Error('refused'))
		expect(await runDiarizationMigration(true, disable)).toBe('migrated')
	})
})
