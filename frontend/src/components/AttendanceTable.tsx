import { AttendanceStatusOption } from '../types/attendance';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface AttendanceTableProps {
  students: Array<{ id: number; name: string; studentNo: string }>;
  values: Record<number, AttendanceStatusOption>;
  onChange: (studentId: number, status: AttendanceStatusOption) => void;
  disabled?: boolean;
}

const statusOptions: AttendanceStatusOption[] = ['present', 'excused', 'unexcused'];

const AttendanceTable = ({ students, values, onChange, disabled }: AttendanceTableProps) => {
  const { t } = useTranslation();

  return (
    <table className="min-w-full divide-y divide-slate-200 bg-white shadow rounded-lg overflow-hidden">
      <thead className="bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Öğrenci</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Numara</th>
          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200">
        {students.map((student) => (
          <tr key={student.id} className="hover:bg-slate-50">
            <td className="px-4 py-3 text-sm font-medium text-slate-800">{student.name}</td>
            <td className="px-4 py-3 text-sm text-slate-500">{student.studentNo}</td>
            <td className="px-4 py-3 text-sm">
              <div className="flex gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(student.id, status)}
                    className={clsx(
                      'px-3 py-1 rounded-full border text-xs font-semibold transition-colors',
                      values[student.id] === status
                        ? {
                            present: 'bg-emerald-100 border-emerald-400 text-emerald-700',
                            excused: 'bg-amber-100 border-amber-400 text-amber-700',
                            unexcused: 'bg-rose-100 border-rose-400 text-rose-700'
                          }[status]
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'
                    )}
                  >
                    {t(`teacher.attendance.status.${status}`)}
                  </button>
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AttendanceTable;
