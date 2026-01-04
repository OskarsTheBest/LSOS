import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../AuthContext";
import api from "../axios";

interface OlympiadResult {
  id: number;
  nosaukums: string;
  datums: string;
  prieksmets_nosaukums?: string;
  norisesVieta: string;
  organizetajs: string;
}

interface ResultEntry {
  id: number;
  vieta: number;
  lietotajs_name: string;
  punktuSkaits: number;
  percentage?: number;
}

export default function Results() {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<"closest" | "all">("all");
  const [sortBy, setSortBy] = useState<"a-z" | "z-a" | "newest" | "oldest">("a-z");
  const [selectedOlympiad, setSelectedOlympiad] = useState<OlympiadResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [olympiads, setOlympiads] = useState<OlympiadResult[]>([]);
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [error, setError] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState<"url" | "file">("url");
  const [importUrl, setImportUrl] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOlympiadId, setImportOlympiadId] = useState<number | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState("");
  const [allOlympiadsForImport, setAllOlympiadsForImport] = useState<OlympiadResult[]>([]);
  
  const isAdmin = user?.user_type === "admin";

  useEffect(() => {
    if (showImportModal && isAdmin) {
      loadAllOlympiadsForImport();
    }
  }, [showImportModal, isAdmin]);

  const loadAllOlympiadsForImport = async () => {
    try {
      const res = await api.get("/api/olympiads/");
      setAllOlympiadsForImport(res.data);
    } catch (err: any) {
      setError("Neizdevās ielādēt olimpiādes");
    }
  };

  useEffect(() => {
    loadOlympiads();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOlympiads();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (selectedOlympiad && showResultsModal) {
      loadResults(selectedOlympiad.id);
    }
  }, [selectedOlympiad, showResultsModal]);

  const loadOlympiads = async () => {
    setLoading(true);
    setError("");
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const res = await api.get("/api/olympiads/", { params });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const completedOlympiads = res.data.filter((olympiad: any) => {
        const olympiadDate = new Date(olympiad.datums);
        olympiadDate.setHours(0, 0, 0, 0);
        return olympiadDate < today;
      });
      
      setOlympiads(completedOlympiads);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt olimpiādes");
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async (olympiadId: number) => {
    setLoadingResults(true);
    setError("");
    try {
      const res = await api.get(`/api/olympiads/${olympiadId}/results/`);
     
      if (res.data && res.data.length > 0) {
        const maxPoints = Math.max(...res.data.map((r: any) => r.punktuSkaits));
        const resultsWithPercentage = res.data.map((result: any) => ({
          ...result,
          percentage: Math.round((result.punktuSkaits / maxPoints) * 100)
        }));
        setResults(resultsWithPercentage);
      } else {
        setResults([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt rezultātus");
      setResults([]);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleViewResults = (olympiad: OlympiadResult) => {
    setSelectedOlympiad(olympiad);
    setShowResultsModal(true);
  };

  const isUserResult = (resultName: string): boolean => {
    if (!user) return false;
    const fullName = `${user.name || ""} ${user.last_name || ""}`.trim();
    return resultName.toLowerCase().includes(fullName.toLowerCase()) || 
           fullName.toLowerCase().includes(resultName.toLowerCase());
  };

  const censorName = (fullName: string): string => {
    if (!fullName || fullName.trim() === "") return "N.N";
    
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      const firstName = parts[0];
      const lastName = parts[parts.length - 1];
      const firstInitial = firstName.charAt(0).toUpperCase();
      const lastInitial = lastName.charAt(0).toUpperCase();
      return `${firstInitial}.${lastInitial}`;
    } else if (parts.length === 1) {
      return `${parts[0].charAt(0).toUpperCase()}.`;
    }
    return "N.N";
  };

  const getDisplayName = (resultName: string): string => {
    if (isUserResult(resultName)) {
      
      return resultName;
    }
    
    return censorName(resultName);
  };

  const removeDiacritics = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const parseDate = (dateStr: string): Date => {
    try {
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  };

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  // Get unique locations and subjects from loaded olympiads
  const allLocations = Array.from(new Set(olympiads.map(o => o.norisesVieta)));
  const allSubjects = Array.from(new Set(olympiads.map(o => o.prieksmets_nosaukums || "").filter(s => s)));

  // Filter olympiads - hidden filter: only show completed (those with results)
  let filteredOlympiads = olympiads.filter((olympiad) => {
    if (searchTerm) {
      const searchNormalized = removeDiacritics(searchTerm);
      const nameNormalized = removeDiacritics(olympiad.nosaukums);
      const subjectNormalized = removeDiacritics(olympiad.prieksmets_nosaukums || "");
      
      if (!nameNormalized.includes(searchNormalized) && 
          !subjectNormalized.includes(searchNormalized)) {
        return false;
      }
    }

    if (selectedLocations.length > 0 && !selectedLocations.includes(olympiad.norisesVieta)) {
      return false;
    }

    if (selectedSubjects.length > 0 && !selectedSubjects.includes(olympiad.prieksmets_nosaukums || "")) {
      return false;
    }

    if (dateFilter === "closest") {
      const today = new Date();
      const olympiadDate = parseDate(olympiad.datums);
      return olympiadDate >= today && olympiadDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return true;
  });

  filteredOlympiads = [...filteredOlympiads].sort((a, b) => {
    switch (sortBy) {
      case "a-z":
        return a.nosaukums.localeCompare(b.nosaukums, "lv");
      case "z-a":
        return b.nosaukums.localeCompare(a.nosaukums, "lv");
      case "newest":
        return parseDate(b.datums).getTime() - parseDate(a.datums).getTime();
      case "oldest":
        return parseDate(a.datums).getTime() - parseDate(b.datums).getTime();
      default:
        return 0;
    }
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-white">
              Olimpiādes rezultāti
            </h1>
            {isAdmin && (
              <button
                onClick={() => setShowImportModal(true)}
                className="px-6 py-3 bg-brand-gold text-black font-semibold rounded-lg hover:bg-brand-gold-dark transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Importēt rezultātus
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-4 mb-8">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Meklēt olimpiādes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-3 pl-12 pr-4 rounded-lg bg-[#4A90E2] text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
              <img
                src={require("../static/Magnifying Glass.png")}
                alt="Search"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              />
            </div>
            <div className="relative filter-modal-container">
              <button
                onClick={() => setShowFilterModal(!showFilterModal)}
                className="px-6 py-3 rounded-lg bg-[#4A90E2] text-white font-semibold hover:bg-[#357ABD] transition-colors flex items-center gap-2"
              >
                Filtrēt / Kārtot
                <img
                  src={require("../static/Filter.png")}
                  alt="Filter"
                  className="w-5 h-5"
                />
              </button>

              {showFilterModal && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#252D47] rounded-lg shadow-xl p-6 z-50 border border-[#3A4562]">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-white font-semibold mb-3">Datuma filtrs</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input
                            type="radio"
                            name="dateFilter"
                            value="all"
                            checked={dateFilter === "all"}
                            onChange={(e) => setDateFilter(e.target.value as "all" | "closest")}
                            className="w-4 h-4 text-brand-gold"
                          />
                          Visas olimpiādes
                        </label>
                        <label className="flex items-center gap-2 text-white cursor-pointer">
                          <input
                            type="radio"
                            name="dateFilter"
                            value="closest"
                            checked={dateFilter === "closest"}
                            onChange={(e) => setDateFilter(e.target.value as "all" | "closest")}
                            className="w-4 h-4 text-brand-gold"
                          />
                          Tuvākās datuma olimpiādes
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-3">Atrašanās vieta</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {allLocations.map((location) => (
                          <label key={location} className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedLocations.includes(location)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLocations([...selectedLocations, location]);
                                } else {
                                  setSelectedLocations(selectedLocations.filter(l => l !== location));
                                }
                              }}
                              className="w-4 h-4 text-brand-gold rounded"
                            />
                            {location}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-3">Priekšmets</label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {allSubjects.map((subject) => (
                          <label key={subject} className="flex items-center gap-2 text-white cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSubjects.includes(subject)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubjects([...selectedSubjects, subject]);
                                } else {
                                  setSelectedSubjects(selectedSubjects.filter(s => s !== subject));
                                }
                              }}
                              className="w-4 h-4 text-brand-gold rounded"
                            />
                            {subject}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-white font-semibold mb-3">Kārtošanas veids</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as "a-z" | "z-a" | "newest" | "oldest")}
                        className="w-full p-2 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                      >
                        <option value="a-z">A-Z</option>
                        <option value="z-a">Z-A</option>
                        <option value="newest">Jaunākā olimpiāde</option>
                        <option value="oldest">Vecākā olimpiāde</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedLocations([]);
                        setSelectedSubjects([]);
                        setDateFilter("all");
                        setSortBy("a-z");
                      }}
                      className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Notīrīt filtrus
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-white text-xl py-12">Ielādē...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3A4562]">
                    <th className="text-left py-4 px-4 text-white font-semibold">
                      Olimpiādes nosaukums
                    </th>
                    <th className="text-left py-4 px-4 text-white font-semibold">
                      Rezultāti
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOlympiads.map((olympiad) => (
                    <tr
                      key={olympiad.id}
                      className="border-b border-[#3A4562] hover:bg-[#2A3454] transition-colors"
                    >
                      <td className="py-4 px-4 text-white">
                        {olympiad.nosaukums}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleViewResults(olympiad)}
                          className="text-green-500 hover:text-green-400 font-medium transition-colors cursor-pointer bg-transparent border-none"
                        >
                          Apskatīt Rezultātu
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredOlympiads.length === 0 && !loading && (
                <div className="text-center text-white text-xl py-12">
                  Nav atrastu olimpiāžu
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showResultsModal && selectedOlympiad && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => setShowResultsModal(false)}
        >
          <div 
            className="bg-[#252D47] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 relative">
              <button
                onClick={() => setShowResultsModal(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold transition-colors bg-transparent border-none cursor-pointer w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>

              <h2 className="text-3xl font-bold text-white mb-6 text-center">
                {selectedOlympiad.nosaukums}
              </h2>

              {loadingResults ? (
                <div className="text-center text-white text-xl py-12">Ielādē rezultātus...</div>
              ) : (
                <div className="bg-[#1B2241] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#3A4562]">
                        <th className="text-left py-4 px-4 text-white font-semibold">
                          Vieta
                        </th>
                        <th className="text-left py-4 px-4 text-white font-semibold">
                          Vārds.Uzvārds
                        </th>
                        <th className="text-left py-4 px-4 text-white font-semibold">
                          Punktu skaits, %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => {
                        const isHighlighted = isUserResult(result.lietotajs_name);
                        return (
                          <tr
                            key={result.id}
                            className={`border-b border-[#3A4562] transition-colors ${
                              isHighlighted 
                                ? "bg-[#2A3454]" 
                                : "hover:bg-[#2A3454]"
                            }`}
                          >
                            <td className="py-4 px-4 text-white">
                              {result.vieta}
                            </td>
                            <td className={`py-4 px-4 ${isHighlighted ? "text-brand-gold font-semibold" : "text-white"}`}>
                              {getDisplayName(result.lietotajs_name)}
                            </td>
                            <td className="py-4 px-4 text-white">
                              {result.punktuSkaits}p {result.percentage ? `${result.percentage}%` : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {results.length === 0 && !loadingResults && (
                    <div className="text-center text-white text-xl py-12">
                      Nav pieejami rezultāti
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="px-6 py-3 bg-brand-gold text-black rounded-lg font-semibold hover:bg-brand-gold-dark transition-colors"
                >
                  Aizvērt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Results Modal */}
      {showImportModal && (
        <div 
          className="fixed inset-0 bg-[#13182D] bg-opacity-90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowImportModal(false);
            setImportUrl("");
            setImportFile(null);
            setImportOlympiadId(null);
            setImportType("url");
            setError("");
            setImportSuccess("");
          }}
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 relative">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportUrl("");
                  setImportFile(null);
                  setImportOlympiadId(null);
                  setImportType("url");
                  setError("");
                  setImportSuccess("");
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-3xl font-bold transition-colors bg-transparent border-none cursor-pointer w-10 h-10 flex items-center justify-center"
              >
                ×
              </button>

              <h2 className="text-2xl font-bold text-gray-800 mb-6">Importēt rezultātus</h2>

              {importSuccess && (
                <div className="mb-4 text-green-600 text-sm bg-green-100 p-3 rounded-lg">
                  {importSuccess}
                </div>
              )}

              {error && (
                <div className="mb-4 text-red-600 text-sm bg-red-100 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Olympiad Selection */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Olimpiāde</label>
                  <select
                    value={importOlympiadId || ""}
                    onChange={(e) => setImportOlympiadId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  >
                    <option value="">-- Izvēlieties olimpiādi --</option>
                    {allOlympiadsForImport.map((olympiad) => (
                      <option key={olympiad.id} value={olympiad.id}>
                        {olympiad.nosaukums}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Import Type Selection */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">Importa veids</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importType"
                        value="url"
                        checked={importType === "url"}
                        onChange={(e) => setImportType(e.target.value as "url" | "file")}
                        className="w-4 h-4 text-brand-gold"
                      />
                      <span className="text-gray-700">URL</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="importType"
                        value="file"
                        checked={importType === "file"}
                        onChange={(e) => setImportType(e.target.value as "url" | "file")}
                        className="w-4 h-4 text-brand-gold"
                      />
                      <span className="text-gray-700">JSON fails</span>
                    </label>
                  </div>
                </div>

                {/* URL Input */}
                {importType === "url" && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3">JSON URL</label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://example.com/results.json"
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                    <p className="text-gray-500 text-sm mt-2">
                      URL jāatgriež JSON formātā ar struktūru: {"{"}"results": [{"{"}"vieta": 1, "punktuSkaits": 100, "lietotajs_email": "user@example.com", "rezultataDatums": "2025-01-01"{"}"}]{"}"}
                    </p>
                  </div>
                )}

                {/* File Input */}
                {importType === "file" && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3">JSON fails</label>
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImportFile(file);
                        }
                      }}
                      className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-gold"
                    />
                    {importFile && (
                      <p className="text-gray-600 text-sm mt-2">Izvēlēts fails: {importFile.name}</p>
                    )}
                    <p className="text-gray-500 text-sm mt-2">
                      JSON faila struktūra: {"{"}"results": [{"{"}"vieta": 1, "punktuSkaits": 100, "lietotajs_email": "user@example.com", "rezultataDatums": "2025-01-01"{"}"}]{"}"}
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={async () => {
                      if (!importOlympiadId) {
                        setError("Lūdzu, izvēlieties olimpiādi");
                        return;
                      }

                      if (importType === "url" && !importUrl) {
                        setError("Lūdzu, ievadiet URL");
                        return;
                      }

                      if (importType === "file" && !importFile) {
                        setError("Lūdzu, izvēlieties failu");
                        return;
                      }

                      setImportLoading(true);
                      setError("");
                      setImportSuccess("");

                      try {
                        const payload: any = {
                          olympiad_id: importOlympiadId,
                          import_type: importType
                        };

                        if (importType === "url") {
                          payload.url = importUrl;
                        } else if (importType === "file" && importFile) {
                          const fileText = await importFile.text();
                          payload.results_data = fileText;
                        }

                        const res = await api.post("/api/results/import/", payload);
                        setImportSuccess(res.data.detail || "Rezultāti veiksmīgi importēti");
                        
                        // Reload olympiads to show new results
                        setTimeout(() => {
                          loadOlympiads();
                          setShowImportModal(false);
                          setImportUrl("");
                          setImportFile(null);
                          setImportOlympiadId(null);
                          setImportType("url");
                        }, 2000);
                      } catch (err: any) {
                        setError(err.response?.data?.detail || "Neizdevās importēt rezultātus");
                      } finally {
                        setImportLoading(false);
                      }
                    }}
                    disabled={importLoading}
                    className="px-6 py-3 bg-brand-gold text-black rounded-lg font-semibold hover:bg-brand-gold-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {importLoading ? "Importē..." : "Importēt"}
                  </button>
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportUrl("");
                      setImportFile(null);
                      setImportOlympiadId(null);
                      setImportType("url");
                      setError("");
                      setImportSuccess("");
                    }}
                    className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
                  >
                    Atcelt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
