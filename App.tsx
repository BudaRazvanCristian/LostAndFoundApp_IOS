import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

import { colors } from "./src/constants/colors";
import AuthNavigator from "./src/navigation/AuthNavigator";

const App: React.FC = () => {
  enableScreens();

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AuthNavigator />
    </SafeAreaProvider>
  );
};

export default App;
