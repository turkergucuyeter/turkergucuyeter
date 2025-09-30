import { FormEvent, useEffect, useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import { t } from "../utils/i18n";

interface TeacherClass {
  id: string;
  name: string;
  color: string;
  courses: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

interface Session {
  id: string;
  courseId: string;
  course: {
    name: string;
    class: {
      name: string;
    };
  };
  date: string;
  startTime: string;
  endTime: string;
  isLocked: boolean;
}

interface AttendanceRow {
  studentId: string;
  studentName: string;
  status: "present" | "excused" | "unexcused";
}

export const TeacherDashboard: React.FC = () => {
  const { request } = useApi();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [sessionMeta, setSessionMeta] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request<TeacherClass[]>("/teacher/classes")
      .then((data) => {
        setClasses(data);
        if (data.length > 0) {
          setSelectedClassId(data[0].id);
        }
      })
      .catch((err: any) => setError(err?.message ?? t("common.error")));
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    request<Session[]>(`/teacher/classes/${selectedClassId}/sessions`)
      .then((data) => {
        setSessions(data);
        if (data.length > 0) {
          setSelectedSessionId(data[0].id);
        } else {
          setSelectedSessionId(null);
          setAttendance([]);
        }
      })
      .catch((err: any) => setError(err?.message ?? t("common.error")));
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedSessionId) return;
    request<{ session: Session; attendances: AttendanceRow[] }>(`/teacher/sessions/${selectedSessionId}/attendance`)
      .then((data) => {
        setAttendance(data.attendances);
        setSessionMeta(data.session);
      })
      .catch((err: any) => setError(err?.message ?? t("common.error")));
  }, [selectedSessionId]);

  const handleStatusChange = (studentId: string, status: AttendanceRow["status"]) => {
    setAttendance((prev) => prev.map((row) => (row.studentId === studentId ? { ...row, status } : row)));
  };

  const saveAttendance = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    try {
      const payload = { students: attendance };
      await request(`/teacher/sessions/${selectedSessionId}/attendance`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    }
  };

  const updateAttendance = async () => {
    if (!selectedSessionId) return;
    try {
      const payload = { students: attendance };
      await request(`/teacher/sessions/${selectedSessionId}/attendance`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? t("common.error"));
    }
  };

  const selectedClass = useMemo(() => classes.find((cls) => cls.id === selectedClassId), [classes, selectedClassId]);
  const selectedSession = useMemo(() => sessions.find((session) => session.id === selectedSessionId) ?? sessionMeta, [
    sessions,
    selectedSessionId,
    sessionMeta,
  ]);

  return (
    <div className="dashboard">
      {error && <div style={{ color: "#dc2626", marginBottom: "1rem" }}>{error}</div>}

      <section className="card">
        <h2>{t("dashboard.teacher.classes")}</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {classes.map((klass) => (
            <button
              key={klass.id}
              className="button"
              style={{ background: klass.color }}
              onClick={() => setSelectedClassId(klass.id)}
            >
              {klass.name}
            </button>
          ))}
        </div>
      </section>

      {selectedClass && (
        <section className="card">
          <h2>{t("dashboard.teacher.sessions")}</h2>
          <div className="attendance-grid">
            {sessions.map((session) => (
              <div key={session.id} className="session-card">
                <div>
                  <strong>{session.course.name}</strong> - {new Date(session.date).toLocaleString()}
                </div>
                <div>
                  {session.isLocked ? t("attendance.locked") : ""}
                  <button className="button secondary" style={{ marginLeft: "1rem" }} onClick={() => setSelectedSessionId(session.id)}>
                    {t("dashboard.teacher.attendance")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {selectedSession && (
        <section className="card">
          <h2>
            {t("dashboard.teacher.attendance")} - {selectedSession.course.name}
          </h2>
          <form onSubmit={saveAttendance} className="attendance-grid">
            <table className="table">
              <thead>
                <tr>
                  <th>Öğrenci</th>
                  <th>{t("attendance.status.present")}</th>
                  <th>{t("attendance.status.excused")}</th>
                  <th>{t("attendance.status.unexcused")}</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((row) => (
                  <tr key={row.studentId}>
                    <td>{row.studentName}</td>
                    <td>
                      <input
                        type="radio"
                        name={row.studentId}
                        value="present"
                        checked={row.status === "present"}
                        onChange={() => handleStatusChange(row.studentId, "present")}
                      />
                    </td>
                    <td>
                      <input
                        type="radio"
                        name={row.studentId}
                        value="excused"
                        checked={row.status === "excused"}
                        onChange={() => handleStatusChange(row.studentId, "excused")}
                      />
                    </td>
                    <td>
                      <input
                        type="radio"
                        name={row.studentId}
                        value="unexcused"
                        checked={row.status === "unexcused"}
                        onChange={() => handleStatusChange(row.studentId, "unexcused")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="button" type="submit" disabled={selectedSession.isLocked}>
                {t("attendance.save")}
              </button>
              <button className="button secondary" type="button" onClick={updateAttendance} disabled={selectedSession.isLocked}>
                {t("attendance.updated")}
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
};
