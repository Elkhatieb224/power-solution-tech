# لوحة التحكم ورفع المشاريع

## المحتوى

- **الموقع (واجهة):** GitHub Pages — `index.html` و `projects.html`
- **الخادم (API):** مجلد `server/` — Express + SQLite + رفع صور
- **لوحة التحكم:** `admin/` — تسجيل دخول وإدارة المشاريع

## التشغيل المحلي

```bash
cd server
cp .env.example .env
# عدّل ADMIN_PASSWORD و JWT_SECRET في .env
npm install
npm run dev
```

- الموقع: http://localhost:3001
- لوحة التحكم: http://localhost:3001/admin/login.html
- بيانات الدخول الافتراضية (من `.env.example`): `admin` / `change-me-strong-password`

## ربط الواجهة بالـ API

عند النشر على GitHub Pages، ضع عنوان الخادم في `index.html` و `projects.html`:

```html
<script>window.PST_API_URL = "https://your-api.onrender.com";</script>
```

اترك القيمة فارغة `""` لاستخدام المشاريع الثابتة فقط (بدون API).

## متغيرات البيئة (`server/.env`)

| المتغير | الوصف |
|---------|--------|
| `PORT` | منفذ الخادم (افتراضي 3001) |
| `JWT_SECRET` | مفتاح سري لجلسات تسجيل الدخول |
| `ADMIN_USERNAME` | اسم مستخدم لوحة التحكم |
| `ADMIN_PASSWORD` | كلمة مرور قوية |
| `ALLOWED_ORIGINS` | عناوين مسموحة لـ CORS (مفصولة بفاصلة)، مثال: `https://shirketak.github.io` |

## النشر على Vercel (موصى به)

1. ثبّت [Vercel CLI](https://vercel.com/cli) وسجّل الدخول: `vercel login`
2. من جذر المشروع: `vercel` ثم `vercel --prod`
3. في لوحة Vercel → **Storage** → أنشئ **Blob Store** واربطه بالمشروع (يضيف `BLOB_READ_WRITE_TOKEN` تلقائياً)
4. أضف متغيرات البيئة في Vercel:
   - `JWT_SECRET` — نص عشوائي طويل
   - `ADMIN_USERNAME` — اسم المستخدم
   - `ADMIN_PASSWORD` — كلمة مرور قوية
5. بعد النشر:
   - الموقع: `https://your-project.vercel.app`
   - لوحة التحكم: `https://your-project.vercel.app/admin/login.html`
   - الـ API على نفس النطاق — لا حاجة لتعيين `PST_API_URL`

> على Vercel تُحفظ المشاريع والصور في **Vercel Blob**. التشغيل المحلي يستخدم SQLite.

## النشر (مثال: Render)

1. ارفع المستودع إلى GitHub
2. أنشئ **Web Service** على Render يشير إلى مجلد `server`
3. Build: `npm install` — Start: `npm start`
4. أضف متغيرات البيئة من `.env.example`
5. فعّل **Persistent Disk** لمجلد `server/data` و `server/uploads` (للاحتفاظ بقاعدة البيانات والصور)
6. ضع رابط الخادم في `PST_API_URL` على GitHub Pages

## API

| الطريقة | المسار | الوصف |
|---------|--------|--------|
| POST | `/api/auth/login` | تسجيل الدخول |
| GET | `/api/projects` | قائمة المشاريع (عام) |
| POST | `/api/projects` | إضافة مشروع + صورة (يتطلب JWT) |
| PUT | `/api/projects/:id` | تعديل مشروع (يتطلب JWT) |
| DELETE | `/api/projects/:id` | حذف مشروع (يتطلب JWT) |

الصور المرفوعة تُحفظ في `server/uploads/` وتُعرض على `/uploads/`.
