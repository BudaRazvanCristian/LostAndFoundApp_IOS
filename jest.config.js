module.exports = {
  preset: '@react-native/jest-preset',
  modulePathIgnorePatterns: [
    '<rootDir>/LostAndFound/',
    '<rootDir>/backend/',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/LostAndFound/',
    '<rootDir>/backend/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|expo(?:-.*)?|@expo)/)',
  ],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
};
