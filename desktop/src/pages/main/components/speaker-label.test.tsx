// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { m } from '~/paraglide/messages.js'
import { SpeakerLabel } from './speaker-label'

const noop = () => {}
const label = () => m.speakerPrefix()

function renderLabel(props: { speaker?: number; speakerSet?: number[]; editable?: boolean }) {
	return render(
		<SpeakerLabel
			speaker={props.speaker}
			speakerSet={props.speakerSet}
			speakers={[0, 1]}
			editable={props.editable ?? false}
			onRename={noop}
			onAssign={noop}
		/>,
	)
}

afterEach(cleanup)

describe('speaker labels', () => {
	it('shows a single-speaker line exactly as before', () => {
		const { container, queryByTitle } = renderLabel({ speaker: 1, speakerSet: [1] })

		expect(container.textContent).toBe(`${label()} 2`)
		expect(container.textContent).not.toContain('?')
		expect(queryByTitle(m.speakerUncertain())).toBeNull()
	})

	it('marks a boundary line with the union and an uncertainty note', () => {
		const { container, getByTitle } = renderLabel({ speaker: 0, speakerSet: [0, 1] })

		expect(container.textContent).toBe(`${label()} 1 / ${label()} 2?`)
		expect(getByTitle(m.speakerUncertain())).toBeTruthy()
	})

	it('keeps the same union on an editable transcript', () => {
		const { container, getByTitle } = renderLabel({ speaker: 0, speakerSet: [0, 1], editable: true })

		expect(container.textContent).toBe(`${label()} 1 / ${label()} 2?`)
		expect(getByTitle(m.speakerUncertain())).toBeTruthy()
	})
})
