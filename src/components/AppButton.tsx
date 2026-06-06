import React from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

import { colors } from "../constants/colors";

export type AppButtonVariant = "primary" | "secondary" | "danger";

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: AppButtonVariant;
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled,
  style,
  ...rest
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        stylesByVariant[variant],
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      {...rest}
    >
      <Text style={[styles.text, textStylesByVariant[variant], disabled && styles.textDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.6,
  },
  textDisabled: {
    color: colors.mutedText,
  },
});

const stylesByVariant = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  danger: {
    backgroundColor: colors.danger,
  },
});

const textStylesByVariant = StyleSheet.create({
  primary: {
    color: colors.card,
  },
  secondary: {
    color: colors.text,
  },
  danger: {
    color: colors.card,
  },
});

export default AppButton;

