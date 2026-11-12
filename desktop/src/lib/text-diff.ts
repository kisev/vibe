// Word-level diff for reading two transcripts side by side. Whitespace rides along
// inside the tokens so the rendered text still reads like the original. The edit
// script comes from Myers' algorithm (O((N+M)·D) time, D = number of edits), so
// transcripts of realistic length are compared instead of being reported as equal;
// when even that would exceed the budget the result is marked incomplete and the
// view says so instead of printing a bogus "no differences".

export type DiffKind = 'same' | 'added' | 'removed'

export interface DiffPart {
	kind: DiffKind
	text: string
}

export interface DiffResult {
	/** Ordered runs; joining `same` and `added` restores the candidate text. */
	parts: DiffPart[]
	/** False when the inputs exceeded the budget, so `parts` is just the plain text. */
	complete: boolean
}

/** Above this many tokens on either side, the diff is not attempted. */
export const MAX_DIFF_TOKENS = 20_000

/**
 * Myers stops once the edit script is this long: more changes than this in one pair
 * of transcripts is not a useful highlight, and the trace memory grows with D².
 */
export const MAX_DIFF_EDITS = 2_000

/** Words with their trailing whitespace, so joining the tokens restores the text. */
export function tokenize(text: string): string[] {
	return text.match(/\S+\s*/g) ?? []
}

interface Edit {
	kind: DiffKind
	/** Index into the base token array for `same` and `removed`. */
	a?: number
	/** Index into the candidate token array for `same` and `added`. */
	b?: number
}

/**
 * Myers' greedy diff over the middle tokens. Returns the edits in reading order, or
 * `null` when the script would need more than `MAX_DIFF_EDITS` entries.
 */
function myers(a: string[], b: string[]): Edit[] | null {
	const n = a.length
	const m = b.length
	if (n === 0 && m === 0) return []

	// One furthest-reaching x per diagonal k; `v[k]` is from the previous round.
	const max = n + m
	const offset = max + 1
	const v = new Int32Array(2 * max + 3).fill(-1)
	v[offset + 1] = 0
	// Compact snapshots of `v`: row d holds only diagonals [-d, d], so the trace is
	// O(D²) instead of O(D·(N+M)).
	const trace: Int32Array[] = []

	for (let d = 0; d <= max; d++) {
		if (d > MAX_DIFF_EDITS) return null
		const row = new Int32Array(2 * d + 1)
		for (let k = -d; k <= d; k += 2) {
			let x: number
			if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
				x = v[offset + k + 1]
			} else {
				x = v[offset + k - 1] + 1
			}
			let y = x - k
			while (x < n && y < m && a[x] === b[y]) {
				x++
				y++
			}
			v[offset + k] = x
			row[d + k] = x
			if (x >= n && y >= m) {
				trace.push(row)
				return backtrack(a.length, b.length, trace)
			}
		}
		trace.push(row)
	}
	return null
}

/** Walks the trace backwards, then reverses the edits into reading order. */
function backtrack(n: number, m: number, trace: Int32Array[]): Edit[] {
	const edits: Edit[] = []
	let x = n
	let y = m

	for (let d = trace.length - 1; d > 0; d--) {
		const previous = trace[d - 1]!
		const previousOffset = d - 1
		const k = x - y
		const previousK =
			k === -d || (k !== d && previous[previousOffset + k - 1] < previous[previousOffset + k + 1])
				? k + 1
				: k - 1
		const previousX = previous[previousOffset + previousK]
		const previousY = previousX - previousK

		while (x > previousX && y > previousY) {
			edits.push({ kind: 'same', a: x - 1, b: y - 1 })
			x--
			y--
		}
		if (x === previousX) {
			edits.push({ kind: 'added', b: y - 1 })
			y--
		} else {
			edits.push({ kind: 'removed', a: x - 1 })
			x--
		}
	}

	while (x > 0 && y > 0) {
		edits.push({ kind: 'same', a: x - 1, b: y - 1 })
		x--
		y--
	}
	while (x > 0) edits.push({ kind: 'removed', a: --x })
	while (y > 0) edits.push({ kind: 'added', b: --y })

	edits.reverse()
	return edits
}

/** Merge neighboring runs and read a replacement as the old words then the new. */
function merge(raw: DiffPart[]): DiffPart[] {
	const parts: DiffPart[] = []
	for (const part of raw) {
		const last = parts[parts.length - 1]
		if (last && last.kind === part.kind) last.text += part.text
		else parts.push({ ...part })
	}
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

/**
 * `base` is the reference: tokens only it has are `removed`, tokens only the
 * candidate has are `added`, and equal runs stay `same`. Identical inputs return
 * one `same` part with `complete: true`; an input over the budget returns the plain
 * candidate text with `complete: false` so the caller can distinguish it from equality.
 */
export function diffWords(base: string, candidate: string): DiffResult {
	const tokensA = tokenize(base)
	const tokensB = tokenize(candidate)
	const incomplete = (): DiffResult => ({ parts: [{ kind: 'same', text: candidate }], complete: false })

	if (tokensA.length > MAX_DIFF_TOKENS || tokensB.length > MAX_DIFF_TOKENS) return incomplete()

	// Compare without trailing whitespace: the last word of one text and the same word
	// mid-sentence in the other must still count as the same word.
	const comparableA = tokensA.map((token) => token.trimEnd())
	const comparableB = tokensB.map((token) => token.trimEnd())

	// Common head and tail can never be part of the edit script; skipping them keeps
	// the Myers search small for the usual "almost identical transcripts" case.
	let start = 0
	while (start < tokensA.length && start < tokensB.length && comparableA[start] === comparableB[start]) start++

	let endA = tokensA.length
	let endB = tokensB.length
	while (endA > start && endB > start && comparableA[endA - 1] === comparableB[endB - 1]) {
		endA--
		endB--
	}

	const edits = myers(comparableA.slice(start, endA), comparableB.slice(start, endB))
	if (!edits) return incomplete()

	const raw: DiffPart[] = []
	if (start > 0) raw.push({ kind: 'same', text: tokensB.slice(0, start).join('') })
	for (const edit of edits) {
		// The candidate's spelling carries the spacing, so same and added parts read back
		// exactly as the candidate when joined.
		const text = edit.kind === 'removed' ? tokensA[start + edit.a!]! : tokensB[start + edit.b!]!
		raw.push({ kind: edit.kind, text })
	}
	if (endB < tokensB.length) raw.push({ kind: 'same', text: tokensB.slice(endB).join('') })

	return { parts: merge(raw), complete: true }
}

/** The plain text of a transcript, one line per segment, as the diff and the view consume it. */
export function segmentsText(segments: { text: string }[]): string {
	return segments
		.map((segment) => segment.text.trim())
		.filter(Boolean)
		.join('\n')
}
