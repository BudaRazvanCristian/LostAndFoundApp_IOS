module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo(?:-.*)?|@expo)/)',
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
