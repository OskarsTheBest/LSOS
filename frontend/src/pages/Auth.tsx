import React, { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { messages } from "../messages";
import { validatePassword } from "../utils/passwordValidation";

export default function Auth() {
  const { login, register } = useContext(AuthContext);
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { showRegister?: boolean } | null;
    if (state?.showRegister) {
      setActiveTab("register");
    }
  }, [location]);

  function validateForm() {
    if (!email.trim()) {
      setError(messages.E001("E-pasts"));
      return false;
    }
    if (!password.trim()) {
      setError(messages.E001("Parole"));
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(messages.E006);
      return false;
    }
    if (activeTab === "register") {
      if (!confirmPassword.trim()) {
        setError(messages.E001("Paroles apstiprinājums"));
        return false;
      }
      if (password !== confirmPassword) {
        setError(messages.E008);
        return false;
      }
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.error || "Nepareiza parole");
        return false;
      }
      if (number && !/^\+?\d{7,15}$/.test(number)) {
        setError(messages.E005);
        return false;
      }
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      if (activeTab === "login") {
        await login(email, password);
        setSuccess(messages.S008);
        setTimeout(() => navigate("/profile"), 800);
      } else {
        await register(email, password, name, lastName, number);
        setSuccess(messages.S007);
        setTimeout(() => {
          switchTab("login");
        }, 1200);
      }
    } catch (err: any) {
      if (activeTab === "login") {
        setError(messages.E007);
      } else {
        if (err.response?.data?.email?.[0]) {
          setError(messages.E003(email));
        } else if (err.response?.data?.number) {
          setError(messages.E005);
        } else {
          setError(err.response?.data?.detail || "Reģistrācija neizdevās. Mēģiniet vēlreiz.");
        }
      }
    }
  }

  function switchTab(tab: "login" | "register") {
    setActiveTab(tab);
    setError("");
    setSuccess("");
    setName("");
    setLastName("");
    setEmail("");
    setNumber("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 pt-20">
      <div className="w-full max-w-4xl bg-[#1B2241] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Mans Konts</h2>
          
          <div className="flex gap-6">
            <div className="flex flex-col gap-2 w-48">
              <button
                onClick={() => switchTab("login")}
                className={`px-6 py-4 rounded-lg text-left font-medium transition-colors ${
                  activeTab === "login"
                    ? "bg-[#2A3454] text-white"
                    : "bg-[#252D47] text-gray-300 hover:bg-[#2A3454]"
                }`}
              >
                Pierakstīšanās
              </button>
              <button
                onClick={() => switchTab("register")}
                className={`px-6 py-4 rounded-lg text-left font-medium transition-colors ${
                  activeTab === "register"
                    ? "bg-[#2A3454] text-white"
                    : "bg-[#252D47] text-gray-300 hover:bg-[#2A3454]"
                }`}
              >
                Reģistrēšanās
              </button>
            </div>

            <div className="flex-1">
              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === "register" && (
                  <>
                    <div>
                      <label className="block text-white mb-2 font-medium">Vārds</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                        placeholder="Jānis"
                      />
                    </div>

                    <div>
                      <label className="block text-white mb-2 font-medium">Uzvārds</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                        placeholder="Piemērs"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-white mb-2 font-medium">
                    E-pasts {activeTab === "register" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                    placeholder="123@gmail.com"
                  />
                </div>

                {activeTab === "register" && (
                  <div>
                    <label className="block text-white mb-2 font-medium">Tālruņa numurs</label>
                    <input
                      type="text"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                      placeholder="12345678"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-white mb-2 font-medium">
                    Parole {activeTab === "register" && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                    placeholder="Min. 8 simboli, 1 lielais burts, 1 speciālais simbols"
                  />
                </div>

                {activeTab === "register" && (
                  <>
                    <div>
                      <label className="block text-white mb-2 font-medium">
                        Atkārtota Parole <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-3 rounded-lg bg-[#252D47] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                        placeholder="Atkārtojiet paroli"
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="text-green-400 text-sm bg-green-900/20 p-3 rounded-lg">
                    {success}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-brand-gold text-black rounded-lg font-semibold hover:bg-brand-gold-dark transition-colors"
                >
                  {activeTab === "login" ? "Pierakstīties" : "Reģistrēties"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

