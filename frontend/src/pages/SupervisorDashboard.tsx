import { FormEvent, useEffect, useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import { t } from "../utils/i18n";
import { useAuth } from "../context/AuthContext";

interface Teacher {
  id: string;
  displayColor: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Student {
  id: string;
  studentNo: string;
  guardianContact?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ClassModel {
  id: string;
  name: string;
  grade: number;
  branch: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  classId: string;
  weeklyHours: number;
}

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  absenceThresholdPercent: number;
}

interface AttendanceSummaryRow {
  studentId: string;
  courseId: string;
  percent: number;
  threshold: number;
}

export const SupervisorDashboard: React.FC = () => {
  const { request } = useApi();
  const { accessToken } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [reportSummary, setReportSummary] = useState<AttendanceSummaryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teacherData, studentData, classData, courseData, termData] = await Promise.all([
        request<Teacher[]>("/supervisor/teachers"),
        request<Student[]>("/supervisor/students"),
        request<ClassModel[]>("/supervisor/classes"),
        request<Course[]>("/supervisor/courses"),
        request<Term[]>("/supervisor/terms").catch(() => [] as Term[]),
      ]);
      setTeachers(teacherData);
      setStudents(studentData);
      setClasses(classData);
      setCourses(courseData);
      setTerms(termData);
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadData();
    }
  }, [accessToken]);

  const handleTeacherCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await request("/supervisor/teachers", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
          displayColor: formData.get("displayColor"),
        }),
      });
      form.reset();
      await loadData();
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    }
  };

  const handleStudentCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      await request("/supervisor/students", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          password: formData.get("password"),
          studentNo: formData.get("studentNo"),
          guardianContact: formData.get("guardianContact"),
        }),
      });
      form.reset();
      await loadData();
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    }
  };

  const handleClassCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      await request("/supervisor/classes", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("className"),
          grade: Number(formData.get("grade")),
          branch: formData.get("branch"),
        }),
      });
      event.currentTarget.reset();
      await loadData();
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    }
  };

  const handleCourseCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      await request("/supervisor/courses", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("courseName"),
          code: formData.get("courseCode"),
          teacherId: formData.get("teacherId"),
          classId: formData.get("classId"),
          weeklyHours: Number(formData.get("weeklyHours")),
        }),
      });
      event.currentTarget.reset();
      await loadData();
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    }
  };

  const handleTermCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    try {
      await request("/supervisor/terms", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("termName"),
          startDate: formData.get("startDate"),
          endDate: formData.get("endDate"),
          absenceThresholdPercent: Number(formData.get("threshold")),
        }),
      });
      event.currentTarget.reset();
      await loadData();
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    }
  };

  const fetchReports = async () => {
    try {
      const response = await request<{ summary: AttendanceSummaryRow[] }>("/supervisor/reports/attendance");
      setReportSummary(response.summary ?? []);
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchReports();
    }
  }, [accessToken]);

  const teacherOptions = useMemo(
    () =>
      teachers.map((teacher) => (
        <option key={teacher.id} value={teacher.id}>
          {teacher.user.name}
        </option>
      )),
    [teachers]
  );

  const classOptions = useMemo(
    () =>
      classes.map((klass) => (
        <option key={klass.id} value={klass.id}>
          {klass.name}
        </option>
      )),
    [classes]
  );

  return (
    <div className="dashboard">
      {error && <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</div>}
      {loading && <div>{t("common.loading")}</div>}

      <section className="card">
        <h2>{t("dashboard.supervisor.teachers")}</h2>
        <form className="form-grid" onSubmit={handleTeacherCreate}>
          <label>
            {t("form.name")}
            <input name="name" required />
          </label>
          <label>
            {t("form.email")}
            <input name="email" type="email" required />
          </label>
          <label>
            {t("form.password")}
            <input name="password" type="password" required />
          </label>
          <label>
            {t("form.displayColor")}
            <input name="displayColor" defaultValue="#2563eb" required />
          </label>
          <button className="button" type="submit">
            {t("form.submit")}
          </button>
        </form>
        <table className="table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>{t("form.name")}</th>
              <th>{t("form.email")}</th>
              <th>{t("form.displayColor")}</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.user.name}</td>
                <td>{teacher.user.email}</td>
                <td>
                  <span className="teacher-badge">
                    <span className="badge-color" style={{ background: teacher.displayColor }} />
                    {teacher.displayColor}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>{t("dashboard.supervisor.students")}</h2>
        <form className="form-grid" onSubmit={handleStudentCreate}>
          <label>
            {t("form.name")}
            <input name="name" required />
          </label>
          <label>
            {t("form.email")}
            <input name="email" type="email" required />
          </label>
          <label>
            {t("form.password")}
            <input name="password" type="password" required />
          </label>
          <label>
            {t("form.studentNo")}
            <input name="studentNo" required />
          </label>
          <label>
            {t("form.guardianContact")}
            <input name="guardianContact" />
          </label>
          <button className="button" type="submit">
            {t("form.submit")}
          </button>
        </form>
        <table className="table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>{t("form.name")}</th>
              <th>{t("form.email")}</th>
              <th>{t("form.studentNo")}</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.user.name}</td>
                <td>{student.user.email}</td>
                <td>{student.studentNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>{t("dashboard.supervisor.classes")}</h2>
        <form className="form-grid" onSubmit={handleClassCreate}>
          <label>
            {t("form.className")}
            <input name="className" required />
          </label>
          <label>
            {t("form.grade")}
            <input name="grade" type="number" min={1} max={12} required />
          </label>
          <label>
            {t("form.branch")}
            <input name="branch" required />
          </label>
          <button className="button" type="submit">
            {t("form.submit")}
          </button>
        </form>
        <table className="table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>{t("form.className")}</th>
              <th>{t("form.grade")}</th>
              <th>{t("form.branch")}</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((klass) => (
              <tr key={klass.id}>
                <td>{klass.name}</td>
                <td>{klass.grade}</td>
                <td>{klass.branch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>{t("dashboard.supervisor.courses")}</h2>
        <form className="form-grid" onSubmit={handleCourseCreate}>
          <label>
            {t("form.courseName")}
            <input name="courseName" required />
          </label>
          <label>
            {t("form.courseCode")}
            <input name="courseCode" required />
          </label>
          <label>
            {t("form.teacher")}
            <select name="teacherId" required>
              <option value="">Seçiniz</option>
              {teacherOptions}
            </select>
          </label>
          <label>
            {t("form.className")}
            <select name="classId" required>
              <option value="">Seçiniz</option>
              {classOptions}
            </select>
          </label>
          <label>
            {t("form.weeklyHours")}
            <input name="weeklyHours" type="number" min={1} required />
          </label>
          <button className="button" type="submit">
            {t("form.submit")}
          </button>
        </form>
        <table className="table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>{t("form.courseName")}</th>
              <th>{t("form.courseCode")}</th>
              <th>{t("form.teacher")}</th>
              <th>{t("form.className")}</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => {
              const teacher = teachers.find((tchr) => tchr.id === course.teacherId);
              const klass = classes.find((cls) => cls.id === course.classId);
              return (
                <tr key={course.id}>
                  <td>{course.name}</td>
                  <td>{course.code}</td>
                  <td>{teacher?.user.name ?? "-"}</td>
                  <td>{klass?.name ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>{t("dashboard.supervisor.terms")}</h2>
        <form className="form-grid" onSubmit={handleTermCreate}>
          <label>
            {t("form.termName")}
            <input name="termName" required />
          </label>
          <label>
            {t("form.startDate")}
            <input name="startDate" type="date" required />
          </label>
          <label>
            {t("form.endDate")}
            <input name="endDate" type="date" required />
          </label>
          <label>
            {t("form.threshold")}
            <input name="threshold" type="number" min={0} max={100} defaultValue={30} />
          </label>
          <button className="button" type="submit">
            {t("form.submit")}
          </button>
        </form>
        <table className="table" style={{ marginTop: "1rem" }}>
          <thead>
            <tr>
              <th>{t("form.termName")}</th>
              <th>{t("form.startDate")}</th>
              <th>{t("form.endDate")}</th>
              <th>{t("form.threshold")}</th>
            </tr>
          </thead>
          <tbody>
            {terms.map((term) => (
              <tr key={term.id}>
                <td>{term.name}</td>
                <td>{new Date(term.startDate).toLocaleDateString()}</td>
                <td>{new Date(term.endDate).toLocaleDateString()}</td>
                <td>%{term.absenceThresholdPercent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h2>{t("dashboard.supervisor.reports")}</h2>
        <button className="button" style={{ marginBottom: "1rem" }} onClick={fetchReports}>
          {t("reports.summary")}
        </button>
        <table className="table">
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Ders</th>
              <th>{t("reports.percent")}</th>
              <th>Eşik</th>
            </tr>
          </thead>
          <tbody>
            {reportSummary.map((row) => {
              const student = students.find((s) => s.id === row.studentId);
              const course = courses.find((c) => c.id === row.courseId);
              return (
                <tr key={`${row.studentId}-${row.courseId}`}>
                  <td>{student?.user.name ?? row.studentId}</td>
                  <td>{course?.name ?? row.courseId}</td>
                  <td>%{row.percent.toFixed(1)}</td>
                  <td>%{row.threshold}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
};
