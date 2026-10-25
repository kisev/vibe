import { useState } from 'react'
import { Check, Download, FolderOpen, Pencil, X } from 'lucide-react'
import { m } from '~/paraglide/messages.js'
import NumberField from '~/components/number-field'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Badge } from '~/components/ui/badge'
import { IconAction, SettingsGroup, SettingsNote, SettingsRow, rowControlClass, type SettingsViewModel } from './shared'
import { CardMeta, ScoreBar, ModelsCatalogSection } from './models-catalog'
import { entryScores, matchInstalled } from '~/lib/catalog'
import { getFriendlyModelName, modelLimitations } from '~/lib/model'
import type { NamedPath } from '~/lib/types'

/**
 * One installed model: friendly name (or the user's rename), active marker, and
 * — when the file matches a catalog entry — the same metadata the catalog cards
 * show. Files the catalog doesn't know (manual downloads) still work; they just
 * render without catalog metadata.
 */
function InstalledCard({
	vm,
	model,
	editing,
	onStartRename,
	onCommitRename,
	onCancelRename,
	editingName,
	setEditingName,
}: {
	vm: SettingsViewModel
	model: NamedPath
	editing: boolean
	editingName: string
	setEditingName: (value: string) => void
	onStartRename: () => void
	onCommitRename: () => void
	onCancelRename: () => void
}) {
	const displayName = vm.preference.modelDisplayNames[model.path] ?? getFriendlyModelName(model.name)
	const active = model.path === vm.preference.modelPath
	const match = matchInstalled(model.name)
	const scores = match ? entryScores(match.model) : undefined

	return (
		<div className="space-y-2.5 px-4 py-3">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-foreground">{displayName}</span>
						{active && !editing && <Badge>{m.catalogActive()}</Badge>}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					{editing ? (
						<>
							<Input
								autoFocus
								value={editingName}
								onChange={(event) => setEditingName(event.target.value)}
								onKeyDown={(event) => {
									if (event.key === 'Enter') onCommitRename()
									if (event.key === 'Escape') onCancelRename()
								}}
								className={`w-56 ${rowControlClass}`}
							/>
							<IconAction variant="outline" label={m.save()} icon={<Check className="h-4 w-4" />} onClick={onCommitRename} />
							<IconAction variant="outline" label={m.cancel()} icon={<X className="h-4 w-4" />} onClick={onCancelRename} />
						</>
					) : (
						<>
							{!active && <IconAction variant="outline" label={m.catalogUse()} icon={<Check className="h-4 w-4" />} onClick={() => vm.selectModel(model.path)} />}
							<IconAction variant="outline" label={m.rename()} icon={<Pencil className="h-4 w-4" />} onClick={onStartRename} />
							<IconAction variant="outline" label={m.showInFolder()} icon={<FolderOpen className="h-4 w-4" />} onClick={() => vm.openSelectedModel(model.path)} />
						</>
					)}
				</div>
			</div>

			{match && <CardMeta model={match.model} sizeBytes={match.file.size} />}

			{scores && (scores.accuracy !== undefined || scores.speed !== undefined) && (
				<div className="space-y-1.5">
					{scores.accuracy !== undefined && <ScoreBar label={m.catalogAccuracy()} score={scores.accuracy} />}
					{scores.speed !== undefined && <ScoreBar label={m.catalogSpeed()} score={scores.speed} />}
				</div>
			)}
		</div>
	)
}

export function ModelsSection({ vm }: { vm: SettingsViewModel }) {
	const [editingPath, setEditingPath] = useState<string | null>(null)
	const [editingName, setEditingName] = useState('')

	function commitRename(model: NamedPath) {
		const name = editingName.trim()
		if (name) vm.preference.setModelDisplayNames({ ...vm.preference.modelDisplayNames, [model.path]: name })
		setEditingPath(null)
	}

	return (
		<div className="space-y-6">
			{vm.models.length > 0 && (
				<SettingsGroup title={m.catalogInstalled()}>
					{vm.models.map((model) => (
						<InstalledCard
							key={model.path}
							vm={vm}
							model={model}
							editing={editingPath === model.path}
							editingName={editingName}
							setEditingName={setEditingName}
							onStartRename={() => {
								setEditingPath(model.path)
								setEditingName(vm.preference.modelDisplayNames[model.path] ?? getFriendlyModelName(model.name))
							}}
							onCommitRename={() => commitRename(model)}
							onCancelRename={() => setEditingPath(null)}
						/>
					))}
				</SettingsGroup>
			)}

			{modelLimitations(vm.preference.modelMetadata?.capabilities).length > 0 && (
				<SettingsGroup title={m.modelLimitations()}>
					<SettingsNote>
						{modelLimitations(vm.preference.modelMetadata?.capabilities)
							.map((limitation) => {
								switch (limitation.kind) {
									case 'language':
										return m.modelLimitationLanguage({ language: limitation.language })
									case 'streaming':
										return m.modelLimitationStreaming()
									case 'translation':
										return m.modelLimitationTranslation()
									case 'prompts':
										return m.modelLimitationPrompts()
								}
							})
							.join(' ')}
					</SettingsNote>
				</SettingsGroup>
			)}

			<SettingsGroup title={m.settingsHardware()}>
				<SettingsRow label={m.transcribeOnCpu()} description={m.transcribeOnCpuInfo()}>
					<Switch checked={vm.preference.noGpu} onCheckedChange={vm.preference.setNoGpu} aria-label={m.transcribeOnCpu()} />
				</SettingsRow>

				{!vm.isMacOS && !vm.preference.noGpu && (
					<SettingsRow label={m.gpuDevice()}>
						{vm.gpuDevices.length > 0 ? (
							<Select
								value={vm.preference.gpuDevice != null ? String(vm.preference.gpuDevice) : 'auto'}
								onValueChange={(value) => {
									vm.preference.setGpuDevice(value === 'auto' ? null : parseInt(value, 10))
								}}>
								<SelectTrigger className={`w-56 ${rowControlClass}`}>
									<SelectValue placeholder={m.gpuDevice()} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="auto">{m.auto()}</SelectItem>
									{vm.gpuDevices.map((device) => (
										<SelectItem key={device.index} value={String(device.index)}>
											{device.description}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : (
							<NumberField
								aria-label={m.gpuDevice()}
								value={vm.preference.gpuDevice ?? -1}
								min={-1}
								max={16}
								// Below zero means "no device pinned" — the placeholder the empty field used to show.
								format={(device) => (device < 0 ? m.auto() : undefined)}
								onChange={(value) => vm.preference.setGpuDevice(value < 0 ? null : value)}
							/>
						)}
					</SettingsRow>
				)}
			</SettingsGroup>

			{vm.corruptModels.length > 0 && (
				<SettingsGroup title={m.modelFileCorrupt()}>
					{vm.corruptModels.map((model) => (
						<SettingsRow
							key={model.path}
							label={getFriendlyModelName(model.name)}
							description={m.modelFileCorruptDescription({ name: model.name })}>
							<IconAction label={m.reDownload()} icon={<Download className="h-4 w-4" />} onClick={() => vm.redownloadModel(model)} />
							<IconAction label={m.showInFolder()} icon={<FolderOpen className="h-4 w-4" />} onClick={() => vm.openSelectedModel(model.path)} />
						</SettingsRow>
					))}
				</SettingsGroup>
			)}

			<ModelsCatalogSection vm={vm} />
		</div>
	)
}
