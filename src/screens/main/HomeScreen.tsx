import React from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import ItemCard from "../../components/ItemCard";
import ScreenContainer from "../../components/ScreenContainer";
import { colors } from "../../constants/colors";
import { radii, spacing } from "../../constants/spacing";
import { foundItems, lostItems } from "../../data/mockItems";
import { Item } from "../../types/item";
import type { MainStackParamList } from "../../navigation/MainNavigator";

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();

  const openDetails = (item: Item) => {
    navigation.navigate("Details", { item });
  };

  return (
    <ScreenContainer style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.subtitle}>Welcome back. Track what matters today.</Text>
        </View>
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.8}>
          <Ionicons name="notifications" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Stay proactive</Text>
        <Text style={styles.bannerText}>
          Enable alerts to get notified as soon as a match appears.
        </Text>
        <TouchableOpacity style={styles.bannerButton} activeOpacity={0.85}>
          <Text style={styles.bannerButtonText}>Turn on alerts</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your lost items</Text>
        <Text style={styles.sectionLink}>View all</Text>
      </View>
      <FlatList
        data={lostItems}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={({ item }) => (
          <ItemCard
            title={item.title}
            imageUri={item.imageUri}
            status={item.status}
            onPress={() => openDetails(item)}
          />
        )}
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Your found items</Text>
        <Text style={styles.sectionLink}>View all</Text>
      </View>
      <FlatList
        data={foundItems}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        renderItem={({ item }) => (
          <ItemCard
            title={item.title}
            imageUri={item.imageUri}
            status={item.status}
            onPress={() => openDetails(item)}
          />
        )}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.huge,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  banner: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.surface,
    marginBottom: 6,
  },
  bannerText: {
    fontSize: 14,
    color: colors.primarySoft,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bannerButton: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  bannerButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primaryDark,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  sectionLink: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  listContent: {
    paddingBottom: spacing.sm,
  },
  listSeparator: {
    width: spacing.md,
  },
});

const ItemSeparator = () => <View style={styles.listSeparator} />;

export default HomeScreen;
