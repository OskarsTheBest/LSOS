import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import type { User } from "../AuthContext";
import api from "../axios";

interface School {
  id: number;
  nosaukums: string;
  pasvaldiba?: string;
  adrese: string;
}

type ActionType = "add" | "remove";

export default function ManageSchoolUsers() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [actionType, setActionType] = useState<ActionType>(
    (location.state as { action?: ActionType })?.action || "add"
  );
  const [selectedSchool, setSelectedSchool] = useState<number | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = user?.user_type === "admin";
  const isTeacher = user?.user_type === "teacher";

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      if (actionType === "add") {
        loadUsersWithoutSchool();
      } else {
        loadSchoolUsers();
      }
    } else {
      setUsers([]);
    }
  }, [selectedSchool, actionType]);

  const loadSchools = async () => {
    try {
      const res = await api.get("/api/schools/");
      setSchools(res.data);
    } catch (err: any) {
      setError("Neizdevās ielādēt skolas");
    }
  };

  const loadUsersWithoutSchool = async () => {
    if (!selectedSchool) return;
    
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await api.get("/api/schools/users/without-school/", { params });
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt lietotājus");
    } finally {
      setLoading(false);
    }
  };

  const loadSchoolUsers = async () => {
    if (!selectedSchool) return;
    
    setLoading(true);
    try {
      const res = await api.get("/api/schools/users/", {
        params: { school_id: selectedSchool }
      });
      setUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt lietotājus");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedSchool) {
        if (actionType === "add") {
          loadUsersWithoutSchool();
        } else {
          loadSchoolUsers();
        }
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedSchool, actionType]);

  async function handleAddUserToSchool(userId: number) {
    if (!selectedSchool) return;
    
    setError("");
    setSuccess("");
    
    try {
      await api.post("/api/schools/add-user/", {
        user_id: userId,
        school_id: selectedSchool
      });
      setSuccess("Lietotājs veiksmīgi pievienots skolai");
      loadUsersWithoutSchool();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās pievienot lietotāju skolai");
    }
  }

  async function handleRemoveUserFromSchool(userId: number, userName: string) {
    if (!selectedSchool) return;
    
    if (!window.confirm(`Vai tiešām vēlaties noņemt lietotāju "${userName}" no skolas?`)) {
      return;
    }
    
    setError("");
    setSuccess("");
    
    try {
      await api.post("/api/schools/remove-user/", {
        user_id: userId,
        school_id: selectedSchool
      });
      setSuccess("Lietotājs veiksmīgi noņemts no skolas");
      loadSchoolUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās noņemt lietotāju no skolas");
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

  return (
    <div className="min-h-screen bg-brand-bg pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-8">
        <div className="bg-[#252D47] rounded-lg shadow-xl p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="px-6 py-3 bg-brand-gold rounded-lg">
              <h1 className="text-2xl font-bold text-black">
                {actionType === "add" ? "Pievienot lietotāju skolai" : "Noņemt lietotāju no skolas"}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActionType("add")}
                className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                  actionType === "add"
                    ? "bg-brand-gold text-black"
                    : "bg-[#3A4562] text-white hover:bg-[#4A5568]"
                }`}
              >
                Pievienot
              </button>
              <button
                onClick={() => setActionType("remove")}
                className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                  actionType === "remove"
                    ? "bg-brand-gold text-black"
                    : "bg-[#3A4562] text-white hover:bg-[#4A5568]"
                }`}
              >
                Noņemt
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="px-6 py-3 bg-[#3A4562] text-white font-semibold rounded-lg hover:bg-[#4A5568] transition-colors"
              >
                Atpakaļ
              </button>
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

          {/* School Selection */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-3">Izvēlieties skolu</label>
            <select
              value={selectedSchool || ""}
              onChange={(e) => setSelectedSchool(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
            >
              <option value="">-- Izvēlieties skolu --</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.nosaukums} {school.pasvaldiba && `(${school.pasvaldiba})`}
                </option>
              ))}
            </select>
          </div>

          {/* Users Table */}
          {selectedSchool ? (
            <>
              <div className="mb-4">
                <div className="relative">
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

              {loading ? (
                <div className="text-center text-white text-xl py-12">Ielādē...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#3A4562]">
                        <th className="text-left py-4 px-4 text-white font-semibold">E-pasts</th>
                        <th className="text-left py-4 px-4 text-white font-semibold">Vārds, uzvārds</th>
                        <th className="text-left py-4 px-4 text-white font-semibold">Lietotāja tips</th>
                        <th className="text-left py-4 px-4 text-white font-semibold">Konta izveides laiks</th>
                        <th className="text-left py-4 px-4 text-white font-semibold">Darbības</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users
                        .filter((u) => u.user_type !== "admin") // Filter out admin users
                        .map((u) => {
                        if (!u.id) return null;
                        const fullName = `${u.name || ""} ${u.last_name || ""}`.trim() || "-";
                        const userTypeLabel = u.user_type === "teacher" ? "Skolotājs" : "Lietotājs";
                        
                        return (
                          <tr
                            key={u.id}
                            className="border-b border-[#3A4562] hover:bg-[#2A3454] transition-colors"
                          >
                            <td className="py-4 px-4 text-white">{u.email}</td>
                            <td className="py-4 px-4 text-white">{fullName}</td>
                            <td className="py-4 px-4 text-white">{userTypeLabel}</td>
                            <td className="py-4 px-4 text-white">{formatDate(u.create_date)}</td>
                            <td className="py-4 px-4">
                              {actionType === "add" ? (
                                <button
                                  onClick={() => handleAddUserToSchool(u.id!)}
                                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-colors"
                                >
                                  Pievienot
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRemoveUserFromSchool(u.id!, fullName)}
                                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded transition-colors"
                                >
                                  Noņemt
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {users.length === 0 && !loading && (
                    <div className="text-center text-white text-xl py-12">
                      {actionType === "add" 
                        ? "Nav atrasti lietotāji bez skolas" 
                        : "Šajā skolā nav lietotāju"}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-white text-xl py-12">
              Lūdzu, izvēlieties skolu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

