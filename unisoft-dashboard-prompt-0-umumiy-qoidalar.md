# 0-qism — Umumiy Qoidalar: Demo/Mock'ga Yo'l Yo'q, Production-Sifat Talablari

> **MUHIM:** Bu hujjat 1, 2, 3, 4 (va keyingi barcha) qismlarga umumiy asos sifatida qo'llanadi. AI coding assistant'ga har safar prompt berilganda, shu faylni ham albatta biriktirish kerak — chunki bu yerdagi qoidalar har bir modulga tegishli.

---

## 1. NEGA BU HUJJAT KERAK

Ko'pincha AI coding assistant tezroq natija ko'rsatish uchun quyidagilarni qiladi:
- Frontendda statik/hardcoded ma'lumot ko'rsatadi ("demo data")
- AI maslahat matnlarini kod ichida `if/else` yoki tayyor string sifatida yozadi (aslida LLM chaqirmaydi)
- Statistikani real DB so'rovi o'rniga fake sonlar bilan to'ldiradi
- "Keyinroq ulaymiz" deb API integratsiyani stub (bo'sh funksiya) qoldiradi

Bu — ishlab chiqarish (production) uchun **yaroqsiz**. Quyidagi qoidalar shuning oldini oladi.

---

## 2. QAT'IY TAQIQLAR

1. **Hech qanday hardcoded/statik AI javob bo'lmasin.** Har bir "AI maslahat", "AI xulosa", "Lead score", "AI insight" — albatta real LLM (Claude/GPT) API chaqiruvi orqali, real ma'lumotlar (chat tarixi, mijoz profili, operator_profile) asosida generatsiya qilinishi kerak. Agar biror joyda `return "Zo'r javob berdingiz!"` kabi qattiq yozilgan matn topilsa — bu xato va tuzatilishi shart.
2. **Statistika hech qachon fake/random sonlar bilan to'ldirilmasin.** Har bir raqam DB'dagi haqiqiy jadvallardan (`messages`, `leads`, `tasks`, `flight_bookings` va h.k.) hisoblanishi kerak. Agar hozircha ma'lumot yo'q bo'lsa — "0" yoki "ma'lumot yetarli emas" ko'rsatilsin, lekin fake son emas.
3. **UI'da "Lorem ipsum" yoki o'ylab topilgan mijoz ismlari/xabarlar bo'lmasin** — test uchun kerak bo'lsa, buni aniq "TEST DATA — ishlab chiqarishda o'chiriladi" deb belgilangan seed skript orqali qiling, asosiy kodga aralashtirmang.
4. **Integratsiyalar stub qoldirilmasin.** Agar API kaliti hali yo'q bo'lsa (masalan Payme/Click hali ulanmagan), buni frontendda aniq "Integratsiya kutilmoqda" deb ko'rsating — soxta "muvaffaqiyatli to'lov" holatini simulyatsiya qilmang.

---

## 3. AI PROMPTLARI SIFATI — ANIQ TALABLAR

Har bir AI funksiyasi (lead score, AIDA maslahat, mijoz `ai_summary`, haftalik `ai_insights`, chatdagi javob generatsiyasi) uchun quyidagi tuzilma bajarilishi kerak:

### 3.1 Context qurish (Context Builder)
LLM'ga yuboriladigan har bir so'rov quyidagilarni **haqiqiy DB'dan olib** o'z ichiga olishi kerak:
- Mijozning to'liq (yoki so'nggi N ta) muloqot tarixi
- `operator_profile` (tone, vocabulary, forbidden_phrases va h.k.)
- Kompaniya biznes qoidalari (masalan MySafar uchun narx siyosati, BeeGroup uchun kredit shartlari)
- Oldingi AI xulosalar (agar mavjud bo'lsa — takror ishlamaslik uchun)

### 3.2 Structured Output talabi
AI javoblari (masalan lead_score, aida_stage) **erkin matn emas, balki JSON schema** orqali qaytarilishi kerak, keyin backend shu JSON'ni tekshirib (validation) DB'ga yozadi. Masalan:

```json
{
  "lead_score": 0-100,
  "confidence": 0.0-1.0,
  "aida_stage": "attention | interest | desire | action",
  "advice_text": "operator uchun tabiiy tilda maslahat",
  "reasoning_summary": "qisqacha nima uchun shu baho qo'yildi"
}
```

### 3.3 Hallucination oldini olish
- AI hech qachon DB'da yo'q ma'lumotni "o'ylab topmasligi" kerak (masalan mijoz aytmagan narsani aytgan deb yozish)
- Agar ma'lumot yetarli bo'lmasa, AI shuni ochiq aytishi kerak: `"Hali yetarli ma'lumot yo'q"` — bu holat UI'da ham to'g'ri ko'rsatilishi kerak, o'ylab topilgan javob bilan to'ldirilmasin

### 3.4 Prompt versiyalash
Har bir AI funksiyasi uchun system prompt alohida faylda/konfiguratsiyada saqlansin (kodga hardcode qilinmasin), versiyasi bilan (`v1`, `v2`) — bu kelajakda A/B test va sifatni yaxshilash imkonini beradi.

---

## 4. DIZAYN — "POLISH PASS" TALABI

Har bir modul (1-4 qismlarning barchasi) tugagach, alohida **dizayn siqiqlashtirish bosqichi** o'tkazilishi kerak:

- Bo'sh holatlar (empty states) — masalan "Hali leadlar yo'q" — chiroyli, ikonka/illyustratsiya bilan ko'rsatilsinmi, oddiy bo'sh ekran emas
- Yuklanish holatlari (loading skeleton, spinner emas — zamonaviy skeleton loader)
- Xatolik holatlari (error states) — tushunarli, foydalanuvchiga nima qilish kerakligini aytadigan
- Barcha interaktiv elementlar (tugmalar, kartochkalar) hover/active holatlarga ega bo'lsin
- Responsive tekshiruv — mobil va planshetda ham buzilmasin
- Ranglar, shriftlar, oraliqlar (spacing) — 1-qism 9-bo'limida belgilangan "premium SaaS" darajasiga mos kelishi

---

## 5. QABUL QILISH MEZONLARI (har bir qism uchun umumiy qo'shimcha)

Har bir qism (1, 2, 3, 4...) faqat quyidagilar bajarilgandagina "tugallangan" deb hisoblanadi:

- [ ] Hech qanday hardcoded/demo AI javobi yo'q — hammasi real LLM chaqiruvi orqali
- [ ] Hech qanday fake statistika/son yo'q — hammasi real DB agregatsiyasidan
- [ ] Barcha AI funksiyalari structured output (JSON schema) bilan ishlaydi va validatsiyadan o'tadi
- [ ] Integratsiya hali ulanmagan bo'lsa — bu holat UI'da aniq ko'rsatilgan, soxta muvaffaqiyat simulyatsiya qilinmagan
- [ ] Dizaynda bo'sh/yuklanish/xato holatlari ishlangan
- [ ] System promptlar alohida konfiguratsiyada, versiyalangan holda saqlangan

---

## 6. AI CODING ASSISTANT'GA QO'SHIMCHA KO'RSATMA

> Har safar biror modulni "tugadi" deb hisoblashdan oldin, yuqoridagi 5-bo'limdagi checklist bo'yicha o'z-o'zingni tekshir va natijani aniq yoz: qaysi bandlar bajarilgan, qaysilari hali yo'q. Agar biror joyda vaqtinchalik demo/stub yechim ishlatishga majbur bo'lsang (masalan API kaliti hali berilmagan bo'lsa), buni **aniq va ko'rinarli** qilib izohla (`// TODO: DEMO — real API kaliti kelgach almashtirilishi shart`) va bosh javobingda alohida ro'yxat qilib ko'rsat.

---

## 7. AMALIY QADAM — HOZIRGI DEMO KODNI QANDAY TOZALASH KERAK

Sen aytgan holatga (hozir ko'p narsa demo, AI maslahatlar kodda yozilgan) qarab, AI'ga quyidagi qo'shimcha topshiriqni ber:

> 1. Butun kod bazasini sken qil va quyidagilarni top: (a) hardcoded/statik AI javoblar, (b) fake/random statistik sonlar, (c) stub integratsiyalar
> 2. Har birini ro'yxat qilib chiqar — fayl nomi, qator raqami, nima uchun demo ekanligi
> 3. Ustuvorlik bo'yicha tuzat: avval AI maslahat funksiyalari (chunki bu — mahsulotning asosiy qiymati), keyin statistika, keyin integratsiyalar
> 4. Har bir tuzatishdan keyin 5-bo'limdagi checklist bo'yicha o'z-o'zini tekshir
