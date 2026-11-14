import { m } from '../paraglide/messages.js'
import { productionSiteURL, siteRouter } from '~/lib/site'

/**
 * Marks a dev build as a preview and links back to the release site, so a shared
 * `/vibe/dev/` link cannot be mistaken for the released page. Builds without
 * hash routing render nothing.
 */
export default function DevBanner() {
	if (siteRouter() !== 'hash') return null

	return (
		<div
			role="note"
			className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-900 dark:text-amber-200">
			<span className="font-medium">{m['dev-preview-banner']()}</span>{' '}
			<a className="underline underline-offset-2 hover:no-underline" href={productionSiteURL}>
				{m['dev-preview-link']()}
			</a>
		</div>
	)
}
