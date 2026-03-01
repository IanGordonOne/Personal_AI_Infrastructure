# Build Workflow

Compile binaries for all configured targets from Packaging.json.

---

## Prerequisites

- Packaging.json exists at `<project>/.claude/skill-data/Packaging.json`
- If not, run the **Init** workflow first

## Steps

### 1. Load Configuration

Read Packaging.json from the project directory. Resolve the current version:

| Version Source | Resolution |
|---------------|------------|
| `git_tag` | `git describe --tags --abbrev=0` |
| `package.json` | Read `version` field |
| `Cargo.toml` | Read `version` field |
| `pyproject.toml` | Read `version` field |

### 2. Create Build Directory

```bash
mkdir -p <project>/dist
```

### 3. Build Per Language

Read `BuildPatterns.md` for the full reference. Summary:

#### Go
```bash
for each target in targets:
  CGO_ENABLED=0 GOOS=${os} GOARCH=${arch} go build \
    -trimpath \
    -ldflags "${build.ldflags} -X main.version=${version}" \
    -o dist/${binary_name}-${os}-${arch} \
    ${binary.main}
```

#### Bun/TypeScript
```bash
for each target in targets:
  bun build ${binary.main} --compile --minify \
    --target=bun-${os}-${arch} \
    --outfile dist/${binary_name}-${os}-${arch}
```

Note: Bun uses `x64` not `amd64`. Map accordingly:
- `amd64` → `x64`
- `arm64` → `arm64`

#### Rust
```bash
for each target in targets:
  cargo build --release --target ${rust_target}
  cp target/${rust_target}/release/${binary_name} dist/${binary_name}-${os}-${arch}
```

#### Python (PyInstaller)
```bash
pyinstaller --onefile --name ${binary_name} ${binary.main}
cp dist/${binary_name} dist/${binary_name}-${os}-${arch}
```

### 4. Create Archives

For each built binary:

```bash
cd dist/
tar -czf ${project_name}-${version}-${os}-${arch}.tar.gz ${binary_name}-${os}-${arch}
```

Rename the binary inside the archive to just the binary name (without os-arch suffix):

```bash
cd dist/
mv ${binary_name}-${os}-${arch} ${binary_name}
tar -czf ${project_name}-${version}-${os}-${arch}.tar.gz ${binary_name}
mv ${binary_name} ${binary_name}-${os}-${arch}
```

### 5. Generate Checksums

```bash
cd dist/
shasum -a 256 *.tar.gz > checksums.txt
```

### 6. Report

List all built archives with their SHA256 checksums. Suggest next steps:
- **Formula**: Generate Homebrew formula with these SHAs
- **Release**: Create GitHub release with these assets
