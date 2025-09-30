import { FormEvent, useEffect, useMemo, useState } from "react";
import { useApi } from "../hooks/useApi";
import { t } from "../utils/i18n";

interface CourseSection {
  courseId: string;
  classId: string;
  className: string;
  weeklyHours: number | null;
}

interface CourseGroup {
  name: string;
  code: string | null;
  color: string;
  sections: CourseSection[];
}

interface SessionItem {
  id: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  isLocked: boolean;
  course: {
    id: string;
    name: string;
    code: string | null;
    class: {
      id: string;
      name: string;
    };
  };
}

interface AttendanceRow {
  studentId: string;
  studentName: string;
  status: "present" | "excused" | "unexcused";
}

interface AttendanceSession {
  id: string;
  course: SessionItem["course"];
  date: string;
  startTime: string;
  endTime: string;
  isLocked: boolean;
  isEditable: boolean;
  editableUntil: string;
}

interface AttendanceResponse {
  session: AttendanceSession;
  attendances: AttendanceRow[];
}

export const TeacherDashboard: React.FC = () => {
  const { request } = useApi();
  const [courses, setCourses] = useState<CourseGroup[]>([]);
  const [selectedCourseIndex, setSelectedCourseIndex] = useState<number>(0);
  const [selectedSection, setSelectedSection] = useState<CourseSection | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [sessionMeta, setSessionMeta] = useState<AttendanceSession | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [feedbackKey, setFeedbackKey] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [loadingSessions, setLoadingSessions] = useState<boolean>(false);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);

  useEffect(() => {
    request<CourseGroup[]>("/teacher/courses")
      .then((data) => {
        setCourses(data);
        if (data.length > 0) {
          setSelectedCourseIndex(0);
          setSelectedSection(data[0].sections[0] ?? null);
        }
      })
      .catch((err: any) => setErrorKey(err?.message ?? "common.error"));
  }, [request]);

  useEffect(() => {
    if (!selectedSection) {
      setSessions([]);
      setSelectedSessionId(null);
      setAttendance([]);
      setSessionMeta(null);
      return;
    }

    const fetchSessions = async () => {
      setLoadingSessions(true);
      try {
        const data = await request<SessionItem[]>(`/teacher/courses/${selectedSection.courseId}/sessions`);
        setSessions(data);
        if (data.length > 0) {
          setSelectedSessionId(data[0].id);
        } else {
          setSelectedSessionId(null);
          setAttendance([]);
          setSessionMeta(null);
        }
        setErrorKey(null);
      } catch (err: any) {
        setErrorKey(err?.message ?? "common.error");
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchSessions();
  }, [request, selectedSection]);

  useEffect(() => {
    if (!selectedSessionId) {
      setAttendance([]);
      setSessionMeta(null);
      return;
    }

    const fetchAttendance = async () => {
      setLoadingAttendance(true);
      try {
        const data = await request<AttendanceResponse>(`/teacher/sessions/${selectedSessionId}/attendance`);
        setAttendance(data.attendances);
        setSessionMeta(data.session);
        setErrorKey(null);
      } catch (err: any) {
        setErrorKey(err?.message ?? "common.error");
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchAttendance();
  }, [request, selectedSessionId]);

  useEffect(() => {
    if (!sessionMeta) return;
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionMeta.id
          ? { ...session, isLocked: sessionMeta.isLocked, startTime: sessionMeta.startTime, endTime: sessionMeta.endTime }
          : session
      )
    );
  }, [sessionMeta]);

  const handleCourseChange = (index: number) => {
    setSelectedCourseIndex(index);
    const newSection = courses[index]?.sections[0] ?? null;
    setSelectedSection(newSection);
    setSelectedSessionId(null);
    setAttendance([]);
    setSessionMeta(null);
    setFeedbackKey(null);
  };

  const handleSectionChange = (section: CourseSection) => {
    setSelectedSection(section);
    setSelectedSessionId(null);
    setAttendance([]);
    setSessionMeta(null);
    setFeedbackKey(null);
  };

  const handleStatusChange = (studentId: string, status: AttendanceRow["status"]) => {
    setAttendance((prev) => prev.map((row) => (row.studentId === studentId ? { ...row, status } : row)));
  };

  const persistAttendance = async (method: "POST" | "PATCH", successKey: string, event?: FormEvent) => {
    event?.preventDefault();
    if (!selectedSessionId) return;
    setIsSaving(true);
    try {
      const payload = { students: attendance };
      await request(`/teacher/sessions/${selectedSessionId}/attendance`, {
        method,
        body: JSON.stringify(payload),
      });
      setFeedbackKey(successKey);
      setErrorKey(null);
      const data = await request<AttendanceResponse>(`/teacher/sessions/${selectedSessionId}/attendance`);
      setAttendance(data.attendances);
      setSessionMeta(data.session);
    } catch (err: any) {
      setErrorKey(err?.message ?? "common.error");
      setFeedbackKey(null);
    } finally {
      setIsSaving(false);
    }
  };

  const saveAttendance = (event: FormEvent) => persistAttendance("POST", "attendance.saved", event);
  const updateAttendance = () => persistAttendance("PATCH", "attendance.updated");

  const selectedCourse = useMemo(() => courses[selectedCourseIndex] ?? null, [courses, selectedCourseIndex]);
  const selectedSession = useMemo(() => sessions.find((session) => session.id === selectedSessionId) ?? null, [
    sessions,
    selectedSessionId,
  ]);

  const isReadOnly = useMemo(() => {
    if (!sessionMeta) return true;
    if (sessionMeta.isLocked) return true;
    return !sessionMeta.isEditable;
  }, [sessionMeta]);

  return (
    <div className="dashboard teacher-flow">
      {errorKey && <div className="alert alert-error">{t(errorKey)}</div>}
      {feedbackKey && <div className="alert alert-success">{t(feedbackKey)}</div>}

      <section className="card">
        <div className="card-header">
          <div>
            <h2>{t("dashboard.teacher.courses")}</h2>
            <p className="card-subtitle">{t("dashboard.teacher.coursesHint")}</p>
          </div>
        </div>
        <div className="chip-row">
          {courses.length === 0 && <p className="empty-state">{t("dashboard.teacher.noCourses")}</p>}
          {courses.map((course, index) => (
            <button
              key={`${course.name}-${course.code ?? ""}-${index}`}
              className={`chip ${index === selectedCourseIndex ? "active" : ""}`}
              style={{ borderColor: course.color, color: course.color }}
              onClick={() => handleCourseChange(index)}
            >
              <span className="chip-indicator" style={{ background: course.color }} />
              <span>
                {course.name}
                {course.code ? ` (${course.code})` : ""}
              </span>
            </button>
          ))}
        </div>
      </section>

      {selectedCourse && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2>{t("dashboard.teacher.classesForCourse", { course: selectedCourse.name })}</h2>
              <p className="card-subtitle">{t("dashboard.teacher.classesHint")}</p>
            </div>
          </div>
          <div className="section-grid">
            {selectedCourse.sections.length === 0 && <p className="empty-state">{t("dashboard.teacher.noClasses")}</p>}
            {selectedCourse.sections.map((section) => (
              <button
                key={section.courseId}
                className={`section-card ${selectedSection?.courseId === section.courseId ? "active" : ""}`}
                onClick={() => handleSectionChange(section)}
              >
                <span className="section-class-name">{section.className}</span>
                {section.weeklyHours ? (
                  <span className="section-meta">{t("dashboard.teacher.weeklyHours", { count: section.weeklyHours })}</span>
                ) : null}
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedSection && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2>{t("dashboard.teacher.sessions")}</h2>
              <p className="card-subtitle">{t("dashboard.teacher.sessionsHint")}</p>
            </div>
          </div>
          {loadingSessions ? (
            <div className="skeleton" />
          ) : (
            <div className="session-timeline">
              {sessions.map((session) => {
                const selected = selectedSessionId === session.id;
                return (
                  <button
                    key={session.id}
                    className={`timeline-item ${selected ? "active" : ""}`}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setFeedbackKey(null);
                    }}
                  >
                    <div className="timeline-meta">
                      <span className="timeline-title">{new Date(session.date).toLocaleDateString()}</span>
                      <span className="timeline-time">
                        {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                        {" "}
                        {new Date(session.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {session.isLocked && <span className="timeline-lock">{t("attendance.locked")}</span>}
                  </button>
                );
              })}
              {sessions.length === 0 && <p className="empty-state">{t("dashboard.teacher.noSessions")}</p>}
            </div>
          )}
        </section>
      )}

      {selectedSession && sessionMeta && (
        <section className="card">
          <div className="card-header">
            <div>
              <h2>
                {t("dashboard.teacher.attendanceFor", { course: selectedSession.course.name, klass: selectedSession.course.class.name })}
              </h2>
              <p className="card-subtitle">
                {t("dashboard.teacher.sessionWindow", {
                  start: new Date(sessionMeta.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  end: new Date(sessionMeta.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                })}
              </p>
            </div>
            <div className="session-status">
              {isReadOnly ? (
                <span className="status-pill warning">{t("dashboard.teacher.readonly")}</span>
              ) : (
                <span className="status-pill success">{t("dashboard.teacher.openForEdit", {
                  until: new Date(sessionMeta.editableUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                })}</span>
              )}
            </div>
          </div>
          {loadingAttendance ? (
            <div className="skeleton" />
          ) : (
            <form onSubmit={saveAttendance} className="attendance-grid">
              <table className="table fancy">
                <thead>
                  <tr>
                    <th>{t("dashboard.teacher.studentColumn")}</th>
                    <th>{t("attendance.status.present")}</th>
                    <th>{t("attendance.status.excused")}</th>
                    <th>{t("attendance.status.unexcused")}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row) => (
                    <tr key={row.studentId}>
                      <td>
                        <div className="student-cell">
                          <span className="avatar" aria-hidden style={{ background: selectedCourse?.color }}>
                            {row.studentName
                              .split(" ")
                              .map((piece) => piece.charAt(0))
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </span>
                          <span>{row.studentName}</span>
                        </div>
                      </td>
                      {(["present", "excused", "unexcused"] as AttendanceRow["status"][]).map((status) => (
                        <td key={status}>
                          <label className="radio-pill">
                            <input
                              type="radio"
                              name={row.studentId}
                              value={status}
                              checked={row.status === status}
                              onChange={() => handleStatusChange(row.studentId, status)}
                              disabled={isReadOnly}
                            />
                            <span>{t(`attendance.status.${status}`)}</span>
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="action-row">
                <button className="button" type="submit" disabled={isReadOnly || isSaving}>
                  {isSaving ? t("dashboard.teacher.saving") : t("attendance.save")}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={updateAttendance}
                  disabled={isReadOnly || isSaving}
                >
                  {isSaving ? t("dashboard.teacher.saving") : t("attendance.updated")}
                </button>
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
};
