import React, { createContext, useState, useEffect } from "react";
import api from "./axios";

export interface User {
  id?: number;
  email: string;
  name?: string;
  last_name?: string;
  number?: string;
  user_type?: string;
  is_active?: boolean;
  create_date?: string;
  skola?: number;
  skola_nosaukums?: string;
}

type ProfileUpdatePayload = Partial<Pick<User, "name" | "last_name" | "number" | "user_type">>;

type AdminUserCreatePayload = {
  email: string;
  password: string;
  name?: string;
  last_name?: string;
  number?: string;
  user_type?: string;
  skola?: number | null;
};

type AdminUserUpdatePayload = {
  user_type?: string;
  name?: string;
  last_name?: string;
  number?: string;
  skola?: number | null;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string, name?: string, last_name?: string, number?: string): Promise<void>;
  logout(): void;
  getProfile(): Promise<boolean>;
  updateProfile(data: ProfileUpdatePayload): Promise<void>;
  changePassword(oldPassword: string, newPassword: string, confirmPassword: string): Promise<void>;
  searchUsers(search?: string): Promise<User[]>;
  createUser(data: AdminUserCreatePayload): Promise<User>;
  updateUser(userId: number, data: AdminUserUpdatePayload): Promise<User>;
  deleteUser(userId: number): Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(null as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function login(email: string, password: string) {
    const res = await api.post("/api/token/", { email, password });
    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);

    await getProfile();
  }

  async function register(email: string, password: string, name?: string, last_name?: string, number?: string) {
    await api.post("/api/register/", { email, password, name, last_name, number });
  }

  async function getProfile() {
    try {
      const res = await api.get("/api/profile/");
      setUser(res.data);
      return true;
    } catch (e: any) {
      // Only clear user if token is actually invalid (401 or 403)
      // Don't clear on network errors or other issues
      if (e.response?.status === 401 || e.response?.status === 403) {
        localStorage.clear();
        setUser(null);
      }
      return false;
    }
  }

  async function updateProfile(data: ProfileUpdatePayload) {
    try {
      const res = await api.patch("/api/profile/update/", data);
      setUser(res.data);
    } catch (e) {
      throw e;
    }
  }

  async function changePassword(oldPassword: string, newPassword: string, confirmPassword: string) {
    await api.post("/api/profile/change-password/", {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword
    });
  }

  function logout() {
    localStorage.clear();
    setUser(null);
    setLoading(false);
  }

  async function searchUsers(search?: string): Promise<User[]> {
    const params = search ? { search } : {};
    const res = await api.get("/api/admin/users/", { params });
    return res.data;
  }

  async function createUser(data: AdminUserCreatePayload): Promise<User> {
    const res = await api.post("/api/admin/users/create/", data);
    return res.data;
  }

  async function updateUser(userId: number, data: AdminUserUpdatePayload): Promise<User> {
    const res = await api.patch(`/api/admin/users/${userId}/update/`, data);
    return res.data;
  }

  async function deleteUser(userId: number): Promise<void> {
    await api.delete(`/api/admin/users/${userId}/delete/`);
  }

  useEffect(() => {
    const initAuth = async () => {
      const access = localStorage.getItem("access");
      if (access) {
        await getProfile();
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, loading, login, register, logout, getProfile, updateProfile, changePassword,
      searchUsers, createUser, updateUser, deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

