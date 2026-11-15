import { RotateCcw } from 'lucide-react'
import { hidesDecodingOptions } from '~/lib/model'
import { m } from '~/paraglide/messages.js'
import NumberField from '~/components/number-field'
import { Switch } from '~/components/ui/switch'
import { Textarea } from '~/components/ui/textarea'
import { ActionRow, SettingsField, SettingsGroup, SettingsNote, SettingsRow, type SettingsViewModel } from './shared'

import { DEFAULT_MODEL_OPTIONS } from '~/providers/preference'

const textareaClass = 'min-h-24 max-h-60 w-full resize-none overflow-y-auto rounded-lg bg-muted/40 text-sm'

export function WhisperOptionsSection({ vm }: { vm: SettingsViewModel }) {
	const maxThreads = Math.max(1, navigator.hardwareConcurrency || 8)
	const promptLength = vm.preference.modelOptions?.init_prompt?.length ?? 0

	// Each option follows its own capability: translation and prompts stay available on models
	// without Whisper-style decoding, exactly as `withoutUnsupportedOptions` sends them.
	const capabilities = vm.preference.modelMetadata?.capabilities
	const hidesDecoding = hidesDecodingOptions(capabilities)
	const hidesTranslation = capabilities?.translation === false
	const hidesPrompts = capabilities?.text_prompts === false

	return (
		<div className="space-y-6">
			<SettingsGroup>
				{hidesDecoding && <SettingsNote>{m.whisperOnlyOptionsNote()}</SettingsNote>}
				{!hidesTranslation && (
					<>
						<SettingsRow label={m.translateToEnglish()} description={m.infoTranslateToEnglish()}>
							<Switch
								checked={Boolean(vm.preference.modelOptions.translate)}
								onCheckedChange={(checked) => vm.preference.setModelOptions({ ...vm.preference.modelOptions, translate: checked })}
							/>
						</SettingsRow>
						{vm.preference.modelOptions.translate && <SettingsNote>{m.translateWhisperModelNote()}</SettingsNote>}
					</>
				)}

				{!hidesDecoding && (
					<SettingsRow label={m.useWordTimestamps()} description={m.infoUseWordTimestamps()}>
						<Switch
							checked={Boolean(vm.preference.modelOptions.word_timestamps)}
							onCheckedChange={(checked) => vm.preference.setModelOptions({ ...vm.preference.modelOptions, word_timestamps: checked })}
						/>
					</SettingsRow>
				)}

				{!hidesPrompts && (
					<SettingsField
						label={m.prompt()}
						description={m.infoPrompt()}
						footer={promptLength > 0 ? `${1024 - promptLength} ${m.characters()} ${m.leftover().toLowerCase()}` : undefined}>
						<Textarea
							value={vm.preference.modelOptions?.init_prompt}
							onChange={(e) => vm.preference.setModelOptions({ ...vm.preference.modelOptions, init_prompt: e.target.value.slice(0, 1024) })}
							placeholder={m.promptPlaceholder()}
							className={textareaClass}
						/>
					</SettingsField>
				)}
				{capabilities?.text_prompts === false && promptLength > 0 && <SettingsNote>{m.promptIgnoredByModel()}</SettingsNote>}
			</SettingsGroup>

			<SettingsGroup title={m.advanced()}>
				{!hidesDecoding && (
					<>
						<SettingsRow label={m.temperature()} description={m.infoTemperature()}>
							<NumberField
								aria-label={m.temperature()}
								value={vm.preference.modelOptions.temperature ?? 0}
								min={0}
								max={1}
								step={0.1}
								onChange={(value) => vm.preference.setModelOptions({ ...vm.preference.modelOptions, temperature: value })}
							/>
						</SettingsRow>

						<SettingsRow label={m.maxTextCtx()} description={m.infoMaxTextCtx()}>
							<NumberField
								aria-label={m.maxTextCtx()}
								value={vm.preference.modelOptions.max_text_ctx ?? 0}
								min={0}
								max={16384}
								step={64}
								onChange={(value) => vm.preference.setModelOptions({ ...vm.preference.modelOptions, max_text_ctx: value })}
							/>
						</SettingsRow>
					</>
				)}

				<SettingsRow label={m.threads()} description={m.infoThreads()}>
					<NumberField
						aria-label={m.threads()}
						value={vm.preference.modelOptions.n_threads ?? 1}
						min={1}
						max={maxThreads}
						onChange={(value) => vm.preference.setModelOptions({ ...vm.preference.modelOptions, n_threads: value })}
					/>
				</SettingsRow>
			</SettingsGroup>
			{!hidesDecoding && (
				<SettingsGroup>
					<ActionRow
						label={m.resetWhisperOptions()}
						icon={<RotateCcw className="h-4 w-4" />}
						activateOnClick
						onClick={() =>
							vm.preference.setModelOptions({
								...vm.preference.modelOptions,
								...DEFAULT_MODEL_OPTIONS,
								lang: vm.preference.modelOptions.lang,
								verbose: vm.preference.modelOptions.verbose,
								translate: false,
							})
						}
					/>
				</SettingsGroup>
			)}
		</div>
	)
}
