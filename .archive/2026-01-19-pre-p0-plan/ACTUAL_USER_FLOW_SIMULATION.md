# Actual User Flow Simulation - Floyd Desktop Settings

**Date:** 2026-01-18  
**Status:** IN PROGRESS - Fixes applied, needs real runtime testing

---

## What I Fixed

1. **Provider inference from endpoint** - When loading old settings without provider field, now infers provider from endpoint
2. **Model validation** - Ensures saved model exists in provider's model list, auto-corrects if not
3. **Error handling** - Added checks for window.floydAPI availability
4. **Type fixes** - Updated setSetting return type to Promise<{ success: boolean; error?: string }>
5. **Save button error handling** - Now checks IPC return values and shows errors

---

## Actual User Steps (What You Experience)

### Step 1: Click Floyd Desktop.app icon
**What happens:** Electron launches, main process starts  
**What you see:** App window appears (or blank screen if broken)

### Step 2: Look at the app
**What happens:** React app mounts, UI renders  
**What you see:** Main UI with panels, or Settings modal if it auto-opens, or blank screen

### Step 3: See "Enter your API key" text
**What happens:** Settings modal is open, API tab is visible  
**What you see:** Settings form with Provider dropdown, API Key field, Endpoint field, Model dropdown

### Step 4: Provider dropdown shows options
**What you see:** Dropdown with "GLM (api.z.ai)", "Anthropic (Direct)", "OpenAI", "DeepSeek"

### Step 5: Select a provider
**What should happen:** 
- Endpoint field auto-fills
- Model dropdown updates to show that provider's models
**What might be broken:** Endpoint doesn't update, models don't change

### Step 6: Model dropdown shows models
**What you should see:**
- GLM: 2 models (Claude Opus 4, Claude Sonnet 4)
- Anthropic: 3 models (Claude Sonnet 4, Claude Opus 4, Claude 3.5 Sonnet)
**What might be broken:** Shows wrong models, shows "blended" models from multiple providers

### Step 7: Enter API key
**What happens:** Type in password field  
**What might be broken:** Input doesn't work, field doesn't accept input

### Step 8: Click "Save Settings" button
**What should happen:** Settings save to disk, success message appears  
**What might be broken:** Button does nothing, no feedback, error not shown

### Step 9: Settings persist
**What should happen:** Close app, reopen, settings still there  
**What might be broken:** Settings don't save, or don't load on restart

---

## Known Issues Fixed

1. ✅ Provider inference from endpoint (for old settings)
2. ✅ Model validation and auto-correction
3. ✅ Error handling for missing floydAPI
4. ✅ Save button error checking
5. ⚠️ Need to verify: Does window.floydAPI actually exist at runtime?
6. ⚠️ Need to verify: Does provider dropdown onChange actually fire?
7. ⚠️ Need to verify: Does endpoint field actually update?

---

## Next: Real Runtime Testing Required

The fixes are in place, but I cannot actually test Electron runtime from here. You need to:

1. Launch the app
2. Open DevTools (Cmd+Shift+I)
3. Check Console for errors
4. Check if window.floydAPI exists: `console.log(window.floydAPI)`
5. Try changing provider and watch console logs
6. Try saving and check for errors

The console.log statements I added will help debug what's actually happening.
