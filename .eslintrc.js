module.exports = {
  root: true,
  extends: '@react-native',
  ignorePatterns: ['backend/dist/**'],
  overrides: [
    {
      files: ['jest.setup.js'],
      env: {
        jest: true,
      },
    },
  ],
};
