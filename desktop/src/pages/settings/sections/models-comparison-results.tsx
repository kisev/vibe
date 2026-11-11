// The comparison results, on a full-window surface: one column per model with its
// transcript, its processing time, and a word-level diff against a chosen baseline.
// The section keeps the runs in memory; this view only reads them.
import { useMemo, useState } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '~/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { m } from '~/paraglide/messages.js'
import { openPath } from '~/lib/app'
import type { ComparisonRun } from '~/lib/model-comparison'
import { cn } from '~/lib/style'
import { diffWords, segmentsText, tokenize, type DiffPart } from '~/lib/text-diff'

interface ComparisonResultsProps {
	input: { name: string; duration: number | null }
	runs: ComparisonRun[]
	open: boolean
	onOpenChange: (open: boolean) => void
}

/** The diff is baseline → candidate: words the model missed are struck out, extra words are green. */
function DiffText({ parts }: { parts: DiffPart[] }) {
	return (
		<>
			{parts.map((part, index) =>
				part.kind === 'same' ? (
					<span key={index}>{part.text}</span>
				) : (
					<span
						key={index}
						className={
							part.kind === 'added'
								? 'rounded-[2px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
								: 'rounded-[2px] bg-destructive/15 text-destructive line-through decoration-destructive/60'
						}>
						{part.text}
					</span>
				),
			)}
		</>
	)
}

export function ModelsComparisonResults({ input, runs, open, onOpenChange }: ComparisonResultsProps) {
	const done = runs.filter((run) => run.status === 'done')
	const [baselinePath, setBaselinePath] = useState<string | null>(null)
	const [highlight, setHighlight] = useState(true)
	const baseline = done.find((run) => run.model.path === baselinePath) ?? done[0]
	const baselineText = useMemo(() => segmentsText(baseline?.segments ?? []), [baseline])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!start-0 !top-0 h-dvh max-h-none w-screen max-w-none !translate-x-0 !translate-y-0 gap-0 overflow-hidden rounded-none border-0 p-0 sm:rounded-none rtl:!translate-x-0">
				<div className="flex h-full flex-col">
					<header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
						<div>
							<DialogTitle className="text-lg font-semibold">{m.compareResults()}</DialogTitle>
							<DialogDescription className="text-sm text-muted-foreground">
								{input.name}
								{input.duration !== null ? ` · ${input.duration}s` : ''}
							</DialogDescription>
						</div>
						<div className="flex flex-wrap items-center gap-3">
							<label className="flex items-center gap-2 text-sm text-muted-foreground">
								{m.compareBaseline()}
								<Select value={baseline?.model.path ?? ''} onValueChange={setBaselinePath}>
									<SelectTrigger className="w-56">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{done.map((run) => (
											<SelectItem key={run.model.path} value={run.model.path}>
												{run.model.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</label>
							<label className="flex items-center gap-2 text-sm text-muted-foreground">
								{m.compareHighlight()}
								<Switch checked={highlight} onCheckedChange={setHighlight} aria-label={m.compareHighlight()} />
							</label>
						</div>
					</header>

					<div className="flex flex-1 overflow-x-auto">
						{done.map((run) => {
							const isBaseline = run.model.path === baseline?.model.path
							const text = segmentsText(run.segments ?? [])
							const words = tokenize(text).length
							return (
								<section key={run.model.path} className="flex min-w-[24rem] flex-1 basis-0 flex-col border-e border-border last:border-e-0">
									<div className="flex flex-col gap-2 border-b border-border bg-background/95 px-4 py-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<span className="truncate text-sm font-semibold">{run.model.name}</span>
											<span className="text-xs text-muted-foreground">
												{run.seconds ?? 0}s · {m.compareWordCount({ count: words })}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												disabled={!run.outputPath}
												onClick={() => {
													if (run.outputPath) void openPath({ name: run.model.name, path: run.outputPath })
												}}>
												<FolderOpen />
												{m.showInFolder()}
											</Button>
										</div>
									</div>
									<div className={cn('flex-1 overflow-y-auto px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap')}>
										{highlight && !isBaseline ? <DiffText parts={diffWords(baselineText, text)} /> : text}
									</div>
								</section>
							)
						})}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
