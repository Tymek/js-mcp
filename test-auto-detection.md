# Auto-Detection Test Cases

This document demonstrates the improved background auto-detection logic for the MCP server.

## Background Mode (Auto-detected)
These scripts will automatically run in background mode:
- `dev` ✅
- `start` ✅
- `dev-server` ✅
- `start-app` ✅
- `serve` ✅
- `serve-docs` ✅
- `watch` ✅
- `watch-build` ✅
- `dev:frontend` ✅
- `start_production` ✅

## Foreground Mode (Auto-detected)
These scripts will automatically run in foreground mode (exclusions):
- `cleanup` ❌ (excluded)
- `clean` ❌ (excluded)
- `reset` ❌ (excluded)
- `build` ❌ (excluded)
- `test` ❌ (excluded)
- `lint` ❌ (excluded)
- `format` ❌ (excluded)
- `deploy` ❌ (excluded)
- `install` ❌ (excluded)
- `dev-cleanup` ❌ (excluded - cleanup takes priority)
- `start-reset` ❌ (excluded - reset takes priority)
- `build-dev` ❌ (excluded - build takes priority)
- `test-watch` ❌ (excluded - test takes priority)
- `cleanup:dev` ❌ (excluded)
- `reset_dev` ❌ (excluded)

## Complex Cases
These demonstrate the sophisticated logic:
- `dev-build` → ❌ Foreground (build exclusion takes priority)
- `build-watch` → ❌ Foreground (build exclusion takes priority)
- `server-dev` → ✅ Background (dev indicator, no exclusions)
- `development` → ✅ Background (contains 'dev')
- `devtools` → ✅ Background (contains 'dev')
- `predev` → ✅ Background (contains 'dev')
- `testdev` → ❌ Foreground (test exclusion takes priority)

## Manual Override
You can always override auto-detection by explicitly setting the `background` parameter:
- `background: true` → Forces background mode
- `background: false` → Forces foreground mode
