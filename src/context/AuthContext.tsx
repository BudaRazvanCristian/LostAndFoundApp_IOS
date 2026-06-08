import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as apiService from "../services/apiService";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  phone?: string;
  token: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On app start, restore session from AsyncStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await AsyncStorage.getItem("currentUser");
        if (stored) {
          const parsed = JSON.parse(stored) as AuthUser;
          setUser(parsed);
        }
      } catch {
        // No stored session
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const { user: apiUser, token } = await apiService.loginUser(email, password);
    const authUser: AuthUser = {
      id: apiUser.id,
      email: apiUser.email,
      displayName: apiUser.displayName,
      phone: apiUser.phone,
      token,
    };
    await AsyncStorage.setItem("currentUser", JSON.stringify(authUser));
    setUser(authUser);
  };

  const register = async (
    email: string,
    password: string,
    displayName: string,
    phone?: string
  ): Promise<void> => {
    const { user: apiUser, token } = await apiService.registerUser(email, password, displayName, phone);
    const authUser: AuthUser = {
      id: apiUser.id,
      email: apiUser.email,
      displayName: apiUser.displayName,
      phone: apiUser.phone,
      token,
    };
    await AsyncStorage.setItem("currentUser", JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = async (): Promise<void> => {
    await apiService.logoutUser();
    await AsyncStorage.removeItem("currentUser");
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
