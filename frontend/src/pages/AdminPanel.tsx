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
  
  // Create user form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    name: "",
    last_name: "",
    number: "",
    user_type: "normal"
  });
  
  // Edit user state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({
    user_type: "normal"
  });

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
    
    // Validation
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
    setEditingUser(user);
    setEditFormData({
      user_type: user.user_type || "normal"
    });
    setError("");
    setSuccess("");
  }

  function handleCancelEdit() {
    setEditingUser(null);
    setEditFormData({ user_type: "normal" });
  }

  async function handleUpdateUser(userId: number) {
    if (!editingUser || editingUser.id !== userId) {
      setError("Kļūda: nepareizs lietotājs");
      return;
    }
    
    setError("");
    setSuccess("");
    
    // Debug: log what we're sending
    console.log("Updating user:", userId, "with data:", editFormData);
    
    try {
      const updatedUser = await updateUser(userId, editFormData);
      console.log("Updated user response:", updatedUser);
      
      setSuccess(messages.S002("Lietotājs"));
      setEditingUser(null);
      setEditFormData({ user_type: "normal" });
      
      // If we updated the current user's type, refresh their profile to update permissions
      if (userId === user?.id && editFormData.user_type) {
        // Refresh current user profile to get updated user_type
        await getProfile();
      }
      
      // Reload users list after profile refresh
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
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2>Administratora panelis</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => navigate("/profile")} style={{ padding: "10px 20px" }}>Profils</button>
          <button onClick={handleLogout} style={{ padding: "10px 20px" }}>Iziet</button>
        </div>
      </div>

      {error && <div style={{ color: "red", marginBottom: "10px", padding: "10px", backgroundColor: "#ffebee", borderRadius: "4px" }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: "10px", padding: "10px", backgroundColor: "#e8f5e9", borderRadius: "4px" }}>{success}</div>}

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Meklēt lietotājus (e-pasts, vārds, uzvārds, numurs)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
        />
        <button onClick={() => setShowCreateForm(!showCreateForm)} style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
          {showCreateForm ? "Atcelt" : "Izveidot lietotāju"}
        </button>
      </div>

      {showCreateForm && (
        <div style={{ marginBottom: "20px", padding: "20px", border: "1px solid #ccc", borderRadius: "4px", backgroundColor: "#f9f9f9" }}>
          <h3>Izveidot jaunu lietotāju</h3>
          <form onSubmit={handleCreateUser}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>E-pasts *</label>
                <input
                  type="email"
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Parole *</label>
                <input
                  type="password"
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Vārds</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Uzvārds</label>
                <input
                  type="text"
                  value={createFormData.last_name}
                  onChange={(e) => setCreateFormData({ ...createFormData, last_name: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Tālrunis</label>
                <input
                  type="text"
                  value={createFormData.number}
                  onChange={(e) => setCreateFormData({ ...createFormData, number: e.target.value })}
                  placeholder="+37112345678"
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Lietotāja tips</label>
                <select
                  value={createFormData.user_type}
                  onChange={(e) => setCreateFormData({ ...createFormData, user_type: e.target.value })}
                  style={{ width: "100%", padding: "8px", border: "1px solid #ccc", borderRadius: "4px" }}
                >
                  <option value="normal">Normal (R)</option>
                  <option value="teacher">Teacher (S)</option>
                  <option value="admin">Admin (A)</option>
                </select>
              </div>
            </div>
            <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Izveidot
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>Ielādē...</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5" }}>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>E-pasts</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Vārds</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Uzvārds</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Tālrunis</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Tips</th>
                <th style={{ padding: "12px", textAlign: "left", border: "1px solid #ddd" }}>Darbības</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isEditingThisUser = editingUser?.id === u.id;
                return (
                <tr key={u.id}>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{u.email}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{u.name || "-"}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{u.last_name || "-"}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>{u.number || "-"}</td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {isEditingThisUser ? (
                      <select
                        value={editFormData.user_type}
                        onChange={(e) => setEditFormData({ user_type: e.target.value })}
                        style={{ padding: "5px", border: "1px solid #ccc", borderRadius: "4px" }}
                      >
                        <option value="normal">Normal (R)</option>
                        <option value="teacher">Teacher (S)</option>
                        <option value="admin">Admin (A)</option>
                      </select>
                    ) : (
                      getUserTypeLabel(u.user_type)
                    )}
                  </td>
                  <td style={{ padding: "12px", border: "1px solid #ddd" }}>
                    {isEditingThisUser ? (
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => u.id && handleUpdateUser(u.id)}
                          style={{ padding: "5px 10px", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                        >
                          Saglabāt
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          style={{ padding: "5px 10px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                        >
                          Atcelt
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button
                          onClick={() => handleEditClick(u)}
                          style={{ padding: "5px 10px", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                        >
                          Rediģēt
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => u.id && handleDeleteUser(u.id, u.email)}
                            style={{ padding: "5px 10px", backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
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
            <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              Nav atrasti lietotāji
            </div>
          )}
        </div>
      )}
    </div>
  );
}

