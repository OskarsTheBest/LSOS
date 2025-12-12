import React, { useState, useEffect } from "react";

interface Olympiad {
  id: number;
  name: string;
  subject: string;
  location: string;
  dateStart: string;
  dateEnd: string;
  daysRemaining: number;
  type: string;
  image?: string;
  description?: string;
  gradeLevel?: string;
  applicationDeadline?: string;
  organizer?: string;
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

  const featuredOlympiads: Olympiad[] = [
    {
      id: 1,
      name: "Matemātikas valsts olimpiāde",
      subject: "Matemātika",
      location: "Rīgas 1.ģimnāzijā",
      dateStart: "20.01.26",
      dateEnd: "02.02.26",
      daysRemaining: 6,
      type: "Valsts olimpiāde"
    },
    {
      id: 2,
      name: "Fizikas valsts olimpiāde",
      subject: "Fizika",
      location: "Rīgas Tehniskajā universitātē",
      dateStart: "15.02.26",
      dateEnd: "20.02.26",
      daysRemaining: 20,
      type: "Valsts olimpiāde"
    },
    {
      id: 3,
      name: "Ķīmijas valsts olimpiāde",
      subject: "Ķīmija",
      location: "Latvijas Universitātē",
      dateStart: "10.03.26",
      dateEnd: "15.03.26",
      daysRemaining: 45,
      type: "Valsts olimpiāde"
    }
  ];

  const allOlympiads: Olympiad[] = [
    {
      id: 4,
      name: "Latvijas valsts 57. vācu olimpiāde",
      subject: "Vācu valoda",
      location: "Attālināti",
      dateStart: "05.02.2026",
      dateEnd: "",
      daysRemaining: 15,
      type: "Valsts olimpiāde",
      description: "Valsts vācu valodas 57. olimpiāde apvieno valodas entuziastus no visas Latvijas, lai pārbaudītu viņu prasmes lasīšanā, klausīšanās izpratnē, gramatikā un radošajā rakstīšanā. Olimpiāde veicina skolēnu interesi par vācu valodu un kultūru, kā arī sniedz iespēju demonstrēt zināšanas augstākā līmenī nacionālā mērogā. Organizē VISC",
      gradeLevel: "10-12.klase",
      applicationDeadline: "05.01.2026",
      organizer: "VISC"
    },
    {
      id: 5,
      name: "Angļu valodas olimpiāde",
      subject: "Angļu valoda",
      location: "Rīgas 2.ģimnāzijā",
      dateStart: "12.02.2026",
      dateEnd: "",
      daysRemaining: 22,
      type: "Reģionālā olimpiāde"
    },
    {
      id: 6,
      name: "Bioloģijas olimpiāde",
      subject: "Bioloģija",
      location: "Daugavpils Universitātē",
      dateStart: "18.02.2026",
      dateEnd: "",
      daysRemaining: 28,
      type: "Valsts olimpiāde"
    },
    {
      id: 7,
      name: "Vēstures olimpiāde",
      subject: "Vēsture",
      location: "Rīgas 1.ģimnāzijā",
      dateStart: "25.02.2026",
      dateEnd: "",
      daysRemaining: 35,
      type: "Reģionālā olimpiāde"
    }
  ];

  const allLocations = Array.from(new Set(allOlympiads.map(o => o.location)));
  const allSubjects = Array.from(new Set(allOlympiads.map(o => o.subject)));

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredOlympiads.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredOlympiads.length) % featuredOlympiads.length);
  };

  const removeDiacritics = (str: string): string => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const parseDate = (dateStr: string): Date => {
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const year = parts[2].length === 2 ? 2000 + parseInt(parts[2]) : parseInt(parts[2]);
      return new Date(year, month, day);
    }
    return new Date();
  };

  let filteredOlympiads = allOlympiads.filter((olympiad) => {
    if (searchTerm) {
      const searchNormalized = removeDiacritics(searchTerm);
      const nameNormalized = removeDiacritics(olympiad.name);
      const subjectNormalized = removeDiacritics(olympiad.subject);
      
      if (!nameNormalized.includes(searchNormalized) && 
          !subjectNormalized.includes(searchNormalized)) {
        return false;
      }
    }

    if (selectedLocations.length > 0 && !selectedLocations.includes(olympiad.location)) {
      return false;
    }

    if (selectedSubjects.length > 0 && !selectedSubjects.includes(olympiad.subject)) {
      return false;
    }

    if (dateFilter === "closest") {
      const today = new Date();
      const olympiadDate = parseDate(olympiad.dateStart);
      return olympiadDate >= today && olympiadDate <= new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    return true;
  });

  filteredOlympiads = [...filteredOlympiads].sort((a, b) => {
    switch (sortBy) {
      case "a-z":
        return a.name.localeCompare(b.name, "lv");
      case "z-a":
        return b.name.localeCompare(a.name, "lv");
      case "newest":
        return parseDate(b.dateStart).getTime() - parseDate(a.dateStart).getTime();
      case "oldest":
        return parseDate(a.dateStart).getTime() - parseDate(b.dateStart).getTime();
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
                      <span>{olympiad.dateStart} līdz {olympiad.dateEnd}</span>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOlympiads.map((olympiad) => (
            <div
              key={olympiad.id}
              className="bg-[#252D47] rounded-lg overflow-hidden shadow-lg flex"
            >
              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-white text-xl font-bold mb-2">{olympiad.name}</h3>
                  <p className="text-gray-300 mb-2">{olympiad.subject}</p>
                  <p className="text-gray-300 mb-2">{olympiad.location}</p>
                  <p className="text-gray-300 mb-4">{olympiad.dateStart}</p>
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
                {olympiad.id === 4 ? (
                  <img
                    src={require("../static/Rectangle 23.png")}
                    alt="Baltische Deutscholympiade 2026"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center">
                    <div className="text-black text-sm font-bold mb-2">Olimpiāde</div>
                    <div className="text-black text-xs">2026</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredOlympiads.length === 0 && (
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

              {selectedOlympiad.id === 4 && (
                <div className="mb-6 flex justify-center">
                  <img
                    src={require("../static/Rectangle 23.png")}
                    alt="Baltische Deutscholympiade"
                    className="h-32 object-contain"
                  />
                </div>
              )}

              <h2 className="text-3xl font-bold text-[#1B2241] mb-6 text-center">
                {selectedOlympiad.name}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[#1B2241] text-base leading-relaxed">
                    {selectedOlympiad.description || "Nav pieejams apraksts."}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-[#1B2241] font-medium">{selectedOlympiad.subject}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[#1B2241] font-medium">{selectedOlympiad.location}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[#1B2241] font-medium">{selectedOlympiad.dateStart}</span>
                  </div>

                  {selectedOlympiad.gradeLevel && (
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-[#1B2241]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="text-[#1B2241] font-medium">{selectedOlympiad.gradeLevel}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedOlympiad.applicationDeadline && (
                <div className="mt-6 text-center">
                  <p className="text-[#1B2241] font-semibold">
                    Pieteikties līdz <span className="font-bold">{selectedOlympiad.applicationDeadline}</span>
                  </p>
                </div>
              )}

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
