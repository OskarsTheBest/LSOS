import React, { useState, useEffect } from "react";
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

export default function Olympiads() {
  const [currentSlide, setCurrentSlide] = useState(0);
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

  const calculateDaysRemaining = (dateStr: string): number => {
    try {
      const date = parseDate(dateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      const diff = date.getTime() - today.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch {
      return 0;
    }
  };

  // Get unique locations and subjects from loaded olympiads
  const allLocations = Array.from(new Set(olympiads.map(o => o.norisesVieta)));
  const allSubjects = Array.from(new Set(olympiads.map(o => o.prieksmets_nosaukums || "").filter(s => s)));

  // Featured olympiads are the first 3 upcoming olympiads
  const featuredOlympiads = olympiads
    .filter(o => {
      const date = parseDate(o.datums);
      return date >= new Date();
    })
    .sort((a, b) => parseDate(a.datums).getTime() - parseDate(b.datums).getTime())
    .slice(0, 3)
    .map(o => ({
      ...o,
      dateStart: formatDate(o.datums),
      dateEnd: "",
      daysRemaining: calculateDaysRemaining(o.datums),
      type: "Valsts olimpiāde",
      subject: o.prieksmets_nosaukums || "",
      location: o.norisesVieta,
      name: o.nosaukums
    }));

  const nextSlide = () => {
    if (featuredOlympiads.length > 0) {
      setCurrentSlide((prev) => (prev + 1) % featuredOlympiads.length);
    }
  };

  const prevSlide = () => {
    if (featuredOlympiads.length > 0) {
      setCurrentSlide((prev) => (prev - 1 + featuredOlympiads.length) % featuredOlympiads.length);
    }
  };

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
        <h1 className="text-4xl font-bold text-white text-center mb-8 mt-8">
          Aktuālās olimpiādes
        </h1>

        {error && (
          <div className="mb-4 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        {featuredOlympiads.length > 0 && (
          <div className="w-full max-w-5xl mx-auto h-96 relative overflow-hidden rounded-lg shadow-xl mb-12">
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 font-bold py-2 px-4 rounded-r z-20"
            >
              ←
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 hover:bg-opacity-75 text-gray-800 font-bold py-2 px-4 rounded-l z-20"
            >
              →
            </button>

            {featuredOlympiads.map((olympiad, index) => (
              <div
                key={olympiad.id}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
                style={{
                  background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
                }}
              >
                <div className="relative h-full flex items-center justify-between p-8">
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-white text-6xl font-bold">
                      {olympiad.type}
                    </div>
                  </div>

                  <div className="bg-[#252D47] rounded-lg p-6 w-80 shadow-lg">
                    <h3 className="text-white text-xl font-bold mb-4">{olympiad.name}</h3>
                    
                    <div className="space-y-3 text-white text-sm">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{olympiad.dateStart}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{olympiad.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-red-400">Vēl {olympiad.daysRemaining} dienas</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedOlympiad(olympiad);
                        setShowDetailModal(true);
                      }}
                      className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                    >
                      Apskatīt
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {featuredOlympiads.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-gray-400'
                  }`}
                />
              ))}
            </div>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <button
                onClick={() => setShowDetailModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>

              <h2 className="text-3xl font-bold text-[#1B2241] mb-6 text-center">
                {selectedOlympiad.nosaukums}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[#1B2241] text-base leading-relaxed">
                    {selectedOlympiad.apraksts || "Nav pieejams apraksts."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-[#1B2241] font-medium">{selectedOlympiad.prieksmets_nosaukums || "-"}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[#1B2241] font-medium">{selectedOlympiad.norisesVieta}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[#1B2241] font-medium">{formatDate(selectedOlympiad.datums)}</span>
                  </div>

                  {selectedOlympiad.maxDalibnieki && (
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-[#1B2241] font-medium">Maks. dalībnieki: {selectedOlympiad.maxDalibnieki}</span>
                    </div>
                  )}

                  {selectedOlympiad.organizetajs && (
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-[#1B2241] font-medium">{selectedOlympiad.organizetajs}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
                >
                  Reģistrēties
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
