import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useTranslation } from 'react-i18next';

interface Teacher {
  id: number;
  displayColor: string;
  user: { name: string; email: string };
}

interface ClassItem {
  id: number;
  name: string;
  grade: string;
  branch: string;
}

export default function SupervisorDashboard() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const [teacherRes, classRes] = await Promise.all([
        api.get('/supervisor/teachers'),
        api.get('/supervisor/classes'),
      ]);
      setTeachers(teacherRes.data.data);
      setClasses(classRes.data.data);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-800">{t('supervisor.dashboard.title')}</h2>
        <p className="mt-2 text-sm text-slate-500">
          Öğretmenleri, sınıfları, dersleri ve dönemleri bu panelden yönetebilirsiniz.
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-slate-800">Öğretmenler</h3>
        <ul className="mt-4 space-y-2">
          {teachers.map((teacher) => (
            <li key={teacher.id} className="flex items-center justify-between rounded border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: teacher.displayColor }} />
                <div>
                  <p className="font-semibold text-slate-700">{teacher.user.name}</p>
                  <p className="text-sm text-slate-500">{teacher.user.email}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-slate-800">Sınıflar</h3>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {classes.map((classItem) => (
            <div key={classItem.id} className="rounded border border-slate-200 p-4">
              <p className="text-lg font-semibold text-slate-700">{classItem.name}</p>
              <p className="text-sm text-slate-500">
                {classItem.grade}. Sınıf / {classItem.branch}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
