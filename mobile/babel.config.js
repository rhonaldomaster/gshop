module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin (must be last)
      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        plugins: [
          // Remove console logs in production only
          [
            'transform-remove-console',
            {
              exclude: ['error', 'warn'],
            },
          ],
        ],
      },
    },
  };
};