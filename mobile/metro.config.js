const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force axios to use browser version instead of node version
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    // Force axios to use browser-compatible version
    if (moduleName === 'axios') {
      return {
        filePath: require.resolve('axios/dist/browser/axios.cjs'),
        type: 'sourceFile',
      };
    }
    // Fall back to default resolution
    return context.resolveRequest(context, moduleName, platform);
  },
};

// Enable minification in production
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: false,
    mangle: {
      keep_classnames: true,
      keep_fnames: false,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    compress: {
      // Reduce lodash size
      reduce_funcs: false,
    },
  },
};

// Enable tree shaking
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true, // Inline requires for better tree shaking
  },
});

module.exports = config;