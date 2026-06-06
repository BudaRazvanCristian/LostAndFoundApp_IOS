import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../constants/colors";
import { radii, shadows, spacing } from "../constants/spacing";

export interface ItemCardProps {
  title: string;
  imageUri: string;
  status?: string;
  onPress?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ title, imageUri, status, onPress }) => {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <Image source={{ uri: imageUri }} style={styles.image} />
      <View style={styles.content}>
        {status ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{status}</Text>
          </View>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 168,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: "hidden",
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  image: {
    width: "100%",
    height: 110,
  },
  content: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    lineHeight: 20,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primaryDark,
  },
});

export default ItemCard;

