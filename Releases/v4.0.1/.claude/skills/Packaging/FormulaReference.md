# Homebrew Formula Reference

Standard Operating Procedure for authoring, validating, and maintaining Homebrew formulas.

---

## Formula Anatomy

A Homebrew formula is a Ruby class that describes how to install a package.

### Binary Formula (Pre-built Downloads)

```ruby
class ToolName < Formula
  desc "Short description of the tool"
  homepage "https://github.com/owner/repo"
  version "1.0.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/owner/repo/releases/download/v1.0.0/tool-1.0.0-darwin-arm64.tar.gz"
      sha256 "abc123..."
    end
    on_intel do
      url "https://github.com/owner/repo/releases/download/v1.0.0/tool-1.0.0-darwin-amd64.tar.gz"
      sha256 "def456..."
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/owner/repo/releases/download/v1.0.0/tool-1.0.0-linux-arm64.tar.gz"
      sha256 "ghi789..."
    end
    on_intel do
      url "https://github.com/owner/repo/releases/download/v1.0.0/tool-1.0.0-linux-amd64.tar.gz"
      sha256 "jkl012..."
    end
  end

  def install
    bin.install "tool-name"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/tool-name --version")
  end
end
```

### Source Formula (Build from Source)

```ruby
class ToolName < Formula
  desc "Short description of the tool"
  homepage "https://github.com/owner/repo"
  url "https://github.com/owner/repo/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "abc123..."
  license "MIT"

  depends_on "go" => :build

  def install
    system "go", "build", *std_go_args(ldflags: "-s -w"), "./cmd/tool"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/tool-name --version")
  end
end
```

---

## DSL Reference

### Metadata
| Method | Purpose | Example |
|--------|---------|---------|
| `desc` | Package description (max 80 chars) | `desc "Named Tmux Manager"` |
| `homepage` | Project homepage URL | `homepage "https://github.com/..."` |
| `url` | Download URL | `url "https://..."` |
| `sha256` | SHA256 checksum of the download | `sha256 "abc123..."` |
| `version` | Explicit version (if not inferred from URL) | `version "1.0.0"` |
| `license` | SPDX license identifier | `license "MIT"` |

### Platform Blocks
```ruby
on_macos do ... end      # macOS-specific
on_linux do ... end      # Linux-specific
on_arm do ... end        # ARM (Apple Silicon, ARM64)
on_intel do ... end      # Intel (x86_64, AMD64)
```

### Dependencies
```ruby
depends_on "go" => :build          # Build-time only
depends_on "openssl"               # Runtime dependency
depends_on "tmux" => :recommended  # Recommended but optional
depends_on :macos                  # macOS required
```

### Installation Methods
```ruby
bin.install "binary-name"                    # Install binary to bin/
bin.install "src-name" => "dest-name"        # Install with rename
prefix.install "config" => ".config"         # Install to prefix
etc.install "config.yaml"                    # Install to etc/
```

### Test Block
```ruby
test do
  assert_match "version", shell_output("#{bin}/tool --version")
  assert_match "help", shell_output("#{bin}/tool --help")
  system bin/"tool", "check"
end
```

---

## Naming Conventions

| Rule | Example |
|------|---------|
| Class name = CamelCase of formula name | `myproject` → `class Myproject` |
| Multi-word with hyphens | `my-tool` → `class MyTool` |
| Numbers stay in place | `tool2` → `class Tool2` |
| Underscores become CamelCase | `my_tool` → `class MyTool` |

---

## Archive Naming Convention

Standard pattern for release archives:

```
{name}-{version}-{os}-{arch}.tar.gz
```

Examples:
- `myproject-1.0.0-darwin-arm64.tar.gz`
- `myproject-1.0.0-darwin-amd64.tar.gz`
- `myproject-1.0.0-linux-arm64.tar.gz`
- `myproject-1.0.0-linux-amd64.tar.gz`

---

## Validation Commands

```bash
# Syntax check
brew audit --strict --new Formula/tool.rb

# Test formula
brew test Formula/tool.rb

# Install from local formula
brew install --build-from-source Formula/tool.rb

# Check for issues
brew style Formula/tool.rb
```

---

## Common Patterns

### Go Binary with ldflags
```ruby
def install
  ldflags = %W[
    -s -w
    -X main.version=#{version}
    -X main.commit=#{Utils.git_head}
  ]
  system "go", "build", *std_go_args(ldflags:), "./cmd/tool"
end
```

### Bun/Node Binary
```ruby
def install
  bin.install "tool-name"
end
```

### Multiple Binaries
```ruby
def install
  bin.install "cli"
  bin.install "daemon"
  bin.install "tui"
end
```

### Shell Completions
```ruby
def install
  bin.install "tool"
  generate_completions_from_executable(bin/"tool", "completion")
  # or
  bash_completion.install "completions/tool.bash" => "tool"
  zsh_completion.install "completions/_tool"
  fish_completion.install "completions/tool.fish"
end
```
