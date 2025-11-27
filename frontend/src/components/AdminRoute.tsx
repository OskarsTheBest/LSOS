import React, { useContext, ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

export default function AdminRoute({ children }: { children: ReactElement }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.user_type !== "admin") {
    return <Navigate to="/profile" />;
  }

  return children;
}

