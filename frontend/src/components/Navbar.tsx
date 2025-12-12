import React, { useContext } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AuthContext } from "../AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isOnProfilePage = location.pathname === "/profile";
  const isOnOlympiadsPage = location.pathname === "/olympiads";
  const isOnResultsPage = location.pathname === "/results";

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="w-full bg-[rgba(27,34,65,0.95)] px-5 flex items-center justify-between h-16 shadow-md fixed top-0 left-0 z-[1000]">
      <Link to="/" className="flex items-center gap-4 cursor-pointer no-underline">
        <img
          src={require("../static/icon.png")}
          alt="Logo"
          className="w-[60px] h-[60px] rounded-lg object-contain p-0.5 box-border"
        />
        <span className="text-lg font-semibold text-brand-gold leading-tight flex flex-col">
          <div className="font-bold">Latvijas Skolas</div>
          <div className="font-bold">Olimpiāžu sistēma</div>
        </span>
      </Link>

      <div className="flex items-center gap-4">
        <Link
          to="/olympiads"
          className={`px-4 py-2 no-underline rounded transition-colors hover:bg-white/10 font-bold ${
            isOnOlympiadsPage ? "text-[#F5C791]" : "text-white"
          }`}
        >
          Olimpiādes
        </Link>
        <Link
          to="/results"
          className={`px-4 py-2 no-underline rounded transition-colors hover:bg-white/10 font-bold ${
            isOnResultsPage ? "text-[#F5C791]" : "text-white"
          }`}
        >
          Rezultāti
        </Link>
        {user ? (
          <>
            <Link
              to="/profile"
              className="flex items-center p-1 rounded transition-colors hover:bg-white/10 cursor-pointer"
            >
              <img
                src={require(isOnProfilePage ? "../static/person_col.png" : "../static/person.png")}
                alt="Account"
                className="w-8 h-8 object-contain"
              />
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center p-1 bg-transparent border-none rounded cursor-pointer transition-colors hover:bg-white/10"
            >
              <img
                src={require("../static/Log out.png")}
                alt="Logout"
                className="w-8 h-8 object-contain"
              />
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="px-4 py-2 bg-brand-gold text-white no-underline rounded font-medium transition-colors hover:bg-brand-gold-dark"
          >
            Ienākt
          </Link>
        )}
      </div>
    </nav>
  );
}
