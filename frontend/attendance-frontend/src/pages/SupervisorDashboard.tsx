import { FormEvent, useEffect, useMemo, useState } from 'react';
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

interface CourseItem {
  id: number;
  name: string;
  code: string;
  weeklyHours: number;
  class: { id: number; name: string };
  teacher: { id: number; displayColor: string; user: { name: string; email: string } };
}

type MessageState = { type: 'success' | 'error'; text: string } | null;

const defaultTeacherColor = '#6366f1';

export default function SupervisorDashboard() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [message, setMessage] = useState<MessageState>(null);

  const [teacherForm, setTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
    displayColor: defaultTeacherColor,
  });
  const [editingTeacherId, setEditingTeacherId] = useState<number | null>(null);
  const [editingTeacherForm, setEditingTeacherForm] = useState({
    name: '',
    email: '',
    password: '',
    displayColor: defaultTeacherColor,
  });

  const [classForm, setClassForm] = useState({ name: '', grade: '', branch: '' });
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [editingClassForm, setEditingClassForm] = useState({ name: '', grade: '', branch: '' });

  const [courseForm, setCourseForm] = useState({
    name: '',
    code: '',
    weeklyHours: '',
    classId: '',
    teacherId: '',
  });
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);

  const classOptions = useMemo(
    () =>
      classes.map((item) => ({
        value: String(item.id),
        label: `${item.name} (${item.grade}/${item.branch})`,
      })),
    [classes],
  );

  const teacherOptions = useMemo(
    () =>
      teachers.map((item) => ({
        value: String(item.id),
        label: item.user.name,
      })),
    [teachers],
  );

  const resetMessages = () => setMessage(null);

  const loadTeachers = async () => {
    const response = await api.get('/supervisor/teachers');
    setTeachers(response.data.data);
  };

  const loadClasses = async () => {
    const response = await api.get('/supervisor/classes');
    setClasses(response.data.data);
  };

  const loadCourses = async () => {
    const response = await api.get('/supervisor/courses');
    setCourses(response.data.data);
  };

  const loadAll = async () => {
    try {
      await Promise.all([loadTeachers(), loadClasses(), loadCourses()]);
    } catch (error) {
      setMessage({ type: 'error', text: t('supervisor.feedback.load_error') });
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTeacherCreate = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();
    try {
      await api.post('/supervisor/teachers', {
        name: teacherForm.name,
        email: teacherForm.email,
        password: teacherForm.password,
        displayColor: teacherForm.displayColor,
      });
      setTeacherForm({ name: '', email: '', password: '', displayColor: defaultTeacherColor });
      setMessage({ type: 'success', text: t('supervisor.teachers.create_success') });
      await loadTeachers();
    } catch (error) {
      setMessage({ type: 'error', text: t('supervisor.teachers.create_error') });
    }
  };

  const startEditTeacher = (teacher: Teacher) => {
    setEditingTeacherId(teacher.id);
    setEditingTeacherForm({
      name: teacher.user.name,
      email: teacher.user.email,
      password: '',
      displayColor: teacher.displayColor,
    });
  };

  const cancelTeacherEdit = () => {
    setEditingTeacherId(null);
    setEditingTeacherForm({ name: '', email: '', password: '', displayColor: defaultTeacherColor });
  };

  const handleTeacherUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingTeacherId) return;
    resetMessages();
    const payload: Record<string, string> = {};
    if (editingTeacherForm.name.trim().length > 0) payload.name = editingTeacherForm.name;
    if (editingTeacherForm.email.trim().length > 0) payload.email = editingTeacherForm.email;
    if (editingTeacherForm.password.trim().length > 0) payload.password = editingTeacherForm.password;
    if (editingTeacherForm.displayColor.trim().length > 0) payload.displayColor = editingTeacherForm.displayColor;
    try {
      await api.patch(`/supervisor/teachers/${editingTeacherId}`, payload);
      setMessage({ type: 'success', text: t('supervisor.teachers.update_success') });
      await loadTeachers();
      cancelTeacherEdit();
    } catch (error) {
      setMessage({ type: 'error', text: t('supervisor.teachers.update_error') });
    }
  };

  const handleTeacherDelete = async (teacherId: number) => {
    resetMessages();
    try {
      await api.delete(`/supervisor/teachers/${teacherId}`);
      setMessage({ type: 'success', text: t('supervisor.teachers.delete_success') });
      await loadTeachers();
    } catch (error) {
      setMessage({ type: 'error', text: t('supervisor.teachers.delete_error') });
    }
  };

  const handleClassSubmit = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();
    try {
      if (editingClassId) {
        await api.patch(`/supervisor/classes/${editingClassId}`, {
          name: editingClassForm.name,
          grade: editingClassForm.grade,
          branch: editingClassForm.branch,
        });
        setMessage({ type: 'success', text: t('supervisor.classes.update_success') });
        setEditingClassId(null);
        setEditingClassForm({ name: '', grade: '', branch: '' });
      } else {
        await api.post('/supervisor/classes', classForm);
        setMessage({ type: 'success', text: t('supervisor.classes.create_success') });
        setClassForm({ name: '', grade: '', branch: '' });
      }
      await loadClasses();
    } catch (error) {
      setMessage({ type: 'error', text: t('supervisor.classes.save_error') });
    }
  };

  const startClassEdit = (item: ClassItem) => {
    setEditingClassId(item.id);
    setEditingClassForm({ name: item.name, grade: item.grade, branch: item.branch });
  };

  const cancelClassEdit = () => {
    setEditingClassId(null);
    setEditingClassForm({ name: '', grade: '', branch: '' });
  };

  const handleClassDelete = async (classId: number) => {
    resetMessages();
    try {
      await api.delete(`/supervisor/classes/${classId}`);
      setMessage({ type: 'success', text: t('supervisor.classes.delete_success') });
      await loadClasses();
    } catch (error) {
      setMessage({ type: 'error', text: t('supervisor.classes.delete_error') });
    }
  };

  const handleCourseSubmit = async (event: FormEvent) => {
    event.preventDefault();
    resetMessages();
    const payload = {
      name: courseForm.name,
      code: courseForm.code,
      weeklyHours: Number(courseForm.weeklyHours),
      classId: Number(courseForm.classId),
      teacherId: Number(courseForm.teacherId),
    };
    try {
      if (editingCourseId) {
        await api.patch(`/supervisor/courses/${editingCourseId}`, payload);
        setMessage({ type: 'success', text: t('supervisor.courses.update_success') });
      } else {
        await api.post('/supervisor/courses', payload);
        setMessage({ type: 'success', text: t('supervisor.courses.create_success') });
      }
      setCourseForm({ name: '', code: '', weeklyHours: '', classId: '', teacherId: '' });
      setEditingCourseId(null);
      await loadCourses();
    } catch (error) {
      setMessage({ type: 'error', text: t('supervisor.courses.save_error') });
    }
  };

  const startCourseEdit = (course: CourseItem) => {
    setEditingCourseId(course.id);
    setCourseForm({
      name: course.name,
      code: course.code,
      weeklyHours: String(course.weeklyHours),
      classId: String(course.class.id),
      teacherId: String(course.teacher.id),
    });
  };

  const cancelCourseEdit = () => {
    setEditingCourseId(null);
    setCourseForm({ name: '', code: '', weeklyHours: '', classId: '', teacherId: '' });
  };

  const handleCourseDelete = async (courseId: number) => {
    resetMessages();
    try {
      await api.delete(`/supervisor/courses/${courseId}`);
      setMessage({ type: 'success', text: t('supervisor.courses.delete_success') });
      await loadCourses();
    } catch (error) {
      setMessage({ type: 'error', text: t('supervisor.courses.delete_error') });
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-800">{t('supervisor.dashboard.title')}</h2>
        <p className="mt-2 text-sm text-slate-500">{t('supervisor.dashboard.description')}</p>
        {message && (
          <p
            className={`mt-4 rounded px-4 py-2 text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-slate-800">{t('supervisor.teachers.title')}</h3>
        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleTeacherCreate}>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="teacher-name">
              {t('common.name')}
            </label>
            <input
              id="teacher-name"
              value={teacherForm.name}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="teacher-email">
              {t('common.email')}
            </label>
            <input
              id="teacher-email"
              type="email"
              value={teacherForm.email}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, email: event.target.value }))}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="teacher-password">
              {t('common.password')}
            </label>
            <input
              id="teacher-password"
              type="password"
              value={teacherForm.password}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, password: event.target.value }))}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="teacher-color">
              {t('supervisor.teachers.color')}
            </label>
            <input
              id="teacher-color"
              type="color"
              value={teacherForm.displayColor}
              onChange={(event) => setTeacherForm((prev) => ({ ...prev, displayColor: event.target.value }))}
              className="mt-1 h-10 w-full rounded border border-slate-200"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700"
            >
              {t('supervisor.teachers.add_button')}
            </button>
          </div>
        </form>

        <ul className="mt-6 space-y-3">
          {teachers.map((teacher) => (
            <li
              key={teacher.id}
              className="rounded border border-slate-200 p-4"
            >
              {editingTeacherId === teacher.id ? (
                <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleTeacherUpdate}>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-500" htmlFor={`edit-teacher-name-${teacher.id}`}>
                      {t('common.name')}
                    </label>
                    <input
                      id={`edit-teacher-name-${teacher.id}`}
                      value={editingTeacherForm.name}
                      onChange={(event) =>
                        setEditingTeacherForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                      className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-500" htmlFor={`edit-teacher-email-${teacher.id}`}>
                      {t('common.email')}
                    </label>
                    <input
                      id={`edit-teacher-email-${teacher.id}`}
                      type="email"
                      value={editingTeacherForm.email}
                      onChange={(event) =>
                        setEditingTeacherForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-500" htmlFor={`edit-teacher-password-${teacher.id}`}>
                      {t('common.password')}
                    </label>
                    <input
                      id={`edit-teacher-password-${teacher.id}`}
                      type="password"
                      value={editingTeacherForm.password}
                      onChange={(event) =>
                        setEditingTeacherForm((prev) => ({ ...prev, password: event.target.value }))
                      }
                      className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-slate-500" htmlFor={`edit-teacher-color-${teacher.id}`}>
                      {t('supervisor.teachers.color')}
                    </label>
                    <input
                      id={`edit-teacher-color-${teacher.id}`}
                      type="color"
                      value={editingTeacherForm.displayColor}
                      onChange={(event) =>
                        setEditingTeacherForm((prev) => ({ ...prev, displayColor: event.target.value }))
                      }
                      className="mt-1 h-10 w-full rounded border border-slate-200"
                    />
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <button
                      type="submit"
                      className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      type="button"
                      onClick={cancelTeacherEdit}
                      className="rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="h-4 w-4 rounded-full" style={{ backgroundColor: teacher.displayColor }} />
                    <div>
                      <p className="font-semibold text-slate-700">{teacher.user.name}</p>
                      <p className="text-sm text-slate-500">{teacher.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEditTeacher(teacher)}
                      className="rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                    >
                      {t('common.edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTeacherDelete(teacher.id)}
                      className="rounded bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-slate-800">{t('supervisor.classes.title')}</h3>
        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={handleClassSubmit}>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="class-name">
              {t('supervisor.classes.name')}
            </label>
            <input
              id="class-name"
              value={editingClassId ? editingClassForm.name : classForm.name}
              onChange={(event) => {
                const value = event.target.value;
                if (editingClassId) {
                  setEditingClassForm((prev) => ({ ...prev, name: value }));
                } else {
                  setClassForm((prev) => ({ ...prev, name: value }));
                }
              }}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="class-grade">
              {t('supervisor.classes.grade')}
            </label>
            <input
              id="class-grade"
              value={editingClassId ? editingClassForm.grade : classForm.grade}
              onChange={(event) => {
                const value = event.target.value;
                if (editingClassId) {
                  setEditingClassForm((prev) => ({ ...prev, grade: value }));
                } else {
                  setClassForm((prev) => ({ ...prev, grade: value }));
                }
              }}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="class-branch">
              {t('supervisor.classes.branch')}
            </label>
            <input
              id="class-branch"
              value={editingClassId ? editingClassForm.branch : classForm.branch}
              onChange={(event) => {
                const value = event.target.value;
                if (editingClassId) {
                  setEditingClassForm((prev) => ({ ...prev, branch: value }));
                } else {
                  setClassForm((prev) => ({ ...prev, branch: value }));
                }
              }}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex items-center gap-2 md:col-span-3">
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {editingClassId ? t('common.save') : t('supervisor.classes.add_button')}
            </button>
            {editingClassId && (
              <button
                type="button"
                onClick={cancelClassEdit}
                className="rounded bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {classes.map((classItem) => (
            <div key={classItem.id} className="flex flex-col justify-between gap-3 rounded border border-slate-200 p-4 md:flex-row md:items-center">
              <div>
                <p className="text-lg font-semibold text-slate-700">{classItem.name}</p>
                <p className="text-sm text-slate-500">
                  {classItem.grade} / {classItem.branch}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startClassEdit(classItem)}
                  className="rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                >
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleClassDelete(classItem.id)}
                  className="rounded bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-slate-800">{t('supervisor.courses.title')}</h3>
        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleCourseSubmit}>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="course-name">
              {t('supervisor.courses.name')}
            </label>
            <input
              id="course-name"
              value={courseForm.name}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, name: event.target.value }))}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="course-code">
              {t('supervisor.courses.code')}
            </label>
            <input
              id="course-code"
              value={courseForm.code}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, code: event.target.value }))}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="course-hours">
              {t('supervisor.courses.weekly_hours')}
            </label>
            <input
              id="course-hours"
              type="number"
              min={1}
              value={courseForm.weeklyHours}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, weeklyHours: event.target.value }))}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="course-class">
              {t('supervisor.courses.class')}
            </label>
            <select
              id="course-class"
              value={courseForm.classId}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, classId: event.target.value }))}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">{t('common.select_placeholder')}</option>
              {classOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium text-slate-600" htmlFor="course-teacher">
              {t('supervisor.courses.teacher')}
            </label>
            <select
              id="course-teacher"
              value={courseForm.teacherId}
              onChange={(event) => setCourseForm((prev) => ({ ...prev, teacherId: event.target.value }))}
              className="mt-1 rounded border border-slate-200 px-3 py-2 text-sm"
              required
            >
              <option value="">{t('common.select_placeholder')}</option>
              {teacherOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {editingCourseId ? t('common.save') : t('supervisor.courses.add_button')}
            </button>
            {editingCourseId && (
              <button
                type="button"
                onClick={cancelCourseEdit}
                className="rounded bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
              >
                {t('common.cancel')}
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="flex flex-col gap-3 rounded border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-700">{course.name}</p>
                <p className="text-sm text-slate-500">
                  {course.code} · {t('supervisor.courses.weekly_hours_short', { hours: course.weeklyHours })}
                </p>
                <p className="text-sm text-slate-500">
                  {t('supervisor.courses.class_label', { className: course.class.name })}
                </p>
                <div className="mt-1 flex items-center gap-2 text-sm text-slate-600">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: course.teacher.displayColor }}
                  />
                  <span>{course.teacher.user.name}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startCourseEdit(course)}
                  className="rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
                >
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => handleCourseDelete(course.id)}
                  className="rounded bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
