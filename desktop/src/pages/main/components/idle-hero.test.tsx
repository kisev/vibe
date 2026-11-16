// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TooltipProvider } from '~/components/ui/tooltip'
import { m } from '~/paraglide/messages.js'
import IdleHero from './idle-hero'

const mocks = vi.hoisted(() => ({
	invoke: vi.fn(async () => undefined),
	session: {
		dragging: false,
		browse: vi.fn(async () => {}),
		collectingFolder: false,
		panel: 'browser' as const,
		setPanel: vi.fn(),
		link: { switchToLinkTab: vi.fn(async () => {}) },
		recording: { isRecording: false },
	},
}))

vi.mock('@tauri-apps/api/core', () => ({ invoke: mocks.invoke }))
vi.mock('../session', () => ({ useSession: () => mocks.session }))
// The quiet row reads model gates from a provider this test does not mount; it is not the subject.
vi.mock('./quiet-row', () => ({ default: () => null }))

function renderBrowserPanel() {
	return render(
		<TooltipProvider>
			<IdleHero />
		</TooltipProvider>,
	)
}

beforeEach(() => {
	mocks.invoke.mockClear()
	mocks.session.setPanel.mockClear()
})

afterEach(cleanup)

describe('opening a link from the home page', () => {
	it('offers the browser as a visible source, without visiting Settings', async () => {
		renderBrowserPanel()
		expect(await screen.findByRole('button', { name: m.meetingBrowserTitle() })).toBeTruthy()
		expect(await screen.findByRole('button', { name: m.openInVibe() })).toBeTruthy()
	})

	it('opens a bare domain in the embedded browser over https', async () => {
		renderBrowserPanel()
		await userEvent.type(await screen.findByPlaceholderText(m.meetingBarAddress()), 'meet.example.com')
		await userEvent.click(screen.getByRole('button', { name: m.openInVibe() }))

		await waitFor(() =>
			expect(mocks.invoke).toHaveBeenCalledWith('open_meeting_browser', {
				url: 'https://meet.example.com',
			}),
		)
	})

	it('upgrades an http link, since the page webview loads https only', async () => {
		renderBrowserPanel()
		await userEvent.type(await screen.findByPlaceholderText(m.meetingBarAddress()), 'http://meet.example.com/room')
		await userEvent.click(screen.getByRole('button', { name: m.openInVibe() }))

		await waitFor(() =>
			expect(mocks.invoke).toHaveBeenCalledWith('open_meeting_browser', {
				url: 'https://meet.example.com/room',
			}),
		)
	})

	it('hands a meeting scheme to Rust instead of loading it as a URL', async () => {
		renderBrowserPanel()
		await userEvent.type(await screen.findByPlaceholderText(m.meetingBarAddress()), 'zoommtg://zoom.us/join?action=join')
		await userEvent.click(screen.getByRole('button', { name: m.openInVibe() }))

		await waitFor(() =>
			expect(mocks.invoke).toHaveBeenCalledWith('open_meeting_link', {
				raw: 'zoommtg://zoom.us/join?action=join',
			}),
		)
		expect(mocks.invoke).not.toHaveBeenCalledWith('open_meeting_browser', expect.anything())
	})
})
