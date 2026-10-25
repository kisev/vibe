// Sync the vendored handy model catalog into the desktop tree.
//
//   node scripts/sync-catalog.mjs sync    copy node_modules → src/data/handy-catalog.json
//   node scripts/sync-catalog.mjs check   fail unless the copy is byte-identical
//
// Upstream (@handy-computer/models) is the source of truth; the copy exists so
// the bundle has no runtime dependency on node_modules layout and a release
// build never regenerates data. The check is the drift gate: run `pnpm sync:catalog`
// whenever the package version changes.
import { copyFileSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'node_modules', '@handy-computer', 'models', 'catalog.json')
const target = join(root, 'src', 'data', 'handy-catalog.json')

if (process.argv[2] === 'sync') {
	copyFileSync(source, target)
	console.log(`synced ${target}`)
} else if (process.argv[2] === 'check') {
	if (readFileSync(source, 'utf8') !== readFileSync(target, 'utf8')) {
		console.error(`catalog copy drifted from the @handy-computer/models package; run pnpm sync:catalog`)
		process.exit(1)
	}
	console.log('catalog copy matches the package')
} else {
	console.error('usage: sync-catalog.mjs sync|check')
	process.exit(2)
}
