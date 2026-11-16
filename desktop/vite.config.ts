import react from '@vitejs/plugin-react'
import { paraglideVitePlugin } from '@inlang/paraglide-js'
import tailwindcss from '@tailwindcss/vite'
import svgr from 'vite-plugin-svgr'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/paraglide',
			emitTsDeclarations: true,
			strategy: ['localStorage', 'globalVariable', 'baseLocale'],
		}),
		react(),
		tailwindcss(),
		svgr({
			// allow import it as regular react component
			svgrOptions: { exportType: 'named', ref: true, svgo: false, titleProp: true },
			include: '**/*.svg',
		}),
	],

	resolve: {
		alias: {
			'~': '/src',
		},
	},
	clearScreen: false,
	test: {
		setupFiles: ['./src/vitest.setup.ts'],
		// The end-to-end suite is Playwright's; vitest would collect it and fail on its imports.
		// Extend the defaults so nested node_modules and dist are still excluded.
		exclude: [...configDefaults.exclude, 'e2e/**'],
	},
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			ignored: ['**/src-tauri/**'],
		},
	},
}))
