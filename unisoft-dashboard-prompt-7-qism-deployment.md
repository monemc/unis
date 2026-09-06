# Deployment va Infratuzilma — To'liq Texnik Prompt (7-qism / 10)

> Bu — roadmapdagi so'nggi qism. `unisoft-dashboard-prompt-0-umumiy-qoidalar.md` va `0b-qism` (hujjatlashtirish) qoidalari shu yerga ham tegishli — deploy jarayoni ham `PROJECT_DOCUMENTATION.md`da yozib borilishi kerak.

---

## 1. MUHIT (ENVIRONMENT) TUZILISHI

Kamida 2 ta muhit tavsiya etiladi:

- **Staging (sinov muhiti)** — yangi funksiyalar avval shu yerda sinaladi, real Telegram/Payme/Click test rejimida ulanadi
- **Production (ishlab chiqarish)** — haqiqiy operatorlar va mijozlar ishlaydigan muhit

Har ikkala muhit uchun alohida `.env` fayllar, alohida database, alohida Telegram test/real akkauntlar bo'lishi kerak — **staging va production hech qachon bitta DB yoki bitta Telegram sessiyani baham ko'rmasligi kerak**.

---

## 2. KONTEYNERLASH (Docker)

- Har bir servis (Node.js backend, frontend, agar Python mikroservis qo'shilsa — alohida) o'z `Dockerfile`iga ega bo'lishi kerak
- `docker-compose.yml` orqali barcha servislar (backend, frontend, PostgreSQL, Redis) bir buyruq bilan ishga tushirilishi mumkin bo'lishi kerak (lokal development uchun)
- Production'da orkestratsiya uchun — loyiha hajmiga qarab, boshida oddiy Docker Compose yoki bitta VPS'da PM2 orqali ham yetarli bo'lishi mumkin; katta yuklama kutilsa Kubernetes yoki boshqa orkestratsiya keyinroq qo'shilishi mumkin (hoziroq murakkablashtirish shart emas — YAGNI tamoyili, avvalgi suhbatimizda kelishilgan)

---

## 3. MA'LUMOTLAR BAZASI — MIGRATSIYA VA ZAXIRA NUSXA

- Barcha DB o'zgarishlari **migration fayllar** orqali amalga oshiriladi (Prisma/TypeORM yoki tanlangan ORM'ning o'z migration tizimi) — hech qachon production DB'ga qo'lda `ALTER TABLE` yozilmasin
- **Avtomatik kunlik zaxira nusxa (backup)** — kamida 7-30 kunlik tarix saqlanadigan qilib sozlanishi shart, chunki bu yerda mijozlarning moliyaviy (kredit ariza, to'lov) va shaxsiy (pasport) ma'lumotlari saqlanadi — yo'qotilishi jiddiy oqibatlarga olib kelishi mumkin
- Zaxira nusxalar ham shifrlangan holda saqlanishi kerak (6-qism, 2-bo'lim qoidasi bilan uyg'un)

---

## 4. CI/CD (AVTOMATIK TEKSHIRUV VA DEPLOY)

Tavsiya etiladigan oddiy pipeline (masalan GitHub Actions orqali):

```
Kod push qilinadi (masalan main branch'ga)
        ↓
Avtomatik testlar ishga tushadi (agar test yozilgan bo'lsa)
        ↓
Build qilinadi (Docker image)
        ↓
Staging muhitiga avtomatik deploy qilinadi
        ↓
(Qo'lda tasdiqlangач) Production'ga deploy qilinadi
```

Boshlang'ich bosqichda to'liq avtomatlashtirilgan test suite talab qilinmaydi — lekin kamida **build muvaffaqiyatli bo'lishini tekshiruvchi** oddiy CI qadam bo'lishi tavsiya etiladi, bu ko'plab oddiy xatolarni (masalan sintaksis xatosi) production'ga tushishidan oldin ushlab qoladi.

---

## 5. MONITORING VA XATOLIKLARNI KUZATISH

- **Error tracking** (masalan Sentry yoki shunga o'xshash xizmat) — backend va frontend'da yuz beradigan xatoliklarni real-vaqt kuzatish uchun. Bu ayniqsa muhim, chunki 0-qism qoidasiga ko'ra hech qanday xatolik "jim qolmasligi" kerak — bu qoidani texnik jihatdan ta'minlaydigan vosita aynan shu
- **Uptime monitoring** — Telegram ulanishlari, Utel webhook, Payme/Click integratsiyalari doimiy ishlab turishini tashqi monitoring xizmati orqali kuzatish (masalan har 5 daqiqada health-check so'rovi)
- **Log markazlashtirish** — barcha servislarning loglari bitta joyda ko'rinadigan bo'lishi (debugging uchun muhim, ayniqsa ko'p sessiyali Telegram integratsiyasida)

---

## 6. MASSHTABLASH (SCALING) BO'YICHA ESLATMA

Hozirgi bosqichda (kichik-o'rta operatorlar soni bilan) bitta yaxshi VPS/server yetarli bo'ladi. Kelajakda operatorlar/mijozlar soni sezilarli oshsa, quyidagilar ko'rib chiqiladi:

- Backend'ni bir nechta nusxada (horizontal scaling) ishga tushirish — lekin bu holda `TelegramConnectionManager`dagi aktiv sessiyalarni **qaysi server ushlab turgani**ni markazlashgan tarzda (masalan Redis orqali) kuzatish kerak bo'ladi, aks holda bitta operator sessiyasi ikkita serverda "ikki marta" ochilib ketishi mumkin
- Bu — hozircha **kerak emas**, lekin arxitektura kelajakda shunga tayyor bo'lishi uchun, session boshqaruvi boshidanoq markazlashgan (Redis/DB orqali) qilib qurilgani ma'qul (1a-qism, 3-bo'limda aytilganidek)

---

## 7. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ

> 1. `Dockerfile` va `docker-compose.yml` fayllarini yoz (backend, frontend, PostgreSQL, Redis xizmatlari bilan)
> 2. Staging va production uchun alohida `.env.example` shablonlarini tayyorla (haqiqiy kalitlarsiz, faqat qaysi o'zgaruvchilar kerakligini ko'rsatuvchi)
> 3. Migration tizimini sozla, birinchi migration'ni yarat
> 4. Kunlik avtomatik DB backup skriptini yoz (cron yoki hosting provayderning o'z backup xizmati orqali)
> 5. Oddiy CI pipeline sozla (GitHub Actions yoki mavjud vositadan foydalanib) — kamida build tekshiruvi bilan
> 6. Error tracking xizmatini ulа (masalan Sentry)
> 7. Health-check endpointlarni qo'sh (`/health`, `/health/telegram`, `/health/db`) — monitoring xizmati shulardan foydalansin
> 8. `PROJECT_DOCUMENTATION.md`ga (0b-qism) "Deployment" bo'limini qo'sh — qanday deploy qilinishi, muhitlar, backup jarayoni yozilsin
