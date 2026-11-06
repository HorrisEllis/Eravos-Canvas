; ERAVOS Update - its own small program (3.141). His words, 2026-11-06: "it never closes, or does anything else to update." · "why not
; make it another exe?" Built by packaging\windows\make-exe.ps1 into the app folder, beside ERAVOS.exe (the Setup installs it too).
;
; ERAVOS starts it (an ordinary program: no PowerShell, no hidden window, no execution policy) when you press Restart now. It:
;   1. says it started (the file ERAVOS waits for; ERAVOS then closes)
;   2. waits until ERAVOS has closed (up to 60 s; the Setup closes it either way)
;   3. asks Windows to run the new Setup as administrator - the prompt comes from THIS window, in front, not a hidden process
;   4. checks the installed version is the new one (the uninstall entry the Setup writes)
;   5. writes update.log and update-result.json (ERAVOS reads them at its next start), and starts ERAVOS again - as you, not as admin
;
;   "ERAVOS Update.exe" /SETUP=<ERAVOS-Setup-x.exe> /DEST=<install folder> /VERSION=x /WORK=<folder> /STARTED=<file> [/NOSTART]
; Build:  makensis /DOUT="..\..\dist\ERAVOS\ERAVOS Update.exe" eravos-update.nsi

Unicode true
SetCompressor /SOLID lzma
!include "FileFunc.nsh"
!include "LogicLib.nsh"

!ifndef OUT
  !define OUT "ERAVOS Update.exe"
!endif
!define UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\ERAVOS"

Name "ERAVOS Update"
Caption "ERAVOS Update"
OutFile "${OUT}"
RequestExecutionLevel user          ; it asks for admin only for the Setup it runs (ExecShellWait runas)
ShowInstDetails show
AutoCloseWindow true
BrandingText "ERAVOS Update"
InstallButtonText "Update"
Page instfiles

Var SETUP
Var DEST
Var VERSION
Var WORK
Var STARTED
Var NOSTART
Var LOG
Var RESULT
Var OK
Var MSG

!macro Say TEXT
  DetailPrint "${TEXT}"
  Push "${TEXT}"
  Call LogLine
!macroend

Function LogLine
  Exch $0
  Push $1
  Push $2
  ${If} $LOG != ""
    FileOpen $1 $LOG a
    ${If} $1 != ""
      FileSeek $1 0 END
      ${GetTime} "" "L" $2 $3 $4 $5 $6 $7 $8
      FileWrite $1 "$4-$3-$2 $6:$7:$8  ERAVOS Update.exe  $0$\r$\n"
      FileClose $1
    ${EndIf}
  ${EndIf}
  Pop $2
  Pop $1
  Pop $0
FunctionEnd

; a JSON string: backslashes and quotes escaped
Function Esc
  Exch $0
  Push $1
  Push $2
  Push $3
  StrCpy $1 ""
  StrCpy $2 0
  loop:
    StrCpy $3 $0 1 $2
    StrCmp $3 "" done
    StrCmp $3 "\" 0 +3
      StrCpy $1 "$1\\"
      Goto next
    StrCmp $3 '"' 0 +3
      StrCpy $1 '$1\"'
      Goto next
    StrCpy $1 "$1$3"
    next:
    IntOp $2 $2 + 1
    Goto loop
  done:
  StrCpy $0 $1
  Pop $3
  Pop $2
  Pop $1
  Exch $0
FunctionEnd

Function WriteResult
  Push $MSG
  Call Esc
  Pop $1
  Push $LOG
  Call Esc
  Pop $2
  FileOpen $0 $RESULT w
  ${If} $0 != ""
    FileWrite $0 '{ "ok": $OK, "version": "$VERSION", "message": "$1", "log": "$2" }'
    FileClose $0
  ${EndIf}
FunctionEnd

Section "Update"
  ${GetParameters} $R0
  ${GetOptions} $R0 "/SETUP=" $SETUP
  ${GetOptions} $R0 "/DEST=" $DEST
  ${GetOptions} $R0 "/VERSION=" $VERSION
  ${GetOptions} $R0 "/WORK=" $WORK
  ${GetOptions} $R0 "/STARTED=" $STARTED
  StrCpy $NOSTART "0"
  ClearErrors
  ${GetOptions} $R0 "/NOSTART" $R1
  ${IfNot} ${Errors}
    StrCpy $NOSTART "1"
  ${EndIf}
  CreateDirectory $WORK
  StrCpy $LOG "$WORK\update.log"
  StrCpy $RESULT "$WORK\update-result.json"

  ; 1. it runs: tell ERAVOS (ERAVOS closes once this file is there)
  ${If} $STARTED != ""
    FileOpen $0 $STARTED w
    FileWrite $0 "ERAVOS Update.exe"
    FileClose $0
  ${EndIf}
  !insertmacro Say "ERAVOS Update to $VERSION - Setup $SETUP into $DEST"
  ${IfNot} ${FileExists} $SETUP
    StrCpy $OK "false"
    StrCpy $MSG "the downloaded Setup is missing ($SETUP)"
    Goto finish
  ${EndIf}

  ; 2. wait for ERAVOS to close (the Setup ends it if it is still running)
  !insertmacro Say "Waiting for ERAVOS to close..."
  StrCpy $R1 0
  wait:
    nsExec::ExecToStack 'tasklist /FI "IMAGENAME eq ERAVOS.exe" /NH'
    Pop $R2
    Pop $R3
    StrCpy $R4 $R3 10
    StrCmp $R4 "ERAVOS.exe" 0 closed
    IntOp $R1 $R1 + 1
    IntCmp $R1 120 closed
    Sleep 500
    Goto wait
  closed:
  !insertmacro Say "ERAVOS has closed"

  ; 3. Windows asks for permission here, in front of you; then the Setup installs silently into the same folder
  !insertmacro Say "Asking Windows for permission to install ERAVOS $VERSION..."
  ClearErrors
  ExecShellWait "runas" "$SETUP" "/S /D=$DEST"
  ${If} ${Errors}
    StrCpy $OK "false"
    StrCpy $MSG "Windows did not run the installer (the permission prompt was declined, or it could not start). ERAVOS is unchanged; the update is still ready."
    Goto finish
  ${EndIf}

  ; 4. did it go in? The Setup writes its version into the uninstall entry
  SetRegView 64                     ; the Setup writes its entry in the 64-bit view (eravos.nsi: SetRegView 64)
  ReadRegStr $R5 HKLM "${UNINST_KEY}" "DisplayVersion"
  ${If} $R5 == ""
    SetRegView 32
    ReadRegStr $R5 HKLM "${UNINST_KEY}" "DisplayVersion"
  ${EndIf}
  SetRegView default
  ${If} $R5 == $VERSION
  ${AndIf} ${FileExists} "$DEST\ERAVOS.exe"
    StrCpy $OK "true"
    StrCpy $MSG "ERAVOS $VERSION is installed"
  ${Else}
    StrCpy $OK "false"
    StrCpy $MSG "the installer ran, but ERAVOS reports version $R5, not $VERSION"
  ${EndIf}

  finish:
  !insertmacro Say "$MSG"
  Call WriteResult
  ; 5. ERAVOS again, as you
  ${If} $NOSTART == "0"
  ${AndIf} ${FileExists} "$DEST\ERAVOS.exe"
    !insertmacro Say "Starting ERAVOS"
    Exec '"$DEST\ERAVOS.exe"'
  ${EndIf}
  ${If} $OK == "false"
    SetAutoClose false   ; leave the window up so the reason can be read
  ${EndIf}
SectionEnd

Function .onInit
  ; no welcome, no folder page: it starts updating at once
FunctionEnd
