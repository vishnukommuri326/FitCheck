jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  requireNativeViewManager: jest.fn(),
}));

jest.mock('expo-font', () => ({
  useFonts: jest.fn(() => [true, null]),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: '',
}));

jest.mock('react-native-gesture-handler', () => ({
  Swipeable: 'Swipeable',
}));