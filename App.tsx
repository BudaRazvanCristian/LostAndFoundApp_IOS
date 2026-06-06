import React from "react";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

import { colors } from "./src/constants/colors";
import { ItemsProvider } from "./src/context/ItemsContext";
import RootNavigator from "./src/navigation/RootNavigator";

const App: React.FC = () => {
  enableScreens();

  return (
    <SafeAreaProvider>
      <ItemsProvider>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <RootNavigator />
      </ItemsProvider>
    </SafeAreaProvider>
  );
};

export default App;
