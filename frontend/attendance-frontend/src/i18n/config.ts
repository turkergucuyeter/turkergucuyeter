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
      'supervisor.dashboard.description': 'Öğretmenleri, sınıfları, dersleri ve dönemleri bu panelden yönetebilirsiniz.',
      'supervisor.feedback.load_error': 'Veriler yüklenirken bir hata oluştu.',
      'supervisor.teachers.title': 'Öğretmenler',
      'supervisor.teachers.add_button': 'Öğretmen Oluştur',
      'supervisor.teachers.color': 'Renk',
      'supervisor.teachers.create_success': 'Öğretmen başarıyla oluşturuldu.',
      'supervisor.teachers.create_error': 'Öğretmen oluşturulurken hata oluştu.',
      'supervisor.teachers.update_success': 'Öğretmen bilgileri güncellendi.',
      'supervisor.teachers.update_error': 'Öğretmen güncellenirken hata oluştu.',
      'supervisor.teachers.delete_success': 'Öğretmen silindi.',
      'supervisor.teachers.delete_error': 'Öğretmen silinirken hata oluştu.',
      'supervisor.classes.title': 'Sınıflar',
      'supervisor.classes.name': 'Sınıf Adı',
      'supervisor.classes.grade': 'Seviye',
      'supervisor.classes.branch': 'Şube',
      'supervisor.classes.add_button': 'Sınıf Oluştur',
      'supervisor.classes.create_success': 'Sınıf başarıyla oluşturuldu.',
      'supervisor.classes.update_success': 'Sınıf güncellendi.',
      'supervisor.classes.save_error': 'Sınıf kaydedilirken hata oluştu.',
      'supervisor.classes.delete_success': 'Sınıf silindi.',
      'supervisor.classes.delete_error': 'Sınıf silinirken hata oluştu.',
      'supervisor.courses.title': 'Dersler',
      'supervisor.courses.name': 'Ders Adı',
      'supervisor.courses.code': 'Ders Kodu',
      'supervisor.courses.weekly_hours': 'Haftalık Saat',
      'supervisor.courses.weekly_hours_short': '{{hours}} saat/hafta',
      'supervisor.courses.class': 'Sınıf',
      'supervisor.courses.class_label': '{{className}} sınıfı',
      'supervisor.courses.teacher': 'Öğretmen',
      'supervisor.courses.add_button': 'Ders Oluştur',
      'supervisor.courses.create_success': 'Ders oluşturuldu.',
      'supervisor.courses.update_success': 'Ders güncellendi.',
      'supervisor.courses.save_error': 'Ders kaydedilirken hata oluştu.',
      'supervisor.courses.delete_success': 'Ders silindi.',
      'supervisor.courses.delete_error': 'Ders silinirken hata oluştu.',
      'common.name': 'Ad',
      'common.email': 'E-posta',
      'common.password': 'Şifre',
      'common.save': 'Kaydet',
      'common.cancel': 'Vazgeç',
      'common.edit': 'Düzenle',
      'common.delete': 'Sil',
      'common.select_placeholder': 'Seçiniz',
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
