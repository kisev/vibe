import { defineConfig, searchForWorkspaceRoot } from 'vite'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// The deploy builds the site twice: production at the root of the Pages site and
// a preview under /vibe/dev/. The base is a build input, so both come from the
// same source with no runtime switch; the default keeps the production build
// exactly where it has always been.
const siteBase = process.env.VITE_SITE_BASE ?? '/vibe/'

export default defineConfig({
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/paraglide',
			emitTsDeclarations: true,
			strategy: ['localStorage', 'preferredLanguage', 'baseLocale'],
		}),
		react(),
		tailwindcss(),
	],
	base: siteBase,
	server: {
		fs: {
			// Docs and changelog translations live in ../i18n and load lazily; without this the dev server refuses to transform them.
			allow: [searchForWorkspaceRoot(process.cwd()), path.resolve(__dirname, '../i18n')],
		},
	},
	resolve: {
		alias: {
			'~': path.resolve(__dirname, './src'),
		},
	},
})
