# Generate Independent Lockfile for Monorepo Apps

This guide explains how to generate independent `package-lock.json` files for apps in a monorepo (admin-web, seller-panel) to deploy them independently on platforms like Vercel.

## Why Do We Need This?

In npm workspaces (monorepo), the lockfile is stored only at the root. When deploying a single app (e.g., `admin-web`) to Vercel, we need its own lockfile for deterministic builds.

## Step-by-Step Process

### 0. Create .npmrc file (Required for Vercel)

First, create a `.npmrc` file in your app directory to handle peer dependencies:

```bash
# In admin-web/ or seller-panel/
echo "legacy-peer-deps=true" > .npmrc
```

This file tells npm to ignore peer dependency conflicts without needing the `--legacy-peer-deps` flag.

**Important:** Vercel doesn't support `npm ci --legacy-peer-deps`, so we use `.npmrc` instead.

### 1. Generate Lockfile in Temporary Directory

```bash
# Replace 'admin-web' with your app name (e.g., 'seller-panel')
cd /tmp
mkdir -p admin-web-lockfile
cd admin-web-lockfile

# Copy package.json and .npmrc from your app
cp /Users/rhonalf.martinez/projects/gshop/admin-web/package.json .
cp /Users/rhonalf.martinez/projects/gshop/admin-web/.npmrc .

# Generate lockfile only (without installing node_modules)
npm install --package-lock-only
```

### 2. Copy Lockfile Back to App

```bash
# Copy generated lockfile to your app directory
cp /tmp/admin-web-lockfile/package-lock.json /Users/rhonalf.martinez/projects/gshop/admin-web/

# Clean up temp directory
rm -rf /tmp/admin-web-lockfile
```

### 3. Verify Lockfile Works

```bash
cd /Users/rhonalf.martinez/projects/gshop/admin-web

# Test clean install with lockfile (.npmrc will be used automatically)
rm -rf node_modules
npm ci
```

### 4. Update .gitignore

Make sure your app's lockfile is **NOT** ignored:

```bash
# In root .gitignore, allow specific lockfiles
!admin-web/package-lock.json
!seller-panel/package-lock.json
```

## Quick Script for seller-panel

```bash
# First, create .npmrc in seller-panel
echo "legacy-peer-deps=true" > /Users/rhonalf.martinez/projects/gshop/seller-panel/.npmrc

# Then generate lockfile
cd /tmp && \
mkdir -p seller-panel-lockfile && \
cd seller-panel-lockfile && \
cp /Users/rhonalf.martinez/projects/gshop/seller-panel/package.json . && \
cp /Users/rhonalf.martinez/projects/gshop/seller-panel/.npmrc . && \
npm install --package-lock-only && \
cp package-lock.json /Users/rhonalf.martinez/projects/gshop/seller-panel/ && \
cd .. && rm -rf seller-panel-lockfile && \
echo "✅ Lockfile generated for seller-panel!"
```

## Vercel Deployment Configuration

### Build Settings

- **Root Directory**: `admin-web` (or `seller-panel`)
- **Build Command**: `npm run build`
- **Install Command**: `npm ci` (the `.npmrc` file will handle legacy-peer-deps)
- **Output Directory**: `.next`

**Important Files to Commit:**
- `package.json` - App dependencies
- `package-lock.json` - Locked versions
- `.npmrc` - npm configuration for Vercel

### Optional: .vercelignore

If Vercel doesn't detect the lockfile correctly, create `.vercelignore` at monorepo root:

```
*
!admin-web
```

## Troubleshooting

### Lockfile not generated?

- Make sure you're using `--package-lock-only` flag
- Verify you're NOT inside a workspace directory when running npm install
- Use a temporary directory outside the monorepo

### "Cannot find module" errors?

- Make sure `.npmrc` exists in your app directory
- Run `npm ci` instead of `npm install` (`.npmrc` will be used automatically)
- Check that all dependencies in `package.json` have exact versions
- Verify React version matches the monorepo override (check root `package.json`)

### Vercel build fails with "npm ci exited with 1"?

- ✅ Create `.npmrc` file with `legacy-peer-deps=true`
- ✅ Use `npm ci` (NOT `npm ci --legacy-peer-deps`) in Vercel settings
- ✅ Verify all three files exist and are committed:
  - `admin-web/package.json`
  - `admin-web/package-lock.json`
  - `admin-web/.npmrc`
- Ensure lockfile is NOT ignored by git

### React version mismatch?

- Check root `package.json` for `overrides` section
- Update your app's React version to match the override
- Regenerate lockfile after version update

## Updating Lockfile

When you update dependencies in your app:

```bash
# 1. Update package.json with new versions
# 2. Regenerate lockfile using the script above
# 3. Test locally with npm ci
# 4. Commit package.json, package-lock.json, and .npmrc
```

## Why legacy-peer-deps?

Some dependencies in this project have peer dependency conflicts. The `.npmrc` file with `legacy-peer-deps=true` tells npm to use the npm v6 behavior (ignore peer deps) to avoid installation errors.

**Why use `.npmrc` instead of `--legacy-peer-deps` flag?**
- Vercel and other CI/CD platforms may not support command-line flags
- `.npmrc` is automatically read by npm in any environment
- More portable and easier to maintain across different deployment platforms
