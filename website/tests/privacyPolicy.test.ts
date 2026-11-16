import { readFileSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// The privacy page serves `public/privacy_policy.pdf`, generated from the Markdown
// beside it, so the source is the one place the promise can be checked. These
// tests pin the claims the app's behaviour has to keep true.
const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const policy = readFileSync(`${publicDir}privacy_policy.md`, 'utf8')

describe('privacy policy', () => {
	// Scenario: reading the privacy policy.
	it('states that no telemetry is collected', () => {
		expect(policy).toMatch(/no telemetry|does not collect telemetry/i)
		expect(policy).toMatch(/no analytics/i)
	})

	it('states that nothing is transmitted automatically', () => {
		expect(policy).toMatch(/does not transmit your data|never uploads them automatically/i)
	})

	it('states that diagnostics leave only when the user shares them', () => {
		expect(policy).toMatch(/leave only when you choose to share them/i)
	})

	it('ships the PDF generated from the Markdown', () => {
		const pdfPath = `${publicDir}privacy_policy.pdf`
		const pdf = readFileSync(pdfPath)
		expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
		expect(statSync(pdfPath).size).toBeGreaterThan(1024)
	})
})
