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

import AppButton from "../../components/AppButton";
import { colors } from "../../constants/colors";
import { radii, shadows, spacing } from "../../constants/spacing";
import { useItems } from "../../context/ItemsContext";
import { useAuth } from "../../context/AuthContext";
import { ItemStatus } from "../../types/item";

// Load react-native-maps defensively to avoid startup crash if native setup is incomplete.
let mapsLib: any;
try {
  mapsLib = require("react-native-maps");
} catch {
  mapsLib = null;
}

const MapView = mapsLib?.default;
const Marker = mapsLib?.Marker;

type MapPressEvent = {
  nativeEvent: {
    coordinate: {
      latitude: number;
      longitude: number;
    };
  };
};

const statusOptions: ItemStatus[] = ["Lost", "Found"];

const buildUploadImageUri = (asset: ImagePicker.ImagePickerAsset): string => {
  if (asset.base64) {
    const mimeType = asset.mimeType || "image/jpeg";
    return `data:${mimeType};base64,${asset.base64}`;
  }

  return asset.uri;
};

const AddPostScreen: React.FC = () => {
  const { addItem } = useItems();
  const { user, isAuthenticated } = useAuth();

  const [status, setStatus] = useState<ItemStatus>("Lost");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [ownerName, setOwnerName] = useState(user?.displayName || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploadUri, setImageUploadUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(
    () =>
      Boolean(
        title.trim() &&
          category.trim() &&
          location.trim() &&
          latitude !== null &&
          longitude !== null &&
          date.trim() &&
          description.trim() &&
          ownerName.trim() &&
          phoneNumber.trim() &&
          imageUri &&
          imageUploadUri,
      ),
    [
      category,
      date,
      description,
      imageUri,
      imageUploadUri,
      latitude,
      location,
      longitude,
      ownerName,
      phoneNumber,
      title,
    ],
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
      base64: true,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setImageUri(selectedAsset.uri);
      setImageUploadUri(buildUploadImageUri(selectedAsset));
    }
  };

  const takePhoto = async () => {
    const allowed = await requestCameraPermission();
    if (!allowed) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
      base64: true,
    });

    if (!result.canceled) {
      const selectedAsset = result.assets[0];
      setImageUri(selectedAsset.uri);
      setImageUploadUri(buildUploadImageUri(selectedAsset));
    }
  };

  const handleMapPress = (event: MapPressEvent) => {
    const { latitude: selectedLatitude, longitude: selectedLongitude } = event.nativeEvent.coordinate;
    setLatitude(selectedLatitude);
    setLongitude(selectedLongitude);
  };

  const submitPost = async () => {
    if (!isAuthenticated) {
      Alert.alert("Not authenticated", "You must log in to create a post.");
      return;
    }

    if (!canSubmit || !imageUri || !imageUploadUri || latitude === null || longitude === null) {
      Alert.alert("Complete the form", "Please add image, details and select location on map.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addItem({
        title: title.trim(),
        status,
        category: category.trim(),
        location: location.trim(),
        latitude,
        longitude,
        date: date.trim(),
        description: description.trim(),
        ownerName: ownerName.trim(),
        phoneNumber: phoneNumber.trim(),
        imageUri: imageUploadUri,
      });

      Alert.alert("Post created", "Your item was added successfully.", [
        { text: "OK" },
      ]);

      // Reset form
      setTitle("");
      setCategory("");
      setLocation("");
      setLatitude(null);
      setLongitude(null);
      setDate("");
      setDescription("");
      setOwnerName(user?.displayName || "");
      setPhoneNumber(user?.phone || "");
      setImageUri(null);
      setImageUploadUri(null);
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
              <Text style={styles.label}>Select on map</Text>
              <Text style={styles.sectionText}>Tap on map to pin exact location.</Text>
              {MapView ? (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: latitude ?? 44.4268,
                      longitude: longitude ?? 26.1025,
                      latitudeDelta: 0.08,
                      longitudeDelta: 0.08,
                    }}
                    onPress={handleMapPress}
                  >
                    {latitude !== null && longitude !== null && Marker ? (
                      <Marker coordinate={{ latitude, longitude }} title="Selected location" />
                    ) : null}
                  </MapView>
                </View>
              ) : (
                <View style={styles.mapUnavailableWrap}>
                  <Text style={styles.mapUnavailableText}>
                    Map module not ready. Rebuild app after native install.
                  </Text>
                </View>
              )}
              <Text style={styles.coordinatesText}>
                {latitude !== null && longitude !== null
                  ? `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
                  : "No location selected yet"}
              </Text>
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
  mapContainer: {
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  map: {
    width: "100%",
    height: 200,
  },
  mapUnavailableWrap: {
    marginTop: spacing.sm,
    minHeight: 100,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  mapUnavailableText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
  coordinatesText: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 12,
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
