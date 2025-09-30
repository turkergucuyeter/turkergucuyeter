# Online Yoklama Takip Uygulaması

Bu proje, manuel yoklama süreçlerini yönetmek için Supervisor, Öğretmen ve Öğrenci rollerine sahip tam yığın bir MVP uygulamasıdır. Uygulama; Prisma ile modellenen bir Node.js/Express API'si ve React + Vite tabanlı bir web arayüzünden oluşur.

## Özellikler

- Supervisor için öğretmen, öğrenci, sınıf, ders ve dönem yönetimi
- Öğretmenlere renk atama ve raporlarda görsel vurgu
- Manuel yoklama alma ve ders süresi + esneklik payı içinde güncelleme kuralları
- Devamsızlık yüzdesi hesaplama ve eşik aşımlarında bildirim oluşturma
- Feature flag altyapısı ile esnek iş kuralları
- Tüm mutasyonlarda audit log kaydı
- CSV/PDF rapor altyapısı için temel uç noktalar (CSV hazır)
- Türkçe arayüz, i18n anahtarlarıyla yönetilen metinler
- Swagger/OpenAPI belgesi (`/docs/openapi.json`)

## Kurulum

### Gereksinimler

- Node.js 18+
- npm 9+

### Ortam Değişkenleri

Backend için `.env` dosyası oluşturun:

```bash
cd backend
cp .env.example .env
```

Frontend için:

```bash
cd ../frontend
cp .env.example .env
```

Varsayılan değerler geliştirme ortamı için yeterlidir.

### Bağımlılıkların Yüklenmesi

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Veritabanı Migrasyonları ve Seed

```bash
cd backend
npm run prisma:migrate
npm run seed
```

SQLite veritabanı `backend/dev.db` konumunda oluşturulur.

## Geliştirme

### API Sunucusu

```bash
cd backend
npm run dev
```

API varsayılan olarak `http://localhost:4000` üzerinde çalışır.

### Frontend

```bash
cd frontend
npm run dev
```

Vite geliştirme sunucusu `http://localhost:5173` adresinde yayına başlar.

### Demo Kullanıcıları

| Rol        | E-posta                 | Şifre           |
|------------|-------------------------|-----------------|
| Supervisor | supervisor@example.com  | Supervisor123!  |
| Öğretmen   | teacher@example.com     | Teacher123!     |
| Öğrenci    | student@example.com     | Student123!     |

## Build ve Test

```bash
# Backend derleme
cd backend
npm run build

# Frontend derleme
cd ../frontend
npm run build
```

Testler jest/RTL ile tanımlı değildir; TypeScript derlemeleri ve Prisma migrasyonları doğrulama amacıyla kullanılmaktadır.

## OpenAPI Dokümanı

API dokümanı çalışır durumda iken `http://localhost:4000/docs/openapi.json` adresinden erişilebilir.

## Dosya Yapısı

- `backend/` — Express + Prisma tabanlı API
- `frontend/` — React + Vite arayüzü
- `backend/docs/openapi.json` — Swagger/OpenAPI tanımı
- `README.md` — Bu dosya

## Gelişim Yol Haritası

- Web push bildirimi için VAPID anahtar yönetimi
- Daha kapsamlı raporlama (PDF çıktısı)
- Birim/e2e testleri ve CI entegrasyonları
- Kullanıcı parola sıfırlama akışı
