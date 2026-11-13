// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { m } from '~/paraglide/messages.js'
import type { ComparisonRun } from '~/lib/model-comparison'
import { ModelsComparisonResults } from './models-comparison-results'

vi.mock('~/lib/app', () => ({ openPath: vi.fn() }))

// jsdom has no pointer-capture API; Radix's dialog and select call it.
beforeAll(() => {
	Element.prototype.hasPointerCapture ??= () => false
	Element.prototype.releasePointerCapture ??= () => {}
	Element.prototype.setPointerCapture ??= () => {}
	Element.prototype.scrollIntoView ??= () => {}
})

afterEach(cleanup)

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
})
