#!/bin/sh
# ERAVOS launcher for macOS / Linux: serves this folder at http://localhost:4747 and opens it.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then echo "ERAVOS needs Node.js — install the LTS version from https://nodejs.org"; exit 1; fi
exec node serve.js --open
