# AI Assistant — Butun Tizimni Biladigan Ichki Chatbot (1b-qism)

> ⚠️ Bu — operatorning shaxsiy AI yordamchisi (1-qism 6.4-bo'limda qisqacha tilga olingan "AI Chatbot"). Bu hujjat uni **butun ilovaning "asab tizimi"** darajasiga ko'taradi — ya'ni AI har qanday bo'limdagi (chatlar, statistika, leadlar, sotuvlar) real ma'lumotga so'rov orqali kira oladi va tabiiy tilda javob beradi. `unisoft-dashboard-prompt-0-umumiy-qoidalar.md` qoidasi shu yerda ayniqsa muhim: **hech qanday javob o'ylab topilmasin, hammasi real DB so'rovidan kelsin**.

---

## 1. MAQSAD

Operator (yoki admin) AI Assistant'ga erkin tilda savol beradi, masalan:

- *"Bugun nechta chat bo'ldi?"*
- *"O'tgan oy nechta bilet sotildi?"*
- *"Bu oy nechta odamga BeeGroup bo'yicha qo'ng'iroq qildik va nechtasi mashina sotib oldi?"*
- *"7-avgust kuni nechta mijozga qo'ng'iroq qilgandim?"*
- *"Hozir mening zaif tarafim qayerda?"*

AI bu savollarni **tabiiy tilda tushunib**, tegishli DB so'rovlarini bajarib, **real raqamlar bilan** javob berishi kerak — xuddi ilovaning barcha bo'limlarini "o'z tanasining a'zolari" kabi bilgan holda.

---

## 2. ARXITEKTURA — TOOL REGISTRY ASOSIDA

To'g'ridan-to'g'ri LLM'ga "hamma DB'ni bilasan" deb ishonib bo'lmaydi — bu hallucination xavfini oshiradi. Shuning uchun **Tool Registry** yondashuvi ishlatiladi (ChatGPT promptida 15-bo'limda tilga olingan konsepsiyaning kengaytirilgan, amaliy versiyasi):

```
Operator savoli (tabiiy til)
        ↓
LLM — savolni tahlil qiladi, qaysi tool(lar) kerakligini aniqlaydi
        ↓
Tool Registry — ro'yxatdan mos funksiya(lar) chaqiriladi (real DB so'rovi)
        ↓
Tool natijasi (real raqamlar, JSON) — LLM'ga qaytariladi
        ↓
LLM — natijani tabiiy tilda, tushunarli javobga aylantiradi
```

### 2.1 Asosiy tool'lar ro'yxati (namuna)

| Tool nomi | Parametrlar | Nima qaytaradi |
|---|---|---|
| `get_chat_count` | company_id, operator_id?, date_from, date_to | Berilgan davrda chatlar soni |
| `get_call_count` | company_id, operator_id?, date_from, date_to | Qo'ng'iroqlar soni |
| `get_sales_stats` | company_id, product_type (bilet/kredit/lizing), date_from, date_to | Sotilgan mahsulot soni, summasi |
| `get_lead_conversion` | company_id, operator_id?, date_from, date_to | Nechta lead chaqirildi, nechtasi "yopildi" (sotib oldi), konversiya % |
| `get_operator_performance` | operator_id, date_from, date_to | Operatorning barcha KPI'lari (3-qism statistikasidan) |
| `get_operator_weak_points` | operator_id, date_from, date_to | AI tahlili: qaysi ko'rsatkich o'rtachadan past, sabab bilan |
| `get_daily_breakdown` | company_id, specific_date | Bitta kun uchun batafsil statistika (masalan "7-avgust") |
| `search_customer` | company_id, query | Mijoz qidirish |
| `get_customer_history` | customer_id | Mijoz bilan to'liq muloqot tarixi |

Har bir tool — 1-qism 15-bo'limidagi tuzilmaga amal qiladi: `name`, `description`, `input_schema`, `permission`, `company_scope`, `execution_handler`. Bu tool'lar **haqiqiy SQL so'rovlarni** (yoki ORM chaqiruvlarini) bajaradi — 3-qismdagi `daily_operator_stats`/`daily_company_stats` jamlanma jadvallaridan, yoki kerak bo'lsa asosiy jadvallardan to'g'ridan-to'g'ri.

### 2.2 `get_operator_weak_points` — qanday ishlaydi

Bu tool AI orqali quyidagi tahlilni qiladi (real ma'lumotlar asosida, taxmin emas):
- Operatorning KPI'larini (javob tezligi, konversiya, AI maslahatni qabul qilish darajasi) kompaniya o'rtachasi bilan solishtiradi
- Eng ko'p pastda qolgan 1-2 ko'rsatkichni aniqlaydi
- Sababini (agar aniqlansa — masalan "javob tezligi past, chunki soat 14:00-16:00 oralig'ida ko'p chat kutib qolgan") tushuntiradi
- Natija — `operator_profile.learned_preferences` bilan bog'liq holda, konstruktiv maslahat beriladi, ayblov ohangida emas

---

## 3. RUXSAT DARAJALARI (SCOPE)

- **Operator** AI Assistant'ga savol bersa — faqat **o'ziga** va **o'z kompaniyasining umumiy (agregat) ko'rsatkichlariga** oid javob oladi. Boshqa operatorlarning shaxsiy statistikasiga (masalan "Aziz qancha sotdi?") kirish **berilmaydi** — bu 3-qism 3-bo'limidagi qoidaga mos.
- **Company Admin** — o'z kompaniyasi doirasida barcha operatorlar bo'yicha savol bera oladi.
- **Super Admin** — barcha kompaniyalar bo'yicha savol bera oladi.
- Har bir tool chaqiruvida `requester_role` va `requester_company_id` tekshiriladi — 1-qism 12-bo'limidagi Company Isolation qoidasi shu yerda ham **majburiy**.

---

## 4. SUHBAT TARIXINI SAQLASH (ChatGPT-uslub)

Operator AI Assistant'dan chiqib, qayta kirganda suhbat **yo'qolmasligi** kerak — ChatGPT/Claude interfeysiga o'xshab:

### 4.1 Ma'lumotlar bazasi

```
ai_chatbot_conversations
├── id
├── operator_id (FK)
├── title (avtomatik generatsiya qilinadi — birinchi savoldan qisqacha nom)
├── created_at
├── updated_at
├── is_deleted (soft delete)

ai_chatbot_messages
├── id
├── conversation_id (FK)
├── role (user / assistant)
├── content
├── tool_calls (JSON — qaysi tool'lar chaqirilgani, audit uchun)
├── created_at
```

### 4.2 UI talablari

- Chap tomonda (yoki alohida panel) — oldingi suhbatlar ro'yxati, sarlavhalari bilan
- **"Yangi chat"** tugmasi — yangi bo'sh suhbat boshlaydi
- Har bir suhbatni **o'chirish** imkoniyati (soft delete — `is_deleted = true`, darhol butunlay o'chirilmaydi, keyinchalik audit uchun kerak bo'lishi mumkin)
- Eski suhbatga bosilsa — to'liq tarix yuklanadi, operator davom ettira oladi (yangi savol shu `conversation_id` ostida davom etadi)
- Suhbat sarlavhasi (title) — birinchi foydalanuvchi xabaridan AI orqali avtomatik qisqa nom generatsiya qilinadi (masalan "BeeGroup avgust statistikasi")

---

## 5. AI CODING ASSISTANT UCHUN ANIQ TOPSHIRIQ

> 1. `ai_chatbot_conversations` va `ai_chatbot_messages` jadvallari uchun migration yoz
> 2. Tool Registry servisini qur — 2.1-bo'limdagi tool'larning har birini alohida funksiya sifatida yoz, real DB so'rovlari bilan (3-qismdagi aggregatsiya jadvallaridan foydalanib, tezlik uchun)
> 3. Har bir tool uchun `permission` va `company_scope` tekshiruvini majburiy qil — 3-bo'limdagi ruxsat qoidalariga muvofiq
> 4. LLM orkestratsiya qatlamini qur: savolni tool chaqiruviga aylantirish, natijani tabiiy javobga aylantirish (Claude/GPT'ning tool-use/function-calling imkoniyatidan foydalanib)
> 5. `get_operator_weak_points` tool'ini alohida ehtiyotkorlik bilan yoz — faqat real KPI solishtiruviga asoslangan, konstruktiv ohangda javob generatsiya qiluvchi system prompt bilan
> 6. Suhbat tarixi UI'sini qur — chat ro'yxati, yangi chat, o'chirish, davom ettirish (4.2-bo'lim)
> 7. Har bir tool chaqiruvini `ai_chatbot_messages.tool_calls` maydoniga log qil — keyinchalik audit va debug uchun
>
> 0-qism checklist bo'yicha tekshir: hech qanday raqam o'ylab topilmagan, hammasi real tool chaqiruvidan kelgan bo'lishi shart.
