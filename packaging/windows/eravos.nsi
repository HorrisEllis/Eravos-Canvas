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

!insertmacro MUI_PAGE_WELCOME
!define MUI_DIRECTORYPAGE_TEXT_TOP "Where the ERAVOS canvas goes - the program itself. Next you choose where your library goes (your projects, tools, packs and exports): it stays separate from the canvas."
!insertmacro MUI_PAGE_DIRECTORY
Page custom LibraryPage LibraryLeave
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

; 3.208 WHERE THE LIBRARY GOES (his words, 2026-11-21: "have it ask where you want to save. Like have it the default be the documents
; like documents /Eravos, and but then you know have like a browse button to change it."). The canvas is installed here (Program Files);
; everything else - projects, tools, packs, exports - lives in the library. The choice is per user: %APPDATA%\ERAVOS\library.txt (UTF-16),
; which ERAVOS reads at start (desktop/main.js pickHome). A silent update never asks and never changes it.
Var LIBDIR
Var LIBFIELD
Function LibraryPage
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
  SetOverwrite on
  File /r "${SRC}\*.*"
  Call VerifyFiles
  ${If} $BAD != ""
    DetailPrint "These files did not install completely:"
    DetailPrint "$BAD"
    WriteRegStr HKLM "Software\ERAVOS" "LastInstallError" "$BAD"
    MessageBox MB_OK|MB_ICONSTOP "ERAVOS did not install completely - these files were not written in full:$\r$\n$\r$\n$BAD$\r$\nNothing of yours was touched (your library is Documents\ERAVOS). Close anything that may hold ERAVOS's files and run this Setup again." /SD IDOK
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
