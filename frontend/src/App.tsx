import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { Layout } from "./components/Layout";
import { SupervisorDashboard } from "./pages/SupervisorDashboard";
import { TeacherDashboard } from "./pages/TeacherDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import { useAuth } from "./context/AuthContext";

const ProtectedRoutes: React.FC = () => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "supervisor") {
    return <SupervisorDashboard />;
  }
  if (user.role === "teacher") {
    return <TeacherDashboard />;
  }
  return <StudentDashboard />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoutes />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
