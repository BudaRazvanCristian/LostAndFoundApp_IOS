import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { colors } from "../../constants/colors";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { RootStackParamList } from "../../navigation/RootNavigator";
import { useAuth } from "../../context/AuthContext";

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<
    NativeStackNavigationProp<AuthStackParamList & RootStackParamList>
  >();
  const { register } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
      Alert.alert("Registration Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundTop} />
      <View style={styles.backgroundBottom} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.badge}>Get started</Text>
          <Text style={styles.title}>Lost and Found</Text>
          <Text style={styles.subtitle}>
            Create your account and start reconnecting items with owners.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="words"
                textContentType="name"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                autoCapitalize="none"
                textContentType="newPassword"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.card} />
              ) : (
                <Text style={styles.primaryButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.linkText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  backgroundTop: { position: "absolute", top: -120, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.primary, opacity: 0.12 },
  backgroundBottom: { position: "absolute", bottom: -140, left: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: colors.primary, opacity: 0.1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 28 },
  header: { marginBottom: 28 },
  badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.card, color: colors.primary, fontSize: 12, fontWeight: "700", letterSpacing: 0.4, marginBottom: 12 },
  title: { fontSize: 30, fontWeight: "700", color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.mutedText, lineHeight: 22 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, shadowColor: "#0F172A", shadowOpacity: 0.08, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 4 },
  form: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: colors.text, textTransform: "uppercase", letterSpacing: 0.6 },
  input: { height: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingHorizontal: 14, backgroundColor: colors.background, color: colors.text },
  primaryButton: { marginTop: 4, height: 52, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: colors.primary, shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  primaryButtonDisabled: { opacity: 0.6 },
  primaryButtonText: { color: colors.card, fontSize: 16, fontWeight: "700" },
  footer: { marginTop: "auto", paddingVertical: 24, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  footerText: { color: colors.mutedText, fontSize: 14 },
  linkText: { color: colors.primary, fontSize: 14, fontWeight: "600" },
});

export default RegisterScreen;
