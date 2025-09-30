import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';

interface ClassItem {
  id: number;
  name: string;
  grade: string;
  branch: string;
  courses: { id: number; name: string }[];
}

interface SessionItem {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  course: { id: number; name: string };
  isLocked: boolean;
}

interface AttendanceRow {
  student: {
    id: number;
    user: { name: string };
  };
  status: 'present' | 'excused' | 'unexcused';
}

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadClasses = async () => {
      const response = await api.get('/teacher/classes');
      setClasses(response.data.data);
      if (response.data.data.length) {
        setSelectedClass(response.data.data[0].id);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const loadSessions = async () => {
      const response = await api.get(`/teacher/classes/${selectedClass}/sessions`);
      setSessions(response.data.data);
      if (response.data.data.length) {
        setSelectedSession(response.data.data[0].id);
      }
    };
    loadSessions();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSession) return;
    const loadAttendance = async () => {
      const response = await api.get(`/teacher/sessions/${selectedSession}/attendance`);
      const sessionData = response.data.data;
      const rows = sessionData.course.class.students.map((classStudent: any) => {
        const record = sessionData.attendances.find((item: any) => item.studentId === classStudent.studentId);
        return {
          student: classStudent.student,
          status: record?.status ?? 'present',
        } as AttendanceRow;
      });
      setAttendance(rows);
    };
    loadAttendance();
  }, [selectedSession]);

  const currentSession = useMemo(() => sessions.find((session) => session.id === selectedSession), [sessions, selectedSession]);
  const canEdit = currentSession ? !currentSession.isLocked : false;

  const updateRow = (studentId: number, status: AttendanceRow['status']) => {
    setAttendance((prev) =>
      prev.map((row) => (row.student.id === studentId ? { ...row, status } : row)),
    );
  };

  const saveAttendance = async () => {
    if (!selectedSession) return;
    await api.post(`/teacher/sessions/${selectedSession}/attendance`,
      attendance.map((row) => ({ studentId: row.student.id, status: row.status })),
    );
    setMessage('Yoklama kaydedildi.');
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-800">{t('teacher.classes.title')}</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {classes.map((classItem) => (
            <button
              key={classItem.id}
              type="button"
              onClick={() => setSelectedClass(classItem.id)}
              className={`rounded px-3 py-2 text-sm font-medium shadow ${
                classItem.id === selectedClass ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {classItem.name}
            </button>
          ))}
        </div>
      </div>

      {selectedClass && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-800">{t('teacher.sessions.title')}</h3>
          <div className="mt-4 space-y-3">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => setSelectedSession(session.id)}
                className={`flex w-full justify-between rounded border px-4 py-2 text-left text-sm shadow ${
                  session.id === selectedSession ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white'
                }`}
              >
                <span>{new Date(session.startTime).toLocaleString('tr-TR')}</span>
                {session.isLocked && <span className="text-xs text-red-500">Kilitli</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSession && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-800">Manuel Yoklama</h3>
          {message && <p className="mb-3 text-sm text-green-600">{message}</p>}
          <table className="mt-4 w-full border border-slate-200 text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Öğrenci</th>
                <th className="px-3 py-2">Var</th>
                <th className="px-3 py-2">İzinli</th>
                <th className="px-3 py-2">İzinsiz</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.student.id} className="border-t border-slate-200">
                  <td className="px-3 py-2">{row.student.user.name}</td>
                  {['present', 'excused', 'unexcused'].map((status) => (
                    <td key={status} className="px-3 py-2 text-center">
                      <input
                        type="radio"
                        name={`attendance-${row.student.id}`}
                        checked={row.status === status}
                        disabled={!canEdit}
                        onChange={() => updateRow(row.student.id, status as AttendanceRow['status'])}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {canEdit ? (
            <button
              type="button"
              onClick={saveAttendance}
              className="mt-4 rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
            >
              {t('teacher.attendance.save')}
            </button>
          ) : (
            <p className="mt-4 text-sm text-red-500">{t('teacher.attendance.locked')}</p>
          )}
        </div>
      )}

      {user?.role === 'teacher' && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-semibold text-slate-800">{t('teacher.reports.title')}</h3>
          <p className="mt-2 text-sm text-slate-500">
            Detaylı rapor için Supervisor panelindeki CSV/PDF ihracatını kullanabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
