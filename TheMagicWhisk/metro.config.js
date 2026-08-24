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

// Extended asset and source extensions for comprehensive web support
const webAssetExts = [
  'ttf',
  'otf',
  'woff',
  'woff2',
  'eot',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'webp',
  'psd',
  'svg',
  'json',
];

config.resolver = {
  ...config.resolver,
  assetExts: webAssetExts.filter(ext => !config.resolver.sourceExts.includes(ext)),
  sourceExts: ['ts', 'tsx', 'js', 'jsx', 'json', 'mjs', 'cjs'],
  // Prioritize metro over react-native for web-specific modules
  platform: 'web',
};

// For web, ensure fonts in node_modules/@expo/vector-icons are properly handled
const originalResolverConfig = config.resolver;
config.resolver = {
  ...originalResolverConfig,
  extraNodeModules: {
    '@expo/vector-icons': path.resolve(__dirname, 'node_modules/@expo/vector-icons'),
  },
};

module.exports = config;
