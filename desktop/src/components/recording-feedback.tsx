// Shared recording feedback for the main window and the browser chrome. Both surfaces read the
// same app-wide `record_level` events: one payload per captured source, ~10 times a second, with
// level 0 when that source is open but silent. Nothing here captures audio or owns the recorder.
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { message } from '@tauri-apps/plugin-dialog'
import { AlertTriangle, Mic, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { m } from '~/paraglide/messages.js'
import { cn } from '~/lib/style'

/** Which captured source a level belongs to. Mirrors `RecordLevelDevice` on the Rust side. */
export type RecordLevelDevice = 'microphone' | 'system'

export const RECORD_LEVEL_EVENT = 'record_level'

/** A source below this level counts as silence for the marker. */
const SILENCE_LEVEL = 0.03
/** A source that stays quiet this long while recording is marked silent. */
const SILENCE_HOLD_MS = 1500
const METER_TICK_MS = 60
/** No event for this long means the stream stalled — let the target fall back to zero. */
const LEVEL_STALE_MS = 160

export interface SourceFeedback {
	level: number
	silent: boolean
}

const DEVICES: RecordLevelDevice[] = ['microphone', 'system']

/** Elapsed whole seconds since `startedAt`, ticking twice a second so the clock never lags. */
export function useElapsedSeconds(startedAt: number | null): number {
	const [elapsed, setElapsed] = useState(0)

	useEffect(() => {
		if (startedAt === null) {
			setElapsed(0)
			return
		}
		const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)))
		tick()
		const timer = window.setInterval(tick, 500)
		return () => window.clearInterval(timer)
	}, [startedAt])

	return elapsed
}

export function formatElapsed(seconds: number): string {
	const minutes = Math.floor(seconds / 60)
	return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

/**
 * Per-source smoothed levels plus the silence flag. A source is silent once the recording has run
 * for the hold window and that source has produced no sound for the same window, so a wrong or
 * dead device shows up during the call rather than in a silent file afterwards.
 */
export function useSourceFeedback(active: boolean, startedAt: number | null): Record<RecordLevelDevice, SourceFeedback> {
	const [levels, setLevels] = useState<Record<RecordLevelDevice, number>>({ microphone: 0, system: 0 })
	const [silent, setSilent] = useState<Record<RecordLevelDevice, boolean>>({ microphone: false, system: false })

	useEffect(() => {
		if (!active) {
			setLevels({ microphone: 0, system: 0 })
			setSilent({ microphone: false, system: false })
			return
		}

		const begin = startedAt ?? Date.now()
		const target: Record<RecordLevelDevice, number> = { microphone: 0, system: 0 }
		const lastEvent: Record<RecordLevelDevice, number> = { microphone: begin, system: begin }
		const lastSound: Record<RecordLevelDevice, number> = { microphone: begin, system: begin }
		// A source that never sent a single event is not captured at all (the recorder was started
		// without it); an open but quiet source trickles level 0. Only the latter can be "silent".
		const captured: Record<RecordLevelDevice, boolean> = { microphone: false, system: false }
		setLevels({ microphone: 0, system: 0 })
		setSilent({ microphone: false, system: false })

		const unlisten = listen<{ device?: RecordLevelDevice; level?: number }>(RECORD_LEVEL_EVENT, ({ payload }) => {
			const device = payload?.device
			if (device !== 'microphone' && device !== 'system') return
			const next = typeof payload.level === 'number' && Number.isFinite(payload.level) ? Math.min(Math.max(payload.level, 0), 1) : 0
			target[device] = next
			lastEvent[device] = Date.now()
			captured[device] = true
			if (next > SILENCE_LEVEL) lastSound[device] = Date.now()
		})

		const timer = window.setInterval(() => {
			const now = Date.now()
			// Decay outside the updater: React may call it more than once, and a doubled decay
			// would drop a dead device twice per tick.
			for (const device of DEVICES) {
				// A dead device emits nothing at all — decay so it can't freeze mid-bar.
				if (now - lastEvent[device] > LEVEL_STALE_MS) target[device] *= 0.6
			}
			setLevels((previous) => {
				let changed = false
				const next = { ...previous }
				for (const device of DEVICES) {
					// Fast attack, slower release: peaks stay legible, the fall stays calm.
					const goal = target[device]
					const eased = previous[device] + (goal - previous[device]) * (goal > previous[device] ? 0.7 : 0.3)
					next[device] = Math.abs(eased - goal) < 0.004 ? goal : eased
					changed ||= next[device] !== previous[device]
				}
				return changed ? next : previous
			})
			const runningFor = now - begin
			setSilent((previous) => {
				const next = {
					microphone: captured.microphone && runningFor >= SILENCE_HOLD_MS && now - lastSound.microphone >= SILENCE_HOLD_MS,
					system: captured.system && runningFor >= SILENCE_HOLD_MS && now - lastSound.system >= SILENCE_HOLD_MS,
				}
				return next.microphone === previous.microphone && next.system === previous.system ? previous : next
			})
		}, METER_TICK_MS)

		return () => {
			window.clearInterval(timer)
			unlisten.then((fn) => fn())
		}
	}, [active, startedAt])

	return {
		microphone: { level: levels.microphone, silent: silent.microphone },
		system: { level: levels.system, silent: silent.system },
	}
}

/** One labelled source: its device name and a plain bar, with a silent marker when it stays flat. */
function SourceMeter({ label, name, feedback }: { label: string; name: string; feedback: SourceFeedback }) {
	const percent = Math.round(feedback.level * 100)

	return (
		<div className="min-w-0 space-y-1.5">
			<div className="flex min-w-0 items-baseline justify-between gap-2">
				<span className="shrink-0 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">{label}</span>
				<span className="min-w-0 flex-1 truncate text-end text-xs text-foreground/80">{name}</span>
				{feedback.silent && (
					<span
						role="status"
						className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
						<AlertTriangle className="h-3 w-3" aria-hidden />
						{m.recordingSilent()}
					</span>
				)}
			</div>
			<div
				role="meter"
				aria-label={`${label} ${name}`}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
				className={cn('h-2 w-full overflow-hidden rounded-full bg-muted', feedback.silent && 'opacity-50')}>
				<div
					className="h-full rounded-full bg-foreground transition-[width] duration-75 ease-out"
					style={{ width: `${Math.max(percent, 2)}%` }}
				/>
			</div>
		</div>
	)
}

/** A hairline meter for the chrome, where the pickers already name the devices. */
function CompactMeter({ label, name, feedback, icon: Icon }: { label: string; name: string; feedback: SourceFeedback; icon: typeof Mic }) {
	const percent = Math.round(feedback.level * 100)

	return (
		<div className="flex shrink-0 items-center gap-1.5" title={`${label}: ${name}`}>
			<Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
			<div
				role="meter"
				aria-label={`${label} ${name}`}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={percent}
				className={cn('h-1.5 w-10 overflow-hidden rounded-full bg-muted', feedback.silent && 'opacity-50')}>
				<div className="h-full rounded-full bg-foreground transition-[width] duration-75 ease-out" style={{ width: `${Math.max(percent, 2)}%` }} />
			</div>
			{feedback.silent && <span className="text-[10px] text-muted-foreground">{m.recordingSilent()}</span>}
		</div>
	)
}

interface RecordingIndicatorProps {
	/** Epoch ms the recording began; null means idle and nothing is shown. */
	startedAt: number | null
	/** Device names actually captured, as the recorder resolved them. */
	microphoneName: string
	systemName: string
	/** Chrome variant: one row, hairline meters. */
	compact?: boolean
}

/** Five minutes of flat line is a wrong device, not a quiet room. */
const LONG_SILENCE_MS = 5 * 60 * 1000

/**
 * Escalate a source that has stayed silent for five minutes: bring the main window forward and
 * say which device heard nothing. Once per source per recording, and never in the chrome.
 */
function useLongSilenceAlert(active: boolean, feedback: Record<RecordLevelDevice, SourceFeedback>, names: Record<RecordLevelDevice, string>, enabled: boolean) {
	const silentSince = useRef<Record<RecordLevelDevice, number | null>>({ microphone: null, system: null })
	const alerted = useRef<Record<RecordLevelDevice, boolean>>({ microphone: false, system: false })
	// Both objects are rebuilt on every render (a level tick, a clock tick). Reading them through
	// refs keeps the 15-second interval alive long enough to ever reach the five-minute window.
	const feedbackRef = useRef(feedback)
	const namesRef = useRef(names)
	useEffect(() => {
		feedbackRef.current = feedback
		namesRef.current = names
	})

	useEffect(() => {
		if (!active) {
			silentSince.current = { microphone: null, system: null }
			alerted.current = { microphone: false, system: false }
			return
		}
		const timer = window.setInterval(() => {
			const now = Date.now()
			const feedback = feedbackRef.current
			const names = namesRef.current
			for (const device of DEVICES) {
				if (!feedback[device].silent) {
					silentSince.current[device] = null
					continue
				}
				silentSince.current[device] ??= now
				if (!enabled || alerted.current[device] || now - (silentSince.current[device] ?? now) < LONG_SILENCE_MS) continue
				alerted.current[device] = true
				void getCurrentWindow()
					.setFocus()
					.catch(() => undefined)
				void message(m.recordingLongSilence({ name: names[device] }), { title: m.recordingSilent(), kind: 'warning' }).catch(() => undefined)
			}
		}, 15_000)
		return () => window.clearInterval(timer)
	}, [active, enabled])
}

/** Elapsed time and one meter per source — the same indicator in the main window and the chrome. */
export default function RecordingIndicator({ startedAt, microphoneName, systemName, compact = false }: RecordingIndicatorProps) {
	const elapsed = useElapsedSeconds(startedAt)
	const feedback = useSourceFeedback(startedAt !== null, startedAt)
	const time = formatElapsed(elapsed)
	const names = { microphone: microphoneName, system: systemName }
	useLongSilenceAlert(startedAt !== null, feedback, names, !compact)

	return (
		<div className={cn('flex min-w-0 items-center gap-3', !compact && 'w-full flex-col gap-4')}>
			<div className={cn('flex items-center gap-2', !compact && 'justify-center')}>
				<span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-destructive" aria-hidden />
				<span role="timer" aria-label={m.recordingTime()} className={cn('font-mono tabular-nums', compact ? 'text-xs' : 'text-2xl tracking-tight')}>
					{time}
				</span>
			</div>
			{compact ? (
				<div className="flex min-w-0 items-center gap-3">
					<CompactMeter label={m.microphone()} name={microphoneName} feedback={feedback.microphone} icon={Mic} />
					<CompactMeter label={m.systemAudio()} name={systemName} feedback={feedback.system} icon={Volume2} />
				</div>
			) : (
				<div className="grid w-full gap-3">
					<SourceMeter label={m.microphone()} name={microphoneName} feedback={feedback.microphone} />
					<SourceMeter label={m.systemAudio()} name={systemName} feedback={feedback.system} />
				</div>
			)}
		</div>
	)
}
