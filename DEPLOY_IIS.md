# Jamly — Windows IIS kurulumu (`getjamly.hakanefe.online`)

Bu doküman, Jamly'yi mevcut bir Windows IIS sunucusuna **Supabase bağlı** ve
**şifre korumalı** biçimde kurmak içindir. Vercel gerekmez.

Hedef: `https://getjamly.hakanefe.online` — half-production. Gerçek Supabase
projesi, gerçek veri, ama dışarıya kapalı (HTTP Basic Auth).

---

## 0. Önce mimariyi anla — bu adımı atlama

**IIS Node.js çalıştıramaz.** Next.js ise SSR ve API route'ları için Node
gerektirir. Dolayısıyla kurulum şu şekildedir:

```
Tarayıcı → HTTPS → IIS (getjamly.hakanefe.online)
                    └─ reverse proxy → http://127.0.0.1:3001  (Node: next start)
                                        └─ HTTPS → Supabase (bulut)
```

- IIS **sadece reverse proxy** ve TLS sonlandırıcıdır.
- Node süreci Windows Service olarak çalışır (yeniden başlatmada ayakta kalsın).
- **Supabase IIS'e kurulmaz.** Bulut servisidir; uygulama ona dışarı bağlanır.
  Sunucunun 443 dışa çıkışı açık olmalı.
- `iisnode` **kullanma.** Bakımsız ve modern Node ile sorunlu. Reverse proxy
  doğru yöntemdir.

---

## 1. Gereksinimler

Sunucuda kurulu olmalı:

- **Node.js 24.x** (`package.json` → `engines.node: 24.x`) — `node -v` ile doğrula
- **Git**
- **IIS** + şu iki eklenti:
  - URL Rewrite 2.1 — https://www.iis.net/downloads/microsoft/url-rewrite
  - Application Request Routing 3.0 — https://www.iis.net/downloads/microsoft/application-request-routing
- **NSSM** (Node'u servis yapmak için) — https://nssm.cc/download
- `getjamly.hakanefe.online` için DNS A kaydı sunucunun IP'sine bakmalı

ARR kurulduktan sonra **proxy'yi etkinleştirmeyi unutma**: IIS Manager →
sunucu düğümü → *Application Request Routing Cache* → sağ panel *Server Proxy
Settings* → **Enable proxy** işaretle → Apply. Bu yapılmazsa tüm istekler 404
döner ve sebebi hiç belli olmaz.

---

## 2. Supabase projesini hazırla

Kod ile veritabanı **birlikte gider**. Migration'lar uygulanmadan uygulama
çalışmaz — satın alma, sipariş, waitlist ve admin hepsi hata verir.

1. https://supabase.com üzerinde proje aç. Bölge: `eu-central-1` (Frankfurt),
   Türkiye'ye en düşük gecikmeli seçenek.
2. **Settings → API**'den al:
   - Project URL
   - `anon` / publishable key
   - `service_role` key — **gizli**, sadece sunucu tarafında kullanılır
3. **SQL Editor**'de sırayla çalıştır. Sıra önemlidir.

Sıfırdan proje ise önce:

```
supabase/schema.sql
```

Sonra `supabase/migrations/` içinden bu sırayla:

```
20260629_add_conversations.sql
20260707_add_beat_license_tiers.sql
20260712_unify_account_capabilities.sql
20260715_username_policy.sql
20260731_protect_founder_headline.sql
20260801_ensure_listing_storage.sql
20260809_admin_and_platform_config.sql
20260811_add_collaboration_revenue.sql
20260811_add_collaboration_workspace.sql
20260811_add_profile_follows.sql
20260811_tighten_collaboration_rls.sql
20260813_security_hardening.sql
20260813_rate_limiting.sql
20260813_waitlist.sql
20260813_badges.sql
20260813_admin_rbac_audit.sql
20260813_email_outbox.sql
20260813_payments.sql
20260815_validate_payment_amount.sql
```

Sıra neden önemli: `security_hardening`, `badges` ve `payments`'tan önce
gelmeli — onların kullandığı `payment_status` kolonunu ve
`settle_order_payment()` fonksiyonunu o ekler. `admin_rbac_audit` ise
`email_outbox`'tan önce gelmeli, çünkü onun RLS politikası `admin_has()`
fonksiyonunu çağırır.

Hepsi idempotent; tekrar çalıştırmak güvenlidir.

4. **Authentication → URL Configuration**:
   - Site URL: `https://getjamly.hakanefe.online`
   - Redirect URLs:
     `https://getjamly.hakanefe.online/auth/reset-password`
     `https://getjamly.hakanefe.online/early-access/verify`
5. **Authentication → Providers → Email**: minimum şifre uzunluğunu **8** yap.
   Uygulama tarafında zaten 8, ama sunucu tarafında da geçerli olmalı.
6. **Storage**: `license-deliverables` bucket'ının **public olmadığını** doğrula.

---

## 3. Kodu sunucuya al

```powershell
cd C:\
git clone https://github.com/koraykurt19/JAMLY.git jamly
cd C:\jamly
git checkout feat/iis-deployment
npm ci
```

---

## 4. Ortam değişkenleri

`C:\jamly\.env.local` oluştur. Bu dosya git'e girmez.

```ini
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=https://<proje-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>

# --- Public origin (KRITIK) ---
# Ayarlanmazsa e-posta dogrulama linkleri localhost'a gider.
NEXT_PUBLIC_SITE_URL=https://getjamly.hakanefe.online

# --- Test kapisi (HTTP Basic Auth) ---
# Deger ayrica iletildi. Sadece SHA-256 hash icerir, sifre icermez.
STAGING_AUTH_USERS=<user:hash,user:hash>

# --- Guvenlik ---
RATE_LIMIT_SALT=<uzun rastgele deger>
PAYMENT_WEBHOOK_SECRET=<uzun rastgele deger>

# --- Odeme ---
# Gercek saglayici yok. Sandbox panelini acmak istersen true yap.
PAYMENT_PROVIDER=sandbox
SANDBOX_PAYMENTS_ENABLED=false
```

Rastgele değer üretmek için:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Yeni Basic Auth kullanıcısı üretmek gerekirse:

```powershell
node scripts/generate-staging-credentials.mjs kullanici1 kullanici2
```

Şifreleri bir kez ekrana yazar; `.env.local` dosyasına yalnızca hash satırı girer.

---

## 5. Derle ve Node servisini kur

```powershell
cd C:\jamly
npm run build
```

Build çıktısında `ƒ Proxy (Middleware)` satırı **görünmeli**. Görünmüyorsa
şifre kapısı ve Supabase oturum yenileme çalışmaz — bkz. Bölüm 9.

Servis olarak kaydet. Port 3001 kullanılıyor çünkü 3000'de başka bir uygulama
olabilir:

```powershell
New-Item -ItemType Directory -Force C:\jamly\logs

nssm install JamlyApp "C:\Program Files\nodejs\node.exe" "C:\jamly\node_modules\next\dist\bin\next" "start" "-p" "3001"
nssm set JamlyApp AppDirectory C:\jamly
nssm set JamlyApp AppEnvironmentExtra NODE_ENV=production
nssm set JamlyApp Start SERVICE_AUTO_START
nssm set JamlyApp AppStdout C:\jamly\logs\out.log
nssm set JamlyApp AppStderr C:\jamly\logs\err.log
nssm set JamlyApp AppRotateFiles 1
nssm start JamlyApp
```

Doğrula:

```powershell
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3001/api/health
```

`200` beklenir.

`.env.local` dosyasını Next kendisi okur; NSSM'e ayrıca env girmene gerek yok.
Ancak `NODE_ENV=production` mutlaka set olmalı — rate limiter'ın fail-closed
davranışı buna bağlıdır.

---

## 6. IIS sitesini kur

1. IIS Manager → **Sites** → *Add Website*
   - Site name: `jamly`
   - Physical path: `C:\jamly\iis-root` (boş bir klasör oluştur; IIS dosya
     servis etmeyecek, yalnızca proxy yapacak)
   - Binding: `http`, port `80`, host name `getjamly.hakanefe.online`

2. `serverVariables` kullanabilmek için önce izin ver: IIS Manager → sunucu
   düğümü → **URL Rewrite** → sağ panel *View Server Variables* → *Add* →
   `HTTP_X_FORWARDED_PROTO` ve `HTTP_X_FORWARDED_HOST` ekle. Bu yapılmazsa site
   500 döner.

3. Site kökündeki `web.config` dosyasını şu içerikle oluştur:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- ACME HTTP-01 dogrulamasi IIS'te kalmali, Node'a gitmemeli.
             Bu kural olmazsa challenge istegi ProxyToNode'a takilir, Node 404
             doner ve Let's Encrypt sertifika vermez. -->
        <rule name="AcmeChallenge" stopProcessing="true">
          <match url="^\.well-known/acme-challenge/" />
          <action type="None" />
        </rule>

        <rule name="ForceHttps" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="^OFF$" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}"
                  redirectType="Permanent" />
        </rule>

        <rule name="ProxyToNode" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="http://127.0.0.1:3001/{R:1}" />
          <serverVariables>
            <set name="HTTP_X_FORWARDED_PROTO" value="https" />
            <set name="HTTP_X_FORWARDED_HOST" value="{HTTP_HOST}" />
          </serverVariables>
        </rule>
      </rules>
    </rewrite>

    <security>
      <requestFiltering>
        <requestLimits maxAllowedContentLength="524288000" />
      </requestFiltering>
    </security>

    <httpErrors existingResponse="PassThrough" />
  </system.webServer>
</configuration>
```

`maxAllowedContentLength` 500 MB'dir; lisans teslimat paketlerinin bucket
limiti ile aynı.

Kural sırası **AcmeChallenge → ForceHttps → ProxyToNode** olmalı.
`stopProcessing="true"` sayesinde challenge istekleri diğer iki kurala hiç
uğramaz.

3b. Challenge dosyalarının uzantısı yoktur ve IIS varsayılanda bunları servis
etmez. Site kökünde `.well-known/acme-challenge/web.config` oluştur:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <mimeMap fileExtension=".*" mimeType="text/plain" />
    </staticContent>
  </system.webServer>
</configuration>
```

3c. **`allowedServerVariables` site kapsamında ayarlanamaz.** IIS bu bölümü
tasarım gereği üst seviyede kilitler (`overrideModeDefault="Deny"`), site
seviyesinde denenirse hata verir. Global eklemek zorunludur. Pratikte zararsız:
bu liste yalnızca *izin verir*, hiçbir siteye değişken *set etmez*. Diğer
siteler kendi rewrite kurallarında bu değişkenleri set etmediği sürece
davranışları değişmez.

4. **HTTPS sertifikası** — win-acme ile (https://www.win-acme.com):

```powershell
.\wacs.exe --target manual --host getjamly.hakanefe.online --installation iis --installationsiteid <site-id>
```

Mevcut wildcard sertifikan varsa onu binding'e eklemen yeterli, win-acme
gerekmez.

5. Site → *Bindings* → `https` / 443 / `getjamly.hakanefe.online` / sertifikayı seç.

---

## 7. Doğrulama

### 7.0 Sertifika gününden önce proxy'yi kanıtla

`ForceHttps` tüm HTTP trafiğini yakaladığı için `ProxyToNode` normal şartlarda
hiç çalışmaz — yani `serverVariables` izni hatalı olsa bile 500'ü ancak
sertifika alındıktan sonra görürsün. Bunu önceden test et:

1. IIS Manager → site → URL Rewrite → `ForceHttps` kuralını **geçici olarak
   devre dışı bırak**
2. `curl.exe -s -o NUL -w "%{http_code}" http://getjamly.hakanefe.online/`
3. Sonucu yorumla:
   - **502** → proxy çalışıyor, `serverVariables` izni doğru, sadece Node
     henüz ayakta değil. Beklenen sonuç budur.
   - **500** → `serverVariables` izni eksik. Bölüm 6 madde 2 ve 3c.
   - **404** → ARR proxy açılmamış. Bölüm 1.
4. `ForceHttps` kuralını **hemen geri aç**

ACME kuralını da doğrula: `.well-known/acme-challenge/` altına uzantısız bir
test dosyası bırak, `http://getjamly.hakanefe.online/.well-known/acme-challenge/<dosya>`
adresine git. **200 + `Content-Type: text/plain`** dönmeli. 404 dönerse istek
Node'a gidiyor demektir, kural sırası yanlıştır. Testten sonra dosyayı sil.

### 7.1 Kurulum doğrulaması

| Kontrol | Beklenen |
| --- | --- |
| `curl -I https://getjamly.hakanefe.online/` | **401** + `WWW-Authenticate: Basic` |
| Tarayıcıda aç | Kullanıcı adı/şifre kutusu |
| Yanlış şifre | 401, tekrar sorar |
| Doğru şifre | Ana sayfa açılır |
| `/early-access` | Erken kayıt sayfası |
| `/api/health` | 200 — kapıdan muaf, izleme için |
| Response başlıkları | CSP var, `unsafe-eval` **yok** |

Supabase bağlantısını doğrula:

```powershell
cd C:\jamly
npm run supabase:check
```

Uygulama içinde:

- Hesap oluştur → e-posta doğrulama akışı başlamalı
- `/early-access` formunu doldur → 201 ve sıra numarası
- Aynı e-posta ile tekrar → 200, `alreadyRegistered: true`, sıra değişmez
- 1 saat içinde 6. deneme → 429

---

## 8. Bilinmesi gerekenler

**Ödeme çalışmıyor.** Gerçek sağlayıcı bağlı değil; `paymentsAreLive()` false
döner. Siparişler `unpaid` olarak oluşur ve **hiçbir dosya indirilemez**. Bu
doğru davranıştır — ödeme yapılmadan teslim yok — ama satın alma akışı uçtan
uca test edilemez. Sandbox panelini `SANDBOX_PAYMENTS_ENABLED=true` ile
açabilirsin; para hareket etmez. Ayrıntı: `PAYMENTS.md`.

**E-posta gönderilmiyor.** Sağlayıcı yok. `enqueue_email()` mesajı
`email_outbox` tablosuna yazar ve orada bekler. Waitlist doğrulama linklerini
o tablodan elle almanız gerekir. Ayrıntı: `src/lib/server/mailer.ts`.

**Realtime IIS'ten geçmez.** Supabase Realtime (mesajlaşma, collab bildirimi)
tarayıcıdan doğrudan Supabase'e WSS ile bağlanır, IIS proxy'sinden geçmez.
IIS tarafında WebSocket ayarı yapmana gerek yoktur.

**İlk admin.** Supabase SQL Editor'de:

```sql
insert into public.admin_accounts (user_id, role)
select id, 'super_admin' from public.profiles where handle = '<handle>'
on conflict (user_id) do update set role = 'super_admin', is_active = true;
```

Sonra `/admin` açılmalı ve rol rozetini göstermeli. Admin olmayan bir hesap
`/admin`'e giderse konsol render edilmez.

**Kapıyı kaldırmak.** `.env.local` içinden `STAGING_AUTH_USERS` satırını sil ve
`nssm restart JamlyApp`. Kapı yalnızca bu değişken doluyken devrededir.

---

## 9. Sorun giderme

| Belirti | Sebep ve çözüm |
| --- | --- |
| Tüm istekler 404 | ARR proxy açılmamış → *Server Proxy Settings* → Enable proxy |
| Site 500 | `serverVariables` izni verilmemiş → URL Rewrite → View Server Variables |
| Şifre sorulmuyor | Build çıktısında `ƒ Proxy (Middleware)` yok. Dosya **`src/proxy.ts`** olmalı. Proje kökünde durursa Next onu hiç derlemez, çünkü `src/` dizini kullanan projelerde convention taraması `src/` altında yapılır. |
| 502 / bağlantı yok | Node servisi kapalı → `nssm status JamlyApp`, `logs\err.log` |
| Doğrulama linkleri localhost | `NEXT_PUBLIC_SITE_URL` set değil → ayarla, rebuild, restart |
| Supabase "schema cache" hatası | Migration uygulanmamış → Bölüm 2 |
| Sürekli 429 | Supabase erişilemiyor ve `NODE_ENV=production` → limiter fail-closed davranıyor. Dış bağlantıyı kontrol et. |
| Yüklemede 413 | `maxAllowedContentLength` yetersiz → `web.config` |
| Sertifika alınamıyor | ACME challenge Node'a gidiyor → `AcmeChallenge` kuralı ilk sırada mı, `.well-known/acme-challenge/web.config` var mı (Bölüm 6.3b) |

Kod güncellemesi:

```powershell
cd C:\jamly
git pull
npm ci
npm run build
nssm restart JamlyApp
```

---

## 10. Bu kurulumda yapılmayanlar

- Otomatik yedekleme — Supabase kendi yedeğini alır, IIS tarafında durum yok
- CDN veya statik varlık önbelleği
- Health check izleme / otomatik yeniden başlatma
- Gerçek ödeme ve e-posta sağlayıcısı

Genel yayına çıkmadan önce `RELEASE_CHECKLIST.md` ve `SECURITY.md` okunmalı.
