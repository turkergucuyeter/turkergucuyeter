import { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '../components/NotificationCenter';

interface CourseItem {
  id: number;
  name: string;
  code: string;
  teacher: {
    user: {
      name: string;
    };
    displayColor: string;
  };
  class: {
    name: string;
  };
}

interface AttendanceSummary {
  sessions: Array<{ id: number; startTime: string; status?: string }>;
  attendances: Array<{ scheduleSessionId: number; status: string }>;
  absencePercent: number;
}

const StudentDashboard = () => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [summaries, setSummaries] = useState<Record<number, AttendanceSummary>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const response = await api.get<{ courses: CourseItem[] }>('/student/me/courses');
      setCourses(response.data.courses);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (courses.length === 0) return;
    courses.forEach(async (course) => {
      const response = await api.get<AttendanceSummary>(`/student/me/courses/${course.id}/attendance-summary`);
      setSummaries((prev) => ({ ...prev, [course.id]: response.data }));
    });
  }, [courses]);

  return (
    <DashboardLayout title="Öğrenci Paneli" subtitle={t('dashboard.student.subtitle')}>
      <section className="grid md:grid-cols-2 gap-4">
        {courses.map((course) => {
          const summary = summaries[course.id];
          const percent = summary?.absencePercent ?? 0;
          const thresholdReached = percent >= 30;
          return (
            <div key={course.id} className="bg-white rounded-xl shadow p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">{course.name}</h2>
                  <p className="text-xs text-slate-500">Kod: {course.code}</p>
                </div>
                <span
                  className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ backgroundColor: course.teacher?.displayColor ?? '#6366F1' }}
                >
                  {course.teacher?.user.name}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-3xl font-semibold text-slate-800">%{percent}</div>
                <div className="text-sm text-slate-500">{t('student.attendance.rate')}</div>
              </div>
              {thresholdReached && (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {t('alerts.absence.threshold', { percent })}
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">{t('student.attendance.sessions')}</h3>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {summary?.sessions.map((session) => {
                    const attendance = summary.attendances.find((item) => item.scheduleSessionId === session.id);
                    return (
                      <li key={session.id} className="flex items-center justify-between text-sm text-slate-600">
                        <span>{new Date(session.startTime).toLocaleString('tr-TR')}</span>
                        <span className="capitalize">{attendance?.status ?? '—'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && !loading && <p className="text-sm text-slate-500">Henüz ders bulunmuyor.</p>}
      </section>

      <NotificationCenter />
    </DashboardLayout>
  );
};

export default StudentDashboard;
