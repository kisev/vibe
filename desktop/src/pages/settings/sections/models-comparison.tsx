// The comparison lab: run one recording or file through every installed model,
// one after another, and read the timings and transcripts side by side. The
// sequencing and the file writes live in `~/lib/model-comparison`; this section
// only picks the input, the models, and renders what each run reports back.
import { useEffect, useRef, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { join } from '@tauri-apps/api/path'
import * as dialog from '@tauri-apps/plugin-dialog'
import { Check, FolderOpen, Loader2, Mic, Play, Square, Upload, X } from 'lucide-react'
import { m } from '~/paraglide/messages.js'
import { openPath } from '~/lib/app'
import * as config from '~/lib/config'
import { pathToNamedPath } from '~/lib/fs'
import { getMediaDurationSeconds } from '~/lib/media'
import { getModelDisplayName, isModelFileUsable } from '~/lib/model'
import { runComparison, tauriComparisonIo, type ComparisonModel, type ComparisonRun } from '~/lib/model-comparison'
import { cn } from '~/lib/style'
import { useRecording } from '~/pages/home/hooks/use-recording'
import { Button } from '~/components/ui/button'
import { Switch } from '~/components/ui/switch'
import { IconAction, SettingsField, SettingsGroup, SettingsRow, type SettingsViewModel } from './shared'
import { ModelsComparisonResults } from './models-comparison-results'

const mediaExtensions = [...config.audioExtensions, ...config.videoExtensions]

/** The chosen input: display name, absolute path, and duration when the webview could read it. */
interface ComparisonInput {
	name: string
	path: string
	duration: number | null
}

/** Recording states this section drives itself; `idle` still covers "an input is ready". */
type RecordingPhase = 'idle' | 'recording' | 'awaiting'

/** vm.models already holds only checked files; the tolerant test also drops a corrupt wider InstalledModel entry. */
function selectable(entry: { name: string; path: string; valid?: boolean }) {
	return entry.valid !== false
}

/** One result row: a spinner while the model works, the time and reveal when done, the reason when it failed. */
function RunStatus({ run }: { run: ComparisonRun }) {
	if (run.status === 'done') {
		return (
			<>
				<span className="text-xs text-muted-foreground">{run.seconds}s</span>
				<IconAction
					label={m.showInFolder()}
					icon={<FolderOpen className="h-4 w-4" />}
					onClick={() => {
						if (run.outputPath) void openPath({ name: run.model.name, path: run.outputPath })
					}}
				/>
			</>
		)
	}
	if (run.status === 'error') {
		return <span className="text-xs text-destructive">{m.error()}: {run.error}</span>
	}
	return (
		<span className="flex items-center gap-2 text-xs text-muted-foreground">
			<Loader2 className="h-4 w-4 animate-spin" />
			{m.transcribing()}
		</span>
	)
}

export function ModelsComparisonSection({ vm }: { vm: SettingsViewModel }) {
	const recording = useRecording(() => {})
	const [phase, setPhase] = useState<RecordingPhase>('idle')
	const [input, setInput] = useState<ComparisonInput | null>(null)
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [runs, setRuns] = useState<ComparisonRun[]>([])
	const [running, setRunning] = useState(false)
	const [showResults, setShowResults] = useState(false)
	// Speaker separation is optional: it makes the transcripts readable by voice but
	// adds its own time to every run, so the same switch applies to all models.
	const [diarize, setDiarize] = useState(false)
	const [diarizeModelPath, setDiarizeModelPath] = useState<string | null>(null)
	// The record_finish listener outlives renders, so the awaiting flag needs a ref as well.
	const awaitingRef = useRef(false)

	useEffect(() => {
		let active = true
		void (async () => {
			const folder = await invoke<string>('get_models_folder')
			const path = await join(folder, config.diarizeModelFilename)
			const usable = await isModelFileUsable(path)
			if (!active) return
			setDiarizeModelPath(usable ? path : null)
			setDiarize(usable)
		})()
		return () => {
			active = false
		}
	}, [])

	useEffect(() => {
		// The recording hook enumerates devices only while `homeTab === 'record'`, and
		// settings never is. Without this the first startRecord would see no devices.
		void recording.refreshDevices()
	}, [])

	useEffect(() => {
		const unlisten = listen<{ path: string; name: string; warning?: string }>('record_finish', async ({ payload }) => {
			// Only the stop this section issued arms the listener. A recording started
			// elsewhere (hotkey, the record tab) finishes with the same event, and it
			// must not hijack the lab with a clip the user never chose here.
			if (!awaitingRef.current) return
			awaitingRef.current = false
			setPhase('idle')
			const named = await pathToNamedPath(payload.path)
			setInput({ name: named.name, path: named.path, duration: await getMediaDurationSeconds(payload.path) })
			setRuns([])
		})
		return () => {
			unlisten.then((fn) => fn())
		}
	}, [])

	async function chooseFile() {
		let picked: string[] | null = null
		try {
			picked = await invoke<string[] | null>('pick_media_paths', { extensions: mediaExtensions })
		} catch (error) {
			console.warn('native picker unavailable:', error)
		}
		if (!picked) {
			const chosen = await dialog.open({ multiple: false, filters: [{ name: 'Audio or Video files', extensions: mediaExtensions }] })
			if (!chosen) return
			picked = Array.isArray(chosen) ? chosen : [chosen]
		}
		const path = picked[0]
		if (!path) return
		const named = await pathToNamedPath(path)
		setInput({ name: named.name, path: named.path, duration: await getMediaDurationSeconds(path) })
		setRuns([])
	}

	function startRecording() {
		setPhase('recording')
		void recording.startRecord()
	}

	async function stopRecording() {
		// Arm the listener before asking the recorder to stop: record_finish can arrive
		// before stopRecord resolves, and an arrived clip must not be dropped.
		awaitingRef.current = true
		setPhase('awaiting')
		await recording.stopRecord()
	}

	function resetInput() {
		setInput(null)
		setRuns([])
	}

	function toggleModel(path: string) {
		setSelected((previous) => {
			const next = new Set(previous)
			if (next.has(path)) next.delete(path)
			else next.add(path)
			return next
		})
	}

	function displayName(entry: { name: string; path: string }) {
		return vm.preference.modelDisplayNames[entry.path] ?? getModelDisplayName(entry.name)
	}

	const selectableModels = vm.models.filter(selectable)
	const chosenModels = selectableModels.filter((entry) => selected.has(entry.path))
	const needMore = Boolean(input) && chosenModels.length < 2
	const busy = running
	// A failed run is worth surfacing before the results window: otherwise the
	// only trace is a row that is easy to read as a model that never ran.
	const finished = runs.filter((candidate) => candidate.status === 'done').length
	const failed = runs.filter((candidate) => candidate.status === 'error').length
	const settled = runs.length > 0 && !running

	async function run() {
		if (!input) return
		// vm.models order, filtered by the selection: deterministic regardless of click order.
		const models: ComparisonModel[] = chosenModels.map((entry) => ({ name: displayName(entry), path: entry.path }))
		const io = tauriComparisonIo(
			{
				gpuDevice: vm.preference.gpuDevice,
				noGpu: vm.preference.noGpu,
				unloadTimeoutMinutes: vm.preference.unloadTimeoutMinutes,
			},
			vm.preference.projectsPath,
			diarize ? diarizeModelPath : null,
		)
		const queued: ComparisonRun[] = models.map((model) => ({ model, status: 'queued' }))
		setRunning(true)
		setRuns(queued)
		try {
			const result = await runComparison(input, models, vm.preference.modelOptions.lang, io, (snapshot, index) => {
				setRuns((previous) => previous.map((candidate, position) => (position === index ? snapshot : candidate)))
			})
			setRuns(result)
		} catch (error) {
			console.error('comparison run failed:', error)
			// A setup failure (the comparisons folder) never reaches the per-run catch, so
			// end the spinner here instead of leaving every row running forever.
			setRuns((previous) =>
				previous.map((candidate) => (candidate.status === 'done' ? candidate : { ...candidate, status: 'error', error: String(error) })),
			)
		} finally {
			setRunning(false)
		}
	}

	return (
		<SettingsGroup title={m.compareModels()}>
			<SettingsRow
				label={
					input ? (
						<span className="flex items-center gap-1.5">
							<span className="max-w-[24rem] truncate">{input.name}</span>
							{input.duration !== null && <span className="text-xs text-muted-foreground">· {input.duration}s</span>}
						</span>
					) : (
						m.compareRecord()
					)
				}>
				{phase === 'awaiting' ? (
					<span className="flex items-center gap-2 text-xs text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						{m.compareProcessingRecording()}
					</span>
				) : phase === 'recording' ? (
					<>
						<span className="text-xs text-muted-foreground">{m.compareRecording()}</span>
						<IconAction label={m.compareStopRecording()} icon={<Square className="h-4 w-4" />} disabled={busy} onClick={() => void stopRecording()} />
					</>
				) : input ? (
					<IconAction label={m.cancel()} icon={<X className="h-4 w-4" />} disabled={busy} onClick={resetInput} />
				) : (
					<>
						<IconAction label={m.compareRecord()} icon={<Mic className="h-4 w-4" />} disabled={busy} onClick={startRecording} />
						<Button variant="outline" size="sm" disabled={busy} onClick={() => void chooseFile()}>
							<Upload />
							{m.compareChooseFile()}
						</Button>
					</>
				)}
			</SettingsRow>

			{diarizeModelPath && (
				<SettingsRow label={m.diarization()} description={m.infoDiarization()}>
					<Switch
						checked={diarize}
						disabled={busy}
						onCheckedChange={(on) => {
							setDiarize(on)
							setRuns([])
						}}
					/>
				</SettingsRow>
			)}

			<SettingsField label={m.comparePickModels()}>
				<div className="space-y-1">
					{selectableModels.map((entry) => {
						const active = selected.has(entry.path)
						return (
							<button
								key={entry.path}
								type="button"
								aria-pressed={active}
								disabled={busy}
								onClick={() => toggleModel(entry.path)}
								className={cn(
									'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50',
									active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-accent/45 hover:text-foreground',
								)}>
								<span className="truncate">{displayName(entry)}</span>
								{active && <Check className="h-4 w-4 shrink-0 text-primary" />}
							</button>
						)
					})}
				</div>
			</SettingsField>

			<div className="flex flex-wrap items-center gap-2 px-4 py-3">
				<Button disabled={!input || chosenModels.length < 2 || running} onClick={() => void run()}>
					<Play />
					{m.compareRun()}
				</Button>
				{needMore && !running && <span className="text-xs text-muted-foreground">{m.compareNeedTwo()}</span>}
				{settled && (
					<>
						<span className="text-xs text-muted-foreground">
							{m.compareRunsDone({ count: finished })} · {m.compareRunsFailed({ count: failed })}
						</span>
						<Button variant="secondary" onClick={() => setShowResults(true)}>
							{m.compareResults()}
						</Button>
					</>
				)}
			</div>

			{runs.map((run) => (
				<SettingsRow key={run.model.path} label={run.model.name}>
					<RunStatus run={run} />
				</SettingsRow>
			))}

			{input && (
				<ModelsComparisonResults input={input} runs={runs} open={showResults} onOpenChange={setShowResults} />
			)}
		</SettingsGroup>
	)
}
