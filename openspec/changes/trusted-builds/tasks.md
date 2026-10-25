# Tasks

## 1. Free provenance

- [ ] 1.1 Add an attest job to the release workflow: `actions/attest-build-provenance` over every published bundle; verify with `gh attestation verify` on one artifact in the same run
- [ ] 1.2 Add syft SBOM generation per bundle (SPDX) uploaded to the release alongside the artifacts
- [ ] 1.3 Add a trivy scan of the published files + SBOMs with an explicit `trivy-release.yaml` ignore list; findings fail the release job and print to the summary

## 2. Windows signing providers

- [ ] 2.1 Turn `sign-windows` into a provider enum (`none | self-signed | signpath | sign-server`) behind one step contract; keep the sign-server path byte-identical
- [ ] 2.2 Implement `self-signed`: a `task release:selfcert` generator, the cert stored as a repo secret, signing + `osslsigncode verify` in CI, fingerprint documented in the README
- [ ] 2.3 Pre-wire `signpath` (their GitHub Action, `SIGNPATH_*` secrets, project id input) as a dormant provider; document the Foundation application checklist in `docs/` (public repo requirements, review timeline, what to paste)

## 3. macOS honesty

- [ ] 3.1 Document the unsigned-macOS install path (Gatekeeper bypass for the current macOS versions) in the README and the release notes template

## 4. Validation

- [ ] 4.1 Run a dev-tagged build with attestations + SBOM + scan green and unsigned binaries (the default path unchanged)
- [ ] 4.2 When the user approves: cut a `self-signed` Windows run and verify the binary signature, attestation, and SBOM end to end; note in `fork-update-sources` 4.1 that the signed-release prerequisite is now exercisable
