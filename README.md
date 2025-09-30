# Online Yoklama Takip Uygulaması

Supervisor, öğretmen ve öğrencilerin manuel yoklama yönetimini kolaylaştıran tam yığın (Node.js + React) bir MVP.

## İçindekiler

- [Mimari Genel Bakış](#mimari-genel-bakış)
- [Başlangıç Adımları](#başlangıç-adımları)
- [Backend (API) Kurulumu](#backend-api-kurulumu)
- [Frontend (Web Uygulaması) Kurulumu](#frontend-web-uygulaması-kurulumu)
- [Demo Kullanıcıları](#demo-kullanıcıları)
- [Önemli Özellikler](#önemli-özellikler)
- [Geliştirme İpuçları](#geliştirme-ipuçları)

## Mimari Genel Bakış

- **Backend**: Node.js + Express + Prisma (SQLite dosyası).
  - JWT tabanlı kimlik doğrulama (access + refresh token).
  - Rol bazlı yetkilendirme (Supervisor, Teacher, Student).
  - Swagger dokümantasyonu `GET /docs`.
  - Web push (VAPID) + In-App bildirimleri.
  - Audit log ve feature flag alt yapısı.
- **Frontend**: React + Vite + TypeScript + Tailwind.
  - Rol tabanlı yönlendirme ve paneller.
  - Manuel yoklama ekranı, raporlar, devamsızlık takipleri.
  - i18n (Türkçe anahtar temelli metinler).

## Başlangıç Adımları

> Projede kullanılan teknolojileri hiç bilmediğin varsayımıyla adımları sırayla takip et.

1. **Depoyu klonla** ve proje kökünde çalış:
   ```bash
   git clone <repo-url>
   cd turkergucuyeter
   ```
2. **Backend ve Frontend bağımlılıklarını** ayrı ayrı yükle:
   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```
3. **Backend ortam değişkenlerini** hazırla. Varsayılan `.env.example` dosyasını `.env` olarak kopyala; dosyadaki `DATABASE_URL` varsayılan olarak proje içinde saklanan SQLite dosyasını (`backend/data/app.db`) işaret eder. İstersen burada dosya yolunu değiştirebilirsin.

## Backend (API) Kurulumu

1. `.env` dosyasını oluştur:
   ```bash
 cd backend
  cp .env.example .env
  ```
2. SQLite veritabanı dosyasını oluşturmak için Prisma şemasını uygula:
  ```bash
  npm run prisma:push
  ```
3. Seed verilerini yükle (demo kullanıcılar oluşturulur):
  ```bash
  npm run seed
  ```
4. Geliştirme sunucusunu başlat:
  ```bash
  npm run dev
  ```
   API `http://localhost:4000` üzerinde çalışır.
6. Swagger dokümantasyonuna `http://localhost:4000/docs` adresinden erişebilirsin.

### Önemli backend noktaları

- **Kimlik Doğrulama**: `POST /auth/login` ile access token + HTTP-only refresh cookie alınır.
- **Supervisor uçları**: `/supervisor/*` altında öğretmen/öğrenci/sınıf/ders/dönem CRUD.
- **Öğretmen uçları**: `/teacher/*` altında sınıf oturumları ve yoklama yönetimi.
- **Öğrenci uçları**: `/student/*` altında devamsızlık raporları.
- **Raporlar**: `/reports/attendance?format=csv|pdf` ile dışa aktarım.
- **Feature Flags**: `/feature-flags/:key` ile yönetilir (`only_unexcused_counts`, `grace_period_minutes`, `web_push_enabled`, `student_email_notifications`).
- **Push**: `/push/public-key` ve `/push/subscribe` uçları; VAPID anahtarları `.env` içinde tanımlanmalı.

## Frontend (Web Uygulaması) Kurulumu

1. Backend çalışır durumda iken yeni bir terminalde frontend klasörüne gel:
   ```bash
   cd frontend
   npm run dev
   ```
2. Uygulama `http://localhost:5173` adresinde açılır. İlk girişte login sayfası görünür.
3. Giriş yaptıktan sonra rolüne göre otomatik yönlendirme yapılır.
4. Servis worker otomatik olarak kayıt olur; VAPID anahtarları mevcutsa web push aboneliği tetiklenir.

### Kullanıcı Arayüzü Özeti

- **Supervisor Paneli**: Öğretmen/öğrenci/sınıf/ders/dönem yönetimi, rapor indirme, bildirimler.
- **Öğretmen Paneli**: Sınıf seçimi, güncel oturumları listeleme, manuel yoklama tablosu, bildirimler.
- **Öğrenci Paneli**: Ders bazlı devamsızlık yüzdeleri, eşik uyarıları, geçmiş listesi, bildirimler.

## Demo Kullanıcıları

Seed script ile aşağıdaki kullanıcılar oluşturulur (şifre: `Password123!`):

| Rol         | E-posta                   |
|-------------|---------------------------|
| Supervisor  | supervisor@okul.local     |
| Öğretmen    | ogretmen@okul.local       |
| Öğrenci     | ogrenci@okul.local        |

## Önemli Özellikler

- Manuel yoklama kayıt ve güncelleme (ders süresi + opsiyonel grace period kontrolü).
- Devamsızlık yüzdesi hesaplama ve eşik aşımı uyarıları (in-app + opsiyonel web push).
- Renk kodlu öğretmenler (supervisor atar, raporlar ve listelerde görünür).
- Audit log ile tüm mutasyonlar kayıt altında.
- CSV ile toplu öğrenci ekleme.
- Swagger/OpenAPI dokümantasyonu.

## Geliştirme İpuçları

- Kod düzenlerken TypeScript uyarılarını dikkate al.
- Backend/Frontend birlikte çalıştırırken CORS `CORS_ORIGIN` değerinin frontend adresini içermesi gerekir.
- VAPID anahtarlarını üretmek için `npx web-push generate-vapid-keys` komutunu kullanabilirsin. Ortaya çıkan `publicKey`/`privateKey` değerlerini `.env` içinde sakla.
- Feature flag güncellemeleri sonrasında, cache TTL süresini bekle veya uygulamayı yeniden başlat.

> Not: Eğer SQLite yerine farklı bir veritabanı (ör. PostgreSQL) kullanmak istersen, `.env` içindeki `DATABASE_URL` değerini güncelleyip ilgili Prisma komutlarını (örn. `npm run prisma:migrate`) çalıştırman yeterlidir.
