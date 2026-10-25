// Vibe's commit subjects are imperative sentences without a conventional-commit
// type prefix ("Archive model-catalog: sync the main spec"): the parser cannot
// split a type out of them, so type and subject emptiness stay unchecked. The
// changelog flows from i18n/changelog/unreleased.md rather than commit parsing.
// What this lint keeps is what actually matters — sane lengths and clean body
// separation.
export default {
	rules: {
		'header-max-length': [2, 'always', 100],
		'type-empty': [0],
		'subject-empty': [0],
		'subject-full-stop': [2, 'never', '.'],
		'subject-case': [0],
		'scope-empty': [0],
		'body-leading-blank': [2, 'always'],
		'body-max-line-length': [2, 'always', 100],
		'footer-leading-blank': [2, 'always'],
	},
}
