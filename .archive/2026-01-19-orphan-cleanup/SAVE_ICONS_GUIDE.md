# Icon Saving Guide

This guide helps you save the three Floyd app icons with the correct names and locations.

## Icons to Save

Based on the images you've shown, here are the three icons:

### 1. FloydDesktop Icon
**Description:** "FLOYD DESKTOP" with pixelated blue neon "FLOYD", yellow "DESKTOP" text, "Legacy AI" tagline

**Location:** `/Volumes/Storage/FLOYD_CLI/FloydDesktop/build/icon.png`

**Quick Save:**
```bash
cd /Volumes/Storage/FLOYD_CLI/FloydDesktop/build
# Drag your desktop icon image here and name it icon.png
# OR use the script:
./save-icon.sh ~/path/to/your/desktop-icon.png
```

### 2. Browork Icon (Co-work Feature)
**Description:** "FLOYD" neon sign, "Browork" in lime green 3D text, "Legacy AI" tagline

**Location:** `/Volumes/Storage/FLOYD_CLI/FloydDesktop/src/assets/browork-icon.png`

**Quick Save:**
```bash
cd /Volumes/Storage/FLOYD_CLI/FloydDesktop/src/assets
# Drag your browork icon image here and name it browork-icon.png
# OR use the script:
./save-browork-icon.sh ~/path/to/your/browork-icon.png
```

### 3. FloydChrome Extension Icon
**Description:** "FLOYD for Chrome" with pixelated blue "FLOYD", metallic "for Chrome" text, "Legacy AI" tagline

**Location:** `/Volumes/Storage/FLOYD_CLI/FloydChromeBuild/floydchrome/assets/`

**Required Files:**
- `icon-16.png` (16×16px)
- `icon-48.png` (48×48px)  
- `icon-128.png` (128×128px)

**Quick Save:**
```bash
cd /Volumes/Storage/FLOYD_CLI/FloydChromeBuild/floydchrome/assets
# Use the script to auto-generate all sizes:
./save-icons.sh ~/path/to/your/chrome-icon.png
```

## Manual Method

If you prefer to save manually:

1. **FloydDesktop:** Save as `FloydDesktop/build/icon.png` (512×512px recommended)
2. **Browork:** Save as `FloydDesktop/src/assets/browork-icon.png` (512×512px recommended)
3. **FloydChrome:** Save your source image, then:
   - Resize to 16×16px → save as `icon-16.png`
   - Resize to 48×48px → save as `icon-48.png`
   - Resize to 128×128px → save as `icon-128.png`

## Icon Naming Convention

All icons are named descriptively:
- `icon.png` - FloydDesktop app icon (in `build/` folder)
- `browork-icon.png` - Browork feature icon (in `src/assets/` folder)
- `icon-16.png`, `icon-48.png`, `icon-128.png` - Chrome extension icons (in `assets/` folder)

The names clearly indicate:
- **What app/feature** they're for
- **What size** they are (for Chrome extension)

## Verification

After saving, verify the files exist:

```bash
# Check FloydDesktop icon
ls -lh FloydDesktop/build/icon.png

# Check Browork icon
ls -lh FloydDesktop/src/assets/browork-icon.png

# Check Chrome extension icons
ls -lh FloydChromeBuild/floydchrome/assets/icon-*.png
```

## Next Steps

Once icons are saved:
- **FloydDesktop:** Run `npm run package` to generate platform-specific icons
- **Browork:** Update components to use the custom icon (optional)
- **FloydChrome:** Icons will appear in Chrome toolbar and extension management
