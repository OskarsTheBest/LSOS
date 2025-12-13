import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { messages } from "../messages";
import api from "../axios";

export default function CreateAccount() {
  const { createUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    last_name: "",
    number: "",
    user_type: "normal",
    skola: ""
  });
  const [schools, setSchools] = useState<Array<{id: number, nosaukums: string}>>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const res = await api.get("/api/schools/");
      setSchools(res.data);
    } catch (err) {
      console.error("Failed to load schools:", err);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!formData.email) {
      setError(messages.E001("E-pasts"));
      return;
    }
    if (!formData.password) {
      setError(messages.E001("Parole"));
      return;
    }

    if (formData.user_type === "teacher" && !formData.skola) {
      setError("Skolotājiem jābūt pievienotiem skolai");
      return;
    }

    try {
      const userData: any = {
        ...formData,
        skola: formData.skola ? parseInt(formData.skola) : null
      };
      await createUser(userData);
      setSuccess(messages.S001("Lietotājs"));
      setTimeout(() => {
        navigate("/admin");
      }, 1500);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.email) {
        setError(messages.E003("E-pasts"));
      } else if (errorData?.number) {
        setError(messages.E005);
      } else {
        setError(errorData?.detail || "Neizdevās izveidot lietotāju");
      }
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-8">
        <div className="bg-[#252D47] rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Jauns konts</h1>
            <button
              onClick={() => navigate("/admin")}
              className="px-4 py-2 bg-[#3A4562] text-white rounded-lg hover:bg-[#4A5568] transition-colors"
            >
              Atpakaļ
            </button>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-white mb-2 font-medium">E-pasts *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="lietotajs@example.com"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Parole *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="Minimāli 8 simboli"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Vārds</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="Vārds"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Uzvārds</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="Uzvārds"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Tālrunis</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="+37112345678"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Lietotāja tips</label>
                <select
                  value={formData.user_type}
                  onChange={(e) => setFormData({ ...formData, user_type: e.target.value, skola: e.target.value === "teacher" ? formData.skola : "" })}
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="normal">Normal (R)</option>
                  <option value="teacher">Teacher (S)</option>
                  <option value="admin">Admin (A)</option>
                </select>
              </div>
              
              {formData.user_type === "teacher" && (
                <div>
                  <label className="block text-white mb-2 font-medium">Skola *</label>
                  <select
                    value={formData.skola}
                    onChange={(e) => setFormData({ ...formData, skola: e.target.value })}
                    required={formData.user_type === "teacher"}
                    className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                  >
                    <option value="">-- Izvēlieties skolu --</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.nosaukums}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-brand-gold text-black rounded-lg font-semibold hover:bg-brand-gold-dark transition-colors"
              >
                Izveidot kontu
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="px-6 py-3 bg-[#3A4562] text-white rounded-lg font-semibold hover:bg-[#4A5568] transition-colors"
              >
                Atcelt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

