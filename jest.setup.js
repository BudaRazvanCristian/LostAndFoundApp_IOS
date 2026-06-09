jest.mock("@expo/vector-icons", () => {
  const React = require("react");

  const MockIcon = ({ children }) => React.createElement("span", null, children);

  return {
    Ionicons: MockIcon,
  };
});

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}));

jest.mock("expo-image-picker", () => ({
  __esModule: true,
  MediaTypeOptions: { Images: "Images" },
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: [] })),
}));

jest.mock("react-native-screens", () => ({
  enableScreens: jest.fn(),
}));

global.fetch = jest.fn(async () => ({
  ok: true,
  json: async () => ({ posts: [], conversations: [], messages: [] }),
}));

