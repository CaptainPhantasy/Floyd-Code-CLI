# FLOYD TUI REBUILD - BASELINE RECEIPT
Generated: Mon Feb  2 07:35:45 UTC 2026
Project: /Volumes/Storage/FLOYD_CLI/TUI REBUILD

Build Exit Code: 0
Lint Exit Code: 1
Test Exit Code: 1

Build Summary:
- Build (tsc) succeeded.

Lint Summary:
- eslint src failed with 2 problems:
  - ExternalEditorOverlay.tsx:59:20 error 'e' is defined but never used
  - providerConfig.ts:125:12 error 'e' is defined but never used

Test Summary:
- vitest run output showed many TUI rendering artifacts and "Raw mode is not supported" errors.
- Integration tests for App Overlays reported "All Integration Tests Passed".
- process.exit was unexpectedly called with "1" in some tests.
