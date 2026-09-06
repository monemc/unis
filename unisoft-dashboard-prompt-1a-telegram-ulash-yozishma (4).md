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

## 9. DASHBOARD → TELEGRAM: XABAR YETKAZISH OQIMI (aniq va to'liq)

Bu — modulning eng muhim talabi: **dashboarddan operator yozgan har bir xabar, real Telegram orqali, mijozning haqiqiy Telegram akkauntiga borishi shart.** Bu 5-bo'limda umumiy tasvirlangan edi, endi to'liq aniq oqim:

### 9.1 To'liq yo'l (end-to-end)

```
Operator dashboardda matn yozadi → "Yuborish" bosadi
        ↓
Frontend: POST /api/chats/:chat_id/messages { text, chat_id }
        ↓
Backend: chat_id orqali qaysi Telegram akkaunt (korporativ/shaxsiy) va qaysi mijoz ekanligini aniqlaydi
        ↓
Backend: DB'ga message yozadi, status = "sending"
        ↓
TelegramConnectionManager orqali tegishli TelegramClient.sendMessage(customer_telegram_id, text) chaqiriladi
        ↓
Muvaffaqiyatli bo'lsa → status = "sent" (Telegram'ning o'z message_id'si DB'ga yoziladi)
Muvaffaqiyatsiz bo'lsa → status = "failed", operatorga aniq xato ko'rsatiladi, qayta yuborish tugmasi chiqadi
        ↓
Mijoz Telegramda xabarni haqiqatda ko'radi — bu haqiqiy Telegram xabari, dashboard ichidagi simulyatsiya emas
```

### 9.2 Yetkazilish holati (delivery status) — haqiqiy Telegram kabi

Xabar pufakchasi yonida holat belgisi ko'rsatiladi (0-qism qoidasiga muvofiq — bular **real** holat, o'ylab topilmagan):
- ⏳ Yuborilmoqda
- ✓ Yuborildi (Telegram serveriga yetdi)
- ✓✓ Yetkazildi (mijoz qurilmasiga tushdi — Telegram API orqali mavjud bo'lsa)
- ✓✓ (ko'k) Mijoz o'qidi (agar API orqali "read receipt" mavjud bo'lsa)
- ❌ Yuborilmadi — xato sababi bilan (masalan "akkaunt bloklangan", "session uzilgan")

### 9.3 Testda tekshirish talabi

AI coding assistant bu bosqichni tugatgach, real test o'tkazishi kerak: dashboarddan yuborilgan xabar **haqiqatan ham** haqiqiy Telegram ilovasida (masalan test raqamida) ko'rinishini tasdiqlashi shart — bu simulyatsiya yoki mock javob bilan "ishladi" deb hisoblanmasin (0-qism, 2-bo'lim).

---

## 10. AKKAUNT QO'SHISH VA CHIQISH (LOGOUT/DISCONNECT) OQIMI

### 10.1 Yangi akkaunt qo'shish
"Sozlamalar → Telegram" bo'limida operator/admin har doim yangi akkaunt qo'shishi mumkin — bu 2-bo'limdagi oqim bilan bir xil (telefon → kod → parol). Ulangan akkauntlar ro'yxati shu yerda ko'rinadi: telefon raqami (qisman yashiringan, masalan `+998 XX ***-**-21`), ulangan sana, holat (faol/uzilgan).

### 10.2 Akkauntdan chiqish (logout)

```
POST /api/telegram/disconnect
  body: { session_id }
  → TelegramConnectionManager.disconnect(session_id) chaqiriladi
      - client.logOut() — Telegram serverida ham sessiyani bekor qiladi (faqat lokal o'chirish emas)
      - activeClients Map'idan olib tashlanadi
  → DB'dagi shifrlangan session_string o'chiriladi (yoki is_active = false qilinadi)
  → Frontend'da shu akkauntga tegishli barcha state (chatlar, xabarlar) tozalanadi
```

**Muhim:** `client.logOut()` chaqirilishi shart — bu shunchaki bizning tizimdan "uzish" emas, balki Telegram'ning o'zida ham sessiyani bekor qiladi (xuddi telefon ilovasida "chiqish" bosgandek). Agar buni qilmasak, session tashqarida faol qolib, xavfsizlik muammosi tug'diradi.

### 10.3 Tasdiqlash so'rovi
Chiqish tugmasi bosilganda, UI albatta tasdiqlash so'raydi: *"Rostdan ham [+998 XX XXX-XX-XX] akkauntidan chiqmoqchimisiz? Bu akkauntdagi barcha yozishmalar tarixi saqlanib qoladi, lekin yangi xabar almashinuvi to'xtaydi."*

---

## 11. SUPERADMIN — XABARLARNI KO'RISH DIZAYNI (batafsil)

8-bo'limda funksionallik tasvirlangan edi, bu yerda **aniq UI/UX talablari**:

### 11.1 Kirish nuqtasi
Super Admin panelida ikkita joydan kirish mumkin:
- Operator profili sahifasidan → "Yozishmalar" tabi
- Yoki alohida global "Barcha Yozishmalar" bo'limidan (kompaniya/operator/sana bo'yicha filtrlash bilan)

### 11.2 Ko'rinish
- **Chap panel**: operatorning barcha chatlari ro'yxati (mijoz ismi, oxirgi xabar, sana), korporativ va shaxsiy akkaunt alohida **tab** yoki **belgi (ikonka)** bilan farqlanadi
- **O'ng panel**: tanlangan chatning to'liq xabar tarixi, xuddi 6-bo'limdagi operator ko'rinishi kabi (pufakchalar, vaqt belgisi) — lekin **faqat o'qish rejimida** (Super Admin bu yerdan mijozga to'g'ridan-to'g'ri xabar yozolmaydi, faqat kuzatadi — agar aralashish kerak bo'lsa, alohida "operatorga xabar yuborish" funksiyasi orqali)
- Yuqorida qidiruv maydoni (mijoz ismi, xabar matni bo'yicha)
- Sana oralig'i filtri

### 11.3 AI tahlil tugmasi joylashuvi
Chat oynasi ustida **"AI bilan tahlil qilish"** tugmasi turadi. Bosilganda yon panel ochiladi (1b-qism AI Assistant arxitekturasi asosida), unda:
- Umumiy suhbat sifati bahosi (1-10 yoki foiz)
- Aniqlangan muammolar (agar bo'lsa — masalan `forbidden_phrases` ishlatilgani, sekin javob berilgani)
- Yaxshi tomonlar (nima yaxshi ishlagani)
- Qisqacha xulosa matni

### 11.4 Dizayn sifat talabi
Bu bo'lim 0-qism 4-bo'limidagi "polish pass" talabiga to'liq bo'ysunadi: bo'sh holatlar (hali yozishma yo'q chatlar uchun), yuklanish holatlari, va eng muhimi — **katta hajmdagi xabar tarixini** (ba'zi mijozlar bilan oylab yozishgan bo'lishi mumkin) tez va qulay ko'rish uchun **virtualized scroll** yoki pagination ishlatilishi kerak, aks holda sahifa sekinlashadi.

---

## 12. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ (ustuvor tartib)

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
> 9. Super Admin panelda operator profili ichiga "Chat" bo'limini qo'sh — to'liq yozishma tarixi + AI tahlil tugmasi (8, 11-bo'limlar), 11.2-bo'limdagi dizayn bo'yicha (chap panel — chatlar ro'yxati, o'ng panel — xabar tarixi, faqat o'qish rejimida)
> 10. Har bir Super Admin/Company Admin tomonidan operator chatiga kirish holatini audit log'ga yoz
> 11. Dashboard→Telegram xabar yuborish oqimini 9-bo'limga muvofiq to'liq qur, real delivery status (yuborildi/yetkazildi/o'qildi/xato) bilan — va buni haqiqiy Telegram raqamida sinab tekshir
> 12. Akkaunt qo'shish/chiqish (logout) oqimini 10-bo'limga muvofiq qur — `client.logOut()` orqali Telegram serverida ham sessiyani bekor qilish shart
> 13. Shundan keyingina — 1-qism 6.3-6.5-bo'limlar (AI Advisor, chatbot) va 2-qism (Utel integratsiyasi) ustiga quriladi
>
> Bu bosqich tugagach, 0-qismdagi checklist bo'yicha tekshir: real session ulanganmi (demo emas), xabarlar real DB'dan kelayaptimi, xatolik holatlari to'g'ri ko'rsatilyaptimi, akkaunt izolyatsiyasi qo'lda tekshirilganmi.
