import { useMemo, useState } from 'react'
import { Download, Link as LinkIcon } from 'lucide-react'
import { m } from '~/paraglide/messages.js'
import { toast } from 'sonner'
import { asrCatalog, availability, defaultQuant, entryScores, fileUrl, providerName, sizeMb, type CatalogModel } from '~/lib/catalog'
import { downloadModel } from '~/lib/model'
import type { ModelDownload } from '~/lib/config'
import { useToastProvider } from '~/providers/toast'
import { cn } from '~/lib/style'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { Input } from '~/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { ActionRow, IconAction, SettingsGroup, SettingsRow, rowControlClass, type SettingsViewModel } from './shared'
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

function CatalogCard({ model, onDownload }: { model: CatalogModel; onDownload: (download: ModelDownload) => void }) {
	const [quant, setQuant] = useState(defaultQuant(model))
	const file = model.files[quant] ?? Object.values(model.files)[0]
	const status = availability(model, quant)
	const scores = entryScores(model)

	return (
		<div className={cn('space-y-2.5 px-4 py-3', !status.ok && 'opacity-60')}>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0">
					<div className="text-sm font-medium text-foreground">{model.name}</div>
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
					<IconAction
						label={m.downloadModel()}
						icon={<Download className="h-4 w-4" />}
						disabled={!status.ok || !file}
						onClick={() => file && onDownload({ url: fileUrl(model, file), size: file.size, sha256: file.sha256 })}
					/>
				</div>
			</div>

			<CardMeta model={model} sizeBytes={file?.size ?? 0} />

			{(scores.accuracy !== undefined || scores.speed !== undefined) && (
				<div className="space-y-1.5">
					{scores.accuracy !== undefined && <ScoreBar label={m.catalogAccuracy()} score={scores.accuracy} />}
					{scores.speed !== undefined && <ScoreBar label={m.catalogSpeed()} score={scores.speed} />}
				</div>
			)}

			{!status.ok && (
				<p className="text-xs text-amber-600 dark:text-amber-400">
					{status.reason === 'engine' ? m.catalogRequiresEngine({ requirement: status.requirement }) : m.catalogRequiresGguf()}
				</p>
			)}
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
 * The one place to add a model: the filterable catalog, the paste-a-URL
 * download, and the folder rows. Only entries the bundled engine can load are
 * listed — `asrCatalog` filters legacy containers and engine-ahead families.
 */
export function ModelsCatalogSection({ vm, models = asrCatalog() }: { vm: SettingsViewModel; models?: CatalogModel[] }) {
	const [query, setQuery] = useState('')
	const [streaming, setStreaming] = useState(false)
	const [translation, setTranslation] = useState(false)
	const [language, setLanguage] = useState('all')
	const [provider, setProvider] = useState('all')
	const progressToast = useToastProvider()

	const languages = useMemo(() => [...new Set(models.flatMap((model) => model.languages))].sort(), [models])
	const providers = useMemo(() => [...new Set(models.map((model) => providerName(model.repository)))].sort(), [models])

	const visible = useMemo(
		() =>
			models.filter((model) => {
				if (streaming && !model.capabilities.streaming) return false
				if (translation && !model.capabilities.translate) return false
				if (language !== 'all' && !model.languages.includes(language)) return false
				if (provider !== 'all' && providerName(model.repository) !== provider) return false
				if (query && !model.name.toLowerCase().includes(query.trim().toLowerCase())) return false
				return true
			}),
		[models, query, streaming, translation, language, provider],
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

			{visible.length === 0 ? (
				<p className="px-4 py-3 text-sm text-muted-foreground">{m.catalogNoMatches()}</p>
			) : (
				visible.map((model) => <CatalogCard key={model.id} model={model} onDownload={startDownload} />)
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
