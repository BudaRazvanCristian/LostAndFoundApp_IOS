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
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    ...shadows.card,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 6,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
});

export default InfoCard;

