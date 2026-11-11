// Word-level diff for reading two transcripts side by side. Whitespace rides along
// inside the tokens so the rendered text still reads like the original; anything
// larger than the cap degrades to "no highlight" instead of a frozen dialog.

export type DiffKind = 'same' | 'added' | 'removed'

export interface DiffPart {
	kind: DiffKind
	text: string
}

/** Above this, the LCS table is not worth the memory: the dialog shows plain text. */
export const MAX_DIFF_TOKENS = 1500

/** Words with their trailing whitespace, so joining the tokens restores the text. */
export function tokenize(text: string): string[] {
	return text.match(/\S+\s*/g) ?? []
}

/**
 * `base` is the reference: tokens only it has are `removed`, tokens only the
 * candidate has are `added`, and equal runs stay `same`. Identical inputs return
 * one `same` part.
 */
export function diffWords(base: string, candidate: string): DiffPart[] {
	const a = tokenize(base)
	const b = tokenize(candidate)
	if (a.length > MAX_DIFF_TOKENS || b.length > MAX_DIFF_TOKENS) return [{ kind: 'same', text: candidate }]

	// Compare without trailing whitespace: the last word of one text and the same word
	// mid-sentence in the other must still count as the same word.
	const comparableA = a.map((token) => token.trimEnd())
	const comparableB = b.map((token) => token.trimEnd())

	const width = b.length + 1
	// One direction byte per cell: 0 diagonal, 1 up (a token removed), 2 left (b token added).
	const direction = new Uint8Array((a.length + 1) * width)
	const previous = new Uint32Array(width)
	const current = new Uint32Array(width)
	for (let i = 1; i <= a.length; i++) {
		current[0] = 0
		for (let j = 1; j <= b.length; j++) {
			const cell = i * width + j
			if (comparableA[i - 1] === comparableB[j - 1]) {
				current[j] = previous[j - 1] + 1
				direction[cell] = 0
			} else if (previous[j] >= current[j - 1]) {
				current[j] = previous[j]
				direction[cell] = 1
			} else {
				current[j] = current[j - 1]
				direction[cell] = 2
			}
		}
		previous.set(current)
	}

	const raw: DiffPart[] = []
	let i = a.length
	let j = b.length
	while (i > 0 || j > 0) {
		const step = i > 0 && j > 0 ? direction[i * width + j] : i > 0 ? 1 : 2
		if (step === 0) {
			// The candidate's spelling carries the spacing, so the candidate column reads
			// back exactly when same and added parts are joined.
			raw.push({ kind: 'same', text: b[j - 1]! })
			i--
			j--
		} else if (step === 1) {
			raw.push({ kind: 'removed', text: a[i - 1]! })
			i--
		} else {
			raw.push({ kind: 'added', text: b[j - 1]! })
			j--
		}
	}
	raw.reverse()

	// Merge neighbors of the same kind so the renderer emits one span per run.
	const parts: DiffPart[] = []
	for (const part of raw) {
		const last = parts[parts.length - 1]
		if (last && last.kind === part.kind) last.text += part.text
		else parts.push({ ...part })
	}
	// A replacement backtracks as added-then-removed; read it as the old words then the new.
	for (let index = 0; index < parts.length - 1; index++) {
		const current = parts[index]!
		const next = parts[index + 1]!
		if (current.kind === 'added' && next.kind === 'removed') {
			parts[index] = next
			parts[index + 1] = current
		}
	}
	return parts
}

/** The plain text of a transcript, one line per segment, as the diff and the view consume it. */
export function segmentsText(segments: { text: string }[]): string {
	return segments
		.map((segment) => segment.text.trim())
		.filter(Boolean)
		.join('\n')
}
