# Dedektör Asistanı (çalışma adı)

Her marka dedektör için saha asistanı: arama öncesi hazırlık, sahada kayıt ve rehberlik, arama sonrası analiz.
Bu depo **v0.1** sürümüdür: çevrimdışı çalışan çekirdek uygulama + yapay zekâ Saha Raporu için sunucu fonksiyonu.

## İçindekiler

- [Bu sürümde neler var](#bu-sürümde-neler-var)
- [Mac'te ilk kurulum (adım adım)](#macte-ilk-kurulum-adım-adım)
- [Saha testi: Faz 0 kontrol listesi](#saha-testi-faz-0-kontrol-listesi)
- [Supabase ve Saha Raporu kurulumu](#supabase-ve-saha-raporu-kurulumu)
- [Mimari](#mimari)
- [Komutlar](#komutlar)
- [Bilinen sınırlamalar ve sıradaki işler](#bilinen-sınırlamalar-ve-sıradaki-işler)

## Bu sürümde neler var

| Alan | Durum |
|---|---|
| İlk açılış: dil (TR/EN), birim (metrik/imparatorluk), tarama genişliği | ✅ |
| Aramaya başla: yakındaki kayıtlı sahayı otomatik tanır ("3. ziyaret") | ✅ |
| Arka planda GPS kaydı (telefon cepteyken, ekran kapalıyken), duraklat/devam, uygulama kapanırsa kurtarma | ✅ |
| Canlı harita: rota, kapsama alanı, önceki ziyaretlerin kapsaması, kazı noktaları | ✅ |
| KAZDIM: tek dokunuşla kayıt, büyük sonuç butonları, 10 sn'de kendiliğinden kapanma | ✅ |
| Kazı ayrıntıları: hedef ID, derinlik, başlık, not, fotoğraf, sesli not | ✅ |
| Arama özeti: süre, mesafe, taranan alan, iyi buluntu oranı, sonuçlar | ✅ |
| Sahalar: birikmiş kapsama, izin defteri, izin bitiş uyarısı, **kişisel ID kütüphanesi** | ✅ |
| Koleksiyon (kişisel müze görünümü) | ✅ |
| Cihazlarım: katalogdan (Nokta Legend 2, Magnetar 9000) veya elle; garanti takibi | ✅ |
| Sallama koçu (deneysel): jiroskopla sallama temposu, hızlıysa titreşim | ✅ |
| Saha Raporu: bölge tarihi + toprak + hava + cihaza özel öneri + kişisel geçmiş (Supabase gerekli) | ✅ kod hazır, sunucu kurulumu sende |
| Harita katmanları: uydu / arazi / sokak (MapTiler), arama ekranında tek dokunuşla değişir | ✅ |
| Çevrimdışı harita: sahanın veya bulunduğun yerin çevresini (1–3 km) önceden indir | ✅ |
| Ayarlar: verileri dışa aktar (JSON), tüm verileri sil | ✅ |
| Gizlilik politikası ve kullanım koşulları (TR/EN taslak, uygulama içinde) | ✅ taslak, hukuk onayı bekliyor |
| Uygulama ikonu ve açılış ekranı | ✅ |
| Grup araması, sosyal katman, akıllı saat, Bluetooth | ⏳ sonraki fazlar |

**Gizlilik ilkesi:** aramalar, rota, kazılar ve fotoğraflar yalnızca telefonda (SQLite) tutulur. Sunucuya giden tek şey Saha Raporu isteğidir ve o da konumu ~5 km'lik bir ızgaraya yuvarlanmış halde gönderir; buluntu yeri asla telefondan çıkmaz.

## Mac'te ilk kurulum (adım adım)

Her adımın sonunda bir kontrol noktası var; bir adım tutmazsa bir sonrakine geçme.

### 1. Araçlar

```bash
# Node.js LTS (22 veya üstü) — Homebrew ile
brew install node
node -v          # ✓ v22.x veya üstü görmelisin

# Xcode: App Store'dan kur, sonra bir kez aç ve lisansı kabul et
xcode-select --install
sudo xcodebuild -license accept

# iOS bağımlılık yöneticisi
brew install cocoapods
pod --version    # ✓ bir sürüm numarası görmelisin
```

### 2. Projeyi aç ve bağımlılıkları kur

```bash
cd dedektor-asistani
npm install      # .npmrc içindeki legacy-peer-deps ayarı otomatik kullanılır
npx tsc --noEmit # ✓ hiçbir çıktı yoksa tip kontrolü temiz
npm test         # ✓ "12 passed" görmelisin
```

### 3. Ortam değişkenleri

```bash
cp .env.example .env
```

Harita için şimdilik boş bırakabilirsin; MapLibre'nin demo haritası açılır (detayı düşük, sadece test için) ve ekranda "demo harita" uyarısı görünür.

Gerçek uydu/arazi görünümü için:
1. [MapTiler](https://www.maptiler.com/) hesabı aç (ücretsiz katman test için yeterli).
2. *API Keys* bölümünde yeni bir anahtar oluştur; *Allowed bundle IDs* alanına `com.dedektorasistani.app` yaz (anahtar uygulamanın içinde durduğu için bu kısıtlama önemli).
3. Anahtarı `.env` içindeki `EXPO_PUBLIC_MAPTILER_KEY` satırına yapıştır.
4. Uygulamayı yeniden başlat: Ayarlar > Harita katmanı'nda uydu / arazi / sokak seçenekleri görünür.

Kendi stilini kullanmak istersen `EXPO_PUBLIC_MAP_STYLE_URL` satırına tam stil adresini yazabilirsin; listeye "Özel" olarak eklenir.

> ⚠️ Çevrimdışı indirme: MapTiler'ın ücretsiz planında karoların cihazda saklanma koşulları sınırlı olabilir. Yayına çıkmadan önce kullandığın planın *offline caching* şartlarını kontrol et.

### 4. iPhone'da çalıştır

Uygulama arka plan konumu ve harita gibi yerel modüller kullandığı için **Expo Go ile çalışmaz**; bir "development build" gerekir.

```bash
# iPhone'u kabloyla Mac'e bağla, telefonda Ayarlar > Gizlilik ve Güvenlik > Geliştirici Modu'nu aç
npx expo run:ios --device
```

İlk derleme 5–15 dakika sürebilir. Xcode imzalama hatası verirse: `ios/` klasöründeki `.xcworkspace` dosyasını Xcode ile aç, *Signing & Capabilities* sekmesinde kendi Apple ID'ni (Team) seç ve komutu tekrar çalıştır.

✓ Kontrol: uygulama açılır, dil/birim ekranı gelir, "Başla"ya basınca ana sayfa görünür.

### 5. (İsteğe bağlı) Bulutta derleme — EAS

`eas.json` hazır; `build:configure` çalıştırmana gerek yok. Üç profil var:

| Profil | Ne için | Kim yükleyebilir |
|---|---|---|
| `development` | Geliştirme sürümü (Metro'ya bağlanır, kod değişince anında yenilenir) | Kayıtlı test cihazları |
| `preview` | Sahada denemek için tek başına çalışan sürüm | Kayıtlı test cihazları (Android'de APK) |
| `production` | App Store / Google Play | Mağaza; derleme numarası otomatik artar |

```bash
npx eas-cli@latest login
npx eas-cli@latest init                      # projeyi Expo hesabına bağlar (bir kez)
npx eas-cli@latest device:create             # iPhone'unu test cihazı olarak kaydet (bir kez)
npx eas-cli@latest build --profile preview --platform ios
```

Derleme bitince gelen bağlantıyı iPhone'da açıp kurarsın — kablo gerekmez.
⚠️ iOS için EAS derlemesi **ücretli Apple Developer hesabı** (yıllık 99 $) ister. Ücretsiz Apple ID ile sadece Xcode üzerinden kendi telefonuna kurabilirsin (7 günde bir yenilenir).

`.env` dosyası EAS'e yüklenmez. Bulut derlemesinde anahtarlar için:

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_MAPTILER_KEY --value <anahtar> --environment preview --environment production
```

## Saha testi: Faz 0 kontrol listesi

Uygulamanın en riskli varsayımı arka plan konumu ve pil tüketimi. İlk yürüyüşte şunları not et:

1. Aramaya başla → konum izninde **"Her zaman izin ver"** seç.
2. Telefonu kilitle, cebine koy, **en az 45 dakika** yürü (mümkünse açık arazide).
3. Arada 2–3 kez KAZDIM'a bas, bir tanesine fotoğraf ve sesli not ekle.
4. Bir kez duraklat, 5 dk sonra devam et.
5. Aramayı bitir ve özete bak.

Not edilecekler:
- Rota kesintisiz mi, yoksa ekran kapalıyken boşluklar var mı?
- 45 dk'da pil yüzde kaç düştü?
- Kapsama alanı gerçekte yürüdüğün yere mantıklı oturuyor mu?
- KAZDIM ekranı eldivenle / güneş altında rahat kullanılabiliyor mu?

Bu sonuçları bana ilet; GPS filtre ayarlarını (`src/lib/geo.ts` → `TRACK_FILTER`) ve kayıt sıklığını (`src/features/hunt/service.ts`) gerçek veriye göre ayarlayacağız.

## Supabase ve Saha Raporu kurulumu

Saha Raporu dışındaki her şey sunucusuz çalışır. Raporu açmak için:

1. [supabase.com](https://supabase.com)'da ücretsiz bir proje oluştur.
2. *Authentication > Providers* altında **Anonymous sign-ins**'i aç.
3. Terminalde:

```bash
npx supabase login
npx supabase link --project-ref <PROJE_REF>
npx supabase db push                                   # tablolar + RLS
npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...  # anahtar sadece sunucuda durur
npx supabase functions deploy site-report
```

4. Supabase panelinden *Project Settings > API* altındaki **Project URL** ve **anon/publishable key** değerlerini `.env` dosyasına yaz:

```
EXPO_PUBLIC_SUPABASE_URL=https://<PROJE_REF>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

5. Uygulamayı yeniden başlat; Ana sayfa > Saha raporu artık çalışır.

İsteğe bağlı sırlar: `REPORT_MODEL` (varsayılan `claude-haiku-5-5`), `REPORT_DAILY_LIMIT` (varsayılan günde 10 rapor/kullanıcı).

## Mimari

```
src/
  app/                 Ekranlar (Expo Router, dosya = rota)
    (tabs)/            Ana sayfa, Sahalar, Koleksiyon, Cihazlar
    hunt/              Başlat, aktif arama, özet
    dig/[id].tsx       KAZDIM sonuç ekranı
    site/[id].tsx      Saha detayı, izin defteri, ID kütüphanesi
    device/edit.tsx    Cihaz ekle/düzenle
    report.tsx         Saha Raporu
    coach.tsx          Sallama koçu
    settings.tsx       Ayarlar, dışa aktarma, silme
  components/          Tasarım sistemi (ui.tsx, Field.tsx)
  db/                  SQLite şeması (Drizzle), migration'lar, repository katmanı
  features/
    hunt/              Arka plan konum görevi, arama servisi, canlı iz, harita
    digs/              Fotoğraf ve sesli not
    sites/             Kişisel ID kütüphanesi
    devices/           Cihaz kataloğu, garanti hesabı
    coach/             Sallama temposu algoritması
    report/            Saha Raporu istemcisi ve sözleşmesi
    settings/          Kalıcı ayarlar
  i18n/                tr.ts, en.ts
  lib/                 Coğrafya, birimler, biçimlendirme, yapılandırma
  theme/tokens.ts      Renk, yazı, boşluk
supabase/
  migrations/          Kota tablosu, bölgesel bağlam önbelleği, RLS
  functions/site-report/  Hava (Open-Meteo), toprak (SoilGrids), bölge (Wikipedia), Claude
```

**Önemli kararlar**

- **Çevrimdışı öncelikli:** tüm kayıtlar SQLite'ta; ekranlar odaklandığında yerel veriden yeniden okunur.
- **Arka plan görevi** (`features/hunt/locationTask.ts`) kök layout'ta içe aktarılır; işletim sistemi uygulamayı arka planda uyandırdığında da kayıtlıdır. Her nokta aktif aramanın o anki *segment*'ine yazılır; duraklat/devam yeni segment açar, böylece aradaki boşluk çizgiyle birleşmez.
- **GPS temizleme:** 30 m'den kötü doğruluk, 3,5 m/sn üstü sıçramalar ve 1,5 m altı titreme atılır. Kapsama, her segmentin tarama genişliğinin yarısı kadar tamponlanmasıyla hesaplanır (yaklaşık bir rehberdir).
- **Yapay zekâ sabit bir aksiyondur, sohbet değildir:** fonksiyon, modeli zorunlu bir araçla (tool) çağırır; çıktı her zaman aynı JSON şemasındadır. Korunan alan anahtar kelimeleri içeren kaynaklar modele hiç gönderilmez.
- **Kota önce:** her rapor isteği, ücretli model çağrılmadan önce kullanıcı başına günlük kotadan düşülür.

## Komutlar

| Komut | Ne yapar |
|---|---|
| `npm start` | Geliştirme sunucusu (development build ile) |
| `npm run ios` / `npm run android` | Yerel derleme ve cihazda çalıştırma |
| `npm run typecheck` | TypeScript kontrolü |
| `npm run lint` | ESLint |
| `npm test` | Birim testleri (Jest) |
| `npm run db:generate` | Şema değişince yeni SQLite migration'ı üretir |

Edge function testleri: `cd supabase/functions/site-report && deno test`.

## Bilinen sınırlamalar ve sıradaki işler

- **Harita:** varsayılan demo haritası düşük detaylıdır; saha kullanımı için uydu/arazi stili şart (MapTiler vb.).
- **Korunan alanlar:** şimdilik anahtar kelime filtresi var. Sıradaki adım, ülkelerin resmi miras kayıtlarını (ör. İngiltere için Historic England) haritada uyarı katmanı olarak göstermek.
- **Yasal metinler:** `src/features/legal/documents.ts` içindeki gizlilik politikası ve kullanım koşulları **taslaktır**; mağazaya göndermeden önce bir avukata (KVKK + GDPR) okutulmalı, `[köşeli parantez]` alanları doldurulmalı ve aynı metin bir web adresinde yayınlanmalı (App Store bunu ister).
- **Abonelik:** RevenueCat altyapısı henüz yok.
- **Fotoğraf EXIF:** konum verisi istenmiyor; paylaşım özelliği geldiğinde dosyadan meta veri silme eklenecek.
- **Sırada:** iyi gün bildirimleri, sezon özeti kartı, ustalık yolu, grup araması, akıllı saat, Nokta Bluetooth entegrasyonu.
