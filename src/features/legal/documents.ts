/**
 * Privacy policy and terms of use — DRAFT texts.
 * Must be reviewed by a lawyer before store submission (KVKK + GDPR + UK GDPR + US state laws).
 * Placeholders in [brackets] are filled once the company details are final.
 */

export type LegalDocId = 'privacy' | 'terms';
export type LegalLang = 'tr' | 'en';

export type LegalSection = { heading: string; body: string[] };
export type LegalDocument = { title: string; updated: string; draftNotice: string; sections: LegalSection[] };

const UPDATED = '2026-11-20';
const CONTACT = '[iletisim@alanadi.com]';
const CONTACT_EN = '[contact@domain.com]';

const privacyTr: LegalDocument = {
  title: 'Gizlilik Politikası',
  updated: UPDATED,
  draftNotice: 'Taslak metindir; yayın öncesi hukuki incelemeden geçecektir.',
  sections: [
    {
      heading: 'Kısaca',
      body: [
        'Dedektör Asistanı yerel öncelikli çalışır: rotaların, kazı kayıtların, fotoğrafların ve ses notların yalnızca telefonunda saklanır.',
        'Konumunu kimseyle paylaşmayız, verini satmayız, reklam için kullanmayız.',
      ],
    },
    {
      heading: 'Telefonunda kalan veriler',
      body: [
        'Arama sırasında kaydedilen GPS noktaları, kazı noktaları, sonuçlar, notlar, fotoğraflar, ses kayıtları, saha ve cihaz bilgileri cihazındaki yerel veritabanında tutulur.',
        'Bu veriler bizim sunucularımıza gönderilmez. Telefonunu yedeklersen işletim sisteminin yedekleme hizmetine (iCloud, Google) dahil olabilir.',
      ],
    },
    {
      heading: 'Sunucuya gönderilen veriler (yalnızca Saha Raporu)',
      body: [
        'Saha raporu istediğinde konumun yaklaşık 5 km hassasiyete yuvarlanarak gönderilir; tam konum hiçbir zaman çıkmaz.',
        'Rapora ek olarak cihaz modeli, hedef türü ve geçmiş aramalarından anonim özet sayılar (ör. kazı sayısı, sonuç dağılımı) gönderilir. Fotoğraf, ses ve not gönderilmez.',
        'Kötüye kullanımı önlemek için anonim bir hesap kimliği ve günlük rapor sayacı tutulur. Ad, e-posta veya telefon numarası istenmez.',
      ],
    },
    {
      heading: 'Hizmet sağlayıcılar',
      body: [
        'Altyapı: Supabase (veritabanı ve sunucu fonksiyonları).',
        'Yapay zekâ: Anthropic (rapor metninin üretimi). Gönderilen içerik model eğitiminde kullanılmaz.',
        'Kamuya açık veri kaynakları: Open-Meteo (hava), ISRIC SoilGrids (toprak), Wikipedia (bölge bilgisi). Bu kaynaklara yalnızca yuvarlanmış koordinat iletilir.',
        'Harita: MapTiler veya seçtiğin harita sağlayıcısı, harita karolarını indirirken standart ağ bilgilerini (IP adresi gibi) görebilir.',
      ],
    },
    {
      heading: 'İzinler',
      body: [
        'Konum (arka planda dahil): yalnızca aktif bir arama sırasında rotanı kaydetmek için. Arama bitince konum takibi durur.',
        'Kamera, fotoğraflar, mikrofon: yalnızca kazı kaydına fotoğraf veya ses notu eklediğinde.',
        'Hareket sensörleri: yalnızca Salınım Koçu açıkken.',
      ],
    },
    {
      heading: 'Saklama ve silme',
      body: [
        'Ayarlar > Tüm verileri sil ile telefonundaki bütün kayıtları kalıcı olarak silebilirsin. Uygulamayı kaldırmak da yerel verileri siler.',
        'Sunucudaki anonim hesap ve rapor sayaçları talep üzerine silinir. Bölge önbelleği kişisel veri içermez.',
      ],
    },
    {
      heading: 'Hakların',
      body: [
        'KVKK, GDPR ve UK GDPR kapsamında verine erişme, düzeltme, silme ve itiraz haklarına sahipsin. Telefonundaki verilerin tamamını Ayarlar > Dışa aktar ile alabilirsin.',
        `Talepler için: ${CONTACT}`,
      ],
    },
    {
      heading: 'Çocuklar',
      body: ['Uygulama 13 yaş altı kullanıcılara yönelik değildir ve bilerek bu yaş grubundan veri toplanmaz.'],
    },
    {
      heading: 'Değişiklikler',
      body: ['Bu politika değişirse uygulama içinde bildirilir. Veri paylaşımını genişleten bir değişiklik açık onayın olmadan uygulanmaz.'],
    },
  ],
};

const privacyEn: LegalDocument = {
  title: 'Privacy Policy',
  updated: UPDATED,
  draftNotice: 'Draft text; it will be reviewed by counsel before release.',
  sections: [
    {
      heading: 'In short',
      body: [
        'Detector Assistant is local-first: your tracks, dig logs, photos and voice notes are stored only on your phone.',
        'We never share your location, sell your data or use it for advertising.',
      ],
    },
    {
      heading: 'Data that stays on your phone',
      body: [
        'GPS points recorded during a hunt, dig spots, results, notes, photos, voice notes, sites and devices are kept in a local database on your device.',
        'This data is not sent to our servers. It may be included in your operating system backups (iCloud, Google) if you enable them.',
      ],
    },
    {
      heading: 'Data sent to our server (Site Report only)',
      body: [
        'When you request a site report, your location is rounded to roughly 5 km before it leaves the phone; your exact location never does.',
        'The request also includes your device model, target type and anonymous summary counts from past hunts (e.g. number of digs, result mix). Photos, audio and notes are never sent.',
        'An anonymous account ID and a daily report counter are kept to prevent abuse. We do not ask for your name, email or phone number.',
      ],
    },
    {
      heading: 'Service providers',
      body: [
        'Infrastructure: Supabase (database and server functions).',
        'AI: Anthropic (generating the report text). Submitted content is not used for model training.',
        'Public data sources: Open-Meteo (weather), ISRIC SoilGrids (soil), Wikipedia (regional context). Only the rounded coordinate is passed to them.',
        'Maps: MapTiler or the map provider you choose may see standard network information (such as IP address) when tiles are downloaded.',
      ],
    },
    {
      heading: 'Permissions',
      body: [
        'Location (including background): only to record your track during an active hunt. Tracking stops when the hunt ends.',
        'Camera, photos, microphone: only when you add a photo or voice note to a dig.',
        'Motion sensors: only while Swing Coach is open.',
      ],
    },
    {
      heading: 'Retention and deletion',
      body: [
        'Settings > Delete all data permanently removes every record on your phone. Uninstalling the app also removes local data.',
        'The anonymous account and report counters on our server are deleted on request. The regional cache contains no personal data.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'Under GDPR, UK GDPR and applicable US state laws you may access, correct, delete or object to processing of your data. You can export everything on your phone via Settings > Export.',
        `Requests: ${CONTACT_EN}`,
      ],
    },
    {
      heading: 'Children',
      body: ['The app is not directed at children under 13, and we do not knowingly collect data from them.'],
    },
    {
      heading: 'Changes',
      body: ['If this policy changes we will tell you in the app. Any change that widens data sharing will not apply without your explicit consent.'],
    },
  ],
};

const termsTr: LegalDocument = {
  title: 'Kullanım Koşulları',
  updated: UPDATED,
  draftNotice: 'Taslak metindir; yayın öncesi hukuki incelemeden geçecektir.',
  sections: [
    {
      heading: 'Kabul',
      body: ['Uygulamayı kullanarak bu koşulları kabul etmiş olursun. Kabul etmiyorsan uygulamayı kullanma.'],
    },
    {
      heading: 'Yasalara uyum senin sorumluluğundadır',
      body: [
        'Metal dedektörü kullanımı ülkeden ülkeye farklı kurallara tabidir. Arama yapmadan önce arazi sahibinden izin almak ve gerekli resmî izinleri edinmek senin sorumluluğundur.',
        'Türkiye’de 2863 sayılı Kültür ve Tabiat Varlıklarını Koruma Kanunu, Birleşik Krallık’ta Treasure Act 1996 ve benzeri düzenlemeler dahil, bulunduğun yerin mevzuatına uymalısın.',
        'Sit alanlarında, ören yerlerinde, koruma altındaki alanlarda ve izinsiz arazilerde arama yapmak yasaktır. Uygulama bu alanlar için rapor üretmez.',
        'Tarihî veya kültürel değer taşıyabilecek bulguları yasaların öngördüğü şekilde yetkililere bildirmelisin.',
      ],
    },
    {
      heading: 'Uygulama ne yapmaz',
      body: [
        'Uygulama define yeri göstermez, bulgu tahmini yapmaz ve başarı oranı vaat etmez.',
        'Bulgu alım-satımına aracılık etmez; uygulama içinde bulgu satışı yapılamaz.',
        'Cihaz önerileri genel ve niteliksel bilgilerdir; markalar arası karşılaştırma veya satın alma tavsiyesi değildir.',
      ],
    },
    {
      heading: 'Saha raporu ve yapay zekâ',
      body: [
        'Saha raporu kamuya açık hava, toprak ve bölge verilerinden yapay zekâ ile üretilen genel bir rehberdir. Hatalı veya eksik olabilir.',
        'Rapordaki bilgiler hukuki görüş, arkeolojik değerlendirme veya güvenlik garantisi değildir. Kararlarını kendi değerlendirmenle ver.',
      ],
    },
    {
      heading: 'Güvenlik',
      body: [
        'Arazide kendi güvenliğinden sen sorumlusun. Kazı yapmadan önce yer altı kabloları, borular ve patlamamış mühimmat riskini göz önünde bulundur; şüpheli bir nesneye dokunma ve yetkililere haber ver.',
      ],
    },
    {
      heading: 'Hesap ve kullanım sınırları',
      body: [
        'Bazı özellikler anonim bir hesap ve günlük kullanım sınırı ile sunulur. Hizmeti kötüye kullanma, tersine mühendislik veya otomatik sorgu girişimleri erişimin kısıtlanmasına yol açabilir.',
      ],
    },
    {
      heading: 'Abonelikler',
      body: [
        'Ücretli özellikler sunulduğunda fiyat, yenileme ve iptal koşulları satın alma ekranında ve App Store / Google Play kurallarına göre gösterilir. İptal işlemleri mağaza hesabından yapılır.',
      ],
    },
    {
      heading: 'Sorumluluğun sınırlandırılması',
      body: [
        'Uygulama “olduğu gibi” sunulur. Yürürlükteki hukukun izin verdiği ölçüde; veri kaybı, yanlış konum kaydı, rapor içeriği veya uygulama kullanımından doğan dolaylı zararlardan sorumlu değiliz.',
        'Verilerin telefonunda saklandığı için düzenli olarak dışa aktarmanı öneririz.',
      ],
    },
    {
      heading: 'İletişim',
      body: [`[Şirket unvanı], [adres]. ${CONTACT}`],
    },
  ],
};

const termsEn: LegalDocument = {
  title: 'Terms of Use',
  updated: UPDATED,
  draftNotice: 'Draft text; it will be reviewed by counsel before release.',
  sections: [
    {
      heading: 'Acceptance',
      body: ['By using the app you agree to these terms. If you do not agree, do not use the app.'],
    },
    {
      heading: 'Complying with the law is your responsibility',
      body: [
        'Metal detecting rules differ by country. Getting landowner permission and any required official permits before you search is your responsibility.',
        'You must follow the law where you search, including, for example, the Treasure Act 1996 in England and Wales, the Archaeological Resources Protection Act on US federal land, and Law No. 2863 in Türkiye.',
        'Searching scheduled monuments, archaeological sites, protected areas or land without permission is prohibited. The app does not produce reports for such areas.',
        'Finds that may have historical or cultural value must be reported to the authorities as the law requires.',
      ],
    },
    {
      heading: 'What the app does not do',
      body: [
        'The app does not point to treasure locations, predict finds or promise success rates.',
        'It does not broker the sale of finds; finds cannot be sold through the app.',
        'Device tips are general and qualitative; they are not cross-brand comparisons or purchase advice.',
      ],
    },
    {
      heading: 'Site reports and AI',
      body: [
        'A site report is general guidance generated by AI from public weather, soil and regional data. It may be wrong or incomplete.',
        'It is not legal advice, an archaeological assessment or a safety guarantee. Make your own decisions.',
      ],
    },
    {
      heading: 'Safety',
      body: [
        'You are responsible for your own safety in the field. Before digging, consider buried cables, pipes and unexploded ordnance; do not touch suspicious objects and notify the authorities.',
      ],
    },
    {
      heading: 'Account and usage limits',
      body: [
        'Some features are provided through an anonymous account with daily limits. Abuse, reverse engineering or automated querying may lead to restricted access.',
      ],
    },
    {
      heading: 'Subscriptions',
      body: [
        'When paid features are offered, price, renewal and cancellation terms are shown on the purchase screen under App Store / Google Play rules. Cancel through your store account.',
      ],
    },
    {
      heading: 'Limitation of liability',
      body: [
        'The app is provided “as is”. To the extent permitted by law, we are not liable for data loss, inaccurate location records, report content or indirect damages arising from use of the app.',
        'Because your data lives on your phone, we recommend exporting it regularly.',
      ],
    },
    {
      heading: 'Contact',
      body: [`[Company name], [address]. ${CONTACT_EN}`],
    },
  ],
};

const DOCS: Record<LegalDocId, Record<LegalLang, LegalDocument>> = {
  privacy: { tr: privacyTr, en: privacyEn },
  terms: { tr: termsTr, en: termsEn },
};

export function isLegalDocId(value: unknown): value is LegalDocId {
  return value === 'privacy' || value === 'terms';
}

export function getLegalDocument(id: LegalDocId, language: string): LegalDocument {
  const lang: LegalLang = language.startsWith('tr') ? 'tr' : 'en';
  return DOCS[id][lang];
}
