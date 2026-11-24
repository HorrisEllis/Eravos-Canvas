; ERAVOS Setup - installs ERAVOS to the system (Program Files\ERAVOS, every user on this PC).
; Built by packaging\windows\make-exe.ps1 (or by hand):  makensis /DVERSION=0.1.0 /DSRC=..\..\dist\ERAVOS /DOUT=..\..\dist\ERAVOS-Setup-0.1.0.exe eravos.nsi
;   , the app goes in Program Files\ERAVOS, never written to while it runs
;   , your work is in the library, Documents\ERAVOS (projects, exports, packs, tools, drop) - Setup and Uninstall never touch it
;   , Start menu + desktop shortcuts, Settings > Apps entry with an uninstaller
;   , run again (or by the app's updater, silently with /S) to update in place
; Unicode, LZMA, admin (Program Files). /S = silent (the plain way, no window). /CLASSIC = the plain pages. /UPDATE = the update ring.
; 3.210 ITS OWN WINDOW (his words, 2026-11-21, of the stock installer: "they aren't there. it is the old one."; the look approved: "It looks
; fucking significantly better."): the Setup unpacks the app into a stage folder (its progress dark, a few seconds), then starts that
; ERAVOS.exe with --eravos-setup — the Setup's own window (desktop/setup-window.js, setup.html): where the canvas goes, where your library
; goes (Browse), writing, checking every file, done. It answers in result.ini; this script then writes the uninstaller, Settings > Apps and
; the shortcuts. If that window cannot open, it installs the plain way. Silent (/S) installs exactly as before (the release test).

Unicode true
SetCompressor /SOLID lzma
!include "MUI2.nsh"
!include "FileFunc.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!ifndef VERSION
  !define VERSION "0.0.0"
!endif
!ifndef SRC
  !define SRC "..\..\dist\ERAVOS"
!endif
!ifndef OUT
  !define OUT "..\..\dist\ERAVOS-Setup-${VERSION}.exe"
!endif
!define UNINST_KEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\ERAVOS"
Var FANCY     ; 1 = its own window (not silent, not /CLASSIC)
Var MODE      ; install | update
Var STAGE     ; where the app is unpacked: the stage (its own window copies it) or $INSTDIR (the plain way)
Var START     ; 1 = start ERAVOS when done (asked in its own window)
Var LOGF      ; 3.212 %TEMP%\ERAVOS Setup.log: every step, so a failure on his PC can be read (his: "installer couldn't find eravos.exe")
!macro Log TEXT
  Push $9
  FileOpen $9 "$LOGF" a
  ${If} $9 != ""
    FileSeek $9 0 END
    FileWrite $9 "${TEXT}$\r$\n"
    FileClose $9
  ${EndIf}
  Pop $9
  DetailPrint "${TEXT}"
!macroend

Name "ERAVOS ${VERSION}"
OutFile "${OUT}"
InstallDir "$PROGRAMFILES64\ERAVOS"
InstallDirRegKey HKLM "Software\ERAVOS" "InstallDir"
RequestExecutionLevel admin
BrandingText "ERAVOS ${VERSION}"
; 3.148 a beta (0.2.16-beta.12): Windows' file version takes numbers only — NUMVER is the 0.2.16 part (make-exe.ps1 passes it)
!ifndef NUMVER
  !define NUMVER "${VERSION}"
!endif
VIProductVersion "${NUMVER}.0"
VIAddVersionKey "ProductName" "ERAVOS"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "FileVersion" "${NUMVER}"
VIAddVersionKey "FileDescription" "ERAVOS Setup"
VIAddVersionKey "LegalCopyright" "ERAVOS"

!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_WELCOMEPAGE_TEXT "This installs ERAVOS ${VERSION} on this PC.$\r$\n$\r$\nYour projects, exports, packs and tools are kept in your library - you choose where (Documents\ERAVOS by default). Installing, updating or uninstalling never touches it.$\r$\n$\r$\nClose ERAVOS before you continue."
!define MUI_FINISHPAGE_RUN "$INSTDIR\ERAVOS.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Start ERAVOS"
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Open my ERAVOS library"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION OpenLibrary
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED

!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfFancy
!insertmacro MUI_PAGE_WELCOME
!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfFancy
!define MUI_DIRECTORYPAGE_TEXT_TOP "Where the ERAVOS canvas goes - the program itself. Next you choose where your library goes (your projects, tools, packs and exports): it stays separate from the canvas."
!insertmacro MUI_PAGE_DIRECTORY
Page custom LibraryPage LibraryLeave
!define MUI_PAGE_CUSTOMFUNCTION_SHOW InstShow
!insertmacro MUI_PAGE_INSTFILES
!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfFancy
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  SetShellVarContext all
  SetRegView 64
  InitPluginsDir
  StrCpy $LOGF "$TEMP\ERAVOS Setup.log"
  Delete "$LOGF"
  ${GetParameters} $R0
  StrCpy $FANCY "1"
  StrCpy $MODE "install"
  StrCpy $START "0"
  ClearErrors
  ${GetOptions} $R0 "/UPDATE" $R1
  ${IfNot} ${Errors}
    StrCpy $MODE "update"
  ${EndIf}
  ClearErrors
  ${GetOptions} $R0 "/CLASSIC" $R1
  ${IfNot} ${Errors}
    StrCpy $FANCY "0"
  ${EndIf}
  ${If} ${Silent}
    StrCpy $FANCY "0"
  ${EndIf}
FunctionEnd
Function SkipIfFancy
  ${If} $FANCY == "1"
    Abort
  ${EndIf}
FunctionEnd
; while it unpacks (a few seconds): dark, no list, the progress in the palette
Function InstShow
  ${If} $FANCY == "1"
    SetAutoClose true
    !insertmacro MUI_HEADER_TEXT "ERAVOS ${VERSION}" "Unpacking - the Setup opens in a moment"
    FindWindow $0 "#32770" "" $HWNDPARENT
    SetCtlColors $0 "D6E4F0" "000000"
    GetDlgItem $1 $0 1016
    ShowWindow $1 ${SW_HIDE}
    GetDlgItem $1 $0 1027
    ShowWindow $1 ${SW_HIDE}
    GetDlgItem $1 $0 1006
    SetCtlColors $1 "7F93A8" "000000"
    GetDlgItem $1 $0 1004
    System::Call 'uxtheme::SetWindowTheme(p r1, w " ", w " ")'
    SendMessage $1 0x0409 0 0x00B066FF
    SendMessage $1 0x2001 0 0x000D0D0D
  ${EndIf}
FunctionEnd
Function un.onInit
  SetShellVarContext all
  SetRegView 64
FunctionEnd

; 3.208 WHERE THE LIBRARY GOES (his words, 2026-11-21: "have it ask where you want to save. Like have it the default be the documents
; like documents /Eravos, and but then you know have like a browse button to change it."). The canvas is installed here (Program Files);
; everything else - projects, tools, packs, exports - lives in the library. The choice is per user: %APPDATA%\ERAVOS\library.txt (UTF-16),
; which ERAVOS reads at start (desktop/main.js pickHome). A silent update never asks and never changes it.
Var LIBDIR
Var LIBFIELD
Function LibraryPage
  ${If} $FANCY == "1"
    Abort
  ${EndIf}
  SetShellVarContext current
  ${If} $LIBDIR == ""
    StrCpy $LIBDIR "$DOCUMENTS\ERAVOS"
    ClearErrors
    FileOpen $0 "$APPDATA\ERAVOS\library.txt" r
    ${IfNot} ${Errors}
      FileReadUTF16LE $0 $1
      FileClose $0
      ${If} $1 != ""
        StrCpy $LIBDIR $1
      ${EndIf}
    ${EndIf}
  ${EndIf}
  SetShellVarContext all
  !insertmacro MUI_HEADER_TEXT "Your library" "Where your projects, tools, packs and exports are kept"
  nsDialogs::Create 1018
  Pop $0
  ${NSD_CreateLabel} 0 0 100% 36u "ERAVOS keeps everything you make, and the tools it loads, in one folder of yours - separate from the canvas. Installing, updating or uninstalling never touches it.$\r$\n$\r$\nThe default is Documents\ERAVOS."
  Pop $0
  ${NSD_CreateGroupBox} 0 44u 100% 34u "Library folder"
  Pop $0
  ${NSD_CreateDirRequest} 8u 58u 74% 12u "$LIBDIR"
  Pop $LIBFIELD
  ${NSD_CreateBrowseButton} 79% 57u 19% 14u "Browse..."
  Pop $0
  ${NSD_OnClick} $0 LibraryBrowse
  nsDialogs::Show
FunctionEnd
Function LibraryBrowse
  ${NSD_GetText} $LIBFIELD $1
  nsDialogs::SelectFolderDialog "Choose where your ERAVOS library goes" "$1"
  Pop $1
  ${If} $1 != "error"
    StrCpy $2 $1 6 -6
    ${If} $2 != "ERAVOS"
      StrCpy $1 "$1\ERAVOS"   ; a folder of its own inside the one chosen
    ${EndIf}
    ${NSD_SetText} $LIBFIELD $1
  ${EndIf}
FunctionEnd
Function LibraryLeave
  ${NSD_GetText} $LIBFIELD $LIBDIR
  ${If} $LIBDIR == ""
    MessageBox MB_OK|MB_ICONEXCLAMATION "Choose a folder for your library."
    Abort
  ${EndIf}
FunctionEnd
Function SaveLibrary
  ${If} $LIBDIR == ""
    Return            ; silent (an update): the library stays where it is
  ${EndIf}
  SetShellVarContext current
  CreateDirectory "$LIBDIR"
  CreateDirectory "$APPDATA\ERAVOS"
  FileOpen $0 "$APPDATA\ERAVOS\library.txt" w
  ${If} $0 != ""
    FileWriteUTF16LE /BOM $0 "$LIBDIR"
    FileClose $0
  ${EndIf}
  SetShellVarContext all
FunctionEnd

; the library is per user: the person running Setup (Documents)
Function OpenLibrary
  SetShellVarContext current
  ${If} $LIBDIR == ""
    StrCpy $LIBDIR "$DOCUMENTS\ERAVOS"
  ${EndIf}
  CreateDirectory "$LIBDIR"
  ExecShell "open" "$LIBDIR"
  SetShellVarContext all
FunctionEnd

; close a running ERAVOS (its files are in use) - ask first unless silent (the updater has already closed it)
; 3.213 (his: "it keeps telling me error writing eravos.exe"): the old check read the first 10 characters of `tasklist /NH`, but that output
; starts with an empty line - so a running ERAVOS was never seen, never closed, and Windows refused to overwrite its ERAVOS.exe.
; Now: `find` says whether it runs (its exit code, not the text), every ERAVOS.exe process is ended (/T: its helpers too), and the Setup
; waits until none is left (up to 15 s). Then, whatever still holds it, the old ERAVOS.exe is moved aside (Windows lets a running exe be
; renamed, never overwritten) so the new one can be written; the old copy goes at the next restart.
!macro CloseEravos
  nsExec::ExecToStack 'cmd.exe /c tasklist /FI "IMAGENAME eq ERAVOS.exe" /NH | find /I "ERAVOS.exe"'
  Pop $0
  Pop $1
  ${If} $0 == "0"
    StrCpy $3 "go"
    ${IfNot} ${Silent}
    ${AndIf} $MODE != "update"
      MessageBox MB_OKCANCEL|MB_ICONINFORMATION "ERAVOS is running. It will be closed (autosave keeps your song)." IDOK +2
      StrCpy $3 "no"
    ${EndIf}
    ${If} $3 == "no"
      Quit
    ${EndIf}
    !insertmacro Log "ERAVOS is running - closing it"
    nsExec::Exec 'taskkill /IM ERAVOS.exe /T /F'
    StrCpy $4 0
    ${Do}
      Sleep 500
      nsExec::ExecToStack 'cmd.exe /c tasklist /FI "IMAGENAME eq ERAVOS.exe" /NH | find /I "ERAVOS.exe"'
      Pop $0
      Pop $1
      ${If} $0 != "0"
        ${Break}
      ${EndIf}
      IntOp $4 $4 + 1
      ${If} $4 == 10
        nsExec::Exec 'taskkill /IM ERAVOS.exe /T /F'
      ${EndIf}
    ${LoopUntil} $4 >= 30
    !insertmacro Log "ERAVOS closed (waited $4 x 0.5 s)"
  ${EndIf}
  Sleep 500
!macroend

; the old ERAVOS.exe out of the way: deleted, or (still held by something) renamed aside and deleted at the next restart
!macro FreeExe DIR
  Delete "${DIR}\ERAVOS.exe.old-*"
  ${If} ${FileExists} "${DIR}\ERAVOS.exe"
    ClearErrors
    Delete "${DIR}\ERAVOS.exe"
    ${If} ${Errors}
      System::Call 'kernel32::GetTickCount() i .r5'
      ClearErrors
      Rename "${DIR}\ERAVOS.exe" "${DIR}\ERAVOS.exe.old-$5"
      ${If} ${Errors}
        !insertmacro Log "ERAVOS.exe in ${DIR} is held and could not be moved aside"
      ${Else}
        Delete /REBOOTOK "${DIR}\ERAVOS.exe.old-$5"
        !insertmacro Log "ERAVOS.exe in ${DIR} was held - moved aside to ERAVOS.exe.old-$5 (removed at the next restart)"
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend

; 3.207 after writing, every big file is checked on disk (his: "update broke my eravos." — an ERAVOS.exe cut off at 39.8 of 246 MB).
; CHECKS = the list install-check.mjs writes at build time: a file missing or the wrong size = the install failed, and it says so.
Var BAD
!macro CheckFile REL SIZE
  ClearErrors
  FileOpen $R8 "$INSTDIR\${REL}" r
  ${If} ${Errors}
    StrCpy $BAD "$BAD${REL} (missing)$\r$\n"
  ${Else}
    FileSeek $R8 0 END $R9
    FileClose $R8
    ${If} $R9 != ${SIZE}
      StrCpy $BAD "$BAD${REL} ($R9 of ${SIZE} bytes)$\r$\n"
    ${EndIf}
  ${EndIf}
!macroend
Function VerifyFiles
  StrCpy $BAD ""
  !ifdef CHECKS
    !include "${CHECKS}"
  !else
    ; a hand build without the list: only that ERAVOS.exe is there
    IfFileExists "$INSTDIR\ERAVOS.exe" +2
      StrCpy $BAD "ERAVOS.exe (missing)$\r$\n"
  !endif
FunctionEnd

!macro ClearApp DIR
  ; an update replaces the app's own folders completely (a tool removed upstream must not linger)
  RMDir /r "${DIR}\canvas"
  RMDir /r "${DIR}\tools"
  RMDir /r "${DIR}\schemas"
  RMDir /r "${DIR}\host"
  RMDir /r "${DIR}\tests"
  RMDir /r "${DIR}\resources"
  RMDir /r "${DIR}\locales"
!macroend

; 3.210 its own window: the stage's ERAVOS.exe --eravos-setup; result.ini says what happened (ok · dest · library · start)
Function RunOwnWindow
  DetailPrint "Opening the ERAVOS Setup window"
  Delete "$PLUGINSDIR\result.ini"
  HideWindow
  ClearErrors
  ${IfNot} ${FileExists} "$STAGE\ERAVOS.exe"
    !insertmacro Log "the stage has no ERAVOS.exe ($STAGE) - an antivirus may have taken it"
  ${EndIf}
  ExecWait '"$STAGE\ERAVOS.exe" --eravos-setup --mode=$MODE "--dest=$INSTDIR" --version=${VERSION} "--result=$PLUGINSDIR\result.ini"' $R0
  ${If} ${Errors}
    StrCpy $R0 "-1"
  ${EndIf}
  ReadINIStr $R1 "$PLUGINSDIR\result.ini" "result" "ok"
  ReadINIStr $R2 "$PLUGINSDIR\result.ini" "result" "dest"
  !insertmacro Log "the Setup window ended: exit $R0, ok=$R1, dest=$R2"
  ${If} $R1 == "1"
    ReadINIStr $R2 "$PLUGINSDIR\result.ini" "result" "dest"
    ${If} $R2 != ""
      StrCpy $INSTDIR $R2
    ${EndIf}
    ReadINIStr $START "$PLUGINSDIR\result.ini" "result" "start"
    Return
  ${EndIf}
  ${If} $R0 == "1"
    SetErrorLevel 1             ; cancelled: nothing installed, nothing changed
    Quit
  ${EndIf}
  ${If} $R0 == "3"
    ReadINIStr $R3 "$PLUGINSDIR\result.ini" "result" "why"
    WriteRegStr HKLM "Software\ERAVOS" "LastInstallError" "$R3"
    SetErrorLevel 3             ; it said why in its window; the version is not written (ERAVOS Update.exe sees it)
    Quit
  ${EndIf}
  ; the window could not open (exit $R0): the plain way, into $INSTDIR
  Call PlainCopy
FunctionEnd
Function PlainCopy
  BringToFront
  DetailPrint "The Setup window did not open ($R0) - installing the plain way"
  CreateDirectory "$INSTDIR"
  !insertmacro ClearApp "$INSTDIR"
  !insertmacro FreeExe "$INSTDIR"
  CopyFiles /SILENT "$STAGE\*.*" "$INSTDIR"
  !insertmacro Log "copied the plain way from $STAGE into $INSTDIR"
FunctionEnd

Section "ERAVOS" SecApp
  SectionIn RO
  !insertmacro CloseEravos
  ${If} $FANCY == "1"
    StrCpy $STAGE "$PLUGINSDIR\stage"
  ${Else}
    StrCpy $STAGE "$INSTDIR"
    !insertmacro ClearApp "$INSTDIR"
    !insertmacro FreeExe "$INSTDIR"
  ${EndIf}
  SetOutPath "$STAGE"
  SetOverwrite on
  File /r "${SRC}\*.*"
  !insertmacro Log "ERAVOS ${VERSION} Setup: unpacked into $STAGE (mode $MODE, own window $FANCY), installing into $INSTDIR"
  ${If} $FANCY == "1"
    Call RunOwnWindow
    ; whatever its window said: ERAVOS.exe must be in the folder now; if not, the app goes there the plain way (it heals itself)
    ${IfNot} ${FileExists} "$INSTDIR\ERAVOS.exe"
      !insertmacro Log "no ERAVOS.exe in $INSTDIR after the Setup window - copying the plain way"
      Call PlainCopy
    ${EndIf}
  ${EndIf}
  SetOutPath "$INSTDIR"
  Call VerifyFiles
  !insertmacro Log "checked every file. Not in full: [$BAD]"
  ${If} $BAD != ""
    DetailPrint "These files did not install completely:"
    DetailPrint "$BAD"
    WriteRegStr HKLM "Software\ERAVOS" "LastInstallError" "$BAD"
    MessageBox MB_OK|MB_ICONSTOP "ERAVOS did not install completely - these files were not written in full:$\r$\n$\r$\n$BAD$\r$\nNothing of yours was touched (your library is Documents\ERAVOS). Close anything that may hold ERAVOS's files and run this Setup again.$\r$\n$\r$\nWhat happened is in $LOGF." /SD IDOK
    SetErrorLevel 3
    Abort "ERAVOS did not install completely"
  ${EndIf}
  DeleteRegValue HKLM "Software\ERAVOS" "LastInstallError"
  Call SaveLibrary
  WriteUninstaller "$INSTDIR\Uninstall ERAVOS.exe"
  WriteRegStr HKLM "Software\ERAVOS" "InstallDir" "$INSTDIR"

  CreateShortcut "$SMPROGRAMS\ERAVOS.lnk" "$INSTDIR\ERAVOS.exe" "" "$INSTDIR\ERAVOS.exe" 0 SW_SHOWNORMAL "" "ERAVOS - a canvas of living instruments"
  CreateShortcut "$DESKTOP\ERAVOS.lnk" "$INSTDIR\ERAVOS.exe" "" "$INSTDIR\ERAVOS.exe" 0 SW_SHOWNORMAL "" "ERAVOS - a canvas of living instruments"

  WriteRegStr HKLM "${UNINST_KEY}" "DisplayName" "ERAVOS"
  WriteRegStr HKLM "${UNINST_KEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKLM "${UNINST_KEY}" "Publisher" "ERAVOS"
  WriteRegStr HKLM "${UNINST_KEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKLM "${UNINST_KEY}" "DisplayIcon" "$INSTDIR\ERAVOS.exe"
  WriteRegStr HKLM "${UNINST_KEY}" "UninstallString" '"$INSTDIR\Uninstall ERAVOS.exe"'
  WriteRegStr HKLM "${UNINST_KEY}" "QuietUninstallString" '"$INSTDIR\Uninstall ERAVOS.exe" /S'
  WriteRegStr HKLM "${UNINST_KEY}" "URLInfoAbout" "https://github.com/HorrisEllis/Eravos-Canvas"
  WriteRegDWORD HKLM "${UNINST_KEY}" "NoModify" 1
  WriteRegDWORD HKLM "${UNINST_KEY}" "NoRepair" 1
  ${GetSize} "$INSTDIR" "/S=0K" $0 $1 $2
  IntFmt $0 "0x%08X" $0
  WriteRegDWORD HKLM "${UNINST_KEY}" "EstimatedSize" "$0"
  ${If} $FANCY == "1"
    SetOutPath "$TEMP"
    RMDir /r "$PLUGINSDIR\stage"
    ${If} $START == "1"
      Exec '"$WINDIR\explorer.exe" "$INSTDIR\ERAVOS.exe"'   ; as you, not as admin
    ${EndIf}
  ${EndIf}
SectionEnd

Section "Uninstall"
  !insertmacro CloseEravos
  Delete "$SMPROGRAMS\ERAVOS.lnk"
  Delete "$DESKTOP\ERAVOS.lnk"
  DeleteRegKey HKLM "${UNINST_KEY}"
  DeleteRegKey HKLM "Software\ERAVOS"
  ; the app folder only. Your library (Documents\ERAVOS) stays - delete it yourself if you really want it gone.
  ; whole-folder removal only when it is ERAVOS's own folder (someone may have installed straight into a shared one)
  ${GetFileName} "$INSTDIR" $0
  StrCmp $0 "ERAVOS" 0 +3
    RMDir /r "$INSTDIR"
    Goto done
  RMDir /r "$INSTDIR\canvas"
  RMDir /r "$INSTDIR\tools"
  RMDir /r "$INSTDIR\schemas"
  RMDir /r "$INSTDIR\host"
  RMDir /r "$INSTDIR\tests"
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"
  Delete "$INSTDIR\ERAVOS.exe"
  Delete "$INSTDIR\Uninstall ERAVOS.exe"
  done:
SectionEnd
