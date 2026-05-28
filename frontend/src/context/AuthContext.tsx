import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/config";

export interface User {
  id: string;
  full_name: string;
  username: string;
  email: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  register: (full_name: string, username: string, email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<User>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  updateProfile: (full_name: string, username: string) => Promise<void>;
  changePassword: (current_password: string, new_password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({} as User),
  register: async () => {},
  verifyOtp: async () => ({} as User),
  resendOtp: async () => {},
  logout: () => {},
  updateUser: () => {},
  updateProfile: async () => {},
  changePassword: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const token = localStorage.getItem("auth_token");
      const stored = localStorage.getItem("user");
      if (token && stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (identifier: string, password: string): Promise<User> => {
    const { data } = await axios.post(API_ENDPOINTS.AUTH_LOGIN, { identifier, password });
    localStorage.setItem("auth_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user as User;
  };

  const register = async (
    full_name: string,
    username: string,
    email: string,
    password: string,
  ): Promise<void> => {
    await axios.post(API_ENDPOINTS.AUTH_REGISTER, { full_name, username, email, password });
  };

  const verifyOtp = async (email: string, otp: string): Promise<User> => {
    const { data } = await axios.post(API_ENDPOINTS.AUTH_VERIFY_OTP, { email, otp });
    localStorage.setItem("auth_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user as User;
  };

  const resendOtp = async (email: string): Promise<void> => {
    await axios.post(API_ENDPOINTS.AUTH_RESEND_OTP, { email });
  };

  const updateProfile = async (full_name: string, username: string): Promise<void> => {
    const { data } = await api.patch(API_ENDPOINTS.AUTH_ME, { full_name, username });
    const updated = { ...user!, full_name: data.full_name, username: data.username };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  const changePassword = async (current_password: string, new_password: string): Promise<void> => {
    await api.post(API_ENDPOINTS.AUTH_CHANGE_PASSWORD, { current_password, new_password });
  };

  const logout = (): void => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/sign-in");
  };

  const updateUser = (userData: Partial<User>): void => {
    if (!user) return;
    const updated = { ...user, ...userData };
    setUser(updated);
    localStorage.setItem("user", JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, verifyOtp, resendOtp, logout, updateUser, updateProfile, changePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
