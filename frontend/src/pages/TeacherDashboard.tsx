import { useEffect, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../services/api';
import AttendanceTable from '../components/AttendanceTable';
import { AttendanceStatusOption } from '../types/attendance';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '../components/NotificationCenter';

interface TeacherClass {
  classId: number;
  name: string;
  grade: string;
  branch: string;
  code: string;
}

interface SessionItem {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  isLocked: boolean;
  courseId: number;
}

interface StudentRow {
  student: {
    id: number;
    studentNo: string;
    user: { name: string };
  };
}

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [values, setValues] = useState<Record<number, AttendanceStatusOption>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await api.get<{ classes: TeacherClass[] }>(
        '/teacher/my/classes'
      );
      setClasses(response.data.classes);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    const loadSessions = async () => {
      const response = await api.get<{ sessions: SessionItem[] }>(`/teacher/classes/${selectedClass}/sessions`);
      setSessions(response.data.sessions);
      setSelectedSession(null);
    };
    loadSessions();
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedSession) return;
    const loadAttendance = async () => {
      const response = await api.get<{ students: StudentRow[]; attendance: Array<{ studentId: number; status: AttendanceStatusOption }>; session: SessionItem }>(
        `/teacher/sessions/${selectedSession}/attendance`
      );
      setStudents(response.data.students);
      const valueMap: Record<number, AttendanceStatusOption> = {};
      response.data.attendance.forEach((item) => {
        valueMap[item.studentId] = item.status;
      });
      setValues(valueMap);
      setIsLocked(response.data.session.isLocked);
    };
    loadAttendance();
  }, [selectedSession]);

  const handleStatusChange = (studentId: number, status: AttendanceStatusOption) => {
    setValues((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedSession) return;
    setSaving(true);
    try {
      const payload = students.map((row) => ({
        studentId: row.student.id,
        status: values[row.student.id] ?? 'present'
      }));
      await api.post(`/teacher/sessions/${selectedSession}/attendance`, payload);
      setSaving(false);
    } catch (error) {
      console.error(error);
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Öğretmen Paneli" subtitle={t('dashboard.teacher.subtitle')}>
      <div className="grid md:grid-cols-3 gap-4">
        <section className="bg-white rounded-xl shadow p-4 space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">{t('teacher.classes.title')}</h2>
          <ul className="space-y-2 max-h-72 overflow-y-auto">
            {classes.map((item) => (
              <li key={item.classId}>
                <button
                  className={`w-full text-left px-3 py-2 rounded-lg border ${
                    selectedClass === item.classId ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200'
                  }`}
                  onClick={() => setSelectedClass(item.classId)}
                >
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">Kod: {item.code}</p>
                </button>
              </li>
            ))}
            {classes.length === 0 && <li className="text-sm text-slate-500">Atanmış sınıfınız bulunmuyor.</li>}
          </ul>
        </section>

        <section className="md:col-span-2 bg-white rounded-xl shadow p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{t('teacher.sessions.title')}</h2>
              <p className="text-xs text-slate-500">Sınıf seçerek ders oturumlarını görüntüleyin.</p>
            </div>
            <select
              className="input max-w-xs"
              value={selectedSession ?? ''}
              onChange={(event) => setSelectedSession(Number(event.target.value) || null)}
              disabled={sessions.length === 0}
            >
              <option value="">Oturum seçiniz</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {new Date(session.startTime).toLocaleString('tr-TR')}
                </option>
              ))}
            </select>
          </div>

          {selectedSession && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">{t('teacher.attendance.title')}</h3>
                <button
                  onClick={handleSave}
                  disabled={isLocked || saving}
                  className="btn-primary disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : t('teacher.attendance.save')}
                </button>
              </div>
              <AttendanceTable
                students={students.map((row) => ({
                  id: row.student.id,
                  name: row.student.user.name,
                  studentNo: row.student.studentNo
                }))}
                values={values}
                onChange={handleStatusChange}
                disabled={isLocked}
              />
              {isLocked && <p className="text-sm text-amber-600">Oturum kilitli, güncelleme yapılamaz.</p>}
            </div>
          )}
        </section>
      </div>

      <NotificationCenter />
    </DashboardLayout>
  );
};

export default TeacherDashboard;
