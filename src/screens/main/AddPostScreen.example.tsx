import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

import AppButton from "../../components/AppButton";
import AppTextInput from "../../components/AppTextInput";
import { colors } from "../../constants/colors";
import { radii, spacing } from "../../constants/spacing";
import { useItems } from "../../context/ItemsContext";
import { useAuth } from "../../context/AuthContext";

const AddPostScreen: React.FC = () => {
  const { addItem, isLoading: itemsLoading } = useItems();
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = ["Electronics", "Accessories", "Jewelry", "Bags", "Wearables", "Other"];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!category.trim()) newErrors.category = "Category is required";
    if (!location.trim()) newErrors.location = "Location is required";
    if (!date.trim()) newErrors.date = "Date is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!imageUri) newErrors.imageUri = "Image is required";

    // Validate phone number format
    const phoneRegex = /^\+?[\d\-\s()]{7,}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fill in all required fields correctly");
      return;
    }

    if (!user) {
      Alert.alert("Error", "You must be logged in to add a post");
      return;
    }

    try {
      setIsSubmitting(true);

      // Determine status based on context (for now, we'll ask user or default)
      // In a real app, you'd have a selector for Lost/Found
      const status = "Lost"; // TODO: Add selector in UI

      await addItem({
        title: title.trim(),
        category: category.trim(),
        location: location.trim(),
        date: date.trim(),
        description: description.trim(),
        phoneNumber: phoneNumber.trim(),
        imageUri,
        ownerName: user.displayName || "Anonymous",
        status,
      });

      Alert.alert("Success", "Your post has been created!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form
            setTitle("");
            setCategory("");
            setLocation("");
            setDate("");
            setDescription("");
            setPhoneNumber("");
            setImageUri("");
            setErrors({});
          },
        },
      ]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      Alert.alert("Error creating post", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Create Post</Text>
          <View style={styles.centeredContent}>
            <Ionicons name="lock-closed" size={48} color={colors.primary} />
            <Text style={styles.subtitle}>You must log in to create a post</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Create New Post</Text>

        {/* Image Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Image</Text>
          {imageUri ? (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri("")}
              >
                <Ionicons name="close-circle" size={24} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.imagePickerBox, errors.imageUri && styles.inputError]}
              onPress={pickImage}
            >
              <Ionicons name="image" size={32} color={colors.primary} />
              <Text style={styles.imagePickerText}>Pick an image</Text>
            </TouchableOpacity>
          )}
          {errors.imageUri && <Text style={styles.errorText}>{errors.imageUri}</Text>}
        </View>

        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Title</Text>
          <AppTextInput
            placeholder="e.g., Lost Black Wallet"
            value={title}
            onChangeText={setTitle}
            error={errors.title}
          />
        </View>

        {/* Category */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Category</Text>
          <View style={styles.categoriesContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    category === cat && styles.categoryButtonTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location</Text>
          <AppTextInput
            placeholder="e.g., Central Park"
            value={location}
            onChangeText={setLocation}
            error={errors.location}
          />
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date</Text>
          <AppTextInput
            placeholder="e.g., June 8, 2026"
            value={date}
            onChangeText={setDate}
            error={errors.date}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <AppTextInput
            placeholder="Describe the item in detail..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={styles.descriptionInput}
            error={errors.description}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Phone Number</Text>
          <AppTextInput
            placeholder="+40712345678"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            error={errors.phoneNumber}
          />
        </View>

        {/* Submit Button */}
        <AppButton
          title={isSubmitting ? "Creating..." : "Create Post"}
          onPress={handleSubmit}
          disabled={isSubmitting || itemsLoading}
          style={styles.submitButton}
        />

        <View style={{ height: spacing.huge }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxxl,
    paddingTop: spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xxl,
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textMuted,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  imagePickerBox: {
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundDark,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: radii.lg,
    overflow: "hidden",
    height: 200,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: radii.lg,
  },
  removeImageButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
  },
  imagePickerText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMuted,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  categoryButtonTextActive: {
    color: colors.textInverse,
  },
  descriptionInput: {
    height: 100,
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: "500",
    marginTop: spacing.xs,
  },
  inputError: {
    borderColor: colors.danger,
  },
  submitButton: {
    marginBottom: spacing.lg,
  },
});

export default AddPostScreen;
