import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import api from "../axios";
import { AuthContext } from "../AuthContext";

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

export default function Olympiads() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<"closest" | "all">("all");
  const [sortBy, setSortBy] = useState<"a-z" | "z-a" | "newest" | "oldest">("a-z");
  const [selectedOlympiad, setSelectedOlympiad] = useState<Olympiad | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [olympiads, setOlympiads] = useState<Olympiad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState("");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    loadOlympiads();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadOlympiads();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const loadOlympiads = async () => {
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

  let filteredOlympiads = olympiads.filter((olympiad) => {
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const olympiadDate = parseDate(olympiad.datums);
    olympiadDate.setHours(0, 0, 0, 0);
    
    if (olympiadDate < today) {
      return false; 
    }
    
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

  const handleRegister = async () => {
    if (!user) {
      setRegistrationError("Lūdzu, piesakieties, lai reģistrētos olimpiādei");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      return;
    }

    if (!selectedOlympiad) return;

    setRegistering(true);
    setRegistrationError("");
    setRegistrationSuccess("");

    try {
      await api.post("/api/applications/create/", {
        olympiad_id: selectedOlympiad.id
      });
      setRegistrationSuccess("Jūs esat veiksmīgi reģistrējušies olimpiādei!");
      setTimeout(() => {
        setShowDetailModal(false);
        setRegistrationSuccess("");
        setRegistrationError("");
      }, 2000);
    } catch (err: any) {
      const errorData = err.response?.data;
      setRegistrationError(errorData?.detail || "Neizdevās reģistrēties olimpiādei");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-8">
        <h1 className="text-4xl font-bold text-white text-center mb-8 mt-8">
          Aktuālās olimpiādes
        </h1>

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
              className="w-full p-3 pl-10 pr-10 rounded-lg bg-[#4A90E2] text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div className="relative filter-modal-container">
            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="px-6 py-3 rounded-lg bg-[#4A90E2] text-white font-semibold hover:bg-[#357ABD] transition-colors flex items-center gap-2"
            >
              Filtrēt / Kārtot
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOlympiads.map((olympiad) => (
              <div
                key={olympiad.id}
                className="bg-[#252D47] rounded-lg overflow-hidden shadow-lg flex"
              >
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white text-xl font-bold mb-2">{olympiad.nosaukums}</h3>
                    <p className="text-gray-300 mb-2">{olympiad.prieksmets_nosaukums || "-"}</p>
                    <p className="text-gray-300 mb-2">{olympiad.norisesVieta}</p>
                    <p className="text-gray-300 mb-4">{formatDate(olympiad.datums)}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedOlympiad(olympiad);
                      setShowDetailModal(true);
                      setRegistrationError("");
                      setRegistrationSuccess("");
                    }}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors w-fit"
                  >
                    Apskatīt
                  </button>
                </div>

                <div className="w-48 bg-white border-2 border-gray-300 flex items-center justify-center p-4">
                  <div className="text-center">
                    <div className="text-black text-sm font-bold mb-2">Olimpiāde</div>
                    <div className="text-black text-xs">{formatDate(olympiad.datums)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredOlympiads.length === 0 && !loading && (
          <div className="text-center text-white text-xl mt-12">
            Nav atrastu olimpiāžu
          </div>
        )}
      </div>

      {showDetailModal && selectedOlympiad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => {
          setShowDetailModal(false);
          setRegistrationError("");
          setRegistrationSuccess("");
        }}>
          <div className="bg-[#1B2241] rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => {
                setShowDetailModal(false);
                setRegistrationError("");
                setRegistrationSuccess("");
              }}
              className="absolute top-6 right-6 text-white hover:text-gray-200 text-3xl font-bold z-10"
            >
              ×
            </button>

            {/* Dark Blue Header */}
            <div className="bg-[#1B2241] text-white p-8 rounded-t-lg">
              <h2 className="text-4xl font-bold text-center">
                {selectedOlympiad.nosaukums}
              </h2>
            </div>

            {/* Main Content Area - Two Columns */}
            <div className="flex flex-1 overflow-y-auto min-h-0">
              {/* Left Column - Dark Blue Background with Description */}
              <div className="flex-1 p-10 bg-[#1B2241] flex flex-col">
                <p className="text-white text-lg leading-relaxed flex-1">
                  {selectedOlympiad.apraksts || "Nav pieejams apraksts."}
                </p>
                
                {registrationError && (
                  <div className="mt-4 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                    {registrationError}
                  </div>
                )}

                {registrationSuccess && (
                  <div className="mt-4 text-green-400 text-sm bg-green-900/20 p-3 rounded-lg">
                    {registrationSuccess}
                  </div>
                )}
                
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-12 rounded-lg transition-colors text-lg"
                  >
                    {registering ? "Reģistrējas..." : "Reģistrēties"}
                  </button>
                </div>
              </div>

              {/* Right Column - Dark Blue Background with Info */}
              <div className="w-96 bg-[#1B2241] text-white p-8 flex flex-col">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={require("../static/Book open.png")} 
                      alt="Book" 
                      className="w-8 h-8"
                    />
                    <span className="font-medium text-lg">{selectedOlympiad.prieksmets_nosaukums || "-"}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <img 
                      src={require("../static/location_on.png")} 
                      alt="Location" 
                      className="w-8 h-8"
                    />
                    <span className="font-medium text-lg">{selectedOlympiad.norisesVieta}</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <img 
                      src={require("../static/Calendar.png")} 
                      alt="Calendar" 
                      className="w-8 h-8"
                    />
                    <span className="font-medium text-lg">{formatDate(selectedOlympiad.datums)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
