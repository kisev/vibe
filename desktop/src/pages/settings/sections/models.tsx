import { Download, FolderOpen } from 'lucide-react'
import { m } from '~/paraglide/messages.js'
import NumberField from '~/components/number-field'
import { Switch } from '~/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { IconAction, SettingsGroup, SettingsRow, rowControlClass, type SettingsViewModel } from './shared'
import { ModelsCatalogSection } from './models-catalog'
import { getFriendlyModelName } from '~/lib/model'

/**
 * The models settings: hardware knobs and corrupt-file recovery, plus the one
 * catalog section that carries everything about choosing, installing and
 * selecting models (installed entries included, highlighted and sorted first).
 */
export function ModelsSection({ vm }: { vm: SettingsViewModel }) {
	return (
		<div className="space-y-6">
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
