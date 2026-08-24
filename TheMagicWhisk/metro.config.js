const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Ensure proper handling of font files for web
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-web/dist/cjs/vendor/babel7-transformer'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Ensure all asset types are properly resolved
config.resolver = {
  ...config.resolver,
  assetExts: [
    ...config.resolver.assetExts.filter(ext => ext !== 'svg'),
    'ttf',
    'otf',
    'woff',
    'woff2',
  ],
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs', 'cjs'],
};

module.exports = config;
