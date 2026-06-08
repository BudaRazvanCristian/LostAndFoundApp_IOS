import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors } from "../constants/colors";
import { radii, shadows, spacing } from "../constants/spacing";

export interface InfoCardProps {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, style }) => {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundDark,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
});

export default InfoCard;

