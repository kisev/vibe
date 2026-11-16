// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import { openPath } from '~/lib/app'
import type { ComparisonRun } from '~/lib/model-comparison'
import { ModelsComparisonResults } from './models-comparison-results'

const openPathMock = vi.mocked(openPath)

vi.mock('~/lib/app', () => ({ openPath: vi.fn() }))

// jsdom has no pointer-capture API; Radix's dialog and select call it.
beforeAll(() => {
	Element.prototype.hasPointerCapture ??= () => false
	Element.prototype.releasePointerCapture ??= () => {}
	Element.prototype.setPointerCapture ??= () => {}
	Element.prototype.scrollIntoView ??= () => {}
})

afterEach(() => {
	cleanup()
	openPathMock.mockClear()
})

function run(name: string, overrides: Partial<ComparisonRun> = {}): ComparisonRun {
	return {
		model: { name, path: `/models/${name.toLowerCase()}.gguf` },
		status: 'done',
		seconds: 3,
		segments: [],
		...overrides,
	}
}

function renderResults(runs: ComparisonRun[]) {
	return render(<ModelsComparisonResults input={{ name: 'clip.wav', duration: 12 }} runs={runs} open onOpenChange={() => {}} />)
}

describe('comparison results', () => {
	it('keeps a failed model as a column with its error', async () => {
		const user = userEvent.setup()
		renderResults([
			run('Alpha', { segments: [{ start: 0, stop: 1, text: 'hello world' }] }),
			run('Beta', { seconds: 4, segments: [{ start: 0, stop: 1, text: 'hello there' }] }),
			run('Gamma', { status: 'error', error: 'model failed to load' }),
		])

		const columns = screen.getAllByRole('region')
		expect(columns.map((column) => column.getAttribute('aria-label'))).toEqual(['Alpha', 'Beta', 'Gamma'])
		expect(screen.getByText(`${m.error()}: model failed to load`)).toBeTruthy()

		// Only the models that produced a transcript can be a baseline.
		await user.click(screen.getByRole('combobox'))
		expect(await screen.findByRole('option', { name: 'Alpha' })).toBeTruthy()
		expect(screen.getByRole('option', { name: 'Beta' })).toBeTruthy()
		expect(screen.queryByRole('option', { name: 'Gamma' })).toBeNull()
	})

	it('says every model failed and offers no baseline when none finished', () => {
		renderResults([
			run('Alpha', { status: 'error', error: 'model failed to load' }),
			run('Beta', { status: 'error', error: 'out of memory' }),
		])

		expect(screen.getByText(m.compareAllFailed())).toBeTruthy()
		expect(screen.getByText(`${m.error()}: out of memory`)).toBeTruthy()
		expect(screen.getAllByRole('region')).toHaveLength(2)
		expect(screen.queryByText(m.compareBaseline())).toBeNull()
		expect(screen.queryByRole('combobox')).toBeNull()
	})

	it('puts the speaker on every diarized transcript line', () => {
		renderResults([
			run('Alpha', {
				segments: [
					{ start: 0, stop: 1, text: 'hello', speaker: 1 },
					{ start: 1, stop: 2, text: 'there', speaker: 2 },
				],
			}),
		])

		const [column] = screen.getAllByRole('region')
		expect(within(column!).getByText(new RegExp(`\\[${m.speakerPrefix()} 1\\] hello`))).toBeTruthy()
		expect(within(column!).getByText(new RegExp(`\\[${m.speakerPrefix()} 2\\] there`))).toBeTruthy()
	})

	it('states added and removed word counts, and recomputes them when the baseline changes', async () => {
		const user = userEvent.setup()
		renderResults([
			run('Alpha', { segments: [{ start: 0, stop: 1, text: 'hello world' }] }),
			run('Beta', { seconds: 4, segments: [{ start: 0, stop: 1, text: 'hello there' }] }),
		])

		const alpha = screen.getByRole('region', { name: 'Alpha' })
		const beta = screen.getByRole('region', { name: 'Beta' })
		// Alpha is the baseline: no counts of its own, Beta states what it changed.
		expect(within(alpha).queryByText('+1')).toBeNull()
		expect(within(beta).getByText('+1')).toBeTruthy()
		expect(within(beta).getByText('−1')).toBeTruthy()

		await user.click(screen.getByRole('combobox'))
		await user.click(await screen.findByRole('option', { name: 'Beta' }))

		expect(within(alpha).getByText('+1')).toBeTruthy()
		expect(within(alpha).getByText('−1')).toBeTruthy()
		expect(within(beta).queryByText('+1')).toBeNull()
	})

	it('marks the differences against the baseline and reads as plain text with highlighting off', async () => {
		const user = userEvent.setup()
		renderResults([
			run('Alpha', { segments: [{ start: 0, stop: 1, text: 'hello world' }] }),
			run('Beta', { seconds: 4, segments: [{ start: 0, stop: 1, text: 'hello there' }] }),
		])

		const beta = screen.getByRole('region', { name: 'Beta' })
		expect(within(beta).getByText('world').className).toContain('line-through')
		expect(within(beta).getByText('there').className).toContain('bg-emerald-500/25')

		await user.click(screen.getByRole('switch', { name: m.compareHighlight() }))

		expect(within(beta).queryByText('world')).toBeNull()
		expect(within(beta).getByText('hello there')).toBeTruthy()
	})

	it('keeps every transcript in its own scroll region under a header that reserves the close control', () => {
		renderResults([run('Alpha', { segments: [{ start: 0, stop: 1, text: 'hello world' }] })])

		// The dialog portals out of the render container, so the header is read from the document.
		const header = document.querySelector('header')
		expect(header?.className).toContain('pe-16')
		const scroller = screen.getByText('hello world')
		expect(scroller.className).toContain('overflow-y-auto')
		expect(scroller.className).toContain('min-h-0')
		expect(scroller.contains(header)).toBe(false)
	})

	it('reveals the markdown file written for a column', async () => {
		const user = userEvent.setup()
		renderResults([run('Alpha', { outputPath: '/out/Alpha.md' }), run('Beta', { outputPath: '/out/Beta.md' })])

		const beta = screen.getByRole('region', { name: 'Beta' })
		await user.click(within(beta).getByRole('button', { name: m.showInFolder() }))

		expect(openPathMock).toHaveBeenCalledWith({ name: 'Beta', path: '/out/Beta.md' })
	})
})
