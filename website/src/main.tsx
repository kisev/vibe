import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './App'
import { getLocale, setLocale } from './paraglide/runtime.js'
import { localeFromSearch } from './lib/i18n'

// Resolve a shared ?lang= before the first render, not in a render pass, so that paint is
// already in the shared language and StrictMode's double render has nothing to replay.
setLocale(localeFromSearch(window.location.search) ?? getLocale(), { reload: false })

const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
function syncThemeWithSystem(isDark: boolean) {
	document.documentElement.classList.toggle('dark', isDark)
	document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

syncThemeWithSystem(mediaQuery.matches)
mediaQuery.addEventListener('change', (event) => syncThemeWithSystem(event.matches))

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
	</StrictMode>,
)
