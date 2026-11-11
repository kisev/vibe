import { BrowserRouter } from 'react-router-dom'
import App from './app'
import DictationIndicatorWindow from './windows/dictation-indicator-window'
import MeetingBarWindow from './windows/meeting-bar-window'
import MeetingPromptWindow from './windows/meeting-prompt-window'

export default function Root() {
	const params = new URLSearchParams(window.location.search)
	const windowName = params.get('window')

	if (windowName === 'dictation-indicator') return <DictationIndicatorWindow />
	if (windowName === 'meeting-prompt') return <MeetingPromptWindow />
	if (windowName === 'meeting-bar') {
		const session = Number(params.get('session'))
		return Number.isSafeInteger(session) && session > 0 ? <MeetingBarWindow session={session} /> : null
	}

	return (
		<BrowserRouter>
			<App />
		</BrowserRouter>
	)
}
