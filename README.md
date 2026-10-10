# Anubix

**Anubix**, CV'mi, projelerimi, başarılarımı ve hesaplarımı bir araya getirmek için adım adım geliştirdiğim kişisel platform. İleride planlayıcı, not defteri, takvim/anımsatıcı, kişisel dosya alanı ve kendi iş akışlarıma göre özelleştirilmiş yerel bir dil modeli asistanı eklemeyi hedefliyorum.

> Durum: İlk iskelet hazır. Şu anda yalnızca herkese açık tanıtım sayfası çalışıyor. Aşağıdaki modüller **henüz geliştirilmedi**. Bu depoda kişisel dosya, kimlik bilgisi veya gerçek kullanıcı verisi bulunmaz.

## İçindekiler

- [Amaç ve kapsam](#amaç-ve-kapsam)
- [Teknolojiler](#teknolojiler)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Docker ile çalıştırma](#docker-ile-çalıştırma)
- [Proje yapısı](#proje-yapısı)
- [Neden bu seçimler?](#neden-bu-seçimler)
- [Yol haritası](#yol-haritası)
- [Ücretsiz yayın araştırması](#ücretsiz-yayın-araştırması)
- [Alan adı ve e-posta DNS notları](#alan-adı-ve-e-posta-dns-notları)
- [Geliştirme akışı](#geliştirme-akışı)
- [Güvenlik ve katkı](#güvenlik-ve-katkı)

## Amaç ve kapsam

Bu proje bir öğrenme alanı. Yeni bir özelliği küçük ve anlaşılır parçalara bölüp nedenini kavrayarak eklemeyi amaçlıyorum. İlk aşama; çalışan bir React uygulaması, TypeScript, temel kalite kontrolleri, Docker imajı ve açık kaynak GitHub deposundan oluşuyor. Tasarım, veri modeli, giriş sistemi, e-posta ve LLM entegrasyonu sonraki aşamalarda ele alınacak.

Herkese açık portföy ve kişisel araçlar ileride ayrı erişim kurallarına sahip olmalı. Kişisel notlar ve dosyalar hiçbir zaman yalnızca arayüzde gizlenerek korunmamalı; sunucu tarafında yetki kontrolü gerekecek.

## Teknolojiler

| Parça | Kullanım |
| --- | --- |
| Next.js 16 | React uygulaması, App Router ve ileride sunucu tarafı özellikler |
| React 19 | Arayüz bileşenleri |
| TypeScript | Tür denetimi ve daha anlaşılır geliştirme |
| CSS | İlk sürümde az bağımlılıkla temel görünüm |
| Biome | Kod kalitesi kontrolü |
| Docker / Compose | Aynı üretim uygulamasını konteynerde çalıştırma |

Next.js, React üzerine kurulu bir çatı olduğu için “React ile geliştirme” hedefiyle uyumludur. Node.js için en az **20.9** gerekir; Docker imajında Node.js 22 kullanılır.

## Hızlı başlangıç

Gerekenler: Node.js 20.9+ ve npm. Komutları depo kökünde çalıştır:

```bash
npm ci
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç. `src/app/page.tsx` dosyasındaki metni değiştirip kaydet; geliştirme sunucusu sayfayı yeniler.

Diğer komutlar:

```bash
npm run lint       # Biome kod kontrolü
npm run typecheck  # TypeScript tür kontrolü
npm run build      # Üretim derlemesi
npm run start      # Derlenmiş uygulamayı başlatır; önce build gerekir
```

`npm ci`, `package-lock.json` içindeki sürümleri kullanır. Yeni paket eklerken `npm install paket-adi` komutunu kullan ve hem `package.json` hem `package-lock.json` değişikliklerini commit et.

## Docker ile çalıştırma

Docker Desktop veya çalışan bir Docker Engine gerekir. `docker --version` yalnızca istemcinin kurulu olduğunu gösterir; servis de çalışıyor olmalıdır (`docker info`).

```bash
docker compose up --build
```

Ardından `http://localhost:3000` adresini aç. Durdurmak için terminalde `Ctrl+C`, arka planda başlatıldıysa `docker compose down` kullan. Port 3000 doluysa `compose.yaml` içindeki sol taraftaki portu örneğin `3001:3000` yap ve `localhost:3001` adresini aç.

`Dockerfile` üç aşamalıdır: bağımlılıkları `npm ci` ile kurar, uygulamayı derler, son imaja yalnızca Next.js `standalone` çıktısını ve statik dosyaları alır. Son süreç ayrıcalıksız `nextjs` kullanıcısıyla çalışır. `compose.yaml` şu an yalnızca web servisini başlatır; veritabanı veya LLM servisi kurmaz. Geliştirme sırasında hızlı yenileme için yerel `npm run dev` akışı daha basittir.

## Proje yapısı

```text
anubix/
├── src/app/
│   ├── page.tsx       # Açılış sayfası ve planlanan modüller
│   ├── layout.tsx     # Ortak HTML iskeleti ve sayfa metadatası
│   └── globals.css    # Başlangıç stilleri
├── public/            # Doğrudan sunulan statik dosyalar
├── Dockerfile          # Üretim imajı
├── compose.yaml        # Yerel konteyner başlatma
├── next.config.ts      # Standalone çıktı ayarı
├── package.json        # Bağımlılıklar ve komutlar
└── README.md           # Bu rehber
```

Next.js App Router'da `page.tsx` bir rota, `layout.tsx` o rotanın ortak kabuğudur. Şu anda tek rota `/` bulunur. Tasarımda “Planlandı” yazan kartlar çalışan ürün özelliği değildir.

## Neden bu seçimler?

- **Next.js + TypeScript:** CV'de belirtilen teknoloji yönüyle ve gelecekteki oturum açma/API ihtiyacıyla uyumlu.
- **Sade CSS:** İlk aşamada bir stil kütüphanesini öğrenme zorunluluğu yaratmaz; tasarım beraber yeniden yapılabilir.
- **Docker:** Uygulamayı kendi bilgisayarında veya uygun bir sunucuda aynı üretim imajıyla çalıştırmayı öğretir. Ücretsiz yayın için Docker zorunlu değildir.
- **Tek web servisi:** Henüz olmayan veritabanı veya asistanı erkenden projeye yüklemez.

## Yol haritası

Her aşamada küçük bir özellik geliştirip çalıştırma, tür kontrolü ve üretim derlemesiyle doğrulamak hedeflenir.

1. **Temel iskelet:** React/Next.js, TypeScript, tanıtım sayfası, Docker, GitHub ve dokümantasyon. (Bu depo)
2. **Tasarım:** Beraber renkler, tipografi, mobil görünüm, gerçek CV/proje içerikleri ve erişilebilir gezinme.
3. **İlk yayın:** Ücretsiz barındırma sağlayıcısına dağıtım, `anubix.dev` ve `www.anubix.dev` bağlama, HTTPS doğrulama.
4. **Kişisel bölüm:** Giriş sistemi, sunucu tarafı yetkilendirme, planlayıcı ve notlar. Veri modelini ihtiyaç doğduğunda seçme.
5. **Takvim, anımsatıcı, dosya:** Kalıcı veri, dosya sınırları, yedekleme ve erişim kuralları. E-posta gönderimi için ayrı servis.
6. **Yerel LLM:** Modeli önce kendi cihazında deneme; bağlantı, gizlilik ve çalıştırma maliyetini ölçtükten sonra mimari karar.

## Ücretsiz yayın araştırması

**11 Ekim 2026 araştırma notu:** Fiyatlar ve kotalar değişebilir; yayına çıkmadan önce sağlayıcının güncel sayfasını yeniden kontrol et.

| Seçenek | Bu proje için durum | Sınır / karar |
| --- | --- | --- |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Next.js için en kolay ilk yayın adayı; GitHub bağlantısı, otomatik HTTPS ve özel alan adı | Ücretsiz plan yalnızca kişisel, ticari olmayan kullanım için. Kota aşılırsa özellikler durabilir. |
| [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) | Sadece statik ilk sayfa için alternatif | Bu depo sunucu özelliklerine açık kalsın diye `output: "standalone"` kullanıyor. Pages'in statik Next.js akışı için ayrıca statik export gerekir; gelecekteki API/oturum özellikleri bu modda çalışmaz. |
| [Supabase Free](https://supabase.com/pricing) | İleride kimlik doğrulama, veritabanı ve küçük dosyalar için aday | 500 MB veritabanı, 1 GB dosya depolama; etkin olmayan ücretsiz proje duraklatılabilir. Şimdi projeye eklenmedi. |
| [Resend Free](https://resend.com/pricing) | İleride uygulamanın bildirim e-postaları için aday | 3.000 e-posta/ay, 100 e-posta/gün. Google Workspace gelen kutusunun yerine geçmez. Şimdi bağlanmadı. |

**Önerilen ilk yayın yolu:** GitHub deposunu Vercel'e bağla, `main` dalından dağıt, oluşan `vercel.app` adresinde sayfayı kontrol et, sonra alan adını ekle. Böylece ilk sürüm için ücretli VPS gerekmez. Docker yerel öğrenme ve gelecekte kendi sunucuna taşıma seçeneği olarak kalır. Ücretsiz barındırma, bilgisayarında çalışan bir yerel LLM'yi sürekli açık bir sunucuya dönüştürmez; modelin çalışacağı donanım ve erişim daha sonra ayrıca tasarlanmalı.

## Alan adı ve e-posta DNS notları

Alan adı kaydı, DNS yönetimi, web yayını ve Google Workspace e-postası farklı şeylerdir. Alan adın Squarespace tarafından yönetiliyorsa DNS değişiklikleri oradan yapılır. Önce Vercel'de projeyi ve `anubix.dev` / `www.anubix.dev` alan adlarını ekle; panelin gösterdiği **projeye özel** A/CNAME değerlerini Squarespace DNS ekranına gir. Genel örnek kayıtları körlemesine kopyalama. [Vercel alan adı rehberi](https://vercel.com/docs/domains/set-up-custom-domain) ve [Squarespace DNS yardımı](https://support.squarespace.com/hc/en-us/articles/360035485391-DNS-records-for-connecting-third-party-domains) adımları açıklar.

Google Workspace kullanıyorsan mevcut MX, SPF, DKIM ve DMARC kayıtlarını kaydet ve web yönlendirmesi yaparken bunları silme. MX kayıtları gelen e-postayı belirler; web için genelde `@` A kaydı ve `www` CNAME kaydı değiştirilir. [Squarespace Google Workspace MX rehberi](https://support.squarespace.com/hc/en-us/articles/360001476528-Add-Google-Workspace-MX-records-to-your-domain). Alan adı DNS ayarları bu aşamada değiştirilmedi.

## Geliştirme akışı

Küçük bir değişiklik için önerilen sıra:

1. İhtiyacı bir cümleyle tanımla ve ilgili dosyayı bul.
2. Tek bir özelliği uygula; nedenini kod incelemesinde veya commit açıklamasında belirt.
3. `npm run lint`, `npm run typecheck` ve `npm run build` çalıştır.
4. Tarayıcıda masaüstü ve telefon genişliğini kontrol et.
5. Anlamlı bir commit oluşturup GitHub'a gönder.

Örnek: Ana sayfa başlığını değiştirmek için `src/app/page.tsx` dosyasını aç. Görünümü değiştirmek için `src/app/globals.css` dosyasını düzenle. `layout.tsx` genel sayfa başlığı ve açıklamasını tutar.

## Güvenlik ve katkı

`.env*` dosyaları, `.env.example` dışında Git'e alınmaz. API anahtarları, Google Workspace bilgileri, kişisel dosyalar ve gerçek notlar depoya eklenmemelidir. İleride özel bölüm oluşturulunca kimlik doğrulama, sunucu tarafı erişim kontrolü, dosya yükleme sınırları ve yedekleme ayrı işler olarak ele alınacak.

Hata bildirimi ve katkı için GitHub issue veya pull request açılabilir. Değişikliklerden önce yukarıdaki kalite komutlarını çalıştır. Bu proje [MIT lisansı](LICENSE) ile açık kaynaklıdır.
