# 📋 Manuel Test Checklist

Bu dosya, otomatik testlerin kapsamadığı UI/UX testleri ve manuel kontrol gerektiren senaryoları içerir.

## 🎯 Test Önceliği

### 🔴 **KRİTİK** - Her değişiklikten sonra mutlaka test edilmeli
### 🟡 **ORTA** - Önemli değişikliklerden sonra test edilmeli  
### 🟢 **DÜŞÜK** - Büyük release'lerden önce test edilmeli

---

## 📱 **TEMEL FONKSİYONALİTE**

### 🔴 Ürün Ekleme
- [ ] **Geçerli veri girişi**: Ürün adı, kodu, stok ve kategori ile ürün eklenebiliyor mu?
- [ ] **Türkçe karakterler**: ç, ğ, ı, ö, ş, ü karakterleri düzgün dönüştürülüyor mu?
- [ ] **Büyük harf dönüşümü**: Tüm metinler otomatik büyük harfe çevriliyor mu?
- [ ] **Stok validasyonu**: Sadece sayı ve ? kabul ediliyor mu?
- [ ] **Zorunlu alanlar**: Ürün adı ve kodu boş bırakıldığında hata veriyor mu?
- [ ] **Form temizleme**: Ekleme sonrası form temizleniyor mu?

```
Test Verisi:
Ürün Adı: çıkış rölesİ
Ürün Kodu: rl-12v-dc
Kategori: elektronik röle
Stok: 25

Beklenen Sonuç:
Ürün Adı: CIKIS ROLESI
Ürün Kodu: RL-12V-DC  
Kategori: ELEKTRONIK ROLE
Stok: 25
```

### 🔴 Ürün Listesi ve Arama
- [ ] **Tablo render**: Eklenen ürünler tabloda görünüyor mu?
- [ ] **Arama özelliği**: Ürün adı, kodu ve kategori ile arama çalışıyor mu?
- [ ] **Boş durum**: Hiç ürün yokken "henüz ürün eklenmemiş" mesajı görünüyor mu?
- [ ] **Arama filtreleme**: Arama sonuçları anlık olarak güncelleniyor mu?

```
Test Senaryosu:
1. 3-4 farklı ürün ekle
2. "ELEKTRONIK" kelimesi ile ara
3. Sadece elektronik kategorisindeki ürünler listelenmeli
4. Arama kutusunu temizle
5. Tüm ürünler tekrar göründüğünü kontrol et
```

---

## 🛠️ **DÜZENLEME VE SİLME**

### 🔴 Ürün Düzenleme
- [ ] **Edit modu**: Düzenle butonuna basıldığında input'lar açılıyor mu?
- [ ] **Veri koruma**: Mevcut veriler input'larda görünüyor mu?
- [ ] **Kaydetme**: Değişiklikler kaydediliyor mu?
- [ ] **İptal etme**: İptal butonuyla orijinal veriler geri geliyor mu?
- [ ] **Keyboard shortcut**: Enter ile kaydet, Escape ile iptal çalışıyor mu?

```
Test Adımları:
1. Bir ürünün düzenle butonuna bas
2. Ürün adını değiştir: "TEST ÜRÜN" → "GÜNCELLENEN ÜRÜN"
3. Enter tuşuna bas
4. Değişikliğin kaydedildiğini kontrol et
5. Tekrar düzenle moduna gir ve Escape tuşuna bas
6. Değişikliklerin iptal edildiğini kontrol et
```

### 🔴 Ürün Silme
- [ ] **Onay modalı**: Sil butonuna basıldığında onay modalı açılıyor mu?
- [ ] **Ürün bilgileri**: Modal'da silinecek ürünün bilgileri görünüyor mu?
- [ ] **Silme işlemi**: Onaylandığında ürün listeden kaldırılıyor mu?
- [ ] **İptal işlemi**: İptal butonuyla modal kapanıyor ve ürün silinmiyor mu?
- [ ] **ESC tuşu**: ESC ile modal kapanıyor mu?

---

## 📊 **STOK YÖNETİMİ**

### 🔴 Stok Güncelleme
- [ ] **Direkt input**: Stok alanına direkt yazarak güncelleme çalışıyor mu?
- [ ] **Artırma butonu**: + butonu stoku 1 artırıyor mu?
- [ ] **Azaltma butonu**: - butonu stoku 1 azaltıyor mu?
- [ ] **Sıfır kontrolü**: Stok sıfır veya negatifse azaltma uyarı veriyor mu?
- [ ] **? durumu**: ? stoktan + butonuyla 1'e çıkabiliyor mu?

```
Test Senaryosu:
1. Stoku 5 olan bir ürün oluştur
2. + butonuna 3 kez bas → 8 olmalı
3. - butonuna 2 kez bas → 6 olmalı  
4. Stok alanına "0" yaz → 0 olmalı
5. - butonuna bas → Uyarı vermeli
6. Stok alanına "?" yaz → ? olmalı
7. + butonuna bas → 1 olmalı
```

---

## 🏷️ **TAG SİSTEMİ**

### 🟡 Tag Autocomplete
- [ ] **Otomatik öneriler**: Yazmaya başladığında önceki tag'ler öneriliyor mu?
- [ ] **Keyboard navigation**: Arrow tuşları ile önerilerde gezinebiliyor mu?
- [ ] **Enter seçimi**: Enter tuşu ile öneri seçilebiliyor mu?
- [ ] **Çoklu tag**: Boşlukla ayrılmış çoklu tag'ler çalışıyor mu?
- [ ] **Tag renkleri**: Tag'lerin kategorilerine göre renkleri var mı?

```
Test Adımları:
1. "ELEKTRONIK DIRENÇ" tag'i ile bir ürün ekle
2. Yeni ürün eklerken kategori alanına "ELE" yaz
3. "ELEKTRONIK" önerisi çıkmalı
4. Arrow down tuşu ile seç
5. Enter tuşuna bas
6. Boşluk ekle ve "DI" yaz
7. "DIRENÇ" önerisi çıkmalı
```

---

## 📄 **CSV İŞLEMLERİ**

### 🟡 CSV Export
- [ ] **Export butonu**: CSV export butonu çalışıyor mu?
- [ ] **Dosya formatı**: İndirilen dosya doğru formatta mı?
- [ ] **Türkçe karakterler**: CSV'de Türkçe karakterler korunuyor mu?
- [ ] **Dosya adı**: Dosya adında tarih/saat var mı?

```
Test Adımları:
1. 3-4 ürün ekle (Türkçe karakterli)
2. "CSV'ye Aktar" butonuna bas
3. İndirilen dosyayı Excel/Notepad ile aç
4. Türkçe karakterlerin düzgün göründüğünü kontrol et
5. Dosya adının tarih içerdiğini kontrol et
```

### 🟡 CSV Import
- [ ] **Drag & Drop**: CSV dosyası sürükle-bırak ile yüklenebiliyor mu?
- [ ] **File input**: File input ile yükleme çalışıyor mu?
- [ ] **Veri entegrasyonu**: "Ekle" ve "Değiştir" seçenekleri çalışıyor mu?
- [ ] **Hata durumu**: Geçersiz CSV'de uygun hata mesajı var mı?

---

## 🔔 **BİLDİRİM SİSTEMİ**

### 🟡 Notification Test
- [ ] **Başarı bildirimi**: Yeşil başarı bildirimleri görünüyor mu?
- [ ] **Hata bildirimi**: Kırmızı hata bildirimleri görünüyor mu?
- [ ] **Uyarı bildirimi**: Sarı uyarı bildirimleri görünüyor mu?
- [ ] **Otomatik kapanma**: Bildirimler otomatik olarak kapanıyor mu?
- [ ] **Manuel kapanma**: X ile manuel kapatılabiliyor mu?

```
Test Senaryosu:
1. Geçerli ürün ekle → Yeşil "başarıyla eklendi" 
2. Boş form gönder → Kırmızı hata mesajı
3. Sıfır stoktan - bas → Sarı uyarı mesajı
4. Her birinin otomatik kapandığını gözlemle
```

---

## 💾 **VERİ KALICILIĞI**

### 🔴 LocalStorage
- [ ] **Veri kaydetme**: Sayfa yenilendikten sonra veriler korunuyor mu?
- [ ] **Tarayıcı kapatma**: Tarayıcı kapatıp açıldığında veriler var mı?
- [ ] **Sekme kapatma uyarısı**: Unsaved changes varken uyarı veriyor mu?

```
Test Adımları:
1. 2-3 ürün ekle
2. Sayfayı yenile (F5)
3. Ürünlerin hala orada olduğunu kontrol et
4. Tarayıcıyı kapat ve tekrar aç
5. Ürünlerin korunduğunu kontrol et
```

---

## 📱 **RESPONSİF TASARIM**

### 🟢 Mobile Test
- [ ] **Mobile view**: Telefonda düzgün görünüyor mu?
- [ ] **Tablet view**: Tablette düzgün görünüyor mu?
- [ ] **Button boyutları**: Butonlar dokunmaya uygun boyutta mı?
- [ ] **Tablo scroll**: Tablo yatay olarak scroll edilebiliyor mu?

```
Test Cihazları:
- iPhone (375px)
- iPad (768px)  
- Desktop (1200px+)

Her cihazda:
1. Ürün ekleme formunu test et
2. Tablo görünümünü kontrol et
3. Düzenleme işlemlerini dene
```

---

## 🚀 **PERFORMANS**

### 🟢 Büyük Veri Seti
- [ ] **100+ ürün**: 100'den fazla ürünle performans nasıl?
- [ ] **Arama hızı**: Büyük listede arama hızlı mı?
- [ ] **Render hızı**: Tablo render süresi kabul edilebilir mi?
- [ ] **Memory kullanımı**: Tarayıcı yavaşlıyor mu?

```
Test Senaryosu:
1. CSV ile 200+ ürün yükle
2. Farklı aramalar yap
3. Düzenleme işlemleri dene
4. Performans sorunlarını gözlemle
```

---

## 🔒 **GÜVENLİK VE HATA YÖNETİMİ**

### 🟡 Input Validation
- [ ] **XSS koruması**: Script tag'leri girişe çalışıyor mu?
- [ ] **SQL injection**: SQL kodları zarar veriyor mu?
- [ ] **HTML injection**: HTML kodları çalışıyor mu?
- [ ] **Uzun giriş**: Çok uzun metinlerle uygulama çöküyor mu?

```
Test Girdileri:
- <script>alert('xss')</script>
- '; DROP TABLE products; --
- <img src=x onerror=alert('test')>
- 1000 karakterlik uzun metin
```

### 🟡 Error Handling
- [ ] **Network hatası**: İnternet kesilirse ne oluyor?
- [ ] **Storage dolu**: LocalStorage dolduğunda ne oluyor?
- [ ] **Corrupt data**: Bozuk veri varsa ne oluyor?
- [ ] **JavaScript hatası**: Console'da hata var mı?

---

## 🏁 **RELEASE ÖNCESİ SON KONTROL**

### 🔴 Final Checklist
- [ ] **Console temiz**: Console'da hata/uyarı yok
- [ ] **Tüm özellikler**: Tüm ana özellikler çalışıyor
- [ ] **Browser uyumluluk**: Chrome, Firefox, Safari test edildi
- [ ] **Mobile uyumluluk**: En az 2 mobile cihazda test edildi
- [ ] **Performance**: Normal kullanımda yavaşlık yok
- [ ] **Data integrity**: Veri kaybı sorunu yok

---

## 🎯 **TEST NOTLARI**

### Testten Sonra Kaydet:
```
Test Tarihi: ___________
Test Eden: _____________
Bulunan Hatalar:
1. _________________
2. _________________
3. _________________

Performans Notları:
- Yavaş olan işlemler: __________
- Memory kullanımı: ____________

Genel Değerlendirme:
□ Mükemmel  □ İyi  □ Orta  □ Zayıf

Ek Notlar:
________________________
________________________
```

---

**💡 İpucu**: Bu checklist'i yazdırıp her test sonrası işaretleyebilirsiniz! 