import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { ModifyState } from '~/lib/types'
import SettingsPage from '~/pages/settings/page'

interface SettingsModalProps {
	visible: boolean
	setVisible: ModifyState<boolean>
	scrollTo?: string
}

export default function SettingsModal({ visible, setVisible, scrollTo }: SettingsModalProps) {
	useEffect(() => {
		if (!visible) return

		const prevBodyOverflow = document.body.style.overflow
		const prevHtmlOverflow = document.documentElement.style.overflow
		document.body.style.overflow = 'hidden'
		document.documentElement.style.overflow = 'hidden'

		return () => {
			document.body.style.overflow = prevBodyOverflow
			document.documentElement.style.overflow = prevHtmlOverflow
		}
	}, [visible])

	// The compact main window has no room for the catalog; zoom the window to the
	// screen while settings is open and restore the user's size on close.
	useEffect(() => {
		if (!visible) return
		const appWindow = getCurrentWindow()
		let restore = false
		let closed = false
		appWindow
			.isMaximized()
			.then((maximized) => {
				if (closed || maximized) return
				restore = true
				return appWindow.maximize()
			})
			.catch(() => {})
		return () => {
			closed = true
			if (restore) appWindow.unmaximize().catch(() => {})
		}
	}, [visible])

	if (!visible) return null

	return (
		<div className="fixed inset-0 z-50 overflow-hidden bg-black/45 backdrop-blur-md" onMouseDown={() => setVisible(false)}>
			<div className="h-full overflow-y-auto overscroll-contain" onMouseDown={() => setVisible(false)}>
				<SettingsPage setVisible={setVisible} scrollTo={scrollTo} />
			</div>
		</div>
	)
}
