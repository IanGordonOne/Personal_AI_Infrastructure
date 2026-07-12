#!/usr/bin/env bash
# Fork containment gate (bd claude-ua3 Phase 0).
#
# Fails the build if any git-TRACKED file in this public fork contains the
# principal's identity. This is the server-side backstop: local .git/hooks are
# absent on a fresh clone and skippable with `git push --no-verify`, but this CI
# job runs on every push/PR and cannot be bypassed from a developer's machine.
#
# The identity patterns are supplied via the PRINCIPAL_IDENTITY_PATTERNS repo
# SECRET (newline-separated), so they are NEVER committed to this public repo.
# It screens for the PRINCIPAL only — upstream's identity legitimately appears
# in a fork of upstream.
#
# HONEST SCOPE: a fixed pattern list is a backstop for KNOWN identity strings,
# not a proof of content-cleanliness. Private content with no listed pattern
# (a friend's name, a private codename) is not caught here — that is closed
# structurally (private directories are absent from an upstream checkout) and by
# human PR review. See bd claude-ua3 / claude-ua3.1.
set -euo pipefail

if [ -z "${PRINCIPAL_IDENTITY_PATTERNS:-}" ]; then
  echo "::error::PRINCIPAL_IDENTITY_PATTERNS secret is not set — cannot screen. Failing closed." >&2
  echo "  Set it: gh secret set PRINCIPAL_IDENTITY_PATTERNS < patterns.txt   (one pattern per line)" >&2
  exit 1
fi

fail=0
while IFS= read -r pat; do
  [ -z "$pat" ] && continue
  # -I skip binary, -F fixed-string, -n line numbers, -i case-insensitive
  if matches=$(git grep -nIFi -e "$pat" -- . 2>/dev/null); then
    echo "::error::principal identity '${pat}' found in tracked files — scrub before merge:" >&2
    printf '%s\n' "$matches" >&2
    fail=1
  fi
done <<< "$PRINCIPAL_IDENTITY_PATTERNS"

if [ "$fail" -ne 0 ]; then
  echo "::error::containment gate FAILED." >&2
  exit 1
fi
echo "containment gate passed: no principal identity in tracked files."
