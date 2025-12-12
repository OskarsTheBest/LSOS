import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { messages } from "../messages";

export default function Profile() {
  const { user, logout, updateProfile, changePassword } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<"info" | "applications" | "password">("info");
  const [formData, setFormData] = useState({
    name: "",
    last_name: "",
    number: "",
    school: "",
    user_type: "normal"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [applications] = useState<any[]>([]);
  
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
        school: "",
        user_type: user.user_type || "normal"
      });
    }
  }, [user]);

  if (!user) return <div className="p-5 mt-20 text-white">Loading...</div>;

  const isAdmin = user.user_type === "admin";

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
      
      if (isAdmin) {
        updateData.user_type = formData.user_type;
      }
      
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

    if (passwordData.newPassword.length < 8) {
      setError("Parolei jābūt vismaz 8 simbolu garai");
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
              <div className="w-32 h-32 rounded-full bg-[#252D47] border-2 border-[#3A4562] flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
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

            {isAdmin && (
              <div className="mt-6">
                <button
                  onClick={() => navigate("/admin")}
                  className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                >
                  Admin Panel
                </button>
              </div>
            )}
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
                      value={formData.school}
                      disabled
                      className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-gray-400 cursor-not-allowed focus:outline-none"
                      placeholder="Rīgas Valsts 1. ģimnāzija"
                    />
                  </div>

                  {isAdmin && (
                    <div>
                      <label className="block text-white mb-2 font-medium">Lietotāja tips</label>
                      <select
                        value={formData.user_type}
                        onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                        className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                      >
                        <option value="normal">Normal (R)</option>
                        <option value="teacher">Teacher (S)</option>
                        <option value="admin">Admin (A)</option>
                      </select>
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
                {applications.length === 0 ? (
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
          </div>
        </div>
      </div>
    </div>
  );
}
