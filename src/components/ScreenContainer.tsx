import React from "react";
import {
  SafeAreaView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

import { colors } from "../constants/colors";

export interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const ScreenContainer: React.FC<ScreenContainerProps> = ({ children, style }) => {
  return <SafeAreaView style={[styles.safeArea, style]}>{children}</SafeAreaView>;
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
});

export default ScreenContainer;

