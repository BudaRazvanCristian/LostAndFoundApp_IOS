import React from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

import { colors } from "../constants/colors";
import { shadows, radii } from "../constants/spacing";

export type AppButtonVariant = "primary" | "secondary" | "danger" | "outline";

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: AppButtonVariant;
  size?: "small" | "medium" | "large";
}

const AppButton: React.FC<AppButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled,
  style,
  ...rest
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        stylesByVariant[variant],
        disabled && styles.disabled,
        style,
      ]}
      activeOpacity={disabled ? 1 : 0.85}
      onPress={onPress}
      disabled={disabled}
      {...rest}
    >
      <Text style={[styles.text, textSizeStyles[size], textStylesByVariant[variant], disabled && styles.textDisabled]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.md,
  },
  text: {
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: colors.disabled,
  },
});

const sizeStyles = StyleSheet.create({
  small: {
    height: 40,
    paddingHorizontal: 12,
  },
  medium: {
    height: 48,
    paddingHorizontal: 16,
  },
  large: {
    height: 56,
    paddingHorizontal: 20,
  },
});

const textSizeStyles = StyleSheet.create({
  small: {
    fontSize: 14,
  },
  medium: {
    fontSize: 16,
  },
  large: {
    fontSize: 18,
  },
});

const stylesByVariant = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  danger: {
    backgroundColor: colors.danger,
  },
});

const textStylesByVariant = StyleSheet.create({
  primary: {
    color: colors.textInverse,
  },
  secondary: {
    color: colors.text,
  },
  outline: {
    color: colors.primary,
  },
  danger: {
    color: colors.textInverse,
  },
});

export default AppButton;

