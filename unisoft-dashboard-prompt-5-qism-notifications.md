# Notifications Tizimi — To'liq Texnik Prompt (5-qism / 10)

> Bu hujjat 1-4-qismlarda qurilgan platformaga ustama. `unisoft-dashboard-prompt-0-umumiy-qoidalar.md` qoidalari (real ma'lumot, demo taqiqi) shu qismga ham tegishli.

---

## 1. NOTIFICATION TURLARI

| Tur | Misol | Kimga boradi | Muhimlik darajasi |
|---|---|---|---|
| Yangi xabar | "Yangi mijoz yozdi" | Operator | O'rtacha |
| Vazifa muddati | "15:30 da qo'ng'iroq qilish vaqti keldi" | Operator | Yuqori |
| Harakatsiz lead | "Lead 7 kundan beri harakatsiz" | Operator | O'rtacha |
| Kredit ariza holati | "Ariza tasdiqlandi/rad etildi" (BeeGroup) | Operator | Yuqori |
| To'lov holati | "Mijoz to'lovni amalga oshirdi" (MySafar/BeeGroup) | Operator | Yuqori |
| Tizim ogohlantirishi | "Telegram sessiyasi uzildi" | Operator + Admin | **Kritik** |
| Mijoz Telegram'da topilmadi | 2b-qism, 2.3-bo'lim | Operator | O'rtacha |
| AI insight tayyor | "Haftalik hisobot tayyor" (3-qism) | Company Admin | Past |
| Operator yangi biriktirildi | Yangi hodim qo'shildi | Company Admin | Past |
| Mijoz handoff | "Sizga mijoz o'tkazildi" (4-qism) | Operator | Yuqori |

---

## 2. MA'LUMOTLAR BAZASI (1-qism 3.8-bo'limidan kengaytirilgan)

```
notifications
├── id
├── recipient_id (FK — operator yoki admin)
├── recipient_type (operator / company_admin / super_admin)
├── company_id (FK — isolation uchun)
├── type (enum — 1-bo'limdagi turlar)
├── priority (low / medium / high / critical)
├── title
├── message
├── related_entity_type (customer / lead / task / credit_application / system)
├── related_entity_id (nullable)
├── is_read
├── created_at

notification_preferences
├── id
├── operator_id (FK)
├── notification_type
├── in_app_enabled (bool)
├── email_enabled (bool) — agar kelajakda email integratsiyasi bo'lsa
```

---

## 3. YETKAZISH KANALLARI

- **In-app (asosiy):** WebSocket orqali real-vaqt, qo'ng'iroq belgisi (bell icon) badge bilan
- **Kritik ogohlantirishlar (masalan Telegram session uzilishi):** in-app'dan tashqari, Company Admin/Super Admin'ga **darhol** ko'rinadigan tarzda — masalan admin panelning bosh sahifasida doimiy ko'rinadigan ogohlantirish banneri
- Operator har bir notification turi uchun in-app xohlash-xohlamasligini "Sozlamalar → Bildirishnomalar" bo'limida sozlashi mumkin (2-bo'lim `notification_preferences`), lekin **kritik** darajadagilar o'chirib bo'lmaydi (masalan tizim uzilishi haqidagi ogohlantirish har doim ko'rsatiladi)

---

## 4. UI TALABLARI

- Yuqori panelda qo'ng'iroq belgisi, o'qilmagan sonini ko'rsatuvchi badge
- Bosilganda dropdown/panel ochiladi — so'nggi bildirishnomalar ro'yxati, muhimlik darajasiga qarab rangli belgi (qizil — kritik, sariq — yuqori, kulrang — oddiy)
- Bosilgan bildirishnoma tegishli sahifaga (masalan tegishli chat yoki task) olib o'tadi va avtomatik "o'qilgan" deb belgilanadi
- "Barchasini o'qilgan deb belgilash" tugmasi

---

## 5. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ

> 1. `notifications` va `notification_preferences` jadvallari uchun migration yoz (1-qism asosidagi `notifications`ni kengaytir)
> 2. Har bir hodisa turi uchun (yangi xabar, vazifa muddati, lead harakatsizligi va h.k.) tegishli servis/trigger ichida notification yaratish logikasini qo'sh — bu alohida modul emas, balki mavjud modullarning (chat, tasks, leads, credit_applications) ichiga integratsiya qilinadi
> 3. WebSocket orqali real-vaqt yetkazishni qur
> 4. Bell icon + dropdown UI'ni qur, badge son bilan
> 5. Kritik darajadagi tizim ogohlantirishlari uchun (masalan Telegram session uzilishi — 1a-qism 3-bo'lim `healthCheck()`) admin panelda doimiy ko'rinadigan banner qo'sh
> 6. Notification preferences sozlamalarini qur, lekin kritik turlarni o'chirib bo'lmaydigan qil
