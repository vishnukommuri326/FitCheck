module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect', './jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo|@expo|@unimodules|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-web|@react-native-async-storage/async-storage))',
  ],
};