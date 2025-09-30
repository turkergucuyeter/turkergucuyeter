import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  tr: {
    translation: {
      'auth.login.title': 'Giriş Yap',
      'auth.login.email': 'E-posta',
      'auth.login.password': 'Şifre',
      'auth.login.submit': 'Giriş',
      'layout.logout': 'Çıkış Yap',
      'layout.welcome': 'Hoş geldiniz, {{name}}',
      'teacher.classes.title': 'Sınıflarım',
      'teacher.sessions.title': 'Ders Oturumları',
      'teacher.attendance.save': 'Kaydet',
      'teacher.attendance.update': 'Güncelle',
      'teacher.attendance.locked': 'Ders süresi dışında güncelleme yapılamaz.',
      'teacher.reports.title': 'Ders Raporlarım',
      'student.courses.title': 'Derslerim',
      'student.absence.warning': 'Devamsızlık uyarısı: %{percentage}',
      'student.notifications.absence_threshold_title': 'Devamsızlık Uyarısı',
      'student.notifications.absence_threshold_body': 'Devamsızlık oranınız belirlenen eşiği aştı.',
      'supervisor.dashboard.title': 'Supervisor Paneli',
      'notifications.empty': 'Bildirim bulunmuyor.'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'tr',
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
