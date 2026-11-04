# Desktop integration tests (Electron + Clear Glass's driver)

Drive the real ERAVOS.exe app layout with the driver's app mode (`host/driver/glass.js` → `electron.launch`, no Playwright).
Build first (`node desktop/build.mjs`), then (ELECTRON = ERAVOS.exe, or an `electron` binary with APP = <ERAVOS>/resources/app):

    # the exe layout (canvas/ + tools/ beside resources/app): grows, plays the Future Bass song
    ELECTRON=<electron binary> APP=<ERAVOS>/resources/app LIB=<empty folder> PLAY=1 node desktop/test/skel.mjs
    # extra packs: drop Core, Effects, Synths packs (node desktop/packs.mjs --out <dir>) → kept in packs/ → restart restores them
    ELECTRON=<electron binary> APP=<ERAVOS>/resources/app PACKS=<dir> LIB=<empty folder> node desktop/test/bare.mjs

Linux without a display: prefix with `xvfb-run -a`. Add `--no-sandbox` is already passed.
