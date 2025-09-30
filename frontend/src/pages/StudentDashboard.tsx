import { useEffect, useState } from "react";
import { useApi } from "../hooks/useApi";
import { t } from "../utils/i18n";

interface StudentCourse {
  id: string;
  name: string;
  code: string;
  teacherName: string;
  teacherColor: string;
}

interface AttendanceSummary {
  course: {
    id: string;
    name: string;
    code: string;
    teacherColor: string;
  };
  percent: number;
  totalSessions: number;
  absences: number;
  history: Array<{
    date: string;
    status: "present" | "excused" | "unexcused";
  }>;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

export const StudentDashboard: React.FC = () => {
  const { request } = useApi();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<StudentCourse[]>("/student/courses")
      .then((data) => {
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourse(data[0].id);
        }
      })
      .catch((err: any) => setError(err?.message ?? t("common.error")));

    request<Notification[]>("/student/notifications")
      .then(setNotifications)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    request<AttendanceSummary>(`/student/courses/${selectedCourse}/attendance-summary`)
      .then((data) => setSummary(data))
      .catch((err: any) => setError(err?.message ?? t("common.error")));
  }, [selectedCourse]);

  return (
    <div className="dashboard">
      {error && <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</div>}
      <section className="card">
        <h2>{t("dashboard.student.courses")}</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {courses.map((course) => (
            <button
              key={course.id}
              className="button"
              style={{ background: course.teacherColor }}
              onClick={() => setSelectedCourse(course.id)}
            >
              {course.name}
            </button>
          ))}
        </div>
      </section>

      {summary && (
        <section className="card">
          <h2>{t("dashboard.student.attendance")}</h2>
          {summary.percent >= 30 && <div style={{ color: "#dc2626" }}>{t("student.warning")}</div>}
          <p>
            {t("reports.percent")}: %{summary.percent.toFixed(1)} ({summary.absences}/{summary.totalSessions})
          </p>
          <table className="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>{t("dashboard.student.attendance")}</th>
              </tr>
            </thead>
            <tbody>
              {summary.history.map((item, index) => (
                <tr key={`${item.date}-${index}`}>
                  <td>{new Date(item.date).toLocaleString()}</td>
                  <td>{t(`attendance.status.${item.status}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="card">
        <h2>{t("notifications.title")}</h2>
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id} style={{ marginBottom: "0.5rem" }}>
              <strong>{notification.title}</strong> - {notification.body}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
