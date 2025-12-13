import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import api from "../axios";

interface Prieksmets {
  id: number;
  nosaukums: string;
  kategorija: string;
}

interface Olympiad {
  id: number;
  nosaukums: string;
  datums: string;
  maxDalibnieki?: number;
  apraksts?: string;
  norisesVieta: string;
  organizetajs: string;
  prieksmets: number;
  prieksmets_nosaukums?: string;
  prieksmets_kategorija?: string;
}

export default function OlympiadsList() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "name" | "subject">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);
  const [showOlympiadModal, setShowOlympiadModal] = useState(false);
  const [olympiadFormData, setOlympiadFormData] = useState({
    nosaukums: "",
    datums: "",
    maxDalibnieki: "",
    apraksts: "",
    norisesVieta: "",
    organizetajs: "",
    prieksmets: ""
  });
  const [prieksmeti, setPrieksmeti] = useState<Prieksmets[]>([]);

  const isAdmin = user?.user_type === "admin";

  const loadOlympiads = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await api.get("/api/olympiads/", { params });
      setOlympiads(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt olimpiādes");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  const loadPrieksmeti = useCallback(async () => {
    try {
      const res = await api.get("/api/prieksmeti/");
      setPrieksmeti(res.data);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    }
  }, []);

  useEffect(() => {
    loadOlympiads();
    loadPrieksmeti();
  }, [loadOlympiads, loadPrieksmeti]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOlympiads();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, loadOlympiads]);

  function handleViewOlympiad(olympiad: Olympiad) {
    setSelectedOlympiad(olympiad);
    setOlympiadFormData({
      nosaukums: olympiad.nosaukums,
      datums: olympiad.datums.split('T')[0],
      maxDalibnieki: olympiad.maxDalibnieki?.toString() || "",
      apraksts: olympiad.apraksts || "",
      norisesVieta: olympiad.norisesVieta,
      organizetajs: olympiad.organizetajs,
      prieksmets: olympiad.prieksmets.toString()
    });
    setShowOlympiadModal(true);
    setError("");
    setSuccess("");
  }

  async function handleSaveOlympiadChanges() {
    if (!selectedOlympiad) return;
    
    setError("");
    setSuccess("");
    
    try {
      await api.patch(`/api/olympiads/${selectedOlympiad.id}/update/`, {
        ...olympiadFormData,
        maxDalibnieki: olympiadFormData.maxDalibnieki ? parseInt(olympiadFormData.maxDalibnieki) : null,
        prieksmets: parseInt(olympiadFormData.prieksmets)
      });
      setSuccess("Olimpiāde veiksmīgi atjaunināta");
      setShowOlympiadModal(false);
      setSelectedOlympiad(null);
      loadOlympiads();
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.detail || errorData?.nosaukums?.[0] || "Neizdevās atjaunināt olimpiādi");
    }
  }

  async function handleDeleteOlympiad(olympiadId: number, olympiadName: string) {
    if (!window.confirm(`Vai tiešām vēlaties dzēst olimpiādi "${olympiadName}"?`)) {
      return;
    }

    setError("");
    setSuccess("");
    
    try {
      await api.delete(`/api/olympiads/${olympiadId}/delete/`);
      setSuccess("Olimpiāde veiksmīgi dzēsta");
      setShowOlympiadModal(false);
      setSelectedOlympiad(null);
      loadOlympiads();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās dzēst olimpiādi");
    }
  }

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateString;
    }
  }

  // Sort olympiads
  const sortedOlympiads = [...olympiads].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        const dateA = new Date(a.datums).getTime();
        const dateB = new Date(b.datums).getTime();
        comparison = dateA - dateB;
        break;
      case "name":
        comparison = (a.nosaukums || "").localeCompare(b.nosaukums || "", "lv");
        break;
      case "subject":
        comparison = (a.prieksmets_nosaukums || "").localeCompare(b.prieksmets_nosaukums || "", "lv");
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
              <h1 className="text-2xl font-bold text-black">Olimpiādes saraksts</h1>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin/create-olympiad")}
                  className="px-6 py-3 bg-[#4A90E2] text-white font-semibold rounded-lg hover:bg-[#357ABD] transition-colors"
                >
                  Jauna olimpiāde
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
                          onChange={(e) => setSortBy(e.target.value as "date" | "name" | "subject")}
                          className="w-full p-2 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                        >
                          <option value="date">Datums</option>
                          <option value="name">Nosaukums</option>
                          <option value="subject">Priekšmets</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-white font-semibold mb-3">Kārtība</label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="radio"
                              name="sortOrder"
                              value="desc"
                              checked={sortOrder === "desc"}
                              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                              className="w-4 h-4 text-brand-gold"
                            />
                            Dilšošā (Jaunākās vispirms)
                          </label>
                          <label className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="radio"
                              name="sortOrder"
                              value="asc"
                              checked={sortOrder === "asc"}
                              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                              className="w-4 h-4 text-brand-gold"
                            />
                            Augošā (Vecākās vispirms)
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
                  placeholder="Meklēt olimpiādi..."
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

          {/* Table */}
          {loading ? (
            <div className="text-center text-white text-xl py-12">Ielādē...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3A4562]">
                    <th className="text-left py-4 px-4 text-white font-semibold">Nosaukums</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Datums</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Priekšmets</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Norises vieta</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Organizētājs</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Max dalībnieki</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Darbības</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOlympiads.map((olympiad) => (
                    <tr
                      key={olympiad.id}
                      className="border-b border-[#3A4562] hover:bg-[#2A3454] transition-colors"
                    >
                      <td className="py-4 px-4 text-white">{olympiad.nosaukums}</td>
                      <td className="py-4 px-4 text-white">{formatDate(olympiad.datums)}</td>
                      <td className="py-4 px-4 text-white">{olympiad.prieksmets_nosaukums || "-"}</td>
                      <td className="py-4 px-4 text-white">{olympiad.norisesVieta}</td>
                      <td className="py-4 px-4 text-white">{olympiad.organizetajs}</td>
                      <td className="py-4 px-4 text-white">{olympiad.maxDalibnieki || "-"}</td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewOlympiad(olympiad)}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-colors"
                          >
                            Apskatīt
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {sortedOlympiads.length === 0 && !loading && (
                <div className="text-center text-white text-xl py-12">
                  Nav atrastas olimpiādes
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Olympiad Detail Modal */}
      {showOlympiadModal && selectedOlympiad && (
        <div 
          className="fixed inset-0 bg-[#13182D] bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowOlympiadModal(false)}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 relative">
              <button
                onClick={() => setShowOlympiadModal(false)}
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
                    value={olympiadFormData.nosaukums}
                    onChange={(e) => setOlympiadFormData({ ...olympiadFormData, nosaukums: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Datums */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Datums</label>
                  <input
                    type="date"
                    value={olympiadFormData.datums}
                    onChange={(e) => setOlympiadFormData({ ...olympiadFormData, datums: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Priekšmets */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Priekšmets</label>
                  <select
                    value={olympiadFormData.prieksmets}
                    onChange={(e) => setOlympiadFormData({ ...olympiadFormData, prieksmets: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">-- Izvēlieties priekšmetu --</option>
                    {prieksmeti.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nosaukums} ({p.kategorija})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Norises vieta */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Norises vieta</label>
                  <input
                    type="text"
                    value={olympiadFormData.norisesVieta}
                    onChange={(e) => setOlympiadFormData({ ...olympiadFormData, norisesVieta: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Organizētājs */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Organizētājs</label>
                  <input
                    type="text"
                    value={olympiadFormData.organizetajs}
                    onChange={(e) => setOlympiadFormData({ ...olympiadFormData, organizetajs: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Max dalībnieki */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Maksimālais dalībnieku skaits</label>
                  <input
                    type="number"
                    value={olympiadFormData.maxDalibnieki}
                    onChange={(e) => setOlympiadFormData({ ...olympiadFormData, maxDalibnieki: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Apraksts */}
                <div className="border-b border-gray-200 pb-4">
                  <label className="block text-gray-700 font-semibold mb-3">Apraksts</label>
                  <textarea
                    value={olympiadFormData.apraksts}
                    onChange={(e) => setOlympiadFormData({ ...olympiadFormData, apraksts: e.target.value })}
                    disabled={!isAdmin}
                    rows={4}
                    className={`w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold ${
                      !isAdmin ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''
                    }`}
                  />
                </div>

                {/* Action Buttons */}
                {isAdmin && (
                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => selectedOlympiad && handleDeleteOlympiad(selectedOlympiad.id, selectedOlympiad.nosaukums)}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Dzēst olimpiādi
                    </button>
                    
                    <button
                      onClick={handleSaveOlympiadChanges}
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

