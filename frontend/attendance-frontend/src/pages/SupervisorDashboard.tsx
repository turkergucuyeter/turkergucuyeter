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
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-xl font-semibold text-slate-800">{t('supervisor.dashboard.title')}</h2>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
