import React, { useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import api from "../axios";

interface School {
  id: number;
  nosaukums: string;
  pasvaldiba?: string;
  adrese: string;
}

interface Application {
  id: number;
  statuss: string;
  pieteikumaDatums: string;
  lietotajs: number;
  olimpiade: number;
  lietotajs_email: string;
  lietotajs_name?: string;
  lietotajs_last_name?: string;
  lietotajs_skola?: string;
  olimpiade_nosaukums: string;
  olimpiade_datums: string;
}

export default function SchoolApplications() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const isAdmin = user?.user_type === "admin";
  const isTeacher = user?.user_type === "teacher";

  useEffect(() => {
    if (isAdmin) {
      loadSchools();
    } else if (isTeacher && user?.skola) {
      // Teachers automatically see their school
      setSelectedSchoolId(user.skola);
    }
  }, [isAdmin, isTeacher, user]);

  useEffect(() => {
    if (selectedSchoolId) {
      loadApplications();
    }
  }, [selectedSchoolId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedSchoolId) {
        loadApplications();
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedSchoolId]);

  const loadSchools = async () => {
    try {
      const res = await api.get("/api/schools/");
      setSchools(res.data);
    } catch (err: any) {
      setError("Neizdevās ielādēt skolas");
    }
  };

  const loadApplications = async () => {
    if (!selectedSchoolId) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/api/schools/applications/", {
        params: { school_id: selectedSchoolId }
      });
      setApplications(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās ielādēt pieteikumus");
    } finally {
      setLoading(false);
    }
  };

  async function handleUpdateStatus(applicationId: number, newStatus: string) {
    setError("");
    setSuccess("");
    
    try {
      await api.patch("/api/applications/update-status/", {
        application_id: applicationId,
        status: newStatus
      });
      setSuccess("Pieteikuma statuss veiksmīgi atjaunināts");
      loadApplications();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Neizdevās atjaunināt pieteikuma statusu");
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

  function getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case "apstiprināts":
      case "approved":
        return "bg-green-500";
      case "noraidīts":
      case "rejected":
        return "bg-red-500";
      case "gaida":
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  }

  // Filter applications by search term
  const filteredApplications = applications.filter(app => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      app.lietotajs_email.toLowerCase().includes(search) ||
      (app.lietotajs_name && app.lietotajs_name.toLowerCase().includes(search)) ||
      (app.lietotajs_last_name && app.lietotajs_last_name.toLowerCase().includes(search)) ||
      app.olimpiade_nosaukums.toLowerCase().includes(search) ||
      app.statuss.toLowerCase().includes(search)
    );
  });

  const selectedSchool = isAdmin 
    ? schools.find(s => s.id === selectedSchoolId)
    : null;

  return (
    <div className="min-h-screen bg-brand-bg pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-8">
        <div className="bg-[#252D47] rounded-lg shadow-xl p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="px-6 py-3 bg-brand-gold rounded-lg">
              <h1 className="text-2xl font-bold text-black">Skolas pieteikumi</h1>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap">
              {isAdmin && (
                <div className="min-w-[300px]">
                  <select
                    value={selectedSchoolId || ""}
                    onChange={(e) => setSelectedSchoolId(e.target.value ? parseInt(e.target.value) : null)}
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
              )}
              
              {selectedSchoolId && (
                <div className="relative flex-1 min-w-[300px]">
                  <input
                    type="text"
                    placeholder="Meklēt pieteikumus..."
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
              )}
              
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

          {/* School Info for Teachers */}
          {isTeacher && user?.skola && (
            <div className="mb-6 p-4 bg-[#1B2241] rounded-lg border border-[#3A4562]">
              <h2 className="text-xl font-bold text-white mb-2">Jūsu skola</h2>
              <p className="text-gray-300">{user.skola_nosaukums || "Nav norādīta"}</p>
            </div>
          )}

          {/* Applications Table */}
          {!selectedSchoolId ? (
            <div className="text-center text-white text-xl py-12">
              {isAdmin ? "Lūdzu, izvēlieties skolu" : "Nav pieejama skolas informācija"}
            </div>
          ) : loading ? (
            <div className="text-center text-white text-xl py-12">Ielādē...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3A4562]">
                    <th className="text-left py-4 px-4 text-white font-semibold">Lietotājs</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">E-pasts</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Olimpiāde</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Olimpiādes datums</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Pieteikuma datums</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Statuss</th>
                    <th className="text-left py-4 px-4 text-white font-semibold">Darbības</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((app) => {
                    const fullName = `${app.lietotajs_name || ""} ${app.lietotajs_last_name || ""}`.trim() || "-";
                    
                    return (
                      <tr
                        key={app.id}
                        className="border-b border-[#3A4562] hover:bg-[#2A3454] transition-colors"
                      >
                        <td className="py-4 px-4 text-white">{fullName}</td>
                        <td className="py-4 px-4 text-white">{app.lietotajs_email}</td>
                        <td className="py-4 px-4 text-white">{app.olimpiade_nosaukums}</td>
                        <td className="py-4 px-4 text-white">{formatDate(app.olimpiade_datums)}</td>
                        <td className="py-4 px-4 text-white">{formatDate(app.pieteikumaDatums)}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(app.statuss)}`}>
                            {app.statuss}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {(isAdmin || isTeacher) && app.statuss.toLowerCase() !== "apstiprināts" && app.statuss.toLowerCase() !== "approved" && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, "apstiprināts")}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded transition-colors"
                            >
                              Apstiprināt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {filteredApplications.length === 0 && !loading && (
                <div className="text-center text-white text-xl py-12">
                  Nav atrasti pieteikumi
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

