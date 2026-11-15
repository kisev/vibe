import { Dialog, DialogContent } from '~/components/ui/dialog'
import { m } from '~/paraglide/messages.js'

interface PrivacyPolicyProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

/** The PDF ships in every build, so it loads from the base the build was made for. */
const privacyPolicyURL = `${import.meta.env.BASE_URL}privacy_policy.pdf`

export default function PrivacyPolicy({ open, onOpenChange }: PrivacyPolicyProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className="m-0 !h-[80vh] !w-[95vw] !max-w-[880px] select-none overflow-hidden rounded-2xl border border-border !p-0 sm:!h-[96vh] sm:!w-[75vw]">
				<iframe src={privacyPolicyURL} className="m-0 h-full w-full border-0 bg-muted p-0" title={m['privacy-policy']()} />
			</DialogContent>
		</Dialog>
	)
}
