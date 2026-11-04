; ERAVOS Setup - installs ERAVOS to the system (Program Files\ERAVOS, every user on this PC).
; Built by packaging\windows\make-exe.ps1 (or by hand):  makensis /DVERSION=0.1.0 /DSRC=..\..\dist\ERAVOS /DOUT=..\..\dist\ERAVOS-Setup-0.1.0.exe eravos.nsi
;   , the app goes in Program Files\ERAVOS, never written to while it runs
;   , your work is in the library, Documents\ERAVOS (projects, exports, packs, tools, drop) - Setup and Uninstall never touch it
;   , Start menu + desktop shortcuts, Settings > Apps entry with an uninstaller
;   , run again (or by the app's updater, silently with /S) to update in place
; Unicode, LZMA, admin (Program Files). /S = silent.

Unicode true
SetCompressor /SOLID lzma
!include "MUI2.nsh"
!include "FileFunc.nsh"

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

Name "ERAVOS ${VERSION}"
OutFile "${OUT}"
InstallDir "$PROGRAMFILES64\ERAVOS"
InstallDirRegKey HKLM "Software\ERAVOS" "InstallDir"
RequestExecutionLevel admin
BrandingText "ERAVOS ${VERSION}"
VIProductVersion "${VERSION}.0"
VIAddVersionKey "ProductName" "ERAVOS"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "FileDescription" "ERAVOS Setup"
VIAddVersionKey "LegalCopyright" "ERAVOS"

!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall.ico"
!define MUI_WELCOMEPAGE_TEXT "This installs ERAVOS ${VERSION} on this PC.$\r$\n$\r$\nYour projects, exports, packs and tools are kept in your library, Documents\ERAVOS. Installing, updating or uninstalling never touches it.$\r$\n$\r$\nClose ERAVOS before you continue."
!define MUI_FINISHPAGE_RUN "$INSTDIR\ERAVOS.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Start ERAVOS"
!define MUI_FINISHPAGE_RUN_NOTCHECKED
!define MUI_FINISHPAGE_SHOWREADME ""
!define MUI_FINISHPAGE_SHOWREADME_TEXT "Open my ERAVOS library (Documents\ERAVOS)"
!define MUI_FINISHPAGE_SHOWREADME_FUNCTION OpenLibrary
!define MUI_FINISHPAGE_SHOWREADME_NOTCHECKED

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "English"

Function .onInit
  SetShellVarContext all
  SetRegView 64
FunctionEnd
Function un.onInit
  SetShellVarContext all
  SetRegView 64
FunctionEnd

; the library is per user: the person running Setup (Documents)
Function OpenLibrary
  SetShellVarContext current
  CreateDirectory "$DOCUMENTS\ERAVOS"
  ExecShell "open" "$DOCUMENTS\ERAVOS"
  SetShellVarContext all
FunctionEnd

; close a running ERAVOS (its files are in use) - ask first unless silent (the updater has already closed it)
!macro CloseEravos
  nsExec::ExecToStack 'tasklist /FI "IMAGENAME eq ERAVOS.exe" /NH'
  Pop $0
  Pop $1
  StrCpy $2 $1 10
  StrCmp $2 "ERAVOS.exe" 0 +4
    IfSilent +2
    MessageBox MB_OKCANCEL|MB_ICONINFORMATION "ERAVOS is running. It will be closed (autosave keeps your song)." IDCANCEL +2
    nsExec::Exec 'taskkill /IM ERAVOS.exe /F'
  Sleep 800
!macroend

Section "ERAVOS" SecApp
  SectionIn RO
  !insertmacro CloseEravos
  SetOutPath "$INSTDIR"
  ; an update replaces the app's own folders completely (a tool removed upstream must not linger)
  RMDir /r "$INSTDIR\canvas"
  RMDir /r "$INSTDIR\tools"
  RMDir /r "$INSTDIR\schemas"
  RMDir /r "$INSTDIR\host"
  RMDir /r "$INSTDIR\tests"
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"
  File /r "${SRC}\*.*"
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
