# نشر على VPS جديد — modernitygate.com

السيرفر: `187.77.88.174`  
الدومين: `https://modernitygate.com`

---

## 1) إعداد DNS (قبل شهادة SSL)

في لوحة تحكم الدومين أضف:

| النوع | الاسم | القيمة |
|-------|--------|--------|
| A | `@` | `187.77.88.174` |
| A | `www` | `187.77.88.174` |

انتظر 5–30 دقيقة حتى يعمل الدومين.

---

## الحل النهائي (سيرفر Hostinger + Traefik)

```bash
cd /opt/modernity-gate
git pull
sudo sh scripts/finalize-vps.sh
```

يفعل كل شيء: التطبيق + Traefik + التوجيه + SSL.

إذا فشل HTTPS: في Hostinger أوقف CDN واجعل A record يشير لـ IP السيرفر (`curl -4 ifconfig.me`).

---

## Traefik موجود على السيرفر (Hostinger وغيره)

إذا ظهر `traefik-traefik-1` أو المسار `/docker/traefik` — **استخدم Traefik** (لديه Let's Encrypt مدمج).

```bash
cd /opt/modernity-gate
git pull
sudo sh scripts/start-traefik-stack.sh
```

هذا يوقف nginx، يشغّل Traefik من `/docker/traefik`، ويوجّه الدومين للتطبيق على `:9000`.

**لا تستخدم certbot/nginx** إذا الدومين يمر عبر CDN Hostinger (`server: hcdn`) — HTTP challenge يفشل.

### فشل certbot مع IP مختلف (مثل 2.57.91.91)

الدومين يشير إلى CDN وليس السيرفر مباشرة. في لوحة Hostinger:
1. أوقف CDN/Proxy للدومين
2. A record → IP السيرفر (`curl -4 ifconfig.me`)
3. انتظر 5–15 دقيقة ثم `sudo sh scripts/preflight-dns.sh`

أو استمر مع Traefik: `sudo sh scripts/start-traefik-stack.sh`

```bash
cd /opt/modernity-gate
git pull
sudo sh scripts/resume-setup-traefik.sh
```

إذا ظهر `address already in use` على المنفذ 9000:

```bash
sudo sh scripts/fix-port-9000.sh
sudo sh scripts/resume-setup-traefik.sh
```

أو يدويًا:

```bash
sudo ss -tlnp | grep ':9000'
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker stop modernity-gate 2>/dev/null; docker rm modernity-gate 2>/dev/null
```

بريد certbot يجب أن يكون إيميل حقيقي (ليس `بريدك@example.com`):

```bash
sudo CERTBOT_EMAIL=you@gmail.com sh scripts/issue-ssl.sh
```

(فقط إذا أوقفت Traefik واستخدمت nginx)

---

## استكمال إعداد متوقف (منفذ 80 مشغول — nginx)

إذا توقف `setup-new-vps.sh` عند nginx:

```bash
cd /opt/modernity-gate
git pull
sudo sh scripts/resume-setup.sh
```

أو يدوياً:

```bash
sudo sh scripts/fix-nginx-port.sh   # يحرر المنفذ 80 ويشغّل nginx
./scripts/deploy-vps.sh             # يبني ويشغّل التطبيق
```

لمعرفة من يستخدم المنفذ 80:

```bash
sudo ss -tlnp | grep ':80 '
```

---

## 2) أول مرة على السيرفر

اتصل بالسيرفر:

```bash
ssh root@187.77.88.174
```

ثم نفّذ:

```bash
git clone https://github.com/bashirmohammedatiwi-ops/ali-application-101.git /opt/modernity-gate
cd /opt/modernity-gate
chmod +x scripts/*.sh
sudo sh scripts/setup-new-vps.sh
```

هذا السكربت يثبّت: Docker، Nginx، Certbot، الجدار الناري، ويشغّل التطبيق على HTTP.

---

## 3) شهادة SSL (Let's Encrypt)

بعد أن يعمل الدومين على HTTP:

```bash
cd /opt/modernity-gate
sudo sh scripts/issue-ssl.sh
```

بعدها الموقع يعمل على: **https://modernitygate.com**

تجديد تلقائي عبر `certbot.timer`.

---

## 4) إعدادات الإنتاج

```bash
nano /opt/modernity-gate/.env.production
```

تأكد من:

```env
AUTH_SECRET=<مفتاح عشوائي — يُنشأ تلقائياً في setup>
NEXTAUTH_URL=https://modernitygate.com
SHOW_DEMO_ACCOUNTS=false
SEED_ON_START=false
```

بعد أول تشغيل ناجح، عطّل `SEED_ON_START` وأعد النشر:

```bash
./scripts/deploy-vps.sh
```

---

## 5) تحديثات لاحقة

**من السيرفر:**

```bash
cd /opt/modernity-gate
git pull
./scripts/deploy-vps.sh
```

**من جهازك (Mac):**

```bash
cd ali-project
chmod +x scripts/push-and-deploy.sh
VPS_HOST=187.77.88.174 VPS_USER=root ./scripts/push-and-deploy.sh
```

---

## غير آمن (Not Secure) في المتصفح؟

Traefik يحتاج Let's Encrypt. على السيرفر:

```bash
cd /opt/modernity-gate
git pull
sudo sh scripts/fix-ssl-traefik.sh
```

تأكد في Hostinger:
- A record فقط → `187.77.88.174` (احذف `2.57.91.91`)
- CDN مغلق
- افتح **https://**modernitygate.com (ليس http)

---

## 404 بعد النشر؟

من الآن `./scripts/deploy-vps.sh` يتحقق تلقائياً من المسار و**يفشل النشر** إذا بقي 404، ويحاول إصلاحه ذاتياً.

إذا ظهر 404 يدوياً:

```bash
cd /opt/modernity-gate
git pull
sudo sh scripts/verify-routing.sh
```

أو إعداد كامل:

```bash
sudo sh scripts/finalize-vps.sh
```

تحقق:

```bash
curl -I http://127.0.0.1:9000/login
curl -skI https://modernitygate.com/login
docker inspect modernity-gate --format '{{json .Config.Labels}}' | tr ',' '\n' | grep traefik
```

---

## 6) أوامر مفيدة

```bash
# سجلات التطبيق
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f app

# حالة الحاويات
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# تنظيف مساحة Docker
./scripts/cleanup-docker.sh aggressive

# اختبار تجديد SSL
sudo certbot renew --dry-run

# إعادة تحميل Nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## 7) حسابات تجريبية (إن فعّلت SEED)

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مدخل الطلبات | taker@modernitygate.com | 123456 |
| مسعّر | pricer@modernitygate.com | 123456 |
| مدير | manager@modernitygate.com | 123456 |

---

## 8) الأمان

- التطبيق يستمع على `127.0.0.1:9000` فقط (غير مكشوف للإنترنت)
- Nginx يتولى HTTPS مع HSTS
- الجدار الناري: المنافذ 22، 80، 443 فقط
- غيّر كلمات مرور SSH واستخدم مفتاح SSH بدل كلمة المرور
