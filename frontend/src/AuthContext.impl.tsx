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
}

type ProfileUpdatePayload = Partial<Pick<User, "name" | "last_name" | "number" | "user_type">>;

type AdminUserCreatePayload = {
  email: string;
  password: string;
  name?: string;
  last_name?: string;
  number?: string;
  user_type?: string;
};

type AdminUserUpdatePayload = {
  user_type?: string;
  name?: string;
  last_name?: string;
  number?: string;
};

interface AuthContextType {
  user: User | null;
  login(email: string, password: string): Promise<void>;
  register(email: string, password: string): Promise<void>;
  logout(): void;
  getProfile(): Promise<void>;
  updateProfile(data: ProfileUpdatePayload): Promise<void>;
  // Admin functions
  searchUsers(search?: string): Promise<User[]>;
  createUser(data: AdminUserCreatePayload): Promise<User>;
  updateUser(userId: number, data: AdminUserUpdatePayload): Promise<User>;
  deleteUser(userId: number): Promise<void>;
}

export const AuthContext = createContext<AuthContextType>(null as any);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  async function login(email: string, password: string) {
    const res = await api.post("/api/token/", { email, password });
    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);

    await getProfile();
  }

  async function register(email: string, password: string) {
    await api.post("/api/register/", { email, password });
  }

  async function getProfile() {
    try {
      const res = await api.get("/api/profile/");
      setUser(res.data);
    } catch (e) {
      setUser(null);
      // Don't clear localStorage on profile fetch failure - might be network issue
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

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  // Admin functions
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
    if (localStorage.getItem("access")) {
      getProfile();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, login, register, logout, getProfile, updateProfile,
      searchUsers, createUser, updateUser, deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

