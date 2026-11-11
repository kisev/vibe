import { describe, expect, it } from 'vitest'
import { diffWords, segmentsText, tokenize } from './text-diff'

describe('diffWords', () => {
	it('returns one unchanged part for identical text', () => {
		expect(diffWords('the cat sat down', 'the cat sat down')).toEqual([{ kind: 'same', text: 'the cat sat down' }])
	})

	it('marks a word only the baseline has as removed and a new word as added', () => {
		const parts = diffWords('the cat sat', 'the dog sat')

		expect(parts.map((part) => part.kind)).toEqual(['same', 'removed', 'added', 'same'])
		expect(parts.map((part) => part.text)).toEqual(['the ', 'cat ', 'dog ', 'sat'])
	})

	it('keeps trailing whitespace inside the tokens so the candidate reads back', () => {
		const parts = diffWords('one two three', 'one three four')
		const candidate = parts
			.filter((part) => part.kind !== 'removed')
			.map((part) => part.text)
			.join('')

		expect(candidate).toBe('one three four')
	})

	it('marks an entirely new tail as added', () => {
		const parts = diffWords('hello', 'hello again friend')

		expect(parts).toEqual([
			{ kind: 'same', text: 'hello ' },
			{ kind: 'added', text: 'again friend' },
		])
	})

	it('degrades to plain text past the token cap instead of building a huge table', () => {
		const base = 'word '.repeat(1600)
		const candidate = 'other '.repeat(1600)

		expect(diffWords(base, candidate)).toEqual([{ kind: 'same', text: candidate }])
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
		const parts = diffWords(base, candidate)
		expect(parts.some((part) => part.kind === 'added')).toBe(true)
		expect(parts.some((part) => part.kind === 'removed')).toBe(true)
	})
})
