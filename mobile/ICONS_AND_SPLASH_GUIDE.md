# 🎨 App Icons & Splash Screens Guide

Complete guide for creating and optimizing app icons and splash screens for the GSHOP mobile app.

## 📋 Asset Requirements

### App Icon Specifications

#### iOS
- **Size**: 1024x1024px (will be scaled down automatically)
- **Format**: PNG (no transparency)
- **Color Space**: sRGB or P3
- **File**: `icon.png`
- **Requirements**:
  - Square image
  - No rounded corners (iOS applies them)
  - No alpha channel
  - 24-bit RGB

#### Android
- **Size**: 1024x1024px (adaptive icon)
- **Format**: PNG with transparency supported
- **File**: `adaptive-icon.png`
- **Adaptive Icon Requirements**:
  - Safe zone: 66% of icon (center 660x660px)
  - Total canvas: 1024x1024px
  - Can have transparency

### Splash Screen Specifications

#### Universal Splash
- **Size**: 1284x2778px (iPhone 14 Pro Max)
- **Format**: PNG
- **File**: `splash-icon.png`
- **Requirements**:
  - Safe area: 1170x1170px (center)
  - Background color: Solid color (#ffffff)
  - Logo: Centered, 40% of height

#### Alternative Sizes
- **Tablet**: 2048x2732px (iPad Pro 12.9")
- **Minimum**: 640x1136px (iPhone SE)

## 🎨 Design Guidelines

### GSHOP Branding

#### Primary Colors
```
Primary:    #27BFF9 (Sky Blue)
Secondary:  #633EBB (Grape)
Accent:     #994636 (Chestnut)
Background: #ffffff (White)
Text:       #1f2937 (Dark Gray)
```

#### Logo Requirements
- **Format**: Vector-based (SVG source)
- **Variants**:
  - Full logo with text
  - Icon-only (for small sizes)
  - Monochrome version
- **Spacing**: Minimum 20px padding
- **Readability**: Must be clear at 60x60px

### Icon Design Best Practices

#### DO:
✅ Use simple, recognizable shapes
✅ Maintain consistent visual style
✅ Test at multiple sizes (20px to 1024px)
✅ Use high contrast colors
✅ Keep it unique and memorable
✅ Follow platform guidelines

#### DON'T:
❌ Use photos or complex gradients
❌ Include small text
❌ Use more than 3-4 colors
❌ Make it too similar to other apps
❌ Use platform UI elements
❌ Include words or numbers

## 🛠️ Creating Assets

### Method 1: Using Figma (Recommended)

1. **Download Template**:
   - [iOS App Icon Template](https://www.figma.com/community/file/857303226040719037)
   - [Android Adaptive Icon Template](https://www.figma.com/community/file/782988278697617338)

2. **Design Your Icon**:
   - Create artboard 1024x1024px
   - Design within safe zone
   - Export as PNG 2x

3. **Export Settings**:
   ```
   Format: PNG
   Scale: 2x or 3x
   Color Profile: sRGB
   ```

### Method 2: Using Expo Icon Generator

```bash
# Install globally
npm install -g @expo/image-utils

# Generate all sizes from single 1024x1024 icon
npx expo-icon-generator --icon ./path/to/icon-1024.png --output ./assets

# This creates:
# - icon.png
# - adaptive-icon.png
# - favicon.png
```

### Method 3: Manual Creation with Photoshop/Sketch

1. Create 1024x1024px canvas
2. Design icon with safe zones
3. Export as PNG:
   - **iOS**: `icon.png` (1024x1024, no transparency)
   - **Android**: `adaptive-icon.png` (1024x1024, with transparency)

## 📱 Asset Files

### Required Files Structure

```
mobile/assets/
├── icon.png                    # iOS app icon (1024x1024)
├── adaptive-icon.png           # Android adaptive icon (1024x1024)
├── splash-icon.png             # Splash screen logo (1284x2778)
├── favicon.png                 # Web favicon (48x48)
├── notification-icon.png       # Android notification icon (96x96)
└── store/                      # App store assets
    ├── ios-screenshots/        # iOS screenshots
    ├── android-screenshots/    # Android screenshots
    └── promotional/            # Promotional images
```

## 🚀 Implementation

### 1. Add Icons to Project

Place all required files in `mobile/assets/`:

```bash
cp icon-1024.png mobile/assets/icon.png
cp adaptive-icon-1024.png mobile/assets/adaptive-icon.png
cp splash-logo.png mobile/assets/splash-icon.png
```

### 2. Configure app.json

Already configured in `app.config.js`:

```javascript
{
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    icon: './assets/icon.png',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },
}
```

### 3. Test Icons

```bash
# Start development server
npx expo start

# Build and test on device
eas build --platform ios --profile development
eas build --platform android --profile development
```

## 🎯 Platform-Specific Guidelines

### iOS Icons

#### Safe Zones
- **Icon**: Full 1024x1024px (Apple applies mask)
- **Corner Radius**: Automatically applied (22.37% of size)
- **Shadow**: Automatically applied by iOS

#### Testing Checklist
- [ ] Icon looks good on Home Screen
- [ ] Icon looks good in Settings
- [ ] Icon looks good in Spotlight Search
- [ ] Icon looks good on Apple Watch (if applicable)
- [ ] No transparency issues
- [ ] Meets Apple Human Interface Guidelines

### Android Icons

#### Adaptive Icon Layers
- **Foreground**: Main icon (safe zone: 66%)
- **Background**: Solid color or simple pattern
- **Mask**: Applied by Android (circle, square, squircle, etc.)

#### Safe Zone Calculation
```
Total Size: 1024x1024px
Safe Zone: 66% = 675x675px
Center Point: 512, 512
Top-Left: 174, 174
Bottom-Right: 850, 850
```

#### Testing Checklist
- [ ] Icon looks good with circular mask
- [ ] Icon looks good with square mask
- [ ] Icon looks good with squircle mask
- [ ] No important elements in unsafe zone
- [ ] Background color complements foreground
- [ ] Meets Material Design guidelines

## 🖼️ Splash Screen Optimization

### Configuration

```javascript
// app.config.js
splash: {
  image: './assets/splash-icon.png',
  resizeMode: 'contain',  // or 'cover'
  backgroundColor: '#ffffff',
}
```

### Resize Modes

#### `contain` (Recommended for Logo)
- Scales image to fit screen
- Maintains aspect ratio
- Shows background color around image
- **Use for**: Logo-based splash screens

#### `cover` (For Full-Screen Images)
- Scales image to fill screen
- Maintains aspect ratio
- Crops if necessary
- **Use for**: Full-screen splash designs

### Design Tips

1. **Keep it Simple**: Single logo, solid background
2. **Fast Loading**: Optimize PNG file size (<500KB)
3. **Centered**: Logo should be vertically and horizontally centered
4. **Safe Area**: Keep important content in center 60%
5. **Duration**: Splash shows briefly, don't overdesign

## 🔧 Optimization Tools

### Image Optimization

#### TinyPNG (Online)
```bash
# Compress PNG files
https://tinypng.com/

# Reduces file size by 50-70% without quality loss
```

#### ImageMagick (Command Line)
```bash
# Install ImageMagick
brew install imagemagick  # macOS
apt-get install imagemagick  # Linux

# Optimize PNG
convert icon.png -strip -interlace Plane -quality 85 icon-optimized.png

# Resize image
convert original.png -resize 1024x1024 icon.png
```

#### sharp (Node.js)
```bash
npm install sharp

# Create resize script
node scripts/resize-icons.js
```

```javascript
// scripts/resize-icons.js
const sharp = require('sharp');

sharp('original.png')
  .resize(1024, 1024)
  .png({ quality: 90, compressionLevel: 9 })
  .toFile('icon.png');
```

## 📸 App Store Screenshots

### iOS Screenshots Required Sizes

- **6.7"** (iPhone 14 Pro Max): 1290x2796px
- **6.5"** (iPhone 11 Pro Max): 1242x2688px
- **5.5"** (iPhone 8 Plus): 1242x2208px
- **12.9" iPad Pro**: 2048x2732px

### Android Screenshots Required Sizes

- **Phone**: 1080x1920px (minimum)
- **Tablet**: 1920x1200px (minimum)
- **Feature Graphic**: 1024x500px

### Screenshot Guidelines

1. **Clean UI**: Hide development tools, debug overlays
2. **Real Content**: Use realistic data, not "Lorem ipsum"
3. **Highlight Features**: Show key functionality
4. **Consistent**: Use same device frame for all screenshots
5. **Captions**: Consider adding text overlays explaining features

### Tools for Screenshots

- **Expo Screenshot**: Built into Expo Dev Tools
- **Figma Mockups**: Use device frames
- **Shotsnapp**: Online tool for device frames
- **Apple Devices**: Use Simulator → File → Save Screen

## ✅ Final Checklist

### Before Submission

- [ ] App icon renders correctly on all platforms
- [ ] Adaptive icon safe zone respected (Android)
- [ ] Splash screen displays properly
- [ ] All assets optimized (<500KB each)
- [ ] Icons look good in dark mode
- [ ] No copyright violations in assets
- [ ] Assets match branding guidelines
- [ ] Tested on multiple device sizes
- [ ] Screenshots prepared (5 for iOS, 2-8 for Android)
- [ ] Store listings have icons and graphics

### Testing Commands

```bash
# Preview app icon
npx expo start

# Build preview (no submission)
eas build --platform all --profile preview

# Test on TestFlight/Play Console
eas submit --platform ios
eas submit --platform android
```

## 🆘 Troubleshooting

### Icon Not Showing

1. **Clear cache**:
   ```bash
   npx expo start -c
   ```

2. **Verify file paths** in `app.json`

3. **Check file sizes**: Must be exactly 1024x1024px

4. **Rebuild**:
   ```bash
   eas build --platform all --profile development
   ```

### Splash Screen Issues

1. **Image too small**: Use minimum 1284x2778px
2. **Wrong resize mode**: Try switching between `contain` and `cover`
3. **Background color**: Ensure hex color is valid
4. **File size**: Compress if >1MB

### Color Issues

- **iOS**: Ensure sRGB color profile
- **Android**: Test with different launcher themes
- **Dark Mode**: Consider dark mode variants

## 📚 Resources

### Design Inspiration
- [iOS App Icons Gallery](https://appicon.gallery/)
- [Material Design Icons](https://material.io/design/iconography)
- [Dribbble - App Icons](https://dribbble.com/tags/app-icon)

### Platform Guidelines
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Material Design - Product Icons](https://material.io/design/iconography/product-icons.html)
- [Expo Icons Documentation](https://docs.expo.dev/guides/app-icons/)

### Tools
- [Figma](https://www.figma.com/) - Design tool
- [Sketch](https://www.sketch.com/) - Design tool
- [MakeAppIcon](https://makeappicon.com/) - Online generator
- [AppIcon.co](https://appicon.co/) - Icon generator

---

**Last Updated:** 2025-09-30
**Version:** 1.0.0