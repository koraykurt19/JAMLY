# Jamly MVP

Jamly, BeatStars ve Fiverr'dan ilham alan koyu temalı, premium bir müzik freelancer pazaryeri MVP'sidir. Üreticiler beat veya müzik hizmeti listeleyebilir; alıcılar ilanları gezebilir, filtreleyebilir, ses önizlemesi dinleyebilir, üretici profillerini görüntüleyebilir ve demo sipariş talebi gönderebilir.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase auth ve Postgres şeması

## Rotalar

- `/` landing page
- `/jam-match` AI tarzı proje brief'i ve eşleşme giriş ekranı
- `/marketplace` aranabilir pazaryeri
- `/creators/[handle]` üretici profili ve portföy
- `/listing/[id]` ses önizlemeli ürün/hizmet detayı ve sipariş talebi
- `/orders/[id]` katılımcılara özel sipariş özeti ve mesajlaşma
- `/messages` ilan ve proje bağlamlı alıcı/üretici konuşmaları
- `/dashboard/creator` üretici paneli
- `/dashboard/buyer` alıcı paneli
- `/upload` ilan yükleme formu
- `/auth/sign-in` ve `/auth/sign-up` auth sayfaları

## Yerel Kurulum

```bash
npm install
npm run dev
```

`http://localhost:3000` adresini açın.

## Netlify Deploy

Bu proje Netlify için `netlify.toml` dosyasıyla hazırlandı.

Netlify ayarları:

```bash
Build command: npm run build
Publish directory: .next
Node version: 20
```

Bu proje klasik SPA değildir; Next.js App Router kullanır. Bu yüzden `/* -> /index.html`
redirect'i eklenmez. Route ve API davranışını Netlify Next.js plugin yönetir.

Önerilen yol:

1. Projeyi GitHub'a yükleyin.
2. Netlify'da "Add new site" > "Import an existing project" seçin.
3. Repository'yi bağlayın.
4. Build ayarları otomatik gelmezse yukarıdaki değerleri girin.
5. Supabase'i canlı kullanacaksanız Netlify Environment variables bölümüne şunları ekleyin:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Supabase env değerleri olmadan site demo veriyle çalışır.

## Docker

Docker kurulu bir makinede production build'i container içinde çalıştırmak için:

```bash
cp .env.example .env
docker compose build
docker compose up -d
```

Ardından `http://localhost:3000` adresini açın.

Notlar:

- Docker imajı Node 20 Alpine kullanır.
- Container adı `jamly-web` olarak ayarlandı.
- Healthcheck `/` rotasını kontrol eder.
- `jamly-network` adlı bridge network ve `jamly-next-cache` adlı volume kullanılır.
- Supabase URL ve anon key değerleri image build sırasında public frontend bundle içine işlenir; gerçek değerleri `.env` veya CI/CD environment variable olarak verin.
- Bu Docker Compose dosyası Supabase'i local container olarak çalıştırmaz. Auth, Postgres ve Storage için mevcut Supabase projesi veya ayrı Supabase local stack gerekir.

## Supabase Kurulumu

1. Bir Supabase projesi oluşturun.
2. `supabase/schema.sql` dosyasını Supabase SQL editor içinde çalıştırın.
3. `.env.example` dosyasını `.env.local` olarak kopyalayın.
4. Aşağıdaki değerleri ekleyin:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Supabase env değerleri olmadan uygulama demo veri ve demo sipariş/yükleme geri bildirimiyle çalışır. Env değerleri eklendiğinde auth aktif olur; Jam Alanı, ilan/üretici sayfaları ve kullanıcı panelleri canlı veriyi okur. Giriş yapmış üreticiler ilan yayınlayabilir, alıcılar gerçek UUID ilanlar için sipariş talebi oluşturabilir ve sipariş katılımcıları sipariş içinde mesajlaşabilir.

Mevcut Jamly şemasını daha önce kurduysanız `schema.sql` dosyasını tekrar çalıştırmak yerine
`supabase/migrations/20260629_add_conversations.sql` migration dosyasını SQL Editor'da bir kez
çalıştırın. Migration eski sipariş mesajlarını korur, konuşmalara bağlar ve Realtime yayınlarını
açar. Yeni Supabase projelerinde yalnızca güncel `schema.sql` yeterlidir.

## Notlar

- Gerçek ödeme, escrow, payout ve dosya teslimi bilinçli olarak kapsam dışında bırakıldı.
- Ses önizlemeleri ve kapak görselleri yükleme formunda dosya tabanlıdır. Supabase env değerleri yoksa yalnızca local preview/demo olarak çalışır; env değerleri ve giriş yapan üretici varsa dosyalar Supabase Storage bucket'larına yüklenir.
- SQL şeması roller, üretici profilleri, ilanlar, sipariş talepleri, Realtime konuşmalar, mesajlar, ek dosya altyapısı, RLS politikaları ve kapak/ses medyası için public storage bucket'ları içerir.
