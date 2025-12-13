import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import Homepage from "./pages/Homepage";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import CreateAccount from "./pages/CreateAccount";
import SchoolsList from "./pages/SchoolsList";
import SchoolUsers from "./pages/SchoolUsers";
import ManageSchoolUsers from "./pages/ManageSchoolUsers";
import Olympiads from "./pages/Olympiads";
import OlympiadsList from "./pages/OlympiadsList";
import CreateOlympiad from "./pages/CreateOlympiad";
import SchoolApplications from "./pages/SchoolApplications";
import Results from "./pages/Results";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/Navbar";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Navigate to="/login" replace state={{ showRegister: true }} />} />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminPanel />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/create-account"
            element={
              <AdminRoute>
                <CreateAccount />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/schools"
            element={
              <PrivateRoute>
                <SchoolsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/schools/:schoolId/users"
            element={
              <PrivateRoute>
                <SchoolUsers />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/manage-school-users"
            element={
              <PrivateRoute>
                <ManageSchoolUsers />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/olympiads"
            element={
              <AdminRoute>
                <OlympiadsList />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/create-olympiad"
            element={
              <AdminRoute>
                <CreateOlympiad />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/school-applications"
            element={
              <PrivateRoute>
                <SchoolApplications />
              </PrivateRoute>
            }
          />
          <Route path="/olympiads" element={<Olympiads />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
