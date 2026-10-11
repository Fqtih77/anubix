# Anubix

**Anubix**, CV'mi, projelerimi, başarılarımı ve hesaplarımı bir araya getirmek için adım adım geliştirdiğim kişisel platform. İzometrik bir oda üzerinden projelerime ulaşılır; özel panelde planlayıcı, not defteri, takvim/anımsatıcı ve kişisel dosya alanı bulunur. Bix asistanı, ayrıca kurulan yerel bir dil modeline bağlanabilir.

> **Durum (v0.4):** Herkese açık izometrik oda ve oturumla korunan kişisel panel çalışır. Notlar, görevler, takvim ve dosyalar kalıcı SQLite verisi kullanır. İsteğe bağlı Resend ayarlarıyla yalnızca yöneticiye günlük hatırlatma özeti gönderilir. Bix, yerel Ollama modeli ayarlanırsa sohbet eder. Sunucu için HTTPS ve elle başlatılan yedekleme hazırdır; bulut yayını henüz yoktur.

## İçindekiler

- [Amaç ve kapsam](#amaç-ve-kapsam)
- [Teknolojiler](#teknolojiler)
- [Hızlı başlangıç](#hızlı-başlangıç)
- [Docker ile çalıştırma](#docker-ile-çalıştırma)
- [Sunucuda HTTPS ile çalıştırma](#sunucuda-https-ile-çalıştırma)
- [Kişisel paneli kurma](#kişisel-paneli-kurma)
- [Yalnızca yöneticiye e-posta hatırlatmaları](#yalnızca-yöneticiye-e-posta-hatırlatmaları)
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
| Resend (isteğe bağlı) | Günlük görev ve takvim özetini yöneticinin adresine gönderme |
| Docker / Compose | Kalıcı veri birimiyle uygulamayı konteynerde çalıştırma |

Next.js, React üzerine kurulu bir çatı olduğu için "React ile geliştirme" hedefiyle uyumludur. SQLite modülü için **Node.js 22.13+** gerekir; Docker imajında Node.js 22 kullanılır.

## Hızlı başlangıç

Gerekenler: Node.js 22.13+ ve npm. Komutları depo kökünde çalıştır:

```bash
npm ci
npm run setup  # Yönetici hesabını kurar; .env.local yoksa oluşturur
npm run dev
```

Tarayıcıda **`http://localhost:3005`** adresini aç. Proje, makinedeki diğer projelerle çakışmasın diye **3005** portunu kullanır (`npm run dev` ve `npm run start` bu portla başlar).

Diğer komutlar:

```bash
npm run lint       # Biome kod kontrolü
npm run typecheck  # TypeScript tür kontrolü
npm run build      # Üretim derlemesi
npm run start      # Derlenmiş uygulamayı 3005'te başlatır; önce build gerekir
npm run test:mail  # Günlük e-posta özeti ve tekrar gönderim testleri
```

`npm ci`, `package-lock.json` içindeki sürümleri kullanır. Yeni paket eklerken `npm install paket-adi` komutunu kullan ve hem `package.json` hem `package-lock.json` değişikliklerini commit et. `npm run setup` parolayı terminalde gizli alır ve yalnızca scrypt hash değerini `.env.local` içine yazar. Dosyada önceden e-posta ayarları varsa onları koruyarak yönetici hesabını ekler. Bu dosyayı Git’e ekleme.

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

`Dockerfile` üç aşamalıdır: bağımlılıkları `npm ci` ile kurar, uygulamayı derler, son imaja Next.js `standalone` çıktısını, statik dosyaları ve hatırlatma işçisini alır. Süreçler ayrıcalıksız `nextjs` kullanıcısıyla çalışır; web `PORT=3005` kullanır. `compose.yaml` web ve mail servislerini aynı kalıcı `anubix_data` birimine bağlar. SQLite ve yüklenen dosyalar bu birimde kalır. Mail ayarları yoksa işçi e-posta göndermez. Ollama servisini otomatik kurmaz.

## Sunucuda HTTPS ile çalıştırma

`compose.prod.yaml`, tek bir Docker sunucusu için web, mail ve Caddy servislerini tanımlar. Caddy `anubix.dev` ve `www.anubix.dev` için HTTPS sertifikası alır; `www` adresini ana adrese yönlendirir. Web servisi dışarıya 3005 portunu açmaz. Bu yapılandırma henüz canlı sunucuda kurulmadı.

1. Sunucuda Docker Engine ve Compose kurulu olmalı. Depoyu klonla; `.env.local` dosyasını **Git dışında ve güvenli bir yolla** sunucuda oluştur. `npm run setup` ile yönetici hesabını burada da oluşturabilir, mail ayarlarını ayrıca ekleyebilirsin. Var olan yerel `.env.local` dosyasındaki sırları Git'e koyma.
2. Squarespace DNS'te `anubix.dev` için sunucunun genel IPv4 adresine işaret eden A kaydı, `www` için ana adrese işaret eden CNAME kaydı ayarla. Sunucunun güvenlik kurallarında TCP 80 ve 443'e izin ver. SSH için 22'yi yalnızca güvendiğin IP'lere aç; **3005'i internete açma**. Google Workspace ve Resend için kullanılan MX/TXT/CNAME kayıtlarını koru.
3. DNS kayıtları sunucuyu gösterdikten sonra depo kökünde çalıştır:

```bash
docker compose -f compose.prod.yaml up --build -d
docker compose -f compose.prod.yaml ps
docker compose -f compose.prod.yaml logs --tail=100 caddy
```

Tarayıcıda `https://anubix.dev` adresini ve yönetici girişini kontrol et. Sertifika alınamıyorsa önce DNS'in doğru IP'ye işaret ettiğini ve 80/443 erişimini kontrol et. `ANUBIX_HTTPS=true` üretim dosyasında tanımlıdır; oturum çerezi yalnızca HTTPS üzerinden gönderilir.

**Yedek:** Depo kökünde `sh scripts/backup-prod.sh` komutu web ve mail süreçlerini kısa süre durdurur, SQLite ve yüklenen dosyaları birlikte `.anubix-backups/` içine sıkıştırır, sonra süreçleri başlatır. Yedekler Git'e girmez. Dosyayı düzenli olarak **sunucu dışına** güvenli biçimde kopyala; aynı sunucudaki tek kopya, sunucu kaybolursa işe yaramaz. Bu komut manuel çalışır; otomatik zamanlama ve geri yükleme henüz kurulmadı. `docker compose -f compose.prod.yaml down -v` kalıcı veriyi siler.

## Kişisel paneli kurma

İlk kullanımda `npm run setup` komutuyla yönetici kullanıcı adı ve güçlü parola oluştur. Komut, yalnızca kullanıcı adını ve scrypt parola hash'ini `.env.local` içine yazar. Parolanın kendisi saklanmaz. Giriş odadaki gizli dikey monitörden açılır; hızlı listede giriş bağlantısı bulunmaz. Herkese açık depodaki kodu gören biri panelin varlığını anlayabilir, ama oturum açmadan kişisel içeriğe erişemez.

Veri konumu yerel çalıştırmada `.anubix-data/` klasörü, Docker'da `anubix_data` adlı kalıcı birimdir. SQLite dosyası, oturumlar, notlar, görevler, etkinlikler, sohbet geçmişi ve yüklenen dosyalar burada tutulur. Yedeklemeden önce uygulamayı durdur ve **tüm veri klasörünü/birimini** kopyala; sadece `.sqlite` dosyasını kopyalamak WAL kullanımında son değişiklikleri kaçırabilir. `docker compose down -v` kalıcı birimi siler; normal `docker compose down` silmez.

Görev tarihi geldiğinde panel açıkken üst köşede anımsatıcı görünür. E-posta ayarlanır ve mail işçisi çalışırsa tarayıcı kapalıyken de yöneticiye günlük özet gider. Takvimde güne tıklamak etkinlik formuna o tarihi doldurur. Not ve etkinliklere yalnızca giriş yapılmış oturumdan erişilir.

## Yalnızca yöneticiye e-posta hatırlatmaları

Ziyaretçiler için iletişim formu veya e-posta gönderme uç noktası yoktur. Kodlu giriş doğrulaması da eklenmedi. Görev ve etkinlik başlıkları yalnızca `.env.local` içinde belirttiğin **tek yönetici adresine** günlük düz metin özeti olarak gönderilir; açıklamalar ve dosyalar gönderilmez.

1. [Resend hesabında](https://resend.com/docs/dashboard/domains/introduction) gönderim için `bildirim.anubix.dev` gibi ayrı bir alt alan adı ekleyip doğrula. Resend'in **senin hesabın için gösterdiği** DNS kayıtlarını Squarespace DNS'e gir. Google Workspace'in `anubix.dev` kök alanındaki MX kayıtlarını değiştirme. Alan adı doğrulaması ve API anahtarı olmadan gerçek e-posta gönderilemez.
2. Resend'de yalnızca gönderme yetkili bir API anahtarı oluştur. `npm run setup` ile oluşan `.env.local` dosyasına şu satırları ekle; adresleri gerçek değerlerinle değiştir:

```dotenv
RESEND_API_KEY=re_...
ANUBIX_MAIL_FROM=Anubix <hatirlatma@bildirim.anubix.dev>
ANUBIX_MAIL_TO=senin-google-workspace-adresin@anubix.dev
ANUBIX_MAIL_TIME_ZONE=Europe/Istanbul
ANUBIX_MAIL_HOUR=9
```

3. Docker'da `docker compose up --build -d` hem web'i hem mail işçisini başlatır. Yerel `npm run dev` kullanıyorsan ayrı bir terminalde `npm run mail:worker` çalıştır. `npm run mail:check` tek kontrol yapar ve sonucu gösterir. **Gerçek ayarlar girilmişse bu komut hatırlatma e-postası gönderebilir.**

İşçi her 30 dakikada bir kontrol eder. Belirtilen yerel saatten sonra o gün için tek özet gönderir: tamamlanmamış ve tarihi gelmiş görevler ile o günün takvim etkinlikleri. O gün kayıt yoksa e-posta çıkmaz; daha sonra kayıt eklenirse sonraki kontrolde gönderilebilir. Başarılı gönderimi SQLite'da kaydeder; aynı gün yeniden göndermez. Gönderim hatasında aynı gün yeniden dener. Resend'e gönderilen içerik yalnızca bu başlık ve tarihlerden oluşur. Uygulama ve işçi çalışmıyorsa hatırlatma gönderilemez.

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
| Yöneticiye günlük görev/takvim e-postası | Resend alan adı ve API anahtarı ayarlanıp mail işçisi çalışırsa çalışır |
| Sandığa dosya yükleme, indirme, silme | Çalışıyor; dosya başına 10 MB, toplam 100 MB |
| Bix ile sohbet ve geçmiş | `OLLAMA_MODEL` ve çalışan Ollama varsa çalışır; model yoksa kapalı kalır |
| Ziyaretçi iletişim formu, push bildirimi, otomatik yedekleme | Henüz yok |
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
- Sayfanın altındaki **hızlı liste** projelere animasyonsuz ulaşır.

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
├── compose.yaml                # Web + mail işçisi + kalıcı Docker veri birimi
├── compose.prod.yaml           # Sunucuda web + mail + HTTPS ters proxy
├── Caddyfile                   # Alan adı, HTTPS ve www yönlendirmesi
├── scripts/mail-worker.mjs     # Yöneticiye günlük e-posta özeti
├── scripts/backup-prod.sh      # Sunucudaki tüm veri birimini yedekleme
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
4. **Geliştirme:** Gerçek proje içerikleri, kullanılabilirlik, animasyon performansı, otomatik sunucu dışı yedekleme ve mail işçisinin gerçek hesapla doğrulanması.
5. **Yayın:** Kalıcı veri sağlayan barındırma, DNS ve HTTPS; üretim Compose yapılandırması hazır, sunucu kurulumu bekliyor.

## Ücretsiz yayın araştırması

**11 Ekim 2026 araştırma notu:** Fiyatlar ve kotalar değişebilir; yayına çıkmadan önce sağlayıcının güncel sayfasını yeniden kontrol et.

| Seçenek | Bu proje için durum | Sınır / karar |
| --- | --- | --- |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Next.js için en kolay ilk yayın adayı; GitHub bağlantısı, otomatik HTTPS ve özel alan adı | Ücretsiz plan yalnızca kişisel, ticari olmayan kullanım için. Kota aşılırsa özellikler durabilir. |
| [Cloudflare Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/) | Sadece statik ilk sayfa için alternatif | Bu depo sunucu özelliklerine açık kalsın diye `output: "standalone"` kullanıyor. Pages'in statik Next.js akışı için ayrıca statik export gerekir; gelecekteki API/oturum özellikleri bu modda çalışmaz. |
| [Supabase Free](https://supabase.com/pricing) | İleride kimlik doğrulama, veritabanı ve küçük dosyalar için aday | 500 MB veritabanı, 1 GB dosya depolama; etkin olmayan ücretsiz proje duraklatılabilir. Şimdi projeye eklenmedi. |
| [Resend Free](https://resend.com/pricing) | Yöneticiye hatırlatma gönderen işçi için seçildi | Google Workspace gelen kutusunun yerine geçmez; gönderim alanı doğrulandı ve yerel ayarlar yapıldı. Güncel kota sağlayıcıdan kontrol edilmeli. |

**Bu sürüm için yayın kararı:** Vercel/Cloudflare gibi geçici dosya sistemli hedeflere mevcut SQLite ve dosya depolama ile doğrudan dağıtım yapılmaz. Kişisel panel için kalıcı diskli bir host seçildi; Oracle Cloud hesap başvurusu destek yanıtı bekliyor. Üretim Compose dosyası, HTTPS ve manuel yedek komutu hazırlandı. Yerel LLM ayrıca çalışan donanım ister.

## Alan adı ve e-posta DNS notları

Alan adı kaydı, DNS yönetimi, web yayını ve Google Workspace e-postası farklı şeylerdir. Alan adın Squarespace tarafından yönetiliyorsa DNS değişiklikleri oradan yapılır. Sunucu açıldığında `anubix.dev` A kaydına **o sunucunun gerçek genel IPv4 adresini** yaz; `www` için `anubix.dev` adresine CNAME kullan. Sunucu IP'si belli olmadan DNS'i değiştirme. [Squarespace DNS yardımı](https://support.squarespace.com/hc/en-us/articles/360035485391-DNS-records-for-connecting-third-party-domains) adımları açıklar.

Google Workspace kullanıyorsan mevcut MX, SPF, DKIM ve DMARC kayıtlarını kaydet ve web yönlendirmesi yaparken bunları silme. MX kayıtları gelen e-postayı belirler; web için genelde `@` A kaydı ve `www` CNAME kaydı değiştirilir. [Squarespace Google Workspace MX rehberi](https://support.squarespace.com/hc/en-us/articles/360001476528-Add-Google-Workspace-MX-records-to-your-domain). Resend için gereken `bildirim.anubix.dev` DNS kayıtları daha önce eklendi; web DNS kayıtları henüz değiştirilmedi.

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

`.env*` dosyaları, `.env.example` dışında Git'e alınmaz. API anahtarları, Google Workspace bilgileri, kişisel dosyalar ve gerçek notlar depoya eklenmemelidir. `/panel` ve tüm kişisel API uçları oturumla korunur. Kurulumda `.env.local` ve `.anubix-data/` oluşur; ikisi de Git dışında kalır. Docker birimini silmek verileri siler. Sunucu yapılandırmasında HTTPS ve ters proxy hazırdır. Yedekleri sunucu dışında sakla; canlı yayına çıkarken oturum ayarlarını ve hız sınırlamasını ayrıca gözden geçir.

Hata bildirimi ve katkı için GitHub issue veya pull request açılabilir. Değişikliklerden önce yukarıdaki kalite komutlarını çalıştır. Bu proje [MIT lisansı](LICENSE) ile açık kaynaklıdır.
