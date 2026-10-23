// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ModelGlyph } from './brand-glyph'

afterEach(cleanup)

describe('ModelGlyph', () => {
	it('shows the GigaAM mark for GigaAM files', () => {
		render(<ModelGlyph name="gigaam-v3-e2e-rnnt-Q8_0.gguf" />)
		expect(screen.getByRole('img', { name: 'GigaAM' })).toBeTruthy()
	})

	it('falls back to the generic mark for an unknown model', () => {
		const { container } = render(<ModelGlyph name="my-custom-model.gguf" />)
		expect(screen.queryByRole('img', { name: 'GigaAM' })).toBeNull()
		expect(screen.queryByRole('img')).toBeNull()
		expect(container.querySelector('svg')).toBeTruthy()
	})
})
