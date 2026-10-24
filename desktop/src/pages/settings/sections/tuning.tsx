import { ChevronRight, SlidersHorizontal, AudioLines } from 'lucide-react'
import { DEFAULT_MODEL_OPTIONS } from '~/providers/preference'
import { hidesWhisperOnlyOptions } from '~/lib/model'
import { m } from '~/paraglide/messages.js'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { ActionRow, SettingsGroup, SettingsNote, SettingsRow, type SettingsViewModel } from './shared'

/** '' means the engine default; anything finite is clamped into [1, max]. The UI clamps for
 * friendliness while the server stays the source of truth. */
export function parseChunkSeconds(raw: string, max: number): number | null {
	if (raw === '') return null
	const parsed = Number(raw)
	if (!Number.isFinite(parsed)) return null
	return Math.max(1, Math.min(parsed, max))
}

export function TuningSection({ vm, onOpenWhisper, onOpenAudio }: { vm: SettingsViewModel; onOpenWhisper: () => void; onOpenAudio: () => void }) {
	const options = vm.preference.modelOptions
	const whisperOnlyHidden = hidesWhisperOnlyOptions(vm.preference.modelMetadata?.capabilities)
	const customized =
		Boolean(options.translate) ||
		(Object.keys(DEFAULT_MODEL_OPTIONS) as (keyof typeof DEFAULT_MODEL_OPTIONS)[])
			.filter((key) => key !== 'lang' && key !== 'verbose')
			.some((key) => (options[key] ?? DEFAULT_MODEL_OPTIONS[key]) !== DEFAULT_MODEL_OPTIONS[key])

	return (
		<div className="space-y-6">
			<SettingsGroup>
				<SettingsRow label={m.enableDiarization()} description={m.infoDiarization()}>
					<Switch checked={vm.preference.diarizeEnabled} onCheckedChange={vm.toggleDiarization} />
				</SettingsRow>
				{vm.preference.diarizeEnabled && <SettingsNote>{m.diarizeMaxSpeakersNote()}</SettingsNote>}
				{!whisperOnlyHidden && (
					<>
						<SettingsRow label={m.enableStableTimestamps()} description={m.stableTimestampsInfo()}>
							<Switch checked={vm.preference.stableTimestampsEnabled} onCheckedChange={vm.handleStableTimestampsToggle} />
						</SettingsRow>
						{vm.preference.stableTimestampsEnabled && <SettingsNote>{m.stableTimestampsSlowNote()}</SettingsNote>}
					</>
				)}
				{whisperOnlyHidden && <SettingsNote>{m.whisperOnlyOptionsNote()}</SettingsNote>}
			</SettingsGroup>
			{vm.preference.modelMetadata?.capabilities.max_input_seconds != null && (
				<SettingsGroup title={m.longRecordings()}>
					<SettingsRow
						label={m.chunkLength()}
						description={m.chunkLengthInfo({ max: vm.preference.modelMetadata.capabilities.max_input_seconds })}>
						<Input
							type="number"
							min={1}
							max={vm.preference.modelMetadata.capabilities.max_input_seconds}
							step={1}
							aria-label={m.chunkLength()}
							className="w-24"
							value={vm.preference.chunkSeconds ?? ''}
							onChange={(event) => {
								const parsed = parseChunkSeconds(event.target.value, vm.preference.modelMetadata!.capabilities.max_input_seconds!)
								vm.preference.setChunkSeconds(parsed)
							}}
						/>
					</SettingsRow>
				</SettingsGroup>
			)}
			<SettingsGroup>
				{!whisperOnlyHidden && (
					<ActionRow
						label={
							<span className="flex items-center gap-2">
								<SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
								{m.whisperOptions()}
								{customized && (
									<span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{m.tuningCustomized()}</span>
								)}
							</span>
						}
						description={m.whisperOptionsInfo()}
						icon={<ChevronRight className="h-4 w-4 rtl:rotate-180" />}
						activateOnClick
						onClick={onOpenWhisper}
					/>
				)}
				<ActionRow
					label={
						<span className="flex items-center gap-2">
							<AudioLines className="h-4 w-4 text-muted-foreground" />
							{m.audioProcessing()}
						</span>
					}
					description={m.audioProcessingInfo()}
					icon={<ChevronRight className="h-4 w-4 rtl:rotate-180" />}
					activateOnClick
					onClick={onOpenAudio}
				/>
			</SettingsGroup>
		</div>
	)
}
