import { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ModifyState } from '~/lib/types'
import { m } from '~/paraglide/messages.js'

/**
 * Setters only: consumers (whole pages) must not re-render when the progress
 * ticks — download progress fires on every ~2 MB chunk, and a state value in
 * the context would re-render every consumer hundreds of times per download.
 * The values stay local to this provider; only the toast itself updates.
 */
export interface ToastApi {
	setOpen: ModifyState<boolean>
	setMessage: ModifyState<string>
	setProgress: ModifyState<number | null>
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToastProvider() {
	return useContext(ToastContext) as ToastApi
}

export function ToastProvider({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false)
	const [message, setMessage] = useState('')
	const [progress, setProgress] = useState<number | null>(null)
	const toastId = useRef<string | number | null>(null)
	const api = useMemo(() => ({ setOpen, setMessage, setProgress }), [])

	useEffect(() => {
		if (open) {
			const description = progress != null ? `${Math.round(progress)}%` : undefined
			if (toastId.current == null) {
				toastId.current = toast.loading(message || m.loading(), { description, duration: Infinity })
			} else {
				toast.loading(message || m.loading(), { id: toastId.current, description, duration: Infinity })
			}
		} else if (toastId.current != null) {
			toast.dismiss(toastId.current)
			toastId.current = null
		}
	}, [open, message, progress])

	return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>
}
