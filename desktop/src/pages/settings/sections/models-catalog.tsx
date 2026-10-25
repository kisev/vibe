import { useState } from 'react'
import { Download } from 'lucide-react'
import { m } from '~/paraglide/messages.js'
import { toast } from 'sonner'
import { asrCatalog, availability, defaultQuant, entryScores, fileUrl, providerName, sizeMb, type CatalogModel } from '~/lib/catalog'
import { downloadModel } from '~/lib/model'
import type { ModelDownload } from '~/lib/config'
import { useToastProvider } from '~/providers/toast'
import { cn } from '~/lib/style'
import { Badge } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { IconAction, SettingsGroup, rowControlClass } from './shared'

/** Compact language list: everything when short, otherwise the first three plus a count. */
function compactLanguages(languages: string[]): string {
	return languages.length <= 3 ? languages.join(', ') : `${languages.slice(0, 3).join(', ')} +${languages.length - 3}`
}

/** One relative-score bar; an unbenchmarked score renders nothing rather than a fake bar. */
function ScoreBar({ label, score }: { label: string; score: number }) {
	return (
		<div className="flex items-center gap-2">
			<span className="w-20 shrink-0 text-xs text-muted-foreground">{label}</span>
			<Progress value={Math.round(score * 100)} aria-label={label} className="h-1.5" />
		</div>
	)
}

function CatalogCard({ model }: { model: CatalogModel }) {
	const [selected, setSelected] = useState<Record<string, string>>({})
	const progressToast = useToastProvider()
	const quant = selected[model.id] ?? defaultQuant(model)
	const file = model.files[quant] ?? Object.values(model.files)[0]
	const status = availability(model, quant)
	const scores = entryScores(model)

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
		<div className={cn('space-y-2.5 px-4 py-3', !status.ok && 'opacity-60')}>
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 space-y-0.5">
					<div className="text-sm font-medium text-foreground">{model.name}</div>
					<div className="text-xs text-muted-foreground">
						{m.catalogProvider()}: {providerName(model.repository)} · {model.parameters} · {file ? sizeMb(file.size) : 0} MB
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-1.5">
					{Object.keys(model.files).length > 1 && (
						<Select value={quant} onValueChange={(next) => setSelected((prev) => ({ ...prev, [model.id]: next }))}>
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
						onClick={() => file && startDownload({ url: fileUrl(model, file), size: file.size, sha256: file.sha256 })}
					/>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
				<span>{compactLanguages(model.languages)}</span>
				{model.capabilities.streaming && <Badge variant="outline">{m.catalogStreaming()}</Badge>}
				{model.capabilities.translate && <Badge variant="outline">{m.catalogTranslation()}</Badge>}
			</div>

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

/** The downloadable model catalog: one card per ASR entry, with bars only where benchmarks exist. */
export function ModelsCatalogSection({ models = asrCatalog() }: { models?: CatalogModel[] }) {
	return (
		<SettingsGroup title={m.catalogModels()}>
			{models.map((model) => (
				<CatalogCard key={model.id} model={model} />
			))}
		</SettingsGroup>
	)
}
