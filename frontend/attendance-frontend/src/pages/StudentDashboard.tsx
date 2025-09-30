import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';

interface CourseItem {
  id: number;
  name: string;
  teacher: { user: { name: string }; displayColor: string };
  class: { grade: string; branch: string };
}

interface AttendanceSummary {
  course: {
    id: number;
    name: string;
    className: string;
    teacherName: string;
    teacherColor: string;
  };
  totalSessions: number;
  totalAbsences: number;
  percentage: number;
  threshold: number;
  warn: boolean;
  sessions: {
    sessionId: number;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
  }[];
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);

  useEffect(() => {
    const loadCourses = async () => {
      const response = await api.get('/student/courses');
      setCourses(response.data.data);
      if (response.data.data.length) {
        setSelectedCourse(response.data.data[0].id);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    const loadSummary = async () => {
      const response = await api.get(`/student/courses/${selectedCourse}/attendance-summary`);
      setSummary(response.data.data);
    };
    loadSummary();
  }, [selectedCourse]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-800">{t('student.courses.title')}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {courses.map((course) => (
            <button
              key={course.id}
              type="button"
              onClick={() => setSelectedCourse(course.id)}
              className={`rounded px-3 py-2 text-sm font-medium shadow ${
                course.id === selectedCourse ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {course.name}
            </button>
          ))}
        </div>
      </div>

      {summary && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-800">{summary.course.name}</h3>
          <p className="mt-1 text-sm text-slate-500">
            {summary.course.className} • <span style={{ color: summary.course.teacherColor }}>{summary.course.teacherName}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div className="rounded bg-slate-100 px-3 py-2">Toplam Oturum: {summary.totalSessions}</div>
            <div className="rounded bg-slate-100 px-3 py-2">Devamsızlık: {summary.totalAbsences}</div>
            <div className="rounded bg-slate-100 px-3 py-2">Yüzde: %{summary.percentage}</div>
            <div className="rounded bg-slate-100 px-3 py-2">Eşik: %{summary.threshold}</div>
          </div>
          {summary.warn && (
            <div className="mt-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {t('student.notifications.absence_threshold_body')}
            </div>
          )}

          <table className="mt-6 w-full border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Tarih</th>
                <th className="px-3 py-2 text-left">Saat</th>
                <th className="px-3 py-2 text-left">Durum</th>
              </tr>
            </thead>
            <tbody>
              {summary.sessions.map((session) => (
                <tr key={session.sessionId} className="border-t border-slate-200">
                  <td className="px-3 py-2">{new Date(session.date).toLocaleDateString('tr-TR')}</td>
                  <td className="px-3 py-2">
                    {new Date(session.startTime).toLocaleTimeString('tr-TR')} -
                    {new Date(session.endTime).toLocaleTimeString('tr-TR')}
                  </td>
                  <td className="px-3 py-2 capitalize">{session.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
