# Xavfsizlik va Maxfiylik — To'liq Texnik Prompt (6-qism / 10)

> Bu hujjat 1-5-qismlarda tarqoq holda tilga olingan xavfsizlik talablarini (parol hashing, session shifrlash, RBAC, audit log) bitta markazlashgan qismga jamlaydi va kengaytiradi. `unisoft-dashboard-prompt-0-umumiy-qoidalar.md` qoidalari shu yerga ham tegishli.

---

## 1. AUTENTIFIKATSIYA XAVFSIZLIGI

- Parollar **hech qachon** ochiq matn holda saqlanmasin — `bcrypt` yoki `argon2` orqali hash qilinadi (1-qism 5-bo'limida tilga olingan, endi aniq kutubxona tavsiyasi)
- JWT token'lar qisqa muddatli (`access_token` — 15-30 daqiqa) + uzoq muddatli `refresh_token` (masalan 7-30 kun) — access token o'g'irlansa ham zarar minimal bo'lishi uchun
- Login urinishlarini cheklash (**rate limiting**) — masalan 5 marta ketma-ket noto'g'ri parol kiritilsa, 15 daqiqaga akkaunt vaqtincha bloklanadi (brute-force hujumlarga qarshi)
- 2FA (ikki bosqichli tekshiruv) — kelajakda Super Admin va Company Admin darajasida majburiy qilish tavsiya etiladi (hozirgi bosqichda ixtiyoriy bo'lishi mumkin)

---

## 2. MA'LUMOTLARNI SHIFRLASH

| Ma'lumot turi | Qayerda | Shifrlash usuli |
|---|---|---|
| Telegram session string | `operators.telegram_personal_account`, `companies.telegram_corporate_account` | AES-256, alohida shifrlash kaliti bilan (1a-qism 2.2-bo'lim) |
| Zagran pasport ma'lumotlari (OCR natijasi) | `flight_bookings.passport_data`, `credit_applications.passport_data` | AES-256 |
| API kalitlar (Payme, Click, KATM, aviabilet provayder) | `.env` yoki maxsus secrets manager | Hech qachon kodga hardcode qilinmasin, Git'ga commit qilinmasin |
| Parollar | `operators.password_hash` | bcrypt/argon2 (qaytarib bo'lmaydigan hash, shifrlash emas) |

**Shifrlash kaliti boshqaruvi:** kalit hech qachon kod bilan bir joyda (`.env` fayl repo'da) saqlanmasin. Agar mumkin bo'lsa, maxsus secrets manager (masalan HashiCorp Vault, yoki hosting provayderning o'z kalit boshqaruv xizmati) ishlatilsin. Kichik boshlang'ich bosqichda kamida — kalit alohida, cheklangan huquqli `.env` faylda, versiyalashtirilmagan (`.gitignore`da) saqlanishi shart.

---

## 3. TRANSPORT XAVFSIZLIGI

- Butun tizim faqat **HTTPS** orqali ishlaydi (HTTP so'rovlar avtomatik HTTPS'ga yo'naltiriladi)
- Xavfsizlik headerlari (masalan `Content-Security-Policy`, `X-Frame-Options`, `Strict-Transport-Security`) sozlanadi
- WebSocket ulanishlari ham `wss://` (shifrlangan) orqali bo'lishi shart

---

## 4. RUXSAT NAZORATI (RBAC) — QAT'IY QOIDA

1-qism 12-bo'limidagi Company Isolation qoidasi bu yerda **markaziy xavfsizlik tamoyili** sifatida qayta tasdiqlanadi:

- Har bir API endpoint, DB so'rov, va AI tool chaqiruvi `company_id` va `role` bo'yicha tekshiruvdan **majburiy** o'tishi kerak
- Frontend'da biror narsani "yashirish" — xavfsizlik chorasi emas, faqat qulaylik. Haqiqiy himoya **har doim backend'da** bo'lishi shart
- Middleware darajasida markazlashgan avtorizatsiya tekshiruvi qo'yilishi tavsiya etiladi (har bir route'da alohida-alohida yozish o'rniga)

---

## 5. MAXFIYLIK — MIJOZ MA'LUMOTLARIGA KIRISH NAZORATI

- Oddiy operator faqat **o'ziga biriktirilgan** mijozlar va **o'z kompaniyasi**ga tegishli ma'lumotlarni ko'radi (3-qism, 4-qism qoidalariga muvofiq)
- Boshqa operatorning shaxsiy statistikasi yoki yozishmalariga kirish faqat Company Admin/Super Admin darajasida, va bu kirish **audit log**ga yoziladi (1-qism 13-bo'lim, 1a-qism 8.3-bo'lim)
- Mijozning shaxsiy ma'lumotlari (pasport, telefon) faqat vazifani bajarish uchun zarur operatorlarga ko'rinadi — boshqa kompaniyaning operatoriga hech qachon ko'rinmaydi

---

## 6. O'ZBEKISTON QONUNCHILIGI BO'YICHA MUHIM ESLATMA — MA'LUMOTLARNI SAQLASH JOYI

⚠️ Bu — huquqiy masala, texnik jamoa uchun ma'lumot sifatida, lekin **yuridik maslahatchi bilan tasdiqlash tavsiya etiladi**:

2026-yil 27-mart kuni O'zbekistonning "Shaxsga doir ma'lumotlar to'g'risida"gi qonuniga o'zgartirish kiritilib, ma'lumotlarni saqlash talablari yumshatildi Qonunning 271-moddasiga kiritilgan o'zgartishlarga ko'ra, faqat ayrim toifadagi ma'lumotlar — jismoniy shaxslarning biometrik va genetik ma'lumotlari, hamda O'zbekistonda faoliyat yurituvchi telekommunikatsiya operatorlari foydalanuvchilarining ma'lumotlari — majburiy ravishda mamlakat hududida saqlanishi kerak. Boshqa turdagi shaxsga doir ma'lumotlarni esa muayyan shartlar bajarilganda (masalan xorijiy davlat yetarli himoya darajasini ta'minlashi tan olinganda, yoki xalqaro standartlarga rioya qilinganda) mamlakatdan tashqarida saqlash va qayta ishlashga ruxsat berilgan.

**Loyihangizga tegishli amaliy xulosa:**
- Mijozlarning oddiy shaxsiy ma'lumotlari (ism, telefon, chat tarixi) — yumshatilgan qoidaga ko'ra, shartlar bajarilsa xorijda ham saqlash mumkin, lekin O'zbekiston serverida saqlash eng xavfsiz va shubhasiz variant
- Agar zagran pasport skanerlaridan **rasm/biometrik ma'lumot** (masalan yuz tasviri) saqlansa, bu **biometrik ma'lumot** toifasiga kirishi mumkin — bunday holatda ⚠️ **majburiy ravishda O'zbekiston hududida** saqlanishi kerak bo'lishi mumkin. Shuning uchun tavsiya: pasport OCR jarayonida faqat matnli ma'lumotlarni (ism, raqam, muddat) saqlang, agar imkon bo'lsa pasportning o'zi rasm sifatida uzoq muddat saqlanib qolmasin (yoki alohida, aniq O'zbekiston hududidagi serverda saqlansin)
- Bu — texnik jamoa mustaqil hal qiladigan masala emas, molim/huquq bo'limi bilan tasdiqlanishi tavsiya etiladi

---

## 7. AUDIT LOGGING — XAVFSIZLIK NUQTAYI NAZARIDAN

1-qism 13-bo'limida ro'yxat berilgan edi, xavfsizlik nuqtayi nazaridan qo'shimcha talablar:

- Audit log yozuvlari **o'zgartirilmas** (immutable) bo'lishi kerak — hech kim, hatto Super Admin ham, audit log yozuvini o'chira yoki tahrirlay olmasligi kerak
- Muvaffaqiyatsiz login urinishlari ham log qilinsin (kim, qachon, qaysi IP'dan)
- Shubhali faoliyat (masalan bitta akkauntdan qisqa vaqt ichida ko'p noto'g'ri urinish, yoki g'ayrioddiy vaqtda ko'p ma'lumot yuklab olish) uchun kelajakda alert tizimi qo'shilishi mumkin (hozircha asosiy log yetarli)

---

## 8. QABUL QILISH MEZONLARI (checklist)

- [ ] Barcha parollar hash qilingan (bcrypt/argon2), hech qanday ochiq matn parol yo'q
- [ ] Barcha sezgir ma'lumotlar (Telegram session, pasport) AES-256 bilan shifrlangan
- [ ] Shifrlash kaliti kod bilan bir joyda saqlanmagan
- [ ] Barcha trafik HTTPS/WSS orqali
- [ ] RBAC har bir endpoint va DB so'rovda backend darajasida tekshirilgan (faqat frontend emas)
- [ ] Audit log immutable va login urinishlarini ham qamrab oladi
- [ ] Ma'lumotlarni saqlash joyi bo'yicha huquqiy maslahat olingan (6-bo'lim)

---

## 9. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ

> 1. Parol hashing uchun bcrypt/argon2 kutubxonasini ulа, mavjud kodda ochiq parol saqlanayotgan joy bo'lsa darhol tuzat
> 2. JWT access+refresh token arxitekturasini qur, rate limiting middleware qo'sh (login endpoint uchun)
> 3. AES-256 shifrlash/dekripsiya utility'sini markazlashtir (agar 1a-qismda allaqachon yozilgan bo'lsa, shu yerga ham qo'llan — Passport ma'lumotlari uchun ham)
> 4. Markazlashgan RBAC middleware yoz — har bir route avtomatik `company_id`+`role` tekshiruvidan o'tadigan qilib
> 5. Barcha xavfsizlik headerlarini sozla, HTTPS/WSS majburiy qil
> 6. Audit log jadvalini immutable qil (DB darajasida `UPDATE`/`DELETE` ruxsatlarini olib tashlash orqali, agar mumkin bo'lsa)
> 7. 8-bo'limdagi checklist bo'yicha o'z-o'zini tekshir va natijani aniq ro'yxat qilib ko'rsat
