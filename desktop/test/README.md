# Desktop integration tests (Electron + Playwright)

Drive the real ERAVOS.exe app layout. Build first (`node desktop/build.mjs`), then, from a folder with `playwright` and `electron` installed:

    # skeleton + every pack in ERAVOS Library › Packs: grows, plays the Future Bass song
    ELECTRON=<electron binary> APP=<ERAVOS>/resources/app LIB=<copy of ERAVOS Library> PLAY=1 node desktop/test/skel.mjs
    # bare skeleton → drop Core, Effects, Synths packs → kept → restart restores them
    ELECTRON=<electron binary> APP=<ERAVOS>/resources/app PACKS="<ERAVOS>/ERAVOS Library/Packs" LIB=<empty folder> node desktop/test/bare.mjs

Linux without a display: prefix with `xvfb-run -a`. Add `--no-sandbox` is already passed.
