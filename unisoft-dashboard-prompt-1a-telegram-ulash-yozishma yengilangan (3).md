# Telegram Akkaunt Ulash va Asosiy Yozishma — Poydevor Bosqich (1-qismga qo'shimcha)

> ⚠️ **Qurilish tartibida birinchi o'rin.** Bu hujjat 1-qismdagi (`unisoft-dashboard-prompt-1-qism.md`) Chat moduli (6-bo'lim)ning **eng birinchi, AI'siz** qismini batafsil yoritadi. AI Advisor panel, chatbot, Utel integratsiyasi (1-qism 6.3-6.5, 2-qism) — barchasi shu bosqich ustiga quriladi, shuning uchun bu **eng avval** ishlab chiqilishi kerak. `unisoft-dashboard-prompt-0-umumiy-qoidalar.md` qoidalari shu yerga ham tegishli — demo/stub ulanish emas, real MTProto session bo'lishi shart.

---

## 1. IKKI XIL TELEGRAM ULANISH — IKKALASI HAM HAQIQIY AKKAUNT (BOT EMAS)

**Muhim aniqlik:** Bu tizimda "bot" umuman ishlatilmaydi. Ikkala turdagi ulanish ham — **oddiy, haqiqiy Telegram akkaunti** (haqiqiy telefon raqami bilan ro'yxatdan o'tgan), ya'ni ikkalasi ham **MTProto (GramJS)** orqali ulanadi. Farqi faqat kim undan foydalana olishida:

| Tur | Kimning akkaunti | Texnologiya | Kim foydalanadi |
|---|---|---|---|
| Korporativ akkaunt | Kompaniyaning o'z haqiqiy telefon raqami bilan ochilgan oddiy Telegram akkaunti (masalan +998 XX XXX-XX-XX — BeeGroup'ning umumiy raqami) | MTProto (GramJS) | Shu kompaniyaning **barcha operatorlari** birga kira oladi, birga javob yoza oladi |
| Shaxsiy akkaunt | Operatorning o'zining shaxsiy Telegram raqami | MTProto (GramJS) | Faqat **shu bitta operator** |

Ya'ni texnik jihatdan ikkalasi ham bir xil ulash oqimidan (2-bo'lim) o'tadi — bir xil `POST /api/telegram/connect/*` endpointlar, bir xil session shifrlash mexanizmi. Farqi faqat qaysi jadvalga bog'lanishida: korporativ — `companies.telegram_corporate_account`, shaxsiy — `operators.telegram_personal_account`.

---

## 2. AKKAUNT ULASH OQIMI (MTProto, shaxsiy akkaunt uchun)

### 2.1 UI oqimi (operator tomonidan)
1. Operator "Sozlamalar → Telegram ulash" bo'limiga kiradi
2. "Shaxsiy akkaunt ulash" tugmasini bosadi
3. Telefon raqamini kiritadi
4. Telegramdan SMS/ilova orqali kelgan kodni kiritadi
5. Agar 2FA (ikki bosqichli tekshiruv) yoqilgan bo'lsa — parolni kiritadi
6. Muvaffaqiyatli ulangач, "✅ Ulandi: +998 XX XXX-XX-XX" degan holat ko'rsatiladi

### 2.2 Backend oqimi

```
POST /api/telegram/connect/start
  body: { operator_id, phone_number }
  → GramJS orqali client.sendCode() chaqiriladi
  → phone_code_hash vaqtincha (Redis, 5 daqiqa TTL) saqlanadi

POST /api/telegram/connect/verify-code
  body: { operator_id, phone_number, code }
  → GramJS orqali client.signIn() chaqiriladi
  → Agar 2FA kerak bo'lsa → { requires_password: true } qaytariladi

POST /api/telegram/connect/verify-password
  body: { operator_id, password }
  → GramJS orqali client.checkPassword() chaqiriladi
  → Muvaffaqiyatli bo'lsa, session_string olinadi

POST /api/telegram/connect/finalize
  → session_string SHIFRLANGAN holda operators.telegram_personal_account maydoniga yoziladi
  → Bu operator uchun background'da doimiy TelegramClient instance ishga tushiriladi
```

**Xavfsizlik talabi:** `session_string` — bu amalda akkauntga to'liq kirish huquqi (parolsiz kirish imkonini beradi). Shuning uchun:
- Bazada **hech qachon ochiq matn** holda saqlanmasin — AES-256 yoki shunga o'xshash algoritm bilan shifrlansin
- Shifrlash kaliti alohida secret manager'da (masalan `.env` orqali emas, balki vault/KMS orqali) saqlansin, agar mavjud bo'lsa
- Session'ga kirish huquqi faqat backend service darajasida, hech qanday frontend/log'da ko'rinmasin

### 2.3 Korporativ akkaunt uchun farqi
Xuddi shu oqim, lekin `company_id` darajasida (operator emas, kompaniya darajasida) saqlanadi: `companies.telegram_corporate_account`. Ulashni faqat Company Admin yoki Super Admin amalga oshira oladi.

---

## 3. CONNECTION POOL — KO'P SESSIYANI BOSHQARISH

Har bir operator (shaxsiy) + har bir kompaniya (korporativ) — alohida `TelegramClient` instance talab qiladi. Bu instance'larni doimiy ochiq holatda saqlash kerak (real-vaqt xabar qabul qilish uchun).

```
TelegramConnectionManager (backend service)
├── activeClients: Map<session_id, TelegramClient>
├── connect(session_id, encrypted_session) → dekripsiya qilib, client.connect()
├── disconnect(session_id)
├── reconnectOnFailure() — agar ulanish uzilsa, avtomatik qayta ulanish
└── healthCheck() — barcha ulanishlar holatini kuzatish (admin panelda ko'rsatish uchun, 1-qism 3-bo'lim)
```

**Muhim:** server qayta ishga tushganda (deploy, restart) barcha aktiv sessiyalar DB'dan o'qib, avtomatik qayta ulanishi kerak — operator qayta login qilishga majbur bo'lmasligi kerak.

---

## 4. XABAR QABUL QILISH (real-vaqt)

```javascript
// Har bir ulangan client uchun
client.addEventHandler(async (event) => {
  const message = event.message;
  // 1. Xabarni darhol DB'ga yoz (messages jadvali, 1-qism 3.5-bo'lim)
  // 2. WebSocket orqali frontend'ga real-vaqt yubor (operator ekranida darhol ko'rinishi uchun)
  // 3. Agar operator offline bo'lsa — notification yarat
}, new NewMessage({}));
```

Bu bosqichda **hali AI ishtirok etmaydi** — faqat xabar qabul qilish, saqlash, ko'rsatish. AI Advisor panel (lead score, maslahat) — bu keyingi bosqich, mavjud xabarlar ustiga qo'shiladi.

---

## 5. XABAR YUBORISH (oddiy, AI'siz)

- Operator UI'dan matn yozadi, "Yuborish" tugmasini bosadi
- Backend: `POST /api/chats/:chat_id/messages` → tegishli `TelegramClient` orqali `client.sendMessage()` chaqiriladi
- Xabar darhol DB'ga `sender: operator` bilan yoziladi
- Agar Telegram xatolik qaytarsa (masalan session uzilgan, akkaunt bloklangan) — operatorga aniq xato ko'rsatiladi (0-qism qoidasiga muvofiq, jim qolmasin)

---

## 6. HAQIQIY TELEGRAM KABI INTERFEYS VA FUNKSIYALAR

Chat bo'limi ochilganda, birinchi ko'rinish — **haqiqiy Telegram ilovasiga o'xshash kirish oynasi**: telefon raqam kiritish maydoni, keyin kod, keyin (kerak bo'lsa) parol — xuddi 2-bo'limdagi oqim, lekin operator buni to'g'ridan-to'g'ri Chat bo'limi ichida, real Telegram interfeysini eslatuvchi dizaynda ko'radi.

Ulangandan keyin, funksionallik jihatidan **haqiqiy Telegram'ga imkon qadar yaqin** bo'lishi kerak:
- Chatlar ro'yxati (so'nggi xabar, vaqt, o'qilmagan xabarlar soni bilan)
- Xabar pufakchalari (bubble), vaqt belgisi, o'qilgan/o'qilmagan holati (agar Telegram API orqali mavjud bo'lsa)
- Rasm, fayl, ovozli xabar yuborish/qabul qilish (nafaqat matn)
- Qidiruv — chatlar va xabarlar bo'yicha
- "Yozmoqda..." holati (typing indicator)

Bu — operator uchun tanish, qo'shimcha o'rganishni talab qilmaydigan tajriba yaratish uchun muhim.

---

## 7. KO'P AKKAUNT — QAT'IY IZOLYATSIYA

Operator 2 ta akkaunt (korporativ + shaxsiy) ulaganda, ular orasida **hech qanday ma'lumot aralashmasligi** kerak — bu juda muhim xavfsizlik talabi:

- **Backend:** har bir akkaunt uchun `TelegramConnectionManager`da alohida, mustaqil `session_id` bilan client instance ochiladi (3-bo'lim). Ikkala client bir-biridan butunlay mustaqil — bittasining xotira holati, cache'i, kontakt ro'yxati ikkinchisiga hech qachon o'tmaydi.
- **Frontend:** state management (masalan Redux/Zustand store) darajasida ham har bir akkaunt uchun **alohida namespace** ishlatilishi kerak (masalan `telegramAccounts[account_id].chats`, `telegramAccounts[account_id].messages`) — umumiy/global state'da aralashtirib saqlash taqiqlanadi.
- **UI:** operator ikkala akkaunt orasida tab yoki toggle orqali almashadi, va almashganda oldingi akkauntning ochiq chati/xabar qoralamasi ikkinchisida ko'rinmasligi kerak.
- **Test talabi:** AI coding assistant bu qismni tugatgach, ikkita akkauntni ketma-ket ulab, ular orasida almashib, hech qanday xabar/kontakt boshqasiga "sizib o'tmaganini" qo'lda tekshirishi kerak.

---

## 8. SUPERADMIN NAZORATI — BARCHA YOZISHMALARNI KO'RISH VA TAHLIL QILISH

Barcha ulangan akkauntlardagi (korporativ va shaxsiy) yozishmalar **Super Admin panelida** to'liq ko'rinishi va saqlanib borishi kerak — bu 1-qism 13-bo'limidagi Audit Logging talabi bilan uyg'un ishlaydi.

### 8.1 Operator profili sahifasida (Super Admin panel)

Super Admin biror operatorni tanlaganda, uning to'liq profili ochiladi:
- Shaxsiy ma'lumotlari, biriktirilgan kompaniyasi, KPI'lari (3-qism statistikasi)
- **"Chat" bo'limi** — shu operatorning barcha yozishmalarini (korporativ akkauntdagi ulushi + shaxsiy akkaunt) **to'liq ko'ra oladi**, xuddi operatorning o'zi ko'rgandek

### 8.2 Ikki xil tahlil usuli

1. **Qo'lda ko'rib chiqish** — Super Admin xohlagan chatni ochib, xabarlarni o'zi o'qib chiqishi mumkin (real vaqtli yoki tarixiy)
2. **AI orqali tahlil** — Super Admin "Bu operatorning chatlarini tahlil qil" tugmasini bosganda, AI (1b-qismdagi AI Assistant arxitekturasi asosida) shu operatorning barcha yozishmalarini ko'rib chiqib, xulosa beradi: muloqot sifati, sotuv ko'nikmalari, qoidalarga rioya qilish (masalan `forbidden_phrases` ishlatilganmi), umumiy baho

### 8.3 Ma'lumotlar bazasi va ruxsat

- Bu funksiya uchun alohida yangi jadval kerak emas — mavjud `messages` jadvali (1-qism 3.5-bo'lim) yetarli, chunki barcha xabarlar allaqachon saqlanib boriladi
- Ruxsat: faqat **Super Admin** va (agar operator o'ziga tegishli kompaniyada bo'lsa) **Company Admin** shu ko'rinishga kira oladi. Oddiy operator boshqa operatorning yozishmalarini ko'ra olmaydi.
- Bu — maxfiylik jihatidan sezilarli funksiya, shuning uchun har bir ko'rish holati (Super Admin qaysi operatorning qaysi chatiga kirgani) **audit log**ga yozilishi shart (1-qism 13-bo'lim)

---

## 9. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ (ustuvor tartib)

> Bu bosqichni 1-qismning qolgan qismlari (AI advisor, chatbot) bilan **bir vaqtda emas, undan oldin** bajar:
>
> 1. GramJS (`telegram` npm paketi) ni loyihaga qo'sh
> 2. Session shifrlash/dekripsiya utility funksiyalarini yoz (AES-256)
> 3. `POST /api/telegram/connect/*` endpointlarini yuqoridagi 2.2-bo'limga muvofiq qur
> 4. `TelegramConnectionManager` servisini yoz — ko'p sessiyani parallel boshqarish, avtomatik qayta ulanish bilan, **har bir session mustaqil va izolyatsiya qilingan holda** (7-bo'lim)
> 5. Xabar qabul qilish event handler'ini qur — DB'ga yozish + WebSocket orqali frontend'ga yuborish
> 6. Telegram'ga o'xshash chat UI qur (6-bo'lim): chatlar ro'yxati, xabar pufakchalari, media qo'llab-quvvatlash, qidiruv, typing indicator
> 7. Frontend state'ni akkaunt bo'yicha namespace qilib qur — ikki akkaunt orasida ma'lumot aralashmasligini ta'minla, qo'lda test qil
> 8. Ulash holatini admin panelda ko'rsatuvchi UI qo'sh (qaysi operatorlar ulangan, qaysilari ulanmagan)
> 9. Super Admin panelda operator profili ichiga "Chat" bo'limini qo'sh — to'liq yozishma tarixi + AI tahlil tugmasi (8-bo'lim)
> 10. Har bir Super Admin/Company Admin tomonidan operator chatiga kirish holatini audit log'ga yoz
> 11. Shundan keyingina — 1-qism 6.3-6.5-bo'limlar (AI Advisor, chatbot) va 2-qism (Utel integratsiyasi) ustiga quriladi
>
> Bu bosqich tugagach, 0-qismdagi checklist bo'yicha tekshir: real session ulanganmi (demo emas), xabarlar real DB'dan kelayaptimi, xatolik holatlari to'g'ri ko'rsatilyaptimi, akkaunt izolyatsiyasi qo'lda tekshirilganmi.

> Bu bosqich tugagach, 0-qismdagi checklist bo'yicha tekshir: real session ulanganmi (demo emas), xabarlar real DB'dan kelayaptimi, xatolik holatlari to'g'ri ko'rsatilyaptimi.
