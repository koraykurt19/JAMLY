# Jamly — final kurulum devir dokümanı

**Bu dokümanı dolduracak olan:** Supabase ve tüm kimlik bilgilerine erişimi
olan oturum.
**Doldurulmuş hali nereye gidecek:** IIS sunucusundaki (VDS) oturuma.

Aşağıdaki görevleri sırayla yap, her adımın doğrulamasını çalıştır, sonra
**Bölüm 5'teki çıktı şablonunu doldurup** kullanıcıya ver. VDS'e sadece o
doldurulmuş blok gidecek.

---

## 1. Mevcut durum

Kod tarafı bitti ve doğrulandı. Depo: `github.com/koraykurt19/JAMLY`

| Kontrol | Durum |
| --- | --- |
| typecheck / lint | temiz |
| test | 22/22 |
| production build | başarılı, `ƒ Proxy (Middleware)` üretiyor |
| `npm audit` | 0 açık |

**Dallar:**
- `main` — ana geliştirme
- `feat/iis-deployment` — IIS kurulumu + şifre kapısı (VDS bunu çekecek)

**Veritabanı durumu: HİÇBİR ŞEY UYGULANMADI.** Supabase projesi yok, 19
migration hiçbir yerde çalışmadı. Bu dokümanın asıl işi bu.

**Uygulama kodu ile veritabanı birlikte gider.** Migration'lar uygulanmadan
satın alma, sipariş, waitlist, rozet ve admin konsolu çalışmaz.

---

## 2. GÖREV — Supabase projesi

### 2.1 Proje oluştur

- Bölge: **`eu-central-1` (Frankfurt)** — Türkiye'ye en düşük gecikmeli seçenek
- Veritabanı şifresini güvenli bir yere kaydet (migration CLI'ı için gerekebilir)

### 2.2 Şemayı kur

Sıfır projede önce **`supabase/schema.sql`** dosyasını çalıştır.

### 2.3 Migration'ları uygula — SIRA KRİTİK

> **UYARI: Alfabetik sıra ile bağımlılık sırası aynı DEĞİL.**
> `20260813_*` dosyalarının 7 tanesi aynı tarihli. Alfabetik çalıştırırsan
> `admin_rbac_audit` ilk sıraya düşer, `security_hardening` sona kalır ve
> migration'lar "column payment_status does not exist" / "function admin_has
> does not exist" hatalarıyla patlar.
>
> **Aşağıdaki sırayı birebir uygula.**

```
 1. 20260629_add_conversations.sql
 2. 20260707_add_beat_license_tiers.sql
 3. 20260712_unify_account_capabilities.sql
 4. 20260715_username_policy.sql
 5. 20260731_protect_founder_headline.sql
 6. 20260801_ensure_listing_storage.sql
 7. 20260809_admin_and_platform_config.sql
 8. 20260811_add_collaboration_revenue.sql
 9. 20260811_add_collaboration_workspace.sql
10. 20260811_add_profile_follows.sql
11. 20260811_tighten_collaboration_rls.sql
12. 20260813_security_hardening.sql      <-- once bu
13. 20260813_rate_limiting.sql
14. 20260813_waitlist.sql
15. 20260813_badges.sql                  <-- waitlist + security_hardening ister
16. 20260813_admin_rbac_audit.sql        <-- waitlist ister (overview_v2)
17. 20260813_email_outbox.sql            <-- admin_has + waitlist ister
18. 20260813_payments.sql                <-- security_hardening + admin_has ister
19. 20260815_validate_payment_amount.sql <-- payments ister
```

Bağımlılık özeti:
- `security_hardening` → `payment_status` kolonunu, `settle_order_payment()` ve
  `set_order_status()` fonksiyonlarını ekler. 15, 18 bunlara bağlı.
- `admin_rbac_audit` → `admin_has()` fonksiyonunu ekler. 17, 18 buna bağlı.
- `waitlist` → `waitlist_entries` tablosunu ekler. 15, 16, 17 buna bağlı.

Hepsi idempotent; hata alırsan düzeltip aynı dosyayı tekrar çalıştırabilirsin.

**Uygulama yöntemi:** Supabase Dashboard → SQL Editor önerilir. Veritabanı
şifresini sunucuya taşımayı gerektirmez.

Alternatif (CLI, Windows'ta artık çalışıyor):
```bash
SUPABASE_DATABASE_URL="postgresql://..." npm run supabase:apply-migration -- 20260813_security_hardening.sql
```

### 2.4 DOĞRULAMA — migration'lar gerçekten indi mi

SQL Editor'de çalıştır. **8 satır dönmeli:**

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'waitlist_entries', 'badge_definitions', 'admin_audit_log', 'payments',
    'ledger_entries', 'rate_limit_counters', 'email_outbox', 'support_tickets'
  )
order by table_name;
```

**7 satır dönmeli:**

```sql
select routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name in (
    'set_order_status', 'settle_order_payment', 'join_waitlist', 'admin_has',
    'record_admin_action', 'consume_rate_limit', 'evaluate_profile_badges'
  )
order by routine_name;
```

**Ödeme kapısı gerçekten var mı — `unpaid` dönmeli:**

```sql
select column_default
from information_schema.columns
where table_name = 'order_requests' and column_name = 'payment_status';
```

Bu üçü geçmiyorsa devam etme, migration sırasını gözden geçir.

---

## 3. GÖREV — Supabase yapılandırması

### 3.1 Authentication → URL Configuration

- **Site URL:** `https://jamly.hakanefe.online`
- **Redirect URLs** (ikisini de ekle):
  - `https://jamly.hakanefe.online/auth/reset-password`
  - `https://jamly.hakanefe.online/early-access/verify`

Bunlar eksikse şifre sıfırlama ve e-posta doğrulama linkleri çalışmaz.

### 3.2 Authentication → Providers → Email

- Minimum şifre uzunluğu: **8**

Uygulama tarafında zaten 8 karakter isteniyor, ama bu yalnızca istemci
tarafında. Sunucu tarafında da geçerli olması için buradan ayarlanmalı.

### 3.3 Storage doğrulaması

`schema.sql` dört bucket oluşturur. Kontrol et:

| Bucket | Olması gereken |
| --- | --- |
| `listing-covers` | public |
| `profile-media` | public |
| `audio-previews` | public |
| `license-deliverables` | **public DEĞİL** |

`license-deliverables` public görünüyorsa dur — satın alınan dosyalar herkese
açık demektir. `20260813_security_hardening.sql` uygulanmamış olabilir.

### 3.4 İlk süper admin

Kullanıcı önce uygulamadan normal hesap açmalı, sonra:

```sql
insert into public.admin_accounts (user_id, role)
select id, 'super_admin' from public.profiles where handle = '<handle>'
on conflict (user_id) do update set role = 'super_admin', is_active = true;
```

Not: `20260809_admin_and_platform_config.sql` içinde sabit bir e-posta için
bootstrap var; kendi hesabın için yukarıdaki sorguyu çalıştırman gerekir.

---

## 4. GÖREV — Gizli değerleri üret

Bunlar Supabase'den gelmez, üretilir:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

İki kez çalıştır:
- `RATE_LIMIT_SALT` — rate limiter kimlik hash'lerini tuzlar. Ayarlanmazsa
  bilinen bir varsayılan kullanılır ve hash'ler tahmin edilebilir olur.
- `PAYMENT_WEBHOOK_SECRET` — webhook HMAC imzası. Ayarlanmazsa bilinen sandbox
  varsayılanına düşer ve **herkes sahte ödeme mutabakatı gönderebilir**.

---

## 5. ÇIKTI — VDS'e gidecek blok

Aşağıyı doldur ve kullanıcıya ver. VDS'te `C:\jamly\.env.local` olarak
kaydedilecek.

```ini
# --- Supabase ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# --- Public origin ---
NEXT_PUBLIC_SITE_URL=https://jamly.hakanefe.online

# --- Test kapisi (degistirme, hash'ler zaten dogru) ---
STAGING_AUTH_USERS=koraykurt:b23cf694ca724e6890aa144fe5a38be3983f538a8481dfa411e49471b32517a0,hakanefe:04893408c89f3115889c3a6b81a9abe366bf4d8719a0d11cf3a5acdfaca73ca2

# --- Uretilen gizli degerler ---
RATE_LIMIT_SALT=
PAYMENT_WEBHOOK_SECRET=

# --- Odeme (gercek saglayici yok) ---
PAYMENT_PROVIDER=sandbox
SANDBOX_PAYMENTS_ENABLED=false

# --- E-posta gonderen kimligi (gizli degil) ---
EMAIL_FROM_ADDRESS=noreply@getjamly.com
EMAIL_REPLY_TO_ADDRESS=support@getjamly.com
```

Bu bloğun yanına şu onay listesini de ver:

```
[ ] Supabase projesi olusturuldu (bolge: eu-central-1)
[ ] schema.sql uygulandi
[ ] 19 migration DOKUMANDAKI SIRAYLA uygulandi
[ ] Dogrulama 1: 8 tablo dondu
[ ] Dogrulama 2: 7 fonksiyon dondu
[ ] Dogrulama 3: payment_status default = 'unpaid'
[ ] Auth Site URL + 2 redirect URL ayarlandi
[ ] Sifre minimum 8 ayarlandi
[ ] license-deliverables bucket'i PRIVATE dogrulandi
[ ] RATE_LIMIT_SALT ve PAYMENT_WEBHOOK_SECRET uretildi
```

---

## 6. Bu kurulumdan sonra da eksik kalanlar

Bunlar bilinçli olarak yapılmadı; VDS'teki oturumun bunları "hata" sanmaması
için açıkça yaz.

**Ödeme çalışmıyor.** Gerçek sağlayıcı bağlı değil. Siparişler `unpaid` oluşur
ve **hiçbir dosya indirilemez** — bu doğru davranış, ödeme yapılmadan teslim
yok. Bağlamak için `src/lib/server/payments/provider.ts` içindeki
`PaymentProvider` arayüzü implemente edilmeli. Türkiye için KDV, e-Fatura ve
TRY kararları `PAYMENTS.md`'de listelendi — bunlar mühendislik değil mali ve
hukuki karar.

**E-posta gönderilmiyor.** Sağlayıcı yok. `enqueue_email()` mesajı
`email_outbox` tablosuna yazar ve orada bekler. Waitlist doğrulama linklerini
o tablodan elle almak gerekir:

```sql
select to_email, payload ->> 'verifyUrl' as link, created_at
from public.email_outbox
where template = 'waitlist_verification' and status = 'queued'
order by created_at desc;
```

**Otomatik RLS testi yok.** 144 policy elle gözden geçirildi; test harness'ı
saf fonksiyon çalıştırdığı için çoklu rolle kimlik doğrulayamıyor.

**Waitlist bot koruması yok.** Rate limiting ve tek kullanımlık e-posta
işaretlemesi var, CAPTCHA yok.

**`script-src 'unsafe-inline'` korundu.** Gerekçesi `SECURITY.md`'de; nonce'a
geçmek 22 statik sayfayı dinamikleştirir.

---

## 7. Yapılmaması gerekenler

- **`service_role` anahtarını sohbete yapıştırma.** Doğrudan VDS'teki
  `.env.local` dosyasına girilmeli. Bu anahtar tüm RLS politikalarını bypass
  eder.
- **`NEXT_PUBLIC_` önekiyle gizli anahtar tanımlama.** O önek değeri tarayıcı
  paketine gömer.
- **Migration'ları alfabetik çalıştırma.** Bölüm 2.3'teki uyarı.
- **`license-deliverables` bucket'ını public yapma.**
- **Ödemeyi çalışıyor gibi sunma.** `paymentsAreLive()` false döner.

---

## 8. Referans dokümanlar

| Dosya | İçerik |
| --- | --- |
| `DEPLOY_IIS.md` | IIS reverse proxy, NSSM servisi, TLS, sorun giderme |
| `SECURITY.md` | Yetkilendirme modeli, kapatılan açıklar, kabul edilen riskler |
| `PAYMENTS.md` | Ödeme domaini, sağlayıcı bağlama, Türkiye vergi boşlukları |
| `ADMIN_GUIDE.md` | Rol matrisi, moderasyon rehberi |
| `ENVIRONMENT.md` | Her değişken ve yokluğunda ne bozulur |
| `RELEASE_CHECKLIST.md` | Genel yayın öncesi sıralı adımlar |
| `PROJECT_AUDIT.md` | Denetimde bulunanlar ve yapılanlar |
