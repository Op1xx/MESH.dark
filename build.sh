#!/usr/bin/env bash
# Сборка архива расширения: dist/mesh-dark-<version>.zip и .xpi
# .xpi — это тот же zip, расширение имеет значение только для установки.
#
# Запуск:
#   ./build.sh              # собрать zip + xpi
#   ./build.sh --zip-only   # только zip
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"

python3 - "$ROOT" "$@" <<'PY'
import json, os, sys, zipfile

root = sys.argv[1]
args = sys.argv[2:]
zip_only = "--zip-only" in args

manifest = json.load(open(os.path.join(root, "manifest.json"), encoding="utf-8"))
version = manifest["version"]

dist = os.path.join(root, "dist")
os.makedirs(dist, exist_ok=True)

targets = ["manifest.json", "src", "popup", "icons"]
base = os.path.join(dist, f"mesh-dark-{version}")
zip_path = base + ".zip"

def build(path):
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as z:
        for t in targets:
            p = os.path.join(root, t)
            if os.path.isfile(p):
                z.write(p, t)
                continue
            for dp, _dn, fn in os.walk(p):
                for f in sorted(fn):
                    if f.startswith(".") or f == ".DS_Store":
                        continue
                    full = os.path.join(dp, f)
                    z.write(full, os.path.relpath(full, root))

build(zip_path)
print("Готово:", zip_path)

if not zip_only:
    xpi_path = base + ".xpi"
    with open(zip_path, "rb") as fsrc, open(xpi_path, "wb") as fdst:
        fdst.write(fsrc.read())
    print("Готово:", xpi_path)

print("Содержимое:")
with zipfile.ZipFile(zip_path) as z:
    for n in z.namelist():
        print("  ", n)
PY
