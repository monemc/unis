# Loyiha Hujjatlashtirish Qoidasi — `PROJECT_DOCUMENTATION.md` (0b-qism)

> ⚠️ Bu hujjat `unisoft-dashboard-prompt-0-umumiy-qoidalar.md`ga qo'shimcha — barcha qismlarga (1, 1a, 1b, 2, 2b, 3, 4 va keyingi barchasiga) tegishli. AI coding assistant har qanday qismni bajarayotganda, shu qoidaga **doimiy** amal qilishi kerak.

---

## 1. MAQSAD

Loyiha davomida AI coding assistant (yoki turli sessiyalarda ishlaydigan turli AI tool'lar) qurgan har bir modul, arxitektura qarori va o'zgarish **bitta markazlashgan, tushunarli hujjatda** yozib borilishi kerak. Bu quyidagilar uchun kerak:

- Yangi AI sessiya (yoki yangi dasturchi) loyihaga kirganda, hammasini qaytadan o'rganib chiqmasdan, tez tushunib olishi uchun
- Loyiha oxirida **foydalanish shartlari** va **funksiyalar ro'yxati**ni yozishni osonlashtirish uchun (hujjat allaqachon tayyor bo'ladi, faqat formatlash kerak bo'ladi)
- Loyihani boshqalarga (investor, hamkor, rahbariyat) **prezentatsiya qilishda** tayyor material sifatida ishlatish uchun
- Nima ishlagani, nima hali demo/tugallanmagan ekanini har doim aniq bilib turish uchun (0-qism qoidasi bilan uyg'un)

---

## 2. FAYL JOYLASHUVI VA TUZILISHI

Repozitoriyaning tub papkasida (`root`) bitta asosiy fayl:

```
/PROJECT_DOCUMENTATION.md
```

Agar loyiha katta bo'lib, bitta faylga sig'may qolsa, quyidagicha bo'lib chiqiladi:

```
/docs
  ├── README.md              ← umumiy tavsif + boshqa fayllarga havolalar
  ├── architecture.md         ← texnik stack, arxitektura chizmasi
  ├── modules/
  │   ├── admin-panel.md
  │   ├── telegram-chat.md
  │   ├── ai-assistant.md
  │   ├── mysafar-booking.md
  │   ├── beegroup-credit.md
  │   ├── statistika.md
  │   └── leads-mijozlar.md
  ├── database-schema.md
  ├── api-reference.md
  └── changelog.md
```

Loyiha hali kichik bosqichda bo'lgani uchun, **hozircha bitta fayldan** (`PROJECT_DOCUMENTATION.md`) boshlash tavsiya etiladi, keyinchalik hajmi oshsa yuqoridagi tuzilishga bo'lib chiqiladi.

---

## 3. HUJJAT ICHIDAGI MAJBURIY BO'LIMLAR

### 3.1 Loyiha umumiy tavsifi
Bir necha jumlada: loyiha nima, kimlar uchun, qaysi kompaniyalarni qamrab oladi (MySafar, Unired, BeeGroup).

### 3.2 Arxitektura
- Texnik stack (frontend, backend, DB, real-time, AI qatlami — 1-qism 1-bo'limiga muvofiq)
- Umumiy servis chizmasi (matn ko'rinishida, masalan ASCII diagram — qaysi servis qaysi bilan gaplashadi)
- Muhim texnik qarorlar va **nima uchun** shunday tanlangani (masalan "Node.js tanlandi, chunki frontend bilan bir xil til" — avvalgi suhbatlarimizdagi kabi)

### 3.3 Modullar ro'yxati — har bir modul uchun quyidagi shablon

```markdown
## [Modul nomi] (masalan: Telegram Chat Moduli)

**Holati:** ✅ Tugallangan / 🟡 Jarayonda / 🔴 Boshlanmagan / ⚠️ Demo (real emas)

**Nima qiladi:**
Qisqacha, oddiy tilda (texnik bo'lmagan odam ham tushunadigan tarzda) — bu modul foydalanuvchi uchun nima qiladi.

**Qanday ishlaydi (texnik):**
Asosiy oqim, muhim funksiyalar, qaysi fayllar/papkalarda joylashgani.

**Ma'lumotlar bazasi jadvallari:**
Ro'yxat + qisqacha izoh.

**API endpointlar:**
Ro'yxat.

**Tashqi integratsiyalar:**
Qaysilar ishlatiladi (masalan GramJS, KATM, Payme).

**Bog'liq boshqa modullar:**
Bu modul qaysi boshqa modullarga tayanadi yoki ular tomonidan ishlatiladi.

**Ma'lum cheklovlar / hali qilinmagan narsalar:**
Ochiq qolgan savollar, kelajakda qilinishi kerak bo'lgan narsalar.
```

### 3.4 Ma'lumotlar bazasi — to'liq sxema
Barcha jadvallar, bitta joyda jamlangan (har bir qismda alohida yozilgan jadvallarning yig'indisi).

### 3.5 O'zgarishlar tarixi (Changelog)

```markdown
## [Sana] — [Qisqa sarlavha]
**Nima qo'shildi/o'zgartirildi:**
- ...

**Sabab:**
- ...

**Ta'sir qilgan modullar:**
- ...
```

Har bir muhim o'zgarishdan keyin (yangi modul, katta refactor, arxitektura qarori o'zgarishi, muhim bug fix) shu bo'limga **yangi yozuv qo'shiladi** — eskilarini o'chirmasdan, xronologik tartibda (eng yangisi tepada).

### 3.6 Kelgusi rejalar / TODO
Hali bajarilmagan, lekin rejalashtirilgan ishlar ro'yxati (masalan hozirgi promptlarimizdagi ⚠️ belgilangan ochiq savollar shu yerga ham tushishi kerak).

---

## 4. YANGILANISH QOIDASI — QACHON VA QANDAY

AI coding assistant quyidagi holatlarda **majburiy ravishda** `PROJECT_DOCUMENTATION.md`ni yangilashi kerak:

- Yangi modul yaratilganda (yangi bo'lim qo'shiladi)
- Mavjud modulga katta o'zgarish kiritilganda (masalan arxitektura qayta qurilganda)
- Yangi tashqi integratsiya ulanganda
- Muhim bug tuzatilganda (agar u boshqa modullarga ham ta'sir qilgan bo'lsa)
- Har bir "sessiya" (AI bilan ishlash bosqichi) oxirida — hatto kichik o'zgarish bo'lsa ham, changelog'ga qisqa yozuv qo'shiladi

**Muhim:** Bu hujjat — kod bilan **birga** versiyalanishi kerak (Git orqali, xuddi kodning o'zi kabi commit qilinadi), alohida, unutilib qoladigan fayl bo'lib qolmasligi kerak.

---

## 5. TIL VA USLUB TALABI

- Hujjat **o'zbek tilida**, tushunarli, ortiqcha texnik jargonsiz yozilishi kerak — har bir bo'lim ham texnik dasturchi, ham texnik bo'lmagan rahbar/hamkor tomonidan o'qilishi mumkin bo'lishi kerak
- Har bir modul tavsifida avval **oddiy tildagi izoh** ("Nima qiladi"), keyin **texnik tafsilot** ("Qanday ishlaydi") — shu tartibda, aralashtirmasdan
- Bu — kelajakda foydalanish shartlari va marketing/prezentatsiya materiallarini shu hujjatdan **to'g'ridan-to'g'ri moslashtirib olish** imkonini beradi

---

## 6. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ

> 1. Loyiha tub papkasida `PROJECT_DOCUMENTATION.md` faylini yarat (agar hali yo'q bo'lsa)
> 2. Hozirgi kunga qadar loyihada nima qurilgan bo'lsa (kod bazasini skanerlab), shularning barchasini 3-bo'limdagi shablonga solib, birinchi to'liq versiyasini yoz — har bir modul uchun holatini (✅/🟡/🔴/⚠️) aniq belgila
> 3. Ma'lumotlar bazasi to'liq sxemasini (3.4-bo'lim) joriy holatga muvofiq yoz
> 4. Changelog bo'limini boshlang'ich yozuv bilan boshla ("Loyiha hujjatlashtirish tizimi joriy qilindi" degan sarlavha bilan, bugungi sana)
> 5. Shundan buyon **har bir keyingi topshiriq/prompt bajarilgandan so'ng**, ushbu qoidaga muvofiq faylni yangilashni odat qil — bu alohida eslatilmasa ham, standart protokol sifatida bajarilishi kerak
>
> Ushbu vazifani bajarishda ham 0-qismdagi qoidalar amal qiladi: hujjatda yozilgan "✅ Tugallangan" degan holat **haqiqatan ham** ishlayotganini anglatishi kerak — agar biror modul aslida demo/stub bo'lsa, buni "⚠️ Demo" deb **halol** belgilash shart, "tugallangan" deb ko'rsatib yashirilmasin.
