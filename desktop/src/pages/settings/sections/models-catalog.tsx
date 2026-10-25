import { useMemo, useState } from 'react'
import { Check, Download, FolderOpen, Link as LinkIcon, Pencil, X } from 'lucide-react'
import { m } from '~/paraglide/messages.js'
import { toast } from 'sonner'
import { asrCatalog, availability, defaultQuant, entryScores, fileUrl, providerName, sizeMb, type CatalogModel } from '~/lib/catalog'
import { downloadModel, getFriendlyModelName } from '~/lib/model'
import type { ModelDownload } from '~/lib/config'
import { useToastProvider } from '~/providers/toast'
import { cn } from '~/lib/style'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { ActionRow, IconAction, SettingsGroup, SettingsRow, rowControlClass, type SettingsViewModel } from './shared'
import type { NamedPath } from '~/lib/types'
import { ReactComponent as FolderIcon } from '~/icons/folder.svg'
import { ReactComponent as WrenchIcon } from '~/icons/wrench.svg'

/** Compact language list: everything when short, otherwise the first three plus a count. */
export function compactLanguages(languages: string[]): string {
	return languages.length <= 3 ? languages.join(', ') : `${languages.slice(0, 3).join(', ')} +${languages.length - 3}`
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

function CatalogCard({
	model,
	installedEntry,
	installedNames,
	active,
	onDownload,
	onSelect,
	onOpenFolder,
	renaming,
}: {
	model: CatalogModel
	/** The installed file of this entry, when any quant is already on disk. */
	installedEntry?: NamedPath
	/** Every installed file name; drives per-quant install state. */
	installedNames: Set<string>
	active: boolean
	onDownload: (download: ModelDownload) => void
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
						{active ? <Badge>{m.catalogActive()}</Badge> : installedEntry && <Badge variant="outline">{m.catalogInstalled()}</Badge>}
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					{Object.keys(model.files).length > 1 && (
						<Select value={quant} onValueChange={setQuant}>
							<SelectTrigger aria-label={m.catalogQuantization()} className={`w-28 ${rowControlClass}`}>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{Object.keys(model.files).map((candidate) => (
									<SelectItem key={candidate} value={candidate}>
										{candidate}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
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
	onSelect,
	onOpenFolder,
	renaming,
}: {
	entry: NamedPath
	active: boolean
	displayName: string
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
	const progressToast = useToastProvider()

	const installedByName = useMemo(() => new Map(vm.models.map((entry) => [entry.name, entry])), [vm.models])
	const installedNames = useMemo(() => new Set(installedByName.keys()), [installedByName])
	/** The installed file of a catalog entry, when any quant is already on disk. */
	const installedFileOf = (model: CatalogModel): NamedPath | undefined => {
		for (const file of Object.values(model.files)) {
			const installed = installedByName.get(file.filename)
			if (installed) return installed
		}
		return undefined
	}

	const languages = useMemo(() => [...new Set(models.flatMap((model) => model.languages))].sort(), [models])
	const providers = useMemo(() => [...new Set(models.map((model) => providerName(model.repository)))].sort(), [models])

	const visible = useMemo(() => {
		const filtered = models.filter((model) => {
			if (streaming && !model.capabilities.streaming) return false
			if (translation && !model.capabilities.translate) return false
			if (language !== 'all' && !model.languages.includes(language)) return false
			if (provider !== 'all' && providerName(model.repository) !== provider) return false
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

	/** One-click download with the catalog's integrity metadata, on the shared progress toast. */
	async function startDownload(download: ModelDownload) {
		progressToast.setMessage(m.downloadingModel())
		progressToast.setOpen(true)
		progressToast.setProgress(0)
		try {
			const path = await downloadModel(download)
			if (path) toast.success(m.downloadComplete())
		} catch (error) {
			console.error('failed to download the catalog model:', error)
			toast.error(String(error))
		} finally {
			progressToast.setOpen(false)
			progressToast.setProgress(null)
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
			<SettingsRow label={m.catalogSearch()}>
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
						{providers.map((name) => (
							<SelectItem key={name} value={name}>
								{name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</SettingsRow>

			{extras.map((entry) => (
				<ExtraCard
					key={entry.path}
					entry={entry}
					active={entry.path === vm.preference.modelPath}
					displayName={vm.preference.modelDisplayNames[entry.path] ?? getFriendlyModelName(entry.name)}
					onSelect={vm.selectModel}
					onOpenFolder={vm.openSelectedModel}
					renaming={renamingFor(entry.path, vm.preference.modelDisplayNames[entry.path] ?? getFriendlyModelName(entry.name))}
				/>
			))}

			{visible.length === 0 && extras.length === 0 ? (
				<p className="px-4 py-3 text-sm text-muted-foreground">{m.catalogNoMatches()}</p>
			) : (
				visible.map((model) => {
					const installedEntry = installedFileOf(model)
					return (
						<CatalogCard
							key={model.id}
							model={model}
							installedEntry={installedEntry}
							installedNames={installedNames}
							active={Boolean(installedEntry && installedEntry.path === vm.preference.modelPath)}
							onDownload={startDownload}
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
