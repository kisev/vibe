; Installer hooks for the fork's NSIS bundle.
;
; The fork deliberately keeps upstream's productName and identifier so
; settings, deep links, and the install path survive a fork install, but that
; same tuple is what winget correlates with the upstream community package
; (Thewh1teagle.vibe: Publisher "com", ProductCode "vibe", UpgradeBehavior
; install): its catalog version outranks our dev-suffixed ones, and
; `winget upgrade` replaces the fork install with an upstream build. The
; post-install hook rewrites the Add/Remove-Programs identity to the fork's
; own publisher and product code, which breaks that correlation. Data never
; moves: it lives under the identifier, which stays unchanged.
!macro NSIS_HOOK_POSTINSTALL
    WriteRegStr SHCTX "${UNINSTKEY}" "Publisher" "kisev"
    WriteRegStr SHCTX "${UNINSTKEY}" "ProductCode" "vibe-fork"
!macroend
