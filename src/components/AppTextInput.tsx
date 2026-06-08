import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  Text,
} from "react-native";

import { colors } from "../constants/colors";
import { radii, shadows, spacing } from "../constants/spacing";

export interface AppTextInputProps extends TextInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: React.ReactNode;
  error?: string;
}

const AppTextInput: React.FC<AppTextInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  icon,
  error,
  style,
  onFocus,
  onBlur,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View>
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        error && styles.containerError,
      ]}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <TextInput
          style={[
            styles.input,
            icon ? styles.inputWithIcon : null,
            style
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
      </View>
      {error && <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  containerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    shadowColor: "rgba(17, 24, 39, 0.06)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerError: {
    borderColor: colors.danger,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    height: 52,
    color: colors.text,
    fontSize: 16,
    paddingVertical: spacing.md,
  },
  inputWithIcon: {
    marginLeft: 0,
  },
  errorContainer: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "500",
  },
});

export default AppTextInput;

