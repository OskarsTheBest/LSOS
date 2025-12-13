import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { messages } from "../messages";
import api from "../axios";

interface School {
  id: number;
  nosaukums: string;
  pasvaldiba?: string;
  adrese: string;
}

export default function SchoolsList() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "municipality" | "address">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    nosaukums: "",
    pasvaldiba: "",
    adrese: ""
  });
  
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [schoolFormData, setSchoolFormData] = useState({
    nosaukums: "",
    pasvaldiba: "",
    adrese: ""
  });

  const isAdmin = user?.user_type === "admin";
  const isTeacher = user?.user_type === "teacher";

  const loadSchools = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await api.get("/api/schools/", { params });
      setSchools(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt skolas");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadSchools();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadSchools]);

  async function handleCreateSchool(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!createFormData.nosaukums) {
      setError("Nosaukums ir obligāts");
      return;
    }
    if (!createFormData.adrese) {
      setError("Adrese ir obligāta");
      return;
    }

    try {
      await api.post("/api/schools/create/", createFormData);
      setSuccess("Skola veiksmīgi izveidota");
      setShowCreateForm(false);
      setCreateFormData({
        nosaukums: "",
        pasvaldiba: "",
        adrese: ""
      });
      loadSchools();
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.detail || errorData?.nosaukums?.[0] || errorData?.adrese?.[0] || "Neizdevās izveidot skolu");
    }
  }

  function handleViewSchool(school: School) {
    setSelectedSchool(school);
    setSchoolFormData({
      nosaukums: school.nosaukums,
      pasvaldiba: school.pasvaldiba || "",
      adrese: school.adrese
    });
    setShowSchoolModal(true);
    setError("");
    setSuccess("");
  }

  async function handleSaveSchoolChanges() {
    if (!selectedSchool) return;
    
    setError("");
    setSuccess("");
    
    try {
      await api.patch(`/api/schools/${selectedSchool.id}/update/`, schoolFormData);
      setSuccess("Skola veiksmīgi atjaunināta");
      setShowSchoolModal(false);
      setSelectedSchool(null);
      loadSchools();
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.detail || errorData?.nosaukums?.[0] || errorData?.adrese?.[0] || "Neizdevās atjaunināt skolu");
    }
  }

  async function handleDeleteSchool(schoolId: number, schoolName: string) {
    if (!window.confirm(`Vai tiešām vēlaties dzēst skolu "${schoolName}"?`)) {
      return;
    }

    setError("");
    setSuccess("");
    
    try {
      await api.delete(`/api/schools/${schoolId}/delete/`);
      setSuccess("Skola veiksmīgi dzēsta");
      setShowSchoolModal(false);
      setSelectedSchool(null);
      loadSchools();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās dzēst skolu");
    }
  }

  // Sort schools
  const sortedSchools = [...schools].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "name":
        comparison = (a.nosaukums || "").localeCompare(b.nosaukums || "", "lv");
        break;
      case "municipality":
        comparison = (a.pasvaldiba || "").localeCompare(b.pasvaldiba || "", "lv");
        break;
      case "address":
        comparison = (a.adrese || "").localeCompare(b.adrese || "", "lv");
        break;
    }
    
    return sortOrder === "asc" ? comparison : -comparison;
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
              <h1 className="text-2xl font-bold text-black">Skolas saraksts</h1>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {isAdmin && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="px-6 py-3 bg-[#4A90E2] text-white font-semibold rounded-lg hover:bg-[#357ABD] transition-colors"
                >
                  Jauna skola
                </button>
              )}
              
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
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as "name" | "municipality" | "address")}
                          className="w-full p-2 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                        >
                          <option value="name">Nosaukums</option>
                          <option value="municipality">Pilsēta/Pasvaldība</option>
                          <option value="address">Adrese</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white font-semibold mb-3">Kārtība</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="radio"
                              name="sortOrder"
                              value="asc"
                              checked={sortOrder === "asc"}
                              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                              className="w-4 h-4 text-brand-gold"
                            />
                            Augošā (A-Z)
                          </label>
                          <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="radio"
                              name="sortOrder"
                              value="desc"
                              checked={sortOrder === "desc"}
                              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                              className="w-4 h-4 text-brand-gold"
                            />
                            Dilšošā (Z-A)
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
                  placeholder="Meklēt skolu..."
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

          {showCreateForm && isAdmin && (
            <div className="mb-6 p-6 bg-[#1B2241] rounded-lg border border-[#3A4562]">
              <h3 className="text-xl font-bold text-white mb-4">Izveidot jaunu skolu</h3>
              <form onSubmit={handleCreateSchool}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-white mb-2 font-medium">Nosaukums *</label>
                    <input
                      type="text"
                      value={createFormData.nosaukums}
                      onChange={(e) => setCreateFormData({ ...createFormData, nosaukums: e.target.value })}
                      required
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      placeholder="Skolas nosaukums"
                    />
                  </div>
                  <div>
                    <label className="block text-white mb-2 font-medium">Pilsēta/Pasvaldība</label>
                    <input
                      type="text"
                      value={createFormData.pasvaldiba}
                      onChange={(e) => setCreateFormData({ ...createFormData, pasvaldiba: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      placeholder="Pilsēta vai pasvaldība"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-white mb-2 font-medium">Adrese *</label>
                    <input
                      type="text"
                      value={createFormData.adrese}
                      onChange={(e) => setCreateFormData({ ...createFormData, adrese: e.target.value })}
                      required
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      placeholder="Pilna adrese"
                    />
                  </div>
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
                    <th className="text-left py-4 px-4 text-white font-semibold">Nosaukums</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Pilsēta/Pasvaldība</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Adrese</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Darbības</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSchools.map((school) => (
                    <tr
                      key={school.id}
                      className="border-b border-[#3A4562] hover:bg-[#2A3454] transition-colors"
                    >
                      <td className="py-4 px-4 text-white">{school.nosaukums}</td>
                      <td className="py-4 px-4 text-white">{school.pasvaldiba || "-"}</td>
                      <td className="py-4 px-4 text-white">{school.adrese}</td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewSchool(school)}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-colors"
                            >
                              Apskatīt
                            </button>
                            {(isAdmin || isTeacher) && (
                              <button
                                onClick={() => navigate(`/admin/schools/${school.id}/users`)}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded transition-colors"
                              >
                                Lietotāji
                              </button>
                            )}
                          </div>
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {sortedSchools.length === 0 && !loading && (
                <div className="text-center text-white text-xl py-12">
                  Nav atrastas skolas
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* School Detail Modal */}
      {showSchoolModal && selectedSchool && (
        <div 
          className="fixed inset-0 bg-[#13182D] bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowSchoolModal(false)}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 relative">
              <button
                onClick={() => setShowSchoolModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors bg-transparent border-none cursor-pointer w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>

              <div className="space-y-6">
                {/* Nosaukums */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Nosaukums</label>
                  <input
                    type="text"
                    value={schoolFormData.nosaukums}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, nosaukums: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Pilsēta/Pasvaldība */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Pilsēta/Pasvaldība</label>
                  <input
                    type="text"
                    value={schoolFormData.pasvaldiba}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, pasvaldiba: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Adrese */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Adrese</label>
                  <input
                    type="text"
                    value={schoolFormData.adrese}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, adrese: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Action Buttons */}
                {isAdmin && (
                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => selectedSchool && handleDeleteSchool(selectedSchool.id, selectedSchool.nosaukums)}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Dzēst skolu
                    </button>
                    
                    <button
                      onClick={handleSaveSchoolChanges}
                      className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Saglabāt izmaiņas
                    </button>
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

