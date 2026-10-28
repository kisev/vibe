; The single installerHooks entry point for Windows builds.
;
; tauri merges tauri.conf.json <- tauri.windows.conf.json <- --config by
; replacement (RFC 7396), so only the platform config's one
; bundle.windows.nsis.installerHooks value ever reaches the NSIS template; the
; same key in the base config is silently overridden and a hook file referenced
; only there never loads. This file owns the slot: it pulls in the upstream
; vc_redist hook set and adds the fork's own hooks on top, so no consumer of
; the slot has to compete for it.
;
; NSIS resolves !include against the directory the top-level script is
; compiled from (target/<triple>/release/nsis/x64), not against the including
; file, so the path has to be built from this file's own directory or the
; compiler never finds the sibling hook file.
!include "${__FILEDIR__}\vc_redist.nsh"

; The fork deliberately keeps upstream's productName and identifier so
; settings, deep links, and the install path survive a fork install. But that
; makes the installer register under Tauri's template uninstall key
; "...\Uninstall\vibe" -- and winget takes an installed app's ProductCode from
; the uninstall KEY NAME (winget-cli ARPHelper.cpp: productCode = key name);
; the ProductCode VALUE inside the key is never consulted. A key named "vibe"
; is therefore an exact ProductCode match to the upstream community package
; (Thewh1teagle.vibe), whose catalog version outranks our dev-suffixed ones,
; so `winget upgrade` offers -- and under `--all` installs -- upstream over
; the fork. Rewriting values cannot break that: dev.47 diverged Publisher and
; ProductCode values and the match survived, and a live DisplayName rewrite
; probe failed the same way. The post-install hook instead moves the whole
; entry to a fork-named key; winget then sees ProductCode "vibe-fork", which
; the fork's own future winget package will declare. The Publisher override is
; load-bearing too: winget's fallback is an exact NormalizedNameAndPublisher
; filter, and the template writes the upstream publisher there. Data never
; moves: it lives under the identifier, which stays unchanged. One behavioral
; cost: the installer's "already installed" maintenance page reads the
; template key, so manual installs over an existing fork build go straight to
; an in-place install instead of offering uninstall-first.

; Copies one REG_SZ value from the template's uninstall key to the fork key,
; skipping values that are absent (the HOMEPAGE URLs are conditional).
!macro MoveUninstStrValue NAME
    ReadRegStr $R0 SHCTX "${UNINSTKEY}" "${NAME}"
    ${If} $R0 != ""
        WriteRegStr SHCTX "${UNINSTKEY}-fork" "${NAME}" "$R0"
    ${EndIf}
!macroend

; Same for the REG_DWORD values the template writes (NoModify, NoRepair,
; EstimatedSize); a missing or unreadable value is skipped.
!macro MoveUninstDWORDValue NAME
    ClearErrors
    ReadRegDWORD $R0 SHCTX "${UNINSTKEY}" "${NAME}"
    ${Unless} ${Errors}
        WriteRegDWORD SHCTX "${UNINSTKEY}-fork" "${NAME}" "$R0"
    ${EndUnless}
!macroend

!macro NSIS_HOOK_POSTINSTALL
    ; Rehome the Add/Remove-Programs entry under a fork-named key so the
    ; install stops correlating with the upstream winget package.
    ; A previous fork build may have left values here; drop them so stale
    ; entries cannot survive the copy below.
    DeleteRegKey SHCTX "${UNINSTKEY}-fork"

    !insertmacro MoveUninstStrValue "DisplayName"
    !insertmacro MoveUninstStrValue "DisplayIcon"
    !insertmacro MoveUninstStrValue "DisplayVersion"
    !insertmacro MoveUninstStrValue "InstallLocation"
    !insertmacro MoveUninstStrValue "UninstallString"
    !insertmacro MoveUninstStrValue "MainBinaryName"
    !insertmacro MoveUninstStrValue "URLInfoAbout"
    !insertmacro MoveUninstStrValue "URLUpdateInfo"
    !insertmacro MoveUninstStrValue "HelpLink"
    !insertmacro MoveUninstDWORDValue "NoModify"
    !insertmacro MoveUninstDWORDValue "NoRepair"
    !insertmacro MoveUninstDWORDValue "EstimatedSize"
    !if "${INSTALLMODE}" == "both"
        ; The install-mode flag is stored under a value name only known at
        ; runtime.
        ReadRegStr $R0 SHCTX "${UNINSTKEY}" "$MultiUser.InstallMode"
        ${If} $R0 != ""
            WriteRegStr SHCTX "${UNINSTKEY}-fork" "$MultiUser.InstallMode" "$R0"
        ${EndIf}
    !endif

    WriteRegStr SHCTX "${UNINSTKEY}-fork" "Publisher" "kisev"
    WriteRegStr SHCTX "${UNINSTKEY}-fork" "ProductCode" "vibe-fork"

    DeleteRegKey SHCTX "${UNINSTKEY}"
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
    ; The uninstaller removes the template's key itself; the fork entry lives
    ; under ours, so remove it too or it would orphan a ghost in
    ; Apps and Features.
    DeleteRegKey SHCTX "${UNINSTKEY}-fork"
    DeleteRegKey HKLM "${UNINSTKEY}-fork"
    DeleteRegKey HKCU "${UNINSTKEY}-fork"
!macroend
