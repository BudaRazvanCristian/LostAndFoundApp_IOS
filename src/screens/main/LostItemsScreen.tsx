import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import ItemCard from "../../components/ItemCard";
import { colors } from "../../constants/colors";
import { lostItems } from "../../data/mockItems";
import { Item } from "../../types/item";
import type { MainStackParamList } from "../../navigation/MainNavigator";

const LostItemsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const route = useRoute();

  // Determine layout based on route params or default to horizontal
  const layout = (route.params as any)?.layout || "horizontal";

  const openDetails = (item: Item) => {
    navigation.navigate("Details", { item });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <View style={styles.container}>
        {layout === "vertical" && (
          <View style={styles.header}>
            <Text style={styles.badge}>Browse</Text>
            <Text style={styles.title}>Lost Items</Text>
            <Text style={styles.subtitle}>
              Explore items reported as lost and help reconnect them.
            </Text>
          </View>
        )}

        <View style={layout === "vertical" ? styles.card : styles.cardHorizontal}>
          {layout === "horizontal" && (
            <>
              <Text style={styles.sectionTitle}>Recent Reports</Text>
              <Text style={styles.sectionText}>
                Browse mock reports below and open any item for details.
              </Text>
              <View style={styles.divider} />
            </>
          )}

          <FlatList
            data={lostItems}
            keyExtractor={(item) => item.id}
            horizontal={layout === "horizontal"}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={layout === "horizontal" ? styles.listContent : styles.listContentVertical}
            numColumns={layout === "vertical" ? 1 : undefined}
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
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primary,
    opacity: 0.12,
  },
  backgroundBottom: {
    position: "absolute",
    bottom: -140,
    left: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.primary,
    opacity: 0.1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
  },
  header: {
    marginBottom: 28,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.backgroundAlt,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  cardHorizontal: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  listContent: {
    paddingBottom: 4,
  },
  listContentVertical: {
    paddingBottom: 20,
    gap: 12,
  },
  listSeparator: {
    width: 12,
  },
});

const ItemSeparator = () => <View style={styles.listSeparator} />;

export default LostItemsScreen;

