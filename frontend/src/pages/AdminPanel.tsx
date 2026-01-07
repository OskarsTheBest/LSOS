import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import type { User } from "../AuthContext";
import { messages } from "../messages";
import api from "../axios";

export default function AdminPanel() {
  const { user, searchUsers, createUser, updateUser, deleteUser, logout, getProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const isAdmin = user?.user_type === "admin";
  const isTeacher = user?.user_type === "teacher";
  
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOption, setSortOption] = useState<"date_desc" | "date_asc" | "name_asc" | "name_desc">("date_desc");
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    email: "",
    password: "",
    name: "",
    last_name: "",
    number: "",
    user_type: "normal",
    schoolId: null as number | null
  });
  
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editFormDataMap, setEditFormDataMap] = useState<Record<number, { user_type: string }>>({});
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: "",
    last_name: "",
    email: "",
    password: "",
    number: "",
    school: "",
    schoolId: null as number | null,
    user_type: "normal" as "normal" | "teacher" | "admin"
  });
  const [schools, setSchools] = useState<Array<{id: number, nosaukums: string}>>([]);
  const [showPassword, setShowPassword] = useState(false);

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

    // Validate that teachers have a school assigned
    if (createFormData.user_type === "teacher" && !createFormData.schoolId) {
      setError("Skolotājiem jābūt pievienotiem skolai");
      return;
    }

    try {
      await createUser({
        email: createFormData.email,
        password: createFormData.password,
        name: createFormData.name,
        last_name: createFormData.last_name,
        number: createFormData.number,
        user_type: createFormData.user_type,
        skola: createFormData.schoolId
      });
      setSuccess(messages.S001("Lietotājs"));
      setShowCreateForm(false);
      setCreateFormData({
        email: "",
        password: "",
        name: "",
        last_name: "",
        number: "",
        user_type: "normal",
        schoolId: null
      });
      loadUsers();
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.email) {
        setError(messages.E003("E-pasts"));
      } else if (errorData?.number) {
        setError(messages.E005);
      } else if (errorData?.skola) {
        setError(Array.isArray(errorData.skola) ? errorData.skola[0] : errorData.skola);
      } else if (errorData?.user_type) {
        setError(Array.isArray(errorData.user_type) ? errorData.user_type[0] : errorData.user_type);
      } else {
        setError(errorData?.detail || "Neizdevās izveidot lietotāju");
      }
    }
  }

  useEffect(() => {
    // Load schools for dropdown
    const loadSchools = async () => {
      try {
        const res = await api.get("/api/schools/");
        setSchools(res.data);
      } catch (err) {
        console.error("Failed to load schools:", err);
      }
    };
    loadSchools();
  }, []);

  function handleViewUser(user: User) {
    if (!user.id) return;
    setSelectedUser(user);
    setUserFormData({
      name: user.name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      password: "************",
      number: user.number || "",
      school: user.skola_nosaukums || "",
      schoolId: user.skola || null,
      user_type: (user.user_type as "normal" | "teacher" | "admin") || "normal"
    });
    setShowUserModal(true);
    setError("");
    setSuccess("");
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
      setShowUserModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || messages.E004);
    }
  }

  async function handleSaveUserChanges() {
    if (!selectedUser || !selectedUser.id) return;
    
    if (!isAdmin) {
      setError("Jums nav tiesību rediģēt kontus");
      return;
    }
    
    setError("");
    setSuccess("");
    
    try {
      const updateData: any = {
        name: userFormData.name,
        last_name: userFormData.last_name,
        number: userFormData.number,
        user_type: userFormData.user_type
      };
      
      // If changing to teacher, include school in update payload
      if (userFormData.user_type === 'teacher' && userFormData.schoolId) {
        updateData.skola = userFormData.schoolId;
      }
      
      // Update school if changed (handle separately for non-teacher or if school is being removed)
      if (userFormData.schoolId !== selectedUser.skola && !(userFormData.user_type === 'teacher' && updateData.skola)) {
        if (userFormData.schoolId) {
          await api.post("/api/schools/add-user/", {
            user_id: selectedUser.id,
            school_id: userFormData.schoolId
          });
        } else if (selectedUser.skola) {
          await api.post("/api/schools/remove-user/", {
            user_id: selectedUser.id
          });
        }
      }
      
      await updateUser(selectedUser.id, updateData);
      setSuccess(messages.S002("Lietotājs"));
      setShowUserModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
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

  function getUserTypeIcon(userType?: string) {
    switch (userType) {
      case "admin": return "A";
      case "teacher": return "S";
      default: return null;
    }
  }

  function formatDate(dateString?: string): string {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "-";
    }
  }

  // Sort users
  const sortedUsers = [...users].sort((a, b) => {
    let comparison = 0;
    
    switch (sortOption) {
      case "date_desc":
        const dateA = a.create_date ? new Date(a.create_date).getTime() : 0;
        const dateB = b.create_date ? new Date(b.create_date).getTime() : 0;
        comparison = dateB - dateA; 
        break;
      case "date_asc":
        const dateA2 = a.create_date ? new Date(a.create_date).getTime() : 0;
        const dateB2 = b.create_date ? new Date(b.create_date).getTime() : 0;
        comparison = dateA2 - dateB2; 
        break;
      case "name_asc":
        const nameA = `${a.name || ""} ${a.last_name || ""}`.trim().toLowerCase();
        const nameB = `${b.name || ""} ${b.last_name || ""}`.trim().toLowerCase();
        comparison = nameA.localeCompare(nameB, "lv"); 
        break;
      case "name_desc":
        const nameA2 = `${a.name || ""} ${a.last_name || ""}`.trim().toLowerCase();
        const nameB2 = `${b.name || ""} ${b.last_name || ""}`.trim().toLowerCase();
        comparison = nameB2.localeCompare(nameA2, "lv"); 
        break;
    }
    
    return comparison;
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showFilterModal && !target.closest('.filter-modal-container')) {
        setShowFilterModal(false);
      }
    };

    if (showFilterModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilterModal]);

  return (
    <div className="min-h-screen bg-brand-bg pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-8">
        <div className="bg-[#252D47] rounded-lg shadow-xl p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="px-6 py-3 bg-brand-gold rounded-lg">
              <h1 className="text-2xl font-bold text-black">Kontu saraksts</h1>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => navigate("/admin/create-account")}
                className="px-6 py-3 bg-[#4A90E2] text-white font-semibold rounded-lg hover:bg-[#357ABD] transition-colors"
              >
                Jauns konts
              </button>
              
              <div className="relative filter-modal-container">
                <button
                  onClick={() => setShowFilterModal(!showFilterModal)}
                  className="px-6 py-3 bg-[#4A90E2] text-white font-semibold rounded-lg hover:bg-[#357ABD] transition-colors flex items-center gap-2"
                >
                  Filtrēt / Kārtot
                  <img
                    src={require("../static/Filter2.png")}
                    alt="Filter"
                    className="w-5 h-5"
                  />
                </button>

                {showFilterModal && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#252D47] rounded-lg shadow-xl p-6 z-50 border border-[#3A4562]">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white font-semibold mb-3">Kārtot pēc</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="radio"
                              name="sortOption"
                              value="date_desc"
                              checked={sortOption === "date_desc"}
                              onChange={(e) => setSortOption(e.target.value as "date_desc" | "date_asc" | "name_asc" | "name_desc")}
                              className="w-4 h-4 text-brand-gold"
                            />
                            Dilšošā (Jaunākie vispirms)
                          </label>
                          <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="radio"
                              name="sortOption"
                              value="date_asc"
                              checked={sortOption === "date_asc"}
                              onChange={(e) => setSortOption(e.target.value as "date_desc" | "date_asc" | "name_asc" | "name_desc")}
                              className="w-4 h-4 text-brand-gold"
                            />
                            Augošā (Vecākie vispirms)
                          </label>
                          <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="radio"
                              name="sortOption"
                              value="name_asc"
                              checked={sortOption === "name_asc"}
                              onChange={(e) => setSortOption(e.target.value as "date_desc" | "date_asc" | "name_asc" | "name_desc")}
                              className="w-4 h-4 text-brand-gold"
                            />
                            A-Z
                          </label>
                          <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="radio"
                              name="sortOption"
                              value="name_desc"
                              checked={sortOption === "name_desc"}
                              onChange={(e) => setSortOption(e.target.value as "date_desc" | "date_asc" | "name_asc" | "name_desc")}
                              className="w-4 h-4 text-brand-gold"
                            />
                            Z-A
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative flex-1 min-w-[300px]">
                <input
                  type="text"
                  placeholder="Meklēt lietotāju..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-3 pl-12 pr-4 rounded-lg border-2 border-brand-gold bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                />
                <img
                  src={require("../static/Magnifying Glass2.png")}
                  alt="Search"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 text-green-400 text-sm bg-green-900/20 p-3 rounded-lg">
              {success}
            </div>
          )}

          {showCreateForm && (isAdmin || isTeacher) && (
            <div className="mb-6 p-6 bg-[#1B2241] rounded-lg border border-[#3A4562]">
              <h3 className="text-xl font-bold text-white mb-4">Izveidot jaunu lietotāju</h3>
              <form onSubmit={handleCreateUser}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-white mb-2 font-medium">E-pasts *</label>
                    <input
                      type="email"
                      value={createFormData.email}
                      onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                      required
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Parole *</label>
                    <input
                      type="password"
                      value={createFormData.password}
                      onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                      required
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Vārds</label>
                    <input
                      type="text"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Uzvārds</label>
                    <input
                      type="text"
                      value={createFormData.last_name}
                      onChange={(e) => setCreateFormData({ ...createFormData, last_name: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Tālrunis</label>
                    <input
                      type="text"
                      value={createFormData.number}
                      onChange={(e) => setCreateFormData({ ...createFormData, number: e.target.value })}
                      placeholder="+37112345678"
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Lietotāja tips</label>
                    <select
                      value={createFormData.user_type}
                      onChange={(e) => setCreateFormData({ ...createFormData, user_type: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                      disabled={isTeacher}
                    >
                      {isAdmin ? (
                        <>
                          <option value="normal">Normal (R)</option>
                          <option value="teacher">Teacher (S)</option>
                          <option value="admin">Admin (A)</option>
                        </>
                      ) : (
                        <option value="normal">Normal (R)</option>
                      )}
                    </select>
                  </div>
                  {createFormData.user_type === "teacher" && (
                    <div>
                      <label className="block text-white mb-2 font-medium">Skola *</label>
                      <select
                        value={createFormData.schoolId || ""}
                        onChange={(e) => setCreateFormData({ ...createFormData, schoolId: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                        required
                      >
                        <option value="">-- Izvēlieties skolu --</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.nosaukums}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-brand-gold text-black rounded-lg font-semibold hover:bg-brand-gold-dark transition-colors"
                  >
                    Izveidot
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 bg-[#3A4562] text-white rounded-lg font-semibold hover:bg-[#4A5568] transition-colors"
                  >
                    Atcelt
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="text-center text-white text-xl py-12">Ielādē...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3A4562]">
                    <th className="text-left py-4 px-4 text-white font-semibold">Konta tips</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Konta vārds uzvārds</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">E-pasts</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">
                      Konta izveides laiks
                    </th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Skola</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Darbības</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((u) => {
                    if (!u.id) return null;
                    const userTypeIcon = getUserTypeIcon(u.user_type);
                    const fullName = `${u.name || ""} ${u.last_name || ""}`.trim() || "-";
                    
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-[#3A4562] hover:bg-[#2A3454] transition-colors"
                      >
                        <td className="py-4 px-4">
                          {userTypeIcon ? (
                            <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-black font-bold">
                              {userTypeIcon}
                            </div>
                          ) : (
                            <img
                              src={require("../static/user2.png")}
                              alt="User"
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                        </td>
                        <td className="py-4 px-4 text-white">{fullName}</td>
                        <td className="py-4 px-4 text-white">{u.email}</td>
                        <td className="py-4 px-4 text-white">{formatDate(u.create_date)}</td>
                        <td className="py-4 px-4 text-white">{u.skola_nosaukums || "Nav"}</td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewUser(u)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-colors"
                          >
                            Apskatīt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {sortedUsers.length === 0 && !loading && (
                <div className="text-center text-white text-xl py-12">
                  Nav atrasti lietotāji
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div 
          className="fixed inset-0 bg-[#13182D] bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowUserModal(false)}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="bg-[#252D47] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 relative">
              <button
                onClick={() => setShowUserModal(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold transition-colors bg-transparent border-none cursor-pointer w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>

              <div className="space-y-6">
                {/* Vārds Uzvārds */}
                <div className="border-b border-[#3A4562] pb-4">
                  <label className="block text-white font-semibold mb-3">Vārds Uzvārds</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                      disabled={!isAdmin}
                      className={`w-full p-3 border border-[#3A4562] rounded-lg bg-[#1B2241] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                        !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Vārds"
                    />
                    <input
                      type="text"
                      value={userFormData.last_name}
                      onChange={(e) => setUserFormData({ ...userFormData, last_name: e.target.value })}
                      disabled={!isAdmin}
                      className={`w-full p-3 border border-[#3A4562] rounded-lg bg-[#1B2241] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                        !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Uzvārds"
                    />
                  </div>
                </div>

                {/* E-pasta adrese */}
                <div className="border-b border-[#3A4562] pb-4">
                  <label className="block text-white font-semibold mb-3">E-pasta adrese</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    disabled
                    className="w-full p-3 border border-[#3A4562] rounded-lg bg-[#1B2241] text-white opacity-50 cursor-not-allowed"
                  />
                </div>

                {/* Parole */}
                <div className="border-b border-[#3A4562] pb-4">
                  <label className="block text-white font-semibold mb-3">Parole</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={userFormData.password}
                      disabled
                      className="w-full p-3 pr-12 border border-[#3A4562] rounded-lg bg-[#1B2241] text-white opacity-50 cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white bg-transparent border-none cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Skola */}
                <div className="border-b border-[#3A4562] pb-4">
                  <label className="block text-white font-semibold mb-3">Skola</label>
                  <div className="relative">
                    <select
                      value={userFormData.schoolId || ""}
                      onChange={(e) => {
                        const schoolId = e.target.value ? parseInt(e.target.value) : null;
                        const school = schools.find(s => s.id === schoolId);
                        setUserFormData({ 
                          ...userFormData, 
                          schoolId,
                          school: school?.nosaukums || ""
                        });
                      }}
                      disabled={!isAdmin}
                      className={`w-full p-3 pr-12 border border-[#3A4562] rounded-lg bg-[#1B2241] text-white focus:outline-none focus:ring-2 focus:ring-brand-gold appearance-none ${
                        !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <option value="" className="bg-[#1B2241] text-white">Nav skolas</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id} className="bg-[#1B2241] text-white">
                          {school.nosaukums}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Telefona numurs */}
                <div className="border-b border-[#3A4562] pb-4">
                  <label className="block text-white font-semibold mb-3">Telefona numurs</label>
                  <input
                    type="text"
                    value={userFormData.number}
                    onChange={(e) => setUserFormData({ ...userFormData, number: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-[#3A4562] rounded-lg bg-[#1B2241] text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    placeholder="+371 12345678"
                  />
                </div>

                {/* Lietotāja tips */}
                <div className="border-b border-[#3A4562] pb-4">
                  <label className="block text-white font-semibold mb-3">Lietotāja tips</label>
                  <div className="flex gap-6">
                    <label className={`flex items-center gap-2 ${!isAdmin ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name="user_type"
                        value="normal"
                        checked={userFormData.user_type === "normal"}
                        onChange={(e) => setUserFormData({ ...userFormData, user_type: e.target.value as "normal" | "teacher" | "admin" })}
                        disabled={!isAdmin}
                        className="w-4 h-4 text-brand-gold"
                      />
                      <span className="text-white">Lietotājs</span>
                    </label>
                    <label className={`flex items-center gap-2 ${!isAdmin ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name="user_type"
                        value="teacher"
                        checked={userFormData.user_type === "teacher"}
                        onChange={(e) => setUserFormData({ ...userFormData, user_type: e.target.value as "normal" | "teacher" | "admin" })}
                        disabled={!isAdmin}
                        className="w-4 h-4 text-brand-gold"
                      />
                      <span className="text-white">Skolotājs</span>
                    </label>
                    <label className={`flex items-center gap-2 ${!isAdmin ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                      <input
                        type="radio"
                        name="user_type"
                        value="admin"
                        checked={userFormData.user_type === "admin"}
                        onChange={(e) => setUserFormData({ ...userFormData, user_type: e.target.value as "normal" | "teacher" | "admin" })}
                        disabled={!isAdmin}
                        className="w-4 h-4 text-brand-gold"
                      />
                      <span className="text-white">Administrators</span>
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                {isAdmin && (
                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => selectedUser.id && handleDeleteUser(selectedUser.id, selectedUser.email)}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Dzēst lietotāju
                    </button>
                    
                    <button
                      onClick={handleSaveUserChanges}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saglabāt izmaiņas
                    </button>
                  </div>
                )}
                
                {isTeacher && (
                  <div className="pt-4 text-center">
                    <p className="text-gray-400 text-sm">Skolotājiem nav tiesību rediģēt kontus</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
