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

## 6. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ (ustuvor tartib)

> Bu bosqichni 1-qismning qolgan qismlari (AI advisor, chatbot) bilan **bir vaqtda emas, undan oldin** bajar:
>
> 1. GramJS (`telegram` npm paketi) ni loyihaga qo'sh
> 2. Session shifrlash/dekripsiya utility funksiyalarini yoz (AES-256)
> 3. `POST /api/telegram/connect/*` endpointlarini yuqoridagi 2.2-bo'limga muvofiq qur
> 4. `TelegramConnectionManager` servisini yoz — ko'p sessiyani parallel boshqarish, avtomatik qayta ulanish bilan
> 5. Xabar qabul qilish event handler'ini qur — DB'ga yozish + WebSocket orqali frontend'ga yuborish
> 6. Oddiy chat UI qur: xabarlar ro'yxati, matn kiritish maydoni, yuborish tugmasi — **hali AI panel, lead score, chatbot qo'shmasdan**
> 7. Ulash holatini admin panelda ko'rsatuvchi UI qo'sh (qaysi operatorlar ulangan, qaysilari ulanmagan)
> 8. Shundan keyingina — 1-qism 6.3-6.5-bo'limlar (AI Advisor, chatbot) va 2-qism (Utel integratsiyasi) ustiga quriladi
>
> Bu bosqich tugagach, 0-qismdagi checklist bo'yicha tekshir: real session ulanganmi (demo emas), xabarlar real DB'dan kelayaptimi, xatolik holatlari to'g'ri ko'rsatilyaptimi.
