# RanKageShop — Production Deploy Guide

VPS (Ubuntu 22.04/24.04) + Nginx + PM2 + PostgreSQL အတွက် step-by-step လမ်းညွှန်ပါ။

**Domain setup (code ထဲမှာ သတ်မှတ်ထားပြီး):**
- Frontend: `https://rankage.shop` (နဲ့ `www.rankage.shop`)
- API: `https://api.rankage.shop`

---

## 1. လိုအပ်ချက်များ

| အရာ | မှတ်ချက် |
|-----|----------|
| VPS | 1 vCPU, 2GB RAM လုံလောက် (Ubuntu 22.04+) |
| Node.js | v20 LTS |
| PostgreSQL | **VPS ပေါ်တိုင်** (localhost:5432) |
| Domain DNS | A record များ server IP ကို ညွှန်ပါ |

**DNS records:**
```
rankage.shop       → A → YOUR_SERVER_IP
www.rankage.shop   → A → YOUR_SERVER_IP   (သို့မဟုတ် CNAME → rankage.shop)
api.rankage.shop   → A → YOUR_SERVER_IP
```

---

## 2. Server ကို ပြင်ဆင်ခြင်း

SSH ဖြင့် server ဝင်ပြီး:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (process manager)
sudo npm install -g pm2

# PostgreSQL — VPS ပေါ်တိုင် (localhost သာ)
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### PostgreSQL database + user ဖန်တီးခြင်း

```bash
sudo -u postgres psql
```

```sql
CREATE USER rankage WITH PASSWORD 'YOUR_STRONG_DB_PASSWORD';
CREATE DATABASE rankageshop OWNER rankage;
GRANT ALL PRIVILEGES ON DATABASE rankageshop TO rankage;
\c rankageshop
GRANT ALL ON SCHEMA public TO rankage;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rankage;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rankage;
\q
```

**စစ်ဆေးခြင်း:**
```bash
psql "postgresql://rankage:YOUR_STRONG_DB_PASSWORD@localhost:5432/rankageshop" -c "SELECT 1;"
```

**လုံခြုံရေး:** PostgreSQL က `localhost` မှာပဲ listen လုပ်ပါ (`/etc/postgresql/*/main/postgresql.conf` → `listen_addresses = 'localhost'`). ပြင်ပက port 5432 ကို firewall မဖွင့်ပါနဲ့။

---

## 3. Code ကို server ပေါ်တင်ခြင်း

```bash
sudo mkdir -p /var/www/rankageshop
sudo chown $USER:$USER /var/www/rankageshop
cd /var/www/rankageshop

# Git ဖြင့် (အကြံပြု)
git clone https://github.com/changyi12345/rankageshop.git .
# သို့မဟုတ် local က zip/scp ဖြင့် upload လုပ်ပါ
```

---

## 4. Backend setup

```bash
cd /var/www/rankageshop/backend

# Production dependencies
npm ci --omit=dev

# .env ဖန်တီးပါ
cp .env.example .env
nano .env
```

### `backend/.env` (production ဥပမာ)

```env
NODE_ENV=production
PORT=4000

# VPS local PostgreSQL — DATABASE_URL နဲ့ DIRECT_URL တူတူ ထားပါ (pooler မလို)
DATABASE_URL=postgresql://rankage:YOUR_STRONG_DB_PASSWORD@localhost:5432/rankageshop
DIRECT_URL=postgresql://rankage:YOUR_STRONG_DB_PASSWORD@localhost:5432/rankageshop

JWT_SECRET=PASTE_A_LONG_RANDOM_STRING_AT_LEAST_32_CHARS
APP_BASE_URL=https://rankage.shop
CORS_ORIGINS=https://rankage.shop,https://www.rankage.shop

G2BULK_API_KEY=your-g2bulk-api-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Email — cPanel Secure SSL/TLS (rankage.shop hosting)
SMTP_HOST=rankage.shop
SMTP_PORT=465
SMTP_USER=support@rankage.shop
SMTP_PASS=your-mailbox-password
SMTP_FROM=RanKageShop <support@rankage.shop>

# Web Push (optional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@rankage.shop
```

**JWT_SECRET ထုတ်ယူ:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### Database schema + seed

**အသစ် database (အကြံပြု):**
```bash
cd /var/www/rankageshop/backend
npx prisma db push
npx prisma generate
npm run build
npm run db:seed
```

**Incremental migrations** (အဟောင်း DB ရှိပြီး update လုပ်မယ်ဆိုရင် — အစဉ်လိုက် run):
```bash
npx prisma db execute --file prisma/migrations/20250625230000_google_oauth/migration.sql
npx prisma db execute --file prisma/migrations/20250702120000_g2bulk_price_monitoring/migration.sql
npx prisma db execute --file prisma/migrations/20250702140000_user_notifications/migration.sql
npx prisma db execute --file prisma/migrations/20250702150000_live_chat/migration.sql
npx prisma db execute --file prisma/migrations/20250702160000_refresh_tokens/migration.sql
npx prisma generate
npm run build
```

### Uploads folder (payment screenshots)

```bash
mkdir -p /var/www/rankageshop/backend/uploads
chmod 755 /var/www/rankageshop/backend/uploads
```

### PM2 ဖြင့် backend စတင်ခြင်း

```bash
cd /var/www/rankageshop/backend
pm2 start dist/src/main.js --name rankage-api
pm2 save
pm2 startup   # boot အလိုအလျောက် start
```

**စစ်ဆေးခြင်း:**
```bash
curl http://127.0.0.1:4000/api/health
# သို့မဟုတ် app service endpoint
pm2 logs rankage-api
```

---

## 5. Frontend build

```bash
cd /var/www/rankageshop/frontend
npm ci
npm run build
```

Build output: `frontend/dist/`

**မှတ်ချက်:** Production မှာ API က `https://api.rankage.shop` သို့ သွားပါတယ် (`frontend/src/config/apiOrigin.js`)။ Domain မတူရင် build မတိုင်ခင် ထို file ကို ပြင်ပါ။

```bash
# dist ကို web root သို့
sudo mkdir -p /var/www/rankageshop-web
sudo cp -r dist/* /var/www/rankageshop-web/
sudo chown -R www-data:www-data /var/www/rankageshop-web
```

---

## 6. Nginx configuration

Config files က `deploy/nginx/` ထဲမှာ ပါပြီး — server ပေါ်သို့ copy လုပ်ပါ:

```bash
sudo cp /var/www/rankageshop/deploy/nginx/rankage.shop.conf /etc/nginx/sites-available/
sudo cp /var/www/rankageshop/deploy/nginx/api.rankage.shop.conf /etc/nginx/sites-available/
sudo cp /var/www/rankageshop/deploy/nginx/rate-limit-zones.conf /etc/nginx/conf.d/rankage-rate-limit-zones.conf
```

`/etc/nginx/nginx.conf` ထဲ `http { }` block မှာ တစ်ကြိမ်သာ ထည့်ပါ:

```nginx
include /etc/nginx/conf.d/rankage-rate-limit-zones.conf;
```

```bash
sudo ln -sf /etc/nginx/sites-available/rankage.shop.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.rankage.shop.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d rankage.shop -d www.rankage.shop -d api.rankage.shop
```

Auto-renew စစ်ဆေးခြင်း:
```bash
sudo certbot renew --dry-run
```

---

## 7. Deploy ပြီးနောက် စစ်ဆေးစရာ

- [ ] `https://rankage.shop` — homepage ဖွင့်ရမယ်
- [ ] `https://api.rankage.shop/api/...` — API response ရမယ်
- [ ] Register / Login အလုပ်လုပ်ရမယ်
- [ ] Admin login: `/admin/login` (seed: `admin` / `admin123` — **ချက်ချင်း password ပြောင်းပါ**)
- [ ] Admin → Settings → Features → Live chat ON
- [ ] Wallet top-up screenshot upload အလုပ်လုပ်ရမယ်
- [ ] Live chat: user message → admin `/admin/live-chat` မှာ မြင်ရမယ်

### Admin password ပြောင်းခြင်း

1. Admin panel → Users သို့မဟုတ်
2. DB မှတိုက်ရိုက်:
```bash
cd /var/www/rankageshop/backend
node -e "
const bcrypt=require('bcrypt');
bcrypt.hash('NEW_STRONG_PASSWORD',10).then(h=>console.log(h));
"
# output hash ကို postgres မှာ users table UPDATE
```

---

## 8. Update / Redeploy (နောက်ပိုင်း code ပြင်တိုင်း)

```bash
cd /var/www/rankageshop
git pull   # သို့မဟုတ် code အသစ် upload

# Backend
cd backend
npm ci --omit=dev
# migration အသစ်ရှိရင် prisma db execute / db push
npx prisma generate
npm run build
pm2 restart rankage-api

# Frontend
cd ../frontend
npm ci
npm run build
sudo cp -r dist/* /var/www/rankageshop-web/
```

---

## 9. Troubleshooting

| ပြဿနာ | ဖြေရှင်းနည်း |
|--------|-------------|
| CORS error | `CORS_ORIGINS` မှာ frontend domain ပါမပါ စစ် |
| 502 Bad Gateway | `pm2 status` — backend run နေမနေ |
| API 401 | JWT_SECRET ပြောင်းပြီး users re-login လုပ်ရမယ် |
| Uploads ပျောက်သွား | `backend/uploads` ကို redeploy မဖျက်အောင် backup ထား |
| DB connection fail | `psql` connection test / password / `GRANT ON SCHEMA public` (PG 15+) |
| Google login မရ | `GOOGLE_CLIENT_ID` + Google Console authorized origins (`https://rankage.shop`, `https://www.rankage.shop`); Nginx `Cross-Origin-Opener-Policy: same-origin-allow-popups` |
| Google COOP / postMessage warning | `deploy/nginx/rankage.shop.conf` ထဲ COOP header ပါပြီး — nginx reload + frontend rebuild |
| SMTP from VPS | cPanel `rankage.shop:465` က ပြင်ပ VPS ကနေ မရ — Brevo/SendGrid relay သုံး |

**Logs:**
```bash
pm2 logs rankage-api
sudo tail -f /var/log/nginx/error.log
```

---

## 10. Architecture diagram

```
Browser
   │
   ├─ https://rankage.shop ──────► Nginx ──► /var/www/rankageshop-web (static)
   │
   └─ https://api.rankage.shop ──► Nginx ──► PM2 :4000 (NestJS)
                                              │
                                              ├─ PostgreSQL
                                              └─ /backend/uploads/
```

---

## Quick reference

| Service | Path / Port |
|---------|-------------|
| Backend source | `/var/www/rankageshop/backend` |
| Frontend static | `/var/www/rankageshop-web` |
| API process | PM2 `rankage-api` → port `4000` |
| Uploads | `/var/www/rankageshop/backend/uploads` |
