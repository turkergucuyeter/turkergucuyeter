# Yoklama Takip MVP

Bu depo, Supervisor – Öğretmen – Öğrenci rollerine sahip manuel yoklama takip uygulamasının uçtan uca çalışır bir MVP sürümünü içerir. Proje; Node.js + Express + Prisma (SQLite) tabanlı bir backend API ve Vite + React + TypeScript ile hazırlanmış bir frontend arayüzü içerir.

## Hızlı Başlangıç

### Ön Koşullar

- Node.js 18+
- npm 9+

### Backend'i Çalıştırma

```bash
cd backend
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Backend varsayılan olarak `http://localhost:4000` adresinde hizmet verir ve Swagger dokümantasyonu `http://localhost:4000/api-docs` üzerinden erişilebilirdir.

### Frontend'i Çalıştırma

```bash
cd frontend/attendance-frontend
npm install
npm run dev
```

Frontend uygulaması `http://localhost:5173` adresinde çalışır ve API çağrıları için otomatik olarak `http://localhost:4000` backend'ine proxy yapar.

### Demo Giriş Bilgileri

Seeder komutu aşağıdaki kullanıcıları oluşturur:

- Supervisor: `supervisor@example.com` / `Supervisor123`
- Öğretmen: `teacher@example.com` / `Teacher123`
- Öğrenci: `student@example.com` / `Student123`

## Proje Yapısı

- `backend/`: Express tabanlı REST API, Prisma şeması, migrasyon ve seed dosyaları.
- `frontend/attendance-frontend/`: React + Vite arayüzü, rol bazlı yönlendirme, manuel yoklama formu ve bildirim paneli.

## Özellik Özeti

- Manuel yoklama akışı (Var/İzinli/İzinsiz).
- Ders süresi + opsiyonel grace period içerisinde güncelleme kontrolü.
- Devamsızlık yüzdesi hesaplama, eşik aşımında bildirim.
- Supervisor için öğretmen/öğrenci/sınıf/ders/dönem CRUD uç noktaları.
- CSV/PDF formatında devamsızlık raporu.
- Feature flag altyapısı ile esnek kurallar.
- Audit log ile tüm mutasyonların izlenmesi.
- Frontend'de Türkçe i18n anahtarları.

Daha fazla ayrıntı için kod içi yorumları ve Swagger dokümantasyonunu inceleyebilirsiniz.
