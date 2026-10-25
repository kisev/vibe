export const aboutURL = 'https://kisev.github.io/vibe/'
export const repoURL = 'https://github.com/kisev/vibe'
export const updateVersionURL = 'https://github.com/kisev/vibe/releases/latest'
export const modelsDocURL = 'https://kisev.github.io/vibe/docs#models'
/**
 * Release notes. With a version it opens that release, otherwise the whole list —
 * the page falls back to English for a release this locale has not translated.
 */
export const changelogURL = (version?: string) => `https://kisev.github.io/vibe/changelog${version ? `/${version}` : ''}`
export const discordURL = 'https://discord.gg/EcxWSstQN8'
export const supportVibeURL = 'https://thewh1teagle.github.io/vibe/?action=support-vibe'
export const privacyPolicyURL = 'https://thewh1teagle.github.io/vibe/?action=open-privacy-policy'
export const storeFilename = 'app_config.json'

/** What the catalog knows about a finished download, beyond the bytes themselves. */
export interface ModelIntegrity {
	/** Exact size in bytes of the published artifact. */
	size?: number
	/** Lowercase hex SHA-256 of the published artifact. */
	sha256?: string
}

/** One downloadable model. Only catalog entries carry integrity metadata — a URL the user pastes
 * into settings or opens with `vibe://download/?url=` never does, and falls back to the size and
 * magic-byte checks the backend runs on every download. */
export interface ModelDownload extends ModelIntegrity {
	url: string
}

// Every URL comes from the bundled model catalog with its pinned revision and
// real size + SHA-256, so magic setup downloads exactly the verified artifact
// the settings catalog offers — no floating `main` links, no legacy .bin files
// the unified engine refuses to load.
export const modelUrls: Record<'default' | 'hebrew', ModelDownload[]> = {
	default: [
		{
			url: 'https://huggingface.co/handy-computer/whisper-large-v3-turbo-gguf/resolve/5eaf945c7978e564bae5b28a5b1639dd93c2bfb1/whisper-large-v3-turbo-Q8_0.gguf',
			size: 886381760,
			sha256: 'b2e30cc286bc9f3aba4db9099fc7403543497c05ce7100d0d83091ddfd25a183',
		},
	],
	hebrew: [
		{
			url: 'https://huggingface.co/vibe-app/parakeet-tdt-0.6b-v3-he-gguf/resolve/740e0ca8957f142803b4a2d534d47eb1b4f75c9d/parakeet-tdt-0.6b-v3-he-q8_0.gguf',
			size: 758224288,
			sha256: '37a6787344617fd7402397cd7ec4dd4f4bda779cb3112ac571e7b3329194e8dd',
		},
	],
}

/**
 * GigaAM v3 (Russian). Published by handy-computer rather than the vibe-app org, so the catalog
 * links straight at Hugging Face. The other v3 variants in the same org — `rnnt`, `ctc`, and
 * `e2e-ctc` — use the same filename pattern.
 */
export const gigaamModelFilename = 'gigaam-v3-e2e-rnnt-Q8_0.gguf'
export const gigaamModelUrl =
	'https://huggingface.co/handy-computer/gigaam-v3-e2e-rnnt-gguf/resolve/f719d70812344f4d0fb8c11c0887b190501a7465/gigaam-v3-e2e-rnnt-Q8_0.gguf'
export const gigaamModelSha256 = '78d63b47723b7f8d78c6113a6ef983b5a86e2a86f6c273e1f5cb6967b1c4467a'
export const gigaamModelSize = 273724832

export const embeddingModelFilename = 'wespeaker_en_voxceleb_CAM++.onnx'
export const segmentModelFilename = 'segmentation-3.0.onnx'
export const embeddingModelUrl = 'https://github.com/thewh1teagle/vibe/releases/download/v0.0.1/wespeaker_en_voxceleb_CAM++.onnx'
export const segmentModelUrl = 'https://github.com/thewh1teagle/vibe/releases/download/v0.0.1/segmentation-3.0.onnx'

/**
 * Diarization runs NVIDIA Sortformer on ggml now, not ONNX Runtime, so this is a GGUF built from
 * the original `.nemo` checkpoint rather than an ONNX export. Q8_0: the k-quant tiers are unsafe
 * for this model — its speaker-cache compression makes discrete near-tie decisions that quant
 * error can flip, permuting speaker labels mid-stream.
 *
 * Mirrored into the vibe-app org from `nvidia/diar_streaming_sortformer_4spk-v2` (cc-by-4.0).
 *
 * Anyone upgrading still has the old `.onnx` sitting in their models folder. Nothing reads it any
 * more and it is not a `.gguf`/`.bin`, so it stays invisible to the model listing; the gate simply
 * finds this file missing and offers the download. Deleting the stale 492 MB file is left to them.
 */
export const diarizeModelFilename = 'diar_streaming_sortformer_4spk-v2.q8_0.gguf'
export const diarizeModelUrl = 'https://huggingface.co/vibe-app/diar-streaming-sortformer-4spk-v2-gguf/resolve/main/diar_streaming_sortformer_4spk-v2.q8_0.gguf'
export const diarizeModelIntegrity: ModelIntegrity = {
	size: 147075776,
	sha256: '0679cfeb1ce356d0dea9470b31274f4bfc7eb927497d82005483770666da998a',
}
export const vadModelFilename = 'ggml-silero-v6.2.0.bin'
export const vadModelUrl = 'https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v6.2.0.bin'

export const llmApiKeyUrl = 'https://console.anthropic.com/settings/keys'
export const llmDefaultMaxTokens = 8192 // https://docs.anthropic.com/en/docs/about-claude/models
export const llmLimitsUrl = 'https://console.anthropic.com/settings/limits'
export const llmCostUrl = 'https://console.anthropic.com/settings/cost'

export const ytDlpAssetNames: Record<string, string> = {
	'windows-x86_64': 'yt-dlp.exe',
	'windows-aarch64': 'yt-dlp_arm64.exe',
	'linux-x86_64': 'yt-dlp_linux',
	'linux-aarch64': 'yt-dlp_linux_aarch64',
	'macos-x86_64': 'yt-dlp_macos',
	'macos-aarch64': 'yt-dlp_macos',
}

export function ytDlpDownloadUrl(version: string, key: string): string {
	return `https://github.com/yt-dlp/yt-dlp/releases/download/${version}/${ytDlpAssetNames[key]}`
}

export const videoExtensions = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'webm', 'mxf']
export const audioExtensions = ['mp3', 'wav', 'aac', 'flac', 'oga', 'ogg', 'opic', 'opus', 'm4a', 'm4b', 'wma']
export const themes = ['light', 'dark']
export const defaultAutoSummarizeOnFinish = false

/**
 * Default dictation shortcut: Option+Space on macOS, Ctrl+Space elsewhere. Resolved on call rather
 * than at module scope: reading the platform at import time makes this file unimportable outside a
 * webview (and untestable).
 */
export function getDefaultHotkeyShortcut() {
	const isMac = navigator.platform.toUpperCase().includes('MAC')
	return isMac ? 'Alt+Space' : 'Ctrl+Space'
}

/** Global recording uses one portable accelerator on every desktop platform. */
export function getDefaultRecordingShortcut() {
	return 'CmdOrCtrl+Shift+R'
}
