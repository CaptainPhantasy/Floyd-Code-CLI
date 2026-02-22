# BROWSER AUTOMATION — 9 Tools

## REQUIREMENT

FloydChrome extension must be running on `ws://localhost:3005`

**ALWAYS check `browser_status` first.** Handle gracefully if unavailable.

## TOOL REFERENCE

| Tool | Purpose | Notes |
|------|---------|-------|
| **browser_status** | Check connection | **USE THIS FIRST** |
| **browser_navigate** | Go to URL | Waits for page load |
| **browser_read_page** | Read page content | Returns markdown |
| **browser_screenshot** | Capture screenshot | Visual verification |
| **browser_click** | Click element | Uses selector |
| **browser_type** | Type text | Into input field |
| **browser_find** | Find elements | Returns selectors |
| **browser_get_tabs** | List tabs | For multi-tab work |
| **browser_create_tab** | New tab | For parallel browsing |

## SAFE WORKFLOW

```
browser_status (check connection)
    ↓
[if connected]
    browser_navigate
    browser_read_page
    [do work]
    ↓
[if not connected]
    Proceed without browser tools
```

## EXAMPLE WORKFLOWS

### Read documentation
```json
browser_status → browser_navigate({ "url": "https://docs.example.com" })
→ browser_read_page → (extract info)
```

### Visual verification
```json
browser_screenshot({ "path": "/path/to/screenshot.png" })
```

### Form interaction
```json
browser_click({ "selector": "#username" })
→ browser_type({ "selector": "#username", "text": "douglas" })
→ browser_click({ "selector": "button[type='submit']" })
```

### Multi-tab research
```json
browser_create_tab({ "url": "https://docs.lib1.com" })
→ browser_create_tab({ "url": "https://docs.lib2.com" })
→ browser_get_tabs → browser_read_page (for each)
```

## GRACEFUL DEGRADATION

If `browser_status` returns unavailable:
- Log a warning
- Continue without browser tools
- Use `fetch` as alternative for HTTP requests
