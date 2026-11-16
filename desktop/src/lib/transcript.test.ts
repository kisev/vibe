import { describe, expect, it } from 'vitest'
import { asText, speakerName, type Segment } from './transcript'

const segments: Segment[] = [
	{ start: 0, stop: 100, text: 'Hi', speaker: 1 },
	{ start: 100, stop: 200, text: 'Hello', speaker: 2 },
]

describe('speakerName', () => {
	it('prefers the chosen name and falls back to a numbered label', () => {
		expect(speakerName(1, 'Speaker', { 1: 'Jim' })).toBe('Jim')
		expect(speakerName(2, 'Speaker', { 1: 'Jim' })).toBe('Speaker 2')
		expect(speakerName(1, 'Speaker', { 1: '   ' })).toBe('Speaker 1')
		expect(speakerName(1, 'Sprecher')).toBe('Sprecher 1')
	})

	it('reaches the plain-text serializer', () => {
		expect(asText(segments, 'Speaker', { 2: 'Susan' })).toBe('[Speaker 1] Hi\n[Susan] Hello\n')
	})
})
