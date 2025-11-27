import React, { useContext, ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";

export default function PrivateRoute({ children }: { children: ReactElement }) {
  const { user } = useContext(AuthContext);

  return user ? children : <Navigate to="/login" />;
}
