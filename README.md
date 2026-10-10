# Anubix

**Anubix**, CV'mi, projelerimi, başarılarımı ve hesaplarımı bir araya getirmek için adım adım geliştirdiğim kişisel platform. İzometrik bir oda üzerinden projelerime ulaşılır; özel panelde planlayıcı, not defteri, takvim/anımsatıcı ve kişisel dosya alanı bulunur. Bix asistanı, ayrıca kurulan yerel bir dil modeline bağlanabilir.

> **Durum (v0.3):** Herkese açık izometrik oda ve oturumla korunan kişisel panel çalışır. Notlar, görevler, takvim ve dosyalar kalıcı SQLite verisi kullanır. Bix, yerel Ollama modeli ayarlanırsa sohbet eder. E-posta/push bildirimi, otomatik yedekleme ve bulut yayını henüz yoktur.

## İçindekiler

- [Amaç ve kapsam](#amaç-ve-kapsam)
- [Teknolojiler](#teknolojiler)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Docker ile çalıştırma](#docker-ile-çalıştırma)
- [Kişisel paneli kurma](#kişisel-paneli-kurma)
- [Bix yerel model bağlantısı](#bix-yerel-model-bağlantısı)
- [Sitede neler var?](#sitede-neler-var)
- [Neler gerçekten çalışıyor, neler bekliyor?](#neler-gerçekten-çalışıyor-neler-bekliyor)
- [Oda nasıl çalışıyor?](#oda-nasıl-çalışıyor)
- [Neyi nereden değiştiririm?](#neyi-nereden-değiştiririm)
- [Erişilebilirlik ve hareket](#erişilebilirlik-ve-hareket)
- [Proje yapısı](#proje-yapısı)
- [Neden bu seçimler?](#neden-bu-seçimler)
- [Yol haritası](#yol-haritası)
- [Ücretsiz yayın araştırması](#ücretsiz-yayın-araştırması)
- [Alan adı ve e-posta DNS notları](#alan-adı-ve-e-posta-dns-notları)
- [Geliştirme akışı](#geliştirme-akışı)
- [Güvenlik ve katkı](#güvenlik-ve-katkı)

## Amaç ve kapsam

Bu proje bir öğrenme alanı. Ön yüzde izometrik bir çalışma odası var; arkada tek kullanıcıya ait, oturumla korunan bir panel çalışıyor. Notlar, görevler, takvim kayıtları ve dosyalar sunucuda saklanır. Kod açık kaynaklıdır; kişisel veriler ve parolalar Git deposuna girmez.

**Önemli:** Bu sürüm yerel bilgisayarda veya kalıcı disk sağlayan Docker sunucusunda çalışmak içindir. SQLite ve dosyalar yerel diskte tutulduğu için mevcut mimariyi doğrudan Vercel gibi geçici dosya sistemli sunucusuz ortama koyma.

## Teknolojiler

| Parça | Kullanım |
| --- | --- |
| Next.js 16 | React uygulaması, App Router, ileride sunucu tarafı özellikler |
| React 19 | Arayüz bileşenleri, `useSyncExternalStore` ile oda durumu |
| TypeScript | Tür denetimi; oda konumları ve proje verisi açık türlerle |
| SVG + CSS | İzometrik oda çizimi ve animasyonlar (ek animasyon kütüphanesi yok) |
| Web Animations API | Monitörün büyüyüp tam ekrana dönüşmesi |
| CSS Modules | Her bileşenin kendi stil dosyası |
| `next/font` | Nunito (metin) ve Pixelify Sans (piksel başlıklar); derlemede indirilip siteyle birlikte sunulur |
| Biome | Kod kalitesi kontrolü |
| SQLite (`node:sqlite`) | Tek kullanıcılı kalıcı not, görev, etkinlik, oturum ve dosya kaydı |
| Ollama (isteğe bağlı) | Yerel model ile Bix sohbeti |
| Docker / Compose | Kalıcı veri birimiyle uygulamayı konteynerde çalıştırma |

Next.js, React üzerine kurulu bir çatı olduğu için "React ile geliştirme" hedefiyle uyumludur. SQLite modülü için **Node.js 22.13+** gerekir; Docker imajında Node.js 22 kullanılır.

## Hızlı başlangıç

Gerekenler: Node.js 22.13+ ve npm. Komutları depo kökünde çalıştır:

```bash
npm ci
npm run setup  # Yönetici kullanıcı adı ve parolasını belirler; .env.local oluşturur
npm run dev
```

Tarayıcıda **`http://localhost:3005`** adresini aç. Proje, makinedeki diğer projelerle çakışmasın diye **3005** portunu kullanır (`npm run dev` ve `npm run start` bu portla başlar).

Diğer komutlar:

```bash
npm run lint       # Biome kod kontrolü
npm run typecheck  # TypeScript tür kontrolü
npm run build      # Üretim derlemesi
npm run start      # Derlenmiş uygulamayı 3005'te başlatır; önce build gerekir
```

`npm ci`, `package-lock.json` içindeki sürümleri kullanır. Yeni paket eklerken `npm install paket-adi` komutunu kullan ve hem `package.json` hem `package-lock.json` değişikliklerini commit et. `npm run setup` parolayı terminalde gizli alır ve yalnızca scrypt hash değerini `.env.local` içine yazar. Bu dosyayı Git’e ekleme.

> Not: Yazı tipleri `next/font/google` ile **derleme sırasında** indirilir. `npm run build` ve Docker derlemesi için internet bağlantısı gerekir; ziyaretçinin tarayıcısı Google'a istek atmaz.

## Docker ile çalıştırma

Docker Desktop veya çalışan bir Docker Engine gerekir. `docker --version` yalnızca istemcinin kurulu olduğunu gösterir; servis de çalışıyor olmalıdır (`docker info`).

İlk çalıştırmadan önce bağımlılıkları kurup yönetici hesabını oluştur:

```bash
npm ci
npm run setup
docker compose up --build
```

Ardından `http://localhost:3005` adresini aç. Durdurmak için terminalde `Ctrl+C`, arka planda başlatıldıysa `docker compose down` kullan. Port 3005 doluysa `compose.yaml` içindeki sol taraftaki portu örneğin `3006:3005` yap ve `localhost:3006` adresini aç.

`Dockerfile` üç aşamalıdır: bağımlılıkları `npm ci` ile kurar, uygulamayı derler, son imaja yalnızca Next.js `standalone` çıktısını ve statik dosyaları alır. Son süreç ayrıcalıksız `nextjs` kullanıcısıyla, `PORT=3005` ile çalışır. `compose.yaml` web servisini ve kalıcı `anubix_data` birimini kullanır. SQLite ve yüklenen dosyalar bu birimde kalır. Ollama servisini otomatik kurmaz. Geliştirme sırasında hızlı yenileme için yerel `npm run dev` akışı daha basittir.

## Kişisel paneli kurma

İlk kullanımda `npm run setup` komutuyla yönetici kullanıcı adı ve güçlü parola oluştur. Komut, yalnızca kullanıcı adını ve scrypt parola hash'ini `.env.local` içine yazar. Parolanın kendisi saklanmaz. Giriş odadaki dikey monitörden veya sayfanın altındaki hızlı listeden açılır.

Veri konumu yerel çalıştırmada `.anubix-data/` klasörü, Docker'da `anubix_data` adlı kalıcı birimdir. SQLite dosyası, oturumlar, notlar, görevler, etkinlikler, sohbet geçmişi ve yüklenen dosyalar burada tutulur. Yedeklemeden önce uygulamayı durdur ve **tüm veri klasörünü/birimini** kopyala; sadece `.sqlite` dosyasını kopyalamak WAL kullanımında son değişiklikleri kaçırabilir. `docker compose down -v` kalıcı birimi siler; normal `docker compose down` silmez.

Görev tarihi geldiğinde panel açıkken üst köşede anımsatıcı görünür. Bu sürüm kapalı tarayıcıya bildirim ya da e-posta göndermez. Takvimde güne tıklamak etkinlik formuna o tarihi doldurur. Not ve etkinliklere yalnızca giriş yapılmış oturumdan erişilir.

## Bix yerel model bağlantısı

Bix, `OLLAMA_MODEL` ayarlanmadığında kapalıdır; sahte cevap üretmez. [Ollama'yı](https://ollama.com/) ve kullanmak istediğin modeli kendi bilgisayarında kurup çalıştır. Ardından `.env.local` içinde model adını ve gerekirse adresi belirt:

```dotenv
OLLAMA_MODEL=kurdugun-model-adi
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

Yerel `npm run dev` bu adresle çalışır. Docker Compose, Ollama için varsayılan olarak `http://host.docker.internal:11434` kullanır; Docker Desktop'ta host bağlantısını ayrıca kontrol et. Bix geçmişi SQLite'da saklar, temizleme düğmesi vardır. Bix notlarını ve dosyalarını kendiliğinden okumaz. Yerel modelin çalıştırılması bu depoya dahil değildir; model seçimi ve cihaz kaynakları sana bağlıdır.

## Sitede neler var?

**Ana sayfa (`/`): izometrik oda.** Açılışta oda yumuşakça belirir, kamera masaya süzülür; ışık zinciri, lamba ve monitörler sırayla yanar.

- **Kaydırma turu:** Sayfayı kaydırdıkça kamera sırayla *Masa → Raflar → Mola → Yatak → Tüm oda* bölgelerine geçer. Tarayıcının normal kaydırması kullanılır, tekerlek ele geçirilmez. Turun sonunda animasyonsuz **hızlı liste** gelir.
- **Bölge düğmeleri:** Alttaki *Masa / Raflar / Mola / Yatak / Tüm oda* düğmeleri. Telefonda yatay kaydırma (swipe), masaüstünde ← → tuşları da çalışır.
- **Proje rafları:** Her proje bir kutu/disk. Tıklayınca avatar kalkar, rafa gider, kutuyu alır, bilgisayar kasasına takar, masasına döner; ana monitörde proje açılır ve ekran büyüyerek oyun seçme ekranı havasında **proje tanıtımına** dönüşür. Aynı proje zaten takılıysa avatar yeniden yürümez, ekran doğrudan açılır.
- **Mola köşesi:** Pufa veya televizyona tıklayınca avatar pufa geçer, kulaklığını takar, kumandayı alır; televizyonda özgün bir "mola modu" sahnesi oynar. Tekrar tıklamak veya "Masaya dön" molayı bitirir.
- **Yatak:** Kısa bir şekerleme sahnesi; avatar birkaç saniye sonra kendiliğinden kalkıp masasına döner.
- **Gizli monitör:** Dikey monitörde arada bir parlayan küçük bir anahtar ipucu var. Tıklayınca avatar fareye uzanır, ekran büyür ve **giriş ekranı** açılır.
- **Avatar:** Masadayken avatara tıklayınca el sallar. Boştayken nefes alır, göz kırpar, arada omzunun üstünden bakar, gerinir; uzun süre kimse dokunmazsa kısa bir şekerlemeye gider.

**Giriş → panel (`/panel`).** Dikey monitörde kullanıcı adı ve parola girilir; başarılı girişten sonra ekranı bloklar kaplar ve panel adası kurulur. Ada geçişi atlanabilir. **Sandık** dosyaları, **Çalışma masası** notları, **Görev panosu** görevleri, **Duvar takvimi** etkinlikleri açar. **Bix** ayarlanmış yerel modelle sohbet eder. 1–5 tuşları pencereleri açar. Oturum yoksa `/panel` sunucuda engellenir.

## Neler gerçekten çalışıyor, neler bekliyor?

| Özellik | Durum |
| --- | --- |
| Oda, proje rafları, mola/yatak sahneleri, swipe ve kamera | Çalışıyor |
| Tek kullanıcı girişi; scrypt parola hash'i ve HttpOnly oturum | Çalışıyor; önce `npm run setup` gerekir |
| Not oluşturma, düzenleme, silme | Çalışıyor; SQLite'da kalıcı |
| Görev oluşturma, tarih verme, tamamlama, düzenleme, silme | Çalışıyor; zamanı gelenler panel açıkken anımsatıcı olarak gösterilir |
| Takvimde ay değiştirme, tarih seçme, etkinlik ekleme/düzenleme/silme | Çalışıyor |
| Sandığa dosya yükleme, indirme, silme | Çalışıyor; dosya başına 10 MB, toplam 100 MB |
| Bix ile sohbet ve geçmiş | `OLLAMA_MODEL` ve çalışan Ollama varsa çalışır; model yoksa kapalı kalır |
| E-posta/push hatırlatması, otomatik yedekleme | Henüz yok |
| Örnek proje 02–04 | Gerçek içerik eklenene kadar boş yuva |

Tarayıcıda hareket tercihi saklanır. Kişisel veriler sunucudaki `.anubix-data/` dizininde veya Docker'da `anubix_data` biriminde tutulur.

## Oda nasıl çalışıyor?

Oda tek bir büyük SVG'dir; 3B motor (WebGL) kullanılmadı. Sabit izometrik açı için SVG + CSS yeterince zengin görünüyor, hafif çalışıyor, sunucuda da çizilebiliyor ve öğrenmesi kolay.

1. **İzometrik izdüşüm (`src/lib/iso.ts`)**: Her şey "oda birimi" ile (1 birim ≈ 20 cm) 3B kutular olarak tanımlanır. `iso(x, y, z)` noktayı ekrana çevirir; bir kutunun görünen üç yüzü (üst, sol, sağ) ayrı tonlarla boyanır. `IsoFace` ise ekran, poster, kapak gibi düz içerikleri duvara paralel yüzeylere "yapıştırır".
2. **Yerleşim (`src/components/room/layout.ts`)**: Masa, monitörler, raf yuvaları, TV, yatak, avatarın durakları, kamera çekimleri ve bölgeler tek dosyada.
3. **Sahne (`src/components/room/scene/`)**: Duvarlar, masa düzeni, raflar, mola köşesi, yatak köşesi ve ekran içerikleri ayrı bileşenler. Arkadan öne doğru çizilir ("ressam algoritması").
4. **Avatar (`src/components/room/avatar/`)**: Kutulardan oluşan voxel bir figür. Pozlar (oturma, yürüme, uzanma, taşıma, çömelme, pufta oturma…) avatarın kendi eksenlerinde tanımlanır ve dört yöne döndürülür.
5. **Senaryolar (`src/components/room/scripts.ts`)**: Her etkileşim okunabilir bir `async` fonksiyon: `await d.walk(...)`, `d.room({ tv: "chill" })`, `await d.camera("tvAction")`. Her senaryonun bir de `finish` fonksiyonu var; "Animasyonu atla", Esc ve hareket azaltma aynı son duruma anında geçer. Aynı anda tek senaryo oynar, sahne sürerken gelen tıklamaya avatar "bir saniye" der.
6. **Kamera (`src/components/room/useCamera.ts`)**: Kamera, SVG'yi taşıyan kutuya uygulanan `translate + scale` dönüşümüdür. Kaydırma sırasında doğrudan DOM'a yazılır (React yeniden çizmez); senaryolarda CSS geçişiyle çekime gider.
7. **Tıklanabilir nesneler (`Hotspots.tsx`)**: Her nesne nesnenin silüetine kırpılmış gerçek bir `<button>`. Klavyeyle odaklanır, ekran okuyucu adını okur, odakta silüet çizgisi ve etiket görünür.
8. **Tam ekran geçişi (`src/components/screens/ScreenDialog.tsx`)**: Doğal `<dialog>`. Açılırken içerik önce monitörün izometrik paralelkenarına matrisle yerleşir, sonra adım adım tam ekrana açılır.

Animasyonlar mümkün olduğunca `transform` ve `opacity` ile yapılır. Arka plan hareketleri (bulutlar, perde, bitkiler, ekran koruyucular) uzun ve sakin döngülerdir; bir sahne oynarken ya da tam ekran açıkken durur, böylece dikkat eyleme toplanır.

## Neyi nereden değiştiririm?

| Ne | Nerede |
| --- | --- |
| Projeler (başlık, açıklama, teknolojiler, bağlantılar, renk) | `src/data/projects.ts` |
| Örnek proje yuvalarını gerçek projeyle değiştirmek | `src/data/projects.ts` içindeki `placeholder(...)` satırları |
| Raftaki yuva sayısı ve konumu | `SHELF_SLOTS` → `src/components/room/layout.ts` |
| Mobilya konumları, avatar durakları, kamera çekimleri, bölge metinleri | `src/components/room/layout.ts` |
| Oda renkleri | `src/components/room/scene/palette.ts` |
| Avatarın renkleri ve pozları | `src/components/room/avatar/model.ts` |
| Etkileşim sırası (avatar ne yapar) | `src/components/room/scripts.ts` |
| Panel özelliği adları ve açıklamaları | `src/data/panelFeatures.ts` |
| Panel haritası (ada, yapılar, Bix) | `src/components/panel/WorldMap.tsx` |
| Panel formları ve etkileşimler | `src/components/panel/FeatureLive.tsx` |
| Oturum, SQLite ve API | `src/lib/server/`, `src/app/api/` |
| Genel renkler, yazı tipleri, hareket azaltma kuralı | `src/app/globals.css`, `src/app/layout.tsx` |

Proje kapağı olarak gerçek bir görsel kullanmak için görseli `public/` altına koy ve projeye `image: { src: "/projeler/anubix.png", alt: "…" }` ekle; tanıtım ekranı çizilmiş kapak yerine onu gösterir.

## Erişilebilirlik ve hareket

- Odadaki her etkileşim gerçek bir düğme; Tab ile gezilir, Enter/Boşluk ile çalışır. Klavyeyle odaklanılan nesnenin bölgesine kamera kendiliğinden gider.
- **Esc**: sahneyi atlar, moladan/uykudan masaya döndürür, tam ekranı kapatır. **← →**: bölge değiştirir.
- Sistem "hareketi azalt" ayarına uyar; sağ üstteki **Hareket** düğmesiyle de değiştirilebilir. Azaltılmış modda senaryolar oynamaz, sonuç anında gösterilir; içerik ve etkileşimler aynen çalışır.
- Ekran okuyucular için oda kısaca betimlenir; alt karttaki durum metni canlı bölge olarak okunur.
- Sayfanın altındaki **hızlı liste** projelere ve giriş ekranına animasyonsuz ulaşır.

## Proje yapısı

```text
anubix/
├── src/
│   ├── app/
│   │   ├── page.tsx            # Ana sayfa: odayı çizer (Sunucu Bileşeni)
│   │   ├── panel/page.tsx      # Oturum korumalı kişisel panel
│   │   ├── api/                # Oturum, kayıt, dosya ve sohbet uçları
│   │   ├── layout.tsx          # HTML iskeleti, yazı tipleri, metadata
│   │   └── globals.css         # Renk değişkenleri, temel stiller, hareket azaltma
│   ├── data/
│   │   ├── projects.ts         # Proje verileri (raflar, tanıtım, hızlı liste)
│   │   └── panelFeatures.ts    # Panel özellikleri
│   ├── lib/
│   │   ├── iso.ts              # İzometrik izdüşüm, kutu yüzleri, renk yardımcıları
│   │   ├── server/             # SQLite, oturum ve kayıt işlemleri
│   │   └── useMotionPreference.ts
│   └── components/
│       ├── iso/Iso.tsx         # IsoBox, IsoFace, IsoTop, IsoCylinder… SVG yapı taşları
│       ├── room/               # Oda deneyimi
│       │   ├── RoomExperience.tsx  # Sahne + kamera + yönetmen + arayüz
│       │   ├── layout.ts           # Konumlar, kamera çekimleri, bölgeler
│       │   ├── scripts.ts          # Etkileşim senaryoları
│       │   ├── roomStore.ts        # Oda durumu
│       │   ├── useCamera.ts        # Kamera ve kaydırma turu
│       │   ├── Hotspots.tsx        # Tıklanabilir nesneler
│       │   ├── RoomHud.tsx         # Üst çubuk, alt kart, bölge düğmeleri
│       │   ├── avatar/             # Voxel avatar modeli ve çizimi
│       │   └── scene/              # Duvarlar, masa, raflar, TV, yatak, ekranlar
│       ├── screens/            # Monitörden açılan tam ekranlar (proje tanıtımı, giriş)
│       ├── panel/              # Dünya oluşturma, ada haritası, özellik pencereleri
│       └── home/QuickLook.tsx  # Animasyonsuz hızlı liste
├── public/                     # Doğrudan sunulan statik dosyalar
├── Dockerfile                  # Üretim imajı (port 3005)
├── compose.yaml                # Web + kalıcı Docker veri birimi
├── next.config.ts              # Standalone çıktı ayarı
├── package.json                # Bağımlılıklar ve komutlar
└── README.md                   # Bu rehber
```

Next.js App Router'da `page.tsx` bir rota, `layout.tsx` o rotanın ortak kabuğudur. `"use client"` yazan dosyalar tarayıcıda etkileşim kuran İstemci Bileşenleridir; sayfalar bunlara veriyi prop olarak aktarır.

## Neden bu seçimler?

- **Next.js + TypeScript:** CV'de belirtilen teknoloji yönüyle ve gelecekteki oturum açma/API ihtiyacıyla uyumlu.
- **SVG + CSS, WebGL değil:** Kamera açısı sabit; izometrik SVG keskin, hafif, erişilebilir ve sunucuda çizilebiliyor. Gerçek 3B'nin (Three.js gibi) getireceği ek paket, yükleme süresi ve öğrenme yükü bu aşamada fayda sağlamıyor.
- **Ek animasyon kütüphanesi yok:** CSS animasyonları, geçişler ve Web Animations API yetiyor; davranışın tamamı okunabilir TypeScript dosyalarında.
- **CSS Modules:** Stil, onu kullanan bileşenin yanında durur; sınıf adları çakışmaz.
- **Docker:** Uygulamayı kendi bilgisayarında veya uygun bir sunucuda aynı üretim imajıyla çalıştırmayı öğretir. Ücretsiz yayın için Docker zorunlu değildir.
- **Tek web servisi + SQLite:** Tek kişilik yerel kullanımda ayrı veritabanı servisi gerektirmez; Docker veri birimi ve düzenli yedekleme gerekir.

## Yol haritası

Her aşamada küçük bir özellik geliştirip çalıştırma, tür kontrolü ve üretim derlemesiyle doğrulamak hedeflenir.

1. **Temel iskelet:** Next.js, TypeScript, Docker ve GitHub. ✅
2. **Etkileşimli ön yüz:** İzometrik oda ve voxel panel. ✅
3. **Kişisel araçlar:** Giriş, notlar, görevler, takvim, dosyalar ve isteğe bağlı Ollama bağlantısı. ✅ İlk yerel sürüm.
4. **Geliştirme:** Gerçek proje içerikleri, kullanılabilirlik, animasyon performansı, yedekleme ve e-posta bildirimleri.
5. **Yayın:** Kalıcı veri sağlayan barındırma veya farklı bir yönetilen veri/depo mimarisi seçimi; HTTPS ve domain bağlama.

## Ücretsiz yayın araştırması

**11 Ekim 2026 araştırma notu:** Fiyatlar ve kotalar değişebilir; yayına çıkmadan önce sağlayıcının güncel sayfasını yeniden kontrol et.

| Seçenek | Bu proje için durum | Sınır / karar |
| --- | --- | --- |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Next.js için en kolay ilk yayın adayı; GitHub bağlantısı, otomatik HTTPS ve özel alan adı | Ücretsiz plan yalnızca kişisel, ticari olmayan kullanım için. Kota aşılırsa özellikler durabilir. |
| [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) | Sadece statik ilk sayfa için alternatif | Bu depo sunucu özelliklerine açık kalsın diye `output: "standalone"` kullanıyor. Pages'in statik Next.js akışı için ayrıca statik export gerekir; gelecekteki API/oturum özellikleri bu modda çalışmaz. |
| [Supabase Free](https://supabase.com/pricing) | İleride kimlik doğrulama, veritabanı ve küçük dosyalar için aday | 500 MB veritabanı, 1 GB dosya depolama; etkin olmayan ücretsiz proje duraklatılabilir. Şimdi projeye eklenmedi. |
| [Resend Free](https://resend.com/pricing) | İleride uygulamanın bildirim e-postaları için aday | 3.000 e-posta/ay, 100 e-posta/gün. Google Workspace gelen kutusunun yerine geçmez. Şimdi bağlanmadı. |

**Bu sürüm için yayın kararı:** Vercel/Cloudflare gibi geçici dosya sistemli hedeflere mevcut SQLite ve dosya depolama ile doğrudan dağıtım yapılmaz. Ücretsiz statik portföy yayını mümkün; kişisel panel için kalıcı diskli bir host veya veritabanı/dosya deposunu yönetilen servise taşıma gerekir. Yerel LLM de ayrı çalışan donanım ister. Yayına çıkmadan önce bu mimari seçilip yedekleme ve HTTPS hazırlanmalı.

## Alan adı ve e-posta DNS notları

Alan adı kaydı, DNS yönetimi, web yayını ve Google Workspace e-postası farklı şeylerdir. Alan adın Squarespace tarafından yönetiliyorsa DNS değişiklikleri oradan yapılır. Barındırma seçildikten sonra `anubix.dev` / `www.anubix.dev` alan adlarını o sağlayıcıya ekle; sağlayıcının gösterdiği **projeye özel** A/CNAME değerlerini Squarespace DNS ekranına gir. Genel örnek kayıtları körlemesine kopyalama. [Vercel alan adı rehberi](https://vercel.com/docs/domains/set-up-custom-domain) ve [Squarespace DNS yardımı](https://support.squarespace.com/hc/en-us/articles/360035485391-DNS-records-for-connecting-third-party-domains) adımları açıklar.

Google Workspace kullanıyorsan mevcut MX, SPF, DKIM ve DMARC kayıtlarını kaydet ve web yönlendirmesi yaparken bunları silme. MX kayıtları gelen e-postayı belirler; web için genelde `@` A kaydı ve `www` CNAME kaydı değiştirilir. [Squarespace Google Workspace MX rehberi](https://support.squarespace.com/hc/en-us/articles/360001476528-Add-Google-Workspace-MX-records-to-your-domain). Alan adı DNS ayarları bu aşamada değiştirilmedi.

## Geliştirme akışı

Küçük bir değişiklik için önerilen sıra:

1. İhtiyacı bir cümleyle tanımla ve ilgili dosyayı bul ([Neyi nereden değiştiririm?](#neyi-nereden-değiştiririm) tablosu).
2. Tek bir özelliği uygula; nedenini kod incelemesinde veya commit açıklamasında belirt.
3. `npm run lint`, `npm run typecheck` ve `npm run build` çalıştır.
4. Tarayıcıda masaüstü ve telefon genişliğini kontrol et; sistemde "hareketi azalt" açıkken de bir kez dene.
5. Anlamlı bir commit oluşturup GitHub'a gönder.

Örnekler:

- **Yeni proje eklemek:** `src/data/projects.ts` içindeki `placeholder(2, …)` satırını gerçek bir proje nesnesiyle değiştir. Raf kutusu, tanıtım ekranı ve hızlı liste kendiliğinden güncellenir.
- **Yatağı başka yere taşımak:** `layout.ts` içindeki `BED_CORNER` kutularını değiştir; avatarın yürüyüşü için `SPOTS.bedFront` / `SPOTS.bedFoot` duraklarını da güncelle.
- **Avatarın hoodie rengini değiştirmek:** `avatar/model.ts` içindeki `AVATAR_COLORS.hoodie`.

## Güvenlik ve katkı

`.env*` dosyaları, `.env.example` dışında Git'e alınmaz. API anahtarları, Google Workspace bilgileri, kişisel dosyalar ve gerçek notlar depoya eklenmemelidir. `/panel` ve tüm kişisel API uçları oturumla korunur. Kurulumda `.env.local` ve `.anubix-data/` oluşur; ikisi de Git dışında kalır. Docker birimini silmek verileri siler. Verileri düzenli yedekle; canlı yayına çıkarken HTTPS, güvenilir ters proxy, oturum ayarları ve hız sınırlaması ayrıca gözden geçirilmeli.

Hata bildirimi ve katkı için GitHub issue veya pull request açılabilir. Değişikliklerden önce yukarıdaki kalite komutlarını çalıştır. Bu proje [MIT lisansı](LICENSE) ile açık kaynaklıdır.
