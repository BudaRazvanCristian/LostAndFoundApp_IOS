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

jest.mock("expo-device", () => ({
  __esModule: true,
  isDevice: true,
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: "test-project-id" } } },
    easConfig: { projectId: "test-project-id" },
  },
}));

jest.mock("expo-notifications", () => ({
  __esModule: true,
  AndroidImportance: { MAX: 5 },
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "ExponentPushToken[test-token]" })),
}));

jest.mock("react-native-screens", () => ({
  enableScreens: jest.fn(),
}));

jest.mock("react-native-maps", () => {
  const React = require("react");
  const { View } = require("react-native");

  const MockMap = ({ children, ...props }) => React.createElement(View, props, children);
  const MockMarker = (props) => React.createElement(View, props);

  return {
    __esModule: true,
    default: MockMap,
    Marker: MockMarker,
  };
});

global.fetch = jest.fn(async () => ({
  ok: true,
  json: async () => ({ posts: [], conversations: [], messages: [] }),
}));
