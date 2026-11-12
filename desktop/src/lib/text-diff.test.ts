import { describe, expect, it } from 'vitest'
import { diffWords, MAX_DIFF_TOKENS, segmentsText, tokenize, type DiffPart } from './text-diff'

function count(parts: DiffPart[], kind: DiffPart['kind']): number {
	return parts.filter((part) => part.kind === kind).reduce((total, part) => total + tokenize(part.text).length, 0)
}

describe('diffWords', () => {
	it('returns one unchanged part for identical text', () => {
		expect(diffWords('the cat sat down', 'the cat sat down')).toEqual({
			parts: [{ kind: 'same', text: 'the cat sat down' }],
			complete: true,
		})
	})

	it('marks a word only the baseline has as removed and a new word as added', () => {
		const { parts } = diffWords('the cat sat', 'the dog sat')

		expect(parts.map((part) => part.kind)).toEqual(['same', 'removed', 'added', 'same'])
		expect(parts.map((part) => part.text)).toEqual(['the ', 'cat ', 'dog ', 'sat'])
	})

	it('keeps trailing whitespace inside the tokens so the candidate reads back', () => {
		const { parts, complete } = diffWords('one two three', 'one three four')
		const candidate = parts
			.filter((part) => part.kind !== 'removed')
			.map((part) => part.text)
			.join('')

		expect(complete).toBe(true)
		expect(candidate).toBe('one three four')
	})

	it('marks an entirely new tail as added', () => {
		const { parts } = diffWords('hello', 'hello again friend')

		expect(parts).toEqual([
			{ kind: 'same', text: 'hello ' },
			{ kind: 'added', text: 'again friend' },
		])
	})

	it('reports an incomplete diff past the token cap instead of pretending there are none', () => {
		const base = 'word '.repeat(MAX_DIFF_TOKENS + 1)
		const candidate = 'other '.repeat(MAX_DIFF_TOKENS + 1)

		expect(diffWords(base, candidate)).toEqual({
			parts: [{ kind: 'same', text: candidate }],
			complete: false,
		})
	})
})

describe('tokenize', () => {
	it('returns words with their trailing whitespace', () => {
		expect(tokenize('one two\nthree')).toEqual(['one ', 'two\n', 'three'])
	})

	it('returns nothing for empty input', () => {
		expect(tokenize('   ')).toEqual([])
	})
})

describe('segmentsText', () => {
	it('joins trimmed non-empty segments with newlines', () => {
		expect(segmentsText([{ text: ' hello ' }, { text: '   ' }, { text: 'world' }])).toBe('hello\nworld')
	})
})

describe('diffWords on realistic transcripts', () => {
	it('finds differences between two model outputs', () => {
		const base = 'Привет, как дела? Сегодня мы обсудим новый релиз.\nДавай начнём с бэкенда.'
		const candidate = 'Привет, как у тебя дела? Сегодня обсудим новый релиз.\nНачнём с бэкенда.'
		const { parts } = diffWords(base, candidate)
		expect(parts.some((part) => part.kind === 'added')).toBe(true)
		expect(parts.some((part) => part.kind === 'removed')).toBe(true)
	})

	it('diffs a transcript of more than ten thousand tokens', () => {
		const tokens = Array.from({ length: 12_000 }, (_, index) => `w${index}`)
		const base = tokens.join(' ')
		const candidate = tokens.map((token, index) => (index % 100 === 7 ? `x${index}` : token)).join(' ')

		const { parts, complete } = diffWords(base, candidate)
		const readsBack = parts
			.filter((part) => part.kind !== 'removed')
			.map((part) => part.text)
			.join('')

		expect(complete).toBe(true)
		expect(count(parts, 'added')).toBe(120)
		expect(count(parts, 'removed')).toBe(120)
		expect(readsBack).toBe(candidate)
	})

	it('stays within budget for a ten-thousand-token text with many differences', () => {
		const tokens = Array.from({ length: 10_000 }, (_, index) => `w${index}`)
		const base = tokens.join(' ')
		// Every twentieth word is a substitution: 500 edits on each side, close to the cap.
		const candidate = tokens.map((token, index) => (index % 20 === 3 ? `x${index}` : token)).join(' ')

		const started = performance.now()
		const { parts, complete } = diffWords(base, candidate)
		const elapsed = performance.now() - started

		expect(complete).toBe(true)
		expect(count(parts, 'added')).toBe(500)
		expect(count(parts, 'removed')).toBe(500)
		expect(elapsed).toBeLessThan(1000)
	})

	it('gives up quickly on a pathological diff and marks it incomplete', () => {
		const base = Array.from({ length: 10_000 }, (_, index) => `a${index}`).join(' ')
		const candidate = Array.from({ length: 10_000 }, (_, index) => `b${index}`).join(' ')

		const started = performance.now()
		const result = diffWords(base, candidate)
		const elapsed = performance.now() - started

		expect(result.complete).toBe(false)
		expect(result.parts).toEqual([{ kind: 'same', text: candidate }])
		expect(elapsed).toBeLessThan(1000)
	})
})
