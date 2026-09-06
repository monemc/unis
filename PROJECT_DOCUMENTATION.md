# Unisoft Dashboard — Loyiha Hujjatlashtirish Fayli (`PROJECT_DOCUMENTATION.md`)

> 📜 **Hujjat Standarti:** `unisoft-dashboard-prompt-0b-hujjatlashtirish-qoidasi.md` qoidasi bo'yicha markazlashtirilgan loyiha hujjati.

---

## 1. LOYIHA UMUMIY TAVSIFI

**Unisoft Dashboard** — Bu ko'p kompaniyali (multi-tenant) CRM va sun'iy intellektga asoslangan savdo/xizmat ko'rsatish platformasi. Tizim quyidagi asosiy korporativ mijozlar uchun moslashtirilgan:
1. **BeeGroup** — Avto-lizing va nasiya savdo kompaniyasi (BYD Yuan Up, Changan, Cobalt kabi avtomobillar bo'yicha moliyaviy arenda va scoring).
2. **MySafar** — Aviabilet va turizm agentligi (reyslar qidiruvi, CBU valyuta kursi bo mehmonda hisob-kitob, pasport OCR o'qish va Payme/Click to'lov havolalari).
3. **Unired** — Xalqaro va mahalliy moliya xizmatlari ko'rsatuvchi sub'ekt.

Tizim Telegram MTProto (GramJS) orqali haqiqiy shaxsiy va korporativ Telegram akkauntlarini bog'laydi, IP-ATS (Utel) ovozli suhbatlarini transkript qiladi va sun'iy intellekt (Groq Llama-3/Claude/OpenAI) orqali mijozlar bilan real-vaqtda yozishadi va savdo jarayonlarini avtomatlashtiradi.

---

## 2. ARXITEKTURA VA TEXNIK STACK

### 2.1 Texnologik Stek
- **Frontend & Server**: Next.js 14 (App Router, React, TailwindCSS, Lucide Icons)
- **Database ORM**: Prisma ORM (SQLite / PostgreSQL support)
- **Telegram Protokoli**: GramJS MTProto Client (`telegram` npm paketi, Dynamic Lazy Connection, AES-256 shifrlangan session saqlash)
- **AI / LLM Qatlami**: Groq Cloud API (`llama-3.3-70b-versatile` / `mixtral-8x7b-32768`), `<think>` teglarini regex tozalash
- **To'lov Webhooklar**: Payme & Click merchant API integratsiyasi
- **Ovozli Aloqa Integratsiyasi**: Utel IP-ATS Webhook + 8-bosqichli State Machine

### 2.2 Servis Arxitekturasi Chizmasi (ASCII)
```
[ Telegram App / User ] ◄── MTProto (GramJS) ──► [ TelegramConnectionManager ]
                                                           │
                                                           ▼
[ Utel IP-ATS Call ]  ───► [ /api/webhooks/utel ] ──► [ Groq LLM API (AI Agent) ]
                                                           │
                                                           ▼
[ Operator / Dashboard ] ◄── WebSocket/REST API ───► [ Prisma Database ]
```

---

## 3. MODULLAR RO'YXATI

### 3.1 Telegram Chat Moduli (`/dashboard/chats`)
- **Holati:** ✅ Tugallangan (Real MTProto Session)
- **Nima qiladi:** Operatorga haqiqiy Telegram ilovasisiz platforma ichida korporativ hamda shaxsiy Telegram akkauntlari orqali mijozlar bilan muloqot qilish imkonini beradi.
- **Qanday ishlaydi (texnik):** `TelegramConnectionManager` servisi AES-256 shifrlangan `session_string` ma'lumotlarini dekripsiya qilib, Telegram serverlariga ulana oladi. `sendTelegramMessage` funksiyasi GramJS `sendMessage` orqali haqiqiy Telegram'ga xabarlarni yetkazadi.
- **Ma'lumotlar bazasi jadvallari:** `Company`, `Operator`, `Customer`, `Chat`, `Message`
- **API Endpointlar:**
  - `POST /api/telegram/connect/start` (SMS kod yuborish)
  - `POST /api/telegram/connect/verify-code` (SMS kod tasdiqlash)
  - `POST /api/telegram/connect/verify-password` (2FA parol tasdiqlash)
  - `POST /api/telegram/disconnect` (`client.logOut()` chaqirib sessiyani uzish)
  - `POST /api/telegram/contacts` (Telegram global `@username` va telefon raqam qidiruvi)
  - `GET & POST /api/chats/[id]/messages` (Xabar olish va yuborish)

---

### 3.2 BeeGroup Avto-Lizing va KATM Scoring Moduli (`/api/beegroup/*`)
- **Holati:** ✅ Tugallangan
- **Nima qiladi:** Avtomobil lizingi (BYD Yuan Up, Changan CS35 Plus, Cobalt Style) bo'yicha boshlang'ich to mehmondagi 20% (fin arenda) va 50% (nasiya) minimal to'lovlarini aniq hisoblaydi hamda PINFL bo'yicha KATM scoring kredit xulosasini chiqaradi.
- **Qanday ishlaydi (texnik):** `src/lib/beegroup-calculator.ts` va `src/lib/katm-scoring.ts` orqali hisob-kitoblar amalga oshiriladi. Avto so'rovlari va lokatsiya so'rovlari ovozli transkriptdan keyin Telegram kartochkasi ko'rinishida yuboriladi.
- **Ma'lumotlar bazasi jadvallari:** `VehicleInventory`, `CreditApplication`, `CallIntentAction`
- **API Endpointlar:**
  - `POST /api/beegroup/credit-app` (Kredit arizasi va scoring)
  - `POST /api/beegroup/auto-search` (Telefon raqam bo'yicha qidiruv va Telegram bildirishnoma)

---

### 3.3 MySafar Aviabilet va Pasport OCR Moduli (`/api/flights/*`, `/api/passport/ocr`)
- **Holati:** ✅ Tugallangan
- **Nima qiladi:** Toshkentdan Istanbul, Dubay kabi yo'nalishlarga CBU Markaziy Bank valyuta kursi bo'yicha aviabilet narxlarini hisoblaydi, pasport rasmidan MRZ kodni OCR o'qiydi hamda Payme/Click to'lov havolalarini generatsiya qiladi.
- **Ma'lumotlar bazasi jadvallari:** `Customer`, `Message`
- **API Endpointlar:**
  - `POST /api/flights/search` (Reyslar va CBU kursi)
  - `POST /api/passport/ocr` (Zagran pasport OCR skanner)
  - `POST /api/flights/book` (Payme/Click to'lov linki yaratish)
  - `POST /api/webhooks/payme` & `POST /api/webhooks/click` (To'lov bajarilganda PDF bilet yuborish)

---

### 3.4 AI Copilot Advisor va Chatbot (`/dashboard/ai-chatbot`, `/api/ai/*`)
- **Holati:** ✅ Tugallangan
- **Nima qiladi:** Har bir mijoz suhbati bo'yicha Lead Score (0-100 foiz) hisoblaydi, operatorga taklif etilgan javoblarni (Suggested Replies) beradi va Groq LLM orqali avtomatik javob beradi. Groq javoblaridagi `<think>` teglarini regex bilan tozalaydi.
- **API Endpointlar:**
  - `POST /api/ai/advisor` (AI Lead score va maslahat)
  - `POST /api/ai/chatbot` (Avtomatik chat javoblari)

---

## 4. MA'LUMOTLAR BAZASI SXEMASI (PRISMA SCHEMA)

```prisma
model Company {
  id                       String     @id @default(uuid())
  name                     String
  telegramCorporateAccount String?    @default("{}") // AES-256 encrypted session
  operators                Operator[]
  customers                Customer[]
}

model Operator {
  id                     String           @id @default(uuid())
  companyId              String
  company                Company          @relation(fields: [companyId], references: [id])
  fullName               String
  email                  String           @unique
  role                   String           @default("operator") // "superadmin" | "admin" | "operator"
  telegramPersonalAccount String?         @default("{}") // AES-256 encrypted session
  chats                  Chat[]
  profile                OperatorProfile?
}

model Customer {
  id               String   @id @default(uuid())
  companyId        String
  company          Company  @relation(fields: [companyId], references: [id])
  fullName         String
  phone            String?
  telegramId       String?
  uniqueCustomerId String   @unique
  chats            Chat[]
}

model Chat {
  id                  String    @id @default(uuid())
  customerId          String
  customer            Customer  @relation(fields: [customerId], references: [id])
  operatorId          String?
  operator            Operator? @relation(fields: [operatorId], references: [id])
  telegramAccountType String    @default("corporate") // "corporate" | "personal"
  status              String    @default("active")
  messages            Message[]
  updatedAt           DateTime  @updatedAt
}

model Message {
  id                  String   @id @default(uuid())
  chatId              String
  chat                Chat     @relation(fields: [chatId], references: [id])
  sender              String   // "customer" | "operator" | "ai"
  text                String
  telegramMessageId   String?
  isDeletedByCustomer Boolean  @default(false)
  createdAt           DateTime @default(now())
}
```

---

## 5. O'ZGARISHLAR TARIXI (CHANGELOG)

## [2026-09-03] — Real Telegram Messaging & Documentation Standard (`0b-qism`)
**Nima qo'shildi/o'zgartirildi:**
- `PROJECT_DOCUMENTATION.md` markaziy hujjatlashtirish fayli yaratildi (`0b-hujjatlashtirish-qoidasi.md` bo'yicha).
- `src/lib/telegram.ts` ichidagi `sendTelegramMessage` mock javobidan real GramJS MTProto client `TelegramConnectionManager.sendMessage` orqali xabar yuborishga o'tkazildi.
- Dashboard chatidan yuborilgan xabar mijozning shaxsiy Telegramiga real vaqtda yetib borishi ta'minlandi.
- `src/app/api/customers/route.ts` orqali Mijozlar bo'limidan `+ Yangi Mijoz` yaratilganda avtomatik Telegramdan `"Assalomu alaykum"` xabari yuborilishi o'rnatildi.

## [2026-09-02] — Prompt 1a Telegram Account Connection (MTProto & 2FA)
**Nima qo'shildi/o'zgartirildi:**
- `TelegramConnectionManager` dynamic lazy connection, WSS WebSocket tunneling va AES-256 shifrlangan seans saqlash yaratildi.
- `client.logOut()` va disconnect endpointlari integratsiya qilindi.

---

## 6. KELGUSI REJALAR / TODO

- [ ] **Multi-tenant Analytics Part 3**: Operator KPI ko'rsatkichlari, haftalik AI xulosalari va javob berish tezligi statistikasi platforma statistika paneliga to'liq ulanadi.
- [ ] **Telegram Media (Rasm/Ovozli Xabarlar)**: GramJS media download/upload funksiyasini yozishmalar oynasiga ulash.
