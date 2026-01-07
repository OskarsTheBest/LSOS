import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { messages } from "../messages";
import { validatePassword } from "../utils/passwordValidation";
import api from "../axios";

export default function Profile() {
  const { user, logout, updateProfile, changePassword } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"info" | "applications" | "password" | "teacherPanel" | "adminPanel">("info");
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    number: "",
    school: "",
    user_type: "normal"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        last_name: user.last_name || "",
        number: user.number || "",
        school: user.skola_nosaukums || "Nav norādīta",
        user_type: user.user_type || "normal"
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === "applications" && user) {
      loadApplications();
    }
  }, [activeSection, user]);

  const loadApplications = async () => {
    setLoadingApplications(true);
    try {
      const res = await api.get("/api/applications/");
      const formattedApplications = res.data.map((app: any) => {
        const olympiadDate = app.olimpiade_datums ? new Date(app.olimpiade_datums) : null;
        const today = new Date();
        const hasResult = app.statuss === "Beidzies" && olympiadDate && olympiadDate < today;
        const hasViewLink = app.statuss === "Reģistrēts" || app.statuss === "Apstrādē";
        
        let applicationDateStr = "";
        if (app.pieteikumaDatums) {
          const appDate = new Date(app.pieteikumaDatums);
          applicationDateStr = appDate.toLocaleDateString("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric" });
        }
        
        return {
          id: app.id,
          olympiadName: app.olimpiade_nosaukums || "-",
          applicationDate: applicationDateStr,
          status: app.statuss || "-",
          hasResult,
          hasViewLink,
          olympiadId: app.olimpiade
        };
      });
      setApplications(formattedApplications);
    } catch (err: any) {
      console.error("Failed to load applications:", err);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  if (!user) return <div className="p-5 mt-20 text-white">Loading...</div>;

  const isAdmin = user.user_type === "admin";
  const isTeacher = user.user_type === "teacher";

  async function handleSave() {
    setError("");
    setSuccess("");
    
    const phoneRegex = /^\+?\d{7,15}$/;
    if (formData.number && !phoneRegex.test(formData.number)) {
      setError(messages.E005);
      return;
    }
    
    try {
      const updateData: any = {
        name: formData.name,
        last_name: formData.last_name,
        number: formData.number
      };
      
      // Admins cannot change their own user type
      // Only allow user_type update if it's not the current user
      // (This is for the profile page, so we never allow self-modification of user_type)
      
      await updateProfile(updateData);
      setSuccess(messages.S002("Profils"));
    } catch (err: any) {
      setError(err.response?.data?.detail || err.response?.data?.user_type?.[0] || messages.E004);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError("Visi lauki ir obligāti");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(messages.E008);
      return;
    }

    const passwordValidation = validatePassword(passwordData.newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.error || "Nepareiza parole");
      return;
    }

    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword, passwordData.confirmPassword);
      setSuccess("Parole veiksmīgi nomainīta");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.old_password) {
        setError(Array.isArray(errorData.old_password) ? errorData.old_password[0] : errorData.old_password);
      } else if (errorData?.confirm_password) {
        setError(Array.isArray(errorData.confirm_password) ? errorData.confirm_password[0] : errorData.confirm_password);
      } else {
        setError(errorData?.detail || "Neizdevās nomainīt paroli");
      }
    }
  }

  function handleLogout() {
    alert(messages.S009);
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-20">
      <div className="max-w-6xl mx-auto p-8">
        <div className="flex gap-8">
          <div className="w-64 flex-shrink-0">
            <div className="mb-6 flex justify-center">
              <div className="w-40 h-40 rounded-full bg-[#252D47] border-2 border-[#3A4562] flex items-center justify-center overflow-hidden">
                <img
                  src={require("../static/user2.png")}
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setActiveSection("info")}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors flex items-center gap-3 ${
                  activeSection === "info"
                    ? "bg-[#2A3454] text-white"
                    : "bg-[#252D47] text-gray-300 hover:bg-[#2A3454]"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Konta informācija
              </button>

              <button
                onClick={() => setActiveSection("applications")}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors flex items-center gap-3 ${
                  activeSection === "applications"
                    ? "bg-[#2A3454] text-white"
                    : "bg-[#252D47] text-gray-300 hover:bg-[#2A3454]"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Mani pieteikumi
              </button>

              <button
                onClick={() => setActiveSection("password")}
                className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors flex items-center gap-3 ${
                  activeSection === "password"
                    ? "bg-[#2A3454] text-white"
                    : "bg-[#252D47] text-gray-300 hover:bg-[#2A3454]"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Mainīt paroli
              </button>

              {isTeacher && (
                <button
                  onClick={() => setActiveSection(activeSection === "teacherPanel" ? "info" : "teacherPanel")}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors flex items-center gap-3 ${
                    activeSection === "teacherPanel"
                      ? "bg-brand-gold text-black"
                      : "bg-[#252D47] text-gray-300 hover:bg-[#2A3454]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Skolotāju panelis
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => setActiveSection(activeSection === "adminPanel" ? "info" : "adminPanel")}
                  className={`w-full px-4 py-3 rounded-lg text-left font-medium transition-colors flex items-center gap-3 ${
                    activeSection === "adminPanel"
                      ? "bg-brand-gold text-black"
                      : "bg-[#252D47] text-gray-300 hover:bg-[#2A3454]"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Administratora panelis
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 rounded-lg text-left font-medium transition-colors flex items-center gap-3 bg-[#252D47] text-gray-300 hover:bg-[#2A3454]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Iziet
              </button>
            </div>
          </div>

          <div className="flex-1 bg-[#252D47] rounded-lg p-8">
            {activeSection === "info" && (
              <>
                <h2 className="text-3xl font-bold text-white mb-8">Konta iestatījumi</h2>
                
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

                <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
                  <div>
                    <label className="block text-white mb-2 font-medium">E-pasts</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-gray-400 cursor-not-allowed focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">Vārds</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">Uzvārds</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">Tālruņa numurs</label>
                    <input
                      type="text"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      placeholder=""
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">Skola</label>
                    <input
                      type="text"
                      value={user.skola_nosaukums || "Nav norādīta"}
                      disabled
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-gray-400 cursor-not-allowed focus:outline-none"
                      placeholder="Nav norādīta"
                    />
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block text-white mb-2 font-medium">Lietotāja tips</label>
                      <select
                        value={formData.user_type}
                        onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                        disabled={true}
                        className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-gray-400 cursor-not-allowed focus:outline-none"
                      >
                        <option value="normal">Normal (R)</option>
                        <option value="teacher">Teacher (S)</option>
                        <option value="admin">Admin (A)</option>
                      </select>
                      <p className="text-gray-400 text-sm mt-2">Jūs nevarat mainīt savu lietotāja tipu</p>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-brand-gold text-black rounded-lg font-semibold hover:bg-brand-gold-dark transition-colors"
                    >
                      Saglabāt
                    </button>
                  </div>
                </form>
              </>
            )}

            {activeSection === "applications" && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-8">Konta iestatījumi</h2>
                {loadingApplications ? (
                  <div className="text-center text-white text-xl py-12">Ielādē...</div>
                ) : applications.length === 0 ? (
                  <div className="border border-[#8E8E93] rounded-lg p-12 min-h-[400px] flex items-start justify-center pt-16">
                    <div className="text-center">
                      <div className="text-white text-xl font-bold">Te vēl nav</div>
                      <div className="text-white text-xl font-bold">nekādu pieteikumu</div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-6">Pieteikumi</h3>
                    <div className="border border-[#8E8E93] rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#1B2241] border-b border-[#8E8E93]">
                            <th className="text-left p-4 text-white font-semibold">Olimpiādes nosaukums</th>
                            <th className="text-left p-4 text-white font-semibold">Pieteikuma datums</th>
                            <th className="text-left p-4 text-white font-semibold">Statuss</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applications.map((app) => (
                            <tr key={app.id} className="border-b border-[#8E8E93] last:border-b-0">
                              <td className="p-4 text-white">{app.olympiadName}</td>
                              <td className="p-4 text-white">{app.applicationDate}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-white">{app.status}</span>
                                  {app.hasResult && (
                                    <button
                                      type="button"
                                      className="text-green-400 hover:text-green-300 underline bg-transparent border-none cursor-pointer p-0"
                                      onClick={() => {
                                        navigate("/results");
                                      }}
                                    >
                                      Apskatīt Rezultātu
                                    </button>
                                  )}
                                  {app.hasViewLink && (
                                    <button
                                      type="button"
                                      className="text-green-400 hover:text-green-300 underline bg-transparent border-none cursor-pointer p-0"
                                      onClick={() => {
                                        navigate("/olympiads");
                                      }}
                                    >
                                      Apskatīt Olimpiādi
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeSection === "password" && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-8">Mainīt paroli</h2>
                
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

                <form onSubmit={handlePasswordChange} className="space-y-6 max-w-md">
                  <div>
                    <label className="block text-white mb-2 font-medium">Vecā parole</label>
                    <input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">Jaunā parole</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      required
                      minLength={8}
                    />
                  </div>

                  <div>
                    <label className="block text-white mb-2 font-medium">Apstiprināt jauno paroli</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      required
                      minLength={8}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-brand-gold text-black rounded-lg font-semibold hover:bg-brand-gold-dark transition-colors"
                    >
                      Saglabāt
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeSection === "teacherPanel" && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-8">Skolotāju panelis</h2>
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => navigate("/admin")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/User Multiple Group.png")}
                      alt="Kontu saraksts"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Kontu saraksts</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/schools")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/Bullet List.png")}
                      alt="Skolas saraksts"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Skolas saraksts</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/create-account")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/User Add Plus.png")}
                      alt="Jauns konts"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Jauns konts</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/manage-school-users")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/User Add Plus.png")}
                      alt="Pievienot lietotāju skolai"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Pievienot lietotāju skolai</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/school-applications")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/Bullet List.png")}
                      alt="Skolas Pieteikumi"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Skolas Pieteikumi</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/manage-school-users", { state: { action: "remove" } })}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/User minus.png")}
                      alt="Noņemt lietotāju skolai"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Noņemt lietotāju skolai</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === "adminPanel" && (
              <div>
                <h2 className="text-3xl font-bold text-white mb-8">Administratora panelis</h2>
                <div className="grid grid-cols-2 gap-6">
                  <button
                    onClick={() => navigate("/admin")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/User Multiple Group.png")}
                      alt="Kontu saraksts"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Kontu saraksts</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/schools")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/Bullet List.png")}
                      alt="Skolas saraksts"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Skolas saraksts</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/create-account")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/User Add Plus.png")}
                      alt="Jauns konts"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Jauns konts</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/manage-school-users")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/User Add Plus.png")}
                      alt="Pievienot lietotāju skolai"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Pievienot lietotāju skolai</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/school-applications")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/Bullet List.png")}
                      alt="Skolas Pieteikumi"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Skolas Pieteikumi</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/manage-school-users", { state: { action: "remove" } })}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/User minus.png")}
                      alt="Noņemt lietotāju skolai"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Noņemt lietotāju skolai</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/create-olympiad")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/Add Circle.png")}
                      alt="Jauna olimpiāde"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Jauna olimpiāde</span>
                  </button>

                  <button
                    onClick={() => navigate("/admin/olympiads")}
                    className="bg-[#3A4562] hover:bg-[#4A5568] text-white p-6 rounded-lg transition-colors flex flex-col items-center gap-3"
                  >
                    <img
                      src={require("../static/Bullet List.png")}
                      alt="Olimpiādes saraksts"
                      className="w-8 h-8"
                    />
                    <span className="font-semibold">Olimpiādes saraksts</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
