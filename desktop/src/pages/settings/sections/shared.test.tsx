// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { m } from '~/paraglide/messages.js'
import { SettingsRow } from './shared'

afterEach(cleanup)

function renderRow(description?: string) {
	return render(
		<TooltipProvider delayDuration={0}>
			<SettingsRow label="Sample parameter" description={description}>
				<span>control</span>
			</SettingsRow>
		</TooltipProvider>,
	)
}

describe('settings row help', () => {
	it('renders the description in a tooltip behind the info icon', async () => {
		const user = userEvent.setup()
		renderRow(m.infoTheme())

		const info = screen.getByRole('button', { name: m.parameterHelp() })
		await user.hover(info)

		const tooltip = await screen.findByRole('tooltip')
		expect(tooltip.textContent).toBe(m.infoTheme())
	})

	it('renders no info icon when the row has no description', () => {
		renderRow()
		expect(screen.queryByRole('button', { name: m.parameterHelp() })).toBeNull()
	})
})
