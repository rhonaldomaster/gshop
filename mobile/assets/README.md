# 📁 Assets Directory

This directory contains all app assets including icons, splash screens, and store graphics.

## 📋 Required Files

### Essential Assets
- `icon.png` - iOS app icon (1024x1024, no alpha)
- `adaptive-icon.png` - Android adaptive icon (1024x1024, with alpha)
- `splash-icon.png` - Splash screen logo (1284x2778)
- `favicon.png` - Web favicon (48x48)
- `notification-icon.png` - Android notification icon (96x96, white)

### Optional Assets
- `notification-sound.wav` - Custom notification sound
- Store screenshots and promotional graphics

## 🛠️ Generating Icons

### Method 1: Using Generation Script
```bash
# Install dependencies
npm install sharp

# Generate all icons from single source
node scripts/generate-icons.js path/to/source-1024.png
```

### Method 2: Manual Placement
1. Create icons following specifications in `ICONS_AND_SPLASH_GUIDE.md`
2. Place files in this directory with correct names
3. Verify dimensions match requirements

## ✅ Verification Checklist

- [ ] All required files present
- [ ] Correct dimensions (1024x1024 for icons)
- [ ] iOS icon has no transparency
- [ ] Android icon respects safe zone (66%)
- [ ] Splash screen is centered
- [ ] Files are optimized (<500KB each)
- [ ] Icons look good at all sizes

## 🎨 Design Guidelines

### GSHOP Branding
- Primary Color: #6366f1 (Indigo)
- Background: #ffffff (White)
- Simple, recognizable design
- Consistent across platforms

## 📚 More Information

See `ICONS_AND_SPLASH_GUIDE.md` in the mobile directory for complete documentation.

---

**Last Updated:** 2025-09-30