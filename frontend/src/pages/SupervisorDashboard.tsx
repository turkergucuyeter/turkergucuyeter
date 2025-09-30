import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../layout/DashboardLayout';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import NotificationCenter from '../components/NotificationCenter';

interface Teacher {
  id: number;
  displayColor: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface Student {
  id: number;
  studentNo: string;
  user: {
    id: number;
    name: string;
  };
}

interface ClassItem {
  id: number;
  name: string;
  code: string;
  grade: string;
  branch: string;
}

interface CourseItem {
  id: number;
  name: string;
  code: string;
  classId: number;
  teacherId: number;
}

interface TermItem {
  id: number;
  name: string;
  absenceThresholdPercent: number;
}

const SupervisorDashboard = () => {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [teacherRes, studentRes, classRes, courseRes, termRes] = await Promise.all([
        api.get<Teacher[]>('/supervisor/teachers'),
        api.get<Student[]>('/supervisor/students'),
        api.get<ClassItem[]>('/supervisor/classes'),
        api.get<CourseItem[]>('/supervisor/courses'),
        api.get<TermItem[]>('/supervisor/terms')
      ]);
      setTeachers(teacherRes.data);
      setStudents(studentRes.data);
      setClasses(classRes.data);
      setCourses(courseRes.data);
      setTerms(termRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateTeacher = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await api.post('/supervisor/teachers', {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      displayColor: formData.get('displayColor')
    });
    event.currentTarget.reset();
    load();
  };

  const handleCreateStudent = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await api.post('/supervisor/students', {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      studentNo: formData.get('studentNo'),
      guardianContact: formData.get('guardianContact'),
      classId: Number(formData.get('classId') || undefined)
    });
    event.currentTarget.reset();
    load();
  };

  const handleCreateClass = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await api.post('/supervisor/classes', {
      name: formData.get('name'),
      code: formData.get('code'),
      grade: formData.get('grade'),
      branch: formData.get('branch')
    });
    event.currentTarget.reset();
    load();
  };

  const handleCreateCourse = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await api.post('/supervisor/courses', {
      name: formData.get('name'),
      code: formData.get('code'),
      classId: Number(formData.get('classId')),
      teacherId: Number(formData.get('teacherId')),
      weeklyHours: Number(formData.get('weeklyHours') || 1)
    });
    event.currentTarget.reset();
    load();
  };

  const handleCreateTerm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await api.post('/supervisor/terms', {
      name: formData.get('name'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      absenceThresholdPercent: Number(formData.get('absenceThresholdPercent') || 30)
    });
    event.currentTarget.reset();
    load();
  };

  const downloadReport = async (format: 'csv' | 'pdf') => {
    const response = await api.get(`/reports/attendance?format=${format}`, { responseType: format === 'csv' ? 'text' : 'blob' });
    if (format === 'csv') {
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yoklama-raporu.${format}`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `yoklama-raporu.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const teacherColors = useMemo(() => {
    return teachers.reduce<Record<number, string>>((acc, teacher) => {
      acc[teacher.id] = teacher.displayColor;
      return acc;
    }, {});
  }, [teachers]);

  return (
    <DashboardLayout title="Supervisor Paneli" subtitle={t('dashboard.supervisor.subtitle')}>
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">{t('supervisor.teachers.title')}</h2>
          <form className="space-y-3" onSubmit={handleCreateTeacher}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="name" placeholder="Ad Soyad" className="input" required />
              <input name="email" placeholder="E-posta" className="input" required type="email" />
              <input name="password" placeholder="Geçici Şifre" className="input" required />
              <input name="displayColor" placeholder="Renk (#HEX)" className="input" defaultValue="#2563EB" />
            </div>
            <button type="submit" className="btn-primary">Öğretmen Ekle</button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {teachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                <div>
                  <p className="font-semibold text-slate-800">{teacher.user.name}</p>
                  <p className="text-xs text-slate-500">{teacher.user.email}</p>
                </div>
                <span
                  className="w-6 h-6 rounded-full border"
                  style={{ backgroundColor: teacher.displayColor }}
                  title={teacher.displayColor}
                ></span>
              </div>
            ))}
            {teachers.length === 0 && <p className="text-sm text-slate-500">Henüz öğretmen yok.</p>}
          </div>
        </section>

        <section className="bg-white rounded-xl shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">{t('supervisor.students.title')}</h2>
          <form className="space-y-3" onSubmit={handleCreateStudent}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="name" placeholder="Ad Soyad" className="input" required />
              <input name="email" placeholder="E-posta" className="input" required type="email" />
              <input name="password" placeholder="Geçici Şifre" className="input" required />
              <input name="studentNo" placeholder="Öğrenci No" className="input" required />
              <input name="guardianContact" placeholder="Veli İletişim" className="input" />
              <select name="classId" className="input">
                <option value="">Sınıf seç</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-primary">Öğrenci Ekle</button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {students.map((student) => (
              <div key={student.id} className="p-3 border border-slate-200 rounded-lg">
                <p className="font-semibold text-slate-800">{student.user.name}</p>
                <p className="text-xs text-slate-500">No: {student.studentNo}</p>
              </div>
            ))}
            {students.length === 0 && <p className="text-sm text-slate-500">Henüz öğrenci yok.</p>}
          </div>
        </section>
      </div>

      <section className="bg-white rounded-xl shadow p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Sınıf Oluştur</h3>
            <form className="space-y-3" onSubmit={handleCreateClass}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="name" placeholder="Sınıf adı" className="input" required />
                <input name="code" placeholder="Kod" className="input" required />
                <input name="grade" placeholder="Seviye" className="input" required />
                <input name="branch" placeholder="Şube" className="input" required />
              </div>
              <button type="submit" className="btn-secondary">Kaydet</button>
            </form>

            <div className="grid md:grid-cols-2 gap-3">
              {classes.map((item) => (
                <div key={item.id} className="border border-slate-200 rounded-lg p-3">
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">Kod: {item.code}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Ders Oluştur</h3>
            <form className="space-y-3" onSubmit={handleCreateCourse}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input name="name" placeholder="Ders adı" className="input" required />
                <input name="code" placeholder="Kod" className="input" required />
                <select name="classId" className="input" required>
                  <option value="">Sınıf seç</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <select name="teacherId" className="input" required>
                  <option value="">Öğretmen seç</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user.name}
                    </option>
                  ))}
                </select>
                <input name="weeklyHours" placeholder="Haftalık Saat" className="input" type="number" min="1" defaultValue={1} />
              </div>
              <button type="submit" className="btn-secondary">Kaydet</button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {courses.map((course) => (
                <div key={course.id} className="border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800">{course.name}</p>
                    <p className="text-xs text-slate-500">Kod: {course.code}</p>
                  </div>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{ backgroundColor: teacherColors[course.teacherId] ?? '#E0E7FF' }}
                  >
                    {teachers.find((t) => t.id === course.teacherId)?.user.name ?? 'Öğretmen'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{t('supervisor.reports.title')}</h2>
            <p className="text-sm text-slate-500">Ders ve tarih aralığına göre rapor alın.</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => downloadReport('csv')}>
              {t('reports.download.csv')}
            </button>
            <button className="btn-secondary" onClick={() => downloadReport('pdf')}>
              {t('reports.download.pdf')}
            </button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500 uppercase">Öğretmen sayısı</p>
            <p className="text-2xl font-semibold text-slate-800">{teachers.length}</p>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500 uppercase">Öğrenci sayısı</p>
            <p className="text-2xl font-semibold text-slate-800">{students.length}</p>
          </div>
          <div className="p-4 border border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500 uppercase">Ders sayısı</p>
            <p className="text-2xl font-semibold text-slate-800">{courses.length}</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Dönemler</h2>
        <form className="space-y-3" onSubmit={handleCreateTerm}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input name="name" placeholder="Dönem adı" className="input" required />
            <input name="startDate" type="date" className="input" required />
            <input name="endDate" type="date" className="input" required />
            <input
              name="absenceThresholdPercent"
              type="number"
              className="input"
              placeholder="Eşik %"
              defaultValue={30}
            />
          </div>
          <button type="submit" className="btn-secondary">Kaydet</button>
        </form>
        <div className="grid md:grid-cols-3 gap-3">
          {terms.map((term) => (
            <div key={term.id} className="border border-slate-200 rounded-lg p-3">
              <p className="font-semibold text-slate-800">{term.name}</p>
              <p className="text-xs text-slate-500">Eşik: %{term.absenceThresholdPercent}</p>
            </div>
          ))}
        </div>
      </section>

      <NotificationCenter />

      {loading && <div className="text-center text-sm text-slate-500">Yükleniyor...</div>}
    </DashboardLayout>
  );
};

export default SupervisorDashboard;
