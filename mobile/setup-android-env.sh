#!/bin/bash

# Android Studio Environment Setup Script
# Run this after installing Android Studio

echo "🔧 Setting up Android environment variables..."

# Android Studio paths (common locations on macOS)
ANDROID_STUDIO_APP="/Applications/Android Studio.app"
ANDROID_SDK_ROOT="$HOME/Library/Android/sdk"

# Check if Android Studio is installed
if [ ! -d "$ANDROID_STUDIO_APP" ]; then
    echo "❌ Android Studio not found at: $ANDROID_STUDIO_APP"
    echo "Please install Android Studio first"
    exit 1
fi

# Check if Android SDK is installed
if [ ! -d "$ANDROID_SDK_ROOT" ]; then
    echo "❌ Android SDK not found at: $ANDROID_SDK_ROOT"
    echo "Please run Android Studio setup wizard first to install SDK"
    exit 1
fi

# Export variables for current session
export ANDROID_HOME="$ANDROID_SDK_ROOT"
export ANDROID_SDK_ROOT="$ANDROID_SDK_ROOT"
export PATH="$PATH:$ANDROID_HOME/emulator"
export PATH="$PATH:$ANDROID_HOME/platform-tools"
export PATH="$PATH:$ANDROID_HOME/cmdline-tools/latest/bin"
export PATH="$PATH:$ANDROID_HOME/tools/bin"

# Add to shell profile (zsh for modern macOS)
SHELL_PROFILE="$HOME/.zshrc"

echo ""
echo "Adding environment variables to $SHELL_PROFILE..."

# Check if already added
if grep -q "ANDROID_HOME" "$SHELL_PROFILE" 2>/dev/null; then
    echo "⚠️  Android environment variables already in $SHELL_PROFILE"
    echo "Skipping..."
else
    echo "" >> "$SHELL_PROFILE"
    echo "# Android Studio Environment Variables" >> "$SHELL_PROFILE"
    echo "export ANDROID_HOME=\"\$HOME/Library/Android/sdk\"" >> "$SHELL_PROFILE"
    echo "export ANDROID_SDK_ROOT=\"\$HOME/Library/Android/sdk\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/emulator\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/platform-tools\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin\"" >> "$SHELL_PROFILE"
    echo "export PATH=\"\$PATH:\$ANDROID_HOME/tools/bin\"" >> "$SHELL_PROFILE"
    echo "✅ Added to $SHELL_PROFILE"
fi

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "Current values:"
echo "  ANDROID_HOME: $ANDROID_HOME"
echo "  ANDROID_SDK_ROOT: $ANDROID_SDK_ROOT"
echo ""
echo "⚠️  Important: Run 'source ~/.zshrc' or restart your terminal to apply changes"
echo ""
echo "Next steps:"
echo "1. Open Android Studio"
echo "2. Complete the setup wizard"
echo "3. Install Android SDK and create a virtual device (AVD)"
echo "4. Run: npx expo run:android"
