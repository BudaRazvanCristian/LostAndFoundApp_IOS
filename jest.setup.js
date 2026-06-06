jest.mock("@expo/vector-icons", () => {
  const React = require("react");

  const MockIcon = ({ children }) => React.createElement("span", null, children);

  return {
    Ionicons: MockIcon,
  };
});

