import { EyeOff } from 'lucide-react'
import { m } from '~/paraglide/messages.js'
import { AudioDevice } from '~/lib/audio'
import { deviceMenuEntries, type DeviceMenuEntry } from '~/lib/device-selection'
import { ModifyState } from '~/lib/types'
import { cn } from '~/lib/style'
import { Label } from '~/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/ui/select'

/** "None" and the absent pin get their copy here; a device shows its own name. */
function entryLabel(entry: DeviceMenuEntry) {
	if (entry.kind === 'none') return m.noRecord()
	if (entry.kind === 'unavailable') return m.deviceUnavailable({ name: entry.label })
	return entry.label
}

interface AudioDeviceInputProps {
	type: 'output' | 'input'
	devices: AudioDevice[]
	device: AudioDevice | null
	setDevice: ModifyState<AudioDevice | null>
	/** The pinned device's name when it is absent right now; shown as flagged, never as "none". */
	unavailableName?: string | null
	/** Devices the user excluded from this picker's list. */
	hiddenNames?: string[]
	onHide?: (device: AudioDevice) => void
	onRestore?: (name: string) => void
	/** Called when the dropdown opens, so the caller can refresh the device snapshot. */
	onOpen?: () => void
}

export default function AudioDeviceInput({
	type,
	devices,
	device,
	setDevice,
	unavailableName = null,
	hiddenNames = [],
	onHide,
	onRestore,
	onOpen,
}: AudioDeviceInputProps) {
	const entries = deviceMenuEntries(devices, type, hiddenNames, unavailableName)
	const value = device?.id ?? (unavailableName ? 'unavailable' : 'none')
	const triggerLabel = device?.name ?? (unavailableName ? m.deviceUnavailable({ name: unavailableName }) : m.noRecord())
	const hasHidden = entries.some((entry) => entry.kind === 'hidden')

	return (
		<div className="space-y-2.5 w-full">
			<Label>{type === 'input' ? m.microphone() : m.speakers()}</Label>
			<Select
				value={value}
				onValueChange={(next) => {
					const entry = entries.find((candidate) => candidate.value === next)
					if (!entry) return
					if (entry.kind === 'none') {
						setDevice(null)
						return
					}
					// Selecting a hidden device is the restore gesture: it comes back and is picked.
					if (entry.kind === 'hidden') {
						onRestore?.(entry.label)
						return
					}
					if (entry.kind === 'unavailable') return
					setDevice(entry.device ?? null)
				}}
				onOpenChange={(open) => {
					if (open) onOpen?.()
				}}>
				<SelectTrigger>
					<SelectValue placeholder={m.noRecord()}>{triggerLabel}</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{entries
						.filter((entry) => entry.kind !== 'hidden')
						.map((entry) => (
							<SelectItem
								key={entry.value}
								value={entry.value}
								disabled={entry.kind === 'unavailable'}
								onKeyDown={(event) => {
									// The nested hide button is unreachable by Tab (the select keeps focus on
									// the option), so Delete on a focused device is its keyboard gesture.
									if (entry.kind !== 'device' || !onHide || (event.key !== 'Delete' && event.key !== 'Backspace')) return
									event.preventDefault()
									event.stopPropagation()
									if (entry.device) onHide(entry.device)
								}}>
								<span className={cn('flex items-center justify-between gap-2', entry.kind === 'unavailable' && 'opacity-60')}>
									{entryLabel(entry)}
									{entry.kind === 'device' && onHide && (
										<button
											type="button"
											aria-label={m.hideDevice({ name: entry.label })}
											// The SelectItem claims pointer events across its whole row: mouse
											// selection happens on its pointerup, so a stopPropagation on click
											// alone is too late — the item has already selected the device and
											// closed the dropdown. Stop the pointer events in the capture phase,
											// where the button still precedes the item's handlers. The click is
											// left alone on purpose: one synthetic traversal serves both phases,
											// so stopping it in capture would silence this button's own onClick.
											onPointerDownCapture={(event) => event.stopPropagation()}
											onPointerUpCapture={(event) => event.stopPropagation()}
											// Keyboard activation must hide, not fall through to the item's own
											// Enter/Space selection: handle it here and swallow the key.
											onKeyDownCapture={(event) => {
												if (event.key !== 'Enter' && event.key !== ' ') return
												event.preventDefault()
												event.stopPropagation()
												if (entry.device) onHide(entry.device)
											}}
											onClick={(event) => {
												event.stopPropagation()
												if (entry.device) onHide(entry.device)
											}}
											className="text-muted-foreground hover:text-foreground">
											<EyeOff className="h-3.5 w-3.5" />
										</button>
									)}
								</span>
							</SelectItem>
						))}
					{hasHidden && onRestore && (
						<SelectGroup>
							{/* SelectLabel reads the group context; outside a SelectGroup it throws. */}
							<SelectLabel>{m.hiddenDevices()}</SelectLabel>
							{entries
								.filter((entry) => entry.kind === 'hidden')
								.map((entry) => (
									<SelectItem key={entry.value} value={entry.value} className="text-muted-foreground">
										{entry.label}
									</SelectItem>
								))}
						</SelectGroup>
					)}
				</SelectContent>
			</Select>
		</div>
	)
}
