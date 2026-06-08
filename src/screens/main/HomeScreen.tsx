import React, { useCallback } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import ItemCard from "../../components/ItemCard";
import ScreenContainer from "../../components/ScreenContainer";
import { colors } from "../../constants/colors";
import { useItems } from "../../context/ItemsContext";
import { radii, spacing, shadows } from "../../constants/spacing";
import { Item } from "../../types/item";
import type { MainStackParamList } from "../../navigation/MainNavigator";

const HomeScreen: React.FC = () => {
  const { lostItems, foundItems, refreshItems } = useItems();
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  useFocusEffect(
    useCallback(() => {
      refreshItems().catch(() => undefined);
    }, [refreshItems]),
  );

  const openDetails = (item: Item) => {
    navigation.navigate("Details", { item });
  };

  const handleViewAllLost = () => {
    navigation.navigate("AllLostItems", { layout: "vertical" });
  };

  const handleViewAllFound = () => {
    navigation.navigate("AllFoundItems", { layout: "vertical" });
  };

  return (
    <ScreenContainer style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.title}>Lost & Found</Text>
          </View>
          <TouchableOpacity
            style={[styles.iconButton, shadows.sm]}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Banner */}
        <View style={[styles.banner, shadows.md]}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIcon}>
              <Ionicons name="alert-circle" size={24} color={colors.primary} />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>Stay Alert</Text>
              <Text style={styles.bannerDescription}>
                Enable notifications to get instant updates on matches
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bannerCTA} activeOpacity={0.8}>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Your Lost Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Lost Items</Text>
            <TouchableOpacity onPress={handleViewAllLost} activeOpacity={0.6}>
              <Text style={styles.seeAllButton}>See all →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={lostItems}
            keyExtractor={(item) => item.id}
            horizontal
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemList}
            ItemSeparatorComponent={ItemSeparator}
            nestedScrollEnabled={true}
            renderItem={({ item }) => (
              <ItemCard
                title={item.title}
                imageUri={item.imageUri}
                status={item.status}
                onPress={() => openDetails(item)}
              />
            )}
          />
        </View>

        {/* Your Found Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Found Items</Text>
            <TouchableOpacity onPress={handleViewAllFound} activeOpacity={0.6}>
              <Text style={styles.seeAllButton}>See all →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={foundItems}
            keyExtractor={(item) => item.id}
            horizontal
            scrollEnabled={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.itemList}
            ItemSeparatorComponent={ItemSeparator}
            nestedScrollEnabled={true}
            renderItem={({ item }) => (
              <ItemCard
                title={item.title}
                imageUri={item.imageUri}
                status={item.status}
                onPress={() => openDetails(item)}
              />
            )}
          />
        </View>

        {/* Footer Spacing */}
        <View style={{ height: spacing.huge }} />
      </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: spacing.huge,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  banner: {
    marginHorizontal: spacing.xxxl,
    marginBottom: spacing.xxl,
    backgroundColor: colors.primarySoft,
    borderRadius: radii.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bannerContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  bannerIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.1,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  bannerDescription: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  bannerCTA: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    marginLeft: spacing.md,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  seeAllButton: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  itemList: {
    gap: spacing.md,
    paddingHorizontal: spacing.xxxl,
    paddingRight: spacing.xxxl,
  },
  listSeparator: {
    width: spacing.md,
  },
});

const ItemSeparator = () => <View style={styles.listSeparator} />;

export default HomeScreen;
