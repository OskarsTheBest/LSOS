import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../axios";

interface Prieksmets {
  id: number;
  nosaukums: string;
  kategorija: string;
}

export default function CreateOlympiad() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nosaukums: "",
    datums: "",
    maxDalibnieki: "",
    apraksts: "",
    norisesVieta: "",
    organizetajs: "",
    prieksmets: ""
  });
  const [prieksmeti, setPrieksmeti] = useState<Prieksmets[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadPrieksmeti();
  }, []);

  const loadPrieksmeti = async () => {
    try {
      const res = await api.get("/api/prieksmeti/");
      setPrieksmeti(res.data);
    } catch (err) {
      setError("Neizdevās ielādēt priekšmetus");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    
    if (!formData.nosaukums) {
      setError("Nosaukums ir obligāts");
      return;
    }
    if (!formData.datums) {
      setError("Datums ir obligāts");
      return;
    }
    if (!formData.norisesVieta) {
      setError("Norises vieta ir obligāta");
      return;
    }
    if (!formData.organizetajs) {
      setError("Organizētājs ir obligāts");
      return;
    }
    if (!formData.prieksmets) {
      setError("Priekšmets ir obligāts");
      return;
    }

    try {
      await api.post("/api/olympiads/create/", {
        ...formData,
        maxDalibnieki: formData.maxDalibnieki ? parseInt(formData.maxDalibnieki) : null,
        prieksmets: parseInt(formData.prieksmets)
      });
      setSuccess("Olimpiāde veiksmīgi izveidota");
      setTimeout(() => {
        navigate("/admin/olympiads");
      }, 1500);
    } catch (err: any) {
      const errorData = err.response?.data;
      setError(errorData?.detail || errorData?.nosaukums?.[0] || "Neizdevās izveidot olimpiādi");
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-8">
        <div className="bg-[#252D47] rounded-lg shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Jauna olimpiāde</h1>
            <button
              onClick={() => navigate("/admin/olympiads")}
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
                <label className="block text-white mb-2 font-medium">Nosaukums *</label>
                <input
                  type="text"
                  value={formData.nosaukums}
                  onChange={(e) => setFormData({ ...formData, nosaukums: e.target.value })}
                  required
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="Olimpiādes nosaukums"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Datums *</label>
                <input
                  type="date"
                  value={formData.datums}
                  onChange={(e) => setFormData({ ...formData, datums: e.target.value })}
                  required
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Priekšmets *</label>
                <select
                  value={formData.prieksmets}
                  onChange={(e) => setFormData({ ...formData, prieksmets: e.target.value })}
                  required
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white focus:outline-none focus:border-brand-gold"
                >
                  <option value="">-- Izvēlieties priekšmetu --</option>
                  {prieksmeti.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nosaukums} ({p.kategorija})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Maksimālais dalībnieku skaits</label>
                <input
                  type="number"
                  value={formData.maxDalibnieki}
                  onChange={(e) => setFormData({ ...formData, maxDalibnieki: e.target.value })}
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="Nav ierobežojuma"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Norises vieta *</label>
                <input
                  type="text"
                  value={formData.norisesVieta}
                  onChange={(e) => setFormData({ ...formData, norisesVieta: e.target.value })}
                  required
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="Adrese vai vieta"
                />
              </div>
              
              <div>
                <label className="block text-white mb-2 font-medium">Organizētājs *</label>
                <input
                  type="text"
                  value={formData.organizetajs}
                  onChange={(e) => setFormData({ ...formData, organizetajs: e.target.value })}
                  required
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="Organizētāja nosaukums"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-white mb-2 font-medium">Apraksts</label>
                <textarea
                  value={formData.apraksts}
                  onChange={(e) => setFormData({ ...formData, apraksts: e.target.value })}
                  rows={4}
                  className="w-full p-3 rounded-lg bg-[#1B2241] border border-[#3A4562] text-white placeholder-gray-400 focus:outline-none focus:border-brand-gold"
                  placeholder="Olimpiādes apraksts (maks. 250 rakstzīmes)"
                  maxLength={250}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-3 bg-brand-gold text-black rounded-lg font-semibold hover:bg-brand-gold-dark transition-colors"
              >
                Izveidot olimpiādi
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/olympiads")}
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

