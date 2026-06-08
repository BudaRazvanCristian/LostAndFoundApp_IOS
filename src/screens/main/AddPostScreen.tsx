import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import AppButton from "../../components/AppButton";
import { colors } from "../../constants/colors";
import { radii, shadows, spacing } from "../../constants/spacing";
import { useItems } from "../../context/ItemsContext";
import { useAuth } from "../../context/AuthContext";
import type { MainStackParamList } from "../../navigation/MainNavigator";
import { ItemStatus } from "../../types/item";

const statusOptions: ItemStatus[] = ["Lost", "Found"];

const AddPostScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const { addItem } = useItems();
  const { user, isAuthenticated } = useAuth();

  const [status, setStatus] = useState<ItemStatus>("Lost");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () =>
      Boolean(
        title.trim() && category.trim() && location.trim() && date.trim() && description.trim() && ownerName.trim() && phoneNumber.trim() && imageUri,
      ),
    [category, date, description, imageUri, location, ownerName, phoneNumber, title],
  );

  const requestCameraPermission = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera access is required to take a photo.");
      return false;
    }

    return true;
  };

  const requestLibraryPermission = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission needed", "Gallery access is required to choose a photo.");
      return false;
    }

    return true;
  };

  const pickFromLibrary = async () => {
    const allowed = await requestLibraryPermission();
    if (!allowed) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const allowed = await requestCameraPermission();
    if (!allowed) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const submitPost = async () => {
    if (!isAuthenticated) {
      Alert.alert("Not authenticated", "You must log in to create a post.");
      return;
    }

    if (!canSubmit || !imageUri) {
      Alert.alert("Complete the form", "Please add an image and fill in all details.");
      return;
    }

    setIsSubmitting(true);

    try {
      const postId = await addItem({
        title: title.trim(),
        imageUri,
        status,
        category: category.trim(),
        location: location.trim(),
        date: date.trim(),
        description: description.trim(),
        ownerName: ownerName.trim(),
        phoneNumber: phoneNumber.trim(),
      });

      Alert.alert("Post created", "Your item was added successfully.", [
        { text: "OK" },
      ]);

      // Reset form
      setTitle("");
      setCategory("");
      setLocation("");
      setDate("");
      setDescription("");
      setOwnerName(user?.displayName || "");
      setPhoneNumber(user?.phone || "");
      setImageUri(null);
      setStatus("Lost");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      Alert.alert("Error creating post", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.badge}>Create</Text>
            <Text style={styles.title}>Add Post</Text>
            <Text style={styles.subtitle}>
              Create a clean post with your own photo, then it will instantly show in Home.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Item photo</Text>
            <Text style={styles.sectionText}>
              Choose a photo from your device or take a new one with the camera.
            </Text>

            <View style={styles.photoBox}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderTitle}>No photo selected</Text>
                  <Text style={styles.photoPlaceholderText}>
                    Add a clear image so the item looks professional and easy to identify.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.photoActions}>
              <AppButton title="Choose from device" onPress={pickFromLibrary} style={styles.photoButton} />
              <AppButton title="Take a photo" onPress={takePhoto} variant="secondary" style={styles.photoButton} />
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Post type</Text>
            <View style={styles.segmentedControl}>
              {statusOptions.map((option) => {
                const selected = option === status;

                return (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.85}
                    onPress={() => setStatus(option)}
                    style={[styles.segmentButton, selected && styles.segmentButtonActive]}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput style={styles.input} placeholder="e.g. Black leather wallet" placeholderTextColor={colors.textSubtle} value={title} onChangeText={setTitle} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} placeholder="Accessories, Electronics, Bags..." placeholderTextColor={colors.textSubtle} value={category} onChangeText={setCategory} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Location</Text>
              <TextInput style={styles.input} placeholder="Where was it lost or found?" placeholderTextColor={colors.textSubtle} value={location} onChangeText={setLocation} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Date</Text>
              <TextInput style={styles.input} placeholder="May 24, 2026" placeholderTextColor={colors.textSubtle} value={date} onChangeText={setDate} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Owner / user name</Text>
              <TextInput style={styles.input} placeholder="Your name" placeholderTextColor={colors.textSubtle} value={ownerName} onChangeText={setOwnerName} />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. +40 712 345 678"
                placeholderTextColor={colors.textSubtle}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add all details that help identify the item..."
                placeholderTextColor={colors.textSubtle}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.switchRow}>
              <View style={styles.switchTextWrap}>
                <Text style={styles.sectionTitle}>Visible now</Text>
                <Text style={styles.sectionText}>Keep the post public as soon as you create it.</Text>
              </View>
              <Switch
                value
                onValueChange={() => undefined}
                trackColor={{ false: colors.border, true: colors.primarySoft }}
                thumbColor={colors.primary}
              />
            </View>

            <View style={styles.submitWrap}>
              <AppButton
                title={isSubmitting ? "Saving..." : "Create post"}
                onPress={submitPost}
                disabled={!canSubmit || isSubmitting}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.huge,
  },
  header: {
    marginBottom: spacing.xl,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.card,
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 12,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: spacing.lg,
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
  photoBox: {
    marginTop: spacing.md,
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  previewImage: {
    width: "100%",
    height: 210,
  },
  photoPlaceholder: {
    minHeight: 210,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  photoPlaceholderText: {
    textAlign: "center",
    color: colors.textMuted,
    lineHeight: 20,
  },
  photoActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  photoButton: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: colors.background,
    padding: 4,
    borderRadius: 999,
    marginBottom: spacing.lg,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
  },
  segmentTextActive: {
    color: colors.text,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  switchTextWrap: {
    flex: 1,
  },
  submitWrap: {
    marginTop: spacing.xs,
  },
});

export default AddPostScreen;

