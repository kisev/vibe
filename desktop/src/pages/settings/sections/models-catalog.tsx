import { useEffect, useMemo, useState, type MouseEvent, type PointerEvent } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, Download, ExternalLink, FolderOpen, Link as LinkIcon, Pencil, Trash2, X } from 'lucide-react'
import { m } from '~/paraglide/messages.js'
import { toast } from 'sonner'
import {
	asrCatalog,
	availability,
	baseLanguage,
	defaultQuant,
	entryScores,
	fileUrl,
	providerName,
	sizeMb,
	type CatalogFileEntry,
	type CatalogModel,
} from '~/lib/catalog'
import { deleteModelFile, downloadModel, getFriendlyModelName } from '~/lib/model'
import type { ModelDownload } from '~/lib/config'
import { cn } from '~/lib/style'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { ActionRow, IconAction, SettingsGroup, SettingsRow, rowControlClass, type SettingsViewModel } from './shared'
import type { NamedPath } from '~/lib/types'
import { ReactComponent as FolderIcon } from '~/icons/folder.svg'
import { ReactComponent as WrenchIcon } from '~/icons/wrench.svg'

/** Provider filter value for manual downloads that no catalog provider claims. */
const CUSTOM_PROVIDER = 'custom'

/** Compact language list in short codes: everything when short, otherwise the first three plus a count. */
export function compactLanguages(languages: string[]): string {
	const bases = [...new Set(languages.map(baseLanguage))]
	return bases.length <= 3 ? bases.join(', ') : `${bases.slice(0, 3).join(', ')} +${bases.length - 3}`
}

/** One relative-score bar; an unbenchmarked score renders nothing rather than a fake bar. */
export function ScoreBar({ label, score }: { label: string; score: number }) {
	return (
		<div className="flex items-center gap-2">
			<span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
			<Progress value={Math.round(score * 100)} aria-label={label} className="h-1.5" />
		</div>
	)
}

/** Provider, size, languages, badges — the metadata every card shares. Parameter counts stay off cards (M reads as MB). */
export function CardMeta({ model, sizeBytes }: { model: CatalogModel; sizeBytes: number }) {
	return (
		<div className="space-y-1.5">
			<div className="text-xs text-muted-foreground">
				{providerName(model.repository)} · {sizeMb(sizeBytes)} MB
			</div>
			<div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
				<span>{compactLanguages(model.languages)}</span>
				{model.capabilities.streaming && <Badge variant="outline">{m.catalogStreaming()}</Badge>}
				{model.capabilities.translate && <Badge variant="outline">{m.catalogTranslation()}</Badge>}
			</div>
		</div>
	)
}

/** What this catalog entry cannot do — the notes the standalone limitations group used to show, now on the card. */
function catalogLimitations(model: CatalogModel): string[] {
	const notes: string[] = []
	if (model.languages.length === 1 && !model.capabilities.languageDetection) notes.push(m.modelLimitationLanguage({ language: model.languages[0] }))
	if (!model.capabilities.streaming) notes.push(m.modelLimitationStreaming())
	if (!model.capabilities.translate) notes.push(m.modelLimitationTranslation())
	return notes
}

/** The model's page on Hugging Face, at the exact revision the catalog pins. */
function repoUrl(model: CatalogModel): string {
	return `https://huggingface.co/${model.repository}/tree/${model.revision}`
}

/** Rename controls shared by the installed cards. */
function RenameControls({
	value,
	onChange,
	onCommit,
	onCancel,
}: {
	value: string
	onChange: (value: string) => void
	onCommit: () => void
	onCancel: () => void
}) {
	return (
		<>
			<Input
				autoFocus
				value={value}
				onChange={(event) => onChange(event.target.value)}
				onKeyDown={(event) => {
					if (event.key === 'Enter') onCommit()
					if (event.key === 'Escape') onCancel()
				}}
				className={`w-56 ${rowControlClass}`}
			/>
			<IconAction variant="outline" label={m.save()} icon={<Check className="h-4 w-4" />} onClick={onCommit} />
			<IconAction variant="outline" label={m.cancel()} icon={<X className="h-4 w-4" />} onClick={onCancel} />
		</>
	)
}

interface Renaming {
	editing: boolean
	name: string
	setName: (value: string) => void
	start: () => void
	commit: () => void
	cancel: () => void
}

/** A trash button that asks for a second click before deleting — one icon, no dialog. */
function DeleteAction({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
	const [confirming, setConfirming] = useState(false)
	useEffect(() => {
		if (!confirming) return
		const timer = setTimeout(() => setConfirming(false), 3000)
		return () => clearTimeout(timer)
	}, [confirming])

	return confirming ? (
		<IconAction
			label={m.catalogConfirmDelete()}
			icon={<Check className="h-4 w-4 text-red-500" />}
			onClick={() => {
				setConfirming(false)
				onConfirm()
			}}
		/>
	) : (
		<IconAction variant="outline" label={label} icon={<Trash2 className="h-4 w-4" />} disabled={disabled} onClick={() => setConfirming(true)} />
	)
}

/** Stops pointer and click events so a button inside a Radix select item acts without selecting the item. */
function itemButtonProps(action: () => void) {
	return {
		onPointerDown: (event: PointerEvent) => event.stopPropagation(),
		onPointerUp: (event: PointerEvent) => event.stopPropagation(),
		onClick: (event: MouseEvent) => {
			event.stopPropagation()
			event.preventDefault()
			action()
		},
	}
}

/**
 * One quantization in the selector: a check when the file is on disk, the size,
 * and the per-quant action — download it or delete the downloaded copy.
 */
function QuantItem({
	quant,
	file,
	installed,
	downloadDisabled,
	onDownload,
	onDelete,
}: {
	quant: string
	file: CatalogFileEntry
	installed: boolean
	downloadDisabled: boolean
	onDownload: () => void
	onDelete: () => void
}) {
	return (
		<SelectPrimitive.Item
			value={quant}
			className="relative flex h-9 w-full cursor-pointer select-none items-center rounded-sm py-1.5 pe-2 ps-8 text-sm outline-none focus:bg-accent/75 focus:text-accent-foreground">
			<span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center text-primary">
				{installed && <Check className="h-3.5 w-3.5" aria-label={m.catalogInstalled()} />}
			</span>
			<SelectPrimitive.ItemText>
				{quant} · {sizeMb(file.size)} MB
			</SelectPrimitive.ItemText>
			{/* Model files are pure re-downloadable assets, so the quant action is one click; the
			 * card-level delete keeps the confirm step. */}
			{installed ? (
				<button
					type="button"
					aria-label={m.catalogDelete()}
					className="ms-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
					{...itemButtonProps(onDelete)}>
					<Trash2 className="h-3.5 w-3.5" />
				</button>
			) : (
				<button
					type="button"
					aria-label={m.downloadModel()}
					disabled={downloadDisabled}
					className="ms-auto flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
					{...itemButtonProps(onDownload)}>
					<Download className="h-3.5 w-3.5" />
				</button>
			)}
		</SelectPrimitive.Item>
	)
}

function CatalogCard({
	model,
	installedEntry,
	installedNames,
	pathOf,
	active,
	onDownload,
	onDelete,
	onSelect,
	onOpenFolder,
	renaming,
}: {
	model: CatalogModel
	/** The installed file of this entry, when any quant is already on disk. */
	installedEntry?: NamedPath
	/** Every installed file name; drives per-quant install state. */
	installedNames: Set<string>
	/** Path of an installed file name, for delete actions. */
	pathOf: (filename: string) => string | undefined
	active: boolean
	onDownload: (download: ModelDownload) => void
	onDelete: (paths: string[]) => void
	onSelect: (path: string) => void
	onOpenFolder: (path: string) => void
	renaming: Renaming | undefined
}) {
	const [quant, setQuant] = useState(defaultQuant(model))
	const file = model.files[quant] ?? Object.values(model.files)[0]
	const status = availability(model, quant)
	const scores = entryScores(model)
	const limitations = catalogLimitations(model)
	const thisQuantInstalled = Boolean(file && installedNames.has(file.filename))
	// Every copy of this entry on disk — the model-level delete removes them all.
	const installedPaths = Object.values(model.files)
		.filter((candidate) => installedNames.has(candidate.filename))
		.map((candidate) => pathOf(candidate.filename))
		.filter((path): path is string => path !== undefined)

	return (
		<div
			className={cn(
				'space-y-2.5 rounded-xl px-4 py-3',
				installedEntry && 'bg-primary/5',
				active ? 'ring-2 ring-primary' : installedEntry && 'ring-1 ring-primary/50',
				!status.ok && 'opacity-60',
			)}>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-foreground">{model.name}</span>
						<a
							href={repoUrl(model)}
							target="_blank"
							rel="noreferrer"
							aria-label={m.catalogOpenOnHuggingFace()}
							className="text-muted-foreground hover:text-foreground">
							<ExternalLink className="h-3.5 w-3.5" />
						</a>
						{active ? <Badge>{m.catalogActive()}</Badge> : installedEntry && <Badge variant="outline">{m.catalogInstalled()}</Badge>}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					<Select value={quant} onValueChange={setQuant}>
						<SelectTrigger aria-label={m.catalogQuantization()} className={`w-36 ${rowControlClass}`}>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{Object.entries(model.files).map(([candidate, candidateFile]) => (
								<QuantItem
									key={candidate}
									quant={candidate}
									file={candidateFile}
									installed={installedNames.has(candidateFile.filename)}
									downloadDisabled={!status.ok}
									onDownload={() =>
										onDownload({ url: fileUrl(model, candidateFile), size: candidateFile.size, sha256: candidateFile.sha256 })
									}
									onDelete={() => {
										const path = pathOf(candidateFile.filename)
										if (path) onDelete([path])
									}}
								/>
							))}
						</SelectContent>
					</Select>
					{thisQuantInstalled ? (
						renaming?.editing ? (
							<RenameControls value={renaming.name} onChange={renaming.setName} onCommit={renaming.commit} onCancel={renaming.cancel} />
						) : (
							<>
								{!active && (
									<IconAction
										label={m.catalogUse()}
										icon={<Check className="h-4 w-4" />}
										onClick={() => installedEntry && onSelect(installedEntry.path)}
									/>
								)}
								<IconAction variant="outline" label={m.rename()} icon={<Pencil className="h-4 w-4" />} onClick={renaming?.start} />
								<IconAction
									variant="outline"
									label={m.showInFolder()}
									icon={<FolderOpen className="h-4 w-4" />}
									onClick={() => installedEntry && onOpenFolder(installedEntry.path)}
								/>
								<DeleteAction label={m.catalogDeleteModel()} onConfirm={() => onDelete(installedPaths)} />
							</>
						)
					) : (
						<IconAction
							label={m.downloadModel()}
							icon={<Download className="h-4 w-4" />}
							disabled={!status.ok || !file}
							onClick={() => file && onDownload({ url: fileUrl(model, file), size: file.size, sha256: file.sha256 })}
						/>
					)}
				</div>
			</div>

			<CardMeta model={model} sizeBytes={file?.size ?? 0} />

			{(scores.accuracy !== undefined || scores.speed !== undefined) && (
				<div className="space-y-1.5">
					{scores.accuracy !== undefined && <ScoreBar label={m.catalogAccuracy()} score={scores.accuracy} />}
					{scores.speed !== undefined && <ScoreBar label={m.catalogSpeed()} score={scores.speed} />}
				</div>
			)}

			{limitations.length > 0 && <p className="text-xs text-muted-foreground">{limitations.join(' ')}</p>}

			{!status.ok && (
				<p className="text-xs text-amber-600 dark:text-amber-400">
					{status.reason === 'engine' ? m.catalogRequiresEngine({ requirement: status.requirement }) : m.catalogRequiresGguf()}
				</p>
			)}
		</div>
	)
}

/** An installed file the catalog does not know (manual download): same place in the list, just without catalog metadata. */
function ExtraCard({
	entry,
	active,
	displayName,
	onDelete,
	onSelect,
	onOpenFolder,
	renaming,
}: {
	entry: NamedPath
	active: boolean
	displayName: string
	onDelete: (paths: string[]) => void
	onSelect: (path: string) => void
	onOpenFolder: (path: string) => void
	renaming: Renaming
}) {
	return (
		<div className={cn('space-y-2.5 rounded-xl bg-primary/5 px-4 py-3', active ? 'ring-2 ring-primary' : 'ring-1 ring-primary/50')}>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium text-foreground">{displayName}</span>
						{active ? <Badge>{m.catalogActive()}</Badge> : <Badge variant="outline">{m.catalogInstalled()}</Badge>}
					</div>
					<div className="text-xs text-muted-foreground">{entry.name}</div>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					{renaming.editing ? (
						<RenameControls value={renaming.name} onChange={renaming.setName} onCommit={renaming.commit} onCancel={renaming.cancel} />
					) : (
						<>
							{!active && <IconAction label={m.catalogUse()} icon={<Check className="h-4 w-4" />} onClick={() => onSelect(entry.path)} />}
							<IconAction variant="outline" label={m.rename()} icon={<Pencil className="h-4 w-4" />} onClick={renaming.start} />
							<IconAction
								variant="outline"
								label={m.showInFolder()}
								icon={<FolderOpen className="h-4 w-4" />}
								onClick={() => onOpenFolder(entry.path)}
							/>
							<DeleteAction label={m.catalogDeleteModel()} onConfirm={() => onDelete([entry.path])} />
						</>
					)}
				</div>
			</div>
		</div>
	)
}

/** A streaming/translation filter chip. */
function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
	return (
		<button
			type="button"
			aria-pressed={active}
			onClick={onClick}
			className={cn(
				'rounded-full border px-2.5 py-1 text-xs transition-colors',
				active ? 'border-primary bg-primary/10 text-foreground' : 'border-input text-muted-foreground hover:text-foreground',
			)}>
			{label}
		</button>
	)
}

/**
 * The one place to manage models: the filterable catalog (installed entries
 * highlighted and sorted first, plus manual downloads the catalog does not
 * know), the paste-a-URL download, and the folder rows. Only entries the
 * bundled engine can load are listed — `asrCatalog` filters legacy containers
 * and engine-ahead families.
 */
export function ModelsCatalogSection({ vm, models = asrCatalog() }: { vm: SettingsViewModel; models?: CatalogModel[] }) {
	const [query, setQuery] = useState('')
	const [streaming, setStreaming] = useState(false)
	const [translation, setTranslation] = useState(false)
	const [language, setLanguage] = useState('all')
	const [provider, setProvider] = useState('all')
	const [editingPath, setEditingPath] = useState<string | null>(null)
	const [editingName, setEditingName] = useState('')

	const installedByName = useMemo(() => new Map(vm.models.map((entry) => [entry.name, entry])), [vm.models])
	const installedNames = useMemo(() => new Set(installedByName.keys()), [installedByName])
	const onDiskPathOf = (filename: string): string | undefined => installedByName.get(filename)?.path
	/** The installed file of a catalog entry, when any quant is already on disk. */
	const installedFileOf = (model: CatalogModel): NamedPath | undefined => {
		for (const file of Object.values(model.files)) {
			const installed = installedByName.get(file.filename)
			if (installed) return installed
		}
		return undefined
	}

	const languages = useMemo(() => [...new Set(models.flatMap((model) => model.languages.map(baseLanguage)))].sort(), [models])
	const providers = useMemo(() => [...new Set(models.map((model) => providerName(model.repository)))].sort(), [models])

	const visible = useMemo(() => {
		const filtered = models.filter((model) => {
			if (streaming && !model.capabilities.streaming) return false
			if (translation && !model.capabilities.translate) return false
			if (language !== 'all' && !model.languages.some((tag) => baseLanguage(tag) === language)) return false
			if (provider !== 'all' && provider !== CUSTOM_PROVIDER && providerName(model.repository) !== provider) return false
			if (query && !model.name.toLowerCase().includes(query.trim().toLowerCase())) return false
			return true
		})
		// Installed entries lead the list; the sort is stable so the catalog order holds within each run.
		return filtered.sort((a, b) => Number(Boolean(installedFileOf(b))) - Number(Boolean(installedFileOf(a))))
	}, [models, query, streaming, translation, language, provider, installedByName])

	// Installed files no catalog entry claims — still selectable, rendered above the catalog cards.
	const extras = useMemo(
		() => vm.models.filter((entry) => !models.some((model) => Object.values(model.files).some((file) => file.filename === entry.name))),
		[vm.models, models],
	)
	// The Custom provider is exactly those files; other filters do not apply to them.
	const showCatalog = provider !== CUSTOM_PROVIDER

	/** One-click download with the catalog's integrity metadata; the registry drives the shared toast. */
	async function startDownload(download: ModelDownload) {
		try {
			const path = await downloadModel(download)
			if (path) {
				toast.success(m.downloadComplete())
				// Rescan so the card flips to installed (ring, badge, Use) without waiting for a window refocus.
				await vm.loadModels()
			}
		} catch (error) {
			console.error('failed to download the catalog model:', error)
			toast.error(String(error))
		}
	}

	/** Remove the file(s) from disk and refresh the list; the active model is never deletable from here. */
	async function removeFiles(paths: string[]) {
		try {
			await Promise.all(paths.map((path) => deleteModelFile(path)))
			toast.success(m.catalogDeleted())
			await vm.loadModels()
		} catch (error) {
			console.error('failed to delete the model file:', error)
			toast.error(String(error))
		}
	}

	const renamingFor = (path: string, fallback: string): Renaming => ({
		editing: editingPath === path,
		name: editingName,
		setName: setEditingName,
		start: () => {
			setEditingPath(path)
			setEditingName(fallback)
		},
		commit: () => {
			const name = editingName.trim()
			if (name) vm.preference.setModelDisplayNames({ ...vm.preference.modelDisplayNames, [path]: name })
			setEditingPath(null)
		},
		cancel: () => setEditingPath(null),
	})

	return (
		<SettingsGroup title={m.catalogModels()}>
			<div className="flex flex-wrap items-center gap-2 px-4 py-3">
				<Input
					type="search"
					value={query}
					onChange={(event) => setQuery(event.target.value)}
					placeholder={m.catalogSearch()}
					className={`w-56 ${rowControlClass}`}
				/>
				<FilterChip label={m.catalogStreaming()} active={streaming} onClick={() => setStreaming((value) => !value)} />
				<FilterChip label={m.catalogTranslation()} active={translation} onClick={() => setTranslation((value) => !value)} />
				<Select value={language} onValueChange={setLanguage}>
					<SelectTrigger aria-label={m.language()} className={`w-40 ${rowControlClass}`}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{m.catalogAllLanguages()}</SelectItem>
						{languages.map((code) => (
							<SelectItem key={code} value={code}>
								{code}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={provider} onValueChange={setProvider}>
					<SelectTrigger aria-label={m.catalogProvider()} className={`w-40 ${rowControlClass}`}>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">{m.catalogAllProviders()}</SelectItem>
						<SelectItem value={CUSTOM_PROVIDER}>{m.catalogCustom()}</SelectItem>
						{providers.map((name) => (
							<SelectItem key={name} value={name}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{extras.map((entry) => (
				<ExtraCard
					key={entry.path}
					entry={entry}
					active={entry.path === vm.preference.modelPath}
					displayName={vm.preference.modelDisplayNames[entry.path] ?? getFriendlyModelName(entry.name)}
					onDelete={removeFiles}
					onSelect={vm.selectModel}
					onOpenFolder={vm.openSelectedModel}
					renaming={renamingFor(entry.path, vm.preference.modelDisplayNames[entry.path] ?? getFriendlyModelName(entry.name))}
				/>
			))}

			{showCatalog
				? visible.map((model) => {
						const installedEntry = installedFileOf(model)
						return (
							<CatalogCard
								key={model.id}
								model={model}
								installedEntry={installedEntry}
								installedNames={installedNames}
								pathOf={onDiskPathOf}
								active={Boolean(installedEntry && installedEntry.path === vm.preference.modelPath)}
								onDownload={startDownload}
								onDelete={removeFiles}
								onSelect={vm.selectModel}
								onOpenFolder={vm.openSelectedModel}
								renaming={
									installedEntry
										? renamingFor(
												installedEntry.path,
												vm.preference.modelDisplayNames[installedEntry.path] ?? getFriendlyModelName(installedEntry.name),
											)
										: undefined
								}
							/>
						)
					})
				: null}

			{(provider === CUSTOM_PROVIDER ? extras.length === 0 : visible.length === 0 && extras.length === 0) && (
				<p className="px-4 py-3 text-sm text-muted-foreground">{m.catalogNoMatches()}</p>
			)}

			<SettingsRow label={m.downloadModel()}>
				<Input
					type="text"
					value={vm.downloadURL}
					onChange={(event) => vm.setDownloadURL(event.target.value)}
					placeholder={m.pasteModelLink()}
					onKeyDown={(event) => (event.key === 'Enter' ? vm.downloadModel() : null)}
					className={`w-56 ${rowControlClass}`}
				/>
				<IconAction label={m.downloadModel()} icon={<Download className="h-4 w-4" />} onClick={vm.downloadModel} disabled={!vm.downloadURL} />
			</SettingsRow>
			<ActionRow label={m.downloadModelsLink()} icon={<LinkIcon className="h-4 w-4" />} onClick={vm.openModelsUrl} />
			<ActionRow label={m.modelsFolder()} icon={<FolderIcon className="h-4 w-4" />} onClick={vm.openModelPath} />
			<ActionRow label={m.changeModelsFolder()} icon={<WrenchIcon className="h-4 w-4" />} onClick={vm.changeModelsFolder} />
		</SettingsGroup>
	)
}
