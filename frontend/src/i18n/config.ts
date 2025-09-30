import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  tr: {
    translation: {
      'auth.login.title': 'Yoklama Sistemine Giriş',
      'auth.email': 'E-posta',
      'auth.password': 'Şifre',
      'auth.login.button': 'Giriş Yap',
      'auth.logout': 'Çıkış',
      'dashboard.welcome': 'Hoş geldin, {{name}}',
      'dashboard.supervisor.subtitle': 'Yönetim paneli özetiniz',
      'dashboard.teacher.subtitle': 'Bugünkü derslerin ve yoklama durumların',
      'dashboard.student.subtitle': 'Derslerindeki devamsızlık durumun',
      'teacher.classes.title': 'Sınıflarım',
      'teacher.sessions.title': 'Ders Oturumları',
      'teacher.attendance.title': 'Manuel Yoklama',
      'teacher.attendance.save': 'Kaydet',
      'teacher.attendance.status.present': 'Var',
      'teacher.attendance.status.excused': 'İzinli',
      'teacher.attendance.status.unexcused': 'İzinsiz',
      'supervisor.teachers.title': 'Öğretmen Yönetimi',
      'supervisor.students.title': 'Öğrenci Yönetimi',
      'supervisor.classes.title': 'Sınıflar ve Dersler',
      'supervisor.reports.title': 'Raporlar',
      'notifications.title': 'Bildirimler',
      'reports.download.csv': 'CSV indir',
      'reports.download.pdf': 'PDF indir',
      'student.courses.title': 'Derslerim',
      'student.attendance.rate': 'Devamsızlık Oranı',
      'student.attendance.sessions': 'Oturum Geçmişi',
      'alerts.absence.threshold': 'Devamsızlık oranınız %{{percent}} eşiğini aştı!'
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'tr',
  fallbackLng: 'tr',
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
