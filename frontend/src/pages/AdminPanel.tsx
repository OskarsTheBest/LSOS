import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import type { User } from "../AuthContext";
import { messages } from "../messages";

export default function AdminPanel() {
  const { user, searchUsers, createUser, updateUser, deleteUser, logout, getProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    name: "",
    last_name: "",
    number: "",
    user_type: "normal"
  });
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFormDataMap, setEditFormDataMap] = useState<Record<number, { user_type: string }>>({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await searchUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt lietotājus");
    } finally {
      setLoading(false);
    }
  }, [searchUsers]);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await searchUsers(searchTerm);
      setUsers(data);
      if (data.length === 0 && searchTerm) {
        setError(messages.E009(searchTerm));
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Meklēšanas kļūda");
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      } else {
        loadUsers();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, handleSearch, loadUsers]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!createFormData.email) {
      setError(messages.E001("E-pasts"));
      return;
    }
    if (!createFormData.password) {
      setError(messages.E001("Parole"));
      return;
    }

    try {
      await createUser(createFormData);
      setSuccess(messages.S001("Lietotājs"));
      setShowCreateForm(false);
      setCreateFormData({
        email: "",
        password: "",
        name: "",
        last_name: "",
        number: "",
        user_type: "normal"
      });
      loadUsers();
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.email) {
        setError(messages.E003("E-pasts"));
      } else if (errorData?.number) {
        setError(messages.E005);
      } else {
        setError(errorData?.detail || "Neizdevās izveidot lietotāju");
      }
    }
  }

  function handleEditClick(user: User) {
    if (!user.id) return;
    setEditingUserId(user.id);
    setEditFormDataMap({
      ...editFormDataMap,
      [user.id]: {
        user_type: user.user_type || "normal"
      }
    });
    setError("");
    setSuccess("");
  }

  function handleCancelEdit() {
    if (editingUserId) {
      const newMap = { ...editFormDataMap };
      delete newMap[editingUserId];
      setEditFormDataMap(newMap);
    }
    setEditingUserId(null);
  }

  async function handleUpdateUser(userId: number) {
    if (editingUserId !== userId) {
      setError("Kļūda: nepareizs lietotājs");
      return;
    }
    
    const editFormData = editFormDataMap[userId];
    if (!editFormData) {
      setError("Kļūda: nav atrasti rediģēšanas dati");
      return;
    }
    
    setError("");
    setSuccess("");
    
    try {
      await updateUser(userId, editFormData);
      
      setSuccess(messages.S002("Lietotājs"));
      
      const newMap = { ...editFormDataMap };
      delete newMap[userId];
      setEditFormDataMap(newMap);
      setEditingUserId(null);
      
      if (userId === user?.id && editFormData.user_type) {
        await getProfile();
      }
      
      await loadUsers();
    } catch (err: any) {
      console.error("Update error:", err);
      const errorData = err.response?.data;
      if (errorData?.user_type) {
        setError(Array.isArray(errorData.user_type) ? errorData.user_type[0] : errorData.user_type);
      } else if (errorData?.detail) {
        setError(errorData.detail);
      } else {
        setError(errorData?.message || messages.E004);
      }
    }
  }

  async function handleDeleteUser(userId: number, userEmail: string) {
    if (!window.confirm(messages.S004)) {
      return;
    }

    setError("");
    setSuccess("");
    
    try {
      await deleteUser(userId);
      setSuccess(messages.S003("Lietotājs"));
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || messages.E004);
    }
  }

  function handleLogout() {
    alert(messages.S009);
    logout();
    navigate("/login");
  }

  function getUserTypeLabel(userType?: string): string {
    switch (userType) {
      case "normal": return "Normal (R)";
      case "teacher": return "Teacher (S)";
      case "admin": return "Admin (A)";
      default: return "Normal (R)";
    }
  }

  return (
    <div className="p-5 max-w-[1200px] mx-auto mt-20">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl text-white">Administratora panelis</h2>
        <div className="flex gap-2.5">
          <button onClick={() => navigate("/profile")} className="px-5 py-2.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors">
            Profils
          </button>
          <button onClick={handleLogout} className="px-5 py-2.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
            Iziet
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 mb-2.5 p-2.5 bg-red-50 rounded">{error}</div>}
      {success && <div className="text-green-500 mb-2.5 p-2.5 bg-green-50 rounded">{success}</div>}

      <div className="mb-5 flex gap-2.5 items-center">
        <input
          type="text"
          placeholder="Meklēt lietotājus (e-pasts, vārds, uzvārds, numurs)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded"
        />
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)} 
          className="px-5 py-2.5 bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600 transition-colors"
        >
          {showCreateForm ? "Atcelt" : "Izveidot lietotāju"}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-5 p-5 border border-gray-300 rounded bg-gray-50">
          <h3 className="mb-4 text-lg font-semibold">Izveidot jaunu lietotāju</h3>
          <form onSubmit={handleCreateUser}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-1.5 font-bold">E-pasts *</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">Parole *</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  required
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">Vārds</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">Uzvārds</label>
                <input
                  type="text"
                  value={createFormData.last_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, last_name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">Tālrunis</label>
                <input
                  type="text"
                  value={createFormData.number}
                  onChange={(e) => setCreateFormData({ ...createFormData, number: e.target.value })}
                  placeholder="+37112345678"
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block mb-1.5 font-bold">Lietotāja tips</label>
                <select
                  value={createFormData.user_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, user_type: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="normal">Normal (R)</option>
                  <option value="teacher">Teacher (S)</option>
                  <option value="admin">Admin (A)</option>
                </select>
              </div>
            </div>
            <button type="submit" className="px-5 py-2.5 bg-green-500 text-white border-none rounded cursor-pointer hover:bg-green-600 transition-colors">
              Izveidot
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center p-5 text-white">Ielādē...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left border border-gray-300">E-pasts</th>
                <th className="p-3 text-left border border-gray-300">Vārds</th>
                <th className="p-3 text-left border border-gray-300">Uzvārds</th>
                <th className="p-3 text-left border border-gray-300">Tālrunis</th>
                <th className="p-3 text-left border border-gray-300">Tips</th>
                <th className="p-3 text-left border border-gray-300">Darbības</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                if (!u.id) return null;
                const isEditingThisUser = editingUserId === u.id;
                const currentEditData = editFormDataMap[u.id] || { user_type: u.user_type || "normal" };
                return (
                <tr key={u.id}>
                  <td className="p-3 border border-gray-300">{u.email}</td>
                  <td className="p-3 border border-gray-300">{u.name || "-"}</td>
                  <td className="p-3 border border-gray-300">{u.last_name || "-"}</td>
                  <td className="p-3 border border-gray-300">{u.number || "-"}</td>
                  <td className="p-3 border border-gray-300">
                    {isEditingThisUser ? (
                      <select
                        value={currentEditData.user_type}
                        onChange={(e) => setEditFormDataMap({
                          ...editFormDataMap,
                          [u.id!]: { user_type: e.target.value }
                        })}
                        className="p-1.5 border border-gray-300 rounded"
                      >
                        <option value="normal">Normal (R)</option>
                        <option value="teacher">Teacher (S)</option>
                        <option value="admin">Admin (A)</option>
                      </select>
                    ) : (
                      getUserTypeLabel(u.user_type)
                    )}
                  </td>
                  <td className="p-3 border border-gray-300">
                    {isEditingThisUser ? (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleUpdateUser(u.id!)}
                          className="px-2.5 py-1.5 bg-green-500 text-white border-none rounded cursor-pointer text-xs hover:bg-green-600 transition-colors"
                        >
                          Saglabāt
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2.5 py-1.5 bg-red-500 text-white border-none rounded cursor-pointer text-xs hover:bg-red-600 transition-colors"
                        >
                          Atcelt
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="px-2.5 py-1.5 bg-blue-500 text-white border-none rounded cursor-pointer text-xs hover:bg-blue-600 transition-colors"
                        >
                          Rediģēt
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u.id!, u.email)}
                            className="px-2.5 py-1.5 bg-red-500 text-white border-none rounded cursor-pointer text-xs hover:bg-red-600 transition-colors"
                          >
                            Dzēst
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
          {users.length === 0 && !loading && (
            <div className="text-center p-5 text-gray-600">
              Nav atrasti lietotāji
            </div>
          )}
        </div>
      )}
    </div>
  );
}
