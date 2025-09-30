import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import Layout from '../components/Layout';
import SupervisorDashboard from './SupervisorDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';

export default function DashboardRouter() {
  const { user } = useAuthStore();
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout>
      <Routes>
        {user.role === 'supervisor' && <Route path="/" element={<SupervisorDashboard />} />}
        {user.role === 'teacher' && <Route path="/" element={<TeacherDashboard />} />}
        {user.role === 'student' && <Route path="/" element={<StudentDashboard />} />}
        <Route path="*" element={<Navigate to="." replace />} />
      </Routes>
    </Layout>
  );
}
