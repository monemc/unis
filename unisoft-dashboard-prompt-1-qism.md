# Unisoft Dashboard — AI Coding Assistant uchun To'liq Texnik Prompt (1-qism / 10)

> Bu hujjat AI coding tool (Claude Code, Cursor, ChatGPT va h.k.) ga to'g'ridan-to'g'ri beriladigan buyurtma sifatida yozilgan. Har bir bo'lim "nima", "qayerda", "qanday" tartibida tushuntirilgan. Bu — umumiy loyihaning 1/10 qismi (admin panel, operator dashboard, chat moduli, AI yordamchi, Telegram va Utel integratsiyasi).
>
> ⚠️ **`unisoft-dashboard-prompt-0-umumiy-qoidalar.md` faylini ham albatta biriktiring** — u yerda demo/mock ma'lumot taqiqi, AI promptlari sifat talablari va qabul qilish mezonlari yozilgan, bu qism shu qoidalarga bo'ysunadi.

---

## 0. LOYIHA HAQIDA UMUMIY KONTEKST

Biz `dashboard.unisoft.uz` domenida ishlaydigan **multi-tenant CRM/operator paneli** quramiz. Bu panelda 3 ta biznes bo'linmasi bor:

1. **MySafar** — sayohat xizmatlari (aviabilet sotuvi, booking; **Fintech funksiyalari shu kompaniya tarkibiga kiradi**, alohida kompaniya emas)
2. **Unired** — moliya/kredit xizmatlari
3. **BeeGroup** — avtomobil kredit/lizing

> ⚠️ Eslatma: dastlab 4 ta bo'linma ko'rib chiqilgan edi (MySafar, Unired, Fintech, BeeGroup), lekin Fintech alohida kompaniya sifatida olib tashlandi va uning funksiyalari MySafar ichiga qo'shildi. Database darajasida bitta `company_id` — MySafar uchun.

Har bir bo'linma o'zining operatorlariga ega, va operator faqat o'ziga biriktirilgan bo'linmaga kira oladi. Har bir operator Telegram orqali mijozlar bilan yozishadi, Utel orqali qo'ng'iroq qiladi, va tizim ichida AI yordamchi orqali sotuvni yaxshilash bo'yicha real-vaqt maslahat oladi.

**Maqsad:** operatorlarning ish sifatini oshirish, mijoz bilan muloqotni AI yordamida kuchaytirish, va har bir operatorning o'z uslubini (tone, so'z boyligi va h.k.) saqlab qolgan holda AI undan o'rganib borishi.

---

## 1. TEXNIK STACK TAVSIYASI

- **Frontend:** Next.js (React) + TailwindCSS + shadcn/ui — professional, tez, komponentlarga boy UI uchun
- **Backend:** Node.js (NestJS yoki Express) yoki agar jamoada mavjud bo'lsa boshqa backend stack — API-first arxitektura
- **Database:** PostgreSQL (relatsion ma'lumotlar — operatorlar, kompaniyalar, chatlar, tasklar uchun qulay) + Redis (real-time holat, session, queue uchun)
- **Real-time:** WebSocket (Socket.io) — chatlar va notification uchun
- **AI qatlami:** Anthropic Claude API (yoki OpenAI) — lead scoring, AIDA tahlili, eslatmalar, chatbot uchun
- **Telegram integratsiya:** Telegram Bot API (korporativ akkaunt uchun) + MTProto/Telegram Client API (operatorning shaxsiy akkaunti uchun, chunki oddiy foydalanuvchi akkauntlarida Bot API ishlamaydi)
- **Qo'ng'iroq integratsiyasi:** Utel API (webhook orqali qo'ng'iroq tugagach ma'lumot olish)
- **Auth:** JWT-based session, role-based access control (RBAC): Super Admin, Company Admin, Operator

---

## 2. FOYDALANUVCHI ROLLARI VA KIRISH LOGIKASI

```
Super Admin
 └── barcha kompaniyalarni ko'radi, operator qo'shadi/o'chiradi, dashboard sozlaydi

Company Admin (masalan BeeGroup admin)
 └── faqat o'z kompaniyasidagi operatorlarni boshqaradi

Operator
 └── login: 1234, parol: 4321 kabi — tizimga kirganda
     backend operator.company_id ni tekshiradi va
     faqat o'sha kompaniya interfeysini ko'rsatadi
```

**Kirish oqimi:**
1. Foydalanuvchi `dashboard.unisoft.uz` ga kiradi → login/parol kiritadi
2. Backend `operators` jadvalidan `company_id` ni topadi
3. Frontend faqat shu `company_id` ga tegishli ma'lumotlar, mijozlar, chatlar, statistikani yuklaydi
4. Agar operator bir nechta kompaniyaga biriktirilgan bo'lsa (kelajakda kerak bo'lishi mumkin) — kompaniya tanlash ekrani chiqadi

---

## 3. MA'LUMOTLAR BAZASI SXEMASI (asosiy jadvallar)

### 3.1 `companies`
| Ustun | Tavsif |
|---|---|
| id | UUID |
| name | MySafar / Unired Fintech / BeeGroup |
| telegram_corporate_account | korporativ Telegram akkaunt credential (encrypted) |
| utel_config | Utel API kalitlari (encrypted) |

### 3.2 `operators`
| Ustun | Tavsif |
|---|---|
| id | UUID |
| login, password_hash | |
| full_name | |
| company_id | FK → companies |
| telegram_personal_account | operatorning shaxsiy Telegram akkaunt credential (encrypted) |
| role | admin / operator |

### 3.3 `operator_profile` (har bir operator uchun avtomatik yaratiladi)

Bu — AI ning shu operator ovozida/uslubida yozishi uchun asosiy sxema. Admin panelda yangi dashboard/operator qo'shilganda **avtomatik** yaratiladi va bo'sh holatda boshlanadi, keyin AI vaqt o'tishi bilan to'ldirib boradi:

```
operator_profile
├── operator_id (FK)
├── tone                  -- masalan: "do'stona-professional", "rasmiy", "iliq"
├── language               -- operator qaysi tilda yozadi: uz / ru / mix
├── vocabulary              -- operator tez-tez ishlatadigan so'zlar ro'yxati (array)
├── emoji_style             -- qanday va qancha emoji ishlatadi (masalan: kam/o'rtacha/ko'p, qaysi emojilar)
├── sentence_length         -- qisqa/o'rtacha/uzun gaplar bilan yozadimi
├── sales_style             -- masalan: "bosim qilmaydi", "tezkor yopadi", "savol orqali yetaklaydi"
├── forbidden_phrases       -- operator hech qachon ishlatmaydigan yoki taqiqlangan iboralar (array)
├── preferred_phrases       -- operator ko'p ishlatadigan, yaxshi natija bergan iboralar (array)
└── learned_preferences     -- AI vaqt o'tishi bilan kuzatib, JSON formatda saqlaydigan qo'shimcha xulosalar
```

**Muhim:** `learned_preferences` maydoni — AI operatorning har bir muvaffaqiyatli/muvaffaqiyatsiz suhbatidan xulosa chiqarib, shu yerga yozib boradigan "o'z-o'zini o'qitish" xotirasi. Masalan: `{"mijoz narx so'raganda avval ehtiyojni aniqlaydi": true, "5%dan ortiq skidka taklif qilmaydi": true}`.

### 3.4 `customers` (mijozlar)
id, full_name, phone, company_id, telegram_id, unique_customer_id (AI chatbot bog'lash uchun), created_at

### 3.5 `chats` va `messages`
- `chats`: id, customer_id, operator_id, telegram_account_type (corporate/personal), status
- `messages`: id, chat_id, sender (operator/customer/ai), text, telegram_message_id, is_deleted_by_customer (bool), created_at

**Muhim:** xabar Telegramdan kelgan zahoti darhol bazaga yoziladi. Agar mijoz keyinchalik xabarni o'chirsa, Telegram bizga "deleted" degan signal yuborishi mumkin, lekin biz bazadagi yozuvni o'chirmaymiz — faqat `is_deleted_by_customer = true` deb belgilaymiz va operator baribir tarixni ko'ra oladi.

### 3.6 `leads`
id, customer_id, operator_id, lead_score (0-100), aida_stage (attention/interest/desire/action — lekin UI da nomi ko'rinmaydi, faqat maslahat matni ko'rinadi), created_at, updated_at

### 3.7 `tasks`
id, operator_id, customer_id (nullable), title, description, due_time, is_completed, created_at

### 3.8 `notifications`
id, operator_id, type, message, is_read, created_at

### 3.9 `call_logs` (Utel integratsiyasi)
id, customer_id, operator_id, call_recording_url, transcript, promised_actions (JSON — masalan: `{"send_location": true, "send_car_info": "Chevrolet Cobalt narxi"}`), created_at

---

## 4. ADMIN PANEL FUNKSIONALLIGI

- Yangi kompaniya (dashboard) qo'shish
- Yangi operator qo'shish + qaysi kompaniyaga biriktirishni tanlash
- Operator qo'shilganda tizim avtomatik bo'sh `operator_profile` yaratadi
- Operatorlar ro'yxati, faollik statistikasi, login/parolni qayta tiklash
- Har bir kompaniya uchun Telegram va Utel integratsiya sozlamalarini kiritish (API kalitlar)

---

## 5. OPERATOR DASHBOARD — UI/UX TALABLARI

Chap tomonda doimiy sidebar menyu:

```
🏠 Bosh sahifa
💬 Chatlar
📊 Statistika
👥 Mijozlar
🎯 Leads
✅ Tasks
🔔 Notifications
📄 Foydalanish shartlari
⚙️ Sozlamalar
🚪 Chiqish
```

**Dizayn talablari:**
- Zamonaviy, minimalistik, professional B2B SaaS uslubi (masalan Intercom, Linear, HubSpot dashboardlariga o'xshash sifat darajasida)
- Dark/light mode
- Har bir kompaniya uchun branding rangi (masalan BeeGroup uchun sariq-qora, MySafar uchun ko'k)
- Real-time yangilanishlar (yangi xabar kelganda sidebar'da badge chiqishi)
- Mobil-responsive

---

## 6. CHAT MODULI — BATAFSIL

### 6.1 Ikki Telegram akkaunt
Operator "Chatlar" bo'limiga kirganda ikkita tab ko'radi:
1. **Korporativ akkaunt** — bu yerda barcha operatorlar ko'radi va javob bera oladi (jamoaviy akkaunt)
2. **Shaxsiy akkaunt** — faqat shu operatorga tegishli, faqat u ko'radi

### 6.2 Xabarlarni saqlash
Barcha kiruvchi/chiquvchi xabarlar real-vaqtda bazaga yoziladi (3.5-bo'limga qarang), mijoz o'chirsa ham tarix saqlanadi.

### 6.3 "Ko'proq" tugmasi (AI Advisor panel)
Har bir chat oynasining yonida kichik tugma (masalan "•••" yoki "AI maslahat") turadi. Bosilganda yon panel ochiladi, unda:

1. **Lead score** — AI chat matni + Utel qo'ng'iroq transkripti asosida 0-100 ball hisoblab, "sotib olish ehtimoli" ko'rsatadi
2. **AIDA strategiyasi (nomsiz)** — AI hozirgi bosqichni aniqlaydi va faqat maslahat ko'rinishida beradi, masalan: *"Mijoz hali tanishish bosqichida — avval e'tiborini tortish kerak. Oldingi tajribadan kelib chiqib, mijozlar ko'proq [X xususiyat]ga qiziqishadi — shuni urg'u bering."* (bosqich nomi "Attention/Interest" deb yozilmaydi, faqat mazmuni)
3. **Eslatma (mijoz konteksti xulosasi)** — AI oldingi suhbatlar, tasklar, va call_log asosida qisqacha eslatma chiqaradi: masalan *"Bu mijoz bilan 1 haftadir gaplashyapsiz. 6-sentabrga kelishga va'da bergan. Yaqin narxlarni solishtirishni so'ragan edi."*
4. **Vazifa qo'shish** — operator shu yerdan tezkor task yaratadi (masalan "15:30 da qo'ng'iroq qilish"), bajarilgach belgilab qo'yadi → bu `tasks` jadvaliga yoziladi

Operator har bir xabar yozganidan keyin AI qisqa izoh/maslahat beradi (masalan: *"Zo'r javob berdingiz! Keyingi qadam — narx haqida so'rasa, avval byudjetini so'rab oling."*)

### 6.4 Chatbot va mijozga bog'lash
- Alohida "AI Chatbot" bo'limi bor, operator bu yerda erkin AI bilan maslahatlashadi
- Mijozlar bilan chatda, **mijoz ismining ustiga 2 marta bosilsa**, tizim operatorni shu AI chatbotga olib o'tadi, lekin fon rejimida (operatorga ko'rinmas holda) shu mijozning `unique_customer_id` si chatbot kontekstiga bog'lanadi — shunda AI aynan shu mijozning butun tarixini bilgan holda javob beradi

### 6.5 Utel qo'ng'iroq integratsiyasi
- Qo'ng'iroq tugagach, Utel webhook orqali yozuv/transkript keladi (`call_logs` jadvaliga saqlanadi)
- AI transkriptni tahlil qilib, operator qanday va'da bergan bo'lsa (masalan "lokatsiya yuboraman", "mashina narxini Telegramdan yuboraman") shuni aniqlaydi
- Agar operator "Telegramdan yozib qo'yaman" degan bo'lsa, AI avtomatik ravishda mos ma'lumotni (lokatsiya, mahsulot/mashina ma'lumoti, bilet ma'lumoti) o'sha mijozning Telegram raqamiga yuboradi — operator qo'shimcha harakat qilmasdan

---

## 7. KEYINGI QISMLAR (eslatma uchun)

Bu — umumiy loyihaning faqat 1/10 qismi. Keyingi qismlarda quyidagilar kiritiladi (foydalanuvchi bilan kelishilgan holda):
- Statistika va hisobotlar moduli
- Leads va mijozlar boshqaruvi bo'limlari batafsil
- Notifications tizimi arxitekturasi
- Xavfsizlik, ma'lumotlarni shifrlash, GDPR-uslubidagi maxfiylik talablari
- Deployment va infratuzilma

---

## 8. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ

> Yuqoridagi barcha talablarga asoslanib, quyidagi tartibda ishla:
> 1. Avval database schema (PostgreSQL migration fayllari) yoz — 3-bo'limdagi barcha jadvallar bilan
> 2. Auth va role-based routing tizimini qur (2-bo'lim)
> 3. Admin panel CRUD interfeyslarini yoz (4-bo'lim)
> 4. Operator dashboard UI skeletonini qur — sidebar, routing (5-bo'lim)
> 5. Chat modulini Telegram Bot API va MTProto integratsiyasi bilan qur (6.1, 6.2)
> 6. AI Advisor panelini alohida servis sifatida qur — Claude API chaqiruvlari bilan (6.3)
> 7. Chatbot va mijozga bog'lash logikasini qo'sh (6.4)
> 8. Utel webhook handler va avtomatik xabar yuborish logikasini qur (6.5)
>
> Har bir bosqichda kod bilan birga qaysi fayl/papkada joylashganini aniq yoz. Xavfsizlik uchun barcha API kalitlar va Telegram credential'lar `.env` faylida saqlansin, hech qachon kodga hardcode qilinmasin.
