#!/usr/bin/env python3
"""Build a reproducible source distribution without private project state."""

import os
import tempfile
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parents[1]
ROOT_FILES = (
    "README.md", "LICENSE", "PROVENANCE.md", "THIRD_PARTY_NOTICES.md",
    "AGENTS.md", "SKILL.md", "package.json", "pnpm-workspace.yaml",
    "pnpm-lock.yaml", "tsconfig.json", ".gitignore",
)
DIRECTORIES = (
    "skills", "packages", "references", "schemas", "adapters", "templates",
    "rubrics", "registry", "examples", "tests", "scripts", "docs", "dist",
)
EXCLUDED = {"node_modules", "__pycache__", ".tevra", ".next", ".svelte-kit", "out", "build"}


def source_files():
    for name in ROOT_FILES:
        path = ROOT / name
        if not path.is_file():
            raise RuntimeError(f"Required distribution file missing: {name}")
        yield path, name
    for directory in DIRECTORIES:
        for current, directories, files in os.walk(ROOT / directory, followlinks=False):
            directories[:] = sorted(name for name in directories if name not in EXCLUDED)
            for name in sorted(files):
                path = Path(current) / name
                if name.startswith(".env") or name in {".DS_Store", ".npmrc"}:
                    continue
                if path.is_symlink():
                    raise RuntimeError(f"Refusing distribution symlink: {path}")
                if path.suffix in {".pyc", ".pyo", ".tsbuildinfo"}:
                    continue
                yield path, path.relative_to(ROOT).as_posix()
    for agent in (".agents", ".claude", ".cursor"):
        for path in sorted((ROOT / "skills").rglob("*")):
            if path.is_file() and not path.is_symlink():
                yield path, f"{agent}/skills/{path.relative_to(ROOT / 'skills').as_posix()}"


def main():
    descriptor, temporary = tempfile.mkstemp(prefix="tevra-release-", suffix=".zip.tmp", dir=ROOT)
    os.close(descriptor)
    try:
        entries = list(source_files())
        with ZipFile(temporary, "w", ZIP_DEFLATED) as archive:
            for path, name in entries:
                metadata = ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
                metadata.compress_type = ZIP_DEFLATED
                metadata.external_attr = 0o100644 << 16
                archive.writestr(metadata, path.read_bytes())
        with ZipFile(temporary) as archive:
            if archive.testzip() is not None:
                raise RuntimeError("ZIP integrity check failed")
            if len(archive.namelist()) != len(set(archive.namelist())):
                raise RuntimeError("Duplicate ZIP paths")
            for path, name in entries:
                if archive.read(name) != path.read_bytes():
                    raise RuntimeError(f"ZIP content differs from source: {name}")
            names = archive.namelist()
            if any(name.startswith("design-kit/") for name in names):
                raise RuntimeError("ZIP must not introduce another design-kit directory")
            skills = [name for name in names if name.startswith(".agents/skills/") and name.endswith("/SKILL.md")]
            if len(skills) != 12:
                raise RuntimeError("ZIP must contain twelve installed Codex skills")
        os.replace(temporary, ROOT / "design-kit.zip")
        print(f"Verified design-kit.zip: {len(entries)} files; root-relative paths; twelve skills per adapter.")
    finally:
        Path(temporary).unlink(missing_ok=True)


if __name__ == "__main__":
    main()
