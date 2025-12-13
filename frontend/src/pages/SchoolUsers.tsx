import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import type { User } from "../AuthContext";
import api from "../axios";

interface School {
  id: number;
  nosaukums: string;
  pasvaldiba?: string;
  adrese: string;
}

export default function SchoolUsers() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { schoolId } = useParams<{ schoolId: string }>();
  
  const [school, setSchool] = useState<School | null>(null);
  const [schoolUsers, setSchoolUsers] = useState<User[]>([]);
  const [usersWithoutSchool, setUsersWithoutSchool] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const isAdmin = user?.user_type === "admin";
  const isTeacher = user?.user_type === "teacher";

  const loadSchool = useCallback(async () => {
    if (!schoolId) return;
    
    try {
      const res = await api.get(`/api/schools/${schoolId}/`);
      setSchool(res.data);
    } catch (err: any) {
      setError("Neizdevās ielādēt skolas informāciju");
    }
  }, [schoolId]);

  const loadSchoolUsers = useCallback(async () => {
    if (!schoolId) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/schools/users/", {
        params: { school_id: schoolId }
      });
      setSchoolUsers(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt skolas lietotājus");
    } finally {
      setLoading(false);
    }
  }, [schoolId]);

  const loadUsersWithoutSchool = useCallback(async () => {
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await api.get("/api/schools/users/without-school/", { params });
      setUsersWithoutSchool(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt lietotājus");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadSchool();
    loadSchoolUsers();
  }, [loadSchool, loadSchoolUsers]);

  useEffect(() => {
    if (showAddUserModal) {
      loadUsersWithoutSchool();
    }
  }, [showAddUserModal, loadUsersWithoutSchool]);

  async function handleAddUserToSchool(userId: number) {
    if (!schoolId) return;
    
    setError("");
    setSuccess("");
    
    try {
      await api.post("/api/schools/add-user/", {
        user_id: userId,
        school_id: schoolId
      });
      setSuccess("Lietotājs veiksmīgi pievienots skolai");
      setShowAddUserModal(false);
      setSearchTerm("");
      loadSchoolUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās pievienot lietotāju skolai");
    }
  }

  async function handleRemoveUserFromSchool(userId: number, userName: string) {
    if (!window.confirm(`Vai tiešām vēlaties noņemt lietotāju "${userName}" no šīs skolas?`)) {
      return;
    }
    
    setError("");
    setSuccess("");
    
    try {
      await api.post("/api/schools/remove-user/", {
        user_id: userId
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

  if (!schoolId) {
    return (
      <div className="min-h-screen bg-brand-bg pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-white text-xl">Kļūda: Nav norādīta skola</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-8">
        <div className="bg-[#252D47] rounded-lg shadow-xl p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {school?.nosaukums || "Skolas lietotāji"}
              </h1>
              {school && (
                <p className="text-gray-400">
                  {school.pasvaldiba && `${school.pasvaldiba} • `}{school.adrese}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {(isAdmin || isTeacher) && (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="px-6 py-3 bg-[#4A90E2] text-white font-semibold rounded-lg hover:bg-[#357ABD] transition-colors"
                >
                  Pievienot lietotāju
                </button>
              )}
              <button
                onClick={() => navigate("/admin/schools")}
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

          {/* Users Table */}
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
                  {schoolUsers
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
                          {(isAdmin || isTeacher) && (
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
              
              {schoolUsers.length === 0 && !loading && (
                <div className="text-center text-white text-xl py-12">
                  Šajā skolā nav lietotāju
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div 
          className="fixed inset-0 bg-[#13182D] bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowAddUserModal(false);
            setSearchTerm("");
          }}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 relative">
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setSearchTerm("");
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors bg-transparent border-none cursor-pointer w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-6">Pievienot lietotāju skolai</h2>

              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Meklēt lietotāju..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-3 pl-12 pr-4 rounded-lg border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  />
                  <img
                    src={require("../static/Magnifying Glass2.png")}
                    alt="Search"
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-96">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">E-pasts</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Vārds, uzvārds</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Lietotāja tips</th>
                      <th className="text-left py-3 px-4 text-gray-700 font-semibold">Darbības</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersWithoutSchool
                      .filter((u) => u.user_type !== "admin") // Filter out admin users
                      .map((u) => {
                      if (!u.id) return null;
                      const fullName = `${u.name || ""} ${u.last_name || ""}`.trim() || "-";
                      const userTypeLabel = u.user_type === "teacher" ? "Skolotājs" : "Lietotājs";
                      
                      return (
                        <tr
                          key={u.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4 text-gray-700">{u.email}</td>
                          <td className="py-3 px-4 text-gray-700">{fullName}</td>
                          <td className="py-3 px-4 text-gray-700">{userTypeLabel}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleAddUserToSchool(u.id!)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-colors"
                            >
                              Pievienot
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {usersWithoutSchool.length === 0 && (
                  <div className="text-center text-gray-500 text-lg py-8">
                    Nav atrasti lietotāji bez skolas
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

