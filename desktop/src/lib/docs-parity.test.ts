import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { asrCatalog } from './catalog'

// The models page is generated from the vendored catalogs by
// scripts/generate-models-docs.mjs. This test pins the rendered page to
// asrCatalog(): every catalog file must appear as a download link and every
// download link must come from the catalog, so the docs can never drift.
const docsPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'i18n', 'docs', 'en-US', 'models.md')

// Download links look like https://huggingface.co/{owner}/{repo}/resolve/{revision}/{filename}?download=true
const DOWNLOAD_LINK = /https:\/\/huggingface\.co\/([^/\s)"']+)\/([^/\s)"']+)\/resolve\/[^/\s)"']+\/([^/\s)"']+)\?download=true/g

describe('models docs parity', () => {
	it('documents exactly the ASR catalog, one download link per file', () => {
		const documented = [...readFileSync(docsPath, 'utf8').matchAll(DOWNLOAD_LINK)].map((match) => `${match[1]}/${match[2]}/${match[3]}`)
		const catalog = asrCatalog().flatMap((model) => Object.values(model.files).map((file) => `${model.repository}/${file.filename}`))
		expect(documented).not.toHaveLength(0)
		expect(documented.sort()).toEqual(catalog.sort())
	})
})
