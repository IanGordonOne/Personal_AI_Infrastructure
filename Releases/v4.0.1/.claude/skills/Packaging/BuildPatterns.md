# Build Patterns

Language-specific build commands, cross-compilation matrices, and archive creation patterns.

---

## Go

### Detection
- File: `go.mod`
- Binary entry points: `cmd/*/main.go`, `main.go`
- Existing config: `.goreleaser.yaml`

### Build Command
```bash
CGO_ENABLED=0 GOOS=${os} GOARCH=${arch} go build \
  -trimpath \
  -ldflags "-s -w -X main.version=${version}" \
  -o dist/${name}-${os}-${arch} \
  ./cmd/${binary}
```

### Cross-Compile Matrix
| OS | Arch | Target |
|----|------|--------|
| darwin | arm64 | Apple Silicon Mac |
| darwin | amd64 | Intel Mac |
| linux | arm64 | ARM Linux |
| linux | amd64 | Intel/AMD Linux |

### Flags
| Flag | Purpose |
|------|---------|
| `CGO_ENABLED=0` | Static binary, no C dependencies |
| `-trimpath` | Remove local paths from binary |
| `-s -w` | Strip debug info + DWARF symbols |
| `-X main.version=${v}` | Embed version at build time |

---

## Bun/TypeScript

### Detection
- File: `package.json`
- Look for: `bun build --compile` in scripts
- Binary entry points: `bin` field, `scripts.build:bin`

### Build Command
```bash
bun build ${entry} --compile --minify \
  --target=bun-${os}-${arch} \
  --outfile dist/${name}-${os}-${arch}
```

### Cross-Compile Matrix
| OS | Arch | Bun Target |
|----|------|------------|
| darwin | arm64 | `bun-darwin-arm64` |
| darwin | x64 | `bun-darwin-x64` |
| linux | x64 | `bun-linux-x64` |
| linux | arm64 | `bun-linux-arm64` |

### Notes
- Bun compiles TypeScript to a standalone binary
- Uses `--minify` for smaller output
- Entry point typically found in `package.json` `bin` field or `src/index.ts`
- Windows: add `.exe` extension, use `bun-windows-x64`

---

## Rust

### Detection
- File: `Cargo.toml`
- Binary entry points: `[[bin]]` sections, `src/main.rs`
- Existing config: `.cargo/config.toml`

### Build Command
```bash
cargo build --release --target ${target}
# Binary at: target/${target}/release/${name}
```

### Cross-Compile Matrix
| OS | Arch | Rust Target |
|----|------|-------------|
| darwin | arm64 | `aarch64-apple-darwin` |
| darwin | amd64 | `x86_64-apple-darwin` |
| linux | arm64 | `aarch64-unknown-linux-musl` |
| linux | amd64 | `x86_64-unknown-linux-musl` |

### Prerequisites
```bash
rustup target add aarch64-apple-darwin
rustup target add x86_64-apple-darwin
rustup target add aarch64-unknown-linux-musl
rustup target add x86_64-unknown-linux-musl
```

---

## Python

### Detection
- File: `pyproject.toml`
- Binary entry points: `[project.scripts]`, `[tool.poetry.scripts]`
- Build tool: PyInstaller for single-binary distribution

### Build Command (PyInstaller)
```bash
pyinstaller --onefile --name ${name} ${entry_point}
# Binary at: dist/${name}
```

### Notes
- PyInstaller creates platform-specific binaries (cannot cross-compile natively)
- Prefer building on each target platform via CI
- Alternative: use `shiv` or `pex` for Python zip apps
- If project uses `uv`, check for `uv build` support

---

## Archive Creation

Standard archive creation for all languages:

```bash
# Create tar.gz archive
cd dist/
tar -czf ${name}-${version}-${os}-${arch}.tar.gz ${binary_name}

# Generate SHA256 checksum
shasum -a 256 ${name}-${version}-${os}-${arch}.tar.gz >> checksums.txt
```

### Archive Naming Convention
```
{project}-{version}-{os}-{arch}.tar.gz
```

### Checksum File Format
```
abc123def456...  project-1.0.0-darwin-arm64.tar.gz
789ghi012jkl...  project-1.0.0-darwin-amd64.tar.gz
...
```

---

## Version Resolution

| Source | Detection | Command |
|--------|-----------|---------|
| `git_tag` | Most recent semver tag | `git describe --tags --abbrev=0` |
| `package.json` | `version` field | `jq -r .version package.json` |
| `Cargo.toml` | `version` field | `grep '^version' Cargo.toml` |
| `pyproject.toml` | `version` field | `grep '^version' pyproject.toml` |
| `go_module` | Tag on Go module | `git describe --tags --abbrev=0` |

---

## GoReleaser Integration

If `.goreleaser.yaml` exists, Detect.ts captures it but the Packaging skill provides its own build pipeline. GoReleaser is not required.

When GoReleaser is present:
- Note it in Packaging.json as `"goreleaser": true`
- The Release workflow can optionally delegate to `goreleaser release` instead of building manually
- Formula generation still uses our own FormulaGen.ts for consistency
