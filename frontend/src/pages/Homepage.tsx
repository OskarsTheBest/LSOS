import React from "react";
import { useNavigate } from "react-router-dom";

export default function Homepage() {
  const navigate = useNavigate();

  return (
    <div 
      className="min-h-screen flex items-center justify-start px-10 relative"
      style={{
        backgroundImage: `url(${require("../static/homebg.jpg")})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        paddingTop: '80px'
      }}
    >
      <div className="absolute inset-0 bg-brand-bg opacity-[0.93]"></div>
      <div className="relative z-10 text-left max-w-2xl mt-0">
        <div className="mb-6">
          <div className="text-white text-5xl font-bold">Vienotās</div>
          <div className="text-white text-5xl font-bold">Latvijas</div>
          <div className="text-white text-5xl font-bold">Skolas</div>
          <div className="text-white text-5xl font-bold">Olimpiādes</div>
        </div>

        <div className="mb-8 text-white text-lg leading-relaxed">
          <p>Latvijas skolu olimpiāžu sistēma piedāvā ērtu veidu, kā skolēniem reģistrēties olimpiādēm, sekot grafikam un</p>
          <p>apskatīt rezultātus.</p>
        </div>

        <div className="flex gap-4 justify-start">
          <button
            onClick={() => navigate("/olympiads")}
            className="px-8 py-3 bg-white border-2 border-white text-black rounded-lg font-semibold text-base transition-colors hover:bg-white/10"
          >
            Uzzini vairāk
          </button>
          <button
            onClick={() => navigate("/register")}
            className="px-8 py-3 bg-brand-gold text-black rounded-lg font-semibold text-base transition-colors hover:bg-brand-gold-dark"
          >
            Izveidot kontu
          </button>
        </div>
      </div>
    </div>
  );
}
