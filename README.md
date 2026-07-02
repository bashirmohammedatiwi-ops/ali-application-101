# بوابة الحداثة — Modernity Gate

نظام ويب متكامل لإدارة طلبات الاستيراد من الصين.

## الميزات

- **3 أدوار:** مدخل الطلبات · مسعّر (صين) · مدير
- **4 مراحل:** استلام → تسعير → تم التسعير → أرشيف
- **كل منتج = طلب مستقل + فاتورة مستقلة**
- **ترجمة تلقائية** AR → EN (مع دعم Google Translate API)
- **فواتير PDF** مع شعار الشركة
- **فتح واتساب مباشرة** + نسخ رسالة جاهزة
- **صفحة الزبائن** مع سجل الطلبات الكامل
- **تعديل الطلبات** في مرحلة الاستلام
- **Kanban للمدير** — نظرة عامة على جميع المراحل
- **تنبيهات** للطلبات المتأخرة والفواتير الجاهزة
- **تصميم Mobile First** + PWA
- **تصدير الأرشيف** CSV/Excel
- **إرسال جماعي للتسعير** لكل الطلبات في مرحلة الاستلام
- **مواصفات المنتج** (لون، مقاس، موديل)
- **مصدر الطلب** (واتساب / مكالمة / زيارة)
- **تعديل بيانات الزبون**
- **تعطيل/تفعيل المستخدمين** (مدير)
- **PWA** مع Service Worker
- **Docker** جاهز للنشر

## التشغيل

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## حسابات تجريبية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدخل الطلبات | taker@modernitygate.com | 123456 |
| مسعّر | pricer@modernitygate.com | 123456 |
| مدير | manager@modernitygate.com | 123456 |

## التقنيات

- Next.js 16 + TypeScript
- Prisma 7 + SQLite
- NextAuth.js v5
- Tailwind CSS v4
- @react-pdf/renderer

## متغيرات البيئة

```env
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_TRANSLATE_API_KEY=""  # اختياري
```

## الهوية البصرية

- Primary: `#3C3C3B`
- Accent: `#E85C24`
- الشعار: `public/logo.png`

## سير العمل

1. **مدخل الطلبات:** إدخال زبون + منتجات + صور → إرسال للتسعير
2. **المسعّر:** تسعير بالإنجليزية (سعر، وزن، cbm، MOQ)
3. **تم التسعير:** PDF + رسالة واتساب → إبلاغ الزبون → أرشفة
4. **الأرشيف:** بحث + إعادة إرسال + (مدير) رجوع المراحل

## الإنتاج

راجع **[DEPLOY-VPS.md](./DEPLOY-VPS.md)** لنشر على VPS مع الدومين وشهادة SSL.

```bash
npm run build
npm start
```

للإنتاج يُفضّل PostgreSQL + VPS accessible from China.
