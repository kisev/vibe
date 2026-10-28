; The single installerHooks entry point for Windows builds.
;
; tauri merges tauri.conf.json <- tauri.windows.conf.json <- --config by
; replacement (RFC 7396), so only the platform config's one
; bundle.windows.nsis.installerHooks value ever reaches the NSIS template; the
; same key in the base config is silently overridden and a hook file referenced
; only there never loads. This file owns the slot: it pulls in the upstream
; vc_redist hook set and adds the fork's own post-install hook on top, so no
; consumer of the slot has to compete for it.
;
; The fork deliberately keeps upstream's productName and identifier so
; settings, deep links, and the install path survive a fork install, but that
; same tuple is what winget correlates with the upstream community package
; (Thewh1teagle.vibe: its catalog version outranks our dev-suffixed ones, and
; `winget upgrade` replaces the fork install with an upstream build). The
; post-install hook rewrites the Add/Remove-Programs identity to the fork's
; own publisher and product code so the entry names the fork. That alone does
; not break the match — dev.47 proved winget still offered upstream 3.2.2 over
; an install whose ARP already read kisev/vibe-fork: the package matches on
; more than that tuple (Name/DisplayName and install location survive). Data
; never moves: it lives under the identifier, which stays unchanged.
; NSIS resolves !include against the directory the top-level script is
; compiled from (target/<triple>/release/nsis/x64), not against the including
; file, so the path has to be built from this file's own directory or the
; compiler never finds the sibling hook file.
!include "${__FILEDIR__}\vc_redist.nsh"

!macro NSIS_HOOK_POSTINSTALL
    WriteRegStr SHCTX "${UNINSTKEY}" "Publisher" "kisev"
    WriteRegStr SHCTX "${UNINSTKEY}" "ProductCode" "vibe-fork"
!macroend
