# Netlify + Supabase yayını

Bu kurulumda Netlify Next.js uygulamasını çalıştırır; Supabase Postgres notları, görevleri, projeleri ve oturumları; özel Storage kovası dosyaları ve proje görsellerini tutar. Yerel geliştirme ve Docker, `SUPABASE_DB_URL` tanımlı değilse SQLite kullanmaya devam eder.

## 1. Supabase

1. Ücretsiz bir proje oluştur. Veritabanı parolasını parola yöneticine kaydet.
2. **SQL Editor** içinde [`supabase/schema.sql`](supabase/schema.sql) dosyasının tamamını çalıştır. Bu işlem tabloları ve `anubix-private` adlı **özel** dosya kovasını oluşturur. Tablolara tarayıcıdan erişim kapalıdır.
3. Projede **Connect → Transaction pooler** bağlantı dizesini kopyala. `[YOUR-PASSWORD]` kısmına veritabanı parolanı URL kodlamasıyla yerleştir. Bu değer `SUPABASE_DB_URL` olacak.
4. **Project Settings → API Keys** bölümünden proje URL'sini ve `sb_secret_...` biçimindeki sunucu gizli anahtarını al. Bunlar sırasıyla `SUPABASE_URL` ve `SUPABASE_SECRET_KEY` olacak. Gizli anahtarı Git'e veya sohbet mesajına koyma.

## 2. Yerel veriyi taşıma

Eski not, görev, proje ve dosyalarını istiyorsan siteyi açmadan önce aktar. Aynı üç değeri **yalnızca kendi terminal ortamında** tanımlayıp `npm run migrate:supabase` çalıştır. Betik SQLite kaynağını silmez; kayıtlar için tekrar çalıştırılabilir. Yerel `.anubix-data/` klasörünü ayrıca yedekle.

## 3. Netlify

1. Netlify'da ücretsiz hesap aç. **Add new project → Import an existing project → GitHub** yoluyla `Fqtih77/anubix` deposunu seç.
2. Ortam değişkenlerine `SUPABASE_DB_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ANUBIX_ADMIN_USERNAME`, `ANUBIX_ADMIN_PASSWORD_HASH` ve `ANUBIX_HTTPS=true` ekle. Son iki yönetici değeri yerel `.env.local` dosyasında `npm run setup` tarafından üretilir. `.env.local` dosyasını yükleme; yalnızca ilgili değerleri Netlify'ın gizli değişken alanlarına gir.
3. Derleme komutu `npm run build` olarak `netlify.toml` dosyasında tanımlıdır; yayın klasörünü Netlify Next.js çerçeve algılamasına bırak. Yayınla.
4. Önce Netlify'ın verdiği `*.netlify.app` adresinde ana sayfa, giriş, not ekleme ve dosya yüklemeyi dene. Ardından **Domain management** üzerinden `anubix.dev` alan adını bağla; Netlify'ın gösterdiği DNS kayıtlarını alan adı sağlayıcında uygula. Google Workspace ve Resend e-posta kayıtlarını silme.

Netlify Functions ikili yüklemelerde yaklaşık 4,5 MB sınırına sahip olduğundan Netlify yayınının dosya başı sınırı 4 MB'dır; yerel kullanım 10 MB kalır. Proje kapak görsellerinin mevcut 3 MB sınırı değişmez. Yerel Ollama ve ayrı Docker e-posta işçisi Netlify üzerinde kendiliğinden çalışmaz; web uygulaması bu ayarlar olmadan yayınlanabilir.
