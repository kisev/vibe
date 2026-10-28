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
; (Thewh1teagle.vibe: Publisher "com", ProductCode "vibe"): its catalog
; version outranks our dev-suffixed ones, and `winget upgrade` replaces the
; fork install with an upstream build. The post-install hook rewrites the
; Add/Remove-Programs identity to the fork's own publisher and product code,
; which breaks that correlation. Data never moves: it lives under the
; identifier, which stays unchanged.
!include "vc_redist.nsh"

!macro NSIS_HOOK_POSTINSTALL
    WriteRegStr SHCTX "${UNINSTKEY}" "Publisher" "kisev"
    WriteRegStr SHCTX "${UNINSTKEY}" "ProductCode" "vibe-fork"
!macroend
