import React, { useContext, ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

export default function PrivateRoute({ children }: { children: ReactElement }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="min-h-screen bg-brand-bg flex items-center justify-center">
      <div className="text-white text-xl">Ielādē...</div>
    </div>;
  }

  return user ? children : <Navigate to="/login" />;
}
