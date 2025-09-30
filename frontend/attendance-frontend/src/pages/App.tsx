import { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import LoginPage from './Login';
import DashboardRouter from './DashboardRouter';
import { useAuthStore } from '../store/auth';

export default function App() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !token) {
      navigate('/');
    }
  }, [user, token, navigate]);

  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/dashboard/*" element={<DashboardRouter />} />
    </Routes>
  );
}
