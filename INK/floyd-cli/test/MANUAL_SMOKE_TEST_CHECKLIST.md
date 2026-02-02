# INK/floyd-cli Manual Smoke Test Checklist

**Date:** 2026-01-27
**Tester:** _____________
**Status:** _____________

---

## Environment Setup

- [ ] Node.js installed (`node --version`)
- [ ] Project built (`npm run build`)
- [ ] CLI link created (`npm link`)
- [ ] API key configured in `.env`

---

## Test Scenarios

### 1. Basic Startup
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Run `floyd-cli` | CLI starts without errors | | |
| 2 | Wait for render | FLOYD greeting appears | | |
| 3 | Check input area | `>` prompt visible | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 2. Help Overlay
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Press `Ctrl+/` | Help overlay appears | | |
| 2 | Check content | Keyboard shortcuts shown | | |
| 3 | Press `Esc` | Overlay closes | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 3. Command Palette
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Press `Ctrl+P` | Command palette appears | | |
| 2 | Type `help` | Commands filter | | |
| 3 | Press `Enter` | Help opens | | |
| 4 | Press `Esc` | All overlays close | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 4. Message Submission
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Type `hello` and press `Enter` | Message appears in history | | |
| 2 | Wait for response | `[thinking]` status appears | | |
| 3 | Wait for completion | Floyd response shown | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 5. Permission Request (AskOverlay)
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Send message requiring tool | AskOverlay modal appears | | |
| 2 | Check risk level | Risk indicator shown (LOW/MEDIUM/HIGH) | | |
| 3 | Check arguments | Tool args displayed | | |
| 4 | Press `1` | "once" scope selected | | |
| 5 | Press `Y` or `Enter` | Permission granted, tool executes | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 6. Permission Denial
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Trigger permission request | AskOverlay appears | | |
| 2 | Press `N` or `Esc` | Permission denied | | |
| 3 | Check result | Tool blocked, error message shown | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 7. Scope Selection
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Trigger permission request | AskOverlay appears | | |
| 2 | Press `2` (session) | "session" scope selected | | |
| 3 | Press `Enter` | Decision saved for session | | |
| 4 | Trigger same tool again | No prompt (auto-approved) | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 8. Safety Mode Toggle
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Press `Shift+Tab` | Mode changes (yolo→ask→plan) | | |
| 2 | Press `Shift+Tab` again | Mode cycles again | | |
| 3 | Check status | Current mode indicator visible | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 9. Message History Navigation
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Send multiple messages | History shows all messages | | |
| 2 | Press `PageUp` | Scroll up in history | | |
| 3 | Press `PageDown` | Scroll down in history | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

### 10. Quit
| Step | Action | Expected | Actual | Pass |
|------|--------|----------|---------|------|
| 1 | Press `Ctrl+Q` | CLI exits cleanly | | |

**Notes:** _____________
**Result:** [ ] PASS [ ] FAIL

---

## Summary

**Total Tests:** 10
**Passed:** ___
**Failed:** ___
**Pass Rate:** ___%

**Overall Result:** [ ] PASS (≥95%) [ ] FAIL (<95%)

---

## Issues Found

1. ___________________________
2. ___________________________
3. ___________________________

---

## Additional Notes

___________________________
___________________________
___________________________

---

**Tester Signature:** _____________
**Date:** _____________
