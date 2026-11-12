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
import { diffWords, tokenize, type DiffPart } from '~/lib/text-diff'

interface ComparisonResultsProps {
	input: { name: string; duration: number | null }
	runs: ComparisonRun[]
	open: boolean
	onOpenChange: (open: boolean) => void
}

/**
 * One line per segment, with the speaker when the comparison asked for separation.
 * The same string feeds the rendering and the diff, so a speaker change is visible
 * as a difference too.
 */
function transcriptText(segments: ComparisonRun['segments']): string {
	const label = m.speakerPrefix()
	return (segments ?? [])
		.map((segment) => {
			const text = segment.text.trim()
			if (!text) return ''
			return segment.speaker != null ? `[${label} ${segment.speaker + 1}] ${text}` : text
		})
		.filter(Boolean)
		.join('\n')
}

function wordCount(parts: DiffPart[], kind: DiffPart['kind']): number {
	return parts.filter((part) => part.kind === kind).reduce((count, part) => count + tokenize(part.text).length, 0)
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
								? 'rounded-[2px] bg-emerald-500/25 text-emerald-800 dark:text-emerald-200'
								: 'rounded-[2px] bg-red-500/20 text-red-700 line-through decoration-red-500/70 dark:text-red-300'
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
	const baselineText = useMemo(() => transcriptText(baseline?.segments ?? []), [baseline])

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="!start-0 !top-0 h-dvh max-h-none w-screen max-w-none !translate-x-0 !translate-y-0 gap-0 overflow-hidden rounded-none border-0 p-0 sm:rounded-none rtl:!translate-x-0">
				<div className="flex h-full min-h-0 flex-col">
					<header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pe-16 ps-6 py-4">
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

					<div className="flex min-h-0 flex-1 overflow-x-auto">
						{done.map((run) => {
							const isBaseline = run.model.path === baseline?.model.path
							const text = transcriptText(run.segments ?? [])
							const words = tokenize(text).length
							const diff = isBaseline ? null : diffWords(baselineText, text)
							const added = diff?.complete ? wordCount(diff.parts, 'added') : 0
							const removed = diff?.complete ? wordCount(diff.parts, 'removed') : 0
							return (
								<section
									key={run.model.path}
									className="flex min-h-0 min-w-[24rem] flex-1 basis-0 flex-col border-e border-border last:border-e-0">
									<div className="flex flex-col gap-2 border-b border-border bg-background/95 px-4 py-3">
										<div className="flex flex-wrap items-center justify-between gap-2">
											<span className="truncate text-sm font-semibold">{run.model.name}</span>
											<span className="text-xs text-muted-foreground">
												{run.seconds ?? 0}s · {m.compareWordCount({ count: words })}
												{!isBaseline &&
													(diff?.complete ? (
														<span className="ms-2 tabular-nums">
															<span className="text-emerald-600 dark:text-emerald-400">+{added}</span>{' '}
															<span className="text-red-600 dark:text-red-400">−{removed}</span>
														</span>
													) : (
														<span className="ms-2 text-amber-600 dark:text-amber-400">
															{m.compareTooLongNote()}
														</span>
													))}
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
									<div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
										{highlight && diff?.complete ? <DiffText parts={diff.parts} /> : text}
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
