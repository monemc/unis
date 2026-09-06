# BeeGroup AI Sotuv/Kredit Agent — To'liq Texnik Prompt (2b-qism / 10)

> Bu hujjat BeeGroup uchun to'liq aniqlashtirilgan qo'ng'iroq va Telegram sotuv oqimini tasvirlaydi. `unisoft-dashboard-prompt-0-umumiy-qoidalar.md` qoidalari (demo/mock taqiqi, real hisob-kitob, real AI tahlil) shu qismga to'liq tegishli.

---

## 0. UMUMIY OQIM VA FALSAFA

BeeGroup'da operator **deyarli faqat gaplashadi** — qo'shimcha texnik ishlarning barchasini (Telegram qidirish, lokatsiya yuborish, avtomobil ma'lumotini yuborish) **AI avtomatik bajaradi**. Bu — modulning asosiy dizayn tamoyili: operator mijoz bilan ishonchli aloqa o'rnatishga e'tibor beradi, mexanik ishlarni AI o'z zimmasiga oladi.

```
Mijoz qo'ng'iroq qiladi yoki Telegramda murojaat qiladi
        ↓
AI qo'ng'iroqni tinglaydi (real-vaqt yoki tugagach transkript orqali)
        ↓
Telefon raqam kiritilib Enter bosilgan zahoti → AI avtomatik Telegramni qidiradi
        ├── Topilsa → avtomatik yozadi
        └── Topilmasa → operatorga bildirishnoma yuboradi
        ↓
Suhbat davomida AI "ofisga kelish/lokatsiya" yoki "aynan shu avtomobil haqida yuborib qo'ying"
degan iboralarni aniqlasa → mos ma'lumotni (lokatsiya yoki avtomobil kartochkasi) avtomatik yuboradi
        ↓
Telegramda AI boshlang'ich to'lovni hisoblab beradi, savol-javob qiladi
        ↓
Skoring (KATM) → natijaga qarab shartnoma shartlari belgilanadi
        ↓
Ofisga taklif — yakuniy grafik, shartnoma va tasdiqlash ofisda amalga oshadi
```

---

## 1. QO'NG'IROQ/TELEGRAM SAVOL-JAVOB SKRIPTI

| # | Bosqich | Nima qilinadi/so'raladi |
|---|---|---|
| 1 | Salomlashish | *"Assalomu alaykum, yaxshimisiz? BeeGroup kompaniyasi operatori [Operator ismi] bo'laman."* — operator ismi `operator_profile`dan olinadi va har safar avtomatik qo'shiladi |
| 2 | Avtomobil tanlash | Faqat 3 model taklif qilinadi: **Yuan Up, Changan, Cobalt** — barchasi **faqat yangi** (ikkinchi qo'l yo'q) |
| 3 | To'lov turi | **Fin arenda**, **nasiya**, yoki **naqd** |
| 4 | Boshlang'ich to'lov | Fin arenda — minimal **20%**; Nasiya — minimal **50%** |
| 5 | Muddat | **2 yildan 5 yilgacha** |
| 6 | Egalik holati | Fin arenda — avtomobil **kompaniya nomida** chiqadi, to'liq to'langandan keyin mijoz nomiga o'tkaziladi. Nasiya (50% boshlang'ich) — avtomobil **darhol mijoz nomida** chiqadi |
| 7 | Telegram raqam | Kim ham birinchi yozishi mumkin — mijoz ham, operator ham. Eng muhim texnik talab: **telefon raqam kiritilib Enter bosilgan zahoti, tizim avtomatik shu raqam bo'yicha Telegram akkauntini qidiradi** va topilsa yozadi; topilmasa — operatorga bildirishnoma yuboradi |

**Kafil talab qilinmaydi** — bu shart butunlay olib tashlanadi.

---

## 2. QO'NG'IROQDAN KEYIN/DAVOMIDA AVTOMATIK HARAKATLAR

AI qo'ng'iroqni tinglab (real-vaqt yoki call tugagach STT orqali), quyidagi ikki holatni alohida aniqlaydi va **avtomatik** ishga tushiradi:

### 2.1 Lokatsiya yuborish
Agar suhbatda "ofisga kelish" yoki "lokatsiya" mavzusi ko'tarilsa va operator/AI *"lokatsiyani telegramdan tashlab qo'yaman"* yoki shunga o'xshash va'da bersa — AI suhbat tugagach (yoki real-vaqtda) shu mijozning telefon raqamiga bog'langan Telegram akkauntiga **avtomatik ofis lokatsiyasini** yuboradi.

### 2.2 Avtomobil ma'lumotini yuborish
Agar mijoz *"[Cobalt/Changan/Yuan Up] haqida Telegramga yuborib qo'yasizmi"* kabi so'ragan bo'lsa, AI o'sha aniq avtomobilning rasmi, narxi va boshlang'ich to'lov ma'lumotini avtomatik yuboradi.

### 2.3 Ma'lumotlar bazasi
```
call_intent_actions
├── id
├── call_log_id (FK)
├── customer_phone
├── matched_telegram_id (nullable)
├── action_type (send_location / send_car_info / none)
├── car_model (nullable — send_car_info bo'lsa qaysi model)
├── status (pending / sent / failed / customer_not_found)
├── notified_operator (bool — agar customer_not_found bo'lsa, operatorga xabar berilganmi)
└── created_at
```

---

## 3. TELEGRAM'DAGI AI SOTUV OQIMI

### 3.1 Avtomobil taklifi
- **Rasm** — BeeGroup brendligida, tanlangan model (Yuan Up / Changan / Cobalt)
- **Tavsif**: model, narx, **faqat boshlang'ich to'lov summasi so'mda** hisoblab ko'rsatiladi

### 3.2 Boshlang'ich to'lov kalkulyatori (AI hisoblaydi, real formula bilan)
```
calculate_down_payment(car_price, payment_type)
  payment_type == "fin_arenda" → car_price * 0.20 (minimal)
  payment_type == "nasiya"     → car_price * 0.50 (minimal)
```
Bu — deterministik funksiya, LLM'ga hisoblatilmaydi.

### 3.3 Oylik to'lov haqida savol — muhim qoida
**AI aniq oylik to'lov grafigini hisoblamaydi va yubormaydi** — bu ofisdagi sotuv menejerlarining vazifasi. Agar mijoz oylik to'lov haqida so'rasa:
1. Birinchi navbatda AI: *"Aniq grafikni ofisimizdagi sotuv menejerlari siz bilan hisoblab beradi, bizga kelsangiz bo'ladi"* deb ofisga taklif qiladi
2. Agar mijoz **qayta-qayta** so'rab tursa, AI **taxminiy oraliqni** aytadi (masalan: *"oylik to'lov 6 mln 200 mingdan boshlanadi, 6 mlndan yuqoriroq atrofda bo'ladi"* kabi — aniq raqam emas, taxminiy yo'nalish)
3. Agar mijoz Toshkentdan uzoqroqda yashasa, AI to'lov grafigini tuzib berishi mumkin, **lekin har qanday grafik operatorga tasdiqlash uchun yuborilishi va operator tasdig'idan keyingina mijozga jo'natilishi shart** — AI hech qachon o'zi mustaqil ravishda aniq grafikni to'g'ridan-to'g'ri mijozga yubormaydi

### 3.4 "Arzonroq variant" — MySafar'dan farqli mantiq
BeeGroup'da "1-2 kunlik farqda arzonroq" degan tushuncha yo'q. Buning o'rniga:
- Mijozga **ofisga tashrif buyurish** taklif qilinadi — u yerda barcha mavjud avtomobillar umumiy ko'rib chiqiladi va mijozga mos variant tanlanadi
- Agar mijoz boshqa rasmiy avtosalonda arzonroq variant topgan bo'lsa, AI: *"Boshqa rasmiy avtosalondan arzonroq variant ko'rsatsangiz, xuddi shuni biz ham taklif qilamiz"* deb aytishi mumkin (narx moslashtirish taklifi)

### 3.5 Skoring va shartnoma
- Kredit skoring **KATM** (Kredit Axborot-Tahlil Markazi yoki tegishli moliyaviy tashkilot) orqali amalga oshiriladi — bu **tashqi API integratsiyasi**
- Shartnoma shartlari (masalan aniq foiz stavkasi, muddat) skoring natijasiga qarab belgilanadi — bu jarayon aniq ofisda yakunlanadi
- To'lov usuli (annuitet/differensial) va yakuniy shartnoma tafsilotlari ham ofisda aniqlanadi — Telegram/AI orqali emas

### 3.6 Shartnoma imzolash — elektron imzo kerak emas
BeeGroup — o'zining investitsiya kompaniyasi bo'lib, rahbariyat o'z mablag'i bilan ishlaydi. Shuning uchun elektron imzo tizimi (E-IMZO) **kerak emas** — jarayonning yakuniy bosqichi har doim **mijozni ofisga taklif qilish** orqali yakunlanadi.

---

## 4. AI TILI VA USLUBI — ALOHIDA MUHIM TALAB

AI (ham chatda, ham qo'ng'iroqda ishlatiladigan ovozli/matnli javoblarda) quyidagilarni bajara olishi shart:

- **Haqiqiy Toshkent shevasida** tabiiy gaplasha olishi (masalan "yaxshimisiz", "bo'p qoladi", "keling" kabi so'zlashuv uslubidagi iboralar — rasmiy adabiy til emas, jonli, tabiiy muloqot uslubi)
- **Rus tilida** ham erkin, tabiiy gaplasha olishi (agar mijoz ruscha yozsa/gapirsa)
- Bu talab `operator_profile`dagi `tone`, `language`, `vocabulary` maydonlari orqali sozlanadi (1-qism, 3.3-bo'lim) — lekin BeeGroup uchun **standart holat** Toshkent shevasi + rus tili bo'lishi kerak, operator buni keyin o'ziga moslab sozlashi mumkin
- **Sifat nazorati:** AI coding assistant bu qismni tugatgach, bir nechta haqiqiy Toshkent shevasidagi va ruscha xabarlar bilan sinab ko'rishi, javoblar sun'iy/kitobiy eshitilmasligini tekshirishi kerak (0-qism qoidasiga muvofiq — bu ham "demo sifat"ning bir turi, oldini olish kerak)

---

## 5. MA'LUMOTLAR BAZASI (yakuniy)

```
vehicle_inventory
├── id
├── company_id
├── model (enum: yuan_up / changan / cobalt)
├── price
├── image_url
├── status (available / reserved / sold)

credit_applications
├── id
├── customer_id (FK)
├── vehicle_id (FK)
├── payment_type (fin_arenda / nasiya / naqd)
├── down_payment_percent (fin_arenda → min 20, nasiya → min 50)
├── down_payment_amount
├── loan_term_years (2-5 oralig'ida)
├── ownership_type (company_name_until_paid / customer_name_immediately)
├── passport_data (JSON — OCR orqali)
├── scoring_status (pending / passed / failed) — KATM natijasi
├── contract_finalized_at_office (bool)
├── status (pending / under_review / approved / rejected)
├── created_at, updated_at
```

> Eslatma: `guarantor_info` maydoni olib tashlandi — BeeGroup'da kafil talab qilinmaydi. Aniq oylik to'lov grafigi jadvali (`loan_payment_schedule`) bu bosqichda **ofis tomonidan tashqarida** tuzilgani uchun, agar kelajakda ofis tizimini ham shu platformaga ulash kerak bo'lsa, alohida modul sifatida ko'rib chiqiladi — hozircha bu masala platforma doirasidan tashqarida.

---

## 6. KERAKLI TASHQI INTEGRATSIYALAR

| Integratsiya | Nima uchun | Holat |
|---|---|---|
| KATM (yoki tegishli kredit skoring tashkiloti) API | Mijozning kredit skoringini tekshirish | Tashqi integratsiya — rasmiy hujjatlar asosida ulanadi |
| OCR/MRZ Reader | Pasport ma'lumotlarini o'qish | MySafar bilan bir xil kutubxona |
| Telefon raqamdan Telegram qidirish servisi | Avtomatik mijoz topish | 1a-qismdagi mexanizmga tayanadi |
| Speech-to-Text (o'zbek Toshkent shevasi + rus tili) | Qo'ng'iroqni tinglash va intent aniqlash | Til modeli ikkala tilni ham sifatli tanishi shart |
| Claude/GPT API | Suhbat, intent aniqlash, javob generatsiyasi | System prompt Toshkent shevasi/rus tiliga moslashtirilgan bo'lishi kerak |
| Payme va Click | Boshlang'ich to'lov (agar Telegram orqali to'lov olinadigan bo'lsa) | ⚠️ Boshlang'ich to'lovni ham Telegram orqali to'lash mumkinmi, yoki bu ham ofisda amalga oshadimi — bu bitta ochiq savol qolyapti, aniqlashtirsang darhol yangilayman |

---

## 7. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ

> 1. `vehicle_inventory` (3 ta model bilan — Yuan Up, Changan, Cobalt) va `credit_applications` jadvallari uchun migration yoz
> 2. `calculate_down_payment` deterministik funksiyasini yoz (3.2-bo'lim)
> 3. Qo'ng'iroq/Telegram state machine'ini 1-bo'limga muvofiq qur
> 4. Telefon raqam kiritilib Enter bosilganda avtomatik Telegram qidirish logikasini qur — topilmasa operatorga bildirishnoma (`notifications` jadvali orqali)
> 5. Qo'ng'iroqni tinglash/tahlil qilish orqali "lokatsiya yuborish" va "avtomobil ma'lumotini yuborish" intentlarini aniqlaydigan va avtomatik bajaradigan servisni qur (2-bo'lim)
> 6. Oylik to'lov so'ralganda 3.3-bo'limdagi bosqichma-bosqich mantiqni qat'iy bajaradigan javob logikasini qur — **hech qachon aniq grafik operator tasdig'isiz yuborilmasin**
> 7. System promptni Toshkent shevasi + rus tiliga moslashtirilgan holda yoz, va sinov xabarlar bilan sifatni tekshir (4-bo'lim)
> 8. KATM (yoki tegishli tashkilot) skoring integratsiyasini qur
> 9. Ofisga taklif qilish oqimini (elektron imzo o'rniga) UI/AI javoblarida izchil qil

**Ochiq qolgan bitta savol:** boshlang'ich to'lovni ham Telegram orqali (Payme/Click) to'lash mumkinmi, yoki bu ham albatta ofisda amalga oshadimi? Shu aniqlansa, fayl to'liq yakunlangan hisoblanadi.
