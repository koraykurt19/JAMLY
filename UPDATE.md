# Devralma notu — 2026-08-13 launch-readiness çalışması

Bu dosya, başka bir cihazdaki oturumun (Codex vb.) bu değişiklikleri devralması
için yazıldı. Neyin değiştiğini, neyin **kırıldığını**, ve sırayla ne yapılması
gerektiğini anlatır.

Ayrıntılar için: `PROJECT_AUDIT.md`, `SECURITY.md`, `PAYMENTS.md`,
`ARCHITECTURE.md`, `ADMIN_GUIDE.md`, `ENVIRONMENT.md`, `RELEASE_CHECKLIST.md`.

---

## 1. Kurulum

```bash
git fetch origin
git checkout feat/launch-readiness
npm ci
```

Doğrula (hepsi geçmeli):

```bash
npm run typecheck && npm run lint && npm test && npm run build
```

Beklenen: typecheck temiz, lint temiz, **21/21 test**, build **54 route**,
`npm audit` **0 açık**.

`.env.local` yoksa uygulama demo modunda çalışır — marketplace, Jam Match ve
`/early-access` örnek veriyle render olur.

---

## 2. DİKKAT — bu sürüm veritabanı değişikliği olmadan ÇALIŞMAZ

7 yeni migration var ve bunlar **hiçbir canlı veritabanına uygulanmadı**.
Uygulanmadan önce mevcut Supabase projesine bağlanırsan:

- Beat lisansı satın alma **başarısız olur** — `purchase_listing_license`
  imzası değişti (3. parametre `p_message` yerine `p_license_snapshot`).
- Sipariş durumu güncelleme **başarısız olur** — doğrudan UPDATE iptal edildi,
  yerine `set_order_status()` RPC'si geldi.
- `/early-access` formu, rozetler, raporlar, admin konsolu **503/hata döner** —
  tablolar yok.

Yani: **kod ile veritabanı birlikte gider.** Biri olmadan diğeri çalışmaz.

### Migration sırası (değiştirme)

```
20260813_security_hardening.sql
20260813_rate_limiting.sql
20260813_waitlist.sql
20260813_badges.sql
20260813_admin_rbac_audit.sql
20260813_email_outbox.sql
20260813_payments.sql
```

Sıra önemli:
- `security_hardening` → `badges`'ten önce (rozet kuralları `payment_status` okur)
- `admin_rbac_audit` → `email_outbox`'tan önce (RLS politikası `admin_has()` çağırır)
- `security_hardening` → `payments`'tan önce (`settle_order_payment` orada tanımlanır)

Sıfırdan bir proje kuruyorsan önce `supabase/schema.sql` + eski 11 migration,
sonra bunlar. Tam liste: `RELEASE_CHECKLIST.md` adım 2.

### Nasıl uygulanır

`npm run supabase:apply-migration` **Windows'ta bozuk** — `scripts/apply-supabase-migration.mjs:20`
yol kontrolü ters bölü (`\`) üreten `resolve()` çıktısını düz bölü (`/`) ile
karşılaştırıyor, bu yüzden her zaman "Migration file was not found" diyor.

Üç seçenek:
1. Supabase SQL editörüne dosyayı yapıştır (en güvenlisi, önerilen)
2. WSL / Git Bash'ten çalıştır
3. Önce şu satırı düzelt:
   ```js
   // scripts/apply-supabase-migration.mjs:20
   if (!migrationPath.startsWith(migrationsDirectory + sep) || !existsSync(migrationPath))
   ```
   (`import { resolve, sep } from "node:path"`)

Migration'lar idempotent — tekrar çalıştırmak güvenli.

---

## 3. Kırıcı değişiklikler (mevcut kodu etkileyen)

| Ne | Eski | Yeni |
| --- | --- | --- |
| Lisans satın alma | `purchase_listing_license(listing, tier, p_message)` | `(listing, tier, p_license_snapshot jsonb)` |
| Sipariş durumu | `.from("order_requests").update({status})` | `rpc("set_order_status", {...})` |
| Admin kontrolü | `rpc("is_admin", {p_user_id})` | `rpc("is_current_user_admin")` |
| Middleware | `middleware.ts` → `export middleware()` | `proxy.ts` → `export proxy()` |
| ESLint | `.eslintrc.json` | `eslint.config.mjs` (flat config) |
| Tailwind renkleri | config'de hex | `globals.css` CSS değişkenleri |

**Tailwind kuralı:** `tailwind.config.ts`'e artık hex yazma. Renk değişikliği
`globals.css` içindeki `--c-*` token'ından yapılır (kanal formatı: `77 124 255`).

**Sipariş durum makinesi** — artık serbest seçim yok:
```
              üretici                  alıcı
requested  →  in_review, cancelled  →  cancelled
in_review  →  delivered*, cancelled →  cancelled
delivered  →  (son)                 →  (son)
cancelled  →  (son)                 →  (son)

* yalnızca payment_status = 'paid' ise
```

---

## 4. Yeni dosya haritası

```
src/lib/
  waitlist.ts            erken kayıt doğrulama + referans normalize
  badges.ts              rozet sunum katmanı
  reports.ts             rapor kategorileri, öncelik kuralları
  order-status.ts        sipariş state machine (DB'nin aynası)
  money.ts               tamsayı kuruş aritmetiği, pay dağıtımı
  admin-client.ts        admin fetch + rol/yetenek tablosu
  early-access-copy.ts   TR/EN lansman metinleri
  server/
    rate-limit.ts        Postgres tabanlı rate limiter
    mailer.ts            outbox (sağlayıcı yok, kuyruğa yazar)
    payments/provider.ts ödeme sağlayıcı arayüzü + sandbox

src/components/
  ui/                    Button, Field, Modal, Toast, Card, Pill, Skeleton
  admin/                 admin-nav, admin-table, waitlist/reports/badges/audit panelleri
  early-access-*.tsx     lansman sayfası, form, doğrulama
  badge-display.tsx      rozet chip/kart/vitrin
  report-button.tsx      rapor modalı

src/app/
  early-access/          + /verify
  admin/layout.tsx       server-side guard (ÖNEMLİ: /admin artık korumalı)
  admin/{waitlist,reports,badges,audit}/
  api/waitlist/          + /verify
  api/reports/
  api/payments/webhook/
  api/admin/{waitlist,reports,badges,audit}/
```

---

## 5. Test harness'ının sınırları (buraya takılma)

`tests/run-tests.ts` hem koşucu hem test dosyası. Framework yok.

- `tsconfig.test.json` **sadece** `src/lib/**/*.ts` ve `tests/**/*.ts` derler.
  Component veya route test edemezsin.
- Testler **senkron** (`run: () => void`). `async` test sessizce geçer.
- Sadece `@/lib/*` import'ları çözülür (`scripts/setup-test-build.mjs` junction).

Test eklemek: `tests/run-tests.ts` içindeki `tests` dizisine obje ekle. Koşucu
artık ilk hatada durmuyor, hepsini çalıştırıp özet veriyor.

---

## 6. Sırada ne var

**Blocker'lar (kimlik bilgisi gerektirir, kod tarafı hazır):**

1. Supabase projesine migration'ları uygula (bölüm 2)
2. Vercel env: `NEXT_PUBLIC_SITE_URL` (yoksa doğrulama linkleri localhost'a
   gider), `RATE_LIMIT_SALT`, ödeme için `SUPABASE_SERVICE_ROLE_KEY` +
   `PAYMENT_WEBHOOK_SECRET`
3. Kendini super admin yap — SQL `RELEASE_CHECKLIST.md` adım 6'da
4. Ödeme sağlayıcısı: `PaymentProvider` arayüzünü implemente et
   (`src/lib/server/payments/provider.ts`). Türkiye için KDV / e-Fatura / TRY
   kararları `PAYMENTS.md`'de listelendi — bunlar mühendislik değil mali/hukuki
   karar.
5. E-posta sağlayıcısı: `src/lib/server/mailer.ts` içindeki `deliver()`.
   O zamana kadar waitlist doğrulama linkleri `email_outbox` tablosunda birikir.

**Yapılmayanlar (bilinçli):**

- Otomatik RLS negatif testleri — harness çoklu rolle kimlik doğrulayamıyor
- Waitlist bot koruması (entegrasyon noktası var, CAPTCHA yok)
- Profil şema genişletmeleri (dil, enstrüman, DAW, sabitlenmiş ilan, gizlilik)
- Logo hâlâ 1024×1024 PNG; `public/` içinde 8 eski favicon kuşağı duruyor
- `script-src 'unsafe-inline'` korundu — gerekçe `SECURITY.md`'de

---

## 7. Hızlı doğrulama (deploy sonrası)

| Kontrol | Beklenen |
| --- | --- |
| `curl -I /` | CSP var, **`unsafe-eval` YOK** |
| `/early-access` | Hero + form render |
| Waitlist gönder | 201, sıra numarası |
| Aynı e-posta tekrar | 200, `alreadyRegistered: true`, sıra değişmez |
| 1 saatte 6 kez | 429 |
| `/admin` (admin değilken) | Konsol render edilmez |
| `/api/admin/*` (token'sız) | 401 |
| `/api/payments/webhook` (imzasız) | 400 `invalid_signature` |
| İlan bildir | 201, `/admin/reports`'ta görünür |
